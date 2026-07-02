import { deriveReviewCycleCloseout } from './review-cycle-closeout.js';
import { deriveWorkflowState as defaultDeriveWorkflowState } from './workflow-state.js';

export const WORKFLOW_MODULE_ID = 'workflow';

export const workflowModuleOwnership = {
  id: WORKFLOW_MODULE_ID,
  legacySource: 'server/index.js',
  legacyFunctions: [
    'collectEvidence',
    'deriveWorkflowState',
    'deriveReviewCycleCloseout',
    'buildWorkflowDecisionTrail',
    'deriveJiraVerificationProfile',
    'scopedCurrentEvidence',
    'splitEvidenceByFreshness'
  ],
  routes: [
    'GET /api/workflow/state/:assignmentId',
    'GET /api/review/cycle/:assignmentId/closeout'
  ],
  owns: [
    'assignment workflow state',
    'review cycle closeout state',
    'allowed workflow actions',
    'blocked reasons',
    'decision trail',
    'completed-Jira verification mode',
    'PR-readiness workflow gates'
  ]
};

export function createWorkflowStateService({ collectEvidence, deriveWorkflowState }) {
  if (typeof collectEvidence !== 'function') {
    throw new TypeError('createWorkflowStateService requires collectEvidence');
  }
  if (typeof deriveWorkflowState !== 'function') {
    throw new TypeError('createWorkflowStateService requires deriveWorkflowState');
  }

  return {
    getWorkflowState(assignmentId = 'assignment-local-mvp') {
      return deriveWorkflowState(collectEvidence(assignmentId));
    }
  };
}

export function createWorkflowService({
  collectEvidence,
  deriveWorkflowState = defaultDeriveWorkflowState,
  deriveReviewCycleCloseout: closeoutCalculator = deriveReviewCycleCloseout
}) {
  if (typeof collectEvidence !== 'function') {
    throw new TypeError('createWorkflowService requires collectEvidence');
  }
  if (typeof deriveWorkflowState !== 'function') {
    throw new TypeError('createWorkflowService deriveWorkflowState must be a function when provided');
  }
  if (typeof closeoutCalculator !== 'function') {
    throw new TypeError('createWorkflowService requires deriveReviewCycleCloseout');
  }

  const getEvidence = (assignmentId = 'assignment-local-mvp') => collectEvidence(assignmentId);

  return {
    getEvidence,
    getWorkflowState(assignmentId = 'assignment-local-mvp') {
      const evidence = getEvidence(assignmentId);
      if (evidence.workflowState) return evidence.workflowState;
      return deriveWorkflowState(evidence);
    },
    getReviewCycleCloseout(assignmentId = 'assignment-local-mvp') {
      const evidence = getEvidence(assignmentId);
      return evidence.reviewCycleCloseout || closeoutCalculator(evidence.current || evidence);
    }
  };
}
