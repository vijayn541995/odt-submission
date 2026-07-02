const REQUIRED_STATEMENTS = [
  ['insertRequirement', 'run'],
  ['selectRequirementsByAssignment', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`requirement repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createRequirementRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createRequirementRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectRequirementsByAssignment.all(assignmentId)
  );

  return {
    listByAssignment,
    createRequirement({
      id,
      assignmentId,
      sourceType = 'manual',
      rawText = 'No requirement text provided.',
      summary = '',
      status = 'REQUIREMENT_ANALYZED',
      createdAt = new Date().toISOString(),
      updatedAt = createdAt
    } = {}) {
      statements.insertRequirement.run(
        id,
        assignmentId,
        sourceType,
        rawText,
        summary,
        status,
        createdAt,
        updatedAt
      );
      return listByAssignment(assignmentId).find((requirement) => requirement.id === id) || null;
    }
  };
}
