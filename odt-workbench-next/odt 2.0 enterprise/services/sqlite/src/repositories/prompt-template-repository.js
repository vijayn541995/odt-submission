const REQUIRED_STATEMENTS = [
  ['insertPromptTemplate', 'run'],
  ['selectPromptTemplates', 'all']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`prompt template repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createPromptTemplateRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createPromptTemplateRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const list = () => statements.selectPromptTemplates.all();

  return {
    list,
    createTemplate({
      id,
      name,
      requestType,
      version = 'v1',
      template,
      active = 1,
      createdAt = new Date().toISOString(),
      updatedAt = createdAt
    } = {}) {
      statements.insertPromptTemplate.run(
        id,
        name,
        requestType,
        version,
        template,
        active,
        createdAt,
        updatedAt
      );
      return list().find((item) => item.id === id) || null;
    }
  };
}
