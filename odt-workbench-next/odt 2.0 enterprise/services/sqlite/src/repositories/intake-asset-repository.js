const REQUIRED_STATEMENTS = [
  ['insertIntakeAsset', 'run'],
  ['selectIntakeAssetById', 'get'],
  ['selectIntakeAssetsByAssignment', 'all'],
  ['updateIntakeAssetAnalysis', 'run']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`intake asset repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

export function createIntakeAssetRepository({ statements, parseIntakeAssetRow = (row) => row } = {}) {
  if (!statements) {
    throw new TypeError('createIntakeAssetRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const getById = (assetId = '') => parseIntakeAssetRow(
    statements.selectIntakeAssetById.get(assetId) || null
  );
  const listByAssignment = (assignmentId = 'assignment-local-mvp') => (
    statements.selectIntakeAssetsByAssignment.all(assignmentId).map(parseIntakeAssetRow)
  );

  return {
    getById,
    listByAssignment,
    updateAnalysis({ assetId, analysis = {} } = {}) {
      statements.updateIntakeAssetAnalysis.run(JSON.stringify(analysis || {}), assetId);
      return getById(assetId);
    },
    createAsset({
      id,
      assignmentId,
      originalName,
      storedName,
      storedPath,
      mimeType = '',
      fileType,
      bytes = 0,
      sourceKind = 'upload',
      analysis = {},
      status = 'stored',
      createdAt = new Date().toISOString()
    } = {}) {
      statements.insertIntakeAsset.run(
        id,
        assignmentId,
        originalName,
        storedName,
        storedPath,
        mimeType,
        fileType,
        bytes,
        sourceKind,
        JSON.stringify(analysis || {}),
        status,
        createdAt
      );
      return getById(id);
    }
  };
}
