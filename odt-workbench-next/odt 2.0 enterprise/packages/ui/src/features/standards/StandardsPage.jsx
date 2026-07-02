import React, { useState } from 'react';
import {
  activeAssignmentId,
  currentEvidenceItems,
  isHardSafetyBlocker,
  jiraVerificationState,
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
  Timeline,
  WorkflowDecisionBar
} from '../../primitives/index.js';
import { titleCase } from '../../utils/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`StandardsPage requires ${name}`);
  }
  return value;
}

export function StandardsPage({
  data,
  setActivePage,
  actions = {},
  helpers = {},
  slots = {}
}) {
  const postJson = requireDependency(actions.postJson, 'actions.postJson');
  const currentWorkBrief = requireDependency(helpers.currentWorkBrief, 'helpers.currentWorkBrief');
  const CurrentWorkBrief = requireDependency(slots.CurrentWorkBrief, 'slots.CurrentWorkBrief');
  const navigate = requireDependency(setActivePage, 'setActivePage');

  const assignmentId = activeAssignmentId(data);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('Reviewed latest findings and accepted the delivery risk for this local MVP. Continue with write-approved agent handoff.');
  const [dependencyForm, setDependencyForm] = useState({
    packageName: '',
    version: '',
    license: 'MIT',
    reason: '',
    alternatives: ''
  });
  const evidence = data.evidence || {};
  const workflow = workflowStateFromData(data);
  const { verificationProfile, completedJiraVerification } = jiraVerificationState(workflow);
  const workBrief = currentWorkBrief(data);
  const gate = standardsGateState(evidence);
  const latestCheck = gate.latestCheck;
  const findings = gate.findings;
  const blockers = gate.unresolvedBlockers;
  const reviewBlockers = gate.reviewBlockers || [];
  const reviewedBlockers = gate.blockerFindings;
  const hardSafetyBlockers = gate.hardSafetyBlockers || [];
  const approvals = currentEvidenceItems(evidence, 'approvals');
  const writeApproved = gate.writeApproved;
  const approvalBlockedByDecision = workflow?.blockedReasons?.some((reason) => reason.category === 'approval');
  const canApproveFromStandards = workflowAllows(workflow, 'canApproveWrite', Boolean(latestCheck && !writeApproved)) && !reviewBlockers.length;
  const approvalActionDisabled = Boolean(busy) || !latestCheck || writeApproved || !canApproveFromStandards;
  const approvalActionLabel = writeApproved
    ? 'Approval Captured'
    : approvalBlockedByDecision
      ? 'Clear Block And Approve Write'
      : hardSafetyBlockers.length
        ? 'Record Review, Keep Safety Block'
        : blockers.length
          ? 'Override Reviewed Blockers'
          : 'Approve With Warnings';
  const dependencies = currentEvidenceItems(evidence, 'dependencyRequests');
  const pendingDependencies = dependencies.filter((request) => request.status === 'pending');
  const approvedDependencies = dependencies.filter((request) => request.status === 'approved');
  const rejectedDependencies = dependencies.filter((request) => request.status === 'rejected');
  const implementationEvidence = currentEvidenceItems(evidence, 'implementationEvidence');
  const failedRecordedTests = implementationEvidence.flatMap((record) => record.tests || []).filter((test) => test.status === 'failed');
  const prReports = currentEvidenceItems(evidence, 'prReadinessReports');
  const flexibility = data.standards?.flexibility;
  const standardsSources = data.standards?.registry?.sources || [];
  const standardsConfigSource = standardsSources.find((source) => source.id === 'standards-config');
  const effectiveGateStatus = gate.implementationBlocked
    ? 'BLOCKED_BY_REVIEW'
    : writeApproved && !blockers.length
      ? gate.blockerOverride ? 'WRITE_APPROVED_WITH_OVERRIDE' : 'WRITE_APPROVED'
      : latestCheck?.status || 'Not Run';

  async function runCheck() {
    setBusy('check');
    setNotice('');
    try {
      await postJson('/api/standards/check', {
        assignmentId,
        phase: 'pre-implementation',
        artifact: {
          plan: [
            workBrief.title,
            workBrief.domain,
            ...workBrief.behaviors,
            ...workBrief.apiRules,
            ...workBrief.tests,
            'Accessibility WCAG VPAT Section 508, keyboard focus labels contrast, security compliance validation safe errors, dependency policy no new dependency, testing statement coverage branch coverage function coverage line coverage positive negative boundary error scenarios, Redwood UX loading empty error success states, performance latency timeout, maintainable reusable naming existing pattern.'
          ].join(' '),
          flexibility: 'Theme, wording, non-critical checklist thresholds, and page titles may be adjusted through documented approval notes. Frontend secrets, destructive actions, and unapproved dependency installs remain blocked.'
        }
      });
      setNotice('Standards review completed and stored in the evidence trail.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Standards review failed.');
    } finally {
      setBusy('');
    }
  }

  async function updatePlan() {
    setBusy('plan');
    setNotice('');
    try {
      await postJson('/api/design/draft', { assignmentId });
      await postJson('/api/plan/draft', { assignmentId });
      setNotice(completedJiraVerification
        ? 'Verification design and verification plan drafts were refreshed for the completed Jira work.'
        : 'Technical design and implementation plan drafts were refreshed.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Plan update failed.');
    } finally {
      setBusy('');
    }
  }

  async function approveWarnings() {
    setBusy('approve');
    setNotice('');
    try {
      const notes = approvalNotes.trim() || 'Reviewed latest standards findings and approved controlled continuation.';
      if (blockers.length) {
        await postJson('/api/approvals', {
          assignmentId,
          approvalType: 'standards_blocker_override',
          status: 'approved',
          notes: `${notes} Overrode ${blockers.length} blocker(s) from standards check ${latestCheck?.id || 'latest'}.`
        });
      }
      await postJson('/api/approvals', {
        assignmentId,
        approvalType: 'standards_warning_override',
        status: 'approved',
        notes
      });
      if (hardSafetyBlockers.length) {
        setNotice(`${hardSafetyBlockers.length} hard safety blocker(s) were reviewed, but write approval remains locked. Resolve frontend secrets/destructive-action findings or use the separate dependency approval path, then rerun Standards Check.`);
      } else {
        await postJson('/api/approvals', {
          assignmentId,
          approvalType: 'write_scope',
          status: 'approved',
          notes: approvalBlockedByDecision
            ? 'Write scope approved with a newer decision, clearing the prior implementation block.'
            : blockers.length
              ? 'Write scope approved after reviewed blocker override for latest standards findings.'
              : 'Write scope approved with non-critical standards warnings accepted.'
        });
        setNotice(approvalBlockedByDecision
          ? 'Prior implementation block was reviewed and cleared with a newer write approval. Agent delegation is now available if no other blockers remain.'
          : blockers.length
            ? 'Reviewed blockers were overridden with notes and write scope was captured. Agent delegation is now available from Planner or Agent Team.'
            : 'Warnings approved and write scope captured. Agent delegation is now available from Planner or Agent Team.');
      }
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Approval recording failed.');
    } finally {
      setBusy('');
    }
  }

  async function blockImplementation() {
    setBusy('block');
    setNotice('');
    try {
      await postJson('/api/approvals', {
        assignmentId,
        approvalType: 'block_implementation',
        status: 'blocked',
        notes: 'Implementation blocked until standards findings are resolved.'
      });
      setNotice('Implementation block recorded in the evidence trail.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Block action failed.');
    } finally {
      setBusy('');
    }
  }

  async function preparePrPack() {
    setBusy('pr');
    setNotice('');
    try {
      const result = await postJson('/api/pr/prepare', {
        assignmentId,
        notes: 'Generated from Standards Command Center.'
      });
      setNotice(result.report?.status === 'BLOCKED'
        ? `PR Readiness Pack generated as BLOCKED with ${result.report.blockingItems?.length || 0} item(s) to review.`
        : 'PR Readiness Pack generated for review.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'PR pack generation failed.');
    } finally {
      setBusy('');
    }
  }

  function updateDependencyField(field, value) {
    setDependencyForm((current) => ({ ...current, [field]: value }));
  }

  async function requestDependency() {
    setBusy('dependency-request');
    setNotice('');
    try {
      await postJson('/api/dependencies/request', {
        assignmentId,
        packageName: dependencyForm.packageName,
        version: dependencyForm.version,
        license: dependencyForm.license,
        reason: dependencyForm.reason,
        alternatives: dependencyForm.alternatives,
        notes: 'Dependency install request created from Standards Command Center.'
      });
      setDependencyForm({ packageName: '', version: '', license: 'MIT', reason: '', alternatives: '' });
      setNotice('Dependency request captured. It remains blocked until explicitly approved.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Dependency request failed.');
    } finally {
      setBusy('');
    }
  }

  async function decideDependency(request, decision) {
    setBusy(`${decision}-${request.id}`);
    setNotice('');
    try {
      await postJson(`/api/dependencies/${encodeURIComponent(request.id)}/${decision}`, {
        notes: decision === 'approve'
          ? `Approved package-specific install for ${request.packageName}. Agent contract may install only this approved dependency.`
          : `Rejected dependency request for ${request.packageName}. Agent contract must not install it.`
      });
      setNotice(decision === 'approve'
        ? `${request.packageName} approved for package-specific install.`
        : `${request.packageName} dependency request rejected.`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || `Unable to ${decision} dependency request.`);
    } finally {
      setBusy('');
    }
  }

  const summaryRows = [
    buildStandardsRow('Accessibility', findings, ['accessibility', 'accessibility-detail'], 'WCAG 2.2, VPAT impact, Section 508, keyboard, focus, labels.'),
    buildStandardsRow('Security', findings, ['security', 'frontend-secrets'], 'No frontend secrets, safe errors, validation, audit expectations.'),
    buildStandardsRow('Dependency Policy', findings, ['dependency', 'dependency-license'], 'Explicit approval, MIT/Apache-2.0 preference, no silent installs.'),
    buildStandardsRow('Testing', findings, ['testing', 'coverage'], 'Unit, integration, accessibility, security, negative, boundary, coverage planning.'),
    buildStandardsRow('UX Consistency', findings, ['ux'], 'Oracle Redwood-like clarity, loading, empty, error, success states.'),
    buildStandardsRow('Performance', findings, ['performance', 'maintainability'], 'Latency, limits, timeouts, maintainability, reuse, naming patterns.'),
    buildStandardsRow('Approval Gate', findings, ['approval', 'pr-readiness'], 'Human approval before write/delegate actions and PR readiness evidence.')
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Standards"
        title={`${workBrief.title} Standards Gate`}
        copy={`Review standards evidence for ${workBrief.repoName || 'the selected repository'} before write approval. Checks stay governed, but the findings and decisions should be tied to this task, not a generic dashboard.`}
        actions={(
          <>
            <button className="primary-button" type="button" onClick={runCheck} disabled={Boolean(busy)}>{busy === 'check' ? 'Checking' : 'Run Standards Check'}</button>
            <button className="secondary-button" type="button" onClick={preparePrPack} disabled={Boolean(busy)}>{busy === 'pr' ? 'Preparing' : 'Prepare PR Pack'}</button>
          </>
        )}
      />
      {notice ? <div className="info-banner" role="status">{notice}</div> : null}
      <CurrentWorkBrief data={data} onNavigate={navigate} compact />
      <WorkflowDecisionBar workflow={workflow} onNavigate={navigate} titleCase={titleCase} workflowTone={workflowTone} />
      {completedJiraVerification ? (
        <Panel title="Verification Standards Contract" eyebrow="Completed Jira Gate">
          <div className="verification-lane-panel">
            <div>
              <StatusBadge label={verificationProfile.issueKey || 'Jira Done'} tone="success" />
              <StatusBadge label="No implementation by default" tone="warning" />
              <StatusBadge label={verificationProfile.hasRepoEvidence ? 'Commit evidence detected' : 'Repo evidence needed'} tone={verificationProfile.hasRepoEvidence ? 'success' : 'warning'} />
            </div>
            <p>{verificationProfile.summary} Standards should validate the verification path for this completed work, not approve a stale implementation plan from another task.</p>
            <ActionList
              items={[
                ['Behavior contract', 'Treat Jira Done as implementation-complete until Reviewer finds explicit rework.'],
                ['Update rules', 'No update/API payload work is assumed for this ticket unless current Jira evidence or Reviewer findings say so.'],
                ['Required evidence', 'Reviewer output, build/test command evidence, and PR/release readiness notes.'],
                ['Approval rule', 'Fresh write approval is only needed after Reviewer creates explicit rework.']
              ]}
            />
            <div className="button-row">
              <button className="primary-button" type="button" onClick={() => navigate('team')}>Open Reviewer Lane</button>
              <button className="secondary-button" type="button" onClick={() => navigate('review')}>Record Verification Evidence</button>
            </div>
          </div>
        </Panel>
      ) : null}
      <div className="metric-grid">
        <MetricCard label="Overall Gate" value={effectiveGateStatus} detail={writeApproved ? 'Warnings approved and write scope captured' : 'Latest standards status'} tone={standardsTone(effectiveGateStatus)} />
        <MetricCard label="Findings" value={findings.length || 0} detail="Stored review findings" tone="info" />
        <MetricCard label="Approvals" value={approvals.length || 0} detail="Human decisions captured" tone={approvals.length ? 'success' : 'warning'} />
        <MetricCard label="Dependencies" value={pendingDependencies.length ? `${pendingDependencies.length} Pending` : `${approvedDependencies.length} Approved`} detail={`${rejectedDependencies.length} rejected`} tone={pendingDependencies.length ? 'warning' : approvedDependencies.length ? 'success' : 'neutral'} />
        <MetricCard label="Implementation" value={implementationEvidence.length || 0} detail={failedRecordedTests.length ? `${failedRecordedTests.length} failed test(s)` : 'Evidence records'} tone={failedRecordedTests.length ? 'danger' : implementationEvidence.length ? 'success' : 'warning'} />
        <MetricCard label="PR Packs" value={prReports.length || 0} detail="Readiness reports generated" tone={prReports.length ? 'success' : 'neutral'} />
      </div>
      <div className="two-column wide-left">
        <Panel title="Governance Scorecard" eyebrow="Current Review">
          <SimpleTable
            columns={['Standard', 'Status', 'Evidence']}
            rows={summaryRows.map((row) => [
              row.label,
              <StatusBadge label={row.status} tone={standardsTone(row.status)} />,
              row.detail
            ])}
          />
        </Panel>
        <Panel title="Policy Flexibility" eyebrow="Controlled Overrides">
          <InfoList
            items={[
              ['Theme / UX text', flexibility?.themeAndUxCanBeOverridden ? 'Override allowed' : 'Configured'],
              ['Warnings', flexibility?.nonCriticalWarningsCanBeApprovedWithNotes ? 'Approve with notes' : 'Resolve only'],
              ['Blockers', hardSafetyBlockers.length ? `${hardSafetyBlockers.length} hard safety blocker(s)` : reviewedBlockers.length ? gate.blockerOverride ? 'Reviewed override captured' : 'Review or override required' : 'None open'],
              ['Review decision', gate.implementationBlocked ? 'Implementation blocked' : 'No active block'],
              ['Standards version', data.standards?.registry?.standardsVersion || 'odt-baseline-1.0'],
              ['Policy source', standardsConfigSource?.path || 'server/standards/odt-standards.json'],
              ['Source documents', standardsSources.length || 0],
              ['Customization path', 'Config now, Admin UI later']
            ]}
          />
          <p className="muted-copy">Teams can tune standards through the standards registry and source documents, then rerun Standards Check. Policy changes should be versioned, reviewed, and auditable; hard safety blockers still require code/policy changes, not casual overrides.</p>
          <label className="field" htmlFor="standards-approval-notes">
            <span>Approval or override notes</span>
            <textarea
              id="standards-approval-notes"
              className="notes-input"
              value={approvalNotes}
              onChange={(event) => setApprovalNotes(event.target.value)}
              placeholder="Explain why the warning or blocker is accepted, what risk remains, and how the developer will verify it."
            />
          </label>
          <div className="button-row vertical">
            <button type="button" className="secondary-button" onClick={updatePlan} disabled={Boolean(busy)}>{busy === 'plan' ? 'Updating' : completedJiraVerification ? 'Update Verification Plan' : 'Update Plan'}</button>
            <button
              type="button"
              className="secondary-button"
              onClick={approveWarnings}
              disabled={approvalActionDisabled}
              title={
                writeApproved
                  ? 'Write approval has already been captured for the latest standards review.'
                  : latestCheck
                    ? approvalBlockedByDecision
                      ? 'Record a newer human approval to clear the current implementation block.'
                      : 'Record human review and unlock approved delegation.'
                    : 'Run a standards check before approving or overriding findings.'
              }
            >
              {busy === 'approve' ? 'Recording' : approvalActionLabel}
            </button>
            <button type="button" className="secondary-button danger-action" onClick={blockImplementation} disabled={Boolean(busy)}>{busy === 'block' ? 'Blocking' : 'Block Implementation'}</button>
          </div>
        </Panel>
      </div>
      <Panel title="Findings Ledger" eyebrow="Review Evidence">
        <SimpleTable
          columns={['Category', 'Status', 'Finding', 'Required Action', 'Resolution']}
          rows={findings.map((finding) => [
            titleCase(finding.category),
            <StatusBadge label={finding.status} tone={standardsTone(finding.status)} />,
            finding.message,
            finding.recommendation,
            finding.status === 'BLOCKER'
              ? isHardSafetyBlocker(finding)
                ? <StatusBadge label="Hard Safety Block" tone="danger" />
                : <StatusBadge label={gate.blockerOverride ? 'Reviewed Override' : 'Open'} tone={gate.blockerOverride ? 'success' : 'danger'} />
              : finding.status === 'WARNING' || finding.status === 'APPROVAL_REQUIRED'
                ? <StatusBadge label={gate.warningOverride || writeApproved ? 'Accepted' : 'Review'} tone={gate.warningOverride || writeApproved ? 'success' : 'warning'} />
                : <StatusBadge label="Clear" tone="success" />
          ])}
          empty="No standards findings yet. Run a standards check to create the first review record."
        />
      </Panel>
      <Panel title="Dependency Approval Lane" eyebrow="3PL Control">
        <div className="dependency-lane">
          <div className="form-grid compact-form">
            <label className="field" htmlFor="dependency-package">
              <span>Package name</span>
              <input
                id="dependency-package"
                value={dependencyForm.packageName}
                onChange={(event) => updateDependencyField('packageName', event.target.value)}
                placeholder="example: zod"
              />
            </label>
            <label className="field" htmlFor="dependency-version">
              <span>Version or range</span>
              <input
                id="dependency-version"
                value={dependencyForm.version}
                onChange={(event) => updateDependencyField('version', event.target.value)}
                placeholder="example: ^3.23.0"
              />
            </label>
            <label className="field" htmlFor="dependency-license">
              <span>License</span>
              <select
                id="dependency-license"
                value={dependencyForm.license}
                onChange={(event) => updateDependencyField('license', event.target.value)}
              >
                <option value="MIT">MIT</option>
                <option value="Apache-2.0">Apache-2.0</option>
                <option value="BSD">BSD</option>
                <option value="UNKNOWN">UNKNOWN</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>
          <label className="field" htmlFor="dependency-reason">
            <span>Reason and expected usage</span>
            <textarea
              id="dependency-reason"
              className="notes-input"
              value={dependencyForm.reason}
              onChange={(event) => updateDependencyField('reason', event.target.value)}
              placeholder="Explain why this package is needed, where it will be used, and why existing repo utilities are not enough."
            />
          </label>
          <label className="field" htmlFor="dependency-alternatives">
            <span>Alternatives considered</span>
            <textarea
              id="dependency-alternatives"
              className="notes-input"
              value={dependencyForm.alternatives}
              onChange={(event) => updateDependencyField('alternatives', event.target.value)}
              placeholder="List no-new-dependency option, existing package option, or smaller alternative."
            />
          </label>
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              onClick={requestDependency}
              disabled={Boolean(busy) || !dependencyForm.packageName.trim() || !dependencyForm.reason.trim()}
            >
              {busy === 'dependency-request' ? 'Requesting' : 'Request Dependency Approval'}
            </button>
            <StatusBadge
              label={approvedDependencies.length ? 'Approved installs available' : 'Installs blocked'}
              tone={approvedDependencies.length ? 'success' : 'warning'}
            />
          </div>
        </div>
        <SimpleTable
          columns={['Package', 'License', 'Reason', 'Status', 'Decision']}
          rows={dependencies.map((request) => [
            `${request.packageName}${request.version ? ` ${request.version}` : ''}`,
            request.license || 'UNKNOWN',
            request.reason,
            <StatusBadge label={titleCase(request.status)} tone={request.status === 'approved' ? 'success' : request.status === 'pending' ? 'warning' : 'danger'} />,
            request.status === 'pending' ? (
              <div className="button-row compact-buttons">
                <button className="table-button" type="button" onClick={() => decideDependency(request, 'approve')} disabled={Boolean(busy)}>
                  {busy === `approve-${request.id}` ? 'Approving' : 'Approve'}
                </button>
                <button className="table-button danger-action" type="button" onClick={() => decideDependency(request, 'reject')} disabled={Boolean(busy)}>
                  {busy === `reject-${request.id}` ? 'Rejecting' : 'Reject'}
                </button>
              </div>
            ) : request.approvedBy || request.notes || 'Decision recorded'
          ])}
          empty="No dependency requests yet. Request approval before any package install."
        />
      </Panel>
      <div className="two-column">
        <Panel title="Evidence Trail" eyebrow="Audit">
          <Timeline
            events={[
              ...approvals.slice(0, 4).map((approval) => ({
                title: titleCase(approval.approvalType),
                detail: `${titleCase(approval.status)} by ${approval.approvedBy || 'local-user'}${approval.notes ? `: ${approval.notes}` : ''}`,
                createdAt: approval.approvedAt,
                status: approval.status
              })),
              ...dependencies.slice(0, 3).map((request) => ({
                title: `Dependency ${request.packageName}`,
                detail: `${titleCase(request.status)} - ${request.license || 'UNKNOWN'} - ${request.reason}`,
                createdAt: request.requestedAt,
                status: request.status
              }))
            ]}
            empty="No approval or dependency evidence yet."
            toneFor={standardsTone}
          />
        </Panel>
        <Panel title="PR Readiness Pack" eyebrow="Before PR">
          <ActionList
            items={[
              ['Acceptance Mapping', 'Map requirements and Jira criteria to implementation and tests.'],
              ['Implementation Evidence', 'Record changed files, commands, and test outcomes before PR-ready status.'],
              ['Accessibility Notes', 'Capture WCAG/VPAT/Section 508 impact and manual review needs.'],
              ['Security Notes', 'Confirm no frontend secrets, unsafe logs, or unapproved tool actions.'],
              ['Risk and Rollback', 'Document known risks, skipped tests, and rollback path.']
            ]}
          />
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => navigate('pr')}>Open PR Ready</button>
            <button className="secondary-button" type="button" onClick={() => navigate('artifacts')}>Open Artifacts</button>
            <button className="secondary-button" type="button" onClick={() => navigate('runs')}>Open Runs</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function standardsTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('block')) return 'danger';
  if (text.includes('warning') || text.includes('approval') || text.includes('review') || text.includes('required')) return 'warning';
  if (text.includes('pass') || text.includes('approved') || text.includes('ready') || text.includes('decided') || text.includes('accepted') || text.includes('resolved')) return 'success';
  return 'neutral';
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

function buildStandardsRow(label, findings, categories, fallbackDetail) {
  const matches = findings.filter((finding) => categories.includes(finding.category));
  const status = matches.some((finding) => finding.status === 'BLOCKER')
    ? 'BLOCKER'
    : matches.some((finding) => finding.status === 'APPROVAL_REQUIRED')
      ? 'APPROVAL_REQUIRED'
      : matches.some((finding) => finding.status === 'NEEDS_REVIEW')
        ? 'NEEDS_REVIEW'
        : matches.some((finding) => finding.status === 'WARNING')
          ? 'WARNING'
          : matches.some((finding) => finding.status === 'PASS')
            ? 'PASS'
            : 'NOT_RUN';
  const detail = matches.length
    ? matches.map((finding) => finding.message).join(' ')
    : fallbackDetail;
  return { label, status, detail };
}
