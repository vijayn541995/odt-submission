const DIGITAL_WORKER_ICON_SVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='dwg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#c74634'/><stop offset='100%' stop-color='#0b6bcb'/></linearGradient></defs><rect x='12' y='16' width='40' height='34' rx='11' fill='url(#dwg)'/><rect x='18' y='22' width='28' height='20' rx='8' fill='#ffffff' fill-opacity='0.18'/><circle cx='25' cy='31' r='4' fill='#ffffff'/><circle cx='39' cy='31' r='4' fill='#ffffff'/><rect x='24' y='39' width='16' height='3' rx='1.5' fill='#ffffff'/><rect x='29' y='8' width='6' height='8' rx='3' fill='#c74634'/><circle cx='32' cy='7' r='3' fill='#f5d6d2'/></svg>";
const DIGITAL_WORKER_ICON_DATA_URI = `data:image/svg+xml,${encodeURIComponent(DIGITAL_WORKER_ICON_SVG)}`;
const DIGITAL_WORKER_ASSET_RELATIVE_PATH = './assets/oracle-dev-twin-collab.png';
const ORACLE_WORDMARK_SVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 232 48'><rect x='1.5' y='1.5' width='229' height='45' rx='22.5' fill='#fff8f1' stroke='#c74634' stroke-width='3'/><text x='116' y='31' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='21' font-weight='700' letter-spacing='5' fill='#c74634'>ORACLE</text></svg>";
const ORACLE_WORDMARK_DATA_URI = `data:image/svg+xml,${encodeURIComponent(ORACLE_WORDMARK_SVG)}`;
const THEME_STORAGE_KEY = 'oracle-developer-twin-theme-v1';

