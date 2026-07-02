import React, { useEffect, useState } from 'react';
import {
  activeAssignmentId,
  branchReadinessBlocksWrite,
  branchReadinessCheck,
  buildBranchReadinessAlert,
  currentEvidenceItems,
  jiraVerificationState,
  resolveWorkerLaunchPolicy,
  standardsGateState,
  workerRunBlocksEvidence,
  workerRunEvidenceBlockReason,
  workerRunHasReviewableOutput,
  workflowAllows,
  workflowStateFromData
} from '@odt/domain';
import {
  ActionList,
  InfoList,
  PageHeader,
  Panel,
  SimpleTable,
  StatusBadge,
  WorkflowDecisionBar
} from '../../primitives/index.js';
import { formatBytes, formatTime, shortId, titleCase, toneFor } from '../../utils/index.js';

const teamRoles = [
  { id: 'lead-planner', name: 'Lead Planner', status: 'Ready', scope: 'Clarify scope, gaps, sequence, risks, and worker split', mode: 'Read-only planning', requiresWrite: false },
  { id: 'fullstack-dev', name: 'Senior Full Stack Dev', status: 'Waiting', scope: 'IC4-style end-to-end implementation across UI, API integration, state, utilities, tests, and architecture tradeoffs', mode: 'Approved writes only', requiresWrite: true },
  { id: 'backend-dev', name: 'Backend Dev', status: 'Waiting', scope: 'APIs, data flow, utilities, service integration, backend-facing tests', mode: 'Approved writes only', requiresWrite: true },
  { id: 'frontend-dev', name: 'Frontend Dev', status: 'Waiting', scope: 'UI behavior, component state, accessibility, validation, frontend tests', mode: 'Approved writes only', requiresWrite: true },
  { id: 'reviewer', name: 'Reviewer', status: 'Ready', scope: 'Risk, diff, test, security, accessibility, standards review', mode: 'Read-only review', requiresWrite: false },
  { id: 'build-verifier', name: 'Build Verifier', status: 'Waiting', scope: 'Run approved build/test commands and capture verification evidence', mode: 'Approved test commands', requiresWrite: true }
];

const qualityGates = [
  'Plan approved',
  'Write scope approved',
  'Usage logged',
  'Tests passed',
  'Human review complete'
];

const executionAgents = [
  {
    id: 'codex',
    name: 'Codex',
    label: 'Codex implementation agent',
    detail: 'Best for repo-aware code changes, tests, verification, and PR-ready engineering summaries.'
  },
  {
    id: 'cline',
    name: 'Cline',
    label: 'Cline IDE agent',
    detail: 'Best for developer-supervised IDE workflows where the user wants Cline to execute the handoff.'
  },
  {
    id: 'manual',
    name: 'Manual',
    label: 'Manual handoff',
    detail: 'Use when ODT should prepare the plan and handoff, but a human will execute outside the workbench.'
  }
];

const foundrySourceOptions = [
  { id: 'requirement', label: 'Requirement/Jira' },
  { id: 'repo-analysis', label: 'Repo Analysis' },
  { id: 'technical-design', label: 'Technical Design' },
  { id: 'implementation-plan', label: 'Implementation Plan' },
  { id: 'standards-evidence', label: 'Standards Evidence' },
  { id: 'artifact-evidence', label: 'Artifacts' }
];

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`AgentTeamPage requires ${name}`);
  }
  return value;
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
}

function workflowTone(workflow) {
  const state = workflow?.state || workflow;
  if (!state) return 'neutral';
  if (state === 'PR_READY') return 'success';
  if (state === 'BLOCKED' || state === 'FAILED') return 'danger';
  if (state === 'APPROVED_TO_WRITE' || state === 'IMPLEMENTATION_EVIDENCE_RECORDED' || state === 'POST_IMPLEMENTATION_REVIEW') return 'info';
  if (String(state).includes('PENDING') || String(state).includes('REVIEW') || String(state).includes('INTAKE')) return 'warning';
  return 'info';
}

function getStoredSetting(data, key, fallback) {
  const setting = data.settings?.storedSettings?.find((item) => item.key === key);
  if (!setting) return fallback;
  try {
    return JSON.parse(setting.value);
  } catch {
    return setting.value || fallback;
  }
}

function isWorkerRunActive(status) {
  return ['starting', 'running', 'delegated_visible', 'stop_requested'].includes(String(status || '').toLowerCase());
}

function isWorkerRunPrepared(status) {
  return ['bundle_created', 'manual_fallback'].includes(String(status || '').toLowerCase());
}

function standardsTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('block')) return 'danger';
  if (text.includes('warning') || text.includes('approval') || text.includes('review') || text.includes('required')) return 'warning';
  if (text.includes('pass') || text.includes('approved') || text.includes('ready') || text.includes('decided') || text.includes('accepted') || text.includes('resolved')) return 'success';
  return 'neutral';
}

function adapterTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('unhealthy') || text.includes('missing') || text.includes('fail')) return 'danger';
  if (text.includes('planned') || text.includes('not_configured') || text.includes('handoff')) return 'warning';
  if (text.includes('healthy') || text.includes('configured') || text.includes('ready')) return 'success';
  return 'neutral';
}

function readinessTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('blocked') || text.includes('failed')) return 'danger';
  if (text.includes('attention') || text.includes('warning') || text.includes('manual') || text.includes('missing')) return 'warning';
  if (text.includes('ready')) return 'success';
  return 'neutral';
}

