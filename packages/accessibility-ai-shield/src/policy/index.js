const policy = require('./oracle-vpat-policy.json');

const RULE_TO_POLICY = {
  'custom/img-alt-required': {
    criterion: '1.1.1',
    title: 'Non-text content alternatives',
    priority: 'high'
  },
  'custom/button-accessible-name': {
    criterion: '4.1.2',
    title: 'Name, Role, Value',
    priority: 'high'
  },
  'custom/form-control-label': {
    criterion: '3.3.2',
    title: 'Labels or Instructions',
    priority: 'high'
  },
  'custom/click-keyboard-parity': {
    criterion: '2.1.1',
    title: 'Keyboard accessibility',
    priority: 'high'
  },
  'custom/icon-a11y-label': {
    criterion: '1.1.1',
    title: 'Non-text content alternatives',
    priority: 'high'
  },
  'jsx-a11y/alt-text': {
    criterion: '1.1.1',
    title: 'Non-text content alternatives',
    priority: 'high'
  },
  'jsx-a11y/label-has-associated-control': {
    criterion: '1.3.1',
    title: 'Info and Relationships',
    priority: 'high'
  },
  'jsx-a11y/control-has-associated-label': {
    criterion: '3.3.2',
    title: 'Labels or Instructions',
    priority: 'high'
  },
  'jsx-a11y/no-static-element-interactions': {
    criterion: '2.1.1',
    title: 'Keyboard accessibility',
    priority: 'high'
  },
  'jsx-a11y/click-events-have-key-events': {
    criterion: '2.1.1',
    title: 'Keyboard accessibility',
    priority: 'high'
  },
  'jsx-a11y/anchor-is-valid': {
    criterion: '2.4.3',
    title: 'Focus order',
    priority: 'moderate'
  }
};

function enrichFindingWithPolicy(finding) {
  const mapped = RULE_TO_POLICY[finding.ruleId];
  if (!mapped) return finding;

  return {
    ...finding,
    policyCriterion: mapped.criterion,
    policyTitle: mapped.title,
    policyPriority: mapped.priority
  };
}

function buildManualChecklistMarkdown() {
  const criticalManual = (policy.critical || []).filter((item) => !item.autoDetectable);
  const highManual = (policy.high || []).filter((item) => !item.autoDetectable);
  const moderateManual = (policy.moderate || []).filter((item) => !item.autoDetectable);

  const lines = [
    '# Accessibility Manual Checklist (Oracle VPAT)',
    '',
    'These items are not reliably detectable with static scanning and require manual testing evidence.',
    '',
    '## Critical (Release Blockers)',
    ...toChecklistLines(criticalManual),
    '',
    '## High (Strongly Enforced)',
    ...toChecklistLines(highManual),
    '',
    '## Moderate',
    ...toChecklistLines(moderateManual),
    ''
  ];

  return lines.join('\n');
}

function toChecklistLines(items) {
  if (!items.length) {
    return ['- None'];
  }

  return items.map((item) => `- [ ] ${item.criterion} ${item.title}`);
}

module.exports = {
  policy,
  enrichFindingWithPolicy,
  buildManualChecklistMarkdown
};
