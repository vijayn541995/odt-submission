import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE = 'http://127.0.0.1:4310';
const WORKBENCH_API_BASE = 'http://127.0.0.1:5180';

function makeGlyph(label) {
  return function Glyph({ size = 18 }) {
    return (
      <span className="glyph" style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.52)) }}>
        {label}
      </span>
    );
  };
}

const Activity = makeGlyph('AC');
const Archive = makeGlyph('AR');
const ChevronRight = makeGlyph('>');
const ClipboardCheck = makeGlyph('RV');
const Code2 = makeGlyph('</>');
const Database = makeGlyph('DB');
const FileDiff = makeGlyph('DF');
const GitBranch = makeGlyph('GT');
const LayoutDashboard = makeGlyph('OV');
const ListChecks = makeGlyph('TC');
const MessageSquareText = makeGlyph('Q');
const Network = makeGlyph('NW');
const PanelLeft = makeGlyph('OD');
const Play = makeGlyph('GO');
const RefreshCcw = makeGlyph('RF');
const Search = makeGlyph('SR');
const Settings = makeGlyph('ST');
const ShieldCheck = makeGlyph('SH');
const Sparkles = makeGlyph('AI');
const Upload = makeGlyph('UP');
const UsersRound = makeGlyph('TM');
const Workflow = makeGlyph('WF');
const Wrench = makeGlyph('BL');

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'intake', label: 'Intake', icon: MessageSquareText },
  { id: 'team', label: 'Agent Team', icon: UsersRound },
  { id: 'planner', label: 'Planner', icon: Workflow },
  { id: 'review', label: 'Review', icon: ClipboardCheck },
  { id: 'artifacts', label: 'Artifacts', icon: Archive },
  { id: 'guide', label: 'ODT Guide', icon: Sparkles },
  { id: 'runs', label: 'Runs', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const FALLBACK_AGENTS = [
  {
    id: 'lead-planner',
    label: 'Lead Planner',
    role: 'Plans task order, dependencies, confidence gates, and parallel lanes.',
    status: 'ready',
    mode: 'plan',
    avatar: 'PLAN',
    scope: 'Read repo, write plan only'
  },
  {
    id: 'main-developer',
    label: 'Main Developer',
    role: 'Implements the approved slice inside guarded write scope.',
    status: 'waiting',
    mode: 'write',
    avatar: 'DEV',
    scope: 'Writes approved files'
  },
  {
    id: 'architecture-reviewer',
    label: 'Architecture Reviewer',
    role: 'Checks boundaries, reuse, dependency discipline, and repo fit.',
    status: 'waiting',
    mode: 'review',
    avatar: 'ARCH',
    scope: 'Read-only'
  },
  {
    id: 'test-reviewer',
    label: 'Test Reviewer',
    role: 'Checks test coverage, fixtures, regression paths, and edge cases.',
    status: 'waiting',
    mode: 'review',
    avatar: 'TEST',
    scope: 'Read-only'
  },
  {
    id: 'a11y-reviewer',
    label: 'Accessibility Reviewer',
    role: 'Checks keyboard, focus, labels, semantics, and announcements.',
    status: 'waiting',
    mode: 'review',
    avatar: 'A11Y',
    scope: 'Read-only'
  },
  {
    id: 'security-reviewer',
    label: 'Security Reviewer',
    role: 'Checks data handling, dependencies, secrets, and policy risks.',
    status: 'waiting',
    mode: 'review',
    avatar: 'SEC',
    scope: 'Read-only'
  },
  {
    id: 'build-verifier',
    label: 'Build Verifier',
    role: 'Runs or recommends lint, tests, build, and smoke verification.',
    status: 'waiting',
    mode: 'verify',
    avatar: 'BUILD',
    scope: 'Read-only commands'
  },
  {
    id: 'merge-arbitrator',
    label: 'Merge Arbitrator',
    role: 'Merges reviewer findings and decides rework, approve, or ask human.',
    status: 'waiting',
    mode: 'decision',
    avatar: 'ARB',
    scope: 'Decision only'
  }
];

const FALLBACK_TASKS = [
  {
    id: 'task-001',
    title: 'Clarify assignment and approve first implementation slice',
    owner: 'Lead Planner',
    status: 'not started',
    lane: 'planning',
    risk: 'medium'
  },
  {
    id: 'task-002',
    title: 'Implement approved code change in guarded scope',
    owner: 'Main Developer',
    status: 'waiting',
    lane: 'build',
    risk: 'medium'
  },
  {
    id: 'task-003',
    title: 'Run parallel review and verification cycle',
    owner: 'Reviewer Team',
    status: 'waiting',
    lane: 'review',
    risk: 'low'
  }
];

const REVIEW_LANES = [
  { id: 'architecture', label: 'Architecture', score: 'Pending', icon: Network },
  { id: 'tests', label: 'Tests', score: 'Pending', icon: ListChecks },
  { id: 'a11y', label: 'Accessibility', score: 'Pending', icon: ShieldCheck },
  { id: 'security', label: 'Security', score: 'Pending', icon: Database },
  { id: 'build', label: 'Build', score: 'Pending', icon: Wrench }
];

function titleize(value) {
  return String(value || 'not started')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toneFor(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('fail') || text.includes('block') || text.includes('risk')) return 'danger';
  if (text.includes('wait') || text.includes('pending') || text.includes('review') || text.includes('medium')) return 'warning';
  if (text.includes('ready') || text.includes('pass') || text.includes('complete') || text.includes('online')) return 'success';
  return 'neutral';
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.json();
}

async function postJson(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.json();
}

function normalizeAgent(agent) {
  const id = agent.id || agent.name || 'agent';
  const text = `${id} ${agent.name || ''}`.toLowerCase();
  let avatar = 'AI';
  if (text.includes('planner') || text.includes('scheduler')) avatar = 'PLAN';
  else if (text.includes('developer')) avatar = 'DEV';
  else if (text.includes('architecture')) avatar = 'ARCH';
  else if (text.includes('unit') || text.includes('test')) avatar = 'TEST';
  else if (text.includes('accessibility') || text.includes('a11y')) avatar = 'A11Y';
  else if (text.includes('security') || text.includes('compliance')) avatar = 'SEC';
  else if (text.includes('build') || text.includes('verify')) avatar = 'BUILD';
  else if (text.includes('arbitrator') || text.includes('merge')) avatar = 'ARB';
  return {
    id,
    label: agent.name || titleize(id),
    role: agent.responsibility || 'Agent role will appear after planning.',
    status: agent.status || 'waiting',
    mode: agent.mode || 'agent',
    avatar,
    scope: Array.isArray(agent.allowedFiles) && agent.allowedFiles.length
      ? `${agent.allowedFiles.length} approved file(s)`
      : 'Read-only or waiting'
  };
}

function useOdtRuntime() {
  const [state, setState] = useState({
    loading: true,
    online: false,
    health: null,
    agentic: null,
    contextArtifacts: null,
    reviewPacket: null,
    clarifications: null,
    agentStatus: null,
    repoStatus: null,
    error: ''
  });

  async function refresh() {
    setState((current) => ({ ...current, loading: true }));
    const healthResult = await getJson('/health').then((data) => ({ ok: true, data })).catch((error) => ({ ok: false, error }));
    if (!healthResult.ok) {
      setState((current) => ({
        ...current,
        loading: false,
        online: false,
        error: 'Local ODT API is offline. Start npm run mcp:local:serve to enable live control.'
      }));
      return;
    }

    const [agentic, contextArtifacts, reviewPacket, clarifications, agentStatus, promptStatus] = await Promise.all([
      getJson('/odt/agentic').catch(() => null),
      getJson('/odt/context-artifacts').catch(() => null),
      getJson('/odt/review-packet').catch(() => null),
      getJson('/odt/clarifications').catch(() => null),
      getJson('/odt/agent/status').catch(() => null),
      getJson('/odt/prompt-provider-status').catch(() => null)
    ]);

    const repoStatus = await postJson('/repo/status', {}).catch(() => null);
    setState({
      loading: false,
      online: true,
      health: healthResult.data,
      agentic,
      contextArtifacts,
      reviewPacket,
      clarifications,
      agentStatus,
      repoStatus,
      promptStatus,
      error: ''
    });
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 8000);
    return () => window.clearInterval(timer);
  }, []);

  return { state, refresh };
}

