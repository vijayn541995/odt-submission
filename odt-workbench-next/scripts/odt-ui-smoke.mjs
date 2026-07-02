import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const appBase = process.env.ODT_APP_BASE || 'http://127.0.0.1:5189';
const apiBase = process.env.ODT_API_BASE || 'http://127.0.0.1:5190';
const assignmentId = process.env.ODT_ASSIGNMENT_ID || 'assignment-local-mvp';
const expectedIssue = process.env.ODT_EXPECT_ISSUE || '';
const screenshotDir = process.env.ODT_SMOKE_SCREENSHOT_DIR || join(process.cwd(), 'output', 'playwright');
const smokeMode = process.env.ODT_SMOKE_MODE || 'completed-jira-verification';

function findCachedPlaywrightDirs() {
  const cacheRoot = join(process.env.HOME || '', '.npm', '_npx');
  if (!existsSync(cacheRoot)) return [];
  return readdirSync(cacheRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(cacheRoot, entry.name, 'node_modules'))
    .filter((path) => existsSync(join(path, 'playwright', 'package.json')));
}

async function loadPlaywright() {
  const explicitModuleDir = process.env.PLAYWRIGHT_NODE_MODULES;
  const searchPaths = [
    explicitModuleDir,
    join(process.cwd(), 'node_modules'),
    ...findCachedPlaywrightDirs()
  ].filter(Boolean);

  try {
    return await import('playwright');
  } catch {
    // Continue to explicit resolution below.
  }

  for (const searchPath of searchPaths) {
    try {
      const resolved = require.resolve('playwright', { paths: [searchPath] });
      return await import(pathToFileURL(resolved).href);
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error([
    'Playwright is not available to this smoke test.',
    'Run one of:',
    '  npx --package playwright playwright --version',
    '  PLAYWRIGHT_NODE_MODULES=/path/to/node_modules npm run test:ui:smoke',
    'or add Playwright as an approved dev dependency later.'
  ].join('\n'));
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  return response.json();
}

function parseStoredSetting(settings, key, fallback = '') {
  const row = settings?.storedSettings?.find((item) => item.key === key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value || fallback;
  }
}

async function getActiveAssignmentSetting() {
  return parseStoredSetting(await getJson(`${apiBase}/api/settings`), 'activeAssignmentId', '');
}

async function setActiveAssignmentSetting(nextAssignmentId) {
  if (!nextAssignmentId) return;
  await postJson(`${apiBase}/api/settings`, { settings: { activeAssignmentId: nextAssignmentId } });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(text, value, pageName) {
  assert(text.toLowerCase().includes(String(value).toLowerCase()), `${pageName} missing expected text: ${value}`);
}

function assertExcludes(text, value, pageName) {
  assert(!text.toLowerCase().includes(String(value).toLowerCase()), `${pageName} contains stale text: ${value}`);
}

async function assertPage(page, { name, hash, required, forbidden }) {
  await page.goto(`${appBase}/${hash}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  const screenshotPath = join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const text = await page.locator('body').innerText();
  required.forEach((item) => assertIncludes(text, item, name));
  forbidden.forEach((item) => assertExcludes(text, item, name));
  return { name, screenshotPath };
}

async function createBrowserPage() {
  const playwright = await loadPlaywright();
  const chromium = playwright.chromium || playwright.default?.chromium;
  assert(chromium, 'Playwright loaded, but chromium browser type was not available.');
  const launchCandidates = process.env.PLAYWRIGHT_CHROME_CHANNEL
    ? [{ headless: true, channel: process.env.PLAYWRIGHT_CHROME_CHANNEL }]
    : [{ headless: true }, { headless: true, channel: 'chrome' }];
  let lastError = null;
  for (const launchOptions of launchCandidates) {
    try {
      const browser = await chromium.launch(launchOptions);
      const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
      return { browser, page };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function runAgentTeamRelaySmoke() {
  const previousActiveAssignmentId = await getActiveAssignmentSetting();
  const workflowResponse = await getJson(`${apiBase}/api/workflow/state/${encodeURIComponent(assignmentId)}`);
  const workflow = workflowResponse.workflowState || workflowResponse;
  assert(workflow.state === 'REVIEW_CYCLE_CLOSEOUT', `Expected REVIEW_CYCLE_CLOSEOUT, got ${workflow.state}.`);
  assert(workflow.nextAction?.label === 'Launch Rework Worker', `Expected Launch Rework Worker, got ${workflow.nextAction?.label || 'no next action'}.`);

  const evidence = await getJson(`${apiBase}/api/assignments/${encodeURIComponent(assignmentId)}/evidence`);
  const current = evidence.current || {};
  const relayItems = Array.isArray(current.agentRelayItems) ? current.agentRelayItems : [];
  const workerRuns = Array.isArray(current.agentWorkerRuns) ? current.agentWorkerRuns : [];
  assert(relayItems.some((item) => item.title === 'Rework required: Implementation'), 'Expected open implementation rework relay.');
  assert(workerRuns.some((run) => run.output?.responseBytes && run.output?.logBytes), 'Expected worker run output with response/log byte metadata.');

  const { browser, page } = await createBrowserPage();
  const results = [];
  try {
    if (previousActiveAssignmentId !== assignmentId) {
      await setActiveAssignmentSetting(assignmentId);
    }
    results.push(await assertPage(page, {
      name: 'team-relay-closeout',
      hash: '#team',
      required: [
        'Agent Team',
        'Review Cycle Closeout',
        'Launch Rework Worker',
        'Agent Relay Inbox',
        'Rework required: Implementation',
        'Use Rework',
        'Worker Run Detail',
        'Response size',
        'Log size',
        'Live Log Tail'
      ],
      forbidden: []
    }));
  } finally {
    try {
      await browser.close();
    } finally {
      if (previousActiveAssignmentId && previousActiveAssignmentId !== assignmentId) {
        await setActiveAssignmentSetting(previousActiveAssignmentId);
      }
    }
  }

  console.log(JSON.stringify({
    status: 'passed',
    mode: smokeMode,
    appBase,
    apiBase,
    assignmentId,
    workflowState: workflow.state,
    nextAction: workflow.nextAction?.label,
    relayItems: relayItems.length,
    workerRuns: workerRuns.length,
    screenshots: results
  }, null, 2));
}

async function assertApiRoutes() {
  const routes = [
    '/api/health',
    '/api/snapshot',
    '/api/settings',
    '/api/project-contracts',
    `/api/workflow/state/${encodeURIComponent(assignmentId)}`,
    `/api/review/cycle/${encodeURIComponent(assignmentId)}/closeout`,
    `/api/agents/worker-runs/${encodeURIComponent(assignmentId)}`,
    `/api/agents/relay/${encodeURIComponent(assignmentId)}`,
    `/api/monitoring/error-log?assignmentId=${encodeURIComponent(assignmentId)}`,
    `/api/runs?assignmentId=${encodeURIComponent(assignmentId)}`,
    '/api/connectors'
  ];
  const responses = [];
  for (const route of routes) {
    const response = await fetch(`${apiBase}${route}`);
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    assert(response.ok, `${route} returned HTTP ${response.status}`);
    responses.push({
      route,
      status: response.status,
      summary: summarizeApiResponse(route, body)
    });
  }
  return responses;
}

function summarizeApiResponse(route, body) {
  if (!body || typeof body !== 'object') return '';
  if (route === '/api/health') return body.ok ? 'ok' : 'not ok';
  if (route === '/api/snapshot') return body.activeAssignmentId || '';
  if (route === '/api/settings') return `${body.promptTemplates?.length || 0} prompt templates`;
  if (route === '/api/project-contracts') return `${body.contracts?.length || 0} project contract(s)`;
  if (route.includes('/workflow/state/')) return body.workflowState?.state || body.state || '';
  if (route.includes('/review/cycle/')) return body.closeout?.status || '';
  if (route.includes('/worker-runs/')) return `${body.workerRuns?.length || 0} worker run(s)`;
  if (route.includes('/agents/relay/')) return `${body.relayItems?.length || 0} relay item(s)`;
  if (route.includes('/monitoring/error-log')) return `${body.items?.length || 0} monitoring item(s)`;
  if (route.includes('/api/runs')) return `${body.runs?.length || 0} run(s)`;
  if (route === '/api/connectors') return `${body.connectors?.length || 0} connector(s)`;
  return '';
}

async function runDemoHardeningSmoke() {
  const apiRoutes = await assertApiRoutes();
  const { browser, page } = await createBrowserPage();
  const pages = [
    { name: 'demo-hardening-overview', hash: '#overview', required: ['Workflow State', 'Standards Gate', 'Recent Activity'] },
    { name: 'demo-hardening-intake', hash: '#intake', required: ['Capture requirement, Jira, and repo context', 'Project workspace', 'Import Jira', 'Copy to ODT Workspace'] },
    { name: 'demo-hardening-planner', hash: '#planner', required: ['Plan Summary', 'Approval Gate', 'Standards Gate Checklist', 'Agent Handoff'] },
    { name: 'demo-hardening-standards', hash: '#standards', required: ['Run Standards Check', 'Governance Scorecard', 'Policy Flexibility', 'Dependency Approval Lane'] },
    { name: 'demo-hardening-team', hash: '#team', required: ['Agent Team', 'Team Operating Model', 'Agent Foundry', 'Execution Health', 'Worker Run Detail'] },
    { name: 'demo-hardening-review', hash: '#review', required: ['Review and rework control', 'Review Cycle Closeout', 'Review Queue', 'Add Review Comment'] },
    { name: 'demo-hardening-pr-ready', hash: '#pr', required: ['PR Readiness Command Center', 'PR Package Builder', 'Gate Decision', 'Readiness Checklist'] },
    { name: 'demo-hardening-artifacts', hash: '#artifacts', required: ['Saved outputs and evidence', 'Artifact Detail'] },
    { name: 'demo-hardening-guide', hash: '#guide', required: ['Platform coach and evidence guide', 'Send', 'Current Context'] },
    { name: 'demo-hardening-runs', hash: '#runs', required: ['Recent Runs'] },
    { name: 'demo-hardening-monitoring', hash: '#monitoring', required: ['AI usage, latency, errors, and fallback visibility', 'Error & Health Log', 'ODT Validation'] },
    { name: 'demo-hardening-settings', hash: '#settings', required: ['Safe configuration status', 'AI Provider', 'Context Intake Limits', 'Connector Hub'] }
  ];
  const results = [];
  try {
    for (const pageSpec of pages) {
      results.push(await assertPage(page, {
        ...pageSpec,
        forbidden: ['Unhandled Runtime Error', 'Cannot read properties of undefined']
      }));
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({
    status: 'passed',
    mode: smokeMode,
    appBase,
    apiBase,
    assignmentId,
    apiRoutes,
    screenshots: results
  }, null, 2));
}

async function main() {
  mkdirSync(screenshotDir, { recursive: true });

  const health = await getJson(`${apiBase}/api/health`);
  assert(health.ok, 'ODT API health check did not return ok=true.');

  if (smokeMode === 'demo-hardening') {
    await runDemoHardeningSmoke();
    return;
  }

  if (smokeMode === 'agent-team-relay') {
    await runAgentTeamRelaySmoke();
    return;
  }

  const workflowResponse = await getJson(`${apiBase}/api/workflow/state/${encodeURIComponent(assignmentId)}`);
  const workflow = workflowResponse.workflowState || workflowResponse;
  assert(workflow.state === 'JIRA_COMPLETED_VERIFICATION', `Expected JIRA_COMPLETED_VERIFICATION, got ${workflow.state}.`);
  assert(workflow.verificationProfile?.issueKey === expectedIssue, `Expected ${expectedIssue}, got ${workflow.verificationProfile?.issueKey || 'no issue key'}.`);
  assert(workflow.allowedActions?.canLaunchVerification === true, 'Expected verification launch to be allowed.');
  assert(workflow.allowedActions?.canDelegateWrite === false, 'Expected write delegation to remain blocked for completed Jira verification.');

  const { browser, page } = await createBrowserPage();
  const results = [];

  results.push(await assertPage(page, {
    name: 'planner-verification',
    hash: '#planner',
    required: [
      `${expectedIssue} Verification Plan`,
      'Verification Contract',
      'Repo Evidence',
      'No target repo writes until Reviewer creates explicit rework.'
    ],
    forbidden: [
      'Add or reuse isAssessmentPreviewable(questions).'
    ]
  }));

  results.push(await assertPage(page, {
    name: 'standards-verification',
    hash: '#standards',
    required: [
      'Verification Standards Contract',
      'COMPLETED JIRA GATE',
      'No implementation by default',
      'Update Verification Plan',
      'Verification Contract',
      'Repo Evidence'
    ],
    forbidden: [
      'Add or reuse isAssessmentPreviewable(questions).'
    ]
  }));

  results.push(await assertPage(page, {
    name: 'team-verification',
    hash: '#team',
    required: [
      'Verification Lane',
      'COMPLETED JIRA DETECTED',
      'Launch Reviewer',
      'Verification First',
      'Senior Full Stack Dev'
    ],
    forbidden: [
      'Assessment Save Draft is still blocked for incomplete questions',
      'Coverage gaps remain for required update API payload scenarios'
    ]
  }));

  results.push(await assertPage(page, {
    name: 'review-verification',
    hash: '#review',
    required: [
      'Completed Jira Verification',
      'Verification Evidence Checklist',
      'Reviewer evidence',
      'Build/test verification',
      'Verification Evidence Capture',
      'Record Verification Evidence'
    ],
    forbidden: [
      'Add or reuse isAssessmentPreviewable(questions).'
    ]
  }));

  results.push(await assertPage(page, {
    name: 'pr-verification',
    hash: '#pr',
    required: [
      'Completed Jira Verification Inputs',
      'Verification Evidence Checklist',
      'PR Gate',
      'NOT_PREPARED',
      'Verification gaps before pack',
      'PR readiness package'
    ],
    forbidden: [
      'Add or reuse isAssessmentPreviewable(questions).'
    ]
  }));

  await browser.close();
  console.log(JSON.stringify({
    status: 'passed',
    appBase,
    apiBase,
    assignmentId,
    expectedIssue,
    screenshots: results
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
