import React, { useEffect, useState } from 'react';
import {
  activeAssignmentId,
  buildVerificationEvidenceRows,
  currentEvidenceItems,
  currentPrReadinessReports,
  jiraVerificationState,
  parseEvidenceLines,
  parseTestEvidenceLines,
  standardsGateState,
  workflowAllows,
  workflowStateFromData
} from '@odt/domain';
import {
  ActionList,
  InfoList,
  MetricCard,
  PageHeader,
  Panel,
  SimpleTable,
  StatusBadge,
  WorkflowDecisionBar
} from '../../primitives/index.js';
import {
  shortId,
  titleCase,
  toneFor
} from '../../utils/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`ReviewPage requires ${name}`);
  }
  return value;
}

export function ReviewPage({
  data,
  setActivePage,
  actions = {},
  helpers = {}
}) {
  const postJson = requireDependency(actions.postJson, 'actions.postJson');
  const teamRoles = requireDependency(helpers.teamRoles, 'helpers.teamRoles');
  const getStoredSetting = requireDependency(helpers.getStoredSetting, 'helpers.getStoredSetting');
  const navigate = requireDependency(setActivePage, 'setActivePage');

  const assignmentId = activeAssignmentId(data);
  const assignments = data.snapshot?.assignments || [];
  const evidence = data.evidence || {};
  const workflow = workflowStateFromData(data);
  const { verificationProfile, completedJiraVerification } = jiraVerificationState(workflow);
  const gate = standardsGateState(evidence);
  const comments = currentEvidenceItems(evidence, 'reviewComments');
  const implementationEvidence = currentEvidenceItems(evidence, 'implementationEvidence');
  const latestImplementationEvidence = implementationEvidence[0];
  const recordedTests = implementationEvidence.flatMap((record) => record.tests || []);
  const failedRecordedTests = recordedTests.filter((test) => test.status === 'failed');
  const reviewCycleCloseout = evidence.reviewCycleCloseout || {};
  const closeoutSteps = reviewCycleCloseout.steps || [];
  const openComments = comments.filter((comment) => comment.status === 'open');
  const openBlockers = openComments.filter((comment) => comment.severity === 'blocker');
  const acceptedRisk = comments.filter((comment) => comment.status === 'accepted_risk');
  const reworkRelayItems = currentEvidenceItems(evidence, 'agentRelayItems').filter((item) => item.itemType === 'rework');
  const activeReworkRelayItems = reworkRelayItems.filter((item) => ['open', 'assigned', 'answered'].includes(String(item.status || '').toLowerCase()));
  const reworkRelayCommentIds = new Set(reworkRelayItems.map((item) => item.context?.reviewCommentId).filter(Boolean));
  const selectedAgent = getStoredSetting(data, 'executionAgent', 'codex');
  const latestPrReport = currentEvidenceItems(evidence, 'prReadinessReports')?.[0]?.reportJson || null;
  const verificationEvidenceRows = buildVerificationEvidenceRows({ evidence, workflow, latestReport: latestPrReport, currentEvidenceItems, currentPrReadinessReports, shortId });
  const writeReady = workflowAllows(workflow, 'canDelegateWrite', Boolean(gate.writeApproved && !gate.unresolvedBlockers.length && !openBlockers.length));
  const canRecordImplementationEvidence = workflowAllows(workflow, 'canRecordImplementationEvidence', Boolean(gate.writeApproved || currentEvidenceItems(evidence, 'agentEvents').some((event) => event.eventType === 'handoff_prepared')));
  const implementationDefaults = completedJiraVerification ? {
    changedFiles: [
      verificationProfile?.hasRepoEvidence ? `${verificationProfile.commitCount || 0} Jira-linked commit(s) found for ${verificationProfile.issueKey}` : 'Jira-linked commit evidence still needs review',
      verificationProfile?.repoPath ? `Repository: ${verificationProfile.repoPath}` : ''
    ].filter(Boolean).join('\n'),
    commands: 'Review Jira-linked commits and diffs\nRun approved targeted build/test command or record why unavailable',
    tests: 'Reviewer verification | pending | Inspect Jira Done state, commit evidence, and acceptance proof.\nBuild/test verification | pending | Capture approved repo test/build result.',
    summary: `${verificationProfile?.issueKey || 'Completed Jira'} verification evidence: confirm Jira Done state, repo commits, reviewer findings, build/test proof, and PR/release readiness before implementation work is reopened.`
  } : {
    changedFiles: 'server/index.js\nsrc/main.jsx\nsrc/styles.css',
    commands: 'npm run build',
    tests: 'Build verification | passed | Production bundle completed.',
    summary: 'Implemented the governed workflow slice and recorded evidence for post-implementation standards review.'
  };
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [commentForm, setCommentForm] = useState({
    targetType: 'plan',
    severity: 'warning',
    comment: ''
  });
  const [reworkForm, setReworkForm] = useState({
    targetType: 'plan',
    notes: 'Please rework the plan to address the open review finding before write-approved delegation.'
  });
  const [implementationForm, setImplementationForm] = useState({
    changedFiles: implementationDefaults.changedFiles,
    commands: implementationDefaults.commands,
    tests: implementationDefaults.tests,
    summary: implementationDefaults.summary
  });

  useEffect(() => {
    if (!completedJiraVerification) return;
    setImplementationForm((current) => {
      const stillGenericDefaults = current.changedFiles === 'server/index.js\nsrc/main.jsx\nsrc/styles.css'
        && current.commands === 'npm run build'
        && current.summary === 'Implemented the governed workflow slice and recorded evidence for post-implementation standards review.';
      const emptyForm = !current.changedFiles.trim() && !current.commands.trim() && !current.tests.trim() && !current.summary.trim();
      return stillGenericDefaults || emptyForm ? implementationDefaults : current;
    });
  }, [completedJiraVerification, verificationProfile?.issueKey]);

  function updateCommentField(field, value) {
    setCommentForm((current) => ({ ...current, [field]: value }));
  }

  function updateReworkField(field, value) {
    setReworkForm((current) => ({ ...current, [field]: value }));
  }

  function updateImplementationField(field, value) {
    setImplementationForm((current) => ({ ...current, [field]: value }));
  }

  function closeoutStepTone(status) {
    if (status === 'complete') return 'success';
    if (status === 'current') return 'warning';
    if (status === 'blocked') return 'danger';
    return 'neutral';
  }

  async function openWorkerForRole(workerRole) {
    const role = teamRoles.find((item) => item.id === workerRole);
    if (!workerRole || !role) {
      navigate(reviewCycleCloseout.nextAction?.page || 'team');
      return;
    }
    setBusy(`select-worker-${workerRole}`);
    setNotice('');
    try {
      await postJson('/api/settings', {
        settings: {
          selectedWorkerRole: workerRole
        }
      });
      setNotice(`${role.name} selected in Agent Team for the next closeout step.`);
      await data.refresh();
      navigate('team');
    } catch (err) {
      setNotice(err.message || `Unable to select ${role.name}.`);
    } finally {
      setBusy('');
    }
  }

  function handleCloseoutNextAction() {
    const next = reviewCycleCloseout.nextAction || {};
    if (next.targetWorkerRole) {
      openWorkerForRole(next.targetWorkerRole);
      return;
    }
    navigate(next.page || 'review');
  }

  async function addReviewComment() {
    setBusy('add-comment');
    setNotice('');
    try {
      await postJson('/api/review/comments', {
        assignmentId,
        targetType: commentForm.targetType,
        severity: commentForm.severity,
        comment: commentForm.comment
      });
      setCommentForm((current) => ({ ...current, comment: '' }));
      setNotice('Review comment captured in the evidence trail.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to add review comment.');
    } finally {
      setBusy('');
    }
  }

  async function sendCommentToRework(comment) {
    setBusy(`rework-relay-${comment.id}`);
    setNotice('');
    try {
      const result = await postJson(`/api/review/comments/${encodeURIComponent(comment.id)}/rework-relay`, {
        requestedBy: 'local-user'
      });
      const relay = result.relayItem || {};
      setNotice(`Rework relay ${shortId(relay.id)} is ready for Senior Full Stack Dev. Open Agent Team and launch the worker to receive this finding in Agent Relay Context.`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to send this review comment to rework relay.');
    } finally {
      setBusy('');
    }
  }

  async function updateCommentStatus(comment, status) {
    setBusy(`${status}-${comment.id}`);
    setNotice('');
    try {
      await postJson(`/api/review/comments/${encodeURIComponent(comment.id)}/status`, {
        status,
        resolutionNotes: status === 'accepted_risk'
          ? 'Reviewer accepted this risk and allowed the workflow to continue with documented evidence.'
          : status === 'resolved'
            ? 'Reviewer marked this comment as resolved.'
            : 'Reviewer reopened this comment for continued review.'
      });
      setNotice(status === 'accepted_risk'
        ? 'Risk accepted with evidence. The delegation gate will refresh now.'
        : status === 'resolved'
          ? 'Review comment resolved. The delegation gate will refresh now.'
          : 'Review comment reopened and will block if it is a blocker.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to update review comment.');
    } finally {
      setBusy('');
    }
  }

  async function requestRework() {
    setBusy('rework');
    setNotice('');
    try {
      await postJson('/api/review/rework', {
        assignmentId,
        targetType: reworkForm.targetType,
        notes: reworkForm.notes
      });
      setNotice('Rework requested. ODT drafted a revised design, revised plan, and a fresh standards check. Review the new evidence before delegation.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to request rework.');
    } finally {
      setBusy('');
    }
  }

  async function recordEvidence() {
    setBusy('implementation-evidence');
    setNotice('');
    try {
      const tests = parseTestEvidenceLines(implementationForm.tests);
      const result = await postJson('/api/implementation/evidence', {
        assignmentId,
        changedFiles: parseEvidenceLines(implementationForm.changedFiles),
        commands: parseEvidenceLines(implementationForm.commands),
        tests,
        summary: implementationForm.summary,
        status: tests.some((test) => test.status === 'failed') ? 'needs_review' : 'recorded',
        runPostCheck: true
      });
      setNotice(`Implementation evidence ${shortId(result.evidence.id)} recorded and post-implementation standards check completed.`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to record implementation evidence.');
    } finally {
      setBusy('');
    }
  }

  async function runPostImplementationCheck() {
    setBusy('post-check');
    setNotice('');
    try {
      await postJson('/api/implementation/post-check', {
        assignmentId,
        evidenceId: latestImplementationEvidence?.id
      });
      setNotice('Post-implementation standards check completed from the latest implementation evidence.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to run post-implementation check.');
    } finally {
      setBusy('');
    }
  }

  const nextAction = workflow?.nextAction?.detail || (openBlockers.length
    ? 'Resolve blocker, accept risk, or request rework before delegation.'
    : gate.unresolvedBlockers.length
      ? 'Review Standards blockers, then override with notes or update the plan.'
      : writeReady
        ? `Delegate the write-approved handoff to ${titleCase(selectedAgent)}.`
        : 'Approve the latest standards review before write-approved delegation.');

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Review"
        title="Review and rework control"
        copy="Capture human review comments, resolve or accept risk, send plans back for rework, and make the delegation path obvious before Codex or Cline receives a write-approved handoff."
        actions={<StatusBadge label={workflow?.label || (writeReady ? 'Ready to Delegate' : openBlockers.length || gate.unresolvedBlockers.length ? 'Blocked' : 'Needs Review')} tone={workflowTone(workflow || (writeReady ? 'APPROVED_TO_WRITE' : openBlockers.length || gate.unresolvedBlockers.length ? 'BLOCKED' : 'PLAN_REVIEW'))} />}
      />
      {notice ? <div className="info-banner" role="status">{notice}</div> : null}
      <WorkflowDecisionBar workflow={workflow} onNavigate={navigate} titleCase={titleCase} workflowTone={workflowTone} />
      {completedJiraVerification ? (
        <Panel title="Completed Jira Verification" eyebrow="Imported Work State">
          <div className="verification-lane-panel">
            <div>
              <StatusBadge label={verificationProfile.issueKey || 'Jira Done'} tone="success" />
              <StatusBadge label="Reviewer First" tone="info" />
              <StatusBadge label={verificationProfile.hasRepoEvidence ? `${verificationProfile.commitCount || 0} Commit${verificationProfile.commitCount === 1 ? '' : 's'}` : 'Repo Evidence Needed'} tone={verificationProfile.hasRepoEvidence ? 'success' : 'warning'} />
            </div>
            <p>{verificationProfile.summary} Because the ticket is already Done, ODT should verify existing repo/test/PR evidence before any implementation lane is opened.</p>
            <ActionList
              items={[
                ['Safe next step', workflow?.nextAction?.detail || verificationProfile.nextAction],
                ['Review focus', 'Check Jira details, linked commits, branch/PR status, test evidence, and missing acceptance proof.'],
                ['Write policy', 'Implementation workers stay locked unless Reviewer creates explicit rework.']
              ]}
            />
            <div className="button-row">
              <button className="primary-button" type="button" onClick={() => openWorkerForRole('reviewer')} disabled={Boolean(busy)}>
                Open Reviewer Lane
              </button>
              <button className="secondary-button" type="button" onClick={() => openWorkerForRole('build-verifier')} disabled={Boolean(busy)}>
                Select Build Verifier
              </button>
              <button className="secondary-button" type="button" onClick={() => navigate('pr')} disabled={Boolean(busy)}>
                Open PR Ready
              </button>
            </div>
          </div>
        </Panel>
      ) : null}
      {completedJiraVerification ? (
        <Panel title="Verification Evidence Checklist" eyebrow="Reviewer To PR">
          <SimpleTable
            columns={['Evidence', 'State', 'Detail', 'Next Action']}
            rows={verificationEvidenceRows.map((item) => [
              item.label,
              <StatusBadge label={item.status} tone={item.tone} />,
              item.detail,
              item.action
            ])}
          />
        </Panel>
      ) : null}
      <div className="metric-grid">
        <MetricCard label="Open Comments" value={openComments.length || 0} detail="Need review decision" tone={openComments.length ? 'warning' : 'success'} />
        <MetricCard label="Review Blockers" value={openBlockers.length || 0} detail="Block delegation until resolved or accepted" tone={openBlockers.length ? 'danger' : 'success'} />
        <MetricCard label="Rework Relay" value={activeReworkRelayItems.length || 0} detail="Queued for Senior Full Stack Dev" tone={activeReworkRelayItems.length ? 'warning' : 'success'} />
        <MetricCard label="Implementation Evidence" value={implementationEvidence.length || 0} detail={latestImplementationEvidence ? `${latestImplementationEvidence.changedFiles?.length || 0} files recorded` : 'Required before PR pack'} tone={implementationEvidence.length ? 'success' : 'warning'} />
        <MetricCard label="Accepted Risk" value={acceptedRisk.length || 0} detail="Human-owned continuation evidence" tone={acceptedRisk.length ? 'warning' : 'neutral'} />
        <MetricCard label="Failed Tests" value={failedRecordedTests.length || 0} detail="Need fix or accepted risk" tone={failedRecordedTests.length ? 'danger' : 'success'} />
      </div>
      <Panel title="Review Cycle Closeout" eyebrow="Rework To PR">
        <div className="closeout-header">
          <div>
            <StatusBadge label={titleCase(reviewCycleCloseout.status || 'not_started')} tone={reviewCycleCloseout.readyForPrPack ? 'success' : reviewCycleCloseout.requiresCloseout ? 'warning' : 'neutral'} />
            <h4>{reviewCycleCloseout.label || 'No active review cycle'}</h4>
            <p className="muted-copy">{reviewCycleCloseout.nextAction?.detail || 'Route review findings to rework when the reviewer finds issues that need another implementation pass.'}</p>
          </div>
          <button
            className={reviewCycleCloseout.nextAction?.targetWorkerRole ? 'primary-button' : 'secondary-button'}
            type="button"
            onClick={handleCloseoutNextAction}
            disabled={Boolean(busy) || (!reviewCycleCloseout.requiresCloseout && reviewCycleCloseout.nextAction?.page === 'review')}
          >
            {busy.startsWith('select-worker-') ? 'Selecting Worker' : reviewCycleCloseout.nextAction?.label || 'Open Review'}
          </button>
        </div>
        <SimpleTable
          columns={['Step', 'Status', 'Evidence', 'Next Lane']}
          rows={closeoutSteps.map((step) => [
            step.label,
            <StatusBadge label={titleCase(step.status)} tone={closeoutStepTone(step.status)} />,
            step.evidenceId || step.workerRunId || step.reportId || step.detail,
            step.targetWorkerRole ? (teamRoles.find((role) => role.id === step.targetWorkerRole)?.name || titleCase(step.targetWorkerRole)) : step.page ? titleCase(step.page) : 'ODT'
          ])}
          empty="No rework cycle is queued. Send a warning or blocker review finding to rework when another implementation pass is needed."
        />
      </Panel>
      <div className="two-column wide-left">
        <Panel title="Review Queue" eyebrow="Human Decisions">
          <SimpleTable
            columns={['Target', 'Severity', 'Comment', 'Status', 'Actions']}
            rows={comments.map((comment) => [
              titleCase(comment.targetType),
              <StatusBadge label={titleCase(comment.severity)} tone={comment.severity === 'blocker' ? 'danger' : comment.severity === 'warning' ? 'warning' : 'neutral'} />,
              <span>{comment.comment}{comment.resolutionNotes ? <small className="cell-note">{comment.resolutionNotes}</small> : null}</span>,
              <StatusBadge label={titleCase(comment.status)} tone={comment.status === 'resolved' ? 'success' : comment.status === 'accepted_risk' ? 'warning' : 'danger'} />,
              (() => {
                const canSendRework = comment.status === 'open' && ['warning', 'blocker'].includes(comment.severity);
                const alreadyRelayed = reworkRelayCommentIds.has(comment.id);
                return (
                  <div className="button-row compact-buttons">
                    <button
                      className="table-button"
                      type="button"
                      onClick={() => (alreadyRelayed ? navigate('team') : sendCommentToRework(comment))}
                      disabled={Boolean(busy) || !canSendRework}
                      title={canSendRework ? 'Route this review finding to the Senior Full Stack Dev rework lane.' : 'Only open warning or blocker comments can be sent to rework.'}
                    >
                      {busy === `rework-relay-${comment.id}` ? 'Sending' : alreadyRelayed ? 'Open Rework' : 'Send Rework'}
                    </button>
                    <button className="table-button" type="button" onClick={() => updateCommentStatus(comment, 'resolved')} disabled={Boolean(busy) || comment.status === 'resolved'}>Resolve</button>
                    <button className="table-button" type="button" onClick={() => updateCommentStatus(comment, 'accepted_risk')} disabled={Boolean(busy) || comment.status === 'accepted_risk'}>Accept Risk</button>
                    <button className="table-button" type="button" onClick={() => updateCommentStatus(comment, 'open')} disabled={Boolean(busy) || comment.status === 'open'}>Reopen</button>
                  </div>
                );
              })()
            ])}
            empty="No review comments yet. Add one when a plan, standard, handoff, or PR package needs a human decision."
          />
        </Panel>
        <Panel title="Next Delivery Action" eyebrow="Where To Go">
          <InfoList
            items={[
              ['Next action', nextAction],
              ['Standards blockers', gate.unresolvedBlockers.length || 'None'],
              ['Review blockers', openBlockers.length || 'None'],
              ['Write approval', gate.writeApproved ? 'Captured' : 'Required'],
              ['Delegation target', titleCase(selectedAgent)]
            ]}
          />
          <div className="button-row vertical">
            <button className="primary-button" type="button" onClick={() => navigate(writeReady ? 'team' : 'standards')}>
              {writeReady ? `Delegate to ${titleCase(selectedAgent)}` : 'Open Standards Gate'}
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('planner')}>Review Plan</button>
            <button className="secondary-button" type="button" onClick={() => navigate('artifacts')}>View Evidence</button>
          </div>
        </Panel>
      </div>
      <div className="two-column">
        <Panel title="Add Review Comment" eyebrow="Reviewer Note">
          <div className="form-grid two">
            <label className="field" htmlFor="review-target-type">
              <span>Target</span>
              <select id="review-target-type" value={commentForm.targetType} onChange={(event) => updateCommentField('targetType', event.target.value)}>
                <option value="plan">Plan</option>
                <option value="design">Design</option>
                <option value="standards">Standards</option>
                <option value="handoff">Agent handoff</option>
                <option value="implementation">Implementation</option>
                <option value="pr">PR package</option>
              </select>
            </label>
            <label className="field" htmlFor="review-severity">
              <span>Severity</span>
              <select id="review-severity" value={commentForm.severity} onChange={(event) => updateCommentField('severity', event.target.value)}>
                <option value="comment">Comment</option>
                <option value="warning">Warning</option>
                <option value="blocker">Blocker</option>
              </select>
            </label>
          </div>
          <label className="field" htmlFor="review-comment">
            <span>Comment</span>
            <textarea
              id="review-comment"
              className="notes-input"
              value={commentForm.comment}
              onChange={(event) => updateCommentField('comment', event.target.value)}
              placeholder="Describe what needs review, what must change, or what risk is being accepted."
            />
          </label>
          <button className="secondary-button" type="button" onClick={addReviewComment} disabled={Boolean(busy) || !commentForm.comment.trim()}>
            {busy === 'add-comment' ? 'Adding Comment' : 'Add Review Comment'}
          </button>
        </Panel>
        <Panel title="Request Rework" eyebrow="Send Back">
          <div className="form-grid">
            <label className="field" htmlFor="rework-target-type">
              <span>Rework target</span>
              <select id="rework-target-type" value={reworkForm.targetType} onChange={(event) => updateReworkField('targetType', event.target.value)}>
                <option value="plan">Plan</option>
                <option value="design">Design</option>
                <option value="standards">Standards</option>
                <option value="handoff">Agent handoff</option>
                <option value="implementation">Implementation</option>
                <option value="pr">PR package</option>
              </select>
            </label>
            <label className="field" htmlFor="rework-notes">
              <span>Rework notes</span>
              <textarea
                id="rework-notes"
                className="notes-input"
                value={reworkForm.notes}
                onChange={(event) => updateReworkField('notes', event.target.value)}
                placeholder="Explain what must change before the plan can be approved."
              />
            </label>
          </div>
          <p className="muted-copy">Request Rework creates a blocker review comment, drafts a revised design and plan, runs a fresh standards check, and makes older write approval stale.</p>
          <button className="secondary-button danger-action" type="button" onClick={requestRework} disabled={Boolean(busy) || !reworkForm.notes.trim()}>
            {busy === 'rework' ? 'Requesting Rework' : 'Request Rework'}
          </button>
        </Panel>
      </div>
      <div className="two-column wide-left">
        <Panel title={completedJiraVerification ? 'Verification Evidence Capture' : 'Implementation Evidence Capture'} eyebrow={completedJiraVerification ? 'Completed Jira Evidence' : 'Post-Handoff Evidence'}>
          <div className="form-grid two">
            <label className="field" htmlFor="implementation-files">
              <span>{completedJiraVerification ? 'Evidence sources' : 'Changed files'}</span>
              <textarea
                id="implementation-files"
                className="notes-input compact-notes"
                value={implementationForm.changedFiles}
                onChange={(event) => updateImplementationField('changedFiles', event.target.value)}
                placeholder="One file path per line"
              />
            </label>
            <label className="field" htmlFor="implementation-commands">
              <span>{completedJiraVerification ? 'Verification actions' : 'Commands run'}</span>
              <textarea
                id="implementation-commands"
                className="notes-input compact-notes"
                value={implementationForm.commands}
                onChange={(event) => updateImplementationField('commands', event.target.value)}
                placeholder="One command per line"
              />
            </label>
          </div>
          <label className="field" htmlFor="implementation-tests">
            <span>Test outcomes</span>
            <textarea
              id="implementation-tests"
              className="notes-input compact-notes"
              value={implementationForm.tests}
              onChange={(event) => updateImplementationField('tests', event.target.value)}
              placeholder="Example: npm run build | passed | Production bundle completed"
            />
          </label>
          <label className="field" htmlFor="implementation-summary">
            <span>{completedJiraVerification ? 'Verification summary' : 'Implementation summary'}</span>
            <textarea
              id="implementation-summary"
              className="notes-input"
              value={implementationForm.summary}
              onChange={(event) => updateImplementationField('summary', event.target.value)}
              placeholder="Explain what changed, what was verified, and what remains risky."
            />
          </label>
          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              onClick={recordEvidence}
              disabled={Boolean(busy) || !canRecordImplementationEvidence || (!implementationForm.summary.trim() && !implementationForm.changedFiles.trim() && !implementationForm.commands.trim() && !implementationForm.tests.trim())}
              title={canRecordImplementationEvidence ? (completedJiraVerification ? 'Record reviewer, repo, command, and test evidence for completed-Jira verification.' : 'Record changed files, commands, and tests as implementation evidence.') : 'Implementation evidence is locked until write/delegate approval is current and blockers are cleared.'}
            >
              {busy === 'implementation-evidence' ? 'Recording Evidence' : completedJiraVerification ? 'Record Verification Evidence' : 'Record Implementation Evidence'}
            </button>
            <button className="secondary-button" type="button" onClick={runPostImplementationCheck} disabled={Boolean(busy) || !latestImplementationEvidence}>
              {busy === 'post-check' ? 'Checking' : 'Run Post-Implementation Check'}
            </button>
          </div>
        </Panel>
        <Panel title={completedJiraVerification ? 'Latest Verification Evidence' : 'Latest Implementation Evidence'} eyebrow="PR Gate Input">
          {latestImplementationEvidence ? (
            <InfoList
              items={[
                ['Evidence id', shortId(latestImplementationEvidence.id)],
                ['Status', titleCase(latestImplementationEvidence.status)],
                ['Changed files', latestImplementationEvidence.changedFiles?.length || 0],
                ['Commands', latestImplementationEvidence.commands?.length || 0],
                ['Tests recorded', latestImplementationEvidence.tests?.length || 0],
                ['Failed tests', failedRecordedTests.length || 'None'],
                ['Created by', latestImplementationEvidence.createdBy || 'local-user']
              ]}
            />
          ) : (
            <div className="empty-state">{completedJiraVerification ? 'No verification evidence yet. Record reviewer/build/test proof before PR readiness.' : 'No implementation evidence yet. Record it after Codex, Cline, or manual work finishes.'}</div>
          )}
          <div className="button-row vertical">
            <button className="secondary-button" type="button" onClick={() => navigate('artifacts')}>Open Evidence Artifact</button>
            <button className="secondary-button" type="button" onClick={() => navigate('standards')}>Open Standards Gate</button>
          </div>
        </Panel>
      </div>
      <Panel title="Assignment Review Surface" eyebrow="Current Work">
        <SimpleTable
          columns={['Item', 'Type', 'Status', 'Action']}
          rows={(assignments.length ? assignments : [{ title: 'Local Workbench MVP', status: 'needs review' }]).map((item) => [
            item.title,
            'Plan',
            <StatusBadge label={titleCase(item.status)} tone={toneFor(item.status)} />,
            <button className="table-button" type="button" onClick={() => navigate('planner')}>Review Plan</button>
          ])}
        />
      </Panel>
    </div>
  );
}

function workflowTone(workflow) {
  const state = workflow?.state || workflow;
  if (!state) return 'neutral';
  if (state === 'PR_READY') return 'success';
  if (state === 'BLOCKED' || state === 'FAILED') return 'danger';
  if (state === 'APPROVED_TO_WRITE' || state === 'IMPLEMENTATION_EVIDENCE_RECORDED' || state === 'POST_IMPLEMENTATION_REVIEW') return 'info';
  if (String(state).includes('PENDING') || String(state).includes('REVIEW') || String(state).includes('INTAKE')) return 'warning';
  return 'info';
}
