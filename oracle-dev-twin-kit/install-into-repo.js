#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.replace(/^--/, '');
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        opts[key] = next;
        i += 1;
      } else {
        opts[key] = true;
      }
    }
  }
  return opts;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest, force = false) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing source directory: ${src}`);
  }
  if (path.resolve(src) === path.resolve(dest)) {
    return 'skipped_same_path';
  }
  if (fs.existsSync(dest) && !force) {
    return 'skipped';
  }
  ensureDir(path.dirname(dest));
  fs.cpSync(src, dest, { recursive: true, force });
  return 'copied';
}

function copyFile(src, dest, force = false) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing source file: ${src}`);
  }
  if (path.resolve(src) === path.resolve(dest)) {
    return 'skipped_same_path';
  }
  if (fs.existsSync(dest) && !force) {
    return 'skipped';
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return 'copied';
}

function mergeScripts(targetPkgPath) {
  const pkg = JSON.parse(fs.readFileSync(targetPkgPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  const additions = {
    'a11y:scan': 'node packages/accessibility-ai-shield/bin/a11y-shield.js scan --changed',
    'a11y:scan:ci': 'node packages/accessibility-ai-shield/bin/a11y-shield.js scan --full --ci',
    'a11y:fix': 'node packages/accessibility-ai-shield/bin/a11y-shield.js fix --input reports/a11y/findings.json --mode preview',
    'a11y:verify': 'node packages/accessibility-ai-shield/bin/a11y-shield.js verify',
    'odt:init': 'node packages/accessibility-ai-shield/bin/a11y-shield.js odt:init',
    'odt:autopilot': 'node packages/accessibility-ai-shield/bin/a11y-shield.js odt:autopilot --withA11y',
    'odt:feature': 'node packages/accessibility-ai-shield/bin/a11y-shield.js odt:autopilot --work-item feature --withA11y',
    'odt:defect': 'node packages/accessibility-ai-shield/bin/a11y-shield.js odt:autopilot --work-item defect --withA11y',
    'odt:status': 'node packages/accessibility-ai-shield/bin/a11y-shield.js odt:status'
  };

  Object.entries(additions).forEach(([key, value]) => {
    if (!pkg.scripts[key]) {
      pkg.scripts[key] = value;
    }
  });

  fs.writeFileSync(targetPkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const target = path.resolve(process.cwd(), opts.target || '.');
  const sourceRepo = path.resolve(opts.source || path.resolve(__dirname, '..'));
  const force = Boolean(opts.force);

  const targetPkgPath = path.join(target, 'package.json');
  if (!fs.existsSync(targetPkgPath)) {
    throw new Error(`Target repo is missing package.json: ${targetPkgPath}`);
  }

  const sourceA11y = path.join(sourceRepo, 'packages', 'accessibility-ai-shield');
  const sourceCopilot = path.join(sourceRepo, 'packages', 'delivery-copilot');
  const sourceCfg = path.join(sourceRepo, '.a11y-shieldrc.js');
  const sourceMap = path.join(sourceRepo, 'docs', 'a11y-vpat-mapping.md');

  const destA11y = path.join(target, 'packages', 'accessibility-ai-shield');
  const destCopilot = path.join(target, 'packages', 'delivery-copilot');
  const destCfg = path.join(target, '.a11y-shieldrc.js');
  const destMap = path.join(target, 'docs', 'a11y-vpat-mapping.md');

  const results = {
    accessibilityPackage: copyDir(sourceA11y, destA11y, force),
    deliveryCopilotPackage: copyDir(sourceCopilot, destCopilot, force),
    config: copyFile(sourceCfg, destCfg, force),
    vpatMappingDoc: copyFile(sourceMap, destMap, force)
  };

  mergeScripts(targetPkgPath);

  // eslint-disable-next-line no-console
  console.log('Oracle Developer Twin kit installed.');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ target, sourceRepo, force, results }, null, 2));
  // eslint-disable-next-line no-console
  console.log('Next: npm run odt:autopilot -- --work-item feature --withA11y');
}

try {
  main();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error.message || error);
  process.exit(1);
}
