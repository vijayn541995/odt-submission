const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { ensureDir, writeFile, readJson } = require('../utils/fs');
const { runDevTwinInit, runDevTwinAnalyze } = require('./dev-twin');
const { runTwinAnalyze, runTwinVerify } = require('./twin');
const { runScan } = require('./scan');
const { runFix } = require('./fix');
const { defaultIntake } = require('../dev-twin/templates');
const { resolvePromptProviderConfig, generatePromptWithOci } = require('../odt/oci-prompt-provider');
const { getWorkspaceRoot, getTargetRepoPath, resolveWorkspacePath } = require('../utils/workspace');

const ODT_DIR = 'reports/odt';
const DEV_TWIN_INTAKE = 'reports/dev-twin/intake.json';
const A11Y_FINDINGS = 'reports/a11y/findings.json';
const PROFILE_DIR = path.resolve(__dirname, '../odt/profiles');
const ODT_DB_DIR = 'reports/odt/db';
const ODT_HISTORY_FILE = 'reports/odt/db/history.json';
const ODT_PROMPTS_DIR = 'reports/odt/prompts';
const ODT_PROMPTS_GENERATED_DIR = `${ODT_PROMPTS_DIR}/generated`;
const ODT_PROMPT_AUDIT_FILE = `${ODT_PROMPTS_DIR}/provider-audit.jsonl`;
const ODT_PROMPT_PROVIDER_STATUS_FILE = `${ODT_PROMPTS_DIR}/provider-status.json`;
const execFileAsync = promisify(execFile);
const PROMPT_OVERRIDE_STAGES = [
  { key: 'intake', label: 'Intake' },
  { key: 'impact', label: 'Impact' },
  { key: 'design', label: 'Tech Design' },
  { key: 'code', label: 'Code Workpack' },
  { key: 'unitTests', label: 'Unit Tests' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'verify', label: 'Verification' }
];

function loadOdtRenderers() {
  const dashboardModulePath = require.resolve('../odt/dashboard');
  const feditModulePath = require.resolve('../odt/fedit');
  delete require.cache[dashboardModulePath];
  delete require.cache[feditModulePath];
  return {
    ...require('../odt/dashboard'),
    ...require('../odt/fedit')
  };
}
const STAGE_TO_PROMPT_SLUG = {
  intake: 'intake',
  impact: 'impact',
  design: 'tech-design',
  'code-workpack': 'code',
  'test-workpack': 'unit-tests',
  compliance: 'compliance',
  'verify-summary': 'verify'
};

function now() {
  return new Date().toISOString();
}

function exists(relPath, options = {}) {
  return fs.existsSync(resolveWorkspacePath(relPath, options));
}

function safeReadJson(relPath, fallback = null, options = {}) {
  const abs = resolveWorkspacePath(relPath, options);
  if (!fs.existsSync(abs)) return fallback;
  return readJson(abs);
}

function safeReadText(relPath, fallback = '', options = {}) {
  const abs = resolveWorkspacePath(relPath, options);
  if (!fs.existsSync(abs)) return fallback;
  return fs.readFileSync(abs, 'utf8');
}

function loadHistory(options = {}) {
  return safeReadJson(ODT_HISTORY_FILE, [], options);
}

function saveHistory(history, options = {}) {
  ensureDir(resolveWorkspacePath(ODT_DB_DIR, options));
  writeFile(resolveWorkspacePath(ODT_HISTORY_FILE, options), `${JSON.stringify(history, null, 2)}\n`);
}

