import {
  verificationTestPassed,
  workerRunHasReviewableOutput
} from './workflow.js';

export function buildVerificationEvidenceRows({
  evidence = {},
  workflow = {},
  latestReport = null,
  currentEvidenceItems,
  currentPrReadinessReports,
  shortId = (value) => String(value || '').slice(0, 8)
} = {}) {
  const profile = workflow?.verificationProfile || null;
  if (!profile || typeof currentEvidenceItems !== 'function') return [];

  const implementationEvidence = currentEvidenceItems(evidence, 'implementationEvidence');
  const latestEvidence = implementationEvidence[0] || null;
  const tests = implementationEvidence.flatMap((record) => record.tests || []);
  const commands = implementationEvidence.flatMap((record) => record.commands || []);
  const workerRuns = currentEvidenceItems(evidence, 'agentWorkerRuns');
  const reviewerRuns = workerRuns.filter((run) => run.workerRole === 'reviewer');
  const buildVerifierRuns = workerRuns.filter((run) => run.workerRole === 'build-verifier');
  const reviewableReviewerRuns = reviewerRuns.filter(workerRunHasReviewableOutput);
  const reviewableBuildVerifierRuns = buildVerifierRuns.filter(workerRunHasReviewableOutput);
  const passedTests = tests.filter(verificationTestPassed);
  const inconclusiveTests = tests.filter((test) => !verificationTestPassed(test));
  const prReports = typeof currentPrReadinessReports === 'function' ? currentPrReadinessReports(evidence) : [];
  const prReport = latestReport || prReports?.[0]?.reportJson || null;
  const prReady = Boolean(prReport && prReport.status === 'PR_READY_REVIEW' && latestEvidence && (passedTests.length || reviewableBuildVerifierRuns.length));
  const row = (label, ready, detail, action, readyLabel = 'Ready', missingLabel = 'Missing') => ({
    label,
    status: ready ? readyLabel : missingLabel,
    tone: ready ? 'success' : 'warning',
    detail,
    action
  });

  return [
    row(
      'Jira Done classification',
      profile.state === 'completed',
      profile.issueKey ? `${profile.issueKey} imported as completed work.` : 'Import Jira to classify the work item.',
      'Use Intake > Import Jira when classification is missing.'
    ),
    row(
      'Repository evidence',
      profile.hasRepoEvidence,
      profile.hasRepoEvidence ? `${profile.commitCount || 0} matching commit${profile.commitCount === 1 ? '' : 's'} detected.` : 'No matching repo evidence has been attached yet.',
      'Attach/re-analyze the target repo or paste the absolute repo path.'
    ),
    row(
      'Reviewer evidence',
      reviewableReviewerRuns.length > 0,
      reviewableReviewerRuns.length
        ? `${reviewableReviewerRuns.length} reviewer output${reviewableReviewerRuns.length === 1 ? '' : 's'} ingested or ready to review.`
        : reviewerRuns.length
          ? `${reviewerRuns.length} reviewer run${reviewerRuns.length === 1 ? '' : 's'} exists, but output has not been ingested or captured.`
          : 'Reviewer has not inspected Jira, commits, risks, and missing acceptance proof yet.',
      reviewerRuns.length ? 'Refresh and ingest Reviewer output in Agent Team.' : 'Open Agent Team and launch/select Reviewer.',
      'Ready',
      reviewerRuns.length ? 'Pending Output' : 'Missing'
    ),
    row(
      'Build/test verification',
      Boolean(passedTests.length || reviewableBuildVerifierRuns.length),
      passedTests.length || commands.length
        ? `${passedTests.length} passed test result${passedTests.length === 1 ? '' : 's'}, ${inconclusiveTests.length} inconclusive result${inconclusiveTests.length === 1 ? '' : 's'}, and ${commands.length} command${commands.length === 1 ? '' : 's'} recorded.`
        : reviewableBuildVerifierRuns.length
          ? `${reviewableBuildVerifierRuns.length} Build Verifier output${reviewableBuildVerifierRuns.length === 1 ? '' : 's'} ingested or ready to review.`
          : buildVerifierRuns.length
            ? `${buildVerifierRuns.length} Build Verifier run${buildVerifierRuns.length === 1 ? '' : 's'} exists, but output has not been ingested or captured.`
            : 'No build/test verification evidence is recorded.',
      buildVerifierRuns.length ? 'Refresh and ingest Build Verifier output in Agent Team.' : 'Record passed test/build evidence in Review or launch Build Verifier.',
      'Ready',
      buildVerifierRuns.length ? 'Pending Output' : 'Missing'
    ),
    row(
      'Verification evidence record',
      Boolean(latestEvidence),
      latestEvidence ? latestEvidence.summary || `Evidence ${shortId(latestEvidence.id)} is recorded.` : 'No Review evidence record has been captured.',
      'Use Review > Record Verification Evidence.'
    ),
    {
      label: 'PR readiness package',
      status: prReady ? 'Ready' : prReport ? 'Needs Refresh' : 'Missing',
      tone: prReady ? 'success' : 'warning',
      detail: prReport ? `Latest PR pack status: ${prReport.status}.` : 'No PR readiness pack generated yet.',
      action: prReady ? 'Open PR Ready to review/copy the package.' : 'Generate or refresh the PR pack after verification evidence is ready.'
    }
  ];
}
