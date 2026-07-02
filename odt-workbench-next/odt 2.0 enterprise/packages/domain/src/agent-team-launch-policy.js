export function branchReadinessCheck(readiness = null) {
  return (readiness?.checks || []).find((item) => item.id === 'branch-readiness') || null;
}

export function branchReadinessBlocksWrite(readiness = null) {
  const status = String(branchReadinessCheck(readiness)?.status || '').toLowerCase();
  return ['manual', 'blocked'].includes(status);
}

export function buildBranchReadinessAlert({
  projectReadiness = null,
  branchOverrideAccepted = false,
  branchOverrideRecorded = false
} = {}) {
  const check = branchReadinessCheck(projectReadiness);
  const status = String(check?.status || '').toLowerCase();
  if (!['manual', 'blocked'].includes(status)) return null;

  const overrideEffective = Boolean(branchOverrideAccepted || branchOverrideRecorded);
  const actionLabel = branchOverrideRecorded
    ? 'Override recorded'
    : overrideEffective
      ? 'Override pending launch'
      : 'Create branch or accept risk';
  const title = status === 'blocked'
    ? 'Branch readiness blocked'
    : 'Branch readiness needs attention';
  const detail = check?.detail || 'Current branch does not match the recommended task branch.';
  const message = overrideEffective
    ? 'Current-branch work is explicitly accepted for this assignment and will remain visible in audit evidence.'
    : 'Create the suggested task branch for safer isolation, or accept current-branch risk before launching write workers.';

  return {
    visible: true,
    status,
    tone: status === 'blocked' && !overrideEffective ? 'danger' : 'warning',
    title,
    detail,
    message,
    actionLabel,
    currentBranch: check?.currentBranch || '',
    expectedBranch: check?.expectedBranch || '',
    remediation: check?.remediation || '',
    overrideAccepted: Boolean(branchOverrideAccepted),
    overrideRecorded: Boolean(branchOverrideRecorded)
  };
}

export function resolveWorkerLaunchPolicy({
  selectedAgent = 'codex',
  codexLaunchHealthy = false,
  worker = {},
  writeMode = false,
  verificationBlocked = false,
  projectReadiness = null,
  branchOverrideAccepted = false
} = {}) {
  const needsWrite = Boolean(worker.requiresWrite);
  const branchBlocked = needsWrite && branchReadinessBlocksWrite(projectReadiness);
  const branchOverrideEffective = Boolean(branchOverrideAccepted);
  const branchOverrideRequired = branchBlocked && !branchOverrideEffective;
  const allowed = selectedAgent === 'codex'
    && Boolean(codexLaunchHealthy)
    && !verificationBlocked
    && !branchOverrideRequired
    && (!needsWrite || Boolean(writeMode));

  return {
    allowed,
    branchBlocked,
    branchOverrideRequired,
    branchOverrideAccepted: branchBlocked && branchOverrideEffective,
    needsWrite,
    writeMode: Boolean(writeMode),
    adapterReady: selectedAgent === 'codex' && Boolean(codexLaunchHealthy),
    verificationBlocked: Boolean(verificationBlocked)
  };
}
