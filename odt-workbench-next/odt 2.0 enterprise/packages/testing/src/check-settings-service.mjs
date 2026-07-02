import assert from 'node:assert/strict';
import { createSettingsService, isUnsafeSettingKey } from '../../../services/api/src/modules/settings/index.js';

const rows = new Map([
  ['executionAgent', { key: 'executionAgent', value: JSON.stringify('codex'), updatedAt: '2026-06-24T00:00:00.000Z' }]
]);

const settingsRepository = {
  listSettings() {
    return [...rows.values()].sort((left, right) => left.key.localeCompare(right.key));
  },
  getValue(key, fallback) {
    const row = rows.get(key);
    if (!row) return fallback;
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value || fallback;
    }
  },
  setMany(settings = {}, updatedAt = '2026-06-24T00:00:00.000Z') {
    Object.entries(settings).forEach(([key, value]) => {
      rows.set(key, { key, value: JSON.stringify(value), updatedAt });
    });
    return this.listSettings();
  }
};

const service = createSettingsService({
  settingsRepository,
  promptTemplateRepository: {
    list: () => [
      {
        id: 'guide-chat-v1',
        name: 'ODT Guide Chat',
        requestType: 'chat',
        version: 'v1'
      }
    ]
  },
  safeAiConfig: () => ({
    provider: 'local',
    providerReady: true
  }),
  listConnectors: () => [
    {
      id: 'jira',
      name: 'Jira',
      readiness: 'READY'
    }
  ],
  connectorConfig: {
    mcpEnabled: true
  },
  uploadPolicy: {
    maxFilesPerRequest: 10
  },
  workspaceDir: '/tmp/odt-workspaces',
  now: () => '2026-06-24T00:00:00.000Z'
});

const initialResponse = service.getSafeSettingsResponse();
assert.equal(initialResponse.ai.provider, 'local');
assert.equal(initialResponse.agentPolicy.selectedExecutionAgent, 'codex');
assert.deepEqual(initialResponse.agentPolicy.availableExecutionAgents, ['codex', 'cline', 'manual']);
assert.equal(initialResponse.intake.workspaceDir, '/tmp/odt-workspaces');
assert.equal(initialResponse.connectors[0].id, 'jira');
assert.equal(initialResponse.connectorPolicy.mcpEnabled, true);
assert.equal(initialResponse.promptTemplates[0].id, 'guide-chat-v1');
assert.equal(initialResponse.storedSettings.some((setting) => setting.key === 'executionAgent'), true);

const updatedResponse = service.updateSafeSettings({
  executionAgent: 'manual',
  selectedWorkerRole: 'reviewer'
});
assert.equal(service.getStoredSetting('executionAgent', 'codex'), 'manual');
assert.equal(updatedResponse.agentPolicy.selectedExecutionAgent, 'manual');
assert.equal(updatedResponse.storedSettings.some((setting) => setting.key === 'selectedWorkerRole'), true);

assert.equal(isUnsafeSettingKey('apiToken'), true);
assert.equal(isUnsafeSettingKey('displayMode'), false);
assert.throws(
  () => service.updateSafeSettings({ apiToken: 'do-not-store' }),
  /Refusing to store secret-like setting "apiToken"/
);
assert.equal(service.getStoredSetting('apiToken', 'missing'), 'missing');

console.log('Settings service check passed.');
