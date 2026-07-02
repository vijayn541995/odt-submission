import React from 'react';
import {
  standardsGateState,
  workflowStateFromData
} from '@odt/domain';
import {
  MetricCard,
  PageHeader,
  Panel,
  StatusBadge,
  Timeline
} from '../../primitives/index.js';
import { formatTime, titleCase, toneFor } from '../../utils/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`OverviewPage requires ${name}`);
  }
  return value;
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

export function OverviewPage({
  data,
  setActivePage,
  helpers = {},
  slots = {}
}) {
  const currentWorkBrief = requireDependency(helpers.currentWorkBrief, 'helpers.currentWorkBrief');
  const ErrorBanner = requireDependency(slots.ErrorBanner, 'slots.ErrorBanner');
  const CurrentWorkBrief = requireDependency(slots.CurrentWorkBrief, 'slots.CurrentWorkBrief');
  const WorkflowProgress = requireDependency(slots.WorkflowProgress, 'slots.WorkflowProgress');
  const WorkflowStatePanel = requireDependency(slots.WorkflowStatePanel, 'slots.WorkflowStatePanel');
  const StandardsGateSummary = requireDependency(slots.StandardsGateSummary, 'slots.StandardsGateSummary');
  const StepperList = requireDependency(slots.StepperList, 'slots.StepperList');
  const navigate = requireDependency(setActivePage, 'setActivePage');

  const summary = data.snapshot?.usageSummary || {};
  const assignments = data.snapshot?.assignments || [];
  const runs = data.runs || [];
  const workflow = workflowStateFromData(data);
  const workBrief = currentWorkBrief(data);
  const openReviews = assignments.filter((item) => String(item.status).includes('review')).length;
  const gate = standardsGateState(data.evidence);
  const latestCheck = gate.latestCheck;
  const findings = gate.findings;
  const nextAction = workflow?.nextAction || {
    label: openReviews ? 'Review pending plan' : latestCheck ? 'Continue from Standards Gate' : 'Run standards review',
    detail: openReviews ? 'A plan or output is waiting for human review before write approval.' : latestCheck ? 'Use the latest findings to decide whether the plan needs changes or a controlled approval note.' : 'Create standards evidence before any implementation or PR readiness step.',
    page: openReviews ? 'planner' : 'standards'
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Overview"
        title={workBrief.hasRealWork ? workBrief.title : 'Requirement to PR-ready workbench'}
        copy={workBrief.hasRealWork
          ? `${workBrief.domain}. ODT is tracking repo evidence, behavior rules, standards gates, approvals, tests, and PR readiness for this work item.`
          : 'Guide a real engineering change from requirement and repo intake through codebase analysis, gap discovery, technical design, compliance planning, implementation review, testing, and PR readiness.'}
        actions={(
          <>
            <button className="primary-button" type="button" onClick={() => navigate('intake')}>New Intake</button>
            <button className="secondary-button" type="button" onClick={() => navigate('guide')}>Open ODT Guide</button>
            <button className="secondary-button" type="button" onClick={() => navigate('standards')}>View Standards</button>
          </>
        )}
      />
      <ErrorBanner error={data.error} />
      <CurrentWorkBrief data={data} onNavigate={navigate} />
      <WorkflowProgress activeStage={workflow?.stage || 'intake'} />
      <div className="metric-grid">
        <MetricCard label="Workflow State" value={workflow?.label || 'Intake Started'} detail={nextAction.label} tone={workflowTone(workflow)} />
        <MetricCard label="Assignments" value={assignments.length} detail="Local work items" tone="info" />
        <MetricCard label="Active Runs" value={runs.filter((run) => run.status === 'running').length} detail={`${runs.length} recent runs`} tone="success" />
        <MetricCard label="AI Requests" value={summary.requestsToday || 0} detail={`${summary.totalTokensToday || 0} tokens today`} tone="accent" />
        <MetricCard label="Blocked Items" value={workflow?.blockedReasons?.length || 0} detail="Derived from evidence" tone={workflow?.blockedReasons?.length ? 'danger' : 'success'} />
      </div>
      <div className="two-column">
        <Panel title="Continue Work" eyebrow="Active Work">
          <div className="work-list">
            {assignments.map((item) => (
              <div className="work-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.requirement}</span>
                  <div className="mini-meta">
                    <StatusBadge label={`Stage: ${workflow?.label || 'Intake Started'}`} tone={workflowTone(workflow)} />
                    <StatusBadge label={`Owner: ${item.owner || 'RF'}`} tone="neutral" />
                    <StatusBadge label={`Updated: ${formatTime(item.updatedAt)}`} tone="neutral" />
                  </div>
                  <div className="button-row compact-buttons">
                    <button className="table-button" type="button" onClick={() => navigate('intake')}>Continue</button>
                    <button className="table-button" type="button" onClick={() => navigate('planner')}>Review Plan</button>
                    <button className="table-button" type="button" onClick={() => navigate('artifacts')}>View Evidence</button>
                  </div>
                </div>
                <StatusBadge label={titleCase(item.status)} tone={toneFor(item.status)} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Next Best Action" eyebrow="Guidance">
          <div className="next-action">
            <strong>{nextAction.label}</strong>
            <p>{nextAction.detail}</p>
            <button className="primary-button" type="button" onClick={() => navigate(nextAction.page || 'standards')}>
              {nextAction.label}
            </button>
          </div>
        </Panel>
      </div>
      <WorkflowStatePanel workflow={workflow} onNavigate={navigate} />
      <div className="two-column">
        <Panel title="Standards Gate" eyebrow="Quality">
          <StandardsGateSummary findings={findings} latestCheck={latestCheck} gate={gate} />
        </Panel>
        <Panel title="Governed Delivery Flow" eyebrow="Workflow">
          <StepperList
            items={[
              ['Intake requirement and repo', 'Capture Jira, branch, scope, acceptance criteria, and target module.'],
              ['Analyze requirement and codebase', 'Identify architecture, patterns, impacted files, and requirement gaps.'],
              ['Draft design and test plan', 'Include accessibility, VPAT/WCAG/Section 508, security, performance, and dependency checks.'],
              ['Review standards gate', 'Resolve blockers or capture controlled approval notes for warnings.'],
              ['Approve, implement, verify', 'Codex/Cline writes only after approval; ODT records evidence.'],
              ['Prepare PR-ready summary', 'Map acceptance criteria, tests, accessibility, security, risks, and rollback.']
            ]}
          />
        </Panel>
      </div>
      <Panel title="Recent Activity" eyebrow="Timeline">
        <Timeline events={data.runs.slice(0, 5).map((run) => ({
          title: `${titleCase(run.requestType)} run ${titleCase(run.status)}`,
          detail: `${run.provider || 'local'} provider, ${run.eventCount} event(s)`,
          createdAt: run.updatedAt,
          status: run.status
        }))} empty="No run activity yet. Ask ODT Guide a question to create the first event." />
      </Panel>
    </div>
  );
}
