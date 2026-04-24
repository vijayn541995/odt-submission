const { writeSnapshot, serveLocalContext } = require('./local-context');

function usage() {
  return [
    'Usage: delivery-copilot <command> [options]',
    '',
    'Commands:',
    '  mcp:req summarize --wiki <url>',
    '  mcp:jira create-subtasks --project <key> --from <requirements.json>',
    '  mcp:local snapshot [--out reports/mcp/local-context.json] [--workspace-root /path/to/odt]',
    '  mcp:local serve [--host 127.0.0.1] [--port 4310] [--workspace-root /path/to/odt] [--target-repo-path /path/to/repo]',
    '',
    'Note: This is a Phase-2 scaffold. Integrations are intentionally stubbed until credentials + MCP adapters are configured.'
  ].join('\n');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      args[token.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function summarizeRequirement(args) {
  if (!args.wiki) {
    throw new Error('Missing --wiki URL for mcp:req summarize.');
  }
  const payload = {
    command: 'mcp:req summarize',
    wiki: args.wiki,
    status: 'stubbed',
    nextStep: 'Connect MCP adapter for wiki ingestion and requirement extraction.'
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload, null, 2));
}

async function createSubtasks(args) {
  if (!args.project || !args.from) {
    throw new Error('Missing --project or --from for mcp:jira create-subtasks.');
  }
  const payload = {
    command: 'mcp:jira create-subtasks',
    project: args.project,
    from: args.from,
    status: 'stubbed',
    nextStep: 'Connect MCP adapter for Jira create issue APIs + templates.'
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload, null, 2));
}

async function snapshotLocalContext(args) {
  const result = writeSnapshot(args.out, args);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    command: 'mcp:local snapshot',
    status: 'ok',
    output: result.output,
    available: result.payload.available
  }, null, 2));
}

async function serveContext(args) {
  serveLocalContext(args);
}

async function run(argv) {
  const cmd = argv[0];
  const subcmd = argv[1];
  const args = parseArgs(argv.slice(2));

  if (!cmd || cmd === 'help' || cmd === '--help') {
    // eslint-disable-next-line no-console
    console.log(usage());
    return;
  }

  if (cmd === 'mcp:req' && subcmd === 'summarize') {
    await summarizeRequirement(args);
    return;
  }

  if (cmd === 'mcp:jira' && subcmd === 'create-subtasks') {
    await createSubtasks(args);
    return;
  }

  if (cmd === 'mcp:local' && subcmd === 'snapshot') {
    await snapshotLocalContext(args);
    return;
  }

  if (cmd === 'mcp:local' && subcmd === 'serve') {
    await serveContext(args);
    return;
  }

  throw new Error(`Unknown command: ${cmd} ${subcmd || ''}\n\n${usage()}`);
}

module.exports = { run, usage };
