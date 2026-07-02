import {
  activeAssignmentId,
  activeWorkKey
} from './assignment-selectors.js';
import {
  currentEvidenceItems,
  currentPrReadinessReports
} from './evidence-selectors.js';
import { workflowStateFromData } from './workflow.js';

function humanize(value = '') {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortId(value = '') {
  const text = String(value || '');
  return text.length > 12 ? `${text.slice(0, 10)}...` : text;
}

function firstLine(value = '') {
  return String(value || '').split(/\n/).map((line) => line.trim()).filter(Boolean)[0] || '';
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function normalizeStatus(value = '') {
  return String(value || 'recorded').trim() || 'recorded';
}

function approvalSubject(approval = {}) {
  const type = String(approval.approvalType || '').toLowerCase();
  if (['write_scope', 'approved_to_write', 'approved_to-write'].includes(type)) return 'Write scope';
  if (['standards_warning_override', 'warning_override'].includes(type)) return 'Standards warning override';
  if (['standards_blocker_override', 'blocker_override'].includes(type)) return 'Standards blocker override';
  if (type === 'block_implementation') return 'Implementation block';
  if (type === 'plan_review') return 'Plan review';
  if (type === 'branch_readiness_override') return 'Branch readiness override';
  return humanize(approval.approvalType || 'Approval');
}

function gateImpactForApproval(approval = {}) {
  const type = String(approval.approvalType || '').toLowerCase();
  const status = String(approval.status || '').toLowerCase();
  if (type === 'write_scope' && status === 'approved') {
    return 'Write delegation can proceed only while standards, review, dependency, and branch gates remain clear.';
  }
  if (type === 'standards_warning_override' && status === 'approved') {
    return 'Non-critical standards warnings were accepted with notes; hard blockers still require resolution or explicit blocker override.';
  }
  if (type === 'standards_blocker_override' && status === 'approved') {
    return 'Standards blockers were consciously overridden; hard safety blockers still remain protected.';
  }
  if (type === 'block_implementation') {
    return 'Write delegation remains blocked until a newer write approval is captured.';
  }
  if (type === 'plan_review') {
    return status === 'approved'
      ? 'Plan review was accepted as a governance decision.'
      : 'Plan review requires changes before write approval can be trusted.';
  }
  if (type === 'branch_readiness_override' && status === 'approved') {
    return 'Branch warning was accepted for this work item and must remain visible in audit evidence.';
  }
  return 'Decision is recorded as audit evidence and should be reviewed with the workflow state.';
}

function evidenceLink({ type, id, label, status, detail, page }) {
  return {
    type,
    id: String(id || ''),
    label,
    status: normalizeStatus(status),
    detail: detail || '',
    page: page || 'artifacts'
  };
}

function normalizeBranchReadiness(branchReadiness = null) {
  if (!branchReadiness) {
    return {
      status: 'not_checked',
      detail: 'Branch readiness has not been evaluated yet.',
      currentBranch: '',
      expectedBranch: '',
      gateImpact: 'read-only allowed; write branch gate not checked'
    };
  }
  return {
    status: normalizeStatus(branchReadiness.status),
    detail: branchReadiness.detail || '',
    currentBranch: branchReadiness.currentBranch || '',
    expectedBranch: branchReadiness.expectedBranch || '',
    baseBranch: branchReadiness.baseBranch || '',
    workKey: branchReadiness.workKey || '',
    remediation: branchReadiness.remediation || '',
    gateImpact: branchReadiness.gateImpact || (branchReadiness.status === 'ready'
      ? 'write allowed when other governance gates are clear'
      : 'write blocked or approval-gated until branch readiness is resolved')
  };
}

function markdownList(items = [], formatter = (item) => String(item), empty = '- None recorded.') {
  if (!items.length) return empty;
  return items.map((item) => `- ${formatter(item)}`).join('\n');
}

function renderAuditMarkdown(pack = {}) {
  return [
    '# AI Work Audit Pack',
    '',
    '## Summary',
    '',
    `- Assignment: ${pack.summary.assignmentId}`,
    `- Work key: ${pack.summary.workKey || 'Manual / No Jira'}`,
    `- Title: ${pack.summary.title || 'Not recorded'}`,
    `- Repository: ${pack.summary.repoPath || 'Not recorded'}`,
    `- Base branch: ${pack.summary.baseBranch || 'Not recorded'}`,
    `- Workflow state: ${pack.summary.workflowState} (${pack.summary.workflowLabel})`,
    `- AI lanes used: ${pack.summary.aiLanesUsed.length ? pack.summary.aiLanesUsed.join(', ') : 'None recorded'}`,
    `- Branch readiness: ${pack.branchReadiness.status} - ${pack.branchReadiness.detail}`,
    '',
    '## Evidence Links',
    '',
    markdownList(pack.evidenceLinks, (item) => `${item.label} [${item.type}:${shortId(item.id)}] - ${item.status}${item.detail ? ` - ${item.detail}` : ''}`),
    '',
    '## Decision / Gate Impact',
    '',
    markdownList(pack.decisions, (item) => `${item.whatApproved} [${shortId(item.id)}] - ${humanize(item.status)} by ${item.approvedBy || 'unknown'} at ${item.approvedAt || 'unknown'}; impact: ${item.gateImpact}${item.notes ? `; notes: ${item.notes}` : ''}`),
    '',
    '## Validation',
    '',
    `- Latest implementation evidence: ${pack.validation.latestImplementationEvidenceId || 'Not recorded'}`,
    `- Commands recorded: ${pack.validation.commands.length}`,
    `- Tests recorded: ${pack.validation.tests.length}`,
    `- Failed tests: ${pack.validation.failedTests.length}`,
    `- Standards checks: ${pack.validation.standardsChecks.length}`,
    '',
    markdownList(pack.validation.tests, (item) => `${item.name || item.label || 'Test'} - ${item.status || 'unknown'}${item.notes ? ` - ${item.notes}` : ''}`, '- No test evidence recorded.'),
    '',
    '## Risks / Approvals',
    '',
    `- Open review comments: ${pack.risks.openReviewComments.length}`,
    `- Accepted risk comments: ${pack.risks.acceptedRisk.length}`,
    `- Pending dependencies: ${pack.risks.pendingDependencies.length}`,
    `- Blocked reasons: ${pack.risks.blockedReasons.length}`,
    '',
    markdownList(pack.reviewComments, (item) => `${humanize(item.severity)} ${humanize(item.targetType)} review [${shortId(item.id)}] - ${humanize(item.status)} - ${item.comment}${item.resolutionNotes ? ` Resolution: ${item.resolutionNotes}` : ''}`, '- No review comments recorded.'),
    '',
    '## Export',
    '',
    '- Markdown: this artifact body.',
    '- JSON: use the exportJson field from this artifact.',
    `- Generated at: ${pack.generatedAt}`,
    ''
  ].join('\n');
}

export function buildAiWorkAuditPack({ data = null, evidence = null, branchReadiness = null, generatedAt = new Date().toISOString() } = {}) {
  const sourceEvidence = evidence || data?.evidence || {};
  const assignment = sourceEvidence.assignment || {};
  const workflow = sourceEvidence.workflowState || workflowStateFromData(data) || {};
  const requirements = currentEvidenceItems(sourceEvidence, 'requirements');
  const repoAnalysis = currentEvidenceItems(sourceEvidence, 'repoAnalysis');
  const technicalDesigns = currentEvidenceItems(sourceEvidence, 'technicalDesigns');
  const implementationPlans = currentEvidenceItems(sourceEvidence, 'implementationPlans');
  const standardsChecks = currentEvidenceItems(sourceEvidence, 'standardsChecks');
  const approvals = currentEvidenceItems(sourceEvidence, 'approvals');
  const dependencyRequests = currentEvidenceItems(sourceEvidence, 'dependencyRequests');
  const reviewComments = currentEvidenceItems(sourceEvidence, 'reviewComments');
  const implementationEvidence = currentEvidenceItems(sourceEvidence, 'implementationEvidence');
  const prReports = currentPrReadinessReports(sourceEvidence);
  const workerRuns = currentEvidenceItems(sourceEvidence, 'agentWorkerRuns');
  const agentEvents = currentEvidenceItems(sourceEvidence, 'agentEvents');
  const foundryRuns = currentEvidenceItems(sourceEvidence, 'agentFoundryRuns');
  const latestImplementation = implementationEvidence[0] || null;
  const latestPrReport = prReports[0] || null;
  const normalizedBranchReadiness = normalizeBranchReadiness(branchReadiness);

  const assignmentId = assignment.id || workflow.assignmentId || activeAssignmentId(data);
  const workKey = activeWorkKey(data || { evidence: sourceEvidence }) || normalizedBranchReadiness.workKey || '';
  const aiLanesUsed = unique([
    ...workerRuns.map((run) => run.workerRoleLabel || run.workerRole),
    ...foundryRuns.map((run) => run.domainLabel || run.domainId),
    ...agentEvents.map((event) => event.agentId)
  ]);

  const decisions = [
    ...approvals.map((approval) => ({
      id: approval.id || '',
      approvalType: approval.approvalType || 'approval',
      whatApproved: approvalSubject(approval),
      status: normalizeStatus(approval.status),
      approvedBy: approval.approvedBy || 'local-user',
      approvedAt: approval.approvedAt || '',
      notes: approval.notes || '',
      gateImpact: gateImpactForApproval(approval)
    })),
    ...dependencyRequests
      .filter((request) => ['approved', 'rejected'].includes(String(request.status || '').toLowerCase()))
      .map((request) => ({
        id: request.id || '',
        approvalType: 'dependency_request',
        whatApproved: `Dependency ${request.packageName || 'request'}`,
        status: normalizeStatus(request.status),
        approvedBy: request.decidedBy || request.requestedBy || 'local-user',
        approvedAt: request.decidedAt || request.requestedAt || '',
        notes: request.notes || request.reason || '',
        gateImpact: request.status === 'approved'
          ? 'Only this package/version may be installed under dependency approval policy.'
          : 'Dependency install remains blocked for this request.'
      }))
  ].sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime());

  const evidenceLinks = [
    ...requirements.slice(0, 3).map((item) => evidenceLink({ type: 'requirement', id: item.id, label: 'Requirement', status: item.status, detail: item.summary || firstLine(item.rawText), page: 'intake' })),
    ...repoAnalysis.slice(0, 2).map((item) => evidenceLink({ type: 'repo-analysis', id: item.id, label: 'Repository analysis', status: item.status, detail: item.repoPath || item.analysisJson?.repoName, page: 'intake' })),
    ...technicalDesigns.slice(0, 2).map((item) => evidenceLink({ type: 'technical-design', id: item.id, label: 'Technical design', status: item.status, detail: item.title || item.designJson?.title, page: 'planner' })),
    ...implementationPlans.slice(0, 2).map((item) => evidenceLink({ type: 'implementation-plan', id: item.id, label: 'Implementation plan', status: item.status, detail: item.title || item.planJson?.title, page: 'planner' })),
    ...standardsChecks.slice(0, 3).map((item) => evidenceLink({ type: 'standards-check', id: item.id, label: `${humanize(item.phase || 'standards')} standards check`, status: item.status, detail: item.summary?.message || item.summary?.overall, page: 'standards' })),
    ...approvals.slice(0, 5).map((item) => evidenceLink({ type: 'approval', id: item.id, label: approvalSubject(item), status: item.status, detail: item.notes, page: 'standards' })),
    ...reviewComments.slice(0, 5).map((item) => evidenceLink({ type: 'review-comment', id: item.id, label: `${humanize(item.severity)} review comment`, status: item.status, detail: item.resolutionNotes || item.comment, page: 'review' })),
    ...implementationEvidence.slice(0, 3).map((item) => evidenceLink({ type: 'implementation-evidence', id: item.id, label: 'Implementation evidence', status: item.status, detail: item.summary, page: 'review' })),
    ...workerRuns.slice(0, 4).map((item) => evidenceLink({ type: 'worker-run', id: item.id, label: item.workerRoleLabel || item.workerRole || 'Worker run', status: item.status, detail: item.output?.summary || item.responseFile || '', page: 'team' })),
    ...prReports.slice(0, 2).map((item) => evidenceLink({ type: 'pr-readiness', id: item.id || item.reportJson?.packId, label: 'PR readiness pack', status: item.reportJson?.status || item.status, detail: item.reportJson?.summary || item.reportJson?.packId, page: 'pr' }))
  ];

  const tests = implementationEvidence.flatMap((record) => record.tests || []);
  const commands = implementationEvidence.flatMap((record) => record.commands || []);
  const failedTests = tests.filter((test) => String(test.status || '').toLowerCase() === 'failed');
  const openReviewComments = reviewComments.filter((comment) => comment.status === 'open');
  const acceptedRisk = reviewComments.filter((comment) => comment.status === 'accepted_risk');
  const pendingDependencies = dependencyRequests.filter((request) => request.status === 'pending');

  const corePack = {
    artifactType: 'ai-work-audit-pack',
    generatedAt,
    summary: {
      assignmentId,
      workKey,
      title: assignment.title || requirements[0]?.summary || firstLine(assignment.requirement),
      repoPath: assignment.repoPath || repoAnalysis[0]?.repoPath || repoAnalysis[0]?.analysisJson?.repoPath || '',
      baseBranch: assignment.baseBranch || '',
      workflowState: workflow.state || 'UNKNOWN',
      workflowLabel: workflow.label || 'Not evaluated',
      workflowStatus: workflow.status || '',
      aiLanesUsed
    },
    branchReadiness: normalizedBranchReadiness,
    evidenceLinks,
    decisions,
    reviewComments: reviewComments.map((comment) => ({
      id: comment.id || '',
      targetType: comment.targetType || '',
      severity: comment.severity || '',
      comment: comment.comment || '',
      status: normalizeStatus(comment.status),
      createdBy: comment.createdBy || 'local-user',
      createdAt: comment.createdAt || '',
      updatedAt: comment.updatedAt || '',
      resolutionNotes: comment.resolutionNotes || ''
    })),
    validation: {
      latestImplementationEvidenceId: latestImplementation?.id || '',
      latestPrPackId: latestPrReport?.reportJson?.packId || latestPrReport?.id || '',
      commands,
      tests,
      failedTests,
      standardsChecks: standardsChecks.map((check) => ({
        id: check.id,
        phase: check.phase,
        status: check.status,
        summary: check.summary?.message || check.summary?.overall || ''
      }))
    },
    risks: {
      openReviewComments,
      acceptedRisk,
      pendingDependencies,
      blockedReasons: workflow.blockedReasons || [],
      branchReadiness: normalizedBranchReadiness
    }
  };

  const markdown = renderAuditMarkdown(corePack);
  return {
    ...corePack,
    markdown,
    exportJson: JSON.stringify(corePack, null, 2)
  };
}
