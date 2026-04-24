function escapeHtml(text) {
  return `${text || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderList(items, emptyText) {
  if (!items || !items.length) {
    return `<li>${escapeHtml(emptyText)}</li>`;
  }
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderCandidateDetails(items) {
  if (!items || !items.length) {
    return '<li>No candidate files inferred yet</li>';
  }
  return items.map((item) => {
    const exportsText = (item.exportNames || []).length ? item.exportNames.join(', ') : 'none';
    const reasonsText = (item.reasons || []).length ? item.reasons.join(', ') : 'path-ranked';
    return [
      '<li>',
      `<strong>${escapeHtml(item.file)}</strong>`,
      `<div><small>score: ${escapeHtml(item.score)} | exports: ${escapeHtml(exportsText)}</small></div>`,
      `<div><small>signals: ${escapeHtml(reasonsText)}</small></div>`,
      `<div><small>${escapeHtml(item.preview || 'No preview available')}</small></div>`,
      '</li>'
    ].join('');
  }).join('');
}

function renderDevTwinDashboard(model) {
  const { intake, risks, impact, generatedAt } = model;
  const intakeName = intake.title || intake.featureName || 'Untitled work item';
  const inference = impact.inference || {};
  const mockups = (intake.designInputs && intake.designInputs.mockupImages) || [];
  const refs = (intake.designInputs && intake.designInputs.referenceDocs) || [];
  const hints = (intake.developerHints && intake.developerHints.suspectedAreas) || [];
  const candidateDetails = inference.candidateDetails || [];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Developer Twin Dashboard</title>
  <style>
    :root {
      --bg: #eef4f9;
      --card: #ffffff;
      --ink: #182534;
      --muted: #5b6c80;
      --accent: #0f67b9;
      --accent-soft: #edf5ff;
      --line: #d8e2ee;
      --good: #137c5b;
      --warn: #a76a00;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      background:
        radial-gradient(circle at 15% 0%, rgba(15, 103, 185, 0.12), transparent 32%),
        var(--bg);
      color: var(--ink);
    }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 22px; }
    .hero {
      background: linear-gradient(135deg, #0f67b9 0%, #1492b3 100%);
      color: #fff;
      border-radius: 18px;
      padding: 22px 24px;
      box-shadow: 0 18px 40px rgba(17, 35, 61, 0.12);
    }
    .hero h1 { margin: 0; font-size: 30px; }
    .hero p { margin: 8px 0 0; max-width: 780px; line-height: 1.5; }
    .grid { display: grid; gap: 12px; margin-top: 14px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 8px 22px rgba(17, 35, 61, 0.05);
    }
    .metric-label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
    .metric-value { font-size: 30px; font-weight: 700; color: var(--accent); margin-top: 6px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .three { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
    h2 { margin: 0 0 10px; font-size: 18px; }
    ul { margin: 0; padding-left: 18px; }
    li { margin: 6px 0; line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid var(--line); padding: 8px; text-align: left; font-size: 13px; }
    th { color: var(--muted); }
    .pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 11px;
      font-weight: 700;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    .good { color: var(--good); }
    .warn { color: var(--warn); }
    .foot { color: var(--muted); font-size: 12px; margin-top: 12px; }
    @media (max-width: 980px) {
      .two, .three { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Developer Twin Analysis Dashboard</h1>
      <p>ODT turns a ticket, mockups, and requirements into inferred repo impact, code/test guidance, accessibility review inputs, and human-review artifacts. Developers can provide optional hints, but the workflow is designed to scan the repo and surface candidate impact areas automatically.</p>
    </section>

    <section class="grid">
      <article class="card"><div class="metric-label">Work Item</div><div class="metric-value">${escapeHtml(intakeName)}</div></article>
      <article class="card"><div class="metric-label">Repo Analysis Mode</div><div class="metric-value">${escapeHtml(inference.mode || 'unknown')}</div></article>
      <article class="card"><div class="metric-label">Candidate Modules</div><div class="metric-value">${impact.totals.modules}</div></article>
      <article class="card"><div class="metric-label">Candidate Files</div><div class="metric-value">${impact.totals.totalSourceFiles}</div></article>
      <article class="card"><div class="metric-label">Related Tests</div><div class="metric-value">${impact.totals.totalTestFiles}</div></article>
      <article class="card"><div class="metric-label">Blast Radius</div><div class="metric-value">${impact.totals.blastRadius}</div></article>
    </section>

    <section class="two">
      <article class="card">
        <h2>Intake Summary</h2>
        <ul>
          <li>Work item type: <strong>${escapeHtml(intake.workItemType)}</strong></li>
          <li>Jira ticket: <strong>${escapeHtml((intake.jira && intake.jira.ticketId) || 'not supplied')}</strong></li>
          <li>Mockups attached: <strong>${mockups.length}</strong></li>
          <li>Reference docs: <strong>${refs.length}</strong></li>
          <li>Optional suspected areas: <strong>${hints.length}</strong></li>
        </ul>
      </article>
      <article class="card">
        <h2>What The Agent Inferred</h2>
        <div>
          ${((inference.keywords || []).slice(0, 10)).map((keyword) => `<span class="pill">${escapeHtml(keyword)}</span>`).join('') || '<span class="pill">no keywords inferred</span>'}
        </div>
        <table style="margin-top:10px;">
          <thead><tr><th>Signal</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>Inference Mode</td><td>${escapeHtml(inference.mode || 'unknown')}</td></tr>
            <tr><td>Hinted Areas Used</td><td>${(inference.hintedAreas || []).length}</td></tr>
            <tr><td>Candidate Files Surfaced</td><td>${(inference.candidateFiles || []).length}</td></tr>
          </tbody>
        </table>
      </article>
    </section>

    <section class="three">
      <article class="card">
        <h2>Candidate Files</h2>
        <ul>${renderCandidateDetails(candidateDetails.slice(0, 8))}</ul>
      </article>
      <article class="card">
        <h2>Impact Hotspots</h2>
        <ul>${renderList((impact.hotspots || []).map((item) => `${item.modulePath} (${item.blastRadius})`), 'No hotspots yet')}</ul>
      </article>
      <article class="card">
        <h2>Review Gates</h2>
        <ul>
          <li class="good">Human review required before merge.</li>
          <li>Code workpack and unit-test workpack are generated from inferred impact.</li>
          <li>VPAT/WCAG and keyboard checks remain mandatory quality gates.</li>
        </ul>
      </article>
    </section>

    <section class="two">
      <article class="card">
        <h2>Acceptance Criteria</h2>
        <ul>${renderList((intake.requirements && intake.requirements.acceptanceCriteria) || [], 'No acceptance criteria provided')}</ul>
      </article>
      <article class="card">
        <h2>Risk Notes</h2>
        <ul>${renderList(risks, 'No risk notes generated')}</ul>
      </article>
    </section>

    <p class="foot">Generated at: ${escapeHtml(generatedAt)}</p>
  </main>
</body>
</html>
`;
}

module.exports = { renderDevTwinDashboard };
