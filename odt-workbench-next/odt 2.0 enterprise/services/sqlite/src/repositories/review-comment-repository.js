const REQUIRED_STATEMENTS = [
  ['insertReviewComment', 'run'],
  ['updateReviewCommentStatus', 'run'],
  ['selectReviewCommentById', 'get'],
  ['selectReviewCommentsByAssignment', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`review comment repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createReviewCommentRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createReviewCommentRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const getById = (commentId = '') => statements.selectReviewCommentById.get(commentId) || null;
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectReviewCommentsByAssignment.all(assignmentId)
  );

  return {
    getById,
    listByAssignment,
    createComment({
      id,
      assignmentId,
      targetType = 'plan',
      targetId = '',
      severity = 'comment',
      comment = '',
      status = 'open',
      createdBy = 'local-user',
      createdAt = new Date().toISOString(),
      updatedAt = createdAt,
      resolutionNotes = ''
    } = {}) {
      statements.insertReviewComment.run(
        id,
        assignmentId,
        targetType,
        targetId,
        severity,
        comment,
        status,
        createdBy,
        createdAt,
        updatedAt,
        resolutionNotes
      );
      return getById(id);
    },
    updateStatus({
      id,
      status = 'open',
      updatedAt = new Date().toISOString(),
      resolutionNotes = ''
    } = {}) {
      statements.updateReviewCommentStatus.run(status, updatedAt, resolutionNotes, id);
      return getById(id);
    }
  };
}
