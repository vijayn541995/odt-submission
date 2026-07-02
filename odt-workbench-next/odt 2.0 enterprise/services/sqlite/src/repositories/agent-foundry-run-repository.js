const REQUIRED_STATEMENTS = [
  ['insertAgentFoundryRun', 'run'],
  ['selectAgentFoundryRunsByAssignment', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`agent foundry run repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

function stringifyJson(value, fallback) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? fallback);
}

export function createAgentFoundryRunRepository({
  statements,
  parseAgentFoundryRun = (row) => row
} = {}) {
  if (!statements) {
    throw new TypeError('createAgentFoundryRunRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectAgentFoundryRunsByAssignment.all(assignmentId).map(parseAgentFoundryRun)
  );

  return {
    listByAssignment,
    createRunEntry({
      id,
      runId,
      assignmentId,
      phase,
      domainId,
      domainLabel,
      inputSources = [],
      output = {},
      status = 'PASS',
      provider = 'local',
      model = '',
      createdAt = new Date().toISOString()
    } = {}) {
      statements.insertAgentFoundryRun.run(
        id,
        runId,
        assignmentId,
        phase,
        domainId,
        domainLabel,
        stringifyJson(inputSources, []),
        stringifyJson(output, {}),
        status,
        provider,
        model,
        createdAt
      );
      return listByAssignment(assignmentId).find((entry) => entry.id === id) || null;
    }
  };
}
