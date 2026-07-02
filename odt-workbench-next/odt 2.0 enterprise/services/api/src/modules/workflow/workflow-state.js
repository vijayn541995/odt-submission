import { deriveReviewCycleCloseout } from './review-cycle-closeout.js';
import {
  deriveJiraVerificationProfile as defaultDeriveJiraVerificationProfile,
  scopedCurrentEvidence as defaultScopedCurrentEvidence
} from './workflow-evidence.js';
import {
  getActiveImplementationTests,
  getFailedImplementationTests,
  getIncompleteImplementationTests,
  getOpenReviewBlockers,
  getUnresolvedStandardsBlockers,
  hasAcceptedImplementationRisk,
  hasAcceptedVerificationRisk,
  hasWriteApproval,
  humanizeLabel,
  isActiveWorkerStatus,
  isImplementationWorkerRun,
  isPreparedWorkerStatus,
  latestByTime,
  latestDecisionEvent,
  latestPostImplementationCheck,
  timeMillis,
  workerHasReviewableOutput,
  workerRunTime
} from './workflow-helpers.js';

export function buildWorkflowDecisionTrail(evidence = {}) {
  const trail = [];
  const add = ({ type, label, status, detail, createdAt, page }) => {
    if (!label || !createdAt) return;
    trail.push({
      type,
      label,
      status: status || 'recorded',
      detail: detail || '',
      createdAt,
      page: page || 'overview'
    });
  };

  (evidence.requirements || []).forEach((item) => add({
    type: 'requirement',
    label: 'Requirement analyzed',
    status: item.status,
    detail: item.summary || item.rawText || 'Requirement evidence captured.',
    createdAt: item.updatedAt || item.createdAt,
    page: 'intake'
  }));

  (evidence.repoAnalysis || []).forEach((item) => add({
    type: 'repo',
    label: 'Repository analyzed',
    status: item.status,
    detail: item.repoPath || item.repo_path || item.analysisJson?.repoName || 'Read-only repository analysis captured.',
    createdAt: item.updatedAt || item.createdAt,
    page: 'intake'
  }));

  (evidence.technicalDesigns || []).forEach((item) => add({
    type: 'design',
    label: 'Technical design drafted',
    status: item.status,
    detail: item.title || 'Architecture brief drafted.',
    createdAt: item.updatedAt || item.createdAt,
    page: 'planner'
  }));

  (evidence.implementationPlans || []).forEach((item) => add({
    type: 'plan',
    label: 'Implementation plan drafted',
    status: item.status,
    detail: item.title || 'Implementation blueprint drafted.',
    createdAt: item.updatedAt || item.createdAt,
    page: 'planner'
  }));

  (evidence.standardsChecks || []).forEach((item) => add({
    type: 'standards',
    label: item.phase === 'post-implementation' ? 'Post-implementation standards check' : 'Standards check completed',
    status: item.status,
    detail: item.summary?.message || item.summary?.overall || `${item.phase} review against ${item.standardsVersion}.`,
    createdAt: item.createdAt,
    page: 'standards'
  }));

  (evidence.approvals || []).forEach((item) => add({
    type: 'approval',
    label: humanizeLabel(item.approvalType || 'approval'),
    status: item.status,
    detail: item.notes || `Decision by ${item.approvedBy || 'local-user'}.`,
    createdAt: item.approvedAt,
    page: 'standards'
  }));

  (evidence.dependencyRequests || []).forEach((item) => add({
    type: 'dependency',
    label: `Dependency ${item.packageName}`,
    status: item.status,
    detail: `${item.license || 'UNKNOWN'} - ${item.reason || 'Dependency approval request.'}`,
    createdAt: item.decidedAt || item.requestedAt,
    page: 'standards'
  }));

  (evidence.reviewComments || []).forEach((item) => add({
    type: 'review',
    label: `${humanizeLabel(item.severity)} review comment`,
    status: item.status,
    detail: item.resolutionNotes || item.comment,
    createdAt: item.updatedAt || item.createdAt,
    page: 'review'
  }));

  (evidence.agentEvents || []).forEach((item) => add({
    type: 'agent',
    label: humanizeLabel(item.eventType || 'agent event'),
    status: item.status,
    detail: item.detailJson?.message || item.detailJson?.mode || `${item.agentId || 'agent'} event recorded.`,
    createdAt: item.createdAt,
    page: 'team'
  }));

  (evidence.agentFoundryRuns || []).forEach((item) => add({
    type: 'agent-foundry',
    label: `${item.output?.specialistName || item.domainLabel || 'Agent Foundry'} review`,
    status: item.status,
    detail: item.output?.summary || `${item.domainLabel || item.domainId} specialist evidence recorded.`,
    createdAt: item.createdAt,
    page: 'team'
  }));

  (evidence.implementationEvidence || []).forEach((item) => add({
    type: 'implementation',
    label: 'Implementation evidence recorded',
    status: item.status,
    detail: item.summary || `${item.changedFiles?.length || 0} changed file(s), ${item.tests?.length || 0} test result(s).`,
    createdAt: item.createdAt,
    page: 'review'
  }));

  (evidence.prReadinessReports || []).forEach((item) => add({
    type: 'pr',
    label: 'PR readiness pack generated',
    status: item.reportJson?.status || item.status,
    detail: item.reportJson?.summary || 'PR-ready evidence package generated.',
    createdAt: item.createdAt,
    page: 'pr'
  }));

  return trail
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 18);
}

