import React, { useEffect, useState } from 'react';
import {
  InfoList,
  PageHeader,
  Panel,
  StatusBadge
} from '../../primitives/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`SettingsPage requires ${name}`);
  }
  return value;
}

export function SettingsPage({
  data,
  apiBase,
  helpers = {}
}) {
  const activeAssignmentId = requireDependency(helpers.activeAssignmentId, 'helpers.activeAssignmentId');
  const activeWorkKey = requireDependency(helpers.activeWorkKey, 'helpers.activeWorkKey');
  const getStoredSetting = requireDependency(helpers.getStoredSetting, 'helpers.getStoredSetting');
  const titleCase = requireDependency(helpers.titleCase, 'helpers.titleCase');
  const formatBytes = requireDependency(helpers.formatBytes, 'helpers.formatBytes');

  const assignmentId = activeAssignmentId(data);
  const currentWorkKey = activeWorkKey(data);
  const ai = data.settings?.ai || data.snapshot?.ai || {};
  const connectors = data.settings?.connectors || [];
  const executionAgent = getStoredSetting(data, 'executionAgent', 'codex');
  const [connectorNotice, setConnectorNotice] = useState('');
  const [connectorResults, setConnectorResults] = useState({});
  const [busyConnector, setBusyConnector] = useState('');
  const [jiraIssueKey, setJiraIssueKey] = useState(currentWorkKey);
  const readyConnectors = connectors.filter((connector) => connector.readiness === 'READY').length;
  const degradedConnectors = connectors.filter((connector) => connector.readiness === 'DEGRADED').length;
  const configuredConnectors = connectors.filter((connector) => connector.featureEnabled || connector.serverConfigured).length;

  useEffect(() => {
    if (!currentWorkKey) return;
    setJiraIssueKey((current) => current || currentWorkKey);
  }, [currentWorkKey]);

  async function queryConnector(connector, payload) {
    const response = await fetch(`${apiBase}/api/connectors/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectorId: connector.id,
        mode: 'read',
        assignmentId,
        ...payload
      })
    });
    const result = await response.json();
    return { response, result };
  }

  async function testConnectorRead(connector) {
    setBusyConnector(connector.id);
    setConnectorNotice('');
    setConnectorResults((previous) => ({
      ...previous,
      [connector.id]: {
        tone: 'info',
        message: `${connector.label}: testing read gate...`
      }
    }));
    try {
      const { response, result } = await queryConnector(connector, {
        action: 'readiness-test'
      });
      const message = !response.ok
        ? `${connector.label}: ${result.reason || 'Read gate blocked.'}`
        : `${connector.label}: read gate passed. ${result.note || 'Connector gateway is governed.'}`;
      if (!response.ok) {
        setConnectorNotice(message);
        setConnectorResults((previous) => ({
          ...previous,
          [connector.id]: {
            tone: result.status === 'approval_required' ? 'warning' : 'blocked',
            message
          }
        }));
      } else {
        setConnectorNotice(message);
        setConnectorResults((previous) => ({
          ...previous,
          [connector.id]: {
            tone: 'success',
            message
          }
        }));
      }
      await data.refresh();
    } catch (err) {
      const message = `${connector.label}: ${err.message || 'Unable to test connector.'}`;
      setConnectorNotice(message);
      setConnectorResults((previous) => ({
        ...previous,
        [connector.id]: {
          tone: 'blocked',
          message
        }
      }));
    } finally {
      setBusyConnector('');
    }
  }

  async function readJiraIssue(connector) {
    const issueKey = jiraIssueKey.trim();
    setBusyConnector(connector.id);
    setConnectorNotice('');
    setConnectorResults((previous) => ({
      ...previous,
      [connector.id]: {
        tone: 'info',
        message: `${connector.label}: reading ${issueKey || 'Jira issue'}...`
      }
    }));
    try {
      const { response, result } = await queryConnector(connector, {
        action: 'get-issue',
        issueKey
      });
      if (!response.ok) {
        const message = `${connector.label}: ${result.reason || result.detail?.reason || 'Issue read blocked.'}`;
        setConnectorNotice(message);
        setConnectorResults((previous) => ({
          ...previous,
          [connector.id]: {
            tone: result.status === 'approval_required' ? 'warning' : 'blocked',
            message
          }
        }));
      } else {
        const issue = result.issue || {};
        const message = `${issue.key}: ${issue.summary || 'Jira issue loaded'} (${issue.status || 'status unknown'})`;
        setConnectorNotice(`${connector.label}: read-only issue lookup passed.`);
        setConnectorResults((previous) => ({
          ...previous,
          [connector.id]: {
            tone: 'success',
            message,
            issue
          }
        }));
      }
      await data.refresh();
    } catch (err) {
      const message = `${connector.label}: ${err.message || 'Unable to read Jira issue.'}`;
      setConnectorNotice(message);
      setConnectorResults((previous) => ({
        ...previous,
        [connector.id]: {
          tone: 'blocked',
          message
        }
      }));
    } finally {
      setBusyConnector('');
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Settings"
        title="Safe configuration status"
        copy="This page shows only non-secret runtime state. OCI credentials, OCIDs, keys, tokens, and raw profiles stay server-side."
      />
      <div className="two-column">
        <Panel title="AI Provider" eyebrow="Backend-Owned">
          <InfoList
            items={[
              ['Mode', ai.provider || 'local'],
              ['Provider ready', ai.providerReady ? 'Ready' : 'Local fallback'],
              ['Provider status', ai.providerStatus || 'Local deterministic RAG is active.'],
              ['Active model', ai.model || 'local-guide-model'],
              ['OCI region', ai.region || 'not configured'],
              ['GenAI endpoint', ai.genAiEndpointConfigured ? 'Configured' : 'Missing'],
              ['Compartment', ai.compartmentConfigured ? 'Configured server-side' : 'Missing'],
              ['OCI auth', ai.ociAuthConfigured ? 'Configured server-side' : 'Missing'],
              ['OCI OpenAI-compatible', ai.ociOpenAiCompatible ? 'Enabled' : 'Not enabled'],
              ['OpenAI key', ai.openAiApiKeyConfigured ? 'Configured server-side' : 'Missing'],
              ['Ollama endpoint', ai.ollamaBaseUrlConfigured ? 'Configured server-side' : 'Missing'],
              ['Chat model', ai.chatModelConfigured ? 'Configured server-side' : 'Local fallback'],
              ['Embed model', ai.embedModelConfigured ? 'Configured server-side' : 'Local placeholder'],
              ['Agent endpoint', ai.agentEndpointConfigured ? 'Configured' : 'Disabled'],
              ['Execution agent', titleCase(executionAgent)],
              ['RAG', ai.ragEnabled ? 'Local evidence corpus' : 'Disabled'],
              ['RAG mode', ai.ragMode || 'local-keyword-rag']
            ]}
          />
        </Panel>
        <Panel title="Limits" eyebrow="Application Guardrails">
          <InfoList
            items={[
              ['Requests per minute', ai.limits?.maxRequestsPerMinute],
              ['Requests per user/day', ai.limits?.maxRequestsPerUserPerDay],
              ['Max input chars', ai.limits?.maxInputChars],
              ['Max output tokens', ai.limits?.maxOutputTokens],
              ['Timeout', `${ai.limits?.requestTimeoutMs || 0} ms`],
              ['Retry count', ai.limits?.retryCount]
            ]}
          />
        </Panel>
      </div>
      <Panel title="Context Intake Limits" eyebrow="Workspace Storage">
        <InfoList
          items={[
            ['Max files/request', data.uploadPolicy?.uploadPolicy?.maxFilesPerRequest],
            ['Max per file', formatBytes(data.uploadPolicy?.uploadPolicy?.maxFileBytes)],
            ['Max batch', formatBytes(data.uploadPolicy?.uploadPolicy?.maxBatchBytes)],
            ['Workspace', data.uploadPolicy?.workspaceDir || 'Missing']
          ]}
        />
        <p className="muted-copy">{data.uploadPolicy?.storageNote || 'Uploaded context is copied into the ODT workspace and target repos remain untouched.'}</p>
      </Panel>
      <Panel title="Connector Hub" eyebrow="Oracle Internal Readiness">
        <div className="connector-summary">
          <StatusBadge label={`${readyConnectors}/${connectors.length} ready`} tone={readyConnectors ? 'success' : 'warning'} />
          {degradedConnectors ? <StatusBadge label={`${degradedConnectors} degraded`} tone="warning" /> : null}
          <StatusBadge label={`${configuredConnectors} partially configured`} tone={configuredConnectors ? 'info' : 'neutral'} />
          <StatusBadge label="Writes approval-gated" tone="warning" />
          <StatusBadge label="Destructive blocked" tone="danger" />
        </div>
        <p className="muted-copy">ODT treats internal connectors as read-first SDLC evidence sources. A connector is ready when ODT finds safe MCP metadata from environment variables or the local Codex MCP config. Write-capable actions still require human approval.</p>
        {connectorNotice ? <div className="info-banner" role="status">{connectorNotice}</div> : null}
        <div className="connector-hub-grid">
          {connectors.map((connector) => {
            const connectorResult = connectorResults[connector.id];

            return (
              <section className="connector-card" key={connector.id}>
                <div className="connector-card-head">
                  <div>
                    <span className="eyebrow">{connector.phaseFit || 'Governed connector'}</span>
                    <h4>{connector.label}</h4>
                  </div>
                  <StatusBadge
                    label={titleCase(connector.readiness || 'Disabled')}
                    tone={connector.readiness === 'READY' ? 'success' : 'warning'}
                    title={connector.readinessDetail}
                  />
                </div>
                <p>{connector.description || 'Governed internal connector.'}</p>
                <InfoList
                  items={[
                    ['Global MCP', connector.mcpEnabled ? `Enabled${connector.mcpSource === 'codex-config' ? ' via Codex config' : ''}` : 'Missing ENABLE_MCP'],
                    ['Connector flag', connector.featureEnabled ? 'Enabled' : 'Missing connector flag'],
                    ['Server', connector.serverConfigured ? connector.serverName || 'Configured' : 'Missing server name'],
                    ['Config source', connector.configurationSource === 'codex-config' ? 'Codex MCP config' : titleCase(connector.configurationSource || 'not configured')],
                    ['Mode', connector.readOnly ? 'Read-only' : 'Read/write'],
                    ['Write actions', connector.requireWriteApproval ? 'Approval required' : 'Not allowed']
                  ]}
                />
                {connector.readiness === 'DEGRADED' ? (
                  <div className="connector-test-result warning">
                    <strong>Live check degraded.</strong> {connector.readinessDetail}
                  </div>
                ) : null}
                {connector.missingConfig?.length ? (
                  <div className="missing-config">
                    <strong>Missing config</strong>
                    <span>{connector.missingConfig.join(', ')}</span>
                  </div>
                ) : null}
                <div className="button-row">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => testConnectorRead(connector)}
                    disabled={busyConnector === connector.id}
                  >
                    {busyConnector === connector.id ? 'Testing' : 'Test Read Gate'}
                  </button>
                </div>
                {connector.id === 'jira' ? (
                  <div className="connector-query-control">
                    <label htmlFor="jira-issue-key">Read Jira issue through Jira2</label>
                    <div className="connector-query-row">
                      <input
                        id="jira-issue-key"
                        type="text"
                        value={jiraIssueKey}
                        onChange={(event) => setJiraIssueKey(event.target.value)}
                        placeholder={currentWorkKey || 'PROJECT-12345'}
                      />
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => readJiraIssue(connector)}
                        disabled={busyConnector === connector.id || !jiraIssueKey.trim()}
                      >
                        {busyConnector === connector.id ? 'Reading' : 'Read Issue'}
                      </button>
                    </div>
                  </div>
                ) : null}
                {connectorResult ? (
                  <div className={`connector-test-result ${connectorResult.tone}`}>
                    {connectorResult.message}
                    {connectorResult.issue ? (
                      <div className="connector-issue-preview">
                        <span><strong>Status</strong>{connectorResult.issue.status || 'Unknown'}</span>
                        <span><strong>Type</strong>{connectorResult.issue.issueType || 'Issue'}</span>
                        <span><strong>Priority</strong>{connectorResult.issue.priority || 'None'}</span>
                        <span><strong>Assignee</strong>{connectorResult.issue.assignee || 'Unassigned'}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
