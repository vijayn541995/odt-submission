const REQUIRED_STATEMENTS = [
  ['insertImplementationEvidence', 'run'],
  ['selectImplementationEvidenceById', 'get'],
  ['selectImplementationEvidenceByAssignment', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`implementation evidence repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

function parseJsonValue(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stringifyJson(value, fallback) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? fallback);
}

function parseImplementationEvidenceRow(row) {
  if (!row) return null;
  return {
    ...row,
    changedFiles: parseJsonValue(row.changedFilesJson, []),
    commands: parseJsonValue(row.commandsJson, []),
    tests: parseJsonValue(row.testsJson, [])
  };
}

export function createImplementationEvidenceRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createImplementationEvidenceRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const getById = (evidenceId = '') => (
    parseImplementationEvidenceRow(statements.selectImplementationEvidenceById.get(evidenceId))
  );
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectImplementationEvidenceByAssignment.all(assignmentId).map(parseImplementationEvidenceRow)
  );

  return {
    getById,
    listByAssignment,
    createEvidence({
      id,
      assignmentId,
      runId = '',
      phase = 'implementation',
      changedFiles = [],
      commands = [],
      tests = [],
      summary = '',
      status = 'recorded',
      createdBy = 'local-user',
      createdAt = new Date().toISOString(),
      updatedAt = createdAt
    } = {}) {
      statements.insertImplementationEvidence.run(
        id,
        assignmentId,
        runId,
        phase,
        stringifyJson(changedFiles, []),
        stringifyJson(commands, []),
        stringifyJson(tests, []),
        summary,
        status,
        createdBy,
        createdAt,
        updatedAt
      );
      return getById(id);
    }
  };
}