function loadProfile(profileId) {
  const requested = profileId || 'react-js';
  const profilePath = path.join(PROFILE_DIR, `${requested}.json`);
  if (!fs.existsSync(profilePath)) {
    const available = fs.readdirSync(PROFILE_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
    throw new Error(`Unknown ODT profile "${requested}". Available: ${available.join(', ')}`);
  }
  return readJson(profilePath);
}

function normalizeConfidence(score) {
  const raw = Number(score || 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Number(Math.min(0.99, raw / 60).toFixed(2));
}

function uniqueStrings(values = []) {
  return [...new Set((values || []).filter(Boolean).map((value) => `${value}`))];
}

function normalizePromptOverrides(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return PROMPT_OVERRIDE_STAGES.reduce((acc, stage) => {
    acc[stage.key] = typeof source[stage.key] === 'string' ? source[stage.key] : '';
    return acc;
  }, {});
}

function activePromptOverrides(promptOverrides = {}) {
  const normalized = normalizePromptOverrides(promptOverrides);
  return PROMPT_OVERRIDE_STAGES
    .map((stage) => ({
      key: stage.key,
      label: stage.label,
      text: normalized[stage.key]
    }))
    .filter((item) => item.text && item.text.trim());
}

function sanitizeTextForExternalLlm(value, redactionCounter) {
  if (value === null || value === undefined) return '';
  let next = `${value}`;
  const patterns = [
    { regex: /\b(Bearer\s+)[A-Za-z0-9\-._~+/=]{10,}\b/gi, replacement: '$1[REDACTED_TOKEN]' },
    { regex: /\b(api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s,;]+/gi, replacement: '$1=[REDACTED]' },
    { regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: '[REDACTED_EMAIL]' },
    { regex: /\b\d{12,}\b/g, replacement: '[REDACTED_ID]' }
  ];

  patterns.forEach((item) => {
    next = next.replace(item.regex, (match, prefix) => {
      redactionCounter.count += 1;
      if (prefix) return `${prefix}[REDACTED_TOKEN]`;
      return item.replacement;
    });
  });

  return next;
}

function sanitizeUrlForExternalLlm(rawUrl, redactionCounter) {
  const text = `${rawUrl || ''}`.trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    if (url.search || url.hash) {
      redactionCounter.count += 1;
    }
    return `${url.origin}${url.pathname}`;
  } catch (error) {
    return sanitizeTextForExternalLlm(text, redactionCounter);
  }
}

function sanitizeIntakeForExternalLlm(intake = {}) {
  const counter = { count: 0 };
  const jira = intake.jira || {};
  const designInputs = intake.designInputs || {};
  const requirements = intake.requirements || {};
  const defectContext = intake.defectContext || {};
  const promptOverrides = normalizePromptOverrides(intake.promptOverrides);

  const sanitized = {
    title: sanitizeTextForExternalLlm(intake.title || intake.featureName || '', counter),
    featureName: sanitizeTextForExternalLlm(intake.featureName || intake.title || '', counter),
    summary: sanitizeTextForExternalLlm(intake.summary || '', counter),
    reviewEdits: sanitizeTextForExternalLlm(intake.reviewEdits || '', counter),
    workItemType: sanitizeTextForExternalLlm(intake.workItemType || 'feature', counter),
    jira: {
      ticketId: sanitizeTextForExternalLlm(jira.ticketId || '', counter),
      url: sanitizeUrlForExternalLlm(jira.url || '', counter)
    },
    requirements: {
      acceptanceCriteria: (requirements.acceptanceCriteria || []).map((item) => sanitizeTextForExternalLlm(item, counter)),
      nonFunctional: requirements.nonFunctional || []
    },
    defectContext: {
      defectId: sanitizeTextForExternalLlm(defectContext.defectId || '', counter),
      observedBehavior: sanitizeTextForExternalLlm(defectContext.observedBehavior || '', counter),
      expectedBehavior: sanitizeTextForExternalLlm(defectContext.expectedBehavior || '', counter),
      severity: sanitizeTextForExternalLlm(defectContext.severity || '', counter)
    },
    designInputs: {
      mockupImages: designInputs.mockupImages || [],
      referenceDocs: designInputs.referenceDocs || [],
      jiraLinks: (designInputs.jiraLinks || []).map((item) => sanitizeUrlForExternalLlm(item, counter))
    },
    promptOverrides: {
      intake: sanitizeTextForExternalLlm(promptOverrides.intake, counter),
      impact: sanitizeTextForExternalLlm(promptOverrides.impact, counter),
      design: sanitizeTextForExternalLlm(promptOverrides.design, counter),
      code: sanitizeTextForExternalLlm(promptOverrides.code, counter),
      unitTests: sanitizeTextForExternalLlm(promptOverrides.unitTests, counter),
      compliance: sanitizeTextForExternalLlm(promptOverrides.compliance, counter),
      verify: sanitizeTextForExternalLlm(promptOverrides.verify, counter)
    }
  };

  return {
    sanitized,
    redactionCount: counter.count
  };
}

function writeExternalLlmSafetyArtifacts(intake = {}, options = {}) {
  const promptDir = resolveWorkspacePath(`${ODT_DIR}/prompts`, options);
  ensureDir(promptDir);
  const sanitized = sanitizeIntakeForExternalLlm(intake);
  const contextFile = path.join(promptDir, 'external-llm-sanitized-context.json');
  const policyFile = path.join(promptDir, 'external-llm-safety.md');

  writeFile(contextFile, `${JSON.stringify({
    generatedAt: now(),
    source: DEV_TWIN_INTAKE,
    redactionCount: sanitized.redactionCount,
    intake: sanitized.sanitized
  }, null, 2)}\n`);

  writeFile(policyFile, [
    '# ODT External LLM Safety Guardrails',
    '',
    'Use this checklist before sending any context to external LLMs (including chat.oracle.com).',
    '',
    '## Required Steps',
    '- Use `external-llm-sanitized-context.json` instead of raw intake text.',
    '- Keep humans in the loop for requirement ambiguity and risk tradeoffs.',
    '- Do not send source code containing credentials, internal endpoints, or user data.',
    '- Remove ticket comments that include private customer details or incident logs.',
    '- Prefer local Codex execution when repo-grounded analysis is required.',
    '',
    '## Redaction Status',
    `- Redactions applied: ${sanitized.redactionCount}`,
    `- Sanitized context: ${ODT_DIR}/prompts/external-llm-sanitized-context.json`,
    '',
    '## Review Gate',
    '- Human reviewer must approve sanitized context before external prompt usage.',
    ''
  ].join('\n'));
}

function buildPromptContracts() {
  return [
    {
      id: '01',
      slug: 'intake',
      file: '01-intake.md',
      title: 'Intake',
      inputs: [
        { path: 'reports/dev-twin/intake.json', required: true, purpose: 'Primary work item, constraints, Jira, and design inputs.' }
      ],
      task: [
        'Validate ticket completeness and identify missing decision-critical information.',
        'Ask only safety-critical clarifications when ambiguity can create incorrect implementation risk.'
      ],
      outputs: [
        { path: 'reports/dev-twin/intake-questions.md', format: 'markdown', schema: { sections: ['Ticket Intake', 'Acceptance & UX', 'Repo Analysis Inputs', 'Compliance & Review'] } },
        { path: 'reports/dev-twin/intake-missing-fields.md', format: 'markdown', schema: { stage: 'intake', status: 'ready|needs_input|blocked', missingFields: [{ field: 'string', severity: 'high|medium|low', reason: 'string' }] } }
      ],
      qualityGates: [
        'Acceptance criteria are explicit and testable.',
        'Backward compatibility constraints are captured.',
        'Accessibility expectations are visible before coding.'
      ],
      stopConditions: [
        'Missing acceptance criteria for core behavior.',
        'Conflicting requirement statements or undefined rollback expectations.',
        'Potential sensitive data leakage in ticket text.'
      ]
    },
    {
      id: '02',
      slug: 'impact',
      file: '02-impact.md',
      title: 'Repo Impact',
      inputs: [
        { path: 'reports/dev-twin/intake.json', required: true, purpose: 'Requirement intent and scope.' },
        { path: 'reports/dev-twin/impact-analysis.json', required: true, purpose: 'Repo-inferred module and file candidates.' }
      ],
      task: [
        'Rank likely impacted files with confidence and explain selection signals.',
        'Surface regression risks tied to impacted modules and related tests.'
      ],
      outputs: [
        { path: 'reports/dev-twin/impact-analysis.json', format: 'json', schema: { inference: { mode: 'string', candidateDetails: [{ file: 'string', score: 'number', reasons: ['string'] }] }, totals: { blastRadius: 'number' } } },
        { path: 'reports/odt/impact-ranked-files.json', format: 'json', schema: { stage: 'impact', rankedFiles: [{ file: 'string', score: 'number', confidence: '0..1', reasons: ['string'] }], regressionRisks: ['string'] } }
      ],
      qualityGates: [
        'Confidence and rationale are present for each top candidate.',
        'Regression risks reference concrete repo surfaces.',
        'No broad, unbounded blast radius without explanation.'
      ],
      stopConditions: [
        'No candidate files are inferred and no module hints exist.',
        'Risk hotspots cannot be tied to any test or component area.'
      ]
    },
    {
      id: '03',
      slug: 'tech-design',
      file: '03-tech-design.md',
      title: 'Tech Design',
      inputs: [
        { path: 'reports/dev-twin/intake.json', required: true, purpose: 'Feature/defect constraints and quality requirements.' },
        { path: 'reports/dev-twin/impact-analysis.json', required: true, purpose: 'Scope and blast radius evidence.' }
      ],
      task: [
        'Define implementation approach with API, state, error, a11y, and testing strategy.',
        'Keep design scoped to blast-radius minimization and approved dependencies.'
      ],
      outputs: [
        { path: 'reports/odt/tech-design.md', format: 'markdown', schema: { sections: ['Scope', 'API strategy', 'State strategy', 'Error handling', 'Accessibility strategy', 'Test strategy'] } },
        { path: 'reports/odt/tech-design.json', format: 'json', schema: { featureName: 'string', architecture: { apiStrategy: 'string', stateStrategy: 'string', errorHandling: 'string', accessibility: 'string', testing: 'string' }, qualityGates: ['string'] } }
      ],
      qualityGates: [
        'Design addresses both functional and non-functional constraints.',
        'Error handling and rollback path are explicit.',
        'Accessibility and test strategy are first-class sections.'
      ],
      stopConditions: [
        'Design introduces unauthorized dependencies without approval.',
        'Critical error-state behavior is undefined.'
      ]
    },
    {
      id: '04',
      slug: 'code',
      file: '04-code.md',
      title: 'Code Workpack',
      inputs: [
        { path: 'reports/dev-twin/code-workpack.md', required: true, purpose: 'Implementation guidance from Dev Twin.' },
        { path: 'reports/odt/tech-design.md', required: true, purpose: 'Design constraints and quality gates.' },
        { path: 'reports/dev-twin/impact-analysis.json', required: true, purpose: 'Impacted files and module evidence.' }
      ],
      task: [
        'Generate file-scoped patch intent and dependency policy checks before coding.',
        'Require backward compatibility and minimal blast-radius edits.'
      ],
      outputs: [
        { path: 'reports/dev-twin/code-workpack.md', format: 'markdown', schema: { includes: ['execution steps', 'quality gates', 'repo-analysis evidence'] } },
        { path: 'reports/odt/code-patch-plan.md', format: 'markdown', schema: { sections: ['File-by-file intent', 'Dependency policy checks', 'Regression watchpoints'] } }
      ],
      qualityGates: [
        'Every candidate file has a clear edit intent.',
        'Dependency policy checks are explicit.',
        'Backward compatibility is validated before implementation.'
      ],
      stopConditions: [
        'Patch intent cannot be mapped to candidate files.',
        'Requested behavior requires out-of-scope architecture changes.'
      ]
    },
    {
      id: '05',
      slug: 'unit-tests',
      file: '05-unit-tests.md',
      title: 'Unit Tests',
      inputs: [
        { path: 'reports/dev-twin/unit-test-workpack.md', required: true, purpose: 'Test guidance for impacted behavior.' },
        { path: 'reports/dev-twin/impact-analysis.json', required: true, purpose: 'Related source and test file context.' }
      ],
      task: [
        'Create deterministic test matrix for happy, edge, error, and keyboard-accessibility paths.',
        'Add anti-flake guidance for stable CI behavior.'
      ],
      outputs: [
        { path: 'reports/dev-twin/unit-test-workpack.md', format: 'markdown', schema: { includes: ['happy path', 'edge path', 'error path', 'keyboard assertions'] } },
        { path: 'reports/odt/unit-test-matrix.md', format: 'markdown', schema: { columns: ['Scenario', 'Coverage type', 'Expected assertion', 'Flake risk', 'Mitigation'] } }
      ],
      qualityGates: [
        'No snapshot-only strategy for behavior-critical paths.',
        'Keyboard and ARIA assertions are present for interactive UI.',
        'Anti-flake mitigations are documented.'
      ],
      stopConditions: [
        'No stable assertion strategy for async behavior.',
        'Critical user journey lacks testability due to ambiguity.'
      ]
    },
    {
      id: '06',
      slug: 'compliance',
      file: '06-compliance.md',
      title: 'VPAT/WCAG Compliance',
      inputs: [
        { path: 'reports/a11y/findings.json', required: true, purpose: 'Raw accessibility findings from scans.' },
        { path: 'reports/a11y/coding-agent-prompt.md', required: false, purpose: 'A11y remediation instructions if generated.' }
      ],
      task: [
        'Map findings to VPAT/WCAG and keyboard accessibility obligations.',
        'Prioritize remediations by blocker impact and implementation risk.'
      ],
      outputs: [
        { path: 'reports/odt/compliance-mapping.md', format: 'markdown', schema: { sections: ['VPAT/WCAG mapping', 'Keyboard gaps', 'Remediation priority', 'Residual risk'] } },
        { path: 'reports/a11y/coding-agent-prompt.md', format: 'markdown', schema: { includes: ['safe fixes', 'keyboard parity', 'semantic guidance'] } }
      ],
      qualityGates: [
        'Top rule classes are mapped to actionable guidance.',
        'Keyboard gaps are explicit.',
        'Priority order is risk-based and explainable.'
      ],
      stopConditions: [
        'A11y findings are unavailable for current run.',
        'Compliance mapping cannot determine actionable priority.'
      ]
    },
    {
      id: '07',
      slug: 'verify',
      file: '07-verify.md',
      title: 'Verification & Release Readiness',
      inputs: [
        { path: 'reports/odt/run-summary.json', required: true, purpose: 'Current stage statuses and KPI snapshot.' },
        { path: 'reports/odt/compliance-mapping.md', required: false, purpose: 'Compliance risks and remediation posture.' }
      ],
      task: [
        'Produce go/no-go decision with blockers, risk notes, rollback, and human approvals.',
        'Ensure release readiness remains human-reviewed.'
      ],
      outputs: [
        { path: 'reports/odt/verify-checklist.md', format: 'markdown', schema: { stage: 'verify', decision: 'go|go_with_conditions|no_go', blockers: ['string'], rollbackPlan: ['string'], approvalsRequired: ['string'] } },
        { path: 'reports/odt/run-summary.md', format: 'markdown', schema: { includes: ['stage statuses', 'status summary', 'notes'] } }
      ],
      qualityGates: [
        'Decision rationale is explicit and auditable.',
        'Blockers and mitigations are concrete.',
        'Human approval gates are clear before merge.'
      ],
      stopConditions: [
        'Any critical stage failed or blocker remains unresolved.',
        'Rollback or owner accountability is missing.'
      ]
    }
  ];
}

function renderPromptContract(contract) {
  const lines = [
    `# ODT Prompt Contract - ${contract.id}-${contract.slug}`,
    '',
    `Stage: ${contract.title}`,
    '',
    '## Inputs (exact files)',
    ...contract.inputs.map((input) => `- ${input.path} (${input.required ? 'required' : 'optional'}): ${input.purpose}`),
    '',
    '## Task',
    ...contract.task.map((item) => `- ${item}`),
    '',
    '## Output Contract',
    ...contract.outputs.flatMap((output) => ([
      `- Write: ${output.path}`,
      `- Format: ${output.format}`,
      '- Schema:',
      '```json',
      JSON.stringify(output.schema, null, 2),
      '```'
    ])),
    '',
    '## Quality Gates (senior developer checks)',
    ...contract.qualityGates.map((gate) => `- ${gate}`),
    '',
    '## Stop Conditions (pause and ask human)',
    ...contract.stopConditions.map((item) => `- ${item}`),
    ''
  ];
  return lines.join('\n');
}

function writePromptTemplates(options = {}) {
  const promptDir = resolveWorkspacePath(ODT_PROMPTS_DIR, options);
  ensureDir(promptDir);
  const contracts = buildPromptContracts();
  contracts.forEach((contract) => {
    writeFile(path.join(promptDir, contract.file), `${renderPromptContract(contract)}\n`);
  });
  writeFile(path.join(promptDir, 'stage-contracts.json'), `${JSON.stringify({
    generatedAt: now(),
    stageCount: contracts.length,
    contracts
  }, null, 2)}\n`);

  const intake = safeReadJson(DEV_TWIN_INTAKE, defaultIntake(), options);
  writeExternalLlmSafetyArtifacts(intake, options);
  writePromptProviderStatus(resolvePromptProviderConfig(options), [], options);
}

function buildPromptContractMap() {
  return buildPromptContracts().reduce((acc, contract) => {
    acc[contract.slug] = contract;
    return acc;
  }, {});
}

function appendPromptAudit(entry, options = {}) {
  const filePath = resolveWorkspacePath(ODT_PROMPT_AUDIT_FILE, options);
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
}

function writePromptProviderStatus(providerConfig, stagePrompts = [], options = {}) {
  const generated = stagePrompts.filter((item) => item.status === 'generated').length;
  const fallback = stagePrompts.filter((item) => item.fallback).length;
  const failed = stagePrompts.filter((item) => item.status === 'failed').length;
  const payload = {
    generatedAt: now(),
    provider: providerConfig && providerConfig.provider ? providerConfig.provider : 'template',
    oci: providerConfig && providerConfig.oci ? {
      profile: providerConfig.oci.profile || '',
      region: providerConfig.oci.region || '',
      endpoint: providerConfig.oci.endpoint || '',
      modelId: providerConfig.oci.modelId || '',
      endpointId: providerConfig.oci.endpointId || '',
      servingType: providerConfig.oci.servingType || 'ON_DEMAND',
      subcommand: providerConfig.oci.subcommand || 'chat-on-demand-serving-mode'
    } : {},
    summary: {
      totalStages: stagePrompts.length,
      generated,
      fallback,
      failed
    },
    stages: stagePrompts
  };

  writeFile(resolveWorkspacePath(ODT_PROMPT_PROVIDER_STATUS_FILE, options), `${JSON.stringify(payload, null, 2)}\n`);
}

function buildTemplateStagePrompt(contract, runtimeContext, intakeSanitized) {
  return [
    `# ODT Stage Prompt - ${contract.id}-${contract.slug}`,
    '',
    `Stage: ${contract.title}`,
    '',
    '## Objective',
    ...contract.task.map((item) => `- ${item}`),
    '',
    '## Inputs',
    ...contract.inputs.map((input) => `- ${input.path} (${input.required ? 'required' : 'optional'}): ${input.purpose}`),
    '',
    '## Runtime Context',
    '```json',
    JSON.stringify(runtimeContext, null, 2),
    '```',
    '',
    '## Sanitized Intake Context',
    '```json',
    JSON.stringify(intakeSanitized, null, 2),
    '```',
    '',
    '## Quality Gates',
    ...contract.qualityGates.map((item) => `- ${item}`),
    '',
    '## Stop Conditions',
    ...contract.stopConditions.map((item) => `- ${item}`),
    '',
    '## Expected Outputs',
    ...contract.outputs.map((item) => `- ${item.path} (${item.format})`),
    ''
  ].join('\n');
}

function buildLlmStageRequest(contract, runtimeContext, intakeSanitized) {
  return [
    'You are Oracle Developer Twin, generating a strict stage execution prompt for a senior coding agent.',
    `Stage key: ${contract.slug}`,
    `Stage title: ${contract.title}`,
    '',
    'Follow the stage contract exactly.',
    '',
    '## Stage Contract',
    renderPromptContract(contract),
    '',
    '## Runtime Context (JSON)',
    '```json',
    JSON.stringify(runtimeContext, null, 2),
    '```',
    '',
    '## Sanitized Intake Context (JSON)',
    '```json',
    JSON.stringify(intakeSanitized, null, 2),
    '```',
    '',
    '## Output Rules',
    '- Output markdown only.',
    '- Keep sections: Objective, Inputs, Execution Steps, Quality Gates, Stop Conditions, Expected Outputs.',
    '- Keep language deterministic and auditable.',
    '- Preserve human-review gates and accessibility obligations.',
    ''
  ].join('\n');
}

function resolvePromptContractForStage(stageName, contractsBySlug) {
  const slug = STAGE_TO_PROMPT_SLUG[stageName];
  if (!slug) return null;
  return contractsBySlug[slug] || null;
}

async function generateStagePromptArtifact(stageRecord, contractsBySlug, providerConfig, options = {}) {
  const contract = resolvePromptContractForStage(stageRecord.name, contractsBySlug);
  if (!contract) return null;

  const intake = safeReadJson(DEV_TWIN_INTAKE, {}, options);
  const sanitized = sanitizeIntakeForExternalLlm(intake || {});
  const runtimeContext = {
    generatedAt: now(),
    stage: stageRecord.name,
    stageStatus: stageRecord.status,
    stageDetail: stageRecord.detail || {},
    targetRepoPath: getTargetRepoPath({ ...options, targetRepoPath: intake && intake.targetRepoPath }),
    workItemType: intake && intake.workItemType ? intake.workItemType : 'feature'
  };
  const templateText = buildTemplateStagePrompt(contract, runtimeContext, sanitized.sanitized);
  const llmRequest = buildLlmStageRequest(contract, runtimeContext, sanitized.sanitized);

  const outDir = resolveWorkspacePath(ODT_PROMPTS_GENERATED_DIR, options);
  ensureDir(outDir);
  const fileBase = `${contract.id}-${contract.slug}`;
  const requestFile = path.join(outDir, `${fileBase}.request.md`);
  const outputFile = path.join(outDir, `${fileBase}.generated.md`);
  writeFile(requestFile, `${llmRequest}\n`);

  let provider = 'template';
  let text = templateText;
  let latencyMs = 0;
  let fallback = false;
  let error = '';
  let model = '';

  if (providerConfig.provider === 'oci') {
    const ociResult = await generatePromptWithOci({
      prompt: llmRequest,
      stageKey: contract.slug,
      config: providerConfig.oci
    });
    model = ociResult.modelId || '';
    latencyMs = ociResult.latencyMs || 0;
    if (ociResult.ok) {
      provider = 'oci';
      text = ociResult.text;
    } else {
      fallback = true;
      error = ociResult.error || 'OCI prompt generation failed.';
      text = [
        templateText,
        '',
        '## Fallback Note',
        `- OCI generation fallback reason: ${error}`
      ].join('\n');
    }
  }

  const rendered = [
    `# Generated Stage Prompt - ${contract.id}-${contract.slug}`,
    '',
    `- Stage: ${contract.title}`,
    `- Provider: ${provider}`,
    `- Model: ${model || 'n/a'}`,
    `- LatencyMs: ${latencyMs}`,
    `- Generated At: ${now()}`,
    ...(fallback ? [`- Fallback: ${error}`] : []),
    '',
    text.trim(),
    ''
  ].join('\n');
  writeFile(outputFile, rendered);

  const audit = {
    generatedAt: now(),
    stage: stageRecord.name,
    slug: contract.slug,
    status: error && !fallback ? 'failed' : 'generated',
    provider,
    model: model || '',
    latencyMs,
    fallback,
    error
  };
  appendPromptAudit(audit, options);

  return {
    stage: stageRecord.name,
    slug: contract.slug,
    provider,
    model: model || '',
    latencyMs,
    fallback,
    status: 'generated',
    requestFile: path.relative(getWorkspaceRoot(options), requestFile),
    outputFile: path.relative(getWorkspaceRoot(options), outputFile),
    error: error || ''
  };
}

function stageIntake(options) {
  if (!exists(DEV_TWIN_INTAKE, options) || options.refresh) {
    runDevTwinInit(options);
  }
  const intake = safeReadJson(DEV_TWIN_INTAKE, {}, options);
  const targetRepoPath = getTargetRepoPath({ ...options, targetRepoPath: intake.targetRepoPath });

  if (intake.targetRepoPath !== targetRepoPath) {
    writeFile(
      resolveWorkspacePath(DEV_TWIN_INTAKE, options),
      `${JSON.stringify({ ...intake, targetRepoPath }, null, 2)}\n`
    );
  }

  const checklist = writeIntakeChecklist(intake, options);

  return {
    intakeFile: DEV_TWIN_INTAKE,
    intakeQuestionsFile: 'reports/dev-twin/intake-questions.md',
    missingFieldsFile: 'reports/dev-twin/intake-missing-fields.md',
    intakeStatus: checklist.status,
    missingFieldCount: checklist.missingFields.length,
    featureName: intake.featureName || 'unknown',
    workItemType: intake.workItemType || options['work-item'] || 'feature',
    reviewEditsActive: Boolean(intake.reviewEdits && `${intake.reviewEdits}`.trim()),
    promptOverridesActive: activePromptOverrides(intake.promptOverrides).length,
    complexity: (intake.scope && intake.scope.complexity) || 'unknown',
    imageInputs: options.images ? `${options.images}`.split(',').map((x) => x.trim()).filter(Boolean) : [],
    workspaceRoot: getWorkspaceRoot(options),
    targetRepoPath
  };
}

function parseCsv(value) {
  if (!value) return [];
  return `${value}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function runExportInSubprocess(modulePath, exportName, args = {}) {
  const absModulePath = path.resolve(__dirname, modulePath);
  const childScript = [
    `const mod = require(${JSON.stringify(absModulePath)});`,
    'console.log = (...parts) => process.stderr.write(parts.join(" ") + "\\n");',
    `Promise.resolve(mod[${JSON.stringify(exportName)}](${JSON.stringify(args)}))`,
    '  .then((result) => process.stdout.write(JSON.stringify(result || {})))',
    '  .catch((error) => {',
    '    process.stderr.write((error && error.stack) || (error && error.message) || String(error));',
    '    process.exit(1);',
    '  });'
  ].join('\n');

  const { stdout, stderr } = await execFileAsync(process.execPath, ['-e', childScript], {
    cwd: getWorkspaceRoot(args),
    maxBuffer: 10 * 1024 * 1024
  });

  try {
    return stdout ? JSON.parse(stdout) : {};
  } catch (error) {
    throw new Error(stderr || `Failed to parse subprocess output for ${exportName}`);
  }
}

function buildIntakeFromOptions(options = {}) {
  const base = exists(DEV_TWIN_INTAKE, options)
    ? safeReadJson(DEV_TWIN_INTAKE, defaultIntake(), options)
    : defaultIntake();
  const basePromptOverrides = normalizePromptOverrides(base.promptOverrides);
  const optionPromptOverridesRaw = {
    intake: options['prompt-intake'],
    impact: options['prompt-impact'],
    design: options['prompt-design'],
    code: options['prompt-code'],
    unitTests: options['prompt-tests'],
    compliance: options['prompt-compliance'],
    verify: options['prompt-verify']
  };
  const optionPromptOverrides = normalizePromptOverrides(optionPromptOverridesRaw);
  const hasOptionPromptOverrides = Object.values(optionPromptOverridesRaw).some((value) => typeof value === 'string');
  const mergedPromptOverrides = hasOptionPromptOverrides
    ? { ...basePromptOverrides, ...optionPromptOverrides }
    : basePromptOverrides;

  const next = {
    ...base,
    title: options.title || options['feature-name'] || base.title || base.featureName,
    featureName: options['feature-name'] || base.featureName,
    summary: options.summary || base.summary,
    reviewEdits: typeof options['review-edits'] === 'string'
      ? options['review-edits']
      : (typeof base.reviewEdits === 'string' ? base.reviewEdits : ''),
    promptOverrides: mergedPromptOverrides,
    targetRepoPath: getTargetRepoPath({ ...options, targetRepoPath: base.targetRepoPath }),
    workItemType: options['work-item'] || base.workItemType || 'feature',
    jira: {
      ...(base.jira || {}),
      ticketId: options['ticket-id'] || (base.jira && base.jira.ticketId) || '',
      url: options['ticket-url'] || (base.jira && base.jira.url) || ''
    },
    scope: {
      ...base.scope,
      complexity: options.complexity || base.scope.complexity,
      uiSurface: options['ui-surface'] || base.scope.uiSurface,
      repoScan: options['repo-scan'] || base.scope.repoScan || 'full',
      modulesTouched: parseCsv(options.modules).length
        ? parseCsv(options.modules)
        : (base.scope.modulesTouched || [])
    },
    requirements: {
      ...base.requirements,
      acceptanceCriteria: parseCsv(options.criteria).length
        ? parseCsv(options.criteria)
        : base.requirements.acceptanceCriteria,
      nonFunctional: parseCsv(options['non-functional']).length
        ? parseCsv(options['non-functional'])
        : base.requirements.nonFunctional,
      outOfScope: parseCsv(options['out-of-scope']).length
        ? parseCsv(options['out-of-scope'])
        : (base.requirements.outOfScope || [])
    },
    constraints: {
      ...base.constraints,
      noNewDependencies: options['allow-new-deps'] ? false : base.constraints.noNewDependencies
    },
    defectContext: {
      ...base.defectContext,
      defectId: options['defect-id'] || base.defectContext.defectId,
      observedBehavior: options.observed || base.defectContext.observedBehavior,
      expectedBehavior: options.expected || base.defectContext.expectedBehavior,
      severity: options['defect-severity'] || base.defectContext.severity
    },
    designInputs: {
      ...base.designInputs,
      mockupImages: parseCsv(options.images).length ? parseCsv(options.images) : (base.designInputs.mockupImages || []),
      referenceDocs: parseCsv(options.refs).length ? parseCsv(options.refs) : (base.designInputs.referenceDocs || []),
      jiraLinks: parseCsv(options['jira-links']).length ? parseCsv(options['jira-links']) : (base.designInputs.jiraLinks || [])
    },
    developerHints: {
      ...(base.developerHints || {}),
      suspectedAreas: parseCsv(options.modules).length
        ? parseCsv(options.modules)
        : ((base.developerHints && base.developerHints.suspectedAreas) || []),
      relatedComponents: parseCsv(options.components).length
        ? parseCsv(options.components)
        : ((base.developerHints && base.developerHints.relatedComponents) || []),
      notes: options.notes || (base.developerHints && base.developerHints.notes) || ''
    }
  };

  if (!next.featureName) next.featureName = next.title;
  return next;
}

function updateIntakeFromOptions(options = {}) {
  const next = buildIntakeFromOptions(options);
  ensureDir(resolveWorkspacePath('reports/dev-twin', options));
  writeFile(resolveWorkspacePath(DEV_TWIN_INTAKE, options), `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

function buildMissingFieldChecklist(intake = {}) {
  const requirements = intake.requirements || {};
  const defectContext = intake.defectContext || {};
  const missing = [];

  if (!intake.summary || !`${intake.summary}`.trim()) {
    missing.push({ field: 'summary', severity: 'high', reason: 'Ticket summary is required for repo impact inference.' });
  }
  if (!Array.isArray(requirements.acceptanceCriteria) || requirements.acceptanceCriteria.length === 0) {
    missing.push({ field: 'requirements.acceptanceCriteria', severity: 'high', reason: 'At least one acceptance criterion is required for implementation safety.' });
  }
  if (!Array.isArray(requirements.nonFunctional) || requirements.nonFunctional.length === 0) {
    missing.push({ field: 'requirements.nonFunctional', severity: 'medium', reason: 'Non-functional requirements guide a11y/performance quality gates.' });
  }
  if (intake.workItemType === 'defect') {
    if (!defectContext.observedBehavior || !`${defectContext.observedBehavior}`.trim()) {
      missing.push({ field: 'defectContext.observedBehavior', severity: 'high', reason: 'Observed defect behavior is required for reliable regression validation.' });
    }
    if (!defectContext.expectedBehavior || !`${defectContext.expectedBehavior}`.trim()) {
      missing.push({ field: 'defectContext.expectedBehavior', severity: 'high', reason: 'Expected behavior is required to close the defect safely.' });
    }
  }

  return {
    stage: 'intake',
    status: missing.length ? 'needs_input' : 'ready',
    missingFields: missing
  };
}

function writeIntakeChecklist(intake = {}, options = {}) {
  const checklist = buildMissingFieldChecklist(intake);
  const markdown = [
    '# ODT Intake Missing-Fields Checklist',
    '',
    `- Generated At: ${now()}`,
    `- Status: ${checklist.status}`,
    '',
    '## Missing Fields',
    ...(checklist.missingFields.length
      ? checklist.missingFields.map((item) => `- ${item.field} [${item.severity}] - ${item.reason}`)
      : ['- None. Intake is ready for execution.']),
    ''
  ].join('\n');

  writeFile(resolveWorkspacePath('reports/dev-twin/intake-missing-fields.json', options), `${JSON.stringify(checklist, null, 2)}\n`);
  writeFile(resolveWorkspacePath('reports/dev-twin/intake-missing-fields.md', options), `${markdown}\n`);
  return checklist;
}

function writeImpactRankedFiles(devTwinResult = {}, options = {}) {
  const impact = devTwinResult.impact || {};
  const candidateDetails = (impact.inference && impact.inference.candidateDetails) || [];
  const rankedFiles = candidateDetails
    .slice(0, 12)
    .map((item) => ({
      file: item.file,
      score: item.score || 0,
      confidence: normalizeConfidence(item.score),
      reasons: item.reasons || []
    }));

  const summary = {
    stage: 'impact',
    generatedAt: now(),
    rankedFiles,
    regressionRisks: devTwinResult.risks || [],
    totals: impact.totals || {}
  };

  writeFile(resolveWorkspacePath(`${ODT_DIR}/impact-ranked-files.json`, options), `${JSON.stringify(summary, null, 2)}\n`);
  writeFile(
    resolveWorkspacePath(`${ODT_DIR}/impact-ranked-files.md`, options),
    [
      '# ODT Impact Ranked Files',
      '',
      `- Generated At: ${summary.generatedAt}`,
      `- Files Ranked: ${rankedFiles.length}`,
      '',
      '## Ranked Files',
      ...(rankedFiles.length
        ? rankedFiles.map((item) => `- ${item.file} | score=${item.score} | confidence=${item.confidence} | signals=${(item.reasons || []).join(', ') || 'n/a'}`)
        : ['- No ranked files available.']),
      '',
      '## Regression Risks',
      ...(summary.regressionRisks.length ? summary.regressionRisks.map((risk) => `- ${risk}`) : ['- No explicit regression risks provided.']),
      ''
    ].join('\n')
  );

  return summary;
}

function writeCodePatchPlan(options = {}) {
  const intake = safeReadJson(DEV_TWIN_INTAKE, {}, options);
  const impact = safeReadJson('reports/dev-twin/impact-analysis.json', {}, options);
  const codeWorkpack = safeReadText('reports/dev-twin/code-workpack.md', '', options);
  const candidateDetails = (impact.inference && impact.inference.candidateDetails) || [];
  const scoped = candidateDetails.slice(0, 8);
  const noNewDeps = Boolean(intake.constraints && intake.constraints.noNewDependencies);
  const promptOverrides = normalizePromptOverrides(intake.promptOverrides);
  const activeOverrides = activePromptOverrides(promptOverrides);
  const codeOverride = promptOverrides.code && promptOverrides.code.trim() ? promptOverrides.code.trim() : '';
  const reviewEdits = intake.reviewEdits && `${intake.reviewEdits}`.trim() ? `${intake.reviewEdits}`.trim() : '';

  const markdown = [
    '# ODT Code Patch Plan',
    '',
    `- Generated At: ${now()}`,
    `- Work Item: ${intake.title || intake.featureName || 'Untitled work item'}`,
    '',
    '## File-by-file Intent',
    ...(scoped.length
      ? scoped.map((item) => `- ${item.file}: apply minimal blast-radius edit based on signals [${(item.reasons || []).join(', ') || 'repo-ranked'}].`)
      : ['- No candidate files inferred. Use module hints or verify intake clarity.']),
    '',
    '## Dependency Policy Checks',
    `- noNewDependencies: ${noNewDeps ? 'enforced' : 'not enforced'}`,
    '- Verify package changes are absent unless explicitly approved.',
    '- Preserve existing APIs and route contracts unless requirement says otherwise.',
    '',
    '## Regression Watchpoints',
    '- Validate keyboard interactions and ARIA names for changed UI.',
    '- Validate state transitions in loading, empty, and error paths.',
    '- Re-run impacted unit tests before merge.',
    '',
    '## Reviewer Refinements',
    ...(reviewEdits ? [reviewEdits] : ['- No structured reviewer refinements were supplied.']),
    '',
    '## Prompt Override (Code Stage)',
    ...(codeOverride ? [codeOverride] : ['- No code-stage prompt override supplied.']),
    '',
    '## Active Prompt Overrides',
    ...(activeOverrides.length ? activeOverrides.map((item) => `- ${item.label}`) : ['- None']),
    '',
    '## Source Guidance',
    codeWorkpack ? '- `reports/dev-twin/code-workpack.md` is available and should be followed.' : '- Code workpack missing; regenerate ODT artifacts before implementation.',
    ''
  ].join('\n');

  writeFile(resolveWorkspacePath(`${ODT_DIR}/code-patch-plan.md`, options), `${markdown}\n`);
  return {
    patchPlanFile: `${ODT_DIR}/code-patch-plan.md`,
    targetFiles: scoped.length,
    noNewDependencies: noNewDeps
  };
}

function writeDeveloperReviewPlan(payload = {}, options = {}) {
  const intake = payload.intake || safeReadJson(DEV_TWIN_INTAKE, {}, options);
  const impact = safeReadJson('reports/dev-twin/impact-analysis.json', {}, options);
  const devTwinSummary = safeReadJson('reports/dev-twin/summary.json', {}, options);
  const design = safeReadJson(`${ODT_DIR}/tech-design.json`, {}, options);
  const verify = safeReadJson(`${ODT_DIR}/verify-checklist.json`, {}, options);
  const promptOverrides = normalizePromptOverrides(intake.promptOverrides);
  const activeOverrides = activePromptOverrides(promptOverrides);
  const candidateDetails = ((impact.inference && impact.inference.candidateDetails) || []).slice(0, 6);
  const regressionRisks = Array.isArray(devTwinSummary.risks)
    ? devTwinSummary.risks
    : [];
  const reviewEdits = intake.reviewEdits && `${intake.reviewEdits}`.trim()
    ? `${intake.reviewEdits}`.trim()
    : '';
  const noNewDeps = Boolean(intake.constraints && intake.constraints.noNewDependencies);
  const workItemName = intake.title || intake.featureName || 'Untitled work item';
  const summary = [
    `${workItemName} should be implemented as a minimal blast-radius change`,
    candidateDetails.length
      ? `starting with ${candidateDetails.length} ranked file candidate(s) already inferred from the repository.`
      : 'after confirming the right implementation surface in the repository.',
    noNewDeps
      ? 'Dependency policy already indicates no new packages should be introduced.'
      : 'Dependency policy should be rechecked during review before package changes are accepted.'
  ].join(' ');

  const phases = [
    {
      title: 'Confirm intent and guardrails',
      detail: `Review the intake summary, acceptance criteria, design inputs, and reviewer notes before touching code. Work item type: ${intake.workItemType || 'feature'}.`
    },
    {
      title: 'Validate impacted repo surfaces',
      detail: candidateDetails.length
        ? `Start with the top-ranked candidate files and confirm they match the requested outcome before implementation begins.`
        : 'No ranked files were available; confirm likely modules manually before implementation.'
    },
    {
      title: 'Implement the minimal patch',
      detail: `Follow the tech design and code workpack, preserve existing contracts, and keep the patch scoped to the smallest safe set of files.`
    },
    {
      title: 'Verify tests and accessibility',
      detail: 'Update deterministic happy, edge, and error tests, then validate keyboard interactions, semantic controls, and accessibility expectations.'
    },
    {
      title: 'Complete human review',
      detail: 'Use this plan, the run summary, and generated workpacks as review evidence before delegation approval, patch application, or merge.'
    }
  ];

  const fileActions = candidateDetails.map((item) => ({
    file: item.file,
    score: item.score || 0,
    confidence: normalizeConfidence(item.score),
    reasons: item.reasons || [],
    intent: `Review and, if confirmed in scope, apply the smallest safe edit in ${item.file}.`
  }));

  const reviewChecklist = [
    'Requirement intent matches the planned implementation.',
    noNewDeps ? 'No new dependencies are introduced.' : 'Any dependency changes are explicitly approved.',
    'Candidate-file selection still makes sense after local code review.',
    'Unit tests cover happy, edge, and error paths.',
    'Keyboard and accessibility behavior remain intact or improve.',
    'Final diff is reviewed by a human before merge.',
    ...((design.qualityGates || []).slice(0, 3).map((item) => `Quality gate: ${item}`))
  ];

  const supportingArtifacts = [
    'reports/odt/tech-design.md',
    'reports/dev-twin/code-workpack.md',
    'reports/dev-twin/unit-test-workpack.md',
    'reports/odt/code-patch-plan.md',
    'reports/odt/verify-checklist.md',
    'reports/odt/run-summary.md'
  ];

  const plan = {
    generatedAt: now(),
    stage: 'review',
    workItem: workItemName,
    status: payload.summary && payload.summary.status ? payload.summary.status : 'ready_for_review',
    summary,
    phases,
    fileActions,
    reviewerInputs: {
      reviewEdits,
      activePromptOverrides: activeOverrides.map((item) => item.label)
    },
    risks: regressionRisks.length ? regressionRisks : [
      'Confirm the inferred blast radius before expanding the patch.',
      'Watch keyboard behavior, ARIA semantics, and empty/error states while reviewing UI changes.'
    ],
    reviewChecklist,
    approvalsRequired: Array.isArray(verify.approvalsRequired) && verify.approvalsRequired.length
      ? verify.approvalsRequired
      : ['Feature owner approval', 'QA/Test owner approval', 'Accessibility reviewer approval'],
    blockers: Array.isArray(verify.blockers) ? verify.blockers : [],
    supportingArtifacts
  };

  const markdown = [
    '# ODT Developer Review Plan',
    '',
    `- Generated At: ${plan.generatedAt}`,
    `- Work Item: ${plan.workItem}`,
    `- Review Status: ${plan.status}`,
    '',
    '## Executive Summary',
    plan.summary,
    '',
    '## Review Workflow',
    ...plan.phases.map((phase, index) => `${index + 1}. **${phase.title}** - ${phase.detail}`),
    '',
    '## Planned File Actions',
    ...(plan.fileActions.length
      ? plan.fileActions.map((item) => `- ${item.file} | score=${item.score} | confidence=${item.confidence} | intent=${item.intent} | signals=${item.reasons.join(', ') || 'repo-ranked'}`)
      : ['- No ranked file actions were available. Review the repo manually before implementation.']),
    '',
    '## Reviewer Inputs',
    ...(plan.reviewerInputs.reviewEdits ? [plan.reviewerInputs.reviewEdits] : ['- No reviewer edits supplied.']),
    ...(plan.reviewerInputs.activePromptOverrides.length
      ? ['', '### Active Prompt Overrides', ...plan.reviewerInputs.activePromptOverrides.map((item) => `- ${item}`)]
      : ['', '### Active Prompt Overrides', '- None']),
    '',
    '## Risk Watchpoints',
    ...plan.risks.map((risk) => `- ${risk}`),
    '',
    '## Approval Checklist',
    ...plan.reviewChecklist.map((item) => `- ${item}`),
    '',
    '## Required Approvals',
    ...plan.approvalsRequired.map((item) => `- ${item}`),
    '',
    '## Blocking Conditions',
    ...(plan.blockers.length ? plan.blockers.map((item) => `- ${item}`) : ['- None']),
    '',
    '## Supporting Artifacts',
    ...plan.supportingArtifacts.map((item) => `- ${item}`),
    ''
  ].join('\n');

  writeFile(resolveWorkspacePath(`${ODT_DIR}/developer-review-plan.json`, options), `${JSON.stringify(plan, null, 2)}\n`);
  writeFile(resolveWorkspacePath(`${ODT_DIR}/developer-review-plan.md`, options), `${markdown}\n`);

  return {
    reviewPlanFile: `${ODT_DIR}/developer-review-plan.md`,
    reviewPlanJsonFile: `${ODT_DIR}/developer-review-plan.json`,
    plannedFiles: plan.fileActions.length,
    phases: plan.phases.length
  };
}

function writeUnitTestMatrix(options = {}) {
  const intake = safeReadJson(DEV_TWIN_INTAKE, {}, options);
  const impact = safeReadJson('reports/dev-twin/impact-analysis.json', {}, options);
  const moduleImpacts = impact.moduleImpacts || [];
  const relatedTests = moduleImpacts.flatMap((item) => item.testFiles || []).slice(0, 12);
  const promptOverrides = normalizePromptOverrides(intake.promptOverrides);
  const testsOverride = promptOverrides.unitTests && promptOverrides.unitTests.trim() ? promptOverrides.unitTests.trim() : '';
  const matrixRows = [
    ['Happy path', 'functional', 'Core user flow succeeds', 'low', 'Prefer explicit behavior assertions'],
    ['Edge path', 'functional', 'Boundary inputs produce safe output', 'medium', 'Use data-driven test cases'],
    ['Error path', 'resilience', 'Errors are surfaced accessibly', 'medium', 'Assert error copy and fallback state'],
    ['Keyboard path', 'a11y', 'Tab/Enter/Space interactions work', 'medium', 'Use role-based queries and keyboard events']
  ];

  const markdown = [
    '# ODT Unit Test Matrix',
    '',
    `- Generated At: ${now()}`,
    '',
    '## Matrix',
    '| Scenario | Coverage Type | Expected Assertion | Flake Risk | Mitigation |',
    '| --- | --- | --- | --- | --- |',
    ...matrixRows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]} |`),
    '',
    '## Related Test Files',
    ...(relatedTests.length ? uniqueStrings(relatedTests).map((file) => `- ${file}`) : ['- No related tests discovered; create nearest-module tests.']),
    '',
    '## Prompt Override (Unit Tests Stage)',
    ...(testsOverride ? [testsOverride] : ['- No unit-test prompt override supplied.']),
    '',
    '## Anti-flake Rules',
    '- Avoid timing-dependent assertions without deterministic waits.',
    '- Avoid snapshot-only verification for behavior-heavy flows.',
    '- Prefer role/label queries over brittle selectors.',
    ''
  ].join('\n');

  writeFile(resolveWorkspacePath(`${ODT_DIR}/unit-test-matrix.md`, options), `${markdown}\n`);
  return {
    testMatrixFile: `${ODT_DIR}/unit-test-matrix.md`,
    relatedTestFiles: uniqueStrings(relatedTests).length
  };
}

function mapRuleToWcag(ruleId = '') {
  const key = `${ruleId}`.toLowerCase();
  if (key.includes('clickable-non-interactive') || key.includes('keyboard')) return 'WCAG 2.1.1 Keyboard';
  if (key.includes('label') || key.includes('form')) return 'WCAG 3.3.2 Labels or Instructions';
  if (key.includes('aria')) return 'WCAG 4.1.2 Name, Role, Value';
  if (key.includes('contrast')) return 'WCAG 1.4.3 Contrast (Minimum)';
  return 'WCAG mapping requires reviewer confirmation';
}

function writeComplianceMapping(analysis = {}, verify = {}, options = {}) {
  const intake = safeReadJson(DEV_TWIN_INTAKE, {}, options);
  const ruleSummary = (analysis.ruleSummary || []).slice(0, 8);
  const promptOverrides = normalizePromptOverrides(intake.promptOverrides);
  const complianceOverride = promptOverrides.compliance && promptOverrides.compliance.trim() ? promptOverrides.compliance.trim() : '';
  const lines = [
    '# ODT Compliance Mapping',
    '',
    `- Generated At: ${now()}`,
    `- Verify Status: ${verify.status || 'unknown'}`,
    `- Blockers: ${analysis.summary && typeof analysis.summary.blockers === 'number' ? analysis.summary.blockers : 'n/a'}`,
    '',
    '## VPAT/WCAG Mapping',
    ...(ruleSummary.length
      ? ruleSummary.map((rule) => `- ${rule.ruleId}: ${mapRuleToWcag(rule.ruleId)} (findings=${rule.count})`)
      : ['- No rule summary available.']),
    '',
    '## Keyboard Gaps',
    ...(ruleSummary.filter((rule) => `${rule.ruleId}`.toLowerCase().includes('keyboard') || `${rule.ruleId}`.toLowerCase().includes('clickable'))
      .map((rule) => `- ${rule.ruleId}: validate tab order and Enter/Space parity.`)),
    '',
    '## Remediation Priority',
    ...(ruleSummary.length
      ? ruleSummary.slice(0, 5).map((rule, index) => `${index + 1}. ${rule.ruleId} (${rule.count})`)
      : ['1. No prioritized rules available.']),
    '',
    '## Residual Risk',
    '- Human accessibility reviewer should confirm final VPAT alignment before release.',
    '',
    '## Prompt Override (Compliance Stage)',
    ...(complianceOverride ? [complianceOverride] : ['- No compliance prompt override supplied.']),
    ''
  ];

  writeFile(resolveWorkspacePath(`${ODT_DIR}/compliance-mapping.md`, options), `${lines.join('\n')}\n`);
  return {
    complianceMapFile: `${ODT_DIR}/compliance-mapping.md`,
    topRules: ruleSummary.length
  };
}

function writeVerifyChecklist(stages, options = {}) {
  const intake = safeReadJson(DEV_TWIN_INTAKE, {}, options);
  const failedStages = stages.filter((stage) => stage.status === 'failed').map((stage) => stage.name);
  const complianceStage = stages.find((stage) => stage.name === 'compliance');
  const blockers = complianceStage && complianceStage.detail && typeof complianceStage.detail.blockers === 'number'
    ? complianceStage.detail.blockers
    : 0;

  const decision = failedStages.length
    ? 'no_go'
    : blockers > 0
      ? 'go_with_conditions'
      : 'go';
  const promptOverrides = normalizePromptOverrides(intake.promptOverrides);
  const verifyOverride = promptOverrides.verify && promptOverrides.verify.trim() ? promptOverrides.verify.trim() : '';

  const checklist = {
    stage: 'verify',
    generatedAt: now(),
    decision,
    blockers: [
      ...failedStages.map((name) => `Stage failed: ${name}`),
      ...(blockers > 0 ? [`Accessibility blockers remaining: ${blockers}`] : [])
    ],
    rollbackPlan: [
      'Revert scoped patch if post-release regressions are detected.',
      'Keep rollback ownership with the feature reviewer and release manager.'
    ],
    approvalsRequired: [
      'Feature owner approval',
      'QA/Test owner approval',
      'Accessibility reviewer approval'
    ],
    promptOverride: verifyOverride
  };

  const markdown = [
    '# ODT Verify Checklist',
    '',
    `- Generated At: ${checklist.generatedAt}`,
    `- Decision: ${checklist.decision}`,
    '',
    '## Blockers',
    ...(checklist.blockers.length ? checklist.blockers.map((item) => `- ${item}`) : ['- None']),
    '',
    '## Rollback Notes',
    ...checklist.rollbackPlan.map((item) => `- ${item}`),
    '',
    '## Human Approval Checklist',
    ...checklist.approvalsRequired.map((item) => `- ${item}`),
    '',
    '## Prompt Override (Verification Stage)',
    ...(verifyOverride ? [verifyOverride] : ['- No verification prompt override supplied.']),
    ''
  ].join('\n');

  writeFile(resolveWorkspacePath(`${ODT_DIR}/verify-checklist.json`, options), `${JSON.stringify(checklist, null, 2)}\n`);
  writeFile(resolveWorkspacePath(`${ODT_DIR}/verify-checklist.md`, options), `${markdown}\n`);
  return checklist;
}

function stageImpact(options = {}) {
  const result = runDevTwinAnalyze({ ...options, input: DEV_TWIN_INTAKE });
  return {
    blastRadius: result.impact && result.impact.totals ? result.impact.totals.blastRadius : 0,
    modules: result.impact && result.impact.totals ? result.impact.totals.modules : 0,
    sourceFiles: result.impact && result.impact.totals ? result.impact.totals.totalSourceFiles : 0,
    testFiles: result.impact && result.impact.totals ? result.impact.totals.totalTestFiles : 0,
    inferenceMode: result.impact && result.impact.inference ? result.impact.inference.mode : 'unknown',
    candidateFiles: result.impact && result.impact.inference ? result.impact.inference.candidateFiles.length : 0,
    keywords: result.impact && result.impact.inference ? result.impact.inference.keywords.slice(0, 8) : []
  };
}

function stageDesign(options = {}) {
  const summary = safeReadJson('reports/dev-twin/summary.json', {}, options);
  const intake = summary.intake || safeReadJson(DEV_TWIN_INTAKE, {}, options);
  const promptOverrides = normalizePromptOverrides(intake.promptOverrides);
  const designOverride = promptOverrides.design && promptOverrides.design.trim() ? promptOverrides.design.trim() : '';
  const design = {
    generatedAt: now(),
    featureName: intake.featureName || 'unknown',
    architecture: {
      uiLayer: 'React/Terra components',
      apiStrategy: 'Reuse existing API contracts; avoid backend changes unless explicitly in scope.',
      stateStrategy: 'Existing store/actions + minimal blast radius edits',
      errorHandling: 'Explicit loading/empty/error states with safe fallback messaging.',
      testing: 'Jest/RTL unit tests + edge/error states + keyboard checks',
      accessibility: 'VPAT/WCAG + keyboard interaction parity',
      reviewModel: 'Human-in-loop approvals at each gate'
    },
    qualityGates: [
      'No unauthorized dependencies',
      'Backward compatibility preserved',
      'Keyboard and ARIA behavior validated',
      'Deterministic unit tests updated'
    ],
    deliveryPlan: [
      'Scope impacted components and routes',
      'Implement minimal patch',
      'Generate/update tests',
      'Run a11y and verify gates'
    ],
    promptOverride: designOverride
  };
  writeFile(resolveWorkspacePath(`${ODT_DIR}/tech-design.json`, options), `${JSON.stringify(design, null, 2)}\n`);
  writeFile(
    resolveWorkspacePath(`${ODT_DIR}/tech-design.md`, options),
    [
      '# ODT Tech Design',
      '',
      `- Feature: ${design.featureName}`,
      `- Target repo: ${getTargetRepoPath({ ...options, targetRepoPath: intake.targetRepoPath })}`,
      '- UI: React/Terra minimal-blast-radius update',
      '- API strategy: reuse current contracts unless explicitly approved',
      '- State strategy: incremental updates in existing store/actions',
      '- Error handling: loading/empty/error states with deterministic behavior',
      '- Testing: Jest/RTL unit coverage for happy/edge/error paths',
      '- Accessibility: VPAT/WCAG and keyboard parity validation',
      '- Governance: human-reviewed approvals before merge',
      '',
      '## Prompt Override (Design Stage)',
      ...(designOverride ? [designOverride] : ['- No design-stage prompt override supplied.']),
      '',
      '## Quality Gates',
      ...design.qualityGates.map((gate) => `- ${gate}`),
      ''
    ].join('\n')
  );
  return {
    designFile: `${ODT_DIR}/tech-design.md`,
    designJsonFile: `${ODT_DIR}/tech-design.json`,
    qualityGateCount: design.qualityGates.length
  };
}

function stageCodeWorkpack(options = {}) {
  const existsCode = exists('reports/dev-twin/code-workpack.md', options);
  const patchPlan = writeCodePatchPlan(options);
  return {
    codeWorkpack: 'reports/dev-twin/code-workpack.md',
    available: existsCode,
    patchPlanFile: patchPlan.patchPlanFile,
    targetFiles: patchPlan.targetFiles,
    noNewDependencies: patchPlan.noNewDependencies
  };
}

function stageTestWorkpack(options = {}) {
  const existsTests = exists('reports/dev-twin/unit-test-workpack.md', options);
  const matrix = writeUnitTestMatrix(options);
  return {
    testWorkpack: 'reports/dev-twin/unit-test-workpack.md',
    available: existsTests,
    testMatrixFile: matrix.testMatrixFile,
    relatedTestFiles: matrix.relatedTestFiles
  };
}

function stageCompliance(options) {
  let status = 'skipped';
  let blockers = null;
  const workspaceRoot = getWorkspaceRoot(options);
  const targetRepoPath = getTargetRepoPath(options);
  const repoMode = workspaceRoot === targetRepoPath ? 'workspace' : 'external_target';
  const scanRoot = targetRepoPath || workspaceRoot;

  if (options.withA11y) {
    runScan({ full: true, 'scan-root': scanRoot });
  }

  if (exists(A11Y_FINDINGS, options) || options.withA11y) {
    const analysis = runTwinAnalyze({ input: A11Y_FINDINGS, limit: 25 });
    const verify = runTwinVerify();
    runFix({
      input: A11Y_FINDINGS,
      mode: analysis.summary.blockers > 0 ? 'preview' : 'baseline'
    });
    const mapping = writeComplianceMapping(analysis, verify, options);
    status = 'completed';
    blockers = analysis.summary.blockers;
    return {
      status,
      blockers,
      verifyStatus: verify.status,
      dashboard: 'reports/a11y-twin/index.html',
      complianceMapFile: mapping.complianceMapFile,
      topRules: mapping.topRules,
      repoMode,
      note: repoMode === 'external_target'
        ? 'A11y scan executed against the selected target repo and reports were saved in the ODT workspace artifacts.'
        : ''
    };
  }

  const mapping = writeComplianceMapping({}, { status: 'not_run' }, options);
  return {
    status,
    blockers,
    complianceMapFile: mapping.complianceMapFile,
    topRules: mapping.topRules,
    note: 'A11y findings not found. Run the accessibility twin scan (`npm run a11y:twin:demo`) first or pass --withA11y.'
  };
}

async function stageImpactParallelTask(options = {}) {
  return runExportInSubprocess('./dev-twin', 'runDevTwinAnalyze', {
    ...options,
    input: DEV_TWIN_INTAKE
  });
}

async function stageComplianceParallelTask(options = {}) {
  return runExportInSubprocess('./odt', 'runOdtComplianceStage', options);
}

function buildRunSummary(stages, statusOverride = null, totalStagesOverride = null) {
  const completed = stages.filter((s) => s.status === 'completed').length;
  const failed = stages.filter((s) => s.status === 'failed').length;
  const total = totalStagesOverride || stages.length;

  return {
    generatedAt: now(),
    totalStages: total,
    completedStages: completed,
    failedStages: failed,
    status: statusOverride || (failed ? 'needs_attention' : 'ready_for_review')
  };
}

function getStage(stages, name) {
  return stages.find((s) => s.name === name) || null;
}

function buildKpis(stages) {
  const total = stages.length || 1;
  const completed = stages.filter((s) => s.status === 'completed').length;
  const impactStage = getStage(stages, 'impact');
  const complianceStage = getStage(stages, 'compliance');
  const testStage = getStage(stages, 'test-workpack');
  const designStage = getStage(stages, 'design');
  const intakeStage = getStage(stages, 'intake');

  return {
    automationCoverage: Math.round((completed / total) * 100),
    impact: {
      blastRadius: impactStage && impactStage.detail ? impactStage.detail.blastRadius : 0,
      modules: impactStage && impactStage.detail ? impactStage.detail.modules : 0,
      sourceFiles: impactStage && impactStage.detail ? impactStage.detail.sourceFiles : 0,
      testFiles: impactStage && impactStage.detail ? impactStage.detail.testFiles : 0,
      inferenceMode: impactStage && impactStage.detail ? impactStage.detail.inferenceMode : 'unknown',
      candidateFiles: impactStage && impactStage.detail ? impactStage.detail.candidateFiles : 0,
      keywords: impactStage && impactStage.detail ? impactStage.detail.keywords : []
    },
    tests: {
      available: Boolean(testStage && testStage.detail && testStage.detail.available),
      testFiles: impactStage && impactStage.detail ? impactStage.detail.testFiles : 0
    },
    compliance: {
      status: complianceStage && complianceStage.detail ? complianceStage.detail.status : 'skipped',
      blockers: complianceStage && complianceStage.detail ? complianceStage.detail.blockers : null,
      verifyStatus: complianceStage && complianceStage.detail ? complianceStage.detail.verifyStatus : null
    },
    design: {
      available: Boolean(designStage && designStage.status === 'completed')
    },
    review: {
      humanApprovalRequired: true,
      status: completed === total ? 'ready_for_review' : 'in_progress'
    },
    intake: {
      workItemType: intakeStage && intakeStage.detail ? intakeStage.detail.workItemType : 'feature'
    }
  };
}

function avg(numbers) {
  if (!numbers.length) return 0;
  return Number((numbers.reduce((sum, n) => sum + n, 0) / numbers.length).toFixed(1));
}

function buildTrend(history, currentPayload) {
  const currentRecord = history[history.length - 1] || null;
  const previousRecord = history.length > 1 ? history[history.length - 2] : null;

  const recent = history.slice(-5);
  const recentCoverage = recent.map((r) => Number(r.automationCoverage || 0));
  const recentStatuses = history.slice(-10).map((r) => r.status);

  const successCount = recentStatuses.filter((s) => s === 'ready_for_review').length;
  const runSuccessRate = recentStatuses.length ? Math.round((successCount / recentStatuses.length) * 100) : 0;

  const blockerDelta = (previousRecord && previousRecord.compliance.blockers !== null && currentRecord && currentRecord.compliance.blockers !== null)
    ? previousRecord.compliance.blockers - currentRecord.compliance.blockers
    : null;

  return {
    totalRunsStored: history.length,
    lastRunAt: currentPayload.summary.generatedAt,
    blockerDelta,
    averageAutomationCoverage5Runs: avg(recentCoverage),
    runSuccessRate10Runs: runSuccessRate,
    reviewReadyRuns5: recent.filter((r) => r.status === 'ready_for_review').length
  };
}

function persistRun(payload, options = {}) {
  const maxRuns = Number(options['keep-runs'] || 60);
  const history = loadHistory(options);

  const item = {
    generatedAt: payload.summary.generatedAt,
    profile: payload.profile.id,
    workItemType: payload.intake.workItemType || 'feature',
    status: payload.summary.status,
    compliance: payload.kpis.compliance,
    automationCoverage: payload.kpis.automationCoverage
  };

  const nextHistory = [...history, item].slice(-maxRuns);
  saveHistory(nextHistory, options);
  return nextHistory;
}

function buildExecutionGuide(payload) {
  return [
    '# Oracle Developer Twin Execution Guide',
    '',
    'This guide is designed for everyday developer use, stakeholder reviews, and guided walkthroughs.',
    '',
    '## 1) New Feature Workflow',
    '1. Initialize intake template: `npm run dev:twin:init`',
    '2. Update `reports/dev-twin/intake.json` with ticket summary, acceptance criteria, mockups, and constraints.',
    '3. Run ODT pipeline: `npm run odt:run -- --profile react-js --withA11y`',
    '4. Review inferred repo impact, tech design, and code workpack.',
    '5. Use `npm run odt:execute` to prepare/apply a reviewed Codex/Cline patch.',
    '6. Verify with generated dashboards and run summary.',
    '',
    '## 2) Defect Workflow',
    '1. Set `workItemType` to `defect` in intake JSON.',
    '2. Fill `defectContext` (observed, expected, severity).',
    '3. Add optional suspected areas only if you already know likely root-cause zones.',
    '4. Run ODT pipeline and use inferred impact + workpacks to patch and add regression tests.',
    '5. Confirm compliance and run status are review-ready.',
    '',
    '## 3) Accessibility Workflow (VPAT/WCAG + Keyboard)',
    '1. Run: `npm run a11y:twin:demo`',
    '2. Review `reports/a11y-twin/index.html` and `priority-queue.md`.',
    '3. Apply fixes with `reports/a11y/coding-agent-prompt.md`.',
    '4. Re-run verify: `npm run a11y:twin:verify`.',
    '',
    '## 4) Unit Test Workflow',
    '1. Run ODT pipeline to generate `reports/dev-twin/unit-test-workpack.md`.',
    '2. Use Codex/Cline to update tests for happy, edge, and error paths.',
    '3. Execute tests: `npm test -- --watch=false --runInBand`.',
    '',
    '## 5) Execute Workflow',
    '1. Run: `npm run odt:execute` to generate `reports/odt/execute/prompt.md`.',
    '2. Paste the prompt into Codex/Cline and save the diff response to a local file.',
    '3. Apply safely: `npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --dry-run`.',
    '4. If dry-run passes, apply for real: `npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --verify`.',
    '',
    '## 6) Tech Design Workflow',
    '1. Run ODT pipeline.',
    '2. Review `reports/odt/tech-design.md` and `tech-design.json`.',
    '3. Validate architecture and quality gates before implementation.',
    '',
    '## 7) Dashboard & Status',
    '- ODT Review Dashboard: `reports/odt/index.html`',
    '- ODT Workspace: `reports/odt/fedit.html`',
    '- Developer Review Plan: `reports/odt/developer-review-plan.md`',
    '- DevTwin: `reports/dev-twin/index.html`',
    '- A11yTwin: `reports/a11y-twin/index.html`',
    '- Run status: `npm run odt:status`',
    '',
    `## Last Run Snapshot`,
    `- Profile: ${payload.profile.id}`,
    `- Status: ${payload.summary.status}`,
    `- Completed: ${payload.summary.completedStages}/${payload.summary.totalStages}`,
    ''
  ].join('\n');
}