function useWorkbenchState() {
  const [assignment, setAssignment] = useState(() => ({
    requirement: '',
    repoPath: '',
    agentTool: 'codex',
    mode: 'team',
    approvalPolicy: 'human-gated'
  }));
  const [activePage, setActivePage] = useState('overview');
  const [theme, setTheme] = useState(() => window.localStorage.getItem('odt-workbench-theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('odt-workbench-theme', theme);
  }, [theme]);

  return {
    assignment,
    setAssignment,
    activePage,
    setActivePage,
    theme,
    setTheme
  };
}

function deriveRuntime(runtime) {
  const roster = runtime.state.agentic?.agentRoster?.agents;
  const reviewerPlan = runtime.state.agentic?.reviewerPlan?.reviewers;
  const reviewerFindings = runtime.state.agentic?.reviewerFindings?.reviewers;
  const agents = Array.isArray(roster) && roster.length
    ? roster.map((agent) => {
      const reviewer = [...(reviewerPlan || []), ...(reviewerFindings || [])].find((item) => item.id === agent.id) || {};
      return normalizeAgent({ ...agent, ...reviewer });
    })
    : FALLBACK_AGENTS;

  const tasks = Array.isArray(runtime.state.agentic?.taskGraph?.tasks) && runtime.state.agentic.taskGraph.tasks.length
    ? runtime.state.agentic.taskGraph.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      owner: task.suggestedAgent || 'Main Developer',
      status: task.status || 'planned',
      lane: task.kind || 'implementation',
      risk: task.priority || 'medium'
    }))
    : FALLBACK_TASKS;

  return {
    agents,
    tasks,
    changedFiles: runtime.state.reviewPacket?.summary?.changedFiles || 0,
    contextTotal: runtime.state.contextArtifacts?.summary?.total || 0,
    contextReady: runtime.state.contextArtifacts?.summary?.ready || 0,
    openQuestions: runtime.state.clarifications?.summary?.open || 0,
    highQuestions: runtime.state.clarifications?.summary?.unresolvedHigh || 0,
    agentStatus: runtime.state.agentStatus?.status || 'idle',
    provider: runtime.state.promptStatus?.provider || 'template'
  };
}

