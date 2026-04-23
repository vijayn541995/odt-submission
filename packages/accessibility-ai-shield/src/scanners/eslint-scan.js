const { execFileSync } = require('child_process');

function parseEslintJson(raw) {
  try {
    const result = JSON.parse(raw);
    const findings = [];

    result.forEach((entry) => {
      (entry.messages || []).forEach((message) => {
        if (!message.ruleId || !message.ruleId.startsWith('jsx-a11y/')) return;
        findings.push({
          ruleId: message.ruleId,
          wcagRef: mapRuleToWcag(message.ruleId),
          severity: message.severity === 2 ? 'blocker' : 'warn',
          file: entry.filePath,
          line: message.line || 1,
          message: message.message,
          suggestedFix: suggestionForRule(message.ruleId)
        });
      });
    });

    return findings;
  } catch (error) {
    return [];
  }
}

function mapRuleToWcag(ruleId) {
  const mapping = {
    'jsx-a11y/alt-text': '1.1.1',
    'jsx-a11y/label-has-associated-control': '1.3.1',
    'jsx-a11y/control-has-associated-label': '1.3.1',
    'jsx-a11y/no-static-element-interactions': '2.1.1',
    'jsx-a11y/click-events-have-key-events': '2.1.1',
    'jsx-a11y/anchor-is-valid': '2.4.4'
  };
  return mapping[ruleId] || 'WCAG-REF';
}

function suggestionForRule(ruleId) {
  const suggestions = {
    'jsx-a11y/alt-text': 'Add meaningful alt text or empty alt for decorative image.',
    'jsx-a11y/label-has-associated-control': 'Associate label and form control via htmlFor/id or aria-labelledby.',
    'jsx-a11y/control-has-associated-label': 'Provide aria-label/aria-labelledby or visible label text.',
    'jsx-a11y/no-static-element-interactions': 'Use semantic interactive elements or add keyboard semantics.',
    'jsx-a11y/click-events-have-key-events': 'Add keyboard handlers for click interactions.',
    'jsx-a11y/anchor-is-valid': 'Use valid navigation href or button semantics for actions.'
  };
  return suggestions[ruleId] || 'Apply WCAG-compliant semantic markup for this control.';
}

function runEslintScan(files) {
  if (!files.length) return [];
  try {
    const raw = execFileSync('npx', ['eslint', '-f', 'json', ...files], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return parseEslintJson(raw);
  } catch (error) {
    const output = `${error.stdout || '[]'}`;
    return parseEslintJson(output);
  }
}

module.exports = {
  runEslintScan,
  parseEslintJson,
  mapRuleToWcag,
  suggestionForRule
};
