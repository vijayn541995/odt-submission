const REQUIRED_STATEMENTS = [
  ['insertConnectorEvent', 'run'],
  ['selectConnectorEvents', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`connector event repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

function stringifyJson(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value || {});
}

export function createConnectorEventRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createConnectorEventRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  return {
    createEvent({
      id,
      connectorId,
      action = '',
      mode = 'read',
      status,
      detail = {},
      createdAt = new Date().toISOString()
    } = {}) {
      statements.insertConnectorEvent.run(
        id,
        connectorId,
        action,
        mode,
        status,
        stringifyJson(detail),
        createdAt
      );
      return {
        id,
        connectorId,
        action,
        mode,
        status,
        detail: stringifyJson(detail),
        createdAt
      };
    },
    list() {
      return statements.selectConnectorEvents.all();
    }
  };
}
