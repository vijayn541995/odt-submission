const REQUIRED_STATEMENTS = [
  ['upsertProjectContract', 'run'],
  ['selectProjectContracts', 'all'],
  ['selectProjectContractsByAssignment', 'all'],
  ['selectProjectContractById', 'get']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`project contract repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

function arrayFrom(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return arrayFrom(value);
  if (value === undefined || value === null || value === '') return [];
  try {
    return arrayFrom(JSON.parse(value));
  } catch {
    return arrayFrom(value);
  }
}

function stringifyJsonArray(value) {
  return JSON.stringify(arrayFrom(value));
}

function parseProjectContractRow(row) {
  if (!row) return null;
  const {
    knownIssuesJson,
    blockedCommandsJson,
    approvalNotesJson,
    evidenceNotesJson,
    ...contract
  } = row;
  return {
    ...contract,
    knownIssues: parseJsonArray(knownIssuesJson),
    blockedCommands: parseJsonArray(blockedCommandsJson),
    approvalNotes: parseJsonArray(approvalNotesJson),
    evidenceNotes: parseJsonArray(evidenceNotesJson)
  };
}

export function createProjectContractRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createProjectContractRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const getById = (id = '') => parseProjectContractRow(statements.selectProjectContractById.get(id));
  const list = () => statements.selectProjectContracts.all().map(parseProjectContractRow);
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectProjectContractsByAssignment.all(assignmentId).map(parseProjectContractRow)
  );

  return {
    getById,
    list,
    listByAssignment,
    upsertContract({
      id,
      assignmentId = '',
      projectName,
      ownerTeam = '',
      repoPath = '',
      baseBranch = 'main',
      riskProfile = 'medium',
      installCommand = '',
      buildCommand = '',
      testCommand = '',
      runUiCommand = '',
      runApiCommand = '',
      deployCommand = '',
      knownIssues = [],
      blockedCommands = [],
      approvalNotes = [],
      evidenceNotes = [],
      status = 'active',
      createdAt = new Date().toISOString(),
      updatedAt = createdAt
    } = {}) {
      statements.upsertProjectContract.run(
        id,
        assignmentId,
        projectName,
        ownerTeam,
        repoPath,
        baseBranch,
        riskProfile,
        installCommand,
        buildCommand,
        testCommand,
        runUiCommand,
        runApiCommand,
        deployCommand,
        stringifyJsonArray(knownIssues),
        stringifyJsonArray(blockedCommands),
        stringifyJsonArray(approvalNotes),
        stringifyJsonArray(evidenceNotes),
        status,
        createdAt,
        updatedAt
      );
      return getById(id);
    }
  };
}