function buildUiPayload(basePayload, options = {}) {
  const rawA11yFindings = safeReadJson('reports/a11y/findings.json', {}, options);
  return {
    ...basePayload,
    generatedAt: basePayload.summary && basePayload.summary.generatedAt ? basePayload.summary.generatedAt : now(),
    workspaceRoot: getWorkspaceRoot(options),
    targetRepoPath: getTargetRepoPath({ ...options, targetRepoPath: basePayload.intake && basePayload.intake.targetRepoPath }),
    devTwin: safeReadJson('reports/dev-twin/summary.json', {}, options),
    a11y: safeReadJson('reports/a11y-twin/insights.json', {}, options),
    a11yRaw: rawA11yFindings,
    odt: {
      summary: basePayload.summary || {}
    },
    promptProviderStatus: safeReadJson('reports/odt/prompts/provider-status.json', null, options),
    techDesignMarkdown: safeReadText('reports/odt/tech-design.md', '', options),
    codeWorkpack: safeReadText('reports/dev-twin/code-workpack.md', '', options),
    testWorkpack: safeReadText('reports/dev-twin/unit-test-workpack.md', '', options),
    a11yPrompt: safeReadText('reports/a11y/coding-agent-prompt.md', '', options),
    reviewPlanMarkdown: safeReadText('reports/odt/developer-review-plan.md', '', options),
    reviewPlanJson: safeReadJson('reports/odt/developer-review-plan.json', {}, options)
  };
}

