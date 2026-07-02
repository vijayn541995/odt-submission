import React from 'react';
import { StatusBadge } from './StatusBadge.js';

function defaultTitleCase(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function defaultWorkflowTone(workflow) {
  const state = workflow?.state || workflow;
  if (!state) return 'neutral';
  if (state === 'PR_READY') return 'success';
  if (state === 'BLOCKED' || state === 'FAILED') return 'danger';
  if (state === 'APPROVED_TO_WRITE' || state === 'IMPLEMENTATION_EVIDENCE_RECORDED' || state === 'POST_IMPLEMENTATION_REVIEW') return 'info';
  if (String(state).includes('PENDING') || String(state).includes('REVIEW') || String(state).includes('INTAKE')) return 'warning';
  return 'info';
}

export function WorkflowDecisionBar({
  workflow,
  onNavigate,
  titleCase = defaultTitleCase,
  workflowTone = defaultWorkflowTone
}) {
  if (!workflow) return null;
  const blockers = workflow.blockedReasons || [];
  const nextAction = workflow.nextAction || { label: 'Continue', detail: 'Review the current workflow evidence.', page: 'overview' };
  const transitionSummary = workflow.allowedActions
    ? [
      workflow.allowedActions.canRunStandardsCheck ? 'Standards check' : '',
      workflow.allowedActions.canApproveWrite ? 'Write approval' : '',
      workflow.allowedActions.canDelegateWrite ? 'Agent delegation' : '',
      workflow.allowedActions.canRecordImplementationEvidence ? 'Implementation evidence' : '',
      workflow.allowedActions.canPreparePr ? 'PR package' : ''
    ].filter(Boolean).join(', ') || 'No write-side transition unlocked yet'
    : 'Workflow state is loading';

  return (
    <section className={`workflow-decision-bar ${blockers.length ? 'blocked' : 'clear'}`} aria-label="Current workflow decision">
      <div>
        <span className="eyebrow">Current State</span>
        <strong>{workflow.label}</strong>
        <p>{blockers.length ? `Critical blocker: ${blockers[0].message}` : `Available next transition: ${transitionSummary}.`}</p>
      </div>
      <div className="workflow-decision-actions">
        <StatusBadge label={workflow.state} tone={workflowTone(workflow)} />
        <button className={blockers.length ? 'secondary-button' : 'primary-button'} type="button" onClick={() => onNavigate(nextAction.page || 'overview')}>
          {nextAction.label}
        </button>
      </div>
    </section>
  );
}
