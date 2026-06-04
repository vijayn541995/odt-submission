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
  { id: 'lead-planner', name: 'Lead Planner', status: 'Ready', scope: 'Clarify scope, gaps, sequence, risks, and worker split', mode: 'Read-only planning', requiresWrite: false },
  { id: 'fullstack-dev', name: 'Senior Full Stack Dev', status: 'Waiting', scope: 'IC4-style end-to-end implementation across UI, API integration, state, utilities, tests, and architecture tradeoffs', mode: 'Approved writes only', requiresWrite: true },
  { id: 'backend-dev', name: 'Backend Dev', status: 'Waiting', scope: 'APIs, data flow, utilities, service integration, backend-facing tests', mode: 'Approved writes only', requiresWrite: true },
  { id: 'frontend-dev', name: 'Frontend Dev', status: 'Waiting', scope: 'UI behavior, component state, accessibility, validation, frontend tests', mode: 'Approved writes only', requiresWrite: true },
  { id: 'reviewer', name: 'Reviewer', status: 'Ready', scope: 'Risk, diff, test, security, accessibility, standards review', mode: 'Read-only review', requiresWrite: false },
  { id: 'build-verifier', name: 'Build Verifier', status: 'Waiting', scope: 'Run approved build/test commands and capture verification evidence', mode: 'Approved test commands', requiresWrite: true }
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

