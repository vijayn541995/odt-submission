import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_ASSIGNMENT_ID } from '@odt/config';
import {
  activeAssignmentId as sharedActiveAssignmentId,
  activeStandardsFindings as sharedActiveStandardsFindings,
  activeWorkKey as sharedActiveWorkKey,
  buildVerificationEvidenceRows as sharedBuildVerificationEvidenceRows,
  currentEvidenceItems as sharedCurrentEvidenceItems,
  currentPrReadinessReports as sharedCurrentPrReadinessReports,
  evidenceTime as sharedEvidenceTime,
  extractWorkKeyFromText as sharedExtractWorkKeyFromText,
  formatImpactCandidateCompact as sharedFormatImpactCandidateCompact,
  hasRecentApproval as sharedHasRecentApproval,
  historicalEvidenceItems as sharedHistoricalEvidenceItems,
  jiraVerificationState as sharedJiraVerificationState,
  latestApproval as sharedLatestApproval,
  latestRepoAnalysisFromData as sharedLatestRepoAnalysisFromData,
  rankedImpactCandidates as sharedRankedImpactCandidates,
  standardsGateState as sharedStandardsGateState,
  verificationTestPassed as sharedVerificationTestPassed,
  workerRunBlocksEvidence as sharedWorkerRunBlocksEvidence,
  workerRunEvidenceBlockReason as sharedWorkerRunEvidenceBlockReason,
  workerRunHasReviewableOutput as sharedWorkerRunHasReviewableOutput,
  workflowAllows as sharedWorkflowAllows,
  workflowStateFromData as sharedWorkflowStateFromData
} from '@odt/domain';
import { AppShell, createPageRoutes, PageRouter as SharedPageRouter } from '@odt/ui';
import {
  AgentTeamPage as SharedAgentTeamPage,
  ArtifactsPage as SharedArtifactsPage,
  GuidePage as SharedGuidePage,
  IntakePage as SharedIntakePage,
  MonitoringPage as SharedMonitoringPage,
  OverviewPage as SharedOverviewPage,
  PlannerPage as SharedPlannerPage,
  PrReadinessPage as SharedPrReadinessPage,
  ReviewPage as SharedReviewPage,
  RunsPage as SharedRunsPage,
  SettingsPage as SharedSettingsPage,
  StandardsPage as SharedStandardsPage
} from '@odt/ui/features';
import {
  ActionList as SharedActionList,
  PageHeader as SharedPageHeader,
  Panel as SharedPanel,
  InfoList as SharedInfoList,
  JsonBlock as SharedJsonBlock,
  MetricCard as SharedMetricCard,
  SimpleTable as SharedSimpleTable,
  StatusBadge as SharedStatusBadge,
  Timeline as SharedTimeline,
  WorkflowDecisionBar as SharedWorkflowDecisionBar
} from '@odt/ui/primitives';
import {
  formatBytes as sharedFormatBytes,
  formatTime as sharedFormatTime,
  safeDetail as sharedSafeDetail,
  shortId as sharedShortId,
  titleCase as sharedTitleCase,
  toneFor as sharedToneFor
} from '@odt/ui/utils';
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

const navPageIds = new Set(navItems.map((item) => item.id));

