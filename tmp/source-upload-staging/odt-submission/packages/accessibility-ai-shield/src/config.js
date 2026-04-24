const path = require('path');

const defaultConfig = {
  standard: {
    primary: 'Oracle VPAT guidance',
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
      'jsx-a11y/anchor-is-valid': 'warn',
      'custom/icon-a11y-label': 'warn'
    }
  },
  terra: {
    iconPattern: '<Icon',
    requiredProps: ['a11yLabel', 'aria-label', 'aria-labelledby']
  }
};

function loadConfig() {
  const userConfigPath = path.resolve(process.cwd(), '.a11y-shieldrc.js');
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const userConfig = require(userConfigPath);
    return {
      ...defaultConfig,
      ...userConfig,
      severityPolicy: {
        ...defaultConfig.severityPolicy,
        ...(userConfig.severityPolicy || {}),
        ruleOverrides: {
          ...defaultConfig.severityPolicy.ruleOverrides,
          ...((userConfig.severityPolicy && userConfig.severityPolicy.ruleOverrides) || {})
        }
      }
    };
  } catch (error) {
    return defaultConfig;
  }
}

module.exports = { loadConfig, defaultConfig };
