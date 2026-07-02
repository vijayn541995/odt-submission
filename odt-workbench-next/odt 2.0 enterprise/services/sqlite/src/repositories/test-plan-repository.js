const REQUIRED_STATEMENTS = [
  ['insertTestPlan', 'run'],
  ['selectTestPlansByAssignment', 'all']
];

function defaultParseJsonValue(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`test plan repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createTestPlanRepository({ statements, parseJsonValue = defaultParseJsonValue } = {}) {
  if (!statements) {
    throw new TypeError('createTestPlanRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const parseRow = (row) => row
    ? { ...row, planJson: parseJsonValue(row.planJson, {}) }
    : null;
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectTestPlansByAssignment.all(assignmentId).map(parseRow)
  );

  return {
    listByAssignment,
    createTestPlan({
      id,
      assignmentId,
      phase = 'pre-implementation',
      plan = {},
      status = 'DRAFT',
      createdAt = new Date().toISOString(),
      updatedAt = createdAt
    } = {}) {
      statements.insertTestPlan.run(
        id,
        assignmentId,
        phase,
        JSON.stringify(plan || {}),
        status,
        createdAt,
        updatedAt
      );
      return listByAssignment(assignmentId).find((testPlan) => testPlan.id === id) || null;
    }
  };
}
