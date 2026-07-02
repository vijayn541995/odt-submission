const REQUIRED_STATEMENTS = [
  ['upsertAgentWorkerRun', 'run'],
  ['updateAgentWorkerOutput', 'run'],
  ['selectAgentWorkerRunsByAssignment', 'all'],
  ['selectAgentWorkerRunById', 'get']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`agent worker run repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

function stringifyJson(value, fallback) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? fallback);
}

export function createAgentWorkerRunRepository({
  statements,
  parseAgentWorkerRun = (row) => row
} = {}) {
  if (!statements) {
    throw new TypeError('createAgentWorkerRunRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const getById = (workerRunId = '') => parseAgentWorkerRun(statements.selectAgentWorkerRunById.get(workerRunId));
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectAgentWorkerRunsByAssignment.all(assignmentId).map(parseAgentWorkerRun)
  );

  return {
    getById,
    listByAssignment,
    upsertWorkerRun({
      id,
      assignmentId,
      runId,
      workerRole = '',
      workerRoleLabel = '',
      executionAgent = '',
      mode = '',
      sandboxMode = '',
      status = 'unknown',
      sequenceIndex = null,
      launchMode = '',
      bundleDir = '',
      handoffFile = '',
      promptFile = '',
      scriptFile = '',
      responseFile = '',
      logFile = '',
      statusFile = '',
      manualCommand = '',
      output = {},
      questions = [],
      createdAt = new Date().toISOString(),
      updatedAt = createdAt,
      completedAt = null
    } = {}) {
      statements.upsertAgentWorkerRun.run(
        id,
        assignmentId,
        runId,
        workerRole,
        workerRoleLabel,
        executionAgent,
        mode,
        sandboxMode,
        status,
        sequenceIndex,
        launchMode,
        bundleDir,
        handoffFile,
        promptFile,
        scriptFile,
        responseFile,
        logFile,
        statusFile,
        manualCommand,
        stringifyJson(output, {}),
        stringifyJson(questions, []),
        createdAt,
        updatedAt,
        completedAt
      );
      return getById(id);
    },
    updateWorkerOutput({
      workerRunId,
      status = 'unknown',
      output = {},
      questions = [],
      updatedAt = new Date().toISOString(),
      completedAt = null
    } = {}) {
      statements.updateAgentWorkerOutput.run(
        status,
        stringifyJson(output, {}),
        stringifyJson(questions, []),
        updatedAt,
        completedAt,
        workerRunId
      );
      return getById(workerRunId);
    }
  };
}
