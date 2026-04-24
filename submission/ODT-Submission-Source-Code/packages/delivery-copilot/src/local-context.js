const fs = require('fs');
const http = require('http');
const path = require('path');
const { execFile, execFileSync } = require('child_process');
const { promisify } = require('util');
const { defaultIntake } = require('../../accessibility-ai-shield/src/dev-twin/templates');
const { runOdt } = require('../../accessibility-ai-shield/src/commands/odt');
const { runOdtExecute } = require('../../accessibility-ai-shield/src/commands/odt-execute');
const {
  getWorkspaceRoot,
  getTargetRepoPath,
  resolveWorkspacePath
} = require('../../accessibility-ai-shield/src/utils/workspace');
const {
  launchExternalAgent,
  getAgentLaunchStatus,
  resetAgentLaunchState
} = require('./agent-launcher');
const execFileAsync = promisify(execFile);
const UPLOAD_DIR = 'reports/odt/uploads';
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);
const PROMPT_OVERRIDE_KEYS = ['intake', 'impact', 'design', 'code', 'unitTests', 'compliance', 'verify'];

function resolvePath(relPath, options = {}) {
  return resolveWorkspacePath(relPath, options);
}

function exists(relPath, options = {}) {
  return fs.existsSync(resolvePath(relPath, options));
}

