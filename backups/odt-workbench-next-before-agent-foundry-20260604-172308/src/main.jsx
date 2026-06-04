import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HumanGateIcon, OdtLogo, RefreshIcon, SidebarIcons } from './components/sidebar/SidebarIcons.jsx';
import './styles.css';

const API_BASE = import.meta.env.VITE_ODT_WORKBENCH_API_BASE || 'http://127.0.0.1:5190';

const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'intake', label: 'Intake' },
  { id: 'planner', label: 'Planner' },
  { id: 'standards', label: 'Standards' },
  { id: 'team', label: 'Agent Team' },
  { id: 'review', label: 'Review' },
  { id: 'pr', label: 'PR Ready' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'guide', label: 'ODT Guide' },
  { id: 'runs', label: 'Runs' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'settings', label: 'Settings' }
];

const teamRoles = [
  { name: 'Lead Planner', status: 'Ready', scope: 'Draft plan, risks, task split', mode: 'Read + plan' },
  { name: 'Backend Dev', status: 'Waiting', scope: 'APIs, SQLite, OpenAPI', mode: 'Approved writes only' },
  { name: 'Frontend Dev', status: 'Waiting', scope: 'React workbench surfaces', mode: 'Approved writes only' },
  { name: 'Reviewer', status: 'Waiting', scope: 'Risk, tests, security, UX', mode: 'Read-only' },
  { name: 'Build Verifier', status: 'Waiting', scope: 'Build, smoke checks, evidence', mode: 'Read-only commands' }
];

const qualityGates = [
  'Plan approved',
  'Write scope approved',
  'Usage logged',
  'Tests passed',
  'Human review complete'
];

const executionAgents = [
  {
    id: 'codex',
    name: 'Codex',
    label: 'Codex implementation agent',
    detail: 'Best for repo-aware code changes, tests, verification, and PR-ready engineering summaries.'
  },
  {
    id: 'cline',
    name: 'Cline',
    label: 'Cline IDE agent',
    detail: 'Best for developer-supervised IDE workflows where the user wants Cline to execute the handoff.'
  },
  {
    id: 'manual',
    name: 'Manual',
    label: 'Manual handoff',
    detail: 'Use when ODT should prepare the plan and handoff, but a human will execute outside the workbench.'
  }
];

function App() {
  const [activePage, setActivePage] = useState('overview');
  const workbench = useWorkbenchData();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [activePage]);

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-shell">
        <TopHeader data={workbench} onRefresh={workbench.refresh} />
        <PageRouter activePage={activePage} setActivePage={setActivePage} data={workbench} />
      </main>
    </div>
  );
}

function useWorkbenchData() {
  const [snapshot, setSnapshot] = useState(null);
  const [settings, setSettings] = useState(null);
  const [usage, setUsage] = useState({ summary: {}, events: [] });
  const [runs, setRuns] = useState([]);
  const [runEvents, setRunEvents] = useState([]);
  const [standards, setStandards] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [uploadPolicy, setUploadPolicy] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const [snapshotResult, settingsResult, usageResult, runsResult, standardsResult, evidenceResult, uploadPolicyResult] = await Promise.all([
        getJson('/api/snapshot'),
        getJson('/api/settings'),
        getJson('/api/monitoring/ai-usage'),
        getJson('/api/runs'),
        getJson('/api/standards'),
        getJson('/api/assignments/assignment-local-mvp/evidence'),
        getJson('/api/intake/upload-policy')
      ]);
      setSnapshot(snapshotResult);
      setSettings(settingsResult);
      setUsage(usageResult);
      setRuns(runsResult.runs || []);
      setStandards(standardsResult);
      setEvidence(evidenceResult);
      setUploadPolicy(uploadPolicyResult);
      setSelectedRunId((current) => current || runsResult.runs?.[0]?.id || '');
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to reach workbench backend.');
    } finally {
      setLoading(false);
    }
  }

  async function loadRunEvents(runId) {
    if (!runId) {
      setRunEvents([]);
      return;
    }
    const result = await getJson(`/api/runs/${encodeURIComponent(runId)}/events`);
    setRunEvents(result.events || []);
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 12000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    loadRunEvents(selectedRunId).catch(() => setRunEvents([]));
  }, [selectedRunId]);

  return {
    snapshot,
    settings,
    usage,
    runs,
    runEvents,
    standards,
    evidence,
    uploadPolicy,
    selectedRunId,
    setSelectedRunId,
    loading,
    error,
    refresh
  };
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function postJson(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || `${path} returned ${response.status}`);
  return data;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea fallback for restricted clipboard contexts.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
}

function assetFileUrl(assetId) {
  return `${API_BASE}/api/intake/assets/${encodeURIComponent(assetId)}/file`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve({
        name: file.name,
        mimeType: file.type,
        size: file.size,
        contentBase64: result.includes(',') ? result.split(',')[1] : result
      });
    };
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function analyzeBrowserRepoFolder(directoryHandle) {
  const topLevelEntries = [];
  const filePaths = [];
  const likelyFolders = [];
  let packageJson = null;
  let fileCount = 0;
  const maxFiles = 500;
  const ignoredFolders = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.vite', 'target']);

  async function walk(handle, prefix = '', depth = 0) {
    if (fileCount >= maxFiles || depth > 4) return;
    for await (const [name, entry] of handle.entries()) {
      const relativePath = prefix ? `${prefix}/${name}` : name;
      if (!prefix) topLevelEntries.push(name);

      if (entry.kind === 'directory') {
        if (ignoredFolders.has(name)) continue;
        if (!prefix && ['src', 'server', 'docs', 'tests', 'test', 'components', 'pages', 'api'].includes(name)) {
          likelyFolders.push(name);
        }
        await walk(entry, relativePath, depth + 1);
      } else {
        fileCount += 1;
        if (filePaths.length < 80) filePaths.push(relativePath);
        if (relativePath === 'package.json') {
          try {
            packageJson = JSON.parse(await (await entry.getFile()).text());
          } catch {
            packageJson = null;
          }
        }
      }

      if (fileCount >= maxFiles) break;
    }
  }

  await walk(directoryHandle);
  const deps = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {})
  };
  const depNames = Object.keys(deps);
  const hasDep = (name) => depNames.includes(name);
  const hasFile = (name) => topLevelEntries.includes(name) || filePaths.some((path) => path.endsWith(`/${name}`) || path === name);
  const frameworks = [];
  if (hasDep('react') || hasFile('vite.config.js')) frameworks.push('React');
  if (hasDep('vite') || hasFile('vite.config.js')) frameworks.push('Vite');
  if (topLevelEntries.includes('server')) frameworks.push('Node backend folder');
  if (hasDep('express')) frameworks.push('Express');

  const testFrameworks = [];
  if (hasDep('vitest')) testFrameworks.push('Vitest');
  if (hasDep('jest')) testFrameworks.push('Jest');
  if (hasDep('@testing-library/react')) testFrameworks.push('Testing Library');
  if (hasDep('playwright')) testFrameworks.push('Playwright');

  return {
    folderName: directoryHandle.name,
    repoPath: `browser-selected:${directoryHandle.name}`,
    exists: true,
    selectionMode: 'browser-folder-picker',
    packageManager: hasFile('package-lock.json') ? 'npm' : hasFile('pnpm-lock.yaml') ? 'pnpm' : hasFile('yarn.lock') ? 'yarn' : 'unknown',
    frameworks: frameworks.length ? frameworks : ['Detected from selected folder'],
    testFrameworks,
    scripts: packageJson?.scripts || {},
    topLevelEntries,
    likelyFolders,
    dependencyCount: depNames.length,
    fileCount,
    sampledFiles: filePaths,
    architecturePattern: frameworks.includes('React') ? 'React feature pages with backend API service boundary' : 'Detected from browser-selected folder files',
    validationPattern: 'Use existing backend validation and safe frontend form validation before adding dependencies.',
    errorHandlingPattern: 'Prefer user-safe errors, retry/fallback messages, and audit events.',
    namingConvention: 'Follow repository file and component naming before introducing new patterns.',
    likelyImpactedFiles: filePaths.filter((path) => /^(src|server|tests|docs)\//.test(path)).slice(0, 10),
    filesToReviewOnly: ['package.json', 'vite.config.js', 'README.md'].filter(hasFile),
    note: 'ODT inspected the folder metadata you allowed in the browser. Chrome hides the full local path, so paste the absolute path only when backend path-level scanning or command execution is needed.',
    status: 'REPO_ANALYZED'
  };
}

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <OdtLogo />
        <div>
          <strong>ODT Workbench</strong>
          <span>Engineering control plane</span>
        </div>
      </div>
      <nav aria-label="ODT Workbench" className="nav-list">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{SidebarIcons[item.id]}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="governance-badge">
        <span className="governance-icon"><HumanGateIcon /></span>
        <span>
          <strong>Governance Mode</strong>
          <span>Human-gated. Writes require approval.</span>
        </span>
      </div>
    </aside>
  );
}

function TopHeader({ data, onRefresh }) {
  const ai = data.snapshot?.ai;
  const odtOnline = data.snapshot?.odtContext?.online;
  return (
    <header className="top-header">
      <div>
        <div className="breadcrumb">Oracle Developer Twin</div>
        <h1>ODT Workbench</h1>
      </div>
      <div className="header-status">
        <StatusBadge label={data.loading ? 'Checking' : data.error ? 'Backend Offline' : 'Backend Online'} tone={data.error ? 'danger' : 'success'} title="Backend API reachability" />
        <StatusBadge label={`Environment: ${ai?.environment || 'Local Dev'}`} tone="neutral" title="Current workbench environment" />
        <StatusBadge label={`Provider: ${ai?.provider || 'local'}`} tone="info" title="AI provider selected by the backend" />
        <StatusBadge label={`ODT API: ${odtOnline ? 'Online' : 'Offline'}`} tone={odtOnline ? 'success' : 'warning'} title="ODT API context status" />
        <button
          type="button"
          className={`icon-button ${data.loading ? 'is-loading' : ''}`}
          onClick={onRefresh}
          aria-label="Refresh workbench status"
          title="Refresh workbench status"
        >
          <RefreshIcon />
        </button>
      </div>
    </header>
  );
}

