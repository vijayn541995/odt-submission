import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';

export const PROJECT_CONTRACT_MODULE_ID = 'project-contract';

export const projectContractModuleOwnership = {
  id: PROJECT_CONTRACT_MODULE_ID,
  prototypeSource: 'odt-ai-innovator-lab',
  routes: [
    'GET /api/project-contracts',
    'GET /api/project-contracts/:id',
    'POST /api/project-contracts',
    'POST /api/project-contracts/:id/readiness',
    'POST /api/project-contracts/:id/handoff'
  ],
  owns: [
    'per-repository command contract',
    'known setup issue capture',
    'blocked command policy',
    'approval and evidence notes',
    'read-only environment readiness',
    'agent handoff contract generation'
  ]
};

const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/;
const PROTECTED_BRANCHES = new Set([
  'main',
  'master',
  'develop',
  'development',
  'release',
  'production',
  'prod'
]);

function arrayFrom(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function contractId(value = '') {
  const slug = String(value || 'project-contract')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return slug || `contract-${randomUUID().slice(0, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function fingerprintFor(contract = {}) {
  const safeContract = {
    id: contract.id,
    assignmentId: contract.assignmentId,
    projectName: contract.projectName,
    repoPath: contract.repoPath,
    baseBranch: contract.baseBranch,
    buildCommand: contract.buildCommand,
    testCommand: contract.testCommand,
    blockedCommands: contract.blockedCommands,
    approvalNotes: contract.approvalNotes
  };
  return createHash('sha256').update(JSON.stringify(safeContract)).digest('hex').slice(0, 16);
}

function defaultRunCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    execFile(command, args, {
      cwd: options.cwd || process.cwd(),
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

function readinessCheck(id, label, status, detail, remediation = '', extra = {}) {
  return { id, label, status, detail, remediation, ...extra };
}

function normalizeRiskProfile(value = '') {
  const normalized = String(value || 'medium').trim().toLowerCase();
  return ['low', 'medium', 'high', 'critical'].includes(normalized) ? normalized : 'medium';
}

export function normalizeProjectContract(input = {}, existing = {}) {
  const projectName = String(input.projectName || existing.projectName || 'Untitled Project').trim();
  const createdAt = existing.createdAt || input.createdAt || nowIso();
  return {
    id: String(input.id || existing.id || contractId(projectName)).trim(),
    assignmentId: String(input.assignmentId ?? existing.assignmentId ?? '').trim(),
    projectName,
    ownerTeam: String(input.ownerTeam ?? existing.ownerTeam ?? '').trim(),
    repoPath: String(input.repoPath ?? existing.repoPath ?? '').trim(),
    baseBranch: String(input.baseBranch ?? existing.baseBranch ?? 'main').trim(),
    riskProfile: normalizeRiskProfile(input.riskProfile ?? existing.riskProfile),
    installCommand: String(input.installCommand ?? existing.installCommand ?? '').trim(),
    buildCommand: String(input.buildCommand ?? existing.buildCommand ?? '').trim(),
    testCommand: String(input.testCommand ?? existing.testCommand ?? '').trim(),
    runUiCommand: String(input.runUiCommand ?? existing.runUiCommand ?? '').trim(),
    runApiCommand: String(input.runApiCommand ?? existing.runApiCommand ?? '').trim(),
    deployCommand: String(input.deployCommand ?? existing.deployCommand ?? '').trim(),
    knownIssues: arrayFrom(input.knownIssues ?? existing.knownIssues),
    blockedCommands: arrayFrom(input.blockedCommands ?? existing.blockedCommands),
    approvalNotes: arrayFrom(input.approvalNotes ?? existing.approvalNotes),
    evidenceNotes: arrayFrom(input.evidenceNotes ?? existing.evidenceNotes),
    status: String(input.status ?? existing.status ?? 'active').trim() || 'active',
    createdAt,
    updatedAt: nowIso()
  };
}

function documentedCommandText(contract = {}) {
  return [
    contract.installCommand,
    contract.buildCommand,
    contract.testCommand,
    contract.runUiCommand,
    contract.runApiCommand,
    contract.deployCommand
  ].join('\n').toLowerCase();
}

function matchingBlockedCommands(contract = {}) {
  const commandText = documentedCommandText(contract);
  return (contract.blockedCommands || []).filter((blocked) => {
    const value = String(blocked || '').toLowerCase().trim();
    return value && commandText.includes(value);
  });
}

function normalizeRepoPath(value = '') {
  return String(value || '').trim().replace(/\/+$/g, '');
}

export function selectProjectContractForAssignmentContext({
  contracts = [],
  assignmentId = '',
  evidence = {}
} = {}) {
  const assignmentRepoPath = normalizeRepoPath(evidence.assignment?.repoPath);
  const latestRepoPath = normalizeRepoPath(evidence.repoAnalysis?.[0]?.repoPath || evidence.repoAnalysis?.[0]?.analysisJson?.repoPath);
  const targetRepoPath = assignmentRepoPath || latestRepoPath || '';
  const activeContracts = (contracts || []).filter((contract) => String(contract.status || 'active').toLowerCase() !== 'archived');
  const matchingAssignmentContract = activeContracts.find((contract) => (
    String(contract.assignmentId || '').trim()
    && String(contract.assignmentId || '').trim() === String(assignmentId || '').trim()
  ));
  if (matchingAssignmentContract) {
    return {
      contract: matchingAssignmentContract,
      targetRepoPath,
      reason: 'assignment_match'
    };
  }

  if (targetRepoPath) {
    const matchingRepoContract = activeContracts.find((contract) => normalizeRepoPath(contract.repoPath) === targetRepoPath);
    return {
      contract: matchingRepoContract || null,
      targetRepoPath,
      reason: matchingRepoContract ? 'repo_path_match' : 'no_matching_contract_for_target_repo'
    };
  }

  const unscopedContract = activeContracts.find((contract) => !String(contract.assignmentId || '').trim());
  if (unscopedContract) {
    return {
      contract: unscopedContract,
      targetRepoPath: normalizeRepoPath(unscopedContract.repoPath),
      reason: 'unscoped_fallback'
    };
  }

  if (activeContracts.length === 1) {
    return {
      contract: activeContracts[0],
      targetRepoPath: normalizeRepoPath(activeContracts[0].repoPath),
      reason: 'single_contract_fallback'
    };
  }

  return {
    contract: null,
    targetRepoPath,
    reason: 'no_contract'
  };
}

function extractWorkKey(value = '') {
  const match = String(value || '').match(ISSUE_KEY_PATTERN);
  return match?.[0] || '';
}

function branchSlug(value = '') {
  return String(value || '')
    .replace(ISSUE_KEY_PATTERN, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function expectedBranchName(contract = {}) {
  const text = [
    contract.projectName,
    contract.assignmentId,
    ...(contract.evidenceNotes || []),
    ...(contract.approvalNotes || [])
  ].join(' ');
  const workKey = extractWorkKey(text);
  const slug = branchSlug(contract.projectName || contract.assignmentId || 'work');
  if (workKey) {
    return {
      workKey,
      expectedBranch: `codex/${workKey}${slug ? `-${slug}` : ''}`
    };
  }
  return {
    workKey: '',
    expectedBranch: slug ? `codex/${slug}` : ''
  };
}

function buildBranchReadinessCheck(contract = {}, currentBranch = '') {
  const branch = String(currentBranch || '').trim();
  const baseBranch = String(contract.baseBranch || 'main').trim();
  const normalizedBranch = branch.toLowerCase();
  const normalizedBase = baseBranch.toLowerCase();
  const { workKey, expectedBranch } = expectedBranchName(contract);
  const baseOrProtected = Boolean(
    branch
    && (
      normalizedBranch === normalizedBase
      || PROTECTED_BRANCHES.has(normalizedBranch)
      || normalizedBranch.startsWith('release/')
      || normalizedBranch.startsWith('hotfix/')
    )
  );
  const ticketMismatch = Boolean(workKey && branch && !normalizedBranch.includes(workKey.toLowerCase()));

  if (!branch) {
    return readinessCheck(
      'branch-readiness',
      'Branch readiness',
      'manual',
      'Current branch is not available.',
      'Check out a task branch before launching write workers.',
      {
        currentBranch: '',
        baseBranch,
        expectedBranch,
        workKey,
        gateImpact: 'write blocked until branch is known'
      }
    );
  }

  if (normalizedBranch === 'head') {
    return readinessCheck(
      'branch-readiness',
      'Branch readiness',
      'manual',
      'Repository is in detached HEAD state.',
      `Create or switch to ${expectedBranch || 'a task branch'} before launching write workers.`,
      {
        currentBranch: branch,
        baseBranch,
        expectedBranch,
        workKey,
        gateImpact: 'write blocked until a named branch is active'
      }
    );
  }

  if (baseOrProtected) {
    return readinessCheck(
      'branch-readiness',
      'Branch readiness',
      'manual',
      `Current branch ${branch} is protected or matches base branch ${baseBranch}.`,
      `Create or switch to ${expectedBranch || 'a task branch'} before launching implementation workers.`,
      {
        currentBranch: branch,
        baseBranch,
        expectedBranch,
        workKey,
        gateImpact: 'write blocked until a task branch is active or branch override is approved'
      }
    );
  }

  if (ticketMismatch) {
    return readinessCheck(
      'branch-readiness',
      'Branch readiness',
      'warning',
      `Current branch ${branch} does not include ${workKey}.`,
      `Consider switching to ${expectedBranch} for traceability, or continue with manual/no-Jira notes.`,
      {
        currentBranch: branch,
        baseBranch,
        expectedBranch,
        workKey,
        gateImpact: 'read-only and write allowed when other gates are clear; ticket traceability warning remains in audit'
      }
    );
  }

  return readinessCheck(
    'branch-readiness',
    'Branch readiness',
    'ready',
    workKey
      ? `Current branch ${branch} is a task branch for ${workKey}.`
      : `Current branch ${branch} is not a protected/base branch.`,
    '',
    {
      currentBranch: branch,
      baseBranch,
      expectedBranch,
      workKey,
      gateImpact: 'write allowed when other governance gates are clear'
    }
  );
}

function scoreReadiness(checks = []) {
  if (!checks.length) return 0;
  const weights = {
    ready: 1,
    manual: 0.7,
    warning: 0.5,
    blocked: 0
  };
  const total = checks.reduce((sum, item) => sum + (weights[item.status] ?? 0), 0);
  return Math.round((total / checks.length) * 100);
}

function statusForChecks(checks = []) {
  if (checks.some((item) => item.status === 'blocked')) return 'blocked';
  if (checks.some((item) => ['warning', 'manual'].includes(item.status))) return 'needs_attention';
  return 'ready';
}

function commandLine(label, value) {
  return `- ${label}: ${value || 'Not recorded'}`;
}

function listSection(title, items = []) {
  if (!items.length) return `## ${title}\n\n- None recorded.\n`;
  return `## ${title}\n\n${items.map((item) => `- ${item}`).join('\n')}\n`;
}

export function buildProjectContractHandoff(contract = {}, readiness = null) {
  const fingerprint = fingerprintFor(contract);
  const readinessLines = readiness
    ? [
        '## Readiness Snapshot',
        '',
        `- Status: ${readiness.status}`,
        `- Score: ${readiness.score}%`,
        '',
        ...(readiness.checks || []).map((item) => `- ${item.label}: ${item.status} - ${item.detail}`),
        ''
      ]
    : [];

  return [
    '# ODT Project Contract Handoff',
    '',
    `Contract: ${contract.projectName}`,
    `Owner team: ${contract.ownerTeam || 'Not recorded'}`,
    `Risk profile: ${contract.riskProfile}`,
    `Contract id: ${contract.id}`,
    `Assignment id: ${contract.assignmentId || 'Not scoped'}`,
    `Fingerprint: ${fingerprint}`,
    `Generated: ${nowIso()}`,
    '',
    '## Repository',
    '',
    `- Path: ${contract.repoPath || 'Not recorded'}`,
    `- Base branch: ${contract.baseBranch || 'Not recorded'}`,
    '',
    '## Commands',
    '',
    commandLine('Install', contract.installCommand),
    commandLine('Build', contract.buildCommand),
    commandLine('Test', contract.testCommand),
    commandLine('Run UI', contract.runUiCommand),
    commandLine('Run API', contract.runApiCommand),
    commandLine('Deploy', contract.deployCommand || 'Deployment requires separate approval.'),
    '',
    listSection('Known Issues', contract.knownIssues),
    listSection('Blocked Commands', contract.blockedCommands),
    listSection('Approval Notes', contract.approvalNotes),
    listSection('Evidence Notes', contract.evidenceNotes),
    ...readinessLines,
    '## Worker Instructions',
    '',
    '- Treat this project contract as source of truth before proposing commands.',
    '- Do not execute blocked commands.',
    '- Do not create PRs, push branches, deploy, install dependencies, or write to external systems without explicit approval.',
    '- If a command differs from this contract, stop and ask for human confirmation.',
    '- Record changed files, commands, test outcomes, known risks, and verification evidence back into ODT.',
    ''
  ].join('\n');
}

export function createProjectContractService({
  repository,
  runCommand = defaultRunCommand,
  pathExists = existsSync
} = {}) {
  if (!repository) {
    throw new TypeError('createProjectContractService requires repository');
  }

  const findContract = (id = '') => repository.getById(id);

  return {
    listContracts({ assignmentId = '' } = {}) {
      return assignmentId ? repository.listByAssignment(assignmentId) : repository.list();
    },
    getContract(id = '') {
      return findContract(id);
    },
    saveContract(input = {}) {
      const existing = input.id ? findContract(input.id) : null;
      const contract = normalizeProjectContract(input, existing || {});
      return repository.upsertContract(contract);
    },
    async buildReadiness(id = '') {
      const contract = findContract(id);
      if (!contract) return null;

      const checks = [];
      const repoExists = Boolean(contract.repoPath && pathExists(contract.repoPath));
      checks.push(readinessCheck(
        'repo-path',
        'Repository path',
        repoExists ? 'ready' : 'blocked',
        repoExists ? contract.repoPath : 'Repository path is missing or not accessible.',
        repoExists ? '' : 'Add a valid local repository path.'
      ));

      if (repoExists) {
        const gitRoot = await runCommand('git', ['rev-parse', '--show-toplevel'], { cwd: contract.repoPath });
        checks.push(readinessCheck(
          'git-repo',
          'Git repository',
          gitRoot.ok ? 'ready' : 'warning',
          gitRoot.ok ? `Git work tree detected at ${gitRoot.stdout}.` : gitRoot.stderr || 'Unable to confirm git work tree.',
          gitRoot.ok ? '' : 'Confirm this path is inside a git checkout before launching code workers.'
        ));

        const branch = await runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: contract.repoPath });
        checks.push(readinessCheck(
          'git-branch',
          'Current branch',
          branch.ok ? 'ready' : 'warning',
          branch.ok ? branch.stdout : branch.stderr || 'Unable to read current branch.',
          branch.ok ? '' : 'Check git installation and repository state.'
        ));
        checks.push(buildBranchReadinessCheck(contract, branch.ok ? branch.stdout : ''));

        const status = await runCommand('git', ['status', '--short'], { cwd: contract.repoPath });
        const changedCount = status.ok && status.stdout ? status.stdout.split(/\n/).filter(Boolean).length : 0;
        checks.push(readinessCheck(
          'git-status',
          'Working tree',
          status.ok ? (changedCount ? 'warning' : 'ready') : 'warning',
          status.ok ? (changedCount ? `${changedCount} changed file(s) detected.` : 'No local changes detected.') : status.stderr || 'Unable to read git status.',
          changedCount ? 'Make sure changes belong to the intended task before launching agents.' : ''
        ));
      }

      const nodeVersion = await runCommand('node', ['--version']);
      checks.push(readinessCheck(
        'node',
        'Node.js',
        nodeVersion.ok ? 'ready' : 'warning',
        nodeVersion.ok ? nodeVersion.stdout : 'Node command not available.',
        nodeVersion.ok ? '' : 'Install or expose Node.js before running JavaScript project tasks.'
      ));

      const npmVersion = await runCommand('npm', ['--version']);
      checks.push(readinessCheck(
        'npm',
        'npm',
        npmVersion.ok ? 'ready' : 'warning',
        npmVersion.ok ? npmVersion.stdout : 'npm command not available.',
        npmVersion.ok ? '' : 'Install or expose npm before running install/build/test commands.'
      ));

      const codexVersion = await runCommand('codex', ['--version']);
      checks.push(readinessCheck(
        'codex',
        'Codex CLI',
        codexVersion.ok ? 'ready' : 'manual',
        codexVersion.ok ? codexVersion.stdout : 'Codex CLI not found on this server PATH.',
        codexVersion.ok ? '' : 'Start ODT with the Codex CLI on PATH or mark this manually ready.'
      ));

      checks.push(readinessCheck(
        'commands',
        'Build/test commands',
        contract.buildCommand && contract.testCommand ? 'ready' : 'warning',
        contract.buildCommand && contract.testCommand ? 'Build and test commands are documented.' : 'Build or test command is missing.',
        'Add exact commands so agents do not guess.'
      ));

      checks.push(readinessCheck(
        'known-issues',
        'Known issues',
        contract.knownIssues?.length ? 'ready' : 'warning',
        contract.knownIssues?.length ? `${contract.knownIssues.length} known issue(s) documented.` : 'No known issue notes recorded.',
        'Record setup/build/test quirks so the next agent does not rediscover them.'
      ));

      checks.push(readinessCheck(
        'approval-notes',
        'Approval policy',
        contract.approvalNotes?.length ? 'ready' : 'warning',
        contract.approvalNotes?.length ? `${contract.approvalNotes.length} approval note(s) documented.` : 'No approval policy notes recorded.',
        'Document what requires human approval: writes, dependency installs, PRs, deploys.'
      ));

      const blockedMatches = matchingBlockedCommands(contract);
      checks.push(readinessCheck(
        'blocked-command-policy',
        'Blocked command policy',
        blockedMatches.length ? 'blocked' : 'ready',
        blockedMatches.length
          ? `Documented commands contain blocked pattern(s): ${blockedMatches.join(', ')}.`
          : 'No blocked command pattern was found in documented commands.',
        blockedMatches.length ? 'Remove destructive commands from the project contract and require manual approval paths.' : ''
      ));

      return {
        contractId: contract.id,
        generatedAt: nowIso(),
        status: statusForChecks(checks),
        score: scoreReadiness(checks),
        checks
      };
    },
    async buildHandoff(id = '') {
      const contract = findContract(id);
      if (!contract) return null;
      const readiness = await this.buildReadiness(id);
      return {
        contractId: id,
        readiness,
        handoff: buildProjectContractHandoff(contract, readiness)
      };
    }
  };
}