function App() {
  const runtime = useOdtRuntime();
  const workbench = useWorkbenchState();
  const derived = useMemo(() => deriveRuntime(runtime), [runtime.state]);

  return (
    <div className="app-shell">
      <Sidebar activePage={workbench.activePage} onNavigate={workbench.setActivePage} />
      <main className="app-main">
        <TopBar
          online={runtime.state.online}
          loading={runtime.state.loading}
          theme={workbench.theme}
          onToggleTheme={() => workbench.setTheme(workbench.theme === 'dark' ? 'light' : 'dark')}
          onRefresh={runtime.refresh}
        />
        <PageRouter
          activePage={workbench.activePage}
          runtime={runtime}
          derived={derived}
          assignment={workbench.assignment}
          setAssignment={workbench.setAssignment}
        />
      </main>
    </div>
  );
}

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/oracle-dev-twin-collab.png" alt="" />
        <div>
          <strong>ODT</strong>
          <span>Workbench</span>
        </div>
      </div>
      <nav className="nav-list" aria-label="Workbench">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={activePage === item.id ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-status">
        <Sparkles size={16} />
        <span>Human-gated multi-agent delivery</span>
      </div>
    </aside>
  );
}

function TopBar({ online, loading, theme, onToggleTheme, onRefresh }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <div className="topbar-icon"><PanelLeft size={18} /></div>
        <div>
          <h1>Oracle Developer Twin</h1>
          <p>Developer and development-team twin for governed feature delivery.</p>
        </div>
      </div>
      <div className="topbar-actions">
        <span className={`status-chip ${online ? 'success' : 'danger'}`}>
          {loading ? 'Checking' : online ? 'Local API Online' : 'API Offline'}
        </span>
        <button className="icon-button" type="button" onClick={onRefresh} title="Refresh live ODT data">
          <RefreshCcw size={17} />
        </button>
        <button className="mode-button" type="button" onClick={onToggleTheme}>
          <span>Theme</span>
          <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
        </button>
      </div>
    </header>
  );
}

