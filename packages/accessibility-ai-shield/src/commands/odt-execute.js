const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ensureDir, writeFile, readJson } = require('../utils/fs');
const { runOdt } = require('./odt');
const { getWorkspaceRoot, getTargetRepoPath, resolveWorkspacePath } = require('../utils/workspace');

const ODT_DIR = 'reports/odt';
const EXECUTE_DIR = 'reports/odt/execute';

function now() {
  return new Date().toISOString();
}

function exists(relPath, options = {}) {
  return fs.existsSync(resolveWorkspacePath(relPath, options));
}

function safeReadText(relPath, fallback = '', options = {}) {
  const abs = resolveWorkspacePath(relPath, options);
  if (!fs.existsSync(abs)) return fallback;
  return fs.readFileSync(abs, 'utf8');
}

function safeReadJson(relPath, fallback = null, options = {}) {
  const abs = resolveWorkspacePath(relPath, options);
  if (!fs.existsSync(abs)) return fallback;
  return readJson(abs);
}

function run(command, execOptions = {}) {
  return execSync(command, {
    cwd: execOptions.cwd || process.cwd(),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  }).trim();
}

function quote(value) {
  return `"${`${value}`.replace(/(["\\$`])/g, '\\$1')}"`;
}

function listDirtyFiles(options = {}) {
  try {
    const output = run('git status --porcelain', { cwd: getTargetRepoPath(options) });
    if (!output) return [];
    return output
      .split('\n')
      .map((line) => line.replace(/\r$/, ''))
      .filter(Boolean)
      .map((line) => {
        // porcelain format: XY<space>PATH
        const rawPath = line.length >= 4 ? line.slice(3) : '';
        const renamed = rawPath.includes(' -> ') ? rawPath.split(' -> ').pop() : rawPath;
        return `${renamed || ''}`.trim();
      })
      .filter(Boolean)
      .map((file) => file.replace(/^"|"$/g, ''));
  } catch (error) {
    return [];
  }
}

function extractDiff(content) {
  if (!content || !content.trim()) {
    throw new Error('Patch content is empty. Provide --patch-file or --response-file with a unified diff.');
  }

  const fenced = content.match(/```(?:diff|patch)\s*([\s\S]*?)```/i);
  if (fenced && fenced[1] && fenced[1].trim()) {
    return fenced[1].trim() + '\n';
  }

  const directStart = content.search(/^(diff --git |\-\-\- )/m);
  if (directStart >= 0) {
    return content.slice(directStart).trim() + '\n';
  }

  if (content.includes('*** Begin Patch')) {
    throw new Error('apply_patch format was detected. Please provide a unified diff or git diff in the response file.');
  }

  throw new Error('No unified diff was found. Include a ```diff fenced block or raw git diff in the response file.');
}

function parsePatchTargets(diffText) {
  const files = [];
  const regex = /^\+\+\+ b\/(.+)$/gm;
  let match = regex.exec(diffText);
  while (match) {
    if (match[1] !== '/dev/null') files.push(match[1]);
    match = regex.exec(diffText);
  }

  if (files.length) {
    return [...new Set(files)];
  }

  const fallback = [];
  const directRegex = /^diff --git a\/(.+?) b\/(.+)$/gm;
  let directMatch = directRegex.exec(diffText);
  while (directMatch) {
    fallback.push(directMatch[2]);
    directMatch = directRegex.exec(diffText);
  }
  return [...new Set(fallback)];
}

