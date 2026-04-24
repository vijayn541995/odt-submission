const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const {
  getWorkspaceRoot,
  getTargetRepoPath,
  resolveWorkspacePath
} = require('../../accessibility-ai-shield/src/utils/workspace');

const EXECUTE_DIR = 'reports/odt/execute';
const STATUS_FILE = 'reports/odt/execute/agent-launch.json';
const LOG_FILE = 'reports/odt/execute/agent-launch.log';
const RESPONSE_FILE = 'reports/odt/execute/agent-response.md';
const SCRIPT_FILE = 'reports/odt/execute/launch-agent.sh';

function resolvePath(relPath, options = {}) {
  return resolveWorkspacePath(relPath, options);
}

function writeJson(relPath, value, options = {}) {
  const abs = resolvePath(relPath, options);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson(relPath, fallback = null, options = {}) {
  try {
    return JSON.parse(fs.readFileSync(resolvePath(relPath, options), 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function readText(relPath, fallback = '', options = {}) {
  try {
    return fs.readFileSync(resolvePath(relPath, options), 'utf8');
  } catch (error) {
    return fallback;
  }
}

function removeFileIfExists(absPath) {
  try {
    fs.rmSync(absPath, { force: true });
  } catch (error) {
    // Ignore cleanup failures for demo state resets.
  }
}

function tailLines(text, limit = 20) {
  if (!text) return '';
  return text
    .split('\n')
    .slice(-limit)
    .join('\n')
    .trim();
}

function readLastExitCodeFromLog(logText) {
  if (!logText) return null;
  const matcher = /\[odt\]\s+Agent task finished with exit code\s+(-?\d+)/g;
  let match = null;
  let code = null;
  while ((match = matcher.exec(logText)) !== null) {
    code = Number(match[1]);
  }
  return Number.isFinite(code) ? code : null;
}

function deriveLaunchState(rawStatus, logText) {
  const status = rawStatus || 'idle';
  const exitCode = readLastExitCodeFromLog(logText);

  if (exitCode !== null) {
    return {
      status: exitCode === 0 ? 'completed' : 'failed',
      completionStatus: exitCode === 0 ? 'completed' : 'failed',
      completionDetail: `Agent task finished in terminal with exit code ${exitCode}.`,
      exitCode,
      inferredFromLog: true
    };
  }

  if (status === 'delegated_visible' || status === 'starting' || status === 'running') {
    return {
      status: 'running',
      completionStatus: 'running',
      completionDetail: 'Agent task is running in terminal. Monitor live progress in the log panel.',
      inferredFromLog: status === 'delegated_visible'
    };
  }

  if (status === 'completed') {
    return {
      status: 'completed',
      completionStatus: 'completed',
      completionDetail: 'Agent task completed.',
      exitCode: 0,
      inferredFromLog: false
    };
  }

  if (status === 'failed' || status === 'failed_to_start' || status === 'failed_to_open') {
    return {
      status: 'failed',
      completionStatus: 'failed',
      completionDetail: 'Agent task failed.',
      inferredFromLog: false
    };
  }

  return {
    status,
    completionStatus: status === 'idle' ? 'idle' : 'unknown',
    completionDetail: status === 'idle'
      ? 'No delegated agent run has started yet.'
      : `Agent launch status: ${status}.`,
    inferredFromLog: false
  };
}

function shellQuote(value) {
  return `'${String(value || '').replace(/'/g, `'\\''`)}'`;
}

function parseMajor(versionText) {
  const match = String(versionText || '').match(/v?(\d+)/);
  return match ? Number(match[1]) : 0;
}

function isGitRepo(repoPath) {
  if (!repoPath) return false;
  return fs.existsSync(path.join(repoPath, '.git'));
}

function getNvmRoot() {
  return process.env.NVM_DIR || path.join(os.homedir(), '.nvm');
}

function getInstalledNodeVersions() {
  const versionsDir = path.join(getNvmRoot(), 'versions', 'node');
  try {
    return fs.readdirSync(versionsDir)
      .filter((item) => item.startsWith('v'))
      .map((item) => ({
        name: item,
        major: parseMajor(item),
        nodeBin: path.join(versionsDir, item, 'bin', 'node'),
        clineBin: path.join(versionsDir, item, 'bin', 'cline')
      }));
  } catch (error) {
    return [];
  }
}

function getClineEnvironment() {
  const currentNode = process.version;
  const currentMajor = parseMajor(currentNode);
  const available = getInstalledNodeVersions();
  const compatible = available
    .filter((item) => item.major >= 20 && fs.existsSync(item.clineBin))
    .sort((a, b) => b.major - a.major)[0] || null;

  return {
    currentNode,
    currentMajor,
    compatible,
    availableMajors: available.map((item) => item.name)
  };
}

function getClineLaunchError() {
  const envInfo = getClineEnvironment();
  if (envInfo.compatible) return null;
  return [
    `Cline requires Node.js 20+ but no compatible Cline install was found.`,
    `Current Node.js version: ${envInfo.currentNode}.`,
    envInfo.availableMajors.length ? `Installed Node versions: ${envInfo.availableMajors.join(', ')}.` : 'No NVM-managed Node versions were found.',
    'Install a compatible Cline environment with: nvm install 20 && nvm use 20 && npm install -g cline'
  ].join(' ');
}

function commandForTool(tool, promptFile, responseFile, cwd, options = {}) {
  if (tool === 'codex') {
    const args = ['exec', '-C', cwd, '-s', 'workspace-write', '-o', responseFile];
    if (options.skipGitRepoCheck) {
      args.push('--skip-git-repo-check');
    }
    args.push('-');
    return {
      command: 'codex',
      args,
      promptInput: fs.readFileSync(promptFile, 'utf8')
    };
  }

  if (tool === 'cline') {
    return {
      command: 'cline',
      args: ['--mode', 'act', '--output-format', 'plain'],
      promptInput: fs.readFileSync(promptFile, 'utf8')
    };
  }

  throw new Error(`Unsupported agent tool: ${tool}`);
}

function buildVisibleScript(options = {}) {
  const tool = options.tool || 'codex';
  const cwd = options.cwd || getTargetRepoPath(options);
  const promptFile = options.promptFile;
  const responseFile = options.responseFile;
  const logFile = options.logFile;
  const skipGitRepoCheck = Boolean(options.skipGitRepoCheck);

  const header = [
    '#!/bin/bash',
    'set -u',
    `cd ${shellQuote(cwd)}`,
    `PROMPT_FILE=${shellQuote(promptFile)}`,
    `RESPONSE_FILE=${shellQuote(responseFile)}`,
    `LOG_FILE=${shellQuote(logFile)}`,
    'mkdir -p "$(dirname "$RESPONSE_FILE")"',
    'mkdir -p "$(dirname "$LOG_FILE")"',
    ': > "$LOG_FILE"',
    tool === 'codex'
      ? 'echo "[odt] Delegating implementation to Codex (visible terminal session)." | tee -a "$LOG_FILE"'
      : 'echo "[odt] Delegating implementation to Cline (visible terminal session)." | tee -a "$LOG_FILE"',
    'echo "[odt] Workspace: $PWD" | tee -a "$LOG_FILE"',
    'echo "[odt] Prompt: $PROMPT_FILE" | tee -a "$LOG_FILE"',
    'echo "[odt] Response: $RESPONSE_FILE" | tee -a "$LOG_FILE"',
    'echo "" | tee -a "$LOG_FILE"',
    'if [ -s "$HOME/.nvm/nvm.sh" ]; then',
    '  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"',
    '  . "$NVM_DIR/nvm.sh"',
    'fi',
    'set +e'
  ];

  let command = skipGitRepoCheck
    ? 'codex exec -C "$PWD" -s workspace-write -o "$RESPONSE_FILE" --skip-git-repo-check - < "$PROMPT_FILE" 2>&1 | tee -a "$LOG_FILE"'
    : 'codex exec -C "$PWD" -s workspace-write -o "$RESPONSE_FILE" - < "$PROMPT_FILE" 2>&1 | tee -a "$LOG_FILE"';

  if (tool === 'cline') {
    const envInfo = getClineEnvironment();
    if (envInfo.compatible) {
      command = [
        `export PATH=${shellQuote(path.dirname(envInfo.compatible.clineBin))}:$PATH`,
        'echo "[odt] Using compatible Cline environment." | tee -a "$LOG_FILE"',
        `echo "[odt] Cline binary: ${envInfo.compatible.clineBin}" | tee -a "$LOG_FILE"`,
        `echo "[odt] Node binary: ${envInfo.compatible.nodeBin}" | tee -a "$LOG_FILE"`,
        'cline --mode act --output-format plain < "$PROMPT_FILE" 2>&1 | tee -a "$LOG_FILE" "$RESPONSE_FILE"'
      ].join('\n');
    } else {
      command = [
        `echo "[odt] ${getClineLaunchError()}" | tee -a "$LOG_FILE" "$RESPONSE_FILE"`,
        'EXIT_CODE=1'
      ].join('\n');
    }
  }

  const footer = [
    tool === 'cline' && !getClineEnvironment().compatible ? 'if [ -z "${EXIT_CODE:-}" ]; then EXIT_CODE=1; fi' : 'EXIT_CODE=${PIPESTATUS[0]}',
    'set -e',
    'echo "" | tee -a "$LOG_FILE"',
    'echo "[odt] Agent task finished with exit code $EXIT_CODE" | tee -a "$LOG_FILE"',
    'echo "[odt] Review changed files and diffs directly in your workspace / Git tools." | tee -a "$LOG_FILE"',
    'echo ""',
    'echo "ODT delegation finished. You can return to ODT Workspace to review status."',
    'echo "Response file: $RESPONSE_FILE"',
    'echo "Log file: $LOG_FILE"',
    'exit $EXIT_CODE'
  ];

  return `${header.join('\n')}\n${command}\n${footer.join('\n')}\n`;
}

function openVisibleTerminal(scriptFile) {
  if (process.platform !== 'darwin') {
    throw new Error('Visible terminal launch is currently implemented for macOS Terminal.');
  }

  const osa = spawn('osascript', [
    '-e',
    `tell application "Terminal" to activate`,
    '-e',
    `tell application "Terminal" to do script "bash ${scriptFile.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  ], {
    cwd: path.dirname(scriptFile),
    env: process.env,
    stdio: 'ignore',
    detached: true
  });

  osa.unref();
  return osa.pid;
}

function launchExternalAgent(options = {}) {
  const tool = options.tool || 'codex';
  const mode = options.mode || 'terminal';
  const workspaceRoot = getWorkspaceRoot(options);
  const cwd = options.cwd || getTargetRepoPath(options);
  const skipGitRepoCheck = tool === 'codex' && !isGitRepo(cwd);
  const promptFile = resolvePath(options.promptFile || `${EXECUTE_DIR}/prompt.md`, options);
  const responseFile = resolvePath(options.responseFile || RESPONSE_FILE, options);
  const logFile = resolvePath(options.logFile || LOG_FILE, options);
  const scriptFile = resolvePath(options.scriptFile || SCRIPT_FILE, options);

  if (!fs.existsSync(promptFile)) {
    throw new Error(`Prompt file not found: ${promptFile}`);
  }

  fs.mkdirSync(path.dirname(responseFile), { recursive: true });
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(responseFile, '', 'utf8');
  fs.writeFileSync(logFile, '', 'utf8');

  const launchMeta = {
    generatedAt: new Date().toISOString(),
    status: 'starting',
    tool,
    mode,
    workspaceRoot,
    targetRepoPath: cwd,
    skipGitRepoCheck,
    promptFile: path.relative(workspaceRoot, promptFile),
    responseFile: path.relative(workspaceRoot, responseFile),
    logFile: path.relative(workspaceRoot, logFile),
    scriptFile: path.relative(workspaceRoot, scriptFile)
  };
  writeJson(STATUS_FILE, launchMeta, options);

  if (tool === 'cline') {
    const clineLaunchError = getClineLaunchError();
    if (clineLaunchError) {
      fs.writeFileSync(logFile, `[odt] ${clineLaunchError}\n`, 'utf8');
      writeJson(STATUS_FILE, {
        ...launchMeta,
        status: 'failed_to_start',
        error: clineLaunchError
      }, options);
      throw new Error(clineLaunchError);
    }
  }

  if (mode === 'terminal') {
    fs.writeFileSync(scriptFile, buildVisibleScript({
      tool,
      cwd,
      skipGitRepoCheck,
      promptFile,
      responseFile,
      logFile
    }), 'utf8');
    fs.chmodSync(scriptFile, 0o755);

    try {
      const launcherPid = openVisibleTerminal(scriptFile);
      writeJson(STATUS_FILE, {
        ...launchMeta,
        launcherPid,
        terminalApp: 'Terminal',
        status: 'delegated_visible',
        note: `Opened a visible Terminal session for ${tool}. Continue the task there and review changes/diffs in the workspace.`
      }, options);
      return readJson(STATUS_FILE, launchMeta, options);
    } catch (error) {
      writeJson(STATUS_FILE, {
        ...launchMeta,
        status: 'failed_to_open',
        error: error.message
      }, options);
      throw error;
    }
  }

  const { command, args, promptInput } = commandForTool(tool, promptFile, responseFile, cwd, { skipGitRepoCheck });
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  launchMeta.pid = child.pid;
  launchMeta.status = 'running';
  writeJson(STATUS_FILE, launchMeta, options);

  child.stdout.on('data', (chunk) => {
    logStream.write(chunk);
    if (tool === 'cline') {
      fs.appendFileSync(responseFile, chunk);
    }
  });

  child.stderr.on('data', (chunk) => {
    logStream.write(chunk);
  });

  child.on('error', (error) => {
    logStream.write(`\n[launcher-error] ${error.message}\n`);
    writeJson(STATUS_FILE, {
      ...launchMeta,
      status: 'failed_to_start',
      error: error.message
    }, options);
  });

  child.on('close', (code) => {
    logStream.end();
    writeJson(STATUS_FILE, {
      ...launchMeta,
      finishedAt: new Date().toISOString(),
      status: code === 0 ? 'completed' : 'failed',
      exitCode: code
    }, options);
  });

  child.stdin.write(promptInput);
  child.stdin.end();

  return readJson(STATUS_FILE, launchMeta, options);
}

function resetAgentLaunchState(options = {}) {
  const workspaceRoot = getWorkspaceRoot(options);
  const responseFile = resolvePath(options.responseFile || RESPONSE_FILE, options);
  const logFile = resolvePath(options.logFile || LOG_FILE, options);
  const scriptFile = resolvePath(options.scriptFile || SCRIPT_FILE, options);
  const statusPayload = {
    generatedAt: new Date().toISOString(),
    status: 'idle',
    tool: options.tool || 'codex',
    workspaceRoot,
    targetRepoPath: getTargetRepoPath(options),
    note: options.note || 'Execution bundle refreshed. Launch a new agent when ready.'
  };

  removeFileIfExists(responseFile);
  removeFileIfExists(logFile);
  removeFileIfExists(scriptFile);
  writeJson(STATUS_FILE, statusPayload, options);

  return getAgentLaunchStatus(options);
}

function getAgentLaunchStatus(options = {}) {
  const statusPayload = readJson(STATUS_FILE, {
    status: 'idle',
    note: 'No agent launch has been started yet.'
  }, options);
  const activeTargetRepoPath = getTargetRepoPath(options);
  const savedTargetRepoPath = statusPayload && statusPayload.targetRepoPath
    ? path.resolve(String(statusPayload.targetRepoPath))
    : '';
  const currentTargetRepoPath = activeTargetRepoPath ? path.resolve(String(activeTargetRepoPath)) : '';
  const repoMismatch = Boolean(savedTargetRepoPath && currentTargetRepoPath && savedTargetRepoPath !== currentTargetRepoPath);

  if (repoMismatch) {
    return {
      ...statusPayload,
      targetRepoPath: currentTargetRepoPath,
      rawStatus: statusPayload.status || 'idle',
      status: 'idle',
      completionStatus: 'idle',
      completionDetail: 'No delegated agent run has started yet for the current target repo.',
      inferredFromLog: false,
      exitCode: null,
      logTail: '',
      responseExists: false,
      responsePreview: '',
      note: 'Stored agent status belongs to a different target repo and is hidden for this workspace view.'
    };
  }

  const logText = readText(LOG_FILE, '', options);
  const logTail = tailLines(logText, 30);
  const responseText = readText(RESPONSE_FILE, '', options);
  const derived = deriveLaunchState(statusPayload.status, logText);
  const baseExitCode = Number.isFinite(Number(statusPayload.exitCode))
    ? Number(statusPayload.exitCode)
    : null;
  const finalExitCode = derived.exitCode !== undefined ? derived.exitCode : baseExitCode;
  const completionDetail = statusPayload.error
    ? `Agent failed: ${statusPayload.error}`
    : (
      derived.completionDetail
      || statusPayload.note
      || ''
    );

  return {
    ...statusPayload,
    rawStatus: statusPayload.status || 'idle',
    status: derived.status,
    completionStatus: derived.completionStatus,
    completionDetail,
    inferredFromLog: Boolean(derived.inferredFromLog),
    exitCode: finalExitCode,
    logTail,
    responseExists: Boolean(responseText.trim()),
    responsePreview: responseText ? responseText.slice(0, 1200) : ''
  };
}

module.exports = {
  launchExternalAgent,
  getAgentLaunchStatus,
  resetAgentLaunchState
};
