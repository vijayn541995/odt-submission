const path = require('path');

function resolveAbsolute(basePath, candidate) {
  if (!candidate) return path.resolve(basePath);
  return path.isAbsolute(candidate) ? path.normalize(candidate) : path.resolve(basePath, candidate);
}

function getWorkspaceRoot(options = {}) {
  return resolveAbsolute(process.cwd(), options.workspaceRoot || options['workspace-root'] || process.cwd());
}

function getTargetRepoPath(options = {}) {
  const workspaceRoot = getWorkspaceRoot(options);
  return resolveAbsolute(
    workspaceRoot,
    options.targetRepoPath || options['target-repo-path'] || options.repoRoot || options['repo-root'] || workspaceRoot
  );
}

function resolveWorkspacePath(relPath, options = {}) {
  return path.resolve(getWorkspaceRoot(options), relPath);
}

function resolveTargetPath(relPath, options = {}) {
  return path.resolve(getTargetRepoPath(options), relPath);
}

module.exports = {
  getWorkspaceRoot,
  getTargetRepoPath,
  resolveWorkspacePath,
  resolveTargetPath
};
