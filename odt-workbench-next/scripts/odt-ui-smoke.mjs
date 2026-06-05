import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const appBase = process.env.ODT_APP_BASE || 'http://127.0.0.1:5189';
const apiBase = process.env.ODT_API_BASE || 'http://127.0.0.1:5190';
const assignmentId = process.env.ODT_ASSIGNMENT_ID || 'assignment-local-mvp';
const expectedIssue = process.env.ODT_EXPECT_ISSUE || 'JOURNEY-25366';
const screenshotDir = process.env.ODT_SMOKE_SCREENSHOT_DIR || join(process.cwd(), 'output', 'playwright');

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
  await page.goto(`${appBase}/${hash}`, { waitUntil: 'networkidle' });
  const screenshotPath = join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const text = await page.locator('body').innerText();
  required.forEach((item) => assertIncludes(text, item, name));
  forbidden.forEach((item) => assertExcludes(text, item, name));
  return { name, screenshotPath };
}

async function main() {
  mkdirSync(screenshotDir, { recursive: true });

  const health = await getJson(`${apiBase}/api/health`);
  assert(health.ok, 'ODT API health check did not return ok=true.');

  const workflowResponse = await getJson(`${apiBase}/api/workflow/state/${encodeURIComponent(assignmentId)}`);
  const workflow = workflowResponse.workflowState || workflowResponse;
  assert(workflow.state === 'JIRA_COMPLETED_VERIFICATION', `Expected JIRA_COMPLETED_VERIFICATION, got ${workflow.state}.`);
  assert(workflow.verificationProfile?.issueKey === expectedIssue, `Expected ${expectedIssue}, got ${workflow.verificationProfile?.issueKey || 'no issue key'}.`);
  assert(workflow.allowedActions?.canLaunchVerification === true, 'Expected verification launch to be allowed.');
  assert(workflow.allowedActions?.canDelegateWrite === false, 'Expected write delegation to remain blocked for completed Jira verification.');

  const playwright = await loadPlaywright();
  const chromium = playwright.chromium || playwright.default?.chromium;
  assert(chromium, 'Playwright loaded, but chromium browser type was not available.');
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHROME_CHANNEL || 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
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
