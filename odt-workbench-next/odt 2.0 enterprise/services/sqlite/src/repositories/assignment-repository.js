const REQUIRED_STATEMENTS = [
  ['insertAssignment', 'run'],
  ['updateAssignmentContext', 'run'],
  ['selectAssignments', 'all'],
  ['selectAssignmentById', 'get']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`assignment repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createAssignmentRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createAssignmentRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const getById = (assignmentId = '') => statements.selectAssignmentById.get(assignmentId) || null;
  const list = () => statements.selectAssignments.all();

  return {
    getById,
    list,
    createAssignment({
      id,
      title,
      requirement,
      owner = '',
      status = 'needs review',
      priority = 'high',
      repoPath = null,
      createdAt = new Date().toISOString(),
      updatedAt = createdAt
    } = {}) {
      statements.insertAssignment.run(
        id,
        title,
        requirement,
        owner,
        status,
        priority,
        repoPath,
        createdAt,
        updatedAt
      );
      return getById(id);
    },
    updateContext({
      assignmentId,
      title = null,
      requirement = null,
      repoPath = null,
      status = 'needs review',
      updatedAt = new Date().toISOString()
    } = {}) {
      statements.updateAssignmentContext.run(
        title,
        requirement,
        repoPath,
        status,
        updatedAt,
        assignmentId
      );
      return getById(assignmentId);
    }
  };
}