function writeRunArtifacts(payload, options = {}) {
  const outDir = resolveWorkspacePath(ODT_DIR, options);
  ensureDir(outDir);
  writeExternalLlmSafetyArtifacts(payload.intake || {}, options);
  const uiPayload = buildUiPayload(payload, options);
  const activeOverrides = activePromptOverrides(payload.intake && payload.intake.promptOverrides);
  writeFile(path.join(outDir, 'run-summary.json'), `${JSON.stringify(payload, null, 2)}\n`);
  writeFile(
    path.join(outDir, 'run-summary.md'),
    [
      '# Oracle Developer Twin Run Summary',
      '',
      `- Generated At: ${payload.summary.generatedAt}`,
      `- Profile: ${payload.profile.id} (${payload.profile.name})`,
      `- Work Item Type: ${payload.intake.workItemType || 'feature'}`,
      `- Status: ${payload.summary.status}`,
      `- Completed Stages: ${payload.summary.completedStages}/${payload.summary.totalStages}`,
      `- Runs Stored (ODT DB): ${(payload.kpis.trend && payload.kpis.trend.totalRunsStored) || 0}`,
      `- Prompt Provider: ${(payload.promptGeneration && payload.promptGeneration.provider) || 'template'}`,
      `- Reviewer edits supplied: ${payload.intake.reviewEdits && `${payload.intake.reviewEdits}`.trim() ? 'yes' : 'no'}`,
      `- Active prompt overrides: ${activeOverrides.length}`,
      '- Developer Review Plan: reports/odt/developer-review-plan.md',
      '',
      ...(payload.promptGeneration && Array.isArray(payload.promptGeneration.stages) && payload.promptGeneration.stages.length ? [
        '## Stage Prompt Generation',
        ...payload.promptGeneration.stages.map((item) => `- ${item.stage} -> ${item.provider} (${item.latencyMs}ms${item.fallback ? ', fallback' : ''})`),
        ''
      ] : []),
      '',
      ...(activeOverrides.length ? [
        '## Active Prompt Overrides',
        ...activeOverrides.map((item) => `- ${item.label}`),
        ''
      ] : []),
      '',
      '## Stages',
      ...payload.stages.map((s) => `- ${s.name}: ${s.status}`),
      '',
      '## Notes',
      '- Human review required before merge.',
      '- Use generated workpacks for Codex/Cline execution.',
      ''
    ].join('\n')
  );
  const {
    renderOdtDashboard,
    renderFeditPage,
    renderFeditStyles,
    renderFeditApp,
    buildFeditViewModel
  } = loadOdtRenderers();
  writeFile(path.join(outDir, 'index.html'), renderOdtDashboard(payload));
  writeFile(path.join(outDir, 'fedit.html'), renderFeditPage(uiPayload));
  writeFile(path.join(outDir, 'fedit.css'), renderFeditStyles());
  writeFile(path.join(outDir, 'fedit-app.js'), renderFeditApp(buildFeditViewModel(uiPayload)));
  {
    const feditAssetSource = resolveWorkspacePath('assets/branding/fedit-digital-worker-logo.png', options);
    const collabAssetSource = resolveWorkspacePath('assets/branding/oracle-dev-twin-collab.png', options);
    const feditAssetDir = path.join(outDir, 'assets');
    if (fs.existsSync(feditAssetSource) || fs.existsSync(collabAssetSource)) {
      ensureDir(feditAssetDir);
    }
    if (fs.existsSync(feditAssetSource)) {
      fs.copyFileSync(feditAssetSource, path.join(feditAssetDir, 'fedit-digital-worker-logo.png'));
    }
    if (fs.existsSync(collabAssetSource)) {
      fs.copyFileSync(collabAssetSource, path.join(feditAssetDir, 'oracle-dev-twin-collab.png'));
    }
  }
  writeFile(path.join(outDir, 'execution-guide.md'), `${buildExecutionGuide(payload)}\n`);
  writeFile(
    path.join(outDir, 'codex-automation.md'),
    [
      '# Codex Automation Template - Oracle Developer Twin',
      '',
      'Use these with Codex automations (or manually run in terminal).',
      '',
      '## Daily SDLC + A11y Twin',
      '`npm run odt:autopilot -- --profile react-js --work-item feature --withA11y`',
      '',
      '## Defect-focused SDLC + A11y Twin',
      '`npm run odt:autopilot -- --profile react-js --work-item defect --withA11y`',
      '',
      '## Build execution bundle',
      '`npm run odt:execute`',
      '',
      '## Apply reviewed patch',
      '`npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --dry-run`',
      '`npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --verify`',
      '',
      '## Useful options',
      '- `--feature-name "..."`',
      '- `--ticket-id "JIRA-123"`',
      '- `--summary "..."`',
      '- `--modules "src/path/a,src/path/b"` (optional hints only)',
      '- `--components "ActivityList,SearchPanel"`',
      '- `--criteria "criterion 1,criterion 2"`',
      '- `--images "/tmp/mock1.png,/tmp/mock2.png"`',
      '- `--refs "https://wiki...,https://jira..."`',
      '',
      '## External LLM Safety',
      '- Use `reports/odt/prompts/external-llm-sanitized-context.json` for chat.oracle.com prompt drafting.',
      '- Never paste raw incident/customer data directly into external prompts.',
      '',
      `Generated from run: ${payload.summary.generatedAt}`,
      ''
    ].join('\n')
  );
}

