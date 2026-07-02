import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5290);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_FILE = path.join(__dirname, 'data', 'project-contracts.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function nowIso() {
  return new Date().toISOString();
}

function contractId(value = '') {
  const slug = String(value || 'project-contract')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return slug || `contract-${randomUUID().slice(0, 8)}`;
}

function arrayFrom(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeContract(input = {}, existing = {}) {
  const projectName = String(input.projectName || existing.projectName || 'Untitled Project').trim();
  return {
    id: String(input.id || existing.id || contractId(projectName)).trim(),
    projectName,
    ownerTeam: String(input.ownerTeam || existing.ownerTeam || '').trim(),
    repoPath: String(input.repoPath || existing.repoPath || '').trim(),
    baseBranch: String(input.baseBranch || existing.baseBranch || 'main').trim(),
    riskProfile: String(input.riskProfile || existing.riskProfile || 'medium').trim(),
    installCommand: String(input.installCommand || existing.installCommand || '').trim(),
    buildCommand: String(input.buildCommand || existing.buildCommand || '').trim(),
    testCommand: String(input.testCommand || existing.testCommand || '').trim(),
    runUiCommand: String(input.runUiCommand || existing.runUiCommand || '').trim(),
    runApiCommand: String(input.runApiCommand || existing.runApiCommand || '').trim(),
    deployCommand: String(input.deployCommand || existing.deployCommand || '').trim(),
    knownIssues: arrayFrom(input.knownIssues ?? existing.knownIssues),
    blockedCommands: arrayFrom(input.blockedCommands ?? existing.blockedCommands),
    approvalNotes: arrayFrom(input.approvalNotes ?? existing.approvalNotes),
    evidenceNotes: arrayFrom(input.evidenceNotes ?? existing.evidenceNotes),
    createdAt: existing.createdAt || input.createdAt || nowIso(),
    updatedAt: nowIso()
  };
}

async function readStore() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [] };
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    const empty = { contracts: [] };
    await fs.writeFile(DATA_FILE, `${JSON.stringify(empty, null, 2)}\n`);
    return empty;
  }
}

async function writeStore(store) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function sendText(response, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  response.end(text);
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    execFile(command, args, {
      cwd: options.cwd || __dirname,
      timeout: options.timeout || 3500,
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error?.code ?? 0,
        signal: error?.signal || '',
        stdout: String(stdout || '').trim(),
        stderr: String(stderr || '').trim()
      });
    });
  });
}

function check(id, label, status, detail, remediation = '') {
  return { id, label, status, detail, remediation };
}

function hasBlockedCommand(contract) {
  const commandText = [
    contract.installCommand,
    contract.buildCommand,
    contract.testCommand,
    contract.runUiCommand,
    contract.runApiCommand,
    contract.deployCommand
  ].join('\n').toLowerCase();
  return (contract.blockedCommands || []).some((blocked) => {
    const value = String(blocked || '').toLowerCase().trim();
    return value && commandText.includes(value);
  });
}

