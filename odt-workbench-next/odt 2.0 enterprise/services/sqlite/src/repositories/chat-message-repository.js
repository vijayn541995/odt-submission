const REQUIRED_STATEMENTS = [
  ['insertChat', 'run'],
  ['selectChat', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`chat message repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createChatMessageRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createChatMessageRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  return {
    createMessage({
      id,
      assignmentId = null,
      sessionId = 'local-session',
      role,
      content = '',
      provider = '',
      model = '',
      createdAt = new Date().toISOString()
    } = {}) {
      statements.insertChat.run(
        id,
        assignmentId,
        sessionId,
        role,
        content,
        provider,
        model,
        createdAt
      );
      return {
        id,
        assignmentId,
        sessionId,
        role,
        content,
        provider,
        model,
        createdAt
      };
    },
    list() {
      return statements.selectChat.all();
    }
  };
}
