import React, { useState } from 'react';
import {
  InfoList,
  PageHeader,
  Panel,
  SimpleTable,
  StatusBadge
} from '../../primitives/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`MonitoringPage requires ${name}`);
  }
  return value;
}

export function MonitoringPage({
  data,
  setActivePage,
  actions = {},
  helpers = {}
}) {
  const postJson = requireDependency(actions.postJson, 'actions.postJson');
  const activeAssignmentId = requireDependency(helpers.activeAssignmentId, 'helpers.activeAssignmentId');
  const activeWorkKey = requireDependency(helpers.activeWorkKey, 'helpers.activeWorkKey');
  const shortId = requireDependency(helpers.shortId, 'helpers.shortId');
  const titleCase = requireDependency(helpers.titleCase, 'helpers.titleCase');
  const formatTime = requireDependency(helpers.formatTime, 'helpers.formatTime');
  const validationTone = requireDependency(helpers.validationTone, 'helpers.validationTone');
  const monitoringSeverityTone = requireDependency(helpers.monitoringSeverityTone, 'helpers.monitoringSeverityTone');
  const toneFor = requireDependency(helpers.toneFor, 'helpers.toneFor');
  const navigate = requireDependency(setActivePage, 'setActivePage');

  const assignmentId = activeAssignmentId(data);
  const summary = data.usage.summary || {};
  const events = data.usage.events || [];
  const errorSummary = data.errorLog?.summary || {};
  const errorItems = data.errorLog?.items || [];
  const validationRuns = data.validation?.runs || [];
  const latestValidation = validationRuns[0];
  const activeIssueKey = activeWorkKey(data) || 'Active assignment';
  const [validationBusy, setValidationBusy] = useState(false);
  const [validationNotice, setValidationNotice] = useState('');
  const [healthBusy, setHealthBusy] = useState('');
  const [healthNotice, setHealthNotice] = useState('');

  async function runUiSmokeValidation() {
    setValidationBusy(true);
    setValidationNotice('');
    try {
      const result = await postJson('/api/validation/ui-smoke', {
        assignmentId
      });
      setValidationNotice(result.passed
        ? `UI smoke passed for ${result.expectedIssue || 'the active assignment'}. Evidence was added to ${shortId(result.runId)}.`
        : `UI smoke failed for ${result.expectedIssue || 'the active assignment'}. Review the captured output below.`);
      await data.refresh();
    } catch (err) {
      setValidationNotice(err.message || 'Unable to run UI smoke validation.');
    } finally {
      setValidationBusy(false);
    }
  }

  function openHealthItem(item) {
    if (item.runId && data.setSelectedRunId) data.setSelectedRunId(item.runId);
    navigate(item.page || (item.runId ? 'runs' : 'monitoring'));
  }

  async function retryHealthConnector(item) {
    const connectorId = item.meta?.connectorId || item.sourceId || 'jira';
    const issueKey = item.meta?.issueKey || activeIssueKey;
    setHealthBusy(item.id);
    setHealthNotice('');
    try {
      const result = await postJson('/api/connectors/query', {
        connectorId,
        action: connectorId === 'jira' && issueKey ? 'read-issue' : 'readiness-test',
        mode: 'read',
        assignmentId,
        issueKey
      });
      setHealthNotice(connectorId === 'jira' && result.issue
        ? `Jira read passed for ${result.issue.key}: ${result.issue.summary || 'issue loaded'}.`
        : `${titleCase(connectorId)} read gate passed.`);
      await data.refresh();
    } catch (err) {
      setHealthNotice(`${titleCase(connectorId)} retry still needs attention: ${err.message || 'request failed'}`);
      await data.refresh();
    } finally {
      setHealthBusy('');
    }
  }

  async function refreshHealthWorker(item) {
    const workerRunId = item.meta?.workerRunId || '';
    if (!workerRunId) {
      openHealthItem({ ...item, page: 'team' });
      return;
    }
    setHealthBusy(item.id);
    setHealthNotice('');
    try {
      const result = await postJson(`/api/agents/worker-runs/${encodeURIComponent(workerRunId)}/status`, {
        assignmentId
      });
      const worker = result.workerRun || {};
      setHealthNotice(`${worker.workerRoleLabel || 'Worker'} refreshed: ${titleCase(worker.status || 'unknown')}.`);
      await data.refresh();
    } catch (err) {
      setHealthNotice(`Worker refresh needs attention: ${err.message || 'request failed'}`);
      await data.refresh();
    } finally {
      setHealthBusy('');
    }
  }

  async function rerunHealthValidation(item) {
    setHealthBusy(item.id);
    setHealthNotice('');
    try {
      await runUiSmokeValidation();
      setHealthNotice('UI smoke validation rerun completed. Review the ODT Validation result below.');
    } finally {
      setHealthBusy('');
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Monitoring"
        title="AI usage, latency, errors, and fallback visibility"
        copy="Every AI request is tracked for cost awareness, debugging, and future enterprise governance."
      />
      <div className="metric-grid">
        <MetricCard label="Requests" value={summary.requestsToday || 0} detail="Today" tone="info" />
        <MetricCard label="Avg Latency" value={`${summary.avgLatencyMs || 0} ms`} detail="Today" tone="success" />
        <MetricCard label="Total Tokens" value={summary.totalTokensToday || 0} detail="Today" tone="accent" />
        <MetricCard label="Errors" value={summary.errorsToday || 0} detail="Today" tone={summary.errorsToday ? 'danger' : 'success'} />
      </div>

      <Panel title="Error & Health Log" eyebrow="Operator View">
        <div className="health-log-summary">
          <div>
            <StatusBadge
              label={titleCase(errorSummary.status || 'healthy')}
              tone={monitoringSeverityTone(errorSummary.status)}
            />
            <strong>{errorSummary.needsAttention || 0} item{errorSummary.needsAttention === 1 ? '' : 's'} need attention</strong>
            <span>{errorSummary.latestAt ? `Latest signal ${formatTime(errorSummary.latestAt)}` : 'No active error, blocker, or warning signals detected.'}</span>
          </div>
          <div className="health-log-counts">
            <span><strong>{errorSummary.critical || 0}</strong>Critical</span>
            <span><strong>{errorSummary.blocked || 0}</strong>Blocked</span>
            <span><strong>{errorSummary.warning || 0}</strong>Warning</span>
            <span><strong>{errorSummary.resolved || 0}</strong>Resolved</span>
          </div>
        </div>

        {healthNotice ? <div className="info-banner">{healthNotice}</div> : null}

        <SimpleTable
          columns={['Time', 'Source', 'Severity', 'Status', 'Issue', 'Action']}
          rows={errorItems.map((item) => [
            formatTime(item.createdAt),
            item.source,
            <StatusBadge label={titleCase(item.severity)} tone={monitoringSeverityTone(item.severity)} />,
            <StatusBadge label={titleCase(item.status)} tone={monitoringSeverityTone(item.status || item.severity)} />,
            <div className="health-log-issue">
              <strong>{item.title}</strong>
              <span>{item.message}</span>
              {item.resolutionReason ? <span>{item.resolutionReason}</span> : null}
            </div>,
            <div className="health-log-action">
              <span>{item.action}</span>
              <HealthLogActions
                item={item}
                busy={healthBusy === item.id}
                onOpen={() => openHealthItem(item)}
                onRetryConnector={() => retryHealthConnector(item)}
                onRerunValidation={() => rerunHealthValidation(item)}
                onRefreshWorker={() => refreshHealthWorker(item)}
                titleCase={titleCase}
              />
            </div>
          ])}
          empty="No active error, blocker, warning, connector, worker, validation, or review signals found."
        />
      </Panel>

      <Panel title="ODT Validation" eyebrow="Self Check">
        <div className="validation-card">
          <div className="validation-card-lead">
            <div>
              <StatusBadge
                label={latestValidation ? titleCase(latestValidation.status) : 'Not Run'}
                tone={validationTone(latestValidation?.status)}
              />
              <h4>Run governed UI smoke validation</h4>
              <p>
                Confirms the current ODT workflow screens render the active Jira verification context, hide stale evidence, and keep write delegation blocked until governed rework exists.
              </p>
            </div>
            <button className="primary-button" type="button" onClick={runUiSmokeValidation} disabled={validationBusy}>
              {validationBusy ? 'Running...' : 'Run UI Smoke'}
            </button>
          </div>

          {validationNotice ? <div className="info-banner">{validationNotice}</div> : null}

          {latestValidation ? (
            <>
              <InfoList
                items={[
                  ['Last Run', shortId(latestValidation.runId)],
                  ['Issue', latestValidation.expectedIssue || 'Active assignment'],
                  ['Updated', formatTime(latestValidation.updatedAt)],
                  ['Exit Code', latestValidation.exitCode ?? 0]
                ]}
              />

              {latestValidation.screenshots?.length ? (
                <div className="validation-screenshots">
                  {latestValidation.screenshots.map((item) => (
                    <div className="validation-screenshot-path" key={`${latestValidation.runId}-${item.name}`}>
                      <strong>{titleCase(item.name)}</strong>
                      <code>{item.screenshotPath}</code>
                    </div>
                  ))}
                </div>
              ) : null}

              {latestValidation.stderr ? (
                <pre className="validation-output">{latestValidation.stderr}</pre>
              ) : null}
            </>
          ) : (
            <div className="empty-state">No validation run has been recorded yet. Run the self-check after major ODT workflow changes.</div>
          )}
        </div>

        <SimpleTable
          columns={['Time', 'Run', 'Issue', 'Status', 'Screenshots']}
          rows={validationRuns.slice(0, 6).map((run) => [
            formatTime(run.updatedAt),
            shortId(run.runId),
            run.expectedIssue || 'Active',
            <StatusBadge label={titleCase(run.status)} tone={validationTone(run.status)} />,
            run.screenshots?.length || 0
          ])}
          empty="No validation history yet."
        />
      </Panel>

      <Panel title="Usage Events" eyebrow="Audit">
        <SimpleTable
          columns={['Time', 'Type', 'Provider', 'Model', 'Tokens', 'Latency', 'Sources', 'Fallback', 'Status']}
          rows={events.map((event) => [
            formatTime(event.createdAt),
            event.requestType,
            event.provider,
            event.model,
            event.totalTokens,
            `${event.latencyMs} ms`,
            event.sources?.length ? `${event.sources.length} source${event.sources.length === 1 ? '' : 's'}` : 'None',
            event.fallbackUsed ? <StatusBadge label="Yes" tone="warning" /> : <StatusBadge label="No" tone="success" />,
            <StatusBadge label={titleCase(event.status)} tone={toneFor(event.status)} />
          ])}
          empty="No AI usage events yet. Ask ODT Guide a question to create one."
        />
      </Panel>
    </div>
  );
}

function HealthLogActions({
  item,
  busy,
  onOpen,
  onRetryConnector,
  onRerunValidation,
  onRefreshWorker,
  titleCase
}) {
  const source = String(item.source || '').toLowerCase();
  const resolved = item.resolutionStatus === 'resolved' || String(item.status || '').toLowerCase() === 'resolved';
  const pageLabel = item.runId ? 'Run' : item.page ? titleCase(item.page) : 'Details';
  const canRetryConnector = source.includes('connector') && !resolved;
  const canRerunValidation = source.includes('validation') && !resolved;
  const canRefreshWorker = source.includes('agent worker') && !resolved;
  return (
    <div className="health-log-actions">
      {item.page || item.runId ? <StatusBadge label={pageLabel} tone="neutral" /> : null}
      <div className="health-log-button-row">
        {(item.page || item.runId) ? (
          <button className="table-button" type="button" onClick={onOpen} disabled={busy}>
            Open {pageLabel}
          </button>
        ) : null}
        {canRetryConnector ? (
          <button className="table-button" type="button" onClick={onRetryConnector} disabled={busy}>
            {busy ? 'Retrying...' : 'Retry Read'}
          </button>
        ) : null}
        {canRerunValidation ? (
          <button className="table-button" type="button" onClick={onRerunValidation} disabled={busy}>
            {busy ? 'Running...' : 'Rerun Smoke'}
          </button>
        ) : null}
        {canRefreshWorker ? (
          <button className="table-button" type="button" onClick={onRefreshWorker} disabled={busy}>
            {busy ? 'Refreshing...' : 'Refresh Worker'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail, tone }) {
  return (
    <section className={`metric-card ${tone || 'neutral'}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </section>
  );
}
