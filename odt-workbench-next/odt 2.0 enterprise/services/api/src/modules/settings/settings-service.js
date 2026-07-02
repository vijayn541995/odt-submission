const DEFAULT_EXECUTION_AGENTS = ['codex', 'cline', 'manual'];

export function isUnsafeSettingKey(key) {
  return /(secret|token|key|password|private|fingerprint|ocid|compartment|tenancy|profile|credential|bearer)/i.test(String(key || ''));
}

export function createSettingsService({
  settingsRepository,
  promptTemplateRepository,
  safeAiConfig,
  listConnectors,
  connectorConfig = {},
  uploadPolicy,
  workspaceDir,
  now = () => new Date().toISOString()
} = {}) {
  if (!settingsRepository) {
    throw new TypeError('createSettingsService requires settingsRepository');
  }
  if (!promptTemplateRepository) {
    throw new TypeError('createSettingsService requires promptTemplateRepository');
  }
  if (typeof safeAiConfig !== 'function') {
    throw new TypeError('createSettingsService requires safeAiConfig()');
  }
  if (typeof listConnectors !== 'function') {
    throw new TypeError('createSettingsService requires listConnectors()');
  }

  const getStoredSetting = (key, fallback) => settingsRepository.getValue(key, fallback);

  function getSafeSettingsResponse() {
    const executionAgent = getStoredSetting('executionAgent', 'codex');
    return {
      ai: safeAiConfig(),
      agentPolicy: {
        selectedExecutionAgent: executionAgent,
        availableExecutionAgents: DEFAULT_EXECUTION_AGENTS,
        defaultMode: 'read-only',
        writeActions: 'Require explicit human approval',
        dependencyInstalls: 'Blocked until dependency approval is captured'
      },
      intake: {
        uploadPolicy,
        workspaceDir,
        storageNote: 'Context uploads are stored in the ODT workspace and never copied into target repos automatically.'
      },
      connectors: listConnectors(),
      connectorPolicy: {
        mcpEnabled: connectorConfig.mcpEnabled,
        readActions: 'Allowed only when connector is configured and enabled',
        writeActions: 'Require explicit human approval',
        destructiveActions: 'Blocked by default'
      },
      promptTemplates: promptTemplateRepository.list(),
      storedSettings: settingsRepository.listSettings()
    };
  }

  function updateSafeSettings(settings = {}) {
    const unsafeKey = Object.keys(settings).find(isUnsafeSettingKey);
    if (unsafeKey) {
      const error = new Error(`Refusing to store secret-like setting "${unsafeKey}" from frontend.`);
      error.statusCode = 400;
      throw error;
    }
    settingsRepository.setMany(settings, now());
    return getSafeSettingsResponse();
  }

  return {
    getStoredSetting,
    getSafeSettingsResponse,
    updateSafeSettings
  };
}
