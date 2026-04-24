const { parseArgs } = require('./utils/args');
const { runScan } = require('./commands/scan');
const { runFix } = require('./commands/fix');
const { runVerify } = require('./commands/verify');
const { runTwinAnalyze, runTwinWorkpack, runTwinVerify, runTwinDemo } = require('./commands/twin');
const { runDevTwinInit, runDevTwinAnalyze, runDevTwinDemo } = require('./commands/dev-twin');
const { runOdtInit, runOdt, runOdtStatus, runOdtAutopilot } = require('./commands/odt');
const { runOdtExecute } = require('./commands/odt-execute');

function helpText() {
  return [
    'Usage: a11y-shield <command> [options]',
    '',
    'Commands:',
    '  scan [--changed] [--full] [--ci]      Run accessibility scans',
    '  fix [--input findings.json] [--mode preview]  Generate patch preview + coding-agent prompt',
    '  verify                                Scan + lint + related tests',
    '  twin:analyze [--input findings.json] [--limit 25] Build priority queue + dashboard',
    '  twin:workpack [--input findings.json] [--limit 20] [--max-files 2] Build coding-agent prompt + file list',
    '  twin:verify                            Validate blocker status from findings.json',
    '  twin:demo                              scan --full -> twin:analyze -> twin:verify',
    '  dev:twin:init                          Create intake template + safety questions',
    '  dev:twin:analyze [--input intake.json] [--target-repo-path /path/to/repo] Build repo analysis, workpacks, risk summary, dashboard',
    '  dev:twin:demo                          Run init + analyze with default assumptions',
    '  odt:init                               Initialize Oracle Developer Twin prompts and workspace',
    '  odt:run [--profile react-js] [--withA11y] [--images paths] [--prompt-provider template|oci] [--oci-model-id ocid] [--target-repo-path /path/to/repo]  Run staged ODT pipeline scaffold',
    '  odt:autopilot [--work-item feature|defect] [--feature-name "..."] [--modules "a,b"] [--withA11y] [--target-repo-path /path/to/repo]  One-command SDLC run',
    '  odt:execute [--refresh] [--response-file path.md|--patch-file patch.diff] [--dry-run] [--verify] [--target-repo-path /path/to/repo]  Build/apply reviewed execution patch',
    '  odt:status                             Show latest ODT run status',
    '',
    'Examples:',
    '  a11y-shield scan --changed',
    '  a11y-shield scan --full --ci',
    '  a11y-shield fix --input reports/a11y/findings.json --mode preview',
    '  a11y-shield verify',
    '  a11y-shield twin:analyze --limit 25',
    '  a11y-shield twin:workpack --limit 20',
    '  a11y-shield twin:demo',
    '  a11y-shield dev:twin:demo',
    '  a11y-shield odt:run --withA11y --target-repo-path /Users/me/projects/journey-builder-js',
    '  a11y-shield odt:run --prompt-provider oci --oci-model-id ocid1.generativeaimodel.oc1..example --oci-compartment-id ocid1.compartment.oc1..example',
    '  a11y-shield odt:execute --dry-run --response-file reports/odt/execute/response-template.md',
    '  a11y-shield odt:autopilot --work-item feature --feature-name "Export Improvements" --withA11y'
  ].join('\n');
}

async function run(argv) {
  const { positional, options } = parseArgs(argv);
  const command = positional[0];

  if (!command || command === 'help' || command === '--help') {
    // eslint-disable-next-line no-console
    console.log(helpText());
    return;
  }

  if (command === 'scan') {
    await runScan(options);
    return;
  }

  if (command === 'fix') {
    await runFix(options);
    return;
  }

  if (command === 'verify') {
    await runVerify();
    return;
  }

  if (command === 'twin:analyze') {
    runTwinAnalyze(options);
    return;
  }

  if (command === 'twin:verify') {
    runTwinVerify();
    return;
  }

  if (command === 'twin:workpack') {
    runTwinWorkpack(options);
    return;
  }

  if (command === 'twin:demo') {
    await runTwinDemo();
    return;
  }

  if (command === 'dev:twin:init') {
    runDevTwinInit();
    return;
  }

  if (command === 'dev:twin:analyze') {
    runDevTwinAnalyze(options);
    return;
  }

  if (command === 'dev:twin:demo') {
    runDevTwinDemo();
    return;
  }

  if (command === 'odt:init') {
    runOdtInit();
    return;
  }

  if (command === 'odt:run') {
    await runOdt(options);
    return;
  }

  if (command === 'odt:status') {
    runOdtStatus();
    return;
  }

  if (command === 'odt:execute') {
    await runOdtExecute(options);
    return;
  }

  if (command === 'odt:autopilot') {
    await runOdtAutopilot(options);
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${helpText()}`);
}

module.exports = { run, helpText };
