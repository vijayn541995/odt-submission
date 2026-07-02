import React, { useState } from 'react';
import {
  activeAssignmentId,
  currentEvidenceItems,
  historicalEvidenceItems,
  jiraVerificationState,
  latestRepoAnalysisFromData,
  rankedImpactCandidates,
  standardsGateState,
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
import { formatTime, titleCase } from '../../utils/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`PlannerPage requires ${name}`);
  }
  return value;
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
}

function summarizeItems(value, fallback = 'Not captured yet.', limit = 3) {
  const items = normalizeList(value);
  if (!items.length) return fallback;
  const visible = items.slice(0, limit).join('; ');
  return items.length > limit ? `${visible}; +${items.length - limit} more` : visible;
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

function standardsTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('block')) return 'danger';
  if (text.includes('warning') || text.includes('approval') || text.includes('review') || text.includes('required')) return 'warning';
  if (text.includes('pass') || text.includes('approved') || text.includes('ready') || text.includes('decided') || text.includes('accepted') || text.includes('resolved')) return 'success';
  return 'neutral';
}

function formatImpactCandidateCompact(item = {}) {
  const score = item.score || 0;
  const confidence = item.confidence || 'low';
  return `${item.file || 'Unknown file'} (score ${score}, ${confidence})`;
}

