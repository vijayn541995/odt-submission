const REQUIRED_STATEMENTS = [
  ['insertTechnicalDesign', 'run'],
  ['selectTechnicalDesignsByAssignment', 'all']
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
    throw new TypeError(`technical design repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createTechnicalDesignRepository({ statements, parseJsonValue = defaultParseJsonValue } = {}) {
  if (!statements) {
    throw new TypeError('createTechnicalDesignRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const parseRow = (row) => row
    ? { ...row, designJson: parseJsonValue(row.designJson, {}) }
    : null;
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectTechnicalDesignsByAssignment.all(assignmentId).map(parseRow)
  );

  return {
    listByAssignment,
    createDesign({
      id,
      assignmentId,
      title = 'Governed Developer Workflow Design',
      design = {},
      status = 'TECH_DESIGN_DRAFTED',
      createdAt = new Date().toISOString(),
      updatedAt = createdAt
    } = {}) {
      statements.insertTechnicalDesign.run(
        id,
        assignmentId,
        title,
        JSON.stringify(design || {}),
        status,
        createdAt,
        updatedAt
      );
      return listByAssignment(assignmentId).find((technicalDesign) => technicalDesign.id === id) || null;
    }
  };
}