const foundrySourceOptions = [
  { id: 'requirement', label: 'Requirement/Jira' },
  { id: 'repo-analysis', label: 'Repo Analysis' },
  { id: 'technical-design', label: 'Technical Design' },
  { id: 'implementation-plan', label: 'Implementation Plan' },
  { id: 'standards-evidence', label: 'Standards Evidence' },
  { id: 'artifact-evidence', label: 'Artifacts' }
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
  const [agentFoundry, setAgentFoundry] = useState(null);
  const [agentWorkers, setAgentWorkers] = useState(null);
  const [executionHealth, setExecutionHealth] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const [snapshotResult, settingsResult, usageResult, runsResult, standardsResult, evidenceResult, uploadPolicyResult, agentFoundryResult, agentWorkersResult, executionHealthResult] = await Promise.all([
        getJson('/api/snapshot'),
        getJson('/api/settings'),
        getJson('/api/monitoring/ai-usage'),
        getJson('/api/runs'),
        getJson('/api/standards'),
        getJson('/api/assignments/assignment-local-mvp/evidence'),
        getJson('/api/intake/upload-policy'),
        getJson('/api/agent-foundry/domains'),
        getJson('/api/agents/worker-roles'),
        getJson('/api/agents/execution-health?assignmentId=assignment-local-mvp')
      ]);
      setSnapshot(snapshotResult);
      setSettings(settingsResult);
      setUsage(usageResult);
      setRuns(runsResult.runs || []);
      setStandards(standardsResult);
      setEvidence(evidenceResult);
      setUploadPolicy(uploadPolicyResult);
      setAgentFoundry(agentFoundryResult);
      setAgentWorkers(agentWorkersResult);
      setExecutionHealth(executionHealthResult);
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
    agentFoundry,
    agentWorkers,
    executionHealth,
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
  const workbenchApiOnline = !data.error && !data.loading;
  const contextOnline = data.snapshot?.odtContext?.online;
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
        <StatusBadge label={`Workbench API: ${workbenchApiOnline ? 'Online' : 'Offline'}`} tone={workbenchApiOnline ? 'success' : 'warning'} title="ODT Workbench backend API status" />
        <StatusBadge label={`Context: ${contextOnline ? 'Online' : 'Offline'}`} tone={contextOnline ? 'success' : 'warning'} title={`Optional ODT context API: ${data.snapshot?.odtContext?.apiBase || 'not configured'}`} />
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
  const workBrief = currentWorkBrief(data);
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
        title={workBrief.hasRealWork ? workBrief.title : 'Requirement to PR-ready workbench'}
        copy={workBrief.hasRealWork
          ? `${workBrief.domain}. ODT is tracking repo evidence, behavior rules, standards gates, approvals, tests, and PR readiness for this work item.`
          : 'Guide a real engineering change from requirement and repo intake through codebase analysis, gap discovery, technical design, compliance planning, implementation review, testing, and PR readiness.'}
        actions={(
          <>
            <button className="primary-button" type="button" onClick={() => setActivePage('intake')}>New Intake</button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('guide')}>Open ODT Guide</button>
            <button className="secondary-button" type="button" onClick={() => setActivePage('standards')}>View Standards</button>
          </>
        )}
      />
      <ErrorBanner error={data.error} />
      <CurrentWorkBrief data={data} onNavigate={setActivePage} />
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
  const latestPlan = data.evidence?.implementationPlans?.[0]?.planJson || {};
  const latestDesign = data.evidence?.technicalDesigns?.[0]?.designJson || {};
  const latestRequirement = data.evidence?.requirements?.[0] || {};
  const requirementSignals = data.evidence?.requirementSignals || {};
  const workBrief = currentWorkBrief(data);
  const clarificationGate = resolvedClarificationGate(
    latestPlan.clarificationGate || latestDesign.clarificationGate || requirementSignals.clarifyingQuestions,
    data
  );
  const unresolvedClarifications = clarificationGate.filter(isClarificationOpen);
  const planTitle = latestPlan.title || latestDesign.title || latestRequirement.summary || 'Implementation Plan';
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
        title={planTitle}
        copy={workBrief.hasRealWork
          ? `Plan evidence for ${workBrief.repoName || 'the selected repo'}: ${summarizeItems(workBrief.behaviors, 'review the captured requirement, repo signals, standards findings, and test plan before approval.', 2)}`
          : 'The plan should cover scope, impacted files, API/data/UI changes, validation, accessibility, security, performance, tests, rollback, and open questions before writes are approved.'}
      />
      {notice ? <div className="info-banner" role="status">{notice}</div> : null}
      <WorkflowDecisionBar workflow={workflow} onNavigate={setActivePage} />
      <CurrentWorkBrief data={data} onNavigate={setActivePage} compact />
      <div className="two-column wide-left">
        <Panel title="Plan Summary" eyebrow="Draft Plan">
          <ActionList
            items={[
              [planTitle, summarizeItems(latestPlan.scope || latestDesign.scope, 'Generate a plan to create requirement-specific scope evidence.')],
              ['Frontend behavior', summarizeItems(latestPlan.frontendTasks, 'Frontend behavior tasks have not been captured yet.')],
              ['Validation and API rules', summarizeItems([...(latestPlan.validationTasks || []), ...(latestPlan.backendTasks || [])], 'Validation and API rules have not been captured yet.')],
              ['Targeted tests', summarizeItems(latestPlan.testTasks || data.evidence?.testPlans?.[0]?.planJson?.targetedCommands, 'Targeted tests have not been captured yet.')]
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
      <div className="two-column">
        <Panel title="Requirement-Specific Evidence" eyebrow="Plan Inputs">
          <InfoList
            items={[
              ['Assignment', data.evidence?.assignment?.title || planTitle],
              ['Target repo', requirementSignals.targetRepo || latestDesign.targetRepo || data.evidence?.assignment?.repoPath],
              ['API endpoint', requirementSignals.endpoint || latestDesign.apiChanges?.[0] || 'Not captured'],
              ['Domain', requirementSignals.domainSignals?.assessment ? 'Assessment activity workflow' : 'General workflow']
            ]}
          />
        </Panel>
        <Panel title="Impacted Files and Tests" eyebrow="Implementation Surface">
          <SimpleTable
            columns={['Type', 'Evidence']}
            rows={[
              ['Files to change', summarizeItems(latestPlan.filesToChange, 'Not captured yet.')],
              ['Files to review', summarizeItems(latestPlan.filesToReview || latestDesign.candidateFiles, 'Not captured yet.')],
              ['Test commands/files', summarizeItems(latestPlan.testTasks, 'Not captured yet.')],
              ['Clarifications', clarificationGate.length ? unresolvedClarifications.length ? `${unresolvedClarifications.length} question(s) need a decision.` : `${clarificationGate.length} demo decision(s) captured.` : 'No clarification gate generated yet.']
            ]}
          />
        </Panel>
      </div>
      <Panel title="Clarification Gate" eyebrow="Before Write Approval">
        <SimpleTable
          columns={['Status', 'Question', 'Decision / Assumption', 'Owner']}
          rows={clarificationGate.map((item) => [
            <StatusBadge label={item.severity || 'NEEDS_REVIEW'} tone={standardsTone(item.severity || 'NEEDS_REVIEW')} />,
            item.question,
            item.decision || item.defaultAssumption,
            item.decisionOwner || 'Developer'
          ])}
          empty="No clarification questions captured. Codex may still raise implementation-time questions if repo analysis finds new ambiguity."
        />
      </Panel>
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
  const workBrief = currentWorkBrief(data);
  const gate = standardsGateState(evidence);
  const latestCheck = gate.latestCheck;
  const findings = gate.findings;
  const blockers = gate.unresolvedBlockers;
  const reviewBlockers = gate.reviewBlockers || [];
  const reviewedBlockers = gate.blockerFindings;
  const hardSafetyBlockers = gate.hardSafetyBlockers || [];
  const approvals = evidence.approvals || [];
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
      if (hardSafetyBlockers.length) {
        setNotice(`${hardSafetyBlockers.length} hard safety blocker(s) were reviewed, but write approval remains locked. Resolve frontend secrets/destructive-action findings or use the separate dependency approval path, then rerun Standards Check.`);
      } else {
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
      <CurrentWorkBrief data={data} onNavigate={setActivePage} compact />
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
              ['Blockers', hardSafetyBlockers.length ? `${hardSafetyBlockers.length} hard safety blocker(s)` : reviewedBlockers.length ? gate.blockerOverride ? 'Reviewed override captured' : 'Review or override required' : 'None open'],
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

function AgentFoundryPanel({ setActivePage, data }) {
  const registry = data.agentFoundry || {};
  const domains = registry.domains || [];
  const phases = registry.phases || [];
  const evidence = data.evidence || {};
  const foundryRuns = evidence.agentFoundryRuns || [];
  const [phase, setPhase] = useState('full-sdlc');
  const [domainId, setDomainId] = useState(domains[0]?.id || 'requirements');
  const [sources, setSources] = useState(foundrySourceOptions.map((option) => option.id));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const latestRunId = foundryRuns[0]?.runId || '';
  const latestRunEntries = latestRunId ? foundryRuns.filter((run) => run.runId === latestRunId) : [];
  const latestRunStatus = latestRunEntries.some((run) => run.status === 'NEEDS_REVIEW')
    ? 'NEEDS_REVIEW'
    : latestRunEntries.some((run) => run.status === 'WARNING')
      ? 'WARNING'
      : latestRunEntries.length ? 'PASS' : 'Not Started';

  useEffect(() => {
    if (!domains.length) return;
    setDomainId((current) => domains.some((domain) => domain.id === current) ? current : domains[0].id);
  }, [domains]);

  function toggleSource(sourceId) {
    setSources((current) => (
      current.includes(sourceId)
        ? current.filter((item) => item !== sourceId)
        : [...current, sourceId]
    ));
  }

  async function runFoundryReview() {
    setBusy(true);
    setNotice('');
    try {
      const result = await postJson('/api/agent-foundry/run', {
        assignmentId: 'assignment-local-mvp',
        phase,
        domainId,
        inputSources: sources
      });
      setNotice(`${result.phaseLabel} review saved as evidence. ${result.domainsReviewed} specialist domain(s) reviewed. Status: ${result.status}.`);
      await data.refresh();
    } catch (err) {
      setNotice(err.message || 'Unable to run Agent Foundry review.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Agent Foundry" eyebrow="Specialist Reviews">
      <div className="agent-contract-note">
        <div>
          <strong>Governed specialist review</strong>
          <p>Run Full SDLC or focused domain reviews from current assignment evidence. Outputs are saved as Artifacts and remain review-only.</p>
        </div>
        <StatusBadge label="AI-generated suggestion" tone="info" />
      </div>
      <div className="two-column foundry-controls">
        <div className="form-stack">
          <label className="field" htmlFor="foundry-phase">
            <span>Review mode</span>
            <select id="foundry-phase" value={phase} onChange={(event) => setPhase(event.target.value)}>
              {(phases.length ? phases : [{ id: 'full-sdlc', label: 'Full SDLC' }, { id: 'focused-domain', label: 'Focused Domain' }]).map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor="foundry-domain">
            <span>Specialist domain</span>
            <select
              id="foundry-domain"
              value={domainId}
              onChange={(event) => setDomainId(event.target.value)}
              disabled={phase === 'full-sdlc'}
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>{domain.label} - {domain.specialist}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-stack">
          <fieldset className="checkbox-group">
            <legend>Input sources</legend>
            {foundrySourceOptions.map((option) => (
              <label key={option.id} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={sources.includes(option.id)}
                  onChange={() => toggleSource(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </div>
      <InfoList
        items={[
          ['Domains', `${domains.length || 10} specialist review areas`],
          ['Latest Foundry status', latestRunStatus],
          ['Human review', 'Required before write/delegate decisions'],
          ['AutoGPT/AutoGen', 'Not in core for this slice']
        ]}
      />
      <div className="button-row">
        <button className="primary-button" type="button" onClick={runFoundryReview} disabled={busy || !domains.length || !sources.length}>
          {busy ? 'Running Review' : phase === 'full-sdlc' ? 'Run Full SDLC Review' : 'Run Specialist Review'}
        </button>
        <button className="secondary-button" type="button" onClick={() => setActivePage('artifacts')}>
          Open Foundry Evidence
        </button>
      </div>
      {notice ? <p className="muted-copy">{notice}</p> : null}
      {latestRunEntries.length ? (
        <SimpleTable
          columns={['Specialist', 'Status', 'Summary']}
          rows={latestRunEntries.slice(0, 5).map((entry) => [
            entry.output?.specialistName || entry.domainLabel,
            <StatusBadge label={entry.status} tone={standardsTone(entry.status)} />,
            entry.output?.summary || 'Specialist review saved.'
          ])}
        />
      ) : (
        <p className="muted-copy">No Agent Foundry evidence yet. Run a specialist review to create the first saved output.</p>
      )}
    </Panel>
  );
}

function ExecutionHealthPanel({ health, selectedAgent, selectedAdapter, issues = [], onRefresh }) {
  const adapterOrder = ['codex', 'cline', 'oci-genai', 'ollama', 'openai'];
  const adapters = health?.adapters || {};
  const checkedAt = health?.checkedAt ? formatTime(health.checkedAt) : 'Not checked';
  const selectedLabel = selectedAdapter?.label || titleCase(selectedAgent);
  return (
    <Panel title="Execution Health" eyebrow="Adapter Readiness">
      <div className="execution-health-head">
        <div>
          <span className="eyebrow">Selected Adapter</span>
          <strong>{selectedLabel}</strong>
          <p>
            ODT launches only healthy, allowlisted adapters. Provider authentication remains with the local CLI, IDE, SSO, or approved provider configuration; ODT stores evidence and health, not secrets.
          </p>
        </div>
        <div className="button-row compact-buttons">
          <StatusBadge label={selectedAdapter ? titleCase(selectedAdapter.status) : 'Not Checked'} tone={adapterTone(selectedAdapter?.status)} />
          <button className="secondary-button" type="button" onClick={onRefresh}>
            Refresh Health
          </button>
        </div>
      </div>
      <div className="adapter-health-grid">
        {adapterOrder.map((adapterId) => {
          const adapter = adapters[adapterId];
          if (!adapter) return null;
          return (
            <div className={`adapter-health-card ${adapterTone(adapter.status)}`} key={adapterId}>
              <div className="adapter-health-title">
                <strong>{adapter.label || titleCase(adapterId)}</strong>
                <StatusBadge label={titleCase(adapter.status)} tone={adapterTone(adapter.status)} />
              </div>
              <p>{adapter.message || adapter.capability}</p>
              <InfoList
                items={[
                  ['Capability', adapter.capability || 'Provider adapter'],
                  ['Launch', adapter.launchSupported ? 'Direct launch allowed' : adapter.handoffSupported ? 'Handoff only' : 'Not wired'],
                  ['Auth owner', adapter.authModel || 'External provider configuration'],
                  ['Version', adapter.version || 'Not applicable'],
                  ['Executable', adapter.executable || 'Not configured']
                ]}
              />
            </div>
          );
        })}
      </div>
      <div className="execution-issue-list">
        <div className="execution-issue-head">
          <strong>Recent Adapter Issues</strong>
          <span>Last checked {checkedAt}</span>
        </div>
        {issues.length ? (
          issues.slice(0, 4).map((issue) => (
            <div className="execution-issue-card" key={issue.id}>
              <StatusBadge label={titleCase(issue.status)} tone={toneFor(issue.status)} />
              <div>
                <strong>{titleCase(issue.eventType || issue.source)}</strong>
                <p>{issue.message || 'Adapter issue captured.'}</p>
                <span>{issue.createdAt ? formatTime(issue.createdAt) : 'Time not recorded'}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="muted-copy">No adapter launch or health issues have been captured for this assignment.</p>
        )}
      </div>
    </Panel>
  );
}

function AgentTeamPage({ setActivePage, data }) {
  const storedAgent = getStoredSetting(data, 'executionAgent', 'codex');
  const [selectedAgent, setSelectedAgent] = useState(storedAgent);
  const [selectedWorkerRole, setSelectedWorkerRole] = useState('fullstack-dev');
  const [selectedWorkerRunId, setSelectedWorkerRunId] = useState('');
  const [selectedRelayId, setSelectedRelayId] = useState('');
  const [relayDecision, setRelayDecision] = useState('');
  const [relayTargetRole, setRelayTargetRole] = useState('');
  const [agentNotice, setAgentNotice] = useState('');
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [liveTailEnabled, setLiveTailEnabled] = useState(true);
  const selectedAgentConfig = executionAgents.find((agent) => agent.id === selectedAgent) || executionAgents[0];
  const selectedWorker = teamRoles.find((role) => role.id === selectedWorkerRole) || teamRoles[0];
  const workflow = workflowStateFromData(data);
  const gate = standardsGateState(data.evidence);
  const blockers = gate.unresolvedBlockers;
  const reviewBlockers = gate.reviewBlockers || [];
  const writeApproved = gate.writeApproved;
  const writeMode = workflowAllows(workflow, 'canDelegateWrite', Boolean(writeApproved && !blockers.length && !reviewBlockers.length));
  const selectedWorkerNeedsWrite = Boolean(selectedWorker.requiresWrite);
  const executionAdapters = data.executionHealth?.adapters || {};
  const selectedExecutionHealth = executionAdapters[selectedAgent] || null;
  const codexExecutionHealth = executionAdapters.codex || null;
  const codexLaunchHealthy = codexExecutionHealth?.status === 'healthy';
  const executionHealthIssues = data.executionHealth?.issues || [];
  const canLaunchCodexWorker = selectedAgent === 'codex' && codexLaunchHealthy && (!selectedWorkerNeedsWrite || writeMode);
  const approvedDependencies = (data.evidence?.dependencyRequests || []).filter((request) => request.status === 'approved');
  const pendingDependencies = (data.evidence?.dependencyRequests || []).filter((request) => request.status === 'pending');
  const workerRuns = data.evidence?.agentWorkerRuns || [];
  const relayItems = data.evidence?.agentRelayItems || [];
  const selectedWorkerRun = workerRuns.find((run) => run.id === selectedWorkerRunId) || workerRuns[0] || null;
  const selectedRelayItem = relayItems.find((item) => item.id === selectedRelayId) || relayItems[0] || null;
  const latestPlan = data.evidence?.implementationPlans?.[0]?.planJson || {};
  const sharedTaskItems = normalizeList(latestPlan.frontendTasks || latestPlan.scope).slice(0, 5);

  useEffect(() => {
    setSelectedAgent(storedAgent);
  }, [storedAgent]);

  useEffect(() => {
    if (!workerRuns.length) {
      setSelectedWorkerRunId('');
      return;
    }
    setSelectedWorkerRunId((current) => workerRuns.some((run) => run.id === current) ? current : workerRuns[0].id);
  }, [workerRuns]);

  useEffect(() => {
    if (!relayItems.length) {
      setSelectedRelayId('');
      setRelayTargetRole('');
      return;
    }
    const nextRelay = relayItems.find((item) => item.id === selectedRelayId) || relayItems[0];
    setSelectedRelayId(nextRelay.id);
    setRelayTargetRole((current) => current || nextRelay.targetWorkerRole || '');
  }, [relayItems, selectedRelayId]);

  useEffect(() => {
    if (!selectedRelayItem) return;
    setRelayTargetRole(selectedRelayItem.targetWorkerRole || '');
    setRelayDecision(selectedRelayItem.decision?.decision || '');
  }, [selectedRelayItem?.id]);

  useEffect(() => {
    if (!selectedWorkerRun?.id || !selectedWorkerRun.statusFile || !liveTailEnabled) return undefined;
    if (!isWorkerRunActive(selectedWorkerRun.status)) return undefined;
    const timer = window.setInterval(() => {
      postJson(`/api/agents/worker-runs/${encodeURIComponent(selectedWorkerRun.id)}/status`, {
        assignmentId: 'assignment-local-mvp'
      })
        .then(() => data.refresh())
        .catch(() => {
          // Keep live tail best-effort; explicit refresh still reports errors to the user.
        });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [selectedWorkerRun?.id, selectedWorkerRun?.status, selectedWorkerRun?.statusFile, liveTailEnabled]);

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

  async function delegateAgentHandoff({ requireWriteApproved = writeMode } = {}) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson('/api/agents/delegate', {
        assignmentId: 'assignment-local-mvp',
        executionAgent: selectedAgent,
        requireWriteApproved,
        notes: requireWriteApproved
          ? 'Prepared from Agent Team with write approval.'
          : 'Prepared from Agent Team as a read-only planning handoff. Target repository writes remain locked.'
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

  async function launchCodexWorker() {
    if (!canLaunchCodexWorker) {
      setAgentNotice(selectedAgent === 'codex'
        ? !codexLaunchHealthy
          ? 'Codex CLI adapter is not healthy. Review Execution Health before launching a terminal worker.'
          : `${selectedWorker.name} is waiting on Standards, review blockers, or write approval. Read-only lanes can still run for planning/review.`
        : 'Terminal launch is wired for Codex in this slice. Use governed handoff for Cline or Manual.');
      return;
    }
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson('/api/agents/launch-worker', {
        assignmentId: 'assignment-local-mvp',
        executionAgent: selectedAgent,
        workerRole: selectedWorkerRole,
        launchMode: 'terminal',
        notes: `Launched ${selectedWorker.name} from Agent Team.`
      });
      const launch = result.launch || {};
      if (result.status === 'launched') {
        setAgentNotice(`${selectedWorker.name} launched in Terminal with Codex. Bundle: ${launch.bundleDir}. Response: ${launch.responseFile}.`);
      } else if (result.status === 'manual_fallback') {
        setAgentNotice(`${selectedWorker.name} bundle is ready, but Terminal launch needs manual start: ${launch.manualCommand}`);
      } else {
        setAgentNotice(`${selectedWorker.name} bundle prepared: ${launch.bundleDir || 'workspace bundle'}.`);
      }
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to launch Codex worker.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function ingestWorkerRun(workerRunId) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/agents/worker-runs/${encodeURIComponent(workerRunId)}/ingest`, {
        assignmentId: 'assignment-local-mvp'
      });
      const worker = result.workerRun || {};
      setAgentNotice(`${worker.workerRoleLabel || 'Worker'} output ingested. Status: ${titleCase(worker.status || 'completed')}.`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to ingest worker output yet.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function refreshWorkerRunStatus(workerRunId) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/agents/worker-runs/${encodeURIComponent(workerRunId)}/status`, {
        assignmentId: 'assignment-local-mvp'
      });
      const worker = result.workerRun || {};
      setAgentNotice(`${worker.workerRoleLabel || 'Worker'} status refreshed: ${titleCase(worker.status || 'unknown')}. Response: ${formatBytes(result.responseBytes || 0)}. Log: ${formatBytes(result.logBytes || 0)}.`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to refresh worker status.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function stopWorkerRun(workerRunId) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/agents/worker-runs/${encodeURIComponent(workerRunId)}/stop`, {
        assignmentId: 'assignment-local-mvp',
        reason: 'Developer requested stop from ODT Agent Team.'
      });
      const signal = result.signalResult?.status === 'sent' ? ' SIGINT sent to the Codex worker.' : '';
      setAgentNotice(`${result.message || 'Worker stop requested.'}${signal} ${result.manualStopGuidance || ''}`.trim());
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to request worker stop.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function deriveImplementationEvidence(workerRunId) {
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/implementation/evidence/from-worker/${encodeURIComponent(workerRunId)}`, {
        assignmentId: 'assignment-local-mvp',
        runPostCheck: true
      });
      const extracted = result.extracted || {};
      setAgentNotice(`Implementation evidence ${shortId(result.evidence?.id)} recorded from worker output. Extracted ${extracted.changedFiles?.length || 0} file(s), ${extracted.commands?.length || 0} command(s), and ${extracted.tests?.length || 0} test item(s).`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to derive implementation evidence from this worker output.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  function useRelayForNextWorker(relayItem) {
    if (!relayItem) return;
    const nextRole = relayItem.targetWorkerRole || relayTargetRole || 'reviewer';
    setSelectedRelayId(relayItem.id);
    setSelectedWorkerRole(nextRole);
    setRelayTargetRole(nextRole);
    setAgentNotice(`${relayItem.title || 'Relay item'} is selected. Launch ${teamRoles.find((role) => role.id === nextRole)?.name || titleCase(nextRole)} to receive this context in the worker prompt.`);
  }

  async function decideRelayItem(action) {
    if (!selectedRelayItem) {
      setAgentNotice('No relay item is selected.');
      return;
    }
    if (['answer', 'resolve'].includes(action) && !relayDecision.trim()) {
      setAgentNotice('Add decision notes before answering or resolving a relay item.');
      return;
    }
    setHandoffBusy(true);
    setAgentNotice('');
    try {
      const result = await postJson(`/api/agents/relay/${encodeURIComponent(selectedRelayItem.id)}/decision`, {
        assignmentId: 'assignment-local-mvp',
        action,
        decision: relayDecision,
        targetWorkerRole: relayTargetRole || selectedRelayItem.targetWorkerRole || '',
        targetLane: teamRoles.find((role) => role.id === (relayTargetRole || selectedRelayItem.targetWorkerRole))?.name || selectedRelayItem.targetLane || '',
        decidedBy: 'local-user'
      });
      const relay = result.relayItem || {};
      setAgentNotice(`Relay item ${shortId(relay.id)} marked ${titleCase(relay.status || action)}. Future worker prompts will include the updated relay context.`);
      await data.refresh();
    } catch (err) {
      setAgentNotice(err.message || 'Unable to update relay item.');
      await data.refresh();
    } finally {
      setHandoffBusy(false);
    }
  }

  async function copyWorkerRunText(value, label) {
    const copied = await copyTextToClipboard(value || '');
    setAgentNotice(copied ? `${label} copied.` : `${label} is available in Worker Run Detail, but clipboard access was blocked.`);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Agent Team"
        title="Agentic SDLC worker lanes"
        copy="Choose a worker lane, select the execution engine, and launch governed Codex sessions with shared ODT evidence. Advisory lanes run read-only; implementation and verification lanes require write approval."
        actions={<StatusBadge label={workflow?.state || (writeMode ? 'Governance: WRITE_APPROVED' : 'Governance: PLAN_REVIEW')} tone={workflowTone(workflow || (writeMode ? 'APPROVED_TO_WRITE' : 'PLAN_REVIEW'))} />}
      />
      <WorkflowDecisionBar workflow={workflow} onNavigate={setActivePage} />
      <CurrentWorkBrief data={data} onNavigate={setActivePage} compact />
      <Panel title="Team Operating Model" eyebrow="How Agent Team Works">
        <SimpleTable
          columns={['Lane', 'Engine', 'Parallel Policy', 'ODT Gate']}
          rows={[
            ['Developer Control Plane', 'ODT Workbench', 'Always active; owns state, approvals, and evidence.', 'Human review and standards evidence remain source of truth.'],
            ['Specialist Review', 'ODT Agent Foundry via local/OCI-ready provider', 'Can run Full SDLC or focused read-only reviews without file writes.', 'Outputs are AI-generated suggestions and require human review.'],
            ['Implementation Worker', titleCase(selectedAgent), writeMode ? 'Write-approved handoff available for supervised execution.' : 'Read-only planning handoff only; target repo writes remain locked.', writeMode ? 'Latest standards check and write approval are current.' : 'Use Standards to approve or override before write delegation.'],
            ['Parallel Code Work', 'Codex CLI / Cline / future agent runners', 'Recommended only after ODT partitions files or modules to prevent conflicting edits.', 'Each worker must return changed files, commands, tests, risks, and notes as evidence.'],
            ['Dependency Install', 'Selected worker after package approval', 'Never parallel by default.', 'Separate dependency request approval required before install.']
          ]}
        />
      </Panel>
      <AgentFoundryPanel setActivePage={setActivePage} data={data} />
      <ExecutionHealthPanel
        health={data.executionHealth}
        selectedAgent={selectedAgent}
        selectedAdapter={selectedExecutionHealth}
        issues={executionHealthIssues}
        onRefresh={data.refresh}
      />
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
        <div className="worker-lane-grid" role="radiogroup" aria-label="Select worker lane">
          {teamRoles.map((role) => {
            const roleReady = !role.requiresWrite || writeMode;
            return (
              <button
                className={`worker-lane-card ${selectedWorkerRole === role.id ? 'selected' : ''}`}
                type="button"
                key={role.id}
                role="radio"
                aria-checked={selectedWorkerRole === role.id}
                onClick={() => setSelectedWorkerRole(role.id)}
              >
                <div className="role-avatar">{role.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <strong>{role.name}</strong>
                  <p>{role.scope}</p>
                  <span>{role.mode}</span>
                </div>
                <StatusBadge label={roleReady ? 'Ready' : 'Needs Write Approval'} tone={roleReady ? 'success' : 'warning'} />
              </button>
            );
          })}
        </div>
        <div className="handoff-toolbar">
          <InfoList
            items={[
              ['Write approval', writeApproved ? 'Captured' : 'Required'],
              ['Review decision', gate.implementationBlocked ? 'Implementation blocked' : 'No active block'],
              ['Critical blockers', blockers.length || reviewBlockers.length ? `${blockers.length + reviewBlockers.length} unresolved` : gate.blockerOverride ? 'Reviewed override' : 'None'],
              ['Dependency installs', approvedDependencies.length ? `${approvedDependencies.length} approved package(s)` : pendingDependencies.length ? `${pendingDependencies.length} pending approval` : 'Blocked'],
              ['Selected lane', selectedWorker.name],
              ['Lane access', selectedWorker.requiresWrite ? (writeMode ? 'write-approved' : 'locked until approval') : 'read-only'],
              ['Adapter health', selectedExecutionHealth ? titleCase(selectedExecutionHealth.status) : 'Not checked'],
              ['Terminal worker', selectedAgent === 'codex' ? (!codexLaunchHealthy ? 'Codex adapter unhealthy' : canLaunchCodexWorker ? `Ready to launch ${selectedWorker.name}` : 'Locked until write-approved') : 'Handoff only for this engine']
            ]}
          />
          <div className="button-row">
            {selectedAgent === 'codex' ? (
              <button
                className="primary-button"
                type="button"
                onClick={launchCodexWorker}
                disabled={handoffBusy || !canLaunchCodexWorker}
                title={canLaunchCodexWorker
	                  ? 'Create the ODT worker bundle and open a visible Terminal running Codex CLI.'
	                  : !codexLaunchHealthy
	                    ? 'Review Execution Health and fix the Codex CLI adapter before launching.'
	                    : 'Review findings, override accepted blockers if needed, and approve write scope before launching Codex.'}
	              >
                {handoffBusy ? 'Preparing' : `Launch ${selectedWorker.name}`}
              </button>
            ) : (
              <button
                className="primary-button"
                type="button"
                onClick={() => delegateAgentHandoff({ requireWriteApproved: writeMode })}
                disabled={handoffBusy}
                title={writeMode
                  ? `Prepare and copy a write-approved handoff run for ${titleCase(selectedAgent)}.`
                  : `Prepare and copy a read-only planning handoff for ${titleCase(selectedAgent)}. Writes remain locked.`}
              >
                {handoffBusy ? 'Preparing' : writeMode ? `Delegate to ${titleCase(selectedAgent)}` : `Delegate Read-only to ${titleCase(selectedAgent)}`}
              </button>
            )}
            <button
              className="secondary-button"
              type="button"
              onClick={() => delegateAgentHandoff({ requireWriteApproved: writeMode })}
              disabled={handoffBusy}
              title={writeMode
                ? `Prepare and copy a write-approved handoff run for ${titleCase(selectedAgent)}.`
                : `Prepare and copy a read-only planning handoff for ${titleCase(selectedAgent)}. Writes remain locked.`}
            >
              {writeMode ? 'Prepare Handoff Only' : `Delegate Read-only to ${titleCase(selectedAgent)}`}
            </button>
            {!writeMode ? (
              <button className="secondary-button" type="button" onClick={() => setActivePage('standards')} disabled={handoffBusy}>
                Unlock Write Delegation
              </button>
            ) : null}
            <button className="secondary-button" type="button" onClick={() => copyAgentHandoff()} disabled={handoffBusy}>
              Copy Read-only Handoff
            </button>
          </div>
	        </div>
	        {agentNotice ? <p className="muted-copy">{agentNotice}</p> : null}
	      </Panel>
	      <Panel title="Agent Relay Inbox" eyebrow="Cross-Lane Context">
	        <p className="muted-copy">Relay items are durable evidence extracted from worker output and review findings. Use them to route questions, capture human decisions, and make sure the next worker receives the right context in its prompt.</p>
	        <SimpleTable
	          columns={['Status', 'Target Lane', 'Source', 'Relay Item', 'Action']}
	          rows={relayItems.slice(0, 8).map((item) => {
	            const roleName = teamRoles.find((role) => role.id === item.targetWorkerRole)?.name;
	            const laneLabel = item.itemType === 'rework' ? item.targetLane || roleName : roleName || item.targetLane;
	            return [
	              <StatusBadge label={titleCase(item.status)} tone={toneFor(item.status)} />,
	              laneLabel || 'Next lane',
	              item.sourceWorkerRoleLabel || titleCase(item.sourceWorkerRole),
	              <div className="relay-table-cell">
	                <strong>{item.title}</strong>
	                <span>{item.message}</span>
	                {item.context?.requiredAction ? <em>{item.context.requiredAction}</em> : null}
	                {item.decision?.decision ? <em>Decision: {item.decision.decision}</em> : null}
	              </div>,
	              <div className="button-row compact-buttons">
	                <button className="table-button" type="button" onClick={() => {
	                  setSelectedRelayId(item.id);
	                  setRelayTargetRole(item.targetWorkerRole || '');
	                  setRelayDecision(item.decision?.decision || '');
	                }}>
	                  Review
	                </button>
	                <button className="table-button" type="button" onClick={() => useRelayForNextWorker(item)}>
	                  {item.itemType === 'rework' ? 'Use Rework' : 'Use Next'}
	                </button>
	              </div>
	            ];
	          })}
	          empty="No relay items yet. Ingest worker output with questions to create cross-lane relay evidence."
	        />
	        {selectedRelayItem ? (
	          <div className="relay-detail-panel">
	            <div>
	              <span className="eyebrow">Selected Relay</span>
	              <h4>{selectedRelayItem.title}</h4>
	              <p>{selectedRelayItem.message}</p>
	            </div>
	            <div className="form-grid two">
	              <label className="field" htmlFor="relay-target-worker">
	                <span>Target worker lane</span>
	                <select id="relay-target-worker" value={relayTargetRole} onChange={(event) => setRelayTargetRole(event.target.value)}>
	                  <option value="">Auto route</option>
	                  {teamRoles.map((role) => (
	                    <option value={role.id} key={role.id}>{role.name}</option>
	                  ))}
	                </select>
	              </label>
	              <label className="field" htmlFor="relay-status-readout">
	                <span>Relay status</span>
	                <input id="relay-status-readout" value={titleCase(selectedRelayItem.status)} readOnly />
	              </label>
	            </div>
	            <label className="field" htmlFor="relay-decision-notes">
	              <span>Human decision or answer notes</span>
	              <textarea
	                id="relay-decision-notes"
	                className="notes-input compact-notes"
	                value={relayDecision}
	                onChange={(event) => setRelayDecision(event.target.value)}
	                placeholder="Example: Keep update API payload id/removal rules in the same PR because preview gating depends on persisted DB semantics."
	              />
	            </label>
	            <div className="button-row">
	              <button className="secondary-button" type="button" onClick={() => decideRelayItem('assign')} disabled={handoffBusy}>
	                Assign Lane
	              </button>
	              <button className="secondary-button" type="button" onClick={() => decideRelayItem('answer')} disabled={handoffBusy || !relayDecision.trim()}>
	                Record Answer
	              </button>
	              <button className="secondary-button" type="button" onClick={() => decideRelayItem('reopen')} disabled={handoffBusy}>
	                Reopen
	              </button>
	              <button className="primary-button" type="button" onClick={() => useRelayForNextWorker(selectedRelayItem)} disabled={handoffBusy}>
	                Use For Next Worker
	              </button>
	            </div>
	          </div>
	        ) : null}
	      </Panel>
      <Panel title="Shared Task List" eyebrow="Execution">
        <Checklist items={sharedTaskItems.length ? sharedTaskItems : ['Review generated plan', 'Implement approved scope', 'Add tests', 'Capture evidence']} />
      </Panel>
      <Panel title="Worker Queue" eyebrow="Sequential Relay">
          {workerRuns.length ? (
            <div className="worker-queue-list">
              {workerRuns.slice(0, 8).map((run) => {
                const activeRun = isWorkerRunActive(run.status);
                const hasResponse = Boolean(run.output?.responseBytes > 0 || run.output?.rawText || ['response_ready', 'completed', 'needs_input'].includes(String(run.status || '').toLowerCase()));
                return (
                  <article className={`worker-queue-card ${selectedWorkerRun?.id === run.id ? 'selected' : ''}`} key={run.id}>
                    <div className="worker-queue-main">
                      <div className="worker-queue-title">
                        <strong>{run.workerRoleLabel}</strong>
                        <StatusBadge label={titleCase(run.status)} tone={toneFor(run.status)} />
                      </div>
                      <WorkerRunOutput run={run} />
                      <div className="worker-queue-meta">
                        <span>{titleCase(run.executionAgent)}</span>
                        <span>{titleCase(run.mode)}</span>
                        <span>{run.output?.refreshedAt ? `Refreshed ${formatTime(run.output.refreshedAt)}` : `Created ${formatTime(run.createdAt)}`}</span>
                      </div>
                    </div>
                    <div className="worker-queue-actions">
                      <button className="table-button" type="button" onClick={() => setSelectedWorkerRunId(run.id)}>
                        Review
                      </button>
                      <button className="table-button" type="button" onClick={() => refreshWorkerRunStatus(run.id)} disabled={handoffBusy || !run.statusFile}>
                        Refresh
                      </button>
                      {activeRun ? (
                        <button className="table-button danger-action" type="button" onClick={() => stopWorkerRun(run.id)} disabled={handoffBusy}>
                          Stop
                        </button>
                      ) : null}
                      <button className="table-button" type="button" onClick={() => ingestWorkerRun(run.id)} disabled={handoffBusy || !run.responseFile}>
                        Ingest
                      </button>
                      <button className="table-button" type="button" onClick={() => deriveImplementationEvidence(run.id)} disabled={handoffBusy || !hasResponse}>
                        Record Evidence
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">No worker lanes launched yet. Start with Lead Planner or Senior Full Stack Dev.</div>
          )}
      </Panel>
      {selectedWorkerRun ? (
        <Panel title="Worker Run Detail" eyebrow="Evidence Relay">
          <div className="worker-run-detail">
            <InfoList
              items={[
                ['Lane', selectedWorkerRun.workerRoleLabel],
                ['Engine', titleCase(selectedWorkerRun.executionAgent)],
                ['Mode', titleCase(selectedWorkerRun.mode)],
	                ['Status', titleCase(selectedWorkerRun.status)],
	                ['Sandbox', selectedWorkerRun.sandboxMode],
	                ['Response size', formatBytes(selectedWorkerRun.output?.responseBytes || 0)],
	                ['Log size', formatBytes(selectedWorkerRun.output?.logBytes || 0)],
	                ['Last refresh', selectedWorkerRun.output?.refreshedAt ? formatTime(selectedWorkerRun.output.refreshedAt) : 'Not refreshed'],
	                ['Created', formatTime(selectedWorkerRun.createdAt)]
	              ]}
	            />
            <SimpleTable
              columns={['Artifact', 'Path']}
              rows={[
                ['Bundle', selectedWorkerRun.bundleDir || 'Not captured'],
                ['Handoff', selectedWorkerRun.handoffFile || 'Not captured'],
                ['Prompt', selectedWorkerRun.promptFile || 'Not captured'],
                ['Response', selectedWorkerRun.responseFile || 'Not captured'],
                ['Log', selectedWorkerRun.logFile || 'Not captured']
              ]}
            />
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => copyWorkerRunText(selectedWorkerRun.manualCommand, 'Manual command')} disabled={!selectedWorkerRun.manualCommand}>
                Copy Manual Command
              </button>
              <button className="secondary-button" type="button" onClick={() => copyWorkerRunText(selectedWorkerRun.promptFile, 'Prompt path')} disabled={!selectedWorkerRun.promptFile}>
                Copy Prompt Path
              </button>
	              <button className="secondary-button" type="button" onClick={() => copyWorkerRunText(selectedWorkerRun.responseFile, 'Response path')} disabled={!selectedWorkerRun.responseFile}>
	                Copy Response Path
	              </button>
		              <button className="secondary-button" type="button" onClick={() => refreshWorkerRunStatus(selectedWorkerRun.id)} disabled={handoffBusy || !selectedWorkerRun.statusFile}>
		                Refresh Status
		              </button>
		              {isWorkerRunActive(selectedWorkerRun.status) ? (
		                <button className="secondary-button danger-action" type="button" onClick={() => stopWorkerRun(selectedWorkerRun.id)} disabled={handoffBusy}>
		                  Stop Worker
		                </button>
		              ) : null}
		              <button className="primary-button" type="button" onClick={() => ingestWorkerRun(selectedWorkerRun.id)} disabled={handoffBusy || !(selectedWorkerRun.output?.responseBytes > 0 || ['response_ready', 'completed', 'needs_input'].includes(String(selectedWorkerRun.status || '').toLowerCase()))}>
		                Ingest Output
		              </button>
		              <button className="secondary-button" type="button" onClick={() => deriveImplementationEvidence(selectedWorkerRun.id)} disabled={handoffBusy || !(selectedWorkerRun.output?.responseBytes > 0 || selectedWorkerRun.output?.rawText || ['response_ready', 'completed', 'needs_input'].includes(String(selectedWorkerRun.status || '').toLowerCase()))}>
		                Record Evidence From Worker
		              </button>
		            </div>
	            {selectedWorkerRun.output?.launchStatus ? (
	              <div className="worker-status-card">
	                <div>
	                  <span className="eyebrow">Launch Status</span>
	                  <strong>{titleCase(selectedWorkerRun.output.launchStatus.status || selectedWorkerRun.status)}</strong>
	                  <p>{selectedWorkerRun.output.launchStatus.note || selectedWorkerRun.output.summary || 'Status file was read by ODT.'}</p>
	                </div>
	                <InfoList
	                  items={[
	                    ['Started', selectedWorkerRun.output.launchStatus.startedAt ? formatTime(selectedWorkerRun.output.launchStatus.startedAt) : 'Not captured'],
	                    ['Completed', selectedWorkerRun.output.launchStatus.completedAt ? formatTime(selectedWorkerRun.output.launchStatus.completedAt) : 'Not complete'],
	                    ['Exit code', selectedWorkerRun.output.launchStatus.exitCode ?? 'Not captured']
	                  ]}
	                />
	              </div>
	            ) : null}
	            {selectedWorkerRun.logFile || selectedWorkerRun.statusFile ? (
	              <div className="log-tail">
	                <div className="log-tail-head">
	                  <div>
	                    <span className="eyebrow">Live Log Tail</span>
	                    <strong>{isWorkerRunActive(selectedWorkerRun.status) && liveTailEnabled ? 'Following worker output' : 'Latest captured output'}</strong>
	                  </div>
	                  <div className="button-row compact-buttons">
	                    <StatusBadge label={isWorkerRunActive(selectedWorkerRun.status) && liveTailEnabled ? 'Live' : 'Paused'} tone={isWorkerRunActive(selectedWorkerRun.status) && liveTailEnabled ? 'success' : 'neutral'} />
	                    <button className="table-button" type="button" onClick={() => setLiveTailEnabled((value) => !value)}>
	                      {liveTailEnabled ? 'Pause Tail' : 'Follow Tail'}
	                    </button>
	                  </div>
	                </div>
	                <pre>{selectedWorkerRun.output?.logTail || 'Waiting for worker log output. Launch or refresh the selected worker to capture the latest tail.'}</pre>
	              </div>
	            ) : null}
	            {selectedWorkerRun.questions?.length ? (
              <div className="worker-question-list">
                <strong>Open relay questions</strong>
                <ul>
                  {selectedWorkerRun.questions.map((item, index) => (
                    <li key={`${selectedWorkerRun.id}-detail-question-${index}`}>
                      <span>{item.targetLane || 'Next lane'}</span>
                      {item.question}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="muted-copy">No cross-lane questions captured for this worker run.</p>
            )}
          </div>
        </Panel>
      ) : null}
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
  const reworkRelayItems = (evidence.agentRelayItems || []).filter((item) => item.itemType === 'rework');
  const activeReworkRelayItems = reworkRelayItems.filter((item) => ['open', 'assigned', 'answered'].includes(String(item.status || '').toLowerCase()));
  const reworkRelayCommentIds = new Set(reworkRelayItems.map((item) => item.context?.reviewCommentId).filter(Boolean));
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
        <MetricCard label="Rework Relay" value={activeReworkRelayItems.length || 0} detail="Queued for Senior Full Stack Dev" tone={activeReworkRelayItems.length ? 'warning' : 'success'} />
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
              (() => {
                const canSendRework = comment.status === 'open' && ['warning', 'blocker'].includes(comment.severity);
                const alreadyRelayed = reworkRelayCommentIds.has(comment.id);
                return (
                  <div className="button-row compact-buttons">
                    <button
                      className="table-button"
                      type="button"
                      onClick={() => (alreadyRelayed ? setActivePage('team') : sendCommentToRework(comment))}
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
  const workerRuns = evidence.agentWorkerRuns || [];
  const relayItems = evidence.agentRelayItems || [];
  const agentFoundryRuns = evidence.agentFoundryRuns || [];
  const latestFoundryRunId = agentFoundryRuns[0]?.runId || '';
  const latestFoundryEntries = latestFoundryRunId ? agentFoundryRuns.filter((entry) => entry.runId === latestFoundryRunId) : [];
  const latestFoundryArtifactEntries = latestFoundryEntries.map((entry) => ({
    id: entry.id,
    runId: entry.runId,
    phase: entry.phase,
    domainId: entry.domainId,
    domainLabel: entry.domainLabel,
    status: entry.status,
    provider: entry.provider,
    model: entry.model,
    createdAt: entry.createdAt,
    inputSources: entry.inputSources,
    output: entry.output
  }));
  const latestAgentWorker = (evidence.agentEvents || []).find((event) => event.eventType === 'worker_launch_prepared' || event.eventType === 'worker_launch_failed');
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
			        agentWorkerRuns: workerRuns.length,
			        agentRelayItems: relayItems.length,
			        agentFoundryRuns: agentFoundryRuns.length,
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
      title: 'Agent Worker Launch',
      copy: 'Latest Codex worker lane, bundle paths, allowed actions, launch status, response file, log file, and manual fallback command.',
      action: 'View Worker',
      content: latestAgentWorker?.detailJson || latestAgentHandoff?.detailJson || { status: 'waiting', message: 'Launch or delegate from Agent Team to create governed worker evidence.' }
    },
	    {
	      title: 'Worker Relay Queue',
	      copy: 'Sequential worker runs, first-class relay items, parsed outputs, response files, and relay context for the next agent.',
	      action: 'View Queue',
	      content: {
	        orchestration: 'Sequential by default. Parallel writes require file partitioning.',
	        relayPolicy: 'Worker run output stays immutable. Cross-lane questions become relay items and are injected into future worker prompts.',
	        relayItems,
	        workerRuns
	      }
	    },
    {
      title: 'Agent Foundry Reviews',
      copy: 'Specialist Full SDLC or focused-domain findings, risks, recommendations, approvals, and next actions.',
      action: 'View Foundry',
      content: latestFoundryEntries.length ? {
        runId: latestFoundryRunId,
        label: 'AI-generated suggestion',
        humanReviewRequired: true,
        entries: latestFoundryArtifactEntries
      } : { status: 'waiting', message: 'Run Agent Foundry from Agent Team to create specialist evidence.' }
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
        ) : selectedArtifact.title === 'Agent Foundry Reviews' ? (
          <FoundryArtifactDetail content={selectedArtifact.content} />
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
  const workBrief = currentWorkBrief(data);
  const guidePrompts = contextualGuidePrompts(workBrief);

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
            {guidePrompts.map((prompt) => (
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

function WorkerRunOutput({ run }) {
  const questions = Array.isArray(run.questions) ? run.questions : [];
  const summary = run.output?.summary || run.responseFile || 'Waiting for worker output.';
  return (
    <div className="worker-output-cell">
      <p>{summary}</p>
      {questions.length ? (
        <ul>
          {questions.slice(0, 3).map((item, index) => (
            <li key={`${run.id}-question-${index}`}>
              <strong>Question for {item.targetLane || 'next lane'}:</strong> {item.question}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CurrentWorkBrief({ data, onNavigate, compact = false }) {
  const brief = currentWorkBrief(data);
  if (!brief.hasRealWork) return null;
  const workflow = workflowStateFromData(data);
  const openDecisionItems = brief.openClarifications.length
    ? brief.openClarifications.map((item) => `${titleCase(item.severity || 'NEEDS_REVIEW')}: ${item.question}`)
    : brief.clarifications.map((item) => formatClarificationDecision(item));
  const verificationItems = [
    ...brief.files.slice(0, 2).map((item) => `Change: ${item}`),
    ...brief.tests.slice(0, 3).map((item) => `Test: ${item}`)
  ];

  return (
    <section className={`current-work-brief ${compact ? 'compact' : ''}`} aria-label="Current work evidence brief">
      <div className="current-work-head">
        <div>
          <span className="eyebrow">Current Work Brief</span>
          <h3>{brief.title}</h3>
          <p>{brief.summary}</p>
        </div>
        <div className="work-brief-actions">
          <StatusBadge label={workflow?.label || 'Evidence Loaded'} tone={workflowTone(workflow)} />
          {onNavigate ? <button className="primary-button" type="button" onClick={() => onNavigate(workflow?.nextAction?.page || 'planner')}>{workflow?.nextAction?.label || 'Continue Work'}</button> : null}
        </div>
      </div>

      <div className="work-brief-meta" aria-label="Current work metadata">
        {brief.repoName ? <span><strong>Repo</strong>{brief.repoName}</span> : null}
        {brief.targetRepo ? <span><strong>Path</strong>{brief.targetRepo}</span> : null}
        {brief.endpoint ? <span><strong>Endpoint</strong>{brief.endpoint}</span> : null}
        <span><strong>Domain</strong>{brief.domain}</span>
        <span><strong>Open decisions</strong>{brief.openClarifications.length || 'None'}</span>
      </div>

      <div className="evidence-card-grid">
        <EvidenceCard
          eyebrow="Requirement Signals"
          title="Behavior Contract"
          items={brief.behaviors}
          empty="No behavior-specific requirement signals captured yet."
        />
        <EvidenceCard
          eyebrow="API / Data"
          title="Update Rules"
          items={brief.apiRules}
          empty="No API or payload rule evidence captured yet."
        />
        <EvidenceCard
          eyebrow="Implementation Surface"
          title="Files and Tests"
          items={verificationItems}
          empty="No impacted file or test evidence captured yet."
        />
        <EvidenceCard
          eyebrow="Human Review"
          title={brief.openClarifications.length ? 'Clarification Gate' : 'Demo Decisions'}
          items={openDecisionItems}
          empty="No clarification questions are currently open."
        />
      </div>
    </section>
  );
}

function EvidenceCard({ eyebrow, title, items, empty }) {
  const normalized = normalizeList(items).slice(0, 4);
  return (
    <article className="evidence-card">
      <span className="eyebrow">{eyebrow}</span>
      <strong>{title}</strong>
      {normalized.length ? (
        <ul>
          {normalized.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
        </ul>
      ) : (
        <p>{empty}</p>
      )}
    </article>
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

function FoundryArtifactDetail({ content }) {
  const entries = content?.entries || [];
  if (!entries.length) {
    return <div className="empty-state">{content?.message || 'Run Agent Foundry from Agent Team to create specialist evidence.'}</div>;
  }

  return (
    <div className="foundry-detail">
      <div className="foundry-summary">
        <div>
          <span className="eyebrow">Evidence Run</span>
          <strong>{shortId(content.runId)}</strong>
        </div>
        <StatusBadge label={content.label || 'AI-generated suggestion'} tone="info" />
        <StatusBadge label={content.humanReviewRequired ? 'Human Review Required' : 'Review Optional'} tone={content.humanReviewRequired ? 'warning' : 'success'} />
        <StatusBadge label={`${entries.length} Specialist${entries.length === 1 ? '' : 's'}`} tone="neutral" />
      </div>

      {entries.map((entry) => {
        const output = entry.output || {};
        const findings = output.findings || [];
        return (
          <section className="foundry-review-card" key={entry.id || `${entry.runId}-${entry.domainId}`}>
            <div className="foundry-review-head">
              <div>
                <span className="eyebrow">{output.specialistLabel || entry.domainLabel || titleCase(entry.domainId)}</span>
                <h4>{output.specialistName || 'Specialist Review'}</h4>
                <p>{output.summary || 'Specialist evidence is ready for review.'}</p>
              </div>
              <StatusBadge label={entry.status || output.status || 'NEEDS_REVIEW'} tone={standardsTone(entry.status || output.status)} />
            </div>

            <InfoList
              items={[
                ['Phase', titleCase(output.phase || entry.phase)],
                ['Provider', output.provider || entry.provider || 'local'],
                ['Model', output.model || entry.model || 'local'],
                ['Created', formatTime(output.createdAt || entry.createdAt)]
              ]}
            />

            <div className="chip-row compact-chips" aria-label="Input sources used for this specialist review">
              {normalizeList(output.inputSources || entry.inputSources).map((source) => (
                <span className="chip" key={source}>{titleCase(source)}</span>
              ))}
            </div>

            <SimpleTable
              columns={['Category', 'Status', 'Finding', 'Recommendation']}
              rows={findings.map((finding) => [
                titleCase(finding.category),
                <StatusBadge label={finding.status || 'NEEDS_REVIEW'} tone={standardsTone(finding.status)} />,
                finding.message,
                finding.recommendation
              ])}
              empty="No findings were generated for this specialist."
            />

            <div className="foundry-evidence-grid">
              <EvidenceList title="Risks" items={output.risks} empty="No high-risk issue detected." />
              <EvidenceList title="Recommendations" items={output.recommendations} empty="No recommendations captured." />
              <EvidenceList title="Missing Information" items={output.missingInformation} empty="No critical missing information detected." />
              <EvidenceList title="Next Actions" items={output.nextActions} empty="No next actions captured." />
            </div>

            <div className="foundry-standards-note">
              <strong>Standards impact</strong>
              <p>{output.standardsImpact?.note || 'Foundry output is advisory evidence and does not approve write, dependency install, or PR readiness gates.'}</p>
              <div className="chip-row compact-chips">
                {normalizeList(output.standardsImpact?.categories).map((category) => (
                  <span className="chip" key={category}>{titleCase(category)}</span>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function formatClarificationDecision(item = {}) {
  const value = item.decision || item.defaultAssumption || item.question || '';
  return String(value).replace(/^Demo decision:\s*/i, '');
}

function EvidenceList({ title, items, empty }) {
  const normalized = normalizeList(items);
  return (
    <div className="evidence-list">
      <strong>{title}</strong>
      {normalized.length ? (
        <ul>
          {normalized.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
        </ul>
      ) : (
        <p>{empty}</p>
      )}
    </div>
  );
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
}

function normalizeListOfObjects(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === 'object');
}

function summarizeItems(value, fallback = 'Not captured yet.', limit = 3) {
  const items = normalizeList(value);
  if (!items.length) return fallback;
  const visible = items.slice(0, limit).join('; ');
  return items.length > limit ? `${visible}; +${items.length - limit} more` : visible;
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

function currentWorkBrief(data) {
  const evidence = data.evidence || {};
  const assignment = evidence.assignment || data.snapshot?.assignments?.[0] || {};
  const latestPlan = evidence.implementationPlans?.[0]?.planJson || {};
  const latestDesign = evidence.technicalDesigns?.[0]?.designJson || {};
  const signals = evidence.requirementSignals || {};
  const targetRepo = signals.targetRepo || latestDesign.targetRepo || assignment.repoPath || '';
  const repoName = targetRepo.split(/[\\/]/).filter(Boolean).pop() || '';
  const title = signals.title
    || latestDesign.requirementSummary
    || cleanAssignmentTitle(assignment.title, repoName)
    || latestPlan.title
    || 'Current work item';
  const behaviors = normalizeList(signals.keyBehaviors?.length ? signals.keyBehaviors : latestPlan.frontendTasks?.length ? latestPlan.frontendTasks : latestPlan.scope);
  const apiRules = normalizeList(signals.updateApiScenarios?.length ? signals.updateApiScenarios : latestPlan.backendTasks)
    .filter((item) => !/^method:\s*/i.test(item))
    .filter((item) => !/^while editing/i.test(item));
  const tests = normalizeList(signals.testPlan?.length ? signals.testPlan : latestPlan.testTasks);
  const files = normalizeList(latestPlan.filesToChange?.length ? latestPlan.filesToChange : latestDesign.candidateFiles?.length ? latestDesign.candidateFiles : signals.mentionedFiles);
  const clarifications = resolvedClarificationGate(signals.clarifyingQuestions?.length ? signals.clarifyingQuestions : latestPlan.clarificationGate, data);
  const openClarifications = clarifications.filter(isClarificationOpen);
  const domain = deriveDomainLabel(signals, latestPlan, latestDesign);
  const endpoint = signals.endpoint || firstUrl([...normalizeList(latestDesign.apiChanges), ...apiRules]) || '';
  const summary = [
    domain,
    repoName ? `targeting ${repoName}` : '',
    endpoint ? 'with endpoint evidence captured' : '',
    behaviors.length ? `${behaviors.length} behavior rule${behaviors.length === 1 ? '' : 's'}` : '',
    tests.length ? `${tests.length} verification target${tests.length === 1 ? '' : 's'}` : ''
  ].filter(Boolean).join('. ');

  return {
    hasRealWork: Boolean(signals.title || latestPlan.title || latestDesign.title || assignment.repoPath),
    title,
    summary: summary || 'Requirement-specific evidence will appear here after Intake and Planning.',
    targetRepo,
    repoName,
    endpoint,
    domain,
    behaviors,
    apiRules,
    tests,
    files,
    clarifications,
    openClarifications
  };
}

function resolvedClarificationGate(value, data) {
  const items = normalizeListOfObjects(value);
  if (!isAssessmentPreviewDemo(data)) return items;
  return items.map((item) => {
    const question = String(item.question || '').toLowerCase();
    const decision = assessmentPreviewDemoDecision(question);
    if (!decision) return item;
    return {
      ...item,
      severity: 'DECIDED',
      status: 'resolved',
      decision,
      decisionOwner: item.decisionOwner || 'Demo owner'
    };
  });
}

function isAssessmentPreviewDemo(data) {
  const evidence = data?.evidence || {};
  const assignment = evidence.assignment || data?.snapshot?.assignments?.[0] || {};
  const signals = evidence.requirementSignals || {};
  const text = [
    assignment.title,
    assignment.requirement,
    signals.title,
    ...(signals.keyBehaviors || [])
  ].join(' ').toLowerCase();
  return text.includes('assessment') && text.includes('preview');
}

function assessmentPreviewDemoDecision(question) {
  if (question.includes('mobile assessment')) {
    return 'Demo decision: apply the persisted-data rule to shared Assessment paths; mobile-only follow-up is acceptable if the repo shows a separate implementation.';
  }
  if (question.includes('save draft')) {
    return 'Demo decision: Save Draft may remain permissive for incomplete drafts; Preview stays stricter and only enables for persisted previewable question data.';
  }
  if (question.includes('update api payload') || question.includes('id/removal')) {
    return 'Demo decision: include update API payload id/removal rules in the same PR because they are part of the edit workflow defect.';
  }
  if (question.includes('repository and branch')) {
    return 'Demo decision: use /Users/vn105957/Desktop/lpdev/journey-builder-js on the current branch unless the developer overrides it before write execution.';
  }
  return '';
}

function isClarificationOpen(item) {
  const status = String(item.status || '').toLowerCase();
  const severity = String(item.severity || '').toLowerCase();
  return !['resolved', 'accepted', 'decided'].includes(status) && !['info', 'decided', 'accepted'].includes(severity);
}

function contextualGuidePrompts(brief) {
  if (brief?.hasRealWork && /assessment preview/i.test(brief.title)) {
    return [
      'Summarize the Assessment Preview implementation plan',
      'Explain the persisted DB preview rule',
      'List update API payload edge cases',
      'Generate targeted Jest test steps',
      'What can Codex implement next safely?'
    ];
  }
  return [
    'Summarize this requirement',
    'Extract API contract',
    'Generate test cases',
    'Find risks',
    'Create implementation checklist'
  ];
}

function cleanAssignmentTitle(title, repoName) {
  let value = String(title || '').trim();
  if (repoName && value.endsWith(` - ${repoName}`)) value = value.slice(0, -repoName.length - 3);
  return value;
}

function deriveDomainLabel(signals, latestPlan, latestDesign) {
  const domain = signals.domainSignals || {};
  if (domain.assessment && domain.preview && domain.updatePayload) return 'Assessment preview and update API workflow';
  if (domain.assessment && domain.preview) return 'Assessment preview workflow';
  if (domain.updatePayload) return 'Update API payload workflow';
  if (signals.scopeSignals?.frontend && signals.scopeSignals?.backend) return 'Full-stack implementation workflow';
  if (latestDesign.impactedAreas?.length) return summarizeItems(latestDesign.impactedAreas, 'Impacted product workflow', 2);
  if (latestPlan.scope?.length) return summarizeItems(latestPlan.scope, 'Requirement-driven implementation', 1);
  return 'Requirement-driven implementation workflow';
}

function firstUrl(items) {
  const match = normalizeList(items).join(' ').match(/https?:\/\/\S+/);
  return match ? match[0].replace(/[),.;]+$/, '') : '';
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
  const hardSafetyBlockers = blockerFindings.filter(isHardSafetyBlocker);
  const unresolvedBlockers = blockerOverride ? hardSafetyBlockers : blockerFindings;
  return {
    latestCheck,
    findings,
    approvals,
    blockerFindings,
    hardSafetyBlockers,
    unresolvedBlockers,
    reviewBlockers,
    blockerOverride,
    warningOverride,
    writeApproved,
    implementationBlocked
  };
}

function isHardSafetyBlocker(finding = {}) {
  const category = String(finding.category || '').toLowerCase();
  const message = `${finding.message || ''} ${finding.recommendation || ''}`.toLowerCase();
  return (
    category.includes('frontend-secrets')
    || category.includes('destructive')
    || category === 'dependency'
    || category === 'dependency-license'
    || message.includes('frontend secret')
    || message.includes('destructive')
    || message.includes('package installation requires explicit developer approval')
    || message.includes('dependency request before implementation')
  );
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
  if (text.includes('wait') || text.includes('review') || text.includes('pending') || text.includes('open') || text.includes('assign')) return 'warning';
  if (text.includes('ready') || text.includes('ok') || text.includes('done') || text.includes('online') || text.includes('answer') || text.includes('resolve') || text.includes('complete')) return 'success';
  return 'neutral';
}

function isWorkerRunActive(status) {
  return ['starting', 'running', 'delegated_visible', 'manual_fallback', 'unknown'].includes(String(status || '').toLowerCase());
}

function standardsTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('block')) return 'danger';
  if (text.includes('warning') || text.includes('approval') || text.includes('review') || text.includes('required')) return 'warning';
  if (text.includes('pass') || text.includes('approved') || text.includes('ready') || text.includes('decided') || text.includes('accepted') || text.includes('resolved')) return 'success';
  return 'neutral';
}

function adapterTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('unhealthy') || text.includes('missing') || text.includes('fail')) return 'danger';
  if (text.includes('planned') || text.includes('not_configured') || text.includes('handoff')) return 'warning';
  if (text.includes('healthy') || text.includes('configured') || text.includes('ready')) return 'success';
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

const rootElement = document.getElementById('root');
const root = window.__odtWorkbenchRoot || createRoot(rootElement);
window.__odtWorkbenchRoot = root;
root.render(<App />);
