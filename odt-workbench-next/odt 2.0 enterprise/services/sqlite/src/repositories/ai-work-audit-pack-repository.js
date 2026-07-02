const REQUIRED_STATEMENTS = [
  ['insertAiWorkAuditPack', 'run'],
  ['selectAiWorkAuditPacksByAssignment', 'all'],
  ['selectAiWorkAuditPackById', 'get']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`AI work audit pack repository requires statements.${name}.${method}(...)`);
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

function parsePackRow(row) {
  if (!row) return null;
  return {
    ...row,
    packJson: parseJsonValue(row.packJson, {})
  };
}

export function createAiWorkAuditPackRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createAiWorkAuditPackRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectAiWorkAuditPacksByAssignment.all(assignmentId).map(parsePackRow)
  );

  const getById = (packId = '') => (
    parsePackRow(statements.selectAiWorkAuditPackById.get(packId))
  );

  return {
    getById,
    listByAssignment,
    getLatestByAssignment(assignmentId = 'assignment-local-mvp') {
      return listByAssignment(assignmentId)[0] || null;
    },
    createPack({
      id,
      assignmentId,
      stage = 'implementation-evidence',
      status = 'recorded',
      pack = {},
      createdAt = new Date().toISOString()
    } = {}) {
      statements.insertAiWorkAuditPack.run(
        id,
        assignmentId,
        stage,
        status,
        stringifyJson(pack, {}),
        createdAt
      );
      return getById(id);
    }
  };
}
