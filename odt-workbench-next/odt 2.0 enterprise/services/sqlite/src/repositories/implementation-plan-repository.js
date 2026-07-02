const REQUIRED_STATEMENTS = [
  ['insertImplementationPlan', 'run'],
  ['selectImplementationPlansByAssignment', 'all']
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
    throw new TypeError(`implementation plan repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createImplementationPlanRepository({ statements, parseJsonValue = defaultParseJsonValue } = {}) {
  if (!statements) {
    throw new TypeError('createImplementationPlanRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const parseRow = (row) => row
    ? { ...row, planJson: parseJsonValue(row.planJson, {}) }
    : null;
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectImplementationPlansByAssignment.all(assignmentId).map(parseRow)
  );

  return {
    listByAssignment,
    createPlan({
      id,
      assignmentId,
      title = 'Standards-Governed Implementation Plan',
      plan = {},
      status = 'PLAN_REVIEW',
      createdAt = new Date().toISOString(),
      updatedAt = createdAt
    } = {}) {
      statements.insertImplementationPlan.run(
        id,
        assignmentId,
        title,
        JSON.stringify(plan || {}),
        status,
        createdAt,
        updatedAt
      );
      return listByAssignment(assignmentId).find((implementationPlan) => implementationPlan.id === id) || null;
    }
  };
}
