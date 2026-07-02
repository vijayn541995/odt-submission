import React, { useEffect, useRef, useState } from 'react';
import {
  activeAssignmentId,
  activeWorkKey,
  currentEvidenceItems,
  latestRepoAnalysisFromData
} from '@odt/domain';
import {
  ActionList,
  JsonBlock,
  PageHeader,
  SimpleTable,
  StatusBadge
} from '../../primitives/index.js';
import { formatBytes, titleCase } from '../../utils/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`IntakePage requires ${name}`);
  }
  return value;
}

export function IntakePage({
  data,
  setActivePage,
  actions = {},
  helpers = {}
}) {
  const postJson = requireDependency(actions.postJson, 'actions.postJson');
  const fileToBase64 = requireDependency(helpers.fileToBase64, 'helpers.fileToBase64');
  const analyzeBrowserRepoFolder = requireDependency(helpers.analyzeBrowserRepoFolder, 'helpers.analyzeBrowserRepoFolder');
  const assetFileUrl = requireDependency(helpers.assetFileUrl, 'helpers.assetFileUrl');
  const assetRoleLabel = requireDependency(helpers.assetRoleLabel, 'helpers.assetRoleLabel');
  const assetExtractionLabel = requireDependency(helpers.assetExtractionLabel, 'helpers.assetExtractionLabel');
  const assetExtractionTone = requireDependency(helpers.assetExtractionTone, 'helpers.assetExtractionTone');
  const assetAiEnrichmentLabel = requireDependency(helpers.assetAiEnrichmentLabel, 'helpers.assetAiEnrichmentLabel');
  const assetAiEnrichmentTone = requireDependency(helpers.assetAiEnrichmentTone, 'helpers.assetAiEnrichmentTone');
  const navigate = requireDependency(setActivePage, 'setActivePage');

  const assignmentId = activeAssignmentId(data);
  const currentWorkKey = activeWorkKey(data);
  const [text, setText] = useState('');
  const activeSnapshotAssignment = data.snapshot?.assignments?.find((assignment) => assignment.id === assignmentId)
    || data.snapshot?.assignments?.find((assignment) => assignment.isActive)
    || null;
  const [repoPath, setRepoPath] = useState(data.evidence?.assignment?.repoPath || activeSnapshotAssignment?.repoPath || '');
  const [baseBranch, setBaseBranch] = useState('main');
  const [workScope, setWorkScope] = useState('full-stack');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [repoResult, setRepoResult] = useState(null);
  const [browserRepoAnalysis, setBrowserRepoAnalysis] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [jiraIssueKey, setJiraIssueKey] = useState(currentWorkKey);
  const [jiraImportResult, setJiraImportResult] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const lastAssignmentRef = useRef(assignmentId);
  const policy = data.uploadPolicy?.uploadPolicy || data.snapshot?.intake?.uploadPolicy || {};
  const storedAssets = currentEvidenceItems(data.evidence, 'intakeAssets');
  const currentWorkbenchRepo = data.evidence?.assignment?.repoPath || activeSnapshotAssignment?.repoPath || '';

  useEffect(() => {
    if (lastAssignmentRef.current === assignmentId) return;
    lastAssignmentRef.current = assignmentId;
    setRepoPath(currentWorkbenchRepo || '');
    setJiraIssueKey(currentWorkKey || '');
    setResult(null);
    setRepoResult(null);
    setBrowserRepoAnalysis(null);
    setJiraImportResult(null);
    setNotice('');
  }, [assignmentId, currentWorkbenchRepo, currentWorkKey]);

  const clarificationItems = result?.requirementAnalysis?.clarifyingQuestions?.length
    ? result.requirementAnalysis.clarifyingQuestions.map((item) => [
        item.severity || 'Review',
        `${item.question}${item.defaultAssumption ? ` Default: ${item.defaultAssumption}` : ''}`
      ])
    : [
        ['Requirement behavior', 'Should the action be synchronous or asynchronous? What happens on partial failure?'],
        ['Roles and audit', 'Which roles can perform this action, and is audit history required?'],
        ['UI states', 'What should loading, empty, validation, success, warning, and error states say?'],
        ['Compliance', 'Does this feature affect VPAT/WCAG/Section 508 reporting, security review, or dependency approval?']
      ];

  useEffect(() => {
    if (!repoPath.trim() && currentWorkbenchRepo) {
      setRepoPath(currentWorkbenchRepo);
    }
  }, [currentWorkbenchRepo, repoPath]);

  useEffect(() => {
    if (!currentWorkKey) return;
    setJiraIssueKey((current) => current || currentWorkKey);
  }, [currentWorkKey]);

  async function extract() {
    setBusy('extract');
    setNotice('');
    try {
      const input = text || 'Build ODT Workbench v1 with AI governance.';
      const analysisResponse = await postJson('/api/intake/analyze', {
        input,
        repoPath: repoPath.trim() || currentWorkbenchRepo,
        createNewAssignment: true,
        sourceType: 'manual'
      });
      const structureResponse = await postJson('/api/ai/extract-json', {
        assignmentId: analysisResponse.assignmentId || assignmentId,
        input
      });
      setResult({
        requirementAnalysis: analysisResponse.analysis,
        extractedStructure: structureResponse.content
      });
      setNotice('Requirement structure and gap analysis were stored as evidence.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to analyze intake.');
    } finally {
      setBusy('');
    }
  }

  async function importJiraIssue() {
    setBusy('jira-import');
    setNotice('');
    try {
      const effectiveRepoPath = repoPath.trim() || currentWorkbenchRepo;
      const response = await postJson('/api/intake/import-jira', {
        issueKey: jiraIssueKey,
        repoPath: effectiveRepoPath,
        createNewAssignment: true
      });
      setJiraImportResult(response);
      setText(response.importedText || '');
      setResult((current) => ({
        ...(current || {}),
        requirementAnalysis: response.analysis,
        jiraImport: {
          issue: response.issue,
          workState: response.workState,
          repoSignals: response.repoSignals
        }
      }));
      const state = response.workState?.state === 'completed'
        ? 'ODT identified this as completed Jira work. Continue with repo verification and evidence capture.'
        : 'ODT imported this as active Jira work. Continue with repo analysis and planning.';
      setNotice(`${response.issue?.key || jiraIssueKey}: ${state}`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to import Jira issue.');
    } finally {
      setBusy('');
    }
  }

  async function analyzeRepo() {
    setBusy('repo');
    setNotice('');
    try {
      const response = await postJson('/api/repo/analyze', {
        assignmentId,
        repoPath,
        browserAnalysis: browserRepoAnalysis
      });
      setRepoResult(response.analysis);
      setNotice('Repository analyzed in read-only mode. Target files were not modified.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to analyze repository.');
    } finally {
      setBusy('');
    }
  }

  async function chooseRepoFolder() {
    setBusy('folder');
    setNotice('');
    try {
      if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
        const directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
        const analysis = await analyzeBrowserRepoFolder(directoryHandle);
        setBrowserRepoAnalysis(analysis);
        setRepoPath(`Browser folder: ${analysis.folderName}`);
        setRepoResult(analysis);
        setNotice(`Folder "${analysis.folderName}" selected. ODT inspected the folder metadata you allowed. Chrome hides the full Mac path, so paste the absolute path only if backend scanning or commands are needed.`);
        return;
      }

      const response = await postJson('/api/repo/select-folder');
      setBrowserRepoAnalysis(null);
      setRepoPath(response.repoPath || '');
      setNotice('Repository folder selected. Run read-only analysis when you are ready.');
    } catch (err) {
      setNotice(err.message || 'Folder selection is unavailable. Paste the repository path manually.');
    } finally {
      setBusy('');
    }
  }

  async function uploadFiles() {
    setBusy('upload');
    setNotice('');
    try {
      if (!selectedFiles.length) {
        setNotice('Choose one or more context files before uploading.');
        return;
      }
      const files = await Promise.all(selectedFiles.map(fileToBase64));
      const response = await postJson('/api/intake/assets', {
        assignmentId,
        sourceKind: 'intake-context',
        files
      });
      setUploadResult(response);
      setSelectedFiles([]);
      const enrichmentPending = response.stored.filter((asset) => asset.analysisJson?.aiEnrichment?.recommended).length;
      setNotice(`${response.stored.length} context file(s) copied and analyzed into the ODT workspace. ${enrichmentPending ? `${enrichmentPending} file(s) can use optional AI/parser enrichment later with local fallback.` : 'Local extraction/metadata is enough for these files.'} The target repo was not modified.`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Upload failed.');
    } finally {
      setBusy('');
    }
  }

  async function enrichAsset(asset) {
    setBusy(`enrich:${asset.id}`);
    setNotice('');
    try {
      const response = await postJson(`/api/intake/assets/${asset.id}/enrich`, {
        assignmentId
      });
      setUploadResult((current) => ({ ...(current || {}), latestEnrichment: response }));
      setNotice(`${asset.originalName}: ${titleCase(response.status)}. ${response.nextAction}`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to check asset enrichment.');
    } finally {
      setBusy('');
    }
  }

  async function generatePlan() {
    setBusy('plan');
    setNotice('');
    try {
      let workingAssignmentId = assignmentId;
      if (text.trim()) {
        const analysisResponse = await postJson('/api/intake/analyze', {
          input: text,
          repoPath: repoPath.trim() || currentWorkbenchRepo,
          createNewAssignment: true,
          sourceType: 'manual'
        });
        workingAssignmentId = analysisResponse.assignmentId || workingAssignmentId;
      }
      if (repoPath.trim()) {
        await postJson('/api/repo/analyze', {
          assignmentId: workingAssignmentId,
          repoPath,
          browserAnalysis: browserRepoAnalysis
        });
      }
      const design = await postJson('/api/design/draft', { assignmentId: workingAssignmentId });
      const plan = await postJson('/api/plan/draft', { assignmentId: workingAssignmentId, design: design.design });
      await postJson('/api/standards/check', {
        assignmentId: workingAssignmentId,
        phase: 'pre-implementation',
        artifact: {
          requirement: text,
          repoPath,
          baseBranch,
          workScope,
          intakeAssets: storedAssets.map((asset) => asset.originalName),
          intakeAssetEvidence: storedAssets.map((asset) => ({
            name: asset.originalName,
            fileType: asset.fileType,
            role: asset.analysisJson?.role || assetRoleLabel(asset),
            extractionStatus: asset.analysisJson?.localExtraction?.status || 'not_analyzed',
            aiEnrichmentStatus: asset.analysisJson?.aiEnrichment?.status || 'not_required',
            localExcerpt: asset.analysisJson?.localExtraction?.excerpt || ''
          })),
          plan: plan.plan
        }
      });
      setNotice('Design, implementation plan, and standards review were drafted. Opening Planner.');
      await data.refresh();
      navigate('planner');
    } catch (err) {
      setNotice(err.message || 'Unable to generate plan.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Intake"
        title="Capture requirement, Jira, and repo context"
        copy="ODT should not jump directly to coding. It first understands the work, analyzes the repository, identifies gaps, asks clarification questions, and drafts the design and test strategy."
      />
      {notice ? <div className="info-banner" role="status">{notice}</div> : null}
      <div className="intake-journey" aria-label="Intake workflow">
        <IntakeStep
          number="1"
          eyebrow="Start Workspace"
          title="Project workspace"
          copy="Choose the target repository or project folder first. ODT uses this context in read-only mode until write approval is captured."
        >
          <div className="form-grid intake-repo-form">
            <label className="field">
              <span>Repository or project folder</span>
              <div className="field-with-action">
                <input
                  value={repoPath}
                  onChange={(event) => {
                    setRepoPath(event.target.value);
                    setBrowserRepoAnalysis(null);
                  }}
                  placeholder="/Users/vn105957/Desktop/my-project"
                  aria-label="Selected repository or project folder path"
                />
                <button className="secondary-button" type="button" onClick={chooseRepoFolder} disabled={Boolean(busy)}>
                  {busy === 'folder' ? 'Choosing' : 'Choose Folder'}
                </button>
              </div>
            </label>
            <label className="field compact">
              <span>Base branch</span>
              <input value={baseBranch} onChange={(event) => setBaseBranch(event.target.value)} placeholder="main" />
            </label>
            <label className="field compact">
              <span>Scope</span>
              <select value={workScope} onChange={(event) => setWorkScope(event.target.value)}>
                <option value="full-stack">Full-stack</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="docs">Documentation</option>
              </select>
            </label>
          </div>
          <p className="muted-copy">Choose Folder opens the browser folder picker and analyzes visible repo metadata in read-only mode. Chrome hides the full local path, so the field stays editable for pasted paths when backend scanning or commands are needed. Writes still require human approval.</p>
          <div className="button-row">
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setBrowserRepoAnalysis(null);
                setRepoPath(data.snapshot?.assignments?.[0]?.repoPath || repoPath);
              }}
            >
              Use Current Workbench
            </button>
            <button className="secondary-button" type="button" onClick={analyzeRepo} disabled={busy === 'repo' || !repoPath.trim()}>{busy === 'repo' ? 'Analyzing Repo' : 'Analyze Repo Read-only'}</button>
          </div>
        </IntakeStep>

        <IntakeStep
          number="2"
          eyebrow="Requirement Input"
          title="Work request"
          copy="Paste the Jira story, requirement, acceptance criteria, API notes, constraints, and expected validation."
        >
          <div className="jira-import-panel">
            <div>
              <span className="eyebrow">Jira Connector</span>
              <strong>Import ticket and detect current work state</strong>
              <p>ODT reads safe Jira fields, classifies Done/active status, and uses the repo path only for read-only Jira-key evidence checks.</p>
            </div>
            <div className="connector-query-row">
              <input
                type="text"
                value={jiraIssueKey}
                onChange={(event) => setJiraIssueKey(event.target.value)}
                placeholder={currentWorkKey || 'PROJECT-12345'}
                aria-label="Jira issue key to import"
              />
              <button className="secondary-button" type="button" onClick={importJiraIssue} disabled={Boolean(busy) || !jiraIssueKey.trim()}>
                {busy === 'jira-import' ? 'Importing' : 'Import Jira'}
              </button>
            </div>
            {jiraImportResult ? (
              <div className="jira-import-result">
                <StatusBadge
                  label={jiraImportResult.workState?.label || 'Jira Imported'}
                  tone={jiraImportResult.workState?.state === 'completed' ? 'success' : 'warning'}
                />
                <StatusBadge
                  label={jiraImportResult.workState?.recommendedMode || 'review'}
                  tone="info"
                />
                <StatusBadge
                  label={titleCase(jiraImportResult.repoSignals?.status || 'repo not checked')}
                  tone={jiraImportResult.repoSignals?.status === 'ticket_reference_found' ? 'success' : 'neutral'}
                />
                <p>{jiraImportResult.issue?.key}: {jiraImportResult.issue?.summary} ({jiraImportResult.issue?.status})</p>
                <p>{jiraImportResult.workState?.nextAction}</p>
                <p className="muted-copy">{jiraImportResult.repoSignals?.summary}</p>
              </div>
            ) : null}
          </div>
          <label className="field" htmlFor="work-request-input">
            <span>Requirement, Jira details, acceptance criteria, constraints, and expectations</span>
            <textarea
              id="work-request-input"
              className="large-input intake-request-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="What do you want to build or change? Include Jira details, target repo path, branch, acceptance criteria, API samples, screenshots, accessibility/security/performance expectations, and any known frontend/backend scope."
            />
          </label>
          <div className="chip-row">
            {['Requirement', 'Repo Path', 'Jira', 'Frontend', 'Backend', 'Accessibility', 'Security', 'Testing', '3PL'].map((chip) => <span className="chip" key={chip}>{chip}</span>)}
          </div>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={extract} disabled={Boolean(busy)}>{busy === 'extract' ? 'Analyzing' : 'Extract Structure'}</button>
            <button className="secondary-button" type="button" onClick={generatePlan} disabled={Boolean(busy)}>{busy === 'plan' ? 'Generating Plan' : 'Generate Plan'}</button>
          </div>
        </IntakeStep>

        <IntakeStep
          number="3"
          eyebrow="Attachments"
          title="Context files"
          copy="Attach supporting mockups, screenshots, documents, spreadsheets, API samples, logs, or notes. ODT copies them into workspace storage as evidence."
        >
          <div className="upload-policy">
            <StatusBadge label={`Max ${policy.maxFilesPerRequest || 10} files`} tone="info" />
            <StatusBadge label={`${formatBytes(policy.maxFileBytes)} per file`} tone="info" />
            <StatusBadge label={`${formatBytes(policy.maxBatchBytes)} per batch`} tone="info" />
          </div>
          <label className="field">
            <span>Mockups, screenshots, documents, spreadsheets, API samples, or notes</span>
            <input
              className="file-input"
              type="file"
              multiple
              accept={(policy.allowedExtensions || []).join(',')}
              onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
            />
          </label>
          <p className="muted-copy">Allowed: {(policy.allowedExtensions || []).join(', ') || 'PNG, PDF, DOCX, XLSX, CSV, JSON, YAML, Markdown, and text files'}. Files are copied into ODT workspace storage, not into the selected repo.</p>
          <div className="intake-subsection">
            <div className="section-heading">
              <strong>Selected files</strong>
              <span className="muted-copy">Review the local selection before copying files into the ODT workspace.</span>
            </div>
            <SimpleTable
              columns={['Selected File', 'Size', 'Type']}
              rows={selectedFiles.map((file) => [file.name, formatBytes(file.size), file.type || 'unknown'])}
              empty="No files selected yet."
            />
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={uploadFiles} disabled={busy === 'upload' || !selectedFiles.length}>{busy === 'upload' ? 'Copying Files' : 'Copy to ODT Workspace'}</button>
            </div>
          </div>
          <div className="intake-subsection">
            <div className="section-heading">
              <strong>Stored context evidence</strong>
              <span className="muted-copy">Copied files and enrichment status appear here for review and agent handoff.</span>
            </div>
            <SimpleTable
              columns={['File', 'Context Role', 'Extraction', 'AI/Parser', 'Size', 'Actions']}
              rows={storedAssets.map((asset) => [
                asset.originalName,
                assetRoleLabel(asset),
                <StatusBadge label={assetExtractionLabel(asset)} tone={assetExtractionTone(asset)} />,
                <StatusBadge label={assetAiEnrichmentLabel(asset)} tone={assetAiEnrichmentTone(asset)} />,
                formatBytes(asset.bytes),
                <div className="button-row">
                  <a className="table-button" href={assetFileUrl(asset.id)} target="_blank" rel="noreferrer">Open File</a>
                  <button className="table-button" type="button" onClick={() => enrichAsset(asset)} disabled={busy === `enrich:${asset.id}`}>
                    {busy === `enrich:${asset.id}` ? 'Checking' : 'Check Enrichment'}
                  </button>
                </div>
              ])}
              empty="No context files copied yet."
            />
            {uploadResult?.workspacePath ? <p className="muted-copy">Workspace copy: {uploadResult.workspacePath}</p> : null}
            {uploadResult?.latestEnrichment ? <JsonBlock value={uploadResult.latestEnrichment} /> : null}
          </div>
        </IntakeStep>

        <IntakeStep
          number="4"
          eyebrow="Read-only Analysis"
          title="Repository signals"
          copy="ODT summarizes framework, package manager, scripts, tests, folder structure, patterns, and likely impacted areas without modifying the repo."
        >
          <JsonBlock value={repoResult || (Object.keys(latestRepoAnalysisFromData(data)).length ? latestRepoAnalysisFromData(data) : {
            status: 'waiting',
            message: 'Detected framework, package manager, scripts, test tools, folder structure, patterns, and likely impacted files will appear here.'
          })} />
        </IntakeStep>

        <IntakeStep
          number="5"
          eyebrow="AI Suggestion"
          title="Extracted structure"
          copy="After extraction, ODT shows structured scope, risks, dependencies, acceptance criteria, and clarification gaps for human review."
        >
          <JsonBlock value={result || {
            status: 'waiting',
            message: 'Extracted scope, risks, dependencies, and acceptance criteria will appear here.'
          }} />
        </IntakeStep>

        <IntakeStep
          number="6"
          eyebrow="Gap Analysis"
          title="Clarification prompts"
          copy="Use these as quality checks before planning or delegating work."
        >
          <ActionList items={clarificationItems} />
        </IntakeStep>
      </div>
    </div>
  );
}

function IntakeStep({ number, eyebrow, title, copy, children }) {
  return (
    <section className="intake-step">
      <div className="intake-step-head">
        <span className="intake-step-number">{number}</span>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
          {copy ? <p>{copy}</p> : null}
        </div>
      </div>
      <div className="intake-step-body">
        {children}
      </div>
    </section>
  );
}
