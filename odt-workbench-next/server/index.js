import { createServer } from 'node:http';
import { execFile, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
  agentFoundryDomains,
  agentFoundryPhases,
  buildAgentFoundryOutput,
  getAgentFoundryPhase,
  resolveAgentFoundryDomains
} from './agentFoundry/specialistDomains.js';
import { buildAgentContract } from './governance/agentContractService.js';
import { runStandardsReview } from './governance/standardsCheckService.js';
import { loadStandardsRegistry } from './governance/standardsRegistry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = dirname(__dirname);
const dataDir = join(appRoot, 'data');
const workspaceDir = join(appRoot, 'workspaces');
const dbPath = join(dataDir, 'odt-workbench-next.sqlite');
const port = Number(process.env.ODT_WORKBENCH_NEXT_API_PORT || 5190);
const odtApiBase = process.env.ODT_API_BASE || 'http://127.0.0.1:4310';

const limits = {
  maxRequestsPerMinute: Number(process.env.ODT_AI_MAX_REQUESTS_PER_MINUTE || 100),
  maxRequestsPerUserPerDay: Number(process.env.ODT_AI_MAX_REQUESTS_PER_USER_PER_DAY || 300),
  maxInputChars: Number(process.env.ODT_AI_MAX_INPUT_CHARS || 12000),
  maxOutputTokens: Number(process.env.ODT_AI_MAX_OUTPUT_TOKENS || 1000),
  requestTimeoutMs: Number(process.env.ODT_AI_REQUEST_TIMEOUT_MS || 30000),
  retryCount: Number(process.env.ODT_AI_RETRY_COUNT || 1)
};

const uploadPolicy = {
  maxFilesPerRequest: Number(process.env.ODT_UPLOAD_MAX_FILES || 10),
  maxFileBytes: Number(process.env.ODT_UPLOAD_MAX_FILE_BYTES || 15 * 1024 * 1024),
  maxBatchBytes: Number(process.env.ODT_UPLOAD_MAX_BATCH_BYTES || 50 * 1024 * 1024),
  allowedExtensions: [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
    '.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt', '.md',
    '.json', '.yaml', '.yml', '.pptx'
  ]
};

const aiConfig = {
  provider: process.env.ODT_AI_PROVIDER || 'local',
  environment: process.env.ODT_ENVIRONMENT || 'Local Dev',
  region: process.env.OCI_REGION || '',
  genAiEndpointConfigured: Boolean(process.env.OCI_GENAI_ENDPOINT),
  compartmentConfigured: Boolean(process.env.OCI_COMPARTMENT_ID),
  chatModelConfigured: Boolean(process.env.OCI_GENAI_CHAT_MODEL_ID),
  embedModelConfigured: Boolean(process.env.OCI_GENAI_EMBED_MODEL_ID),
  authMode: process.env.OCI_AUTH_MODE || 'not configured',
  configProfileConfigured: Boolean(process.env.OCI_CONFIG_PROFILE),
  agentEndpointConfigured: Boolean(process.env.OCI_GENAI_AGENT_ENDPOINT),
  ragEnabled: process.env.ODT_RAG_ENABLED !== 'false',
  ragMode: 'local-keyword-rag',
  vectorStore: process.env.ODT_VECTOR_STORE || 'local-evidence-corpus',
  limits
};

const connectorConfig = {
  mcpEnabled: process.env.ENABLE_MCP === 'true',
  jira: {
    id: 'jira',
    label: 'Jira MCP',
    enabled: process.env.ENABLE_JIRA_MCP === 'true',
    readOnly: process.env.JIRA_MCP_READ_ONLY !== 'false',
    serverName: process.env.JIRA_MCP_SERVER_NAME || '',
    requireWriteApproval: process.env.MCP_REQUIRE_APPROVAL_FOR_WRITE !== 'false',
    destructiveBlocked: true
  },
  knowledge: {
    id: 'knowledge',
    label: 'Knowledge MCP',
    enabled: process.env.ENABLE_KNOWLEDGE_MCP === 'true',
    readOnly: process.env.KNOWLEDGE_MCP_READ_ONLY !== 'false',
    serverName: process.env.KNOWLEDGE_MCP_SERVER_NAME || '',
    requireWriteApproval: process.env.MCP_REQUIRE_APPROVAL_FOR_WRITE !== 'false',
    destructiveBlocked: true
  },
  git: {
    id: 'git',
    label: 'Git/File MCP',
    enabled: process.env.ENABLE_GIT_MCP === 'true',
    readOnly: process.env.GIT_MCP_READ_ONLY !== 'false',
    serverName: process.env.GIT_MCP_SERVER_NAME || '',
    requireWriteApproval: process.env.MCP_REQUIRE_APPROVAL_FOR_WRITE !== 'false',
    destructiveBlocked: true
  },
  maxResults: Number(process.env.MCP_MAX_RESULTS || 10),
  timeoutMs: Number(process.env.MCP_TIMEOUT_MS || 30000)
};

