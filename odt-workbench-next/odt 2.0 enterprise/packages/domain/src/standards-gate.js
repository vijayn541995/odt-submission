import { currentEvidenceItems } from './evidence-selectors.js';

export function activeStandardsFindings(evidence) {
  const currentChecks = currentEvidenceItems(evidence, 'standardsChecks');
  if (evidence?.current) return currentChecks?.[0]?.findings || [];
  return currentChecks?.[0]?.findings || evidence?.standardsChecks?.[0]?.findings || evidence?.standardsFindings || [];
}

export function standardsGateState(evidence) {
  const latestCheck = currentEvidenceItems(evidence, 'standardsChecks')?.[0] || null;
  const findings = activeStandardsFindings(evidence);
  const approvals = currentEvidenceItems(evidence, 'approvals');
  const reviewBlockers = currentEvidenceItems(evidence, 'reviewComments').filter((comment) => comment.status === 'open' && comment.severity === 'blocker');
  const blockerOverride = hasRecentApproval(approvals, ['standards_blocker_override', 'blocker_override'], latestCheck?.createdAt);
  const warningOverride = hasRecentApproval(approvals, ['standards_warning_override', 'warning_override'], latestCheck?.createdAt);
  const writeApproval = latestApproval(approvals, ['write_scope', 'approved_to_write', 'APPROVED_TO_WRITE']);
  const blockDecision = latestApproval(approvals, ['block_implementation']);
  const writeApprovalIsCurrent = latestCheck
    ? new Date(writeApproval?.approvedAt || 0).getTime() >= new Date(latestCheck.createdAt).getTime()
    : false;
  const implementationBlocked = Boolean(
    reviewBlockers.length
    || (blockDecision && (!writeApproval || new Date(blockDecision.approvedAt).getTime() > new Date(writeApproval.approvedAt).getTime()))
  );
  const writeApproved = Boolean(writeApproval && writeApprovalIsCurrent && !implementationBlocked);
  const blockerFindings = findings.filter((finding) => finding.status === 'BLOCKER');
  const hardSafetyBlockers = blockerFindings.filter(isHardSafetyBlocker);
  const unresolvedBlockers = blockerOverride ? hardSafetyBlockers : blockerFindings;
  return {
    latestCheck,
    findings,
    approvals,
    blockerFindings,
    hardSafetyBlockers,
    unresolvedBlockers,
    reviewBlockers,
    blockerOverride,
    warningOverride,
    writeApproved,
    implementationBlocked
  };
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

export function latestApproval(approvals, types) {
  return approvals
    .filter((approval) => types.includes(approval.approvalType) && ['approved', 'blocked'].includes(approval.status))
    .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime())[0] || null;
}

export function hasRecentApproval(approvals, types, since) {
  return approvals.some((approval) => {
    if (approval.status !== 'approved' || !types.includes(approval.approvalType)) return false;
    if (!since) return true;
    return new Date(approval.approvedAt).getTime() >= new Date(since).getTime();
  });
}
