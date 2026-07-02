const REQUIRED_STATEMENTS = [
  ['insertDependencyRequest', 'run'],
  ['updateDependencyDecision', 'run'],
  ['selectDependencyRequestById', 'get'],
  ['selectDependencyRequestsByAssignment', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`dependency request repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createDependencyRequestRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createDependencyRequestRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const getById = (dependencyRequestId = '') => (
    statements.selectDependencyRequestById.get(dependencyRequestId) || null
  );
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectDependencyRequestsByAssignment.all(assignmentId)
  );

  return {
    getById,
    listByAssignment,
    createRequest({
      id,
      assignmentId,
      packageName,
      version = '',
      license = 'UNKNOWN',
      reason = '',
      alternatives = '',
      status = 'pending',
      requestedBy = 'local-user',
      approvedBy = null,
      requestedAt = new Date().toISOString(),
      decidedAt = null,
      notes = ''
    } = {}) {
      statements.insertDependencyRequest.run(
        id,
        assignmentId,
        packageName,
        version,
        license,
        reason,
        alternatives,
        status,
        requestedBy,
        approvedBy,
        requestedAt,
        decidedAt,
        notes
      );
      return getById(id);
    },
    updateDecision({
      id,
      status,
      approvedBy = 'local-user',
      decidedAt = new Date().toISOString(),
      notes = ''
    } = {}) {
      statements.updateDependencyDecision.run(
        status,
        approvedBy,
        decidedAt,
        notes,
        id
      );
      return getById(id);
    }
  };
}
