import {
  getFailedImplementationTests,
  getOpenReviewBlockers,
  hasAcceptedImplementationRisk,
  latestByTime,
  timeMillis,
  workerHasReviewableOutput,
  workerRunTime
} from './workflow-helpers.js';

function closeoutStep(id, label, status, detail, evidence = {}) {
  return { id, label, status, detail, ...evidence };
}

export function deriveReviewCycleCloseout(evidence = {}) {
  const reworkItems = (evidence.agentRelayItems || []).filter((item) => item.itemType === 'rework');
  const latestReworkItem = latestByTime(reworkItems);
  const activeReworkItems = reworkItems.filter((item) => ['open', 'assigned', 'answered'].includes(String(item.status || '').toLowerCase()));
  const reworkStartedAt = timeMillis(latestReworkItem?.createdAt);
  const implementationEvidence = evidence.implementationEvidence || [];
  const workerRuns = evidence.agentWorkerRuns || [];
  const latestReworkEvidence = latestByTime(
    implementationEvidence,
    (item) => !latestReworkItem || timeMillis(item.createdAt) >= reworkStartedAt
  );
  const latestReworkEvidenceAt = timeMillis(latestReworkEvidence?.createdAt);
  const latestReviewerRun = latestByTime(
    workerRuns,
    (run) => run.workerRole === 'reviewer'
      && workerHasReviewableOutput(run)
      && latestReworkEvidence
      && workerRunTime(run) >= latestReworkEvidenceAt,
    workerRunTime
  );
  const latestReviewerRunAt = workerRunTime(latestReviewerRun || {});
  const latestBuildVerifierRun = latestByTime(
    workerRuns,
    (run) => run.workerRole === 'build-verifier'
      && workerHasReviewableOutput(run)
      && latestReviewerRun
      && workerRunTime(run) >= latestReviewerRunAt,
    workerRunTime
  );
  const latestBuildVerifierRunAt = workerRunTime(latestBuildVerifierRun || {});
  const latestPrReportAfterBuild = latestByTime(
    evidence.prReadinessReports || [],
    (report) => latestBuildVerifierRun && timeMillis(report.createdAt) >= latestBuildVerifierRunAt
  );
  const latestPrReport = latestPrReportAfterBuild?.reportJson || null;
  const openReviewBlockers = getOpenReviewBlockers(evidence);
  const failedTests = getFailedImplementationTests(evidence);
  const acceptedImplementationRisk = hasAcceptedImplementationRisk(evidence);
  const requiresCloseout = Boolean(reworkItems.length);

  const steps = [
    closeoutStep(
      'rework-relay',
      'Review finding routed',
      latestReworkItem ? 'complete' : 'not_started',
      latestReworkItem
        ? `Latest rework relay targets ${latestReworkItem.targetLane || latestReworkItem.targetWorkerRole || 'the next worker'}.`
        : 'No review finding has been sent to the rework relay yet.',
      { evidenceId: latestReworkItem?.id || '', targetWorkerRole: latestReworkItem?.targetWorkerRole || 'fullstack-dev' }
    ),
    closeoutStep(
      'rework-evidence',
      'Senior Full Stack Dev rework evidence',
      latestReworkEvidence ? 'complete' : latestReworkItem ? 'current' : 'waiting',
      latestReworkEvidence
        ? `Implementation evidence ${latestReworkEvidence.id} was recorded after the latest rework relay.`
        : 'Launch Senior Full Stack Dev for the rework item, then ingest/record implementation evidence.',
      { evidenceId: latestReworkEvidence?.id || '', targetWorkerRole: 'fullstack-dev' }
    ),
    closeoutStep(
      'reviewer-rerun',
      'Reviewer rerun after rework',
      latestReviewerRun ? 'complete' : latestReworkEvidence ? 'current' : 'waiting',
      latestReviewerRun
        ? `Reviewer run ${latestReviewerRun.id} has output after the rework evidence.`
        : 'Launch Reviewer after rework evidence is recorded so findings are checked again.',
      { workerRunId: latestReviewerRun?.id || '', targetWorkerRole: 'reviewer' }
    ),
    closeoutStep(
      'build-verifier-rerun',
      'Build Verifier rerun after review',
      latestBuildVerifierRun ? 'complete' : latestReviewerRun ? 'current' : 'waiting',
      latestBuildVerifierRun
        ? `Build Verifier run ${latestBuildVerifierRun.id} has output after the reviewer pass.`
        : 'Launch Build Verifier after reviewer rerun to capture final build/test evidence.',
      { workerRunId: latestBuildVerifierRun?.id || '', targetWorkerRole: 'build-verifier' }
    ),
    closeoutStep(
      'pr-ready-pack',
      'PR-ready package after verification',
      latestPrReportAfterBuild ? (latestPrReport?.status === 'PR_READY_REVIEW' ? 'complete' : 'blocked') : latestBuildVerifierRun ? 'current' : 'waiting',
      latestPrReportAfterBuild
        ? `PR readiness pack is ${latestPrReport?.status || 'recorded'}.`
        : 'Generate the PR-ready package after Build Verifier output is captured.',
      { reportId: latestPrReportAfterBuild?.id || '', page: 'pr' }
    )
  ];

  let status = requiresCloseout ? 'REWORK_EVIDENCE_REQUIRED' : 'NO_REWORK_REQUESTED';
  let label = requiresCloseout ? 'Rework Evidence Required' : 'No Rework Cycle Queued';
  let nextAction = requiresCloseout
    ? { label: 'Launch Rework Worker', detail: 'Open Agent Team and launch Senior Full Stack Dev with the rework relay context.', page: 'team', targetWorkerRole: 'fullstack-dev' }
    : { label: 'No Rework Cycle', detail: 'No review finding is currently routed for rework.', page: 'review' };
  let readyForPrPack = !requiresCloseout;

  if (requiresCloseout && latestReworkEvidence && !latestReviewerRun) {
    status = 'REVIEWER_RERUN_REQUIRED';
    label = 'Reviewer Rerun Required';
    nextAction = { label: 'Launch Reviewer', detail: 'Open Agent Team and launch the Reviewer after rework evidence.', page: 'team', targetWorkerRole: 'reviewer' };
  } else if (requiresCloseout && latestReviewerRun && openReviewBlockers.length) {
    status = 'REVIEW_FINDINGS_OPEN';
    label = 'Review Findings Open';
    nextAction = { label: 'Send Findings To Rework', detail: 'Resolve, accept risk, or send reviewer blockers back to Senior Full Stack Dev Rework.', page: 'review', targetWorkerRole: 'fullstack-dev' };
  } else if (requiresCloseout && latestReviewerRun && !latestBuildVerifierRun) {
    status = 'BUILD_VERIFICATION_REQUIRED';
    label = 'Build Verification Required';
    nextAction = { label: 'Launch Build Verifier', detail: 'Open Agent Team and launch Build Verifier after reviewer rerun.', page: 'team', targetWorkerRole: 'build-verifier' };
  } else if (requiresCloseout && latestBuildVerifierRun && failedTests.length && !acceptedImplementationRisk) {
    status = 'VERIFICATION_FINDINGS_OPEN';
    label = 'Verification Findings Open';
    nextAction = { label: 'Review Failed Tests', detail: 'Fix failed tests or accept implementation risk with explicit review notes.', page: 'review' };
  } else if (requiresCloseout && latestBuildVerifierRun && !latestPrReportAfterBuild) {
    status = 'PR_PACK_REQUIRED';
    label = 'PR Pack Required';
    readyForPrPack = true;
    nextAction = { label: 'Prepare PR Pack', detail: 'Generate PR-ready evidence after reviewer and build-verifier reruns.', page: 'pr' };
  } else if (requiresCloseout && latestPrReportAfterBuild) {
    status = latestPrReport?.status === 'PR_READY_REVIEW' ? 'PR_READY_REVIEW' : 'PR_BLOCKED';
    label = latestPrReport?.status === 'PR_READY_REVIEW' ? 'PR Ready For Review' : 'PR Pack Blocked';
    readyForPrPack = true;
    nextAction = latestPrReport?.status === 'PR_READY_REVIEW'
      ? { label: 'Copy PR Markdown', detail: 'PR-ready package is available for human review.', page: 'pr' }
      : { label: 'Review PR Blockers', detail: 'Resolve PR readiness blockers or accept risk with evidence.', page: 'pr' };
  }

  return {
    assignmentId: evidence.assignment?.id || 'assignment-local-mvp',
    requiresCloseout,
    status,
    label,
    readyForPrPack,
    activeReworkCount: activeReworkItems.length,
    nextAction,
    steps,
    latest: {
      reworkRelayItemId: latestReworkItem?.id || '',
      reworkEvidenceId: latestReworkEvidence?.id || '',
      reviewerRunId: latestReviewerRun?.id || '',
      buildVerifierRunId: latestBuildVerifierRun?.id || '',
      prReportId: latestPrReportAfterBuild?.id || ''
    }
  };
}
