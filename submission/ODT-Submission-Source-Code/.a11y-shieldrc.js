module.exports = {
  standard: {
    primary: 'Oracle VPAT guidance (internal Confluence source of truth)',
    fallback: 'WCAG 2.1 AA'
  },
  include: ['src/**/*.js', 'src/**/*.jsx'],
  exclude: [
    'tests/**/*.snap',
    'tests/**/__snapshots__/**',
    'coverage*/**',
    'node_modules/**'
  ],
  severityPolicy: {
    default: 'warn',
    ruleOverrides: {
      'custom/img-alt-required': 'blocker',
      'custom/button-accessible-name': 'blocker',
      'custom/form-control-label': 'blocker',
      'custom/click-keyboard-parity': 'blocker',
      'jsx-a11y/alt-text': 'blocker',
      'jsx-a11y/label-has-associated-control': 'blocker',
      'jsx-a11y/control-has-associated-label': 'blocker',
      'jsx-a11y/no-static-element-interactions': 'blocker',
      'jsx-a11y/click-events-have-key-events': 'blocker',
      'jsx-a11y/anchor-is-valid': 'warn',
      'custom/icon-a11y-label': 'blocker'
    }
  },
  terra: {
    iconPattern: '<Icon',
    requiredProps: ['a11yLabel', 'aria-label', 'aria-labelledby'],
    controlPatterns: ['terra-button', 'terra-form-input', 'terra-form-select', 'terra-form-textarea']
  }
};
