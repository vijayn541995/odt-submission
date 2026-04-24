const path = require('path');
const fs = require('fs');
const { ensureDir, writeFile, readJson } = require('../utils/fs');
const { defaultIntake, intakeQuestionsMarkdown } = require('../dev-twin/templates');
const { estimate, buildRisks } = require('../dev-twin/estimator');
const { renderDevTwinDashboard } = require('../dev-twin/dashboard');
const { analyzeImpact } = require('../dev-twin/impact');
const { getWorkspaceRoot, getTargetRepoPath, resolveWorkspacePath } = require('../utils/workspace');

const OUTPUT_DIR = 'reports/dev-twin';
const PROMPT_OVERRIDE_KEYS = ['intake', 'impact', 'design', 'code', 'unitTests', 'compliance', 'verify'];

function normalizePromptOverrides(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return PROMPT_OVERRIDE_KEYS.reduce((acc, key) => {
    acc[key] = typeof source[key] === 'string' ? source[key] : '';
    return acc;
  }, {});
}

function resolveInput(input, options = {}) {
  if (input && path.isAbsolute(input)) return input;
  return resolveWorkspacePath(input || `${OUTPUT_DIR}/intake.json`, options);
}

function writeMarkdownSummary(model) {
  const intakeName = model.intake.title || model.intake.featureName || 'Untitled work item';
  const inference = model.impact.inference || {};
  const candidateDetails = inference.candidateDetails || [];
  const promptOverrides = normalizePromptOverrides(model.intake.promptOverrides);
  const activeOverrides = Object.entries(promptOverrides).filter(([, value]) => value && value.trim());
  const lines = [
    '# Developer Twin Summary',
    '',
    `- Generated At: ${model.generatedAt}`,
    `- Work Item: ${intakeName}`,
    `- Work Item Type: ${model.intake.workItemType}`,
    `- Repo Analysis Mode: ${inference.mode || 'unknown'}`,
    `- Candidate Modules: ${model.impact.totals.modules}`,
    `- Candidate Files: ${model.impact.totals.totalSourceFiles}`,
    `- Related Tests: ${model.impact.totals.totalTestFiles}`,
    `- Repo Blast Radius (source + tests): ${model.impact.totals.blastRadius}`,
    `- Reviewer edits supplied: ${model.intake.reviewEdits && `${model.intake.reviewEdits}`.trim() ? 'yes' : 'no'}`,
    `- Active prompt overrides: ${activeOverrides.length}`,
    '',
    '## Intake Snapshot',
    `- Jira Ticket: ${(model.intake.jira && model.intake.jira.ticketId) || 'not supplied'}`,
    `- Mockups Attached: ${((model.intake.designInputs && model.intake.designInputs.mockupImages) || []).length}`,
    `- Reference Docs: ${((model.intake.designInputs && model.intake.designInputs.referenceDocs) || []).length}`,
    `- Optional Hints Provided: ${((model.intake.developerHints && model.intake.developerHints.suspectedAreas) || []).length}`,
    '',
    '## Recommended Workflow',
    '1. Requirement intake and safety questions',
    '2. Whole-repo impact analysis with inferred candidate files',
    '3. Agent workpack generation for implementation and tests',
    '4. A11y shield scan and remediation',
    '5. Verification and release summary',
    '',
    '## Inferred Impact Areas',
    ...model.impact.hotspots.map((item) => `- ${item.modulePath} (blast radius: ${item.blastRadius})`),
    '',
    '## Candidate Files',
    ...(candidateDetails.length
      ? candidateDetails.map((item) => `- ${item.file} [score=${item.score}] exports=${(item.exportNames || []).join(', ') || 'none'} signals=${(item.reasons || []).join(', ') || 'path-ranked'}`)
      : ['- No candidate files inferred yet']),
    '',
    '## Prompt Overrides',
    ...(activeOverrides.length
      ? activeOverrides.map(([key]) => `- ${key}`)
      : ['- None']),
    '',
    '## Risks',
    ...model.risks.map((risk) => `- ${risk}`),
    ''
  ];

  return `${lines.join('\n')}\n`;
}