function buildExecutionPrompt(bundle) {
  const candidateFiles = ((bundle.devTwin && bundle.devTwin.impact && bundle.devTwin.impact.inference && bundle.devTwin.impact.inference.candidateFiles) || []);
  const hotspots = ((bundle.devTwin && bundle.devTwin.impact && bundle.devTwin.impact.hotspots) || []);
  const designInputs = (bundle.intake && bundle.intake.designInputs) || {};
  const mockupImages = Array.isArray(designInputs.mockupImages) ? designInputs.mockupImages : [];
  const referenceDocs = Array.isArray(designInputs.referenceDocs) ? designInputs.referenceDocs : [];

  return [
    '# ODT Execute Prompt',
    '',
    'Use this prompt with Codex/Cline to produce a unified diff for the current work item.',
    '',
    '## Objective',
    `Implement: ${bundle.intake.title || bundle.intake.featureName || 'Untitled work item'}`,
    `Target repo path: ${bundle.targetRepoPath}`,
    '',
    '## Rules',
    '- Return a unified diff inside a ```diff fenced block.',
    '- Keep edits scoped to impacted files only.',
    '- Follow existing repo patterns and avoid new dependencies unless explicitly approved.',
    '- Update tests for changed behavior.',
    '- Preserve VPAT/WCAG and keyboard accessibility expectations.',
    '',
    '## Intake Summary',
    `- Work item type: ${bundle.intake.workItemType || 'feature'}`,
    `- Summary: ${bundle.intake.summary || 'n/a'}`,
    `- Jira: ${(bundle.intake.jira && bundle.intake.jira.ticketId) || 'not supplied'}`,
    '',
    '## Candidate Files',
    ...(candidateFiles.length ? candidateFiles.map((file) => `- ${file}`) : ['- No candidate files available']),
    '',
    '## Hotspots',
    ...(hotspots.length ? hotspots.map((item) => `- ${item.modulePath} (${item.blastRadius})`) : ['- No hotspots available']),
    '',
    '## Design Inputs (uploaded via ODT Workspace)',
    ...(mockupImages.length ? mockupImages.map((file) => `- Image: ${file}`) : ['- No mockup images provided']),
    ...(referenceDocs.length ? referenceDocs.map((file) => `- Reference doc: ${file}`) : ['- No reference docs provided']),
    '- If files are present, review them before writing changes.',
    '',
    '## Embedded Workpacks',
    '',
    '### Tech Design',
    '```md',
    bundle.techDesignMarkdown.trim() || 'No tech design found.',
    '```',
    '',
    '### Code Workpack',
    '```md',
    bundle.codeWorkpack.trim() || 'No code workpack found.',
    '```',
    '',
    '### Unit Test Workpack',
    '```md',
    bundle.testWorkpack.trim() || 'No unit-test workpack found.',
    '```',
    '',
    '### Accessibility Summary',
    '```json',
    JSON.stringify(bundle.a11ySummary || {}, null, 2),
    '```',
    ''
  ].join('\n');
}

async function buildExecutionBundle(options = {}) {
  if (options.refresh || !exists(`${ODT_DIR}/run-summary.json`, options)) {
    await runOdt(options);
  }

  const intake = safeReadJson('reports/dev-twin/intake.json', {}, options);
  const targetRepoPath = getTargetRepoPath({ ...options, targetRepoPath: intake.targetRepoPath });

  const bundle = {
    generatedAt: now(),
    workspaceRoot: getWorkspaceRoot(options),
    targetRepoPath,
    intake,
    odt: safeReadJson(`${ODT_DIR}/run-summary.json`, {}, options),
    devTwin: safeReadJson('reports/dev-twin/summary.json', {}, options),
    a11ySummary: safeReadJson('reports/a11y-twin/insights.json', {}, options),
    techDesignMarkdown: safeReadText(`${ODT_DIR}/tech-design.md`, '', options),
    codeWorkpack: safeReadText('reports/dev-twin/code-workpack.md', '', options),
    testWorkpack: safeReadText('reports/dev-twin/unit-test-workpack.md', '', options)
  };

  ensureDir(resolveWorkspacePath(EXECUTE_DIR, options));
  writeFile(resolveWorkspacePath(`${EXECUTE_DIR}/bundle.json`, options), `${JSON.stringify(bundle, null, 2)}\n`);
  writeFile(resolveWorkspacePath(`${EXECUTE_DIR}/prompt.md`, options), `${buildExecutionPrompt(bundle)}\n`);
  writeFile(
    resolveWorkspacePath(`${EXECUTE_DIR}/response-template.md`, options),
    [
      '# ODT Execute Response Template',
      '',
      'Paste the Codex/Cline diff response below.',
      '',
      '```diff',
      'diff --git a/path/to/file.js b/path/to/file.js',
      '--- a/path/to/file.js',
      '+++ b/path/to/file.js',
      '@@',
      '-old line',
      '+new line',
      '```',
      ''
    ].join('\n')
  );

  return bundle;
}

