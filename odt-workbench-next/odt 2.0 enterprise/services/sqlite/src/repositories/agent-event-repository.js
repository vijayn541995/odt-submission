const REQUIRED_STATEMENTS = [
  ['insertAgentEvent', 'run'],
  ['selectAgentEventsByAssignment', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`agent event repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

function stringifyJson(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value || {});
}

export function createAgentEventRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createAgentEventRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  return {
    createEvent({
      id,
      assignmentId,
      agentId,
      eventType,
      status,
      detail = {},
      createdAt = new Date().toISOString()
    } = {}) {
      statements.insertAgentEvent.run(
        id,
        assignmentId,
        agentId,
        eventType,
        status,
        stringifyJson(detail),
        createdAt
      );
      return {
        id,
        assignmentId,
        agentId,
        eventType,
        status,
        detail: stringifyJson(detail),
        createdAt
      };
    },
    listByAssignment(assignmentId = 'assignment-local-mvp') {
      return statements.selectAgentEventsByAssignment.all(assignmentId);
    }
  };
}