async function buildReadiness(contract) {
  const checks = [];
  const repoPath = contract.repoPath;
  const repoExists = Boolean(repoPath && existsSync(repoPath));
  const gitRoot = repoExists
    ? await runCommand('git', ['rev-parse', '--show-toplevel'], { cwd: repoPath })
    : { ok: false, stdout: '', stderr: '' };

  checks.push(check(
    'repo-path',
    'Repository path',
    repoExists ? 'ready' : 'blocked',
    repoExists ? repoPath : 'Repository path is missing or not accessible.',
    repoExists ? '' : 'Add a valid local repository path.'
  ));
  checks.push(check(
    'git-repo',
    'Git repository',
    gitRoot.ok ? 'ready' : 'warning',
    gitRoot.ok ? `Git work tree detected at ${gitRoot.stdout}.` : gitRoot.stderr || 'Unable to confirm git work tree.',
    gitRoot.ok ? '' : 'Confirm this path is inside a git checkout before launching code workers.'
  ));

  if (repoExists) {
    const branch = await runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repoPath });
    checks.push(check(
      'git-branch',
      'Current branch',
      branch.ok ? 'ready' : 'warning',
      branch.ok ? branch.stdout : branch.stderr || 'Unable to read current branch.',
      branch.ok ? '' : 'Check git installation and repository state.'
    ));

    const status = await runCommand('git', ['status', '--short'], { cwd: repoPath });
    const changedCount = status.ok && status.stdout ? status.stdout.split(/\n/).filter(Boolean).length : 0;
    checks.push(check(
      'git-status',
      'Working tree',
      status.ok ? (changedCount ? 'warning' : 'ready') : 'warning',
      status.ok ? (changedCount ? `${changedCount} changed file(s) detected.` : 'No local changes detected.') : status.stderr || 'Unable to read git status.',
      changedCount ? 'Make sure changes belong to the intended task before launching agents.' : ''
    ));
  }

  const nodeVersion = await runCommand('node', ['--version']);
  checks.push(check(
    'node',
    'Node.js',
    nodeVersion.ok ? 'ready' : 'warning',
    nodeVersion.ok ? nodeVersion.stdout : 'Node command not available.',
    nodeVersion.ok ? '' : 'Install or expose Node.js before running JavaScript project tasks.'
  ));

  const npmVersion = await runCommand('npm', ['--version']);
  checks.push(check(
    'npm',
    'npm',
    npmVersion.ok ? 'ready' : 'warning',
    npmVersion.ok ? npmVersion.stdout : 'npm command not available.',
    npmVersion.ok ? '' : 'Install or expose npm before running install/build/test commands.'
  ));

  const codexVersion = await runCommand('codex', ['--version']);
  checks.push(check(
    'codex',
    'Codex CLI',
    codexVersion.ok ? 'ready' : 'manual',
    codexVersion.ok ? codexVersion.stdout : 'Codex CLI not found on this server PATH.',
    codexVersion.ok ? '' : 'If Codex is available elsewhere, start this lab with that PATH or mark this manually ready.'
  ));

  checks.push(check(
    'commands',
    'Build/test commands',
    contract.buildCommand && contract.testCommand ? 'ready' : 'warning',
    contract.buildCommand && contract.testCommand
      ? 'Build and test commands are documented.'
      : 'Build or test command is missing.',
    'Add exact commands so agents do not guess.'
  ));

  checks.push(check(
    'known-issues',
    'Known issues',
    contract.knownIssues?.length ? 'ready' : 'warning',
    contract.knownIssues?.length
      ? `${contract.knownIssues.length} known issue(s) documented.`
      : 'No known issue notes recorded.',
    'Record setup/build/test quirks so the next agent does not rediscover them.'
  ));

  checks.push(check(
    'approval-notes',
    'Approval policy',
    contract.approvalNotes?.length ? 'ready' : 'warning',
    contract.approvalNotes?.length
      ? `${contract.approvalNotes.length} approval note(s) documented.`
      : 'No approval notes recorded.',
    'Document what requires human approval: writes, dependency installs, PRs, deploys.'
  ));

  checks.push(check(
    'blocked-command-policy',
    'Blocked command policy',
    hasBlockedCommand(contract) ? 'blocked' : 'ready',
    hasBlockedCommand(contract)
      ? 'A project command contains a blocked command pattern.'
      : 'No blocked command pattern was found in documented commands.',
    hasBlockedCommand(contract)
      ? 'Remove destructive or unsafe commands from project contract fields.'
      : ''
  ));

  const statusRank = { blocked: 3, warning: 2, manual: 1, ready: 0 };
  const worst = checks.reduce((current, item) => (
    statusRank[item.status] > statusRank[current] ? item.status : current
  ), 'ready');
  const score = Math.max(0, Math.round((checks.filter((item) => item.status === 'ready').length / checks.length) * 100));

  return {
    contractId: contract.id,
    generatedAt: nowIso(),
    status: worst === 'blocked' ? 'blocked' : worst === 'warning' ? 'needs_attention' : 'ready',
    score,
    checks
  };
}

function renderList(items = [], fallback = 'None recorded.') {
  const values = items.length ? items : [fallback];
  return values.map((item) => `- ${item}`).join('\n');
}