function PageRouter(props) {
  switch (props.activePage) {
    case 'intake':
      return <IntakePage {...props} />;
    case 'team':
      return <AgentTeamPage {...props} />;
    case 'planner':
      return <PlannerPage {...props} />;
    case 'review':
      return <ReviewPage {...props} />;
    case 'artifacts':
      return <ArtifactsPage {...props} />;
    case 'runs':
      return <RunsPage {...props} />;
    case 'settings':
      return <SettingsPage {...props} />;
    default:
      return <OverviewPage {...props} />;
  }
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

function OverviewPage({ runtime, derived, assignment, setAssignment }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Mission Control"
        title="Plan, delegate, review, and verify from one workbench"
        copy="ODT keeps humans in control while specialized agents handle planning, implementation support, parallel reviews, and verification evidence."
        actions={(
          <>
            <button className="primary-button" type="button"><Play size={17} /> Start Run</button>
            <button className="secondary-button" type="button"><GitBranch size={17} /> Open Review Gate</button>
          </>
        )}
      />
      <div className="kpi-grid">
        <Kpi title="Agent Status" value={titleize(derived.agentStatus)} note="Current delegated execution state" tone={toneFor(derived.agentStatus)} />
        <Kpi title="Changed Files" value={String(derived.changedFiles)} note="From review packet" tone={derived.changedFiles ? 'warning' : 'neutral'} />
        <Kpi title="Context Vault" value={`${derived.contextReady}/${derived.contextTotal}`} note="Ready artifacts attached" tone={derived.contextTotal ? 'success' : 'neutral'} />
        <Kpi title="Open Questions" value={String(derived.openQuestions)} note={`${derived.highQuestions} high-severity blockers`} tone={derived.highQuestions ? 'danger' : 'success'} />
      </div>
      <div className="mission-grid">
        <AssignmentCard assignment={assignment} setAssignment={setAssignment} runtime={runtime} />
        <TeamPulse agents={derived.agents} />
      </div>
      <FlowBoard tasks={derived.tasks} />
    </div>
  );
}

function AssignmentCard({ assignment, setAssignment, runtime }) {
  return (
    <section className="surface assignment-card">
      <div className="surface-head">
        <div>
          <span className="eyebrow">Current Assignment</span>
          <h3>Developer Twin Intake</h3>
        </div>
        <span className={`status-chip ${runtime.state.online ? 'success' : 'danger'}`}>
          {runtime.state.online ? 'Connected' : 'Offline'}
        </span>
      </div>
      <textarea
        value={assignment.requirement}
        onChange={(event) => setAssignment((current) => ({ ...current, requirement: event.target.value }))}
        placeholder="Paste a feature, defect, refactor, backend/API task, database change, or test improvement..."
      />
      <div className="field-row">
        <label>
          <span>Target repo</span>
          <input
            value={assignment.repoPath}
            onChange={(event) => setAssignment((current) => ({ ...current, repoPath: event.target.value }))}
            placeholder="/Users/you/project"
          />
        </label>
        <label>
          <span>Agent mode</span>
          <select
            value={assignment.mode}
            onChange={(event) => setAssignment((current) => ({ ...current, mode: event.target.value }))}
          >
            <option value="team">Agent team</option>
            <option value="single">Single developer agent</option>
            <option value="review-only">Review only</option>
          </select>
        </label>
      </div>
      <div className="inline-actions">
        <button className="primary-button" type="button"><Sparkles size={17} /> Generate Plan</button>
        <button className="secondary-button" type="button"><Upload size={17} /> Add Context</button>
      </div>
    </section>
  );
}

function TeamPulse({ agents }) {
  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="eyebrow">Agent Team</span>
          <h3>Role-based delivery swarm</h3>
        </div>
        <span className="status-chip neutral">{agents.length} Roles</span>
      </div>
      <div className="agent-list compact">
        {agents.slice(0, 6).map((agent) => (
          <AgentRow key={agent.id} agent={agent} />
        ))}
      </div>
    </section>
  );
}

function FlowBoard({ tasks }) {
  const columns = [
    { id: 'planning', label: 'Plan' },
    { id: 'build', label: 'Build' },
    { id: 'review', label: 'Review' }
  ];
  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="eyebrow">Execution Flow</span>
          <h3>Task sequencing and parallel lanes</h3>
        </div>
        <button className="secondary-button" type="button"><Search size={16} /> Inspect Plan</button>
      </div>
      <div className="kanban">
        {columns.map((column) => (
          <div className="lane" key={column.id}>
            <div className="lane-head">
              <strong>{column.label}</strong>
              <span>{tasks.filter((task) => task.lane === column.id || (column.id === 'build' && task.lane === 'implementation')).length}</span>
            </div>
            {tasks
              .filter((task) => task.lane === column.id || (column.id === 'build' && task.lane === 'implementation'))
              .map((task) => <TaskCard task={task} key={task.id} />)}
          </div>
        ))}
      </div>
    </section>
  );
}