function buildCodeWorkpack(model) {
  const intakeName = model.intake.title || model.intake.featureName || 'Untitled work item';
  const moduleLines = model.impact.moduleImpacts.map((item) => (
    `- ${item.modulePath} (source: ${item.sourceFileCount}, tests: ${item.testFileCount})`
  ));
  const promptOverrides = normalizePromptOverrides(model.intake.promptOverrides);
  const codeOverride = promptOverrides.code && promptOverrides.code.trim() ? promptOverrides.code.trim() : '';
  const reviewEdits = model.intake.reviewEdits && `${model.intake.reviewEdits}`.trim() ? `${model.intake.reviewEdits}`.trim() : '';
  const designInputs = model.intake.designInputs || {};
  const mockupImages = Array.isArray(designInputs.mockupImages) ? designInputs.mockupImages : [];
  const referenceDocs = Array.isArray(designInputs.referenceDocs) ? designInputs.referenceDocs : [];

  const lines = [
    '# Codex Workpack: ODT Code Implementation',
    '',
    `Work Item: ${intakeName}`,
    '',
    'You are a senior frontend developer assistant.',
    'Use the intake, inferred repo impact, and compliance guidance below to implement a reviewable patch.',
    '',
    'Execution steps:',
    '1) Ask clarifying questions only for safety-critical ambiguities.',
    '2) Review existing patterns in the inferred source files before editing.',
    '3) Implement code changes with backward compatibility.',
    '4) Include keyboard accessibility and semantic HTML by default.',
    '5) Summarize edge cases and regression risk after patching.',
    '',
    'Scope summary:',
    ...moduleLines,
    '',
    'Repo-analysis evidence:',
    `- Target repo path: ${model.targetRepoPath}`,
    `- Analysis mode: ${(model.impact.inference && model.impact.inference.mode) || 'unknown'}`,
    `- Keywords: ${((model.impact.inference && model.impact.inference.keywords) || []).join(', ') || 'n/a'}`,
    ...(mockupImages.length ? mockupImages.map((file) => `- Mockup image: ${file}`) : ['- Mockup image: none supplied']),
    ...(referenceDocs.length ? referenceDocs.map((file) => `- Reference doc: ${file}`) : ['- Reference doc: none supplied']),
    ...(model.impact.inference && model.impact.inference.candidateDetails
      ? model.impact.inference.candidateDetails.slice(0, 8).map((item) => `- Candidate file: ${item.file} [score=${item.score}] exports=${(item.exportNames || []).join(', ') || 'none'} signals=${(item.reasons || []).join(', ') || 'path-ranked'}`)
      : []),
    '',
    'Reviewer refinements:',
    ...(reviewEdits ? [reviewEdits] : ['- None supplied']),
    '',
    'Prompt override (code stage):',
    ...(codeOverride ? [codeOverride] : ['- None supplied']),
    '',
    'Quality gates to run after implementation:',
    '- npm run a11y:scan:ci || true',
    '- npm run a11y:twin:verify',
    '',
    'Feature payload:',
    '```json',
    JSON.stringify(model.intake, null, 2),
    '```',
    ''
  ];

  return `${lines.join('\n')}\n`;
}

function buildUnitTestWorkpack(model) {
  const intakeName = model.intake.title || model.intake.featureName || 'Untitled work item';
  const testFiles = model.impact.moduleImpacts.flatMap((item) => item.testFiles);
  const promptOverrides = normalizePromptOverrides(model.intake.promptOverrides);
  const testsOverride = promptOverrides.unitTests && promptOverrides.unitTests.trim() ? promptOverrides.unitTests.trim() : '';
  const lines = [
    '# Codex Workpack: ODT Unit Test Generation',
    '',
    `Work Item: ${intakeName}`,
    '',
    'Generate or update Jest/RTL tests for impacted behavior.',
    'Cover:',
    '- Happy path',
    '- Error path',
    '- Empty/loading states',
    '- Keyboard accessibility interactions where applicable',
    '',
    'Known related test files:',
    ...(testFiles.length ? testFiles.map((file) => `- ${file}`) : ['- No direct tests matched; create nearest-module tests.']),
    '',
    'Prompt override (unit test stage):',
    ...(testsOverride ? [testsOverride] : ['- None supplied']),
    '',
    'Rules:',
    '- Keep tests deterministic and isolated.',
    '- Avoid snapshot-only validation for behavior-heavy flows.',
    '- Assert accessibility roles/labels when adding interactive UI.',
    '',
    'Verification command:',
    '- npm test -- --watch=false --runInBand',
    ''
  ];

  return `${lines.join('\n')}\n`;
}

