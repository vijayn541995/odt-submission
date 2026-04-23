const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(command, cwd = process.cwd()) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], cwd }).trim();
  } catch (error) {
    return '';
  }
}

function listAllSourceFiles(cwd = process.cwd()) {
  let output = run('rg --files src', cwd);
  if (!output) {
    output = run('find src -type f \\( -name "*.js" -o -name "*.jsx" \\)', cwd);
  }
  if (!output) return [];
  return output
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => file.endsWith('.js') || file.endsWith('.jsx'))
    .map((file) => path.resolve(cwd, file))
    .filter((file) => fs.existsSync(file));
}

function listChangedFiles(cwd = process.cwd()) {
  const tracked = run('git diff --name-only --diff-filter=ACMRTUXB HEAD', cwd);
  const untracked = run('git ls-files --others --exclude-standard', cwd);
  const files = `${tracked}\n${untracked}`
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => file.startsWith('src/'))
    .filter((file) => file.endsWith('.js') || file.endsWith('.jsx'))
    .map((file) => path.resolve(cwd, file))
    .filter((file) => fs.existsSync(file));

  return [...new Set(files)];
}

function filterExcluded(files, config) {
  return files.filter((file) => {
    if (file.includes('__snapshots__')) return false;
    if (file.endsWith('.snap')) return false;
    if (file.startsWith('coverage')) return false;
    return !(config.exclude || []).some((pattern) => {
      if (pattern.includes('node_modules') && file.includes('node_modules')) return true;
      return false;
    });
  });
}

module.exports = {
  listAllSourceFiles,
  listChangedFiles,
  filterExcluded
};