mkdirSync(dataDir, { recursive: true });
mkdirSync(workspaceDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    requirement TEXT NOT NULL,
    owner TEXT,
    status TEXT NOT NULL,
    priority TEXT,
    repo_path TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    assignment_id TEXT,
    session_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    provider TEXT,
    model TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agent_events (
    id TEXT PRIMARY KEY,
    assignment_id TEXT,
    agent_id TEXT,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS run_events (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    assignment_id TEXT,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prompt_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    request_type TEXT NOT NULL,
    version TEXT NOT NULL,
    template TEXT NOT NULL,
    active INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_usage_events (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    run_id TEXT,
    session_id TEXT,
    user_id TEXT,
    request_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_chars INTEGER NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    fallback_used INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS connector_events (
    id TEXT PRIMARY KEY,
    connector_id TEXT NOT NULL,
    action TEXT NOT NULL,
    mode TEXT NOT NULL,
    status TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS requirements (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    summary TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS repo_analysis (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    repo_path TEXT NOT NULL,
    analysis_json TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS technical_designs (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    title TEXT NOT NULL,
    design_json TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS implementation_plans (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    title TEXT NOT NULL,
    plan_json TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS standards_checks (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    standards_version TEXT NOT NULL,
    status TEXT NOT NULL,
    summary TEXT NOT NULL,
    artifact TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS standards_findings (
    id TEXT PRIMARY KEY,
    standards_check_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS approval_events (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    approval_type TEXT NOT NULL,
    status TEXT NOT NULL,
    approved_by TEXT,
    approved_at TEXT NOT NULL,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS dependency_requests (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    version TEXT,
    license TEXT,
    reason TEXT NOT NULL,
    alternatives TEXT,
    status TEXT NOT NULL,
    requested_by TEXT,
    approved_by TEXT,
    requested_at TEXT NOT NULL,
    decided_at TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS review_comments (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    severity TEXT NOT NULL,
    comment TEXT NOT NULL,
    status TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    resolution_notes TEXT
  );

  CREATE TABLE IF NOT EXISTS test_plans (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    plan_json TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS implementation_evidence (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    run_id TEXT,
    phase TEXT NOT NULL,
    changed_files_json TEXT NOT NULL,
    commands_json TEXT NOT NULL,
    tests_json TEXT NOT NULL,
    summary TEXT NOT NULL,
    status TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pr_readiness_reports (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    title TEXT NOT NULL,
    report_json TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS intake_assets (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    mime_type TEXT,
    file_type TEXT NOT NULL,
    bytes INTEGER NOT NULL,
    source_kind TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

	  CREATE TABLE IF NOT EXISTS agent_foundry_runs (
	    id TEXT PRIMARY KEY,
	    run_id TEXT NOT NULL,
	    assignment_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    domain_id TEXT NOT NULL,
    domain_label TEXT NOT NULL,
    input_sources_json TEXT NOT NULL,
    output_json TEXT NOT NULL,
    status TEXT NOT NULL,
	    provider TEXT NOT NULL,
	    model TEXT NOT NULL,
	    created_at TEXT NOT NULL
	  );

		  CREATE TABLE IF NOT EXISTS agent_worker_runs (
		    id TEXT PRIMARY KEY,
		    assignment_id TEXT NOT NULL,
		    run_id TEXT NOT NULL,
	    worker_role TEXT NOT NULL,
	    worker_role_label TEXT NOT NULL,
	    execution_agent TEXT NOT NULL,
	    mode TEXT NOT NULL,
	    sandbox_mode TEXT NOT NULL,
	    status TEXT NOT NULL,
	    sequence_index INTEGER NOT NULL,
	    launch_mode TEXT NOT NULL,
	    bundle_dir TEXT,
	    handoff_file TEXT,
	    prompt_file TEXT,
	    script_file TEXT,
	    response_file TEXT,
	    log_file TEXT,
	    status_file TEXT,
	    manual_command TEXT,
	    output_json TEXT NOT NULL,
	    questions_json TEXT NOT NULL,
	    created_at TEXT NOT NULL,
		    updated_at TEXT NOT NULL,
		    completed_at TEXT
		  );

		  CREATE TABLE IF NOT EXISTS agent_relay_items (
		    id TEXT PRIMARY KEY,
		    assignment_id TEXT NOT NULL,
		    source_worker_run_id TEXT,
		    source_worker_role TEXT,
		    source_worker_role_label TEXT,
		    target_worker_role TEXT,
		    target_lane TEXT,
		    item_type TEXT NOT NULL,
		    status TEXT NOT NULL,
		    severity TEXT NOT NULL,
		    title TEXT NOT NULL,
		    message TEXT NOT NULL,
		    context_json TEXT NOT NULL,
		    decision_json TEXT NOT NULL,
		    unique_key TEXT NOT NULL UNIQUE,
		    created_by TEXT,
		    created_at TEXT NOT NULL,
		    updated_at TEXT NOT NULL,
		    resolved_at TEXT
		  );
		`);

const statements = {
  insertAssignment: db.prepare(`
    INSERT INTO assignments (id, title, requirement, owner, status, priority, repo_path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateAssignmentContext: db.prepare(`
    UPDATE assignments
    SET title = COALESCE(?, title),
      requirement = COALESCE(?, requirement),
      repo_path = COALESCE(?, repo_path),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?
  `),
  selectAssignments: db.prepare(`
    SELECT id, title, requirement, owner, status, priority, repo_path AS repoPath,
      created_at AS createdAt, updated_at AS updatedAt
    FROM assignments
    ORDER BY updated_at DESC
    LIMIT 50
  `),
  selectAssignmentById: db.prepare(`
    SELECT id, title, requirement, owner, status, priority, repo_path AS repoPath,
      created_at AS createdAt, updated_at AS updatedAt
    FROM assignments
    WHERE id = ?
  `),
  insertChat: db.prepare(`
    INSERT INTO chat_messages (id, assignment_id, session_id, role, content, provider, model, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectChat: db.prepare(`
    SELECT id, assignment_id AS assignmentId, session_id AS sessionId, role, content, provider, model,
      created_at AS createdAt
    FROM chat_messages
    ORDER BY created_at ASC
    LIMIT 200
  `),
  insertAgentEvent: db.prepare(`
    INSERT INTO agent_events (id, assignment_id, agent_id, event_type, status, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  selectAgentEventsByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, agent_id AS agentId, event_type AS eventType,
      status, detail, created_at AS createdAt
    FROM agent_events
    WHERE assignment_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `),
  insertRunEvent: db.prepare(`
    INSERT INTO run_events (id, run_id, assignment_id, event_type, status, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  selectRunEvents: db.prepare(`
    SELECT id, run_id AS runId, assignment_id AS assignmentId, event_type AS eventType, status,
      detail, created_at AS createdAt
    FROM run_events
    ORDER BY created_at DESC
    LIMIT 500
  `),
  selectRunEventsByRun: db.prepare(`
    SELECT id, run_id AS runId, assignment_id AS assignmentId, event_type AS eventType, status,
      detail, created_at AS createdAt
    FROM run_events
    WHERE run_id = ?
    ORDER BY created_at ASC
  `),
  upsertSetting: db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `),
  selectSettings: db.prepare(`
    SELECT key, value, updated_at AS updatedAt
    FROM settings
    ORDER BY key ASC
  `),
  insertPromptTemplate: db.prepare(`
    INSERT OR IGNORE INTO prompt_templates (id, name, request_type, version, template, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectPromptTemplates: db.prepare(`
    SELECT id, name, request_type AS requestType, version, active, created_at AS createdAt, updated_at AS updatedAt
    FROM prompt_templates
    ORDER BY request_type ASC, version DESC
  `),
  insertAiUsage: db.prepare(`
    INSERT INTO ai_usage_events (
      id, request_id, run_id, session_id, user_id, request_type, provider, model,
      input_chars, prompt_tokens, completion_tokens, total_tokens, latency_ms,
      status, error, fallback_used, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectAiUsage: db.prepare(`
    SELECT id, request_id AS requestId, run_id AS runId, session_id AS sessionId, user_id AS userId,
      request_type AS requestType, provider, model, input_chars AS inputChars,
      prompt_tokens AS promptTokens, completion_tokens AS completionTokens, total_tokens AS totalTokens,
      latency_ms AS latencyMs, status, error, fallback_used AS fallbackUsed, created_at AS createdAt
    FROM ai_usage_events
    ORDER BY created_at DESC
    LIMIT 200
  `),
  insertConnectorEvent: db.prepare(`
    INSERT INTO connector_events (id, connector_id, action, mode, status, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  selectConnectorEvents: db.prepare(`
    SELECT id, connector_id AS connectorId, action, mode, status, detail, created_at AS createdAt
    FROM connector_events
    ORDER BY created_at DESC
    LIMIT 100
  `),
  insertRequirement: db.prepare(`
    INSERT INTO requirements (id, assignment_id, source_type, raw_text, summary, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectRequirementsByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, source_type AS sourceType, raw_text AS rawText,
      summary, status, created_at AS createdAt, updated_at AS updatedAt
    FROM requirements
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  insertRepoAnalysis: db.prepare(`
    INSERT INTO repo_analysis (id, assignment_id, repo_path, analysis_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  selectRepoAnalysisByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, repo_path AS repoPath, analysis_json AS analysisJson,
      status, created_at AS createdAt, updated_at AS updatedAt
    FROM repo_analysis
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  insertTechnicalDesign: db.prepare(`
    INSERT INTO technical_designs (id, assignment_id, title, design_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  selectTechnicalDesignsByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, title, design_json AS designJson, status,
      created_at AS createdAt, updated_at AS updatedAt
    FROM technical_designs
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  insertImplementationPlan: db.prepare(`
    INSERT INTO implementation_plans (id, assignment_id, title, plan_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  selectImplementationPlansByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, title, plan_json AS planJson, status,
      created_at AS createdAt, updated_at AS updatedAt
    FROM implementation_plans
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  insertStandardsCheck: db.prepare(`
    INSERT INTO standards_checks (id, assignment_id, phase, standards_version, status, summary, artifact, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  insertStandardsFinding: db.prepare(`
    INSERT INTO standards_findings (
      id, standards_check_id, assignment_id, category, status, message, recommendation, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectStandardsChecksByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, phase, standards_version AS standardsVersion,
      status, summary, artifact, created_at AS createdAt
    FROM standards_checks
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  selectStandardsFindingsByAssignment: db.prepare(`
    SELECT id, standards_check_id AS standardsCheckId, assignment_id AS assignmentId,
      category, status, message, recommendation, created_at AS createdAt
    FROM standards_findings
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  insertApprovalEvent: db.prepare(`
    INSERT INTO approval_events (id, assignment_id, approval_type, status, approved_by, approved_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  selectApprovalsByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, approval_type AS approvalType, status,
      approved_by AS approvedBy, approved_at AS approvedAt, notes
    FROM approval_events
    WHERE assignment_id = ?
    ORDER BY approved_at DESC
  `),
  insertDependencyRequest: db.prepare(`
    INSERT INTO dependency_requests (
      id, assignment_id, package_name, version, license, reason, alternatives, status,
      requested_by, approved_by, requested_at, decided_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateDependencyDecision: db.prepare(`
    UPDATE dependency_requests
    SET status = ?, approved_by = ?, decided_at = ?, notes = ?
    WHERE id = ?
  `),
  selectDependencyRequestById: db.prepare(`
    SELECT id, assignment_id AS assignmentId, package_name AS packageName, version, license,
      reason, alternatives, status, requested_by AS requestedBy, approved_by AS approvedBy,
      requested_at AS requestedAt, decided_at AS decidedAt, notes
    FROM dependency_requests
    WHERE id = ?
  `),
  selectDependencyRequestsByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, package_name AS packageName, version, license,
      reason, alternatives, status, requested_by AS requestedBy, approved_by AS approvedBy,
      requested_at AS requestedAt, decided_at AS decidedAt, notes
    FROM dependency_requests
    WHERE assignment_id = ?
    ORDER BY requested_at DESC
  `),
  insertReviewComment: db.prepare(`
    INSERT INTO review_comments (
      id, assignment_id, target_type, target_id, severity, comment, status,
      created_by, created_at, updated_at, resolution_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateReviewCommentStatus: db.prepare(`
    UPDATE review_comments
    SET status = ?, updated_at = ?, resolution_notes = ?
    WHERE id = ?
  `),
  selectReviewCommentById: db.prepare(`
    SELECT id, assignment_id AS assignmentId, target_type AS targetType, target_id AS targetId,
      severity, comment, status, created_by AS createdBy, created_at AS createdAt,
      updated_at AS updatedAt, resolution_notes AS resolutionNotes
    FROM review_comments
    WHERE id = ?
  `),
  selectReviewCommentsByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, target_type AS targetType, target_id AS targetId,
      severity, comment, status, created_by AS createdBy, created_at AS createdAt,
      updated_at AS updatedAt, resolution_notes AS resolutionNotes
    FROM review_comments
    WHERE assignment_id = ?
    ORDER BY updated_at DESC
  `),
  insertTestPlan: db.prepare(`
    INSERT INTO test_plans (id, assignment_id, phase, plan_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  selectTestPlansByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, phase, plan_json AS planJson, status,
      created_at AS createdAt, updated_at AS updatedAt
    FROM test_plans
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  insertImplementationEvidence: db.prepare(`
    INSERT INTO implementation_evidence (
      id, assignment_id, run_id, phase, changed_files_json, commands_json, tests_json,
      summary, status, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectImplementationEvidenceByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, run_id AS runId, phase,
      changed_files_json AS changedFilesJson, commands_json AS commandsJson,
      tests_json AS testsJson, summary, status, created_by AS createdBy,
      created_at AS createdAt, updated_at AS updatedAt
    FROM implementation_evidence
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  selectImplementationEvidenceById: db.prepare(`
    SELECT id, assignment_id AS assignmentId, run_id AS runId, phase,
      changed_files_json AS changedFilesJson, commands_json AS commandsJson,
      tests_json AS testsJson, summary, status, created_by AS createdBy,
      created_at AS createdAt, updated_at AS updatedAt
    FROM implementation_evidence
    WHERE id = ?
  `),
  insertPrReadinessReport: db.prepare(`
    INSERT INTO pr_readiness_reports (id, assignment_id, title, report_json, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  selectPrReportsByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, title, report_json AS reportJson, status, created_at AS createdAt
    FROM pr_readiness_reports
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  insertIntakeAsset: db.prepare(`
    INSERT INTO intake_assets (
      id, assignment_id, original_name, stored_name, stored_path, mime_type, file_type, bytes,
      source_kind, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectIntakeAssetsByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, original_name AS originalName,
      stored_name AS storedName, stored_path AS storedPath, mime_type AS mimeType,
      file_type AS fileType, bytes, source_kind AS sourceKind, status, created_at AS createdAt
    FROM intake_assets
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  selectIntakeAssetById: db.prepare(`
    SELECT id, assignment_id AS assignmentId, original_name AS originalName,
      stored_name AS storedName, stored_path AS storedPath, mime_type AS mimeType,
      file_type AS fileType, bytes, source_kind AS sourceKind, status, created_at AS createdAt
    FROM intake_assets
    WHERE id = ?
  `),
  insertAgentFoundryRun: db.prepare(`
    INSERT INTO agent_foundry_runs (
      id, run_id, assignment_id, phase, domain_id, domain_label, input_sources_json,
      output_json, status, provider, model, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
	  selectAgentFoundryRunsByAssignment: db.prepare(`
	    SELECT id, run_id AS runId, assignment_id AS assignmentId, phase, domain_id AS domainId,
	      domain_label AS domainLabel, input_sources_json AS inputSourcesJson, output_json AS outputJson,
	      status, provider, model, created_at AS createdAt
	    FROM agent_foundry_runs
	    WHERE assignment_id = ?
	    ORDER BY created_at DESC
	  `),
	  upsertAgentWorkerRun: db.prepare(`
	    INSERT INTO agent_worker_runs (
	      id, assignment_id, run_id, worker_role, worker_role_label, execution_agent, mode,
	      sandbox_mode, status, sequence_index, launch_mode, bundle_dir, handoff_file,
	      prompt_file, script_file, response_file, log_file, status_file, manual_command,
	      output_json, questions_json, created_at, updated_at, completed_at
	    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	    ON CONFLICT(id) DO UPDATE SET
	      status = excluded.status,
	      mode = excluded.mode,
	      sandbox_mode = excluded.sandbox_mode,
	      launch_mode = excluded.launch_mode,
	      bundle_dir = excluded.bundle_dir,
	      handoff_file = excluded.handoff_file,
	      prompt_file = excluded.prompt_file,
	      script_file = excluded.script_file,
	      response_file = excluded.response_file,
	      log_file = excluded.log_file,
	      status_file = excluded.status_file,
	      manual_command = excluded.manual_command,
	      output_json = excluded.output_json,
	      questions_json = excluded.questions_json,
	      updated_at = excluded.updated_at,
	      completed_at = COALESCE(excluded.completed_at, agent_worker_runs.completed_at)
	  `),
		  updateAgentWorkerOutput: db.prepare(`
		    UPDATE agent_worker_runs
		    SET status = ?, output_json = ?, questions_json = ?, updated_at = ?, completed_at = ?
		    WHERE id = ?
		  `),
	  selectAgentWorkerRunsByAssignment: db.prepare(`
	    SELECT id, assignment_id AS assignmentId, run_id AS runId, worker_role AS workerRole,
	      worker_role_label AS workerRoleLabel, execution_agent AS executionAgent, mode,
	      sandbox_mode AS sandboxMode, status, sequence_index AS sequenceIndex,
	      launch_mode AS launchMode, bundle_dir AS bundleDir, handoff_file AS handoffFile,
	      prompt_file AS promptFile, script_file AS scriptFile, response_file AS responseFile,
	      log_file AS logFile, status_file AS statusFile, manual_command AS manualCommand,
	      output_json AS outputJson, questions_json AS questionsJson, created_at AS createdAt,
	      updated_at AS updatedAt, completed_at AS completedAt
	    FROM agent_worker_runs
	    WHERE assignment_id = ?
	    ORDER BY created_at DESC
	  `),
		  selectAgentWorkerRunById: db.prepare(`
		    SELECT id, assignment_id AS assignmentId, run_id AS runId, worker_role AS workerRole,
		      worker_role_label AS workerRoleLabel, execution_agent AS executionAgent, mode,
	      sandbox_mode AS sandboxMode, status, sequence_index AS sequenceIndex,
	      launch_mode AS launchMode, bundle_dir AS bundleDir, handoff_file AS handoffFile,
	      prompt_file AS promptFile, script_file AS scriptFile, response_file AS responseFile,
	      log_file AS logFile, status_file AS statusFile, manual_command AS manualCommand,
	      output_json AS outputJson, questions_json AS questionsJson, created_at AS createdAt,
	      updated_at AS updatedAt, completed_at AS completedAt
		    FROM agent_worker_runs
		    WHERE id = ?
		  `),
		  insertAgentRelayItem: db.prepare(`
		    INSERT OR IGNORE INTO agent_relay_items (
		      id, assignment_id, source_worker_run_id, source_worker_role, source_worker_role_label,
		      target_worker_role, target_lane, item_type, status, severity, title, message,
		      context_json, decision_json, unique_key, created_by, created_at, updated_at, resolved_at
		    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		  `),
		  selectAgentRelayItemsByAssignment: db.prepare(`
		    SELECT id, assignment_id AS assignmentId, source_worker_run_id AS sourceWorkerRunId,
		      source_worker_role AS sourceWorkerRole, source_worker_role_label AS sourceWorkerRoleLabel,
		      target_worker_role AS targetWorkerRole, target_lane AS targetLane, item_type AS itemType,
		      status, severity, title, message, context_json AS contextJson, decision_json AS decisionJson,
		      unique_key AS uniqueKey, created_by AS createdBy, created_at AS createdAt,
		      updated_at AS updatedAt, resolved_at AS resolvedAt
		    FROM agent_relay_items
		    WHERE assignment_id = ?
		    ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'assigned' THEN 1 WHEN 'answered' THEN 2 WHEN 'resolved' THEN 3 ELSE 4 END,
		      updated_at DESC
		  `),
		  selectAgentRelayItemById: db.prepare(`
		    SELECT id, assignment_id AS assignmentId, source_worker_run_id AS sourceWorkerRunId,
		      source_worker_role AS sourceWorkerRole, source_worker_role_label AS sourceWorkerRoleLabel,
		      target_worker_role AS targetWorkerRole, target_lane AS targetLane, item_type AS itemType,
		      status, severity, title, message, context_json AS contextJson, decision_json AS decisionJson,
		      unique_key AS uniqueKey, created_by AS createdBy, created_at AS createdAt,
		      updated_at AS updatedAt, resolved_at AS resolvedAt
		    FROM agent_relay_items
		    WHERE id = ?
		  `),
		  updateAgentRelayItem: db.prepare(`
		    UPDATE agent_relay_items
		    SET target_worker_role = ?, target_lane = ?, status = ?, severity = ?, decision_json = ?,
		      updated_at = ?, resolved_at = ?
		    WHERE id = ?
		  `)
		};

seedDefaults();

function seedDefaults() {
  const now = new Date().toISOString();
  [
    ['guide-chat-v1', 'ODT Guide Chat', 'chat', 'v1', 'Answer with ODT workflow context, next action, and safety guidance.'],
    ['plan-generation-v1', 'Plan Generation', 'recommend', 'v1', 'Convert user work into a review-first implementation plan.'],
    ['json-extraction-v1', 'Structured Extraction', 'extract-json', 'v1', 'Extract task metadata, risks, dependencies, and acceptance criteria.']
  ].forEach(([id, name, requestType, version, template]) => {
    statements.insertPromptTemplate.run(id, name, requestType, version, template, 1, now, now);
  });

  if (!statements.selectAssignments.all().length) {
    statements.insertAssignment.run(
      'assignment-local-mvp',
      'Local Workbench MVP',
      'Build the governed ODT Workbench control plane with backend-owned AI, usage logging, OpenAPI, and human approval gates.',
      'Vijay',
      'needs review',
      'high',
      appRoot,
      now,
      now
    );
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendFile(response, asset) {
  const bytes = readFileSync(asset.storedPath);
  response.writeHead(200, {
    'Content-Type': asset.mimeType || 'application/octet-stream',
    'Content-Length': bytes.length,
    'Content-Disposition': `inline; filename="${sanitizeFileName(asset.originalName)}"`,
    'Access-Control-Allow-Origin': '*'
  });
  response.end(bytes);
}

function selectLocalRepoFolder() {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'darwin') {
      const error = new Error('Native folder picker is currently supported on macOS local desktop only. Paste the repository path instead.');
      error.code = 'UNSUPPORTED_PLATFORM';
      reject(error);
      return;
    }

    execFile(
      '/usr/bin/osascript',
      ['-e', 'POSIX path of (choose folder with prompt "Select the repository or project folder for ODT Workbench read-only analysis")'],
      { timeout: 120000 },
      (error, stdout, stderr) => {
        if (error) {
          const message = String(stderr || error.message || '');
          const cancelled = message.includes('User canceled');
          const next = new Error(cancelled ? 'Folder selection was cancelled.' : 'Unable to open the local folder picker. Paste the repository path instead.');
          next.code = cancelled ? 'CANCELLED' : error.code;
          reject(next);
          return;
        }

        const selectedPath = String(stdout || '').trim();
        resolve(selectedPath.length > 1 ? selectedPath.replace(/\/$/, '') : selectedPath);
      }
    );
  });
}

function readBody(request, maxBytes = 2_000_000) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error('Request body too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    request.on('error', reject);
  });
}

async function getOdtJson(path) {
  try {
    const response = await fetch(`${odtApiBase}${path}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function buildSnapshot() {
  const [odtHealth, odtAgent, odtReview, odtClarifications] = await Promise.all([
    getOdtJson('/health'),
    getOdtJson('/odt/agent/status'),
    getOdtJson('/odt/review-packet'),
    getOdtJson('/odt/clarifications')
  ]);
  const usage = statements.selectAiUsage.all();
  const runs = listRuns();
  const assignments = statements.selectAssignments.all().map((assignment) => ({
    ...assignment,
    workflowState: deriveWorkflowState(collectEvidence(assignment.id))
  }));
  return {
    generatedAt: new Date().toISOString(),
    environment: aiConfig.environment,
    user: process.env.USER || 'local-user',
    backend: {
      online: true,
      apiBase: `http://127.0.0.1:${port}`,
      dbPath
    },
    odtContext: {
      online: Boolean(odtHealth),
      apiBase: odtApiBase,
      agentStatus: odtAgent?.status || 'idle',
      changedFiles: odtReview?.summary?.changedFiles || 0,
      openQuestions: odtClarifications?.summary?.open || 0,
      highQuestions: odtClarifications?.summary?.unresolvedHigh || 0
    },
    ai: safeAiConfig(),
    intake: {
      uploadPolicy,
      workspaceDir,
      storageNote: 'Uploaded context is copied into the ODT workbench workspace. Target repositories stay read-only until write approval.'
    },
    connectors: listConnectors(),
    assignments,
    runs,
    usageSummary: summarizeUsage(usage)
  };
}

function safeAiConfig() {
  return {
    provider: aiConfig.provider,
    executionAgent: getStoredSetting('executionAgent', 'codex'),
    environment: aiConfig.environment,
    region: aiConfig.region || 'not configured',
    genAiEndpointConfigured: aiConfig.genAiEndpointConfigured,
    compartmentConfigured: aiConfig.compartmentConfigured,
    chatModelConfigured: aiConfig.chatModelConfigured,
    embedModelConfigured: aiConfig.embedModelConfigured,
    authMode: aiConfig.authMode,
    configProfileConfigured: aiConfig.configProfileConfigured,
    agentEndpointConfigured: aiConfig.agentEndpointConfigured,
    ragEnabled: aiConfig.ragEnabled,
    ragMode: aiConfig.ragMode,
    vectorStore: aiConfig.vectorStore,
    limits
  };
}

function listConnectors() {
  return [connectorConfig.jira, connectorConfig.knowledge, connectorConfig.git].map((connector) => ({
    id: connector.id,
    label: connector.label,
    enabled: connectorConfig.mcpEnabled && connector.enabled,
    readOnly: connector.readOnly,
    serverConfigured: Boolean(connector.serverName),
    requireWriteApproval: connector.requireWriteApproval,
    destructiveBlocked: connector.destructiveBlocked
  }));
}

function summarizeUsage(events) {
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((event) => String(event.createdAt).startsWith(today));
  const totalTokens = todayEvents.reduce((sum, event) => sum + Number(event.totalTokens || 0), 0);
  const errors = todayEvents.filter((event) => event.status !== 'ok').length;
  const avgLatency = todayEvents.length
    ? Math.round(todayEvents.reduce((sum, event) => sum + Number(event.latencyMs || 0), 0) / todayEvents.length)
    : 0;
  return {
    requestsToday: todayEvents.length,
    totalTokensToday: totalTokens,
    errorsToday: errors,
    avgLatencyMs: avgLatency
  };
}

function listRuns() {
  const events = statements.selectRunEvents.all();
  const grouped = new Map();
  events.forEach((event) => {
    if (!grouped.has(event.runId)) {
      grouped.set(event.runId, {
        id: event.runId,
        assignmentId: event.assignmentId,
        status: 'running',
        requestType: 'workflow',
        provider: aiConfig.provider,
        startedAt: event.createdAt,
        updatedAt: event.createdAt,
        eventCount: 0,
        hasError: false,
        hasDone: false,
        hasRunning: false
      });
    }
    const run = grouped.get(event.runId);
    run.eventCount += 1;
    run.startedAt = event.createdAt < run.startedAt ? event.createdAt : run.startedAt;
    run.updatedAt = event.createdAt > run.updatedAt ? event.createdAt : run.updatedAt;
    if (event.status === 'error') run.hasError = true;
    if (event.status === 'running') run.hasRunning = true;
    if (
      event.status === 'ok'
      || event.eventType === 'usage_logged'
      || event.eventType.endsWith('_completed')
      || event.eventType.endsWith('_prepared')
      || event.eventType.endsWith('_recorded')
    ) run.hasDone = true;
    try {
      const detail = JSON.parse(event.detail || '{}');
      run.requestType = detail.requestType || run.requestType;
      run.provider = detail.provider || run.provider;
      run.model = detail.model || run.model;
      run.latencyMs = detail.latencyMs ?? run.latencyMs;
    } catch {
      // Details are best-effort JSON; keep run summary stable if parsing fails.
    }
  });
  return Array.from(grouped.values()).map((run) => ({
    ...run,
    status: run.hasError ? 'failed' : run.hasDone ? 'done' : run.hasRunning ? 'running' : 'unknown',
    hasError: undefined,
    hasDone: undefined,
    hasRunning: undefined
  })).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 50);
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function estimateTokens(value) {
  return Math.max(1, Math.ceil(String(value || '').length / 4));
}

function extractInput(body) {
  if (typeof body.input === 'string') return body.input;
  if (typeof body.message === 'string') return body.message;
  if (typeof body.text === 'string') return body.text;
  if (typeof body.prompt === 'string') return body.prompt;
  if (Array.isArray(body.messages) && body.messages.length) {
    const last = body.messages[body.messages.length - 1];
    return typeof last === 'string' ? last : String(last.content || '');
  }
  return JSON.stringify(body || {});
}

function assertInputLimit(input) {
  if (String(input || '').length > limits.maxInputChars) {
    throw new Error(`Input exceeds maxInputChars limit of ${limits.maxInputChars}`);
  }
}

function createRunEvent(runId, eventType, status, detail, assignmentId = null) {
  statements.insertRunEvent.run(
    createId('event'),
    runId,
    assignmentId,
    eventType,
    status,
    JSON.stringify(detail || {}),
    new Date().toISOString()
  );
}

function createAgentEvent(assignmentId, agentId, eventType, status, detail) {
  statements.insertAgentEvent.run(
    createId('agentevent'),
    assignmentId,
    agentId,
    eventType,
    status,
    JSON.stringify(detail || {}),
    new Date().toISOString()
  );
}

function getAssignment(assignmentId = 'assignment-local-mvp') {
  return statements.selectAssignmentById.get(assignmentId) || null;
}

function basenameFromPath(value = '') {
  return String(value || '')
    .replace(/\/+$/, '')
    .split('/')
    .filter(Boolean)
    .pop() || '';
}

function shellQuote(value = '') {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function escapeAppleScriptString(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function isGitRepo(repoPath = '') {
  return Boolean(repoPath && existsSync(join(repoPath, '.git')));
}

function uniqueTruthy(values = []) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

function codexCandidatePaths() {
  const pathCandidates = String(process.env.PATH || '')
    .split(':')
    .map((entry) => entry ? join(entry, 'codex') : '')
    .filter(Boolean);
  return uniqueTruthy([
    process.env.ODT_CODEX_BIN,
    '/Applications/Codex.app/Contents/Resources/codex',
    ...pathCandidates,
    join(process.env.HOME || '', '.nvm/versions/node/v24.15.0/bin/codex'),
    join(process.env.HOME || '', '.nvm/versions/node/v16.13.1/bin/codex'),
    '/opt/homebrew/bin/codex',
    '/usr/local/bin/codex'
  ]);
}

function checkCodexCandidate(candidatePath) {
  const exists = Boolean(candidatePath && existsSync(candidatePath));
  if (!exists) {
    return {
      path: candidatePath,
      exists,
      status: 'missing',
      version: '',
      detail: 'Executable not found.'
    };
  }
  const result = spawnSync(candidatePath, ['--version'], {
    encoding: 'utf8',
    timeout: 10000,
    env: process.env
  });
  const stdout = String(result.stdout || '').trim();
  const stderr = String(result.stderr || '').trim();
  const detail = stderr || result.error?.message || stdout || '';
  return {
    path: candidatePath,
    exists,
    status: result.status === 0 && stdout ? 'healthy' : 'unhealthy',
    version: stdout,
    exitCode: result.status,
    detail: detail.slice(0, 500)
  };
}

function getCodexExecutionHealth() {
  const candidates = codexCandidatePaths().map(checkCodexCandidate);
  const healthy = candidates.find((candidate) => candidate.status === 'healthy');
  return {
    agent: 'codex',
    status: healthy ? 'healthy' : 'unhealthy',
    executable: healthy?.path || '',
    version: healthy?.version || '',
    checkedAt: new Date().toISOString(),
    candidates,
    message: healthy
      ? `Codex CLI is available: ${healthy.version}`
      : 'No healthy Codex CLI was found. Configure ODT_CODEX_BIN or repair the local Codex install before launching workers.'
  };
}

function getExecutionAdapterHealth(assignmentId = 'assignment-local-mvp') {
  const checkedAt = new Date().toISOString();
  const codex = getCodexExecutionHealth();
  const hasOciConfig = Boolean(process.env.ODT_OCI_GENAI_ENDPOINT || process.env.OCI_GENAI_ENDPOINT || process.env.OCI_CONFIG_FILE);
  const hasOpenAiConfig = Boolean(process.env.OPENAI_API_KEY);
  return {
    assignmentId,
    checkedAt,
    adapters: {
      codex: {
        ...codex,
        label: 'Codex CLI',
        capability: 'Governed terminal worker launch',
        launchSupported: true,
        handoffSupported: true,
        authModel: 'Uses the local Codex app or CLI login, including enterprise SSO when configured. ODT stores no Codex token.'
      },
      cline: {
        agent: 'cline',
        label: 'Cline',
        status: 'handoff_ready',
        checkedAt,
        capability: 'Governed handoff package',
        launchSupported: false,
        handoffSupported: true,
        authModel: 'Cline or the IDE extension owns authentication. ODT prepares the governed prompt and evidence contract.',
        message: 'Cline is available as a handoff target. Direct launch adapter is planned.'
      },
      'oci-genai': {
        agent: 'oci-genai',
        label: 'OCI GenAI / OCA',
        status: hasOciConfig ? 'configured' : 'not_configured',
        checkedAt,
        capability: 'Provider-backed planning and specialist agents',
        launchSupported: false,
        handoffSupported: hasOciConfig,
        authModel: 'Uses OCI/OCA configuration outside ODT. ODT should store provider health and usage evidence, not secrets.',
        message: hasOciConfig
          ? 'OCI/OCA configuration signal is present. Full provider adapter wiring is still future work.'
          : 'OCI/OCA adapter is on the roadmap. Configure provider settings when this adapter is enabled.'
      },
      ollama: {
        agent: 'ollama',
        label: 'Ollama',
        status: 'planned',
        checkedAt,
        capability: 'Local model fallback',
        launchSupported: false,
        handoffSupported: false,
        authModel: 'Local runtime; no cloud token expected.',
        message: 'Ollama is planned as a local-model adapter for future offline/fallback workflows.'
      },
      openai: {
        agent: 'openai',
        label: 'OpenAI API',
        status: hasOpenAiConfig ? 'configured' : 'not_configured',
        checkedAt,
        capability: 'Direct API provider for planning and review',
        launchSupported: false,
        handoffSupported: hasOpenAiConfig,
        authModel: 'Uses environment or approved secret manager configuration. ODT must not expose API keys.',
        message: hasOpenAiConfig
          ? 'OpenAI API configuration signal is present. Direct provider adapter can use existing governance.'
          : 'OpenAI API adapter is not configured. Use Codex CLI or local/mock provider for now.'
      }
    },
    issues: listExecutionIssues(assignmentId)
  };
}

function listExecutionIssues(assignmentId = 'assignment-local-mvp') {
  const issueStatuses = new Set(['error', 'warning', 'blocked', 'failed', 'manual_fallback', 'codex_missing', 'failed_to_open', 'unhealthy']);
  const agentIssues = statements.selectAgentEventsByAssignment.all(assignmentId)
    .map((event) => ({ ...event, detailJson: parseJsonValue(event.detail, {}) }))
    .filter((event) => (
      issueStatuses.has(String(event.status || '').toLowerCase())
      || /failed|error|health|fallback|missing/i.test(event.eventType || '')
    ))
    .slice(0, 8)
    .map((event) => ({
      id: event.id,
      source: 'agent_event',
      eventType: event.eventType,
      status: event.status,
      message: event.detailJson?.message || event.detailJson?.error || event.detailJson?.note || event.detailJson?.summary || event.eventType,
      detail: event.detailJson,
      createdAt: event.createdAt
    }));
  const runIssues = statements.selectRunEvents.all()
    .filter((event) => event.assignmentId === assignmentId)
    .map((event) => ({ ...event, detailJson: parseJsonValue(event.detail, {}) }))
    .filter((event) => (
      issueStatuses.has(String(event.status || '').toLowerCase())
      || /failed|error|health|fallback|missing/i.test(event.eventType || '')
    ))
    .slice(0, 8)
    .map((event) => ({
      id: event.id,
      source: 'run_event',
      eventType: event.eventType,
      status: event.status,
      message: event.detailJson?.message || event.detailJson?.error || event.detailJson?.note || event.detailJson?.summary || event.eventType,
      detail: event.detailJson,
      createdAt: event.createdAt
    }));
  return [...agentIssues, ...runIssues]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 10);
}

function deriveAssignmentTitle(input = '') {
  const text = String(input || '').replace(/\r/g, '');
  const featureMatch = text.match(/Feature\s*\/\s*defect requirement:\s*\n\s*([^\n]+)/i);
  if (featureMatch?.[1]) {
    return featureMatch[1].replace(/\s+for\s+Assessment activity.*$/i, '').trim();
  }

  const heading = text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^#{1,3}\s+\S/.test(line) && !/agent|summary|test plan|assumptions/i.test(line));
  if (heading) return heading.replace(/^#{1,3}\s+/, '').trim();

  const summaryMatch = text.match(/Summary:\s*\n\s*([^\n.]+)/i);
  if (summaryMatch?.[1]) return summaryMatch[1].trim();

  const firstMeaningfulLine = text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 12 && !/target repository|base branch|real sdlc test/i.test(line));
  return firstMeaningfulLine ? firstMeaningfulLine.slice(0, 72).trim() : '';
}

function applyAssignmentContext({ assignmentId = 'assignment-local-mvp', input = '', repoPath = '' } = {}) {
  const assignment = getAssignment(assignmentId);
  if (!assignment) return null;

  const derivedTitle = deriveAssignmentTitle(input) || String(assignment.title || '').split(' - ')[0].trim();
  const repoName = repoPath ? basenameFromPath(repoPath) : '';
  const title = repoName && !derivedTitle.toLowerCase().includes(repoName.toLowerCase())
    ? `${derivedTitle} - ${repoName}`
    : derivedTitle;
  const requirement = input
    ? String(input).replace(/\s+/g, ' ').trim().slice(0, 360)
    : null;

  statements.updateAssignmentContext.run(
    title || null,
    requirement,
    repoPath || null,
    'needs review',
    new Date().toISOString(),
    assignmentId
  );
  return getAssignment(assignmentId);
}

function linesFromText(text = '') {
  return String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractSectionBullets(text = '', startPattern, stopPatterns = []) {
  const lines = linesFromText(text);
  const items = [];
  let collecting = false;
  lines.forEach((line) => {
    if (startPattern.test(line)) {
      collecting = true;
      return;
    }
    if (!collecting) return;
    if (stopPatterns.some((pattern) => pattern.test(line))) {
      collecting = false;
      return;
    }
    const bullet = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    if (bullet && bullet.length > 2) items.push(bullet);
  });
  return items;
}

function extractMatches(text = '', pattern) {
  return Array.from(String(text || '').matchAll(pattern))
    .map((match) => match[0].replace(/[),.;]+$/, ''))
    .filter(Boolean);
}

function uniqueItems(items = []) {
  return Array.from(new Set(items.filter(Boolean)));
}

function requirementText(requirement = {}) {
  return requirement.rawText || requirement.raw_text || requirement.input || requirement.summary || '';
}

function parseRequirementSignals(input = '') {
  const text = String(input || '');
  const lower = text.toLowerCase();
  const title = deriveAssignmentTitle(text) || 'Requirement-driven implementation';
  const targetRepo = (text.match(/\/Users\/[^\s]+/) || [])[0] || '';
  const endpointMatch = text.match(/(?:POST|PUT|PATCH):?\s*(https?:\/\/[^\s]+)/i)
    || text.match(/Method:\s*(?:post|put|patch)[\s\S]*?(https?:\/\/[^\s]+)/i);
  const endpoint = endpointMatch?.[1] || '';
  const keyBehaviors = extractSectionBullets(text, /^(Key behavior|Key Changes|Summary)\s*:?\s*$/i, [/^(Test Plan|Assumptions|Update API|SCENARIOS|the payload is)\b/i]);
  const testPlan = uniqueItems([
    ...extractSectionBullets(text, /^Test Plan\s*:?\s*$/i, [/^(Assumptions|Update API|SCENARIOS|the payload is)\b/i]),
    ...extractMatches(text, /tests\/[^\s`]+\.js/g)
  ]);
  const assumptions = extractSectionBullets(text, /^Assumptions\s*:?\s*$/i, [/^(Update API|SCENARIOS|the payload is)\b/i]);
  const updateApiScenarios = linesFromText(text)
    .filter((line) => /^(Deleting|Removing|Adding|Add\/update|Method:|https?:\/\/|While editing)/i.test(line))
    .map((line) => line.replace(/^[-*]\s*/, '').trim());
  const mentionedFiles = uniqueItems([
    ...extractMatches(text, /[\w./-]*activity_util\.jsx/g),
    ...extractMatches(text, /tests\/[^\s`]+\.js/g)
  ]);
  const clarifyingQuestions = [
    {
      severity: 'NEEDS_REVIEW',
      question: 'Should mobile Assessment edit/create preview behavior follow the same persisted-data rule as desktop?',
      defaultAssumption: 'Apply the same rule if mobile shares the Assessment edit path; otherwise record mobile as a follow-up.',
      decisionOwner: 'Product / Engineering'
    },
    {
      severity: lower.includes('save draft may still be allowed') ? 'INFO' : 'NEEDS_REVIEW',
      question: 'Can Save Draft continue to allow incomplete Assessment questions while Preview remains stricter?',
      defaultAssumption: 'Yes. Save Draft may remain permissive, but Preview is disabled until all persisted questions are previewable.',
      decisionOwner: 'Product'
    },
    {
      severity: updateApiScenarios.length ? 'NEEDS_REVIEW' : 'INFO',
      question: 'Are the update API payload id/removal rules in scope for the same PR as Preview gating?',
      defaultAssumption: updateApiScenarios.length ? 'Yes. Treat update API payload serialization as in scope.' : 'No API payload change is assumed unless scenarios are supplied.',
      decisionOwner: 'Engineering'
    },
    {
      severity: targetRepo ? 'INFO' : 'BLOCKER',
      question: 'Which repository and branch should receive the implementation?',
      defaultAssumption: targetRepo ? `Use ${targetRepo} and the current working branch unless the user specifies otherwise.` : 'Ask for the target repo path before write delegation.',
      decisionOwner: 'Developer'
    }
  ];

  return {
    title,
    targetRepo,
    endpoint,
    keyBehaviors,
    testPlan,
    assumptions,
    clarifyingQuestions,
    updateApiScenarios,
    mentionedFiles,
    scopeSignals: {
      frontend: lower.includes('preview') || lower.includes('field') || lower.includes('checkbox') || lower.includes('react'),
      backend: lower.includes('api') || lower.includes('post') || lower.includes('payload'),
      data: lower.includes('db') || lower.includes('persisted') || lower.includes('saved'),
      tests: lower.includes('jest') || lower.includes('test plan') || lower.includes('tests/')
    },
    domainSignals: {
      assessment: lower.includes('assessment'),
      preview: lower.includes('preview'),
      createFlow: lower.includes('create flow'),
      editFlow: lower.includes('edit flow'),
      privileges: lower.includes('view_for_support_admin') || lower.includes('update_activity'),
      updatePayload: lower.includes('activity_question_details_attributes') || lower.includes('activity_answer_details_attributes')
    }
  };
}

function parseJsonValue(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readPackageJson(repoPath) {
  const packagePath = join(repoPath, 'package.json');
  if (!existsSync(packagePath)) return null;
  try {
    return JSON.parse(readFileSync(packagePath, 'utf8'));
  } catch {
    return null;
  }
}

function detectRepoSignals(repoPath) {
  const packageJson = readPackageJson(repoPath);
  const files = existsSync(repoPath)
    ? readdirSync(repoPath, { withFileTypes: true }).slice(0, 120).map((entry) => entry.name)
    : [];
  const dependencyNames = packageJson
    ? Object.keys({ ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) })
    : [];
  const scripts = packageJson?.scripts || {};
  const has = (name) => dependencyNames.includes(name);
  const includesFile = (name) => files.includes(name);
  const frameworks = [
    has('react') ? 'React' : null,
    has('vite') || has('@vitejs/plugin-react') ? 'Vite' : null,
    has('express') ? 'Express' : null,
    has('sqlite3') || has('better-sqlite3') ? 'SQLite package' : null,
    includesFile('server') ? 'Node backend folder' : null
  ].filter(Boolean);
  const testFrameworks = [
    has('vitest') ? 'Vitest' : null,
    has('jest') ? 'Jest' : null,
    has('@testing-library/react') ? 'Testing Library' : null,
    has('playwright') ? 'Playwright' : null,
    scripts.test ? `test script: ${scripts.test}` : null
  ].filter(Boolean);
  const likelyFolders = files.filter((name) => ['src', 'server', 'tests', 'test', 'docs', 'config'].includes(name));
  return {
    repoPath,
    exists: existsSync(repoPath),
    packageManager: includesFile('pnpm-lock.yaml') ? 'pnpm' : includesFile('yarn.lock') ? 'yarn' : includesFile('package-lock.json') ? 'npm' : 'unknown',
    frameworks,
    testFrameworks,
    scripts,
    topLevelEntries: files,
    likelyFolders,
    dependencyCount: dependencyNames.length
  };
}

function buildRequirementAnalysis({ assignmentId, input = '', sourceType = 'manual' }) {
  const text = String(input || '').trim();
  const now = new Date().toISOString();
  applyAssignmentContext({ assignmentId, input: text });
  const signals = parseRequirementSignals(text);
  const functionalRequirements = signals.keyBehaviors.length
    ? signals.keyBehaviors
    : [
      'Capture requirement/Jira/repo inputs before planning.',
      'Analyze requirement gaps and ask decision-critical clarification questions.',
      'Draft technical design, implementation plan, test plan, and PR readiness evidence.'
    ];
  const analysis = {
    assignmentId,
    sourceType,
    title: signals.title,
    targetRepo: signals.targetRepo,
    apiEndpoint: signals.endpoint,
    summary: signals.title !== 'Requirement-driven implementation' ? signals.title : text ? text.slice(0, 280) : 'No requirement text provided yet.',
    functionalRequirements,
    nonFunctionalRequirements: [
      'Preview must use persisted DB data and never unsaved local edits.',
      'Existing privilege restrictions must remain intact, including VIEW_FOR_SUPPORT_ADMIN.',
      'Update API payload behavior must preserve existing/new/deleted question and answer semantics.',
      'Testing, accessibility, security, and maintainability gates are required.',
      'Write actions require explicit human approval.'
    ],
    scopeSignals: signals.scopeSignals,
    domainSignals: signals.domainSignals,
    testPlan: signals.testPlan,
    updateApiScenarios: signals.updateApiScenarios,
    clarifyingQuestions: signals.clarifyingQuestions,
    mentionedFiles: signals.mentionedFiles,
    assumptions: signals.assumptions,
    openQuestions: signals.clarifyingQuestions.map((item) => item.question),
    gaps: [
      signals.mentionedFiles.length ? '' : 'Exact component and utility file paths need repo analysis confirmation.',
      signals.testPlan.length ? '' : 'Target Jest files should be identified before implementation.',
      'Acceptance criteria should be mapped to tests before PR readiness.'
    ].filter(Boolean)
  };
  statements.insertRequirement.run(
    createId('req'),
    assignmentId,
    sourceType,
    text || 'No requirement text provided.',
    analysis.summary,
    'REQUIREMENT_ANALYZED',
    now,
    now
  );
  createRunEvent(createId('run'), 'requirement_analyzed', 'ok', { assignmentId, sourceType }, assignmentId);
  return analysis;
}

function buildRepoAnalysis({ assignmentId, repoPath }) {
  const assignment = getAssignment(assignmentId);
  const pathToAnalyze = repoPath || assignment?.repoPath || appRoot;
  applyAssignmentContext({ assignmentId, repoPath: pathToAnalyze });
  const signals = detectRepoSignals(pathToAnalyze);
  const analysis = {
    assignmentId,
    ...signals,
    architecturePattern: signals.frameworks.includes('React') ? 'React feature pages with backend API service boundary' : 'Detected from repository files',
    validationPattern: 'Use existing backend validation and safe frontend form validation before adding dependencies.',
    errorHandlingPattern: 'Prefer user-safe errors, retry/fallback messages, and audit events.',
    namingConvention: 'Follow repository file and component naming before introducing new patterns.',
    likelyImpactedFiles: [
      'server/index.js',
      'server/governance/*',
      'server/standards/odt-standards.json',
      'src/main.jsx',
      'src/styles.css',
      'docs/*'
    ],
    filesToReviewOnly: [
      'package.json',
      'vite.config.js',
      'README.md'
    ],
    status: signals.exists ? 'REPO_ANALYZED' : 'NEEDS_REVIEW'
  };
  const now = new Date().toISOString();
  statements.insertRepoAnalysis.run(
    createId('repo'),
    assignmentId,
    pathToAnalyze,
    JSON.stringify(analysis),
    analysis.status,
    now,
    now
  );
  createRunEvent(createId('run'), 'repo_analyzed', signals.exists ? 'ok' : 'warning', { assignmentId, repoPath: pathToAnalyze }, assignmentId);
  return analysis;
}

function storeBrowserRepoAnalysis({ assignmentId, browserAnalysis }) {
  const now = new Date().toISOString();
  const repoPath = browserAnalysis.repoPath || `browser-selected:${browserAnalysis.folderName || 'folder'}`;
  const analysis = {
    assignmentId,
    repoPath,
    exists: true,
    selectionMode: 'browser-folder-picker',
    ...browserAnalysis,
    status: browserAnalysis.status || 'REPO_ANALYZED'
  };
  statements.insertRepoAnalysis.run(
    createId('repo'),
    assignmentId,
    repoPath,
    JSON.stringify(analysis),
    analysis.status,
    now,
    now
  );
  createRunEvent(createId('run'), 'repo_analyzed_browser_folder', 'ok', {
    assignmentId,
    folderName: analysis.folderName,
    fileCount: analysis.fileCount
  }, assignmentId);
  return analysis;
}

function buildTechnicalDesign({ assignmentId, requirement = {}, repoAnalysis = {}, title = 'Governed Developer Workflow Design' }) {
  const signals = parseRequirementSignals(requirementText(requirement));
  const designTitle = signals.title !== 'Requirement-driven implementation' ? `${signals.title} Technical Design` : title;
  const design = {
    title: designTitle,
    assignmentId,
    requirementSummary: requirement.summary || signals.title || 'Requirement-driven implementation.',
    targetRepo: signals.targetRepo || repoAnalysis.repoPath,
    scope: signals.keyBehaviors.length ? signals.keyBehaviors : [
      'Implement persisted-data preview gating for Assessment activity create/edit workflows.',
      'Align Preview validation with reusable Assessment question validation helpers.',
      'Preserve privilege behavior and update API payload semantics.'
    ],
    outOfScope: [
      'Changing support-admin privilege restrictions',
      'Changing non-Assessment preview behavior unless shared code requires it',
      'Installing new dependencies without explicit approval'
    ],
    existingArchitectureObserved: repoAnalysis.frameworks?.length ? repoAnalysis.frameworks : ['React activity edit/create UI', 'Jest test suite'],
    proposedArchitecture: 'Keep Preview enablement derived from saved/submitted Assessment question data. Mark preview dirty on any Assessment edit, and recompute previewability only after successful Save Draft or Publish.',
    apiChanges: signals.endpoint ? [
      `Validate update payload behavior for ${signals.endpoint}`,
      'Do not send deleted question blocks.',
      'Do not send removed answer blocks.',
      'Do not send ids for newly added questions or newly added answers.'
    ] : signals.updateApiScenarios,
    impactedAreas: [
      'Assessment activity utility validation',
      'Assessment create/edit publish panel Preview state',
      'Question, answer, and correct-answer change handlers',
      'Save Draft and Publish success/failure handling'
    ],
    candidateFiles: uniqueItems([
      ...signals.mentionedFiles,
      'activity_util.jsx',
      'Assessment edit/create publish panel components',
      ...signals.testPlan
    ]),
    accessibility: 'Accessibility review required. UI work should be reviewed against WCAG 2.2, VPAT impact, Section 508 where applicable, keyboard navigation, visible focus, labels, contrast, loading/empty/error states, and Redwood-like clarity.',
    security: 'Do not expose secrets or alter authorization behavior. Preserve VIEW_FOR_SUPPORT_ADMIN restrictions and existing UPDATE_ACTIVITY edit behavior.',
    testing: signals.testPlan.length ? signals.testPlan : ['Add utility tests and edit/publish Preview state tests.'],
    flexibility: 'Draft save rules may remain looser than Preview. Preview remains stricter because it reflects persisted/renderable DB question data.',
    rollback: 'Limit changes to Assessment preview gating and update-payload serialization paths so the patch can be reverted without broad activity workflow impact.'
  };
  const now = new Date().toISOString();
  statements.insertTechnicalDesign.run(
    createId('design'),
    assignmentId,
    designTitle,
    JSON.stringify(design),
    'TECH_DESIGN_DRAFTED',
    now,
    now
  );
  return design;
}

function buildImplementationPlan({ assignmentId, design = {}, title = 'Standards-Governed Implementation Plan' }) {
  const latestRequirement = statements.selectRequirementsByAssignment.all(assignmentId)[0] || {};
  const signals = parseRequirementSignals(requirementText(latestRequirement));
  const planTitle = signals.title !== 'Requirement-driven implementation' ? `${signals.title} Implementation Plan` : title;
  const plan = {
    title: planTitle,
    assignmentId,
    scope: design.scope || signals.keyBehaviors || ['Assessment Preview Enablement'],
    filesToChange: uniqueItems([
      'activity_util.jsx',
      'Assessment edit/create publish panel components',
      ...signals.mentionedFiles
    ]),
    filesToReview: uniqueItems([
      'AssessmentQuestions shared component path',
      'Activity update payload serialization path',
      ...signals.testPlan
    ]),
    backendTasks: signals.updateApiScenarios.length ? signals.updateApiScenarios : [
      'Verify update API payload serialization for existing, deleted, and newly added Assessment questions and answers.'
    ],
    frontendTasks: [
      'Add or reuse isAssessmentPreviewable(questions).',
      'Disable Preview for new Assessment create until a successful Save Draft or Publish redirects to edit.',
      'Initialize edit Preview state from saved GET Assessment questions.',
      'Disable Preview immediately after any Assessment field, question, answer, or correct-answer change.',
      'Re-enable Preview only after successful Save Draft or Publish when submitted/saved questions are previewable.',
      'Keep failed Save Draft or Publish attempts from enabling Preview.'
    ],
    validationTasks: [
      'Require at least one Assessment question for Preview.',
      'Require each previewable question to have question text.',
      'Require at least two answer options with text.',
      'Require at least one selected correct answer per question.',
      'Reuse existing Assessment validation helpers where possible.'
    ],
    accessibilityTasks: [
      'Preserve keyboard access and visible disabled state for Preview.',
      'Do not rely on color only to communicate disabled Preview.',
      'Keep existing Assessment question tooltip behavior through the shared component path.'
    ],
    securityTasks: [
      'Preserve support-admin restrictions.',
      'Do not introduce new secrets or client-side credentials.',
      'Keep dependency installs blocked unless separately approved.'
    ],
    testTasks: signals.testPlan.length ? signals.testPlan : ['Run targeted Jest tests for Assessment utility and publish/edit behavior.'],
    approvalRequired: [
      'Approve with warnings for non-critical standards exceptions.',
      'Approve for write before implementation agent execution.',
      'Approve dependency requests before any install.'
    ],
    flexibility: 'Policy exceptions can be documented through approval events. Hard safety blockers stay blocked.',
    risks: [
      'Preview may accidentally expose unsaved edits if dirty-state handling misses a question/answer change path.',
      'Save Draft may allow incomplete data while Preview must remain stricter.',
      'Update payload serialization can regress existing questions or answers if id omission/removal rules are not tested.'
    ]
  };
  const now = new Date().toISOString();
  statements.insertImplementationPlan.run(
    createId('plan'),
    assignmentId,
    planTitle,
    JSON.stringify(plan),
    'PLAN_REVIEW',
    now,
    now
  );
  statements.insertTestPlan.run(
    createId('testplan'),
    assignmentId,
    'pre-implementation',
    JSON.stringify({
      backend: plan.backendTasks,
      frontend: plan.frontendTasks,
      accessibility: plan.accessibilityTasks,
      coverage: ['utility cases', 'edit flow', 'create flow', 'save success', 'save failure', 'publish success', 'publish failure', 'update payload scenarios'],
      targetedCommands: plan.testTasks
    }),
    'DRAFT',
    now,
    now
  );
  return plan;
}

function persistStandardsReview({ assignmentId, phase, artifact, review }) {
  const now = new Date().toISOString();
  const checkId = createId('stdcheck');
  statements.insertStandardsCheck.run(
    checkId,
    assignmentId,
    phase,
    review.standardsVersion,
    review.status,
    JSON.stringify(review.summary || {}),
    JSON.stringify(artifact || {}),
    now
  );
  review.findings.forEach((finding) => {
    statements.insertStandardsFinding.run(
      createId('finding'),
      checkId,
      assignmentId,
      finding.category,
      finding.status,
      finding.message,
      finding.recommendation,
      now
    );
  });
  createRunEvent(createId('run'), 'standards_check_completed', review.status === 'PASS' ? 'ok' : 'warning', {
    assignmentId,
    phase,
    status: review.status,
    findings: review.findings.length
  }, assignmentId);
  return { ...review, id: checkId, assignmentId, createdAt: now };
}

function collectEvidence(assignmentId = 'assignment-local-mvp') {
  const checks = statements.selectStandardsChecksByAssignment.all(assignmentId).map((check) => ({
    ...check,
    summary: parseJsonValue(check.summary, {}),
    artifact: parseJsonValue(check.artifact, {})
  }));
  const findings = statements.selectStandardsFindingsByAssignment.all(assignmentId);
  const attachJson = (row, key) => ({ ...row, [key]: parseJsonValue(row[key], {}) });
  const parseImplementationEvidence = (row) => ({
    ...row,
    changedFiles: parseJsonValue(row.changedFilesJson, []),
    commands: parseJsonValue(row.commandsJson, []),
    tests: parseJsonValue(row.testsJson, [])
  });
	  const parseAgentFoundryRun = (row) => ({
	    ...row,
	    inputSources: parseJsonValue(row.inputSourcesJson, []),
	    output: parseJsonValue(row.outputJson, {})
	  });
	  const parseWorkerRun = (row) => parseAgentWorkerRun(row);
		  const agentEvents = statements.selectAgentEventsByAssignment.all(assignmentId).map((row) => ({
	    ...row,
	    detailJson: parseJsonValue(row.detail, {})
	  }));
	  ensureRelayItemsForAssignment(assignmentId);
	  const evidence = {
    assignment: getAssignment(assignmentId),
    requirements: statements.selectRequirementsByAssignment.all(assignmentId),
    repoAnalysis: statements.selectRepoAnalysisByAssignment.all(assignmentId).map((row) => attachJson(row, 'analysisJson')),
    technicalDesigns: statements.selectTechnicalDesignsByAssignment.all(assignmentId).map((row) => attachJson(row, 'designJson')),
    implementationPlans: statements.selectImplementationPlansByAssignment.all(assignmentId).map((row) => attachJson(row, 'planJson')),
    standardsChecks: checks.map((check) => ({
      ...check,
      findings: findings.filter((finding) => finding.standardsCheckId === check.id)
    })),
    standardsFindings: findings,
    approvals: statements.selectApprovalsByAssignment.all(assignmentId),
    dependencyRequests: statements.selectDependencyRequestsByAssignment.all(assignmentId),
    reviewComments: statements.selectReviewCommentsByAssignment.all(assignmentId),
    agentEvents,
    testPlans: statements.selectTestPlansByAssignment.all(assignmentId).map((row) => attachJson(row, 'planJson')),
    implementationEvidence: statements.selectImplementationEvidenceByAssignment.all(assignmentId).map(parseImplementationEvidence),
	    prReadinessReports: statements.selectPrReportsByAssignment.all(assignmentId).map((row) => attachJson(row, 'reportJson')),
		    intakeAssets: statements.selectIntakeAssetsByAssignment.all(assignmentId),
		    agentFoundryRuns: statements.selectAgentFoundryRunsByAssignment.all(assignmentId).map(parseAgentFoundryRun),
		    agentWorkerRuns: statements.selectAgentWorkerRunsByAssignment.all(assignmentId).map(parseWorkerRun),
		    agentRelayItems: statements.selectAgentRelayItemsByAssignment.all(assignmentId).map(parseAgentRelayItem)
		  };
  evidence.requirementSignals = parseRequirementSignals(evidence.requirements?.[0]?.rawText || '');
  evidence.workflowState = deriveWorkflowState(evidence);
  return evidence;
}

function getActiveStandardsFindings(evidence) {
  return evidence.standardsChecks?.[0]?.findings || evidence.standardsFindings || [];
}

function hasApprovedEvent(approvals, types, since = '') {
  return approvals.some((approval) => {
    if (approval.status !== 'approved' || !types.includes(approval.approvalType)) return false;
    if (!since) return true;
    return new Date(approval.approvedAt).getTime() >= new Date(since).getTime();
  });
}

function latestDecisionEvent(approvals, types) {
  return approvals
    .filter((approval) => types.includes(approval.approvalType) && ['approved', 'blocked'].includes(approval.status))
    .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime())[0] || null;
}

function hasWriteApproval(evidence) {
  const approvals = evidence.approvals || [];
  const latestCheck = evidence.standardsChecks?.[0];
  const writeApproval = latestDecisionEvent(approvals, ['write_scope', 'approved_to_write', 'APPROVED_TO_WRITE']);
  const blockDecision = latestDecisionEvent(approvals, ['block_implementation']);
  const approvedAfterLatestCheck = latestCheck
    ? new Date(writeApproval?.approvedAt || 0).getTime() >= new Date(latestCheck.createdAt).getTime()
    : false;
  return Boolean(
    writeApproval
    && approvedAfterLatestCheck
    && (!blockDecision || new Date(writeApproval.approvedAt).getTime() > new Date(blockDecision.approvedAt).getTime())
  );
}

function hasLatestBlockerOverride(evidence) {
  const latestCheck = evidence.standardsChecks?.[0];
  return hasApprovedEvent(evidence.approvals || [], ['standards_blocker_override', 'blocker_override'], latestCheck?.createdAt || '');
}

function isHardSafetyBlocker(finding = {}) {
  const category = String(finding.category || '').toLowerCase();
  const message = `${finding.message || ''} ${finding.recommendation || ''}`.toLowerCase();
  return (
    category.includes('frontend-secrets')
    || category.includes('destructive')
    || category === 'dependency'
    || category === 'dependency-license'
    || message.includes('frontend secret')
    || message.includes('destructive')
    || message.includes('package installation requires explicit developer approval')
    || message.includes('dependency request before implementation')
  );
}

function getUnresolvedStandardsBlockers(evidence) {
  const blockers = getActiveStandardsFindings(evidence).filter((finding) => finding.status === 'BLOCKER');
  return hasLatestBlockerOverride(evidence) ? blockers.filter(isHardSafetyBlocker) : blockers;
}

function getOpenReviewBlockers(evidence) {
  return (evidence.reviewComments || []).filter((comment) => comment.status === 'open' && comment.severity === 'blocker');
}

function latestPostImplementationCheck(evidence) {
  return (evidence.standardsChecks || []).find((check) => check.phase === 'post-implementation') || null;
}

function getFailedImplementationTests(evidence) {
  return (evidence.implementationEvidence || [])
    .flatMap((record) => record.tests || [])
    .filter((test) => test.status === 'failed');
}

function hasAcceptedImplementationRisk(evidence) {
  return (evidence.reviewComments || []).some((comment) => (
    comment.status === 'accepted_risk'
    && ['implementation', 'pr'].includes(comment.targetType)
  ));
}

function humanizeLabel(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildWorkflowDecisionTrail(evidence = {}) {
  const trail = [];
  const add = ({ type, label, status, detail, createdAt, page }) => {
    if (!label || !createdAt) return;
    trail.push({
      type,
      label,
      status: status || 'recorded',
      detail: detail || '',
      createdAt,
      page: page || 'overview'
    });
  };

  (evidence.requirements || []).forEach((item) => add({
    type: 'requirement',
    label: 'Requirement analyzed',
    status: item.status,
    detail: item.summary || item.rawText || 'Requirement evidence captured.',
    createdAt: item.updatedAt || item.createdAt,
    page: 'intake'
  }));

  (evidence.repoAnalysis || []).forEach((item) => add({
    type: 'repo',
    label: 'Repository analyzed',
    status: item.status,
    detail: item.repoPath || item.repo_path || item.analysisJson?.repoName || 'Read-only repository analysis captured.',
    createdAt: item.updatedAt || item.createdAt,
    page: 'intake'
  }));

  (evidence.technicalDesigns || []).forEach((item) => add({
    type: 'design',
    label: 'Technical design drafted',
    status: item.status,
    detail: item.title || 'Architecture brief drafted.',
    createdAt: item.updatedAt || item.createdAt,
    page: 'planner'
  }));

  (evidence.implementationPlans || []).forEach((item) => add({
    type: 'plan',
    label: 'Implementation plan drafted',
    status: item.status,
    detail: item.title || 'Implementation blueprint drafted.',
    createdAt: item.updatedAt || item.createdAt,
    page: 'planner'
  }));

  (evidence.standardsChecks || []).forEach((item) => add({
    type: 'standards',
    label: item.phase === 'post-implementation' ? 'Post-implementation standards check' : 'Standards check completed',
    status: item.status,
    detail: item.summary?.message || item.summary?.overall || `${item.phase} review against ${item.standardsVersion}.`,
    createdAt: item.createdAt,
    page: 'standards'
  }));

  (evidence.approvals || []).forEach((item) => add({
    type: 'approval',
    label: humanizeLabel(item.approvalType || 'approval'),
    status: item.status,
    detail: item.notes || `Decision by ${item.approvedBy || 'local-user'}.`,
    createdAt: item.approvedAt,
    page: 'standards'
  }));

  (evidence.dependencyRequests || []).forEach((item) => add({
    type: 'dependency',
    label: `Dependency ${item.packageName}`,
    status: item.status,
    detail: `${item.license || 'UNKNOWN'} - ${item.reason || 'Dependency approval request.'}`,
    createdAt: item.decidedAt || item.requestedAt,
    page: 'standards'
  }));

  (evidence.reviewComments || []).forEach((item) => add({
    type: 'review',
    label: `${humanizeLabel(item.severity)} review comment`,
    status: item.status,
    detail: item.resolutionNotes || item.comment,
    createdAt: item.updatedAt || item.createdAt,
    page: 'review'
  }));

  (evidence.agentEvents || []).forEach((item) => add({
    type: 'agent',
    label: humanizeLabel(item.eventType || 'agent event'),
    status: item.status,
    detail: item.detailJson?.message || item.detailJson?.mode || `${item.agentId || 'agent'} event recorded.`,
    createdAt: item.createdAt,
    page: 'team'
  }));

  (evidence.agentFoundryRuns || []).forEach((item) => add({
    type: 'agent-foundry',
    label: `${item.output?.specialistName || item.domainLabel || 'Agent Foundry'} review`,
    status: item.status,
    detail: item.output?.summary || `${item.domainLabel || item.domainId} specialist evidence recorded.`,
    createdAt: item.createdAt,
    page: 'team'
  }));

  (evidence.implementationEvidence || []).forEach((item) => add({
    type: 'implementation',
    label: 'Implementation evidence recorded',
    status: item.status,
    detail: item.summary || `${item.changedFiles?.length || 0} changed file(s), ${item.tests?.length || 0} test result(s).`,
    createdAt: item.createdAt,
    page: 'review'
  }));

  (evidence.prReadinessReports || []).forEach((item) => add({
    type: 'pr',
    label: 'PR readiness pack generated',
    status: item.reportJson?.status || item.status,
    detail: item.reportJson?.summary || 'PR-ready evidence package generated.',
    createdAt: item.createdAt,
    page: 'pr'
  }));

  return trail
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 18);
}

function deriveWorkflowState(evidence = {}) {
  const hasRequirement = Boolean(evidence.requirements?.length || evidence.assignment?.requirement);
  const hasRepo = Boolean(evidence.repoAnalysis?.length);
  const hasDesign = Boolean(evidence.technicalDesigns?.length);
  const hasPlan = Boolean(evidence.implementationPlans?.length);
  const latestCheck = evidence.standardsChecks?.[0] || null;
  const postImplementationCheck = latestPostImplementationCheck(evidence);
  const writeApproved = hasWriteApproval(evidence);
  const unresolvedStandardsBlockers = getUnresolvedStandardsBlockers(evidence);
  const openReviewBlockers = getOpenReviewBlockers(evidence);
  const pendingDependencies = (evidence.dependencyRequests || []).filter((request) => request.status === 'pending');
  const latestHandoff = (evidence.agentEvents || []).find((event) => event.eventType === 'handoff_prepared');
  const latestImplementationEvidence = evidence.implementationEvidence?.[0] || null;
  const latestPrReport = evidence.prReadinessReports?.[0]?.reportJson || null;
  const failedTests = getFailedImplementationTests(evidence);
  const acceptedImplementationRisk = hasAcceptedImplementationRisk(evidence);
  const activeBlockDecision = latestDecisionEvent(evidence.approvals || [], ['block_implementation']);
  const blockedByDecision = Boolean(activeBlockDecision && !writeApproved);

  const blockedReasons = [
    ...unresolvedStandardsBlockers.map((finding) => ({
      category: 'standards',
      message: finding.message,
      action: finding.recommendation,
      page: 'standards'
    })),
    ...openReviewBlockers.map((comment) => ({
      category: 'review',
      message: comment.comment,
      action: 'Resolve, accept risk, or request rework.',
      page: 'review'
    })),
    ...(blockedByDecision ? [{
      category: 'approval',
      message: activeBlockDecision.notes || 'Implementation is blocked by human decision.',
      action: 'Review Standards or approve a newer write decision.',
      page: 'standards'
    }] : []),
    ...(latestPrReport?.status === 'BLOCKED' ? (latestPrReport.blockingItems || []).map((item) => ({
      category: item.category || 'pr-readiness',
      message: item.message,
      action: item.requiredAction,
      page: item.category === 'dependency' ? 'standards' : item.category === 'implementation-evidence' || item.category === 'testing' ? 'review' : 'pr'
    })) : []),
    ...(failedTests.length && !acceptedImplementationRisk ? [{
      category: 'testing',
      message: `${failedTests.length} failed test result(s) need action.`,
      action: 'Fix failed tests or accept implementation risk with review notes.',
      page: 'review'
    }] : [])
  ];

  let state = 'INTAKE_STARTED';
  let stage = 'intake';
  let label = 'Intake Started';
  let nextAction = { label: 'Start Intake', detail: 'Capture requirement, Jira, repo, and scope.', page: 'intake' };

  if (hasRequirement) {
    state = 'REQUIREMENT_ANALYZED';
    stage = 'intake';
    label = 'Requirement Analyzed';
    nextAction = { label: 'Analyze Repository', detail: 'Attach repo context before design and planning.', page: 'intake' };
  }
  if (hasRepo) {
    state = 'REPO_ANALYZED';
    stage = 'analyze';
    label = 'Repo Analyzed';
    nextAction = { label: 'Draft Design', detail: 'Create technical design and implementation plan.', page: 'planner' };
  }
  if (hasDesign) {
    state = 'TECH_DESIGN_DRAFTED';
    stage = 'design';
    label = 'Technical Design Drafted';
    nextAction = { label: 'Draft Implementation Plan', detail: 'Complete implementation and test planning.', page: 'planner' };
  }
  if (hasPlan) {
    state = latestCheck ? 'PLAN_REVIEW' : 'STANDARDS_REVIEW_PENDING';
    stage = latestCheck ? 'standards' : 'design';
    label = latestCheck ? 'Plan Review' : 'Standards Review Pending';
    nextAction = latestCheck
      ? { label: 'Review Standards Gate', detail: 'Review findings and approval options.', page: 'standards' }
      : { label: 'Run Standards Check', detail: 'Create pre-write standards evidence.', page: 'standards' };
  }
  if (latestCheck && !blockedReasons.length) {
    state = 'STANDARDS_REVIEW_PASSED';
    stage = 'standards';
    label = 'Standards Reviewed';
    nextAction = { label: 'Approve Write Scope', detail: 'Capture human approval for the latest standards review.', page: 'standards' };
  }
  if (writeApproved && !unresolvedStandardsBlockers.length && !openReviewBlockers.length) {
    state = 'APPROVED_TO_WRITE';
    stage = 'implement';
    label = 'Approved To Write';
    nextAction = { label: 'Delegate To Agent', detail: 'Prepare a governed Codex/Cline handoff.', page: 'team' };
  }
  if (latestHandoff && writeApproved && !unresolvedStandardsBlockers.length && !openReviewBlockers.length) {
    state = 'IMPLEMENTING';
    stage = 'implement';
    label = 'Implementing';
    nextAction = { label: 'Record Implementation Evidence', detail: 'Capture changed files, commands, and test outcomes.', page: 'review' };
  }
  if (latestImplementationEvidence) {
    state = 'IMPLEMENTATION_EVIDENCE_RECORDED';
    stage = 'test';
    label = 'Implementation Evidence Recorded';
    nextAction = postImplementationCheck
      ? { label: 'Prepare PR Pack', detail: 'Generate the PR-ready package from evidence.', page: 'pr' }
      : { label: 'Run Post-Implementation Check', detail: 'Validate the implementation evidence against standards.', page: 'review' };
  }
  if (postImplementationCheck) {
    state = 'POST_IMPLEMENTATION_REVIEW';
    stage = 'test';
    label = 'Post-Implementation Review';
    nextAction = { label: 'Prepare PR Pack', detail: 'Generate the PR-ready package from evidence.', page: 'pr' };
  }
  if (latestPrReport?.status === 'PR_READY_REVIEW' && !blockedReasons.length) {
    state = 'PR_READY';
    stage = 'pr';
    label = 'Ready For PR Review';
    nextAction = { label: 'Copy PR Markdown', detail: 'Review and copy the generated PR package.', page: 'pr' };
  }
  if (blockedReasons.length) {
    state = 'BLOCKED';
    label = 'Blocked';
    stage = latestImplementationEvidence ? 'test' : latestCheck ? 'standards' : stage;
    nextAction = {
      label: 'Review Blocking Items',
      detail: blockedReasons[0]?.action || 'Review blockers before continuing.',
      page: blockedReasons[0]?.page || 'standards'
    };
  }

  const completed = {
    requirement: hasRequirement,
    repo: hasRepo,
    technicalDesign: hasDesign,
    implementationPlan: hasPlan,
    standardsCheck: Boolean(latestCheck),
    writeApproval: writeApproved,
    agentHandoff: Boolean(latestHandoff),
    implementationEvidence: Boolean(latestImplementationEvidence),
    postImplementationCheck: Boolean(postImplementationCheck),
    prPack: Boolean(latestPrReport)
  };

  return {
    assignmentId: evidence.assignment?.id || 'assignment-local-mvp',
    state,
    label,
    stage,
    status: blockedReasons.length ? 'blocked' : state === 'PR_READY' ? 'ready' : 'in_progress',
    nextAction,
    blockedReasons,
    completed,
    decisionTrail: buildWorkflowDecisionTrail(evidence),
    allowedActions: {
      canRunStandardsCheck: hasPlan,
      canApproveWrite: Boolean(latestCheck && !openReviewBlockers.length && !writeApproved),
      canDelegateWrite: Boolean(writeApproved && !blockedByDecision && !unresolvedStandardsBlockers.length && !openReviewBlockers.length),
      canRecordImplementationEvidence: Boolean((writeApproved || latestHandoff) && !blockedByDecision && !unresolvedStandardsBlockers.length && !openReviewBlockers.length),
      canPreparePr: Boolean(latestImplementationEvidence && !blockedByDecision && !pendingDependencies.length && (!failedTests.length || acceptedImplementationRisk)),
      dependencyInstallsRequireSeparateApproval: true
    },
    counts: {
      standardsBlockers: unresolvedStandardsBlockers.length,
      reviewBlockers: openReviewBlockers.length,
      pendingDependencies: pendingDependencies.length,
      failedTests: failedTests.length,
      prBlockingItems: latestPrReport?.blockingItems?.length || 0
    },
    latest: {
      standardsCheckId: latestCheck?.id || '',
      postImplementationCheckId: postImplementationCheck?.id || '',
      implementationEvidenceId: latestImplementationEvidence?.id || '',
      prReportStatus: latestPrReport?.status || ''
    }
  };
}

function dependencyContractRows(evidence, status) {
  return (evidence.dependencyRequests || [])
    .filter((request) => request.status === status)
    .map((request) => ({
      id: request.id,
      packageName: request.packageName,
      version: request.version || '',
      license: request.license || 'UNKNOWN',
      reason: request.reason,
      alternatives: request.alternatives || '',
      approvedBy: request.approvedBy || '',
      decidedAt: request.decidedAt || '',
      notes: request.notes || ''
    }));
}

function createReworkRelayFromReviewComment({ comment, createdBy = process.env.USER || 'local-user' } = {}) {
  if (!comment?.id) {
    const error = new Error('Review comment is required to create a rework relay item.');
    error.statusCode = 400;
    throw error;
  }
  if (comment.status && String(comment.status).toLowerCase() !== 'open') {
    const error = new Error('Only open review comments can be sent to rework relay.');
    error.statusCode = 409;
    throw error;
  }
  const now = new Date().toISOString();
  const targetLane = 'Senior Full Stack Dev Rework';
  const targetWorkerRole = 'fullstack-dev';
  const severity = String(comment.severity || '').toLowerCase() === 'blocker' ? 'blocker' : 'needs_review';
  const uniqueKey = `review:${comment.id}:rework:${stableTextHash(comment.comment || '')}`;
  const existingRelayItem = parseAgentRelayItem(
    statements.selectAgentRelayItemsByAssignment.all(comment.assignmentId).find((item) => item.uniqueKey === uniqueKey)
  );
  if (existingRelayItem) {
    return existingRelayItem;
  }
  const relayId = createId('relay');
  const context = {
    source: 'review_comment',
    reviewCommentId: comment.id,
    targetType: comment.targetType || '',
    targetId: comment.targetId || '',
    reviewSeverity: comment.severity || '',
    reviewStatus: comment.status || '',
    reviewCreatedBy: comment.createdBy || '',
    reviewCreatedAt: comment.createdAt || '',
    requiredAction: 'Address this review finding in a focused rework pass, then return changed files, tests, risks, and verification notes to ODT.'
  };
  statements.insertAgentRelayItem.run(
    relayId,
    comment.assignmentId,
    '',
    'reviewer',
    'Reviewer',
    targetWorkerRole,
    targetLane,
    'rework',
    'open',
    severity,
    `Rework required: ${humanizeLabel(comment.targetType || 'review')}`,
    comment.comment,
    JSON.stringify(context),
    JSON.stringify({}),
    uniqueKey,
    createdBy || 'odt-review',
    now,
    now,
    null
  );
  const relayItem = parseAgentRelayItem(statements.selectAgentRelayItemById.get(relayId))
    || parseAgentRelayItem(statements.selectAgentRelayItemsByAssignment.all(comment.assignmentId).find((item) => item.uniqueKey === uniqueKey));
  createRunEvent(createId('run'), 'review_rework_relay_created', severity === 'blocker' ? 'warning' : 'ok', {
    assignmentId: comment.assignmentId,
    reviewCommentId: comment.id,
    relayItemId: relayItem?.id || '',
    targetWorkerRole,
    targetLane,
    severity
  }, comment.assignmentId);
  createAgentEvent(comment.assignmentId, 'odt-review', 'review_rework_relay_created', severity, {
    reviewCommentId: comment.id,
    relayItemId: relayItem?.id || '',
    targetWorkerRole,
    targetLane,
    message: comment.comment
  });
  return relayItem;
}

function createReviewComment({ assignmentId = 'assignment-local-mvp', targetType = 'plan', targetId = '', severity = 'comment', comment, status = 'open', createdBy = process.env.USER || 'local-user', resolutionNotes = '' } = {}) {
  const text = String(comment || '').trim();
  if (!text) throw new Error('Review comment is required.');
  const allowedTargets = new Set(['plan', 'design', 'standards', 'handoff', 'pr', 'implementation']);
  const allowedSeverities = new Set(['comment', 'warning', 'blocker']);
  const allowedStatuses = new Set(['open', 'resolved', 'accepted_risk']);
  const normalizedTargetType = String(targetType || 'plan').toLowerCase();
  const normalizedSeverity = String(severity || 'comment').toLowerCase();
  const normalizedStatus = String(status || 'open').toLowerCase();
  if (!allowedTargets.has(normalizedTargetType)) throw new Error('Review target type is not supported.');
  if (!allowedSeverities.has(normalizedSeverity)) throw new Error('Review severity is not supported.');
  if (!allowedStatuses.has(normalizedStatus)) throw new Error('Review status is not supported.');
  const id = createId('review');
  const now = new Date().toISOString();
  statements.insertReviewComment.run(
    id,
    assignmentId,
    normalizedTargetType,
    targetId,
    normalizedSeverity,
    text,
    normalizedStatus,
    createdBy,
    now,
    now,
    resolutionNotes
  );
  const createdComment = statements.selectReviewCommentById.get(id);
  const relayItem = normalizedStatus === 'open' && ['warning', 'blocker'].includes(normalizedSeverity)
    ? createReworkRelayFromReviewComment({ comment: createdComment, createdBy })
    : null;
  createRunEvent(createId('run'), 'review_comment_added', normalizedSeverity === 'blocker' ? 'warning' : 'ok', {
    assignmentId,
    targetType: normalizedTargetType,
    severity: normalizedSeverity,
    status: normalizedStatus,
    reworkRelayItemId: relayItem?.id || ''
  }, assignmentId);
  return { ...createdComment, reworkRelayItem: relayItem };
}

function updateReviewCommentDecision({ id, status, resolutionNotes = '' } = {}) {
  const existing = statements.selectReviewCommentById.get(id);
  if (!existing) {
    const error = new Error('Review comment not found.');
    error.statusCode = 404;
    throw error;
  }
  const allowedStatuses = new Set(['open', 'resolved', 'accepted_risk']);
  const nextStatus = String(status || existing.status).toLowerCase();
  if (!allowedStatuses.has(nextStatus)) throw new Error('Review comment status is not supported.');
  statements.updateReviewCommentStatus.run(nextStatus, new Date().toISOString(), resolutionNotes, id);
  const updated = statements.selectReviewCommentById.get(id);
  createRunEvent(createId('run'), 'review_comment_updated', nextStatus === 'open' ? 'warning' : 'ok', {
    assignmentId: updated.assignmentId,
    commentId: id,
    status: nextStatus
  }, updated.assignmentId);
  return updated;
}

function sendReviewCommentToReworkRelay({ commentId = '', requestedBy = process.env.USER || 'local-user' } = {}) {
  const comment = statements.selectReviewCommentById.get(commentId);
  if (!comment) {
    const error = new Error('Review comment not found.');
    error.statusCode = 404;
    throw error;
  }
  return {
    comment,
    relayItem: createReworkRelayFromReviewComment({ comment, createdBy: requestedBy })
  };
}

function requestPlanRework({ assignmentId = 'assignment-local-mvp', notes = '', targetType = 'plan' } = {}) {
  const evidence = collectEvidence(assignmentId);
  const commentText = String(notes || '').trim() || 'Reviewer requested rework before write-approved implementation continues.';
  const comment = createReviewComment({
    assignmentId,
    targetType,
    targetId: evidence.implementationPlans[0]?.id || '',
    severity: 'blocker',
    comment: commentText,
    status: 'open',
    resolutionNotes: 'Rework requested.'
  });
  const now = new Date().toISOString();
  statements.insertApprovalEvent.run(
    createId('approval'),
    assignmentId,
    'plan_review',
    'needs_changes',
    process.env.USER || 'local-user',
    now,
    commentText
  );

  const requirement = evidence.requirements[0] || {};
  const repoAnalysis = evidence.repoAnalysis[0]?.analysisJson || {};
  const design = buildTechnicalDesign({
    assignmentId,
    requirement,
    repoAnalysis,
    title: 'Reworked Technical Design Draft'
  });
  const plan = buildImplementationPlan({
    assignmentId,
    design,
    title: 'Reworked Implementation Plan'
  });
  const review = runStandardsReview({
    artifact: {
      reworkRequested: true,
      reviewComment: commentText,
      latestDesign: design,
      latestPlan: plan,
      standardsNote: 'Rework review requirement repo impacted files accessibility WCAG VPAT Section 508 security validation testing branch coverage statement coverage dependency policy no new dependency Redwood loading empty error states performance maintainable approval gate.'
    },
    registry: loadStandardsRegistry()
  });
  const standardsCheck = persistStandardsReview({
    assignmentId,
    phase: 'rework-plan',
    artifact: {
      reviewCommentId: comment.id,
      reworkNotes: commentText,
      design,
      plan
    },
    review
  });
  createRunEvent(createId('run'), 'plan_rework_requested', 'warning', {
    assignmentId,
    reviewCommentId: comment.id,
    standardsCheckId: standardsCheck.id
  }, assignmentId);
  return { assignmentId, comment, design, plan, standardsCheck, status: 'REWORK_DRAFTED' };
}

function normalizeStringItems(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(typeof item === 'object' ? item.path || item.command || item.name || item.label || JSON.stringify(item) : item).trim())
      .filter(Boolean);
  }
  return String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTestEvidence(value) {
  const normalizeStatus = (status) => {
    const normalized = String(status || '').toLowerCase().replace(/\s+/g, '_');
    if (['pass', 'passed', 'success', 'ok'].includes(normalized)) return 'passed';
    if (['fail', 'failed', 'error', 'blocked'].includes(normalized)) return 'failed';
    if (['skip', 'skipped'].includes(normalized)) return 'skipped';
    if (['not_run', 'not-run', 'not run', 'pending'].includes(normalized)) return 'not_run';
    if (normalized === 'unknown') return 'unknown';
    return 'unknown';
  };

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'object' && item) {
          return {
            name: String(item.name || item.command || 'Test evidence').trim(),
            command: String(item.command || '').trim(),
            status: normalizeStatus(item.status),
            notes: String(item.notes || item.output || '').trim()
          };
        }
        const text = String(item || '').trim();
        return text ? { name: text, command: text, status: inferTestStatus(text), notes: '' } : null;
      })
      .filter(Boolean);
  }

  return String(value || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nameOrCommand, status, ...notes] = line.split('|').map((part) => part.trim());
      return {
        name: nameOrCommand || 'Test evidence',
        command: nameOrCommand || '',
        status: normalizeStatus(status || inferTestStatus(line)),
        notes: notes.join(' | ')
      };
    });
}

function inferTestStatus(text) {
  const normalized = String(text || '').toLowerCase();
  if (normalized.includes('fail') || normalized.includes('error')) return 'failed';
  if (normalized.includes('skip')) return 'skipped';
  if (normalized.includes('not run') || normalized.includes('pending')) return 'not_run';
  if (normalized.includes('pass') || normalized.includes('success') || normalized.includes('ok')) return 'passed';
  return 'unknown';
}

function stripEvidenceLine(value = '') {
  return String(value || '')
    .trim()
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/^`|`$/g, '')
    .replace(/^\*\*|\*\*$/g, '')
    .trim();
}

function normalizeHeading(value = '') {
  return String(value || '')
    .trim()
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/:$/, '')
    .trim()
    .toLowerCase();
}

function extractMarkdownSectionLines(text = '', aliases = []) {
  const aliasSet = new Set(aliases.map((alias) => String(alias).toLowerCase()));
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const collected = [];
  let active = false;
  for (const line of lines) {
    const heading = normalizeHeading(line);
    const headingLike = /^#{1,6}\s+/.test(line)
      || /^\*\*[^*]{3,90}:?\*\*$/.test(line.trim())
      || /^[A-Z][A-Za-z0-9 /&()._-]{2,90}:$/.test(line.trim());
    if (aliasSet.has(heading)) {
      active = true;
      continue;
    }
    if (active && headingLike) break;
    if (active) collected.push(line);
  }
  return collected.map(stripEvidenceLine).filter(Boolean);
}

function uniqueLimited(items = [], limit = 40) {
  return uniqueTruthy(items)
    .filter((item) => !/^none(?:\s|$|\.|,)/i.test(item))
    .slice(0, limit);
}

function extractChangedFilesFromWorkerOutput(text = '') {
  const sectionLines = [
    ...extractMarkdownSectionLines(text, ['files changed', 'changed files', 'modified files', 'files updated']),
    ...extractMarkdownSectionLines(text, ['summary of changes'])
  ];
  const pathPattern = /(?:^|[\s`"'(])((?:[A-Za-z0-9_.@+-]+\/)+[A-Za-z0-9_.@+-]+\.[A-Za-z0-9]+|[A-Za-z0-9_.@+-]+\.(?:js|jsx|ts|tsx|css|scss|html|json|md|yml|yaml|java|py|go|rb|sql|xml|properties|sh|cjs|mjs))(?:$|[\s`"',).:])/g;
  const matches = [];
  const source = `${sectionLines.join('\n')}\n${text}`;
  let match = pathPattern.exec(source);
  while (match) {
    const candidate = stripEvidenceLine(match[1]).replace(/^\.?\//, '');
    if (!/^(http|https):/i.test(candidate) && !candidate.includes('node_modules/')) matches.push(candidate);
    match = pathPattern.exec(source);
  }
  return uniqueLimited(matches, 50);
}

function extractCommandsFromWorkerOutput(text = '') {
  const commandLines = [
    ...extractMarkdownSectionLines(text, ['commands run', 'commands/tests run and outcomes', 'tests run', 'verification commands', 'commands'])
  ];
  const commandPattern = /\b(?:npm|pnpm|yarn|npx|node|jest|vitest|pytest|mvn|gradle|make|go test|cargo|python|bundle exec)\b[^\n`]*/gi;
  const matches = [];
  const source = `${commandLines.join('\n')}\n${text}`;
  let match = commandPattern.exec(source);
  while (match) {
    matches.push(stripEvidenceLine(match[0]).replace(/\s+\|\s+(passed|failed|skipped|not_run|not run|success|ok|error).*$/i, ''));
  }
  return uniqueLimited(matches, 30);
}

function extractTestsFromWorkerOutput(text = '') {
  const testLines = [
    ...extractMarkdownSectionLines(text, ['tests run', 'commands/tests run and outcomes', 'test results', 'commands run', 'verification'])
  ];
  const candidates = testLines.length
    ? testLines
    : String(text || '').split('\n').filter((line) => /\b(test|build|jest|vitest|npm|yarn|pnpm|not run|passed|failed)\b/i.test(line));
  return uniqueLimited(candidates.map(stripEvidenceLine), 30)
    .map((line) => {
      const [nameOrCommand, status, ...notes] = line.split('|').map((part) => part.trim());
      const inferredStatus = status || line;
      return {
        name: nameOrCommand || 'Worker test evidence',
        command: /^(npm|pnpm|yarn|npx|jest|vitest|pytest|mvn|gradle|make|go test|python)\b/i.test(nameOrCommand) ? nameOrCommand : '',
        status: inferTestStatus(inferredStatus),
        notes: notes.join(' | ') || (status ? '' : line)
      };
    });
}

function extractWorkerImplementationSummary(text = '') {
  const summaryLines = extractMarkdownSectionLines(text, ['summary of changes', 'summary', 'implementation summary'])
    .filter((line) => !/^files changed|^commands|^tests/i.test(line));
  if (summaryLines.length) return summaryLines.slice(0, 6).join(' ').slice(0, 1200);
  return summarizeWorkerOutput(text).slice(0, 1200);
}

function extractImplementationEvidenceFromWorkerRun(run) {
  const rawText = run?.output?.rawText || readTextSnippet(run?.responseFile, 24000);
  const changedFiles = extractChangedFilesFromWorkerOutput(rawText);
  const commands = extractCommandsFromWorkerOutput(rawText);
  const tests = extractTestsFromWorkerOutput(rawText);
  const summary = [
    extractWorkerImplementationSummary(rawText),
    '',
    `Source worker: ${run?.workerRoleLabel || run?.workerRole || 'Worker'} (${run?.executionAgent || 'agent'}).`,
    `Source response: ${run?.responseFile || 'not captured'}.`
  ].join('\n').trim();
  return {
    changedFiles,
    commands,
    tests,
    summary,
    source: {
      workerRunId: run?.id || '',
      runId: run?.runId || '',
      workerRole: run?.workerRole || '',
      workerRoleLabel: run?.workerRoleLabel || '',
      executionAgent: run?.executionAgent || '',
      responseFile: run?.responseFile || '',
      logFile: run?.logFile || ''
    },
    confidence: changedFiles.length || commands.length || tests.length ? 'reviewable' : 'low',
    warnings: changedFiles.length || commands.length || tests.length
      ? []
      : ['ODT could not infer changed files, commands, or tests from the worker output. Review the response and edit evidence manually.']
  };
}

function parseImplementationEvidenceRow(row) {
  if (!row) return null;
  return {
    ...row,
    changedFiles: parseJsonValue(row.changedFilesJson, []),
    commands: parseJsonValue(row.commandsJson, []),
    tests: parseJsonValue(row.testsJson, [])
  };
}

function runPostImplementationStandardsCheck({ assignmentId = 'assignment-local-mvp', evidenceRecord } = {}) {
  const currentEvidence = collectEvidence(assignmentId);
  const implementationEvidence = evidenceRecord || currentEvidence.implementationEvidence?.[0];
  if (!implementationEvidence) {
    const error = new Error('Implementation evidence is required before post-implementation standards check.');
    error.statusCode = 400;
    throw error;
  }
  const artifact = {
    implementationEvidence,
    latestPlan: currentEvidence.implementationPlans?.[0]?.planJson || {},
    latestDesign: currentEvidence.technicalDesigns?.[0]?.designJson || {},
    reviewComments: currentEvidence.reviewComments || [],
    approvedDependencies: dependencyContractRows(currentEvidence, 'approved'),
    pendingDependencies: dependencyContractRows(currentEvidence, 'pending'),
    standardsNote: 'Post implementation evidence includes changed files, commands run, test evidence, testing performed, PR summary, rollback, accessibility notes, security notes, no new dependency unless approved, existing pattern, maintainable, performance, timeout, validation, safe errors, loading empty error success states, WCAG VPAT Section 508 keyboard focus labels contrast.'
  };
  const review = runStandardsReview({
    phase: 'post-implementation',
    artifact,
    assignment: { ...(currentEvidence.assignment || {}), writeApproved: hasWriteApproval(currentEvidence) }
  });
  return persistStandardsReview({
    assignmentId,
    phase: 'post-implementation',
    artifact,
    review
  });
}

function recordImplementationEvidence({
  assignmentId = 'assignment-local-mvp',
  runId = '',
  phase = 'implementation',
  changedFiles = [],
  commands = [],
  tests = [],
  summary = '',
  status = 'recorded',
  createdBy = process.env.USER || 'local-user',
  runPostCheck = true
} = {}) {
  const normalizedChangedFiles = normalizeStringItems(changedFiles);
  const normalizedCommands = normalizeStringItems(commands);
  const normalizedTests = normalizeTestEvidence(tests);
  const normalizedSummary = String(summary || '').trim();
  if (!normalizedSummary && !normalizedChangedFiles.length && !normalizedCommands.length && !normalizedTests.length) {
    throw new Error('Implementation evidence requires a summary, changed file, command, or test result.');
  }

  const id = createId('implev');
  const eventRunId = runId || createId('run');
  const now = new Date().toISOString();
  const failedTests = normalizedTests.filter((test) => test.status === 'failed');
  const normalizedStatus = String(status || (failedTests.length ? 'needs_review' : 'recorded')).toLowerCase();
  statements.insertImplementationEvidence.run(
    id,
    assignmentId,
    eventRunId,
    phase,
    JSON.stringify(normalizedChangedFiles),
    JSON.stringify(normalizedCommands),
    JSON.stringify(normalizedTests),
    normalizedSummary || 'Implementation evidence recorded for governed review.',
    normalizedStatus,
    createdBy,
    now,
    now
  );

  const evidenceRecord = parseImplementationEvidenceRow(statements.selectImplementationEvidenceById.get(id));
  createRunEvent(eventRunId, 'implementation_evidence_recorded', failedTests.length ? 'warning' : 'ok', {
    assignmentId,
    evidenceId: id,
    changedFiles: normalizedChangedFiles.length,
    commands: normalizedCommands.length,
    tests: normalizedTests.length,
    failedTests: failedTests.length
  }, assignmentId);
  if (normalizedTests.length) {
    createRunEvent(eventRunId, 'test_evidence_recorded', failedTests.length ? 'blocked' : 'ok', {
      assignmentId,
      evidenceId: id,
      tests: normalizedTests
    }, assignmentId);
  }

  const postCheck = runPostCheck
    ? runPostImplementationStandardsCheck({ assignmentId, evidenceRecord })
    : null;
  return { assignmentId, evidence: evidenceRecord, postCheck };
}

function markdownList(items, fallback = 'None recorded.') {
  const values = (items || []).filter(Boolean);
  if (!values.length) return `- ${fallback}`;
  return values.map((item) => `- ${String(item)}`).join('\n');
}

function markdownChecklist(items) {
  return (items || []).map((item) => `- [${item.checked ? 'x' : ' '}] ${item.label}`).join('\n');
}

function buildPrMarkdown(report) {
  const implementation = report.implementationEvidence;
  const tests = report.testing?.recorded || [];
  const testLines = tests.map((test) => `${test.status?.toUpperCase?.() || 'UNKNOWN'} - ${test.name || test.command || 'Test'}${test.command ? ` (${test.command})` : ''}${test.notes ? `: ${test.notes}` : ''}`);
  const blockerLines = (report.blockingItems || []).map((item) => `${item.category}: ${item.message} Required action: ${item.requiredAction}`);
  return [
    `# ${report.prTitle}`,
    '',
    '## Summary',
    report.summary,
    '',
    '## Linked Jira',
    report.linkedJira || 'Not linked.',
    '',
    '## Scope',
    markdownList(report.acceptanceMapping),
    '',
    '## Files Changed',
    markdownList(implementation?.changedFiles || [], 'No changed-file evidence recorded.'),
    '',
    '## Implementation Evidence',
    implementation
      ? [
        `Evidence id: ${implementation.id}`,
        `Status: ${implementation.status}`,
        `Summary: ${implementation.summary}`,
        '',
        'Commands run:',
        markdownList(implementation.commands || [], 'No command evidence recorded.')
      ].join('\n')
      : 'No implementation evidence has been recorded.',
    '',
    '## Testing Performed',
    markdownList(testLines, 'No test evidence recorded.'),
    '',
    '## Accessibility / VPAT / WCAG / Section 508 Notes',
    report.accessibilityNotes,
    '',
    '## Security / Compliance Notes',
    report.securityNotes,
    '',
    '## Dependency / 3PL Notes',
    report.dependencyNotes,
    '',
    '## Risk Notes',
    markdownList(report.riskNotes),
    '',
    '## Rollback Plan',
    report.rollbackNotes,
    '',
    '## Reviewer Notes',
    report.reviewerNotes || 'No extra reviewer notes.',
    '',
    '## Blocking Items',
    markdownList(blockerLines, 'No blocking items detected.'),
    '',
    '## Checklist',
    markdownChecklist(report.readinessChecklist),
    ''
  ].join('\n');
}

function buildCurrentAgentContract(assignmentId, executionAgent = getStoredSetting('executionAgent', 'codex')) {
  const evidence = collectEvidence(assignmentId);
  const writeApproved = hasWriteApproval(evidence);
  const unresolvedBlockers = getUnresolvedStandardsBlockers(evidence);
  const openReviewBlockers = getOpenReviewBlockers(evidence);
  const approvedDependencies = dependencyContractRows(evidence, 'approved');
  const pendingDependencies = dependencyContractRows(evidence, 'pending');
  return {
    evidence,
    contract: buildAgentContract({
      assignment: evidence.assignment || { id: assignmentId, title: assignmentId, requirement: '' },
      mode: writeApproved && !unresolvedBlockers.length && !openReviewBlockers.length ? 'write-approved' : 'read-only',
      executionAgent,
      repoAnalysis: evidence.repoAnalysis[0]?.analysisJson || {},
      technicalDesign: evidence.technicalDesigns[0]?.designJson || {},
      implementationPlan: evidence.implementationPlans[0]?.planJson || {},
      approvedDependencies,
      pendingDependencies,
      standards: {
        ...loadStandardsRegistry(),
        latestStandardsCheckId: evidence.standardsChecks[0]?.id || '',
        unresolvedBlockers,
        openReviewBlockers,
        blockerOverrideCaptured: hasLatestBlockerOverride(evidence)
      }
    })
  };
}

function prepareAgentDelegation({ assignmentId = 'assignment-local-mvp', executionAgent, requireWriteApproved = true, notes = '' } = {}) {
  const selectedAgent = executionAgent || getStoredSetting('executionAgent', 'codex');
  const runId = createId('run');
  const { evidence, contract } = buildCurrentAgentContract(assignmentId, selectedAgent);
  const latestCheckId = evidence.standardsChecks[0]?.id || '';
  const blockedReasons = [];
  const warnings = [];
  if (requireWriteApproved && contract.mode !== 'write-approved') {
    blockedReasons.push(contract.standards.unresolvedBlockers?.length
      ? 'Unresolved standards blockers remain.'
      : contract.standards.openReviewBlockers?.length
        ? 'Open review blockers must be resolved or accepted as risk.'
        : 'Write approval for the latest standards review is required.');
  }
  if (contract.standards.pendingDependencies?.length) {
    warnings.push('Pending dependency requests do not block handoff, but dependency installs remain disabled until package-specific approval is captured.');
  }

  const status = blockedReasons.length ? 'blocked' : 'prepared';
  const handoff = {
    title: `${selectedAgent.toUpperCase()} Agent Handoff`,
    assignmentId,
    executionAgent: selectedAgent,
    mode: contract.mode,
    latestStandardsCheckId: latestCheckId,
    allowedActions: contract.allowedActions,
    dependencyInstallPolicy: contract.standards.dependencyInstallPolicy,
    blockers: contract.standards.unresolvedBlockers || [],
    blockedReasons,
    warnings,
    nextStep: status === 'prepared'
      ? `Paste this handoff into ${selectedAgent.toUpperCase()} or continue with the selected supervised agent workflow.`
      : 'Return to Standards, resolve or override findings, and capture write approval for the latest standards check.',
    notes,
    generatedAt: new Date().toISOString(),
    contract
  };

  createRunEvent(runId, 'agent_delegation_requested', blockedReasons.length ? 'blocked' : 'running', {
    requestType: 'agent-handoff',
    assignmentId,
    executionAgent: selectedAgent,
    mode: contract.mode,
    requireWriteApproved,
    latestStandardsCheckId: latestCheckId
  }, assignmentId);
  createRunEvent(runId, 'agent_contract_created', blockedReasons.length ? 'blocked' : 'ok', {
    requestType: 'agent-handoff',
    executionAgent: selectedAgent,
    mode: contract.mode,
    allowedActions: contract.allowedActions,
    blockedReasons,
    warnings
  }, assignmentId);
  createRunEvent(runId, 'agent_handoff_prepared', blockedReasons.length ? 'blocked' : 'ok', {
    requestType: 'agent-handoff',
    executionAgent: selectedAgent,
    status,
    dependencyInstalls: contract.allowedActions.installDependencies ? 'approved' : 'blocked',
    warnings,
    nextStep: handoff.nextStep
  }, assignmentId);
  createAgentEvent(assignmentId, selectedAgent, 'handoff_prepared', status, {
    runId,
    mode: contract.mode,
    latestStandardsCheckId: latestCheckId,
    allowedActions: contract.allowedActions,
    blockedReasons,
    warnings,
    notes
  });

  return { runId, status, message: status === 'prepared' ? `${selectedAgent.toUpperCase()} handoff prepared.` : 'Agent handoff blocked by governance.', handoff, contract };
}

const agentWorkerRoles = [
  {
    id: 'lead-planner',
    label: 'Lead Planner',
    access: 'read-only',
    sandboxMode: 'read-only',
    requiresWriteApproval: false,
    summary: 'Clarifies scope, gaps, sequencing, risks, and worker handoff plan.',
    instructions: [
      'Act as the Lead Planner for this assignment.',
      'Do not edit files.',
      'Produce a specific implementation sequence, open questions, file ownership suggestions, and risk notes for the next workers.'
    ]
  },
  {
    id: 'backend-dev',
    label: 'Backend Dev',
    access: 'write-approved',
    sandboxMode: 'workspace-write',
    requiresWriteApproval: true,
    summary: 'Implements backend/API/data-model changes after approval.',
    instructions: [
      'Act as the Backend Dev worker.',
      'Focus on API integration, data flow, state management, services, utilities, and backend-facing tests.',
      'Coordinate with frontend scope through ODT evidence; do not make unrelated UI-only changes.'
    ]
  },
  {
    id: 'fullstack-dev',
    label: 'Senior Full Stack Dev',
    access: 'write-approved',
    sandboxMode: 'workspace-write',
    requiresWriteApproval: true,
    summary: 'Acts as a senior IC4-style multi-stack developer for architecture-aware end-to-end implementation.',
    instructions: [
      'Act as a senior IC4 software developer with architecture judgment and multi-tech-stack fluency.',
      'Use this lane when backend/frontend split would add overhead or the change is tightly coupled.',
      'Own end-to-end behavior: UI state, API integration, payload shaping, shared utilities, validation, tests, accessibility, security, and maintainability.',
      'Make architecture tradeoffs explicit in the final response and keep implementation scoped to existing repo patterns.'
    ]
  },
  {
    id: 'frontend-dev',
    label: 'Frontend Dev',
    access: 'write-approved',
    sandboxMode: 'workspace-write',
    requiresWriteApproval: true,
    summary: 'Implements UI/component behavior after approval.',
    instructions: [
      'Act as the Frontend Dev worker.',
      'Focus on UI behavior, component state, accessibility, validation, and frontend tests.',
      'Respect backend/API contracts described in ODT evidence and flag gaps instead of inventing unsupported behavior.'
    ]
  },
  {
    id: 'reviewer',
    label: 'Reviewer',
    access: 'read-only',
    sandboxMode: 'read-only',
    requiresWriteApproval: false,
    summary: 'Reviews evidence, diffs, risks, tests, accessibility, and security posture.',
    instructions: [
      'Act as the Reviewer worker.',
      'Do not edit files.',
      'Review the requirement, plan, current repo state, and prior worker evidence. Return findings ordered by severity with file/test recommendations.'
    ]
  },
  {
    id: 'build-verifier',
    label: 'Build Verifier',
    access: 'write-approved-test',
    sandboxMode: 'workspace-write',
    requiresWriteApproval: true,
    summary: 'Runs approved test/build verification and reports outcomes.',
    instructions: [
      'Act as the Build Verifier worker.',
      'Do not implement feature changes.',
      'Run only relevant tests/build commands from the approved test plan, capture failures, and recommend next fixes.'
    ]
  }
];

function getAgentWorkerRole(workerRole = 'lead-planner') {
  return agentWorkerRoles.find((role) => role.id === workerRole) || null;
}

function readTextSnippet(filePath = '', maxChars = 3600) {
  try {
    if (!filePath || !existsSync(filePath)) return '';
    const text = readFileSync(filePath, 'utf8');
    if (text.length <= maxChars) return text.trim();
    return `${text.slice(0, maxChars).trim()}\n\n[ODT truncated this worker output for prompt size.]`;
  } catch {
    return '';
  }
}

function stableTextHash(value = '') {
  let hash = 5381;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function inferTargetWorkerRole(targetLane = '') {
  const lane = String(targetLane || '').toLowerCase();
  if (lane.includes('review')) return 'reviewer';
  if (lane.includes('build') || lane.includes('verif') || lane.includes('test')) return 'build-verifier';
  if (lane.includes('backend') || lane.includes('api') || lane.includes('server')) return 'backend-dev';
  if (lane.includes('frontend') || lane.includes('ui') || lane.includes('client')) return 'frontend-dev';
  if (lane.includes('planner') || lane.includes('lead') || lane.includes('architect')) return 'lead-planner';
  if (lane.includes('full') || lane.includes('implementation') || lane.includes('developer')) return 'fullstack-dev';
  return '';
}

function parseAgentRelayItem(row) {
  if (!row) return null;
  return {
    ...row,
    context: parseJsonValue(row.contextJson, {}),
    decision: parseJsonValue(row.decisionJson, {})
  };
}

function createRelayItemsForWorkerRun(run) {
  if (!run || !Array.isArray(run.questions) || !run.questions.length) return [];
  const now = new Date().toISOString();
  return run.questions.map((question, index) => {
    const message = String(question.question || '').trim();
    if (!message) return null;
    const targetLane = String(question.targetLane || 'Next lane').trim();
    const targetWorkerRole = inferTargetWorkerRole(targetLane);
    const uniqueKey = `${run.id}:question:${index}:${stableTextHash(message)}`;
    const relayId = createId('relay');
    const context = {
      questionIndex: index,
      sourceRunId: run.runId,
      sourceWorkerRunId: run.id,
      sourceWorkerRole: run.workerRole,
      sourceWorkerRoleLabel: run.workerRoleLabel,
      sourceStatus: run.status,
      sourceSummary: run.output?.summary || '',
      responseFile: run.responseFile || '',
      logFile: run.logFile || '',
      targetLane,
      targetWorkerRole
    };
    statements.insertAgentRelayItem.run(
      relayId,
      run.assignmentId,
      run.id,
      run.workerRole,
      run.workerRoleLabel,
      targetWorkerRole,
      targetLane,
      'question',
      question.status || 'open',
      'needs_review',
      `Question for ${targetLane}`,
      message,
      JSON.stringify(context),
      JSON.stringify({}),
      uniqueKey,
      'odt-worker-ingest',
      now,
      now,
      null
    );
    return parseAgentRelayItem(statements.selectAgentRelayItemById.get(relayId))
      || parseAgentRelayItem(statements.selectAgentRelayItemsByAssignment.all(run.assignmentId).find((item) => item.uniqueKey === uniqueKey));
  }).filter(Boolean);
}

function ensureRelayItemsForAssignment(assignmentId = 'assignment-local-mvp') {
  const workerRuns = statements.selectAgentWorkerRunsByAssignment.all(assignmentId).map(parseAgentWorkerRun);
  workerRuns.forEach((run) => createRelayItemsForWorkerRun(run));
}

function collectAgentRelayContext(evidence, currentRoleId) {
  const relayItems = evidence.agentRelayItems || [];
  return relayItems
    .filter((item) => ['open', 'assigned', 'answered'].includes(String(item.status || '').toLowerCase()))
    .filter((item) => !item.targetWorkerRole || item.targetWorkerRole === currentRoleId || item.status === 'answered')
    .slice(0, 12)
    .map((item) => ({
      id: item.id,
      status: item.status,
      severity: item.severity,
      type: item.itemType,
      targetWorkerRole: item.targetWorkerRole,
      targetLane: item.targetLane,
      sourceWorkerRole: item.sourceWorkerRole,
      sourceWorkerRoleLabel: item.sourceWorkerRoleLabel,
      title: item.title,
      message: item.message,
      decision: item.decision,
      source: item.context?.source || '',
      reviewCommentId: item.context?.reviewCommentId || '',
      targetType: item.context?.targetType || '',
      targetId: item.context?.targetId || '',
      reviewSeverity: item.context?.reviewSeverity || '',
      reviewStatus: item.context?.reviewStatus || '',
      requiredAction: item.context?.requiredAction || '',
      sourceSummary: item.context?.sourceSummary || '',
      responseFile: item.context?.responseFile || '',
      logFile: item.context?.logFile || '',
      updatedAt: item.updatedAt
    }));
}

function decideAgentRelayItem({ relayItemId = '', assignmentId = 'assignment-local-mvp', action = 'answer', decision = '', targetWorkerRole = '', targetLane = '', decidedBy = 'local-user' } = {}) {
  const relay = parseAgentRelayItem(statements.selectAgentRelayItemById.get(relayItemId));
  if (!relay || relay.assignmentId !== assignmentId) {
    const error = new Error('Relay item not found for this assignment.');
    error.statusCode = 404;
    throw error;
  }
  const normalizedAction = String(action || 'answer').toLowerCase();
  const allowedActions = new Set(['answer', 'assign', 'resolve', 'reopen']);
  if (!allowedActions.has(normalizedAction)) {
    const error = new Error('Relay action must be answer, assign, resolve, or reopen.');
    error.statusCode = 400;
    throw error;
  }
  const now = new Date().toISOString();
  const resolvedAt = normalizedAction === 'resolve' || normalizedAction === 'answer' ? now : null;
  const nextStatus = normalizedAction === 'reopen'
    ? 'open'
    : normalizedAction === 'assign'
      ? 'assigned'
      : normalizedAction === 'resolve'
        ? 'resolved'
        : 'answered';
  const nextTargetRole = targetWorkerRole || relay.targetWorkerRole || inferTargetWorkerRole(targetLane || relay.targetLane);
  const nextTargetLane = targetLane || relay.targetLane || nextTargetRole || 'Next lane';
  const nextDecision = {
    ...(relay.decision || {}),
    action: normalizedAction,
    decision: String(decision || '').trim(),
    decidedBy: decidedBy || 'local-user',
    decidedAt: now
  };
  if (['answer', 'resolve'].includes(normalizedAction) && !nextDecision.decision) {
    const error = new Error('Decision notes are required to answer or resolve a relay item.');
    error.statusCode = 400;
    throw error;
  }
  statements.updateAgentRelayItem.run(
    nextTargetRole,
    nextTargetLane,
    nextStatus,
    relay.severity,
    JSON.stringify(nextDecision),
    now,
    resolvedAt,
    relayItemId
  );
  createRunEvent(relay.context?.sourceRunId || createId('run'), 'agent_relay_item_updated', 'ok', {
    assignmentId,
    relayItemId,
    action: normalizedAction,
    status: nextStatus,
    targetWorkerRole: nextTargetRole,
    targetLane: nextTargetLane,
    decisionPreview: nextDecision.decision.slice(0, 240)
  }, assignmentId);
  createAgentEvent(assignmentId, 'odt-relay', 'relay_item_updated', nextStatus, {
    relayItemId,
    sourceWorkerRunId: relay.sourceWorkerRunId,
    sourceWorkerRole: relay.sourceWorkerRole,
    targetWorkerRole: nextTargetRole,
    action: normalizedAction,
    decision: nextDecision.decision
  });
  return parseAgentRelayItem(statements.selectAgentRelayItemById.get(relayItemId));
}

function collectWorkerRelayEvidence(evidence, currentRoleId) {
  const workerRuns = evidence.agentWorkerRuns || [];
  if (workerRuns.length) {
    return workerRuns
      .map((run) => ({
        createdAt: run.createdAt,
        engine: run.executionAgent,
        workerRole: run.workerRole,
        workerRoleLabel: run.workerRoleLabel,
        status: run.status,
        sandboxMode: run.sandboxMode,
        responseFile: run.responseFile || '',
        logFile: run.logFile || '',
        note: run.output?.summary || '',
        questions: run.questions || [],
        responsePreview: run.output?.rawText ? String(run.output.rawText).slice(0, 3600) : readTextSnippet(run.responseFile, 3600)
      }))
      .filter((item) => item.workerRole !== currentRoleId || item.responsePreview || item.note || item.questions.length)
      .slice(0, 8);
  }

  return (evidence.agentEvents || [])
    .filter((event) => ['worker_launch_prepared', 'worker_launch_failed'].includes(event.eventType))
    .map((event) => {
      const detail = event.detailJson || {};
      return {
        createdAt: event.createdAt,
        engine: event.agentId,
        workerRole: detail.workerRole || '',
        workerRoleLabel: detail.workerRoleLabel || detail.workerRole || '',
        status: detail.status || event.status,
        sandboxMode: detail.sandboxMode || '',
        responseFile: detail.responseFile || '',
        logFile: detail.logFile || '',
        note: detail.note || '',
        responsePreview: readTextSnippet(detail.responseFile, 3600)
      };
    })
    .filter((item) => item.workerRole !== currentRoleId || item.responsePreview || item.note)
    .slice(0, 8);
}

function parseAgentWorkerRun(row) {
  if (!row) return null;
  const output = parseJsonValue(row.outputJson, {});
  return {
    ...row,
    output,
    stopFile: output.stopFile || output.launchStatus?.stopFile || '',
    questions: parseJsonValue(row.questionsJson, [])
  };
}

function fileSizeIfExists(filePath = '') {
  try {
    if (!filePath || !existsSync(filePath)) return 0;
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}

function readWorkerStatusFile(statusFile = '') {
  try {
    if (!statusFile || !existsSync(statusFile)) return {};
    return parseJsonValue(readFileSync(statusFile, 'utf8'), {});
  } catch {
    return {};
  }
}

function mapLaunchStatusToWorkerStatus(status = '', responseBytes = 0) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return responseBytes > 0 ? 'response_ready' : 'completed';
  if (normalized === 'failed' || normalized === 'codex_missing' || normalized === 'failed_to_open') return normalized;
  if (normalized === 'stop_requested' || normalized === 'stopped') return normalized;
  if (normalized === 'running' || normalized === 'starting' || normalized === 'delegated_visible') return 'running';
  if (normalized === 'bundle_created' || normalized === 'manual_fallback') return normalized;
  return responseBytes > 0 ? 'response_ready' : normalized || 'unknown';
}

function syncWorkerRunStatus({ assignmentId = 'assignment-local-mvp', workerRunId = '' } = {}) {
  const run = parseAgentWorkerRun(statements.selectAgentWorkerRunById.get(workerRunId));
  if (!run || run.assignmentId !== assignmentId) {
    const error = new Error('Agent worker run not found for this assignment.');
    error.statusCode = 404;
    throw error;
  }
  const statusFileJson = readWorkerStatusFile(run.statusFile);
  const responseBytes = fileSizeIfExists(run.responseFile);
  const logBytes = fileSizeIfExists(run.logFile);
  const logTail = readTextSnippet(run.logFile, 5000);
  const status = mapLaunchStatusToWorkerStatus(statusFileJson.status || run.status, responseBytes);
  const now = new Date().toISOString();
  const completedAt = ['response_ready', 'completed', 'failed', 'codex_missing', 'failed_to_open', 'stopped'].includes(status)
    ? (statusFileJson.completedAt || now)
    : run.completedAt;
  const output = {
    ...(run.output || {}),
    summary: run.output?.summary || statusFileJson.note || 'Worker status refreshed.',
    launchStatus: statusFileJson,
    responseBytes,
    logBytes,
    logTail,
    refreshedAt: now
  };
  statements.updateAgentWorkerOutput.run(
    status,
    JSON.stringify(output),
    JSON.stringify(run.questions || []),
    now,
    completedAt || null,
    workerRunId
  );
  createRunEvent(run.runId, 'agent_worker_status_refreshed', status.includes('fail') || status.includes('missing') ? 'warning' : 'ok', {
    assignmentId,
    workerRunId,
    workerRole: run.workerRole,
    workerRoleLabel: run.workerRoleLabel,
    status,
    responseBytes,
    logBytes,
    statusFile: run.statusFile
  }, assignmentId);
  return {
    workerRun: parseAgentWorkerRun(statements.selectAgentWorkerRunById.get(workerRunId)),
    statusFile: statusFileJson,
    responseBytes,
    logBytes,
    logTail
  };
}

function nextWorkerSequence(assignmentId) {
  const rows = statements.selectAgentWorkerRunsByAssignment.all(assignmentId);
  return rows.reduce((max, row) => Math.max(max, Number(row.sequenceIndex) || 0), 0) + 1;
}

function extractWorkerQuestions(text = '') {
  const value = String(text || '');
  const questions = [];
  const sectionPattern = /^#{1,4}\s*Questions\s+for\s+(.+)$/gim;
  let match = sectionPattern.exec(value);
  while (match) {
    const lane = match[1].trim().replace(/[:#]+$/g, '');
    const start = match.index + match[0].length;
    const next = value.slice(start).search(/^#{1,4}\s+/m);
    const section = (next >= 0 ? value.slice(start, start + next) : value.slice(start)).trim();
    section
      .split('\n')
      .map((line) => line.trim().replace(/^[-*]\s*/, '').replace(/^\d+[.)]\s*/, ''))
      .filter((line) => line.includes('?') || line.length > 12)
      .forEach((question) => {
        questions.push({
          targetLane: lane,
          question,
          status: 'open'
        });
      });
    match = sectionPattern.exec(value);
  }
  return questions.slice(0, 20);
}

function summarizeWorkerOutput(text = '') {
  const lines = String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const summaryLines = lines
    .filter((line) => !line.startsWith('#') && !/^[-*]\s*$/.test(line))
    .slice(0, 5);
  return summaryLines.join(' ').slice(0, 700) || 'Worker output captured.';
}

function upsertAgentWorkerRunRecord({ id, assignmentId, runId, role, executionAgent, mode, sandboxMode, status, launchMode, bundlePaths, manualCommand, output = {}, questions = [], completedAt = null, sequenceIndex = null }) {
  const now = new Date().toISOString();
  statements.upsertAgentWorkerRun.run(
    id,
    assignmentId,
    runId,
    role.id,
    role.label,
    executionAgent,
    mode,
    sandboxMode,
    status,
    sequenceIndex || nextWorkerSequence(assignmentId),
    launchMode,
    bundlePaths.bundleDir || '',
    bundlePaths.handoffFile || '',
    bundlePaths.promptFile || '',
    bundlePaths.scriptFile || '',
    bundlePaths.responseFile || '',
    bundlePaths.logFile || '',
    bundlePaths.statusFile || '',
    manualCommand || '',
    JSON.stringify(output || {}),
    JSON.stringify(questions || []),
    now,
    now,
    completedAt
  );
  return parseAgentWorkerRun(statements.selectAgentWorkerRunById.get(id));
}

function ingestWorkerOutput({ assignmentId = 'assignment-local-mvp', workerRunId = '' } = {}) {
  const run = parseAgentWorkerRun(statements.selectAgentWorkerRunById.get(workerRunId));
  if (!run || run.assignmentId !== assignmentId) {
    const error = new Error('Agent worker run not found for this assignment.');
    error.statusCode = 404;
    throw error;
  }
  const responseText = readTextSnippet(run.responseFile, 24000);
  if (!responseText.trim()) {
    const error = new Error('No worker response text found yet. Wait for the worker to finish or paste output into the response file.');
    error.statusCode = 409;
    throw error;
  }
  const questions = extractWorkerQuestions(responseText);
  const output = {
    summary: summarizeWorkerOutput(responseText),
    rawText: responseText,
    responseFile: run.responseFile,
    logTail: readTextSnippet(run.logFile, 5000),
    ingestedAt: new Date().toISOString()
  };
  const completedAt = new Date().toISOString();
  statements.updateAgentWorkerOutput.run(
    questions.length ? 'needs_input' : 'completed',
    JSON.stringify(output),
    JSON.stringify(questions),
    completedAt,
    completedAt,
    workerRunId
  );
  createRunEvent(run.runId, 'agent_worker_output_ingested', questions.length ? 'warning' : 'ok', {
    assignmentId,
    workerRunId,
    workerRole: run.workerRole,
    workerRoleLabel: run.workerRoleLabel,
    questions: questions.length,
    summary: output.summary
  }, assignmentId);
  createAgentEvent(assignmentId, run.executionAgent, 'worker_output_ingested', questions.length ? 'needs_input' : 'completed', {
    workerRunId,
    workerRole: run.workerRole,
    workerRoleLabel: run.workerRoleLabel,
    questions,
    summary: output.summary
  });
  const updatedRun = parseAgentWorkerRun(statements.selectAgentWorkerRunById.get(workerRunId));
  const relayItems = createRelayItemsForWorkerRun(updatedRun);
  if (relayItems.length) {
    createRunEvent(run.runId, 'agent_relay_items_created', 'ok', {
      assignmentId,
      workerRunId,
      relayItems: relayItems.length,
      targetLanes: relayItems.map((item) => item.targetLane)
    }, assignmentId);
  }
  return updatedRun;
}

function recordImplementationEvidenceFromWorkerRun({ assignmentId = 'assignment-local-mvp', workerRunId = '', runPostCheck = true } = {}) {
  let run = parseAgentWorkerRun(statements.selectAgentWorkerRunById.get(workerRunId));
  if (!run || run.assignmentId !== assignmentId) {
    const error = new Error('Agent worker run not found for this assignment.');
    error.statusCode = 404;
    throw error;
  }
  if (!run.output?.rawText && fileSizeIfExists(run.responseFile) > 0) {
    run = ingestWorkerOutput({ assignmentId, workerRunId });
  }
  const rawText = run?.output?.rawText || readTextSnippet(run?.responseFile, 24000);
  if (!String(rawText || '').trim()) {
    const error = new Error('No worker response text found yet. Ingest output after the worker writes a response, or record implementation evidence manually.');
    error.statusCode = 409;
    throw error;
  }
  const extracted = extractImplementationEvidenceFromWorkerRun(run);
  const result = recordImplementationEvidence({
    assignmentId,
    runId: run.runId,
    phase: `worker-${run.workerRole || 'implementation'}`,
    changedFiles: extracted.changedFiles,
    commands: extracted.commands,
    tests: extracted.tests,
    summary: extracted.summary,
    status: extracted.tests.some((test) => test.status === 'failed') || extracted.warnings.length ? 'needs_review' : 'recorded',
    createdBy: `${run.executionAgent || 'agent'}:${run.workerRoleLabel || run.workerRole || 'worker'}`,
    runPostCheck
  });
  createRunEvent(run.runId || createId('run'), 'implementation_evidence_derived_from_worker', extracted.warnings.length ? 'warning' : 'ok', {
    assignmentId,
    workerRunId,
    evidenceId: result.evidence.id,
    changedFiles: extracted.changedFiles.length,
    commands: extracted.commands.length,
    tests: extracted.tests.length,
    warnings: extracted.warnings
  }, assignmentId);
  createAgentEvent(assignmentId, run.executionAgent || 'agent', 'worker_evidence_derived', extracted.warnings.length ? 'needs_review' : 'completed', {
    workerRunId,
    workerRole: run.workerRole,
    workerRoleLabel: run.workerRoleLabel,
    evidenceId: result.evidence.id,
    extracted
  });
  return { ...result, extracted, workerRun: parseAgentWorkerRun(statements.selectAgentWorkerRunById.get(workerRunId)) };
}

function requestStopWorkerRun({ assignmentId = 'assignment-local-mvp', workerRunId = '', requestedBy = process.env.USER || 'local-user', reason = '' } = {}) {
  const run = parseAgentWorkerRun(statements.selectAgentWorkerRunById.get(workerRunId));
  if (!run || run.assignmentId !== assignmentId) {
    const error = new Error('Agent worker run not found for this assignment.');
    error.statusCode = 404;
    throw error;
  }
  const statusFileJson = readWorkerStatusFile(run.statusFile);
  const stopFile = run.stopFile || statusFileJson.stopFile || (run.bundleDir ? join(run.bundleDir, 'stop-worker.request') : '');
  const now = new Date().toISOString();
  const active = ['starting', 'running', 'delegated_visible', 'unknown'].includes(String(run.status || '').toLowerCase())
    || ['starting', 'running', 'delegated_visible'].includes(String(statusFileJson.status || '').toLowerCase());
  const stopPayload = {
    assignmentId,
    workerRunId,
    runId: run.runId,
    requestedBy,
    requestedAt: now,
    reason: String(reason || '').trim() || 'Developer requested worker termination from ODT.'
  };
  if (stopFile) {
    mkdirSync(dirname(stopFile), { recursive: true });
    writeFileSync(stopFile, `${JSON.stringify(stopPayload, null, 2)}\n`, 'utf8');
  }
  const codexPid = Number(statusFileJson.codexPid || run.output?.launchStatus?.codexPid || 0);
  let signalResult = null;
  if (active && Number.isInteger(codexPid) && codexPid > 0) {
    try {
      process.kill(codexPid, 'SIGINT');
      signalResult = { status: 'sent', signal: 'SIGINT', pid: codexPid };
    } catch (err) {
      signalResult = { status: 'failed', signal: 'SIGINT', pid: codexPid, error: err.message };
    }
  }
  const output = {
    ...(run.output || {}),
    stopFile,
    stopRequested: stopPayload,
    stopSignal: signalResult,
    summary: active
      ? signalResult?.status === 'sent'
        ? 'Stop requested. ODT sent SIGINT to the Codex worker and wrote a stop request for the worker script.'
        : 'Stop requested. ODT wrote a stop request for the worker script; refresh status to confirm termination.'
      : 'Stop request recorded. This worker was not in an active status; no running process was terminated by ODT.',
    manualStopGuidance: active
      ? 'If the visible Terminal worker does not stop within a few seconds, focus that Terminal tab and press Ctrl+C.'
      : 'No active worker process was detected. Review the worker status before relaunching.'
  };
  statements.updateAgentWorkerOutput.run(
    active ? 'stop_requested' : run.status,
    JSON.stringify(output),
    JSON.stringify(run.questions || []),
    now,
    active ? null : run.completedAt,
    workerRunId
  );
  createRunEvent(run.runId || createId('run'), 'agent_worker_stop_requested', active ? 'warning' : 'ok', {
    ...stopPayload,
    stopFile,
    codexPid,
    signalResult,
    active,
    status: run.status
  }, assignmentId);
  createAgentEvent(assignmentId, run.executionAgent || 'agent', 'worker_stop_requested', active ? 'stop_requested' : 'recorded', {
    workerRunId,
    workerRole: run.workerRole,
    workerRoleLabel: run.workerRoleLabel,
    stopFile,
    codexPid,
    signalResult,
    active,
    reason: stopPayload.reason
  });
  return {
    workerRun: parseAgentWorkerRun(statements.selectAgentWorkerRunById.get(workerRunId)),
    stopFile,
    signalResult,
    active,
    message: output.summary,
    manualStopGuidance: output.manualStopGuidance
  };
}

function buildWorkerPrompt({ handoff, contract, evidence, bundlePaths, workerRole }) {
  const requirementText = evidence.requirements?.[0]?.rawText || contract.requirement?.content || '';
  const latestRepo = evidence.repoAnalysis?.[0]?.analysisJson || {};
  const latestDesign = evidence.technicalDesigns?.[0]?.designJson || {};
  const latestPlan = evidence.implementationPlans?.[0]?.planJson || {};
  const latestTestPlan = evidence.testPlans?.[0]?.planJson || {};
  const latestStandards = evidence.standardsChecks?.[0] || {};
  const workerRelay = collectWorkerRelayEvidence(evidence, workerRole.id);
  const agentRelayContext = collectAgentRelayContext(evidence, workerRole.id);
  const intakeAssets = (evidence.intakeAssets || []).map((asset) => ({
    name: asset.originalName,
    type: asset.fileType,
    storedPath: asset.storedPath
  }));
  const openReviews = (evidence.reviewComments || [])
    .filter((comment) => comment.status === 'open')
    .map((comment) => ({
      severity: comment.severity,
      target: comment.targetType,
      message: comment.message,
      recommendation: comment.recommendation
    }));

  return [
    '# ODT Governed Codex Worker Prompt',
    '',
    'You are the implementation worker launched by ODT Workbench. ODT is the governed control plane; this terminal session is the supervised Codex worker.',
    '',
    '## Operating Rules',
    '- Work only in the target repository shown below.',
    '- Implement only the approved assignment scope.',
    '- Do not modify the ODT Workbench repository.',
    '- Do not create a branch, commit, push, raise a PR, or update external systems.',
    '- Do not run destructive commands.',
    '- Do not install dependencies or modify dependency manifests unless ODT explicitly marks installDependencies as true and the package is listed in approvedDependencies.',
    '- Follow existing repository patterns and keep changes tightly scoped.',
    '- Run the requested tests when feasible. If a test cannot run, record the reason.',
    '- Leave changes in the working tree for developer review.',
    '',
    '## Target Repository',
    `- Path: ${contract.repoPath || 'not configured'}`,
    `- Base branch: ${contract.baseBranch || 'not captured'}`,
    '',
    '## Worker Lane',
    `- Role: ${workerRole.label}`,
    `- Access: ${workerRole.access}`,
    `- Sandbox: ${workerRole.sandboxMode}`,
    '- Default orchestration: sequential evidence relay. Use ODT evidence from prior workers before making decisions.',
    '',
    'Role instructions:',
    ...workerRole.instructions.map((instruction) => `- ${instruction}`),
    '- If another worker lane must answer a question before you can proceed, add a clearly titled "Questions for <lane>" section in your final response.',
    '- If you are answering prior questions from another lane, call that out explicitly and include the answer for ODT to relay.',
    '',
    '## Assignment',
    `- Id: ${contract.assignmentId}`,
    `- Title: ${contract.requirement?.title || 'Untitled assignment'}`,
    '',
    '```md',
    requirementText.trim() || 'No full requirement text was captured.',
    '```',
    '',
    '## Allowed Actions Contract',
    '```json',
    JSON.stringify(contract.allowedActions || {}, null, 2),
    '```',
    '',
    '## Dependency Policy',
    contract.standards?.dependencyInstallPolicy || 'Dependency installs are blocked unless separately approved.',
    '',
    '## Latest Repo Analysis',
    '```json',
    JSON.stringify(latestRepo, null, 2),
    '```',
    '',
    '## Technical Design',
    '```json',
    JSON.stringify(latestDesign, null, 2),
    '```',
    '',
    '## Implementation Plan',
    '```json',
    JSON.stringify(latestPlan, null, 2),
    '```',
    '',
    '## Test Plan',
    '```json',
    JSON.stringify(latestTestPlan, null, 2),
    '```',
    '',
    '## Standards Evidence',
    '```json',
    JSON.stringify({
      id: latestStandards.id || '',
      phase: latestStandards.phase || '',
      status: latestStandards.status || '',
      findings: latestStandards.findings || []
    }, null, 2),
    '```',
    '',
    '## Open Human Review Items',
    openReviews.length ? openReviews.map((item) => `- ${item.severity}: ${item.message} (${item.recommendation || 'review required'})`).join('\n') : '- No open review comments were attached to this worker launch.',
    '',
    '## Agent Relay Context',
    agentRelayContext.length ? 'ODT selected these cross-lane relay items for this worker. Address applicable open or assigned items in your response.' : 'No targeted relay items are currently assigned to this worker lane.',
    agentRelayContext.length ? '```json' : '',
    agentRelayContext.length ? JSON.stringify(agentRelayContext, null, 2) : '',
    agentRelayContext.length ? '```' : '',
    '',
    '## Prior Worker Relay Evidence',
    workerRelay.length ? 'Review these prior worker outputs before proceeding:' : 'No prior worker output has been captured yet.',
    workerRelay.length ? '```json' : '',
    workerRelay.length ? JSON.stringify(workerRelay, null, 2) : '',
    workerRelay.length ? '```' : '',
    '',
    '## Intake Assets',
    intakeAssets.length ? intakeAssets.map((asset) => `- ${asset.name} (${asset.type}): ${asset.storedPath}`).join('\n') : '- No uploaded intake assets were attached.',
    '',
    '## Required Final Response',
    'When finished, write a concise implementation report with:',
    '- Summary of changes.',
    '- Files changed.',
    '- Commands/tests run and outcomes.',
    '- Accessibility, security, dependency, and testing notes.',
    '- Known risks or follow-up work.',
    '- Questions for another lane, if blocked or coordination is needed.',
    '- Answers to prior lane questions, if this worker was launched to respond.',
    '',
    'ODT bundle files for traceability:',
    `- Handoff JSON: ${bundlePaths.handoffFile}`,
    `- Prompt: ${bundlePaths.promptFile}`,
    `- Response: ${bundlePaths.responseFile}`,
    `- Log: ${bundlePaths.logFile}`,
    ''
  ].join('\n');
}

function buildCodexLaunchScript({ repoPath, promptFile, responseFile, logFile, statusFile, stopFile, codexExecutable, skipGitRepoCheck, sandboxMode, workerRole }) {
  const codexArgs = skipGitRepoCheck
    ? 'exec -C "$PWD" -s "$SANDBOX_MODE" -o "$RESPONSE_FILE" --skip-git-repo-check -'
    : 'exec -C "$PWD" -s "$SANDBOX_MODE" -o "$RESPONSE_FILE" -';
  return [
    '#!/bin/bash',
    'set -u',
    `cd ${shellQuote(repoPath)}`,
    `PROMPT_FILE=${shellQuote(promptFile)}`,
	    `RESPONSE_FILE=${shellQuote(responseFile)}`,
	    `LOG_FILE=${shellQuote(logFile)}`,
	    `STATUS_FILE=${shellQuote(statusFile)}`,
	    `STOP_FILE=${shellQuote(stopFile)}`,
	    `CODEX_BIN=${shellQuote(codexExecutable || 'codex')}`,
	    `SANDBOX_MODE=${shellQuote(sandboxMode || 'read-only')}`,
    'mkdir -p "$(dirname "$RESPONSE_FILE")"',
    'mkdir -p "$(dirname "$LOG_FILE")"',
    'mkdir -p "$(dirname "$STATUS_FILE")"',
    ': > "$LOG_FILE"',
    'write_status() {',
    '  local status="$1"',
    '  local exit_code="${2:-}"',
    '  local note="${3:-}"',
	    '  local codex_pid="${4:-}"',
	    '  STATUS_FILE="$STATUS_FILE" STOP_FILE="$STOP_FILE" STATUS_VALUE="$status" EXIT_CODE_VALUE="$exit_code" NOTE_VALUE="$note" CODEX_PID_VALUE="$codex_pid" node - <<\'NODE\'',
    'const fs = require("fs");',
    'const path = process.env.STATUS_FILE;',
    'let existing = {};',
    'try { existing = JSON.parse(fs.readFileSync(path, "utf8")); } catch {}',
	    'const status = process.env.STATUS_VALUE || "unknown";',
	    'const exitCodeRaw = process.env.EXIT_CODE_VALUE || "";',
	    'const codexPidRaw = process.env.CODEX_PID_VALUE || "";',
	    'const payload = {',
    '  ...existing,',
    '  status,',
    '  note: process.env.NOTE_VALUE || existing.note || "",',
    '  updatedAt: new Date().toISOString(),',
    '  startedAt: existing.startedAt || new Date().toISOString(),',
	    '  completedAt: ["completed", "failed", "codex_missing", "stopped"].includes(status) ? new Date().toISOString() : existing.completedAt || null,',
	    '  exitCode: exitCodeRaw === "" ? existing.exitCode ?? null : Number(exitCodeRaw),',
	    '  codexPid: codexPidRaw === "" ? existing.codexPid ?? null : Number(codexPidRaw),',
    '  responseFile: existing.responseFile,',
	    '  logFile: existing.logFile,',
	    '  stopFile: existing.stopFile || process.env.STOP_FILE || ""',
    '};',
    'fs.writeFileSync(path, `${JSON.stringify(payload, null, 2)}\\n`);',
    'NODE',
	    '}',
	    'write_status "running" "" "Codex worker script started."',
	    'rm -f "$STOP_FILE"',
    `echo "[odt] Delegating ${workerRole.label} to Codex (visible terminal session)." | tee -a "$LOG_FILE"`,
    'echo "[odt] Target repo: $PWD" | tee -a "$LOG_FILE"',
    'echo "[odt] Sandbox: $SANDBOX_MODE" | tee -a "$LOG_FILE"',
    'echo "[odt] Prompt: $PROMPT_FILE" | tee -a "$LOG_FILE"',
    'echo "[odt] Response: $RESPONSE_FILE" | tee -a "$LOG_FILE"',
    'echo "" | tee -a "$LOG_FILE"',
    'if [ -s "$HOME/.nvm/nvm.sh" ]; then',
    '  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"',
    '  . "$NVM_DIR/nvm.sh"',
    'fi',
    'echo "[odt] Node: $(command -v node 2>/dev/null || true) $(node -v 2>/dev/null || true)" | tee -a "$LOG_FILE"',
    'echo "[odt] codex: $CODEX_BIN $("$CODEX_BIN" --version 2>/dev/null || true)" | tee -a "$LOG_FILE"',
	    'if [ ! -x "$CODEX_BIN" ]; then',
    '  echo "[odt] Verified Codex CLI path is not executable. Refresh execution health in ODT before launching again." | tee -a "$LOG_FILE"',
    '  write_status "codex_missing" "127" "Codex CLI was not found in this terminal environment."',
    '  exit 127',
	    'fi',
	    'set +e',
	    `"$CODEX_BIN" ${codexArgs} < "$PROMPT_FILE" > >(tee -a "$LOG_FILE") 2>&1 &`,
	    'CODEX_PID=$!',
	    'write_status "running" "" "Codex worker process started." "$CODEX_PID"',
	    'while kill -0 "$CODEX_PID" 2>/dev/null; do',
	    '  if [ -f "$STOP_FILE" ]; then',
	    '    echo "[odt] Stop requested by ODT. Terminating Codex worker process $CODEX_PID." | tee -a "$LOG_FILE"',
	    '    write_status "stop_requested" "" "Stop requested by ODT. Waiting for Codex worker to terminate."',
	    '    kill "$CODEX_PID" 2>/dev/null || true',
	    '    sleep 1',
	    '    kill -9 "$CODEX_PID" 2>/dev/null || true',
	    '    wait "$CODEX_PID" 2>/dev/null',
	    '    EXIT_CODE=130',
	    '    write_status "stopped" "$EXIT_CODE" "Codex worker stopped by ODT request."',
	    '    break',
	    '  fi',
	    '  sleep 2',
	    'done',
	    'if [ -z "${EXIT_CODE+x}" ]; then',
	    '  wait "$CODEX_PID"',
	    '  EXIT_CODE=$?',
	    'fi',
	    'set -e',
	    'if [ "$EXIT_CODE" -eq 0 ]; then',
	    '  write_status "completed" "$EXIT_CODE" "Codex worker completed. Review and ingest response evidence in ODT."',
	    'elif [ "$EXIT_CODE" -eq 130 ]; then',
	    '  write_status "stopped" "$EXIT_CODE" "Codex worker stopped by ODT request."',
	    'else',
    '  write_status "failed" "$EXIT_CODE" "Codex worker failed. Review log evidence in ODT."',
    'fi',
    'echo "" | tee -a "$LOG_FILE"',
    'echo "[odt] Agent task finished with exit code $EXIT_CODE" | tee -a "$LOG_FILE"',
    'echo "[odt] Review changed files, tests, and diffs before recording implementation evidence in ODT." | tee -a "$LOG_FILE"',
    'echo ""',
    'echo "ODT Codex worker finished. Return to ODT Workbench to review evidence."',
    'echo "Response file: $RESPONSE_FILE"',
    'echo "Log file: $LOG_FILE"',
    'exit $EXIT_CODE',
    ''
  ].join('\n');
}

function openVisibleTerminal(scriptFile, runDir, onComplete) {
  if (process.platform !== 'darwin') {
    throw new Error('Visible terminal launch is currently implemented for macOS Terminal.');
  }
  const command = `bash ${shellQuote(scriptFile)}`;
  const child = execFile('osascript', [
    '-e',
    'tell application "Terminal" to activate',
    '-e',
    `tell application "Terminal" to do script "${escapeAppleScriptString(command)}"`
  ], {
    cwd: runDir,
    env: process.env,
    detached: true
  }, onComplete);
  child.unref();
  return child.pid;
}

function launchCodexWorker({ assignmentId = 'assignment-local-mvp', executionAgent, workerRole = 'lead-planner', launchMode = 'terminal', notes = '' } = {}) {
  const selectedAgent = executionAgent || getStoredSetting('executionAgent', 'codex');
  if (selectedAgent !== 'codex') {
    const error = new Error('Only Codex terminal launch is wired in this slice. Use governed handoff for Cline/manual until those launchers are allowlisted.');
    error.statusCode = 400;
    throw error;
  }
  const role = getAgentWorkerRole(workerRole);
  if (!role) {
    const error = new Error('Unsupported worker role. Use one of the allowlisted ODT Agent Team lanes.');
    error.statusCode = 400;
    throw error;
  }
  const executionHealth = getCodexExecutionHealth();
  if (executionHealth.status !== 'healthy') {
    createAgentEvent(assignmentId, selectedAgent, 'execution_health_failed', 'error', executionHealth);
    const error = new Error(executionHealth.message);
    error.statusCode = 409;
    error.executionHealth = executionHealth;
    throw error;
  }

  const delegation = prepareAgentDelegation({
    assignmentId,
    executionAgent: selectedAgent,
    requireWriteApproved: role.requiresWriteApproval,
    notes: notes || `Prepared for supervised Codex ${role.label} terminal launch.`
  });
  if (delegation.status !== 'prepared' || (role.requiresWriteApproval && delegation.contract.mode !== 'write-approved')) {
    const error = new Error(delegation.handoff.blockedReasons?.join(' ') || `${role.label} launch requires write-approved handoff.`);
    error.statusCode = 409;
    error.delegation = delegation;
    throw error;
  }

  const repoPath = delegation.contract.repoPath;
  if (!repoPath || repoPath.startsWith('browser-selected:') || !existsSync(repoPath)) {
    const error = new Error('Codex worker launch requires a local absolute repository path captured by ODT repo analysis.');
    error.statusCode = 409;
    error.delegation = delegation;
    throw error;
  }

  const evidence = collectEvidence(assignmentId);
  const roleContract = role.requiresWriteApproval
    ? delegation.contract
    : {
      ...delegation.contract,
      mode: 'read-only',
      allowedActions: {
        ...delegation.contract.allowedActions,
        writeFiles: false,
        runTests: false,
        installDependencies: false,
        createBranch: false,
        raisePr: false,
        updateExternalSystems: false,
        destructiveActions: false
      }
    };
  const roleHandoff = {
    ...delegation.handoff,
    title: `${role.label} Codex Worker Handoff`,
    mode: roleContract.mode,
    workerRole: role.id,
    workerRoleLabel: role.label,
    allowedActions: roleContract.allowedActions,
    contract: roleContract,
    nextStep: role.requiresWriteApproval
      ? 'Run this write-approved worker only inside the approved target repository and return implementation evidence to ODT.'
      : 'Run this read-only worker for planning/review evidence. Do not edit files.'
  };
  const runDir = join(workspaceDir, sanitizeFileName(assignmentId), 'agent-runs', sanitizeFileName(delegation.runId), sanitizeFileName(role.id));
  mkdirSync(runDir, { recursive: true });
  const handoffFile = join(runDir, 'handoff.json');
  const promptFile = join(runDir, 'prompt.md');
  const scriptFile = join(runDir, 'launch-codex.sh');
  const responseFile = join(runDir, 'codex-response.md');
  const logFile = join(runDir, 'codex-launch.log');
  const statusFile = join(runDir, 'launch-status.json');
  const stopFile = join(runDir, 'stop-worker.request');
  const manualCommand = `bash ${shellQuote(scriptFile)}`;
  const skipGitRepoCheck = !isGitRepo(repoPath);
  const bundlePaths = { handoffFile, promptFile, scriptFile, responseFile, logFile, statusFile, stopFile };
  const workerRunId = createId('workerrun');

  writeFileSync(handoffFile, `${JSON.stringify(roleHandoff, null, 2)}\n`, 'utf8');
  writeFileSync(promptFile, `${buildWorkerPrompt({ handoff: roleHandoff, contract: roleContract, evidence, bundlePaths, workerRole: role })}\n`, 'utf8');
  writeFileSync(scriptFile, buildCodexLaunchScript({ repoPath, promptFile, responseFile, logFile, statusFile, stopFile, codexExecutable: executionHealth.executable, skipGitRepoCheck, sandboxMode: role.sandboxMode, workerRole: role }), 'utf8');
  chmodSync(scriptFile, 0o755);
  writeFileSync(responseFile, '', 'utf8');
  writeFileSync(logFile, '', 'utf8');

  const baseStatus = {
    generatedAt: new Date().toISOString(),
    assignmentId,
    workerRunId,
    runId: delegation.runId,
    executionAgent: selectedAgent,
    workerRole: role.id,
    workerRoleLabel: role.label,
    mode: roleContract.mode,
    sandboxMode: role.sandboxMode,
    requiresWriteApproval: role.requiresWriteApproval,
    status: launchMode === 'bundle-only' ? 'bundle_created' : 'starting',
    launchMode,
    targetRepoPath: repoPath,
    skipGitRepoCheck,
    executionHealth,
    codexExecutable: executionHealth.executable,
    bundleDir: runDir,
    handoffFile,
    promptFile,
    scriptFile,
    responseFile,
    logFile,
    statusFile,
    stopFile,
    manualCommand,
    note: launchMode === 'bundle-only'
      ? 'Worker bundle created without launching Terminal.'
      : 'Worker bundle created and Terminal launch requested.'
  };
  writeFileSync(statusFile, `${JSON.stringify(baseStatus, null, 2)}\n`, 'utf8');

  createRunEvent(delegation.runId, 'agent_worker_bundle_created', 'ok', {
    requestType: 'agent-worker-launch',
    executionAgent: selectedAgent,
    workerRole: role.id,
    workerRoleLabel: role.label,
    launchMode,
    sandboxMode: role.sandboxMode,
    bundleDir: runDir,
    promptFile,
    scriptFile,
    responseFile,
    logFile,
    manualCommand
  }, assignmentId);

	  if (launchMode === 'bundle-only') {
	    const workerRun = upsertAgentWorkerRunRecord({
	      id: workerRunId,
	      assignmentId,
	      runId: delegation.runId,
	      role,
	      executionAgent: selectedAgent,
	      mode: roleContract.mode,
	      sandboxMode: role.sandboxMode,
	      status: 'bundle_created',
	      launchMode,
	      bundlePaths: { ...bundlePaths, bundleDir: runDir },
	      manualCommand,
		      output: { summary: 'Worker bundle prepared without launching Terminal.', stopFile },
	      questions: []
	    });
	    createAgentEvent(assignmentId, selectedAgent, 'worker_launch_prepared', 'prepared', baseStatus);
	    return { status: 'prepared', launch: baseStatus, workerRun, delegation };
	  }

  try {
    const launcherPid = openVisibleTerminal(scriptFile, runDir, (error) => {
      if (!error) return;
      const failedStatus = {
        ...baseStatus,
        status: 'failed_to_open',
        error: error.message,
        manualFallback: true,
        updatedAt: new Date().toISOString()
      };
      writeFileSync(statusFile, `${JSON.stringify(failedStatus, null, 2)}\n`, 'utf8');
      createRunEvent(delegation.runId, 'agent_worker_launch_failed', 'error', failedStatus, assignmentId);
      createAgentEvent(assignmentId, selectedAgent, 'worker_launch_failed', 'error', failedStatus);
    });
    const launchedStatus = {
      ...baseStatus,
      status: 'delegated_visible',
      launcherPid,
      terminalApp: 'Terminal',
      updatedAt: new Date().toISOString(),
      note: `Opened a visible Terminal session for the Codex ${role.label} worker. Review changes and return evidence to ODT when complete.`
    };
    writeFileSync(statusFile, `${JSON.stringify(launchedStatus, null, 2)}\n`, 'utf8');
    const workerRun = upsertAgentWorkerRunRecord({
      id: workerRunId,
      assignmentId,
      runId: delegation.runId,
      role,
      executionAgent: selectedAgent,
      mode: roleContract.mode,
      sandboxMode: role.sandboxMode,
      status: 'running',
      launchMode,
      bundlePaths: { ...bundlePaths, bundleDir: runDir },
      manualCommand,
      output: { summary: launchedStatus.note, stopFile },
      questions: []
    });
    createRunEvent(delegation.runId, 'agent_worker_terminal_launched', 'running', launchedStatus, assignmentId);
    createAgentEvent(assignmentId, selectedAgent, 'worker_launch_prepared', 'running', launchedStatus);
    return { status: 'launched', launch: launchedStatus, workerRun, delegation };
  } catch (error) {
    const fallbackStatus = {
      ...baseStatus,
      status: 'manual_fallback',
      error: error.message,
      manualFallback: true,
      updatedAt: new Date().toISOString(),
      note: 'Terminal launch failed. Use the manual command from ODT to start the Codex worker.'
    };
    writeFileSync(statusFile, `${JSON.stringify(fallbackStatus, null, 2)}\n`, 'utf8');
    const workerRun = upsertAgentWorkerRunRecord({
      id: workerRunId,
      assignmentId,
      runId: delegation.runId,
      role,
      executionAgent: selectedAgent,
      mode: roleContract.mode,
      sandboxMode: role.sandboxMode,
      status: 'manual_fallback',
      launchMode,
      bundlePaths: { ...bundlePaths, bundleDir: runDir },
      manualCommand,
      output: { summary: fallbackStatus.note, error: error.message, stopFile },
      questions: []
    });
    createRunEvent(delegation.runId, 'agent_worker_manual_fallback', 'warning', fallbackStatus, assignmentId);
    createAgentEvent(assignmentId, selectedAgent, 'worker_launch_prepared', 'warning', fallbackStatus);
    return { status: 'manual_fallback', launch: fallbackStatus, workerRun, delegation };
  }
}

function parseAgentFoundryRow(row) {
  if (!row) return null;
  return {
    ...row,
    inputSources: parseJsonValue(row.inputSourcesJson, []),
    output: parseJsonValue(row.outputJson, {})
  };
}

function listAgentFoundryRuns(assignmentId = 'assignment-local-mvp') {
  const entries = statements.selectAgentFoundryRunsByAssignment.all(assignmentId).map(parseAgentFoundryRow);
  const grouped = new Map();
  entries.forEach((entry) => {
    if (!grouped.has(entry.runId)) {
      grouped.set(entry.runId, {
        runId: entry.runId,
        assignmentId: entry.assignmentId,
        phase: entry.phase,
        status: 'PASS',
        provider: entry.provider,
        model: entry.model,
        createdAt: entry.createdAt,
        domainCount: 0,
        domains: []
      });
    }
    const run = grouped.get(entry.runId);
    run.createdAt = entry.createdAt > run.createdAt ? entry.createdAt : run.createdAt;
    run.domainCount += 1;
    run.domains.push({
      id: entry.id,
      domainId: entry.domainId,
      domainLabel: entry.domainLabel,
      status: entry.status,
      summary: entry.output?.summary || '',
      specialistName: entry.output?.specialistName || '',
      createdAt: entry.createdAt
    });
    if (entry.status === 'NEEDS_REVIEW') run.status = 'NEEDS_REVIEW';
    if (entry.status === 'WARNING' && run.status === 'PASS') run.status = 'WARNING';
  });
  return {
    assignmentId,
    runs: Array.from(grouped.values())
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    entries
  };
}

function runAgentFoundry({ assignmentId = 'assignment-local-mvp', phase = 'full-sdlc', domainId = '', inputSources = [] } = {}) {
  const phaseConfig = getAgentFoundryPhase(phase);
  const selectedDomains = resolveAgentFoundryDomains({ phase: phaseConfig.id, domainId });
  const normalizedInputSources = Array.isArray(inputSources) && inputSources.length
    ? inputSources.map((item) => String(item).trim()).filter(Boolean)
    : ['requirement', 'repo-analysis', 'technical-design', 'implementation-plan', 'standards-evidence', 'artifact-evidence'];
  const evidence = collectEvidence(assignmentId);
  const runId = createId('foundryrun');
  const model = aiConfig.chatModelConfigured ? 'configured-server-side-chat-model' : 'local-foundry-model';
  const now = new Date().toISOString();
  const outputs = [];

  createRunEvent(runId, 'agent_foundry_started', 'running', {
    requestType: 'agent-foundry',
    assignmentId,
    phase: phaseConfig.id,
    domains: selectedDomains.map((domain) => domain.id),
    provider: aiConfig.provider,
    model
  }, assignmentId);

  selectedDomains.forEach((domain) => {
    const output = buildAgentFoundryOutput({
      domain,
      phase: phaseConfig.id,
      evidence,
      inputSources: normalizedInputSources,
      provider: aiConfig.provider,
      model
    });
    statements.insertAgentFoundryRun.run(
      createId('foundry'),
      runId,
      assignmentId,
      phaseConfig.id,
      domain.id,
      domain.label,
      JSON.stringify(normalizedInputSources),
      JSON.stringify(output),
      output.status,
      aiConfig.provider,
      model,
      now
    );
    outputs.push(output);
    createRunEvent(runId, 'agent_foundry_domain_completed', output.status === 'PASS' ? 'ok' : 'warning', {
      requestType: 'agent-foundry',
      assignmentId,
      domainId: domain.id,
      domainLabel: domain.label,
      specialistName: domain.specialist,
      status: output.status
    }, assignmentId);
  });

  const status = outputs.some((output) => output.status === 'NEEDS_REVIEW')
    ? 'NEEDS_REVIEW'
    : outputs.some((output) => output.status === 'WARNING')
      ? 'WARNING'
      : 'PASS';
  const summary = {
    label: 'AI-generated suggestion',
    humanReviewRequired: true,
    runId,
    assignmentId,
    phase: phaseConfig.id,
    phaseLabel: phaseConfig.label,
    status,
    domainsReviewed: outputs.length,
    generatedAt: now,
    nextAction: 'Review Agent Foundry evidence in Artifacts, then update the plan, standards review, or approval notes as needed.'
  };

  createRunEvent(runId, 'agent_foundry_completed', status === 'PASS' ? 'ok' : 'warning', {
    requestType: 'agent-foundry',
    assignmentId,
    phase: phaseConfig.id,
    status,
    domainsReviewed: outputs.length
  }, assignmentId);
  createAgentEvent(assignmentId, 'agent-foundry', 'foundry_review_completed', status.toLowerCase(), {
    runId,
    phase: phaseConfig.id,
    status,
    domainsReviewed: outputs.length,
    message: summary.nextAction
  });

  return {
    ...summary,
    outputs,
    groupedEvidence: listAgentFoundryRuns(assignmentId).runs.find((run) => run.runId === runId) || null
  };
}

function sanitizeFileName(name) {
  const cleaned = String(name || 'attachment')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'attachment';
}

function fileExtension(name) {
  const safe = sanitizeFileName(name).toLowerCase();
  const index = safe.lastIndexOf('.');
  return index >= 0 ? safe.slice(index) : '';
}

function classifyFileType(name, mimeType = '') {
  const ext = fileExtension(name);
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return 'mockup-image';
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'document';
  if (['.xlsx', '.xls', '.csv'].includes(ext)) return 'spreadsheet';
  if (['.json', '.yaml', '.yml'].includes(ext)) return 'api-sample';
  if (['.txt', '.md'].includes(ext)) return 'notes';
  if (ext === '.pptx') return 'presentation';
  if (String(mimeType).startsWith('image/')) return 'mockup-image';
  return 'context-file';
}

function validateUploadFile(file) {
  const name = sanitizeFileName(file.name);
  const ext = fileExtension(name);
  if (!uploadPolicy.allowedExtensions.includes(ext)) {
    throw new Error(`File "${name}" is not an allowed type. Allowed: ${uploadPolicy.allowedExtensions.join(', ')}`);
  }
  const bytes = Number(file.size || Math.floor(String(file.contentBase64 || '').length * 0.75));
  if (bytes > uploadPolicy.maxFileBytes) {
    throw new Error(`File "${name}" exceeds the ${Math.round(uploadPolicy.maxFileBytes / 1024 / 1024)} MB per-file limit.`);
  }
  return { name, ext, bytes };
}

function storeIntakeAssets({ assignmentId = 'assignment-local-mvp', files = [], sourceKind = 'upload' }) {
  if (!Array.isArray(files) || !files.length) {
    return { assignmentId, stored: [], rejected: [], uploadPolicy };
  }
  if (files.length > uploadPolicy.maxFilesPerRequest) {
    throw new Error(`Too many files. Maximum ${uploadPolicy.maxFilesPerRequest} files per request.`);
  }

  let totalBytes = 0;
  const validated = files.map((file) => {
    const next = validateUploadFile(file);
    totalBytes += next.bytes;
    return { ...file, ...next };
  });
  if (totalBytes > uploadPolicy.maxBatchBytes) {
    throw new Error(`Upload batch exceeds the ${Math.round(uploadPolicy.maxBatchBytes / 1024 / 1024)} MB batch limit.`);
  }

  const now = new Date().toISOString();
  const assetDir = join(workspaceDir, assignmentId, 'intake-assets');
  mkdirSync(assetDir, { recursive: true });

  const stored = validated.map((file) => {
    if (!file.contentBase64) {
      throw new Error(`File "${file.name}" is missing content.`);
    }
    const id = createId('asset');
    const storedName = `${id}-${file.name}`;
    const storedPath = join(assetDir, storedName);
    const bytes = Buffer.from(file.contentBase64, 'base64');
    if (bytes.length > uploadPolicy.maxFileBytes) {
      throw new Error(`File "${file.name}" exceeds the ${Math.round(uploadPolicy.maxFileBytes / 1024 / 1024)} MB per-file limit.`);
    }
    writeFileSync(storedPath, bytes);
    const fileType = classifyFileType(file.name, file.mimeType);
    statements.insertIntakeAsset.run(
      id,
      assignmentId,
      file.name,
      storedName,
      storedPath,
      file.mimeType || '',
      fileType,
      bytes.length,
      sourceKind,
      'stored',
      now
    );
    return {
      id,
      assignmentId,
      originalName: file.name,
      storedName,
      storedPath,
      mimeType: file.mimeType || '',
      fileType,
      bytes: bytes.length,
      sourceKind,
      status: 'stored',
      createdAt: now
    };
  });
  createRunEvent(createId('run'), 'intake_assets_stored', 'ok', { assignmentId, files: stored.length, totalBytes }, assignmentId);
  return {
    assignmentId,
    stored,
    uploadPolicy,
    workspacePath: assetDir,
    note: 'Files are copied into the ODT workbench workspace. The target repo is not modified by intake uploads.'
  };
}

function preparePrReadinessReport({ assignmentId, linkedJira = '', notes = '' }) {
  const evidence = collectEvidence(assignmentId);
  const latestCheck = evidence.standardsChecks[0];
  const unresolvedBlockers = getUnresolvedStandardsBlockers(evidence);
  const openReviewBlockers = getOpenReviewBlockers(evidence);
  const pendingDependencies = evidence.dependencyRequests.filter((request) => request.status === 'pending');
  const latestImplementationEvidence = evidence.implementationEvidence?.[0] || null;
  const allTests = (evidence.implementationEvidence || []).flatMap((record) => record.tests || []);
  const failedTests = allTests.filter((test) => test.status === 'failed');
  const acceptedImplementationRisk = (evidence.reviewComments || []).some((comment) => (
    comment.status === 'accepted_risk'
    && ['implementation', 'pr'].includes(comment.targetType)
  ));
  const blockingItems = [
    ...unresolvedBlockers.map((finding) => ({
      category: 'standards',
      message: finding.message,
      requiredAction: finding.recommendation
    })),
    ...openReviewBlockers.map((comment) => ({
      category: 'review',
      message: comment.comment,
      requiredAction: 'Resolve the blocker or accept risk with notes before PR readiness.'
    })),
    ...pendingDependencies.map((request) => ({
      category: 'dependency',
      message: `${request.packageName} is waiting for dependency approval.`,
      requiredAction: 'Approve or reject the dependency request before PR readiness.'
    })),
    ...(!latestImplementationEvidence ? [{
      category: 'implementation-evidence',
      message: 'No implementation evidence has been recorded.',
      requiredAction: 'Record changed files, commands, tests, and implementation notes after agent work.'
    }] : []),
    ...(failedTests.length && !acceptedImplementationRisk ? [{
      category: 'testing',
      message: `${failedTests.length} failed test result(s) are recorded without accepted risk.`,
      requiredAction: 'Fix failed tests or accept risk with explicit review notes.'
    }] : [])
  ];
  const readinessChecklist = [
    { label: 'Requirement and scope reviewed', checked: Boolean(evidence.requirements?.length || evidence.assignment?.requirement) },
    { label: 'Repo analysis attached', checked: Boolean(evidence.repoAnalysis?.length) },
    { label: 'Technical design prepared', checked: Boolean(evidence.technicalDesigns?.length) },
    { label: 'Implementation plan prepared', checked: Boolean(evidence.implementationPlans?.length) },
    { label: 'Standards check completed', checked: Boolean(latestCheck) },
    { label: 'Implementation evidence recorded', checked: Boolean(latestImplementationEvidence) },
    { label: 'Commands and test outcomes recorded', checked: Boolean(allTests.length || latestImplementationEvidence?.commands?.length) },
    { label: 'No unresolved standards blockers', checked: !unresolvedBlockers.length },
    { label: 'No open review blockers', checked: !openReviewBlockers.length },
    { label: 'Dependency decisions resolved', checked: !pendingDependencies.length },
    { label: 'Failed tests fixed or accepted as risk', checked: !failedTests.length || acceptedImplementationRisk },
    { label: 'Accessibility/security/testing notes included', checked: Boolean(latestCheck && latestImplementationEvidence) }
  ];
  const evidenceSummary = {
    requirements: evidence.requirements?.length || 0,
    repoAnalyses: evidence.repoAnalysis?.length || 0,
    technicalDesigns: evidence.technicalDesigns?.length || 0,
    implementationPlans: evidence.implementationPlans?.length || 0,
    standardsChecks: evidence.standardsChecks?.length || 0,
    implementationEvidence: evidence.implementationEvidence?.length || 0,
    reviewComments: evidence.reviewComments?.length || 0,
    approvals: evidence.approvals?.length || 0,
    dependencyRequests: evidence.dependencyRequests?.length || 0,
    testResults: allTests.length
  };
  const report = {
    title: `PR Readiness Pack: ${evidence.assignment?.title || assignmentId}`,
    prTitle: `${linkedJira ? `${linkedJira}: ` : ''}${evidence.assignment?.title || 'ODT governed implementation'}`,
    linkedJira,
    summary: 'Prepared governed evidence for requirement, repo analysis, standards review, implementation evidence, approvals, dependency decisions, tests, risks, and rollback.',
    status: blockingItems.length ? 'BLOCKED' : 'PR_READY_REVIEW',
    standardsStatus: latestCheck?.status || 'NOT_RUN',
    blockingItems,
    readinessChecklist,
    evidenceSummary,
    acceptanceMapping: [
      'Requirement analysis captured or ready for review.',
      'Standards review evidence is attached.',
      latestImplementationEvidence ? 'Implementation evidence records changed files, commands, and test outcomes.' : 'Implementation evidence is required before PR readiness.',
      'Approval/dependency decisions are auditable.',
      'Testing and accessibility notes are included or flagged.'
    ],
    implementationEvidence: latestImplementationEvidence ? {
      id: latestImplementationEvidence.id,
      status: latestImplementationEvidence.status,
      summary: latestImplementationEvidence.summary,
      changedFiles: latestImplementationEvidence.changedFiles || [],
      commands: latestImplementationEvidence.commands || [],
      tests: latestImplementationEvidence.tests || []
    } : null,
    testing: {
      planned: evidence.testPlans[0]?.planJson || {},
      recorded: allTests,
      failedTests,
      acceptedRisk: acceptedImplementationRisk
    },
    accessibilityNotes: 'Accessibility / VPAT / WCAG / Section 508 impact considered through standards evidence. Human review remains required.',
    securityNotes: 'Frontend-safe settings only; secrets and raw provider credentials remain backend-side.',
    dependencyNotes: pendingDependencies.length ? 'Pending dependency decisions must be resolved before PR readiness.' : 'No pending dependency decision blocks detected.',
    riskNotes: blockingItems.length ? blockingItems.map((item) => item.message) : ['Low to medium; validate with repo-specific tests before PR.'],
    rollbackNotes: 'Changes are isolated to odt-workbench-next and can be reverted without modifying the legacy dashboard.',
    reviewerNotes: notes,
    generatedAt: new Date().toISOString()
  };
  report.markdown = buildPrMarkdown(report);
  statements.insertPrReadinessReport.run(
    createId('prpack'),
    assignmentId,
    report.title,
    JSON.stringify(report),
    report.status,
    report.generatedAt
  );
  createRunEvent(createId('run'), 'pr_readiness_pack_prepared', report.status === 'BLOCKED' ? 'blocked' : 'ok', {
    assignmentId,
    status: report.status,
    blockingItems: blockingItems.length,
    checklistReady: readinessChecklist.filter((item) => item.checked).length,
    checklistTotal: readinessChecklist.length
  }, assignmentId);
  return report;
}

function tokenizeText(text) {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'what', 'when',
    'where', 'which', 'should', 'would', 'could', 'about', 'there', 'their',
    'have', 'need', 'needs', 'want', 'user', 'workbench', 'please'
  ]);
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9/_\-.]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token))
    .slice(0, 80);
}

function flattenEvidenceText(value, depth = 0) {
  if (value == null || depth > 3) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => flattenEvidenceText(item, depth + 1)).join('\n');
  return Object.entries(value)
    .slice(0, 40)
    .map(([key, next]) => `${key}: ${flattenEvidenceText(next, depth + 1)}`)
    .join('\n');
}

function splitKnowledgeChunks({ source, title, text, type = 'document' }) {
  const normalized = String(text || '').replace(/\r/g, '').trim();
  if (!normalized) return [];
  const sections = normalized
    .split(/\n(?=#{1,4}\s)|\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);
  const chunks = [];
  sections.forEach((section, index) => {
    if (section.length <= 1600) {
      chunks.push({ source, title, type, content: section, chunk: index + 1 });
      return;
    }
    for (let cursor = 0; cursor < section.length; cursor += 1400) {
      chunks.push({
        source,
        title,
        type,
        content: section.slice(cursor, cursor + 1600),
        chunk: `${index + 1}.${Math.floor(cursor / 1400) + 1}`
      });
    }
  });
  return chunks;
}

function readTextAssetExcerpt(asset) {
  const textLike = ['notes', 'api-sample'].includes(asset.fileType) || fileExtension(asset.originalName) === '.csv';
  if (!textLike) return '';
  if (!existsSync(asset.storedPath)) return '';
  try {
    return readFileSync(asset.storedPath, 'utf8').slice(0, 6000);
  } catch {
    return '';
  }
}

function buildKnowledgeCorpus(assignmentId = 'assignment-local-mvp') {
  const docs = [
    ['README', join(appRoot, 'README.md')],
    ['Governance Architecture', join(appRoot, 'docs', 'ODT-Governance-Architecture.md')],
    ['Developer Agent Handoff Plan', join(appRoot, 'docs', 'ODT-Developer-Agent-Handoff-Plan.md')],
    ['Oracle Standards Agent Guide', join(appRoot, 'docs', 'ODT-Oracle-Standards-Agent-Operating-Guide.md')],
    ['Accessibility VPAT WCAG Redwood Guide', join(appRoot, 'docs', 'ODT-Agent-Accessibility-VPAT-WCAG-Redwood-Guide.md')]
  ];
  const chunks = [];
  docs.forEach(([title, path]) => {
    if (!existsSync(path)) return;
    chunks.push(...splitKnowledgeChunks({
      source: path,
      title,
      type: 'doc',
      text: readFileSync(path, 'utf8')
    }));
  });

  chunks.push(...splitKnowledgeChunks({
    source: 'server/standards/odt-standards.json',
    title: 'Standards Registry',
    type: 'standards',
    text: JSON.stringify(loadStandardsRegistry(), null, 2)
  }));

  const evidence = collectEvidence(assignmentId);
  [
    ['Assignment Evidence', {
      assignment: evidence.assignment,
      requirements: evidence.requirements,
      repoAnalysis: evidence.repoAnalysis,
      latestStandardsFindings: evidence.standardsFindings.slice(0, 20),
      approvals: evidence.approvals.slice(0, 12),
      dependencyRequests: evidence.dependencyRequests.slice(0, 12),
      implementationEvidence: evidence.implementationEvidence.slice(0, 6),
      prReadinessReports: evidence.prReadinessReports.slice(0, 4)
    }],
    ['Intake Assets', evidence.intakeAssets.map((asset) => ({
      id: asset.id,
      originalName: asset.originalName,
      fileType: asset.fileType,
      bytes: asset.bytes,
      status: asset.status,
      excerpt: readTextAssetExcerpt(asset)
    }))],
    ['Upload Policy', uploadPolicy],
    ['Current Runtime Snapshot', {
      ai: safeAiConfig(),
      connectors: listConnectors()
    }]
  ].forEach(([title, value]) => {
    chunks.push(...splitKnowledgeChunks({
      source: `local-evidence:${title}`,
      title,
      type: 'evidence',
      text: flattenEvidenceText(value)
    }));
  });

  return chunks;
}

function rankKnowledge(query, corpus, limit = 6) {
  const tokens = tokenizeText(query);
  const uniqueTokens = Array.from(new Set(tokens));
  if (!uniqueTokens.length) return corpus.slice(0, limit);
  return corpus
    .map((chunk) => {
      const haystack = `${chunk.title}\n${chunk.source}\n${chunk.content}`.toLowerCase();
      const score = uniqueTokens.reduce((sum, token) => {
        const titleBoost = chunk.title.toLowerCase().includes(token) ? 4 : 0;
        const sourceBoost = chunk.source.toLowerCase().includes(token) ? 2 : 0;
        const matches = haystack.split(token).length - 1;
        return sum + titleBoost + sourceBoost + matches;
      }, 0);
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function inferGuideSteps(input, evidence) {
  const lower = String(input || '').toLowerCase();
  if (/(input|repo|repository|folder|upload|mockup|excel|pdf|docx|file|context)/.test(lower)) {
    return [
      'Open Intake and start with Project Setup.',
      'Paste the target repository or folder path and the base branch. Use Analyze Repo Read-only so ODT can detect framework, package manager, scripts, test tools, folders, and likely impacted files without modifying the repo.',
      'Paste the requirement or Jira details in Work Request, including acceptance criteria, backend/frontend scope, API samples, accessibility/security/performance expectations, and known constraints.',
      'Attach context files such as screenshots, mockups, PDF, DOCX, XLSX, CSV, JSON, YAML, Markdown, or text. ODT copies them into its own workbench workspace under workspaces/<assignment>/intake-assets and does not write them into the target repo.',
      'Run Extract Structure to create requirement analysis, gaps, and clarification questions.',
      'Generate the design and implementation plan, then run Standards Command Center before any write action.',
      'Approve write scope only after blockers, dependency requests, and standards findings are resolved or explicitly accepted with notes.'
    ];
  }
  if (/(artifact|open|evidence|pr pack|readiness)/.test(lower)) {
    return [
      'Open Artifacts to review the saved evidence catalog.',
      'Use Architecture Brief for technical design evidence, Implementation Blueprint for planned file/task scope, OpenAPI Contract for backend tool contract, Run Evidence for event history, Context Vault for uploaded files, and PR Readiness Pack for final review notes.',
      'For uploaded files, use Open File to view the copied workbench asset from the backend file endpoint.',
      'Before PR-ready status, confirm acceptance mapping, tests, accessibility notes, security notes, dependency notes, known risks, and rollback notes.'
    ];
  }
  if (/(rag|answer|question|q&a|qa|detail|steps|result)/.test(lower)) {
    return [
      'ODT Guide now uses a lightweight local knowledge corpus before answering.',
      'The corpus includes product docs, standards registry, assignment evidence, repo analysis, standards findings, approvals, PR packs, upload metadata, and text-like intake assets.',
      'Ask with the assignment context included when possible, then use the sources listed in the answer to decide whether to open Intake, Standards, Runs, or Artifacts next.'
    ];
  }
  return [
    'Capture the requirement and repo context first.',
    'Analyze the requirement and repository patterns.',
    'Resolve or acknowledge clarification gaps.',
    'Draft technical design, implementation plan, standards evidence, and test strategy.',
    'Approve write scope before Codex/Cline implementation and record verification evidence before PR readiness.'
  ];
}

function answerFromLocalRag(input, snapshot, assignmentId = 'assignment-local-mvp') {
  const evidence = collectEvidence(assignmentId);
  const corpus = buildKnowledgeCorpus(assignmentId);
  const sources = rankKnowledge(input, corpus, 6);
  const steps = inferGuideSteps(input, evidence);
  const assets = evidence.intakeAssets || [];
  const latestRepo = evidence.repoAnalysis?.[0]?.analysisJson;
  const latestCheck = evidence.standardsChecks?.[0];
  const sourceList = sources.length
    ? sources.map((source, index) => `${index + 1}. ${source.title} (${source.type})`).join('\n')
    : '1. Local ODT baseline workflow';

  return [
    'I checked the local ODT knowledge corpus and evidence trail before answering.',
    '',
    'Recommended steps:',
    ...steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    'What ODT has already captured:',
    `- Assignments: ${snapshot.assignments.length}`,
    `- Recent runs: ${snapshot.runs.length}`,
    `- AI requests today: ${snapshot.usageSummary.requestsToday}`,
    `- Latest repo analysis: ${latestRepo?.repoPath || 'not captured yet'}`,
    `- Intake context files: ${assets.length ? assets.map((asset) => `${asset.originalName} (${asset.fileType})`).join(', ') : 'none yet'}`,
    `- Latest standards gate: ${latestCheck?.status || 'not run yet'}`,
    '',
    'Safety and governance note:',
    '- Repo analysis is read-only by default.',
    '- Uploaded context is copied into the ODT workbench workspace, not the target repository.',
    '- Write/delegate actions, package installs, and external-system writes require explicit human approval.',
    '- Hard blockers remain frontend secrets, destructive actions, and unapproved dependencies.',
    '',
    'Sources used:',
    sourceList
  ].join('\n');
}

function localProviderContent(requestType, input, snapshot, assignmentId = 'assignment-local-mvp') {
  const text = String(input || '');
  const lower = text.toLowerCase();
  if (requestType === 'chat') {
    if (!text.trim()) return 'Ask ODT Guide about a requirement, a run, a review gate, or how to split frontend/backend work.';
    if (aiConfig.ragEnabled) {
      return answerFromLocalRag(text, snapshot, assignmentId);
    }
    if (lower.includes('plan') || lower.includes('implement')) {
      return 'Recommended path: capture the request in Intake, generate a draft plan, review risks and tests, approve write scope, then run implementation through Codex/Cline with ODT recording events and evidence.';
    }
    if (lower.includes('oci') || lower.includes('genai')) {
      return 'Use OCI GenAI behind the backend provider abstraction. React should only see safe status, while the backend owns credentials, model routing, token limits, fallback, and monitoring.';
    }
    if (lower.includes('mcp') || lower.includes('jira') || lower.includes('knowledge')) {
      return 'Treat MCP as an optional connector layer. Read actions can be enabled when configured, write actions require approval, and destructive actions stay blocked by default.';
    }
    return `ODT Guide sees ${snapshot.assignments.length} assignment(s), ${snapshot.runs.length} recent run(s), and ${snapshot.usageSummary.requestsToday} AI request(s) today. Next best action: create or review a plan before approving any write/delegate step.`;
  }
  if (requestType === 'summarize') {
    return `Summary: ${text.slice(0, 900)}${text.length > 900 ? '...' : ''}`;
  }
  if (requestType === 'extract-json') {
    const title = text.split('\n').map((line) => line.trim()).find(Boolean) || 'Untitled work item';
    return {
      title: title.slice(0, 120),
      scope: ['frontend', 'backend', 'governance'].filter((term) => lower.includes(term)),
      risks: [
        'Human approval required before write or external-system actions',
        'Provider configuration must remain backend-only'
      ],
      acceptanceCriteria: [
        'Every V1 page renders',
        'AI request usage is logged',
        'OpenAPI schema is available'
      ],
      needsHumanReview: true
    };
  }
  if (requestType === 'classify') {
    const category = lower.includes('database') || lower.includes('sqlite') || lower.includes('oracle db')
      ? 'data-platform'
      : lower.includes('api') || lower.includes('backend')
        ? 'backend'
        : lower.includes('ui') || lower.includes('react')
          ? 'frontend'
          : lower.includes('test')
            ? 'quality'
            : 'workflow';
    return { category, confidence: 0.78, needsReview: category === 'data-platform' };
  }
  if (requestType === 'recommend') {
    return [
      'Keep the generated dashboard untouched and build in odt-workbench-next.',
      'Route all AI capabilities through backend APIs.',
      'Log token, latency, model, provider, status, and fallback usage.',
      'Use approval gates for write/delegate actions.',
      'Keep MCP optional, read-only by default, and audited.'
    ];
  }
  if (requestType === 'embed') {
    const source = text || 'odt-workbench';
    const vector = Array.from({ length: 24 }, (_, index) => {
      const code = source.charCodeAt(index % source.length) || 0;
      return Number((((code + index * 17) % 101) / 101).toFixed(4));
    });
    return { embedding: vector, dimensions: vector.length, provider: 'local-placeholder' };
  }
  return 'Unsupported AI request type.';
}

async function handleAiRequest(response, requestType, body) {
  const requestId = createId('aireq');
  const runId = createId('run');
  const startedAt = Date.now();
  const input = extractInput(body);
  const assignmentId = body.assignmentId || null;
  const sessionId = body.sessionId || 'local-session';
  const model = requestType === 'embed'
    ? (aiConfig.embedModelConfigured ? 'configured-server-side-embed-model' : 'local-placeholder-embed')
    : (aiConfig.chatModelConfigured ? 'configured-server-side-chat-model' : 'local-guide-model');

  try {
    assertInputLimit(input);
    createRunEvent(runId, 'request_received', 'running', { requestId, requestType, provider: aiConfig.provider }, assignmentId);
    createRunEvent(runId, 'provider_selected', 'running', { provider: aiConfig.provider, model, fallbackUsed: aiConfig.provider === 'local' }, assignmentId);
    const snapshot = await buildSnapshot();
    const content = localProviderContent(requestType, input, snapshot, assignmentId || 'assignment-local-mvp');
    const serializedContent = typeof content === 'string' ? content : JSON.stringify(content);
    const latencyMs = Date.now() - startedAt;
    const promptTokens = estimateTokens(input);
    const completionTokens = estimateTokens(serializedContent);
    const usage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };

    statements.insertAiUsage.run(
      createId('usage'),
      requestId,
      runId,
      sessionId,
      body.userId || null,
      requestType,
      aiConfig.provider,
      model,
      String(input || '').length,
      usage.promptTokens,
      usage.completionTokens,
      usage.totalTokens,
      latencyMs,
      'ok',
      null,
      aiConfig.provider === 'local' ? 1 : 0,
      new Date().toISOString()
    );

    if (requestType === 'chat') {
      statements.insertChat.run(createId('msg'), assignmentId, sessionId, 'user', input, aiConfig.provider, model, new Date().toISOString());
      statements.insertChat.run(createId('msg'), assignmentId, sessionId, 'assistant', serializedContent, aiConfig.provider, model, new Date().toISOString());
    }

    createRunEvent(runId, 'response_generated', 'ok', { requestId, requestType, model, latencyMs }, assignmentId);
    createRunEvent(runId, 'usage_logged', 'ok', { requestId, totalTokens: usage.totalTokens, provider: aiConfig.provider, model }, assignmentId);

    sendJson(response, 200, {
      provider: aiConfig.provider,
      model,
      requestType,
      content,
      usage,
      latencyMs,
      requestId,
      runId,
      error: null
    });
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const promptTokens = estimateTokens(input);
    statements.insertAiUsage.run(
      createId('usage'),
      requestId,
      runId,
      sessionId,
      body.userId || null,
      requestType,
      aiConfig.provider,
      model,
      String(input || '').length,
      promptTokens,
      0,
      promptTokens,
      latencyMs,
      'error',
      error.message,
      aiConfig.provider === 'local' ? 1 : 0,
      new Date().toISOString()
    );
    createRunEvent(runId, 'request_failed', 'error', { requestId, requestType, error: error.message, latencyMs }, assignmentId);
    sendJson(response, 400, {
      provider: aiConfig.provider,
      model,
      requestType,
      content: null,
      usage: { promptTokens, completionTokens: 0, totalTokens: promptTokens },
      latencyMs,
      requestId,
      runId,
      error: error.message
    });
  }
}

function buildOpenApiSchema() {
  const jsonContent = (schema) => ({ 'application/json': { schema } });
  const aiOperation = (operationId, summary, description, requestType) => ({
    operationId,
    summary,
    description,
    requestBody: {
      required: true,
      content: jsonContent({
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Text, requirement, ticket detail, document excerpt, or prompt input.' },
          sessionId: { type: 'string', description: 'Optional session id for grouping chat and monitoring events.' },
          assignmentId: { type: 'string', description: 'Optional assignment id associated with this request.' }
        },
        required: ['input']
      })
    },
    responses: {
      200: {
        description: `Normalized ${requestType} AI response with usage metadata.`,
        content: jsonContent(normalizedAiResponseSchema())
      },
      400: {
        description: 'Invalid request or configured input limit exceeded.',
        content: jsonContent(normalizedAiResponseSchema())
      }
    }
  });

  return {
    openapi: '3.0.3',
    info: {
      title: 'ODT Workbench Next API',
      version: '0.1.0',
      description: 'Backend-governed API for ODT Workbench AI capabilities, settings, monitoring, runs, OpenAPI tools, and optional connector gateways.'
    },
    servers: [{ url: `http://127.0.0.1:${port}`, description: 'Local ODT Workbench Next API' }],
    paths: {
      '/api/health': {
        get: {
          operationId: 'getWorkbenchHealth',
          summary: 'Get workbench health',
          description: 'Returns safe backend, database, ODT context, and AI configuration status.',
          responses: { 200: { description: 'Workbench health response.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/snapshot': {
        get: {
          operationId: 'getWorkbenchSnapshot',
          summary: 'Get workbench snapshot',
          description: 'Returns assignments, run summaries, usage summary, connector status, and ODT local context.',
          responses: { 200: { description: 'Current workbench snapshot.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/ai/chat': { post: aiOperation('postAiChat', 'Chat with ODT Guide', 'Answers ODT workflow, architecture, run, and next-step questions.', 'chat') },
      '/api/ai/summarize': { post: aiOperation('postAiSummarize', 'Summarize input', 'Summarizes requirements, tickets, artifacts, review notes, or logs.', 'summarize') },
      '/api/ai/extract-json': { post: aiOperation('postAiExtractJson', 'Extract structured JSON', 'Extracts structured task fields from unstructured text.', 'extract-json') },
      '/api/ai/classify': { post: aiOperation('postAiClassify', 'Classify work item', 'Classifies request layer, risk area, or work type.', 'classify') },
      '/api/ai/recommend': { post: aiOperation('postAiRecommend', 'Recommend next actions', 'Generates governed recommendations for implementation, review, and verification.', 'recommend') },
      '/api/ai/embed': { post: aiOperation('postAiEmbed', 'Create embedding', 'Creates placeholder local embeddings for future vector/RAG flows.', 'embed') },
      '/api/intake/upload-policy': {
        get: {
          operationId: 'getIntakeUploadPolicy',
          summary: 'Get intake upload policy',
          description: 'Returns allowed file extensions, max files, per-file and batch limits, and workspace storage note.',
          responses: { 200: { description: 'Upload policy response.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/intake/assets': {
        post: {
          operationId: 'storeIntakeAssets',
          summary: 'Store intake context assets',
          description: 'Copies user-provided context files into the ODT workbench workspace without modifying the target repository.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id for evidence storage.' },
                sourceKind: { type: 'string', description: 'Source label such as upload, mockup, document, or api-sample.' },
                files: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      mimeType: { type: 'string' },
                      size: { type: 'integer' },
                      contentBase64: { type: 'string', description: 'Base64 encoded file content.' }
                    },
                    required: ['name', 'contentBase64']
                  }
                }
              },
              required: ['files']
            })
          },
          responses: {
            200: { description: 'Stored intake assets.', content: jsonContent({ type: 'object' }) },
            400: { description: 'Upload policy violation or invalid file payload.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/intake/assets/{assignmentId}': {
        get: {
          operationId: 'listIntakeAssets',
          summary: 'List intake assets',
          description: 'Returns copied context files for an assignment.',
          parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Assignment id.' }],
          responses: { 200: { description: 'Intake asset list.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/intake/assets/{assetId}/file': {
        get: {
          operationId: 'openIntakeAssetFile',
          summary: 'Open copied intake asset',
          description: 'Streams a copied intake asset from the ODT workbench workspace.',
          parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'string' }, description: 'Asset id.' }],
          responses: { 200: { description: 'Raw copied file content.' }, 404: { description: 'Asset not found.' } }
        }
      },
      '/api/intake/analyze': {
        post: {
          operationId: 'analyzeIntake',
          summary: 'Analyze requirement intake',
          description: 'Creates deterministic requirement analysis, gaps, non-functional expectations, and clarification questions for an assignment.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id for evidence storage.' },
                input: { type: 'string', description: 'Requirement, Jira detail, user story, defect, or enhancement text.' },
                sourceType: { type: 'string', description: 'Source label such as manual, jira, or document.' }
              }
            })
          },
          responses: { 200: { description: 'Requirement analysis artifact.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/repo/analyze': {
        post: {
          operationId: 'analyzeRepository',
          summary: 'Analyze repository in read-only mode',
          description: 'Detects local repo signals such as package manager, frameworks, scripts, test tools, likely folders, and impacted files.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id for evidence storage.' },
                repoPath: { type: 'string', description: 'Local repository path to inspect in read-only mode.' }
              }
            })
          },
          responses: { 200: { description: 'Repository analysis artifact.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/repo/select-folder': {
        post: {
          operationId: 'selectRepositoryFolder',
          summary: 'Select local repository folder',
          description: 'Opens a local native folder picker on supported desktop environments and returns the selected path for read-only repository analysis.',
          responses: {
            200: { description: 'Selected local folder path.', content: jsonContent({ type: 'object' }) },
            400: { description: 'Folder selection was cancelled.', content: jsonContent({ type: 'object' }) },
            501: { description: 'Native folder picker is unsupported on this platform.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/design/draft': {
        post: {
          operationId: 'draftTechnicalDesign',
          summary: 'Draft technical design',
          description: 'Creates a reviewable technical design with scope, architecture, accessibility, security, testing, rollback, and flexibility notes.',
          requestBody: {
            required: false,
            content: jsonContent({ type: 'object' })
          },
          responses: { 200: { description: 'Technical design draft.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/plan/draft': {
        post: {
          operationId: 'draftImplementationPlan',
          summary: 'Draft implementation plan',
          description: 'Creates a standards-aware implementation plan, test plan, file scope, approval requirements, and risk notes.',
          requestBody: {
            required: false,
            content: jsonContent({ type: 'object' })
          },
          responses: { 200: { description: 'Implementation plan draft.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/standards': {
        get: {
          operationId: 'listStandards',
          summary: 'List standards registry',
          description: 'Returns local ODT standards, source documents, policy config, and controlled flexibility rules.',
          responses: { 200: { description: 'Standards registry response.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/standards/check': {
        post: {
          operationId: 'runStandardsCheck',
          summary: 'Run standards review for an assignment',
          description: 'Checks a technical design, implementation plan, or implementation evidence against configured ODT standards and stores findings.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id to attach evidence to.' },
                phase: { type: 'string', description: 'pre-implementation or post-implementation.' },
                artifact: { type: 'object', description: 'Plan, design, code review notes, or PR evidence to evaluate.' },
                writeApproved: { type: 'boolean', description: 'Whether write approval has been captured for the latest standards review.' }
              }
            })
          },
          responses: { 200: { description: 'Persisted standards review.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/standards/checks/{assignmentId}': {
        get: {
          operationId: 'listStandardsChecks',
          summary: 'List standards checks for assignment',
          description: 'Returns standards checks and findings for a specific assignment.',
          parameters: [{
            name: 'assignmentId',
            in: 'path',
            required: true,
            description: 'Assignment id.',
            schema: { type: 'string' }
          }],
          responses: { 200: { description: 'Standards checks and findings.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/approvals': {
        post: {
          operationId: 'createApproval',
          summary: 'Record approval event',
          description: 'Stores human approval, warning override, write scope approval, or block decision as auditable evidence.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string' },
                approvalType: { type: 'string', description: 'standards_warning_override, write_scope, block_implementation, or similar.' },
                status: { type: 'string', description: 'approved, rejected, blocked, or needs_changes.' },
                approvedBy: { type: 'string' },
                notes: { type: 'string' }
              }
            })
          },
          responses: { 200: { description: 'Approval event stored.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/review/comments': {
        post: {
          operationId: 'createReviewComment',
          summary: 'Create review comment',
          description: 'Stores a human review comment against a plan, design, standards finding, handoff, implementation, or PR package.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id to attach review evidence to.' },
                targetType: { type: 'string', enum: ['plan', 'design', 'standards', 'handoff', 'pr', 'implementation'], description: 'Artifact or workflow area being reviewed.' },
                targetId: { type: 'string', description: 'Optional artifact id or finding id.' },
                severity: { type: 'string', enum: ['comment', 'warning', 'blocker'], description: 'Review severity.' },
                comment: { type: 'string', description: 'Reviewer note, required action, or accepted-risk rationale.' },
                status: { type: 'string', enum: ['open', 'resolved', 'accepted_risk'], description: 'Initial review comment status.' },
                createdBy: { type: 'string', description: 'Reviewer id or local user label.' },
                resolutionNotes: { type: 'string', description: 'Optional resolution or accepted-risk notes.' }
              },
              required: ['comment']
            })
          },
          responses: {
            200: { description: 'Review comment stored.', content: jsonContent({ type: 'object' }) },
            400: { description: 'Invalid review comment.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/review/comments/{commentId}/status': {
        post: {
          operationId: 'updateReviewCommentStatus',
          summary: 'Update review comment status',
          description: 'Marks a review comment as resolved, accepted risk, or reopened for continued rework.',
          parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Review comment id.' }],
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['open', 'resolved', 'accepted_risk'], description: 'Next review status.' },
                resolutionNotes: { type: 'string', description: 'Resolution note or accepted-risk rationale.' }
              },
              required: ['status']
            })
          },
          responses: {
            200: { description: 'Review comment updated.', content: jsonContent({ type: 'object' }) },
            404: { description: 'Review comment not found.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/review/comments/{commentId}/rework-relay': {
        post: {
          operationId: 'sendReviewCommentToReworkRelay',
          summary: 'Send review comment to rework relay',
          description: 'Creates or returns a durable Agent Relay Item that routes an open warning or blocker review comment to the Senior Full Stack Dev Rework lane. Review comments remain the human source of truth; relay items are injected into the next worker prompt.',
          parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Open review comment id to route for rework.' }],
          requestBody: {
            required: false,
            content: jsonContent({
              type: 'object',
              properties: {
                requestedBy: { type: 'string', description: 'Human or system actor requesting rework relay routing.' }
              }
            })
          },
          responses: {
            200: { description: 'Rework relay item created or returned.', content: jsonContent({ type: 'object' }) },
            404: { description: 'Review comment not found.', content: jsonContent({ type: 'object' }) },
            409: { description: 'Only open review comments can be sent to rework relay.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/review/rework': {
        post: {
          operationId: 'requestPlanRework',
          summary: 'Request plan rework',
          description: 'Captures a blocker review comment, records a needs-changes decision, drafts revised design and implementation plan artifacts, and runs a new standards review that invalidates stale write approval.',
          requestBody: {
            required: false,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id to rework.' },
                targetType: { type: 'string', enum: ['plan', 'design', 'standards', 'handoff', 'pr', 'implementation'], description: 'Area that needs rework.' },
                notes: { type: 'string', description: 'Reviewer notes explaining what must change before approval.' }
              }
            })
          },
          responses: {
            200: { description: 'Reworked design, plan, standards check, and review comment evidence.', content: jsonContent({ type: 'object' }) },
            400: { description: 'Invalid rework request.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/implementation/evidence': {
        post: {
          operationId: 'recordImplementationEvidence',
          summary: 'Record implementation evidence',
          description: 'Stores changed files, commands, test outcomes, and implementation notes after a governed Codex/Cline/manual handoff. A post-implementation standards check is run by default.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id to attach evidence to.' },
                runId: { type: 'string', description: 'Optional handoff or execution run id.' },
                phase: { type: 'string', description: 'Implementation phase label.' },
                changedFiles: { type: 'array', items: { type: 'string' }, description: 'Files changed by the implementation.' },
                commands: { type: 'array', items: { type: 'string' }, description: 'Build, test, lint, or verification commands that were run.' },
                tests: {
                  type: 'array',
                  description: 'Recorded test outcomes.',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      command: { type: 'string' },
                      status: { type: 'string', enum: ['passed', 'failed', 'skipped', 'not_run', 'unknown'] },
                      notes: { type: 'string' }
                    }
                  }
                },
                summary: { type: 'string', description: 'Implementation summary or reviewer notes.' },
                status: { type: 'string', description: 'recorded, needs_review, failed, or similar.' },
                createdBy: { type: 'string', description: 'Developer or agent label.' },
                runPostCheck: { type: 'boolean', description: 'When false, stores evidence without running post-implementation standards check.' }
              }
            })
          },
          responses: {
            200: { description: 'Implementation evidence and optional post-check result.', content: jsonContent({ type: 'object' }) },
            400: { description: 'Invalid implementation evidence.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/implementation/post-check': {
        post: {
          operationId: 'runPostImplementationCheck',
          summary: 'Run post-implementation standards check',
          description: 'Runs a standards review using the latest recorded implementation evidence for an assignment.',
          requestBody: {
            required: false,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id to check.' },
                evidenceId: { type: 'string', description: 'Optional implementation evidence id. Defaults to latest evidence.' }
              }
            })
          },
          responses: {
            200: { description: 'Post-implementation standards check result.', content: jsonContent({ type: 'object' }) },
            400: { description: 'Implementation evidence missing or invalid.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/implementation/evidence/from-worker/{workerRunId}': {
        post: {
          operationId: 'recordImplementationEvidenceFromWorker',
          summary: 'Record implementation evidence from worker output',
          description: 'Extracts changed files, commands, test outcomes, and summary from an ingested Codex/Cline worker response and stores them as implementation evidence for post-implementation standards review.',
          parameters: [{ name: 'workerRunId', in: 'path', required: true, schema: { type: 'string' }, description: 'Worker run id to extract evidence from.' }],
          requestBody: {
            required: false,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id.' },
                runPostCheck: { type: 'boolean', description: 'When false, stores evidence without running post-implementation standards check.' }
              }
            })
          },
          responses: {
            200: { description: 'Implementation evidence derived from worker output.', content: jsonContent({ type: 'object' }) },
            409: { description: 'Worker output was missing or insufficient.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/implementation/evidence/{assignmentId}': {
        get: {
          operationId: 'listImplementationEvidence',
          summary: 'List implementation evidence',
          description: 'Returns recorded changed files, commands, tests, and summaries for an assignment.',
          parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Assignment id.' }],
          responses: { 200: { description: 'Implementation evidence list.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/dependencies/request': {
        post: {
          operationId: 'requestDependency',
          summary: 'Request dependency approval',
          description: 'Creates a dependency request. Installation remains blocked until explicitly approved.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string' },
                packageName: { type: 'string' },
                version: { type: 'string' },
                license: { type: 'string' },
                reason: { type: 'string' },
                alternatives: { type: 'string' }
              },
              required: ['packageName', 'reason']
            })
          },
          responses: {
            200: { description: 'Dependency request created.', content: jsonContent({ type: 'object' }) },
            400: { description: 'Missing package name or reason.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/dependencies/{id}/approve': {
        post: {
          operationId: 'approveDependency',
          summary: 'Approve dependency request',
          description: 'Records developer approval for a dependency request.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Dependency request id.' }],
          responses: { 200: { description: 'Dependency approved.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/dependencies/{id}/reject': {
        post: {
          operationId: 'rejectDependency',
          summary: 'Reject dependency request',
          description: 'Records rejection for a dependency request.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Dependency request id.' }],
          responses: { 200: { description: 'Dependency rejected.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/pr/prepare': {
        post: {
          operationId: 'preparePr',
          summary: 'Prepare PR readiness pack',
          description: 'Generates a PR-ready summary package with blockers, evidence checklist, copyable Markdown, testing, accessibility, security, dependency, risk, and rollback notes.',
          requestBody: {
            required: false,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id to prepare.' },
                linkedJira: { type: 'string', description: 'Optional Jira id or URL to include in PR Markdown.' },
                notes: { type: 'string', description: 'Reviewer notes to include in the PR package.' }
              }
            })
          },
          responses: { 200: { description: 'PR readiness pack.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/workflow/state/{assignmentId}': {
        get: {
          operationId: 'getWorkflowState',
          summary: 'Get workflow state',
          description: 'Derives the current governed workflow state, next action, blocked reasons, completed milestones, and allowed transitions from assignment evidence.',
          parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Assignment id.' }],
          responses: { 200: { description: 'Derived workflow state.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/assignments/{assignmentId}/evidence': {
        get: {
          operationId: 'getAssignmentEvidence',
          summary: 'Get assignment evidence trail',
          description: 'Returns requirements, repo analysis, designs, plans, standards checks, findings, approvals, dependency requests, review comments, implementation evidence, test plans, and PR reports.',
          parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Assignment id.' }],
          responses: { 200: { description: 'Assignment evidence bundle.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/assignments/{assignmentId}/agent-contract': {
        get: {
          operationId: 'getAgentContract',
          summary: 'Get governed agent handoff contract',
          description: 'Returns read-only or write-approved allowed actions and attached standards context for Codex/Cline handoff. Write-approved mode requires approval after the latest standards check.',
          parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Assignment id.' }],
          responses: { 200: { description: 'Agent handoff contract.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/agents/delegate': {
        post: {
          operationId: 'delegateAgentHandoff',
          summary: 'Prepare governed agent handoff run',
          description: 'Creates auditable run and agent evidence for a Codex/Cline/manual handoff without executing code. Write-approved delegation requires approval after the latest standards check.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id to delegate.' },
                executionAgent: { type: 'string', description: 'codex, cline, or manual.' },
                requireWriteApproved: { type: 'boolean', description: 'When true, block unless the current agent contract is write-approved.' },
                notes: { type: 'string', description: 'Human review or delegation notes.' }
              }
            })
          },
          responses: {
            200: { description: 'Agent handoff run prepared.', content: jsonContent({ type: 'object' }) },
            409: { description: 'Delegation blocked by governance.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/agents/worker-roles': {
        get: {
          operationId: 'listWorkerRoles',
          summary: 'List governed worker lanes',
          description: 'Returns the allowlisted ODT Agent Team worker lanes, access mode, approval requirement, and execution purpose. Engines such as Codex, Cline, or OCI GenAI can use this registry to build governed worker prompts.',
          responses: { 200: { description: 'Worker lane registry.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/agents/execution-health': {
        get: {
          operationId: 'getExecutionAdapterHealth',
          summary: 'Get execution adapter health',
          description: 'Checks governed worker execution adapters such as Codex CLI and reports provider readiness, authentication ownership, launch support, and latest adapter issues without exposing secrets.',
          parameters: [{ name: 'assignmentId', in: 'query', required: false, schema: { type: 'string' }, description: 'Assignment id used to collect recent adapter issues.' }],
          responses: {
            200: { description: 'Execution adapter health and recent issues.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/agents/launch-worker': {
        post: {
          operationId: 'launchCodexWorker',
          summary: 'Launch governed Codex worker',
          description: 'Creates a write-approved Codex worker bundle and launches a visible macOS Terminal session. The endpoint is allowlisted for Codex only and refuses launch unless the current ODT contract is write-approved.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id to launch.' },
                executionAgent: { type: 'string', enum: ['codex'], description: 'Allowlisted execution agent. Only codex is wired for terminal launch in this slice.' },
                workerRole: { type: 'string', enum: ['lead-planner', 'fullstack-dev', 'backend-dev', 'frontend-dev', 'reviewer', 'build-verifier'], description: 'ODT Agent Team lane to launch. Advisory roles run read-only; implementation roles require write approval.' },
                launchMode: { type: 'string', enum: ['terminal', 'bundle-only'], description: 'Use terminal for real launch or bundle-only for smoke validation/manual handoff.' },
                notes: { type: 'string', description: 'Human launch notes to attach to handoff evidence.' }
              }
            })
          },
          responses: {
            200: { description: 'Codex worker bundle prepared and launch requested or bundle-only prepared.', content: jsonContent({ type: 'object' }) },
            400: { description: 'Unsupported worker type or launch mode.', content: jsonContent({ type: 'object' }) },
            409: { description: 'Worker launch blocked by governance or missing local repo path.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/agents/worker-runs/{assignmentId}': {
        get: {
          operationId: 'listAgentWorkerRuns',
          summary: 'List agent worker runs',
          description: 'Returns the durable Agent Team worker run queue, launch paths, statuses, parsed outputs, and cross-lane questions for an assignment.',
          parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Assignment id.' }],
          responses: { 200: { description: 'Worker runs for the assignment.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/agents/worker-runs/{workerRunId}/ingest': {
        post: {
	          operationId: 'ingestAgentWorkerOutput',
          summary: 'Ingest worker output',
          description: 'Reads the worker response file, stores parsed output as evidence, extracts cross-lane questions, and marks the worker completed or needing input.',
          parameters: [{ name: 'workerRunId', in: 'path', required: true, schema: { type: 'string' }, description: 'Worker run id.' }],
          requestBody: {
            required: false,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id for ownership verification.' }
              }
            })
          },
          responses: {
            200: { description: 'Worker output ingested.', content: jsonContent({ type: 'object' }) },
            404: { description: 'Worker run not found.', content: jsonContent({ type: 'object' }) },
            409: { description: 'Worker response is not available yet.', content: jsonContent({ type: 'object' }) }
	          }
	        }
	      },
	      '/api/agents/worker-runs/{workerRunId}/status': {
	        post: {
	          operationId: 'refreshAgentWorkerStatus',
	          summary: 'Refresh worker launch status',
	          description: 'Reads the worker launch-status.json, response file, and log file to update the durable worker run status without ingesting final output.',
	          parameters: [{ name: 'workerRunId', in: 'path', required: true, schema: { type: 'string' }, description: 'Worker run id.' }],
	          requestBody: {
	            required: false,
	            content: jsonContent({
	              type: 'object',
	              properties: {
	                assignmentId: { type: 'string', description: 'Assignment id for ownership verification.' }
	              }
	            })
	          },
	          responses: {
	            200: { description: 'Worker status refreshed.', content: jsonContent({ type: 'object' }) },
	            404: { description: 'Worker run not found.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/agents/worker-runs/{workerRunId}/stop': {
        post: {
          operationId: 'requestAgentWorkerStop',
          summary: 'Request worker stop',
          description: 'Creates a governed stop request for a running worker. For workers launched with the ODT stop-aware script, the script observes the stop file and terminates. For older/manual workers, ODT records the stop request and returns manual guidance.',
          parameters: [{ name: 'workerRunId', in: 'path', required: true, schema: { type: 'string' }, description: 'Worker run id.' }],
          requestBody: {
            required: false,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id.' },
                requestedBy: { type: 'string', description: 'User requesting the stop.' },
                reason: { type: 'string', description: 'Reason for stopping the worker.' }
              }
            })
          },
          responses: {
            200: { description: 'Worker stop request recorded.', content: jsonContent({ type: 'object' }) },
            404: { description: 'Worker run not found.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/agents/relay/{assignmentId}': {
	        get: {
	          operationId: 'listAgentRelayItems',
	          summary: 'List agent relay items',
	          description: 'Returns first-class cross-lane relay evidence created from worker questions, review needs, and human decisions for the assignment.',
	          parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Assignment id.' }],
	          responses: { 200: { description: 'Relay items for the assignment.', content: jsonContent({ type: 'object' }) } }
	        }
	      },
	      '/api/agents/relay/{relayItemId}/decision': {
	        post: {
	          operationId: 'decideAgentRelayItem',
	          summary: 'Record relay decision',
	          description: 'Assigns, answers, resolves, or reopens a cross-lane relay item while keeping source worker output immutable evidence.',
	          parameters: [{ name: 'relayItemId', in: 'path', required: true, schema: { type: 'string' }, description: 'Relay item id.' }],
	          requestBody: {
	            required: true,
	            content: jsonContent({
	              type: 'object',
	              properties: {
	                assignmentId: { type: 'string', description: 'Assignment id for ownership verification.' },
	                action: { type: 'string', enum: ['answer', 'assign', 'resolve', 'reopen'], description: 'Relay lifecycle action.' },
	                decision: { type: 'string', description: 'Human decision or answer notes.' },
	                targetWorkerRole: { type: 'string', enum: ['lead-planner', 'fullstack-dev', 'backend-dev', 'frontend-dev', 'reviewer', 'build-verifier'], description: 'Worker lane that should receive this context.' },
	                targetLane: { type: 'string', description: 'Human-readable target lane label.' },
	                decidedBy: { type: 'string', description: 'Human or system actor recording the decision.' }
	              }
	            })
	          },
	          responses: {
	            200: { description: 'Relay decision recorded.', content: jsonContent({ type: 'object' }) },
	            400: { description: 'Invalid relay decision.', content: jsonContent({ type: 'object' }) },
	            404: { description: 'Relay item not found.', content: jsonContent({ type: 'object' }) }
	          }
	        }
	      },
	      '/api/agent-foundry/domains': {
	        get: {
          operationId: 'listAgentFoundryDomains',
          summary: 'List Agent Foundry specialist domains',
          description: 'Returns the governed ODT Agent Foundry specialist domains and phase options. These are advisory review domains, not autonomous write agents.',
          responses: { 200: { description: 'Agent Foundry domain registry.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/agent-foundry/run': {
        post: {
          operationId: 'runAgentFoundryReview',
          summary: 'Run governed specialist review',
          description: 'Runs Full SDLC or focused specialist domain review and stores outputs as assignment evidence. Results are AI-generated suggestions and require human review before write or delegate actions.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id to review.' },
                phase: { type: 'string', enum: ['full-sdlc', 'focused-domain'], description: 'Full SDLC runs all domains; focused-domain runs one selected domain.' },
                domainId: { type: 'string', description: 'Specialist domain id required when phase is focused-domain.' },
                inputSources: { type: 'array', items: { type: 'string' }, description: 'Evidence inputs used by the review.' }
              }
            })
          },
          responses: {
            200: { description: 'Agent Foundry review evidence created.', content: jsonContent({ type: 'object' }) },
            400: { description: 'Invalid phase or domain selection.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/agent-foundry/runs/{assignmentId}': {
        get: {
          operationId: 'listAgentFoundryRuns',
          summary: 'List Agent Foundry runs',
          description: 'Returns grouped Agent Foundry runs and specialist evidence entries for an assignment.',
          parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Assignment id.' }],
          responses: { 200: { description: 'Agent Foundry run history.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/monitoring/ai-usage': {
        get: {
          operationId: 'listAiUsageEvents',
          summary: 'List AI usage events',
          description: 'Returns prompt tokens, completion tokens, total tokens, provider, model, latency, errors, fallback flag, and timestamps.',
          responses: { 200: { description: 'AI usage event list and summary.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/settings': {
        get: {
          operationId: 'getSafeSettings',
          summary: 'Get safe settings',
          description: 'Returns frontend-safe provider, limit, and connector status without credentials or raw OCI config.',
          responses: { 200: { description: 'Safe settings response.', content: jsonContent({ type: 'object' }) } }
        },
        post: {
          operationId: 'updateSafeSettings',
          summary: 'Update safe local settings',
          description: 'Updates non-secret UI settings only. Secret-looking keys are rejected.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                settings: {
                  type: 'object',
                  description: 'Non-secret setting key/value pairs such as environment label or UI preference.'
                }
              }
            })
          },
          responses: {
            200: { description: 'Settings updated.', content: jsonContent({ type: 'object' }) },
            400: { description: 'Attempted unsafe setting update.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/runs': {
        get: {
          operationId: 'listRuns',
          summary: 'List workbench runs',
          description: 'Returns recent run summaries aggregated from run events.',
          responses: { 200: { description: 'Run summary list.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/runs/{runId}/events': {
        get: {
          operationId: 'listRunEvents',
          summary: 'List run events',
          description: 'Returns ordered timeline events for a specific run.',
          parameters: [{
            name: 'runId',
            in: 'path',
            required: true,
            description: 'Run identifier returned by /api/runs or AI responses.',
            schema: { type: 'string' }
          }],
          responses: { 200: { description: 'Run event timeline.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/connectors': {
        get: {
          operationId: 'listConnectors',
          summary: 'List optional connectors',
          description: 'Returns frontend-safe MCP connector status, read-only state, approval requirements, and destructive-action policy.',
          responses: { 200: { description: 'Connector status list.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/connectors/query': {
        post: {
          operationId: 'queryConnector',
          summary: 'Query optional connector',
          description: 'Placeholder connector gateway. Reads require configured connectors; writes require approval; destructive actions are blocked.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                connectorId: { type: 'string', description: 'Connector id such as jira, knowledge, or git.' },
                action: { type: 'string', description: 'Requested connector action.' },
                mode: { type: 'string', description: 'read, write, or delete/destructive.' },
                approved: { type: 'boolean', description: 'Human approval flag for write actions.' }
              },
              required: ['connectorId', 'action', 'mode']
            })
          },
          responses: {
            200: { description: 'Connector query result or governed block response.', content: jsonContent({ type: 'object' }) },
            403: { description: 'Connector disabled, write approval missing, or destructive action blocked.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/knowledge/ingest': {
        post: {
          operationId: 'ingestKnowledgeDocument',
          summary: 'Ingest knowledge document placeholder',
          description: 'Accepts document metadata for future Oracle DB vector/RAG ingestion.',
          responses: { 200: { description: 'Knowledge ingest placeholder response.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/knowledge/search': {
        post: {
          operationId: 'searchKnowledge',
          summary: 'Search knowledge placeholder',
          description: 'Returns placeholder results for future knowledge/RAG search.',
          responses: { 200: { description: 'Knowledge search placeholder response.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/openapi.json': {
        get: {
          operationId: 'getOpenApiSchema',
          summary: 'Get OpenAPI schema',
          description: 'Returns OpenAPI 3.0.3 schema suitable for future OCI GenAI Agent API Endpoint Calling Tool registration.',
          responses: { 200: { description: 'OpenAPI 3.0.3 document.', content: jsonContent({ type: 'object' }) } }
        }
      }
    }
  };
}

function normalizedAiResponseSchema() {
  return {
    type: 'object',
    properties: {
      provider: { type: 'string', description: 'Configured provider label, for example mock, local, oci, or agent.' },
      model: { type: 'string', description: 'Safe model label. Actual provider details remain server-side.' },
      requestType: { type: 'string', description: 'AI capability type.' },
      content: { description: 'Capability-specific response content.' },
      usage: {
        type: 'object',
        properties: {
          promptTokens: { type: 'integer', description: 'Estimated or provider-reported prompt token count.' },
          completionTokens: { type: 'integer', description: 'Estimated or provider-reported completion token count.' },
          totalTokens: { type: 'integer', description: 'Estimated or provider-reported total token count.' }
        }
      },
      latencyMs: { type: 'integer', description: 'Request latency in milliseconds.' },
      requestId: { type: 'string', description: 'Unique request id for monitoring and debugging.' },
      runId: { type: 'string', description: 'Run id associated with generated run events.' },
      error: { type: 'string', nullable: true, description: 'Normalized error message, if failed.' }
    }
  };
}

function isUnsafeSettingKey(key) {
  return /(secret|token|key|password|private|fingerprint|ocid|compartment|tenancy|profile|credential|bearer)/i.test(String(key || ''));
}

function getSafeSettingsResponse() {
  const executionAgent = getStoredSetting('executionAgent', 'codex');
  return {
    ai: safeAiConfig(),
    agentPolicy: {
      selectedExecutionAgent: executionAgent,
      availableExecutionAgents: ['codex', 'cline', 'manual'],
      defaultMode: 'read-only',
      writeActions: 'Require explicit human approval',
      dependencyInstalls: 'Blocked until dependency approval is captured'
    },
    intake: {
      uploadPolicy,
      workspaceDir,
      storageNote: 'Context uploads are stored in the ODT workspace and never copied into target repos automatically.'
    },
    connectors: listConnectors(),
    connectorPolicy: {
      mcpEnabled: connectorConfig.mcpEnabled,
      readActions: 'Allowed only when connector is configured and enabled',
      writeActions: 'Require explicit human approval',
      destructiveActions: 'Blocked by default'
    },
    promptTemplates: statements.selectPromptTemplates.all(),
    storedSettings: statements.selectSettings.all()
  };
}

function getStoredSetting(key, fallback) {
  const setting = statements.selectSettings.all().find((item) => item.key === key);
  if (!setting) return fallback;
  try {
    return JSON.parse(setting.value);
  } catch {
    return setting.value || fallback;
  }
}

async function handleConnectorQuery(response, body) {
  const connector = listConnectors().find((item) => item.id === body.connectorId);
  const action = String(body.action || '').trim();
  const mode = String(body.mode || 'read').toLowerCase();
  const now = new Date().toISOString();
  if (!connector || !connector.enabled) {
    statements.insertConnectorEvent.run(createId('connector'), body.connectorId || 'unknown', action, mode, 'blocked', 'Connector is disabled or not configured.', now);
    sendJson(response, 403, { status: 'blocked', reason: 'Connector is disabled or not configured.', connector });
    return;
  }
  if (mode.includes('delete') || mode.includes('destructive')) {
    statements.insertConnectorEvent.run(createId('connector'), connector.id, action, mode, 'blocked', 'Destructive actions are blocked by default.', now);
    sendJson(response, 403, { status: 'blocked', reason: 'Destructive actions are blocked by default.', connector });
    return;
  }
  if (mode.includes('write') && connector.requireWriteApproval && !body.approved) {
    statements.insertConnectorEvent.run(createId('connector'), connector.id, action, mode, 'approval_required', 'Write actions require human approval.', now);
    sendJson(response, 403, { status: 'approval_required', reason: 'Write actions require human approval.', connector });
    return;
  }
  statements.insertConnectorEvent.run(createId('connector'), connector.id, action, mode, 'ok', 'Placeholder connector gateway response.', now);
  sendJson(response, 200, {
    status: 'ok',
    connector,
    results: [],
    note: 'Connector gateway is wired for governance. Actual MCP transport is an extension point.'
  });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      sendJson(response, 200, { ok: true });
      return;
    }

    const url = new URL(request.url || '/', `http://${request.headers.host}`);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      const snapshot = await buildSnapshot();
      sendJson(response, 200, {
        ok: true,
        backend: snapshot.backend,
        odtContext: snapshot.odtContext,
        ai: snapshot.ai,
        connectors: snapshot.connectors,
        generatedAt: snapshot.generatedAt
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/snapshot') {
      sendJson(response, 200, await buildSnapshot());
      return;
    }

    if (request.method === 'POST' && url.pathname.startsWith('/api/ai/')) {
      const requestType = url.pathname.replace('/api/ai/', '');
      if (!['chat', 'summarize', 'extract-json', 'classify', 'recommend', 'embed'].includes(requestType)) {
        sendJson(response, 404, { error: 'Unsupported AI endpoint.' });
        return;
      }
      await handleAiRequest(response, requestType, await readBody(request));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/intake/upload-policy') {
      sendJson(response, 200, {
        uploadPolicy,
        workspaceDir,
        storageNote: 'Files are copied into odt-workbench-next/workspaces/<assignment>/intake-assets. The target repo is not modified by uploads.'
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/intake/assets') {
      const body = await readBody(request, Math.ceil(uploadPolicy.maxBatchBytes * 2.2));
      const assignmentId = body.assignmentId || 'assignment-local-mvp';
      sendJson(response, 200, storeIntakeAssets({
        assignmentId,
        files: body.files || [],
        sourceKind: body.sourceKind || 'upload'
      }));
      return;
    }

    const intakeAssetListMatch = url.pathname.match(/^\/api\/intake\/assets\/([^/]+)$/);
    if (request.method === 'GET' && intakeAssetListMatch) {
      const assignmentId = intakeAssetListMatch[1];
      sendJson(response, 200, {
        assignmentId,
        assets: statements.selectIntakeAssetsByAssignment.all(assignmentId),
        uploadPolicy,
        workspaceDir: join(workspaceDir, assignmentId, 'intake-assets')
      });
      return;
    }

    const intakeAssetFileMatch = url.pathname.match(/^\/api\/intake\/assets\/([^/]+)\/file$/);
    if (request.method === 'GET' && intakeAssetFileMatch) {
      const asset = statements.selectIntakeAssetById.get(intakeAssetFileMatch[1]);
      if (!asset || !existsSync(asset.storedPath)) {
        sendJson(response, 404, { error: 'Intake asset not found.' });
        return;
      }
      sendFile(response, asset);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/intake/analyze') {
      const body = await readBody(request);
      const assignmentId = body.assignmentId || 'assignment-local-mvp';
      sendJson(response, 200, {
        assignmentId,
        analysis: buildRequirementAnalysis({
          assignmentId,
          input: body.input || body.requirement || body.text || '',
          sourceType: body.sourceType || 'manual'
        })
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/repo/select-folder') {
      try {
        const repoPath = await selectLocalRepoFolder();
        sendJson(response, 200, {
          repoPath,
          exists: existsSync(repoPath),
          selectionMode: 'native-folder-picker',
          note: 'Folder selected locally. Repository analysis remains read-only until write scope is approved.'
        });
      } catch (err) {
        const status = err.code === 'UNSUPPORTED_PLATFORM' ? 501 : err.code === 'CANCELLED' ? 400 : 500;
        sendJson(response, status, {
          error: err.message || 'Unable to select folder.',
          fallback: 'Paste the repository path manually.'
        });
      }
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/repo/analyze') {
      const body = await readBody(request);
      const assignmentId = body.assignmentId || 'assignment-local-mvp';
      sendJson(response, 200, {
        assignmentId,
        analysis: body.browserAnalysis
          ? storeBrowserRepoAnalysis({ assignmentId, browserAnalysis: body.browserAnalysis })
          : buildRepoAnalysis({ assignmentId, repoPath: body.repoPath })
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/design/draft') {
      const body = await readBody(request);
      const assignmentId = body.assignmentId || 'assignment-local-mvp';
      const requirement = body.requirement || statements.selectRequirementsByAssignment.all(assignmentId)[0] || {};
      const latestRepo = statements.selectRepoAnalysisByAssignment.all(assignmentId)[0];
      const repoAnalysis = body.repoAnalysis || parseJsonValue(latestRepo?.analysisJson, {});
      const design = buildTechnicalDesign({
        assignmentId,
        requirement,
        repoAnalysis,
        title: body.title || 'Governed Developer Workflow Design'
      });
      sendJson(response, 200, { assignmentId, design });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/plan/draft') {
      const body = await readBody(request);
      const assignmentId = body.assignmentId || 'assignment-local-mvp';
      const latestDesign = statements.selectTechnicalDesignsByAssignment.all(assignmentId)[0];
      const design = body.design || parseJsonValue(latestDesign?.designJson, {});
      const plan = buildImplementationPlan({
        assignmentId,
        design,
        title: body.title || 'Standards-Governed Implementation Plan'
      });
      sendJson(response, 200, { assignmentId, plan });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/standards') {
      sendJson(response, 200, {
        registry: loadStandardsRegistry(),
        flexibility: {
          themeAndUxCanBeOverridden: true,
          nonCriticalWarningsCanBeApprovedWithNotes: true,
          blockerOverrideAllowedWithEvidence: true,
          hardSafetyBlockers: ['frontend secrets', 'destructive actions', 'unapproved dependency installs'],
          note: 'Standards are configurable. Blockers require explicit review notes and an auditable override before write delegation can continue.'
        }
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/standards/check') {
      const body = await readBody(request);
      const assignmentId = body.assignmentId || 'assignment-local-mvp';
      const assignment = getAssignment(assignmentId) || {};
      const artifact = body.artifact || {
        assignment,
        latestDesign: parseJsonValue(statements.selectTechnicalDesignsByAssignment.all(assignmentId)[0]?.designJson, {}),
        latestPlan: parseJsonValue(statements.selectImplementationPlansByAssignment.all(assignmentId)[0]?.planJson, {}),
        standardsNote: 'Requirement repo impacted files accessibility WCAG VPAT Section 508 security validation testing branch coverage statement coverage function coverage line coverage dependency policy no new dependency Redwood loading empty error states performance maintainable existing pattern approve for write.'
      };
      const review = runStandardsReview({
        phase: body.phase || 'pre-implementation',
        artifact,
        assignment: { ...assignment, writeApproved: Boolean(body.writeApproved) }
      });
      sendJson(response, 200, persistStandardsReview({
        assignmentId,
        phase: body.phase || 'pre-implementation',
        artifact,
        review
      }));
      return;
    }

    const standardsChecksMatch = url.pathname.match(/^\/api\/standards\/checks\/([^/]+)$/);
    if (request.method === 'GET' && standardsChecksMatch) {
      const evidence = collectEvidence(standardsChecksMatch[1]);
      sendJson(response, 200, {
        assignmentId: standardsChecksMatch[1],
        checks: evidence.standardsChecks,
        findings: evidence.standardsFindings
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/approvals') {
      const body = await readBody(request);
      const assignmentId = body.assignmentId || 'assignment-local-mvp';
      const approvalType = body.approvalType || body.type || 'standards_warning_override';
      const status = body.status || 'approved';
      const now = new Date().toISOString();
      statements.insertApprovalEvent.run(
        createId('approval'),
        assignmentId,
        approvalType,
        status,
        body.approvedBy || body.userId || process.env.USER || 'local-user',
        now,
        body.notes || ''
      );
      createRunEvent(createId('run'), 'approval_recorded', 'ok', { assignmentId, approvalType, status }, assignmentId);
      sendJson(response, 200, { assignmentId, approvalType, status, approvedAt: now, evidence: collectEvidence(assignmentId).approvals[0] });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/dependencies/request') {
      const body = await readBody(request);
      const packageName = String(body.packageName || '').trim();
      const reason = String(body.reason || '').trim();
      if (!packageName || !reason) {
        sendJson(response, 400, { error: 'packageName and reason are required for dependency requests.' });
        return;
      }
      const assignmentId = body.assignmentId || 'assignment-local-mvp';
      const now = new Date().toISOString();
      const id = createId('dep');
      statements.insertDependencyRequest.run(
        id,
        assignmentId,
        packageName,
        body.version || '',
        body.license || 'UNKNOWN',
        reason,
        body.alternatives || '',
        'pending',
        body.requestedBy || process.env.USER || 'local-user',
        null,
        now,
        null,
        body.notes || ''
      );
      createRunEvent(createId('run'), 'dependency_request_created', 'warning', { assignmentId, packageName }, assignmentId);
      sendJson(response, 200, statements.selectDependencyRequestById.get(id));
      return;
    }

    const dependencyDecisionMatch = url.pathname.match(/^\/api\/dependencies\/([^/]+)\/(approve|reject)$/);
    if (request.method === 'POST' && dependencyDecisionMatch) {
      const body = await readBody(request);
      const id = dependencyDecisionMatch[1];
      const action = dependencyDecisionMatch[2];
      const existing = statements.selectDependencyRequestById.get(id);
      if (!existing) {
        sendJson(response, 404, { error: 'Dependency request not found.' });
        return;
      }
      const status = action === 'approve' ? 'approved' : 'rejected';
      const now = new Date().toISOString();
      statements.updateDependencyDecision.run(
        status,
        body.approvedBy || body.userId || process.env.USER || 'local-user',
        now,
        body.notes || '',
        id
      );
      createRunEvent(createId('run'), `dependency_${status}`, status === 'approved' ? 'ok' : 'blocked', {
        assignmentId: existing.assignmentId,
        packageName: existing.packageName
      }, existing.assignmentId);
      sendJson(response, 200, statements.selectDependencyRequestById.get(id));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/review/comments') {
      const body = await readBody(request);
      try {
        sendJson(response, 200, createReviewComment({
          assignmentId: body.assignmentId || 'assignment-local-mvp',
          targetType: body.targetType || 'plan',
          targetId: body.targetId || '',
          severity: body.severity || 'comment',
          comment: body.comment,
          status: body.status || 'open',
          createdBy: body.createdBy || body.userId || process.env.USER || 'local-user',
          resolutionNotes: body.resolutionNotes || ''
        }));
      } catch (err) {
        sendJson(response, 400, { error: err.message });
      }
      return;
    }

    const reviewCommentDecisionMatch = url.pathname.match(/^\/api\/review\/comments\/([^/]+)\/status$/);
    if (request.method === 'POST' && reviewCommentDecisionMatch) {
      const body = await readBody(request);
      try {
        sendJson(response, 200, updateReviewCommentDecision({
          id: reviewCommentDecisionMatch[1],
          status: body.status,
          resolutionNotes: body.resolutionNotes || ''
        }));
      } catch (err) {
        sendJson(response, err.statusCode || 400, { error: err.message });
      }
      return;
    }

    const reviewCommentReworkRelayMatch = url.pathname.match(/^\/api\/review\/comments\/([^/]+)\/rework-relay$/);
    if (request.method === 'POST' && reviewCommentReworkRelayMatch) {
      const body = await readBody(request);
      try {
        sendJson(response, 200, sendReviewCommentToReworkRelay({
          commentId: reviewCommentReworkRelayMatch[1],
          requestedBy: body.requestedBy || body.userId || process.env.USER || 'local-user'
        }));
      } catch (err) {
        sendJson(response, err.statusCode || 400, { error: err.message });
      }
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/review/rework') {
      const body = await readBody(request);
      try {
        sendJson(response, 200, requestPlanRework({
          assignmentId: body.assignmentId || 'assignment-local-mvp',
          targetType: body.targetType || 'plan',
          notes: body.notes || ''
        }));
      } catch (err) {
        sendJson(response, err.statusCode || 400, { error: err.message });
      }
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/implementation/evidence') {
      const body = await readBody(request);
      try {
        sendJson(response, 200, recordImplementationEvidence({
          assignmentId: body.assignmentId || 'assignment-local-mvp',
          runId: body.runId || '',
          phase: body.phase || 'implementation',
          changedFiles: body.changedFiles || [],
          commands: body.commands || [],
          tests: body.tests || [],
          summary: body.summary || '',
          status: body.status || 'recorded',
          createdBy: body.createdBy || body.userId || process.env.USER || 'local-user',
          runPostCheck: body.runPostCheck !== false
        }));
      } catch (err) {
        sendJson(response, err.statusCode || 400, { error: err.message });
      }
      return;
    }

	    if (request.method === 'POST' && url.pathname === '/api/implementation/post-check') {
	      const body = await readBody(request);
	      try {
        const assignmentId = body.assignmentId || 'assignment-local-mvp';
        const evidenceRecord = body.evidenceId
          ? parseImplementationEvidenceRow(statements.selectImplementationEvidenceById.get(body.evidenceId))
          : null;
        sendJson(response, 200, {
          assignmentId,
          postCheck: runPostImplementationStandardsCheck({ assignmentId, evidenceRecord })
        });
      } catch (err) {
        sendJson(response, err.statusCode || 400, { error: err.message });
      }
	      return;
	    }

	    const implementationFromWorkerMatch = url.pathname.match(/^\/api\/implementation\/evidence\/from-worker\/([^/]+)$/);
	    if (request.method === 'POST' && implementationFromWorkerMatch) {
	      const body = await readBody(request);
	      try {
	        sendJson(response, 200, recordImplementationEvidenceFromWorkerRun({
	          assignmentId: body.assignmentId || 'assignment-local-mvp',
	          workerRunId: implementationFromWorkerMatch[1],
	          runPostCheck: body.runPostCheck !== false
	        }));
	      } catch (err) {
	        sendJson(response, err.statusCode || 400, { error: err.message, extracted: err.extracted || null });
	      }
	      return;
	    }

	    const implementationEvidenceMatch = url.pathname.match(/^\/api\/implementation\/evidence\/([^/]+)$/);
	    if (request.method === 'GET' && implementationEvidenceMatch) {
	      const assignmentId = implementationEvidenceMatch[1];
      sendJson(response, 200, {
        assignmentId,
        implementationEvidence: collectEvidence(assignmentId).implementationEvidence || []
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/agents/delegate') {
      const body = await readBody(request);
      const delegation = prepareAgentDelegation({
        assignmentId: body.assignmentId || 'assignment-local-mvp',
        executionAgent: body.executionAgent || getStoredSetting('executionAgent', 'codex'),
        requireWriteApproved: body.requireWriteApproved !== false,
        notes: body.notes || ''
      });
      sendJson(response, delegation.status === 'prepared' ? 200 : 409, delegation);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/agents/worker-roles') {
      sendJson(response, 200, {
        roles: agentWorkerRoles,
        engineAdapters: [
          { id: 'codex', label: 'Codex CLI', status: 'wired-terminal-launch' },
          { id: 'cline', label: 'Cline', status: 'handoff-ready-launch-adapter-pending' },
          { id: 'oci-genai', label: 'OCI GenAI / OCA', status: 'provider-ready-agent-orchestration-pending' },
          { id: 'manual', label: 'Manual', status: 'handoff-ready' }
        ],
        orchestrationPolicy: {
          defaultMode: 'sequential',
          parallelWritesRequireFilePartition: true,
          advisoryRolesCanRunReadOnly: true,
          writeRolesRequireApproval: true,
          dependencyInstallsRequireSeparateApproval: true
        }
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/agents/execution-health') {
      const assignmentId = url.searchParams.get('assignmentId') || 'assignment-local-mvp';
      sendJson(response, 200, getExecutionAdapterHealth(assignmentId));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/agents/launch-worker') {
      const body = await readBody(request);
      try {
        const launchMode = body.launchMode || 'terminal';
        if (!['terminal', 'bundle-only'].includes(launchMode)) {
          sendJson(response, 400, { error: 'launchMode must be terminal or bundle-only.' });
          return;
        }
        const result = launchCodexWorker({
          assignmentId: body.assignmentId || 'assignment-local-mvp',
          executionAgent: body.executionAgent || getStoredSetting('executionAgent', 'codex'),
          workerRole: body.workerRole || 'lead-planner',
          launchMode,
          notes: body.notes || ''
        });
        sendJson(response, 200, result);
	      } catch (err) {
	        sendJson(response, err.statusCode || 500, {
	          error: err.message,
	          delegation: err.delegation || null,
	          executionHealth: err.executionHealth || null
	        });
	      }
      return;
    }

	    const workerRunsMatch = url.pathname.match(/^\/api\/agents\/worker-runs\/([^/]+)$/);
	    if (request.method === 'GET' && workerRunsMatch) {
	      const assignmentId = workerRunsMatch[1];
	      ensureRelayItemsForAssignment(assignmentId);
	      statements.selectAgentWorkerRunsByAssignment.all(assignmentId)
	        .map(parseAgentWorkerRun)
	        .filter((run) => ['running', 'starting', 'delegated_visible', 'manual_fallback', 'bundle_created', 'unknown'].includes(String(run.status || '').toLowerCase()))
	        .slice(0, 20)
	        .forEach((run) => {
	          try {
	            syncWorkerRunStatus({ assignmentId, workerRunId: run.id });
	          } catch {
	            // Status sync is best-effort; listing worker runs should not fail because a log file moved.
	          }
	        });
	      sendJson(response, 200, {
	        assignmentId,
	        workerRuns: statements.selectAgentWorkerRunsByAssignment.all(assignmentId).map(parseAgentWorkerRun),
	        relayItems: statements.selectAgentRelayItemsByAssignment.all(assignmentId).map(parseAgentRelayItem),
	        orchestrationPolicy: {
	          defaultMode: 'sequential',
	          relayPriorOutputs: true,
	          relayItemsAreEvidence: true,
	          parallelWritesRequireFilePartition: true
	        }
	      });
	      return;
	    }

		    const workerStatusMatch = url.pathname.match(/^\/api\/agents\/worker-runs\/([^/]+)\/status$/);
		    if (request.method === 'POST' && workerStatusMatch) {
	      const body = await readBody(request);
	      try {
	        const result = syncWorkerRunStatus({
	          assignmentId: body.assignmentId || 'assignment-local-mvp',
	          workerRunId: workerStatusMatch[1]
	        });
	        sendJson(response, 200, result);
	      } catch (err) {
	        sendJson(response, err.statusCode || 400, { error: err.message });
	      }
		      return;
		    }

		    const workerStopMatch = url.pathname.match(/^\/api\/agents\/worker-runs\/([^/]+)\/stop$/);
		    if (request.method === 'POST' && workerStopMatch) {
		      const body = await readBody(request);
		      try {
		        sendJson(response, 200, requestStopWorkerRun({
		          assignmentId: body.assignmentId || 'assignment-local-mvp',
		          workerRunId: workerStopMatch[1],
		          requestedBy: body.requestedBy || process.env.USER || 'local-user',
		          reason: body.reason || ''
		        }));
		      } catch (err) {
		        sendJson(response, err.statusCode || 400, { error: err.message });
		      }
		      return;
		    }

		    const relayItemsMatch = url.pathname.match(/^\/api\/agents\/relay\/([^/]+)$/);
	    if (request.method === 'GET' && relayItemsMatch) {
	      const assignmentId = relayItemsMatch[1];
	      ensureRelayItemsForAssignment(assignmentId);
	      sendJson(response, 200, {
	        assignmentId,
	        relayItems: statements.selectAgentRelayItemsByAssignment.all(assignmentId).map(parseAgentRelayItem),
	        policy: {
	          sourceWorkerRunsImmutable: true,
	          nextWorkerPromptInjection: true,
	          humanDecisionEvidenceRequired: true
	        }
	      });
	      return;
	    }

	    const relayDecisionMatch = url.pathname.match(/^\/api\/agents\/relay\/([^/]+)\/decision$/);
	    if (request.method === 'POST' && relayDecisionMatch) {
	      const body = await readBody(request);
	      try {
	        const relayItem = decideAgentRelayItem({
	          relayItemId: relayDecisionMatch[1],
	          assignmentId: body.assignmentId || 'assignment-local-mvp',
	          action: body.action || 'answer',
	          decision: body.decision || '',
	          targetWorkerRole: body.targetWorkerRole || '',
	          targetLane: body.targetLane || '',
	          decidedBy: body.decidedBy || process.env.USER || 'local-user'
	        });
	        sendJson(response, 200, { relayItem });
	      } catch (err) {
	        sendJson(response, err.statusCode || 400, { error: err.message });
	      }
	      return;
	    }

	    const workerIngestMatch = url.pathname.match(/^\/api\/agents\/worker-runs\/([^/]+)\/ingest$/);
	    if (request.method === 'POST' && workerIngestMatch) {
      const body = await readBody(request);
      try {
        const workerRun = ingestWorkerOutput({
          assignmentId: body.assignmentId || 'assignment-local-mvp',
          workerRunId: workerIngestMatch[1]
        });
        sendJson(response, 200, { workerRun });
      } catch (err) {
        sendJson(response, err.statusCode || 400, { error: err.message });
      }
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/agent-foundry/domains') {
      sendJson(response, 200, {
        phases: agentFoundryPhases,
        domains: agentFoundryDomains,
        policy: {
          outputLabel: 'AI-generated suggestion',
          humanReviewRequired: true,
          writesAutoApproved: false,
          dependencyInstallsRequireSeparateApproval: true,
          autoGenOrAutoGptCore: false,
          providerReady: aiConfig.provider
        }
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/agent-foundry/run') {
      const body = await readBody(request);
      const result = runAgentFoundry({
        assignmentId: body.assignmentId || 'assignment-local-mvp',
        phase: body.phase || 'full-sdlc',
        domainId: body.domainId || '',
        inputSources: body.inputSources || []
      });
      sendJson(response, 200, result);
      return;
    }

    const agentFoundryRunsMatch = url.pathname.match(/^\/api\/agent-foundry\/runs\/([^/]+)$/);
    if (request.method === 'GET' && agentFoundryRunsMatch) {
      sendJson(response, 200, listAgentFoundryRuns(agentFoundryRunsMatch[1]));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/pr/prepare') {
      const body = await readBody(request);
      const assignmentId = body.assignmentId || 'assignment-local-mvp';
      sendJson(response, 200, {
        assignmentId,
        report: preparePrReadinessReport({ assignmentId, linkedJira: body.linkedJira || '', notes: body.notes || '' })
      });
      return;
    }

    const workflowStateMatch = url.pathname.match(/^\/api\/workflow\/state\/([^/]+)$/);
    if (request.method === 'GET' && workflowStateMatch) {
      const assignmentId = workflowStateMatch[1];
      sendJson(response, 200, {
        assignmentId,
        workflowState: collectEvidence(assignmentId).workflowState
      });
      return;
    }

    const evidenceMatch = url.pathname.match(/^\/api\/assignments\/([^/]+)\/evidence$/);
    if (request.method === 'GET' && evidenceMatch) {
      sendJson(response, 200, collectEvidence(evidenceMatch[1]));
      return;
    }

    const agentContractMatch = url.pathname.match(/^\/api\/assignments\/([^/]+)\/agent-contract$/);
    if (request.method === 'GET' && agentContractMatch) {
      const assignmentId = agentContractMatch[1];
      sendJson(response, 200, buildCurrentAgentContract(assignmentId).contract);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/monitoring/ai-usage') {
      const events = statements.selectAiUsage.all();
      sendJson(response, 200, { summary: summarizeUsage(events), events });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/settings') {
      sendJson(response, 200, getSafeSettingsResponse());
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/settings') {
      const body = await readBody(request);
      const settings = body.settings || {};
      const unsafeKey = Object.keys(settings).find(isUnsafeSettingKey);
      if (unsafeKey) {
        sendJson(response, 400, { error: `Refusing to store secret-like setting "${unsafeKey}" from frontend.` });
        return;
      }
      const now = new Date().toISOString();
      Object.entries(settings).forEach(([key, value]) => {
        statements.upsertSetting.run(key, JSON.stringify(value), now);
      });
      sendJson(response, 200, getSafeSettingsResponse());
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/runs') {
      sendJson(response, 200, { runs: listRuns() });
      return;
    }

    const runEventsMatch = url.pathname.match(/^\/api\/runs\/([^/]+)\/events$/);
    if (request.method === 'GET' && runEventsMatch) {
      sendJson(response, 200, { runId: runEventsMatch[1], events: statements.selectRunEventsByRun.all(runEventsMatch[1]) });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/connectors') {
      sendJson(response, 200, { connectors: listConnectors(), recentEvents: statements.selectConnectorEvents.all() });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/connectors/query') {
      await handleConnectorQuery(response, await readBody(request));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/knowledge/ingest') {
      sendJson(response, 200, {
        status: 'accepted',
        mode: 'placeholder',
        note: 'Knowledge ingestion is reserved for Oracle DB 23ai/26ai vector/RAG phase.'
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/knowledge/search') {
      sendJson(response, 200, {
        status: 'ok',
        mode: 'placeholder',
        results: [],
        note: 'Knowledge search is reserved for the enterprise RAG phase.'
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/openapi.json') {
      sendJson(response, 200, buildOpenApiSchema());
      return;
    }

    sendJson(response, 404, { error: 'Not found.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`ODT Workbench Next API listening on http://127.0.0.1:${port}`);
  console.log(`SQLite data: ${dbPath}`);
});
