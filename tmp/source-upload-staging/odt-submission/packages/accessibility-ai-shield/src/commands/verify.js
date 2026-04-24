const { execSync } = require('child_process');
const { runScan } = require('./scan');
const { listChangedFiles } = require('../utils/targets');

function safeExec(command) {
  execSync(command, { stdio: 'inherit' });
}

async function runVerify() {
  const result = await runScan({ changed: true });
  const changed = listChangedFiles();

  if (changed.length) {
    safeExec(`npx eslint ${changed.join(' ')}`);
    safeExec(`npm test -- --findRelatedTests ${changed.join(' ')} --watch=false --runInBand`);
  }

  if (result.summary.blocker > 0) {
    throw new Error(`Verify failed: ${result.summary.blocker} accessibility blocker(s) remain.`);
  }

  // eslint-disable-next-line no-console
  console.log('A11y verify passed.');
}

module.exports = { runVerify };