function buildBestPracticesChecklist() {
  const lines = [
    '# Oracle Developer Twin Best Practices',
    '',
    'Use this checklist before merge.',
    '',
    '- Requirements are clear and reviewed for safety/ambiguity.',
    '- Implementation follows existing component and state patterns.',
    '- Unit tests cover happy, error, and edge states.',
    '- VPAT/WCAG requirements are validated via scan outputs.',
    '- Keyboard parity is present for click interactions.',
    '- No secrets or sensitive user data in prompts/workpacks.',
    '- Human reviewer approved final diff and verification evidence.',
    ''
  ];

  return `${lines.join('\n')}\n`;
}

function runDevTwinInit(options = {}) {
  const outputDir = resolveWorkspacePath(OUTPUT_DIR, options);
  const targetRepoPath = getTargetRepoPath(options);
  ensureDir(outputDir);
  const intakePath = path.join(outputDir, 'intake.json');
  const questionsPath = path.join(outputDir, 'intake-questions.md');

  if (options.force || !fs.existsSync(intakePath)) {
    writeFile(intakePath, `${JSON.stringify({ ...defaultIntake(), targetRepoPath }, null, 2)}\n`);
  } else {
    const current = readJson(intakePath);
    if (!current.targetRepoPath) {
      writeFile(intakePath, `${JSON.stringify({ ...current, targetRepoPath }, null, 2)}\n`);
    }
  }

  if (options.force || !fs.existsSync(questionsPath)) {
    writeFile(questionsPath, intakeQuestionsMarkdown());
  }

  // eslint-disable-next-line no-console
  console.log(`Dev Twin init complete. files=${OUTPUT_DIR}/intake.json, ${OUTPUT_DIR}/intake-questions.md`);
}

function runDevTwinAnalyze(options = {}) {
  const workspaceRoot = getWorkspaceRoot(options);
  const inputPath = resolveInput(options.input, options);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Intake file not found: ${inputPath}. Run "dev:twin:init" first.`);
  }

  const intake = readJson(inputPath);
  const targetRepoPath = getTargetRepoPath({ ...options, targetRepoPath: intake.targetRepoPath });
  const estimateResult = estimate(intake, options);
  const risks = buildRisks(intake, estimateResult);
  const impact = analyzeImpact(intake, { repoRoot: targetRepoPath });
  const generatedAt = new Date().toISOString();

  const model = {
    generatedAt,
    intake,
    workspaceRoot,
    targetRepoPath,
    estimate: estimateResult,
    impact,
    risks
  };

  const outputDir = resolveWorkspacePath(OUTPUT_DIR, options);
  ensureDir(outputDir);
  writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(model, null, 2)}\n`);
  writeFile(path.join(outputDir, 'summary.md'), writeMarkdownSummary(model));
  writeFile(path.join(outputDir, 'code-workpack.md'), buildCodeWorkpack(model));
  writeFile(path.join(outputDir, 'unit-test-workpack.md'), buildUnitTestWorkpack(model));
  writeFile(path.join(outputDir, 'best-practices.md'), buildBestPracticesChecklist());
  // Backward-compatible alias
  writeFile(path.join(outputDir, 'codex-workpack.md'), buildCodeWorkpack(model));
  writeFile(path.join(outputDir, 'impact-analysis.json'), `${JSON.stringify(impact, null, 2)}\n`);
  writeFile(path.join(outputDir, 'index.html'), renderDevTwinDashboard(model));

  // eslint-disable-next-line no-console
  console.log(
    `Dev Twin analyze complete. mode=${model.impact.inference.mode} blastRadius=${model.impact.totals.blastRadius} targetRepo=${model.targetRepoPath} dashboard=${OUTPUT_DIR}/index.html`
  );

  return model;
}

function runDevTwinDemo() {
  runDevTwinInit();
  return runDevTwinAnalyze();
}

module.exports = {
  runDevTwinInit,
  runDevTwinAnalyze,
  runDevTwinDemo
};