function PageRouter({ activePage, setActivePage, data }) {
  if (activePage === 'intake') return <IntakePage setActivePage={setActivePage} data={data} />;
  if (activePage === 'planner') return <PlannerPage setActivePage={setActivePage} data={data} />;
  if (activePage === 'standards') return <StandardsPage setActivePage={setActivePage} data={data} />;
  if (activePage === 'team') return <AgentTeamPage setActivePage={setActivePage} data={data} />;
  if (activePage === 'review') return <ReviewPage setActivePage={setActivePage} data={data} />;
  if (activePage === 'pr') return <PrReadinessPage setActivePage={setActivePage} data={data} />;
  if (activePage === 'artifacts') return <ArtifactsPage data={data} />;
  if (activePage === 'guide') return <GuidePage setActivePage={setActivePage} data={data} />;
  if (activePage === 'runs') return <RunsPage data={data} />;
  if (activePage === 'monitoring') return <MonitoringPage data={data} />;
  if (activePage === 'settings') return <SettingsPage data={data} />;
  return <OverviewPage setActivePage={setActivePage} data={data} />;
}

function PageHeader({ eyebrow, title, copy, actions }) {
  return (
    <section className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </section>
  );
}

function OverviewPage({ setActivePage, data }) {
  const summary = data.snapshot?.usageSummary || {};
  const assignments = data.snapshot?.assignments || [];
  const runs = data.runs || [];
  const workflow = workflowStateFromData(data);
  const openReviews = assignments.filter((item) => String(item.status).includes('review')).length;
  const gate = standardsGateState(data.evidence);
  const latestCheck = gate.latestCheck;
  const findings = gate.findings;
  const nextAction = workflow?.nextAction || {
    label: openReviews ? 'Review pending plan' : latestCheck ? 'Continue from Standards Gate' : 'Run standards review',
    detail: openReviews ? 'A plan or output is waiting for human review before write approval.' : latestCheck ? 'Use the latest findings to decide whether the plan needs changes or a controlled approval note.' : 'Create standards evidence before any implementation or PR readiness step.',
    page: openReviews ? 'planner' : 'standards'
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Overview"
        title="Requirement to PR-ready workbench"
        copy="Guide a real engineering change from requirement and repo intake through codebase analysis, gap discovery, technical design, compliance planning, implementation review, testing, and PR readiness."
        actions={(
          <>
            <button className="primary-button" type="button" onClick={() => setActivePage('intake')}>New Intake</button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('guide')}>Open ODT Guide</button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('standards')}>View Standards</button>
          </>
        )}
      />
      <ErrorBanner error={data.error} />
      <WorkflowProgress activeStage={workflow?.stage || 'intake'} />
      <div className="metric-grid">
        <MetricCard label="Workflow State" value={workflow?.label || 'Intake Started'} detail={nextAction.label} tone={workflowTone(workflow)} />
        <MetricCard label="Assignments" value={assignments.length} detail="Local work items" tone="info" />
        <MetricCard label="Active Runs" value={runs.filter((run) => run.status === 'running').length} detail={`${runs.length} recent runs`} tone="success" />
        <MetricCard label="AI Requests" value={summary.requestsToday || 0} detail={`${summary.totalTokensToday || 0} tokens today`} tone="accent" />
        <MetricCard label="Blocked Items" value={workflow?.blockedReasons?.length || 0} detail="Derived from evidence" tone={workflow?.blockedReasons?.length ? 'danger' : 'success'} />
      </div>
      <div className="two-column">
        <Panel title="Continue Work" eyebrow="Active Work">
          <div className="work-list">
            {assignments.map((item) => (
              <div className="work-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.requirement}</span>
                  <div className="mini-meta">
                    <StatusBadge label={`Stage: ${workflow?.label || 'Intake Started'}`} tone={workflowTone(workflow)} />
                    <StatusBadge label={`Owner: ${item.owner || 'RF'}`} tone="neutral" />
                    <StatusBadge label={`Updated: ${formatTime(item.updatedAt)}`} tone="neutral" />
                  </div>
                  <div className="button-row compact-buttons">
                    <button className="table-button" type="button" onClick={() => setActivePage('intake')}>Continue</button>
                    <button className="table-button" type="button" onClick={() => setActivePage('planner')}>Review Plan</button>
                    <button className="table-button" type="button" onClick={() => setActivePage('artifacts')}>View Evidence</button>
                  </div>
                </div>
                <StatusBadge label={titleCase(item.status)} tone={toneFor(item.status)} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Next Best Action" eyebrow="Guidance">
          <div className="next-action">
            <strong>{nextAction.label}</strong>
            <p>{nextAction.detail}</p>
            <button className="primary-button" type="button" onClick={() => setActivePage(nextAction.page || 'standards')}>
              {nextAction.label}
            </button>
          </div>
        </Panel>
      </div>
      <WorkflowStatePanel workflow={workflow} onNavigate={setActivePage} />
      <div className="two-column">
        <Panel title="Standards Gate" eyebrow="Quality">
          <StandardsGateSummary findings={findings} latestCheck={latestCheck} gate={gate} />
        </Panel>
        <Panel title="Governed Delivery Flow" eyebrow="Workflow">
          <StepperList
            items={[
              ['Intake requirement and repo', 'Capture Jira, branch, scope, acceptance criteria, and target module.'],
              ['Analyze requirement and codebase', 'Identify architecture, patterns, impacted files, and requirement gaps.'],
              ['Draft design and test plan', 'Include accessibility, VPAT/WCAG/Section 508, security, performance, and dependency checks.'],
              ['Review standards gate', 'Resolve blockers or capture controlled approval notes for warnings.'],
              ['Approve, implement, verify', 'Codex/Cline writes only after approval; ODT records evidence.'],
              ['Prepare PR-ready summary', 'Map acceptance criteria, tests, accessibility, security, risks, and rollback.']
            ]}
          />
        </Panel>
      </div>
      <Panel title="Recent Activity" eyebrow="Timeline">
        <Timeline events={data.runs.slice(0, 5).map((run) => ({
          title: `${titleCase(run.requestType)} run ${titleCase(run.status)}`,
          detail: `${run.provider || 'local'} provider, ${run.eventCount} event(s)`,
          createdAt: run.updatedAt,
          status: run.status
        }))} empty="No run activity yet. Ask ODT Guide a question to create the first event." />
      </Panel>
    </div>
  );
}

function IntakePage({ setActivePage, data }) {
  const [text, setText] = useState('');
  const [repoPath, setRepoPath] = useState(data.snapshot?.assignments?.[0]?.repoPath || '');
  const [baseBranch, setBaseBranch] = useState('main');
  const [workScope, setWorkScope] = useState('full-stack');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [repoResult, setRepoResult] = useState(null);
  const [browserRepoAnalysis, setBrowserRepoAnalysis] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const policy = data.uploadPolicy?.uploadPolicy || data.snapshot?.intake?.uploadPolicy || {};
  const storedAssets = data.evidence?.intakeAssets || [];

  async function extract() {
    setBusy('extract');
    setNotice('');
    try {
      const input = text || 'Build ODT Workbench v1 with AI governance.';
      const [analysisResponse, structureResponse] = await Promise.all([
        postJson('/api/intake/analyze', {
          assignmentId: 'assignment-local-mvp',
          input,
          sourceType: 'manual'
        }),
        postJson('/api/ai/extract-json', {
          assignmentId: 'assignment-local-mvp',
          input
        })
      ]);
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

  async function analyzeRepo() {
    setBusy('repo');
    setNotice('');
    try {
      const response = await postJson('/api/repo/analyze', {
        assignmentId: 'assignment-local-mvp',
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
      if ('showDirectoryPicker' in window) {
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
        assignmentId: 'assignment-local-mvp',
        sourceKind: 'intake-context',
        files
      });
      setUploadResult(response);
      setSelectedFiles([]);
      setNotice(`${response.stored.length} context file(s) copied into the ODT workspace. The target repo was not modified.`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Upload failed.');
    } finally {
      setBusy('');
    }
  }

  async function generatePlan() {
    setBusy('plan');
    setNotice('');
    try {
      if (text.trim()) {
        await postJson('/api/intake/analyze', {
          assignmentId: 'assignment-local-mvp',
          input: text,
          sourceType: 'manual'
        });
      }
      if (repoPath.trim()) {
        await postJson('/api/repo/analyze', {
          assignmentId: 'assignment-local-mvp',
          repoPath,
          browserAnalysis: browserRepoAnalysis
        });
      }
      const design = await postJson('/api/design/draft', { assignmentId: 'assignment-local-mvp' });
      const plan = await postJson('/api/plan/draft', { assignmentId: 'assignment-local-mvp', design: design.design });
      await postJson('/api/standards/check', {
        assignmentId: 'assignment-local-mvp',
        phase: 'pre-implementation',
        artifact: {
          requirement: text,
          repoPath,
          baseBranch,
          workScope,
          intakeAssets: storedAssets.map((asset) => asset.originalName),
          plan: plan.plan
        }
      });
      setNotice('Design, implementation plan, and standards review were drafted. Opening Planner.');
      await data.refresh();
      setActivePage('planner');
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
        actions={<button type="button" className="primary-button" onClick={extract} disabled={Boolean(busy)}>{busy === 'extract' ? 'Analyzing' : 'Extract Structure'}</button>}
      />
      {notice ? <div className="info-banner" role="status">{notice}</div> : null}
      <div className="two-column wide-left">
        <Panel title="Project Setup" eyebrow="Start Workspace">
          <div className="form-grid two">
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
        </Panel>
        <Panel title="Repository Signals" eyebrow="Read-only Analysis">
          <JsonBlock value={repoResult || data.evidence?.repoAnalysis?.[0]?.analysisJson || {
            status: 'waiting',
            message: 'Detected framework, package manager, scripts, test tools, folder structure, patterns, and likely impacted files will appear here.'
          }} />
        </Panel>
      </div>
      <div className="two-column wide-left">
        <Panel title="Context Vault" eyebrow="Attachments">
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
          <SimpleTable
            columns={['Selected File', 'Size', 'Type']}
            rows={selectedFiles.map((file) => [file.name, formatBytes(file.size), file.type || 'unknown'])}
            empty="No files selected yet."
          />
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={uploadFiles} disabled={busy === 'upload' || !selectedFiles.length}>{busy === 'upload' ? 'Copying Files' : 'Copy to ODT Workspace'}</button>
          </div>
        </Panel>
        <Panel title="Stored Context" eyebrow="Evidence">
          <SimpleTable
            columns={['File', 'Type', 'Size', 'Action']}
            rows={storedAssets.map((asset) => [
              asset.originalName,
              titleCase(asset.fileType),
              formatBytes(asset.bytes),
              <a className="table-button" href={assetFileUrl(asset.id)} target="_blank" rel="noreferrer">Open File</a>
            ])}
            empty="No context files copied yet."
          />
          {uploadResult?.workspacePath ? <p className="muted-copy">Workspace copy: {uploadResult.workspacePath}</p> : null}
        </Panel>
      </div>
      <div className="two-column wide-left">
        <Panel title="Work Request" eyebrow="Input">
          <label className="field" htmlFor="work-request-input">
            <span>Requirement, Jira details, acceptance criteria, constraints, and expectations</span>
            <textarea
              id="work-request-input"
              className="large-input"
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
        </Panel>
        <Panel title="Extracted Structure" eyebrow="AI Suggestion">
          <JsonBlock value={result || {
            status: 'waiting',
            message: 'Extracted scope, risks, dependencies, and acceptance criteria will appear here.'
          }} />
        </Panel>
      </div>
      <Panel title="Clarification Examples" eyebrow="Gap Analysis">
        <ActionList
          items={[
            ['Requirement behavior', 'Should the action be synchronous or asynchronous? What happens on partial failure?'],
            ['Roles and audit', 'Which roles can perform this action, and is audit history required?'],
            ['UI states', 'What should loading, empty, validation, success, warning, and error states say?'],
            ['Compliance', 'Does this feature affect VPAT/WCAG/Section 508 reporting, security review, or dependency approval?']
          ]}
        />
      </Panel>
    </div>
  );
}

function PlannerPage({ setActivePage, data }) {
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const workflow = workflowStateFromData(data);
  const gate = standardsGateState(data.evidence);
  const latestCheck = gate.latestCheck;
  const blockers = gate.unresolvedBlockers;
  const reviewBlockers = gate.reviewBlockers || [];
  const reviewedBlockers = gate.blockerFindings;
  const writeApproved = gate.writeApproved;
  const selectedAgent = getStoredSetting(data, 'executionAgent', 'codex');
  const approvedDependencies = (data.evidence?.dependencyRequests || []).filter((request) => request.status === 'approved');
  const pendingDependencies = (data.evidence?.dependencyRequests || []).filter((request) => request.status === 'pending');
  const canApproveWrite = workflowAllows(workflow, 'canApproveWrite', Boolean(latestCheck && !reviewBlockers.length && !writeApproved)) && !blockers.length;
  const canDelegateWrite = workflowAllows(workflow, 'canDelegateWrite', Boolean(writeApproved && !blockers.length && !reviewBlockers.length));
  const effectiveGateStatus = gate.implementationBlocked
    ? 'BLOCKED_BY_REVIEW'
    : writeApproved && !blockers.length
    ? gate.blockerOverride ? 'WRITE_APPROVED_WITH_OVERRIDE' : 'WRITE_APPROVED'
    : latestCheck?.status || 'Not Run';
  const delegateReason = canDelegateWrite
    ? `${titleCase(selectedAgent)} can receive the write-approved handoff.`
    : blockers.length || reviewBlockers.length
      ? 'Review standards blockers or resolve/accept review blockers before delegation.'
      : latestCheck
        ? 'Capture write approval for the latest standards review before delegation.'
        : 'Run Standards Check before delegation.';

  async function requestChanges() {
    setBusy(true);
    setNotice('');
    try {
      await postJson('/api/approvals', {
        assignmentId: 'assignment-local-mvp',
        approvalType: 'plan_review',
        status: 'needs_changes',
        notes: 'Reviewer requested plan changes before write approval.'
      });
      setNotice('Review comment recorded. The plan remains blocked until updates are made.');
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to record requested changes.');
    } finally {
      setBusy(false);
    }
  }

  async function approveWriteScope() {
    if (!canApproveWrite) return;
    setBusy(true);
    setNotice('');
    try {
      await postJson('/api/approvals', {
        assignmentId: 'assignment-local-mvp',
        approvalType: 'write_scope',
        status: 'approved',
        notes: `Approved write scope for ${titleCase(selectedAgent)} after standards review.`
      });
      setNotice(`Write scope approved. ${titleCase(selectedAgent)} handoff can move from read-only to write-approved mode.`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to approve write scope.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Planner"
        title="Draft technical design before implementation"
        copy="The plan should cover scope, impacted files, API/data/UI changes, validation, accessibility, security, performance, tests, rollback, and open questions before writes are approved."
      />
      {notice ? <div className="info-banner" role="status">{notice}</div> : null}
      <WorkflowDecisionBar workflow={workflow} onNavigate={setActivePage} />
      <div className="two-column wide-left">
        <Panel title="Plan Summary" eyebrow="Draft Plan">
          <ActionList
            items={[
              ['Backend control plane', 'Implement AI endpoints, SQLite events, safe settings, and OpenAPI.'],
              ['React workbench', 'Build Redwood-like pages for Overview, Guide, Agent Team, Runs, Monitoring, Settings.'],
              ['Standards', 'Apply accessibility, VPAT/WCAG/Section 508, security, dependency, and Redwood UX checks.'],
              ['Verification', 'Plan statement, branch, function, positive, negative, boundary, error, and accessibility coverage.']
            ]}
          />
        </Panel>
        <Panel title="Approval Gate" eyebrow="Human Control">
          <div className="approval-box">
            <StatusBadge label={workflow?.state || (writeApproved ? 'APPROVED_TO_WRITE' : 'PLAN_REVIEW')} tone={workflowTone(workflow || (writeApproved ? 'APPROVED_TO_WRITE' : 'PLAN_REVIEW'))} />
            <p>AI can recommend next steps, but write/delegate actions remain blocked until standards evidence is reviewed and a human approves scope.</p>
            <button type="button" className="primary-button" onClick={() => setActivePage('standards')}>Review Standards Gate</button>
            <button
              type="button"
              className="secondary-button"
              onClick={approveWriteScope}
              disabled={busy || !canApproveWrite}
              title={blockers.length ? 'Review and override blockers in Standards before write approval.' : writeApproved ? 'Write scope is already approved.' : 'Approve write scope after standards review.'}
            >
              {writeApproved ? 'Write Scope Approved' : 'Approve Write Scope'}
            </button>
            <button type="button" className="secondary-button" onClick={requestChanges} disabled={busy}>{busy ? 'Recording' : 'Request Changes'}</button>
          </div>
        </Panel>
      </div>
      <Panel title="Standards Gate Checklist" eyebrow="Pre-Write Control">
        <SimpleTable
          columns={['Gate', 'Current State', 'What It Means']}
          rows={[
            ['Standards Review', <StatusBadge label={effectiveGateStatus} tone={standardsTone(effectiveGateStatus)} />, 'A plan must be checked before implementation begins.'],
              ['Critical Blockers', <StatusBadge label={blockers.length || reviewBlockers.length ? `${blockers.length + reviewBlockers.length} Open` : reviewedBlockers.length ? 'Reviewed Override' : 'None Found'} tone={blockers.length || reviewBlockers.length ? 'danger' : 'success'} />, 'Blockers require explicit review. Standards blockers can be overridden with notes; review blockers can be resolved or accepted as risk.'],
            ['Policy Flexibility', <StatusBadge label="Controlled Override" tone="info" />, 'Theme, labels, warnings, and reviewed blockers can be overridden with notes.'],
            ['Write Approval', <StatusBadge label={writeApproved ? 'Captured' : 'Required'} tone={writeApproved ? 'success' : 'warning'} />, 'Codex/Cline implementation stays read-only until approved.']
          ]}
        />
      </Panel>
      <div className="two-column">
        <Panel title="Critical Blockers" eyebrow="Needs Resolution">
          <SimpleTable
            columns={['Category', 'Status', 'Blocker', 'Required Action']}
            rows={reviewedBlockers.map((finding) => [
              titleCase(finding.category),
              <StatusBadge label={gate.blockerOverride ? 'Reviewed Override' : 'Open'} tone={gate.blockerOverride ? 'success' : 'danger'} />,
              finding.message,
              finding.recommendation
            ])}
            empty="No critical blockers. Review warnings in Standards before approving writes."
          />
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => setActivePage('standards')}>Review Findings</button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('artifacts')}>View Evidence</button>
          </div>
        </Panel>
        <Panel title="Agent Handoff" eyebrow="Delegate">
          <InfoList
            items={[
              ['Selected agent', titleCase(selectedAgent)],
              ['Delegation mode', canDelegateWrite ? 'Write-approved' : 'Read-only'],
              ['Write approval', writeApproved ? 'Captured' : 'Required'],
              ['Review decision', gate.implementationBlocked ? 'Implementation blocked' : 'No active block'],
              ['Dependency installs', approvedDependencies.length ? `${approvedDependencies.length} approved package(s)` : pendingDependencies.length ? `${pendingDependencies.length} pending approval` : 'Blocked'],
              ['Blocker gate', blockers.length || reviewBlockers.length ? `${blockers.length + reviewBlockers.length} unresolved` : gate.blockerOverride ? 'Reviewed override' : 'Clear']
            ]}
          />
          <p className="muted-copy">{delegateReason}</p>
          <div className="button-row vertical">
            <button
              className="primary-button"
              type="button"
              onClick={() => setActivePage('team')}
              disabled={!canDelegateWrite}
              title={canDelegateWrite ? `Open ${titleCase(selectedAgent)} handoff.` : 'Review findings, override accepted blockers if needed, and approve write scope before delegating implementation.'}
            >
              Delegate to {titleCase(selectedAgent)}
            </button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('team')}>Open Agent Team</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StandardsPage({ setActivePage, data }) {
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
  const gate = standardsGateState(evidence);
  const latestCheck = gate.latestCheck;
  const findings = gate.findings;
  const blockers = gate.unresolvedBlockers;
  const reviewBlockers = gate.reviewBlockers || [];
  const reviewedBlockers = gate.blockerFindings;
  const approvals = evidence.approvals || [];
  const writeApproved = gate.writeApproved;
  const approvalBlockedByDecision = workflow?.blockedReasons?.some((reason) => reason.category === 'approval');
  const canApproveFromStandards = workflowAllows(workflow, 'canApproveWrite', Boolean(latestCheck && !writeApproved)) && !reviewBlockers.length;
  const approvalActionDisabled = Boolean(busy) || !latestCheck || writeApproved || !canApproveFromStandards;
  const approvalActionLabel = writeApproved
    ? 'Approval Captured'
    : approvalBlockedByDecision
      ? 'Clear Block And Approve Write'
      : blockers.length
      ? 'Override Reviewed Blockers'
      : 'Approve With Warnings';
  const dependencies = evidence.dependencyRequests || [];
  const pendingDependencies = dependencies.filter((request) => request.status === 'pending');
  const approvedDependencies = dependencies.filter((request) => request.status === 'approved');
  const rejectedDependencies = dependencies.filter((request) => request.status === 'rejected');
  const implementationEvidence = evidence.implementationEvidence || [];
  const failedRecordedTests = implementationEvidence.flatMap((record) => record.tests || []).filter((test) => test.status === 'failed');
  const prReports = evidence.prReadinessReports || [];
  const flexibility = data.standards?.flexibility;
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
        assignmentId: 'assignment-local-mvp',
        phase: 'pre-implementation',
        artifact: {
          plan: 'Requirement and repo analysis with impacted files, architecture patterns, accessibility WCAG VPAT Section 508, keyboard focus labels contrast, security compliance validation safe errors, dependency policy no new dependency, testing statement coverage branch coverage function coverage line coverage positive negative boundary error scenarios, Redwood UX loading empty error success states, performance latency timeout, maintainable reusable naming existing pattern.',
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
      await postJson('/api/design/draft', { assignmentId: 'assignment-local-mvp' });
      await postJson('/api/plan/draft', { assignmentId: 'assignment-local-mvp' });
      setNotice('Technical design and implementation plan drafts were refreshed.');
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
          assignmentId: 'assignment-local-mvp',
          approvalType: 'standards_blocker_override',
          status: 'approved',
          notes: `${notes} Overrode ${blockers.length} blocker(s) from standards check ${latestCheck?.id || 'latest'}.`
        });
      }
      await postJson('/api/approvals', {
        assignmentId: 'assignment-local-mvp',
        approvalType: 'standards_warning_override',
        status: 'approved',
        notes
      });
      await postJson('/api/approvals', {
        assignmentId: 'assignment-local-mvp',
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
        assignmentId: 'assignment-local-mvp',
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
        assignmentId: 'assignment-local-mvp',
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
        assignmentId: 'assignment-local-mvp',
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
        title="Standards Command Center"
        copy="Run pre-write and pre-PR checks, review findings, capture controlled overrides, and keep an evidence trail for accessibility, security, dependency, testing, UX, and approval gates."
        actions={(
          <>
            <button className="primary-button" type="button" onClick={runCheck} disabled={Boolean(busy)}>{busy === 'check' ? 'Checking' : 'Run Standards Check'}</button>
            <button className="secondary-button" type="button" onClick={preparePrPack} disabled={Boolean(busy)}>{busy === 'pr' ? 'Preparing' : 'Prepare PR Pack'}</button>
          </>
        )}
      />
      {notice ? <div className="info-banner" role="status">{notice}</div> : null}
      <WorkflowDecisionBar workflow={workflow} onNavigate={setActivePage} />
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
              ['Blockers', reviewedBlockers.length ? gate.blockerOverride ? 'Reviewed override captured' : 'Review or override required' : 'None open'],
              ['Review decision', gate.implementationBlocked ? 'Implementation blocked' : 'No active block'],
              ['Standards version', data.standards?.registry?.standardsVersion || 'odt-baseline-1.0']
            ]}
          />
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
            <button type="button" className="secondary-button" onClick={updatePlan} disabled={Boolean(busy)}>{busy === 'plan' ? 'Updating' : 'Update Plan'}</button>
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
              ? <StatusBadge label={gate.blockerOverride ? 'Reviewed Override' : 'Open'} tone={gate.blockerOverride ? 'success' : 'danger'} />
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
            <button className="secondary-button" type="button" onClick={() => setActivePage('pr')}>Open PR Ready</button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('artifacts')}>Open Artifacts</button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('runs')}>Open Runs</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AgentTeamPage({ setActivePage, data }) {
  const storedAgent = getStoredSetting(data, 'executionAgent', 'codex');
  const [selectedAgent, setSelectedAgent] = useState(storedAgent);
  const [agentNotice, setAgentNotice] = useState('');
  const [handoffBusy, setHandoffBusy] = useState(false);
  const selectedAgentConfig = executionAgents.find((agent) => agent.id === selectedAgent) || executionAgents[0];
  const workflow = workflowStateFromData(data);
  const gate = standardsGateState(data.evidence);
  const blockers = gate.unresolvedBlockers;
  const reviewBlockers = gate.reviewBlockers || [];
  const writeApproved = gate.writeApproved;
  const writeMode = workflowAllows(workflow, 'canDelegateWrite', Boolean(writeApproved && !blockers.length && !reviewBlockers.length));
  const approvedDependencies = (data.evidence?.dependencyRequests || []).filter((request) => request.status === 'approved');
  const pendingDependencies = (data.evidence?.dependencyRequests || []).filter((request) => request.status === 'pending');

  useEffect(() => {
    setSelectedAgent(storedAgent);
  }, [storedAgent]);

  async function chooseAgent(agentId) {
    setSelectedAgent(agentId);
    setAgentNotice('');
    try {
      await postJson('/api/settings', {
        settings: {
          executionAgent: agentId
        }
      });
      setAgentNotice(`${titleCase(agentId)} selected for the next governed handoff. Write actions still require approval.`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to save execution agent preference.');
    }
  }

  async function copyAgentHandoff({ requireWrite = false } = {}) {
    if (requireWrite && !writeMode) {
      setAgentNotice('Delegation is waiting on Standards, review blockers, or write approval. You can still copy a read-only handoff for planning.');
      return;
    }
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const contract = await getJson('/api/assignments/assignment-local-mvp/agent-contract');
      const copied = await copyTextToClipboard(JSON.stringify(contract, null, 2));
      setAgentNotice(copied
        ? `${titleCase(contract.executionAgent || selectedAgent)} handoff copied. Current mode: ${contract.mode}.`
        : 'Handoff generated, but browser clipboard access is blocked. Use the Artifacts evidence or API contract as the source.');
    } catch (err) {
      setAgentNotice(err.message || 'Unable to copy agent handoff.');
    } finally {
      setHandoffBusy(false);
    }
  }

  async function delegateAgentHandoff() {
    if (!writeMode) {
      setAgentNotice('Delegation is waiting on Standards, review blockers, or write approval. Resolve review blockers, approve the latest check, then delegate.');
      return;
    }
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson('/api/agents/delegate', {
        assignmentId: 'assignment-local-mvp',
        executionAgent: selectedAgent,
        requireWriteApproved: true,
        notes: 'Prepared from Agent Team.'
      });
      const copied = await copyTextToClipboard(JSON.stringify(result.handoff, null, 2));
      setAgentNotice(copied
        ? `${titleCase(result.handoff.executionAgent)} handoff run ${shortId(result.runId)} prepared and copied. Mode: ${result.handoff.mode}.`
        : `${titleCase(result.handoff.executionAgent)} handoff run ${shortId(result.runId)} prepared. Clipboard was blocked, but the handoff is saved in Artifacts and Runs.`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to prepare agent handoff run.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Agent Team"
        title="Supervised multi-agent delivery"
        copy="Team mode is for larger work with natural parallelism. Every role has a clear scope and quality gate."
        actions={<StatusBadge label={workflow?.state || (writeMode ? 'Governance: WRITE_APPROVED' : 'Governance: PLAN_REVIEW')} tone={workflowTone(workflow || (writeMode ? 'APPROVED_TO_WRITE' : 'PLAN_REVIEW'))} />}
      />
      <WorkflowDecisionBar workflow={workflow} onNavigate={setActivePage} />
      <Panel title="Execution Agent" eyebrow="Handoff Target">
        <div className="agent-selector" role="radiogroup" aria-label="Select execution agent">
          {executionAgents.map((agent) => (
            <button
              className={`agent-option ${selectedAgent === agent.id ? 'selected' : ''}`}
              type="button"
              key={agent.id}
              role="radio"
              aria-checked={selectedAgent === agent.id}
              onClick={() => chooseAgent(agent.id)}
            >
              <strong>{agent.name}</strong>
              <span>{agent.label}</span>
            </button>
          ))}
        </div>
        <div className="agent-contract-note">
          <div>
            <strong>{selectedAgentConfig.label}</strong>
            <p>{selectedAgentConfig.detail}</p>
          </div>
          <StatusBadge label={writeMode ? 'Write-approved' : 'Read-only until approved'} tone={writeMode ? 'success' : 'warning'} />
        </div>
        <div className="handoff-toolbar">
          <InfoList
            items={[
              ['Write approval', writeApproved ? 'Captured' : 'Required'],
              ['Review decision', gate.implementationBlocked ? 'Implementation blocked' : 'No active block'],
              ['Critical blockers', blockers.length || reviewBlockers.length ? `${blockers.length + reviewBlockers.length} unresolved` : gate.blockerOverride ? 'Reviewed override' : 'None'],
              ['Dependency installs', approvedDependencies.length ? `${approvedDependencies.length} approved package(s)` : pendingDependencies.length ? `${pendingDependencies.length} pending approval` : 'Blocked'],
              ['Allowed mode', writeMode ? 'write-approved' : 'read-only']
            ]}
          />
          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              onClick={delegateAgentHandoff}
              disabled={handoffBusy || !writeMode}
              title={writeMode ? `Prepare and copy a write-approved handoff run for ${titleCase(selectedAgent)}.` : 'Resolve standards review and approve write scope before delegation.'}
            >
              {handoffBusy ? 'Copying' : `Delegate to ${titleCase(selectedAgent)}`}
            </button>
            <button className="secondary-button" type="button" onClick={() => copyAgentHandoff()} disabled={handoffBusy}>
              Copy Read-only Handoff
            </button>
          </div>
        </div>
        {agentNotice ? <p className="muted-copy">{agentNotice}</p> : null}
      </Panel>
      <div className="role-grid">
        {teamRoles.map((role) => (
          <section className="role-card" key={role.name}>
            <div className="role-avatar">{role.name.slice(0, 2).toUpperCase()}</div>
            <h3>{role.name}</h3>
            <StatusBadge label={role.status} tone={toneFor(role.status)} />
            <p>{role.scope}</p>
            <span>{role.mode}</span>
          </section>
        ))}
      </div>
      <div className="two-column">
        <Panel title="Shared Task List" eyebrow="Execution">
          <Checklist items={['Define API contract', 'Implement endpoint', 'Add UI', 'Add tests', 'Capture evidence']} />
        </Panel>
        <Panel title="Run Timeline" eyebrow="Latest">
          <Timeline events={data.runs.slice(0, 6).map((run) => ({
            title: `${titleCase(run.requestType)} ${titleCase(run.status)}`,
            detail: run.id,
            createdAt: run.updatedAt,
            status: run.status
          }))} empty="No agent run events yet." />
        </Panel>
      </div>
      <Panel title="Quality Gates" eyebrow="Control">
        <Checklist items={qualityGates} />
      </Panel>
    </div>
  );
}

function ReviewPage({ setActivePage, data }) {
  const assignments = data.snapshot?.assignments || [];
  const evidence = data.evidence || {};
  const workflow = workflowStateFromData(data);
  const gate = standardsGateState(evidence);
  const comments = evidence.reviewComments || [];
  const implementationEvidence = evidence.implementationEvidence || [];
  const latestImplementationEvidence = implementationEvidence[0];
  const recordedTests = implementationEvidence.flatMap((record) => record.tests || []);
  const failedRecordedTests = recordedTests.filter((test) => test.status === 'failed');
  const openComments = comments.filter((comment) => comment.status === 'open');
  const openBlockers = openComments.filter((comment) => comment.severity === 'blocker');
  const acceptedRisk = comments.filter((comment) => comment.status === 'accepted_risk');
  const resolved = comments.filter((comment) => comment.status === 'resolved');
  const selectedAgent = getStoredSetting(data, 'executionAgent', 'codex');
  const writeReady = workflowAllows(workflow, 'canDelegateWrite', Boolean(gate.writeApproved && !gate.unresolvedBlockers.length && !openBlockers.length));
  const canRecordImplementationEvidence = workflowAllows(workflow, 'canRecordImplementationEvidence', Boolean(gate.writeApproved || evidence.agentEvents?.some((event) => event.eventType === 'handoff_prepared')));
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
    changedFiles: 'server/index.js\nsrc/main.jsx\nsrc/styles.css',
    commands: 'npm run build',
    tests: 'Build verification | passed | Production bundle completed.',
    summary: 'Implemented the governed workflow slice and recorded evidence for post-implementation standards review.'
  });

  function updateCommentField(field, value) {
    setCommentForm((current) => ({ ...current, [field]: value }));
  }

  function updateReworkField(field, value) {
    setReworkForm((current) => ({ ...current, [field]: value }));
  }

  function updateImplementationField(field, value) {
    setImplementationForm((current) => ({ ...current, [field]: value }));
  }

  async function addReviewComment() {
    setBusy('add-comment');
    setNotice('');
    try {
      await postJson('/api/review/comments', {
        assignmentId: 'assignment-local-mvp',
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
        assignmentId: 'assignment-local-mvp',
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
        assignmentId: 'assignment-local-mvp',
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
        assignmentId: 'assignment-local-mvp',
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
      <WorkflowDecisionBar workflow={workflow} onNavigate={setActivePage} />
      <div className="metric-grid">
        <MetricCard label="Open Comments" value={openComments.length || 0} detail="Need review decision" tone={openComments.length ? 'warning' : 'success'} />
        <MetricCard label="Review Blockers" value={openBlockers.length || 0} detail="Block delegation until resolved or accepted" tone={openBlockers.length ? 'danger' : 'success'} />
        <MetricCard label="Implementation Evidence" value={implementationEvidence.length || 0} detail={latestImplementationEvidence ? `${latestImplementationEvidence.changedFiles?.length || 0} files recorded` : 'Required before PR pack'} tone={implementationEvidence.length ? 'success' : 'warning'} />
        <MetricCard label="Accepted Risk" value={acceptedRisk.length || 0} detail="Human-owned continuation evidence" tone={acceptedRisk.length ? 'warning' : 'neutral'} />
        <MetricCard label="Failed Tests" value={failedRecordedTests.length || 0} detail="Need fix or accepted risk" tone={failedRecordedTests.length ? 'danger' : 'success'} />
      </div>
      <div className="two-column wide-left">
        <Panel title="Review Queue" eyebrow="Human Decisions">
          <SimpleTable
            columns={['Target', 'Severity', 'Comment', 'Status', 'Actions']}
            rows={comments.map((comment) => [
              titleCase(comment.targetType),
              <StatusBadge label={titleCase(comment.severity)} tone={comment.severity === 'blocker' ? 'danger' : comment.severity === 'warning' ? 'warning' : 'neutral'} />,
              <span>{comment.comment}{comment.resolutionNotes ? <small className="cell-note">{comment.resolutionNotes}</small> : null}</span>,
              <StatusBadge label={titleCase(comment.status)} tone={comment.status === 'resolved' ? 'success' : comment.status === 'accepted_risk' ? 'warning' : 'danger'} />,
              <div className="button-row compact-buttons">
                <button className="table-button" type="button" onClick={() => updateCommentStatus(comment, 'resolved')} disabled={Boolean(busy) || comment.status === 'resolved'}>Resolve</button>
                <button className="table-button" type="button" onClick={() => updateCommentStatus(comment, 'accepted_risk')} disabled={Boolean(busy) || comment.status === 'accepted_risk'}>Accept Risk</button>
                <button className="table-button" type="button" onClick={() => updateCommentStatus(comment, 'open')} disabled={Boolean(busy) || comment.status === 'open'}>Reopen</button>
              </div>
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
            <button className="primary-button" type="button" onClick={() => setActivePage(writeReady ? 'team' : 'standards')}>
              {writeReady ? `Delegate to ${titleCase(selectedAgent)}` : 'Open Standards Gate'}
            </button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('planner')}>Review Plan</button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('artifacts')}>View Evidence</button>
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
        <Panel title="Implementation Evidence Capture" eyebrow="Post-Handoff Evidence">
          <div className="form-grid two">
            <label className="field" htmlFor="implementation-files">
              <span>Changed files</span>
              <textarea
                id="implementation-files"
                className="notes-input compact-notes"
                value={implementationForm.changedFiles}
                onChange={(event) => updateImplementationField('changedFiles', event.target.value)}
                placeholder="One file path per line"
              />
            </label>
            <label className="field" htmlFor="implementation-commands">
              <span>Commands run</span>
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
            <span>Implementation summary</span>
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
              title={canRecordImplementationEvidence ? 'Record changed files, commands, and tests as implementation evidence.' : 'Implementation evidence is locked until write/delegate approval is current and blockers are cleared.'}
            >
              {busy === 'implementation-evidence' ? 'Recording Evidence' : 'Record Implementation Evidence'}
            </button>
            <button className="secondary-button" type="button" onClick={runPostImplementationCheck} disabled={Boolean(busy) || !latestImplementationEvidence}>
              {busy === 'post-check' ? 'Checking' : 'Run Post-Implementation Check'}
            </button>
          </div>
        </Panel>
        <Panel title="Latest Implementation Evidence" eyebrow="PR Gate Input">
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
            <div className="empty-state">No implementation evidence yet. Record it after Codex, Cline, or manual work finishes.</div>
          )}
          <div className="button-row vertical">
            <button className="secondary-button" type="button" onClick={() => setActivePage('artifacts')}>Open Evidence Artifact</button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('standards')}>Open Standards Gate</button>
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
            <button className="table-button" type="button" onClick={() => setActivePage('planner')}>Review Plan</button>
          ])}
        />
      </Panel>
    </div>
  );
}

function PrReadinessPage({ setActivePage, data }) {
  const evidence = data.evidence || {};
  const workflow = workflowStateFromData(data);
  const latestReport = evidence.prReadinessReports?.[0]?.reportJson || null;
  const latestImplementationEvidence = evidence.implementationEvidence?.[0] || null;
  const tests = latestImplementationEvidence?.tests || [];
  const failedTests = tests.filter((test) => test.status === 'failed');
  const blockingItems = latestReport?.blockingItems || [];
  const checklist = latestReport?.readinessChecklist || [];
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    linkedJira: latestReport?.linkedJira || '',
    notes: latestReport?.reviewerNotes || 'Prepared from PR Readiness Command Center.'
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function generatePrPack() {
    setBusy('generate');
    setNotice('');
    try {
      const result = await postJson('/api/pr/prepare', {
        assignmentId: 'assignment-local-mvp',
        linkedJira: form.linkedJira,
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
      <WorkflowDecisionBar workflow={workflow} onNavigate={setActivePage} />
      <div className="metric-grid">
        <MetricCard label="Workflow State" value={workflow?.label || 'Not Started'} detail={workflow?.nextAction?.label || 'Collect evidence'} tone={workflowTone(workflow)} />
        <MetricCard label="PR Gate" value={status} detail={latestReport ? 'Latest generated pack' : 'Generate first pack'} tone={status === 'PR_READY_REVIEW' ? 'success' : status === 'BLOCKED' ? 'danger' : 'warning'} />
        <MetricCard label="Blocking Items" value={blockingItems.length || 0} detail="Must resolve or accept risk" tone={blockingItems.length ? 'danger' : 'success'} />
        <MetricCard label="Checklist" value={`${checkedCount}/${checklist.length || 0}`} detail="Evidence-backed items" tone={checklist.length && checkedCount === checklist.length ? 'success' : 'warning'} />
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
                placeholder="Example: JOURNEY-25367"
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
              ['Standards Gate', latestReport ? `Latest PR pack status is ${latestReport.status}.` : 'No PR pack has been generated yet.'],
              ['Human Review', 'Blocked items remain reviewable and can be resolved, accepted as risk, or sent back for rework.']
            ]}
          />
          <div className="button-row">
            <button className="primary-button" type="button" onClick={generatePrPack} disabled={Boolean(busy)}>
              {busy === 'generate' ? 'Generating' : 'Generate PR Pack'}
            </button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('review')}>Record Evidence</button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('artifacts')}>Open Artifacts</button>
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
              ['Requirements', evidenceSummary.requirements || evidence.requirements?.length || 0],
              ['Repo analyses', evidenceSummary.repoAnalyses || evidence.repoAnalysis?.length || 0],
              ['Designs', evidenceSummary.technicalDesigns || evidence.technicalDesigns?.length || 0],
              ['Plans', evidenceSummary.implementationPlans || evidence.implementationPlans?.length || 0],
              ['Standards checks', evidenceSummary.standardsChecks || evidence.standardsChecks?.length || 0],
              ['Implementation evidence', evidenceSummary.implementationEvidence || evidence.implementationEvidence?.length || 0],
              ['Test results', evidenceSummary.testResults || tests.length || 0],
              ['Approvals', evidenceSummary.approvals || evidence.approvals?.length || 0]
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

function ArtifactsPage({ data }) {
  const evidence = data.evidence || {};
  const latestDesign = evidence.technicalDesigns?.[0]?.designJson;
  const latestPlan = evidence.implementationPlans?.[0]?.planJson;
  const latestPrPack = evidence.prReadinessReports?.[0]?.reportJson;
  const implementationEvidence = evidence.implementationEvidence || [];
  const latestImplementationEvidence = implementationEvidence[0];
  const assets = evidence.intakeAssets || [];
  const latestAgentHandoff = (evidence.agentEvents || []).find((event) => event.eventType === 'handoff_prepared');
  const [selectedArtifact, setSelectedArtifact] = useState({
    title: 'Artifact Catalog',
    content: {
      message: 'Choose an artifact to review its saved evidence.',
      availableEvidence: {
        technicalDesigns: evidence.technicalDesigns?.length || 0,
        implementationPlans: evidence.implementationPlans?.length || 0,
	        intakeAssets: assets.length,
	        standardsChecks: evidence.standardsChecks?.length || 0,
	        reviewComments: evidence.reviewComments?.length || 0,
	        implementationEvidence: implementationEvidence.length,
	        agentHandoffs: evidence.agentEvents?.length || 0,
	        prReadinessReports: evidence.prReadinessReports?.length || 0
	      }
    }
  });

  const artifacts = [
    {
      title: 'Architecture Brief',
      copy: 'Technical design, architecture decisions, accessibility/security notes, and rollback thinking.',
      action: 'View Brief',
      content: latestDesign || { status: 'waiting', message: 'Draft a technical design from Intake or Standards to create this artifact.' }
    },
    {
      title: 'Implementation Blueprint',
      copy: 'Files to change, backend/frontend tasks, validation, tests, risks, and approval gates.',
      action: 'View Blueprint',
      content: latestPlan || { status: 'waiting', message: 'Generate an implementation plan to create this artifact.' }
    },
    {
      title: 'OpenAPI Contract',
      copy: 'Backend API contract for future OCI GenAI Agent tool calling and integration review.',
      action: 'Open Contract',
      content: {
        openApiUrl: `${API_BASE}/openapi.json`,
        note: 'Use Open Contract to view the live OpenAPI 3.0.3 document in a new tab.'
      },
      onOpen: () => window.open(`${API_BASE}/openapi.json`, '_blank', 'noopener,noreferrer')
    },
    {
      title: 'Run Evidence',
      copy: 'Usage logs, event timeline, provider selection, token counts, latency, and verification notes.',
      action: 'View Run Evidence',
      content: {
        runs: data.runs,
        selectedRunId: data.selectedRunId,
        selectedRunEvents: data.runEvents
      }
    },
    {
      title: 'Review Log',
      copy: 'Human review comments, blocker decisions, accepted risk, rework requests, and resolution notes.',
      action: 'View Review Log',
      content: {
        comments: evidence.reviewComments || [],
        openBlockers: (evidence.reviewComments || []).filter((comment) => comment.status === 'open' && comment.severity === 'blocker'),
        acceptedRisk: (evidence.reviewComments || []).filter((comment) => comment.status === 'accepted_risk')
      }
    },
    {
      title: 'Implementation Evidence',
      copy: 'Changed files, commands, test outcomes, post-implementation check status, and PR gate inputs.',
      action: 'View Evidence',
      content: latestImplementationEvidence || { status: 'waiting', message: 'Record implementation evidence from Review after Codex, Cline, or manual work finishes.' }
    },
    {
      title: 'Agent Handoff Run',
      copy: 'Latest Codex/Cline/manual delegation contract, allowed actions, standards gate, and run evidence.',
      action: 'View Handoff',
      content: latestAgentHandoff?.detailJson || { status: 'waiting', message: 'Delegate from Agent Team to create a governed handoff run.' }
    },
    {
      title: 'Context Vault',
      copy: 'Copied requirement context: mockups, screenshots, PDFs, DOCX, spreadsheets, API samples, and notes.',
      action: 'View Vault',
      content: {
        storage: data.uploadPolicy?.workspaceDir || data.snapshot?.intake?.workspaceDir,
        policy: data.uploadPolicy?.uploadPolicy || data.snapshot?.intake?.uploadPolicy,
        assets
      }
    },
    {
      title: 'PR Readiness Pack',
      copy: 'Acceptance mapping, testing notes, accessibility notes, security notes, risks, and rollback.',
      action: 'View PR Pack',
      content: latestPrPack || { status: 'waiting', message: 'Prepare a PR Pack from Standards to create this artifact.' }
    }
  ];

  function openArtifact(artifact) {
    artifact.onOpen?.();
    setSelectedArtifact({ title: artifact.title, content: artifact.content });
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Artifacts"
        title="Saved outputs and evidence"
        copy="Summaries, JSON contracts, generated test ideas, OpenAPI notes, and review evidence will be collected here."
      />
      <div className="artifact-grid">
        {artifacts.map((artifact) => (
          <Panel title={artifact.title} eyebrow="Artifact" key={artifact.title}>
            <p className="muted-copy">{artifact.copy}</p>
            <button
              type="button"
              className={`secondary-button ${selectedArtifact.title === artifact.title ? 'selected-action' : ''}`}
              onClick={() => openArtifact(artifact)}
              aria-current={selectedArtifact.title === artifact.title ? 'true' : undefined}
            >
              {artifact.action}
            </button>
          </Panel>
        ))}
      </div>
      <Panel title={selectedArtifact.title} eyebrow="Artifact Detail">
        {selectedArtifact.title === 'Context Vault' && assets.length ? (
          <SimpleTable
            columns={['File', 'Type', 'Size', 'Action']}
            rows={assets.map((asset) => [
              asset.originalName,
              titleCase(asset.fileType),
              formatBytes(asset.bytes),
              <a className="table-button" href={assetFileUrl(asset.id)} target="_blank" rel="noreferrer">Open File</a>
            ])}
          />
        ) : selectedArtifact.title === 'PR Readiness Pack' && selectedArtifact.content?.markdown ? (
          <pre className="markdown-block">{selectedArtifact.content.markdown}</pre>
        ) : (
          <JsonBlock value={selectedArtifact.content} />
        )}
      </Panel>
    </div>
  );
}

function GuidePage({ setActivePage, data }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'I can summarize ODT work, extract structure, generate tests, find risks, and explain what is safe to run next.' }
  ]);
  const [busy, setBusy] = useState(false);
  const latestUsage = data.usage.events?.[0];

  async function send(message = input) {
    const text = message.trim();
    if (!text) return;
    setMessages((current) => [...current, { role: 'user', content: text }]);
    setInput('');
    setBusy(true);
    try {
      const response = await postJson('/api/ai/chat', {
        input: text,
        sessionId: 'odt-guide-ui',
        assignmentId: 'assignment-local-mvp'
      });
      setMessages((current) => [...current, { role: 'assistant', content: String(response.content || '') }]);
      await data.refresh();
    } catch (err) {
      setMessages((current) => [...current, { role: 'assistant', content: `I could not reach the guide backend: ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ODT Guide"
        title="Ask, reason, summarize, and act carefully"
        copy="The guide uses backend-governed AI. Responses are logged for usage, latency, provider, model, and fallback visibility."
      />
      <div className="guide-layout">
        <section className="chat-panel">
          <div className="prompt-row">
            {['Summarize this requirement', 'Extract API contract', 'Generate test cases', 'Find risks', 'Create implementation checklist'].map((prompt) => (
              <button key={prompt} type="button" className="prompt-chip" onClick={() => send(prompt)} disabled={busy}>{prompt}</button>
            ))}
          </div>
          <div className="message-list">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                <span>{message.role === 'user' ? 'You' : 'ODT Guide'}</span>
                <p>{message.content}</p>
              </div>
            ))}
          </div>
          <form className="chat-input" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <input aria-label="Ask ODT Guide" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask ODT Guide..." />
            <button className="primary-button" type="submit" disabled={busy || !input.trim()}>{busy ? 'Thinking' : 'Send'}</button>
          </form>
        </section>
        <aside className="context-panel">
          <Panel title="Current Context" eyebrow="Guide Context">
            <InfoList
              items={[
                ['Provider', data.snapshot?.ai?.provider || 'local'],
                ['Prompt template', 'guide-chat-v1'],
                ['Requests today', data.usage.summary?.requestsToday || 0],
                ['Latest tokens', latestUsage?.totalTokens || 0],
                ['Latest latency', latestUsage ? `${latestUsage.latencyMs} ms` : 'No requests yet']
              ]}
            />
            <div className="button-row vertical">
              <button type="button" className="secondary-button" onClick={() => setActivePage('planner')}>Open Planner</button>
              <button type="button" className="secondary-button" onClick={() => setActivePage('artifacts')}>Open Artifacts</button>
              <button type="button" className="secondary-button" onClick={() => setActivePage('review')}>Open Review Queue</button>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function RunsPage({ data }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Runs"
        title="Execution history and evidence"
        copy="Inspect what happened, when provider selection occurred, and whether usage was logged."
      />
      <div className="two-column wide-left">
        <Panel title="Recent Runs" eyebrow="History">
          <SimpleTable
            columns={['Run', 'Type', 'Status', 'Provider', 'Events']}
            rows={data.runs.map((run) => [
              <button className="link-button" type="button" onClick={() => data.setSelectedRunId(run.id)}>{shortId(run.id)}</button>,
              titleCase(run.requestType),
              <StatusBadge label={titleCase(run.status)} tone={toneFor(run.status)} />,
              run.provider || 'local',
              run.eventCount
            ])}
            empty="No runs yet."
          />
        </Panel>
        <Panel title="Selected Run Timeline" eyebrow={data.selectedRunId ? shortId(data.selectedRunId) : 'No Run'}>
          <Timeline
            events={data.runEvents.map((event) => ({
              title: titleCase(event.eventType),
              detail: safeDetail(event.detail),
              createdAt: event.createdAt,
              status: event.status
            }))}
            empty="Select a run or ask ODT Guide to create one."
          />
        </Panel>
      </div>
    </div>
  );
}

function MonitoringPage({ data }) {
  const summary = data.usage.summary || {};
  const events = data.usage.events || [];
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Monitoring"
        title="AI usage, latency, errors, and fallback visibility"
        copy="Every AI request is tracked for cost awareness, debugging, and future enterprise governance."
      />
      <div className="metric-grid">
        <MetricCard label="Requests" value={summary.requestsToday || 0} detail="Today" tone="info" />
        <MetricCard label="Avg Latency" value={`${summary.avgLatencyMs || 0} ms`} detail="Today" tone="success" />
        <MetricCard label="Total Tokens" value={summary.totalTokensToday || 0} detail="Today" tone="accent" />
        <MetricCard label="Errors" value={summary.errorsToday || 0} detail="Today" tone={summary.errorsToday ? 'danger' : 'success'} />
      </div>
      <Panel title="Usage Events" eyebrow="Audit">
        <SimpleTable
          columns={['Time', 'Type', 'Provider', 'Model', 'Tokens', 'Latency', 'Status']}
          rows={events.map((event) => [
            formatTime(event.createdAt),
            event.requestType,
            event.provider,
            event.model,
            event.totalTokens,
            `${event.latencyMs} ms`,
            <StatusBadge label={titleCase(event.status)} tone={toneFor(event.status)} />
          ])}
          empty="No AI usage events yet. Ask ODT Guide a question to create one."
        />
      </Panel>
    </div>
  );
}

function SettingsPage({ data }) {
  const ai = data.settings?.ai || data.snapshot?.ai || {};
  const connectors = data.settings?.connectors || [];
  const executionAgent = getStoredSetting(data, 'executionAgent', 'codex');
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Settings"
        title="Safe configuration status"
        copy="This page shows only non-secret runtime state. OCI credentials, OCIDs, keys, tokens, and raw profiles stay server-side."
      />
      <div className="two-column">
        <Panel title="AI Provider" eyebrow="Backend-Owned">
          <InfoList
            items={[
              ['Mode', ai.provider || 'local'],
              ['OCI region', ai.region || 'not configured'],
              ['GenAI endpoint', ai.genAiEndpointConfigured ? 'Configured' : 'Missing'],
              ['Compartment', ai.compartmentConfigured ? 'Configured server-side' : 'Missing'],
              ['Chat model', ai.chatModelConfigured ? 'Configured server-side' : 'Local fallback'],
              ['Embed model', ai.embedModelConfigured ? 'Configured server-side' : 'Local placeholder'],
              ['Agent endpoint', ai.agentEndpointConfigured ? 'Configured' : 'Disabled'],
              ['Execution agent', titleCase(executionAgent)],
              ['RAG', ai.ragEnabled ? 'Local evidence corpus' : 'Disabled'],
              ['RAG mode', ai.ragMode || 'local-keyword-rag']
            ]}
          />
        </Panel>
        <Panel title="Limits" eyebrow="Application Guardrails">
          <InfoList
            items={[
              ['Requests per minute', ai.limits?.maxRequestsPerMinute],
              ['Requests per user/day', ai.limits?.maxRequestsPerUserPerDay],
              ['Max input chars', ai.limits?.maxInputChars],
              ['Max output tokens', ai.limits?.maxOutputTokens],
              ['Timeout', `${ai.limits?.requestTimeoutMs || 0} ms`],
              ['Retry count', ai.limits?.retryCount]
            ]}
          />
        </Panel>
      </div>
      <Panel title="Context Intake Limits" eyebrow="Workspace Storage">
        <InfoList
          items={[
            ['Max files/request', data.uploadPolicy?.uploadPolicy?.maxFilesPerRequest],
            ['Max per file', formatBytes(data.uploadPolicy?.uploadPolicy?.maxFileBytes)],
            ['Max batch', formatBytes(data.uploadPolicy?.uploadPolicy?.maxBatchBytes)],
            ['Workspace', data.uploadPolicy?.workspaceDir || 'Missing']
          ]}
        />
        <p className="muted-copy">{data.uploadPolicy?.storageNote || 'Uploaded context is copied into the ODT workspace and target repos remain untouched.'}</p>
      </Panel>
      <Panel title="MCP Integrations" eyebrow="Optional Connectors">
        <SimpleTable
          columns={['Connector', 'Status', 'Mode', 'Write Actions', 'Destructive Actions']}
          rows={connectors.map((connector) => [
            connector.label,
            <StatusBadge label={connector.enabled ? 'Enabled' : 'Disabled'} tone={connector.enabled ? 'success' : 'neutral'} />,
            connector.readOnly ? 'Read-only' : 'Read/write',
            connector.requireWriteApproval ? 'Approval required' : 'Not allowed',
            connector.destructiveBlocked ? 'Blocked' : 'Allowed'
          ])}
        />
      </Panel>
    </div>
  );
}

function Panel({ eyebrow, title, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, detail, tone }) {
  return (
    <section className={`metric-card ${tone || 'neutral'}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </section>
  );
}

function WorkflowProgress({ activeStage }) {
  const stages = [
    ['intake', 'Intake'],
    ['analyze', 'Analyze'],
    ['design', 'Design'],
    ['standards', 'Standards'],
    ['implement', 'Implement'],
    ['test', 'Test'],
    ['pr', 'PR Ready']
  ];
  const activeIndex = Math.max(0, stages.findIndex(([id]) => id === activeStage));
  return (
    <section className="workflow-strip" aria-label="Workflow progress">
      <div>
        <span className="eyebrow">Workflow</span>
        <strong>Requirement to PR readiness</strong>
      </div>
      <ol>
        {stages.map(([id, label], index) => {
          const stepState = index < activeIndex ? 'completed' : index === activeIndex ? 'current' : 'upcoming';
          return (
          <li className={stepState} key={id} aria-current={stepState === 'current' ? 'step' : undefined}>
            <span>{index + 1}</span>
            {label}
          </li>
        );
        })}
      </ol>
    </section>
  );
}

function WorkflowStatePanel({ workflow, onNavigate }) {
  if (!workflow) return null;
  const milestones = [
    ['Requirement', workflow.completed?.requirement],
    ['Repo', workflow.completed?.repo],
    ['Design', workflow.completed?.technicalDesign],
    ['Plan', workflow.completed?.implementationPlan],
    ['Standards', workflow.completed?.standardsCheck],
    ['Write Approval', workflow.completed?.writeApproval],
    ['Handoff', workflow.completed?.agentHandoff],
    ['Implementation Evidence', workflow.completed?.implementationEvidence],
    ['Post Check', workflow.completed?.postImplementationCheck],
    ['PR Pack', workflow.completed?.prPack]
  ];
  const allowed = workflow.allowedActions || {};
  const decisionTrail = workflow.decisionTrail || [];
  return (
    <Panel title="Workflow State Engine" eyebrow="Governed State">
      <div className="workflow-state-grid">
        <div className="workflow-state-lead">
          <StatusBadge label={workflow.state} tone={workflowTone(workflow)} />
          <strong>{workflow.label}</strong>
          <p>{workflow.nextAction?.detail}</p>
          <button className="primary-button" type="button" onClick={() => onNavigate(workflow.nextAction?.page || 'overview')}>
            {workflow.nextAction?.label || 'Continue'}
          </button>
        </div>
        <div className="workflow-milestones" aria-label="Workflow milestones">
          {milestones.map(([label, complete]) => (
            <span className={complete ? 'complete' : 'pending'} key={label}>
              {complete ? 'Done' : 'Pending'}: {label}
            </span>
          ))}
        </div>
        <div className="workflow-transition-list">
          <InfoList
            items={[
              ['Run standards', allowed.canRunStandardsCheck ? 'Available' : 'Waiting'],
              ['Approve write', allowed.canApproveWrite ? 'Available' : 'Locked'],
              ['Delegate write', allowed.canDelegateWrite ? 'Available' : 'Locked'],
              ['Record evidence', allowed.canRecordImplementationEvidence ? 'Available' : 'Waiting'],
              ['Prepare PR', allowed.canPreparePr ? 'Available' : 'Waiting'],
              ['Dependency installs', allowed.dependencyInstallsRequireSeparateApproval ? 'Separate approval' : 'Configured']
            ]}
          />
        </div>
      </div>
      {workflow.blockedReasons?.length ? (
        <SimpleTable
          columns={['Blocked Area', 'Reason', 'Required Action']}
          rows={workflow.blockedReasons.map((reason) => [
            titleCase(reason.category),
            reason.message,
            <button className="table-button" type="button" onClick={() => onNavigate(reason.page || 'standards')}>{reason.action}</button>
          ])}
        />
      ) : null}
      {decisionTrail.length ? (
        <div className="workflow-trail">
          <div className="section-heading">
            <span className="eyebrow">Decision Trail</span>
            <strong>Why the workflow is here</strong>
          </div>
          <SimpleTable
            columns={['When', 'Event', 'Status', 'Evidence', 'Action']}
            rows={decisionTrail.slice(0, 10).map((item) => [
              formatTime(item.createdAt),
              item.label,
              <StatusBadge label={titleCase(item.status)} tone={toneFor(item.status)} />,
              item.detail,
              <button className="table-button" type="button" onClick={() => onNavigate(item.page || 'overview')}>Open {titleCase(item.page || 'overview')}</button>
            ])}
          />
        </div>
      ) : null}
    </Panel>
  );
}

function WorkflowDecisionBar({ workflow, onNavigate }) {
  if (!workflow) return null;
  const blockers = workflow.blockedReasons || [];
  const nextAction = workflow.nextAction || { label: 'Continue', detail: 'Review the current workflow evidence.', page: 'overview' };
  const transitionSummary = workflow.allowedActions
    ? [
      workflow.allowedActions.canRunStandardsCheck ? 'Standards check' : '',
      workflow.allowedActions.canApproveWrite ? 'Write approval' : '',
      workflow.allowedActions.canDelegateWrite ? 'Agent delegation' : '',
      workflow.allowedActions.canRecordImplementationEvidence ? 'Implementation evidence' : '',
      workflow.allowedActions.canPreparePr ? 'PR package' : ''
    ].filter(Boolean).join(', ') || 'No write-side transition unlocked yet'
    : 'Workflow state is loading';

  return (
    <section className={`workflow-decision-bar ${blockers.length ? 'blocked' : 'clear'}`} aria-label="Current workflow decision">
      <div>
        <span className="eyebrow">Current State</span>
        <strong>{workflow.label}</strong>
        <p>{blockers.length ? `Critical blocker: ${blockers[0].message}` : `Available next transition: ${transitionSummary}.`}</p>
      </div>
      <div className="workflow-decision-actions">
        <StatusBadge label={workflow.state} tone={workflowTone(workflow)} />
        <button className={blockers.length ? 'secondary-button' : 'primary-button'} type="button" onClick={() => onNavigate(nextAction.page || 'overview')}>
          {nextAction.label}
        </button>
      </div>
    </section>
  );
}

function StatusBadge({ label, tone, title }) {
  return <span className={`status-badge ${tone || 'neutral'}`} title={title || label}>{label}</span>;
}

function StandardsGateSummary({ findings, latestCheck, gate }) {
  const rows = [
    buildStandardsRow('Accessibility', findings, ['accessibility', 'accessibility-detail'], 'WCAG/VPAT review pending'),
    buildStandardsRow('Security', findings, ['security', 'frontend-secrets'], 'No frontend secrets planned'),
    buildStandardsRow('Dependency', findings, ['dependency', 'dependency-license'], 'No unapproved dependency detected'),
    buildStandardsRow('Testing', findings, ['testing', 'coverage'], 'Test plan evidence pending'),
    buildStandardsRow('PR Readiness', findings, ['pr-readiness', 'approval'], 'PR pack not prepared yet')
  ];
  const status = gate?.implementationBlocked
    ? 'BLOCKED_BY_REVIEW'
    : gate?.writeApproved && !gate?.unresolvedBlockers?.length
    ? gate?.blockerOverride ? 'WRITE_APPROVED_WITH_OVERRIDE' : 'WRITE_APPROVED'
    : latestCheck?.status || 'Not Run';
  return (
    <div className="standards-summary">
      <div className="gate-lead">
        <StatusBadge label={status} tone={standardsTone(status)} />
        <span>{gate?.blockerOverride ? 'Latest blockers were reviewed and overridden with evidence.' : latestCheck ? 'Latest standards evidence is available.' : 'Run Standards Check before write approval.'}</span>
      </div>
      {rows.map((row) => (
        <div className="standard-row" key={row.label}>
          <span>{row.label}</span>
          <StatusBadge label={row.status} tone={standardsTone(row.status)} />
        </div>
      ))}
    </div>
  );
}

function ActionList({ items }) {
  return (
    <div className="action-list">
      {items.map(([title, copy]) => (
        <div className="action-item" key={title}>
          <strong>{title}</strong>
          <span>{copy}</span>
        </div>
      ))}
    </div>
  );
}

function StepperList({ items }) {
  return (
    <ol className="stepper-list">
      {items.map(([title, copy], index) => (
        <li key={title}>
          <span>{index + 1}</span>
          <div>
            <strong>{title}</strong>
            <p>{copy}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Checklist({ items }) {
  const [checkedItems, setCheckedItems] = useState(() => new Set(items.slice(0, 2)));

  function toggle(item) {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }

  return (
    <div className="checklist">
      {items.map((item) => (
        <label key={item}>
          <input type="checkbox" checked={checkedItems.has(item)} onChange={() => toggle(item)} />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

function Timeline({ events, empty }) {
  if (!events.length) return <div className="empty-state">{empty}</div>;
  return (
    <div className="timeline">
      {events.map((event, index) => (
        <div className="timeline-item" key={`${event.title}-${index}`}>
          <span className={`timeline-dot ${toneFor(event.status)}`} />
          <div>
            <strong>{event.title}</strong>
            <p>{event.detail}</p>
            <small>{formatTime(event.createdAt)}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function SimpleTable({ columns, rows, empty }) {
  if (!rows.length) return <div className="empty-state">{empty || 'No records yet.'}</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoList({ items }) {
  return (
    <div className="info-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value === 0 ? 0 : value || 'Missing'}</strong>
        </div>
      ))}
    </div>
  );
}

function JsonBlock({ value }) {
  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>;
}

function parseEvidenceLines(value) {
  return String(value || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseTestEvidenceLines(value) {
  return parseEvidenceLines(value).map((line) => {
    const [nameOrCommand, status, ...notes] = line.split('|').map((part) => part.trim());
    return {
      name: nameOrCommand || 'Test evidence',
      command: nameOrCommand || '',
      status: normalizeEvidenceStatus(status || line),
      notes: notes.join(' | ')
    };
  });
}

function normalizeEvidenceStatus(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('fail') || normalized.includes('error')) return 'failed';
  if (normalized.includes('skip')) return 'skipped';
  if (normalized.includes('not run') || normalized.includes('pending')) return 'not_run';
  if (normalized.includes('pass') || normalized.includes('success') || normalized.includes('ok')) return 'passed';
  return 'unknown';
}

function workflowStateFromData(data) {
  return data.evidence?.workflowState || data.snapshot?.assignments?.[0]?.workflowState || null;
}

function workflowAllows(workflow, key, fallback = false) {
  const value = workflow?.allowedActions?.[key];
  return typeof value === 'boolean' ? value : fallback;
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

function activeStandardsFindings(evidence) {
  return evidence?.standardsChecks?.[0]?.findings || evidence?.standardsFindings || [];
}

function standardsGateState(evidence) {
  const latestCheck = evidence?.standardsChecks?.[0] || null;
  const findings = activeStandardsFindings(evidence);
  const approvals = evidence?.approvals || [];
  const reviewBlockers = (evidence?.reviewComments || []).filter((comment) => comment.status === 'open' && comment.severity === 'blocker');
  const blockerOverride = hasRecentApproval(approvals, ['standards_blocker_override', 'blocker_override'], latestCheck?.createdAt);
  const warningOverride = hasRecentApproval(approvals, ['standards_warning_override', 'warning_override'], latestCheck?.createdAt);
  const writeApproval = latestApproval(approvals, ['write_scope', 'approved_to_write', 'APPROVED_TO_WRITE']);
  const blockDecision = latestApproval(approvals, ['block_implementation']);
  const writeApprovalIsCurrent = latestCheck
    ? new Date(writeApproval?.approvedAt || 0).getTime() >= new Date(latestCheck.createdAt).getTime()
    : false;
  const implementationBlocked = Boolean(
    reviewBlockers.length
    || (blockDecision && (!writeApproval || new Date(blockDecision.approvedAt).getTime() > new Date(writeApproval.approvedAt).getTime()))
  );
  const writeApproved = Boolean(writeApproval && writeApprovalIsCurrent && !implementationBlocked);
  const blockerFindings = findings.filter((finding) => finding.status === 'BLOCKER');
  const unresolvedBlockers = blockerOverride ? [] : blockerFindings;
  return {
    latestCheck,
    findings,
    approvals,
    blockerFindings,
    unresolvedBlockers,
    reviewBlockers,
    blockerOverride,
    warningOverride,
    writeApproved,
    implementationBlocked
  };
}

function latestApproval(approvals, types) {
  return approvals
    .filter((approval) => types.includes(approval.approvalType) && ['approved', 'blocked'].includes(approval.status))
    .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime())[0] || null;
}

function hasRecentApproval(approvals, types, since) {
  return approvals.some((approval) => {
    if (approval.status !== 'approved' || !types.includes(approval.approvalType)) return false;
    if (!since) return true;
    return new Date(approval.approvedAt).getTime() >= new Date(since).getTime();
  });
}

function getStoredSetting(data, key, fallback) {
  const setting = data.settings?.storedSettings?.find((item) => item.key === key);
  if (!setting) return fallback;
  try {
    return JSON.parse(setting.value);
  } catch {
    return setting.value || fallback;
  }
}

function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="error-banner">
      <strong>Workbench backend is not reachable.</strong>
      <span>{error}</span>
    </div>
  );
}

function titleCase(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toneFor(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('fail') || text.includes('error') || text.includes('block')) return 'danger';
  if (text.includes('wait') || text.includes('review') || text.includes('pending')) return 'warning';
  if (text.includes('ready') || text.includes('ok') || text.includes('done') || text.includes('online')) return 'success';
  return 'neutral';
}

function standardsTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('block')) return 'danger';
  if (text.includes('warning') || text.includes('approval') || text.includes('review') || text.includes('required')) return 'warning';
  if (text.includes('pass') || text.includes('approved') || text.includes('ready')) return 'success';
  return 'neutral';
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

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return 'Not set';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let next = bytes / 1024;
  let index = 0;
  while (next >= 1024 && index < units.length - 1) {
    next /= 1024;
    index += 1;
  }
  return `${next >= 10 ? next.toFixed(0) : next.toFixed(1)} ${units[index]}`;
}

function formatTime(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value));
}

function shortId(value) {
  return String(value || '').replace(/^run_/, 'run ').slice(0, 18);
}

function safeDetail(detail) {
  try {
    const parsed = JSON.parse(detail || '{}');
    return Object.entries(parsed)
      .map(([key, value]) => `${key}: ${typeof value === 'object' && value !== null ? JSON.stringify(value) : value}`)
      .join(', ') || 'No detail';
  } catch {
    return String(detail || 'No detail');
  }
}

createRoot(document.getElementById('root')).render(<App />);
