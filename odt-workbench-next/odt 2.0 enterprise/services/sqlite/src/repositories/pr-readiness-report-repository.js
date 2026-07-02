const REQUIRED_STATEMENTS = [
  ['insertPrReadinessReport', 'run'],
  ['selectPrReportsByAssignment', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`PR readiness report repository requires statements.${name}.${method}(...)`);
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

function parseReportRow(row) {
  if (!row) return null;
  return {
    ...row,
    reportJson: parseJsonValue(row.reportJson, {})
  };
}

export function createPrReadinessReportRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createPrReadinessReportRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectPrReportsByAssignment.all(assignmentId).map(parseReportRow)
  );

  return {
    listByAssignment,
    createReport({
      id,
      assignmentId,
      title = '',
      report = {},
      status = 'BLOCKED',
      createdAt = new Date().toISOString()
    } = {}) {
      statements.insertPrReadinessReport.run(
        id,
        assignmentId,
        title,
        stringifyJson(report, {}),
        status,
        createdAt
      );
      return listByAssignment(assignmentId).find((row) => row.id === id) || null;
    }
  };
}