export function deriveWorkflowState(
  evidence = {},
  {
    deriveJiraVerificationProfile = defaultDeriveJiraVerificationProfile,
    scopedCurrentEvidence = defaultScopedCurrentEvidence
  } = {}
) {
  const jiraVerificationProfile = deriveJiraVerificationProfile(evidence);
  const currentEvidence = scopedCurrentEvidence(evidence);
  const hasRequirement = Boolean(evidence.requirements?.length || evidence.assignment?.requirement);
  const hasRepo = Boolean(currentEvidence.repoAnalysis?.length || jiraVerificationProfile?.repoPath);
  const hasDesign = Boolean(currentEvidence.technicalDesigns?.length);
  const hasPlan = Boolean(currentEvidence.implementationPlans?.length);
  const latestCheck = currentEvidence.standardsChecks?.[0] || null;
  const postImplementationCheck = latestPostImplementationCheck(currentEvidence);
  const writeApproved = hasWriteApproval(currentEvidence);
  const unresolvedStandardsBlockers = getUnresolvedStandardsBlockers(currentEvidence);
  const openReviewBlockers = getOpenReviewBlockers(currentEvidence);
  const pendingDependencies = (currentEvidence.dependencyRequests || []).filter((request) => request.status === 'pending');
  const latestHandoff = (currentEvidence.agentEvents || []).find((event) => event.eventType === 'handoff_prepared');
  const workerRuns = currentEvidence.agentWorkerRuns || [];
  const latestImplementationEvidence = currentEvidence.implementationEvidence?.[0] || null;
  const latestPrReport = currentEvidence.prReadinessReports?.[0]?.reportJson || null;
  const latestPrRecord = currentEvidence.prReadinessReports?.[0] || null;
  const reviewCycleCloseout = deriveReviewCycleCloseout(currentEvidence);
  const jiraImportedAt = timeMillis(jiraVerificationProfile?.createdAt || 0);
  const latestImplementationEvidenceAt = timeMillis(latestImplementationEvidence?.createdAt || latestImplementationEvidence?.updatedAt || 0);
  const postImplementationCheckAt = timeMillis(postImplementationCheck?.createdAt || 0);
  const latestPrRecordAt = timeMillis(latestPrRecord?.createdAt || 0);
  const latestImplementationEvidenceAfterJira = Boolean(
    latestImplementationEvidence
    && (!jiraImportedAt || latestImplementationEvidenceAt >= jiraImportedAt)
  );
  const latestPrReportAfterJira = Boolean(latestPrRecord && (!jiraImportedAt || latestPrRecordAt >= jiraImportedAt));
  const latestPrReportAfterImplementation = Boolean(
    latestPrRecord
    && (!latestImplementationEvidenceAt || latestPrRecordAt >= latestImplementationEvidenceAt)
    && (!postImplementationCheckAt || latestPrRecordAt >= postImplementationCheckAt)
  );
  const latestPrReportCurrent = Boolean(latestPrReportAfterJira && latestPrReportAfterImplementation);
  const completedJiraNeedsVerification = Boolean(jiraVerificationProfile && !latestImplementationEvidenceAfterJira && !latestPrReportAfterJira);
  const failedTests = getFailedImplementationTests(currentEvidence);
  const incompleteTests = getIncompleteImplementationTests(currentEvidence);
  const acceptedImplementationRisk = hasAcceptedImplementationRisk(currentEvidence);
  const acceptedVerificationRisk = hasAcceptedVerificationRisk(currentEvidence);
  const passedTests = getActiveImplementationTests(currentEvidence)
    .filter((test) => String(test.status || '').toLowerCase() === 'passed');
  const reviewableBuildVerifierRuns = (currentEvidence.agentWorkerRuns || [])
    .filter((run) => run.workerRole === 'build-verifier' && workerHasReviewableOutput(run));
  const completedJiraBuildReady = !jiraVerificationProfile || passedTests.length > 0 || reviewableBuildVerifierRuns.length > 0 || acceptedVerificationRisk;
  const latestActiveImplementationWorker = latestByTime(
    workerRuns,
    (run) => isImplementationWorkerRun(run) && isActiveWorkerStatus(run.status),
    workerRunTime
  );
  const latestPreparedImplementationWorker = latestByTime(
    workerRuns,
    (run) => isImplementationWorkerRun(run) && isPreparedWorkerStatus(run.status),
    workerRunTime
  );
  const latestReviewableImplementationWorker = latestByTime(
    workerRuns,
    (run) => isImplementationWorkerRun(run)
      && workerHasReviewableOutput(run)
      && (!jiraImportedAt || workerRunTime(run) >= jiraImportedAt),
    workerRunTime
  );
  const implementationWorkerOutputReady = Boolean(latestReviewableImplementationWorker && !latestImplementationEvidenceAfterJira);
  const activeBlockDecision = latestDecisionEvent(currentEvidence.approvals || [], ['block_implementation']);
  const blockedByDecision = Boolean(activeBlockDecision && !writeApproved);
  const implementationPhaseStarted = Boolean(
    latestHandoff
    || postImplementationCheck
    || latestImplementationEvidenceAfterJira
    || (!jiraVerificationProfile && latestImplementationEvidence)
  );
  const prReportAppliesToCurrentWork = latestPrReportCurrent;
  const prBlockingItemsForWorkflow = (prReportAppliesToCurrentWork && latestPrReport?.status === 'BLOCKED')
    ? (latestPrReport.blockingItems || []).filter((item) => {
        const category = String(item.category || '').toLowerCase();
        if (!implementationPhaseStarted && ['implementation-evidence', 'testing', 'reviewer-verification', 'build-test-verification', 'review-cycle'].includes(category)) {
          return false;
        }
        return true;
    })
    : [];

  const blockedReasons = [
    ...unresolvedStandardsBlockers.map((finding) => ({
      category: 'standards',
      message: finding.message,
      action: finding.recommendation,
      page: 'standards'
    })),
    ...openReviewBlockers.map((comment) => ({
      category: 'review',
      message: comment.comment,
      action: 'Resolve, accept risk, or request rework.',
      page: 'review'
    })),
    ...(blockedByDecision ? [{
      category: 'approval',
      message: activeBlockDecision.notes || 'Implementation is blocked by human decision.',
      action: 'Review Standards or approve a newer write decision.',
      page: 'standards'
    }] : []),
    ...prBlockingItemsForWorkflow.map((item) => ({
      category: item.category || 'pr-readiness',
      message: item.message,
      action: item.requiredAction,
      page: item.category === 'dependency' ? 'standards' : item.category === 'implementation-evidence' || item.category === 'testing' ? 'review' : 'pr'
    })),
    ...(failedTests.length && !acceptedImplementationRisk ? [{
      category: 'testing',
      message: `${failedTests.length} failed test result(s) need action.`,
      action: 'Fix failed tests or accept implementation risk with review notes.',
      page: 'review'
    }] : []),
    ...(incompleteTests.length && !acceptedVerificationRisk ? [{
      category: 'testing',
      message: `${incompleteTests.length} test result(s) are not run or have unknown status.`,
      action: 'Run the tests, replace pending evidence with passed/failed output, or accept verification risk with review notes.',
      page: 'review'
    }] : [])
  ];

  let state = 'INTAKE_STARTED';
  let stage = 'intake';
  let label = 'Intake Started';
  let nextAction = { label: 'Start Intake', detail: 'Capture requirement, Jira, repo, and scope.', page: 'intake' };

  if (hasRequirement) {
    state = 'REQUIREMENT_ANALYZED';
    stage = 'intake';
    label = 'Requirement Analyzed';
    nextAction = { label: 'Analyze Repository', detail: 'Attach repo context before design and planning.', page: 'intake' };
  }
  if (hasRepo) {
    state = 'REPO_ANALYZED';
    stage = 'analyze';
    label = 'Repo Analyzed';
    nextAction = { label: 'Draft Design', detail: 'Create technical design and implementation plan.', page: 'planner' };
  }
  if (hasDesign) {
    state = 'TECH_DESIGN_DRAFTED';
    stage = 'design';
    label = 'Technical Design Drafted';
    nextAction = { label: 'Draft Implementation Plan', detail: 'Complete implementation and test planning.', page: 'planner' };
  }
  if (hasPlan) {
    state = latestCheck ? 'PLAN_REVIEW' : 'STANDARDS_REVIEW_PENDING';
    stage = latestCheck ? 'standards' : 'design';
    label = latestCheck ? 'Plan Review' : 'Standards Review Pending';
    nextAction = latestCheck
      ? { label: 'Review Standards Gate', detail: 'Review findings and approval options.', page: 'standards' }
      : { label: 'Run Standards Check', detail: 'Create pre-write standards evidence.', page: 'standards' };
  }
  if (latestCheck && !blockedReasons.length) {
    state = 'STANDARDS_REVIEW_PASSED';
    stage = 'standards';
    label = 'Standards Reviewed';
    nextAction = { label: 'Approve Write Scope', detail: 'Capture human approval for the latest standards review.', page: 'standards' };
  }
  if (writeApproved && !unresolvedStandardsBlockers.length && !openReviewBlockers.length) {
    state = 'APPROVED_TO_WRITE';
    stage = 'implement';
    label = 'Approved To Write';
    nextAction = { label: 'Delegate To Agent', detail: 'Prepare a governed Codex/Cline handoff.', page: 'team' };
  }
  if (latestHandoff && writeApproved && !unresolvedStandardsBlockers.length && !openReviewBlockers.length) {
    if (latestActiveImplementationWorker) {
      state = 'IMPLEMENTING';
      stage = 'implement';
      label = 'Implementing';
      nextAction = {
        label: 'Watch Worker Run',
        detail: `${latestActiveImplementationWorker.workerRoleLabel || 'Implementation worker'} is still running. Review the live log before recording evidence.`,
        page: 'team',
        workerRunId: latestActiveImplementationWorker.id
      };
    } else if (implementationWorkerOutputReady) {
      state = 'AGENT_OUTPUT_READY';
      stage = 'review';
      label = 'Agent Output Ready';
      nextAction = {
        label: 'Review And Record Evidence',
        detail: `${latestReviewableImplementationWorker.workerRoleLabel || 'Implementation worker'} finished. Ingest output and record evidence only after repo verification passes.`,
        page: 'team',
        workerRunId: latestReviewableImplementationWorker.id
      };
    } else if (latestPreparedImplementationWorker) {
      state = 'AGENT_BUNDLE_READY';
      stage = 'implement';
      label = 'Agent Bundle Ready';
      nextAction = {
        label: 'Launch Prepared Worker',
        detail: `${latestPreparedImplementationWorker.workerRoleLabel || 'Implementation worker'} bundle is prepared but not running yet.`,
        page: 'team',
        workerRunId: latestPreparedImplementationWorker.id
      };
    } else {
      state = 'AGENT_HANDOFF_PREPARED';
      stage = 'implement';
      label = 'Agent Handoff Prepared';
      nextAction = { label: 'Launch Agent Worker', detail: 'Start the approved implementation worker or record manual implementation evidence.', page: 'team' };
    }
  }
  if (latestImplementationEvidenceAfterJira || (!jiraVerificationProfile && latestImplementationEvidence)) {
    state = 'IMPLEMENTATION_EVIDENCE_RECORDED';
    stage = 'test';
    label = 'Implementation Evidence Recorded';
    nextAction = postImplementationCheck
      ? { label: 'Prepare PR Pack', detail: 'Generate the PR-ready package from evidence.', page: 'pr' }
      : { label: 'Run Post-Implementation Check', detail: 'Validate the implementation evidence against standards.', page: 'review' };
  }
  if (postImplementationCheck) {
    state = 'POST_IMPLEMENTATION_REVIEW';
    stage = 'test';
    label = 'Post-Implementation Review';
    nextAction = { label: 'Prepare PR Pack', detail: 'Generate the PR-ready package from evidence.', page: 'pr' };
  }
  if (reviewCycleCloseout.requiresCloseout && !reviewCycleCloseout.readyForPrPack && !blockedReasons.length) {
    state = 'REVIEW_CYCLE_CLOSEOUT';
    stage = 'test';
    label = 'Review Cycle Closeout';
    nextAction = reviewCycleCloseout.nextAction || { label: 'Continue Review Cycle', detail: 'Complete rework, review, verification, and PR-ready evidence.', page: 'review' };
  }
  if (latestPrReportCurrent && latestPrReport?.status === 'PR_READY_REVIEW' && !blockedReasons.length) {
    state = 'PR_READY';
    stage = 'pr';
    label = 'Ready For PR Review';
    nextAction = { label: 'Copy PR Markdown', detail: 'Review and copy the generated PR package.', page: 'pr' };
  }
  if (completedJiraNeedsVerification && !blockedReasons.length) {
    state = 'JIRA_COMPLETED_VERIFICATION';
    stage = 'review';
    label = 'Completed Jira Verification';
    nextAction = {
      label: 'Launch Reviewer',
      detail: `${jiraVerificationProfile.summary} Use Reviewer first, then capture build/test evidence before PR readiness.`,
      page: 'team',
      targetWorkerRole: 'reviewer'
    };
  }
  if (blockedReasons.length) {
    state = 'BLOCKED';
    label = 'Blocked';
    stage = latestImplementationEvidence ? 'test' : latestCheck ? 'standards' : stage;
    nextAction = {
      label: 'Review Blocking Items',
      detail: blockedReasons[0]?.action || 'Review blockers before continuing.',
      page: blockedReasons[0]?.page || 'standards'
    };
  }

  const completed = {
    requirement: hasRequirement,
    repo: hasRepo,
    technicalDesign: hasDesign,
    implementationPlan: hasPlan,
    standardsCheck: Boolean(latestCheck),
    writeApproval: writeApproved,
    agentHandoff: Boolean(latestHandoff),
    implementationEvidence: Boolean(latestImplementationEvidenceAfterJira || (!jiraVerificationProfile && latestImplementationEvidence)),
    postImplementationCheck: Boolean(postImplementationCheck),
    prPack: Boolean(latestPrReportCurrent)
  };

  return {
    assignmentId: evidence.assignment?.id || 'assignment-local-mvp',
    state,
    label,
    stage,
    status: blockedReasons.length ? 'blocked' : state === 'PR_READY' ? 'ready' : 'in_progress',
    nextAction,
    verificationProfile: jiraVerificationProfile,
    blockedReasons,
    completed,
    decisionTrail: buildWorkflowDecisionTrail(evidence),
    allowedActions: {
      canRunStandardsCheck: Boolean(hasPlan || jiraVerificationProfile),
      canApproveWrite: Boolean(latestCheck && !openReviewBlockers.length && !writeApproved),
      canDelegateWrite: Boolean(!completedJiraNeedsVerification && writeApproved && !blockedByDecision && !unresolvedStandardsBlockers.length && !openReviewBlockers.length),
      canLaunchVerification: Boolean(jiraVerificationProfile && !blockedByDecision && !openReviewBlockers.length),
      canRecordImplementationEvidence: Boolean((completedJiraNeedsVerification || writeApproved || latestHandoff) && !blockedByDecision && !unresolvedStandardsBlockers.length && !openReviewBlockers.length),
      canPreparePr: Boolean((latestImplementationEvidenceAfterJira || (!jiraVerificationProfile && latestImplementationEvidence)) && completedJiraBuildReady && !blockedByDecision && !pendingDependencies.length && (!failedTests.length || acceptedImplementationRisk) && (!incompleteTests.length || acceptedVerificationRisk) && (!reviewCycleCloseout.requiresCloseout || reviewCycleCloseout.readyForPrPack)),
      dependencyInstallsRequireSeparateApproval: true
    },
    counts: {
      standardsBlockers: unresolvedStandardsBlockers.length,
      reviewBlockers: openReviewBlockers.length,
      pendingDependencies: pendingDependencies.length,
      failedTests: failedTests.length,
      incompleteTests: incompleteTests.length,
      prBlockingItems: latestPrReportCurrent ? latestPrReport?.blockingItems?.length || 0 : 0
    },
    latest: {
      standardsCheckId: latestCheck?.id || '',
      postImplementationCheckId: postImplementationCheck?.id || '',
      implementationEvidenceId: latestImplementationEvidence?.id || '',
      prReportStatus: latestPrReportCurrent ? latestPrReport?.status || '' : ''
    }
  };
}