function IntakePage({ assignment, setAssignment, runtime }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Intake"
        title="Ask only the questions that matter"
        copy="The intake page captures the assignment, target repo, context artifacts, and human constraints before ODT allows delegation."
      />
      <div className="two-column">
        <AssignmentCard assignment={assignment} setAssignment={setAssignment} runtime={runtime} />
        <section className="surface">
          <div className="surface-head">
            <div>
              <span className="eyebrow">Clarification Gate</span>
              <h3>Decision-critical questions</h3>
            </div>
            <span className={`status-chip ${runtime.state.clarifications?.summary?.unresolvedHigh ? 'danger' : 'success'}`}>
              {runtime.state.clarifications?.summary?.unresolvedHigh || 0} High
            </span>
          </div>
          <div className="empty-state">
            <MessageSquareText size={28} />
            <strong>No blocking questions yet</strong>
            <p>ODT should infer normal implementation defaults unless ambiguity changes code, test, data, or security decisions.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function AgentTeamPage({ derived }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Agent Team"
        title="Lead planner with specialized teammates"
        copy="Use a team only when parallel planning, implementation support, review, and verification are worth the coordination overhead."
      />
      <div className="agent-grid">
        {derived.agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
      </div>
    </div>
  );
}

function PlannerPage({ derived }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Planner"
        title="Approve task order before code writes"
        copy="Planner output should make task order, dependencies, write scope, and review gates explicit before an agent starts implementation."
      />
      <FlowBoard tasks={derived.tasks} />
    </div>
  );
}

function ReviewPage({ derived, runtime }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Review Workspace"
        title="Turn reviewer findings into clear developer decisions"
        copy="Each reviewer lane should produce actionable findings. The merge arbitrator converts them into approve, rework, ask-human, or verify decisions."
      />
      <div className="review-grid">
        {REVIEW_LANES.map((lane) => {
          const Icon = lane.icon;
          return (
            <section className="surface review-lane" key={lane.id}>
              <div className="surface-head">
                <div className="review-title">
                  <Icon size={18} />
                  <h3>{lane.label}</h3>
                </div>
                <span className="status-chip neutral">{lane.score}</span>
              </div>
              <p>No current findings loaded for this lane.</p>
              <button className="secondary-button" type="button">Open Lane <ChevronRight size={16} /></button>
            </section>
          );
        })}
      </div>
      <section className="surface">
        <div className="surface-head">
          <div>
            <span className="eyebrow">Review Packet</span>
            <h3>{derived.changedFiles} changed file(s)</h3>
          </div>
          <span className="status-chip warning">{runtime.state.reviewPacket?.status || 'not refreshed'}</span>
        </div>
        <ChangedFileList files={runtime.state.reviewPacket?.files || []} />
      </section>
    </div>
  );
}

