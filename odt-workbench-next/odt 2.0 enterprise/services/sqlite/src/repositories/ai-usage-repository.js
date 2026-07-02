const REQUIRED_STATEMENTS = [
  ['insertAiUsage', 'run'],
  ['selectAiUsage', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`AI usage repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

function stringifyJsonArray(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(Array.isArray(value) ? value : []);
}

export function createAiUsageRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createAiUsageRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  return {
    createUsage({
      id,
      requestId,
      runId = '',
      sessionId = '',
      userId = null,
      requestType,
      provider,
      model,
      inputChars = 0,
      promptTokens = 0,
      completionTokens = 0,
      totalTokens = 0,
      latencyMs = 0,
      status,
      error = null,
      fallbackUsed = false,
      sources = [],
      createdAt = new Date().toISOString()
    } = {}) {
      statements.insertAiUsage.run(
        id,
        requestId,
        runId,
        sessionId,
        userId,
        requestType,
        provider,
        model,
        inputChars,
        promptTokens,
        completionTokens,
        totalTokens,
        latencyMs,
        status,
        error,
        fallbackUsed ? 1 : 0,
        stringifyJsonArray(sources),
        createdAt
      );
      return {
        id,
        requestId,
        runId,
        sessionId,
        userId,
        requestType,
        provider,
        model,
        inputChars,
        promptTokens,
        completionTokens,
        totalTokens,
        latencyMs,
        status,
        error,
        fallbackUsed: fallbackUsed ? 1 : 0,
        sourcesJson: stringifyJsonArray(sources),
        createdAt
      };
    },
    list() {
      return statements.selectAiUsage.all();
    }
  };
}