function generateHandoff(contract, readiness) {
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({ contract, readiness }))
    .digest('hex')
    .slice(0, 16);

  return `# ODT Project Contract Handoff

Contract: ${contract.projectName}
Owner team: ${contract.ownerTeam || 'Not recorded'}
Risk profile: ${contract.riskProfile}
Contract id: ${contract.id}
Fingerprint: ${fingerprint}
Generated: ${nowIso()}

## Repository

- Path: ${contract.repoPath || 'Not recorded'}
- Base branch: ${contract.baseBranch || 'Not recorded'}

## Commands

- Install: ${contract.installCommand || 'Not recorded'}
- Build: ${contract.buildCommand || 'Not recorded'}
- Test: ${contract.testCommand || 'Not recorded'}
- Run UI: ${contract.runUiCommand || 'Not recorded'}
- Run API: ${contract.runApiCommand || 'Not recorded'}
- Deploy: ${contract.deployCommand || 'Not recorded; deployment requires separate approval.'}

## Known Issues

${renderList(contract.knownIssues)}

## Blocked Commands

${renderList(contract.blockedCommands)}

## Approval Notes

${renderList(contract.approvalNotes)}

## Evidence Notes

${renderList(contract.evidenceNotes)}

## Readiness Snapshot

- Status: ${readiness.status}
- Score: ${readiness.score}%

${readiness.checks.map((item) => `- ${item.label}: ${item.status} - ${item.detail}`).join('\n')}

## Worker Instructions

- Treat this contract as the source of truth before proposing commands.
- Do not execute blocked commands.
- Do not create PRs, push branches, deploy, install dependencies, or write to external systems without explicit approval.
- If a command differs from this contract, stop and ask for human confirmation.
- Record changed files, commands, test outcomes, known risks, and verification evidence back into ODT.
`;
}

async function serveStatic(request, response, url) {
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const decoded = decodeURIComponent(requested);
  const absolute = path.normalize(path.join(PUBLIC_DIR, decoded));
  if (!absolute.startsWith(PUBLIC_DIR)) {
    sendText(response, 403, 'Forbidden');
    return;
  }
  try {
    const content = await fs.readFile(absolute);
    const contentType = CONTENT_TYPES[path.extname(absolute)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      sendText(response, 404, 'Not found');
      return;
    }
    throw err;
  }
}

async function handleApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, {
      ok: true,
      app: 'ODT AI Innovator Lab',
      port: PORT,
      storage: DATA_FILE,
      generatedAt: nowIso()
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/contracts') {
    sendJson(response, 200, await readStore());
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/contracts') {
    const body = await readBody(request);
    const store = await readStore();
    const existingIndex = store.contracts.findIndex((item) => item.id === body.id);
    const existing = existingIndex >= 0 ? store.contracts[existingIndex] : {};
    const contract = normalizeContract(body, existing);
    if (existingIndex >= 0) {
      store.contracts[existingIndex] = contract;
    } else {
      store.contracts.unshift(contract);
    }
    await writeStore(store);
    sendJson(response, 200, { contract });
    return;
  }

  const contractMatch = url.pathname.match(/^\/api\/contracts\/([^/]+)$/);
  if (request.method === 'GET' && contractMatch) {
    const store = await readStore();
    const contract = store.contracts.find((item) => item.id === contractMatch[1]);
    if (!contract) {
      sendJson(response, 404, { error: 'Contract not found.' });
      return;
    }
    sendJson(response, 200, { contract });
    return;
  }

  const readinessMatch = url.pathname.match(/^\/api\/contracts\/([^/]+)\/readiness$/);
  if (request.method === 'POST' && readinessMatch) {
    const store = await readStore();
    const contract = store.contracts.find((item) => item.id === readinessMatch[1]);
    if (!contract) {
      sendJson(response, 404, { error: 'Contract not found.' });
      return;
    }
    sendJson(response, 200, { readiness: await buildReadiness(contract) });
    return;
  }

  const handoffMatch = url.pathname.match(/^\/api\/contracts\/([^/]+)\/handoff$/);
  if (request.method === 'POST' && handoffMatch) {
    const store = await readStore();
    const contract = store.contracts.find((item) => item.id === handoffMatch[1]);
    if (!contract) {
      sendJson(response, 404, { error: 'Contract not found.' });
      return;
    }
    const readiness = await buildReadiness(contract);
    sendJson(response, 200, {
      handoff: generateHandoff(contract, readiness),
      readiness
    });
    return;
  }

  sendJson(response, 404, { error: 'API route not found.' });
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url);
      return;
    }
    await serveStatic(request, response, url);
  } catch (err) {
    sendJson(response, err.statusCode || 500, {
      error: err.message || 'Unexpected server error.'
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`ODT AI Innovator Lab running at http://${HOST}:${PORT}`);
});
