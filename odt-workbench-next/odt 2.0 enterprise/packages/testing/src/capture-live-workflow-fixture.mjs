import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertWorkflowStateContract } from '../../domain/src/workflow-contract.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const enterpriseRoot = resolve(currentDir, '../../..');

const assignmentId = process.argv[2] || 'assignment-local-mvp';
const apiBase = process.env.ODT_API_BASE || 'http://127.0.0.1:5190';
const outputPath = resolve(
  enterpriseRoot,
  `packages/testing/src/fixtures/workflow/live/${assignmentId}.workflow.json`
);

if (typeof fetch !== 'function') {
  console.error('Live workflow fixture capture requires Node 18+ with fetch support. Use Node 24 for ODT.');
  process.exit(1);
}

const response = await fetch(`${apiBase}/api/workflow/state/${encodeURIComponent(assignmentId)}`);
if (!response.ok) {
  const detail = await response.text().catch(() => '');
  throw new Error(`Unable to fetch workflow state: HTTP ${response.status} ${detail}`);
}

const payload = await response.json();
const workflow = payload.workflowState || payload;
assertWorkflowStateContract(workflow);

const fixture = {
  capturedAt: new Date().toISOString(),
  apiBase,
  assignmentId,
  source: `/api/workflow/state/${assignmentId}`,
  workflow
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');

console.log(`Captured live workflow fixture: ${outputPath}`);