function ensureCleanTargets(targets, options = {}) {
  if (options['allow-dirty-targets']) return;

  const dirty = new Set(listDirtyFiles(options));
  const conflicts = targets.filter((file) => dirty.has(file));
  if (conflicts.length) {
    throw new Error(
      `Refusing to apply patch because target files already have local changes: ${conflicts.join(', ')}. ` +
      'Re-run with --allow-dirty-targets only if you have reviewed the overlap.'
    );
  }
}

function runVerification(targets, options = {}) {
  const steps = [];
  if (!options.verify) {
    return steps;
  }

  const targetRepoPath = getTargetRepoPath(options);
  const workspaceRoot = getWorkspaceRoot(options);
  const commands = [
    { name: 'test', command: 'npm test -- --watch=false --runInBand' },
    ...(targetRepoPath === workspaceRoot ? [{ name: 'a11y-verify', command: 'npm run a11y:twin:verify' }] : [])
  ];

  commands.forEach((item) => {
    try {
      const output = run(item.command, { cwd: targetRepoPath });
      steps.push({ name: item.name, status: 'passed', output });
    } catch (error) {
      steps.push({
        name: item.name,
        status: 'failed',
        output: error.stdout || error.message || 'Command failed'
      });
    }
  });

  return steps;
}

function checkPatchState(patchFile, options = {}) {
  const cwd = getTargetRepoPath(options);
  try {
    run(`git apply --check ${quote(patchFile)}`, { cwd });
    return { state: 'can_apply' };
  } catch (applyError) {
    try {
      run(`git apply --reverse --check ${quote(patchFile)}`, { cwd });
      return {
        state: 'already_applied',
        errorOutput: applyError.stdout || applyError.stderr || applyError.message || 'Patch is already present.'
      };
    } catch (reverseError) {
      return {
        state: 'cannot_apply',
        errorOutput: applyError.stdout || applyError.stderr || applyError.message || 'Patch check failed.',
        reverseErrorOutput: reverseError.stdout || reverseError.stderr || reverseError.message || ''
      };
    }
  }
}