function readJson(relPath, fallback, options = {}) {
  try {
    return JSON.parse(fs.readFileSync(resolvePath(relPath, options), 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function readText(relPath, fallback, options = {}) {
  try {
    return fs.readFileSync(resolvePath(relPath, options), 'utf8');
  } catch (error) {
    return fallback;
  }
}

function writeJson(relPath, payload, options = {}) {
  const abs = resolvePath(relPath, options);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function uniqStrings(values = []) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))];
}

function normalizePromptOverrides(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return PROMPT_OVERRIDE_KEYS.reduce((acc, key) => {
    acc[key] = typeof source[key] === 'string' ? source[key] : '';
    return acc;
  }, {});
}

function sanitizeFileName(name = '') {
  const cleaned = String(name || 'file')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'file';
}

function fileExtension(name = '') {
  return path.extname(String(name || '')).toLowerCase();
}

function isImageAsset(name = '', mimeType = '') {
  const ext = fileExtension(name);
  const mime = String(mimeType || '').toLowerCase();
  return IMAGE_EXTENSIONS.has(ext) || mime.startsWith('image/');
}

function normalizeStoredFilePath(filePath = '') {
  return String(filePath || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
}

function isManagedUploadPath(filePath = '', options = {}) {
  const normalizedPath = normalizeStoredFilePath(filePath);
  if (!normalizedPath || !normalizedPath.startsWith(`${UPLOAD_DIR}/`)) {
    return false;
  }

  const uploadRoot = resolvePath(UPLOAD_DIR, options);
  const absPath = resolvePath(normalizedPath, options);
  const relative = path.relative(uploadRoot, absPath);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function deleteManagedUpload(filePath = '', options = {}) {
  if (!isManagedUploadPath(filePath, options)) {
    return false;
  }

  try {
    fs.rmSync(resolvePath(normalizeStoredFilePath(filePath), options), { force: true });
    return true;
  } catch (error) {
    return false;
  }
}

function clearManagedUploads(options = {}) {
  try {
    fs.rmSync(resolvePath(UPLOAD_DIR, options), { recursive: true, force: true });
  } catch (error) {
    // Ignore explicit demo cleanup failures.
  }
}

function pruneUploadDirectory(options = {}) {
  const uploadRoot = resolvePath(UPLOAD_DIR, options);
  try {
    if (fs.existsSync(uploadRoot) && !fs.readdirSync(uploadRoot).length) {
      fs.rmSync(uploadRoot, { recursive: true, force: true });
    }
  } catch (error) {
    // Ignore best-effort cleanup failures.
  }
}

function saveDesignInputs(payload = {}, options = {}) {
  const files = Array.isArray(payload.files) ? payload.files : [];
  if (!files.length) {
    return { saved: [] };
  }

  const uploadRoot = resolvePath(UPLOAD_DIR, options);
  fs.mkdirSync(uploadRoot, { recursive: true });

  const saved = files.map((file, index) => {
    const originalName = sanitizeFileName(file.name || `attachment-${index + 1}`);
    const stamp = `${Date.now()}-${index + 1}`;
    const storedName = `${stamp}-${originalName}`;
    const relPath = `${UPLOAD_DIR}/${storedName}`;
    const absPath = resolvePath(relPath, options);
    const buffer = Buffer.from(String(file.dataBase64 || ''), 'base64');
    fs.writeFileSync(absPath, buffer);

    return {
      originalName,
      storedName,
      path: relPath,
      mimeType: file.type || 'application/octet-stream',
      size: buffer.length,
      kind: isImageAsset(originalName, file.type) ? 'image' : 'document'
    };
  });

  return { saved };
}

function removeDesignInput(filePath = '', options = {}) {
  const normalizedPath = normalizeStoredFilePath(filePath);
  const current = readJson('reports/dev-twin/intake.json', defaultIntake(), options);
  const designInputs = current.designInputs || {};
  const currentImages = uniqStrings((designInputs.mockupImages || []).map(normalizeStoredFilePath));
  const currentDocs = uniqStrings((designInputs.referenceDocs || []).map(normalizeStoredFilePath));
  const nextImages = currentImages.filter((item) => item !== normalizedPath);
  const nextDocs = currentDocs.filter((item) => item !== normalizedPath);
  const removed = nextImages.length !== currentImages.length || nextDocs.length !== currentDocs.length;

  if (removed && isManagedUploadPath(normalizedPath, options)) {
    deleteManagedUpload(normalizedPath, options);
    pruneUploadDirectory(options);
  }

  const intake = updateIntake({
    mockupImages: nextImages,
    referenceDocs: nextDocs
  }, options);

  return {
    removed,
    intake
  };
}

function clearDesignInputs(options = {}) {
  clearManagedUploads(options);
  const intake = updateIntake({
    mockupImages: [],
    referenceDocs: []
  }, options);

  return {
    cleared: true,
    intake
  };
}

function detectRepoIntent(payload = {}) {
  const workItemType = String(payload.workItemType || '').toLowerCase();
  const summary = `${payload.ticket || payload.summary || payload.title || ''}`.toLowerCase();
  const scaffoldSignals = ['scaffold', 'bootstrap', 'new app', 'create react project', 'create project', 'greenfield'];
  const scaffoldFromText = scaffoldSignals.some((signal) => summary.includes(signal));

  if (workItemType === 'scaffold' || workItemType === 'new-app' || scaffoldFromText) {
    return 'scaffold';
  }
  return 'existing';
}

function detectGitRepo(targetRepoPath) {
  if (!targetRepoPath) return false;

  try {
    const stdout = execFileSync('git', ['-C', targetRepoPath, 'rev-parse', '--is-inside-work-tree'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return String(stdout || '').trim() === 'true';
  } catch (error) {
    return fs.existsSync(path.join(targetRepoPath, '.git'));
  }
}

function inspectRepoPath(targetRepoPath, payload = {}) {
  const intent = detectRepoIntent(payload);
  const result = {
    checkedAt: new Date().toISOString(),
    path: targetRepoPath || '',
    exists: false,
    isDirectory: false,
    entryCount: 0,
    isEmpty: false,
    isGitRepo: false,
    intent,
    status: 'missing_path',
    tone: 'warn',
    detail: 'Provide a target repository path to continue.',
    recommendation: '',
    canInitializeGit: false,
    shouldWarn: true
  };

  if (!targetRepoPath) {
    result.recommendation = intent === 'scaffold'
      ? 'Select an empty folder for scaffolding a new app, or choose an existing repo if you want to extend a codebase.'
      : 'Select an existing local repository. Feature and defect work are safest in a Git-backed repo.';
    return result;
  }

  let stats;
  try {
    stats = fs.statSync(targetRepoPath);
  } catch (error) {
    result.detail = 'The selected path does not exist on disk.';
    result.recommendation = 'Choose an existing local folder, or create one first if you are scaffolding a new project.';
    return result;
  }

  result.exists = true;
  result.isDirectory = stats.isDirectory();
  if (!result.isDirectory) {
    result.status = 'not_directory';
    result.tone = 'bad';
    result.detail = 'The selected path is not a folder.';
    result.recommendation = 'Choose a directory instead of a file path.';
    return result;
  }

  let entries = [];
  try {
    entries = fs.readdirSync(targetRepoPath);
  } catch (error) {
    result.status = 'unreadable';
    result.tone = 'bad';
    result.detail = 'The selected folder could not be read.';
    result.recommendation = 'Check folder permissions and try again.';
    return result;
  }

  result.entryCount = entries.length;
  result.isEmpty = entries.length === 0;
  result.isGitRepo = detectGitRepo(targetRepoPath);
  result.canInitializeGit = result.exists && result.isDirectory && !result.isGitRepo;

  if (result.isGitRepo) {
    result.status = 'git_repo';
    result.tone = 'good';
    result.detail = 'Git repository detected. This is the safest mode for feature, defect, and review workflows.';
    result.recommendation = 'You can proceed with repo-aware analysis and delegated agent execution.';
    result.shouldWarn = false;
    return result;
  }

  if (result.isEmpty) {
    result.status = 'empty_folder';
    result.tone = intent === 'scaffold' ? 'good' : 'warn';
    result.detail = intent === 'scaffold'
      ? 'Empty folder detected. This is valid for scaffolding a new app or starting a fresh project.'
      : 'Empty folder detected. This is fine for scaffolding, but feature or defect work usually expects an existing codebase.';
    result.recommendation = intent === 'scaffold'
      ? 'You can continue, and optionally initialize Git before or after the agent generates files.'
      : 'If you intended to change an existing codebase, choose a Git repo instead. Otherwise treat this as a scaffold flow.';
    result.shouldWarn = intent !== 'scaffold';
    return result;
  }

  result.status = 'existing_non_git';
  result.tone = 'warn';
  result.detail = 'Existing folder detected, but it is not a Git repo.';
  result.recommendation = intent === 'scaffold'
    ? 'This can still work for scaffolding, but initializing Git is recommended before you start delegating changes.'
    : 'For feature and defect work, Git is strongly recommended so diffs and human review stay safe and traceable.';
  result.shouldWarn = true;
  return result;
}

function buildLocalContext(options = {}) {
  const odtSummary = readJson('reports/odt/run-summary.json', null, options);
  const devTwinSummary = readJson('reports/dev-twin/summary.json', null, options);
  const a11yInsights = readJson('reports/a11y-twin/insights.json', null, options);
  const intake = readJson('reports/dev-twin/intake.json', null, options);
  const targetRepoPath = getTargetRepoPath({ ...options, targetRepoPath: intake && intake.targetRepoPath });
  const repoStatus = inspectRepoPath(targetRepoPath, intake || {});

  return {
    generatedAt: new Date().toISOString(),
    source: 'local-context-server',
    workspaceRoot: getWorkspaceRoot(options),
    targetRepoPath,
    repoStatus,
    available: {
      odt: Boolean(odtSummary),
      devTwin: Boolean(devTwinSummary),
      a11yTwin: Boolean(a11yInsights),
      intake: Boolean(intake)
    },
    intake,
    odt: odtSummary,
    promptProviderStatus: readJson('reports/odt/prompts/provider-status.json', null, options),
    devTwin: devTwinSummary,
    a11yTwin: a11yInsights,
    execute: {
      status: readJson('reports/odt/execute/status.json', null, options),
      applySummary: readJson('reports/odt/execute/apply-summary.json', null, options),
      agentLaunch: getAgentLaunchStatus(options),
      prompt: readText('reports/odt/execute/prompt.md', '', options),
      responseTemplate: readText('reports/odt/execute/response-template.md', '', options)
    },
    workpacks: {
      code: readText('reports/dev-twin/code-workpack.md', '', options),
      tests: readText('reports/dev-twin/unit-test-workpack.md', '', options),
      techDesign: readText('reports/odt/tech-design.md', '', options),
      executionGuide: readText('reports/odt/execution-guide.md', '', options),
      a11yPrompt: readText('reports/a11y/coding-agent-prompt.md', '', options)
    }
  };
}

function writeSnapshot(outputPath, options = {}) {
  const output = outputPath || 'reports/mcp/local-context.json';
  const payload = buildLocalContext(options);
  const abs = resolvePath(output, options);

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return {
    output,
    payload
  };
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function deriveTitle(text) {
  const firstLine = `${text || ''}`.split('\n').map((line) => line.trim()).find(Boolean) || 'Untitled work item';
  return firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine;
}

async function chooseRepoFolder(payload = {}) {
  if (process.platform !== 'darwin') {
    return {
      status: 'unsupported',
      message: 'Native repo browse helper is currently implemented for macOS only.'
    };
  }

  const prompt = payload.prompt || 'Select the target repository folder for Oracle Developer Twin';
  const currentPath = payload.currentPath && fs.existsSync(payload.currentPath) ? payload.currentPath : '';
  const lines = [
    `set dialogPrompt to ${JSON.stringify(prompt)}`,
    currentPath
      ? `set chosenFolder to choose folder with prompt dialogPrompt default location (POSIX file ${JSON.stringify(currentPath)})`
      : 'set chosenFolder to choose folder with prompt dialogPrompt',
    'POSIX path of chosenFolder'
  ];

  try {
    const result = await execFileAsync('osascript', lines.flatMap((line) => ['-e', line]), {
      encoding: 'utf8'
    });
    const pickedPath = String(result.stdout || '').trim();
    if (!pickedPath) {
      return {
        status: 'cancelled',
        message: 'No folder was selected.'
      };
    }
    return {
      status: 'ok',
      path: pickedPath
    };
  } catch (error) {
    const stderr = String(error.stderr || error.message || '').trim();
    if (stderr.includes('-128') || /user canceled/i.test(stderr)) {
      return {
        status: 'cancelled',
        message: 'Folder selection was cancelled.'
      };
    }
    throw new Error(stderr || 'Unable to open the macOS folder chooser.');
  }
}

async function initializeGitRepo(targetRepoPath) {
  if (!targetRepoPath) {
    throw new Error('Target repo path is required before initializing Git.');
  }

  const status = inspectRepoPath(targetRepoPath, {});
  if (!status.exists || !status.isDirectory) {
    throw new Error('Select an existing folder before initializing Git.');
  }
  if (status.isGitRepo) {
    return {
      status: 'already_git',
      path: targetRepoPath,
      detail: 'Git is already initialized for this folder.'
    };
  }

  await execFileAsync('git', ['init'], {
    cwd: targetRepoPath,
    encoding: 'utf8'
  });

  return {
    status: 'initialized',
    path: targetRepoPath,
    detail: 'Git repository initialized successfully.'
  };
}

function updateIntake(payload = {}, options = {}) {
  const current = readJson('reports/dev-twin/intake.json', defaultIntake(), options);
  const ticket = payload.ticket || payload.summary || current.summary;
  const targetRepoPath = getTargetRepoPath({ ...options, targetRepoPath: payload.targetRepoPath || current.targetRepoPath });
  const currentPromptOverrides = normalizePromptOverrides(current.promptOverrides);
  const payloadPromptOverrides = payload.promptOverrides && typeof payload.promptOverrides === 'object'
    ? normalizePromptOverrides(payload.promptOverrides)
    : null;
  const next = {
    ...current,
    title: payload.title || deriveTitle(ticket),
    featureName: payload.title || deriveTitle(ticket),
    summary: ticket,
    reviewEdits: typeof payload.reviewEdits === 'string'
      ? payload.reviewEdits
      : (typeof current.reviewEdits === 'string' ? current.reviewEdits : ''),
    promptOverrides: payloadPromptOverrides
      ? { ...currentPromptOverrides, ...payloadPromptOverrides }
      : currentPromptOverrides,
    targetRepoPath,
    workItemType: payload.workItemType || current.workItemType || 'feature',
    jira: {
      ...(current.jira || {}),
      ticketId: payload.ticketId || (current.jira && current.jira.ticketId) || '',
      url: payload.ticketUrl || (current.jira && current.jira.url) || ''
    },
    requirements: {
      ...(current.requirements || {}),
      acceptanceCriteria: Array.isArray(payload.acceptanceCriteria) && payload.acceptanceCriteria.length
        ? payload.acceptanceCriteria
        : current.requirements.acceptanceCriteria,
      nonFunctional: Array.isArray(payload.nonFunctional) && payload.nonFunctional.length
        ? payload.nonFunctional
        : current.requirements.nonFunctional
    },
    designInputs: {
      ...(current.designInputs || {}),
      mockupImages: Array.isArray(payload.mockupImages)
        ? uniqStrings(payload.mockupImages)
        : uniqStrings((current.designInputs && current.designInputs.mockupImages) || []),
      referenceDocs: Array.isArray(payload.referenceDocs)
        ? uniqStrings(payload.referenceDocs)
        : uniqStrings((current.designInputs && current.designInputs.referenceDocs) || [])
    }
  };

  writeJson('reports/dev-twin/intake.json', next, options);
  return next;
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload, null, 2));
}

async function handlePost(req, res, serverOptions = {}) {
  const payload = await collectBody(req);
  const runtimeOptions = {
    workspaceRoot: payload.workspaceRoot || serverOptions.workspaceRoot || process.cwd(),
    targetRepoPath: payload.targetRepoPath || serverOptions.targetRepoPath
  };

  if (req.url === '/intake') {
    const intake = updateIntake(payload, runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, { status: 'ok', intake });
    return;
  }

  if (req.url === '/repo/pick') {
    const picked = await chooseRepoFolder({
      currentPath: payload.currentPath || runtimeOptions.targetRepoPath || runtimeOptions.workspaceRoot,
      prompt: payload.prompt
    });
    json(res, 200, picked);
    return;
  }

  if (req.url === '/repo/status') {
    const targetRepoPath = payload.targetRepoPath || runtimeOptions.targetRepoPath || '';
    json(res, 200, inspectRepoPath(targetRepoPath, payload));
    return;
  }

  if (req.url === '/repo/init-git') {
    const targetRepoPath = payload.targetRepoPath || runtimeOptions.targetRepoPath || '';
    const initResult = await initializeGitRepo(targetRepoPath);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, initResult);
    return;
  }

  if (req.url === '/files/upload') {
    const uploadResult = saveDesignInputs(payload, runtimeOptions);
    const current = readJson('reports/dev-twin/intake.json', defaultIntake(), runtimeOptions);
    const currentImages = ((current.designInputs && current.designInputs.mockupImages) || []);
    const currentDocs = ((current.designInputs && current.designInputs.referenceDocs) || []);
    const nextImages = uniqStrings([
      ...currentImages,
      ...uploadResult.saved.filter((item) => item.kind === 'image').map((item) => item.path)
    ]);
    const nextDocs = uniqStrings([
      ...currentDocs,
      ...uploadResult.saved.filter((item) => item.kind !== 'image').map((item) => item.path)
    ]);
    const intake = updateIntake({
      ...payload,
      mockupImages: nextImages,
      referenceDocs: nextDocs
    }, runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      saved: uploadResult.saved,
      intake
    });
    return;
  }

  if (req.url === '/files/remove') {
    const result = removeDesignInput(payload.filePath || payload.path || '', runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      removed: result.removed,
      intake: result.intake
    });
    return;
  }

  if (req.url === '/files/clear') {
    const result = clearDesignInputs(runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      cleared: result.cleared,
      intake: result.intake
    });
    return;
  }

  if (req.url === '/odt/run') {
    const intake = updateIntake(payload, runtimeOptions);
    resetAgentLaunchState({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      note: 'Starting a fresh digital worker run. Previous agent response and status were cleared.'
    });
    const run = await runOdt({
      ...runtimeOptions,
      profile: payload.profile || 'react-js',
      withA11y: payload.withA11y === false ? false : true
    });
    const execute = await runOdtExecute(runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      intake,
      runSummary: run.summary,
      execute: execute.apply
    });
    return;
  }

  if (req.url === '/odt/execute') {
    resetAgentLaunchState({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      note: 'Execution bundle refreshed. Previous agent response and status were cleared.'
    });
    const result = await runOdtExecute({
      ...runtimeOptions,
      refresh: Boolean(payload.refresh),
      'response-file': payload.responseFile,
      'patch-file': payload.patchFile,
      'dry-run': Boolean(payload.dryRun),
      verify: Boolean(payload.verify),
      'allow-dirty-targets': Boolean(payload.allowDirtyTargets)
    });
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      execute: result.apply
    });
    return;
  }

  if (req.url === '/odt/agent/reset') {
    const launch = resetAgentLaunchState({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      note: payload.note || 'Delegated agent status was reset.'
    });
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      launch
    });
    return;
  }

  if (req.url === '/odt/agent/launch') {
    if (payload.refresh !== false || !exists('reports/odt/execute/prompt.md', runtimeOptions)) {
      await runOdtExecute({ ...runtimeOptions, refresh: true });
    }
    const launch = launchExternalAgent({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      mode: payload.mode || 'terminal'
    });
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, { status: 'ok', launch });
    return;
  }

  json(res, 404, { error: 'Not found', path: req.url });
}

