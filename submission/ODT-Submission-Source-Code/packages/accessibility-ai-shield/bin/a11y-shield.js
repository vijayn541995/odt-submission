#!/usr/bin/env node

const { run } = require('../src/index');

run(process.argv.slice(2)).catch((error) => {
  // Keep failures explicit for CI gating.
  // eslint-disable-next-line no-console
  console.error(error.message || error);
  process.exit(1);
});