function ArtifactsPage({ runtime }) {
  const artifacts = runtime.state.contextArtifacts?.artifacts || [];
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Artifacts"
        title="Context vault and generated evidence"
        copy="Keep design inputs, database schema snippets, PDFs, spreadsheets, prompts, and run evidence visible without leaking stale files into new assignments."
      />
      <div className="artifact-grid">
        {artifacts.length ? artifacts.map((artifact) => (
          <section className="surface artifact-card" key={artifact.id || artifact.path}>
            <div className="surface-head">
              <span className={`status-chip ${toneFor(artifact.status)}`}>{titleize(artifact.status)}</span>
              <span className="status-chip neutral">{titleize(artifact.kind || artifact.type || 'file')}</span>
            </div>
            <h3>{artifact.name || artifact.path?.split('/').pop() || 'Artifact'}</h3>
            <p>{artifact.processingStrategy || artifact.recommendation || 'Ready for planning context.'}</p>
            <code>{artifact.path || artifact.absolutePath}</code>
          </section>
        )) : (
          <section className="surface">
            <div className="empty-state">
              <Archive size={30} />
              <strong>No artifacts attached</strong>
              <p>Upload only context that materially changes the implementation or review.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function RunsPage({ derived, runtime }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Runs"
        title="Run history and live execution health"
        copy="Track planning, delegation, review, rework, and verification cycles as a timeline."
      />
      <section className="surface timeline">
        {[
          ['API heartbeat', runtime.state.online ? 'online' : 'offline', runtime.state.health?.generatedAt || 'not available'],
          ['Agent launch', derived.agentStatus, runtime.state.agentStatus?.detail || 'No delegated launch yet'],
          ['Review packet', runtime.state.reviewPacket?.status || 'not refreshed', `${derived.changedFiles} changed files`],
          ['Prompt provider', derived.provider, 'Prompt source for stage generation']
        ].map(([label, status, detail]) => (
          <div className="timeline-row" key={label}>
            <span className={`timeline-dot ${toneFor(status)}`} />
            <div>
              <strong>{label}</strong>
              <p>{titleize(status)} · {detail}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function SettingsPage({ assignment, setAssignment, runtime }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Settings"
        title="Enterprise controls for safe developer-team automation"
        copy="Configure model provider, approval policy, tool selection, stale-state cleanup, and what agents may read or write."
      />
      <div className="two-column">
        <section className="surface">
          <div className="surface-head">
            <div>
              <span className="eyebrow">Delegation</span>
              <h3>Agent control policy</h3>
            </div>
            <ShieldCheck size={20} />
          </div>
          <label className="setting-row">
            <span>Approval policy</span>
            <select
              value={assignment.approvalPolicy}
              onChange={(event) => setAssignment((current) => ({ ...current, approvalPolicy: event.target.value }))}
            >
              <option value="human-gated">Human-gated writes</option>
              <option value="review-only">Review-only mode</option>
              <option value="sandbox">Sandbox experiments</option>
            </select>
          </label>
          <label className="setting-row">
            <span>Default tool</span>
            <select
              value={assignment.agentTool}
              onChange={(event) => setAssignment((current) => ({ ...current, agentTool: event.target.value }))}
            >
              <option value="codex">Codex</option>
              <option value="cline">Cline</option>
            </select>
          </label>
        </section>
        <section className="surface">
          <div className="surface-head">
            <div>
              <span className="eyebrow">Provider</span>
              <h3>Prompt generation</h3>
            </div>
            <span className="status-chip neutral">{runtime.state.promptStatus?.provider || 'template'}</span>
          </div>
          <p className="muted">OCI GenAI can be used when available. Template fallback stays available for offline or restricted environments.</p>
        </section>
      </div>
    </div>
  );
}

function Kpi({ title, value, note, tone }) {
  return (
    <section className={`kpi ${tone || 'neutral'}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </section>
  );
}

function AgentCard({ agent }) {
  return (
    <section className="surface agent-card">
      <div className="agent-card-head">
        <div className={`agent-avatar ${toneFor(agent.status)}`}>{agent.avatar}</div>
        <span className={`status-chip ${toneFor(agent.status)}`}>{titleize(agent.status)}</span>
      </div>
      <h3>{agent.label}</h3>
      <p>{agent.role}</p>
      <div className="agent-meta">
        <span>{titleize(agent.mode)}</span>
        <span>{agent.scope}</span>
      </div>
    </section>
  );
}

function AgentRow({ agent }) {
  return (
    <div className="agent-row">
      <div className={`agent-avatar small ${toneFor(agent.status)}`}>{agent.avatar}</div>
      <div>
        <strong>{agent.label}</strong>
        <span>{titleize(agent.status)} · {titleize(agent.mode)}</span>
      </div>
    </div>
  );
}

function TaskCard({ task }) {
  return (
    <article className="task-card">
      <div className="task-head">
        <span className={`status-chip ${toneFor(task.status)}`}>{titleize(task.status)}</span>
        <span className={`risk ${toneFor(task.risk)}`}>{titleize(task.risk)}</span>
      </div>
      <strong>{task.title}</strong>
      <p>{task.owner}</p>
    </article>
  );
}

function ChangedFileList({ files }) {
  if (!files.length) {
    return (
      <div className="empty-state inline">
        <FileDiff size={26} />
        <strong>No changed files detected</strong>
        <p>Refresh after the developer agent creates or updates files.</p>
      </div>
    );
  }
  return (
    <div className="file-list">
      {files.slice(0, 8).map((file) => (
        <div className="file-row" key={file.path}>
          <Code2 size={17} />
          <span>{file.path}</span>
          <strong>{titleize(file.status || file.kind || 'changed')}</strong>
        </div>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