function serveLocalContext(args) {
  const port = Number(args.port || 4310);
  const host = args.host || '127.0.0.1';
  const serverOptions = {
    workspaceRoot: args['workspace-root'] || process.cwd(),
    targetRepoPath: args['target-repo-path']
  };

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      json(res, 200, { ok: true });
      return;
    }

    try {
      const payload = buildLocalContext(serverOptions);
      const routes = {
        '/health': { ok: true, generatedAt: payload.generatedAt },
        '/context': payload,
        '/repo/status': payload.repoStatus,
        '/odt': payload.odt,
        '/odt/prompt-provider-status': payload.promptProviderStatus,
        '/dev-twin': payload.devTwin,
        '/a11y': payload.a11yTwin,
        '/intake': payload.intake,
        '/odt/execute/status': payload.execute.applySummary || payload.execute.status,
        '/odt/agent/status': payload.execute.agentLaunch
      };

      if (req.method === 'POST') {
        await handlePost(req, res, serverOptions);
        return;
      }

      if (!routes[req.url]) {
        json(res, 404, { error: 'Not found', path: req.url });
        return;
      }

      json(res, 200, routes[req.url]);
    } catch (error) {
      json(res, 500, { error: error.message || 'Unexpected server error' });
    }
  });

  server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE') {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        command: 'mcp:local serve',
        status: 'already_running',
        host,
        port,
        message: `Local context server is already running at http://${host}:${port}. Reuse the existing server or stop the stale process before restarting.`
      }, null, 2));
      return;
    }

    throw error;
  });

  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      command: 'mcp:local serve',
      status: 'listening',
      host,
      port,
      endpoints: [
        '/health',
        '/context',
        '/repo/status',
        '/odt',
        '/odt/prompt-provider-status',
        '/dev-twin',
        '/a11y',
        '/intake',
        '/odt/execute/status',
        '/odt/agent/status',
        'POST /intake',
        'POST /repo/pick',
        'POST /repo/status',
        'POST /repo/init-git',
        'POST /files/upload',
        'POST /files/remove',
        'POST /files/clear',
        'POST /odt/run',
        'POST /odt/execute',
        'POST /odt/agent/reset',
        'POST /odt/agent/launch'
      ]
    }, null, 2));
  });

  return server;
}

module.exports = {
  buildLocalContext,
  writeSnapshot,
  serveLocalContext
};
