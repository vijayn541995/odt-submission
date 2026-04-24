#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();

function removeIfExists(relPath) {
  const absPath = path.resolve(repoRoot, relPath);
  if (!absPath.startsWith(repoRoot)) return;
  if (!fs.existsSync(absPath)) return;
  fs.rmSync(absPath, { recursive: true, force: true });
  // eslint-disable-next-line no-console
  console.log(`removed: ${relPath}`);
}

function removePatternInDir(dirRelPath, pattern) {
  const absDir = path.resolve(repoRoot, dirRelPath);
  if (!absDir.startsWith(repoRoot) || !fs.existsSync(absDir)) return;
  const entries = fs.readdirSync(absDir);
  entries
    .filter((name) => pattern.test(name))
    .forEach((name) => {
      removeIfExists(path.join(dirRelPath, name));
    });
}

function removePatternRecursive(dirRelPath, pattern) {
  const absDir = path.resolve(repoRoot, dirRelPath);
  if (!absDir.startsWith(repoRoot) || !fs.existsSync(absDir)) return;
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  entries.forEach((entry) => {
    const relPath = path.join(dirRelPath, entry.name);
    if (entry.isDirectory()) {
      removePatternRecursive(relPath, pattern);
      return;
    }
    if (pattern.test(entry.name)) {
      removeIfExists(relPath);
    }
  });
}

function run() {
  const full = process.argv.includes('--full');

  const alwaysRemove = [
    'reports/.DS_Store',
    'reports/mcp/local-context.json',
    'reports/odt/execute/agent-launch.json',
    'reports/odt/execute/agent-launch.log',
    'reports/odt/execute/agent-response.md',
    'reports/odt/execute/applied.patch',
    'reports/odt/execute/apply-summary.json',
    'reports/odt/execute/apply-summary.md',
    'reports/odt/execute/bundle.json',
    'reports/odt/execute/launch-agent.sh',
    'reports/odt/execute/prompt.md',
    'reports/odt/execute/response-template.md',
    'reports/odt/execute/status.json'
  ];

  alwaysRemove.forEach(removeIfExists);

  // Clean Office lock/temp files that can accidentally get committed.
  removePatternRecursive('docs', /^~\$.+/);
  removePatternRecursive('reports', /^~\$.+/);
  removePatternRecursive('reports', /^\.DS_Store$/);

  if (full) {
    removePatternInDir('reports/odt/uploads', /.*/);
    removePatternInDir('reports/odt/ui-backup-pre-refresh', /.*/);
    [
      'reports/a11y',
      'reports/a11y-twin',
      'reports/dev-twin',
      'reports/odt',
      'reports/mcp'
    ].forEach(removeIfExists);
  }

  // eslint-disable-next-line no-console
  console.log(full ? 'ODT cleanup complete (full).' : 'ODT cleanup complete.');
}

run();
