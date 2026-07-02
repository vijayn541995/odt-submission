import React, { useEffect, useState } from 'react';
import {
  activeAssignmentId,
  activeWorkKey,
  buildVerificationEvidenceRows,
  currentEvidenceItems,
  currentPrReadinessReports,
  extractWorkKeyFromText,
  jiraVerificationState,
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
  titleCase
} from '../../utils/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`PrReadinessPage requires ${name}`);
  }
  return value;
}

export function PrReadinessPage({
  data,
  setActivePage,
  actions = {}
}) {
  const postJson = requireDependency(actions.postJson, 'actions.postJson');
  const copyTextToClipboard = requireDependency(actions.copyTextToClipboard, 'actions.copyTextToClipboard');
  const navigate = requireDependency(setActivePage, 'setActivePage');

  const assignmentId = activeAssignmentId(data);
  const currentWorkKey = activeWorkKey(data);
  const evidence = data.evidence || {};
  const workflow = workflowStateFromData(data);
  const { verificationProfile, completedJiraVerification } = jiraVerificationState(workflow);
  const currentPrReports = currentPrReadinessReports(evidence);
  const latestReport = currentPrReports?.[0]?.reportJson || null;
  const latestImplementationEvidence = currentEvidenceItems(evidence, 'implementationEvidence')?.[0] || null;
  const reviewCycleCloseout = evidence.reviewCycleCloseout || {};
  const tests = latestImplementationEvidence?.tests || [];
  const failedTests = tests.filter((test) => test.status === 'failed');
  const blockingItems = latestReport?.blockingItems || [];
  const checklist = latestReport?.readinessChecklist || [];
  const verificationEvidenceRows = buildVerificationEvidenceRows({ evidence, workflow, latestReport, currentEvidenceItems, currentPrReadinessReports, shortId });
  const verificationGaps = completedJiraVerification
    ? verificationEvidenceRows.filter((item) => item.status !== 'Ready').length
    : 0;
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const defaultLinkedJira = verificationProfile?.issueKey || currentWorkKey || latestReport?.linkedJira || '';
  const [form, setForm] = useState({
    linkedJira: defaultLinkedJira || '',
    notes: latestReport?.reviewerNotes || 'Prepared from PR Readiness Command Center.'
  });

  useEffect(() => {
    if (!defaultLinkedJira) return;
    setForm((current) => {
      const currentKey = extractWorkKeyFromText(current.linkedJira);
      if (currentKey === defaultLinkedJira) return current;
      return { ...current, linkedJira: defaultLinkedJira };
    });
  }, [assignmentId, defaultLinkedJira]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function generatePrPack() {
    setBusy('generate');
    setNotice('');
    try {
      const result = await postJson('/api/pr/prepare', {
        assignmentId,
        linkedJira: form.linkedJira.trim() || defaultLinkedJira,
        notes: form.notes
      });
      setNotice(result.report?.status === 'BLOCKED'
        ? `PR pack generated as BLOCKED. Review ${result.report.blockingItems?.length || 0} blocking item(s).`
        : 'PR pack generated and ready for review.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to generate PR pack.');
    } finally {
      setBusy('');
    }
  }

  async function copyMarkdown() {
    setBusy('copy');
    setNotice('');
    try {
      const text = latestReport?.markdown || '';
      const copied = text ? await copyTextToClipboard(text) : false;
      setNotice(copied ? 'PR markdown copied to clipboard.' : 'No PR markdown is available yet. Generate a PR pack first.');
    } catch (err) {
      setNotice(err.message || 'Unable to copy PR markdown.');
    } finally {
      setBusy('');
    }
  }

  const status = latestReport?.status || 'NOT_PREPARED';
  const checkedCount = checklist.filter((item) => item.checked).length;
  const evidenceSummary = latestReport?.evidenceSummary || {};

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="PR Ready"
        title="PR Readiness Command Center"
        copy="Generate the PR-ready package from actual evidence: changed files, tests, standards checks, review decisions, dependency decisions, risks, and rollback notes."
        actions={(
          <>
            <button className="primary-button" type="button" onClick={generatePrPack} disabled={Boolean(busy)}>
              {busy === 'generate' ? 'Generating' : 'Generate PR Pack'}
            </button>
            <button className="secondary-button" type="button" onClick={copyMarkdown} disabled={Boolean(busy) || !latestReport?.markdown}>
              {busy === 'copy' ? 'Copying' : 'Copy PR Markdown'}
            </button>
          </>
        )}
      />
      {notice ? <div className="info-banner" role="status">{notice}</div> : null}
      <WorkflowDecisionBar workflow={workflow} onNavigate={navigate} titleCase={titleCase} workflowTone={workflowTone} />
      {completedJiraVerification ? (
        <Panel title="Completed Jira Verification Inputs" eyebrow="PR Evidence Source">
          <div className="verification-lane-panel">
            <div>
              <StatusBadge label={verificationProfile.issueKey || 'Jira Done'} tone="success" />
              <StatusBadge label={verificationProfile.hasRepoEvidence ? 'Repo Evidence Found' : 'Repo Evidence Needed'} tone={verificationProfile.hasRepoEvidence ? 'success' : 'warning'} />
              <StatusBadge label="Human Review Required" tone="warning" />
            </div>
            <p>{verificationProfile.summary} Generate the PR pack only after Reviewer and build/test evidence are captured or consciously accepted as risk.</p>
            <ActionList
              items={[
                ['Linked Jira', verificationProfile.issueKey || 'Detected from imported evidence'],
                ['Repository', verificationProfile.repoPath || 'Use imported repo context'],
                ['Required evidence', 'Reviewer notes, build/test command results, and any missing PR/release proof.']
              ]}
            />
            <div className="button-row">
              <button className="primary-button" type="button" onClick={() => navigate('team')}>Open Agent Team</button>
              <button className="secondary-button" type="button" onClick={() => navigate('review')}>Record Verification Evidence</button>
            </div>
          </div>
        </Panel>
      ) : null}
      {completedJiraVerification ? (
        <Panel title="Verification Evidence Checklist" eyebrow="PR Gate Inputs">
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
        <MetricCard label="Workflow State" value={workflow?.label || 'Not Started'} detail={workflow?.nextAction?.label || 'Collect evidence'} tone={workflowTone(workflow)} />
        <MetricCard label="PR Gate" value={status} detail={latestReport ? 'Latest generated pack' : 'Generate first pack'} tone={status === 'PR_READY_REVIEW' ? 'success' : status === 'BLOCKED' ? 'danger' : 'warning'} />
        <MetricCard label="Latest Pack ID" value={latestReport?.packId || latestReport?.id || 'Not Generated'} detail={latestReport?.workKey || defaultLinkedJira || 'Tagged when generated'} tone={latestReport ? 'info' : 'neutral'} />
        <MetricCard
          label="Blocking Items"
          value={latestReport ? blockingItems.length || 0 : verificationGaps}
          detail={latestReport ? 'Must resolve or accept risk' : 'Verification gaps before pack'}
          tone={latestReport ? blockingItems.length ? 'danger' : 'success' : verificationGaps ? 'warning' : 'success'}
        />
        <MetricCard label="Checklist" value={`${checkedCount}/${checklist.length || 0}`} detail="Evidence-backed items" tone={checklist.length && checkedCount === checklist.length ? 'success' : 'warning'} />
        <MetricCard label="Review Cycle" value={reviewCycleCloseout.readyForPrPack ? 'Ready' : reviewCycleCloseout.requiresCloseout ? 'Open' : 'None'} detail={reviewCycleCloseout.label || 'No rework queued'} tone={reviewCycleCloseout.readyForPrPack ? 'success' : reviewCycleCloseout.requiresCloseout ? 'warning' : 'neutral'} />
        <MetricCard label="Changed Files" value={latestImplementationEvidence?.changedFiles?.length || 0} detail="From implementation evidence" tone={latestImplementationEvidence ? 'success' : 'warning'} />
        <MetricCard label="Failed Tests" value={failedTests.length || 0} detail="Need fix or accepted risk" tone={failedTests.length ? 'danger' : 'success'} />
      </div>
      <div className="two-column wide-left">
        <Panel title="PR Package Builder" eyebrow="Generate">
          <div className="form-grid two">
            <label className="field" htmlFor="pr-linked-jira">
              <span>Linked Jira</span>
              <input
                id="pr-linked-jira"
                value={form.linkedJira}
                onChange={(event) => updateField('linkedJira', event.target.value)}
                placeholder={defaultLinkedJira || 'PROJECT-12345'}
              />
            </label>
            <label className="field" htmlFor="pr-reviewer-notes">
              <span>Reviewer notes</span>
              <input
                id="pr-reviewer-notes"
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Notes to include in the PR pack"
              />
            </label>
          </div>
          <ActionList
            items={[
              ['Evidence Source', latestImplementationEvidence ? `Latest implementation evidence ${shortId(latestImplementationEvidence.id)} is attached.` : 'Implementation evidence is missing. Record it in Review first.'],
              ['Pack Identity', latestReport ? `${latestReport.packId || latestReport.id || 'Unlabeled pack'} tagged to ${latestReport.workKey || latestReport.linkedJira || defaultLinkedJira || assignmentId}` : `Next pack will be timestamped and tagged to ${defaultLinkedJira || assignmentId}.`],
              ['Review Cycle', reviewCycleCloseout.requiresCloseout ? `${reviewCycleCloseout.label}: ${reviewCycleCloseout.nextAction?.detail || 'Complete closeout.'}` : 'No rework cycle is currently queued.'],
              ['Standards Gate', latestReport ? `Latest PR pack status is ${latestReport.status}.` : 'No PR pack has been generated yet.'],
              ['Human Review', 'Blocked items remain reviewable and can be resolved, accepted as risk, or sent back for rework.']
            ]}
          />
          <div className="button-row">
            <button className="primary-button" type="button" onClick={generatePrPack} disabled={Boolean(busy)}>
              {busy === 'generate' ? 'Generating' : 'Generate PR Pack'}
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('review')}>Record Evidence</button>
            <button className="secondary-button" type="button" onClick={() => navigate('artifacts')}>Open Artifacts</button>
          </div>
        </Panel>
        <Panel title="Gate Decision" eyebrow="Blockers">
          <SimpleTable
            columns={['Category', 'Message', 'Required Action']}
            rows={blockingItems.map((item) => [
              titleCase(item.category),
              item.message,
              item.requiredAction
            ])}
            empty={latestReport ? 'No blocking items detected. PR pack is ready for human review.' : 'Generate a PR pack to calculate blockers.'}
          />
        </Panel>
      </div>
      <div className="two-column">
        <Panel title="Readiness Checklist" eyebrow="Evidence Mapping">
          <SimpleTable
            columns={['Check', 'Status']}
            rows={checklist.map((item) => [
              item.label,
              <StatusBadge label={item.checked ? 'Ready' : 'Missing'} tone={item.checked ? 'success' : 'warning'} />
            ])}
            empty="No checklist yet. Generate a PR pack to map evidence."
          />
        </Panel>
        <Panel title="Evidence Summary" eyebrow="Coverage">
          <InfoList
            items={[
              ['Requirements', evidenceSummary.requirements || currentEvidenceItems(evidence, 'requirements').length],
              ['Repo analyses', evidenceSummary.repoAnalyses || currentEvidenceItems(evidence, 'repoAnalysis').length],
              ['Designs', evidenceSummary.technicalDesigns || currentEvidenceItems(evidence, 'technicalDesigns').length],
              ['Plans', evidenceSummary.implementationPlans || currentEvidenceItems(evidence, 'implementationPlans').length],
              ['Standards checks', evidenceSummary.standardsChecks || currentEvidenceItems(evidence, 'standardsChecks').length],
              ['Implementation evidence', evidenceSummary.implementationEvidence || currentEvidenceItems(evidence, 'implementationEvidence').length],
              ['Test results', evidenceSummary.testResults || tests.length || 0],
              ['Approvals', evidenceSummary.approvals || currentEvidenceItems(evidence, 'approvals').length]
            ]}
          />
        </Panel>
      </div>
      <Panel title="PR Markdown Preview" eyebrow="Copyable Output">
        {latestReport?.markdown ? (
          <>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={copyMarkdown} disabled={Boolean(busy)}>
                {busy === 'copy' ? 'Copying' : 'Copy Markdown'}
              </button>
              <StatusBadge label={latestReport.status} tone={latestReport.status === 'PR_READY_REVIEW' ? 'success' : 'danger'} />
            </div>
            <pre className="markdown-block">{latestReport.markdown}</pre>
          </>
        ) : (
          <div className="empty-state">No PR markdown yet. Generate a PR pack after implementation evidence is recorded.</div>
        )}
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
