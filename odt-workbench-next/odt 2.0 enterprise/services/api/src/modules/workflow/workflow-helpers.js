export function timeMillis(value = '') {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function workerRunTime(run = {}) {
  return timeMillis(run.completedAt || run.updatedAt || run.createdAt);
}

export function latestByTime(items = [], predicate = () => true, getTime = (item) => timeMillis(item?.createdAt)) {
  return (items || [])
    .filter(Boolean)
    .filter(predicate)
    .sort((a, b) => getTime(b) - getTime(a))[0] || null;
}

export function workerHasReviewableOutput(run = {}) {
  const status = String(run.status || '').toLowerCase();
  const output = run.output || {};
  return Boolean(
    String(output.rawText || '').trim()
    || output.responseBytes > 0
    || ['completed', 'response_ready', 'needs_input', 'needs_review'].includes(status)
  );
}

export function getActiveStandardsFindings(evidence = {}) {
  if (evidence.current) return evidence.current.standardsChecks?.[0]?.findings || [];
  if (Array.isArray(evidence.standardsChecks)) return evidence.standardsChecks[0]?.findings || evidence.standardsFindings || [];
  return evidence.standardsFindings || [];
}

export function hasApprovedEvent(approvals = [], types = [], since = '') {
  return approvals.some((approval) => {
    if (approval.status !== 'approved' || !types.includes(approval.approvalType)) return false;
    if (!since) return true;
    return new Date(approval.approvedAt).getTime() >= new Date(since).getTime();
  });
}

export function latestDecisionEvent(approvals = [], types = []) {
  return approvals
    .filter((approval) => types.includes(approval.approvalType) && ['approved', 'blocked'].includes(approval.status))
    .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime())[0] || null;
}

export function hasWriteApproval(evidence = {}) {
  const approvals = evidence.approvals || [];
  const latestCheck = evidence.standardsChecks?.[0];
  const writeApproval = latestDecisionEvent(approvals, ['write_scope', 'approved_to_write', 'APPROVED_TO_WRITE']);
  const blockDecision = latestDecisionEvent(approvals, ['block_implementation']);
  const approvedAfterLatestCheck = latestCheck
    ? new Date(writeApproval?.approvedAt || 0).getTime() >= new Date(latestCheck.createdAt).getTime()
    : false;
  return Boolean(
    writeApproval
    && approvedAfterLatestCheck
    && (!blockDecision || new Date(writeApproval.approvedAt).getTime() > new Date(blockDecision.approvedAt).getTime())
  );
}

export function hasLatestBlockerOverride(evidence = {}) {
  const latestCheck = evidence.standardsChecks?.[0];
  return hasApprovedEvent(evidence.approvals || [], ['standards_blocker_override', 'blocker_override'], latestCheck?.createdAt || '');
}

export function isHardSafetyBlocker(finding = {}) {
  const category = String(finding.category || '').toLowerCase();
  const message = `${finding.message || ''} ${finding.recommendation || ''}`.toLowerCase();
  return (
    category.includes('frontend-secrets')
    || category.includes('destructive')
    || category === 'dependency'
    || category === 'dependency-license'
    || message.includes('frontend secret')
    || message.includes('destructive')
    || message.includes('package installation requires explicit developer approval')
    || message.includes('dependency request before implementation')
  );
}

export function getUnresolvedStandardsBlockers(evidence = {}) {
  const blockers = getActiveStandardsFindings(evidence).filter((finding) => finding.status === 'BLOCKER');
  return hasLatestBlockerOverride(evidence) ? blockers.filter(isHardSafetyBlocker) : blockers;
}

export function getOpenReviewBlockers(evidence = {}) {
  return (evidence.reviewComments || []).filter((comment) => comment.status === 'open' && comment.severity === 'blocker');
}

export function getActiveReworkRelayItemsForWorker(evidence = {}, workerRoleId = '') {
  const roleId = String(workerRoleId || '').trim();
  if (!roleId) return [];
  return (evidence.agentRelayItems || []).filter((item) => (
    item.itemType === 'rework'
    && item.targetWorkerRole === roleId
    && ['open', 'assigned', 'answered'].includes(String(item.status || '').toLowerCase())
  ));
}

export function latestPostImplementationCheck(evidence = {}) {
  return (evidence.standardsChecks || []).find((check) => check.phase === 'post-implementation') || null;
}

export function activeImplementationEvidenceRecords(evidence = {}) {
  const latest = (evidence.implementationEvidence || [])[0] || null;
  return latest ? [latest] : [];
}

export function getActiveImplementationTests(evidence = {}) {
  return activeImplementationEvidenceRecords(evidence).flatMap((record) => record.tests || []);
}

export function getActiveImplementationCommands(evidence = {}) {
  return activeImplementationEvidenceRecords(evidence).flatMap((record) => record.commands || []);
}

export function getFailedImplementationTests(evidence = {}) {
  return getActiveImplementationTests(evidence)
    .filter((test) => test.status === 'failed');
}

export function getIncompleteImplementationTests(evidence = {}) {
  return getActiveImplementationTests(evidence)
    .filter((test) => ['not_run', 'unknown', ''].includes(String(test.status || '').toLowerCase()));
}

export function hasAcceptedImplementationRisk(evidence = {}) {
  return (evidence.reviewComments || []).some((comment) => (
    comment.status === 'accepted_risk'
    && ['implementation', 'pr'].includes(comment.targetType)
  ));
}

export function hasAcceptedVerificationRisk(evidence = {}) {
  return (evidence.reviewComments || []).some((comment) => (
    comment.status === 'accepted_risk'
    && ['review', 'implementation', 'pr'].includes(comment.targetType)
  ));
}

export function humanizeLabel(value = '') {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function isImplementationWorkerRun(run = {}) {
  return ['fullstack-dev', 'backend-dev', 'frontend-dev'].includes(String(run.workerRole || '').toLowerCase());
}

export function isActiveWorkerStatus(status = '') {
  return ['starting', 'running', 'delegated_visible', 'stop_requested'].includes(String(status || '').toLowerCase());
}

export function isPreparedWorkerStatus(status = '') {
  return ['bundle_created', 'manual_fallback'].includes(String(status || '').toLowerCase());
}
