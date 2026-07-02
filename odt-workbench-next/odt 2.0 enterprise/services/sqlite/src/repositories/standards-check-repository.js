const REQUIRED_STATEMENTS = [
  ['insertStandardsCheck', 'run'],
  ['insertStandardsFinding', 'run'],
  ['selectStandardsChecksByAssignment', 'all'],
  ['selectStandardsFindingsByAssignment', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`standards check repository requires statements.${name}.${method}(...)`);
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

function parseCheckRow(row) {
  if (!row) return null;
  return {
    ...row,
    summary: parseJsonValue(row.summary, {}),
    artifact: parseJsonValue(row.artifact, {})
  };
}

export function createStandardsCheckRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createStandardsCheckRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const listFindingsByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectStandardsFindingsByAssignment.all(assignmentId)
  );
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => {
    const findings = listFindingsByAssignment(assignmentId);
    return statements.selectStandardsChecksByAssignment.all(assignmentId)
      .map(parseCheckRow)
      .map((check) => ({
        ...check,
        findings: findings.filter((finding) => finding.standardsCheckId === check.id)
      }));
  };

  return {
    listByAssignment,
    listFindingsByAssignment,
    createCheck({
      id,
      assignmentId,
      phase = 'pre-implementation',
      standardsVersion = '',
      status = 'WARNING',
      summary = {},
      artifact = {},
      findings = [],
      createFindingId,
      createdAt = new Date().toISOString()
    } = {}) {
      if (typeof createFindingId !== 'function') {
        throw new TypeError('standards check repository requires createFindingId');
      }
      statements.insertStandardsCheck.run(
        id,
        assignmentId,
        phase,
        standardsVersion,
        status,
        stringifyJson(summary, {}),
        stringifyJson(artifact, {}),
        createdAt
      );
      findings.forEach((finding) => {
        statements.insertStandardsFinding.run(
          createFindingId(),
          id,
          assignmentId,
          finding.category,
          finding.status,
          finding.message,
          finding.recommendation,
          createdAt
        );
      });
      return listByAssignment(assignmentId).find((check) => check.id === id) || null;
    }
  };
}