function applyReviewedPatch(options = {}) {
  const sourcePath = options['patch-file'] || options['response-file'];
  if (!sourcePath) {
    const summary = {
      generatedAt: now(),
      status: 'awaiting_agent_patch',
      note: `Bundle created at ${EXECUTE_DIR}. Produce a unified diff via ${EXECUTE_DIR}/prompt.md and re-run with --response-file or --patch-file.`
    };
    writeFile(resolveWorkspacePath(`${EXECUTE_DIR}/apply-summary.json`, options), `${JSON.stringify(summary, null, 2)}\n`);
    writeFile(
      resolveWorkspacePath(`${EXECUTE_DIR}/apply-summary.md`, options),
      `# ODT Execute Summary\n\n- Status: awaiting_agent_patch\n- Next step: generate a unified diff from ${EXECUTE_DIR}/prompt.md and re-run with --response-file.\n`
    );
    return summary;
  }

  const abs = path.isAbsolute(sourcePath) ? sourcePath : resolveWorkspacePath(sourcePath, options);
  if (!fs.existsSync(abs)) {
    throw new Error(`Patch source not found: ${sourcePath}`);
  }

  const raw = fs.readFileSync(abs, 'utf8');
  const diffText = extractDiff(raw);
  const targets = parsePatchTargets(diffText);

  if (!targets.length) {
    throw new Error('No patch targets were found in the diff. Please provide a standard unified diff.');
  }

  const patchOut = resolveWorkspacePath(`${EXECUTE_DIR}/applied.patch`, options);
  writeFile(patchOut, diffText);
  const patchState = checkPatchState(patchOut, options);

  if (options['dry-run']) {
    if (patchState.state === 'cannot_apply') {
      throw new Error(
        `Patch validation failed before apply. ${patchState.errorOutput}${patchState.reverseErrorOutput ? `\nReverse-check output: ${patchState.reverseErrorOutput}` : ''}`
      );
    }

    const summary = {
      generatedAt: now(),
      status: patchState.state === 'already_applied' ? 'dry_run_already_applied' : 'dry_run_passed',
      targets,
      patchFile: `${EXECUTE_DIR}/applied.patch`,
      verify: [],
      note: patchState.state === 'already_applied'
        ? 'Patch content is already present in the repo. No additional apply is required.'
        : 'Patch can be applied cleanly.'
    };
    writeFile(resolveWorkspacePath(`${EXECUTE_DIR}/apply-summary.json`, options), `${JSON.stringify(summary, null, 2)}\n`);
    writeFile(
      resolveWorkspacePath(`${EXECUTE_DIR}/apply-summary.md`, options),
      `# ODT Execute Summary\n\n- Status: ${summary.status}\n- Targets: ${targets.join(', ')}\n- Patch: ${EXECUTE_DIR}/applied.patch\n- Note: ${summary.note}\n`
    );
    return summary;
  }

  if (patchState.state === 'cannot_apply') {
    // If this is an overlap with local edits, provide a clearer conflict message first.
    ensureCleanTargets(targets, options);
    throw new Error(
      `Patch apply check failed. ${patchState.errorOutput}${patchState.reverseErrorOutput ? `\nReverse-check output: ${patchState.reverseErrorOutput}` : ''}`
    );
  }

  if (patchState.state === 'can_apply') {
    ensureCleanTargets(targets, options);
    run(`git apply --whitespace=nowarn ${quote(patchOut)}`, { cwd: getTargetRepoPath(options) });
  }
  const verify = runVerification(targets, options);
  const summary = {
    generatedAt: now(),
    status: patchState.state === 'already_applied'
      ? (verify.some((item) => item.status === 'failed') ? 'already_applied_with_verify_failures' : 'already_applied')
      : (verify.some((item) => item.status === 'failed') ? 'applied_with_verify_failures' : 'applied'),
    targets,
    patchFile: `${EXECUTE_DIR}/applied.patch`,
    verify,
    note: patchState.state === 'already_applied'
      ? 'Patch content was already present in the repo before apply. Skipped git apply and ran verification.'
      : 'Patch applied successfully.'
  };

  writeFile(resolveWorkspacePath(`${EXECUTE_DIR}/apply-summary.json`, options), `${JSON.stringify(summary, null, 2)}\n`);
  writeFile(
    resolveWorkspacePath(`${EXECUTE_DIR}/apply-summary.md`, options),
    [
      '# ODT Execute Summary',
      '',
      `- Status: ${summary.status}`,
      `- Targets: ${targets.join(', ')}`,
      `- Patch: ${EXECUTE_DIR}/applied.patch`,
      `- Note: ${summary.note}`,
      '',
      '## Verification',
      ...(verify.length
        ? verify.map((item) => `- ${item.name}: ${item.status}`)
        : ['- Verification not requested']),
      ''
    ].join('\n')
  );

  return summary;
}

async function runOdtExecute(options = {}) {
  const bundle = await buildExecutionBundle(options);
  const apply = applyReviewedPatch(options);
  const status = {
    generatedAt: now(),
    workspaceRoot: getWorkspaceRoot(options),
    targetRepoPath: getTargetRepoPath(options),
    bundle: `${EXECUTE_DIR}/bundle.json`,
    prompt: `${EXECUTE_DIR}/prompt.md`,
    responseTemplate: `${EXECUTE_DIR}/response-template.md`,
    apply
  };

  writeFile(resolveWorkspacePath(`${EXECUTE_DIR}/status.json`, options), `${JSON.stringify(status, null, 2)}\n`);

  // eslint-disable-next-line no-console
  console.log(
    `ODT execute ${apply.status}. prompt=${EXECUTE_DIR}/prompt.md summary=${EXECUTE_DIR}/apply-summary.json`
  );

  return { bundle, apply, status };
}

module.exports = {
  buildExecutionBundle,
  runOdtExecute
};
