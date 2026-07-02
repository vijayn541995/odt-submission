const REQUIRED_STATEMENTS = [
  ['insertRunEvent', 'run'],
  ['selectRunEvents', 'all'],
  ['selectRunEventsByRun', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`run event repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

function stringifyJson(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value || {});
}

export function createRunEventRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createRunEventRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  return {
    createEvent({
      id,
      runId,
      assignmentId = null,
      eventType,
      status,
      detail = {},
      createdAt = new Date().toISOString()
    } = {}) {
      statements.insertRunEvent.run(
        id,
        runId,
        assignmentId,
        eventType,
        status,
        stringifyJson(detail),
        createdAt
      );
      return {
        id,
        runId,
        assignmentId,
        eventType,
        status,
        detail: stringifyJson(detail),
        createdAt
      };
    },
    list() {
      return statements.selectRunEvents.all();
    },
    listByRun(runId = '') {
      return statements.selectRunEventsByRun.all(runId);
    }
  };
}
