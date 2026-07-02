import { timeMillis } from './workflow-helpers.js';

export function normalizeWorkflowIssueKey(value = '') {
  const match = String(value || '').trim().match(/[A-Z][A-Z0-9]+-\d+/i);
  return match ? match[0].toUpperCase() : '';
}

export function requirementText(requirement = {}) {
  const safeRequirement = requirement || {};
  return safeRequirement.rawText || safeRequirement.raw_text || safeRequirement.input || safeRequirement.summary || '';
}

export function deriveJiraVerificationProfile(
  evidence = {},
  { normalizeIssueKey = normalizeWorkflowIssueKey } = {}
) {
  const requirement = (evidence.requirements || []).find((item) => (
    item.sourceType === 'jira-import'
    || String(item.rawText || '').includes('ODT Work State:')
  )) || null;
  const text = requirementText(requirement);
  if (!text) return null;
  const lower = text.toLowerCase();
  const issueKey = normalizeIssueKey(text);
  const completed = lower.includes('classification: completed in jira') || lower.includes('recommended mode: verification');
  if (!issueKey || !completed) return null;
  const repoPath = (text.match(/Repository:\s*([^\n]+)/i)?.[1] || '').trim();
  const commitMatch = text.match(/appears in\s+(\d+)\s+git commit/i);
  const commitCount = commitMatch ? Number(commitMatch[1]) : 0;
  const hasRepoEvidence = commitCount > 0 || lower.includes('ticket_reference_found');
  return {
    issueKey,
    state: 'completed',
    mode: 'verification',
    label: 'Completed Jira Verification',
    createdAt: requirement.updatedAt || requirement.createdAt || '',
    repoPath,
    hasRepoEvidence,
    commitCount,
    summary: hasRepoEvidence
      ? `${issueKey} is Done in Jira and has ${commitCount} matching git commit${commitCount === 1 ? '' : 's'}.`
      : `${issueKey} is Done in Jira. Repository completion evidence still needs verification.`,
    nextAction: hasRepoEvidence
      ? 'Launch Reviewer, then capture build/test evidence before PR readiness.'
      : 'Confirm branch, commit, PR, or release evidence before closeout.'
  };
}

export function evidenceFreshnessCutoff(evidence = {}) {
  const requirement = evidence.requirements?.[0] || null;
  const cutoffMs = timeMillis(requirement?.updatedAt || requirement?.createdAt);
  return {
    requirement,
    cutoffAt: requirement?.updatedAt || requirement?.createdAt || '',
    cutoffMs
  };
}

export function splitEvidenceByFreshness(evidence = {}) {
  const { requirement, cutoffAt, cutoffMs } = evidenceFreshnessCutoff(evidence);
  const isCurrent = (item = {}) => !cutoffMs || timeMillis(item.updatedAt || item.createdAt || item.approvedAt) >= cutoffMs;
  const split = (items = []) => ({
    current: (items || []).filter(isCurrent),
    historical: (items || []).filter((item) => !isCurrent(item))
  });
  const repoAnalysis = split(evidence.repoAnalysis);
  const technicalDesigns = split(evidence.technicalDesigns);
  const implementationPlans = split(evidence.implementationPlans);
  const standardsChecks = split(evidence.standardsChecks);
  const approvals = split(evidence.approvals);
  const testPlans = split(evidence.testPlans);
  const implementationEvidence = split(evidence.implementationEvidence);
  const aiWorkAuditPacks = split(evidence.aiWorkAuditPacks);
  const prReadinessReports = split(evidence.prReadinessReports);
  const reviewComments = split(evidence.reviewComments);
  const agentEvents = split(evidence.agentEvents);
  const agentWorkerRuns = split(evidence.agentWorkerRuns);
  const dependencyRequests = split(evidence.dependencyRequests);
  const agentRelayItems = split(evidence.agentRelayItems);
  return {
    current: {
      cutoffAt,
      activeRequirementId: requirement?.id || '',
      repoAnalysis: repoAnalysis.current,
      technicalDesigns: technicalDesigns.current,
      implementationPlans: implementationPlans.current,
      standardsChecks: standardsChecks.current,
      approvals: approvals.current,
      testPlans: testPlans.current,
      implementationEvidence: implementationEvidence.current,
      aiWorkAuditPacks: aiWorkAuditPacks.current,
      prReadinessReports: prReadinessReports.current,
      reviewComments: reviewComments.current,
      agentEvents: agentEvents.current,
      agentWorkerRuns: agentWorkerRuns.current,
      agentRelayItems: agentRelayItems.current,
      dependencyRequests: dependencyRequests.current
    },
    historical: {
      cutoffAt,
      repoAnalysis: repoAnalysis.historical,
      technicalDesigns: technicalDesigns.historical,
      implementationPlans: implementationPlans.historical,
      standardsChecks: standardsChecks.historical,
      approvals: approvals.historical,
      testPlans: testPlans.historical,
      implementationEvidence: implementationEvidence.historical,
      aiWorkAuditPacks: aiWorkAuditPacks.historical,
      prReadinessReports: prReadinessReports.historical,
      reviewComments: reviewComments.historical,
      agentEvents: agentEvents.historical,
      agentWorkerRuns: agentWorkerRuns.historical,
      agentRelayItems: agentRelayItems.historical,
      dependencyRequests: dependencyRequests.historical
    }
  };
}

export function scopedCurrentEvidence(evidence = {}) {
  const freshness = evidence.current ? { current: evidence.current } : splitEvidenceByFreshness(evidence);
  return {
    ...evidence,
    repoAnalysis: freshness.current.repoAnalysis || [],
    technicalDesigns: freshness.current.technicalDesigns || [],
    implementationPlans: freshness.current.implementationPlans || [],
    standardsChecks: freshness.current.standardsChecks || [],
    standardsFindings: (freshness.current.standardsChecks || []).flatMap((check) => check.findings || []),
    approvals: freshness.current.approvals || [],
    testPlans: freshness.current.testPlans || [],
    implementationEvidence: freshness.current.implementationEvidence || [],
    aiWorkAuditPacks: freshness.current.aiWorkAuditPacks || [],
    prReadinessReports: freshness.current.prReadinessReports || [],
    reviewComments: freshness.current.reviewComments || [],
    agentEvents: freshness.current.agentEvents || [],
    agentWorkerRuns: freshness.current.agentWorkerRuns || [],
    agentRelayItems: freshness.current.agentRelayItems || [],
    agentFoundryRuns: evidence.agentFoundryRuns || [],
    dependencyRequests: freshness.current.dependencyRequests || []
  };
}
