function escapeHtml(text) {
  return `${text || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tableRows(items, columns) {
  return items
    .map((item) => (
      `<tr>${columns.map((column) => `<td>${escapeHtml(item[column])}</td>`).join('')}</tr>`
    ))
    .join('\n');
}

function renderDashboard(model) {
  const { metadata, summary, ruleSummary, hotspots, priorityQueue, effort, generatedAt } = model;
  const topRules = ruleSummary.slice(0, 5);
  const topQueue = priorityQueue.slice(0, 10);
  const topHotspots = hotspots.slice(0, 8);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A11y Twin Dashboard</title>
  <style>
    :root {
      --bg: #f2f6f7;
      --card: #ffffff;
      --ink: #122025;
      --muted: #4b5f67;
      --accent: #006d77;
      --accent-soft: #d8f1ef;
      --danger: #b00020;
      --line: #d7e1e4;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      color: var(--ink);
      background: radial-gradient(circle at 20% 20%, #e4f8f4, transparent 45%), var(--bg);
    }
    .wrap {
      max-width: 1120px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 32px;
      line-height: 1.2;
    }
    .sub {
      margin: 0 0 24px;
      color: var(--muted);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 16px;
    }
    .metric {
      font-size: 30px;
      font-weight: 700;
      margin: 4px 0 0;
    }
    .danger { color: var(--danger); }
    h2 {
      margin: 0 0 12px;
      font-size: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      text-align: left;
      padding: 8px 6px;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-weight: 600;
      background: var(--accent-soft);
    }
    .stack {
      display: grid;
      gap: 12px;
    }
    .foot {
      margin-top: 16px;
      color: var(--muted);
      font-size: 12px;
    }
    @media (max-width: 768px) {
      .wrap { padding: 12px; }
      h1 { font-size: 26px; }
      table { font-size: 13px; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <h1>Frontend Accessibility Twin</h1>
    <p class="sub">Digital Worker output for demo day: scan, prioritize, suggest, verify.</p>

    <section class="grid">
      <article class="card">
        <div>Files Scanned</div>
        <div class="metric">${metadata.filesScanned}</div>
      </article>
      <article class="card">
        <div>Total Findings</div>
        <div class="metric">${summary.total}</div>
      </article>
      <article class="card">
        <div>Blockers</div>
        <div class="metric danger">${summary.blockers}</div>
      </article>
      <article class="card">
        <div>Triage Reduction</div>
        <div class="metric">${effort.triageReductionPercent}%</div>
      </article>
      <article class="card">
        <div>Priority Queue Effort</div>
        <div class="metric">${effort.remediationHours}h</div>
      </article>
    </section>

    <section class="stack">
      <article class="card">
        <h2>Top Rules</h2>
        <table>
          <thead>
            <tr><th>Rule</th><th>Count</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${tableRows(topRules.map((rule) => ({
    ruleId: rule.ruleId,
    count: rule.count,
    action: rule.playbook.title
  })), ['ruleId', 'count', 'action'])}
          </tbody>
        </table>
      </article>

      <article class="card">
        <h2>Component Hotspots</h2>
        <table>
          <thead>
            <tr><th>File</th><th>Findings</th></tr>
          </thead>
          <tbody>
            ${tableRows(topHotspots, ['file', 'count'])}
          </tbody>
        </table>
      </article>

      <article class="card">
        <h2>Priority Fix Queue</h2>
        <table>
          <thead>
            <tr><th>Rule</th><th>File</th><th>Line</th><th>Score</th><th>Recommendation</th></tr>
          </thead>
          <tbody>
            ${tableRows(topQueue.map((item) => ({
    ruleId: item.ruleId,
    file: item.file,
    line: item.line,
    score: item.score,
    recommendation: item.playbook.implementationHint
  })), ['ruleId', 'file', 'line', 'score', 'recommendation'])}
          </tbody>
        </table>
      </article>
    </section>

    <p class="foot">
      Standard: ${escapeHtml(metadata.standardPrimary)} (fallback: ${escapeHtml(metadata.standardFallback)})<br/>
      Generated at: ${escapeHtml(generatedAt)}
    </p>
  </main>
</body>
</html>
`;
}

module.exports = { renderDashboard };
