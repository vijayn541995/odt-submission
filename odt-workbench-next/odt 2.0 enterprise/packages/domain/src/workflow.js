export const WORKFLOW_STATES = {
  INTAKE_STARTED: 'INTAKE_STARTED',
  REQUIREMENT_ANALYZED: 'REQUIREMENT_ANALYZED',
  REPO_ANALYZED: 'REPO_ANALYZED',
  TECH_DESIGN_DRAFTED: 'TECH_DESIGN_DRAFTED',
  STANDARDS_REVIEW_PENDING: 'STANDARDS_REVIEW_PENDING',
  PLAN_REVIEW: 'PLAN_REVIEW',
  STANDARDS_REVIEW_PASSED: 'STANDARDS_REVIEW_PASSED',
  APPROVED_TO_WRITE: 'APPROVED_TO_WRITE',
  AGENT_BUNDLE_READY: 'AGENT_BUNDLE_READY',
  AGENT_HANDOFF_PREPARED: 'AGENT_HANDOFF_PREPARED',
  IMPLEMENTING: 'IMPLEMENTING',
  AGENT_OUTPUT_READY: 'AGENT_OUTPUT_READY',
  IMPLEMENTATION_EVIDENCE_RECORDED: 'IMPLEMENTATION_EVIDENCE_RECORDED',
  POST_IMPLEMENTATION_REVIEW: 'POST_IMPLEMENTATION_REVIEW',
  REVIEW_CYCLE_CLOSEOUT: 'REVIEW_CYCLE_CLOSEOUT',
  JIRA_COMPLETED_VERIFICATION: 'JIRA_COMPLETED_VERIFICATION',
  PR_READY: 'PR_READY',
  BLOCKED: 'BLOCKED'
};

export const WORKFLOW_STAGES = {
  INTAKE: 'intake',
  ANALYZE: 'analyze',
  DESIGN: 'design',
  STANDARDS: 'standards',
  IMPLEMENT: 'implement',
  TEST: 'test',
  REVIEW: 'review',
  PR: 'pr'
};

export const WORKFLOW_ALLOWED_ACTIONS = [
  'canRunStandardsCheck',
  'canApproveWrite',
  'canDelegateWrite',
  'canLaunchVerification',
  'canRecordImplementationEvidence',
  'canPreparePr',
  'dependencyInstallsRequireSeparateApproval'
];

export function workflowStateFromData(data) {
  return data?.evidence?.workflowState || data?.snapshot?.assignments?.[0]?.workflowState || null;
}

export function workflowAllows(workflow, key, fallback = false) {
  const value = workflow?.allowedActions?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function jiraVerificationState(workflow) {
  const verificationProfile = workflow?.verificationProfile || null;
  return {
    verificationProfile,
    completedJiraVerification: verificationProfile?.state === 'completed' && verificationProfile?.mode === 'verification'
  };
}

export function workerRunHasReviewableOutput(run = {}) {
  const status = String(run.status || '').toLowerCase();
  const output = run.output || {};
  return Boolean(
    String(output.rawText || '').trim()
    || output.responseBytes > 0
    || ['completed', 'response_ready', 'needs_input', 'needs_review'].includes(status)
  );
}

export function workerRunBlocksEvidence(run = {}) {
  const repoVerification = run.output?.repoVerification || {};
  return repoVerification.status === 'warning';
}

export function workerRunEvidenceBlockReason(run = {}) {
  const warnings = run.output?.repoVerification?.warnings || [];
  return warnings[0] || 'ODT cannot record implementation evidence until worker output matches the current target repository diff.';
}

export function verificationTestPassed(test = {}) {
  return String(test.status || '').toLowerCase() === 'passed';
}
