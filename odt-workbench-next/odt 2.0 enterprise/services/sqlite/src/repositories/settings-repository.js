const REQUIRED_STATEMENTS = [
  ['selectSettings', 'all'],
  ['upsertSetting', 'run']
];

function requireStatement(statements = {}, name = '', method = '') {
  const statement = statements[name];
  if (!statement || typeof statement[method] !== 'function') {
    throw new TypeError(`settings repository requires statements.${name}.${method}(...)`);
  }
  return statement;
}

function stringifyJson(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  return JSON.stringify(value);
}

function parseSettingValue(value, fallback) {
  if (value === undefined || value === null) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return value || fallback;
  }
}

export function createSettingsRepository({ statements } = {}) {
  if (!statements) {
    throw new TypeError('createSettingsRepository requires statements');
  }
  REQUIRED_STATEMENTS.forEach(([name, method]) => requireStatement(statements, name, method));

  const listSettings = () => statements.selectSettings.all();

  return {
    listSettings,
    getValue(key, fallback) {
      const setting = listSettings().find((item) => item.key === key);
      if (!setting) return fallback;
      return parseSettingValue(setting.value, fallback);
    },
    setValue(key, value, updatedAt = new Date().toISOString()) {
      statements.upsertSetting.run(key, stringifyJson(value), updatedAt);
      return listSettings().find((item) => item.key === key) || null;
    },
    setMany(settings = {}, updatedAt = new Date().toISOString()) {
      Object.entries(settings).forEach(([key, value]) => {
        statements.upsertSetting.run(key, stringifyJson(value), updatedAt);
      });
      return listSettings();
    }
  };
}