export function PlannerPage({
  data,
  setActivePage,
  actions = {},
  helpers = {},
  slots = {}
}) {
  const postJson = requireDependency(actions.postJson, 'actions.postJson');
  const currentWorkBrief = requireDependency(helpers.currentWorkBrief, 'helpers.currentWorkBrief');
  const resolvedClarificationGate = requireDependency(helpers.resolvedClarificationGate, 'helpers.resolvedClarificationGate');
  const isClarificationOpen = requireDependency(helpers.isClarificationOpen, 'helpers.isClarificationOpen');
  const getStoredSetting = requireDependency(helpers.getStoredSetting, 'helpers.getStoredSetting');
  const CurrentWorkBrief = requireDependency(slots.CurrentWorkBrief, 'slots.CurrentWorkBrief');
  const navigate = requireDependency(setActivePage, 'setActivePage');

  const assignmentId = activeAssignmentId(data);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const workflow = workflowStateFromData(data);
  const { verificationProfile, completedJiraVerification } = jiraVerificationState(workflow);
  const gate = standardsGateState(data.evidence);
  const latestCheck = gate.latestCheck;
  const blockers = gate.unresolvedBlockers;
  const reviewBlockers = gate.reviewBlockers || [];
  const reviewedBlockers = gate.blockerFindings;
  const writeApproved = gate.writeApproved;
  const selectedAgent = getStoredSetting(data, 'executionAgent', 'codex');
  const dependencyRequests = currentEvidenceItems(data.evidence, 'dependencyRequests');
  const approvedDependencies = dependencyRequests.filter((request) => request.status === 'approved');
  const pendingDependencies = dependencyRequests.filter((request) => request.status === 'pending');
  const currentPlans = currentEvidenceItems(data.evidence, 'implementationPlans');
  const currentDesigns = currentEvidenceItems(data.evidence, 'technicalDesigns');
  const historicalPlans = historicalEvidenceItems(data.evidence, 'implementationPlans');
  const latestPlanRecord = currentPlans[0] || null;
  const latestDesignRecord = currentDesigns[0] || null;
  const latestPlan = latestPlanRecord?.planJson || {};
  const latestDesign = latestDesignRecord?.designJson || {};
  const latestRepoAnalysis = latestRepoAnalysisFromData(data);
  const latestImpact = latestRepoAnalysis.impactAnalysis || {};
  const rankedImpact = rankedImpactCandidates(data);
  const hiddenHistoricalPlan = !latestPlanRecord ? historicalPlans[0] : null;
  const latestRequirement = data.evidence?.requirements?.[0] || {};
  const requirementSignals = data.evidence?.requirementSignals || {};
  const workBrief = currentWorkBrief(data);
  const clarificationGate = resolvedClarificationGate(
    latestPlan.clarificationGate || latestDesign.clarificationGate || requirementSignals.clarifyingQuestions,
    data
  );
  const unresolvedClarifications = clarificationGate.filter(isClarificationOpen);
  const verificationPlanFallback = completedJiraVerification ? {
    scope: [
      'Verify Jira Done status against repo evidence.',
      'Review Jira-linked commits and branch or PR state.',
      'Capture build/test verification evidence before PR readiness.'
    ],
    frontendTasks: [
      'Confirm visible UI acceptance criteria from Jira.',
      'Check whether the completed change needs accessibility review evidence.',
      'Send explicit rework only if Reviewer finds a gap.'
    ],
    validationTasks: [
      'Launch Reviewer first.',
      'Launch Build Verifier after reviewer pass or explicit approval.',
      'Record verification evidence in Review.'
    ],
    backendTasks: [
      'Inspect Jira-linked commit evidence.',
      'Confirm branch/PR/release state.',
      'Package verified evidence for PR Ready.'
    ],
    testTasks: [
      'Run approved targeted repo test/build command, or capture accepted-risk notes if unavailable.'
    ],
    filesToChange: [],
    filesToReview: [
      'Jira-linked commit diffs',
      'Files changed by matching commits',
      'Targeted tests from reviewer/build evidence'
    ]
  } : {};
  const planView = latestPlanRecord ? latestPlan : verificationPlanFallback;
  const planTitle = latestPlan.title || latestDesign.title || (completedJiraVerification ? `${verificationProfile?.issueKey || 'Completed Jira'} Verification Plan` : latestRequirement.summary || 'Implementation Plan');
  const canApproveWrite = workflowAllows(workflow, 'canApproveWrite', Boolean(latestCheck && !reviewBlockers.length && !writeApproved)) && !blockers.length;
  const canDelegateWrite = workflowAllows(workflow, 'canDelegateWrite', Boolean(writeApproved && !blockers.length && !reviewBlockers.length));
  const effectiveGateStatus = gate.implementationBlocked
    ? 'BLOCKED_BY_REVIEW'
    : writeApproved && !blockers.length
      ? gate.blockerOverride ? 'WRITE_APPROVED_WITH_OVERRIDE' : 'WRITE_APPROVED'
      : latestCheck?.status || 'Not Run';
  const delegateReason = canDelegateWrite
    ? `${titleCase(selectedAgent)} can receive the write-approved handoff.`
    : blockers.length || reviewBlockers.length
      ? 'Review standards blockers or resolve/accept review blockers before delegation.'
      : latestCheck
        ? 'Capture write approval for the latest standards review before delegation.'
        : 'Run Standards Check before delegation.';

  async function requestChanges() {
    setBusy(true);
    setNotice('');
    try {
      await postJson('/api/approvals', {
        assignmentId,
        approvalType: 'plan_review',
        status: 'needs_changes',
        notes: 'Reviewer requested plan changes before write approval.'
      });
      setNotice('Review comment recorded. The plan remains blocked until updates are made.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to record requested changes.');
    } finally {
      setBusy(false);
    }
  }

  async function approveWriteScope() {
    if (!canApproveWrite) return;
    setBusy(true);
    setNotice('');
    try {
      await postJson('/api/approvals', {
        assignmentId,
        approvalType: 'write_scope',
        status: 'approved',
        notes: `Approved write scope for ${titleCase(selectedAgent)} after standards review.`
      });
      setNotice(`Write scope approved. ${titleCase(selectedAgent)} handoff can move from read-only to write-approved mode.`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to approve write scope.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Planner"
        title={planTitle}
        copy={workBrief.hasRealWork
          ? `Plan evidence for ${workBrief.repoName || 'the selected repo'}: ${summarizeItems(workBrief.behaviors, 'review the captured requirement, repo signals, standards findings, and test plan before approval.', 2)}`
          : 'The plan should cover scope, impacted files, API/data/UI changes, validation, accessibility, security, performance, tests, rollback, and open questions before writes are approved.'}
      />
      {notice ? <div className="info-banner" role="status">{notice}</div> : null}
      <WorkflowDecisionBar workflow={workflow} onNavigate={navigate} titleCase={titleCase} workflowTone={workflowTone} />
      <CurrentWorkBrief data={data} onNavigate={navigate} compact />
      {hiddenHistoricalPlan ? (
        <div className="info-banner" role="status">
          Planner is hiding historical plan "{hiddenHistoricalPlan.title}" from {formatTime(hiddenHistoricalPlan.createdAt)} because it predates the active requirement. Open Artifacts to review older evidence.
        </div>
      ) : null}
      <div className="two-column wide-left">
        <Panel title="Plan Summary" eyebrow={latestPlanRecord ? 'Current Plan' : completedJiraVerification ? 'Verification Plan' : 'Draft Plan'}>
          <ActionList
            items={[
              [planTitle, summarizeItems(planView.scope || latestDesign.scope, 'Generate a plan to create requirement-specific scope evidence.')],
              [completedJiraVerification ? 'Verification focus' : 'Frontend behavior', summarizeItems(planView.frontendTasks, completedJiraVerification ? 'Reviewer should inspect UI acceptance evidence.' : 'Frontend behavior tasks have not been captured yet.')],
              [completedJiraVerification ? 'Evidence checks' : 'Validation and API rules', summarizeItems([...(planView.validationTasks || []), ...(planView.backendTasks || [])], completedJiraVerification ? 'Verification evidence has not been captured yet.' : 'Validation and API rules have not been captured yet.')],
              ['Targeted tests', summarizeItems(planView.testTasks || currentEvidenceItems(data.evidence, 'testPlans')?.[0]?.planJson?.targetedCommands, 'Targeted tests have not been captured yet.')]
            ]}
          />
        </Panel>
        <Panel title="Approval Gate" eyebrow="Human Control">
          <div className="approval-box">
            <StatusBadge label={workflow?.state || (writeApproved ? 'APPROVED_TO_WRITE' : 'PLAN_REVIEW')} tone={workflowTone(workflow || (writeApproved ? 'APPROVED_TO_WRITE' : 'PLAN_REVIEW'))} />
            <p>AI can recommend next steps, but write/delegate actions remain blocked until standards evidence is reviewed and a human approves scope.</p>
            <button type="button" className="primary-button" onClick={() => navigate('standards')}>Review Standards Gate</button>
            <button
              type="button"
              className="secondary-button"
              onClick={approveWriteScope}
              disabled={busy || !canApproveWrite}
              title={blockers.length ? 'Review and override blockers in Standards before write approval.' : writeApproved ? 'Write scope is already approved.' : 'Approve write scope after standards review.'}
            >
              {writeApproved ? 'Write Scope Approved' : 'Approve Write Scope'}
            </button>
            <button type="button" className="secondary-button" onClick={requestChanges} disabled={busy}>{busy ? 'Recording' : 'Request Changes'}</button>
          </div>
        </Panel>
      </div>
      <div className="two-column">
        <Panel title="Requirement-Specific Evidence" eyebrow="Plan Inputs">
          <InfoList
            items={[
              ['Assignment', data.evidence?.assignment?.title || planTitle],
              ['Target repo', requirementSignals.targetRepo || latestDesign.targetRepo || data.evidence?.assignment?.repoPath],
              ['API endpoint', requirementSignals.endpoint || latestDesign.apiChanges?.[0] || 'Not captured'],
              ['Domain', completedJiraVerification ? 'Completed Jira verification' : requirementSignals.domainSignals?.longTextOverflow ? 'Long text layout overflow' : requirementSignals.domainSignals?.assessment ? 'Assessment activity workflow' : 'General workflow']
            ]}
          />
        </Panel>
        <Panel title="Impacted Files and Tests" eyebrow="Implementation Surface">
          <SimpleTable
            columns={['Type', 'Evidence']}
            rows={[
              ['Files to change', summarizeItems(planView.filesToChange, completedJiraVerification ? 'No target repo writes until Reviewer creates explicit rework.' : 'Not captured yet.')],
              ['Files to review', summarizeItems(planView.filesToReview || latestDesign.candidateFiles, 'Not captured yet.')],
              ['Ranked candidates', rankedImpact.length ? summarizeItems(rankedImpact.slice(0, 6).map(formatImpactCandidateCompact), 'No ranked candidates yet.') : latestImpact.notes || 'No ranked candidates yet.'],
              ['Test commands/files', summarizeItems(planView.testTasks, 'Not captured yet.')],
              ['Clarifications', clarificationGate.length ? unresolvedClarifications.length ? `${unresolvedClarifications.length} question(s) need a decision.` : `${clarificationGate.length} demo decision(s) captured.` : 'No clarification gate generated yet.']
            ]}
          />
        </Panel>
      </div>
      <Panel title="Ranked Impact Analysis" eyebrow="Repo-Aware Planning">
        <SimpleTable
          columns={['File', 'Score', 'Confidence', 'Role', 'Why ODT selected it']}
          rows={rankedImpact.slice(0, 12).map((item) => [
            item.file,
            item.score || 0,
            <StatusBadge label={titleCase(item.confidence || 'low')} tone={item.confidence === 'high' ? 'success' : item.confidence === 'medium' ? 'warning' : 'neutral'} />,
            item.fileRole || 'Source',
            item.reason || 'Ranked from requirement and repo signals.'
          ])}
          empty={latestImpact.notes || 'Run repo analysis with an absolute local path to rank impacted files. Browser folder mode cannot expose enough path/content detail for scoring.'}
        />
        <div className="impact-summary-strip" aria-label="Repo impact summary">
          <span>{latestImpact.scannedFiles || 0} files scanned</span>
          <span>{latestImpact.matchedFiles || 0} matched</span>
          <span>{latestImpact.blastRadius || rankedImpact.length || 0} blast radius</span>
          <span>{summarizeItems(latestImpact.searchTerms, 'No search terms yet.', 8)}</span>
        </div>
      </Panel>
      <Panel title="Clarification Gate" eyebrow="Before Write Approval">
        <SimpleTable
          columns={['Status', 'Question', 'Decision / Assumption', 'Owner']}
          rows={clarificationGate.map((item) => [
            <StatusBadge label={item.severity || 'NEEDS_REVIEW'} tone={standardsTone(item.severity || 'NEEDS_REVIEW')} />,
            item.question,
            item.decision || item.defaultAssumption,
            item.decisionOwner || 'Developer'
          ])}
          empty="No clarification questions captured. Codex may still raise implementation-time questions if repo analysis finds new ambiguity."
        />
      </Panel>
      <Panel title="Standards Gate Checklist" eyebrow="Pre-Write Control">
        <SimpleTable
          columns={['Gate', 'Current State', 'What It Means']}
          rows={[
            ['Standards Review', <StatusBadge label={effectiveGateStatus} tone={standardsTone(effectiveGateStatus)} />, 'A plan must be checked before implementation begins.'],
            ['Critical Blockers', <StatusBadge label={blockers.length || reviewBlockers.length ? `${blockers.length + reviewBlockers.length} Open` : reviewedBlockers.length ? 'Reviewed Override' : 'None Found'} tone={blockers.length || reviewBlockers.length ? 'danger' : 'success'} />, 'Blockers require explicit review. Standards blockers can be overridden with notes; review blockers can be resolved or accepted as risk.'],
            ['Policy Flexibility', <StatusBadge label="Controlled Override" tone="info" />, 'Theme, labels, warnings, and reviewed blockers can be overridden with notes.'],
            ['Write Approval', <StatusBadge label={writeApproved ? 'Captured' : 'Required'} tone={writeApproved ? 'success' : 'warning'} />, 'Codex/Cline implementation stays read-only until approved.']
          ]}
        />
      </Panel>
      <div className="two-column">
        <Panel title="Critical Blockers" eyebrow="Needs Resolution">
          <SimpleTable
            columns={['Category', 'Status', 'Blocker', 'Required Action']}
            rows={reviewedBlockers.map((finding) => [
              titleCase(finding.category),
              <StatusBadge label={gate.blockerOverride ? 'Reviewed Override' : 'Open'} tone={gate.blockerOverride ? 'success' : 'danger'} />,
              finding.message,
              finding.recommendation
            ])}
            empty="No critical blockers. Review warnings in Standards before approving writes."
          />
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => navigate('standards')}>Review Findings</button>
            <button className="secondary-button" type="button" onClick={() => navigate('artifacts')}>View Evidence</button>
          </div>
        </Panel>
        <Panel title="Agent Handoff" eyebrow="Delegate">
          <InfoList
            items={[
              ['Selected agent', titleCase(selectedAgent)],
              ['Delegation mode', canDelegateWrite ? 'Write-approved' : 'Read-only'],
              ['Write approval', writeApproved ? 'Captured' : 'Required'],
              ['Review decision', gate.implementationBlocked ? 'Implementation blocked' : 'No active block'],
              ['Dependency installs', approvedDependencies.length ? `${approvedDependencies.length} approved package(s)` : pendingDependencies.length ? `${pendingDependencies.length} pending approval` : 'Blocked'],
              ['Blocker gate', blockers.length || reviewBlockers.length ? `${blockers.length + reviewBlockers.length} unresolved` : gate.blockerOverride ? 'Reviewed override' : 'Clear']
            ]}
          />
          <p className="muted-copy">{delegateReason}</p>
          <div className="button-row vertical">
            <button
              className="primary-button"
              type="button"
              onClick={() => navigate('team')}
              disabled={!canDelegateWrite}
              title={canDelegateWrite ? `Open ${titleCase(selectedAgent)} handoff.` : 'Review findings, override accepted blockers if needed, and approve write scope before delegating implementation.'}
            >
              Delegate to {titleCase(selectedAgent)}
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('team')}>Open Agent Team</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
