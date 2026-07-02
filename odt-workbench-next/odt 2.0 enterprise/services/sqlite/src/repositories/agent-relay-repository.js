const REQUIRED_STATEMENTS = [
  ['insertAgentRelayItem', 'run'],
  ['selectAgentRelayItemsByAssignment', 'all'],
  ['selectAgentRelayItemById', 'get'],
  ['updateAgentRelayItem', 'run']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`agent relay repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

function stringifyJson(value, fallback = {}) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? fallback);
}

export function createAgentRelayRepository({
  statements,
  parseAgentRelayItem = (row) => row
} = {}) {
  if (!statements) {
    throw new TypeError('createAgentRelayRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const getById = (relayItemId = '') => parseAgentRelayItem(statements.selectAgentRelayItemById.get(relayItemId));
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectAgentRelayItemsByAssignment.all(assignmentId).map(parseAgentRelayItem)
  );
  const findByUniqueKey = (assignmentId = 'assignment-local-mvp', uniqueKey = '') => (
    listByAssignment(assignmentId).find((item) => item.uniqueKey === uniqueKey) || null
  );

  return {
    getById,
    listByAssignment,
    findByUniqueKey,
    createRelayItem({
      id,
      assignmentId,
      sourceWorkerRunId = '',
      sourceWorkerRole = '',
      sourceWorkerRoleLabel = '',
      targetWorkerRole = '',
      targetLane = '',
      itemType = 'question',
      status = 'open',
      severity = 'needs_review',
      title = '',
      message = '',
      context = {},
      decision = {},
      uniqueKey = '',
      createdBy = 'odt-worker-ingest',
      createdAt = new Date().toISOString(),
      updatedAt = createdAt,
      resolvedAt = null
    } = {}) {
      statements.insertAgentRelayItem.run(
        id,
        assignmentId,
        sourceWorkerRunId,
        sourceWorkerRole,
        sourceWorkerRoleLabel,
        targetWorkerRole,
        targetLane,
        itemType,
        status,
        severity,
        title,
        message,
        stringifyJson(context, {}),
        stringifyJson(decision, {}),
        uniqueKey,
        createdBy,
        createdAt,
        updatedAt,
        resolvedAt
      );
      return getById(id) || findByUniqueKey(assignmentId, uniqueKey);
    },
    updateRelayItem({
      relayItemId,
      targetWorkerRole = '',
      targetLane = '',
      status = 'open',
      severity = 'needs_review',
      decision = {},
      updatedAt = new Date().toISOString(),
      resolvedAt = null
    } = {}) {
      statements.updateAgentRelayItem.run(
        targetWorkerRole,
        targetLane,
        status,
        severity,
        stringifyJson(decision, {}),
        updatedAt,
        resolvedAt,
        relayItemId
      );
      return getById(relayItemId);
    }
  };
}
