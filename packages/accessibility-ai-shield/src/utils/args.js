function parseArgs(argv) {
  const options = {};
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const [key, inlineValue] = token.split('=');
      if (inlineValue !== undefined) {
        options[key.replace('--', '')] = inlineValue;
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          options[key.replace('--', '')] = next;
          i += 1;
        } else {
          options[key.replace('--', '')] = true;
        }
      }
    } else {
      positional.push(token);
    }
  }

  return { positional, options };
}

module.exports = { parseArgs };
