const path = require('path');
const { runScan } = require('./scan');
const { parseFindings } = require('../twin/parser');
const {
  buildPriorityQueue,
  buildRuleSummary,
  buildFileHotspots,
  buildRecommendationBacklog,
  estimateEffort
} = require('../twin/engine');
const { renderDashboard } = require('../twin/dashboard');
const { ensureDir, writeFile } = require('../utils/fs');

const TWIN_OUTPUT_DIR = 'reports/a11y-twin';

function toMarkdown(result) {
  const lines = [
    '# A11y Twin Priority Queue',
    '',
    `- Generated At: ${result.generatedAt}`,
    `- Files Scanned: ${result.metadata.filesScanned}`,
    `- Total Findings: ${result.summary.total}`,
    `- Blockers: ${result.summary.blockers}`,
    `- Estimated Triage Reduction: ${result.effort.triageReductionPercent}%`,
    '',
    '## Recommended Rule Backlog',
    ''
  ];

  result.recommendationBacklog.forEach((item) => {
    lines.push(`### ${item.rank}. ${item.ruleId} (${item.count})`);
    lines.push(`- Action: ${item.action}`);
    lines.push(`- Why: ${item.whyItMatters}`);
    lines.push(`- Implementation Hint: ${item.implementationHint}`);
    lines.push('');
  });

  lines.push('## Priority Queue (Top 25)');
  lines.push('');
  lines.push('| Rule | File | Line | Score | Suggested Fix |');
  lines.push('| --- | --- | ---: | ---: | --- |');

  result.priorityQueue.forEach((item) => {
    lines.push(
      `| ${item.ruleId} | ${item.file} | ${item.line} | ${item.score} | ${item.playbook.implementationHint.replace(/\|/g, '\\|')} |`
    );
  });

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function sanitize(text) {
  return `${text || ''}`.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function buildWorkpack(queue, generatedAt) {
  const byFile = queue.reduce((acc, item) => {
    if (!acc[item.file]) acc[item.file] = [];
    acc[item.file].push(item);
    return acc;
  }, {});

  const files = Object.keys(byFile).sort();

  const promptLines = [
    '# Coding Agent Prompt: A11y Twin Workpack',
    '',
    `Generated At: ${generatedAt}`,
    '',
    'You are acting as a senior accessibility engineer for a React + Terra codebase.',
    'Apply safe fixes only for the findings below.',
    'Constraints:',
    '- Keep behavior unchanged except accessibility fixes.',
    '- Prefer semantic HTML/button/link before aria workarounds.',
    '- For clickable non-interactive elements, ensure keyboard parity (tab, Enter, Space).',
    '- For Terra icons, add a11y labels when functional and hide decorative icons.',
    '- For form controls, ensure accessible name via label/htmlFor or aria-label/aria-labelledby.',
    '- Do not auto-commit.',
    '- After edits, run: npm run a11y:scan:ci || true',
    '',
    'Files in scope:',
    ...files.map((file) => `- ${file}`),
    '',
    'Prioritized findings:',
    '| Rule | File | Line | Score | Suggested Fix |',
    '| --- | --- | ---: | ---: | --- |'
  ];

  queue.forEach((item) => {
    promptLines.push(
      `| ${item.ruleId} | ${item.file} | ${item.line} | ${item.score} | ${sanitize(item.playbook.implementationHint)} |`
    );
  });

  promptLines.push('');
  promptLines.push('Findings payload (JSON):');
  promptLines.push('```json');
  promptLines.push(JSON.stringify(queue, null, 2));
  promptLines.push('```');
  promptLines.push('');

  return {
    promptMarkdown: `${promptLines.join('\n')}\n`,
    payload: {
      generatedAt,
      totalFindings: queue.length,
      fileCount: files.length,
      files,
      findings: queue
    }
  };
}

function applyMaxFiles(queue, maxFiles) {
  if (!maxFiles || maxFiles < 1) return queue;

  const selectedFiles = [];
  const filtered = [];

  queue.forEach((item) => {
    if (!selectedFiles.includes(item.file) && selectedFiles.length < maxFiles) {
      selectedFiles.push(item.file);
    }
    if (selectedFiles.includes(item.file)) {
      filtered.push(item);
    }
  });

  return filtered;
}

function runTwinAnalyze(options) {
  const input = options.input;
  const parsed = parseFindings(input);
  const limit = Number(options.limit || 25);

  const ruleSummary = buildRuleSummary(parsed.indexes);
  const hotspots = buildFileHotspots(parsed.indexes, 20);
  const priorityQueue = buildPriorityQueue(parsed.findings, parsed.indexes, limit);
  const effort = estimateEffort(priorityQueue);
  const recommendationBacklog = buildRecommendationBacklog(ruleSummary, 10);
  const generatedAt = new Date().toISOString();

  const result = {
    generatedAt,
    metadata: parsed.payload.metadata || {},
    summary: parsed.summary,
    ruleSummary,
    hotspots,
    priorityQueue,
    recommendationBacklog,
    effort
  };

  const outputDir = path.resolve(process.cwd(), TWIN_OUTPUT_DIR);
  ensureDir(outputDir);

  writeFile(path.join(outputDir, 'insights.json'), `${JSON.stringify(result, null, 2)}\n`);
  writeFile(path.join(outputDir, 'priority-queue.md'), toMarkdown(result));
  writeFile(path.join(outputDir, 'index.html'), renderDashboard(result));

  // eslint-disable-next-line no-console
  console.log(
    `A11y Twin analyze complete. blockers=${result.summary.blockers} topRule=${result.ruleSummary[0] ? result.ruleSummary[0].ruleId : 'none'} dashboard=${TWIN_OUTPUT_DIR}/index.html`
  );

  return result;
}

function runTwinVerify() {
  const parsed = parseFindings();
  const blockers = parsed.summary.blockers;
  const status = blockers === 0 ? 'pass' : 'action_required';
  const outputDir = path.resolve(process.cwd(), TWIN_OUTPUT_DIR);
  const generatedAt = new Date().toISOString();

  const markdown = [
    '# A11y Twin Verify',
    '',
    `- Generated At: ${generatedAt}`,
    `- Blockers Remaining: ${blockers}`,
    `- Status: ${status}`,
    '',
    status === 'pass'
      ? 'All blocker-level findings are resolved.'
      : 'Blockers remain. Use `reports/a11y-twin/priority-queue.md` to execute next fixes.'
  ].join('\n');

  const json = {
    generatedAt,
    blockers,
    status
  };

  ensureDir(outputDir);
  writeFile(path.join(outputDir, 'verify.md'), `${markdown}\n`);
  writeFile(path.join(outputDir, 'verify.json'), `${JSON.stringify(json, null, 2)}\n`);

  // eslint-disable-next-line no-console
  console.log(`A11y Twin verify complete. status=${status} blockers=${blockers}`);

  return json;
}

function runTwinWorkpack(options) {
  const input = options.input;
  const limit = Number(options.limit || 20);
  const maxFiles = options['max-files'] ? Number(options['max-files']) : null;
  const parsed = parseFindings(input);
  const rankedQueue = buildPriorityQueue(parsed.findings, parsed.indexes, limit);
  const queue = applyMaxFiles(rankedQueue, maxFiles);
  const generatedAt = new Date().toISOString();
  const workpack = buildWorkpack(queue, generatedAt);
  const outputDir = path.resolve(process.cwd(), TWIN_OUTPUT_DIR);

  ensureDir(outputDir);
  writeFile(path.join(outputDir, 'coding-agent-workpack.md'), workpack.promptMarkdown);
  // Backward-compatible alias for older docs/flows.
  writeFile(path.join(outputDir, 'cline-workpack.md'), workpack.promptMarkdown);
  writeFile(path.join(outputDir, 'workpack.json'), `${JSON.stringify(workpack.payload, null, 2)}\n`);

  // eslint-disable-next-line no-console
  console.log(
    `A11y Twin workpack generated. findings=${queue.length} files=${workpack.payload.fileCount} prompt=${TWIN_OUTPUT_DIR}/coding-agent-workpack.md`
  );

  return workpack.payload;
}

async function runTwinDemo() {
  await runScan({ full: true });
  const analysis = runTwinAnalyze({ limit: 25 });
  runTwinWorkpack({ limit: 20 });
  const verification = runTwinVerify();

  // eslint-disable-next-line no-console
  console.log(
    `A11y Twin demo flow complete. scan->prioritize->suggest->verify status=${verification.status} blockers=${analysis.summary.blockers}`
  );
}

module.exports = {
  runTwinAnalyze,
  runTwinWorkpack,
  runTwinVerify,
  runTwinDemo
};
