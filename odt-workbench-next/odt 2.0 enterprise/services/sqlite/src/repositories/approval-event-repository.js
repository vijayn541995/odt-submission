const REQUIRED_STATEMENTS = [
  ['insertApprovalEvent', 'run'],
  ['selectApprovalsByAssignment', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`approval event repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createApprovalEventRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createApprovalEventRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectApprovalsByAssignment.all(assignmentId)
  );

  return {
    listByAssignment,
    createApproval({
      id,
      assignmentId,
      approvalType = 'standards_warning_override',
      status = 'approved',
      approvedBy = 'local-user',
      approvedAt = new Date().toISOString(),
      notes = ''
    } = {}) {
      statements.insertApprovalEvent.run(
        id,
        assignmentId,
        approvalType,
        status,
        approvedBy,
        approvedAt,
        notes
      );
      return listByAssignment(assignmentId).find((approval) => approval.id === id) || null;
    }
  };
}
