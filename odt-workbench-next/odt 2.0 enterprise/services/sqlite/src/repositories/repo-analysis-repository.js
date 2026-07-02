const REQUIRED_STATEMENTS = [
  ['insertRepoAnalysis', 'run'],
  ['selectRepoAnalysisByAssignment', 'all']
];

function defaultParseJsonValue(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`repo analysis repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createRepoAnalysisRepository({ statements, parseJsonValue = defaultParseJsonValue } = {}) {
  if (!statements) {
    throw new TypeError('createRepoAnalysisRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const parseRow = (row) => row
    ? { ...row, analysisJson: parseJsonValue(row.analysisJson, {}) }
    : null;
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectRepoAnalysisByAssignment.all(assignmentId).map(parseRow)
  );

  return {
    listByAssignment,
    createAnalysis({
      id,
      assignmentId,
      repoPath = '',
      analysis = {},
      status = analysis.status || 'REPO_ANALYZED',
      createdAt = new Date().toISOString(),
      updatedAt = createdAt
    } = {}) {
      statements.insertRepoAnalysis.run(
        id,
        assignmentId,
        repoPath,
        JSON.stringify(analysis || {}),
        status,
        createdAt,
        updatedAt
      );
      return listByAssignment(assignmentId).find((repoAnalysis) => repoAnalysis.id === id) || null;
    }
  };
}
