import {
  WORKFLOW_ALLOWED_ACTIONS,
  WORKFLOW_STAGES,
  WORKFLOW_STATES
} from './workflow.js';

const workflowStateValues = new Set(Object.values(WORKFLOW_STATES));
const workflowStageValues = new Set(Object.values(WORKFLOW_STAGES));
const workflowStatusValues = new Set(['blocked', 'in_progress', 'ready']);

const completedKeys = [
  'requirement',
  'repo',
  'technicalDesign',
  'implementationPlan',
  'standardsCheck',
  'writeApproval',
  'agentHandoff',
  'implementationEvidence',
  'postImplementationCheck',
  'prPack'
];

const countKeys = [
  'standardsBlockers',
  'reviewBlockers',
  'pendingDependencies',
  'failedTests',
  'incompleteTests',
  'prBlockingItems'
];

const latestKeys = [
  'standardsCheckId',
  'postImplementationCheckId',
  'implementationEvidenceId',
  'prReportStatus'
];

const reviewCycleLatestKeys = [
  'reworkRelayItemId',
  'reworkEvidenceId',
  'reviewerRunId',
  'buildVerifierRunId',
  'prReportId'
];

function isObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function hasString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function pushWhen(errors, condition, message) {
  if (condition) errors.push(message);
}

export function validateWorkflowStateContract(workflow) {
  const errors = [];

  if (!isObject(workflow)) {
    return ['Workflow response must be an object.'];
  }

  pushWhen(errors, !hasString(workflow.assignmentId), 'assignmentId must be a non-empty string.');
  pushWhen(errors, !workflowStateValues.has(workflow.state), `state must be one of: ${[...workflowStateValues].join(', ')}.`);
  pushWhen(errors, !hasString(workflow.label), 'label must be a non-empty string.');
  pushWhen(errors, !workflowStageValues.has(workflow.stage), `stage must be one of: ${[...workflowStageValues].join(', ')}.`);
  pushWhen(errors, !workflowStatusValues.has(workflow.status), `status must be one of: ${[...workflowStatusValues].join(', ')}.`);

  if (!isObject(workflow.nextAction)) {
    errors.push('nextAction must be an object.');
  } else {
    pushWhen(errors, !hasString(workflow.nextAction.label), 'nextAction.label must be a non-empty string.');
    pushWhen(errors, !hasString(workflow.nextAction.detail), 'nextAction.detail must be a non-empty string.');
    pushWhen(errors, !hasString(workflow.nextAction.page), 'nextAction.page must be a non-empty string.');
  }

  if (workflow.verificationProfile !== null && workflow.verificationProfile !== undefined && !isObject(workflow.verificationProfile)) {
    errors.push('verificationProfile must be null, undefined, or an object.');
  }

  if (!Array.isArray(workflow.blockedReasons)) {
    errors.push('blockedReasons must be an array.');
  } else {
    workflow.blockedReasons.forEach((reason, index) => {
      if (!isObject(reason)) {
        errors.push(`blockedReasons[${index}] must be an object.`);
        return;
      }
      pushWhen(errors, !hasString(reason.category), `blockedReasons[${index}].category must be a non-empty string.`);
      pushWhen(errors, !hasString(reason.message), `blockedReasons[${index}].message must be a non-empty string.`);
      pushWhen(errors, !hasString(reason.action), `blockedReasons[${index}].action must be a non-empty string.`);
      pushWhen(errors, !hasString(reason.page), `blockedReasons[${index}].page must be a non-empty string.`);
    });
  }

  if (!isObject(workflow.completed)) {
    errors.push('completed must be an object.');
  } else {
    completedKeys.forEach((key) => {
      pushWhen(errors, typeof workflow.completed[key] !== 'boolean', `completed.${key} must be boolean.`);
    });
  }

  if (!Array.isArray(workflow.decisionTrail)) {
    errors.push('decisionTrail must be an array.');
  }

  if (!isObject(workflow.allowedActions)) {
    errors.push('allowedActions must be an object.');
  } else {
    WORKFLOW_ALLOWED_ACTIONS.forEach((key) => {
      pushWhen(errors, typeof workflow.allowedActions[key] !== 'boolean', `allowedActions.${key} must be boolean.`);
    });
  }

  if (!isObject(workflow.counts)) {
    errors.push('counts must be an object.');
  } else {
    countKeys.forEach((key) => {
      pushWhen(errors, typeof workflow.counts[key] !== 'number', `counts.${key} must be a number.`);
    });
  }

  if (!isObject(workflow.latest)) {
    errors.push('latest must be an object.');
  } else {
    latestKeys.forEach((key) => {
      pushWhen(errors, typeof workflow.latest[key] !== 'string', `latest.${key} must be a string.`);
    });
  }

  if (workflow.state === WORKFLOW_STATES.BLOCKED && workflow.blockedReasons?.length < 1) {
    errors.push('BLOCKED workflow state must include at least one blocked reason.');
  }

  if (workflow.state === WORKFLOW_STATES.PR_READY && workflow.status !== 'ready') {
    errors.push('PR_READY workflow state must use status "ready".');
  }

  if (workflow.state === WORKFLOW_STATES.JIRA_COMPLETED_VERIFICATION) {
    pushWhen(errors, !workflow.verificationProfile, 'JIRA_COMPLETED_VERIFICATION requires verificationProfile.');
    pushWhen(errors, workflow.allowedActions?.canLaunchVerification !== true, 'JIRA_COMPLETED_VERIFICATION must allow verification launch.');
    pushWhen(errors, workflow.allowedActions?.canDelegateWrite !== false, 'JIRA_COMPLETED_VERIFICATION must not allow write delegation.');
  }

  return errors;
}