function esc(text) {
  return `${text || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function badgeClass(status) {
  if (status === 'completed') return 'ok';
  if (status === 'failed') return 'bad';
  return 'warn';
}

function renderRows(stages) {
  return stages.map((s) => (
    `<tr>
      <td>${esc(s.name)}</td>
      <td><span class="badge ${badgeClass(s.status)}">${esc(s.status)}</span></td>
      <td>${esc(s.startedAt)}</td>
      <td>${esc(s.finishedAt)}</td>
    </tr>`
  )).join('\n');
}

function renderList(items, emptyText) {
  if (!items || !items.length) {
    return `<li>${esc(emptyText)}</li>`;
  }
  return items.map((item) => `<li>${esc(item)}</li>`).join('');
}

function renderOdtDashboard(payload) {
  const { summary, profile, stages, kpis, intake } = payload;
  const compliance = kpis.compliance;
  const impacts = kpis.impact;
  const tests = kpis.tests;
  const design = kpis.design;
  const review = kpis.review || {};
  const trend = kpis.trend || {};
  const blockerDelta = trend.blockerDelta === null
    ? 'n/a'
    : (trend.blockerDelta >= 0 ? `+${trend.blockerDelta}` : `${trend.blockerDelta}`);
  const intakeName = intake.title || intake.featureName || 'Untitled work item';
  const acceptanceCriteria = (intake.requirements && intake.requirements.acceptanceCriteria) || [];
  const nonFunctional = (intake.requirements && intake.requirements.nonFunctional) || [];
  const suspectedAreas = (intake.developerHints && intake.developerHints.suspectedAreas) || [];
  const profileLabel = profile.id === 'react-js' || profile.name === 'React + JavaScript'
    ? 'React'
    : (profile.name || profile.id || 'Custom');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Oracle Developer Twin Dashboard</title>
  <link rel="icon" type="image/png" href="${DIGITAL_WORKER_ASSET_RELATIVE_PATH}" />
  <script>
    (function () {
      var key = '${THEME_STORAGE_KEY}';
      var theme = 'light';
      try {
        var saved = window.localStorage.getItem(key);
        if (saved === 'dark' || saved === 'light') {
          theme = saved;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          theme = 'dark';
        }
      } catch (error) {
        theme = 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;
    }());
  </script>
  <style>
    :root{
      color-scheme: light;
      --bg:#f6f4f1;
      --ink:#1d2730;
      --muted:#5f6b76;
      --card:#ffffff;
      --line:#e1d7d2;
      --brand:#c74634;
      --brand-2:#de7d61;
      --brand-deep:#6f2119;
      --ok:#137f5b;
      --warn:#a06a00;
      --bad:#b42318;
      --surface-soft:#f8fafc;
      --pill-bg:#ecf5ff;
      --pill-ink:var(--brand);
      --code-bg:#0f172a;
      --code-ink:#e2e8f0;
      --card-shadow:0 8px 24px rgba(61,37,32,0.06);
      --head-summary-bg:rgba(255,255,255,.12);
      --head-summary-border:rgba(255,255,255,.18);
      --head-pill-bg:rgba(255,255,255,.14);
      --head-pill-border:rgba(255,255,255,.18);
      --theme-toggle-bg:rgba(255,255,255,.14);
      --theme-toggle-border:rgba(255,255,255,.22);
      --theme-toggle-ink:#fff;
      --badge-ok-bg:#e8f8f1;
      --badge-ok-ink:var(--ok);
      --badge-warn-bg:#fff5e6;
      --badge-warn-ink:var(--warn);
      --badge-bad-bg:#fdecec;
      --badge-bad-ink:var(--bad);
    }
    :root[data-theme="dark"]{
      color-scheme: dark;
      --bg:#0f141b;
      --ink:#edf2f7;
      --muted:#a4b1be;
      --card:#18212b;
      --line:#2c3946;
      --ok:#62d09a;
      --warn:#f2c46c;
      --bad:#ff9486;
      --surface-soft:#121a23;
      --pill-bg:#203040;
      --pill-ink:#ffd2c9;
      --code-bg:#0b1016;
      --code-ink:#dfe8f2;
      --card-shadow:0 16px 36px rgba(0,0,0,0.32);
      --head-summary-bg:rgba(255,255,255,.10);
      --head-summary-border:rgba(255,255,255,.14);
      --head-pill-bg:rgba(255,255,255,.10);
      --head-pill-border:rgba(255,255,255,.14);
      --theme-toggle-bg:rgba(255,255,255,.10);
      --theme-toggle-border:rgba(255,255,255,.16);
      --theme-toggle-ink:#fff;
      --badge-ok-bg:rgba(19,127,91,.18);
      --badge-ok-ink:#c9f6e0;
      --badge-warn-bg:rgba(160,106,0,.18);
      --badge-warn-ink:#ffe6ad;
      --badge-bad-bg:rgba(180,35,24,.20);
      --badge-bad-ink:#ffd3ce;
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:"Oracle Sans","Segoe UI",Arial,sans-serif;
      background:
        radial-gradient(circle at 12% 0%, rgba(199,70,52,0.16), transparent 34%),
        radial-gradient(circle at 88% 0%, rgba(222,125,97,0.12), transparent 28%),
        var(--bg);
      color:var(--ink);
      transition:background .22s ease,color .22s ease;
    }
    .wrap{max-width:1320px;margin:0 auto;padding:22px}
    .head{
      position:relative;
      overflow:hidden;
      background:linear-gradient(130deg, var(--brand-deep), var(--brand) 52%, var(--brand-2));
      color:#fff;border-radius:28px;padding:28px 30px;
      box-shadow:0 18px 40px rgba(111,33,25,0.18);
    }
    .head::after{
      content:"";
      position:absolute;
      inset:0;
      background:linear-gradient(120deg, transparent 0%, transparent 60%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.02) 100%);
      pointer-events:none;
    }
    .head-actions{
      position:relative;
      z-index:1;
      display:flex;
      justify-content:flex-end;
      margin-bottom:16px;
    }
    .theme-toggle{
      display:inline-flex;
      align-items:center;
      gap:12px;
      border:1px solid var(--theme-toggle-border);
      border-radius:999px;
      padding:10px 14px;
      background:var(--theme-toggle-bg);
      color:var(--theme-toggle-ink);
      font-size:12px;
      font-weight:700;
      cursor:pointer;
      box-shadow:0 14px 28px rgba(0,0,0,.14);
      transition:transform .18s ease,background .18s ease,border-color .18s ease;
    }
    .theme-toggle:hover{transform:translateY(-1px);background:rgba(255,255,255,.18)}
    .theme-toggle:focus-visible{outline:3px solid rgba(255,255,255,.24);outline-offset:3px}
    .theme-toggle-label{
      font-size:10px;
      letter-spacing:.08em;
      text-transform:uppercase;
      color:rgba(255,255,255,.78);
    }
    .theme-toggle-value{font-size:13px;line-height:1;color:#fff}
    .head-top{
      display:grid;
      grid-template-columns:minmax(138px, 184px) minmax(0, 1fr) minmax(220px, 280px);
      gap:28px;
      align-items:center;
      position:relative;
      z-index:1;
    }
    .head-logo{
      width:clamp(124px, 10vw, 168px);
      height:clamp(124px, 10vw, 168px);
      border-radius:32px;
      object-fit:cover;
      object-position:center;
      display:block;
      border:1px solid rgba(255,255,255,0.24);
      background:rgba(255,255,255,0.08);
      box-shadow:0 18px 36px rgba(0,0,0,0.22);
    }
    .head-copy{
      min-width:0;
      display:grid;
      justify-items:start;
      text-align:left;
      gap:10px;
      max-width:min(920px, 100%);
    }
    .head-oracle{
      width:168px;
      max-width:100%;
      height:auto;
      display:block;
      margin-bottom:8px;
    }
    .head-kicker{
      font-size:clamp(20px,1.65vw,26px);
      line-height:1.34;
      font-weight:700;
      color:rgba(255,245,240,.98);
      max-width:32ch;
    }
    .head h1{
      margin:0;
      max-width:15ch;
      font-size:clamp(42px,3.9vw,62px);
      line-height:0.98;
      letter-spacing:-0.03em;
      text-shadow:0 10px 28px rgba(84, 22, 15, 0.20);
    }
    .head p{
      margin:0;
      opacity:.95;
      max-width:58ch;
      line-height:1.76;
      color:rgba(255,244,239,.92);
      font-size:clamp(15px,1.12vw,18px);
    }
    .head-summary{
      width:100%;
      border-radius:18px;
      padding:16px 18px;
      background:var(--head-summary-bg);
      border:1px solid var(--head-summary-border);
      text-align:left;
      box-shadow:0 12px 24px rgba(0,0,0,0.12);
    }
    .head-summary label{
      display:block;
      font-size:10px;
      letter-spacing:.08em;
      text-transform:uppercase;
      font-weight:700;
      color:rgba(255,255,255,.76);
      margin-bottom:8px;
    }
    .head-summary strong{
      display:block;
      font-size:24px;
      line-height:1.04;
      color:#fff;
    }
    .head-summary span{
      display:block;
      margin-top:8px;
      font-size:12px;
      line-height:1.5;
      color:rgba(255,255,255,.88);
    }
    .head-meta{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top:16px;
      position:relative;
      z-index:1;
    }
    .head-pill{
      display:inline-flex;
      align-items:center;
      padding:8px 12px;
      border-radius:999px;
      font-size:11px;
      letter-spacing:.06em;
      text-transform:uppercase;
      font-weight:700;
      background:var(--head-pill-bg);
      border:1px solid var(--head-pill-border);
      color:#fff;
    }
    .grid{
      display:grid;gap:12px;margin-top:14px;
      grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
    }
    .card{
      background:var(--card);border:1px solid var(--line);
      border-radius:18px;padding:16px;
      box-shadow:var(--card-shadow);
    }
    .metric{font-size:30px;font-weight:700;color:var(--brand)}
    .label{color:var(--muted);font-size:13px;text-transform:uppercase;letter-spacing:.03em}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
    .three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px}
    table{width:100%;border-collapse:collapse}
    th,td{padding:9px;border-bottom:1px solid var(--line);text-align:left;font-size:13px}
    th{color:var(--muted);font-weight:600;background:var(--surface-soft)}
    .badge{display:inline-block;padding:3px 8px;border-radius:12px;font-size:12px;font-weight:600}
    .ok{background:var(--badge-ok-bg);color:var(--badge-ok-ink)}
    .warn{background:var(--badge-warn-bg);color:var(--badge-warn-ink)}
    .bad{background:var(--badge-bad-bg);color:var(--badge-bad-ink)}
    .section h2{margin:0 0 8px;font-size:18px}
    .list{margin:0;padding-left:18px}
    .list li{margin:5px 0}
    .subtle{color:var(--muted);font-size:13px}
    .pill{
      display:inline-block;
      margin:4px 6px 0 0;
      padding:4px 10px;
      border-radius:999px;
      background:var(--pill-bg);
      color:var(--pill-ink);
      font-size:11px;
      font-weight:700;
    }
    .code{
      background:var(--code-bg);color:var(--code-ink);border-radius:8px;
      padding:8px 10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;
    }
    @media (max-width:980px){
      .two,.three{grid-template-columns:1fr}
      .head-actions{margin-bottom:14px}
      .head-top{grid-template-columns:1fr}
      .head-copy{justify-items:center;text-align:center}
      .head-logo{width:112px;height:112px;border-radius:28px}
      .head h1{font-size:clamp(30px,8vw,42px);max-width:12ch}
      .head-kicker{font-size:18px}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="head">
      <div class="head-actions">
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch theme">
          <span class="theme-toggle-label">Theme</span>
          <span class="theme-toggle-value" data-theme-label>Light</span>
        </button>
      </div>
      <div class="head-top">
        <img class="head-logo" src="${DIGITAL_WORKER_ASSET_RELATIVE_PATH}" alt="Oracle Developer Twin digital worker" />
        <div class="head-copy">
          <img class="head-oracle" src="${ORACLE_WORDMARK_DATA_URI}" alt="Oracle" />
          <h1>Oracle Developer Twin</h1>
          <div class="head-kicker">Human-reviewed digital worker for frontend delivery</div>
          <p>Operational view of intake quality, repo impact, accessibility posture, and governed implementation readiness.</p>
        </div>
        <div class="head-summary">
          <label>Run Status</label>
          <strong>${esc(summary.status)}</strong>
          <span>${summary.completedStages}/${summary.totalStages} stages complete</span>
        </div>
      </div>
      <div class="head-meta">
        <span class="head-pill">Profile: ${esc(profileLabel)}</span>
        <span class="head-pill">Work Item: ${esc(intake.workItemType || 'feature')}</span>
        <span class="head-pill">Modules: ${impacts.modules}</span>
        <span class="head-pill">A11y Gate: ${esc(compliance.status)}</span>
      </div>
    </section>

    <section class="grid">
      <article class="card"><div class="label">Stages Completed</div><div class="metric">${summary.completedStages}/${summary.totalStages}</div></article>
      <article class="card"><div class="label">Automation Coverage</div><div class="metric">${kpis.automationCoverage}%</div></article>
      <article class="card"><div class="label">Inferred Modules</div><div class="metric">${impacts.modules}</div></article>
      <article class="card"><div class="label">Candidate Files</div><div class="metric">${impacts.sourceFiles}</div></article>
      <article class="card"><div class="label">Related Tests</div><div class="metric">${impacts.testFiles}</div></article>
      <article class="card"><div class="label">A11y Blockers</div><div class="metric">${compliance.blockers === null ? '-' : compliance.blockers}</div></article>
    </section>

    <section class="grid">
      <article class="card"><div class="label">Impact Mode</div><div class="metric">${esc(impacts.inferenceMode || 'unknown')}</div></article>
      <article class="card"><div class="label">Candidate Files Surfaced</div><div class="metric">${impacts.candidateFiles || 0}</div></article>
      <article class="card"><div class="label">Blocker Trend</div><div class="metric">${blockerDelta}</div><div class="subtle">vs previous run</div></article>
      <article class="card"><div class="label">Avg Automation Coverage</div><div class="metric">${trend.averageAutomationCoverage5Runs || 0}%</div></article>
      <article class="card"><div class="label">Review-ready Runs (5)</div><div class="metric">${trend.reviewReadyRuns5 || 0}</div></article>
      <article class="card"><div class="label">Run Success Rate (10)</div><div class="metric">${trend.runSuccessRate10Runs || 0}%</div></article>
    </section>

    <section class="two">
      <article class="card section">
        <h2>Ticket Intake</h2>
        <ul class="list">
          <li>Title: <strong>${esc(intakeName)}</strong></li>
          <li>Jira: <strong>${esc((intake.jira && intake.jira.ticketId) || 'not supplied')}</strong></li>
          <li>Acceptance criteria: <strong>${acceptanceCriteria.length}</strong></li>
          <li>Non-functional requirements: <strong>${nonFunctional.length}</strong></li>
          <li>Optional hints provided: <strong>${suspectedAreas.length}</strong></li>
        </ul>
      </article>
      <article class="card section">
        <h2>Repository Impact</h2>
        <ul class="list">
          <li>Repo scan mode: <strong>${esc((intake.scope && intake.scope.repoScan) || 'full')}</strong></li>
          <li>Modules inferred: <strong>${impacts.modules}</strong></li>
          <li>Source files surfaced: <strong>${impacts.sourceFiles}</strong></li>
          <li>Test files linked: <strong>${impacts.testFiles}</strong></li>
          <li>Blast radius score: <strong>${impacts.blastRadius}</strong></li>
        </ul>
        <div>${(impacts.keywords || []).map((keyword) => `<span class="pill">${esc(keyword)}</span>`).join('') || '<span class="pill">no keywords</span>'}</div>
      </article>
    </section>

    <section class="three">
      <article class="card section">
        <h2>Technical Design</h2>
        <ul class="list">
          <li>Design artifact generated: <strong>${design.available ? 'Yes' : 'No'}</strong></li>
          <li>Architecture profile: React/Terra + scoped edits</li>
          <li>Impact-led design review before coding</li>
        </ul>
      </article>
      <article class="card section">
        <h2>Code & Test Guidance</h2>
        <ul class="list">
          <li>Code workpack: <strong>Generated</strong></li>
          <li>Unit-test workpack: <strong>${tests.available ? 'Generated' : 'Missing'}</strong></li>
          <li>Regression surface linked to inferred impact</li>
        </ul>
      </article>
      <article class="card section">
        <h2>Compliance & Review</h2>
        <ul class="list">
          <li>VPAT/WCAG gate: <strong>${compliance.status}</strong></li>
          <li>Keyboard parity verification included</li>
          <li>Human approval required: <strong>${review.humanApprovalRequired ? 'Yes' : 'No'}</strong></li>
        </ul>
      </article>
    </section>

    <section class="two">
      <article class="card section">
        <h2>Pipeline Stages</h2>
        <table>
          <thead><tr><th>Stage</th><th>Status</th><th>Started</th><th>Finished</th></tr></thead>
          <tbody>${renderRows(stages)}</tbody>
        </table>
      </article>
      <article class="card section">
        <h2>Developer Run Flow</h2>
        <ol class="list">
          <li>Fill intake with ticket, requirements, mockups, and constraints.</li>
          <li>Run ODT to infer repo impact and generate workpacks.</li>
          <li>Review design, code, tests, and accessibility guidance.</li>
          <li>Use Codex/Cline to implement, then verify before merge.</li>
        </ol>
        <div class="code">npm run odt:run -- --profile react-js --withA11y</div>
      </article>
    </section>
  </main>
  <script>
    (function () {
      var key = '${THEME_STORAGE_KEY}';
      var root = document.documentElement;
      var button = document.querySelector('[data-theme-toggle]');
      var label = document.querySelector('[data-theme-label]');

      function sync(theme) {
        var nextTheme = theme === 'dark' ? 'dark' : 'light';
        root.setAttribute('data-theme', nextTheme);
        root.style.colorScheme = nextTheme;
        if (label) label.textContent = nextTheme === 'dark' ? 'Dark' : 'Light';
        if (button) {
          button.setAttribute('aria-label', nextTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
          button.setAttribute('title', nextTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
      }

      sync(root.getAttribute('data-theme') || 'light');

      if (!button) return;
      button.addEventListener('click', function () {
        var nextTheme = (root.getAttribute('data-theme') || 'light') === 'dark' ? 'light' : 'dark';
        sync(nextTheme);
        try {
          window.localStorage.setItem(key, nextTheme);
        } catch (error) {
          // ignore storage failures in demo mode
        }
      });
    }());
  </script>
</body>
</html>`;
}

module.exports = { renderOdtDashboard };