function pageFromHash() {
  const page = String(window.location.hash || '').replace(/^#\/?/, '').trim();
  return navPageIds.has(page) ? page : 'overview';
}

function activeAssignmentId(data) {
  return sharedActiveAssignmentId(data, DEFAULT_ASSIGNMENT_ID);
}

function extractWorkKeyFromText(value) {
  return sharedExtractWorkKeyFromText(value);
}

function activeWorkKey(data) {
  return sharedActiveWorkKey(data, DEFAULT_ASSIGNMENT_ID);
}

const teamRoles = [
  { id: 'lead-planner', name: 'Lead Planner', status: 'Ready', scope: 'Clarify scope, gaps, sequence, risks, and worker split', mode: 'Read-only planning', requiresWrite: false },
  { id: 'fullstack-dev', name: 'Senior Full Stack Dev', status: 'Waiting', scope: 'IC4-style end-to-end implementation across UI, API integration, state, utilities, tests, and architecture tradeoffs', mode: 'Approved writes only', requiresWrite: true },
  { id: 'backend-dev', name: 'Backend Dev', status: 'Waiting', scope: 'APIs, data flow, utilities, service integration, backend-facing tests', mode: 'Approved writes only', requiresWrite: true },
  { id: 'frontend-dev', name: 'Frontend Dev', status: 'Waiting', scope: 'UI behavior, component state, accessibility, validation, frontend tests', mode: 'Approved writes only', requiresWrite: true },
  { id: 'reviewer', name: 'Reviewer', status: 'Ready', scope: 'Risk, diff, test, security, accessibility, standards review', mode: 'Read-only review', requiresWrite: false },
  { id: 'build-verifier', name: 'Build Verifier', status: 'Waiting', scope: 'Run approved build/test commands and capture verification evidence', mode: 'Approved test commands', requiresWrite: true }
];

const pageRoutes = createPageRoutes({
  overview: OverviewRoute,
  intake: IntakeRoute,
  planner: PlannerRoute,
  standards: StandardsRoute,
  team: AgentTeamRoute,
  review: ReviewRoute,
  pr: PrReadinessRoute,
  artifacts: ArtifactsRoute,
  guide: GuideRoute,
  runs: RunsRoute,
  monitoring: MonitoringRoute,
  settings: SettingsRoute
});

function App() {
  const [activePage, setActivePage] = useState(pageFromHash);
  const workbench = useWorkbenchData();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    const nextHash = activePage === 'overview' ? '' : `#${activePage}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  }, [activePage]);

  useEffect(() => {
    const handleHashChange = () => setActivePage(pageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    workbench.refresh();
  }, [activePage]);

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
      sidebarProps={{
        features: navItems,
        icons: SidebarIcons,
        LogoComponent: OdtLogo,
        GovernanceIconComponent: HumanGateIcon
      }}
      header={<TopHeader data={workbench} onRefresh={workbench.refresh} onSwitchAssignment={workbench.switchAssignment} />}
    >
      <SharedPageRouter
        activePage={activePage}
        routes={pageRoutes}
        defaultPage="overview"
        routeProps={{ setActivePage, data: workbench }}
      />
    </AppShell>
  );
}

function RunsRoute({ data }) {
  return (
    <SharedRunsPage
      data={data}
      helpers={{ shortId, titleCase, toneFor, formatTime, safeDetail }}
    />
  );
}

function SettingsRoute({ data }) {
  return (
    <SharedSettingsPage
      data={data}
      apiBase={API_BASE}
      helpers={{ activeAssignmentId, activeWorkKey, getStoredSetting, titleCase, formatBytes }}
    />
  );
}

function OverviewRoute({ data, setActivePage }) {
  return (
    <SharedOverviewPage
      data={data}
      setActivePage={setActivePage}
      helpers={{ currentWorkBrief }}
      slots={{ ErrorBanner, CurrentWorkBrief, WorkflowProgress, WorkflowStatePanel, StandardsGateSummary, StepperList }}
    />
  );
}

function IntakeRoute({ data, setActivePage }) {
  return (
    <SharedIntakePage
      data={data}
      setActivePage={setActivePage}
      actions={{ postJson }}
      helpers={{
        fileToBase64,
        analyzeBrowserRepoFolder,
        assetFileUrl,
        assetRoleLabel,
        assetExtractionLabel,
        assetExtractionTone,
        assetAiEnrichmentLabel,
        assetAiEnrichmentTone
      }}
    />
  );
}

function MonitoringRoute({ data, setActivePage }) {
  return (
    <SharedMonitoringPage
      data={data}
      setActivePage={setActivePage}
      actions={{ postJson }}
      helpers={{
        activeAssignmentId,
        activeWorkKey,
        shortId,
        titleCase,
        formatTime,
        validationTone,
        monitoringSeverityTone,
        toneFor
      }}
    />
  );
}

function GuideRoute({ data, setActivePage }) {
  return (
    <SharedGuidePage
      data={data}
      setActivePage={setActivePage}
      actions={{ postJson }}
      helpers={{
        activeAssignmentId,
        currentWorkBrief,
        contextualGuidePrompts
      }}
    />
  );
}

function PlannerRoute({ data, setActivePage }) {
  return (
    <SharedPlannerPage
      data={data}
      setActivePage={setActivePage}
      actions={{ postJson }}
      helpers={{ currentWorkBrief, resolvedClarificationGate, isClarificationOpen, getStoredSetting }}
      slots={{ CurrentWorkBrief }}
    />
  );
}

function ArtifactsRoute({ data }) {
  return (
    <SharedArtifactsPage
      data={data}
      apiBase={API_BASE}
      assetFileUrl={assetFileUrl}
    />
  );
}

function PrReadinessRoute({ data, setActivePage }) {
  return (
    <SharedPrReadinessPage
      data={data}
      setActivePage={setActivePage}
      actions={{ postJson, copyTextToClipboard }}
    />
  );
}

function ReviewRoute({ data, setActivePage }) {
  return (
    <SharedReviewPage
      data={data}
      setActivePage={setActivePage}
      actions={{ postJson }}
      helpers={{ teamRoles, getStoredSetting }}
    />
  );
}

function StandardsRoute({ data, setActivePage }) {
  return (
    <SharedStandardsPage
      data={data}
      setActivePage={setActivePage}
      actions={{ postJson }}
      helpers={{ currentWorkBrief }}
      slots={{ CurrentWorkBrief }}
    />
  );
}

function AgentTeamRoute({ data, setActivePage }) {
  return (
    <SharedAgentTeamPage
      data={data}
      setActivePage={setActivePage}
      actions={{ postJson, getJson, copyTextToClipboard }}
      slots={{ CurrentWorkBrief }}
    />
  );
}

function useWorkbenchData() {
  const [snapshot, setSnapshot] = useState(null);
  const [settings, setSettings] = useState(null);
  const [usage, setUsage] = useState({ summary: {}, events: [] });
  const [errorLog, setErrorLog] = useState({ summary: {}, items: [] });
  const [validation, setValidation] = useState({ runs: [] });
  const [runs, setRuns] = useState([]);
  const [runEvents, setRunEvents] = useState([]);
  const [standards, setStandards] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [uploadPolicy, setUploadPolicy] = useState(null);
  const [agentFoundry, setAgentFoundry] = useState(null);
  const [agentWorkers, setAgentWorkers] = useState(null);
  const [executionHealth, setExecutionHealth] = useState(null);
  const [agentContract, setAgentContract] = useState(null);
  const [assignmentId, setAssignmentId] = useState(DEFAULT_ASSIGNMENT_ID);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const snapshotResult = await getJson('/api/snapshot');
      setSnapshot(snapshotResult);
      const nextAssignmentId = activeAssignmentId({ snapshot: snapshotResult }) || DEFAULT_ASSIGNMENT_ID;
      setAssignmentId(nextAssignmentId);
      const requests = [
        ['settings', getJson('/api/settings'), setSettings],
        ['usage', getJson('/api/monitoring/ai-usage'), setUsage],
        ['error log', getJson(`/api/monitoring/error-log?assignmentId=${encodeURIComponent(nextAssignmentId)}`), setErrorLog],
        ['validation', getJson(`/api/validation/runs?assignmentId=${encodeURIComponent(nextAssignmentId)}`), setValidation],
        ['runs', getJson(`/api/runs?assignmentId=${encodeURIComponent(nextAssignmentId)}`), (result) => {
          const scopedRuns = result.runs || [];
          setRuns(scopedRuns);
          setSelectedRunId((current) => (
            scopedRuns.some((run) => run.id === current)
              ? current
              : scopedRuns[0]?.id || ''
          ));
        }],
        ['standards', getJson('/api/standards'), setStandards],
        ['evidence', getJson(`/api/assignments/${encodeURIComponent(nextAssignmentId)}/evidence`), setEvidence],
        ['upload policy', getJson('/api/intake/upload-policy'), setUploadPolicy],
        ['agent foundry', getJson('/api/agent-foundry/domains'), setAgentFoundry],
        ['agent workers', getJson('/api/agents/worker-roles'), setAgentWorkers],
        ['execution health', getJson(`/api/agents/execution-health?assignmentId=${encodeURIComponent(nextAssignmentId)}`), setExecutionHealth],
        ['agent contract', getJson(`/api/assignments/${encodeURIComponent(nextAssignmentId)}/agent-contract`), setAgentContract]
      ];
      const results = await Promise.allSettled(requests.map(([, promise]) => promise));
      const failures = [];
      results.forEach((result, index) => {
        const [label, , setter] = requests[index];
        if (result.status === 'fulfilled') {
          setter(result.value);
        } else {
          failures.push(`${label}: ${result.reason?.message || 'request failed'}`);
        }
      });
      setError(failures.length ? `Some workbench data could not refresh. ${failures.join('; ')}` : '');
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
    const result = await getJson(`/api/runs/${encodeURIComponent(runId)}/events?assignmentId=${encodeURIComponent(assignmentId || activeAssignmentId({ snapshot }))}`);
    setRunEvents(result.events || []);
  }

  async function switchAssignment(nextAssignmentId) {
    if (!nextAssignmentId || nextAssignmentId === assignmentId) return;
    await postJson('/api/settings', {
      settings: {
        activeAssignmentId: nextAssignmentId
      }
    });
    setAssignmentId(nextAssignmentId);
    await refresh();
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
    errorLog,
    validation,
    runs,
    runEvents,
    standards,
    evidence,
    uploadPolicy,
    agentFoundry,
    agentWorkers,
    executionHealth,
    agentContract,
    assignmentId,
    switchAssignment,
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
  if (!response.ok) throw new Error(data.error || data.message || data.reason || data.detail?.reason || `${path} returned ${response.status}`);
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

function TopHeader({ data, onRefresh, onSwitchAssignment }) {
  const ai = data.snapshot?.ai;
  const workbenchApiOnline = !data.error && !data.loading;
  const contextOnline = data.snapshot?.odtContext?.online;
  const assignments = data.snapshot?.assignments || [];
  const currentAssignmentId = activeAssignmentId(data);
  return (
    <header className="top-header">
      <div>
        <div className="breadcrumb">Oracle Developer Twin</div>
        <h1>ODT Workbench</h1>
      </div>
      <div className="header-status">
        {assignments.length ? (
          <label className="active-work-select" title="Select which assignment drives Planner, Standards, Agent Team, Review, and PR Ready.">
            <span>Active work</span>
            <select
              value={currentAssignmentId}
              onChange={(event) => onSwitchAssignment?.(event.target.value)}
              disabled={data.loading}
              aria-label="Active ODT work item"
            >
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title || assignment.id}
                </option>
              ))}
            </select>
          </label>
        ) : null}
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

function PageHeader({ eyebrow, title, copy, actions }) {
  return <SharedPageHeader eyebrow={eyebrow} title={title} copy={copy} actions={actions} />;
}

function Panel({ eyebrow, title, children }) {
  return <SharedPanel eyebrow={eyebrow} title={title}>{children}</SharedPanel>;
}

function MetricCard({ label, value, detail, tone }) {
  return <SharedMetricCard label={label} value={value} detail={detail} tone={tone} />;
}

function CurrentWorkBrief({ data, onNavigate, compact = false }) {
  const brief = currentWorkBrief(data);
  if (!brief.hasRealWork) return null;
  const workflow = workflowStateFromData(data);
  const { completedJiraVerification } = jiraVerificationState(workflow);
  const openDecisionItems = brief.openClarifications.length
    ? brief.openClarifications.map((item) => `${titleCase(item.severity || 'NEEDS_REVIEW')}: ${item.question}`)
    : brief.clarifications.map((item) => formatClarificationDecision(item));
  const verificationItems = [
    ...brief.files.slice(0, 2).map((item) => completedJiraVerification ? `Review: ${item}` : `Change: ${item}`),
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
          title={completedJiraVerification ? 'Verification Contract' : 'Behavior Contract'}
          items={brief.behaviors}
          empty="No behavior-specific requirement signals captured yet."
        />
        <EvidenceCard
          eyebrow="API / Data"
          title={completedJiraVerification ? 'Repo Evidence' : 'Update Rules'}
          items={brief.apiRules}
          empty={completedJiraVerification ? 'No repo evidence captured yet.' : 'No API or payload rule evidence captured yet.'}
        />
        <EvidenceCard
          eyebrow="Implementation Surface"
          title={completedJiraVerification ? 'Evidence to Review' : 'Files and Tests'}
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
  return <SharedWorkflowDecisionBar workflow={workflow} onNavigate={onNavigate} titleCase={titleCase} workflowTone={workflowTone} />;
}

function StatusBadge({ label, tone, title }) {
  return <SharedStatusBadge label={label} tone={tone} title={title} />;
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
  return <SharedActionList items={items} />;
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
  return <SharedTimeline events={events} empty={empty} toneFor={toneFor} formatTime={formatTime} />;
}

function SimpleTable({ columns, rows, empty }) {
  return <SharedSimpleTable columns={columns} rows={rows} empty={empty} />;
}

function InfoList({ items }) {
  return <SharedInfoList items={items} />;
}

function JsonBlock({ value }) {
  return <SharedJsonBlock value={value} />;
}

function formatClarificationDecision(item = {}) {
  const value = item.decision || item.defaultAssumption || item.question || '';
  return String(value).replace(/^Demo decision:\s*/i, '');
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

function currentEvidenceItems(evidence, key) {
  return sharedCurrentEvidenceItems(evidence, key);
}

function historicalEvidenceItems(evidence, key) {
  return sharedHistoricalEvidenceItems(evidence, key);
}

function evidenceTime(value) {
  return sharedEvidenceTime(value);
}

function currentPrReadinessReports(evidence = {}) {
  return sharedCurrentPrReadinessReports(evidence);
}

function latestRepoAnalysisFromData(data) {
  return sharedLatestRepoAnalysisFromData(data);
}

function rankedImpactCandidates(data) {
  return sharedRankedImpactCandidates(data);
}

function formatImpactCandidateCompact(item = {}) {
  return sharedFormatImpactCandidateCompact(item);
}

function currentWorkBrief(data) {
  const evidence = data.evidence || {};
  const assignment = evidence.assignment || data.snapshot?.assignments?.[0] || {};
  const latestPlan = currentEvidenceItems(evidence, 'implementationPlans')?.[0]?.planJson || {};
  const latestDesign = currentEvidenceItems(evidence, 'technicalDesigns')?.[0]?.designJson || {};
  const latestRepoAnalysis = latestRepoAnalysisFromData(data);
  const rankedImpactFiles = rankedImpactCandidates(data).map(formatImpactCandidateCompact);
  const signals = evidence.requirementSignals || {};
  const workflow = workflowStateFromData(data);
  const { verificationProfile, completedJiraVerification } = jiraVerificationState(workflow);
  const targetRepo = signals.targetRepo || latestDesign.targetRepo || assignment.repoPath || '';
  const repoName = targetRepo.split(/[\\/]/).filter(Boolean).pop() || '';
  const title = signals.title
    || latestDesign.requirementSummary
    || cleanAssignmentTitle(assignment.title, repoName)
    || latestPlan.title
    || 'Current work item';
  const behaviors = completedJiraVerification
    ? normalizeList([
      `${verificationProfile?.issueKey || 'Jira'} is Done and should enter verification, not implementation.`,
      'Reviewer must inspect Jira details, matching commits, branch/PR state, risks, and missing evidence.',
      'Build/test evidence is required before PR or release readiness.'
    ])
    : normalizeList(signals.keyBehaviors?.length ? signals.keyBehaviors : latestPlan.frontendTasks?.length ? latestPlan.frontendTasks : latestPlan.scope);
  const apiRules = completedJiraVerification
    ? normalizeList([
      verificationProfile?.summary,
      verificationProfile?.repoPath ? `Repository: ${verificationProfile.repoPath}` : '',
      verificationProfile?.hasRepoEvidence ? `${verificationProfile.commitCount || 0} Jira-linked commit(s) detected.` : 'Repository completion evidence still needs verification.'
    ])
    : normalizeList(signals.updateApiScenarios?.length ? signals.updateApiScenarios : latestPlan.backendTasks)
    .filter((item) => !/^method:\s*/i.test(item))
    .filter((item) => !/^while editing/i.test(item));
  const tests = normalizeList(signals.testPlan?.length ? signals.testPlan : latestPlan.testTasks);
  const files = completedJiraVerification
    ? normalizeList(latestPlan.filesToReview?.length ? latestPlan.filesToReview : latestDesign.candidateFiles?.length ? latestDesign.candidateFiles : ['Jira-linked commit diffs', 'Changed files from matching commits'])
    : normalizeList(latestPlan.filesToChange?.length
      ? latestPlan.filesToChange
      : latestDesign.candidateFiles?.length
        ? latestDesign.candidateFiles
        : rankedImpactFiles.length
          ? rankedImpactFiles
          : signals.mentionedFiles);
  const clarifications = resolvedClarificationGate(signals.clarifyingQuestions?.length ? signals.clarifyingQuestions : latestPlan.clarificationGate, data);
  const openClarifications = clarifications.filter(isClarificationOpen);
  const domain = completedJiraVerification ? 'Completed Jira verification workflow' : deriveDomainLabel(signals, latestPlan, latestDesign);
  const endpoint = signals.endpoint || firstUrl([...normalizeList(latestDesign.apiChanges), ...apiRules]) || '';
  const summary = [
    domain,
    repoName ? `targeting ${repoName}` : '',
    endpoint ? 'with endpoint evidence captured' : '',
    behaviors.length ? `${behaviors.length} ${completedJiraVerification ? 'verification rule' : 'behavior rule'}${behaviors.length === 1 ? '' : 's'}` : '',
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
    impactSummary: latestRepoAnalysis.impactAnalysis || {},
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
      'How do I use ODT for this task?',
      'What does Launch Worker do?',
      'Where are we now?',
      'What is still blocking PR readiness?',
      'Explain the persisted DB preview rule',
      'What tests were run?'
    ];
  }
  return [
    'How do I use ODT?',
    'What are the SDLC steps?',
    'What does Launch Worker do?',
    'Why is Delegate disabled?',
    'What does Standards page do?'
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
  return sharedWorkflowStateFromData(data);
}

function workflowAllows(workflow, key, fallback = false) {
  return sharedWorkflowAllows(workflow, key, fallback);
}

function jiraVerificationState(workflow) {
  return sharedJiraVerificationState(workflow);
}

function workerRunHasReviewableOutput(run = {}) {
  return sharedWorkerRunHasReviewableOutput(run);
}

function workerRunBlocksEvidence(run = {}) {
  return sharedWorkerRunBlocksEvidence(run);
}

function workerRunEvidenceBlockReason(run = {}) {
  return sharedWorkerRunEvidenceBlockReason(run);
}

function verificationTestPassed(test = {}) {
  return sharedVerificationTestPassed(test);
}

function buildVerificationEvidenceRows({ evidence = {}, workflow = {}, latestReport = null } = {}) {
  return sharedBuildVerificationEvidenceRows({
    evidence,
    workflow,
    latestReport,
    currentEvidenceItems,
    currentPrReadinessReports,
    shortId
  });
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
  return sharedActiveStandardsFindings(evidence);
}

function standardsGateState(evidence) {
  return sharedStandardsGateState(evidence);
}

function latestApproval(approvals, types) {
  return sharedLatestApproval(approvals, types);
}

function hasRecentApproval(approvals, types, since) {
  return sharedHasRecentApproval(approvals, types, since);
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
  return sharedTitleCase(value);
}

function toneFor(value) {
  return sharedToneFor(value);
}

function validationTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('fail') || text.includes('error') || text.includes('timeout')) return 'danger';
  if (text.includes('running') || text.includes('not run')) return 'warning';
  if (text.includes('pass') || text.includes('ok') || text.includes('complete')) return 'success';
  return 'neutral';
}

function monitoringSeverityTone(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('critical') || text.includes('block') || text.includes('error') || text.includes('fail')) return 'danger';
  if (text.includes('warning') || text.includes('pending') || text.includes('needs') || text.includes('review') || text.includes('fallback')) return 'warning';
  if (text.includes('healthy') || text.includes('ok') || text.includes('pass') || text.includes('resolved') || text.includes('superseded')) return 'success';
  return 'info';
}

function isWorkerRunActive(status) {
  return ['starting', 'running', 'delegated_visible', 'stop_requested'].includes(String(status || '').toLowerCase());
}

function isWorkerRunPrepared(status) {
  return ['bundle_created', 'manual_fallback'].includes(String(status || '').toLowerCase());
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

function assetRoleLabel(asset) {
  const role = asset?.analysisJson?.role || '';
  if (role) return role.split('.')[0];
  const map = {
    'mockup-image': 'Visual mockup',
    pdf: 'Requirement document',
    document: 'Requirement document',
    spreadsheet: 'Structured data',
    'api-sample': 'API sample',
    notes: 'Notes',
    presentation: 'Presentation',
    'context-file': 'Context file'
  };
  return map[asset?.fileType] || titleCase(asset?.fileType || 'Context file');
}

function assetExtractionLabel(asset) {
  const status = asset?.analysisJson?.localExtraction?.status || 'not_analyzed';
  if (status === 'extracted') return 'Local Excerpt';
  if (status === 'empty') return 'Empty';
  if (status === 'not_extracted') return 'Stored Only';
  return titleCase(status);
}

function assetExtractionTone(asset) {
  const status = asset?.analysisJson?.localExtraction?.status || 'not_analyzed';
  if (status === 'extracted') return 'success';
  if (status === 'not_extracted') return 'warning';
  return 'neutral';
}

function assetAiEnrichmentLabel(asset) {
  const enrichment = asset?.analysisJson?.aiEnrichment || {};
  if (!enrichment.recommended) return 'Not Required';
  if (enrichment.status === 'optional_not_run') return 'Optional';
  return titleCase(enrichment.status || 'Optional');
}

function assetAiEnrichmentTone(asset) {
  const enrichment = asset?.analysisJson?.aiEnrichment || {};
  if (!enrichment.recommended) return 'neutral';
  if (enrichment.status === 'not_required') return 'success';
  return 'info';
}

function formatBytes(value) {
  return sharedFormatBytes(value);
}

function formatTime(value) {
  return sharedFormatTime(value);
}

function shortId(value) {
  return sharedShortId(value);
}

function safeDetail(detail) {
  return sharedSafeDetail(detail);
}

const rootElement = document.getElementById('root');
const root = window.__odtWorkbenchRoot || createRoot(rootElement);
window.__odtWorkbenchRoot = root;
root.render(<App />);