export function assertWorkflowStateContract(workflow) {
  const errors = validateWorkflowStateContract(workflow);
  if (errors.length) {
    throw new Error(`Workflow contract failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
  return workflow;
}

export function validateReviewCycleCloseoutContract(closeout) {
  const errors = [];

  if (!isObject(closeout)) {
    return ['Review cycle closeout must be an object.'];
  }

  pushWhen(errors, !hasString(closeout.assignmentId), 'assignmentId must be a non-empty string.');
  pushWhen(errors, typeof closeout.requiresCloseout !== 'boolean', 'requiresCloseout must be boolean.');
  pushWhen(errors, !hasString(closeout.status), 'status must be a non-empty string.');
  pushWhen(errors, !hasString(closeout.label), 'label must be a non-empty string.');
  pushWhen(errors, typeof closeout.readyForPrPack !== 'boolean', 'readyForPrPack must be boolean.');
  pushWhen(errors, typeof closeout.activeReworkCount !== 'number', 'activeReworkCount must be a number.');

  if (!isObject(closeout.nextAction)) {
    errors.push('nextAction must be an object.');
  } else {
    pushWhen(errors, !hasString(closeout.nextAction.label), 'nextAction.label must be a non-empty string.');
    pushWhen(errors, !hasString(closeout.nextAction.detail), 'nextAction.detail must be a non-empty string.');
    pushWhen(errors, !hasString(closeout.nextAction.page), 'nextAction.page must be a non-empty string.');
  }

  if (!Array.isArray(closeout.steps)) {
    errors.push('steps must be an array.');
  } else {
    closeout.steps.forEach((step, index) => {
      if (!isObject(step)) {
        errors.push(`steps[${index}] must be an object.`);
        return;
      }
      pushWhen(errors, !hasString(step.id), `steps[${index}].id must be a non-empty string.`);
      pushWhen(errors, !hasString(step.label), `steps[${index}].label must be a non-empty string.`);
      pushWhen(errors, !hasString(step.status), `steps[${index}].status must be a non-empty string.`);
      pushWhen(errors, !hasString(step.detail), `steps[${index}].detail must be a non-empty string.`);
    });
  }

  if (!isObject(closeout.latest)) {
    errors.push('latest must be an object.');
  } else {
    reviewCycleLatestKeys.forEach((key) => {
      pushWhen(errors, typeof closeout.latest[key] !== 'string', `latest.${key} must be a string.`);
    });
  }

  if (closeout.requiresCloseout && closeout.steps?.length < 1) {
    errors.push('Closeout requiring rework must include steps.');
  }

  return errors;
}

export function assertReviewCycleCloseoutContract(closeout) {
  const errors = validateReviewCycleCloseoutContract(closeout);
  if (errors.length) {
    throw new Error(`Review cycle closeout contract failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
  return closeout;
}