function runOdtInit(options = {}) {
  const outDir = resolveWorkspacePath(ODT_DIR, options);
  ensureDir(outDir);
  runDevTwinInit(options);
  writePromptTemplates(options);
  const profiles = fs.readdirSync(PROFILE_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
  writeFile(
    path.join(outDir, 'README.md'),
    [
      '# Oracle Developer Twin (ODT)',
      '',
      'Pipeline stages:',
      '1. intake',
      '2. impact',
      '3. design',
      '4. code-workpack',
      '5. test-workpack',
      '6. compliance',
      '7. verify-summary',
      '',
      'Prompt contracts:',
      '- reports/odt/prompts/stage-contracts.json',
      '- reports/odt/prompts/external-llm-safety.md',
      '',
      `Profiles available: ${profiles.join(', ')}`,
      ''
    ].join('\n')
  );

  // eslint-disable-next-line no-console
  console.log(`ODT init complete. artifacts=${ODT_DIR}`);
}

function runOdtStatus(options = {}) {
  const payload = safeReadJson(`${ODT_DIR}/run-summary.json`, null, options);
  if (!payload) {
    // eslint-disable-next-line no-console
    console.log('ODT status: no run summary found. Run odt:run first.');
    return null;
  }
  // eslint-disable-next-line no-console
  console.log(`ODT status=${payload.summary.status} completed=${payload.summary.completedStages}/${payload.summary.totalStages}`);
  return payload;
}

async function runStageGroup(stageDefs, stages, writeLive, onStageComplete = null) {
  stageDefs.forEach((def) => {
    stages.push({
      name: def.name,
      status: 'in_progress',
      startedAt: now(),
      finishedAt: '',
      detail: {}
    });
  });
  writeLive();

  await Promise.all(stageDefs.map(async (def) => {
    const record = stages.find((stage) => stage.name === def.name && stage.status === 'in_progress' && !stage.finishedAt);
    try {
      record.detail = await def.action();
      record.status = 'completed';
    } catch (error) {
      record.detail = { error: error.message };
      record.status = 'failed';
    }
    record.finishedAt = now();
    writeLive();
    if (onStageComplete) {
      try {
        await onStageComplete(record);
      } catch (error) {
        if (record && record.detail && typeof record.detail === 'object') {
          record.detail.promptGenerationWarning = error.message;
        }
        writeLive();
      }
    }
  }));
}

async function runOdt(options = {}) {
  const profile = loadProfile(options.profile);
  runOdtInit(options);
  const promptContractsBySlug = buildPromptContractMap();
  const promptProviderConfig = resolvePromptProviderConfig(options);
  const generatedStagePrompts = [];
  const totalStages = 7;
  const stages = [];

  const onStageComplete = async (record) => {
    const promptResult = await generateStagePromptArtifact(record, promptContractsBySlug, promptProviderConfig, options);
    if (promptResult) {
      generatedStagePrompts.push(promptResult);
    }
  };

  const writeLive = () => {
    const liveSummary = buildRunSummary(stages, 'in_progress', totalStages);
    const livePayload = {
      summary: liveSummary,
      stages,
      profile,
      intake: safeReadJson(DEV_TWIN_INTAKE, {}, options),
      kpis: {
        ...buildKpis(stages),
        trend: {}
      }
    };
    livePayload.promptGeneration = {
      provider: promptProviderConfig.provider,
      stages: generatedStagePrompts
    };
    writeRunArtifacts(livePayload, options);
  };

  await runStageGroup([
    { name: 'intake', action: async () => stageIntake(options) }
  ], stages, writeLive, onStageComplete);

  await runStageGroup([
    {
      name: 'impact',
      action: async () => {
        const result = await stageImpactParallelTask(options);
        const ranked = writeImpactRankedFiles(result, options);
        return {
          blastRadius: result.impact && result.impact.totals ? result.impact.totals.blastRadius : 0,
          modules: result.impact && result.impact.totals ? result.impact.totals.modules : 0,
          sourceFiles: result.impact && result.impact.totals ? result.impact.totals.totalSourceFiles : 0,
          testFiles: result.impact && result.impact.totals ? result.impact.totals.totalTestFiles : 0,
          inferenceMode: result.impact && result.impact.inference ? result.impact.inference.mode : 'unknown',
          candidateFiles: result.impact && result.impact.inference ? result.impact.inference.candidateFiles.length : 0,
          keywords: result.impact && result.impact.inference ? result.impact.inference.keywords.slice(0, 8) : [],
          rankedFileCount: ranked.rankedFiles.length,
          topConfidence: ranked.rankedFiles.length ? ranked.rankedFiles[0].confidence : 0,
          regressionRisks: ranked.regressionRisks
        };
      }
    },
    {
      name: 'compliance',
      action: async () => stageComplianceParallelTask(options)
    }
  ], stages, writeLive, onStageComplete);

  await runStageGroup([
    { name: 'design', action: async () => stageDesign(options) }
  ], stages, writeLive, onStageComplete);

  await runStageGroup([
    { name: 'code-workpack', action: async () => stageCodeWorkpack(options) },
    { name: 'test-workpack', action: async () => stageTestWorkpack(options) }
  ], stages, writeLive, onStageComplete);

  await runStageGroup([
    {
      name: 'verify-summary',
      action: async () => {
        const verify = writeVerifyChecklist(stages.filter((stage) => stage.name !== 'verify-summary'), options);
        return {
          note: 'Run summary generated for human review.',
          decision: verify.decision,
          blockerCount: verify.blockers.length,
          verifyChecklistFile: `${ODT_DIR}/verify-checklist.md`
        };
      }
    }
  ], stages, writeLive, onStageComplete);

  const summary = buildRunSummary(stages, null, totalStages);
  const intake = safeReadJson(DEV_TWIN_INTAKE, {}, options);
  const kpis = buildKpis(stages);
  const payload = {
    summary,
    stages,
    profile,
    intake,
    kpis,
    promptGeneration: {
      provider: promptProviderConfig.provider,
      stages: generatedStagePrompts
    }
  };
  const history = persistRun(payload, options);
  payload.kpis.trend = buildTrend(history, payload);
  payload.reviewPlan = writeDeveloperReviewPlan(payload, options);
  writePromptProviderStatus(promptProviderConfig, generatedStagePrompts, options);
  writeRunArtifacts(payload, options);

  // eslint-disable-next-line no-console
  console.log(`ODT run complete. profile=${profile.id} status=${summary.status} dashboards=${ODT_DIR}/index.html, ${ODT_DIR}/fedit.html`);
  return payload;
}

function runOdtAutopilot(options = {}) {
  const merged = {
    ...options,
    withA11y: options.withA11y === false ? false : true
  };

  runDevTwinInit(merged);
  updateIntakeFromOptions(merged);
  return runOdt(merged);
}

module.exports = {
  runOdtComplianceStage: stageCompliance,
  runOdtInit,
  runOdt,
  runOdtStatus,
  runOdtAutopilot
};