function Checklist({ items }) {
  const [checkedItems, setCheckedItems] = useState(() => new Set(items.slice(0, 2)));

  function toggle(item) {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }

  return (
    <div className="checklist">
      {items.map((item) => (
        <label key={item}>
          <input type="checkbox" checked={checkedItems.has(item)} onChange={() => toggle(item)} />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

function AgentFoundryPanel({ setActivePage, data, postJson, foundrySourceOptions, standardsTone }) {
  const assignmentId = activeAssignmentId(data);
  const registry = data.agentFoundry || {};
  const domains = registry.domains || [];
  const phases = registry.phases || [];
  const evidence = data.evidence || {};
  const foundryRuns = currentEvidenceItems(evidence, 'agentFoundryRuns');
  const [phase, setPhase] = useState('full-sdlc');
  const [domainId, setDomainId] = useState(domains[0]?.id || 'requirements');
  const [sources, setSources] = useState(foundrySourceOptions.map((option) => option.id));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const latestRunId = foundryRuns[0]?.runId || '';
  const latestRunEntries = latestRunId ? foundryRuns.filter((run) => run.runId === latestRunId) : [];
  const latestRunStatus = latestRunEntries.some((run) => run.status === 'NEEDS_REVIEW')
    ? 'NEEDS_REVIEW'
    : latestRunEntries.some((run) => run.status === 'WARNING')
      ? 'WARNING'
      : latestRunEntries.length ? 'PASS' : 'Not Started';

  useEffect(() => {
    if (!domains.length) return;
    setDomainId((current) => domains.some((domain) => domain.id === current) ? current : domains[0].id);
  }, [domains]);

  function toggleSource(sourceId) {
    setSources((current) => (
      current.includes(sourceId)
        ? current.filter((item) => item !== sourceId)
        : [...current, sourceId]
    ));
  }

  async function runFoundryReview() {
    setBusy(true);
    setNotice('');
    try {
      const result = await postJson('/api/agent-foundry/run', {
        assignmentId,
        phase,
        domainId,
        inputSources: sources
      });
      setNotice(`${result.phaseLabel} review saved as evidence. ${result.domainsReviewed} specialist domain(s) reviewed. Status: ${result.status}.`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to run Agent Foundry review.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Agent Foundry" eyebrow="Specialist Reviews">
      <div className="agent-contract-note">
        <div>
          <strong>Governed specialist review</strong>
          <p>Run Full SDLC or focused domain reviews from current assignment evidence. Outputs are saved as Artifacts and remain review-only.</p>
        </div>
        <StatusBadge label="AI-generated suggestion" tone="info" />
      </div>
      <div className="two-column foundry-controls">
        <div className="form-stack">
          <label className="field" htmlFor="foundry-phase">
            <span>Review mode</span>
            <select id="foundry-phase" value={phase} onChange={(event) => setPhase(event.target.value)}>
              {(phases.length ? phases : [{ id: 'full-sdlc', label: 'Full SDLC' }, { id: 'focused-domain', label: 'Focused Domain' }]).map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor="foundry-domain">
            <span>Specialist domain</span>
            <select
              id="foundry-domain"
              value={domainId}
              onChange={(event) => setDomainId(event.target.value)}
              disabled={phase === 'full-sdlc'}
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>{domain.label} - {domain.specialist}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-stack">
          <fieldset className="checkbox-group">
            <legend>Input sources</legend>
            {foundrySourceOptions.map((option) => (
              <label key={option.id} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={sources.includes(option.id)}
                  onChange={() => toggleSource(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </div>
      <InfoList
        items={[
          ['Domains', `${domains.length || 10} specialist review areas`],
          ['Latest Foundry status', latestRunStatus],
          ['Human review', 'Required before write/delegate decisions'],
          ['AutoGPT/AutoGen', 'Not in core for this slice']
        ]}
      />
      <div className="button-row">
        <button className="primary-button" type="button" onClick={runFoundryReview} disabled={busy || !domains.length || !sources.length}>
          {busy ? 'Running Review' : phase === 'full-sdlc' ? 'Run Full SDLC Review' : 'Run Specialist Review'}
        </button>
        <button className="secondary-button" type="button" onClick={() => setActivePage('artifacts')}>
          Open Foundry Evidence
        </button>
      </div>
      {notice ? <p className="muted-copy">{notice}</p> : null}
      {latestRunEntries.length ? (
        <SimpleTable
          columns={['Specialist', 'Status', 'Summary']}
          rows={latestRunEntries.slice(0, 5).map((entry) => [
            entry.output?.specialistName || entry.domainLabel,
            <StatusBadge label={entry.status} tone={standardsTone(entry.status)} />,
            entry.output?.summary || 'Specialist review saved.'
          ])}
        />
      ) : (
        <p className="muted-copy">No Agent Foundry evidence yet. Run a specialist review to create the first saved output.</p>
      )}
    </Panel>
  );
}

function ExecutionHealthPanel({ health, selectedAgent, selectedAdapter, issues = [], onRefresh }) {
  const adapterOrder = ['codex', 'cline', 'oci-genai', 'ollama', 'openai'];
  const adapters = health?.adapters || {};
  const checkedAt = health?.checkedAt ? formatTime(health.checkedAt) : 'Not checked';
  const selectedLabel = selectedAdapter?.label || titleCase(selectedAgent);
  return (
    <Panel title="Execution Health" eyebrow="Adapter Readiness">
      <div className="execution-health-head">
        <div>
          <span className="eyebrow">Selected Adapter</span>
          <strong>{selectedLabel}</strong>
          <p>
            ODT launches only healthy, allowlisted adapters. Provider authentication remains with the local CLI, IDE, SSO, or approved provider configuration; ODT stores evidence and health, not secrets.
          </p>
        </div>
        <div className="button-row compact-buttons">
          <StatusBadge label={selectedAdapter ? titleCase(selectedAdapter.status) : 'Not Checked'} tone={adapterTone(selectedAdapter?.status)} />
          <button className="secondary-button" type="button" onClick={onRefresh}>
            Refresh Health
          </button>
        </div>
      </div>
      <div className="adapter-health-grid">
        {adapterOrder.map((adapterId) => {
          const adapter = adapters[adapterId];
          if (!adapter) return null;
          return (
            <div className={`adapter-health-card ${adapterTone(adapter.status)}`} key={adapterId}>
              <div className="adapter-health-title">
                <strong>{adapter.label || titleCase(adapterId)}</strong>
                <StatusBadge label={titleCase(adapter.status)} tone={adapterTone(adapter.status)} />
              </div>
              <p>{adapter.message || adapter.capability}</p>
              <InfoList
                items={[
                  ['Capability', adapter.capability || 'Provider adapter'],
                  ['Launch', adapter.launchSupported ? 'Direct launch allowed' : adapter.handoffSupported ? 'Handoff only' : 'Not wired'],
                  ['Auth owner', adapter.authModel || 'External provider configuration'],
                  ['Version', adapter.version || 'Not applicable'],
                  ['Executable', adapter.executable || 'Not configured']
                ]}
              />
            </div>
          );
        })}
      </div>
      <div className="execution-issue-list">
        <div className="execution-issue-head">
          <strong>Recent Adapter Issues</strong>
          <span>Last checked {checkedAt}</span>
        </div>
        {issues.length ? (
          issues.slice(0, 4).map((issue) => (
            <div className="execution-issue-card" key={issue.id}>
              <StatusBadge label={titleCase(issue.status)} tone={toneFor(issue.status)} />
              <div>
                <strong>{titleCase(issue.eventType || issue.source)}</strong>
                <p>{issue.message || 'Adapter issue captured.'}</p>
                <span>{issue.createdAt ? formatTime(issue.createdAt) : 'Time not recorded'}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="muted-copy">No adapter launch or health issues have been captured for this assignment.</p>
        )}
      </div>
    </Panel>
  );
}

function ProjectContractPanel({ contract, readiness, handoff, handoffStatus, showHandoffPreview, busy, onCopyHandoff, onRefresh }) {
  const checks = readiness?.checks || [];
  const warningChecks = checks.filter((item) => ['warning', 'manual', 'blocked'].includes(String(item.status || '').toLowerCase()));
  const commands = contract
    ? [
        ['Install', contract.installCommand || 'Not recorded'],
        ['Build', contract.buildCommand || 'Not recorded'],
        ['Test', contract.testCommand || 'Not recorded'],
        ['Run UI', contract.runUiCommand || 'Not recorded'],
        ['Run API', contract.runApiCommand || 'Not recorded'],
        ['Deploy', contract.deployCommand || 'Requires separate approval']
      ]
    : [];

  return (
    <Panel title="Project Contract Readiness" eyebrow="Agent Launch Guardrail">
      {contract ? (
        <div className="project-contract-panel">
          <div className="agent-contract-note">
            <div>
              <strong>{contract.projectName}</strong>
              <p>ODT will inject this repo-specific command contract into Agent Team handoffs and worker prompts before launch.</p>
            </div>
            <div className="button-row compact-buttons">
              <StatusBadge label={readiness ? `${titleCase(readiness.status)} ${readiness.score}%` : 'Not Checked'} tone={readinessTone(readiness?.status)} />
              <button className="secondary-button" type="button" onClick={onRefresh} disabled={busy}>
                Refresh
              </button>
              <button className="secondary-button" type="button" onClick={onCopyHandoff} disabled={busy || handoffStatus === 'loading'}>
                {handoffStatus === 'loading' ? 'Preparing Handoff...' : 'Copy Contract Handoff'}
              </button>
            </div>
          </div>
          <InfoList
            items={[
              ['Contract id', contract.id],
              ['Repository', contract.repoPath || 'Not recorded'],
              ['Base branch', contract.baseBranch || 'Not recorded'],
              ['Risk profile', titleCase(contract.riskProfile || 'medium')],
              ['Readiness', readiness ? `${titleCase(readiness.status)} (${readiness.score}%)` : 'Not checked'],
              ['Blocked commands', contract.blockedCommands?.length ? contract.blockedCommands.join(', ') : 'Default destructive-action policy']
            ]}
          />
          <SimpleTable
            columns={['Command', 'Value']}
            rows={commands}
          />
          {warningChecks.length ? (
            <ActionList
              items={warningChecks.map((item) => [
                titleCase(item.label || item.id),
                `${titleCase(item.status)} - ${item.detail}${item.remediation ? ` ${item.remediation}` : ''}`
              ])}
            />
          ) : (
            <p className="muted-copy">No Project Contract warnings are blocking this worker handoff.</p>
          )}
          {contract.approvalNotes?.length ? (
            <div className="worker-question-list">
              <strong>Approval notes</strong>
              <ul>
                {contract.approvalNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {showHandoffPreview && handoff ? (
            <div className="handoff-preview">
              <strong>Generated handoff preview</strong>
              <p className="muted-copy">Clipboard access was blocked by the browser. The generated handoff is available here for manual review/copy.</p>
              <textarea readOnly value={handoff} aria-label="Generated Project Contract handoff" />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="empty-state">
          No Project Contract is saved for this assignment yet. Agent Team can still prepare handoffs, but workers may need manual command confirmation.
        </div>
      )}
    </Panel>
  );
}

function ProjectContractMismatchCard({ selection }) {
  if (selection?.reason !== 'no_matching_contract_for_target_repo') return null;
  return (
    <div className="project-contract-mismatch-card" role="alert">
      <div>
        <strong>Project Contract mismatch</strong>
        <p>No saved Project Contract matches this assignment repo. ODT will use assignment repo evidence for launch, and command policy should be confirmed before long-running write work.</p>
      </div>
      <StatusBadge label="Contract Needed" tone="warning" />
      <InfoList
        items={[
          ['Assignment repo', selection.targetRepoPath || 'Not recorded'],
          ['Selection reason', titleCase(selection.reason || 'missing')]
        ]}
      />
    </div>
  );
}

export function AgentTeamPage({ setActivePage, data, actions = {}, slots = {} }) {
  const postJson = requireDependency(actions.postJson, 'actions.postJson');
  const getJson = requireDependency(actions.getJson, 'actions.getJson');
  const copyTextToClipboard = requireDependency(actions.copyTextToClipboard, 'actions.copyTextToClipboard');
  const CurrentWorkBrief = requireDependency(slots.CurrentWorkBrief, 'slots.CurrentWorkBrief');
  const assignmentId = activeAssignmentId(data);
  const storedAgent = getStoredSetting(data, 'executionAgent', 'codex');
  const storedWorkerRole = getStoredSetting(data, 'selectedWorkerRole', 'fullstack-dev');
  const [selectedAgent, setSelectedAgent] = useState(storedAgent);
  const [selectedWorkerRole, setSelectedWorkerRole] = useState(storedWorkerRole);
  const [selectedWorkerRunId, setSelectedWorkerRunId] = useState('');
  const [selectedRelayId, setSelectedRelayId] = useState('');
  const [relayDecision, setRelayDecision] = useState('');
  const [relayTargetRole, setRelayTargetRole] = useState('');
  const [agentNotice, setAgentNotice] = useState('');
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [projectContractHandoff, setProjectContractHandoff] = useState('');
  const [projectContractHandoffStatus, setProjectContractHandoffStatus] = useState('idle');
  const [showProjectContractHandoff, setShowProjectContractHandoff] = useState(false);
  const [branchOverrideAccepted, setBranchOverrideAccepted] = useState(false);
  const [liveTailEnabled, setLiveTailEnabled] = useState(true);
  const selectedAgentConfig = executionAgents.find((agent) => agent.id === selectedAgent) || executionAgents[0];
  const selectedWorker = teamRoles.find((role) => role.id === selectedWorkerRole) || teamRoles[0];
  const projectContract = data.agentContract?.projectContract || null;
  const projectContractSelection = data.agentContract?.projectContractSelection || null;
  const projectReadiness = data.agentContract?.projectReadiness || null;
  const branchReadiness = branchReadinessCheck(projectReadiness);
  const approvalEvents = currentEvidenceItems(data.evidence, 'approvals');
  const branchOverrideRecorded = approvalEvents.some((approval) => (
    approval.approvalType === 'branch_readiness_override'
    && String(approval.status || '').toLowerCase() === 'approved'
  ));
  const branchOverrideEffective = branchOverrideAccepted || branchOverrideRecorded;
  const branchReadinessAlert = buildBranchReadinessAlert({
    projectReadiness,
    branchOverrideAccepted,
    branchOverrideRecorded
  });
  const workflow = workflowStateFromData(data);
  const { verificationProfile, completedJiraVerification } = jiraVerificationState(workflow);
  const gate = standardsGateState(data.evidence);
  const blockers = gate.unresolvedBlockers;
  const reviewBlockers = gate.reviewBlockers || [];
  const writeApproved = gate.writeApproved;
  const writeMode = workflowAllows(workflow, 'canDelegateWrite', Boolean(writeApproved && !blockers.length && !reviewBlockers.length));
  const selectedWorkerNeedsWrite = Boolean(selectedWorker.requiresWrite);
  const implementationWorkerIds = new Set(['fullstack-dev', 'backend-dev', 'frontend-dev']);
  const selectedWorkerBlockedByVerification = completedJiraVerification && implementationWorkerIds.has(selectedWorkerRole);
  const executionAdapters = data.executionHealth?.adapters || {};
  const selectedExecutionHealth = executionAdapters[selectedAgent] || null;
  const codexExecutionHealth = executionAdapters.codex || null;
  const codexLaunchHealthy = codexExecutionHealth?.status === 'healthy';
  const executionHealthIssues = data.executionHealth?.issues || [];
  const selectedLaunchPolicy = resolveWorkerLaunchPolicy({
    selectedAgent,
    codexLaunchHealthy,
    worker: selectedWorker,
    writeMode,
    verificationBlocked: selectedWorkerBlockedByVerification,
    projectReadiness,
    branchOverrideAccepted: branchOverrideEffective
  });
  const selectedWorkerBlockedByBranch = selectedLaunchPolicy.branchOverrideRequired;
  const selectedWorkerHasBranchRisk = selectedLaunchPolicy.branchBlocked;
  const canLaunchCodexWorker = resolveWorkerLaunchPolicy({
    selectedAgent,
    codexLaunchHealthy,
    worker: selectedWorker,
    writeMode,
    verificationBlocked: selectedWorkerBlockedByVerification,
    projectReadiness,
    branchOverrideAccepted: branchOverrideEffective
  }).allowed;
  const dependencyRequests = currentEvidenceItems(data.evidence, 'dependencyRequests');
  const approvedDependencies = dependencyRequests.filter((request) => request.status === 'approved');
  const pendingDependencies = dependencyRequests.filter((request) => request.status === 'pending');
  const workerRuns = currentEvidenceItems(data.evidence, 'agentWorkerRuns');
  const relayItems = currentEvidenceItems(data.evidence, 'agentRelayItems');
  const selectedWorkerRun = workerRuns.find((run) => run.id === selectedWorkerRunId) || workerRuns[0] || null;
  const selectedRelayItem = relayItems.find((item) => item.id === selectedRelayId) || relayItems[0] || null;
  const latestPlan = currentEvidenceItems(data.evidence, 'implementationPlans')?.[0]?.planJson || {};
  const sharedTaskItems = normalizeList(latestPlan.frontendTasks || latestPlan.scope).slice(0, 5);

  useEffect(() => {
    setSelectedAgent(storedAgent);
  }, [storedAgent]);

  useEffect(() => {
    setSelectedWorkerRole(storedWorkerRole);
  }, [storedWorkerRole]);

  useEffect(() => {
    if (completedJiraVerification && implementationWorkerIds.has(selectedWorkerRole)) {
      setSelectedWorkerRole('reviewer');
    }
  }, [completedJiraVerification, selectedWorkerRole]);

  useEffect(() => {
    setBranchOverrideAccepted(false);
  }, [assignmentId, selectedWorkerRole, branchReadiness?.status, branchReadiness?.currentBranch, branchReadiness?.expectedBranch]);

  useEffect(() => {
    if (!workerRuns.length) {
      setSelectedWorkerRunId('');
      return;
    }
    setSelectedWorkerRunId((current) => workerRuns.some((run) => run.id === current) ? current : workerRuns[0].id);
  }, [workerRuns]);

  useEffect(() => {
    if (!relayItems.length) {
      setSelectedRelayId('');
      setRelayTargetRole('');
      return;
    }
    const nextRelay = relayItems.find((item) => item.id === selectedRelayId) || relayItems[0];
    setSelectedRelayId(nextRelay.id);
    setRelayTargetRole((current) => current || nextRelay.targetWorkerRole || '');
  }, [relayItems, selectedRelayId]);

  useEffect(() => {
    if (!selectedRelayItem) return;
    setRelayTargetRole(selectedRelayItem.targetWorkerRole || '');
    setRelayDecision(selectedRelayItem.decision?.decision || '');
  }, [selectedRelayItem?.id]);

  useEffect(() => {
    let cancelled = false;
    setShowProjectContractHandoff(false);
    if (!projectContract?.id) {
      setProjectContractHandoff('');
      setProjectContractHandoffStatus('idle');
      return undefined;
    }

    setProjectContractHandoffStatus('loading');
    postJson(`/api/project-contracts/${encodeURIComponent(projectContract.id)}/handoff`, {
      assignmentId
    })
      .then((result) => {
        if (cancelled) return;
        setProjectContractHandoff(result.handoff || '');
        setProjectContractHandoffStatus(result.handoff ? 'ready' : 'empty');
      })
      .catch(() => {
        if (cancelled) return;
        setProjectContractHandoff('');
        setProjectContractHandoffStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [projectContract?.id, assignmentId]);

  useEffect(() => {
    if (!selectedWorkerRun?.id || !selectedWorkerRun.statusFile || !liveTailEnabled) return undefined;
    if (!isWorkerRunActive(selectedWorkerRun.status)) return undefined;
    const timer = window.setInterval(() => {
      postJson(`/api/agents/worker-runs/${encodeURIComponent(selectedWorkerRun.id)}/status`, {
        assignmentId
      })
        .then(() => data.refresh())
        .catch(() => {
          // Keep live tail best-effort; explicit refresh still reports errors to the user.
        });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [selectedWorkerRun?.id, selectedWorkerRun?.status, selectedWorkerRun?.statusFile, liveTailEnabled]);

  async function chooseAgent(agentId) {
    setSelectedAgent(agentId);
    setAgentNotice('');
    try {
      await postJson('/api/settings', {
        settings: {
          executionAgent: agentId
        }
      });
      setAgentNotice(`${titleCase(agentId)} selected for the next governed handoff. Write actions still require approval.`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to save execution agent preference.');
    }
  }

  async function chooseWorkerRole(workerRole) {
    setSelectedWorkerRole(workerRole);
    setAgentNotice('');
    try {
      await postJson('/api/settings', {
        settings: {
          selectedWorkerRole: workerRole
        }
      });
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to save worker lane preference.');
    }
  }

  async function copyAgentHandoff({ requireWrite = false } = {}) {
    if (requireWrite && !writeMode) {
      setAgentNotice('Delegation is waiting on Standards, review blockers, or write approval. You can still copy a read-only handoff for planning.');
      return;
    }
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const contract = await getJson(`/api/assignments/${encodeURIComponent(assignmentId)}/agent-contract`);
      const copied = await copyTextToClipboard(JSON.stringify(contract, null, 2));
      setAgentNotice(copied
        ? `${titleCase(contract.executionAgent || selectedAgent)} handoff copied. Current mode: ${contract.mode}.`
        : 'Handoff generated, but browser clipboard access is blocked. Use the Artifacts evidence or API contract as the source.');
    } catch (err) {
      setAgentNotice(err.message || 'Unable to copy agent handoff.');
    } finally {
      setHandoffBusy(false);
    }
  }

  async function delegateAgentHandoff({ requireWriteApproved = writeMode } = {}) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson('/api/agents/delegate', {
        assignmentId,
        executionAgent: selectedAgent,
        workerRoleId: selectedWorkerRole,
        requireWriteApproved,
        notes: requireWriteApproved
          ? 'Prepared from Agent Team with write approval.'
          : 'Prepared from Agent Team as a read-only planning handoff. Target repository writes remain locked.'
      });
      const copied = await copyTextToClipboard(JSON.stringify(result.handoff, null, 2));
      setAgentNotice(copied
        ? `${titleCase(result.handoff.executionAgent)} handoff run ${shortId(result.runId)} prepared and copied. Mode: ${result.handoff.mode}.`
        : `${titleCase(result.handoff.executionAgent)} handoff run ${shortId(result.runId)} prepared. Clipboard was blocked, but the handoff is saved in Artifacts and Runs.`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to prepare agent handoff run.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function launchCodexWorker(workerRoleOverride = selectedWorkerRole) {
    const launchRole = teamRoles.find((role) => role.id === workerRoleOverride) || selectedWorker;
    const launchRoleBlockedByVerification = completedJiraVerification && implementationWorkerIds.has(launchRole.id);
    const launchRoleNeedsWrite = Boolean(launchRole.requiresWrite);
    const launchRoleBlockedByBranch = launchRoleNeedsWrite && branchReadinessBlocksWrite(projectReadiness);
    const launchRoleBranchOverrideEffective = launchRoleBlockedByBranch && branchOverrideEffective;
    const canLaunchRole = selectedAgent === 'codex' && codexLaunchHealthy && !launchRoleBlockedByVerification && (!launchRoleBlockedByBranch || launchRoleBranchOverrideEffective) && (!launchRoleNeedsWrite || writeMode);
    if (!canLaunchRole) {
      setAgentNotice(selectedAgent === 'codex'
        ? !codexLaunchHealthy
          ? 'Codex CLI adapter is not healthy. Review Execution Health before launching a terminal worker.'
          : launchRoleBlockedByVerification
            ? `${verificationProfile.issueKey} is already completed in Jira. Launch Reviewer first, then Build Verifier or PR Ready evidence if needed.`
            : launchRoleBlockedByBranch
              ? `Branch readiness needs a decision: create the suggested branch or accept the current-branch risk before launching ${launchRole.name}.`
          : `${launchRole.name} is waiting on Standards, review blockers, or write approval. Read-only lanes can still run for planning/review.`
        : 'Terminal launch is wired for Codex in this slice. Use governed handoff for Cline or Manual.');
      return;
    }
    setSelectedWorkerRole(launchRole.id);
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      if (launchRoleBlockedByBranch && branchOverrideAccepted && !branchOverrideRecorded) {
        await postJson('/api/approvals', {
          assignmentId,
          approvalType: 'branch_readiness_override',
          status: 'approved',
          notes: [
            `Approved ${launchRole.name} launch on current branch ${branchReadiness?.currentBranch || 'unknown'}.`,
            branchReadiness?.expectedBranch ? `Suggested dedicated branch was ${branchReadiness.expectedBranch}.` : '',
            branchReadiness?.detail || ''
          ].filter(Boolean).join(' ')
        });
      }
      const result = await postJson('/api/agents/launch-worker', {
        assignmentId,
        executionAgent: selectedAgent,
        workerRole: launchRole.id,
        launchMode: 'terminal',
        notes: `Launched ${launchRole.name} from Agent Team.`
      });
      const launch = result.launch || {};
      if (result.status === 'launched') {
        setAgentNotice(`${launchRole.name} launched in Terminal with Codex. Bundle: ${launch.bundleDir}. Response: ${launch.responseFile}.`);
      } else if (result.status === 'launched_background') {
        setAgentNotice(`${launchRole.name} started as a background Codex worker because Terminal launch was blocked. Live log and stop controls are available in Worker Run Detail. Response: ${launch.responseFile}.`);
      } else if (result.status === 'manual_fallback') {
        setAgentNotice(`${launchRole.name} bundle is ready, but Terminal launch needs manual start: ${launch.manualCommand}`);
      } else {
        setAgentNotice(`${launchRole.name} bundle prepared: ${launch.bundleDir || 'workspace bundle'}.`);
      }
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to launch Codex worker.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function ingestWorkerRun(workerRunId) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/agents/worker-runs/${encodeURIComponent(workerRunId)}/ingest`, {
        assignmentId
      });
      const worker = result.workerRun || {};
      setAgentNotice(`${worker.workerRoleLabel || 'Worker'} output ingested. Status: ${titleCase(worker.status || 'completed')}.`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to ingest worker output yet.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function refreshWorkerRunStatus(workerRunId) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/agents/worker-runs/${encodeURIComponent(workerRunId)}/status`, {
        assignmentId
      });
      const worker = result.workerRun || {};
      setAgentNotice(`${worker.workerRoleLabel || 'Worker'} status refreshed: ${titleCase(worker.status || 'unknown')}. Response: ${formatBytes(result.responseBytes || 0)}. Log: ${formatBytes(result.logBytes || 0)}.`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to refresh worker status.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function launchPreparedWorkerRun(workerRunId) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/agents/worker-runs/${encodeURIComponent(workerRunId)}/launch`, {
        assignmentId
      });
      const worker = result.workerRun || {};
      if (result.status === 'launched') {
        setAgentNotice(`${worker.workerRoleLabel || 'Worker'} launched from its prepared bundle. Terminal/log tail is now active.`);
      } else if (result.status === 'launched_background') {
        setAgentNotice(`${worker.workerRoleLabel || 'Worker'} launched in the background. Use Live Log Tail and Stop Worker from this page.`);
      } else {
        setAgentNotice(`${worker.workerRoleLabel || 'Worker'} could not auto-launch. Manual command remains available.`);
      }
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to launch prepared worker bundle.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function stopWorkerRun(workerRunId) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/agents/worker-runs/${encodeURIComponent(workerRunId)}/stop`, {
        assignmentId,
        reason: 'Developer requested stop from ODT Agent Team.'
      });
      const signal = result.signalResult?.status === 'sent' ? ' SIGINT sent to the Codex worker.' : '';
      setAgentNotice(`${result.message || 'Worker stop requested.'}${signal} ${result.manualStopGuidance || ''}`.trim());
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to request worker stop.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function deriveImplementationEvidence(workerRunId) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/implementation/evidence/from-worker/${encodeURIComponent(workerRunId)}`, {
        assignmentId,
        runPostCheck: true
      });
      const extracted = result.extracted || {};
      setAgentNotice(`Implementation evidence ${shortId(result.evidence?.id)} recorded from worker output. Extracted ${extracted.changedFiles?.length || 0} file(s), ${extracted.commands?.length || 0} command(s), and ${extracted.tests?.length || 0} test item(s).`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to derive implementation evidence from this worker output.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  function useRelayForNextWorker(relayItem) {
    if (!relayItem) return;
    const nextRole = relayItem.targetWorkerRole || relayTargetRole || 'reviewer';
    setSelectedRelayId(relayItem.id);
    setSelectedWorkerRole(nextRole);
    setRelayTargetRole(nextRole);
    postJson('/api/settings', {
      settings: {
        selectedWorkerRole: nextRole
      }
    }).catch(() => {
      // The local UI selection still works; persisted preference is best-effort.
    });
    setAgentNotice(`${relayItem.title || 'Relay item'} is selected. Launch ${teamRoles.find((role) => role.id === nextRole)?.name || titleCase(nextRole)} to receive this context in the worker prompt.`);
  }

  async function decideRelayItem(action) {
    if (!selectedRelayItem) {
      setAgentNotice('No relay item is selected.');
      return;
    }
    if (['answer', 'resolve'].includes(action) && !relayDecision.trim()) {
      setAgentNotice('Add decision notes before answering or resolving a relay item.');
      return;
    }
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/agents/relay/${encodeURIComponent(selectedRelayItem.id)}/decision`, {
        assignmentId,
        action,
        decision: relayDecision,
        targetWorkerRole: relayTargetRole || selectedRelayItem.targetWorkerRole || '',
        targetLane: teamRoles.find((role) => role.id === (relayTargetRole || selectedRelayItem.targetWorkerRole))?.name || selectedRelayItem.targetLane || '',
        decidedBy: 'local-user'
      });
      const relay = result.relayItem || {};
      setAgentNotice(`Relay item ${shortId(relay.id)} marked ${titleCase(relay.status || action)}. Future worker prompts will include the updated relay context.`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to update relay item.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function copyWorkerRunText(value, label) {
    const copied = await copyTextToClipboard(value || '');
    setAgentNotice(copied ? `${label} copied.` : `${label} is available in Worker Run Detail, but clipboard access was blocked.`);
  }

  async function copyProjectContractHandoff() {
    if (!projectContract?.id) {
      setAgentNotice('No Project Contract is available to copy yet.');
      return;
    }
    setShowProjectContractHandoff(false);
    setAgentNotice('');
    try {
      let handoffText = projectContractHandoff;
      let readiness = projectReadiness;
      if (!handoffText) {
        setHandoffBusy(true);
        const result = await postJson(`/api/project-contracts/${encodeURIComponent(projectContract.id)}/handoff`, {
          assignmentId
        });
        handoffText = result.handoff || '';
        readiness = result.readiness || readiness;
        setProjectContractHandoff(handoffText);
        setProjectContractHandoffStatus(handoffText ? 'ready' : 'empty');
      }
      const copied = await copyTextToClipboard(handoffText);
      setShowProjectContractHandoff(!copied && Boolean(handoffText));
      setAgentNotice(copied
        ? `Project Contract ${projectContract.id} handoff copied. Readiness: ${titleCase(readiness?.status || 'unknown')} ${readiness?.score ?? ''}%.`
        : 'Project Contract handoff generated, but clipboard access was blocked. A generated preview is shown above.');
    } catch (err) {
      setAgentNotice(err.message || 'Unable to copy Project Contract handoff.');
    } finally {
      setHandoffBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Agent Team"
        title="Agentic SDLC worker lanes"
        copy="Choose a worker lane, select the execution engine, and launch governed Codex sessions with shared ODT evidence. Advisory lanes run read-only; implementation and verification lanes require write approval."
        actions={<StatusBadge label={workflow?.state || (writeMode ? 'Governance: WRITE_APPROVED' : 'Governance: PLAN_REVIEW')} tone={workflowTone(workflow || (writeMode ? 'APPROVED_TO_WRITE' : 'PLAN_REVIEW'))} />}
      />
      {branchReadinessAlert?.visible ? (
        <div className="branch-readiness-sticky-slot" aria-live="polite">
          <aside className={`branch-readiness-sticky-card ${branchReadinessAlert.overrideRecorded ? 'recorded' : ''}`} aria-label="Branch readiness alert">
            <div className="branch-readiness-sticky-head">
              <strong>{branchReadinessAlert.title}</strong>
              <StatusBadge label={branchReadinessAlert.actionLabel} tone={branchReadinessAlert.overrideRecorded ? 'success' : branchReadinessAlert.tone} />
            </div>
            <dl>
              <div>
                <dt>Current</dt>
                <dd>{branchReadinessAlert.currentBranch || 'unknown'}</dd>
              </div>
              <div>
                <dt>Suggested</dt>
                <dd>{branchReadinessAlert.expectedBranch || 'task branch'}</dd>
              </div>
            </dl>
            <p>{branchReadinessAlert.message}</p>
          </aside>
        </div>
      ) : null}
      <WorkflowDecisionBar workflow={workflow} onNavigate={setActivePage} titleCase={titleCase} workflowTone={workflowTone} />
      <CurrentWorkBrief data={data} onNavigate={setActivePage} compact />
      {completedJiraVerification ? (
        <Panel title="Verification Lane" eyebrow="Completed Jira Detected">
          <div className="verification-lane-panel">
            <div>
              <StatusBadge label="Completed in Jira" tone="success" />
              <StatusBadge label="Verification first" tone="info" />
              <StatusBadge label={verificationProfile.hasRepoEvidence ? 'Repo evidence found' : 'Repo evidence needed'} tone={verificationProfile.hasRepoEvidence ? 'success' : 'warning'} />
            </div>
            <p>{verificationProfile.summary} ODT should verify evidence before launching implementation workers.</p>
            <ActionList
              items={[
                ['Reviewer', 'Review Jira details, linked commits, branch/PR state, risks, and missing evidence.'],
                ['Build Verifier', 'After reviewer pass or explicit test approval, capture build/test evidence.'],
                ['PR Ready', 'Prepare the PR/release-ready package once verification evidence is recorded.']
              ]}
            />
            <div className="button-row">
              <button className="primary-button" type="button" onClick={() => launchCodexWorker('reviewer')} disabled={handoffBusy || selectedAgent !== 'codex' || !codexLaunchHealthy}>Launch Reviewer</button>
              <button className="secondary-button" type="button" onClick={() => chooseWorkerRole('reviewer')}>Select Reviewer</button>
              <button className="secondary-button" type="button" onClick={() => chooseWorkerRole('build-verifier')}>Select Build Verifier</button>
              <button className="secondary-button" type="button" onClick={() => setActivePage('pr')}>Open PR Ready</button>
            </div>
          </div>
        </Panel>
      ) : null}
      <Panel title="Team Operating Model" eyebrow="How Agent Team Works">
        <SimpleTable
          columns={['Lane', 'Engine', 'Parallel Policy', 'ODT Gate']}
          rows={[
            ['Developer Control Plane', 'ODT Workbench', 'Always active; owns state, approvals, and evidence.', 'Human review and standards evidence remain source of truth.'],
            ['Specialist Review', 'ODT Agent Foundry via local/OCI-ready provider', 'Can run Full SDLC or focused read-only reviews without file writes.', 'Outputs are AI-generated suggestions and require human review.'],
            ['Implementation Worker', titleCase(selectedAgent), writeMode ? 'Write-approved handoff available for supervised execution.' : 'Read-only planning handoff only; target repo writes remain locked.', writeMode ? 'Latest standards check and write approval are current.' : 'Use Standards to approve or override before write delegation.'],
            ['Parallel Code Work', 'Codex CLI / Cline / future agent runners', 'Recommended only after ODT partitions files or modules to prevent conflicting edits.', 'Each worker must return changed files, commands, tests, risks, and notes as evidence.'],
            ['Dependency Install', 'Selected worker after package approval', 'Never parallel by default.', 'Separate dependency request approval required before install.']
          ]}
        />
      </Panel>
      <AgentFoundryPanel setActivePage={setActivePage} data={data} postJson={postJson} foundrySourceOptions={foundrySourceOptions} standardsTone={standardsTone} />
      <ExecutionHealthPanel
        health={data.executionHealth}
        selectedAgent={selectedAgent}
        selectedAdapter={selectedExecutionHealth}
        issues={executionHealthIssues}
        onRefresh={data.refresh}
      />
      <ProjectContractMismatchCard selection={projectContractSelection} />
      <ProjectContractPanel
        contract={projectContract}
        readiness={projectReadiness}
        handoff={projectContractHandoff}
        handoffStatus={projectContractHandoffStatus}
        showHandoffPreview={showProjectContractHandoff}
        busy={handoffBusy}
        onCopyHandoff={copyProjectContractHandoff}
        onRefresh={data.refresh}
      />
      <Panel title="Execution Agent" eyebrow="Handoff Target">
        <div className="agent-selector" role="radiogroup" aria-label="Select execution agent">
          {executionAgents.map((agent) => (
            <button
              className={`agent-option ${selectedAgent === agent.id ? 'selected' : ''}`}
              type="button"
              key={agent.id}
              role="radio"
              aria-checked={selectedAgent === agent.id}
              onClick={() => chooseAgent(agent.id)}
            >
              <strong>{agent.name}</strong>
              <span>{agent.label}</span>
            </button>
          ))}
        </div>
        <div className="agent-contract-note">
          <div>
            <strong>{selectedAgentConfig.label}</strong>
            <p>{selectedAgentConfig.detail}</p>
          </div>
          <StatusBadge label={writeMode ? 'Write-approved' : 'Read-only until approved'} tone={writeMode ? 'success' : 'warning'} />
        </div>
        <div className="worker-lane-grid" role="radiogroup" aria-label="Select worker lane">
          {teamRoles.map((role) => {
            const roleBlockedByVerification = completedJiraVerification && implementationWorkerIds.has(role.id);
            const roleHasBranchRisk = role.requiresWrite && branchReadinessBlocksWrite(projectReadiness);
            const roleBlockedByBranch = roleHasBranchRisk && !branchOverrideEffective;
            const roleReady = !roleBlockedByVerification && !roleBlockedByBranch && (!role.requiresWrite || writeMode);
            return (
              <button
                className={`worker-lane-card ${selectedWorkerRole === role.id ? 'selected' : ''}`}
                type="button"
                key={role.id}
                role="radio"
                aria-checked={selectedWorkerRole === role.id}
                onClick={() => chooseWorkerRole(role.id)}
              >
                <div className="role-avatar">{role.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <strong>{role.name}</strong>
                  <p>{role.scope}</p>
                  <span>{role.mode}</span>
                </div>
                <StatusBadge
                  label={roleBlockedByVerification ? 'Verification First' : roleBlockedByBranch ? 'Branch Required' : roleHasBranchRisk && branchOverrideEffective ? 'Branch Override' : roleReady ? 'Ready' : 'Needs Write Approval'}
                  tone={roleReady && !roleHasBranchRisk ? 'success' : 'warning'}
                />
              </button>
            );
          })}
        </div>
        <div className="handoff-toolbar">
          <InfoList
            items={[
              ['Write approval', writeApproved ? 'Captured' : 'Required'],
              ['Review decision', gate.implementationBlocked ? 'Implementation blocked' : 'No active block'],
              ['Critical blockers', blockers.length || reviewBlockers.length ? `${blockers.length + reviewBlockers.length} unresolved` : gate.blockerOverride ? 'Reviewed override' : 'None'],
              ['Dependency installs', approvedDependencies.length ? `${approvedDependencies.length} approved package(s)` : pendingDependencies.length ? `${pendingDependencies.length} pending approval` : 'Blocked'],
              ['Branch readiness', branchReadiness ? `${titleCase(branchReadiness.status)} - ${branchReadiness.currentBranch || 'unknown'}` : 'Not checked'],
              ['Selected lane', selectedWorker.name],
              ['Lane access', selectedWorkerBlockedByBranch ? 'locked until branch decision' : selectedWorkerHasBranchRisk && branchOverrideEffective ? 'write-approved with branch override' : selectedWorker.requiresWrite ? (writeMode ? 'write-approved' : 'locked until approval') : 'read-only'],
              ['Adapter health', selectedExecutionHealth ? titleCase(selectedExecutionHealth.status) : 'Not checked'],
              ['Terminal worker', selectedAgent === 'codex' ? (!codexLaunchHealthy ? 'Codex adapter unhealthy' : selectedWorkerBlockedByBranch ? 'Waiting on branch decision' : canLaunchCodexWorker ? `Ready to launch ${selectedWorker.name}` : 'Locked until write-approved') : 'Handoff only for this engine']
            ]}
          />
          {selectedWorkerHasBranchRisk ? (
            <label className={`branch-override-control ${branchOverrideRecorded ? 'recorded' : ''}`}>
              <input
                type="checkbox"
                checked={branchOverrideEffective}
                disabled={branchOverrideRecorded || handoffBusy || !writeMode}
                onChange={(event) => setBranchOverrideAccepted(event.target.checked)}
              />
              <span>
                <strong>{branchOverrideRecorded ? 'Current-branch approval recorded' : 'Proceed on current branch'}</strong>
                <small>
                  {writeMode
                    ? branchOverrideRecorded
                      ? `Audit evidence already includes a branch readiness override for ${branchReadiness?.currentBranch || 'the current branch'}.`
                      : `Record branch readiness override before launch. Suggested branch: ${branchReadiness?.expectedBranch || 'task branch'}.`
                    : 'Approve write scope before accepting current-branch risk.'}
                </small>
              </span>
            </label>
          ) : null}
          <div className="button-row">
            {selectedAgent === 'codex' ? (
              <button
                className="primary-button"
                type="button"
                onClick={launchCodexWorker}
                disabled={handoffBusy || !canLaunchCodexWorker}
                title={canLaunchCodexWorker
	                  ? 'Create the ODT worker bundle and open a visible Terminal running Codex CLI.'
	                  : !codexLaunchHealthy
	                    ? 'Review Execution Health and fix the Codex CLI adapter before launching.'
	                    : selectedWorkerBlockedByBranch
	                      ? branchReadiness?.remediation || 'Create or switch to a task branch, or accept current-branch risk before launching write workers.'
	                    : 'Review findings, override accepted blockers if needed, and approve write scope before launching Codex.'}
	              >
                {handoffBusy ? 'Preparing' : `Launch ${selectedWorker.name}`}
              </button>
            ) : (
              <button
                className="primary-button"
                type="button"
                onClick={() => delegateAgentHandoff({ requireWriteApproved: writeMode })}
                disabled={handoffBusy}
                title={writeMode
                  ? `Prepare and copy a write-approved handoff run for ${titleCase(selectedAgent)}.`
                  : `Prepare and copy a read-only planning handoff for ${titleCase(selectedAgent)}. Writes remain locked.`}
              >
                {handoffBusy ? 'Preparing' : writeMode ? `Delegate to ${titleCase(selectedAgent)}` : `Delegate Read-only to ${titleCase(selectedAgent)}`}
              </button>
            )}
            <button
              className="secondary-button"
              type="button"
              onClick={() => delegateAgentHandoff({ requireWriteApproved: writeMode })}
              disabled={handoffBusy}
              title={writeMode
                ? `Prepare and copy a write-approved handoff run for ${titleCase(selectedAgent)}.`
                : `Prepare and copy a read-only planning handoff for ${titleCase(selectedAgent)}. Writes remain locked.`}
            >
              {writeMode ? 'Prepare Handoff Only' : `Delegate Read-only to ${titleCase(selectedAgent)}`}
            </button>
            {!writeMode ? (
              <button className="secondary-button" type="button" onClick={() => setActivePage('standards')} disabled={handoffBusy}>
                Unlock Write Delegation
              </button>
            ) : null}
            <button className="secondary-button" type="button" onClick={() => copyAgentHandoff()} disabled={handoffBusy}>
              Copy Read-only Handoff
            </button>
          </div>
	        </div>
	        {agentNotice ? <p className="muted-copy">{agentNotice}</p> : null}
	      </Panel>
	      <Panel title="Agent Relay Inbox" eyebrow="Cross-Lane Context">
	        <p className="muted-copy">Relay items are durable evidence extracted from worker output and review findings. Use them to route questions, capture human decisions, and make sure the next worker receives the right context in its prompt.</p>
	        <SimpleTable
	          columns={['Status', 'Target Lane', 'Source', 'Relay Item', 'Action']}
	          rows={relayItems.slice(0, 8).map((item) => {
	            const roleName = teamRoles.find((role) => role.id === item.targetWorkerRole)?.name;
	            const laneLabel = item.itemType === 'rework' ? item.targetLane || roleName : roleName || item.targetLane;
	            return [
	              <StatusBadge label={titleCase(item.status)} tone={toneFor(item.status)} />,
	              laneLabel || 'Next lane',
	              item.sourceWorkerRoleLabel || titleCase(item.sourceWorkerRole),
	              <div className="relay-table-cell">
	                <strong>{item.title}</strong>
	                <span>{item.message}</span>
	                {item.context?.requiredAction ? <em>{item.context.requiredAction}</em> : null}
	                {item.decision?.decision ? <em>Decision: {item.decision.decision}</em> : null}
	              </div>,
	              <div className="button-row compact-buttons">
	                <button className="table-button" type="button" onClick={() => {
	                  setSelectedRelayId(item.id);
	                  setRelayTargetRole(item.targetWorkerRole || '');
	                  setRelayDecision(item.decision?.decision || '');
	                }}>
	                  Review
	                </button>
	                <button className="table-button" type="button" onClick={() => useRelayForNextWorker(item)}>
	                  {item.itemType === 'rework' ? 'Use Rework' : 'Use Next'}
	                </button>
	              </div>
	            ];
	          })}
	          empty="No relay items yet. Ingest worker output with questions to create cross-lane relay evidence."
	        />
	        {selectedRelayItem ? (
	          <div className="relay-detail-panel">
	            <div>
	              <span className="eyebrow">Selected Relay</span>
	              <h4>{selectedRelayItem.title}</h4>
	              <p>{selectedRelayItem.message}</p>
	            </div>
	            <div className="form-grid two">
	              <label className="field" htmlFor="relay-target-worker">
	                <span>Target worker lane</span>
	                <select id="relay-target-worker" value={relayTargetRole} onChange={(event) => setRelayTargetRole(event.target.value)}>
	                  <option value="">Auto route</option>
	                  {teamRoles.map((role) => (
	                    <option value={role.id} key={role.id}>{role.name}</option>
	                  ))}
	                </select>
	              </label>
	              <label className="field" htmlFor="relay-status-readout">
	                <span>Relay status</span>
	                <input id="relay-status-readout" value={titleCase(selectedRelayItem.status)} readOnly />
	              </label>
	            </div>
	            <label className="field" htmlFor="relay-decision-notes">
	              <span>Human decision or answer notes</span>
	              <textarea
	                id="relay-decision-notes"
	                className="notes-input compact-notes"
	                value={relayDecision}
	                onChange={(event) => setRelayDecision(event.target.value)}
	                placeholder="Example: Keep update API payload id/removal rules in the same PR because preview gating depends on persisted DB semantics."
	              />
	            </label>
	            <div className="button-row">
	              <button className="secondary-button" type="button" onClick={() => decideRelayItem('assign')} disabled={handoffBusy}>
	                Assign Lane
	              </button>
	              <button className="secondary-button" type="button" onClick={() => decideRelayItem('answer')} disabled={handoffBusy || !relayDecision.trim()}>
	                Record Answer
	              </button>
	              <button className="secondary-button" type="button" onClick={() => decideRelayItem('reopen')} disabled={handoffBusy}>
	                Reopen
	              </button>
	              <button className="primary-button" type="button" onClick={() => useRelayForNextWorker(selectedRelayItem)} disabled={handoffBusy}>
	                Use For Next Worker
	              </button>
	            </div>
	          </div>
	        ) : null}
	      </Panel>
      <Panel title="Shared Task List" eyebrow="Execution">
        <Checklist items={sharedTaskItems.length ? sharedTaskItems : ['Review generated plan', 'Implement approved scope', 'Add tests', 'Capture evidence']} />
      </Panel>
      <Panel title="Worker Queue" eyebrow="Sequential Relay">
          {workerRuns.length ? (
            <div className="worker-queue-list">
              {workerRuns.slice(0, 8).map((run) => {
                const activeRun = isWorkerRunActive(run.status);
                const preparedRun = isWorkerRunPrepared(run.status);
                const hasResponse = workerRunHasReviewableOutput(run);
                const evidenceBlocked = workerRunBlocksEvidence(run);
                return (
                  <article className={`worker-queue-card ${selectedWorkerRun?.id === run.id ? 'selected' : ''}`} key={run.id}>
                    <div className="worker-queue-main">
                      <div className="worker-queue-title">
                        <strong>{run.workerRoleLabel}</strong>
                        <StatusBadge label={titleCase(run.status)} tone={toneFor(run.status)} />
                      </div>
                      <WorkerRunOutput run={run} />
                      <div className="worker-queue-meta">
                        <span>{titleCase(run.executionAgent)}</span>
                        <span>{titleCase(run.mode)}</span>
                        <span>{run.output?.refreshedAt ? `Refreshed ${formatTime(run.output.refreshedAt)}` : `Created ${formatTime(run.createdAt)}`}</span>
                      </div>
                    </div>
                    <div className="worker-queue-actions">
                      <button className="table-button" type="button" onClick={() => setSelectedWorkerRunId(run.id)}>
                        Review
                      </button>
                      <button className="table-button" type="button" onClick={() => refreshWorkerRunStatus(run.id)} disabled={handoffBusy || !run.statusFile}>
                        Refresh
                      </button>
                      {preparedRun ? (
                        <button className="table-button" type="button" onClick={() => launchPreparedWorkerRun(run.id)} disabled={handoffBusy || !run.scriptFile}>
                          Launch
                        </button>
                      ) : null}
                      {activeRun ? (
                        <button className="table-button danger-action" type="button" onClick={() => stopWorkerRun(run.id)} disabled={handoffBusy}>
                          Stop
                        </button>
                      ) : null}
                      <button className="table-button" type="button" onClick={() => ingestWorkerRun(run.id)} disabled={handoffBusy || !run.responseFile}>
                        Ingest
                      </button>
                      <button
                        className="table-button"
                        type="button"
                        onClick={() => deriveImplementationEvidence(run.id)}
                        disabled={handoffBusy || !hasResponse || evidenceBlocked}
                        title={evidenceBlocked ? workerRunEvidenceBlockReason(run) : undefined}
                      >
                        {evidenceBlocked ? 'Evidence Blocked' : 'Record Evidence'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">No worker lanes launched yet. Start with Lead Planner or Senior Full Stack Dev.</div>
          )}
      </Panel>
      {selectedWorkerRun ? (
        <Panel title="Worker Run Detail" eyebrow="Evidence Relay">
          <div className="worker-run-detail">
            <InfoList
              items={[
                ['Lane', selectedWorkerRun.workerRoleLabel],
                ['Engine', titleCase(selectedWorkerRun.executionAgent)],
                ['Mode', titleCase(selectedWorkerRun.mode)],
	                ['Status', titleCase(selectedWorkerRun.status)],
	                ['Sandbox', selectedWorkerRun.sandboxMode],
	                ['Response size', formatBytes(selectedWorkerRun.output?.responseBytes || 0)],
	                ['Log size', formatBytes(selectedWorkerRun.output?.logBytes || 0)],
	                ['Last refresh', selectedWorkerRun.output?.refreshedAt ? formatTime(selectedWorkerRun.output.refreshedAt) : 'Not refreshed'],
	                ['Created', formatTime(selectedWorkerRun.createdAt)]
	              ]}
	            />
            <div className="worker-detail-summary">
              <span className="eyebrow">Worker Evidence Summary</span>
              <WorkerRunOutput run={selectedWorkerRun} />
            </div>
            <SimpleTable
              columns={['Artifact', 'Path']}
              rows={[
                ['Bundle', selectedWorkerRun.bundleDir || 'Not captured'],
                ['Handoff', selectedWorkerRun.handoffFile || 'Not captured'],
                ['Prompt', selectedWorkerRun.promptFile || 'Not captured'],
                ['Response', selectedWorkerRun.responseFile || 'Not captured'],
                ['Log', selectedWorkerRun.logFile || 'Not captured']
              ]}
            />
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => copyWorkerRunText(selectedWorkerRun.manualCommand, 'Manual command')} disabled={!selectedWorkerRun.manualCommand}>
                Copy Manual Command
              </button>
              <button className="secondary-button" type="button" onClick={() => copyWorkerRunText(selectedWorkerRun.promptFile, 'Prompt path')} disabled={!selectedWorkerRun.promptFile}>
                Copy Prompt Path
              </button>
	              <button className="secondary-button" type="button" onClick={() => copyWorkerRunText(selectedWorkerRun.responseFile, 'Response path')} disabled={!selectedWorkerRun.responseFile}>
	                Copy Response Path
	              </button>
		              <button className="secondary-button" type="button" onClick={() => refreshWorkerRunStatus(selectedWorkerRun.id)} disabled={handoffBusy || !selectedWorkerRun.statusFile}>
		                Refresh Status
		              </button>
		              {isWorkerRunPrepared(selectedWorkerRun.status) ? (
		                <button className="primary-button" type="button" onClick={() => launchPreparedWorkerRun(selectedWorkerRun.id)} disabled={handoffBusy || !selectedWorkerRun.scriptFile}>
		                  Launch Bundle
		                </button>
		              ) : null}
		              {isWorkerRunActive(selectedWorkerRun.status) ? (
		                <button className="secondary-button danger-action" type="button" onClick={() => stopWorkerRun(selectedWorkerRun.id)} disabled={handoffBusy}>
		                  Stop Worker
		                </button>
		              ) : null}
		              <button className="primary-button" type="button" onClick={() => ingestWorkerRun(selectedWorkerRun.id)} disabled={handoffBusy || !workerRunHasReviewableOutput(selectedWorkerRun)}>
		                Ingest Output
		              </button>
		              <button
		                className="secondary-button"
		                type="button"
		                onClick={() => deriveImplementationEvidence(selectedWorkerRun.id)}
		                disabled={handoffBusy || !workerRunHasReviewableOutput(selectedWorkerRun) || workerRunBlocksEvidence(selectedWorkerRun)}
		                title={workerRunBlocksEvidence(selectedWorkerRun) ? workerRunEvidenceBlockReason(selectedWorkerRun) : undefined}
		              >
		                {workerRunBlocksEvidence(selectedWorkerRun) ? 'Repo Verification Blocks Evidence' : 'Record Evidence From Worker'}
		              </button>
		            </div>
	            {selectedWorkerRun.output?.launchStatus ? (
	              <div className="worker-status-card">
	                <div>
	                  <span className="eyebrow">Launch Status</span>
	                  <strong>{titleCase(selectedWorkerRun.output.launchStatus.status || selectedWorkerRun.status)}</strong>
	                  <p>{selectedWorkerRun.output.launchStatus.note || selectedWorkerRun.output.summary || 'Status file was read by ODT.'}</p>
	                </div>
	                <InfoList
	                  items={[
	                    ['Started', selectedWorkerRun.output.launchStatus.startedAt ? formatTime(selectedWorkerRun.output.launchStatus.startedAt) : 'Not captured'],
	                    ['Completed', selectedWorkerRun.output.launchStatus.completedAt ? formatTime(selectedWorkerRun.output.launchStatus.completedAt) : 'Not complete'],
	                    ['Launcher', selectedWorkerRun.output.launchStatus.launcher || selectedWorkerRun.output.launchStatus.launchMode || 'Not captured'],
	                    ['Background PID', selectedWorkerRun.output.launchStatus.backgroundPid || 'Not captured'],
	                    ['Codex PID', selectedWorkerRun.output.launchStatus.codexPid || 'Pending from worker script'],
	                    ['Terminal', selectedWorkerRun.output.launchStatus.terminalConsole ? 'Opened' : selectedWorkerRun.output.launchStatus.terminalConsoleError ? 'Blocked' : 'Not requested'],
	                    ['Exit code', selectedWorkerRun.output.launchStatus.exitCode ?? 'Not captured']
	                  ]}
	                />
	              </div>
	            ) : null}
	            {selectedWorkerRun.logFile || selectedWorkerRun.statusFile ? (
	              <div className="log-tail">
	                <div className="log-tail-head">
	                  <div>
	                    <span className="eyebrow">Live Log Tail</span>
	                    <strong>{isWorkerRunActive(selectedWorkerRun.status) && liveTailEnabled ? 'Following worker output' : 'Latest captured output'}</strong>
	                  </div>
	                  <div className="button-row compact-buttons">
	                    <StatusBadge label={isWorkerRunActive(selectedWorkerRun.status) && liveTailEnabled ? 'Live' : 'Paused'} tone={isWorkerRunActive(selectedWorkerRun.status) && liveTailEnabled ? 'success' : 'neutral'} />
	                    <button className="table-button" type="button" onClick={() => setLiveTailEnabled((value) => !value)}>
	                      {liveTailEnabled ? 'Pause Tail' : 'Follow Tail'}
	                    </button>
	                  </div>
	                </div>
	                <pre>{selectedWorkerRun.output?.logTail || 'Waiting for worker log output. Launch or refresh the selected worker to capture the latest tail.'}</pre>
	              </div>
	            ) : null}
	            {selectedWorkerRun.questions?.length ? (
              <div className="worker-question-list">
                <strong>Open relay questions</strong>
                <ul>
                  {selectedWorkerRun.questions.map((item, index) => (
                    <li key={`${selectedWorkerRun.id}-detail-question-${index}`}>
                      <span>{item.targetLane || 'Next lane'}</span>
                      {item.question}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="muted-copy">No cross-lane questions captured for this worker run.</p>
            )}
          </div>
        </Panel>
      ) : null}
      <Panel title="Quality Gates" eyebrow="Control">
        <Checklist items={qualityGates} />
      </Panel>
    </div>
  );
}


function WorkerRunOutput({ run }) {
  const questions = Array.isArray(run.questions) ? run.questions : [];
  const repoWarnings = Array.isArray(run.output?.repoVerification?.warnings) ? run.output.repoVerification.warnings : [];
  const chips = workerEvidenceChips(run);
  const summary = cleanWorkerSummary(run.output?.summary || run.responseFile || 'Waiting for worker output.');
  return (
    <div className="worker-output-cell">
      <p>{summary}</p>
      {chips.length ? (
        <div className="worker-evidence-chip-row" aria-label={`${run.workerRoleLabel || 'Worker'} evidence summary`}>
          {chips.map((chip) => (
            <span className={`worker-evidence-chip ${chip.tone || 'neutral'}`} key={`${run.id}-${chip.label}`}>
              <strong>{chip.label}</strong>
              {chip.value}
            </span>
          ))}
        </div>
      ) : null}
      {repoWarnings.length ? (
        <ul>
          {repoWarnings.slice(0, 2).map((warning, index) => (
            <li key={`${run.id}-repo-warning-${index}`}>
              <strong>Repo verification:</strong> {warning}
            </li>
          ))}
        </ul>
      ) : null}
      {questions.length ? (
        <ul>
          {questions.slice(0, 3).map((item, index) => (
            <li key={`${run.id}-question-${index}`}>
              <strong>Question for {item.targetLane || 'next lane'}:</strong> {item.question}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function cleanWorkerSummary(value = '') {
  const text = String(value || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\s*[-*]\s+/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 520 ? `${text.slice(0, 520).trim()}...` : text;
}

function workerEvidenceChips(run = {}) {
  const output = run.output || {};
  const questions = Array.isArray(run.questions) ? run.questions : [];
  const reviewerFindings = Array.isArray(output.reviewerFindings) ? output.reviewerFindings : [];
  const blockerFindings = reviewerFindings.filter((finding) => ['blocker', 'warning'].includes(finding.severity));
  const repoVerification = output.repoVerification || {};
  const repoWarnings = Array.isArray(repoVerification.warnings) ? repoVerification.warnings : [];
  const gitChangedFiles = Array.isArray(repoVerification.gitChangedFiles) ? repoVerification.gitChangedFiles : [];
  const chips = [];
  if (output.responseBytes || output.rawText) {
    chips.push({
      label: 'Response',
      value: output.responseBytes ? formatBytes(output.responseBytes) : 'Captured',
      tone: 'success'
    });
  }
  if (output.logBytes || output.logTail) {
    chips.push({
      label: 'Log',
      value: output.logBytes ? formatBytes(output.logBytes) : 'Tail captured',
      tone: 'info'
    });
  }
  if (reviewerFindings.length) {
    chips.push({
      label: 'Review',
      value: blockerFindings.length ? `${blockerFindings.length} action item${blockerFindings.length === 1 ? '' : 's'}` : `${reviewerFindings.length} note${reviewerFindings.length === 1 ? '' : 's'}`,
      tone: blockerFindings.length ? 'warning' : 'info'
    });
  }
  if (questions.length) {
    chips.push({
      label: 'Relay',
      value: `${questions.length} question${questions.length === 1 ? '' : 's'}`,
      tone: 'warning'
    });
  }
  if (repoVerification.status) {
    chips.push({
      label: 'Repo',
      value: repoVerification.status === 'warning'
        ? `${repoWarnings.length || 1} warning${repoWarnings.length === 1 ? '' : 's'}`
        : gitChangedFiles.length
          ? `${gitChangedFiles.length} diff file${gitChangedFiles.length === 1 ? '' : 's'}`
          : 'Verified',
      tone: repoVerification.status === 'warning' ? 'warning' : 'success'
    });
  }
  if (output.rawTextTruncated) {
    chips.push({
      label: 'View',
      value: 'Compacted preview',
      tone: 'neutral'
    });
  }
  if (!chips.length && ['completed', 'response_ready', 'needs_input'].includes(String(run.status || '').toLowerCase())) {
    chips.push({ label: 'Evidence', value: 'Ready to ingest', tone: 'info' });
  }
  return chips;
}
