import { createServer } from 'node:http';
import { execFile, spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, openSync, closeSync, readSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
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
import { buildAiWorkAuditPack } from '../odt 2.0 enterprise/packages/domain/src/ai-work-audit.js';
import {
  createProjectContractService,
  selectProjectContractForAssignmentContext
} from '../odt 2.0 enterprise/services/api/src/modules/project-contract/index.js';
import { createSettingsService } from '../odt 2.0 enterprise/services/api/src/modules/settings/index.js';
import {
  createWorkflowService,
  deriveReviewCycleCloseout,
  deriveJiraVerificationProfile,
  scopedCurrentEvidence,
  splitEvidenceByFreshness,
  deriveWorkflowState as deriveWorkflowStateFromModule
} from '../odt 2.0 enterprise/services/api/src/modules/workflow/index.js';
import {
  createAiWorkAuditPackRepository,
  createApprovalEventRepository,
  createAgentEventRepository,
  createAgentFoundryRunRepository,
  createAgentRelayRepository,
  createAgentWorkerRunRepository,
  createAiUsageRepository,
  createAssignmentRepository,
  createChatMessageRepository,
  createConnectorEventRepository,
  createDependencyRequestRepository,
  createImplementationPlanRepository,
  createImplementationEvidenceRepository,
  createIntakeAssetRepository,
  createPrReadinessReportRepository,
  createProjectContractRepository,
  createPromptTemplateRepository,
  createRepoAnalysisRepository,
  createRequirementRepository,
  createReviewCommentRepository,
  createRunEventRepository,
  createSettingsRepository,
  createStandardsCheckRepository,
  createTechnicalDesignRepository,
  createTestPlanRepository,
  createWorkflowEvidenceRepository
} from '../odt 2.0 enterprise/services/sqlite/src/index.js';

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

function parseBooleanEnv(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function normalizeGenAiProvider(value) {
  const normalized = String(value || 'local').trim().toLowerCase();
  if (['openai', 'oci', 'ollama', 'local'].includes(normalized)) return normalized;
  if (['oci-genai', 'oracle', 'oracle-genai', 'oca'].includes(normalized)) return 'oci';
  if (['none', 'mock', 'deterministic'].includes(normalized)) return 'local';
  return 'local';
}

const genAiProvider = normalizeGenAiProvider(process.env.GENAI_PROVIDER || process.env.ODT_AI_PROVIDER || 'local');
const configuredChatModel = process.env.GENAI_MODEL
  || process.env.ODT_AI_MODEL
  || process.env.OPENAI_MODEL
  || process.env.OCI_GENAI_CHAT_MODEL_ID
  || process.env.OLLAMA_MODEL
  || '';

const aiConfig = {
  provider: genAiProvider,
  environment: process.env.ODT_ENVIRONMENT || 'Local Dev',
  model: configuredChatModel || (genAiProvider === 'local' ? 'local-guide-model' : ''),
  region: process.env.OCI_GENAI_REGION || process.env.OCI_REGION || '',
  genAiEndpoint: process.env.OCI_GENAI_ENDPOINT || process.env.OCI_GENAI_BASE_URL || process.env.ODT_OCI_GENAI_ENDPOINT || '',
  ociOpenAiBaseUrl: process.env.OCI_GENAI_OPENAI_BASE_URL
    || process.env.OCI_GENAI_BASE_URL
    || process.env.OCI_OPENAI_BASE_URL
    || process.env.OCI_GENAI_ENDPOINT
    || process.env.ODT_OCI_GENAI_ENDPOINT
    || '',
  compartmentId: process.env.OCI_COMPARTMENT_OCID || process.env.OCI_COMPARTMENT_ID || '',
  openAiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ociBearerToken: process.env.OCI_GENAI_BEARER_TOKEN || process.env.OCI_GENAI_API_KEY || process.env.OCI_BEARER_TOKEN || '',
  ociOpenAiCompatible: parseBooleanEnv(process.env.OCI_GENAI_OPENAI_COMPATIBLE || process.env.OCI_OPENAI_COMPATIBLE, false),
  genAiEndpointConfigured: Boolean(process.env.OCI_GENAI_ENDPOINT || process.env.ODT_OCI_GENAI_ENDPOINT),
  compartmentConfigured: Boolean(process.env.OCI_COMPARTMENT_OCID || process.env.OCI_COMPARTMENT_ID),
  chatModelConfigured: Boolean(configuredChatModel),
  embedModelConfigured: Boolean(process.env.OCI_GENAI_EMBED_MODEL_ID || process.env.GENAI_EMBED_MODEL),
  authMode: process.env.OCI_AUTH_MODE || 'not configured',
  configProfileConfigured: Boolean(process.env.OCI_CONFIG_PROFILE || process.env.OCI_CONFIG_FILE),
  agentEndpointConfigured: Boolean(process.env.OCI_GENAI_AGENT_ENDPOINT),
  ragEnabled: process.env.ODT_RAG_ENABLED !== 'false',
  ragMode: 'local-keyword-rag',
  vectorStore: process.env.ODT_VECTOR_STORE || 'local-evidence-corpus',
  limits
};

function parseCodexMcpServersFromToml(text = '') {
  const servers = [];
  let current = null;
  let body = [];
  const flush = () => {
    if (!current) return;
    const bodyText = body.join('\n');
    const command = bodyText.match(/^\s*command\s*=\s*"([^"]+)"/m)?.[1] || '';
    const args = bodyText.match(/^\s*args\s*=\s*\[([^\]]*)\]/ms)?.[1] || '';
    servers.push({
      name: current,
      command,
      hasDockerEnvFile: /--env-file/.test(args),
      bodyText
    });
  };

  String(text || '').split(/\r?\n/).forEach((line) => {
    const section = line.match(/^\s*\[mcp_servers\.("?)([^"\]]+)\1\]\s*$/);
    if (section) {
      flush();
      current = section[2];
      body = [];
      return;
    }
    if (/^\s*\[/.test(line)) {
      flush();
      current = null;
      body = [];
      return;
    }
    if (current) body.push(line);
  });
  flush();
  return servers;
}

function loadCodexMcpConfig() {
  if (process.env.ODT_DETECT_CODEX_MCP === 'false') {
    return { enabled: false, paths: [], servers: [] };
  }
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const configuredPaths = String(process.env.ODT_CODEX_MCP_CONFIG_PATHS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const candidatePaths = configuredPaths.length
    ? configuredPaths
    : [
        home ? join(home, '.codex', 'config.toml') : '',
        home ? join(home, '.codex', 'gpt-5-3-codex.config.toml') : ''
      ].filter(Boolean);

  const loaded = [];
  const servers = [];
  candidatePaths.forEach((path) => {
    if (!existsSync(path)) return;
    try {
      const parsedServers = parseCodexMcpServersFromToml(readFileSync(path, 'utf8'));
      if (parsedServers.length) {
        loaded.push(path);
        servers.push(...parsedServers.map((server) => ({ ...server, configPath: path })));
      }
    } catch {
      // Codex MCP config discovery is best-effort and must not block ODT startup.
    }
  });

  return {
    enabled: true,
    paths: loaded,
    servers
  };
}

const codexMcpConfig = loadCodexMcpConfig();

function parseTomlStringArray(bodyText = '', key = 'args') {
  const match = String(bodyText || '').match(new RegExp(`^\\s*${key}\\s*=\\s*\\[([\\s\\S]*?)\\]`, 'm'));
  if (!match) return [];
  return [...match[1].matchAll(/"((?:\\.|[^"])*)"/g)].map((item) => (
    item[1]
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  ));
}

function parseTomlStringValue(bodyText = '', key = 'model') {
  const match = String(bodyText || '').match(new RegExp(`^\\s*${key}\\s*=\\s*"((?:\\\\.|[^"])*)"`, 'm'));
  return match
    ? match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim()
    : '';
}

function readCodexConfigModel() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const configPaths = uniqueTruthy([
    process.env.ODT_CODEX_CONFIG_PATH,
    home ? join(home, '.codex', 'config.toml') : ''
  ]);
  for (const configPath of configPaths) {
    try {
      if (!existsSync(configPath)) continue;
      const model = parseTomlStringValue(readFileSync(configPath, 'utf8'), 'model');
      if (model) return { model, source: configPath };
    } catch {
      // Model discovery is best-effort; launch still works when a model is explicitly configured.
    }
  }
  return { model: '', source: '' };
}

function getCodexWorkerModel() {
  const configured = String(process.env.ODT_CODEX_MODEL || process.env.CODEX_MODEL || '').trim();
  if (configured) return { model: configured, source: process.env.ODT_CODEX_MODEL ? 'ODT_CODEX_MODEL' : 'CODEX_MODEL' };
  const fromConfig = readCodexConfigModel();
  if (fromConfig.model) return fromConfig;
  return { model: '', source: '' };
}

function expandLocalPath(rawPath = '') {
  const trimmed = String(rawPath || '').trim();
  if (!trimmed) return '';
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const expanded = trimmed
    .replace(/^\$HOME(?=\/|$)/, home)
    .replace(/^\$\{HOME\}(?=\/|$)/, home)
    .replace(/^~(?=\/|$)/, home);
  return isAbsolute(expanded) ? expanded : resolve(appRoot, expanded);
}

function getCodexMcpEnvFilePaths(server) {
  const args = parseTomlStringArray(server?.bodyText || '', 'args');
  const paths = [];
  args.forEach((arg, index) => {
    if (arg === '--env-file' && args[index + 1]) paths.push(args[index + 1]);
    const inline = String(arg || '').match(/^--env-file=(.+)$/);
    if (inline?.[1]) paths.push(inline[1]);
  });
  return paths.map(expandLocalPath).filter(Boolean);
}

function parseEnvValue(rawValue = '') {
  const trimmed = String(rawValue || '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readEnvFileValues(filePath) {
  if (!filePath || !existsSync(filePath)) return {};
  try {
    const stat = statSync(filePath);
    if (!stat.isFile() || stat.size > 128 * 1024) return {};
    return readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .reduce((values, line) => {
        const normalized = line.trim();
        if (!normalized || normalized.startsWith('#')) return values;
        const match = normalized.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!match) return values;
        values[match[1]] = parseEnvValue(match[2]);
        return values;
      }, {});
  } catch {
    return {};
  }
}

function findCodexMcpServerByName(serverName) {
  if (!serverName) return null;
  return codexMcpConfig.servers.find((server) => server.name === serverName) || null;
}

function firstValue(values, keys) {
  return keys.map((key) => values[key]).find((value) => value !== undefined && value !== null && String(value).trim() !== '') || '';
}

function loadJiraConnectorCredentials(connector) {
  const merged = {
    JIRA_URL: process.env.JIRA_URL,
    JIRA_BASE_URL: process.env.JIRA_BASE_URL,
    ATLASSIAN_URL: process.env.ATLASSIAN_URL,
    JIRA_PERSONAL_TOKEN: process.env.JIRA_PERSONAL_TOKEN,
    JIRA_TOKEN: process.env.JIRA_TOKEN,
    JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
    ATLASSIAN_API_TOKEN: process.env.ATLASSIAN_API_TOKEN,
    JIRA_USERNAME: process.env.JIRA_USERNAME,
    JIRA_USER: process.env.JIRA_USER,
    JIRA_PASSWORD: process.env.JIRA_PASSWORD,
    JIRA_SSL_VERIFY: process.env.JIRA_SSL_VERIFY
  };
  let source = firstValue(merged, ['JIRA_URL', 'JIRA_BASE_URL', 'ATLASSIAN_URL']) ? 'environment' : '';
  const server = findCodexMcpServerByName(connector?.serverName) || findCodexMcpServers([/jira/, /jirasd/])[0];

  if (server) {
    getCodexMcpEnvFilePaths(server).forEach((envPath) => {
      const fileValues = readEnvFileValues(envPath);
      if (!Object.keys(fileValues).length) return;
      Object.entries(fileValues).forEach(([key, value]) => {
        if (merged[key] === undefined || merged[key] === '') merged[key] = value;
      });
      source = source || 'codex-env-file';
    });
  }

  const baseUrl = firstValue(merged, ['JIRA_URL', 'JIRA_BASE_URL', 'ATLASSIAN_URL']).replace(/\/+$/, '');
  const username = firstValue(merged, ['JIRA_USERNAME', 'JIRA_USER']);
  const password = firstValue(merged, ['JIRA_PASSWORD']);
  const apiToken = firstValue(merged, ['JIRA_API_TOKEN', 'ATLASSIAN_API_TOKEN']);
  const personalToken = firstValue(merged, ['JIRA_PERSONAL_TOKEN', 'JIRA_TOKEN']);
  const token = apiToken || personalToken;
  const authMode = username && (password || apiToken) ? 'basic' : token ? 'bearer' : '';

  return {
    ready: Boolean(baseUrl && authMode),
    baseUrl,
    username,
    password: password || apiToken,
    token,
    authMode,
    source: source || 'not-configured',
    sslVerify: firstValue(merged, ['JIRA_SSL_VERIFY']) || 'true'
  };
}

function normalizeJiraIssueKey(value = '') {
  const match = String(value || '').trim().match(/[A-Z][A-Z0-9]+-\d+/i);
  return match ? match[0].toUpperCase() : '';
}

function truncateText(value = '', maxLength = 4000) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function safeJiraUser(user) {
  if (!user || typeof user !== 'object') return 'Unassigned';
  return user.displayName || user.name || user.key || 'Unknown';
}

function safeJiraNameList(items) {
  return Array.isArray(items) ? items.map((item) => item?.name).filter(Boolean) : [];
}

function jiraIssueBrowseUrl(baseUrl, issueKey) {
  return `${baseUrl.replace(/\/+$/, '')}/browse/${encodeURIComponent(issueKey)}`;
}

function safeResponsePreview(text = '') {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
}

function classifyUpstreamBody(contentType = '', bodyText = '') {
  const normalizedContentType = String(contentType || '').toLowerCase();
  const preview = safeResponsePreview(bodyText);
  if (normalizedContentType.includes('text/html') || /^\s*</.test(String(bodyText || ''))) {
    return {
      kind: 'html',
      message: 'Jira returned an HTML page instead of JSON. This usually means the configured URL/auth path is redirecting to login, SSO, an error page, or a proxy page.'
    };
  }
  if (!normalizedContentType.includes('json')) {
    return {
      kind: 'non_json',
      message: `Jira returned ${contentType || 'a non-JSON response'} instead of JSON. Verify the Jira base URL, REST path, token, and SSO/proxy behavior.`
    };
  }
  return {
    kind: 'invalid_json',
    message: 'Jira returned invalid JSON. Verify the Jira REST endpoint and credentials.'
  };
}

function simplifyJiraIssue(issue, baseUrl) {
  const fields = issue?.fields || {};
  return {
    key: issue?.key || '',
    browseUrl: issue?.key ? jiraIssueBrowseUrl(baseUrl, issue.key) : '',
    summary: fields.summary || '',
    status: fields.status?.name || 'Unknown',
    issueType: fields.issuetype?.name || 'Issue',
    projectKey: fields.project?.key || '',
    projectName: fields.project?.name || '',
    priority: fields.priority?.name || 'None',
    assignee: safeJiraUser(fields.assignee),
    reporter: safeJiraUser(fields.reporter),
    created: fields.created || '',
    updated: fields.updated || '',
    labels: Array.isArray(fields.labels) ? fields.labels : [],
    components: safeJiraNameList(fields.components),
    fixVersions: safeJiraNameList(fields.fixVersions),
    descriptionExcerpt: truncateText(
      typeof fields.description === 'string'
        ? fields.description
        : fields.description
          ? JSON.stringify(fields.description)
          : ''
    )
  };
}

function classifyJiraWorkState(issue = {}) {
  const status = String(issue.status || '').toLowerCase();
  const done = /\b(done|closed|resolved|complete|completed|accepted|delivered)\b/.test(status);
  const blocked = /\b(blocked|on hold|rejected)\b/.test(status);
  if (done) {
    return {
      state: 'completed',
      label: 'Completed in Jira',
      confidence: 'high',
      recommendedMode: 'verification',
      nextAction: 'Verify the completed implementation in the target repo, capture test/build evidence, and prepare PR or release-readiness notes if needed.'
    };
  }
  if (blocked) {
    return {
      state: 'blocked',
      label: 'Blocked in Jira',
      confidence: 'medium',
      recommendedMode: 'clarification',
      nextAction: 'Review the blocker reason and capture clarification before planning implementation.'
    };
  }
  return {
    state: 'active',
    label: 'Active Jira work',
    confidence: 'medium',
    recommendedMode: 'implementation-planning',
    nextAction: 'Analyze the repo, map acceptance criteria, draft the implementation plan, and keep writes approval-gated.'
  };
}

function safeRepoPathForRead(repoPath = '') {
  const trimmed = String(repoPath || '').trim();
  if (!trimmed || trimmed.startsWith('Browser folder:')) return '';
  const expanded = expandLocalPath(trimmed);
  try {
    if (!existsSync(expanded) || !statSync(expanded).isDirectory()) return '';
    return expanded;
  } catch {
    return '';
  }
}

function runRepoCommand(command, args, options = {}) {
  try {
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      timeout: options.timeout || 8000,
      maxBuffer: options.maxBuffer || 256 * 1024,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return {
      ok: result.status === 0,
      status: result.status,
      stdout: String(result.stdout || '').trim(),
      stderr: String(result.stderr || '').trim()
    };
  } catch (err) {
    return {
      ok: false,
      status: -1,
      stdout: '',
      stderr: err.message || 'Command failed.'
    };
  }
}

function readJiraRepoCompletionSignals({ issueKey = '', repoPath = '' } = {}) {
  const pathToRead = safeRepoPathForRead(repoPath);
  if (!pathToRead) {
    return {
      checked: false,
      repoPath: repoPath || '',
      status: 'not_checked',
      summary: 'No readable local repo path was provided for completion evidence.'
    };
  }

  const hasGit = existsSync(join(pathToRead, '.git'));
  const signals = {
    checked: true,
    repoPath: pathToRead,
    status: 'no_ticket_reference_found',
    summary: `No direct ${issueKey} reference was found in git history or tracked files.`,
    gitHistory: [],
    trackedFileMatches: []
  };

  if (hasGit) {
    const gitLog = runRepoCommand('git', ['-C', pathToRead, 'log', '--all', '--oneline', '--grep', issueKey, '-n', '8']);
    signals.gitHistory = gitLog.stdout
      ? gitLog.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      : [];
    const gitGrep = runRepoCommand('git', ['-C', pathToRead, 'grep', '-n', '--fixed-strings', issueKey, '--', ':!node_modules', ':!dist', ':!build', ':!.next']);
    signals.trackedFileMatches = gitGrep.stdout
      ? gitGrep.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 20)
      : [];
  }

  if (signals.gitHistory.length || signals.trackedFileMatches.length) {
    signals.status = 'ticket_reference_found';
    signals.summary = `${issueKey} appears in ${signals.gitHistory.length} git commit(s) and ${signals.trackedFileMatches.length} tracked file reference(s).`;
  }
  return signals;
}

function formatJiraIntakeText({ issue, workState, repoSignals }) {
  const lines = [
    `Jira: ${issue.key}`,
    `Title: ${issue.summary}`,
    `Status: ${issue.status}`,
    `Type: ${issue.issueType}`,
    `Project: ${issue.projectKey}${issue.projectName ? ` - ${issue.projectName}` : ''}`,
    `Priority: ${issue.priority}`,
    `Assignee: ${issue.assignee}`,
    `Reporter: ${issue.reporter}`,
    `Updated: ${issue.updated || 'Unknown'}`,
    '',
    'ODT Work State:',
    `- Classification: ${workState.label}`,
    `- Recommended mode: ${workState.recommendedMode}`,
    `- Next action: ${workState.nextAction}`,
    '',
    'Repo Completion Signals:',
    repoSignals.repoPath ? `- Repository: ${repoSignals.repoPath}` : '- Repository: not provided',
    `- ${repoSignals.summary}`,
    ...(repoSignals.gitHistory?.length ? ['- Matching git commits:', ...repoSignals.gitHistory.map((item) => `  - ${item}`)] : []),
    ...(repoSignals.trackedFileMatches?.length ? ['- Matching tracked file references:', ...repoSignals.trackedFileMatches.slice(0, 8).map((item) => `  - ${item}`)] : []),
    '',
    'Requirement Handling Instruction:',
    workState.state === 'completed'
      ? '- Do not assume this needs new implementation. Treat it as completed Jira work; verify the repository state, capture evidence, run/review tests, and prepare PR/readiness notes only if needed.'
      : '- Treat this as active work. Analyze the repository, identify gaps, draft design and test plan, and require approval before writes.',
    '',
    'Jira Description Excerpt:',
    issue.descriptionExcerpt || 'No description excerpt returned by Jira.'
  ];
  return lines.join('\n');
}

async function importJiraIssueForIntake({ assignmentId = '', issueKey = '', repoPath = '', createNewAssignment = false } = {}) {
  const connector = listConnectors().find((item) => item.id === 'jira');
  if (!connector || !connector.enabled) {
    const error = new Error(connector?.readinessDetail || 'Jira connector is not ready.');
    error.statusCode = 403;
    throw error;
  }
  const normalizedIssueKey = normalizeJiraIssueKey(issueKey);
  if (!normalizedIssueKey) {
    const error = new Error('A Jira issue key such as PROJECT-12345 is required.');
    error.statusCode = 400;
    throw error;
  }
  const credentials = loadJiraConnectorCredentials(connector);
  if (!credentials.ready) {
    const error = new Error('Jira read credentials are not available server-side.');
    error.statusCode = 403;
    throw error;
  }

  const issue = await fetchJiraIssue(normalizedIssueKey, credentials);
  const workState = classifyJiraWorkState(issue);
  const repoSignals = readJiraRepoCompletionSignals({ issueKey: normalizedIssueKey, repoPath });
  const importedText = formatJiraIntakeText({ issue, workState, repoSignals });
  const targetAssignmentId = createNewAssignment
    ? createAssignmentForWork({
      title: `Jira: ${normalizedIssueKey}`,
      input: importedText,
      issueKey: normalizedIssueKey,
      repoPath
    }).id
    : (assignmentId || getActiveAssignmentId());
  setActiveAssignmentId(targetAssignmentId);
  const analysis = buildRequirementAnalysis({
    assignmentId: targetAssignmentId,
    input: importedText,
    repoPath,
    sourceType: 'jira-import'
  });
  const repoAnalysis = repoPath
    ? buildRepoAnalysis({ assignmentId: targetAssignmentId, repoPath })
    : null;
  const requirement = requirementRepository.listByAssignment(targetAssignmentId)[0] || {};
  const design = buildTechnicalDesign({
    assignmentId: targetAssignmentId,
    requirement,
    repoAnalysis: repoAnalysis || {},
    title: workState.state === 'completed' ? `${normalizedIssueKey} Verification Design` : `${normalizedIssueKey} Technical Design`
  });
  const plan = buildImplementationPlan({
    assignmentId: targetAssignmentId,
    design,
    title: workState.state === 'completed' ? `${normalizedIssueKey} Verification Plan` : `${normalizedIssueKey} Implementation Plan`
  });

  createRunEvent(createId('run'), 'jira_issue_imported_for_intake', workState.state === 'completed' ? 'ok' : 'warning', {
    assignmentId: targetAssignmentId,
    issueKey: normalizedIssueKey,
    issueStatus: issue.status,
    workState: workState.state,
    recommendedMode: workState.recommendedMode,
    repoEvidenceStatus: repoSignals.status,
    credentialSource: credentials.source,
    safeFieldsOnly: true
  }, targetAssignmentId);
  createRunEvent(createId('run'), 'jira_import_plan_created', 'ok', {
    assignmentId: targetAssignmentId,
    issueKey: normalizedIssueKey,
    planType: plan.planType || 'implementation',
    repoAnalyzed: Boolean(repoAnalysis)
  }, targetAssignmentId);

  return {
    assignmentId: targetAssignmentId,
    activeAssignmentId: targetAssignmentId,
    issue,
    workState,
    repoSignals,
    importedText,
    analysis,
    repoAnalysis,
    design,
    plan,
    metadata: {
      credentialSource: credentials.source,
      safeFieldsOnly: true
    }
  };
}

async function fetchJiraIssue(issueKey, credentials) {
  const fields = [
    'summary',
    'status',
    'issuetype',
    'project',
    'priority',
    'assignee',
    'reporter',
    'created',
    'updated',
    'description',
    'labels',
    'components',
    'fixVersions'
  ].join(',');
  const url = `${credentials.baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}?fields=${encodeURIComponent(fields)}`;
  const headers = { Accept: 'application/json' };
  if (credentials.authMode === 'basic') {
    headers.Authorization = `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`;
  } else {
    headers.Authorization = `Bearer ${credentials.token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const upstream = await fetch(url, { headers, signal: controller.signal });
    const contentType = upstream.headers.get('content-type') || '';
    const bodyText = await upstream.text();
    if (!upstream.ok) {
      const statusMessage = upstream.status === 404
        ? 'Jira issue was not found.'
        : upstream.status === 401 || upstream.status === 403
          ? 'Jira rejected the configured read credentials.'
          : `Jira read failed with HTTP ${upstream.status}.`;
      const error = new Error(statusMessage);
      error.httpStatus = upstream.status === 404 ? 404 : 502;
      error.upstreamStatus = upstream.status;
      error.upstreamContentType = contentType;
      error.upstreamPreview = safeResponsePreview(bodyText);
      throw error;
    }
    try {
      return simplifyJiraIssue(JSON.parse(bodyText), credentials.baseUrl);
    } catch {
      const classification = classifyUpstreamBody(contentType, bodyText);
      const error = new Error(classification.message);
      error.httpStatus = 502;
      error.upstreamStatus = upstream.status;
      error.upstreamContentType = contentType;
      error.upstreamResponseKind = classification.kind;
      error.upstreamPreview = classification.kind === 'html'
        ? 'HTML response received; preview suppressed. Check Jira base URL/auth/SSO.'
        : safeResponsePreview(bodyText);
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
}

function findCodexMcpServers(matchers = []) {
  if (!codexMcpConfig.enabled || !matchers.length) return [];
  return codexMcpConfig.servers.filter((server) => {
    const haystack = `${server.name}\n${server.command}\n${server.bodyText}`.toLowerCase();
    return matchers.some((matcher) => matcher.test(haystack));
  });
}

function optionalMcpConnector({
  id,
  label,
  enabledEnv,
  readOnlyEnv,
  serverNameEnv,
  phaseFit,
  description,
  codexMatchers = []
}) {
  const detectedServers = findCodexMcpServers(codexMatchers);
  const envServerName = process.env[serverNameEnv] || '';
  const detectedServerName = detectedServers[0]?.name || '';
  const serverName = envServerName || detectedServerName;
  const envEnabled = process.env[enabledEnv] === 'true';
  const codexDetected = Boolean(detectedServerName);

  return {
    id,
    label,
    enabledEnv,
    readOnlyEnv,
    serverNameEnv,
    enabled: envEnabled || codexDetected,
    readOnly: process.env[readOnlyEnv] !== 'false',
    serverName,
    configurationSource: envServerName || envEnabled
      ? 'environment'
      : codexDetected
        ? 'codex-config'
        : 'not-configured',
    detectedServers: detectedServers.map((server) => ({
      name: server.name,
      command: server.command,
      configPath: server.configPath,
      hasDockerEnvFile: server.hasDockerEnvFile
    })),
    phaseFit,
    description,
    requireWriteApproval: process.env.MCP_REQUIRE_APPROVAL_FOR_WRITE !== 'false',
    destructiveBlocked: true
  };
}

const connectorConfig = {
  mcpEnabled: process.env.ENABLE_MCP === 'true' || codexMcpConfig.servers.length > 0,
  mcpSource: process.env.ENABLE_MCP === 'true'
    ? 'environment'
    : codexMcpConfig.servers.length > 0
      ? 'codex-config'
      : 'not-configured',
  jira: optionalMcpConnector({
    id: 'jira',
    label: 'Jira SD MCP',
    enabledEnv: 'ENABLE_JIRA_MCP',
    readOnlyEnv: 'JIRA_MCP_READ_ONLY',
    serverNameEnv: 'JIRA_MCP_SERVER_NAME',
    phaseFit: 'Intake, clarify, review',
    description: 'Issue/request details, queues, SLA, attachments, and requirement context.',
    codexMatchers: [/jira/, /jirasd/, /atlassian/, /jira_personal_token/, /jira_url/]
  }),
  bitbucket: optionalMcpConnector({
    id: 'bitbucket',
    label: 'Bitbucket MCP',
    enabledEnv: 'ENABLE_BITBUCKET_MCP',
    readOnlyEnv: 'BITBUCKET_MCP_READ_ONLY',
    serverNameEnv: 'BITBUCKET_MCP_SERVER_NAME',
    phaseFit: 'Analyze, ingest, review, PR',
    description: 'Repo/branch/PR browsing, diffs, comments, PR creation, merge/decline where approved.'
  }),
  scm: optionalMcpConnector({
    id: 'scm',
    label: 'SCM MCP',
    enabledEnv: 'ENABLE_SCM_MCP',
    readOnlyEnv: 'SCM_MCP_READ_ONLY',
    serverNameEnv: 'SCM_MCP_SERVER_NAME',
    phaseFit: 'Analyze, delegate, review',
    description: 'Local git and SCM actions for branch/file analysis, implementation support, and PR comments.'
  }),
  buildservice: optionalMcpConnector({
    id: 'buildservice',
    label: 'Build Service MCP',
    enabledEnv: 'ENABLE_BUILDSERVICE_MCP',
    readOnlyEnv: 'BUILDSERVICE_MCP_READ_ONLY',
    serverNameEnv: 'BUILDSERVICE_MCP_SERVER_NAME',
    phaseFit: 'Verify, ingest, PR readiness',
    description: 'Build status, logs, artifacts, and approved build triggers.'
  }),
  devops: optionalMcpConnector({
    id: 'devops',
    label: 'DevOps MCP',
    enabledEnv: 'ENABLE_DEVOPS_MCP',
    readOnlyEnv: 'DEVOPS_MCP_READ_ONLY',
    serverNameEnv: 'DEVOPS_MCP_SERVER_NAME',
    phaseFit: 'Govern, operate, release',
    description: 'Operational context such as alarms, logs, runbooks, services, regions, and release metadata.'
  }),
  memory: optionalMcpConnector({
    id: 'memory',
    label: 'Memory Service MCP',
    enabledEnv: 'ENABLE_MEMORY_MCP',
    readOnlyEnv: 'MEMORY_MCP_READ_ONLY',
    serverNameEnv: 'MEMORY_MCP_SERVER_NAME',
    phaseFit: 'Clarify, plan, relay, evidence',
    description: 'Shared persistent context, namespaces, ACLs, handoffs, and project memory.'
  }),
  sks: optionalMcpConnector({
    id: 'sks',
    label: 'SKS Knowledge MCP',
    enabledEnv: 'ENABLE_SKS_MCP',
    readOnlyEnv: 'SKS_MCP_READ_ONLY',
    serverNameEnv: 'SKS_MCP_SERVER_NAME',
    phaseFit: 'Analyze, govern, guide',
    description: 'Internal standards, architecture, SDLC, and knowledge retrieval.'
  }),
  askoracle: optionalMcpConnector({
    id: 'askoracle',
    label: 'Ask Oracle Knowledge',
    enabledEnv: 'ENABLE_ASK_ORACLE',
    readOnlyEnv: 'ASK_ORACLE_READ_ONLY',
    serverNameEnv: 'ASK_ORACLE_SERVER_NAME',
    phaseFit: 'Clarify, design, guide',
    description: 'Ask Oracle knowledge collections for internal context retrieval.'
  }),
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

  CREATE TABLE IF NOT EXISTS project_contracts (
    id TEXT PRIMARY KEY,
    assignment_id TEXT,
    project_name TEXT NOT NULL,
    owner_team TEXT,
    repo_path TEXT,
    base_branch TEXT,
    risk_profile TEXT NOT NULL,
    install_command TEXT,
    build_command TEXT,
    test_command TEXT,
    run_ui_command TEXT,
    run_api_command TEXT,
    deploy_command TEXT,
    known_issues_json TEXT NOT NULL,
    blocked_commands_json TEXT NOT NULL,
    approval_notes_json TEXT NOT NULL,
    evidence_notes_json TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
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
    sources_json TEXT NOT NULL DEFAULT '[]',
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

  CREATE TABLE IF NOT EXISTS ai_work_audit_packs (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    stage TEXT NOT NULL,
    status TEXT NOT NULL,
    pack_json TEXT NOT NULL,
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
    analysis_json TEXT NOT NULL DEFAULT '{}',
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

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
  if (!columns.includes(columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

ensureColumn('intake_assets', 'analysis_json', "TEXT NOT NULL DEFAULT '{}'");
ensureColumn('ai_usage_events', 'sources_json', "TEXT NOT NULL DEFAULT '[]'");

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
  upsertProjectContract: db.prepare(`
    INSERT INTO project_contracts (
      id, assignment_id, project_name, owner_team, repo_path, base_branch, risk_profile,
      install_command, build_command, test_command, run_ui_command, run_api_command,
      deploy_command, known_issues_json, blocked_commands_json, approval_notes_json,
      evidence_notes_json, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      assignment_id = excluded.assignment_id,
      project_name = excluded.project_name,
      owner_team = excluded.owner_team,
      repo_path = excluded.repo_path,
      base_branch = excluded.base_branch,
      risk_profile = excluded.risk_profile,
      install_command = excluded.install_command,
      build_command = excluded.build_command,
      test_command = excluded.test_command,
      run_ui_command = excluded.run_ui_command,
      run_api_command = excluded.run_api_command,
      deploy_command = excluded.deploy_command,
      known_issues_json = excluded.known_issues_json,
      blocked_commands_json = excluded.blocked_commands_json,
      approval_notes_json = excluded.approval_notes_json,
      evidence_notes_json = excluded.evidence_notes_json,
      status = excluded.status,
      updated_at = excluded.updated_at
  `),
  selectProjectContracts: db.prepare(`
    SELECT id, assignment_id AS assignmentId, project_name AS projectName, owner_team AS ownerTeam,
      repo_path AS repoPath, base_branch AS baseBranch, risk_profile AS riskProfile,
      install_command AS installCommand, build_command AS buildCommand, test_command AS testCommand,
      run_ui_command AS runUiCommand, run_api_command AS runApiCommand, deploy_command AS deployCommand,
      known_issues_json AS knownIssuesJson, blocked_commands_json AS blockedCommandsJson,
      approval_notes_json AS approvalNotesJson, evidence_notes_json AS evidenceNotesJson,
      status, created_at AS createdAt, updated_at AS updatedAt
    FROM project_contracts
    ORDER BY updated_at DESC
  `),
  selectProjectContractsByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, project_name AS projectName, owner_team AS ownerTeam,
      repo_path AS repoPath, base_branch AS baseBranch, risk_profile AS riskProfile,
      install_command AS installCommand, build_command AS buildCommand, test_command AS testCommand,
      run_ui_command AS runUiCommand, run_api_command AS runApiCommand, deploy_command AS deployCommand,
      known_issues_json AS knownIssuesJson, blocked_commands_json AS blockedCommandsJson,
      approval_notes_json AS approvalNotesJson, evidence_notes_json AS evidenceNotesJson,
      status, created_at AS createdAt, updated_at AS updatedAt
    FROM project_contracts
    WHERE assignment_id = ? OR assignment_id = ''
    ORDER BY assignment_id DESC, updated_at DESC
  `),
  selectProjectContractById: db.prepare(`
    SELECT id, assignment_id AS assignmentId, project_name AS projectName, owner_team AS ownerTeam,
      repo_path AS repoPath, base_branch AS baseBranch, risk_profile AS riskProfile,
      install_command AS installCommand, build_command AS buildCommand, test_command AS testCommand,
      run_ui_command AS runUiCommand, run_api_command AS runApiCommand, deploy_command AS deployCommand,
      known_issues_json AS knownIssuesJson, blocked_commands_json AS blockedCommandsJson,
      approval_notes_json AS approvalNotesJson, evidence_notes_json AS evidenceNotesJson,
      status, created_at AS createdAt, updated_at AS updatedAt
    FROM project_contracts
    WHERE id = ?
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
      status, error, fallback_used, sources_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectAiUsage: db.prepare(`
    SELECT id, request_id AS requestId, run_id AS runId, session_id AS sessionId, user_id AS userId,
      request_type AS requestType, provider, model, input_chars AS inputChars,
      prompt_tokens AS promptTokens, completion_tokens AS completionTokens, total_tokens AS totalTokens,
      latency_ms AS latencyMs, status, error, fallback_used AS fallbackUsed, sources_json AS sourcesJson,
      created_at AS createdAt
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
  insertAiWorkAuditPack: db.prepare(`
    INSERT INTO ai_work_audit_packs (id, assignment_id, stage, status, pack_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  selectAiWorkAuditPacksByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, stage, status, pack_json AS packJson, created_at AS createdAt
    FROM ai_work_audit_packs
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  selectAiWorkAuditPackById: db.prepare(`
    SELECT id, assignment_id AS assignmentId, stage, status, pack_json AS packJson, created_at AS createdAt
    FROM ai_work_audit_packs
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
      source_kind, analysis_json, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectIntakeAssetsByAssignment: db.prepare(`
    SELECT id, assignment_id AS assignmentId, original_name AS originalName,
      stored_name AS storedName, stored_path AS storedPath, mime_type AS mimeType,
      file_type AS fileType, bytes, source_kind AS sourceKind, analysis_json AS analysisJson,
      status, created_at AS createdAt
    FROM intake_assets
    WHERE assignment_id = ?
    ORDER BY created_at DESC
  `),
  selectIntakeAssetById: db.prepare(`
    SELECT id, assignment_id AS assignmentId, original_name AS originalName,
      stored_name AS storedName, stored_path AS storedPath, mime_type AS mimeType,
      file_type AS fileType, bytes, source_kind AS sourceKind, analysis_json AS analysisJson,
      status, created_at AS createdAt
    FROM intake_assets
    WHERE id = ?
  `),
  updateIntakeAssetAnalysis: db.prepare(`
    UPDATE intake_assets
    SET analysis_json = ?
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

const settingsRepository = createSettingsRepository({
  statements
});

const assignmentRepository = createAssignmentRepository({
  statements
});

const promptTemplateRepository = createPromptTemplateRepository({
  statements
});

const projectContractRepository = createProjectContractRepository({
  statements
});

const settingsService = createSettingsService({
  settingsRepository,
  promptTemplateRepository,
  safeAiConfig,
  listConnectors,
  connectorConfig,
  uploadPolicy,
  workspaceDir
});

	seedDefaults();

function seedDefaults() {
  const now = new Date().toISOString();
  [
    ['guide-chat-v1', 'ODT Guide Chat', 'chat', 'v1', 'Answer with ODT workflow context, next action, and safety guidance.'],
    ['plan-generation-v1', 'Plan Generation', 'recommend', 'v1', 'Convert user work into a review-first implementation plan.'],
    ['json-extraction-v1', 'Structured Extraction', 'extract-json', 'v1', 'Extract task metadata, risks, dependencies, and acceptance criteria.']
  ].forEach(([id, name, requestType, version, template]) => {
    promptTemplateRepository.createTemplate({ id, name, requestType, version, template, active: 1, createdAt: now, updatedAt: now });
  });

  if (!assignmentRepository.list().length) {
    assignmentRepository.createAssignment({
      id: 'assignment-local-mvp',
      title: 'Local Workbench MVP',
      requirement: 'Build the governed ODT Workbench control plane with backend-owned AI, usage logging, OpenAPI, and human approval gates.',
      owner: 'Vijay',
      status: 'needs review',
      priority: 'high',
      repoPath: appRoot,
      createdAt: now,
      updatedAt: now
    });
    setActiveAssignmentId('assignment-local-mvp');
  } else if (!getStoredSetting('activeAssignmentId', '')) {
    setActiveAssignmentId(assignmentRepository.list()[0]?.id || 'assignment-local-mvp');
  }

  seedDefaultProjectContract(now);
}

function seedDefaultProjectContract(now = new Date().toISOString()) {
  if (projectContractRepository.getById('odt-workbench-local')) return;
  projectContractRepository.upsertContract({
    id: 'odt-workbench-local',
    assignmentId: 'assignment-local-mvp',
    projectName: 'ODT Workbench Local',
    ownerTeam: 'ODT 2.0',
    repoPath: appRoot,
    baseBranch: 'main',
    riskProfile: 'medium',
    installCommand: 'npm install',
    buildCommand: 'npm run build',
    testCommand: 'npm --prefix "odt 2.0 enterprise" run check',
    runUiCommand: 'npm run dev',
    runApiCommand: 'npm run api',
    deployCommand: '',
    knownIssues: [
      'Keep the existing ODT app running on API port 5190 and UI port 5189 during demos.',
      'Do not treat terminal worker completion as sufficient; worker output must be ingested back into ODT.'
    ],
    blockedCommands: [
      'git reset --hard',
      'git checkout -- .',
      'rm -rf'
    ],
    approvalNotes: [
      'Writes, dependency installs, PR creation, and deployment require explicit human approval.',
      'Preserve the frozen baseline and validate Agent Team relay behavior after workflow changes.'
    ],
    evidenceNotes: [
      'Run `npm run build` and `npm --prefix "odt 2.0 enterprise" run check` after enterprise module changes.',
      'Use Agent Team relay smoke after Agent Team, workflow, relay, or evidence changes.'
    ],
    status: 'active',
    createdAt: now,
    updatedAt: now
  });
}

function setActiveAssignmentId(assignmentId) {
  if (!assignmentId) return '';
  settingsRepository.setValue('activeAssignmentId', assignmentId, new Date().toISOString());
  return assignmentId;
}

function getActiveAssignmentId() {
  const stored = getStoredSetting('activeAssignmentId', '');
  if (stored && getAssignment(stored)) return stored;
  const latest = assignmentRepository.list()[0]?.id || 'assignment-local-mvp';
  if (latest) setActiveAssignmentId(latest);
  return latest;
}

function compactTimestamp(value = new Date()) {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');
}

function compactTimestampWithMillis(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const safeDate = Number.isFinite(date.getTime()) ? date : new Date();
  return safeDate.toISOString().replace(/[-:]/g, '').replace('.', '').replace('Z', '');
}

function slugForAssignmentId(value = '') {
  return String(value || 'task')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'task';
}

function createAssignmentIdForWork({ issueKey = '', title = '' } = {}) {
  const base = normalizeJiraIssueKey(issueKey) || slugForAssignmentId(title) || 'task';
  let id = `assignment_${slugForAssignmentId(base)}_${compactTimestamp()}`;
  let suffix = 2;
  while (getAssignment(id)) {
    id = `assignment_${slugForAssignmentId(base)}_${compactTimestamp()}_${suffix}`;
    suffix += 1;
  }
  return id;
}

function createAssignmentForWork({ title = '', input = '', repoPath = '', issueKey = '', owner = process.env.USER || 'local-user', priority = 'high' } = {}) {
  const now = new Date().toISOString();
  const rawText = String(input || '').trim();
  const detectedIssueKey = normalizeJiraIssueKey(issueKey || rawText);
  const rawDerivedTitle = title || deriveAssignmentTitle(rawText) || 'New ODT Work Item';
  const derivedTitle = detectedIssueKey && rawDerivedTitle && !rawDerivedTitle.includes(detectedIssueKey)
    ? `Jira: ${detectedIssueKey} - ${rawDerivedTitle}`
    : rawDerivedTitle;
  const repoName = repoPath ? basenameFromPath(repoPath) : '';
  const finalTitle = repoName && !derivedTitle.toLowerCase().includes(repoName.toLowerCase())
    ? `${derivedTitle} - ${repoName}`
    : derivedTitle;
  const requirement = rawText
    ? rawText.replace(/\s+/g, ' ').trim().slice(0, 360)
    : 'New ODT work item awaiting requirement analysis.';
  const assignmentId = createAssignmentIdForWork({ issueKey: detectedIssueKey, title: finalTitle });
  assignmentRepository.createAssignment({
    id: assignmentId,
    title: finalTitle,
    requirement,
    owner,
    status: 'needs review',
    priority,
    repoPath: repoPath || null,
    createdAt: now,
    updatedAt: now
  });
  setActiveAssignmentId(assignmentId);
  createRunEvent(createId('run'), 'assignment_created_for_intake', 'ok', {
    assignmentId,
    title: finalTitle,
    repoPath: repoPath || ''
  }, assignmentId);
  return getAssignment(assignmentId);
}

function createPrPackId({ generatedAt = new Date(), linkedJira = '', assignmentId = '' } = {}) {
  const workKey = normalizeJiraIssueKey(linkedJira) || slugForAssignmentId(assignmentId).toUpperCase();
  return `PRPACK-${compactTimestampWithMillis(generatedAt)}-${workKey || 'TASK'}`;
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
  const usage = aiUsageRepository.list().map(hydrateAiUsageEvent);
  const runs = listRuns();
  const activeAssignmentId = getActiveAssignmentId();
  const assignments = assignmentRepository.list().map((assignment) => ({
    ...assignment,
    isActive: assignment.id === activeAssignmentId,
    workflowState: deriveWorkflowStateFromModule(collectEvidence(assignment.id))
  })).sort((a, b) => {
    if (a.id === activeAssignmentId) return -1;
    if (b.id === activeAssignmentId) return 1;
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
  return {
    generatedAt: new Date().toISOString(),
    environment: aiConfig.environment,
    user: process.env.USER || 'local-user',
    activeAssignmentId,
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
  const provider = createGenAiProvider(aiConfig);
  return {
    provider: aiConfig.provider,
    activeProvider: provider.id,
    executionAgent: getStoredSetting('executionAgent', 'codex'),
    environment: aiConfig.environment,
    model: provider.model,
    region: aiConfig.region || 'not configured',
    genAiEndpointConfigured: aiConfig.genAiEndpointConfigured,
    compartmentConfigured: aiConfig.compartmentConfigured,
    openAiBaseUrlConfigured: Boolean(aiConfig.openAiBaseUrl),
    openAiApiKeyConfigured: Boolean(aiConfig.openAiApiKey),
    ollamaBaseUrlConfigured: Boolean(aiConfig.ollamaBaseUrl),
    ociAuthConfigured: provider.id === 'oci' ? provider.isConfigured().configuredAuth : Boolean(aiConfig.ociBearerToken),
    ociOpenAiCompatible: aiConfig.ociOpenAiCompatible,
    chatModelConfigured: aiConfig.chatModelConfigured,
    embedModelConfigured: aiConfig.embedModelConfigured,
    providerReady: provider.isConfigured().ready,
    providerStatus: provider.isConfigured().message,
    authMode: aiConfig.authMode,
    configProfileConfigured: aiConfig.configProfileConfigured,
    agentEndpointConfigured: aiConfig.agentEndpointConfigured,
    ragEnabled: aiConfig.ragEnabled,
    ragMode: aiConfig.ragMode,
    vectorStore: aiConfig.vectorStore,
    limits
  };
}

function recentConnectorIssue(connectorId, maxAgeMs = 6 * 60 * 60 * 1000) {
  const nowMs = Date.now();
  const latest = connectorEventRepository.list()
    .filter((event) => event.connectorId === connectorId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
  if (!latest) return null;
  const ageMs = nowMs - timeMillis(latest.createdAt);
  if (Number.isFinite(ageMs) && ageMs > maxAgeMs) return null;
  const status = String(latest.status || '').toLowerCase();
  if (['ok', 'ready', 'passed'].includes(status)) return null;
  return {
    connectorId,
    action: latest.action,
    mode: latest.mode,
    status: latest.status,
    detail: parseJsonValue(latest.detail, latest.detail),
    createdAt: latest.createdAt
  };
}

function listConnectors() {
  return [
    connectorConfig.jira,
    connectorConfig.bitbucket,
    connectorConfig.scm,
    connectorConfig.buildservice,
    connectorConfig.devops,
    connectorConfig.memory,
    connectorConfig.sks,
    connectorConfig.askoracle
  ].map((connector) => {
    const missingConfig = [
      connectorConfig.mcpEnabled ? '' : 'ENABLE_MCP',
      connector.enabled ? '' : connector.enabledEnv,
      connector.serverName ? '' : connector.serverNameEnv
    ].filter(Boolean);
    const ready = missingConfig.length === 0;
    const recentIssue = ready ? recentConnectorIssue(connector.id) : null;
    const degraded = Boolean(recentIssue);
    const readiness = ready
      ? degraded
        ? 'DEGRADED'
        : 'READY'
      : !connectorConfig.mcpEnabled
        ? 'MCP_DISABLED'
        : !connector.enabled
          ? 'CONNECTOR_DISABLED'
          : 'SERVER_MISSING';
    const readinessDetail = ready
      ? degraded
        ? `Connector is configured but the latest live ${recentIssue.action || 'read'} check returned ${recentIssue.status}. ${monitoringMessageFromDetail(recentIssue.detail, 'Review the connector event in Monitoring and retry after fixing auth/base URL/SSO state.')}`
        : connector.id === 'jira'
        ? `Jira connector is ready through ${connector.configurationSource === 'codex-config' ? `Codex MCP server ${connector.serverName}` : 'server environment configuration'}. ODT can perform backend-only read issue lookups with safe fields only; writes still require approval.`
        : connector.configurationSource === 'codex-config'
        ? `Connector is ready through Codex MCP server ${connector.serverName}. ODT can gate read handoff; direct MCP transport remains an adapter layer.`
        : 'Connector is ready for governed read checks. Write actions still require approval.'
      : `Missing ${missingConfig.join(', ')}. Connector remains blocked until configured.`;
    return {
      id: connector.id,
      label: connector.label,
      enabled: ready,
      featureEnabled: connector.enabled,
      mcpEnabled: connectorConfig.mcpEnabled,
      mcpSource: connectorConfig.mcpSource,
      readOnly: connector.readOnly,
      configurationSource: connector.configurationSource,
      serverConfigured: Boolean(connector.serverName),
      serverName: connector.serverName || '',
      detectedServers: connector.detectedServers || [],
      phaseFit: connector.phaseFit,
      description: connector.description,
      readiness,
      readinessDetail,
      recentIssue,
      missingConfig,
      requireWriteApproval: connector.requireWriteApproval,
      destructiveBlocked: connector.destructiveBlocked
    };
  });
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

function hydrateAiUsageEvent(event) {
  const sources = parseJsonValue(event.sourcesJson, []);
  const { sourcesJson, ...rest } = event;
  return {
    ...rest,
    fallbackUsed: Boolean(rest.fallbackUsed),
    sources: Array.isArray(sources) ? sources : []
  };
}

function listRuns({ assignmentId = '' } = {}) {
  const events = runEventRepository.list();
  const grouped = new Map();
  events.forEach((event) => {
    if (assignmentId && event.assignmentId !== assignmentId) return;
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

function localModelForRequest(requestType) {
  if (requestType === 'embed') return 'local-placeholder-embed';
  if (requestType === 'chat') return 'local-guide-model';
  return `local-${requestType}-model`;
}

function normalizeBaseUrl(value = '') {
  return String(value || '').replace(/\/+$/, '');
}

function joinUrl(base, path) {
  return `${normalizeBaseUrl(base)}${path.startsWith('/') ? path : `/${path}`}`;
}

function chatCompletionsUrl(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  return normalized.endsWith('/chat/completions') ? normalized : joinUrl(normalized, '/chat/completions');
}

function safeModelLabel(value, fallback) {
  return String(value || '').trim() || fallback;
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function parseProviderText(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data.output_text === 'string') return data.output_text;
  if (typeof data.response === 'string') return data.response;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.content === 'string') return data.content;
  const choice = Array.isArray(data.choices) ? data.choices[0] : null;
  if (choice?.message?.content) {
    const content = choice.message.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((item) => item.text || item.content || '')
        .filter(Boolean)
        .join('\n');
    }
  }
  if (choice?.text) return choice.text;
  if (Array.isArray(data.output)) {
    return data.output
      .flatMap((item) => item.content || [])
      .map((item) => item.text || item.content || '')
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function normalizeProviderUsage(data, input, output) {
  const usage = data?.usage || {};
  const promptTokens = Number(usage.prompt_tokens || usage.input_tokens || usage.promptTokens || estimateTokens(input));
  const completionTokens = Number(usage.completion_tokens || usage.output_tokens || usage.completionTokens || estimateTokens(output));
  return {
    promptTokens,
    completionTokens,
    totalTokens: Number(usage.total_tokens || usage.totalTokens || promptTokens + completionTokens)
  };
}

function buildProviderPrompt({ question, context = [], requestType = 'chat' }) {
  return [
    'You are ODT Guide inside Oracle Developer Twin Workbench.',
    'Answer as a helpful enterprise SDLC workbench coach.',
    'Use only the supplied ODT context and general safe reasoning.',
    'Do not approve write actions, dependency installs, blocker overrides, or external updates.',
    'If information is missing, say what is missing and which ODT page or gate should capture it.',
    'Keep responses practical and evidence-aware.',
    '',
    `Request type: ${requestType}`,
    '',
    'Retrieved ODT context:',
    context.length ? context.map((item, index) => `Context ${index + 1}:\n${item}`).join('\n\n') : 'No retrieved context.',
    '',
    `User question:\n${question}`
  ].join('\n');
}

function buildProviderContext(question, assignmentId = 'assignment-local-mvp', limit = 6) {
  const corpus = buildKnowledgeCorpus(assignmentId);
  const sources = rankKnowledge(question, corpus, limit);
  const context = sources.map((source) => [
    `Title: ${source.title}`,
    `Type: ${source.type}`,
    `Source: ${source.source}`,
    source.content
  ].join('\n'));
  return { context, sources };
}

class LocalDeterministicProvider {
  constructor(config) {
    this.id = 'local';
    this.model = 'local-guide-model';
    this.config = config;
  }

  isConfigured() {
    return {
      ready: true,
      configuredAuth: false,
      message: 'Local deterministic RAG is active. No remote provider is required.'
    };
  }

  async chat({ question, snapshot, assignmentId }) {
    const sourceSink = { sources: [] };
    const content = localProviderContent('chat', question, snapshot, assignmentId, { sourceSink });
    return {
      provider: this.id,
      model: this.model,
      content,
      usage: {
        promptTokens: estimateTokens(question),
        completionTokens: estimateTokens(content),
        totalTokens: estimateTokens(question) + estimateTokens(content)
      },
      fallbackUsed: true,
      sources: sourceSink.sources
    };
  }
}

class OpenAICompatibleProvider {
  constructor(config, options = {}) {
    this.id = options.id || 'openai';
    this.label = options.label || this.id;
    this.baseUrl = normalizeBaseUrl(options.baseUrl || config.openAiBaseUrl);
    this.apiKey = options.apiKey || config.openAiApiKey;
    this.model = safeModelLabel(options.model || config.model, this.id === 'oci' ? 'oci-configured-model' : 'configured-chat-model');
    this.timeoutMs = config.limits.requestTimeoutMs;
    this.maxOutputTokens = config.limits.maxOutputTokens;
    this.extraHeaders = options.extraHeaders || {};
  }

  isConfigured() {
    const missing = [];
    if (!this.baseUrl) missing.push('base URL');
    if (!this.apiKey) missing.push('API key or bearer token');
    if (!this.model) missing.push('model');
    return {
      ready: missing.length === 0,
      configuredAuth: Boolean(this.apiKey),
      message: missing.length
        ? `${this.label} is missing ${missing.join(', ')}. ODT will use local deterministic RAG.`
        : `${this.label} provider is ready behind the backend adapter.`
    };
  }

  async chat({ question, context = [], requestType = 'chat' }) {
    const status = this.isConfigured();
    if (!status.ready) throw new Error(status.message);
    const prompt = buildProviderPrompt({ question, context, requestType });
    const { signal, clear } = createTimeoutSignal(this.timeoutMs);
    try {
      const response = await fetch(chatCompletionsUrl(this.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...this.extraHeaders
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are ODT Guide. Ground answers in retrieved ODT evidence and preserve governance gates.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: this.maxOutputTokens
        }),
        signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(`${this.label} request failed with HTTP ${response.status}${data?.error?.message ? `: ${data.error.message}` : ''}`);
      }
      const content = parseProviderText(data).trim();
      if (!content) throw new Error(`${this.label} returned an empty response.`);
      return {
        provider: this.id,
        model: this.model,
        content,
        usage: normalizeProviderUsage(data, prompt, content),
        fallbackUsed: false
      };
    } finally {
      clear();
    }
  }
}

class OllamaProvider {
  constructor(config) {
    this.id = 'ollama';
    this.baseUrl = normalizeBaseUrl(config.ollamaBaseUrl);
    this.model = safeModelLabel(config.model, 'llama3.1');
    this.timeoutMs = config.limits.requestTimeoutMs;
    this.maxOutputTokens = config.limits.maxOutputTokens;
  }

  isConfigured() {
    const missing = [];
    if (!this.baseUrl) missing.push('base URL');
    if (!this.model) missing.push('model');
    return {
      ready: missing.length === 0,
      configuredAuth: false,
      message: missing.length
        ? `Ollama is missing ${missing.join(', ')}. ODT will use local deterministic RAG.`
        : 'Ollama local model provider is configured.'
    };
  }

  async chat({ question, context = [], requestType = 'chat' }) {
    const status = this.isConfigured();
    if (!status.ready) throw new Error(status.message);
    const prompt = buildProviderPrompt({ question, context, requestType });
    const { signal, clear } = createTimeoutSignal(this.timeoutMs);
    try {
      const response = await fetch(joinUrl(this.baseUrl, '/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are ODT Guide. Ground answers in retrieved ODT evidence and preserve governance gates.'
            },
            { role: 'user', content: prompt }
          ],
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: this.maxOutputTokens
          }
        }),
        signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(`Ollama request failed with HTTP ${response.status}${data?.error ? `: ${data.error}` : ''}`);
      }
      const content = parseProviderText(data.message || data).trim();
      if (!content) throw new Error('Ollama returned an empty response.');
      return {
        provider: this.id,
        model: this.model,
        content,
        usage: normalizeProviderUsage(data, prompt, content),
        fallbackUsed: false
      };
    } finally {
      clear();
    }
  }
}

class OCIProvider extends OpenAICompatibleProvider {
  constructor(config) {
    super(config, {
      id: 'oci',
      label: 'OCI GenAI',
      baseUrl: config.ociOpenAiBaseUrl,
      apiKey: config.ociBearerToken,
      model: config.model,
      extraHeaders: config.compartmentId ? { 'opc-compartment-id': config.compartmentId } : {}
    });
    this.compartmentId = config.compartmentId;
    this.region = config.region;
    this.openAiCompatible = config.ociOpenAiCompatible || Boolean(config.ociBearerToken);
    this.configProfileConfigured = config.configProfileConfigured;
  }

  isConfigured() {
    const missing = [];
    if (!this.baseUrl) missing.push('OCI GenAI endpoint or OpenAI-compatible base URL');
    if (!this.model) missing.push('GENAI_MODEL or OCI_GENAI_CHAT_MODEL_ID');
    if (!this.apiKey) missing.push('OCI_GENAI_BEARER_TOKEN/OCI_GENAI_API_KEY for OpenAI-compatible HTTP');
    return {
      ready: missing.length === 0,
      configuredAuth: Boolean(this.apiKey || this.configProfileConfigured),
      message: missing.length
        ? `OCI GenAI is missing ${missing.join(', ')}. Native OCI profile signing is a future adapter path; ODT will use local deterministic RAG for now.`
        : 'OCI GenAI is ready through the backend OpenAI-compatible adapter.'
    };
  }
}

function createGenAiProvider(config) {
  switch (config.provider) {
    case 'openai':
      return new OpenAICompatibleProvider(config);
    case 'oci':
      return new OCIProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    default:
      return new LocalDeterministicProvider(config);
  }
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
  runEventRepository.createEvent({
    id: createId('event'),
    runId,
    assignmentId,
    eventType,
    status,
    detail
  });
}

function parseSmokeScriptJson(stdout) {
  const text = String(stdout || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function normalizeSmokeScreenshots(parsed) {
  const screenshots = Array.isArray(parsed?.screenshots) ? parsed.screenshots : [];
  return screenshots.map((item) => ({
    name: item.name || 'screenshot',
    screenshotPath: item.screenshotPath || item.path || ''
  })).filter((item) => item.screenshotPath);
}

function runUiSmokeScript({ assignmentId = 'assignment-local-mvp', expectedIssue = '', runId = createId('run') } = {}) {
  const workflow = collectEvidence(assignmentId).workflowState || {};
  const issueKey = String(expectedIssue || workflow.verificationProfile?.issueKey || process.env.ODT_EXPECT_ISSUE || '').trim();
  const appBase = process.env.ODT_VALIDATION_APP_BASE || process.env.ODT_APP_BASE || 'http://127.0.0.1:5189';
  const apiBase = process.env.ODT_VALIDATION_API_BASE || `http://127.0.0.1:${port}`;
  const screenshotDir = join(appRoot, 'output', 'playwright', 'monitoring', runId);
  const timeoutMs = Number(process.env.ODT_VALIDATION_TIMEOUT_MS || 90000);
  const scriptPath = join(appRoot, 'scripts', 'odt-ui-smoke.mjs');
  const startedAt = new Date().toISOString();

  createRunEvent(runId, 'ui_smoke_validation_started', 'running', {
    requestType: 'validation',
    validationType: 'ui_smoke',
    assignmentId,
    expectedIssue: issueKey,
    appBase,
    apiBase,
    timeoutMs,
    screenshotDir,
    startedAt
  }, assignmentId);

  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [scriptPath],
      {
        cwd: appRoot,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024,
        env: {
          ...process.env,
          ODT_APP_BASE: appBase,
          ODT_API_BASE: apiBase,
          ODT_ASSIGNMENT_ID: assignmentId,
          ODT_EXPECT_ISSUE: issueKey,
          ODT_SMOKE_SCREENSHOT_DIR: screenshotDir
        }
      },
      (error, stdout = '', stderr = '') => {
        const completedAt = new Date().toISOString();
        const parsed = parseSmokeScriptJson(stdout);
        const passed = !error && parsed?.status === 'passed';
        const detail = {
          requestType: 'validation',
          validationType: 'ui_smoke',
          assignmentId,
          expectedIssue: issueKey,
          appBase,
          apiBase,
          status: passed ? 'passed' : 'failed',
          passed,
          exitCode: error ? error.code || 1 : 0,
          signal: error?.signal || null,
          timedOut: Boolean(error?.killed),
          screenshots: normalizeSmokeScreenshots(parsed),
          stdout: truncateForApi(stdout, 12000),
          stderr: truncateForApi(stderr || error?.message || '', 12000),
          screenshotDir,
          startedAt,
          completedAt
        };
        createRunEvent(runId, 'ui_smoke_validation_completed', passed ? 'ok' : 'error', detail, assignmentId);
        resolve({ runId, ...detail });
      }
    );
  });
}

function listValidationRuns(limit = 10, assignmentId = '') {
  const grouped = new Map();
  runEventRepository.list().forEach((event) => {
    if (!String(event.eventType || '').startsWith('ui_smoke_validation_')) return;
    if (assignmentId && event.assignmentId !== assignmentId) return;
    if (!grouped.has(event.runId)) {
      grouped.set(event.runId, {
        runId: event.runId,
        assignmentId: event.assignmentId,
        status: event.status === 'running' ? 'running' : 'unknown',
        passed: false,
        latestEventType: event.eventType,
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
        events: []
      });
    }
    const run = grouped.get(event.runId);
    const detail = parseJsonValue(event.detail, {});
    run.events.push({ ...event, detailJson: compactJsonForApi(detail, { maxString: 1600, maxArray: 30, maxDepth: 5 }) });
    if (event.createdAt >= run.updatedAt) {
      run.updatedAt = event.createdAt;
      run.latestEventType = event.eventType;
      run.status = detail.status || event.status;
      run.passed = Boolean(detail.passed);
      run.expectedIssue = detail.expectedIssue || run.expectedIssue;
      run.appBase = detail.appBase || run.appBase;
      run.apiBase = detail.apiBase || run.apiBase;
      run.screenshots = normalizeSmokeScreenshots(detail);
      run.stderr = truncateForApi(detail.stderr || '', 2200);
      run.stdout = truncateForApi(detail.stdout || '', 2200);
      run.screenshotDir = detail.screenshotDir || run.screenshotDir;
      run.exitCode = detail.exitCode ?? run.exitCode;
      run.timedOut = Boolean(detail.timedOut);
    }
    if (event.createdAt < run.createdAt) run.createdAt = event.createdAt;
  });
  return Array.from(grouped.values())
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, limit);
}

function monitoringLabel(value = '') {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function monitoringStatusSeverity(status = '', fallback = 'info') {
  const text = String(status || '').toLowerCase();
  if (text.includes('error') || text.includes('fail') || text.includes('timeout')) return 'critical';
  if (text.includes('block') || text.includes('rejected') || text.includes('denied')) return 'blocked';
  if (text.includes('warning') || text.includes('needs') || text.includes('review') || text.includes('pending') || text.includes('approval') || text.includes('fallback')) return 'warning';
  return fallback;
}

function isConnectorOkStatus(status = '') {
  return ['ok', 'ready', 'passed'].includes(String(status || '').toLowerCase());
}

function monitoringMessageFromDetail(detail, fallback = '') {
  if (typeof detail === 'string') return truncateForApi(detail, 900);
  if (!detail || typeof detail !== 'object') return truncateForApi(fallback, 900);
  const value = detail.error
    || detail.reason
    || detail.message
    || detail.nextStep
    || detail.readinessDetail
    || detail.status
    || fallback;
  if (value) return truncateForApi(value, 900);
  return truncateForApi(JSON.stringify(compactJsonForApi(detail, { maxString: 500, maxArray: 8, maxDepth: 3 })), 900);
}

function connectorEventIssueKey(event = {}, detail = {}) {
  const detailValue = detail && typeof detail === 'object'
    ? detail.issueKey || detail.ticketKey || detail.query || detail.browseUrl || detail.note || detail.reason || detail.message
    : detail;
  return normalizeJiraIssueKey(detailValue || event.detail || '');
}

function connectorEventAssignmentId(detail = {}) {
  return detail && typeof detail === 'object' ? String(detail.assignmentId || '') : '';
}

function findSupersedingConnectorEvent(event, detail, connectorEvents, fallbackIssueKey = '') {
  const eventTime = timeMillis(event.createdAt);
  const eventIssueKey = connectorEventIssueKey(event, detail) || fallbackIssueKey;
  return connectorEvents.find((candidate) => {
    if (!isConnectorOkStatus(candidate.status)) return false;
    if (candidate.connectorId !== event.connectorId || candidate.action !== event.action) return false;
    if (timeMillis(candidate.createdAt) <= eventTime) return false;
    const candidateDetail = candidate.parsedDetail;
    const candidateIssueKey = connectorEventIssueKey(candidate, candidateDetail) || fallbackIssueKey;
    return !eventIssueKey || !candidateIssueKey || eventIssueKey === candidateIssueKey;
  }) || null;
}

function findSupersedingValidationRun({ runId = '', assignmentId = '', expectedIssue = '', createdAt = '' } = {}, validationRuns = [], fallbackIssueKey = '') {
  const eventTime = timeMillis(createdAt);
  const eventIssueKey = normalizeJiraIssueKey(expectedIssue || fallbackIssueKey);
  return validationRuns.find((candidate) => {
    if (!candidate.passed) return false;
    if (candidate.runId === runId) return false;
    if (assignmentId && candidate.assignmentId && candidate.assignmentId !== assignmentId) return false;
    if (timeMillis(candidate.updatedAt || candidate.createdAt) <= eventTime) return false;
    const candidateIssueKey = normalizeJiraIssueKey(candidate.expectedIssue || fallbackIssueKey);
    return !eventIssueKey || !candidateIssueKey || eventIssueKey === candidateIssueKey;
  }) || null;
}

function shouldIncludeMonitoringRunEvent(event = {}, detail = {}) {
  const statusText = `${event.status || ''} ${detail.status || ''} ${event.eventType || ''}`.toLowerCase();
  return (
    statusText.includes('error')
    || statusText.includes('fail')
    || statusText.includes('block')
    || statusText.includes('warning')
    || detail.passed === false
  );
}

function actionForMonitoringItem(source = '', status = '') {
  const sourceText = String(source || '').toLowerCase();
  const statusText = String(status || '').toLowerCase();
  if (sourceText.includes('connector')) return 'Open Settings, verify connector readiness, auth, and backend-only read gate.';
  if (sourceText.includes('standards')) return 'Open Standards, resolve the finding or capture an allowed approval/override.';
  if (sourceText.includes('review')) return 'Open Review, resolve the comment or route rework to Agent Team.';
  if (sourceText.includes('dependency')) return 'Open Standards, use the explicit dependency approval path before install/write work.';
  if (sourceText.includes('agent worker')) return 'Open Agent Team, refresh or ingest the worker, then inspect log/output evidence.';
  if (sourceText.includes('relay')) return 'Open Agent Team and pass the relay context to the next worker.';
  if (sourceText.includes('validation')) return 'Open Monitoring, inspect the smoke output and screenshots, then fix the failing workflow surface.';
  if (sourceText.includes('ai')) return 'Open Settings/Monitoring, verify provider config, model, endpoint, and fallback behavior.';
  if (statusText.includes('block')) return 'Open the related workflow page and resolve the blocking gate before delegation.';
  return 'Review the related evidence in Runs or Artifacts before continuing.';
}

function buildMonitoringErrorLog({ assignmentId = 'assignment-local-mvp', limit = 80 } = {}) {
  const evidence = collectEvidence(assignmentId);
  const currentEvidence = scopedCurrentEvidence(evidence);
  const cutoffMs = timeMillis(evidence.current?.cutoffAt || '');
  const fallbackIssueKey = evidence.workflowState?.verificationProfile?.issueKey || '';
  const validationRuns = listValidationRuns(80, assignmentId);
  const items = [];
  const seen = new Set();

  const isCurrentAssignmentEvent = (eventAssignmentId, createdAt) => {
    if (!eventAssignmentId || eventAssignmentId !== assignmentId) return true;
    return !cutoffMs || timeMillis(createdAt) >= cutoffMs;
  };

  const pushItem = (item) => {
    const id = item.id || `${item.source}:${item.sourceId || item.title}:${item.createdAt}`;
    if (seen.has(id)) return;
    seen.add(id);
    const originalSeverity = item.severity || monitoringStatusSeverity(item.status);
    const resolved = item.resolutionStatus === 'resolved' || item.resolved === true;
    const severity = resolved ? 'info' : originalSeverity;
    items.push({
      id,
      assignmentId: item.assignmentId || assignmentId,
      source: item.source || 'Workbench',
      sourceId: item.sourceId || '',
      runId: item.runId || '',
      severity,
      status: resolved ? 'resolved' : item.status || severity,
      originalSeverity: resolved ? originalSeverity : undefined,
      originalStatus: resolved ? item.status || originalSeverity : undefined,
      resolutionStatus: resolved ? 'resolved' : '',
      resolutionReason: resolved ? item.resolutionReason || 'A later signal superseded this issue.' : '',
      resolvedAt: resolved ? item.resolvedAt || '' : '',
      title: item.title || monitoringLabel(item.source || 'Event'),
      message: truncateForApi(item.message || '', 900),
      action: resolved
        ? item.action || 'No action required. Kept as audit history because a later healthy signal superseded it.'
        : item.action || actionForMonitoringItem(item.source, item.status || severity),
      page: item.page || '',
      meta: item.meta || {},
      createdAt: item.createdAt || new Date().toISOString()
    });
  };

  runEventRepository.list().forEach((event) => {
    if (event.assignmentId && event.assignmentId !== assignmentId) return;
    if (!isCurrentAssignmentEvent(event.assignmentId, event.createdAt)) return;
    const detail = parseJsonValue(event.detail, {});
    if (!shouldIncludeMonitoringRunEvent(event, detail)) return;
    const status = detail.status || event.status;
    const isValidationEvent = String(event.eventType || '').startsWith('ui_smoke_validation_');
    const supersedingValidationRun = isValidationEvent
      ? findSupersedingValidationRun({
        runId: event.runId,
        assignmentId: detail.assignmentId || event.assignmentId || assignmentId,
        expectedIssue: detail.expectedIssue || fallbackIssueKey,
        createdAt: event.createdAt
      }, validationRuns, fallbackIssueKey)
      : null;
    pushItem({
      id: `run:${event.id}`,
      assignmentId: event.assignmentId || assignmentId,
      source: isValidationEvent ? 'Validation' : 'Workflow',
      sourceId: event.eventType,
      runId: event.runId,
      severity: monitoringStatusSeverity(status || event.status),
      status,
      title: monitoringLabel(event.eventType),
      message: monitoringMessageFromDetail(detail, `${monitoringLabel(event.eventType)} reported ${status || event.status}.`),
      action: supersedingValidationRun
        ? `Resolved by later passed UI smoke validation ${supersedingValidationRun.runId} at ${supersedingValidationRun.updatedAt}.`
        : undefined,
      page: isValidationEvent ? 'monitoring' : 'runs',
      resolutionStatus: supersedingValidationRun ? 'resolved' : '',
      resolutionReason: supersedingValidationRun ? `Superseded by validation run ${supersedingValidationRun.runId}.` : '',
      resolvedAt: supersedingValidationRun?.updatedAt || '',
      meta: {
        expectedIssue: detail.expectedIssue || evidence.workflowState?.verificationProfile?.issueKey || '',
        eventType: event.eventType,
        supersededByRunId: supersedingValidationRun?.runId || ''
      },
      createdAt: event.createdAt
    });
  });

  aiUsageRepository.list().map(hydrateAiUsageEvent).forEach((event) => {
    const providerFallback = event.fallbackUsed && event.provider !== 'local';
    if (event.status === 'ok' && !providerFallback) return;
    pushItem({
      id: `ai:${event.id}`,
      assignmentId,
      source: 'AI Provider',
      sourceId: event.requestType,
      runId: event.runId,
      severity: event.status === 'ok' ? 'warning' : 'critical',
      status: providerFallback ? 'fallback' : event.status,
      title: `${monitoringLabel(event.requestType)} provider event`,
      message: event.error || `${event.provider}/${event.model} used fallback behavior for this request.`,
      page: 'monitoring',
      createdAt: event.createdAt
    });
  });

  const connectorsById = new Map(listConnectors().map((connector) => [connector.id, connector]));
  const connectorEvents = connectorEventRepository.list()
    .map((event) => ({
      ...event,
      parsedDetail: parseJsonValue(event.detail, event.detail)
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  connectorEvents.forEach((event) => {
    const ok = isConnectorOkStatus(event.status);
    if (ok) return;
    const detail = event.parsedDetail;
    const eventAssignmentId = connectorEventAssignmentId(detail);
    if (eventAssignmentId && eventAssignmentId !== assignmentId) return;
    const supersedingEvent = findSupersedingConnectorEvent(event, detail, connectorEvents, fallbackIssueKey);
    const connectorNow = connectorsById.get(event.connectorId);
    const resolvedByReadyConnector = !supersedingEvent && connectorNow?.readiness === 'READY';
    const resolved = Boolean(supersedingEvent || resolvedByReadyConnector);
    pushItem({
      id: `connector:${event.id}`,
      assignmentId: eventAssignmentId || assignmentId,
      source: 'Connector',
      sourceId: event.connectorId,
      severity: monitoringStatusSeverity(event.status),
      status: event.status,
      title: `${monitoringLabel(event.connectorId)} ${monitoringLabel(event.action)}`,
      message: monitoringMessageFromDetail(detail, event.detail),
      action: resolved
        ? supersedingEvent
          ? `Resolved by a later successful ${monitoringLabel(event.action)} check at ${supersedingEvent.createdAt}.`
          : `${connectorNow?.label || monitoringLabel(event.connectorId)} is currently READY in Settings.`
        : undefined,
      page: 'settings',
      resolutionStatus: resolved ? 'resolved' : '',
      resolutionReason: resolved
        ? supersedingEvent
          ? `Superseded by connector event ${supersedingEvent.id}.`
          : `${connectorNow?.label || event.connectorId} currently reports READY.`
        : '',
      resolvedAt: supersedingEvent?.createdAt || '',
      meta: {
        connectorId: event.connectorId,
        action: event.action,
        issueKey: connectorEventIssueKey(event, detail) || fallbackIssueKey,
        supersededByEventId: supersedingEvent?.id || ''
      },
      createdAt: event.createdAt
    });
  });

  currentEvidence.standardsFindings
    .filter((finding) => !['PASS', 'INFO'].includes(String(finding.status || '').toUpperCase()))
    .forEach((finding) => {
      pushItem({
        id: `standards:${finding.id}`,
        assignmentId,
        source: 'Standards',
        sourceId: finding.category,
        severity: monitoringStatusSeverity(finding.status),
        status: finding.status,
        title: `${monitoringLabel(finding.category)} finding`,
        message: finding.message,
        action: finding.recommendation || actionForMonitoringItem('Standards', finding.status),
        page: 'standards',
        createdAt: finding.createdAt
      });
    });

  currentEvidence.reviewComments
    .filter((comment) => !['resolved', 'accepted_risk', 'closed'].includes(String(comment.status || '').toLowerCase()))
    .forEach((comment) => {
      pushItem({
        id: `review:${comment.id}`,
        assignmentId,
        source: 'Review',
        sourceId: comment.targetType,
        severity: String(comment.severity || '').toLowerCase().includes('blocker') ? 'blocked' : monitoringStatusSeverity(comment.severity || comment.status, 'warning'),
        status: comment.status,
        title: `${monitoringLabel(comment.severity)} review comment`,
        message: comment.comment,
        page: 'review',
        createdAt: comment.updatedAt || comment.createdAt
      });
    });

  currentEvidence.dependencyRequests
    .filter((request) => !['approved', 'rejected', 'cancelled'].includes(String(request.status || '').toLowerCase()))
    .forEach((request) => {
      pushItem({
        id: `dependency:${request.id}`,
        assignmentId,
        source: 'Dependency',
        sourceId: request.packageName,
        severity: monitoringStatusSeverity(request.status, 'warning'),
        status: request.status,
        title: `${request.packageName} dependency request`,
        message: request.reason,
        page: 'standards',
        createdAt: request.decidedAt || request.requestedAt
      });
    });

  currentEvidence.agentWorkerRuns
    .filter((run) => /fail|block|needs|stopped|manual_fallback/i.test(String(run.status || '')))
    .forEach((run) => {
      pushItem({
        id: `worker:${run.id}`,
        assignmentId,
        source: 'Agent Worker',
        sourceId: run.workerRole,
        runId: run.runId,
        severity: monitoringStatusSeverity(run.status, 'warning'),
        status: run.status,
        title: `${run.workerRoleLabel || monitoringLabel(run.workerRole)} worker`,
        message: monitoringMessageFromDetail(run.output || {}, `${run.workerRoleLabel || run.workerRole} is ${run.status}.`),
        page: 'team',
        meta: {
          workerRunId: run.id,
          workerRole: run.workerRole,
          workerRoleLabel: run.workerRoleLabel
        },
        createdAt: run.updatedAt || run.createdAt
      });
    });

  currentEvidence.agentRelayItems
    .filter((item) => ['open', 'assigned'].includes(String(item.status || '').toLowerCase()))
    .forEach((item) => {
      pushItem({
        id: `relay:${item.id}`,
        assignmentId,
        source: 'Agent Relay',
        sourceId: item.targetWorkerRole || item.targetLane,
        severity: monitoringStatusSeverity(item.severity || item.status, 'warning'),
        status: item.status,
        title: item.title,
        message: item.message,
        page: 'team',
        createdAt: item.updatedAt || item.createdAt
      });
    });

  validationRuns
    .filter((run) => run.assignmentId === assignmentId && run.passed === false)
    .forEach((run) => {
      const supersedingValidationRun = findSupersedingValidationRun({
        runId: run.runId,
        assignmentId: run.assignmentId || assignmentId,
        expectedIssue: run.expectedIssue || fallbackIssueKey,
        createdAt: run.updatedAt || run.createdAt
      }, validationRuns, fallbackIssueKey);
      pushItem({
        id: `validation:${run.runId}`,
        assignmentId,
        source: 'Validation',
        sourceId: 'ui_smoke',
        runId: run.runId,
        severity: 'critical',
        status: run.status,
        title: 'UI smoke validation failed',
        message: run.stderr || `UI smoke exited with code ${run.exitCode ?? 'unknown'}.`,
        action: supersedingValidationRun
          ? `Resolved by later passed UI smoke validation ${supersedingValidationRun.runId} at ${supersedingValidationRun.updatedAt}.`
          : undefined,
        page: 'monitoring',
        resolutionStatus: supersedingValidationRun ? 'resolved' : '',
        resolutionReason: supersedingValidationRun ? `Superseded by validation run ${supersedingValidationRun.runId}.` : '',
        resolvedAt: supersedingValidationRun?.updatedAt || '',
        meta: {
          expectedIssue: run.expectedIssue || fallbackIssueKey,
          supersededByRunId: supersedingValidationRun?.runId || ''
        },
        createdAt: run.updatedAt
      });
    });

  const sorted = items
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit);
  const summary = sorted.reduce((acc, item) => {
    acc.total += 1;
    if (item.resolutionStatus === 'resolved') {
      acc.resolved += 1;
      return acc;
    }
    acc[item.severity] = (acc[item.severity] || 0) + 1;
    return acc;
  }, { total: 0, critical: 0, blocked: 0, warning: 0, info: 0, resolved: 0 });
  summary.needsAttention = summary.critical + summary.blocked + summary.warning;
  summary.latestAt = sorted[0]?.createdAt || '';
  summary.status = summary.critical
    ? 'critical'
    : summary.blocked
      ? 'blocked'
      : summary.warning
        ? 'warning'
        : 'healthy';

  return {
    assignmentId,
    generatedAt: new Date().toISOString(),
    summary,
    items: sorted
  };
}

function createAgentEvent(assignmentId, agentId, eventType, status, detail) {
  agentEventRepository.createEvent({
    id: createId('agentevent'),
    assignmentId,
    agentId,
    eventType,
    status,
    detail
  });
}

function getAssignment(assignmentId = 'assignment-local-mvp') {
  return assignmentRepository.getById(assignmentId);
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

function applescriptStringLiteral(value = '') {
  return `"${escapeAppleScriptString(value)}"`;
}

function isGitRepo(repoPath = '') {
  return Boolean(repoPath && existsSync(join(repoPath, '.git')));
}

function terminalAppPath() {
  return uniqueTruthy([
    process.env.ODT_TERMINAL_APP_PATH,
    '/System/Applications/Utilities/Terminal.app',
    '/Applications/Utilities/Terminal.app'
  ]).find((candidate) => existsSync(candidate)) || '';
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
  const workerModel = getCodexWorkerModel();
  return {
    agent: 'codex',
    status: healthy ? 'healthy' : 'unhealthy',
    executable: healthy?.path || '',
    version: healthy?.version || '',
    model: workerModel.model || '',
    modelSource: workerModel.source || '',
    checkedAt: new Date().toISOString(),
    candidates,
    message: healthy
      ? `Codex CLI is available: ${healthy.version}${workerModel.model ? ` using model ${workerModel.model}` : ''}`
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
  const agentIssues = agentEventRepository.listByAssignment(assignmentId)
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
  const runIssues = runEventRepository.list()
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
  const meaningfulLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const jiraLineIndex = meaningfulLines.findIndex((line) => /\b[A-Z][A-Z0-9]+-\d+\b/.test(line));
  if (jiraLineIndex >= 0) {
    const jiraLine = meaningfulLines[jiraLineIndex];
    const lineAfterKey = jiraLine.replace(/^.*?\b[A-Z][A-Z0-9]+-\d+\b\s*:?\s*/i, '').trim();
    if (lineAfterKey.length > 12 && !/^(ticket|jira|issue)$/i.test(lineAfterKey)) {
      return lineAfterKey.slice(0, 120).trim();
    }
    const nextTaskLine = meaningfulLines.slice(jiraLineIndex + 1).find((line) => (
      line.length > 12
      && !/^(description|affected areas|actual result|expected result|some example areas|summary)$/i.test(line)
      && !/^https?:\/\//i.test(line)
    ));
    if (nextTaskLine) return nextTaskLine.slice(0, 120).trim();
  }

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

  const repoNameForExistingTitle = repoPath ? basenameFromPath(repoPath) : '';
  const existingTitle = String(assignment.title || '').trim();
  const existingTitleWithoutRepo = repoNameForExistingTitle && existingTitle.endsWith(` - ${repoNameForExistingTitle}`)
    ? existingTitle.slice(0, -(` - ${repoNameForExistingTitle}`).length).trim()
    : existingTitle;
  const detectedIssueKey = normalizeJiraIssueKey(input || assignment.title || assignment.requirement || '');
  const rawDerivedTitle = input
    ? deriveAssignmentTitle(input)
    : existingTitleWithoutRepo;
  const fallbackTitle = rawDerivedTitle || existingTitleWithoutRepo || 'Current ODT Work Item';
  const derivedTitle = detectedIssueKey && rawDerivedTitle && !rawDerivedTitle.includes(detectedIssueKey)
    ? `Jira: ${detectedIssueKey} - ${rawDerivedTitle}`
    : fallbackTitle;
  const repoName = repoPath ? basenameFromPath(repoPath) : '';
  const title = repoName && !derivedTitle.toLowerCase().includes(repoName.toLowerCase())
    ? `${derivedTitle} - ${repoName}`
    : derivedTitle;
  const requirement = input
    ? String(input).replace(/\s+/g, ' ').trim().slice(0, 360)
    : null;

  return assignmentRepository.updateContext({
    assignmentId,
    title: title || null,
    requirement,
    repoPath: repoPath || null,
    status: 'needs review',
    updatedAt: new Date().toISOString()
  });
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

function extractSectionLines(text = '', startPattern, stopPatterns = []) {
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
    const cleaned = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    if (
      cleaned
      && cleaned.length > 2
      && !/^https?:\/\//i.test(cleaned)
      && !/^(description|affected areas|actual result|expected result|some example areas)$/i.test(cleaned)
    ) {
      items.push(cleaned);
    }
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

function splitSearchTerms(value = '') {
  const stopWords = new Set([
    'about', 'after', 'again', 'against', 'allow', 'also', 'before', 'between', 'build', 'change',
    'codex', 'create', 'current', 'draft', 'during', 'every', 'existing', 'failed', 'files',
    'first', 'from', 'have', 'implementation', 'issue', 'jira', 'local', 'needs', 'never',
    'odt', 'only', 'path', 'plan', 'ready', 'repo', 'review', 'saved', 'should',
    'state', 'task', 'test', 'tests', 'that', 'this', 'until', 'update', 'when', 'where', 'with',
    'work', 'workflow'
  ]);
  const expanded = String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_./-]+/g, ' ')
    .toLowerCase();
  return uniqueItems(expanded
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4 && !stopWords.has(term)))
    .slice(0, 28);
}

function requirementDomainHints(value = '') {
  const text = String(value || '').toLowerCase();
  const hints = [];
  if (/long\s+(continuous\s+)?text|overflow|clipp|truncate|ellipsis|wrap|layout\s+break|breaks\s+layout|controlled\s+scroll/i.test(text)) {
    hints.push('long text overflow', 'layout overflow', 'word wrap', 'text truncation', 'ellipsis', 'controlled scrolling');
  }
  if (/journey\s+builder|journey_builder|stage\s+sidebar|stage\s+overview/i.test(text)) {
    hints.push('journey builder', 'stage sidebar', 'stage overview');
  }
  if (/journey\s+preview|journey_preview/i.test(text)) hints.push('journey preview');
  if (/share\s+preview|previewed_journeys|previewed journeys/i.test(text)) hints.push('share preview', 'previewed journeys');
  if (/activity\s+preview|activity_preview/i.test(text)) hints.push('activity preview');
  if (/\blink\b|\bdocument\b|\bsurvey\b|\bvideo\b|simulation/i.test(text)) {
    hints.push('link activity', 'document activity', 'survey activity', 'video activity', 'simulation activity');
  }
  return hints;
}

function extractExportNamesFromContent(content = '') {
  const names = [];
  const patterns = [
    /export\s+default\s+(?:function|class)?\s*([A-Za-z0-9_]+)/g,
    /export\s+(?:const|function|class)\s+([A-Za-z0-9_]+)/g,
    /module\.exports\s*=\s*([A-Za-z0-9_]+)/g,
    /class\s+([A-Za-z0-9_]+)\s+extends\s+React\.Component/g,
    /function\s+([A-Za-z0-9_]+)\s*\(/g
  ];
  patterns.forEach((pattern) => {
    let match = pattern.exec(content);
    while (match) {
      names.push(match[1]);
      match = pattern.exec(content);
    }
  });
  return uniqueItems(names).slice(0, 6);
}

function buildFilePreview(content = '', maxLines = 3) {
  return String(content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 220);
}

function inferFileRole(relativePath = '') {
  const pathValue = String(relativePath || '').toLowerCase();
  if (/(^|\/)(test|tests|__tests__)\/|(\.|_)(test|spec)\./.test(pathValue)) return 'Test coverage';
  if (/\.(css|scss)$/.test(pathValue)) return 'Layout/style';
  if (/route|router|index\.html|app\.jsx|app\.tsx/.test(pathValue)) return 'Route/shell';
  if (/service|api|client|request/.test(pathValue)) return 'API/service';
  if (/component|container|page|view|preview|activity|journey|stage/.test(pathValue)) return 'UI component';
  return 'Source';
}

function confidenceForScore(score = 0) {
  if (score >= 52) return 'high';
  if (score >= 24) return 'medium';
  return 'low';
}

function extractMentionedRepoPaths(value = '') {
  return uniqueItems([
    ...String(value || '').matchAll(/[\w./-]+\.(?:jsx?|tsx?|json|css|scss|html|java|xml|rb|py|sql|md|ya?ml)/gi)
  ].map((match) => match[0].replace(/^[./]+/, '').replace(/[),.;:]+$/, ''))).slice(0, 40);
}

function collectRepoFiles(repoPath, options = {}) {
  const {
    maxFiles = 2200,
    maxDepth = 9,
    maxFileBytes = 384 * 1024
  } = options;
  const ignoredDirs = new Set([
    '.git', '.hg', '.svn', 'node_modules', 'dist', 'build', 'coverage', '.next', '.nuxt', '.vite',
    'target', 'vendor', 'tmp', 'temp', 'logs', '.cache', '.gradle', '.idea', '.vscode'
  ]);
  const allowedExtensions = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.html', '.md', '.yml', '.yaml',
    '.java', '.xml', '.rb', '.py', '.sql', '.properties', '.feature'
  ]);
  const files = [];

  function extensionOf(fileName = '') {
    const match = String(fileName).toLowerCase().match(/\.[^.]+$/);
    return match ? match[0] : '';
  }

  function walk(dir, prefix = '', depth = 0) {
    if (files.length >= maxFiles || depth > maxDepth) return;
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolutePath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) walk(absolutePath, relativePath, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = extensionOf(entry.name);
      if (!allowedExtensions.has(ext)) continue;
      let stat = null;
      try {
        stat = statSync(absolutePath);
      } catch {
        continue;
      }
      if (!stat || stat.size > maxFileBytes) continue;
      files.push({ relativePath, absolutePath, size: stat.size, ext });
    }
  }

  if (repoPath && existsSync(repoPath)) walk(repoPath);
  return files;
}

function buildRepoImpactAnalysis({ repoPath = '', requirementTextValue = '' } = {}) {
  const files = collectRepoFiles(repoPath);
  const mentionedPaths = extractMentionedRepoPaths(requirementTextValue);
  const domainHints = requirementDomainHints(requirementTextValue);
  const terms = splitSearchTerms([
    requirementTextValue,
    mentionedPaths.join(' '),
    domainHints.join(' ')
  ].join(' '));
  const lowerRequirement = String(requirementTextValue || '').toLowerCase();
  const longTextOverflow = /long\s+(continuous\s+)?text|overflow|clipp|truncate|ellipsis|wrap|layout\s+break|breaks\s+layout|controlled\s+scroll/i.test(lowerRequirement);
  const routePatterns = [
    { pattern: /journey[_-]?preview|journey\/preview|previewed[_-]?journeys|share[_-]?preview/i, label: 'journey/share preview route' },
    { pattern: /activity[_-]?preview|activity\/preview/i, label: 'activity preview route' },
    { pattern: /journey[-_/]builder|journey_builder|stage[-_/](sidebar|overview)|activities[-_/]container/i, label: 'journey builder surface' },
    { pattern: /(link|document|survey|video|simulation)[-_/]?(details|activity|preview|container)?/i, label: 'affected activity type surface' }
  ];
  const scored = files.map((file) => {
    const pathLower = file.relativePath.toLowerCase();
    const baseLower = basenameFromPath(file.relativePath).toLowerCase();
    let content = '';
    let rawContent = '';
    try {
      rawContent = readFileSync(file.absolutePath, 'utf8').slice(0, 140000);
      content = rawContent.toLowerCase();
    } catch {
      content = '';
    }
    const pathMatches = terms.filter((term) => pathLower.includes(term) || baseLower.includes(term));
    const contentMatches = terms.filter((term) => content.includes(term));
    const explicitMatches = mentionedPaths.filter((mentioned) => {
      const normalized = mentioned.toLowerCase();
      return pathLower.endsWith(normalized) || pathLower.includes(normalized) || baseLower === basenameFromPath(normalized);
    });
    const testBoost = /(^|\/)(test|tests|__tests__)\/|(\.|_)(test|spec)\./i.test(file.relativePath) ? 6 : 0;
    const routeMatches = routePatterns.filter((entry) => entry.pattern.test(file.relativePath) || entry.pattern.test(content));
    const layoutBoost = longTextOverflow && /\.(css|scss|jsx?|tsx?)$/i.test(file.relativePath) && /(overflow|ellipsis|text-overflow|white-space|word-break|overflow-wrap|line-clamp|truncate|wrap)/i.test(`${file.relativePath}\n${content}`)
      ? 14
      : 0;
    const componentBoost = /(component|container|page|preview|activity|journey|stage|sidebar|header|details)/i.test(file.relativePath) ? 5 : 0;
    const score = explicitMatches.length * 34
      + pathMatches.length * 9
      + contentMatches.length * 3
      + routeMatches.length * 16
      + layoutBoost
      + componentBoost
      + testBoost;
    const exportNames = extractExportNamesFromContent(rawContent);
    const preview = buildFilePreview(rawContent);
    const fileRole = inferFileRole(file.relativePath);
    const confidence = confidenceForScore(score);
    return {
      file: file.relativePath,
      score,
      confidence,
      fileRole,
      reason: [
        explicitMatches.length ? `explicit mention: ${explicitMatches.slice(0, 3).join(', ')}` : '',
        pathMatches.length ? `path terms: ${pathMatches.slice(0, 5).join(', ')}` : '',
        contentMatches.length ? `content terms: ${contentMatches.slice(0, 5).join(', ')}` : '',
        routeMatches.length ? `route/surface: ${routeMatches.map((entry) => entry.label).slice(0, 3).join(', ')}` : '',
        layoutBoost ? 'layout overflow/truncation signal' : '',
        componentBoost ? 'component/page surface' : '',
        testBoost ? 'test/spec file' : ''
      ].filter(Boolean).join('; '),
      matchedTerms: uniqueItems([...explicitMatches, ...pathMatches, ...contentMatches]).slice(0, 10),
      exportNames,
      preview,
      isTestCandidate: Boolean(testBoost || /test|spec/i.test(file.relativePath))
    };
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  const likelyImpactedFiles = scored.filter((item) => !item.isTestCandidate).slice(0, 16).map((item) => item.file);
  const candidateTestFiles = scored.filter((item) => item.isTestCandidate).slice(0, 12).map((item) => item.file);
  const moduleHints = uniqueItems(scored
    .slice(0, 20)
    .map((item) => item.file.split('/').slice(0, -1).join('/'))
    .filter(Boolean))
    .slice(0, 8);
  return {
    scannedFiles: files.length,
    matchedFiles: scored.length,
    searchTerms: terms,
    domainHints,
    explicitFileMentions: mentionedPaths,
    likelyImpactedFiles,
    candidateTestFiles,
    moduleHints,
    blastRadius: likelyImpactedFiles.length + candidateTestFiles.length,
    rankedCandidates: scored.slice(0, 30),
    notes: scored.length
      ? 'Candidate files are ranked from read-only path/content matching. A developer or reviewer should confirm before write delegation.'
      : 'No strong impacted-file candidates were found. Run broader repo analysis or add more requirement details before delegation.'
  };
}

function requirementText(requirement = {}) {
  const safeRequirement = requirement || {};
  return safeRequirement.rawText || safeRequirement.raw_text || safeRequirement.input || safeRequirement.summary || '';
}

function parseRequirementSignals(input = '') {
  const text = String(input || '');
  const lower = text.toLowerCase();
  const issueKey = normalizeJiraIssueKey(text);
  const rawTitle = deriveAssignmentTitle(text) || 'Requirement-driven implementation';
  const title = issueKey && !rawTitle.includes(issueKey)
    ? `Jira: ${issueKey} - ${rawTitle}`
    : rawTitle;
  const targetRepo = (text.match(/\/Users\/[^\s]+/) || [])[0] || '';
  const endpointMatch = text.match(/(?:POST|PUT|PATCH):?\s*(https?:\/\/[^\s]+)/i)
    || text.match(/Method:\s*(?:post|put|patch)[\s\S]*?(https?:\/\/[^\s]+)/i);
  const endpoint = endpointMatch?.[1] || '';
  const isLongTextOverflowRequest = /long\s+(continuous\s+)?text|overflow|clipp|truncate|ellipsis|wrap|layout\s+break|breaks\s+layout|controlled\s+scroll/i.test(text);
  const affectedAreas = uniqueItems([
    ...extractSectionBullets(text, /^Affected Areas\s*:?\s*$/i, [/^(Actual Result|Expected Result|Test Plan|Assumptions|some example areas)\b/i]),
    ...extractSectionLines(text, /^Affected Areas\s*:?\s*$/i, [/^(Actual Result|Expected Result|Test Plan|Assumptions|some example areas)\b/i])
  ]);
  const actualResult = (text.match(/Actual Result\s*:?\s*([\s\S]*?)(?=\n\s*(Expected Result|Test Plan|Assumptions|$))/i)?.[1] || '').trim();
  const expectedResult = (text.match(/Expected Result\s*:?\s*([\s\S]*?)(?=\n\s*(Test Plan|Assumptions|$))/i)?.[1] || '').trim();
  const rawKeyBehaviors = extractSectionBullets(text, /^(Key behavior|Key Changes|Summary)\s*:?\s*$/i, [/^(Test Plan|Assumptions|Update API|SCENARIOS|the payload is|Affected Areas|Actual Result|Expected Result)\b/i]);
  const keyBehaviors = rawKeyBehaviors.length
    ? rawKeyBehaviors
    : isLongTextOverflowRequest
      ? [
          'Prevent valid max-length continuous text from overflowing, clipping, or overlapping nearby UI.',
          'Apply wrapping, ellipsis, or controlled scrolling consistently across Journey Builder, current journey, Journey Preview, Share Preview, and Activity Preview.',
          'Cover long names and descriptions in Link, Document, Survey, Video, and Simulation activity displays.',
          'Verify stage sidebar, stage overview, preview header, and activity detail panels remain intact.'
        ]
      : [];
  const testPlan = uniqueItems([
    ...extractSectionBullets(text, /^Test Plan\s*:?\s*$/i, [/^(Assumptions|Update API|SCENARIOS|the payload is)\b/i]),
    ...extractMatches(text, /tests\/[^\s`]+\.js/g),
    ...(isLongTextOverflowRequest ? [
      'Use max-length continuous text fixtures for Journey Builder, current journey, Journey Preview, Share Preview, and Activity Preview surfaces.',
      'Verify responsive wrapping/truncation behavior at supported desktop and mobile widths.',
      'Run targeted component, Jest, or visual regression tests for the impacted display components.'
    ] : [])
  ]);
  const assumptions = extractSectionBullets(text, /^Assumptions\s*:?\s*$/i, [/^(Update API|SCENARIOS|the payload is)\b/i]);
  const updateApiScenarios = linesFromText(text)
    .filter((line) => /^(Deleting|Removing|Adding|Add\/update|Method:|https?:\/\/|While editing)/i.test(line))
    .map((line) => line.replace(/^[-*]\s*/, '').trim());
  const mentionedFiles = uniqueItems([
    ...extractMatches(text, /[\w./-]*activity_util\.jsx/g),
    ...extractMatches(text, /tests\/[^\s`]+\.js/g),
    ...extractMentionedRepoPaths(text)
  ]);
  const isCompletedJiraImport = lower.includes('classification: completed in jira') || lower.includes('recommended mode: verification');
  const isAssessmentPreviewRequest = lower.includes('preview') && (lower.includes('persisted') || lower.includes('save draft') || lower.includes('publish'));
  const hasRepoCompletionSignal = lower.includes('ticket_reference_found') || /appears in \d+ git commit/.test(lower);
  const clarifyingQuestions = isCompletedJiraImport
    ? [
        {
          severity: hasRepoCompletionSignal ? 'INFO' : 'NEEDS_REVIEW',
          question: 'Which verification evidence should ODT capture for this completed Jira work?',
          defaultAssumption: hasRepoCompletionSignal
            ? 'Use the detected Jira-linked commits as completion evidence, then capture tests/build output before PR or release readiness.'
            : 'Ask for branch/commit/PR evidence before marking repository verification complete.',
          decisionOwner: 'Developer'
        },
        {
          severity: 'NEEDS_REVIEW',
          question: 'Is this ticket already merged/released, or only completed on a feature branch?',
          defaultAssumption: 'Treat Jira Done as implementation-complete but still require repo, test, and PR/release evidence before final closeout.',
          decisionOwner: 'Developer / Reviewer'
        },
        {
          severity: 'INFO',
          question: 'Should ODT run a reviewer/build-verifier path instead of launching an implementation worker?',
          defaultAssumption: 'Yes. Completed Jira work should move to verification, review, and evidence capture unless a gap is found.',
          decisionOwner: 'Developer'
        }
      ]
    : isAssessmentPreviewRequest
      ? [
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
          }
        ]
      : [
          {
            severity: testPlan.length ? 'INFO' : 'NEEDS_REVIEW',
            question: 'Which acceptance criteria and tests prove this change is complete?',
            defaultAssumption: testPlan.length ? 'Use the provided test plan and map it to implementation evidence.' : 'Ask for acceptance/test evidence before PR readiness.',
            decisionOwner: 'Developer / QA'
          },
          {
            severity: mentionedFiles.length ? 'INFO' : 'NEEDS_REVIEW',
            question: 'Which files or modules are expected to change?',
            defaultAssumption: mentionedFiles.length ? 'Use the mentioned files and confirm with read-only repo analysis.' : 'Run repo analysis before delegating implementation.',
            decisionOwner: 'Engineering'
          }
        ];
  clarifyingQuestions.push({
    severity: targetRepo ? 'INFO' : 'BLOCKER',
    question: 'Which repository and branch should receive the implementation or verification?',
    defaultAssumption: targetRepo ? `Use ${targetRepo} and the current working branch unless the user specifies otherwise.` : 'Ask for the target repo path before write delegation.',
    decisionOwner: 'Developer'
  });

  return {
    title,
    issueKey,
    targetRepo,
    endpoint,
    keyBehaviors,
    testPlan,
    assumptions,
    affectedAreas,
    actualResult,
    expectedResult,
    clarifyingQuestions,
    updateApiScenarios,
    mentionedFiles,
    scopeSignals: {
      frontend: lower.includes('preview') || lower.includes('field') || lower.includes('checkbox') || lower.includes('react') || isLongTextOverflowRequest,
      backend: lower.includes('api') || lower.includes('post') || lower.includes('payload'),
      data: lower.includes('db') || lower.includes('persisted') || lower.includes('saved') || lower.includes('current journey'),
      tests: lower.includes('jest') || lower.includes('test plan') || lower.includes('tests/') || isLongTextOverflowRequest
    },
    workState: {
      completedJiraImport: isCompletedJiraImport,
      verificationMode: isCompletedJiraImport,
      hasRepoCompletionSignal
    },
    domainSignals: {
      assessment: lower.includes('assessment'),
      preview: lower.includes('preview'),
      longTextOverflow: isLongTextOverflowRequest,
      journeyBuilder: lower.includes('journey builder'),
      journeyPreview: lower.includes('journey preview') || lower.includes('journey_preview'),
      activityPreview: lower.includes('activity preview') || lower.includes('activity_preview'),
      sharePreview: lower.includes('share preview') || lower.includes('previewed_journeys'),
      visualLayout: isLongTextOverflowRequest || lower.includes('layout'),
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

function buildRequirementAnalysis({ assignmentId, input = '', repoPath = '', sourceType = 'manual' }) {
  const text = String(input || '').trim();
  const now = new Date().toISOString();
  setActiveAssignmentId(assignmentId);
  applyAssignmentContext({ assignmentId, input: text, repoPath });
  const signals = parseRequirementSignals(text);
  const functionalRequirements = signals.keyBehaviors.length
    ? signals.keyBehaviors
    : [
      'Capture requirement/Jira/repo inputs before planning.',
      'Analyze requirement gaps and ask decision-critical clarification questions.',
      'Draft technical design, implementation plan, test plan, and PR readiness evidence.'
    ];
  const nonFunctionalRequirements = signals.domainSignals.longTextOverflow
    ? [
        'Long valid content must not overflow, overlap, clip, or break layout at supported viewport sizes.',
        'Wrapping, truncation, ellipsis, or controlled scrolling must preserve readability and keyboard/screen-reader behavior.',
        'Fixes should prefer existing product styling and reusable layout utilities instead of one-off fragile CSS.',
        'Visual regression, component, or targeted manual evidence is required before PR readiness.',
        'Write actions require explicit human approval.'
      ]
    : signals.domainSignals.assessment
      ? [
          'Preview must use persisted DB data and never unsaved local edits.',
          'Existing privilege restrictions must remain intact, including VIEW_FOR_SUPPORT_ADMIN.',
          'Update API payload behavior must preserve existing/new/deleted question and answer semantics.',
          'Testing, accessibility, security, and maintainability gates are required.',
          'Write actions require explicit human approval.'
        ]
      : [
          'Changes must preserve existing product behavior outside the stated scope.',
          'Accessibility, security, performance, and maintainability gates are required.',
          'Existing authorization, validation, loading, empty, error, and success states must be preserved unless explicitly changed.',
          'Targeted tests or accepted-risk evidence are required before PR readiness.',
          'Write actions require explicit human approval.'
        ];
  const analysis = {
    assignmentId,
    sourceType,
    title: signals.title,
    targetRepo: signals.targetRepo,
    apiEndpoint: signals.endpoint,
    summary: signals.title !== 'Requirement-driven implementation' ? signals.title : text ? text.slice(0, 280) : 'No requirement text provided yet.',
    functionalRequirements,
    nonFunctionalRequirements,
    scopeSignals: signals.scopeSignals,
    domainSignals: signals.domainSignals,
    affectedAreas: signals.affectedAreas,
    actualResult: signals.actualResult,
    expectedResult: signals.expectedResult,
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
  requirementRepository.createRequirement({
    id: createId('req'),
    assignmentId,
    sourceType,
    rawText: text || 'No requirement text provided.',
    summary: analysis.summary,
    status: 'REQUIREMENT_ANALYZED',
    createdAt: now,
    updatedAt: now
  });
  createRunEvent(createId('run'), 'requirement_analyzed', 'ok', { assignmentId, sourceType }, assignmentId);
  return analysis;
}

function buildRepoAnalysis({ assignmentId, repoPath }) {
  const assignment = getAssignment(assignmentId);
  const pathToAnalyze = repoPath || assignment?.repoPath || appRoot;
  applyAssignmentContext({ assignmentId, repoPath: pathToAnalyze });
  const signals = detectRepoSignals(pathToAnalyze);
  const latestRequirement = requirementRepository.listByAssignment(assignmentId)[0] || {};
  const requirementForImpact = [
    latestRequirement.rawText,
    latestRequirement.summary,
    assignment?.requirement,
    assignment?.title
  ].filter(Boolean).join('\n');
  const impactAnalysis = buildRepoImpactAnalysis({
    repoPath: pathToAnalyze,
    requirementTextValue: requirementForImpact
  });
  const analysis = {
    assignmentId,
    ...signals,
    architecturePattern: signals.frameworks.includes('React') ? 'React feature pages with backend API service boundary' : 'Detected from repository files',
    validationPattern: 'Use existing backend validation and safe frontend form validation before adding dependencies.',
    errorHandlingPattern: 'Prefer user-safe errors, retry/fallback messages, and audit events.',
    namingConvention: 'Follow repository file and component naming before introducing new patterns.',
    impactAnalysis,
    likelyImpactedFiles: impactAnalysis.likelyImpactedFiles,
    candidateTestFiles: impactAnalysis.candidateTestFiles,
    filesToReviewOnly: [
      'package.json',
      'vite.config.js',
      'README.md',
      ...impactAnalysis.candidateTestFiles
    ].filter(Boolean),
    status: signals.exists ? 'REPO_ANALYZED' : 'NEEDS_REVIEW'
  };
  const now = new Date().toISOString();
  repoAnalysisRepository.createAnalysis({
    id: createId('repo'),
    assignmentId,
    repoPath: pathToAnalyze,
    analysis,
    status: analysis.status,
    createdAt: now,
    updatedAt: now
  });
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
    impactAnalysis: {
      scannedFiles: 0,
      matchedFiles: 0,
      searchTerms: [],
      explicitFileMentions: [],
      likelyImpactedFiles: [],
      candidateTestFiles: [],
      rankedCandidates: [],
      notes: 'Browser folder picker mode can inspect allowed metadata, but Chrome does not expose the absolute path. Paste the local repo path to enable backend path/content scoring and worker launch.'
    },
    likelyImpactedFiles: [],
    candidateTestFiles: [],
    filesToReviewOnly: browserAnalysis.topLevelEntries || [],
    status: browserAnalysis.status || 'REPO_ANALYZED'
  };
  repoAnalysisRepository.createAnalysis({
    id: createId('repo'),
    assignmentId,
    repoPath,
    analysis,
    status: analysis.status,
    createdAt: now,
    updatedAt: now
  });
  createRunEvent(createId('run'), 'repo_analyzed_browser_folder', 'ok', {
    assignmentId,
    folderName: analysis.folderName,
    fileCount: analysis.fileCount
  }, assignmentId);
  return analysis;
}

function buildTechnicalDesign({ assignmentId, requirement = {}, repoAnalysis = {}, title = 'Governed Developer Workflow Design' }) {
  const signals = parseRequirementSignals(requirementText(requirement));
  const isVerificationMode = signals.workState?.completedJiraImport;
  const repoImpact = repoAnalysis.impactAnalysis || {};
  const rankedImpactFiles = (repoImpact.rankedCandidates || []).map((item) => item.file);
  const longTextOverflow = Boolean(signals.domainSignals?.longTextOverflow);
  const designTitle = signals.title !== 'Requirement-driven implementation'
    ? `${signals.title} ${isVerificationMode ? 'Verification Design' : 'Technical Design'}`
    : title;
  const design = isVerificationMode ? {
    title: designTitle,
    assignmentId,
    requirementSummary: requirement.summary || signals.title || 'Completed Jira verification.',
    targetRepo: signals.targetRepo || repoAnalysis.repoPath,
    scope: [
      'Verify Jira Done status against repository evidence.',
      'Review Jira-linked commits, branch/PR state, and release readiness.',
      'Capture build/test evidence before PR or release closeout.',
      'Launch implementation only if Reviewer identifies explicit rework.'
    ],
    outOfScope: [
      'Starting new implementation work without a reviewer finding.',
      'Changing files before a fresh write approval exists.',
      'Treating Jira Done as PR-ready without evidence.'
    ],
    existingArchitectureObserved: repoAnalysis.frameworks?.length ? repoAnalysis.frameworks : ['Repository evidence from Jira-linked git commits'],
    proposedArchitecture: 'Use a verification-first workflow: Reviewer inspects Jira, commits, diffs, and risk; Build Verifier captures approved test/build commands; PR Ready packages the verified evidence.',
    apiChanges: [],
    impactedAreas: [
      'Jira completion evidence',
      'Git commit and branch verification',
      'Build/test evidence capture',
      'PR or release readiness notes'
    ],
    candidateFiles: uniqueItems([
      ...signals.mentionedFiles,
      'Files changed by Jira-linked commits',
      'Relevant test files from commit/reviewer evidence'
    ]),
    accessibility: 'Reviewer should verify whether the completed change affects visible UI, keyboard behavior, labels, contrast, or Redwood-style consistency.',
    security: 'No write or external update should occur from completed-Jira verification unless rework is explicitly approved.',
    testing: signals.testPlan.length ? signals.testPlan : ['Build Verifier should run the repo-approved targeted tests or capture why they were not run.'],
    flexibility: 'If evidence is missing, the human reviewer can accept risk with notes or send explicit rework to the implementation lane.',
    rollback: 'Do not change target repo files during verification. If rework is required, create a new write-approved handoff.'
  } : {
    title: designTitle,
    assignmentId,
    requirementSummary: requirement.summary || signals.title || 'Requirement-driven implementation.',
    targetRepo: signals.targetRepo || repoAnalysis.repoPath,
    scope: signals.keyBehaviors.length ? signals.keyBehaviors : [
      `Implement the requested ${signals.title || 'work item'} behavior using the selected repository context.`,
      'Confirm UI, API, data, and test impact from read-only repo analysis before delegating writes.',
      'Capture acceptance criteria, standards impact, and PR readiness evidence before closeout.'
    ],
    outOfScope: [
      'Changing unrelated workflows or files not supported by the current requirement evidence.',
      'Installing new dependencies without explicit approval.',
      'Bypassing standards, review, or write approval gates.'
    ],
    existingArchitectureObserved: repoAnalysis.frameworks?.length ? repoAnalysis.frameworks : ['Repository patterns need read-only analysis confirmation'],
    proposedArchitecture: 'Use the repository’s existing patterns first. Keep the change scoped to the requirement, capture impacted files and tests as evidence, and delegate implementation only after standards and human approval.',
    apiChanges: signals.endpoint ? [
      `Validate update payload behavior for ${signals.endpoint}`,
      'Confirm request/response payload rules from current requirement and repo evidence.',
      'Capture API compatibility, validation, and error-state expectations before implementation.'
    ] : signals.updateApiScenarios.length
      ? signals.updateApiScenarios
      : longTextOverflow
        ? ['No backend/API change is assumed until repo analysis or reviewer evidence proves displayed text is shaped by API payload limits.']
        : [],
    impactedAreas: uniqueItems([
      ...(signals.affectedAreas || []),
      ...(signals.scopeSignals.frontend ? ['Frontend/UI behavior'] : []),
      ...(signals.scopeSignals.backend ? ['Backend/API integration'] : []),
      ...(signals.scopeSignals.data ? ['Persisted data or database behavior'] : []),
      ...(signals.scopeSignals.tests ? ['Automated test coverage'] : []),
      ...(repoAnalysis.likelyFolders || []).map((folder) => `Repository folder: ${folder}`),
      ...(repoImpact.moduleHints || []).map((folder) => `Candidate module: ${folder}`)
    ]),
    candidateFiles: uniqueItems([
      ...signals.mentionedFiles,
      ...(repoAnalysis.likelyImpactedFiles || []),
      ...rankedImpactFiles,
      ...(repoAnalysis.candidateTestFiles || []),
      ...signals.testPlan
    ]),
    accessibility: longTextOverflow
      ? 'Accessibility review should verify that wrapping, truncation, tooltip, title, scrolling, focus, and screen-reader behavior stay usable for long valid text on every affected surface.'
      : 'Accessibility review required. UI work should be reviewed against WCAG 2.2, VPAT impact, Section 508 where applicable, keyboard navigation, visible focus, labels, contrast, loading/empty/error states, and Redwood-like clarity.',
    security: signals.domainSignals.assessment
      ? 'Do not expose secrets or alter authorization behavior. Preserve VIEW_FOR_SUPPORT_ADMIN restrictions and existing UPDATE_ACTIVITY edit behavior.'
      : 'Do not expose secrets or alter authorization behavior. Keep the change scoped to rendering/layout unless current repo evidence requires API or data changes.',
    testing: signals.testPlan.length ? signals.testPlan : longTextOverflow
      ? [
          'Render max-length continuous text in each affected Journey and Activity display surface.',
          'Verify no overlap, clipping, horizontal page breakage, or unreadable truncation at supported breakpoints.',
          'Run targeted component/Jest/visual checks for ranked candidate files and nearest tests.'
        ]
      : ['Identify and run the smallest reliable targeted test/build command for the impacted area.'],
    flexibility: longTextOverflow
      ? 'Use wrapping, ellipsis, or controlled scrolling according to the container purpose. Reviewer must confirm which surfaces require full readable text versus compact truncation.'
      : 'Design choices may be refined by reviewer notes, but behavior, tests, standards gates, and approval evidence must stay tied to the active requirement.',
    rollback: longTextOverflow
      ? 'Keep layout changes scoped to affected display components or shared text utilities so overflow fixes can be reverted without changing unrelated activity behavior.'
      : 'Keep changes small and scoped to the ranked impact surface so rollback does not disturb unrelated workflows.'
  };
  const now = new Date().toISOString();
  technicalDesignRepository.createDesign({
    id: createId('design'),
    assignmentId,
    title: designTitle,
    design,
    status: 'TECH_DESIGN_DRAFTED',
    createdAt: now,
    updatedAt: now
  });
  return design;
}

function buildImplementationPlan({ assignmentId, design = {}, title = 'Standards-Governed Implementation Plan' }) {
  const latestRequirement = requirementRepository.listByAssignment(assignmentId)[0] || {};
  const signals = parseRequirementSignals(requirementText(latestRequirement));
  const isVerificationMode = signals.workState?.completedJiraImport;
  const latestRepoRow = repoAnalysisRepository.listByAssignment(assignmentId)[0] || {};
  const repoAnalysis = parseJsonValue(latestRepoRow.analysisJson, {});
  const repoImpact = repoAnalysis.impactAnalysis || {};
  const rankedCandidates = repoImpact.rankedCandidates || [];
  const scoredFileEvidence = rankedCandidates.slice(0, 15).map((item) => (
    `${item.file} - score ${item.score} (${item.confidence || 'low'}): ${item.reason || 'repo-ranked candidate'}`
  ));
  const longTextOverflow = Boolean(signals.domainSignals?.longTextOverflow);
  const planTitle = signals.title !== 'Requirement-driven implementation'
    ? `${signals.title} ${isVerificationMode ? 'Verification Plan' : 'Implementation Plan'}`
    : title;
  const plan = isVerificationMode ? {
    title: planTitle,
    assignmentId,
    planType: 'completed-jira-verification',
    scope: [
      'Confirm Jira Done status and requirement summary.',
      'Review Jira-linked commits, branch/PR status, and changed-file evidence.',
      'Capture build/test verification evidence or accepted-risk notes.',
      'Prepare PR/release readiness package only after evidence is reviewed.'
    ],
    filesToChange: [],
    filesToReview: uniqueItems([
      'Jira-linked commit diffs',
      'Changed files from matching commits',
      ...signals.mentionedFiles,
      ...signals.testPlan
    ]),
    backendTasks: [
      'Read repo history for the Jira key and inspect commit scope.',
      'Verify whether PR/merge/release evidence exists.',
      'Capture missing evidence as review comments or accepted risk.'
    ],
    frontendTasks: [
      'Review visible UI acceptance criteria from Jira.',
      'Confirm changed screens/components match the completed Jira story.',
      'Send explicit rework only if the completed implementation is incomplete.'
    ],
    validationTasks: [
      'Launch Reviewer first for risk/diff/evidence review.',
      'Launch Build Verifier after reviewer pass or explicit test approval.',
      'Record verification evidence in Review before PR Ready.'
    ],
    accessibilityTasks: [
      'Check whether the completed change affects visible labels, keyboard use, focus, or contrast.',
      'Record no-impact decision or accessibility risk evidence.'
    ],
    securityTasks: [
      'Keep verification read-only unless reviewer creates explicit rework.',
      'Do not expose Jira or provider credentials in frontend evidence.'
    ],
    testTasks: signals.testPlan.length ? signals.testPlan : [
      'Run the repo-approved targeted test/build command if available.',
      'Capture command output, skipped reason, or accepted risk.'
    ],
    approvalRequired: [
      'Human review before accepting missing verification evidence.',
      'Fresh write approval only if Reviewer requests rework.',
      'Separate dependency approval before any install.'
    ],
    flexibility: 'Completed Jira verification can accept missing evidence only with human risk notes. Implementation workers remain locked unless explicit rework exists.',
    risks: [
      'Jira Done may not mean merged or released.',
      'Git commits may not prove tests passed.',
      'Older ODT artifacts from another task must remain historical and not drive this verification.'
    ]
  } : {
    title: planTitle,
    assignmentId,
    scope: design.scope || signals.keyBehaviors || [`Implement ${signals.title || 'the requested work item'} with governed evidence.`],
    impactSummary: {
      scannedFiles: repoImpact.scannedFiles || 0,
      matchedFiles: repoImpact.matchedFiles || 0,
      blastRadius: repoImpact.blastRadius || 0,
      searchTerms: repoImpact.searchTerms || [],
      notes: repoImpact.notes || ''
    },
    impactedFileScores: rankedCandidates.slice(0, 20),
    filesToChange: uniqueItems([
      ...signals.mentionedFiles,
      ...(repoAnalysis.likelyImpactedFiles || []),
      ...(design.candidateFiles || [])
    ]).filter((item) => !/tests?\//i.test(item)).slice(0, 18),
    filesToReview: uniqueItems([
      ...(design.candidateFiles || []),
      ...scoredFileEvidence,
      ...(design.impactedAreas || []),
      ...signals.testPlan
    ]),
    backendTasks: signals.updateApiScenarios.length ? signals.updateApiScenarios : [
      ...(design.apiChanges || []),
      longTextOverflow ? 'Confirm whether displayed text comes from frontend state, API payloads, persisted data, or shared preview rendering before changing backend code.' : 'Confirm whether the current requirement needs backend/API/data changes before implementation.',
      'Record any API compatibility, validation, authorization, or error-handling expectations.'
    ],
    frontendTasks: signals.keyBehaviors.length ? signals.keyBehaviors : [
      'Map the requirement to the affected UI states and components.',
      'Preserve existing interaction, loading, empty, error, success, keyboard, and accessibility behavior.',
      'Keep copy and layout consistent with the product’s design system.'
    ],
    validationTasks: longTextOverflow ? [
      'Create or reuse max-length continuous text fixtures for affected Journey and Activity surfaces.',
      'Verify Journey Builder, Current Journey, Journey Preview, Share Preview, and Activity Preview do not overflow, clip, overlap, or break layout.',
      'Check desktop/mobile responsive widths and record visual evidence or targeted test output.',
      'Capture reviewer findings, accepted risk, and build/test proof before PR readiness.'
    ] : [
      'Map every acceptance criterion to at least one verification step.',
      'Run targeted tests or record why they cannot be run.',
      'Capture reviewer findings, accepted risk, and build/test proof before PR readiness.'
    ],
    accessibilityTasks: longTextOverflow ? [
      'Verify long text remains readable or has an intentional tooltip/title/expanded affordance when truncated.',
      'Preserve keyboard focus order and screen-reader labels in preview and activity detail surfaces.',
      'Avoid color-only or visually hidden-only communication for overflow handling.'
    ] : [
      'Preserve keyboard access, visible focus, labels, contrast, and screen-reader behavior for affected UI.',
      'Verify loading, empty, error, success, and disabled states remain understandable.',
      'Keep shared component fixes reusable instead of creating inconsistent page-only behavior.'
    ],
    securityTasks: [
      'Preserve support-admin restrictions.',
      'Do not introduce new secrets or client-side credentials.',
      'Keep dependency installs blocked unless separately approved.'
    ],
    testTasks: uniqueItems([
      ...signals.testPlan,
      ...(repoAnalysis.candidateTestFiles || []).map((file) => `Review or run nearest test: ${file}`),
      ...(signals.testPlan.length || repoAnalysis.candidateTestFiles?.length ? [] : ['Identify and run the smallest reliable targeted test/build command for the impacted area.'])
    ]),
    approvalRequired: [
      'Approve with warnings for non-critical standards exceptions.',
      'Approve for write before implementation agent execution.',
      'Approve dependency requests before any install.'
    ],
    flexibility: 'Policy exceptions can be documented through approval events. Hard safety blockers stay blocked.',
    risks: [
      'Repo impact may be incomplete until read-only analysis confirms affected files.',
      'Acceptance criteria may be ambiguous without clarification decisions.',
      'Older ODT artifacts from another task must stay historical and not drive this plan.'
    ]
  };
  const now = new Date().toISOString();
  implementationPlanRepository.createPlan({
    id: createId('plan'),
    assignmentId,
    title: planTitle,
    plan,
    status: 'PLAN_REVIEW',
    createdAt: now,
    updatedAt: now
  });
  testPlanRepository.createTestPlan({
    id: createId('testplan'),
    assignmentId,
    phase: isVerificationMode ? 'completed-jira-verification' : 'pre-implementation',
    plan: {
      backend: plan.backendTasks,
      frontend: plan.frontendTasks,
      accessibility: plan.accessibilityTasks,
      coverage: isVerificationMode
        ? ['jira done status', 'commit evidence', 'branch or PR state', 'build/test evidence', 'accepted risk if evidence is missing']
        : signals.domainSignals?.longTextOverflow
          ? ['max-length continuous text', 'journey builder', 'current journey', 'journey preview', 'share preview', 'activity preview', 'activity types', 'responsive layout', 'accessibility readability']
          : signals.domainSignals?.assessment
            ? ['utility cases', 'edit flow', 'create flow', 'save success', 'save failure', 'publish success', 'publish failure', 'update payload scenarios']
            : ['acceptance criteria', 'component behavior', 'API/data compatibility', 'error states', 'accessibility', 'targeted regression tests'],
      targetedCommands: plan.testTasks
    },
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now
  });
  return plan;
}

function persistStandardsReview({ assignmentId, phase, artifact, review }) {
  const now = new Date().toISOString();
  const checkId = createId('stdcheck');
  standardsCheckRepository.createCheck({
    id: checkId,
    assignmentId,
    phase,
    standardsVersion: review.standardsVersion,
    status: review.status,
    summary: review.summary || {},
    artifact: artifact || {},
    findings: review.findings || [],
    createFindingId: () => createId('finding'),
    createdAt: now
  });
  createRunEvent(createId('run'), 'standards_check_completed', review.status === 'PASS' ? 'ok' : 'warning', {
    assignmentId,
    phase,
    status: review.status,
    findings: review.findings.length
  }, assignmentId);
  return { ...review, id: checkId, assignmentId, createdAt: now };
}

const workflowEvidenceRepository = createWorkflowEvidenceRepository({
  statements,
  getAssignment,
  parseJsonValue,
  parseAgentWorkerRun,
  parseAgentRelayItem,
  parseIntakeAssetRow
});

const aiWorkAuditPackRepository = createAiWorkAuditPackRepository({
  statements
});

const approvalEventRepository = createApprovalEventRepository({
  statements
});

const agentFoundryRunRepository = createAgentFoundryRunRepository({
  statements,
  parseAgentFoundryRun: parseAgentFoundryRow
});

const agentRelayRepository = createAgentRelayRepository({
  statements,
  parseAgentRelayItem
});

const agentEventRepository = createAgentEventRepository({
  statements
});

const agentWorkerRunRepository = createAgentWorkerRunRepository({
  statements,
  parseAgentWorkerRun
});

const aiUsageRepository = createAiUsageRepository({
  statements
});

const chatMessageRepository = createChatMessageRepository({
  statements
});

const connectorEventRepository = createConnectorEventRepository({
  statements
});

const dependencyRequestRepository = createDependencyRequestRepository({
  statements
});

const implementationPlanRepository = createImplementationPlanRepository({
  statements,
  parseJsonValue
});

const implementationEvidenceRepository = createImplementationEvidenceRepository({
  statements
});

const intakeAssetRepository = createIntakeAssetRepository({
  statements,
  parseIntakeAssetRow
});

const prReadinessReportRepository = createPrReadinessReportRepository({
  statements
});

const repoAnalysisRepository = createRepoAnalysisRepository({
  statements,
  parseJsonValue
});

const requirementRepository = createRequirementRepository({
  statements
});

const reviewCommentRepository = createReviewCommentRepository({
  statements
});

const runEventRepository = createRunEventRepository({
  statements
});

const standardsCheckRepository = createStandardsCheckRepository({
  statements
});

const technicalDesignRepository = createTechnicalDesignRepository({
  statements,
  parseJsonValue
});

const testPlanRepository = createTestPlanRepository({
  statements,
  parseJsonValue
});

function collectEvidence(assignmentId = 'assignment-local-mvp') {
  ensureRelayItemsForAssignment(assignmentId);
  const evidence = workflowEvidenceRepository.getAssignmentEvidence(assignmentId);
  const freshness = splitEvidenceByFreshness(evidence);
  evidence.current = freshness.current;
  evidence.historical = freshness.historical;
  evidence.requirementSignals = parseRequirementSignals(evidence.requirements?.[0]?.rawText || '');
  evidence.reviewCycleCloseout = deriveReviewCycleCloseout(scopedCurrentEvidence(evidence));
  evidence.workflowState = deriveWorkflowStateFromModule(evidence);
  return evidence;
}

const workflowService = createWorkflowService({
  collectEvidence
});

const projectContractService = createProjectContractService({
  repository: projectContractRepository
});

function getActiveStandardsFindings(evidence) {
  if (evidence.current) return evidence.current.standardsChecks?.[0]?.findings || [];
  if (Array.isArray(evidence.standardsChecks)) return evidence.standardsChecks[0]?.findings || evidence.standardsFindings || [];
  return evidence.standardsFindings || [];
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

function getActiveReworkRelayItemsForWorker(evidence, workerRoleId = '') {
  const roleId = String(workerRoleId || '').trim();
  if (!roleId) return [];
  return (evidence.agentRelayItems || []).filter((item) => (
    item.itemType === 'rework'
    && item.targetWorkerRole === roleId
    && ['open', 'assigned', 'answered'].includes(String(item.status || '').toLowerCase())
  ));
}

function latestPostImplementationCheck(evidence) {
  return (evidence.standardsChecks || []).find((check) => check.phase === 'post-implementation') || null;
}

function activeImplementationEvidenceRecords(evidence = {}) {
  const latest = (evidence.implementationEvidence || [])[0] || null;
  return latest ? [latest] : [];
}

function getActiveImplementationTests(evidence = {}) {
  return activeImplementationEvidenceRecords(evidence).flatMap((record) => record.tests || []);
}

function getActiveImplementationCommands(evidence = {}) {
  return activeImplementationEvidenceRecords(evidence).flatMap((record) => record.commands || []);
}

function getFailedImplementationTests(evidence) {
  return getActiveImplementationTests(evidence)
    .filter((test) => test.status === 'failed');
}

function getIncompleteImplementationTests(evidence) {
  return getActiveImplementationTests(evidence)
    .filter((test) => ['not_run', 'unknown', ''].includes(String(test.status || '').toLowerCase()));
}

function hasAcceptedImplementationRisk(evidence) {
  return (evidence.reviewComments || []).some((comment) => (
    comment.status === 'accepted_risk'
    && ['implementation', 'pr'].includes(comment.targetType)
  ));
}

function hasAcceptedVerificationRisk(evidence) {
  return (evidence.reviewComments || []).some((comment) => (
    comment.status === 'accepted_risk'
    && ['review', 'implementation', 'pr'].includes(comment.targetType)
  ));
}

function humanizeLabel(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function timeMillis(value = '') {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function workerRunTime(run = {}) {
  return timeMillis(run.completedAt || run.updatedAt || run.createdAt);
}

function latestByTime(items = [], predicate = () => true, getTime = (item) => timeMillis(item?.createdAt)) {
  return (items || [])
    .filter(Boolean)
    .filter(predicate)
    .sort((a, b) => getTime(b) - getTime(a))[0] || null;
}

function workerHasReviewableOutput(run = {}) {
  const status = String(run.status || '').toLowerCase();
  const output = run.output || {};
  return Boolean(
    String(output.rawText || '').trim()
    || output.responseBytes > 0
    || ['completed', 'response_ready', 'needs_input', 'needs_review'].includes(status)
  );
}

function isImplementationWorkerRun(run = {}) {
  return ['fullstack-dev', 'backend-dev', 'frontend-dev'].includes(String(run.workerRole || '').toLowerCase());
}

function isActiveWorkerStatus(status = '') {
  return ['starting', 'running', 'delegated_visible', 'stop_requested'].includes(String(status || '').toLowerCase());
}

function isPreparedWorkerStatus(status = '') {
  return ['bundle_created', 'manual_fallback'].includes(String(status || '').toLowerCase());
}

function dependencyContractRows(evidence, status) {
  const scoped = scopedCurrentEvidence(evidence);
  return (scoped.dependencyRequests || [])
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
  const existingRelayItem = agentRelayRepository.findByUniqueKey(comment.assignmentId, uniqueKey);
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
  const relayItem = agentRelayRepository.createRelayItem({
    id: relayId,
    assignmentId: comment.assignmentId,
    sourceWorkerRunId: '',
    sourceWorkerRole: 'reviewer',
    sourceWorkerRoleLabel: 'Reviewer',
    targetWorkerRole,
    targetLane,
    itemType: 'rework',
    status: 'open',
    severity,
    title: `Rework required: ${humanizeLabel(comment.targetType || 'review')}`,
    message: comment.comment,
    context,
    decision: {},
    uniqueKey,
    createdBy: createdBy || 'odt-review',
    createdAt: now,
    updatedAt: now,
    resolvedAt: null
  });
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
  const createdComment = reviewCommentRepository.createComment({
    id,
    assignmentId,
    targetType: normalizedTargetType,
    targetId,
    severity: normalizedSeverity,
    comment: text,
    status: normalizedStatus,
    createdBy,
    createdAt: now,
    updatedAt: now,
    resolutionNotes
  });
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
  const existing = reviewCommentRepository.getById(id);
  if (!existing) {
    const error = new Error('Review comment not found.');
    error.statusCode = 404;
    throw error;
  }
  const allowedStatuses = new Set(['open', 'resolved', 'accepted_risk']);
  const nextStatus = String(status || existing.status).toLowerCase();
  if (!allowedStatuses.has(nextStatus)) throw new Error('Review comment status is not supported.');
  const updated = reviewCommentRepository.updateStatus({
    id,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    resolutionNotes
  });
  createRunEvent(createId('run'), 'review_comment_updated', nextStatus === 'open' ? 'warning' : 'ok', {
    assignmentId: updated.assignmentId,
    commentId: id,
    status: nextStatus
  }, updated.assignmentId);
  return updated;
}

function sendReviewCommentToReworkRelay({ commentId = '', requestedBy = process.env.USER || 'local-user' } = {}) {
  const comment = reviewCommentRepository.getById(commentId);
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
  approvalEventRepository.createApproval({
    id: createId('approval'),
    assignmentId,
    approvalType: 'plan_review',
    status: 'needs_changes',
    approvedBy: process.env.USER || 'local-user',
    approvedAt: now,
    notes: commentText
  });

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

function normalizeStringItems(value, limit = 80) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(typeof item === 'object' ? item.path || item.command || item.name || item.label || JSON.stringify(item) : item).trim())
      .filter(Boolean)
      .slice(0, limit);
  }
  return String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeTestEvidence(value, limit = 80) {
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
      .filter(Boolean)
      .slice(0, limit);
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
    })
    .slice(0, limit);
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

function cleanEvidencePathCandidate(value = '') {
  return String(value || '')
    .trim()
    .replace(/^file:\/\//i, '')
    .replace(/^<|>$/g, '')
    .replace(/^`|`$/g, '')
    .replace(/:\d+(?::\d+)?$/, '')
    .trim();
}

function extractFilePathsFromEvidenceLines(lines = []) {
  const candidates = [];
  const extensionPattern = '(?:js|jsx|ts|tsx|css|scss|html|json|md|yml|yaml|java|py|go|rb|sql|xml|properties|sh|cjs|mjs)';
  const pathPattern = new RegExp(`(?:^|[\\s\`"'([<{])((?:\\.?/?[A-Za-z0-9_.@+-]+/)+[A-Za-z0-9_.@+-]+\\.${extensionPattern}|[A-Za-z0-9_.@+-]+\\.${extensionPattern})(?:$|[\\s\`"',).:\\]}>])`, 'gi');
  const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

  lines.forEach((line) => {
    const stripped = stripEvidenceLine(line);
    let linkMatch = markdownLinkPattern.exec(stripped);
    while (linkMatch) {
      candidates.push(linkMatch[2]);
      candidates.push(linkMatch[1]);
      linkMatch = markdownLinkPattern.exec(stripped);
    }

    const lineWithoutLinks = stripped.replace(markdownLinkPattern, ' ');
    let pathMatch = pathPattern.exec(lineWithoutLinks);
    while (pathMatch) {
      candidates.push(pathMatch[1]);
      pathMatch = pathPattern.exec(lineWithoutLinks);
    }
  });

  return uniqueLimited(
    candidates
      .map(cleanEvidencePathCandidate)
      .filter((candidate) => candidate && !/^(http|https):/i.test(candidate) && !candidate.includes('node_modules/')),
    80
  );
}

function extractChangedFilesFromWorkerOutput(text = '') {
  const sectionLines = [
    ...extractMarkdownSectionLines(text, ['files changed', 'changed files', 'modified files', 'files updated']),
    ...extractMarkdownSectionLines(text, ['summary of changes'])
  ];
  const explicitSectionPaths = extractFilePathsFromEvidenceLines(sectionLines);
  if (explicitSectionPaths.length) return uniqueLimited(explicitSectionPaths, 50);

  const fallbackLines = String(text || '').replace(/\r/g, '').split('\n')
    .filter((line) => !/^\s*[-*]\s*(?:`)?(?:npm|pnpm|yarn|npx|node|jest|vitest|pytest|mvn|gradle|make|cargo|python|go\s+test)\b/i.test(line));
  return uniqueLimited(extractFilePathsFromEvidenceLines(fallbackLines), 50);
}

function runGitRead(repoPath = '', args = [], timeout = 10000) {
  if (!repoPath || !existsSync(repoPath)) {
    return { ok: false, status: null, stdout: '', stderr: 'Repository path does not exist.' };
  }
  const result = spawnSync('git', ['-C', repoPath, ...args], {
    encoding: 'utf8',
    timeout
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || result.error?.message || '').trim()
  };
}

function normalizeRepoRelativePath(value = '', repoPath = '') {
  let normalized = cleanEvidencePathCandidate(value);
  const normalizedRepoPath = String(repoPath || '').replace(/\/+$/, '');
  if (normalizedRepoPath && normalized.startsWith(`${normalizedRepoPath}/`)) {
    normalized = normalized.slice(normalizedRepoPath.length + 1);
  }
  return normalized
    .trim()
    .replace(/^`|`$/g, '')
    .replace(/^\.?\//, '')
    .replace(/^\//, '')
    .trim();
}

function getWorkerTargetRepoPath({ assignmentId = 'assignment-local-mvp', run = null } = {}) {
  const statusFileJson = readWorkerStatusFile(run?.statusFile);
  return String(
    statusFileJson.targetRepoPath
    || run?.output?.launchStatus?.targetRepoPath
    || run?.output?.targetRepoPath
    || getAssignment(assignmentId)?.repoPath
    || ''
  ).trim();
}

function verifyWorkerRepoState({ assignmentId = 'assignment-local-mvp', run = null, responseText = '' } = {}) {
  const repoPath = getWorkerTargetRepoPath({ assignmentId, run });
  const declaredChangedFiles = extractChangedFilesFromWorkerOutput(responseText).map((file) => normalizeRepoRelativePath(file, repoPath)).filter(Boolean);
  const emptyResult = {
    repoPath,
    verifiedAt: new Date().toISOString(),
    declaredChangedFiles,
    gitChangedFiles: [],
    gitStatusShort: '',
    status: 'not_checked',
    warnings: []
  };
  if (!repoPath || repoPath.startsWith('browser-selected:') || !existsSync(repoPath)) {
    return {
      ...emptyResult,
      status: 'warning',
      warnings: ['Target repository path is unavailable, so ODT could not verify worker-declared changed files.']
    };
  }
  const diffResult = runGitRead(repoPath, ['diff', '--name-only']);
  const stagedResult = runGitRead(repoPath, ['diff', '--cached', '--name-only']);
  const statusResult = runGitRead(repoPath, ['status', '--short']);
  const gitChangedFiles = uniqueLimited([
    ...(diffResult.stdout ? diffResult.stdout.split('\n') : []),
    ...(stagedResult.stdout ? stagedResult.stdout.split('\n') : [])
  ].map(normalizeRepoRelativePath).filter(Boolean), 200);
  const warnings = [];
  if (!diffResult.ok || !stagedResult.ok || !statusResult.ok) {
    warnings.push('Git verification command failed; review worker output and repository state manually.');
  }
  if (declaredChangedFiles.length && !gitChangedFiles.length) {
    warnings.push('Worker output declares changed files, but the target repository currently has no git diff.');
  }
  const missingDeclaredFiles = declaredChangedFiles.filter((file) => (
    gitChangedFiles.length && !gitChangedFiles.some((gitFile) => gitFile === file || gitFile.endsWith(`/${file}`) || file.endsWith(`/${gitFile}`))
  ));
  if (missingDeclaredFiles.length) {
    warnings.push(`Worker-declared files are not present in the current git diff: ${missingDeclaredFiles.slice(0, 8).join(', ')}${missingDeclaredFiles.length > 8 ? ', ...' : ''}.`);
  }
  return {
    ...emptyResult,
    gitChangedFiles,
    gitStatusShort: statusResult.stdout,
    status: warnings.length ? 'warning' : 'verified',
    warnings
  };
}

function extractCommandsFromWorkerOutput(text = '') {
  const commandLines = [
    ...extractMarkdownSectionLines(text, ['commands run', 'commands/tests run and outcomes', 'tests run', 'verification commands', 'commands'])
  ];
  const commandStart = /^(?:`)?(?:(?:npm|pnpm|yarn|npx|node|jest|vitest|pytest|mvn|gradle|make|cargo|python)\b|(?:go\s+test\b)|(?:bundle\s+exec\b))/i;
  const inlineCommandPattern = /`((?:(?:npm|pnpm|yarn|npx|node|jest|vitest|pytest|mvn|gradle|make|cargo|python)\b|(?:go\s+test\b)|(?:bundle\s+exec\b))[^`]+)`/i;
  const lines = `${commandLines.join('\n')}\n${text}`
    .replace(/\r/g, '')
    .split('\n')
    .slice(0, 600);
  const matches = lines
    .map(stripEvidenceLine)
    .map((line) => {
      const inlineMatch = line.match(inlineCommandPattern);
      if (inlineMatch?.[1]) return inlineMatch[1].trim();
      const match = line.match(commandStart);
      if (!match || typeof match.index !== 'number') return '';
      return line.slice(match.index)
        .replace(/^`|`$/g, '')
        .replace(/`.*$/, '')
        .replace(/\s+\|\s+(passed|failed|skipped|not_run|not run|success|ok|error).*$/i, '')
        .trim();
    })
    .filter(Boolean);
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

function normalizeExtractedWorkerEvidence(extracted = {}) {
  const changedFiles = normalizeStringItems(extracted.changedFiles || [], 80);
  const commands = normalizeStringItems(extracted.commands || [], 50);
  const tests = normalizeTestEvidence(extracted.tests || [], 80);
  const warnings = normalizeStringItems(extracted.warnings || [], 20);
  const summary = String(extracted.summary || '').trim().slice(0, 6000);
  return {
    ...extracted,
    changedFiles,
    commands,
    tests,
    summary,
    warnings
  };
}

function extractImplementationEvidenceFromWorkerRun(run) {
  const rawText = readTextSnippet(run?.responseFile, 24000) || truncateForApi(run?.output?.rawText || '', 24000);
  try {
    const changedFiles = extractChangedFilesFromWorkerOutput(rawText);
    const commands = extractCommandsFromWorkerOutput(rawText);
    const tests = extractTestsFromWorkerOutput(rawText);
    const summary = [
      extractWorkerImplementationSummary(rawText),
      '',
      `Source worker: ${run?.workerRoleLabel || run?.workerRole || 'Worker'} (${run?.executionAgent || 'agent'}).`,
      `Source response: ${run?.responseFile || 'not captured'}.`
    ].join('\n').trim();
    const extracted = normalizeExtractedWorkerEvidence({
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
    });
    return extracted;
  } catch (err) {
    return normalizeExtractedWorkerEvidence({
      changedFiles: [],
      commands: [],
      tests: [],
      summary: [
        extractWorkerImplementationSummary(rawText),
        '',
        `Source worker: ${run?.workerRoleLabel || run?.workerRole || 'Worker'} (${run?.executionAgent || 'agent'}).`,
        `Source response: ${run?.responseFile || 'not captured'}.`
      ].join('\n').trim(),
      source: {
        workerRunId: run?.id || '',
        runId: run?.runId || '',
        workerRole: run?.workerRole || '',
        workerRoleLabel: run?.workerRoleLabel || '',
        executionAgent: run?.executionAgent || '',
        responseFile: run?.responseFile || '',
        logFile: run?.logFile || ''
      },
      confidence: 'low',
      warnings: [`ODT could not safely infer structured evidence from this worker output: ${err.message}. Review the response and edit evidence manually.`]
    });
  }
}

function parseIntakeAssetRow(row) {
  if (!row) return null;
  let analysisJson = typeof row.analysisJson === 'string'
    ? parseJsonValue(row.analysisJson, {})
    : row.analysisJson || {};
  if (!analysisJson.version && row.storedPath && existsSync(row.storedPath)) {
    try {
      const bytes = readFileSync(row.storedPath);
      analysisJson = analyzeIntakeAsset({
        id: row.id,
        assignmentId: row.assignmentId,
        name: row.originalName,
        storedPath: row.storedPath,
        mimeType: row.mimeType || '',
        fileType: row.fileType || classifyFileType(row.originalName, row.mimeType),
        bytes
      });
      intakeAssetRepository.updateAnalysis({ assetId: row.id, analysis: analysisJson });
    } catch {
      analysisJson = {
        version: 'asset-analysis-1.0',
        status: 'analysis_failed',
        localExtraction: {
          status: 'not_extracted',
          method: 'fallback_metadata',
          excerpt: '',
          note: 'ODT could not read the copied file for analysis. Metadata remains available.'
        },
        aiEnrichment: {
          status: 'optional_not_run',
          recommended: true,
          fallback: 'Manual review of the stored file may be required.'
        }
      };
    }
  }
  return {
    ...row,
    analysisJson
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
  const persistedReview = persistStandardsReview({
    assignmentId,
    phase: 'post-implementation',
    artifact,
    review
  });
  persistAiWorkAuditPackSnapshot({
    assignmentId,
    stage: 'post-implementation-check',
    status: persistedReview.status,
    generatedAt: persistedReview.createdAt
  });
  return persistedReview;
}

function persistAiWorkAuditPackSnapshot({
  assignmentId = 'assignment-local-mvp',
  stage = 'implementation-evidence',
  status = 'recorded',
  generatedAt = new Date().toISOString()
} = {}) {
  const evidence = collectEvidence(assignmentId);
  const pack = buildAiWorkAuditPack({
    evidence,
    generatedAt
  });
  const snapshot = aiWorkAuditPackRepository.createPack({
    id: createId('auditpack'),
    assignmentId,
    stage,
    status,
    pack,
    createdAt: generatedAt
  });
  createRunEvent(createId('run'), 'ai_work_audit_pack_persisted', status === 'blocked' ? 'warning' : 'ok', {
    assignmentId,
    auditPackId: snapshot.id,
    stage,
    status,
    workflowState: pack.summary?.workflowState || 'UNKNOWN'
  }, assignmentId);
  return snapshot;
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
  const evidenceRecord = implementationEvidenceRepository.createEvidence({
    id,
    assignmentId,
    runId: eventRunId,
    phase,
    changedFiles: normalizedChangedFiles,
    commands: normalizedCommands,
    tests: normalizedTests,
    summary: normalizedSummary || 'Implementation evidence recorded for governed review.',
    status: normalizedStatus,
    createdBy,
    createdAt: now,
    updatedAt: now
  });
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
  const auditPack = persistAiWorkAuditPackSnapshot({
    assignmentId,
    stage: 'implementation-evidence',
    status: normalizedStatus,
    generatedAt: now
  });

  const postCheck = runPostCheck
    ? runPostImplementationStandardsCheck({ assignmentId, evidenceRecord })
    : null;
  return { assignmentId, evidence: evidenceRecord, postCheck, auditPack };
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
    '## Pack ID',
    report.packId || report.id || 'Not assigned.',
    '',
    '## Work Item',
    report.workKey || report.linkedJira || report.assignmentId || 'Not tagged.',
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

function selectProjectContractForAssignment(assignmentId = 'assignment-local-mvp', evidence = {}) {
  return selectProjectContractForAssignmentContext({
    contracts: projectContractService.listContracts(),
    assignmentId,
    evidence
  });
}

function summarizeProjectReadiness(readiness = null) {
  if (!readiness) {
    return {
      status: 'missing',
      score: 0,
      blockedChecks: [],
      warningChecks: []
    };
  }
  const blockedChecks = (readiness.checks || []).filter((item) => item.status === 'blocked');
  const warningChecks = (readiness.checks || []).filter((item) => ['warning', 'manual'].includes(item.status));
  return {
    status: readiness.status,
    score: readiness.score,
    blockedChecks,
    warningChecks
  };
}

function getBranchReadinessCheck(readiness = null) {
  return (readiness?.checks || []).find((item) => item.id === 'branch-readiness') || null;
}

function branchReadinessBlocksWrite(readiness = null, evidence = {}) {
  const check = getBranchReadinessCheck(readiness);
  if (!check) return null;
  const status = String(check.status || '').toLowerCase();
  if (!['manual', 'blocked'].includes(status)) return null;
  const override = hasApprovedEvent(evidence.approvals || [], ['branch_readiness_override']);
  return override ? null : check;
}

async function buildCurrentAgentContract(assignmentId, executionAgent = getStoredSetting('executionAgent', 'codex'), options = {}) {
  const evidence = collectEvidence(assignmentId);
  const projectContractSelection = selectProjectContractForAssignment(assignmentId, evidence);
  const projectContract = projectContractSelection.contract || null;
  const projectReadiness = projectContract ? await projectContractService.buildReadiness(projectContract.id) : null;
  const targetRepoPath = projectContract?.repoPath || projectContractSelection.targetRepoPath || evidence.assignment?.repoPath || '';
  const assignmentForContract = {
    ...(evidence.assignment || { id: assignmentId, title: assignmentId, requirement: '' }),
    repoPath: targetRepoPath,
    baseBranch: projectContract?.baseBranch || evidence.assignment?.baseBranch || ''
  };
  const writeApproved = hasWriteApproval(evidence);
  const unresolvedBlockers = getUnresolvedStandardsBlockers(evidence);
  const openReviewBlockers = getOpenReviewBlockers(evidence);
  const reworkRelayItems = getActiveReworkRelayItemsForWorker(evidence, options.workerRoleId);
  const allowAssignedRework = Boolean(writeApproved && reworkRelayItems.length && options.workerRoleId);
  const blockingOpenReviewBlockers = allowAssignedRework ? [] : openReviewBlockers;
  const approvedDependencies = dependencyContractRows(evidence, 'approved');
  const pendingDependencies = dependencyContractRows(evidence, 'pending');
  return {
    evidence,
    projectContractSelection,
    contract: buildAgentContract({
      assignment: assignmentForContract,
      mode: writeApproved && !unresolvedBlockers.length && !blockingOpenReviewBlockers.length ? 'write-approved' : 'read-only',
      executionAgent,
      repoAnalysis: evidence.repoAnalysis[0]?.analysisJson || {},
      technicalDesign: evidence.technicalDesigns[0]?.designJson || {},
      implementationPlan: evidence.implementationPlans[0]?.planJson || {},
      intakeAssets: (evidence.intakeAssets || []).map((asset) => ({
        id: asset.id,
        name: asset.originalName,
        fileType: asset.fileType,
        storedPath: asset.storedPath,
        bytes: asset.bytes,
        checksumSha256: asset.analysisJson?.checksumSha256 || '',
        role: asset.analysisJson?.role || '',
        guidance: asset.analysisJson?.guidance || '',
        extractionStatus: asset.analysisJson?.localExtraction?.status || 'not_analyzed',
        excerpt: asset.analysisJson?.localExtraction?.excerpt || '',
        aiEnrichment: asset.analysisJson?.aiEnrichment || {}
      })),
      approvedDependencies,
      pendingDependencies,
      projectContract,
      projectReadiness,
      standards: {
        ...loadStandardsRegistry(),
        latestStandardsCheckId: evidence.standardsChecks[0]?.id || '',
        unresolvedBlockers,
        openReviewBlockers,
        blockingOpenReviewBlockers,
        assignedReworkRelayItems: reworkRelayItems,
        reworkLaunchAllowed: allowAssignedRework,
        blockerOverrideCaptured: hasLatestBlockerOverride(evidence)
      }
    })
  };
}

async function prepareAgentDelegation({ assignmentId = 'assignment-local-mvp', executionAgent, requireWriteApproved = true, workerRoleId = '', notes = '' } = {}) {
  const selectedAgent = executionAgent || getStoredSetting('executionAgent', 'codex');
  const runId = createId('run');
  const { evidence, contract, projectContractSelection } = await buildCurrentAgentContract(assignmentId, selectedAgent, { workerRoleId });
  const latestCheckId = evidence.standardsChecks[0]?.id || '';
  const selectedRole = workerRoleId ? getAgentWorkerRole(workerRoleId) : null;
  const jiraVerificationProfile = deriveJiraVerificationProfile(evidence);
  const implementationWorkerIds = new Set(['fullstack-dev', 'backend-dev', 'frontend-dev']);
  const activeReworkForSelectedRole = selectedRole ? getActiveReworkRelayItemsForWorker(evidence, selectedRole.id).length > 0 : false;
  const projectReadinessSummary = summarizeProjectReadiness(contract.projectReadiness);
  const branchReadinessCheck = branchReadinessBlocksWrite(contract.projectReadiness, evidence);
  const blockedReasons = [];
  const warnings = [];
  if (jiraVerificationProfile && selectedRole && implementationWorkerIds.has(selectedRole.id) && !activeReworkForSelectedRole) {
    blockedReasons.push(`${jiraVerificationProfile.issueKey} is already completed in Jira with repo evidence. Run Reviewer or Build Verifier first; use implementation workers only for explicit rework.`);
  }
  if (requireWriteApproved && contract.mode !== 'write-approved') {
    blockedReasons.push(contract.standards.unresolvedBlockers?.length
      ? 'Unresolved standards blockers remain.'
      : contract.standards.blockingOpenReviewBlockers?.length
        ? 'Open review blockers must be resolved or accepted as risk.'
        : 'Write approval for the latest standards review is required.');
  }
  if (projectReadinessSummary.status === 'blocked') {
    blockedReasons.push(`Project Contract readiness is blocked: ${projectReadinessSummary.blockedChecks.map((item) => item.detail).join(' ') || 'blocked check requires action.'}`);
  }
  if (requireWriteApproved && selectedRole?.requiresWriteApproval && branchReadinessCheck) {
    blockedReasons.push(`Branch readiness is not safe for write workers: ${branchReadinessCheck.detail} ${branchReadinessCheck.remediation || 'Create or switch to a task branch before launching implementation.'}`.trim());
  }
  if (!contract.projectContract) {
    const targetRepoPath = projectContractSelection?.targetRepoPath || contract.repoPath || '';
    warnings.push(projectContractSelection?.reason === 'no_matching_contract_for_target_repo'
      ? `No Project Contract matches target repo ${targetRepoPath}. ODT will launch against the assignment repo, but command policy must be confirmed from assignment evidence.`
      : 'No Project Contract is saved for this assignment. ODT will use existing assignment/repo evidence, but workers may need manual command confirmation.');
  } else if (projectReadinessSummary.status !== 'ready') {
    warnings.push(`Project Contract ${contract.projectContract.id} readiness is ${projectReadinessSummary.status} (${projectReadinessSummary.score}%). Review warnings before launching long-running workers.`);
  }
  if (getBranchReadinessCheck(contract.projectReadiness)) {
    const branchCheck = getBranchReadinessCheck(contract.projectReadiness);
    warnings.push(`Branch readiness: ${branchCheck.status}. ${branchCheck.detail}`);
  }
  if (contract.standards.reworkLaunchAllowed) {
    warnings.push('Open review blockers are being handled by this assigned rework worker. Build verification and PR readiness remain blocked until reviewer rerun passes.');
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
    branchReadiness: getBranchReadinessCheck(contract.projectReadiness),
    projectContract: contract.projectContract,
    projectContractSelection,
    projectReadiness: contract.projectReadiness,
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
    latestStandardsCheckId: latestCheckId,
    projectContractId: contract.projectContract?.id || '',
    projectContractSelectionReason: projectContractSelection?.reason || '',
    projectReadinessStatus: projectReadinessSummary.status,
    projectReadinessScore: projectReadinessSummary.score,
    branchReadinessStatus: getBranchReadinessCheck(contract.projectReadiness)?.status || ''
  }, assignmentId);
  createRunEvent(runId, 'agent_contract_created', blockedReasons.length ? 'blocked' : 'ok', {
    requestType: 'agent-handoff',
    executionAgent: selectedAgent,
    mode: contract.mode,
    allowedActions: contract.allowedActions,
    projectContractId: contract.projectContract?.id || '',
    projectContractSelectionReason: projectContractSelection?.reason || '',
    projectReadinessStatus: projectReadinessSummary.status,
    projectReadinessScore: projectReadinessSummary.score,
    branchReadiness: getBranchReadinessCheck(contract.projectReadiness),
    blockedReasons,
    warnings
  }, assignmentId);
  createRunEvent(runId, 'agent_handoff_prepared', blockedReasons.length ? 'blocked' : 'ok', {
    requestType: 'agent-handoff',
    executionAgent: selectedAgent,
    status,
    dependencyInstalls: contract.allowedActions.installDependencies ? 'approved' : 'blocked',
    projectContractId: contract.projectContract?.id || '',
    projectContractSelectionReason: projectContractSelection?.reason || '',
    projectReadinessStatus: projectReadinessSummary.status,
    projectReadinessScore: projectReadinessSummary.score,
    branchReadiness: getBranchReadinessCheck(contract.projectReadiness),
    warnings,
    nextStep: handoff.nextStep
  }, assignmentId);
  createAgentEvent(assignmentId, selectedAgent, 'handoff_prepared', status, {
    runId,
    mode: contract.mode,
    latestStandardsCheckId: latestCheckId,
    allowedActions: contract.allowedActions,
    projectContractId: contract.projectContract?.id || '',
    projectReadinessStatus: projectReadinessSummary.status,
    projectReadinessScore: projectReadinessSummary.score,
    branchReadiness: getBranchReadinessCheck(contract.projectReadiness),
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

function readTextSnippet(filePath = '', maxChars = 3600, options = {}) {
  try {
    if (!filePath || !existsSync(filePath)) return '';
    const limit = Math.max(1, Math.min(Number(maxChars) || 3600, 250000));
    const readTail = options.tail === true;
    const stats = statSync(filePath);
    if (!stats.size) return '';

    if (stats.size <= limit) {
      return readFileSync(filePath, 'utf8').trim();
    }

    const fd = openSync(filePath, 'r');
    try {
      const buffer = Buffer.alloc(limit);
      const position = readTail ? Math.max(0, stats.size - limit) : 0;
      const bytesRead = readSync(fd, buffer, 0, limit, position);
      const text = buffer.subarray(0, bytesRead).toString('utf8');
      return readTail
        ? `[ODT showing the last ${limit} bytes of this worker log.]\n\n${text.trim()}`
        : `${text.trim()}\n\n[ODT truncated this worker output for prompt size.]`;
    } finally {
      closeSync(fd);
    }
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
    return agentRelayRepository.createRelayItem({
      id: relayId,
      assignmentId: run.assignmentId,
      sourceWorkerRunId: run.id,
      sourceWorkerRole: run.workerRole,
      sourceWorkerRoleLabel: run.workerRoleLabel,
      targetWorkerRole,
      targetLane,
      itemType: 'question',
      status: question.status || 'open',
      severity: 'needs_review',
      title: `Question for ${targetLane}`,
      message,
      context,
      decision: {},
      uniqueKey,
      createdBy: 'odt-worker-ingest',
      createdAt: now,
      updatedAt: now,
      resolvedAt: null
    });
  }).filter(Boolean);
}

function ensureRelayItemsForAssignment(assignmentId = 'assignment-local-mvp') {
  const workerRuns = agentWorkerRunRepository.listByAssignment(assignmentId);
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
  const relay = agentRelayRepository.getById(relayItemId);
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
  agentRelayRepository.updateRelayItem({
    relayItemId,
    targetWorkerRole: nextTargetRole,
    targetLane: nextTargetLane,
    status: nextStatus,
    severity: relay.severity,
    decision: nextDecision,
    updatedAt: now,
    resolvedAt
  });
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
  return agentRelayRepository.getById(relayItemId);
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

function truncateForApi(value = '', maxChars = 8000) {
  const text = String(value || '');
  const limit = Math.max(1, Number(maxChars) || 8000);
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}\n\n[ODT API compacted this field for browser performance. Full source remains in SQLite/filesystem evidence.]`;
}

function compactJsonForApi(value, options = {}, depth = 0) {
  const maxString = options.maxString || 2200;
  const maxArray = options.maxArray || 40;
  const maxDepth = options.maxDepth || 7;
  if (typeof value === 'string') return truncateForApi(value, maxString);
  if (value === null || typeof value !== 'object') return value;
  if (depth >= maxDepth) return '[ODT compacted nested object for browser performance.]';
  if (Array.isArray(value)) {
    const compacted = value.slice(0, maxArray).map((item) => compactJsonForApi(item, options, depth + 1));
    if (value.length > maxArray) {
      compacted.push({ compacted: true, omittedItems: value.length - maxArray });
    }
    return compacted;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, compactJsonForApi(item, options, depth + 1)])
  );
}

function compactWorkerRunForApi(run = {}) {
  if (!run) return run;
  const output = run.output || {};
  const rawText = String(output.rawText || '');
  return {
    ...run,
    output: compactJsonForApi({
      ...output,
      rawText: rawText ? truncateForApi(rawText, 6000) : rawText,
      rawTextPreview: rawText ? rawText.slice(0, 1800) : output.rawTextPreview || '',
      rawTextTruncated: rawText.length > 6000,
      logTail: truncateForApi(output.logTail || '', 7000)
    }, { maxString: 2200, maxArray: 30, maxDepth: 6 })
  };
}

function compactEvidenceForApi(evidence = {}) {
  return {
    ...evidence,
    requirements: (evidence.requirements || []).map((item) => ({
      ...item,
      rawText: truncateForApi(item.rawText || '', 10000)
    })),
    standardsChecks: (evidence.standardsChecks || []).map((check) => ({
      ...check,
      summary: compactJsonForApi(check.summary || {}, { maxString: 1800, maxArray: 30, maxDepth: 5 }),
      artifact: compactJsonForApi({
        ...(check.artifact || {}),
        requirementText: truncateForApi(check.artifact?.requirementText || '', 3000)
      }, { maxString: 1800, maxArray: 30, maxDepth: 5 })
    })),
    agentEvents: (evidence.agentEvents || []).map((event) => ({
      ...event,
      detailJson: compactJsonForApi(event.detailJson || {}, { maxString: 1800, maxArray: 30, maxDepth: 5 }),
      detail: truncateForApi(event.detail || '', 2400)
    })),
    agentFoundryRuns: (evidence.agentFoundryRuns || []).map((run) => ({
      ...run,
      inputSources: run.inputSources || [],
      output: compactJsonForApi(run.output || {}, { maxString: 1800, maxArray: 30, maxDepth: 6 }),
      outputJson: truncateForApi(run.outputJson || '', 2400)
    })),
    aiWorkAuditPacks: (evidence.aiWorkAuditPacks || []).map((pack) => ({
      ...pack,
      packJson: compactJsonForApi(pack.packJson || {}, { maxString: 4000, maxArray: 60, maxDepth: 7 })
    })),
    prReadinessReports: (evidence.prReadinessReports || []).map((report) => ({
      ...report,
      reportJson: compactJsonForApi(report.reportJson || {}, { maxString: 4000, maxArray: 60, maxDepth: 7 })
    })),
    repoAnalysis: (evidence.repoAnalysis || []).map((row) => ({
      ...row,
      analysisJson: compactJsonForApi(row.analysisJson || {}, { maxString: 2400, maxArray: 80, maxDepth: 6 })
    })),
    technicalDesigns: (evidence.technicalDesigns || []).map((row) => ({
      ...row,
      designJson: compactJsonForApi(row.designJson || {}, { maxString: 2400, maxArray: 80, maxDepth: 6 })
    })),
    implementationPlans: (evidence.implementationPlans || []).map((row) => ({
      ...row,
      planJson: compactJsonForApi(row.planJson || {}, { maxString: 2400, maxArray: 80, maxDepth: 6 })
    })),
    intakeAssets: (evidence.intakeAssets || []).map((asset) => ({
      ...asset,
      analysisJson: compactJsonForApi(asset.analysisJson || {}, { maxString: 1800, maxArray: 40, maxDepth: 5 })
    })),
    agentWorkerRuns: (evidence.agentWorkerRuns || []).map(compactWorkerRunForApi)
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

function isProcessAlive(pid) {
  const value = Number(pid);
  if (!Number.isFinite(value) || value <= 0) return false;
  try {
    process.kill(value, 0);
    return true;
  } catch {
    return false;
  }
}

function inferWorkerTerminalStatus({ statusFileJson = {}, logTail = '', responseBytes = 0 } = {}) {
  const currentStatus = String(statusFileJson.status || '').toLowerCase();
  if (!['running', 'starting', 'delegated_visible', 'stop_requested'].includes(currentStatus)) {
    return statusFileJson;
  }
  const finishedMatch = String(logTail || '').match(/Agent task finished with exit code\s+(\d+)/i);
  const backgroundPid = Number(statusFileJson.backgroundPid);
  if (!finishedMatch && (!backgroundPid || isProcessAlive(backgroundPid))) {
    return statusFileJson;
  }
  const exitCode = finishedMatch ? Number(finishedMatch[1]) : Number(statusFileJson.exitCode ?? 1);
  const completedStatus = exitCode === 0 ? 'completed' : exitCode === 130 ? 'stopped' : 'failed';
  const now = new Date().toISOString();
  return {
    ...statusFileJson,
    status: completedStatus,
    exitCode,
    completedAt: statusFileJson.completedAt || now,
    updatedAt: now,
    note: completedStatus === 'completed'
      ? 'Codex worker completed. Review and ingest response evidence in ODT.'
      : completedStatus === 'stopped'
        ? 'Codex worker stopped by ODT request.'
        : 'Codex worker failed. Review log evidence in ODT.',
    responseBytes,
    logTail
  };
}

function syncWorkerRunStatus({ assignmentId = 'assignment-local-mvp', workerRunId = '' } = {}) {
  const run = agentWorkerRunRepository.getById(workerRunId);
  if (!run || run.assignmentId !== assignmentId) {
    const error = new Error('Agent worker run not found for this assignment.');
    error.statusCode = 404;
    throw error;
  }
  let statusFileJson = readWorkerStatusFile(run.statusFile);
  const responseBytes = fileSizeIfExists(run.responseFile);
  const logBytes = fileSizeIfExists(run.logFile);
  const logTail = readTextSnippet(run.logFile, 5000, { tail: true });
  statusFileJson = inferWorkerTerminalStatus({ statusFileJson, logTail, responseBytes });
  if (run.statusFile && statusFileJson.status && existsSync(run.statusFile)) {
    writeFileSync(run.statusFile, `${JSON.stringify(statusFileJson, null, 2)}\n`, 'utf8');
  }
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
  agentWorkerRunRepository.updateWorkerOutput({
    workerRunId,
    status,
    output,
    questions: run.questions || [],
    updatedAt: now,
    completedAt: completedAt || null
  });
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
    workerRun: agentWorkerRunRepository.getById(workerRunId),
    statusFile: statusFileJson,
    responseBytes,
    logBytes,
    logTail
  };
}

function launchPreparedWorkerRun({ assignmentId = 'assignment-local-mvp', workerRunId = '' } = {}) {
  const run = agentWorkerRunRepository.getById(workerRunId);
  if (!run || run.assignmentId !== assignmentId) {
    const error = new Error('Agent worker run not found for this assignment.');
    error.statusCode = 404;
    throw error;
  }
  const currentStatus = mapLaunchStatusToWorkerStatus(readWorkerStatusFile(run.statusFile).status || run.status, fileSizeIfExists(run.responseFile));
  if (!['bundle_created', 'manual_fallback'].includes(currentStatus)) {
    const error = new Error(`Only prepared bundles can be launched. Current worker status is ${currentStatus || 'unknown'}.`);
    error.statusCode = 409;
    throw error;
  }
  if (!run.scriptFile || !existsSync(run.scriptFile)) {
    const error = new Error('Prepared worker bundle is missing its launch script.');
    error.statusCode = 409;
    throw error;
  }

  const role = getAgentWorkerRole(run.workerRole) || {
    id: run.workerRole,
    label: run.workerRoleLabel || run.workerRole,
    sandboxMode: run.sandboxMode,
    requiresWriteApproval: run.mode === 'write-approved'
  };
  const runDir = run.bundleDir || dirname(run.scriptFile);
  const consoleFile = run.statusFile ? join(dirname(run.statusFile), 'worker-console.command') : '';
  const statusBase = {
    ...(readWorkerStatusFile(run.statusFile) || {}),
    assignmentId,
    workerRunId: run.id,
    runId: run.runId,
    executionAgent: run.executionAgent,
    workerRole: run.workerRole,
    workerRoleLabel: run.workerRoleLabel,
    mode: run.mode,
    sandboxMode: run.sandboxMode,
    launchMode: 'terminal',
    bundleDir: run.bundleDir,
    handoffFile: run.handoffFile,
    promptFile: run.promptFile,
    scriptFile: run.scriptFile,
    consoleFile,
    responseFile: run.responseFile,
    logFile: run.logFile,
    statusFile: run.statusFile,
    manualCommand: run.manualCommand
  };

  const persistWorkerState = ({ status, launchMode, launchStatus, output }) => upsertAgentWorkerRunRecord({
    id: run.id,
    assignmentId,
    runId: run.runId,
    role,
    executionAgent: run.executionAgent,
    mode: run.mode,
    sandboxMode: run.sandboxMode,
    status,
    launchMode,
    bundlePaths: {
      bundleDir: run.bundleDir,
      handoffFile: run.handoffFile,
      promptFile: run.promptFile,
      scriptFile: run.scriptFile,
      responseFile: run.responseFile,
      logFile: run.logFile,
      statusFile: run.statusFile
    },
    manualCommand: run.manualCommand,
    output: {
      ...(run.output || {}),
      ...output,
      launchStatus,
      stopFile: run.stopFile || run.output?.stopFile || launchStatus.stopFile || ''
    },
    questions: run.questions || [],
    sequenceIndex: run.sequenceIndex
  });

  try {
    const backgroundLaunch = launchBackgroundWorker(run.scriptFile, runDir);
    let terminalConsole = null;
    let terminalConsoleError = '';
    if (consoleFile && existsSync(consoleFile)) {
      try {
        terminalConsole = openVisibleTerminal(consoleFile, runDir);
      } catch (consoleError) {
        terminalConsoleError = consoleError.message;
      }
    }
    const launchedStatus = {
      ...statusBase,
      status: 'running',
      launcher: backgroundLaunch.launcher,
      backgroundPid: backgroundLaunch.pid,
      launcherCommand: backgroundLaunch.command,
      terminalConsole,
      terminalConsoleError,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      exitCode: null,
      note: terminalConsole
        ? `Started prepared Codex ${role.label} bundle and opened a visible Terminal log console.`
        : `Started prepared Codex ${role.label} bundle. Terminal log console could not open, but Agent Team live log remains available.`
    };
    const observedResponseBytes = fileSizeIfExists(run.responseFile);
    const observedLogTail = readTextSnippet(run.logFile, 5000, { tail: true });
    const observedStatus = inferWorkerTerminalStatus({
      statusFileJson: {
        ...launchedStatus,
        ...readWorkerStatusFile(run.statusFile),
        launcher: backgroundLaunch.launcher,
        backgroundPid: backgroundLaunch.pid,
        launcherCommand: backgroundLaunch.command,
        terminalConsole,
        terminalConsoleError
      },
      logTail: observedLogTail,
      responseBytes: observedResponseBytes
    });
    const observedWorkerStatus = mapLaunchStatusToWorkerStatus(observedStatus.status, observedResponseBytes);
    const terminalWorkerFinished = ['response_ready', 'completed', 'failed', 'codex_missing', 'failed_to_open', 'stopped'].includes(observedWorkerStatus);
    const persistedLaunchStatus = terminalWorkerFinished
      ? {
        ...launchedStatus,
        ...observedStatus,
        launcher: backgroundLaunch.launcher,
        backgroundPid: backgroundLaunch.pid,
        launcherCommand: backgroundLaunch.command,
        terminalConsole,
        terminalConsoleError,
        responseBytes: observedResponseBytes,
        logTail: observedLogTail
      }
      : launchedStatus;
    if (run.statusFile) writeFileSync(run.statusFile, `${JSON.stringify(persistedLaunchStatus, null, 2)}\n`, 'utf8');
    const workerRun = persistWorkerState({
      status: terminalWorkerFinished ? observedWorkerStatus : 'running',
      launchMode: 'terminal',
      launchStatus: persistedLaunchStatus,
      output: { summary: persistedLaunchStatus.note }
    });
    createRunEvent(run.runId, terminalConsole ? 'agent_worker_terminal_launched' : 'agent_worker_background_launched', terminalWorkerFinished ? observedWorkerStatus : 'running', persistedLaunchStatus, assignmentId);
    createAgentEvent(assignmentId, run.executionAgent, 'worker_bundle_launched', terminalWorkerFinished ? observedWorkerStatus : 'running', persistedLaunchStatus);
    return { status: terminalWorkerFinished ? observedWorkerStatus : terminalConsole ? 'launched' : 'launched_background', launch: persistedLaunchStatus, workerRun };
  } catch (err) {
    const fallbackStatus = {
      ...statusBase,
      status: 'manual_fallback',
      error: err.message,
      manualFallback: true,
      updatedAt: new Date().toISOString(),
      note: 'ODT could not launch this prepared bundle automatically. Use the manual command to start the worker.'
    };
    if (run.statusFile) writeFileSync(run.statusFile, `${JSON.stringify(fallbackStatus, null, 2)}\n`, 'utf8');
    const workerRun = persistWorkerState({
      status: 'manual_fallback',
      launchMode: run.launchMode || 'bundle-only',
      launchStatus: fallbackStatus,
      output: { summary: fallbackStatus.note, error: err.message }
    });
    createRunEvent(run.runId, 'agent_worker_manual_fallback', 'warning', fallbackStatus, assignmentId);
    createAgentEvent(assignmentId, run.executionAgent, 'worker_bundle_launch_failed', 'warning', fallbackStatus);
    return { status: 'manual_fallback', launch: fallbackStatus, workerRun };
  }
}

function nextWorkerSequence(assignmentId) {
  const rows = agentWorkerRunRepository.listByAssignment(assignmentId);
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

function normalizeReviewerSeverity(value = '') {
  const normalized = String(value || '').toLowerCase().replace(/[_\s-]+/g, ' ').trim();
  if (['critical', 'high', 'blocker', 'p0', 'p1'].includes(normalized)) return 'blocker';
  if (['medium', 'warning', 'needs review', 'needs_review', 'p2'].includes(normalized)) return 'warning';
  return 'comment';
}

function extractReviewerFindings(text = '') {
  const findings = [];
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  let current = null;
  const headingPattern = /^\s*(?:(?:\d+[.)]|[-*])\s+)?(?:\*\*)?(critical|high|blocker|medium|warning|needs[_\s-]?review|low|info|comment|p[0-3])(?:\s+(?:finding|findings|issue|issues|risk|risks|gap|gaps|test\s+gap|concern|concerns|note|notes))?(?:\*\*)?\s*:?\s*(.*)$/i;
  const stopSectionPattern = /^\s*(?:#{1,6}\s+|\*\*(?:answers?|summary|files reviewed|commands?|accessibility|security|known risks?|follow-up))/i;

  const flush = () => {
    if (!current) return;
    const body = current.lines.join('\n').trim();
    const message = [current.firstLine, body].filter(Boolean).join('\n').trim();
    if (message) {
      findings.push({
        severity: normalizeReviewerSeverity(current.severity),
        reviewerSeverity: current.severity,
        message: message.slice(0, 3200)
      });
    }
    current = null;
  };

  lines.forEach((line) => {
    const match = line.match(headingPattern);
    if (match) {
      flush();
      current = {
        severity: match[1],
        firstLine: match[2] || '',
        lines: []
      };
      return;
    }
    if (current && stopSectionPattern.test(line)) {
      flush();
      return;
    }
    if (current) current.lines.push(line);
  });
  flush();

  return findings
    .filter((finding) => ['blocker', 'warning', 'comment'].includes(finding.severity))
    .slice(0, 20);
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

function createReviewCommentsForReviewerRun(run, responseText = '') {
  if (!run || run.workerRole !== 'reviewer') return [];
  const findings = extractReviewerFindings(responseText)
    .filter((finding) => ['blocker', 'warning'].includes(finding.severity));
  if (!findings.length) return [];

  const existingComments = reviewCommentRepository.listByAssignment(run.assignmentId);
  return findings.map((finding, index) => {
    const marker = `sourceWorkerRunId=${run.id};findingIndex=${index + 1}`;
    const existing = existingComments.find((comment) => String(comment.resolutionNotes || '').includes(marker));
    if (existing) return { comment: existing, reworkRelayItem: null, existing: true };

    return createReviewComment({
      assignmentId: run.assignmentId,
      targetType: 'implementation',
      targetId: run.id,
      severity: finding.severity,
      status: 'open',
      createdBy: 'odt-reviewer-ingest',
      resolutionNotes: marker,
      comment: [
        `Reviewer ${finding.reviewerSeverity} finding from ${run.workerRoleLabel || 'Reviewer'} (${run.id}).`,
        '',
        finding.message,
        '',
        'Required action: address this finding in a focused rework pass, then rerun reviewer and build verification evidence before PR readiness.'
      ].join('\n')
    });
  }).filter(Boolean);
}

function reviewerOutputIndicatesCleanCloseout(responseText = '', reviewerFindings = []) {
  if ((reviewerFindings || []).some((finding) => ['blocker', 'warning'].includes(finding.severity))) return false;
  const text = String(responseText || '').replace(/\s+/g, ' ').toLowerCase();
  if (!text.trim()) return false;
  const cleanSignals = [
    /no (?:open |remaining |new )?(?:blockers?|critical findings?|high findings?|warnings?|review findings?|issues?)\b/,
    /(?:previous|prior|earlier|reviewer) (?:findings?|blockers?|comments?|issues?).{0,80}(?:resolved|addressed|fixed|closed)/,
    /(?:rework|implementation).{0,80}(?:addresses|resolved|fixed).{0,80}(?:review|blocker|finding|comment)/,
    /(?:review|rerun|verification).{0,80}(?:passed|clean|clear)/,
    /(?:ready|safe).{0,80}(?:build verifier|verification|pr pack|pr-ready|pr readiness)/
  ];
  return cleanSignals.some((pattern) => pattern.test(text));
}

function autoResolveReviewCommentsForReviewerRun(run, responseText = '', reviewerFindings = []) {
  if (!run || run.workerRole !== 'reviewer') return [];
  if (!reviewerOutputIndicatesCleanCloseout(responseText, reviewerFindings)) return [];
  const now = new Date().toISOString();
  const runTime = timeMillis(run.completedAt || run.updatedAt || run.createdAt || now);
  const comments = reviewCommentRepository.listByAssignment(run.assignmentId)
    .filter((comment) => (
      comment.status === 'open'
      && ['blocker', 'warning'].includes(comment.severity)
      && comment.targetType === 'implementation'
      && timeMillis(comment.createdAt) <= runTime
      && (
        comment.createdBy === 'odt-reviewer-ingest'
        || String(comment.resolutionNotes || '').includes('sourceWorkerRunId=')
        || /^Reviewer\b/i.test(String(comment.comment || ''))
      )
    ));
  if (!comments.length) return [];

  const relayItems = agentRelayRepository.listByAssignment(run.assignmentId);
  const resolved = comments.map((comment) => {
    const note = [
      String(comment.resolutionNotes || '').trim(),
      `Auto-resolved by reviewer rerun ${run.id}: reviewer output indicated prior blocker/warning findings were addressed.`
    ].filter(Boolean).join('\n');
    reviewCommentRepository.updateStatus({
      id: comment.id,
      status: 'resolved',
      updatedAt: now,
      resolutionNotes: note
    });
    relayItems
      .filter((item) => item.context?.reviewCommentId === comment.id && ['open', 'assigned', 'answered'].includes(String(item.status || '').toLowerCase()))
      .forEach((item) => {
        agentRelayRepository.updateRelayItem({
          relayItemId: item.id,
          targetWorkerRole: item.targetWorkerRole || '',
          targetLane: item.targetLane || '',
          status: 'resolved',
          severity: item.severity || comment.severity,
          decision: {
            ...(item.decision || {}),
            action: 'auto_resolve',
            decision: `Resolved after reviewer rerun ${run.id} confirmed the finding was addressed.`,
            decidedBy: 'odt-reviewer-ingest',
            decidedAt: now
          },
          updatedAt: now,
          resolvedAt: now
        });
      });
    return reviewCommentRepository.getById(comment.id);
  });

  createRunEvent(run.runId || createId('run'), 'review_comments_auto_resolved', 'ok', {
    assignmentId: run.assignmentId,
    workerRunId: run.id,
    resolvedComments: resolved.length,
    commentIds: resolved.map((comment) => comment.id)
  }, run.assignmentId);
  createAgentEvent(run.assignmentId, 'odt-review', 'review_comments_auto_resolved', 'resolved', {
    workerRunId: run.id,
    resolvedComments: resolved.map((comment) => ({
      id: comment.id,
      severity: comment.severity,
      targetId: comment.targetId
    }))
  });
  return resolved;
}

function upsertAgentWorkerRunRecord({ id, assignmentId, runId, role, executionAgent, mode, sandboxMode, status, launchMode, bundlePaths, manualCommand, output = {}, questions = [], completedAt = null, sequenceIndex = null }) {
  const now = new Date().toISOString();
  return agentWorkerRunRepository.upsertWorkerRun({
    id,
    assignmentId,
    runId,
    workerRole: role.id,
    workerRoleLabel: role.label,
    executionAgent,
    mode,
    sandboxMode,
    status,
    sequenceIndex: sequenceIndex || nextWorkerSequence(assignmentId),
    launchMode,
    bundleDir: bundlePaths.bundleDir || '',
    handoffFile: bundlePaths.handoffFile || '',
    promptFile: bundlePaths.promptFile || '',
    scriptFile: bundlePaths.scriptFile || '',
    responseFile: bundlePaths.responseFile || '',
    logFile: bundlePaths.logFile || '',
    statusFile: bundlePaths.statusFile || '',
    manualCommand: manualCommand || '',
    output,
    questions,
    createdAt: now,
    updatedAt: now,
    completedAt
  });
}

function ingestWorkerOutput({ assignmentId = 'assignment-local-mvp', workerRunId = '' } = {}) {
  const run = agentWorkerRunRepository.getById(workerRunId);
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
  const reviewerFindings = run.workerRole === 'reviewer' ? extractReviewerFindings(responseText) : [];
  const repoVerification = verifyWorkerRepoState({ assignmentId, run, responseText });
  const responseBytes = fileSizeIfExists(run.responseFile);
  const logBytes = fileSizeIfExists(run.logFile);
  const now = new Date().toISOString();
  const output = {
    ...(run.output || {}),
    summary: summarizeWorkerOutput(responseText),
    rawText: responseText,
    reviewerFindings,
    repoVerification,
    responseBytes,
    logBytes,
    responseFile: run.responseFile,
    logTail: readTextSnippet(run.logFile, 5000, { tail: true }),
    refreshedAt: now,
    ingestedAt: now
  };
  const completedAt = now;
  const nextStatus = questions.length
    ? 'needs_input'
    : reviewerFindings.some((finding) => ['blocker', 'warning'].includes(finding.severity)) || repoVerification.status === 'warning'
      ? 'needs_review'
      : 'completed';
  agentWorkerRunRepository.updateWorkerOutput({
    workerRunId,
    status: nextStatus,
    output,
    questions,
    updatedAt: completedAt,
    completedAt
  });
  createRunEvent(run.runId, 'agent_worker_output_ingested', questions.length || reviewerFindings.some((finding) => ['blocker', 'warning'].includes(finding.severity)) || repoVerification.status === 'warning' ? 'warning' : 'ok', {
    assignmentId,
    workerRunId,
    workerRole: run.workerRole,
    workerRoleLabel: run.workerRoleLabel,
    questions: questions.length,
    reviewerFindings: reviewerFindings.length,
    repoVerification,
    summary: output.summary
  }, assignmentId);
  createAgentEvent(assignmentId, run.executionAgent, 'worker_output_ingested', nextStatus, {
    workerRunId,
    workerRole: run.workerRole,
    workerRoleLabel: run.workerRoleLabel,
    questions,
    reviewerFindings,
    repoVerification,
    summary: output.summary
  });
  if (repoVerification.status === 'warning') {
    createRunEvent(run.runId, 'worker_repo_verification_warning', 'warning', {
      assignmentId,
      workerRunId,
      workerRole: run.workerRole,
      workerRoleLabel: run.workerRoleLabel,
      repoPath: repoVerification.repoPath,
      declaredChangedFiles: repoVerification.declaredChangedFiles,
      gitChangedFiles: repoVerification.gitChangedFiles,
      warnings: repoVerification.warnings
    }, assignmentId);
  }
  const updatedRun = agentWorkerRunRepository.getById(workerRunId);
  const relayItems = createRelayItemsForWorkerRun(updatedRun);
  const reviewerComments = createReviewCommentsForReviewerRun(updatedRun, responseText);
  const autoResolvedReviewComments = autoResolveReviewCommentsForReviewerRun(updatedRun, responseText, reviewerFindings);
  if (relayItems.length) {
    createRunEvent(run.runId, 'agent_relay_items_created', 'ok', {
      assignmentId,
      workerRunId,
      relayItems: relayItems.length,
      targetLanes: relayItems.map((item) => item.targetLane)
    }, assignmentId);
  }
  if (reviewerComments.length) {
    createRunEvent(run.runId, 'reviewer_findings_ingested', 'warning', {
      assignmentId,
      workerRunId,
      reviewComments: reviewerComments.length,
      createdComments: reviewerComments.filter((item) => !item.existing).length
    }, assignmentId);
    createAgentEvent(assignmentId, 'odt-review', 'reviewer_findings_ingested', 'needs_review', {
      workerRunId,
      reviewComments: reviewerComments.map((item) => item.comment?.id || item.id || '').filter(Boolean)
    });
  }
  if (autoResolvedReviewComments.length) {
    createRunEvent(run.runId, 'reviewer_clean_rerun_resolved_findings', 'ok', {
      assignmentId,
      workerRunId,
      resolvedComments: autoResolvedReviewComments.length,
      commentIds: autoResolvedReviewComments.map((comment) => comment.id)
    }, assignmentId);
  }
  return updatedRun;
}

function recordImplementationEvidenceFromWorkerRun({ assignmentId = 'assignment-local-mvp', workerRunId = '', runPostCheck = true, dryRun = false } = {}) {
  let run = agentWorkerRunRepository.getById(workerRunId);
  if (!run || run.assignmentId !== assignmentId) {
    const error = new Error('Agent worker run not found for this assignment.');
    error.statusCode = 404;
    throw error;
  }
  if (!run.output?.rawText && fileSizeIfExists(run.responseFile) > 0) {
    run = ingestWorkerOutput({ assignmentId, workerRunId });
  }
  const rawText = readTextSnippet(run?.responseFile, 24000) || truncateForApi(run?.output?.rawText || '', 24000);
  if (!String(rawText || '').trim()) {
    const error = new Error('No worker response text found yet. Ingest output after the worker writes a response, or record implementation evidence manually.');
    error.statusCode = 409;
    throw error;
  }
  const extracted = extractImplementationEvidenceFromWorkerRun(run);
  const repoVerification = run.output?.repoVerification?.verifiedAt
    ? run.output.repoVerification
    : verifyWorkerRepoState({ assignmentId, run, responseText: rawText });
  const repoWarnings = Array.isArray(repoVerification.warnings) ? repoVerification.warnings : [];
  if (repoVerification.status === 'verified' && Array.isArray(repoVerification.gitChangedFiles) && repoVerification.gitChangedFiles.length) {
    extracted.changedFiles = repoVerification.gitChangedFiles;
  }
  extracted.repoVerification = repoVerification;
  extracted.warnings = uniqueLimited([...(extracted.warnings || []), ...repoWarnings], 40);
  const blocksImplementationEvidence = repoVerification.status === 'warning'
    && repoWarnings.some((warning) => /no git diff|declares changed files|not present in the current git diff/i.test(warning));
  if (dryRun) {
    createRunEvent(run.runId || createId('run'), 'implementation_evidence_extraction_previewed', extracted.warnings.length ? 'warning' : 'ok', {
      assignmentId,
      workerRunId,
      changedFiles: extracted.changedFiles.length,
      commands: extracted.commands.length,
      tests: extracted.tests.length,
      warnings: extracted.warnings,
      repoVerification
    }, assignmentId);
    return {
      assignmentId,
      dryRun: true,
      extracted,
      workerRun: agentWorkerRunRepository.getById(workerRunId)
    };
  }
  if (blocksImplementationEvidence) {
    createRunEvent(run.runId || createId('run'), 'implementation_evidence_repo_verification_blocked', 'warning', {
      assignmentId,
      workerRunId,
      workerRole: run.workerRole,
      workerRoleLabel: run.workerRoleLabel,
      repoVerification
    }, assignmentId);
    const error = new Error('ODT blocked implementation evidence recording because worker output does not match the current target repository diff.');
    error.statusCode = 409;
    error.repoVerification = repoVerification;
    throw error;
  }
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
    warnings: extracted.warnings,
    repoVerification
  }, assignmentId);
  createAgentEvent(assignmentId, run.executionAgent || 'agent', 'worker_evidence_derived', extracted.warnings.length ? 'needs_review' : 'completed', {
    workerRunId,
    workerRole: run.workerRole,
    workerRoleLabel: run.workerRoleLabel,
    evidenceId: result.evidence.id,
    extracted
  });
  return { ...result, extracted, workerRun: agentWorkerRunRepository.getById(workerRunId) };
}

function requestStopWorkerRun({ assignmentId = 'assignment-local-mvp', workerRunId = '', requestedBy = process.env.USER || 'local-user', reason = '' } = {}) {
  const run = agentWorkerRunRepository.getById(workerRunId);
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
  agentWorkerRunRepository.updateWorkerOutput({
    workerRunId,
    status: active ? 'stop_requested' : run.status,
    output,
    questions: run.questions || [],
    updatedAt: now,
    completedAt: active ? null : run.completedAt
  });
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
    workerRun: agentWorkerRunRepository.getById(workerRunId),
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
  const projectContract = contract.projectContract || null;
  const projectReadiness = contract.projectReadiness || null;
  const workerRelay = collectWorkerRelayEvidence(evidence, workerRole.id);
  const agentRelayContext = collectAgentRelayContext(evidence, workerRole.id);
  const intakeAssets = (evidence.intakeAssets || []).map((asset) => ({
    name: asset.originalName,
    type: asset.fileType,
    storedPath: asset.storedPath,
    checksumSha256: asset.analysisJson?.checksumSha256 || '',
    role: asset.analysisJson?.role || '',
    guidance: asset.analysisJson?.guidance || '',
    extractionStatus: asset.analysisJson?.localExtraction?.status || 'not_analyzed',
    excerpt: asset.analysisJson?.localExtraction?.excerpt || '',
    aiEnrichment: asset.analysisJson?.aiEnrichment || {}
  }));
  const openReviews = (evidence.reviewComments || [])
    .filter((comment) => comment.status === 'open')
    .map((comment) => ({
      severity: comment.severity,
      target: comment.targetType,
      message: comment.comment,
      recommendation: 'review required'
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
    '- Treat the Project Contract section as the source of truth for build/test/run commands.',
    '- Do not run any command pattern listed under Project Contract blockedCommands.',
    '- If the Project Contract differs from a guessed command, use the Project Contract or stop and ask.',
    '- Do not install dependencies or modify dependency manifests unless ODT explicitly marks installDependencies as true and the package is listed in approvedDependencies.',
    '- Follow existing repository patterns and keep changes tightly scoped.',
    '- Run the requested tests when feasible. If a test cannot run, record the reason.',
    '- Leave changes in the working tree for developer review.',
    '',
    '## Target Repository',
    `- Path: ${contract.repoPath || 'not configured'}`,
    `- Base branch: ${contract.baseBranch || 'not captured'}`,
    '',
    '## Project Contract',
    projectContract
      ? `- Contract: ${projectContract.projectName} (${projectContract.id})`
      : '- No saved Project Contract was found for this assignment.',
    projectContract ? `- Risk: ${projectContract.riskProfile || 'medium'}` : '',
    projectContract ? `- Install: ${projectContract.installCommand || 'not recorded'}` : '',
    projectContract ? `- Build: ${projectContract.buildCommand || 'not recorded'}` : '',
    projectContract ? `- Test: ${projectContract.testCommand || 'not recorded'}` : '',
    projectContract ? `- Run UI: ${projectContract.runUiCommand || 'not recorded'}` : '',
    projectContract ? `- Run API: ${projectContract.runApiCommand || 'not recorded'}` : '',
    projectContract ? `- Deploy: ${projectContract.deployCommand || 'deployment requires separate approval'}` : '',
    projectContract?.blockedCommands?.length ? `- Blocked commands: ${projectContract.blockedCommands.join(', ')}` : '- Blocked commands: use ODT default destructive-action policy.',
    projectReadiness ? `- Readiness: ${projectReadiness.status} (${projectReadiness.score}%)` : '- Readiness: not checked because no Project Contract is saved.',
    projectReadiness?.checks?.length ? '```json' : '',
    projectReadiness?.checks?.length ? JSON.stringify({
      contract: projectContract,
      readiness: projectReadiness
    }, null, 2) : '',
    projectReadiness?.checks?.length ? '```' : '',
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
    intakeAssets.length ? intakeAssets.map((asset) => [
      `- ${asset.name} (${asset.type})`,
      `  - Path: ${asset.storedPath}`,
      asset.checksumSha256 ? `  - SHA-256: ${asset.checksumSha256}` : '',
      asset.role ? `  - Role: ${asset.role}` : '',
      asset.guidance ? `  - Use: ${asset.guidance}` : '',
      `  - Extraction: ${asset.extractionStatus}`,
      asset.aiEnrichment?.recommended ? `  - Optional enrichment: ${asset.aiEnrichment.status}; fallback to stored file/manual review if provider is offline.` : '',
      asset.excerpt ? `  - Local excerpt:\n${asset.excerpt.split('\n').slice(0, 30).map((line) => `    ${line}`).join('\n')}` : ''
    ].filter(Boolean).join('\n')).join('\n') : '- No uploaded intake assets were attached.',
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

function buildCodexLaunchScript({ repoPath, promptFile, responseFile, logFile, statusFile, stopFile, codexExecutable, codexModel, skipGitRepoCheck, sandboxMode, workerRole }) {
  const readOnlyWorker = !workerRole.requiresWriteApproval;
  const codexWorkDir = readOnlyWorker ? dirname(statusFile) : repoPath;
  const codexSandboxMode = readOnlyWorker ? 'workspace-write' : (sandboxMode || 'workspace-write');
  const codexRepoCheckFlag = readOnlyWorker || skipGitRepoCheck ? ' --skip-git-repo-check' : '';
  const codexModelFlag = codexModel ? ' -m "$CODEX_MODEL"' : '';
  const codexArgs = `exec -C "$CODEX_WORKDIR"${codexModelFlag} -s "$CODEX_SANDBOX_MODE" -o "$RESPONSE_FILE"${codexRepoCheckFlag} -`;
  return [
    '#!/bin/bash',
    'set -u',
    `TARGET_REPO_PATH=${shellQuote(repoPath)}`,
    `CODEX_WORKDIR=${shellQuote(codexWorkDir)}`,
    `PROMPT_FILE=${shellQuote(promptFile)}`,
	    `RESPONSE_FILE=${shellQuote(responseFile)}`,
	    `LOG_FILE=${shellQuote(logFile)}`,
	    `STATUS_FILE=${shellQuote(statusFile)}`,
	    `STOP_FILE=${shellQuote(stopFile)}`,
	    `CODEX_BIN=${shellQuote(codexExecutable || 'codex')}`,
	    `CODEX_MODEL=${shellQuote(codexModel || '')}`,
	    `REQUESTED_SANDBOX_MODE=${shellQuote(sandboxMode || 'read-only')}`,
	    `CODEX_SANDBOX_MODE=${shellQuote(codexSandboxMode)}`,
    'cd "$CODEX_WORKDIR"',
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
    `echo "[odt] Delegating ${workerRole.label} to Codex (supervised ODT worker session)." | tee -a "$LOG_FILE"`,
    'echo "[odt] Target repo: $TARGET_REPO_PATH" | tee -a "$LOG_FILE"',
    'echo "[odt] Codex workdir: $CODEX_WORKDIR" | tee -a "$LOG_FILE"',
    'echo "[odt] Requested sandbox: $REQUESTED_SANDBOX_MODE" | tee -a "$LOG_FILE"',
    'echo "[odt] Codex sandbox: $CODEX_SANDBOX_MODE" | tee -a "$LOG_FILE"',
    'if [ -n "$CODEX_MODEL" ]; then echo "[odt] Codex model: $CODEX_MODEL" | tee -a "$LOG_FILE"; fi',
    'echo "[odt] Prompt: $PROMPT_FILE" | tee -a "$LOG_FILE"',
    'echo "[odt] Response: $RESPONSE_FILE" | tee -a "$LOG_FILE"',
    'echo "" | tee -a "$LOG_FILE"',
    'if [ -s "$HOME/.nvm/nvm.sh" ]; then',
    '  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"',
    '  . "$NVM_DIR/nvm.sh"',
    'fi',
    'ODT_CLEAN_SHELL_DIR="$(dirname "$STATUS_FILE")/clean-shell-startup"',
    'mkdir -p "$ODT_CLEAN_SHELL_DIR"',
    ': > "$ODT_CLEAN_SHELL_DIR/.zshenv"',
    ': > "$ODT_CLEAN_SHELL_DIR/.zshrc"',
    ': > "$ODT_CLEAN_SHELL_DIR/.zprofile"',
    ': > "$ODT_CLEAN_SHELL_DIR/.bashrc"',
    'export ZDOTDIR="$ODT_CLEAN_SHELL_DIR"',
    'export BASH_ENV=/dev/null',
    'export ENV=/dev/null',
    'export SHELL=/bin/bash',
    'export ODT_WORKER_CLEAN_SHELL=1',
    'echo "[odt] Worker shell startup: clean ODT shell profile active." | tee -a "$LOG_FILE"',
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

function buildWorkerConsoleScript({ workerRole, logFile, responseFile, statusFile }) {
  return [
    '#!/bin/bash',
    'set -u',
    `LOG_FILE=${shellQuote(logFile)}`,
    `RESPONSE_FILE=${shellQuote(responseFile)}`,
    `STATUS_FILE=${shellQuote(statusFile)}`,
    `echo "ODT ${workerRole.label} worker console"`,
    'echo "Log file: $LOG_FILE"',
    'echo "Response file: $RESPONSE_FILE"',
    'echo "Status file: $STATUS_FILE"',
    'echo ""',
    'echo "This Terminal follows the ODT worker log. Close this window only if you do not need the live tail."',
    'echo ""',
    'while [ ! -f "$LOG_FILE" ]; do sleep 1; done',
    'tail -n +1 -f "$LOG_FILE"',
    ''
  ].join('\n');
}

function openVisibleTerminal(scriptFile, runDir) {
  if (process.platform !== 'darwin') {
    throw new Error('Visible terminal launch is currently implemented for macOS Terminal.');
  }
  const terminalPath = terminalAppPath();
  const openAttempts = [
    {
      label: 'open command file',
      args: [scriptFile],
      command: `/usr/bin/open ${shellQuote(scriptFile)}`
    },
    terminalPath ? {
      label: 'open with Terminal.app path',
      args: ['-a', terminalPath, scriptFile],
      command: `/usr/bin/open -a ${shellQuote(terminalPath)} ${shellQuote(scriptFile)}`
    } : null,
    {
      label: 'open with Terminal.app name',
      args: ['-a', 'Terminal.app', scriptFile],
      command: `/usr/bin/open -a Terminal.app ${shellQuote(scriptFile)}`
    }
  ].filter(Boolean);
  const openErrors = [];
  for (const attempt of openAttempts) {
    const result = spawnSync('/usr/bin/open', attempt.args, {
      cwd: runDir,
      env: process.env,
      encoding: 'utf8',
      timeout: 10000
    });
    if (!result.error && result.status === 0) {
      return {
        launcher: 'open',
        terminalApp: terminalPath || 'Terminal.app',
        command: attempt.command,
        stdout: String(result.stdout || '').trim(),
        stderr: String(result.stderr || '').trim()
      };
    }
    const detail = result.error?.message || String(result.stderr || result.stdout || '').trim() || `exit ${result.status}`;
    openErrors.push(`${attempt.label}: ${detail}`);
  }

  const command = `bash ${shellQuote(scriptFile)}`;
  const script = [
    terminalPath
      ? `tell application ${applescriptStringLiteral(terminalPath)}`
      : 'tell application id "com.apple.Terminal"',
    'activate',
    `do script ${applescriptStringLiteral(command)}`,
    'end tell'
  ].join('\n');
  const osascriptResult = spawnSync('/usr/bin/osascript', ['-e', script], {
    cwd: runDir,
    env: process.env,
    encoding: 'utf8',
    timeout: 10000
  });
  if (!osascriptResult.error && osascriptResult.status === 0) {
    return {
      launcher: 'osascript',
      terminalApp: 'Terminal',
      command,
      stdout: String(osascriptResult.stdout || '').trim(),
      stderr: String(osascriptResult.stderr || '').trim()
    };
  }

  const osascriptError = osascriptResult.error?.message || String(osascriptResult.stderr || osascriptResult.stdout || '').trim();
  throw new Error(`Unable to open Terminal worker. ${openErrors.join('; ')}; osascript: ${osascriptError || `exit ${osascriptResult.status}`}`);
}

function launchBackgroundWorker(scriptFile, runDir) {
  const child = spawn('/bin/bash', [scriptFile], {
    cwd: runDir,
    env: process.env,
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  return {
    launcher: 'background',
    pid: child.pid,
    command: `/bin/bash ${shellQuote(scriptFile)}`
  };
}

async function launchCodexWorker({ assignmentId = 'assignment-local-mvp', executionAgent, workerRole = 'lead-planner', launchMode = 'terminal', notes = '' } = {}) {
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
  const codexWorkerModel = getCodexWorkerModel();
  if (executionHealth.status !== 'healthy') {
    createAgentEvent(assignmentId, selectedAgent, 'execution_health_failed', 'error', executionHealth);
    const error = new Error(executionHealth.message);
    error.statusCode = 409;
    error.executionHealth = executionHealth;
    throw error;
  }

  const delegation = await prepareAgentDelegation({
    assignmentId,
    executionAgent: selectedAgent,
    requireWriteApproved: role.requiresWriteApproval,
    workerRoleId: role.id,
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
  const scriptFile = join(runDir, 'launch-codex.command');
  const consoleFile = join(runDir, 'worker-console.command');
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
  writeFileSync(scriptFile, buildCodexLaunchScript({ repoPath, promptFile, responseFile, logFile, statusFile, stopFile, codexExecutable: executionHealth.executable, codexModel: codexWorkerModel.model, skipGitRepoCheck, sandboxMode: role.sandboxMode, workerRole: role }), 'utf8');
  writeFileSync(consoleFile, buildWorkerConsoleScript({ workerRole: role, logFile, responseFile, statusFile }), 'utf8');
  chmodSync(scriptFile, 0o755);
  chmodSync(consoleFile, 0o755);
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
    codexModel: codexWorkerModel.model,
    codexModelSource: codexWorkerModel.source,
    projectContractId: roleContract.projectContract?.id || '',
    projectReadinessStatus: roleContract.projectReadiness?.status || 'missing',
    projectReadinessScore: roleContract.projectReadiness?.score ?? null,
    bundleDir: runDir,
    handoffFile,
    promptFile,
    scriptFile,
    consoleFile,
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
    codexModel: codexWorkerModel.model,
    codexModelSource: codexWorkerModel.source,
    projectContractId: roleContract.projectContract?.id || '',
    projectReadinessStatus: roleContract.projectReadiness?.status || 'missing',
    projectReadinessScore: roleContract.projectReadiness?.score ?? null,
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
    const backgroundLaunch = launchBackgroundWorker(scriptFile, runDir);
    let terminalConsole = null;
    let terminalConsoleError = '';
    try {
      terminalConsole = openVisibleTerminal(consoleFile, runDir);
    } catch (consoleError) {
      terminalConsoleError = consoleError.message;
    }
    const launchedStatus = {
      ...baseStatus,
      status: 'running',
      launcher: backgroundLaunch.launcher,
      backgroundPid: backgroundLaunch.pid,
      launcherCommand: backgroundLaunch.command,
      terminalConsole,
      terminalConsoleError,
      updatedAt: new Date().toISOString(),
      note: terminalConsole
        ? `Started a supervised Codex ${role.label} worker and opened a visible Terminal log console.`
        : `Started a supervised Codex ${role.label} worker. Terminal log console could not open, but Agent Team live log remains available.`
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
    createRunEvent(delegation.runId, terminalConsole ? 'agent_worker_terminal_launched' : 'agent_worker_background_launched', 'running', launchedStatus, assignmentId);
    createAgentEvent(assignmentId, selectedAgent, 'worker_launch_prepared', 'running', launchedStatus);
    return { status: terminalConsole ? 'launched' : 'launched_background', launch: launchedStatus, workerRun, delegation };
  } catch (terminalError) {
    try {
      const backgroundLaunch = launchBackgroundWorker(scriptFile, runDir);
      const backgroundStatus = {
        ...baseStatus,
        status: 'running',
        launchMode: 'background',
        launcher: backgroundLaunch.launcher,
        backgroundPid: backgroundLaunch.pid,
        launcherCommand: backgroundLaunch.command,
        terminalLaunchError: terminalError.message,
        updatedAt: new Date().toISOString(),
        note: `Terminal launch was blocked, so ODT started a background Codex ${role.label} worker. Use Agent Team live log and Stop Worker controls.`
      };
      writeFileSync(statusFile, `${JSON.stringify(backgroundStatus, null, 2)}\n`, 'utf8');
      const workerRun = upsertAgentWorkerRunRecord({
        id: workerRunId,
        assignmentId,
        runId: delegation.runId,
        role,
        executionAgent: selectedAgent,
        mode: roleContract.mode,
        sandboxMode: role.sandboxMode,
        status: 'running',
        launchMode: 'background',
        bundlePaths: { ...bundlePaths, bundleDir: runDir },
        manualCommand,
        output: { summary: backgroundStatus.note, terminalLaunchError: terminalError.message, stopFile },
        questions: []
      });
      createRunEvent(delegation.runId, 'agent_worker_background_launched', 'running', backgroundStatus, assignmentId);
      createAgentEvent(assignmentId, selectedAgent, 'worker_launch_prepared', 'running', backgroundStatus);
      return { status: 'launched_background', launch: backgroundStatus, workerRun, delegation };
    } catch (backgroundError) {
      const fallbackStatus = {
        ...baseStatus,
        status: 'manual_fallback',
        error: backgroundError.message,
        terminalLaunchError: terminalError.message,
        manualFallback: true,
        updatedAt: new Date().toISOString(),
        note: 'Terminal and background launch both failed. Use the manual command from ODT to start the Codex worker.'
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
        output: { summary: fallbackStatus.note, error: backgroundError.message, terminalLaunchError: terminalError.message, stopFile },
        questions: []
      });
      createRunEvent(delegation.runId, 'agent_worker_manual_fallback', 'warning', fallbackStatus, assignmentId);
      createAgentEvent(assignmentId, selectedAgent, 'worker_launch_prepared', 'warning', fallbackStatus);
      return { status: 'manual_fallback', launch: fallbackStatus, workerRun, delegation };
    }
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
  const entries = agentFoundryRunRepository.listByAssignment(assignmentId);
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
    agentFoundryRunRepository.createRunEntry({
      id: createId('foundry'),
      runId,
      assignmentId,
      phase: phaseConfig.id,
      domainId: domain.id,
      domainLabel: domain.label,
      inputSources: normalizedInputSources,
      output,
      status: output.status,
      provider: aiConfig.provider,
      model,
      createdAt: now
    });
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

function assetRoleForType(fileType, ext = '') {
  if (fileType === 'mockup-image') return 'Visual requirement, screenshot, UI state, or mockup reference.';
  if (fileType === 'pdf') return 'Requirement, design, compliance, API, or business process document.';
  if (fileType === 'document') return 'Requirement, design, acceptance criteria, or stakeholder notes document.';
  if (fileType === 'spreadsheet') return ext === '.csv'
    ? 'Structured data, mapping table, acceptance examples, or API/test matrix.'
    : 'Workbook with structured requirements, mappings, test cases, or business rules.';
  if (fileType === 'api-sample') return 'API contract, request/response sample, schema, configuration, or integration notes.';
  if (fileType === 'notes') return 'Plain-text requirement notes, Markdown brief, logs, or implementation context.';
  if (fileType === 'presentation') return 'Presentation deck with design, process, or stakeholder context.';
  return 'General project context file.';
}

function guidanceForAsset(fileType, ext = '') {
  if (fileType === 'mockup-image') {
    return 'Use as visual reference for layout, states, labels, accessibility, and UX acceptance. Optional vision/OCR enrichment can describe UI details when configured.';
  }
  if (fileType === 'pdf' || fileType === 'document' || fileType === 'presentation') {
    return 'Use as supporting requirement/design context. Optional document parser or model enrichment can extract text and summarize decisions when configured.';
  }
  if (fileType === 'spreadsheet') {
    return ext === '.csv'
      ? 'Use extracted CSV preview for mappings, examples, and test cases. Validate column meanings before implementation.'
      : 'Use as supporting workbook context. Optional spreadsheet parser can extract sheets/tables when configured.';
  }
  if (fileType === 'api-sample') {
    return 'Use extracted content for endpoint, payload, schema, validation, and integration planning.';
  }
  if (fileType === 'notes') {
    return 'Use extracted text directly in planning, standards review, and worker handoff.';
  }
  return 'Use as supporting context and inspect manually if needed.';
}

function textExtractionForAsset(fileType, ext, bytes) {
  const textCapable = fileType === 'notes' || fileType === 'api-sample' || ext === '.csv';
  if (!textCapable) {
    const parserKind = fileType === 'mockup-image'
      ? 'vision_or_ocr'
      : ['pdf', 'document', 'spreadsheet', 'presentation'].includes(fileType)
        ? 'document_parser'
        : 'manual_review';
    return {
      status: 'not_extracted',
      method: parserKind,
      excerpt: '',
      note: fileType === 'mockup-image'
        ? 'Image stored as evidence. Optional vision/OCR enrichment can run later with fallback to manual review.'
        : 'Binary or packaged document stored as evidence. Optional parser/model enrichment can run later with fallback to manual review.'
    };
  }

  const raw = bytes.toString('utf8').replace(/\u0000/g, '').trim();
  const excerpt = truncateForApi(raw, 6000);
  const analysis = {
    status: raw ? 'extracted' : 'empty',
    method: 'local_utf8_excerpt',
    excerpt,
    charCount: raw.length,
    lineCount: raw ? raw.split(/\r?\n/).length : 0,
    note: raw
      ? 'Text excerpt extracted locally without AI.'
      : 'File was text-capable, but no readable text was found.'
  };
  if (ext === '.csv') {
    const lines = raw.split(/\r?\n/).filter(Boolean);
    analysis.method = 'local_csv_excerpt';
    analysis.previewRows = lines.slice(0, 8);
    analysis.detectedColumns = lines[0]?.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 30) || [];
  }
  if (['.json', '.yaml', '.yml'].includes(ext)) {
    analysis.method = ext === '.json' ? 'local_json_excerpt' : 'local_yaml_excerpt';
    if (ext === '.json') {
      try {
        const parsed = JSON.parse(raw);
        analysis.topLevelKeys = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? Object.keys(parsed).slice(0, 30)
          : [];
      } catch {
        analysis.parseWarning = 'JSON parse failed; stored excerpt is still available for manual/agent review.';
      }
    }
  }
  return analysis;
}

function analyzeIntakeAsset({ id, assignmentId, name, storedPath, mimeType = '', fileType, bytes }) {
  const ext = fileExtension(name);
  const checksumSha256 = createHash('sha256').update(bytes).digest('hex');
  const localExtraction = textExtractionForAsset(fileType, ext, bytes);
  const aiRecommended = ['mockup-image', 'pdf', 'document', 'spreadsheet', 'presentation'].includes(fileType);
  const analysis = {
    version: 'asset-analysis-1.0',
    id,
    assignmentId,
    originalName: name,
    storedPath,
    extension: ext,
    mimeType,
    fileType,
    bytes: bytes.length,
    checksumSha256,
    role: assetRoleForType(fileType, ext),
    guidance: guidanceForAsset(fileType, ext),
    localExtraction,
    aiEnrichment: {
      status: aiRecommended ? 'optional_not_run' : 'not_required',
      recommended: aiRecommended,
      adapter: fileType === 'mockup-image' ? 'vision-or-ocr-provider' : 'document-or-spreadsheet-parser',
      fallback: 'Stored file metadata and local excerpts remain available even when model/parser enrichment is offline.',
      runPolicy: 'Explicit governed enrichment action; upload does not call external models automatically.'
    },
    agentUse: {
      includeInHandoff: true,
      includeExcerpt: Boolean(localExtraction.excerpt),
      instruction: guidanceForAsset(fileType, ext)
    },
    governance: {
      copiedToOdtWorkspace: true,
      targetRepoModified: false,
      sensitiveReviewRecommended: bytes.length > 5 * 1024 * 1024 || ['pdf', 'document', 'spreadsheet', 'presentation'].includes(fileType),
      dependencyRequiredForDeeperParsing: aiRecommended && fileType !== 'mockup-image'
    },
    createdAt: new Date().toISOString()
  };
  return analysis;
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
    const analysis = analyzeIntakeAsset({
      id,
      assignmentId,
      name: file.name,
      storedPath,
      mimeType: file.mimeType || '',
      fileType,
      bytes
    });
    const asset = intakeAssetRepository.createAsset({
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
      analysis,
      createdAt: now
    });
    return asset;
  });
  createRunEvent(createId('run'), 'intake_assets_stored', 'ok', {
    assignmentId,
    files: stored.length,
    totalBytes,
    analyzed: stored.length,
    aiEnrichmentPending: stored.filter((asset) => asset.analysisJson?.aiEnrichment?.recommended).length
  }, assignmentId);
  return {
    assignmentId,
    stored,
    uploadPolicy,
    workspacePath: assetDir,
    note: 'Files are copied into the ODT workbench workspace. The target repo is not modified by intake uploads.'
  };
}

function enrichIntakeAsset({ assetId, assignmentId = 'assignment-local-mvp', provider = aiConfig.provider } = {}) {
  const asset = intakeAssetRepository.getById(assetId);
  if (!asset || asset.assignmentId !== assignmentId) {
    const error = new Error('Intake asset not found for this assignment.');
    error.statusCode = 404;
    throw error;
  }
  const analysis = asset.analysisJson || {};
  const localExtraction = analysis.localExtraction || {};
  const recommended = Boolean(analysis.aiEnrichment?.recommended);
  const providerConfigured = provider !== 'local' && (aiConfig.chatModelConfigured || aiConfig.agentEndpointConfigured || aiConfig.genAiEndpointConfigured);
  const status = localExtraction.status === 'extracted'
    ? 'LOCAL_EXTRACTION_AVAILABLE'
    : recommended && providerConfigured
      ? 'MODEL_ENRICHMENT_READY'
      : recommended
        ? 'FALLBACK_LOCAL_METADATA'
        : 'NO_MODEL_REQUIRED';
  const result = {
    assetId,
    assignmentId,
    status,
    provider,
    originalName: asset.originalName,
    fileType: asset.fileType,
    role: analysis.role || assetRoleForType(asset.fileType, fileExtension(asset.originalName)),
    localExtraction,
    aiEnrichment: {
      ...(analysis.aiEnrichment || {}),
      providerConfigured,
      fallbackUsed: !providerConfigured || localExtraction.status === 'extracted',
      message: providerConfigured
        ? 'A future provider adapter can enrich this asset explicitly. Upload/storage did not call external AI automatically.'
        : 'No model/parser provider is configured for this asset type. ODT will use local metadata, stored file path, local excerpts, and manual review.'
    },
    nextAction: localExtraction.status === 'extracted'
      ? 'Use the local excerpt in planning and worker handoff.'
      : recommended
        ? 'Review the stored file manually or configure an approved vision/document parser adapter for deeper enrichment.'
        : 'Use the stored metadata and file path as context.'
  };
  createRunEvent(createId('run'), 'intake_asset_enrichment_checked', status === 'MODEL_ENRICHMENT_READY' ? 'ok' : 'warning', {
    assignmentId,
    assetId,
    fileType: asset.fileType,
    status,
    provider,
    providerConfigured
  }, assignmentId);
  return result;
}

function preparePrReadinessReport({ assignmentId, linkedJira = '', notes = '' }) {
  const evidence = collectEvidence(assignmentId);
  const currentEvidence = scopedCurrentEvidence(evidence);
  const jiraVerificationProfile = deriveJiraVerificationProfile(evidence);
  const effectiveLinkedJira = String(linkedJira || jiraVerificationProfile?.issueKey || '').trim();
  const workKey = normalizeJiraIssueKey(effectiveLinkedJira || evidence.requirements?.[0]?.rawText || evidence.assignment?.title || '') || assignmentId;
  const generatedAt = new Date().toISOString();
  const packId = createPrPackId({ generatedAt, linkedJira: workKey, assignmentId });
  const latestCheck = currentEvidence.standardsChecks[0];
  const unresolvedBlockers = getUnresolvedStandardsBlockers(currentEvidence);
  const openReviewBlockers = getOpenReviewBlockers(currentEvidence);
  const pendingDependencies = currentEvidence.dependencyRequests.filter((request) => request.status === 'pending');
  const latestImplementationEvidence = currentEvidence.implementationEvidence?.[0] || null;
  const reviewCycleCloseout = deriveReviewCycleCloseout(currentEvidence);
  const allTests = getActiveImplementationTests(currentEvidence);
  const allCommands = getActiveImplementationCommands(currentEvidence);
  const workerRuns = currentEvidence.agentWorkerRuns || [];
  const reviewableReviewerRuns = workerRuns.filter((run) => run.workerRole === 'reviewer' && workerHasReviewableOutput(run));
  const reviewableBuildVerifierRuns = workerRuns.filter((run) => run.workerRole === 'build-verifier' && workerHasReviewableOutput(run));
  const passedTests = allTests.filter((test) => String(test.status || '').toLowerCase() === 'passed');
  const failedTests = allTests.filter((test) => test.status === 'failed');
  const incompleteTests = allTests.filter((test) => ['not_run', 'unknown', ''].includes(String(test.status || '').toLowerCase()));
  const acceptedImplementationRisk = (currentEvidence.reviewComments || []).some((comment) => (
    comment.status === 'accepted_risk'
    && ['implementation', 'pr'].includes(comment.targetType)
  ));
  const acceptedVerificationRisk = (currentEvidence.reviewComments || []).some((comment) => (
    comment.status === 'accepted_risk'
    && ['review', 'implementation', 'pr'].includes(comment.targetType)
  ));
  const latestEvidenceText = [
    latestImplementationEvidence?.summary || '',
    ...(latestImplementationEvidence?.commands || []),
    ...(latestImplementationEvidence?.tests || []).map((test) => `${test.name || ''} ${test.command || ''} ${test.status || ''} ${test.notes || ''}`)
  ].join(' ').toLowerCase();
  const manualReviewerEvidence = Boolean(latestImplementationEvidence && /(reviewer|human review|reviewed jira|review evidence|risk review)/i.test(latestEvidenceText));
  const completedJiraReviewerReady = !jiraVerificationProfile || reviewableReviewerRuns.length > 0 || manualReviewerEvidence;
  const completedJiraBuildReady = !jiraVerificationProfile || passedTests.length > 0 || reviewableBuildVerifierRuns.length > 0;
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
      message: jiraVerificationProfile
        ? 'No completed-Jira verification evidence has been recorded.'
        : 'No implementation evidence has been recorded.',
      requiredAction: jiraVerificationProfile
        ? 'Launch Reviewer, capture build/test verification evidence, or accept the missing evidence as reviewed risk before PR readiness.'
        : 'Record changed files, commands, tests, and implementation notes after agent work.'
    }] : []),
    ...(jiraVerificationProfile && latestImplementationEvidence && !completedJiraReviewerReady && !acceptedVerificationRisk ? [{
      category: 'reviewer-verification',
      message: 'Completed-Jira PR readiness has no ingested Reviewer output or reviewer-specific evidence.',
      requiredAction: 'Launch/ingest Reviewer output, record reviewer proof in Review, or accept the missing reviewer evidence as risk.'
    }] : []),
    ...(jiraVerificationProfile && latestImplementationEvidence && !completedJiraBuildReady && !acceptedVerificationRisk ? [{
      category: 'build-test-verification',
      message: 'Completed-Jira PR readiness has no passed build/test verification or ingested Build Verifier output.',
      requiredAction: 'Record passed test/build evidence, ingest Build Verifier output, or accept the missing build/test evidence as risk.'
    }] : []),
    ...(failedTests.length && !acceptedImplementationRisk ? [{
      category: 'testing',
      message: `${failedTests.length} failed test result(s) are recorded without accepted risk.`,
      requiredAction: 'Fix failed tests or accept risk with explicit review notes.'
    }] : []),
    ...(incompleteTests.length && !acceptedVerificationRisk ? [{
      category: 'testing',
      message: `${incompleteTests.length} test result(s) are not run or have unknown status.`,
      requiredAction: 'Run the tests, replace pending evidence with passed/failed output, or accept risk with explicit review notes.'
    }] : []),
    ...(reviewCycleCloseout.requiresCloseout && !reviewCycleCloseout.readyForPrPack ? [{
      category: 'review-cycle',
      message: reviewCycleCloseout.label,
      requiredAction: reviewCycleCloseout.nextAction?.detail || 'Complete rework evidence, reviewer rerun, and build-verifier rerun before PR readiness.'
    }] : [])
  ];
  const readinessChecklist = [
    { label: 'Requirement and scope reviewed', checked: Boolean(evidence.requirements?.length || evidence.assignment?.requirement) },
    { label: 'Repo analysis attached', checked: Boolean(evidence.repoAnalysis?.length) },
    { label: 'Technical design prepared', checked: Boolean(evidence.technicalDesigns?.length) },
    { label: 'Implementation plan prepared', checked: Boolean(evidence.implementationPlans?.length) },
    { label: 'Standards check completed', checked: Boolean(latestCheck) },
    { label: jiraVerificationProfile ? 'Completed Jira verification evidence recorded' : 'Implementation evidence recorded', checked: Boolean(latestImplementationEvidence) },
    ...(jiraVerificationProfile ? [
      { label: 'Reviewer verification captured', checked: Boolean(completedJiraReviewerReady || acceptedVerificationRisk) },
      { label: 'Build/test verification passed or accepted', checked: Boolean(completedJiraBuildReady || acceptedVerificationRisk) }
    ] : []),
    { label: 'Commands and test outcomes recorded', checked: Boolean(passedTests.length || reviewableBuildVerifierRuns.length || (acceptedVerificationRisk && (allTests.length || allCommands.length))) },
    { label: 'No unresolved standards blockers', checked: !unresolvedBlockers.length },
    { label: 'No open review blockers', checked: !openReviewBlockers.length },
    { label: 'Dependency decisions resolved', checked: !pendingDependencies.length },
    { label: 'Failed/incomplete tests fixed or accepted as risk', checked: !(failedTests.length || incompleteTests.length) || acceptedVerificationRisk || acceptedImplementationRisk },
    ...(reviewCycleCloseout.requiresCloseout ? reviewCycleCloseout.steps.map((step) => ({
      label: step.label,
      checked: step.status === 'complete' || (step.id === 'pr-ready-pack' && reviewCycleCloseout.readyForPrPack)
    })) : []),
    { label: 'Accessibility/security/testing notes included', checked: Boolean(latestCheck && latestImplementationEvidence) }
  ];
  const evidenceSummary = {
    requirements: evidence.requirements?.length || 0,
    repoAnalyses: currentEvidence.repoAnalysis?.length || 0,
    technicalDesigns: currentEvidence.technicalDesigns?.length || 0,
    implementationPlans: currentEvidence.implementationPlans?.length || 0,
    standardsChecks: currentEvidence.standardsChecks?.length || 0,
    implementationEvidence: currentEvidence.implementationEvidence?.length || 0,
    reviewComments: currentEvidence.reviewComments?.length || 0,
    reviewCycleStatus: reviewCycleCloseout.status,
    approvals: currentEvidence.approvals?.length || 0,
    dependencyRequests: currentEvidence.dependencyRequests?.length || 0,
    testResults: allTests.length,
    passedTests: passedTests.length,
    reviewerOutputs: reviewableReviewerRuns.length,
    buildVerifierOutputs: reviewableBuildVerifierRuns.length
  };
  const report = {
    id: packId,
    packId,
    artifactId: packId,
    artifactType: 'pr-readiness-pack',
    assignmentId,
    workKey,
    title: `PR Readiness Pack: ${evidence.assignment?.title || assignmentId}`,
    prTitle: `${effectiveLinkedJira ? `${effectiveLinkedJira}: ` : ''}${evidence.assignment?.title || 'ODT governed implementation'}`,
    linkedJira: effectiveLinkedJira,
    summary: jiraVerificationProfile
      ? `Prepared governed verification evidence for completed Jira work ${jiraVerificationProfile.issueKey}.`
      : 'Prepared governed evidence for requirement, repo analysis, standards review, implementation evidence, approvals, dependency decisions, tests, risks, and rollback.',
    status: blockingItems.length ? 'BLOCKED' : 'PR_READY_REVIEW',
    standardsStatus: latestCheck?.status || 'NOT_RUN',
    blockingItems,
    readinessChecklist,
    evidenceSummary,
    acceptanceMapping: [
      'Requirement analysis captured or ready for review.',
      'Standards review evidence is attached.',
      latestImplementationEvidence
        ? jiraVerificationProfile
          ? 'Verification evidence records reviewer/build/test proof for completed Jira work.'
          : 'Implementation evidence records changed files, commands, and test outcomes.'
        : jiraVerificationProfile
          ? 'Completed Jira verification evidence is required before PR readiness.'
          : 'Implementation evidence is required before PR readiness.',
      'Approval/dependency decisions are auditable.',
      'Testing and accessibility notes are included or flagged.'
    ],
    jiraVerification: jiraVerificationProfile,
    implementationEvidence: latestImplementationEvidence ? {
      id: latestImplementationEvidence.id,
      status: latestImplementationEvidence.status,
      summary: latestImplementationEvidence.summary,
      changedFiles: latestImplementationEvidence.changedFiles || [],
      commands: latestImplementationEvidence.commands || [],
      tests: latestImplementationEvidence.tests || []
    } : null,
    reviewCycleCloseout,
    testing: {
      planned: currentEvidence.testPlans[0]?.planJson || {},
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
    generatedAt
  };
  report.markdown = buildPrMarkdown(report);
  prReadinessReportRepository.createReport({
    id: packId,
    assignmentId,
    title: report.title,
    report,
    status: report.status,
    createdAt: generatedAt
  });
  createRunEvent(createId('run'), 'pr_readiness_pack_prepared', report.status === 'BLOCKED' ? 'blocked' : 'ok', {
    assignmentId,
    packId,
    workKey,
    status: report.status,
    blockingItems: blockingItems.length,
    checklistReady: readinessChecklist.filter((item) => item.checked).length,
    checklistTotal: readinessChecklist.length
  }, assignmentId);
  persistAiWorkAuditPackSnapshot({
    assignmentId,
    stage: 'pr-readiness-pack',
    status: report.status,
    generatedAt
  });
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
  if (asset.analysisJson?.localExtraction?.excerpt) {
    return asset.analysisJson.localExtraction.excerpt;
  }
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
    ['ODT Platform Handbook', join(appRoot, 'docs', 'ODT-Platform-Handbook.md')],
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
      role: asset.analysisJson?.role || '',
      guidance: asset.analysisJson?.guidance || '',
      localExtractionStatus: asset.analysisJson?.localExtraction?.status || 'not_analyzed',
      aiEnrichment: asset.analysisJson?.aiEnrichment || {},
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

function guideTitleCase(value = '') {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function guideShortId(value = '') {
  const text = String(value || '');
  if (!text) return '';
  const parts = text.split('_');
  return parts.length > 1 ? parts.slice(-2).join('_') : text.slice(0, 12);
}

function guideList(items = [], fallback = 'None captured.', limit = 6) {
  const values = (items || []).filter(Boolean).slice(0, limit);
  if (!values.length) return `- ${fallback}`;
  return values.map((item) => `- ${String(item)}`).join('\n');
}

function guideSourceList(sources = []) {
  const metadata = guideSourceMetadata(sources, 4);
  return metadata.length
    ? metadata.map((source, index) => `${index + 1}. ${source.title} (${source.type}, ${source.id})`).join('\n')
    : '1. Local ODT baseline workflow';
}

function guideSourcePath(value = '') {
  const text = String(value || '');
  if (!text) return 'local';
  return text.startsWith(appRoot) ? text.slice(appRoot.length + 1) : text;
}

function guideSourceMetadata(sources = [], limit = 6) {
  return (sources || []).slice(0, limit).map((source) => {
    const safeSource = guideSourcePath(source.source || source.title || 'local');
    const chunk = source.chunk ? `#${source.chunk}` : '';
    return {
      id: `${guideShortId(source.type || 'source')}:${guideShortId(safeSource)}${chunk}`,
      title: source.title || safeSource || 'ODT source',
      type: source.type || 'evidence',
      source: safeSource,
      chunk: source.chunk || null,
      score: Number(source.score || 0)
    };
  });
}

const platformPageGuides = [
  {
    title: 'Overview',
    aliases: ['overview', 'home page', 'dashboard'],
    what: 'Shows the active work item, workflow stage, standards health, next best action, active work queue, and PR readiness signals.',
    when: 'Use it when you want a fast answer to “where are we and what should I do next?”',
    evidence: 'It summarizes saved assignment, workflow, standards, worker, review, and PR evidence.',
    safety: 'It is read-only and should guide navigation rather than mutate work.',
    next: 'Click the recommended action, or open Intake/Planner/Standards based on the visible gate.'
  },
  {
    title: 'Intake',
    aliases: ['intake', 'new intake', 'repo intake', 'repository intake', 'folder selection', 'choose folder', 'upload'],
    what: 'Captures the requirement, Jira text, repo/folder context, branch, and supporting files such as screenshots, mockups, PDFs, DOCX, XLSX, CSV, JSON, YAML, Markdown, or text.',
    when: 'Use it at the start of a task or whenever missing context must be added.',
    evidence: 'Creates requirement analysis, repo analysis, clarification questions, and intake asset evidence.',
    safety: 'Browser folder selection is read-only. Backend path scanning and worker launch need an explicit pasted path.',
    next: 'Analyze the repo read-only, extract requirement structure, then move to Planner.'
  },
  {
    title: 'Planner',
    aliases: ['planner', 'plan page', 'technical design', 'implementation plan'],
    what: 'Shows the technical design, implementation plan, impacted files, open questions, test approach, and approval context.',
    when: 'Use it before any write-approved worker is launched.',
    evidence: 'Creates or displays design and plan evidence that Standards and Agent Team consume.',
    safety: 'Planning remains read-only until the user explicitly approves write scope.',
    next: 'Run Standards after the design and plan are specific enough to review.'
  },
  {
    title: 'Standards',
    aliases: ['standards page', 'standards', 'governance page', 'standards gate', 'governance gate'],
    what: 'Reviews UX, accessibility, WCAG/VPAT/Section 508, security, dependency, testing, maintainability, performance, and PR readiness expectations.',
    when: 'Use it before delegation and again after implementation evidence is captured.',
    evidence: 'Creates standards checks and findings with PASS, WARNING, BLOCKER, NEEDS_REVIEW, or APPROVAL_REQUIRED statuses.',
    safety: 'Warnings need human approval, blockers need resolution or controlled override, and dependency installs stay on a separate approval path.',
    next: 'Resolve findings, approve allowed warnings, or block implementation until the plan is improved.'
  },
  {
    title: 'Agent Team',
    aliases: ['agent team', 'workers', 'worker queue', 'codex', 'cline'],
    what: 'Selects the execution engine and worker lane, prepares handoff bundles, launches supported Codex terminal workers, and records worker logs/output.',
    when: 'Use it after planning, standards review, and approval gates are complete.',
    evidence: 'Creates worker runs, prompts, handoff files, logs, responses, relay questions, reviewer findings, and implementation evidence.',
    safety: 'Read-only workers can run earlier; write workers require explicit write approval and healthy adapter status.',
    next: 'Choose a lane, launch or prepare handoff, ingest output, then record evidence.'
  },
  {
    title: 'Review',
    aliases: ['review', 'review queue', 'review closeout', 'comments'],
    what: 'Captures human review comments, blocker decisions, accepted risks, rework routing, and implementation closeout.',
    when: 'Use it after worker output or when a blocker/warning needs a human decision.',
    evidence: 'Creates review comments, rework relay items, accepted-risk notes, and review-cycle closeout evidence.',
    safety: 'Accept Risk should be used only when the impact is understood and documented.',
    next: 'Resolve comments, accept risk with notes, or launch a rework worker.'
  },
  {
    title: 'PR Ready',
    aliases: ['pr ready', 'pr readiness', 'pull request', 'pr pack', 'pr markdown'],
    what: 'Generates the PR package with summary, changed files, tests, accessibility notes, security notes, dependency notes, risks, rollback plan, and reviewer notes.',
    when: 'Use it after implementation evidence, review, and verification are complete.',
    evidence: 'Creates the PR readiness report and copyable PR markdown.',
    safety: 'It should not mark work ready when blockers, failed tests, missing evidence, or pending dependencies remain.',
    next: 'Review the markdown, inspect blockers/checklist, then copy the PR markdown when clean.'
  },
  {
    title: 'Artifacts',
    aliases: ['artifacts', 'evidence', 'context vault', 'saved evidence'],
    what: 'Displays the saved evidence catalog for design, plans, OpenAPI, runs, reviews, worker relay, Agent Foundry, uploads, and PR readiness.',
    when: 'Use it when you need to prove what happened or inspect generated outputs.',
    evidence: 'It is the durable audit trail for the current assignment.',
    safety: 'Artifacts should be reviewable before any external PR or dependency action.',
    next: 'Open the artifact matching the question: design, plan, worker evidence, review log, context vault, or PR pack.'
  },
  {
    title: 'ODT Guide',
    aliases: ['odt guide', 'guide', 'chatbot', 'chat bot', 'handbook', 'platform coach'],
    what: 'Acts as the in-app handbook and evidence-aware chatbot for ODT usage, SDLC steps, buttons, pages, status, blockers, workers, tests, and PR readiness.',
    when: 'Use it whenever you are unsure where to click, why something is gated, or how ODT expects the workflow to proceed.',
    evidence: 'It answers from the local handbook, standards, assignment evidence, run history, and PR readiness reports.',
    safety: 'It can explain and recommend, but it does not silently approve write actions.',
    next: 'Ask a button/page question or ask what the next safe action is.'
  },
  {
    title: 'Runs',
    aliases: ['runs', 'run history', 'timeline', 'execution history', 'live logs'],
    what: 'Shows execution history, events, provider/model usage, latency, token counts, and run status.',
    when: 'Use it to audit what happened or verify whether a backend/AI action ran.',
    evidence: 'Displays run events and usage entries created by backend actions.',
    safety: 'For live terminal worker logs, use Agent Team worker log controls when a worker run exists.',
    next: 'Select a run to inspect the timeline, or return to Agent Team for worker-specific logs.'
  },
  {
    title: 'Monitoring',
    aliases: ['monitoring', 'usage', 'ai usage', 'provider health', 'health'],
    what: 'Shows AI usage, provider health, request count, latency, token usage, and fallback visibility.',
    when: 'Use it when responses look slow, generic, or unavailable.',
    evidence: 'Displays provider and usage events.',
    safety: 'Secrets stay backend-side; the UI should only show safe configuration status.',
    next: 'Check provider status, then ask ODT Guide or retry the backend action.'
  },
  {
    title: 'Settings',
    aliases: ['settings', 'configuration', 'config', 'provider settings'],
    what: 'Shows local runtime configuration, provider status, feature flags, and safe connector status.',
    when: 'Use it to confirm ODT is running in the intended environment and provider mode.',
    evidence: 'Displays safe settings and connector metadata.',
    safety: 'Do not expose API keys, SSO tokens, or secrets in frontend settings.',
    next: 'Adjust backend environment configuration outside the UI, then refresh ODT.'
  }
];

const platformActionGuides = [
  {
    title: 'New Intake',
    aliases: ['new intake', 'start intake'],
    what: 'Starts the requirement and repo-context capture flow.',
    when: 'Use it for a new Jira, requirement, feature, defect, or repo task.',
    evidence: 'Creates or updates assignment intake evidence.',
    safety: 'It does not modify the target repo.',
    next: 'Add requirement text, choose or paste repo context, attach supporting files, then analyze.'
  },
  {
    title: 'Analyze Repo Read-only',
    aliases: ['analyze repo read-only', 'analyze repo readonly', 'analyse repo read only', 'analyze repository'],
    what: 'Scans the target repo for framework, package manager, scripts, test tools, folders, and likely impacted areas.',
    when: 'Use it before drafting design or plan so ODT can align to the actual codebase.',
    evidence: 'Creates repo analysis evidence.',
    safety: 'It is read-only and should not write files or install dependencies.',
    next: 'Review detected framework/tests, then draft design and plan.'
  },
  {
    title: 'Extract Structure',
    aliases: ['extract structure', 'requirement extraction', 'analyze requirement'],
    what: 'Turns unstructured requirement/Jira text into structured scope, acceptance criteria, gaps, assumptions, and clarification questions.',
    when: 'Use it after pasting the requirement.',
    evidence: 'Creates requirement analysis and clarification evidence.',
    safety: 'It should surface gaps rather than inventing hidden requirements.',
    next: 'Answer or accept clarification questions, then draft design.'
  },
  {
    title: 'Draft Design',
    aliases: ['draft design', 'technical design'],
    what: 'Creates a technical design from the requirement, repo analysis, and standards expectations.',
    when: 'Use it before implementation planning.',
    evidence: 'Creates technical design evidence.',
    safety: 'It should include validation, accessibility, security, testing, and risk considerations.',
    next: 'Review the design, then draft the implementation plan.'
  },
  {
    title: 'Draft Plan',
    aliases: ['draft plan', 'implementation plan'],
    what: 'Creates the implementation blueprint: tasks, impacted files, validation, tests, standards impacts, risks, and approvals.',
    when: 'Use it after design is good enough to review.',
    evidence: 'Creates implementation plan evidence.',
    safety: 'It should not unlock writes until Standards and human approval are complete.',
    next: 'Run Standards Check.'
  },
  {
    title: 'Run Standards Check',
    aliases: ['run standards check', 'standards check', 'run governance check'],
    what: 'Runs governance checks on the current design/plan or implementation evidence.',
    when: 'Use it before write delegation and before PR readiness.',
    evidence: 'Creates standards check and finding records.',
    safety: 'BLOCKER and APPROVAL_REQUIRED findings must be resolved, approved, or routed through the right approval path.',
    next: 'Review findings in Standards, then approve warnings or block implementation.'
  },
  {
    title: 'Approve With Warnings',
    aliases: ['approve with warnings', 'approve warnings', 'approve warning'],
    what: 'Records a human approval that non-critical warnings are acceptable for this workflow step.',
    when: 'Use it only after reading the warning details and deciding the risk is acceptable.',
    evidence: 'Creates an approval event tied to the assignment.',
    safety: 'It should not bypass hard safety blockers, destructive actions, frontend secrets, or unapproved dependency installs.',
    next: 'Return to Agent Team and confirm write delegation is now enabled.'
  },
  {
    title: 'Block Implementation',
    aliases: ['block implementation', 'block work', 'stop implementation'],
    what: 'Records that implementation should not proceed until issues are addressed.',
    when: 'Use it when the plan, standards, security, dependency, or requirement gaps are not acceptable.',
    evidence: 'Creates a blocking approval/decision event.',
    safety: 'This keeps write delegation disabled.',
    next: 'Update plan/design or send rework, then rerun Standards.'
  },
  {
    title: 'Unlock Write Delegation',
    aliases: ['unlock write delegation', 'write approval', 'approve write', 'enable delegate', 'enable delegation'],
    what: 'Guides the user to the approval path needed before a write-capable worker can run.',
    when: 'Use it when Delegate or Launch Worker is disabled because write approval is missing.',
    evidence: 'Leads to approval evidence when the user approves.',
    safety: 'It should still respect unresolved blockers and separate dependency approval.',
    next: 'Resolve blockers, approve allowed warnings, then return to Agent Team.'
  },
  {
    title: 'Launch Worker',
    aliases: ['launch worker', 'launch agent', 'delegate to agent', 'start worker', 'run codex'],
    what: 'Creates a governed worker bundle and launches the selected worker lane through the configured adapter, currently Codex terminal for local execution.',
    when: 'Use it when the plan is approved and the chosen worker lane is allowed.',
    evidence: 'Creates worker run, handoff, prompt, log, response, status, and relay evidence.',
    safety: 'Write-capable workers require approval. Dependency installs and destructive actions remain separately gated.',
    next: 'Watch the worker/log area, then use Ingest Output when the response is ready.'
  },
  {
    title: 'Prepare Handoff Only',
    aliases: ['prepare handoff', 'handoff only', 'manual handoff', 'cline handoff'],
    what: 'Creates the governed worker package without launching a terminal process.',
    when: 'Use it for Cline/manual workflows or when the launch adapter is not available.',
    evidence: 'Creates handoff files and run metadata.',
    safety: 'The receiving tool still must follow the allowed actions in the handoff contract.',
    next: 'Open/copy the handoff into the external tool, then bring output back with Ingest Output.'
  },
  {
    title: 'Ingest Output',
    aliases: ['ingest output', 'read worker output', 'capture output'],
    what: 'Reads the worker response file and stores parsed output, findings, questions, and relay context.',
    when: 'Use it after a worker finishes or writes its response.',
    evidence: 'Creates/updates worker output evidence.',
    safety: 'Ingesting output does not automatically mark implementation complete.',
    next: 'Review parsed output, then Record Evidence From Worker if the output is acceptable.'
  },
  {
    title: 'Record Evidence From Worker',
    aliases: ['record evidence from worker', 'record implementation evidence', 'worker evidence'],
    what: 'Converts worker output into implementation evidence such as changed files, commands, tests, summary, and post-implementation standards signals.',
    when: 'Use it after successful worker output is ingested and reviewed.',
    evidence: 'Creates implementation evidence and can feed PR readiness.',
    safety: 'Only record evidence that matches the approved scope and actual worker output.',
    next: 'Run reviewer/build verifier or generate PR pack when evidence is complete.'
  },
  {
    title: 'Stop Worker',
    aliases: ['stop worker', 'stop agent', 'terminate worker', 'cancel worker'],
    what: 'Requests termination for an active worker and attempts to send SIGINT when ODT has the process id.',
    when: 'Use it if a worker is stuck, wrong, unsafe, or no longer needed.',
    evidence: 'Creates a stop request and worker status/log evidence.',
    safety: 'Stopping is safest for active terminal workers; completed workers keep their logs and evidence.',
    next: 'Inspect the log, decide whether to relaunch, rework, or mark the run failed.'
  },
  {
    title: 'Send Rework',
    aliases: ['send rework', 'launch rework', 'rework worker'],
    what: 'Routes review findings into relay context so the next worker receives the issue and expected correction.',
    when: 'Use it when reviewer comments require implementation changes.',
    evidence: 'Creates rework relay evidence.',
    safety: 'Rework still follows the selected worker lane permissions.',
    next: 'Launch the appropriate worker and ingest the rework response.'
  },
  {
    title: 'Resolve',
    aliases: ['resolve comment', 'resolve review', 'mark resolved'],
    what: 'Marks a review comment resolved.',
    when: 'Use it after the issue is fixed, answered, or no longer applies.',
    evidence: 'Updates review evidence.',
    safety: 'Do not resolve unresolved technical risk just to pass the gate.',
    next: 'Continue review closeout or generate PR readiness.'
  },
  {
    title: 'Accept Risk',
    aliases: ['accept risk', 'risk accepted', 'override blocker', 'override'],
    what: 'Documents that a human accepts a known risk for the current workflow step.',
    when: 'Use it only for allowed override cases after the impact is understood.',
    evidence: 'Creates accepted-risk evidence.',
    safety: 'Dependency installs, secrets, destructive actions, and certain compliance/security blockers should not be bypassed casually.',
    next: 'Continue only if the remaining gate allows accepted risk.'
  },
  {
    title: 'Generate PR Pack',
    aliases: ['generate pr pack', 'prepare pr', 'generate pr ready', 'pr package'],
    what: 'Builds the PR readiness report from assignment evidence, worker output, tests, review, standards, risks, and rollback notes.',
    when: 'Use it after implementation and verification evidence exist.',
    evidence: 'Creates PR readiness report evidence.',
    safety: 'It should show blockers rather than hiding incomplete evidence.',
    next: 'Open PR Ready, review the checklist, then copy markdown if clean.'
  },
  {
    title: 'Copy PR Markdown',
    aliases: ['copy pr markdown', 'copy markdown', 'copy pr'],
    what: 'Copies the generated PR summary/checklist text for external PR creation.',
    when: 'Use it after reviewing the PR Ready page.',
    evidence: 'Uses the latest PR readiness report.',
    safety: 'Copying markdown does not raise a PR or approve external changes by itself.',
    next: 'Paste into the external PR after human review.'
  }
];

function matchPlatformGuideEntry(input, entries = []) {
  const lower = String(input || '').toLowerCase();
  return entries.find((entry) => entry.aliases.some((alias) => lower.includes(alias)));
}

function isPlatformTrainingQuestion(input = '') {
  const lower = String(input || '').toLowerCase();
  const explicitTraining = [
    /how (do|should|can) i use (odt|the app|this app|platform|workbench)/,
    /how does (odt|the app|this app|platform|workbench) work/,
    /why (use )?odt|what makes odt|how is odt different|stand(s)? out|advantage|enterprise governance|traceability|customi[sz]e|configurable polic(y|ies)/,
    /train(ing)? (the )?user/,
    /handbook|user guide|platform coach|chatbot|chat bot/,
    /what (does|do|is|are) .*(button|page|screen|tab|panel|card|section|action|workflow|sdlc)/,
    /what happens (if|when) .*click/,
    /where (should|do) i click/,
    /guide me/,
    /explain .*odt/,
    /sdlc steps|main flow|workflow steps/
  ];
  if (explicitTraining.some((pattern) => pattern.test(lower))) return true;
  const mentionsAction = matchPlatformGuideEntry(lower, platformActionGuides);
  const mentionsPage = matchPlatformGuideEntry(lower, platformPageGuides);
  return Boolean((mentionsAction || mentionsPage) && /(what|how|when|why|click|button|use|open|explain|teach|guide)/.test(lower));
}

function isCasualGuideQuestion(input = '') {
  const lower = String(input || '').trim().toLowerCase();
  if (!lower) return false;
  const shortGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|namaste|thanks|thank you)[!. ]*$/.test(lower);
  const dateTimeQuestion = /\b(today'?s date|date today|current date|what date|what day is it|what time|current time|time now)\b/.test(lower);
  const wellbeing = /\bhow are you\b|\bhow r u\b|\bare you okay\b/.test(lower);
  const help = /\bhow can you help\b|\bwhat can you do\b|\bwhat do you do\b|\bhelp me\b/.test(lower);
  return shortGreeting || dateTimeQuestion || wellbeing || help;
}

function inferGuideIntent(input = '') {
  const lower = String(input || '').toLowerCase();
  if (isCasualGuideQuestion(lower)) return 'casual';
  if (/(oci genai|oracle ai|generative ai|genai|openai-compatible|responses api|chat completions|embedding|embeddings|rerank|vision|speech|text-to-speech|tts|mcp|bitbucket|jirasd|jira sd|buildservice|build service|devops|memory-service|memory service|sks|ask oracle|knowledge collection|confluence)/.test(lower)) return 'oracle-ai-connectors';
  if (/(delegate|delegation|launch worker).*(disabled|blocked|blocking|gated|unavailable|not enabled)|(?:why|what).*(delegate|delegation).*(disabled|blocked|blocking|gated)/.test(lower)) return 'blockers';
  if (isPlatformTrainingQuestion(lower)) return 'platform-training';
  if (/(preview|persisted|db|database|save draft|publish|assessment)/.test(lower)) return 'assessment-preview';
  if (/(api|payload|id|delete|remove|question|answer)/.test(lower)) return 'api-payload';
  if (/(test|jest|coverage|qa|verify|verification|build|failed|passed)/.test(lower)) return 'testing';
  if (/(where are we|status|progress|current state|how much|summary|overall|now)/.test(lower)) return 'status';
  if (/(next|what should|roadmap|continue|plan next|move)/.test(lower)) return 'next-action';
  if (/(blocker|blocked|warning|review comment|accept risk|resolve|override|critical)/.test(lower)) return 'blockers';
  if (/(?:\bpr\b|pull request|readiness|pr-ready|pr ready|package|markdown)/.test(lower)) return 'pr-readiness';
  if (/(worker|agent|codex|cline|delegate|handoff|run log|worker run|agent run|log|tail|stop|terminal)/.test(lower)) return 'agent-workers';
  if (/(standard|governance|accessibility|wcag|vpat|security|dependency|3pl|approval)/.test(lower)) return 'standards';
  if (/(repo|repository|folder|upload|mockup|excel|pdf|docx|file|intake|jira|github|mcp)/.test(lower)) return 'intake-repo';
  return 'how-to-use';
}

function formatGuideDateTime() {
  const timeZone = process.env.TZ || 'Asia/Kolkata';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short'
  }).format(new Date());
}

function answerCasualGuide(input, ctx) {
  const lower = String(input || '').trim().toLowerCase();
  if (/\b(today'?s date|date today|current date|what date|what day is it|what time|current time|time now)\b/.test(lower)) {
    return `Today is ${formatGuideDateTime()}.`;
  }
  if (/\bhow are you\b|\bhow r u\b|\bare you okay\b/.test(lower)) {
    return 'I am doing well and ready to help. I can be casual for quick questions, and when you ask about ODT work I switch into governed SDLC coach mode.';
  }
  if (/\bhow can you help\b|\bwhat can you do\b|\bwhat do you do\b|\bhelp me\b/.test(lower)) {
    return [
      'I can help you use ODT like a guided SDLC workbench:',
      '',
      '- explain pages, buttons, workflow states, and standards gates',
      '- answer status, blocker, worker, test, PR readiness, and artifact questions',
      '- explain how team policies and governance customization work',
      '- summarize active assignment evidence from requirements, repo analysis, assets, plans, reviews, worker runs, and PR packs',
      '- keep casual questions simple, like date/time or basic help',
      '',
      `Current work item: ${ctx.assignment.title || 'No active assignment title captured'}.`
    ].join('\n');
  }
  return 'Hi. I am here. Ask me a quick question, or ask how to use ODT for intake, planning, standards, agent delegation, review, testing, or PR readiness.';
}

function buildGuideContext(evidence = {}, snapshot = {}) {
  const assignment = evidence.assignment || snapshot.assignments?.[0] || {};
  const workflow = evidence.workflowState || assignment.workflowState || {};
  const currentEvidence = scopedCurrentEvidence(evidence);
  const latestRepo = currentEvidence.repoAnalysis?.[0]?.analysisJson || {};
  const latestPlan = currentEvidence.implementationPlans?.[0]?.planJson || {};
  const latestDesign = currentEvidence.technicalDesigns?.[0]?.designJson || {};
  const latestCheck = currentEvidence.standardsChecks?.[0] || null;
  const latestPrRow = currentEvidence.prReadinessReports?.[0] || null;
  const latestPr = latestPrRow?.reportJson || latestPrRow || null;
  const latestImplementation = currentEvidence.implementationEvidence?.[0] || null;
  const workerRuns = currentEvidence.agentWorkerRuns || [];
  const latestWorker = workerRuns[0] || null;
  const reviewComments = currentEvidence.reviewComments || [];
  const openReviewComments = reviewComments.filter((comment) => comment.status === 'open');
  const standardsFindings = latestCheck?.findings || evidence.standardsFindings || [];
  const unresolvedStandards = getUnresolvedStandardsBlockers(currentEvidence);
  const pendingDependencies = (currentEvidence.dependencyRequests || []).filter((request) => request.status === 'pending');
  const allTests = getActiveImplementationTests(currentEvidence);
  const failedTests = allTests.filter((test) => test.status === 'failed');
  const passedTests = allTests.filter((test) => test.status === 'passed');
  const reviewCycleCloseout = evidence.reviewCycleCloseout || deriveReviewCycleCloseout(evidence);

  return {
    assignment,
    workflow,
    latestRepo,
    latestPlan,
    latestDesign,
    latestCheck,
    latestPr,
    latestImplementation,
    workerRuns,
    latestWorker,
    reviewComments,
    openReviewComments,
    standardsFindings,
    unresolvedStandards,
    pendingDependencies,
    allTests,
    failedTests,
    passedTests,
    reviewCycleCloseout,
    intakeAssets: evidence.intakeAssets || [],
    approvals: evidence.approvals || [],
    usageSummary: snapshot.usageSummary || {}
  };
}

function answerStatusGuide(ctx) {
  return [
    `Current ODT status: ${ctx.workflow.label || guideTitleCase(ctx.workflow.state || ctx.assignment.status || 'In Progress')}.`,
    '',
    `Work item: ${ctx.assignment.title || 'Current assignment'}`,
    `Target repo: ${ctx.assignment.repoPath || ctx.latestRepo.repoPath || 'not captured'}`,
    `PR gate: ${ctx.latestPr?.status || 'not generated'}`,
    `Review comments: ${ctx.openReviewComments.length} open, ${ctx.reviewComments.length} total`,
    `Worker runs: ${ctx.workerRuns.length}`,
    `Tests recorded: ${ctx.passedTests.length} passed, ${ctx.failedTests.length} failed`,
    '',
    `Next best action: ${ctx.workflow.nextAction?.label || ctx.reviewCycleCloseout.nextAction?.label || 'Review current evidence'}.`,
    ctx.workflow.nextAction?.detail || ctx.reviewCycleCloseout.nextAction?.detail || 'Open PR Ready, Review, or Agent Team depending on what you want to inspect next.'
  ].join('\n');
}

function answerNextActionGuide(ctx) {
  const actions = [
    ctx.openReviewComments.length ? `Review ${ctx.openReviewComments.length} open review comment(s) in Review.` : '',
    ctx.unresolvedStandards.length ? `Resolve or explicitly override ${ctx.unresolvedStandards.length} standards blocker(s).` : '',
    ctx.pendingDependencies.length ? `Approve or reject ${ctx.pendingDependencies.length} dependency request(s) before install/PR readiness.` : '',
    ctx.failedTests.length ? `Fix or accept risk for ${ctx.failedTests.length} failed test result(s).` : '',
    ctx.latestPr?.status === 'PR_READY_REVIEW' ? 'Open PR Ready and copy/review the generated PR markdown.' : '',
    !ctx.latestPr ? 'Generate a PR readiness pack after implementation evidence is recorded.' : ''
  ].filter(Boolean);
  return [
    'Next action recommendation:',
    '',
    ctx.workflow.nextAction?.label ? `Primary: ${ctx.workflow.nextAction.label}` : 'Primary: review the latest workflow evidence.',
    ctx.workflow.nextAction?.detail || ctx.reviewCycleCloseout.nextAction?.detail || '',
    '',
    'Checklist:',
    guideList(actions, 'No immediate blocker is visible. Review PR Ready and Artifacts for final evidence.', 6)
  ].join('\n');
}

function answerBlockersGuide(ctx) {
  const reviewItems = ctx.openReviewComments.map((comment) => `${guideTitleCase(comment.severity)} review: ${comment.comment}`);
  const standardsItems = ctx.unresolvedStandards.map((finding) => `${finding.category}: ${finding.message} Required action: ${finding.recommendation}`);
  const dependencyItems = ctx.pendingDependencies.map((request) => `${request.packageName || 'Dependency'} is pending approval.`);
  const failedItems = ctx.failedTests.map((test) => `${test.name || test.command || 'Test'}: ${test.notes || test.status}`);
  const all = [...reviewItems, ...standardsItems, ...dependencyItems, ...failedItems];
  return [
    all.length ? 'Current blockers / gated items:' : 'No active blockers are open right now.',
    '',
    guideList(all, 'Review queue is clean, standards blockers are clear, dependencies are resolved, and no failed tests are recorded.', 8),
    '',
    'How to handle them:',
    '- Review comments can be resolved, accepted as risk, or sent to rework.',
    '- Standards blockers need a plan update or an explicit human override unless they are hard safety blockers.',
    '- Dependency installs stay on a separate approval path.',
    '- Failed tests need a fix, rerun, or accepted-risk evidence before PR readiness.',
    '',
    'Delegation gates to check:',
    '- Standards review has run for the current plan/implementation phase.',
    '- Write approval exists for write-capable workers.',
    '- Critical blockers are resolved or explicitly accepted where policy allows.',
    '- Dependency requests are approved/rejected separately before install.',
    '- The selected agent adapter is healthy and the worker lane is allowed.'
  ].join('\n');
}

function answerPrGuide(ctx) {
  const checklist = ctx.latestPr?.readinessChecklist || [];
  const unchecked = checklist.filter((item) => !item.checked);
  const blocking = ctx.latestPr?.blockingItems || [];
  return [
    `PR readiness status: ${ctx.latestPr?.status || 'Not generated yet'}.`,
    '',
    `PR title: ${ctx.latestPr?.prTitle || ctx.assignment.title || 'Not captured'}`,
    `Blocking items: ${blocking.length}`,
    `Unchecked checklist items: ${unchecked.length}`,
    '',
    blocking.length ? 'Blocking items:' : 'PR evidence looks clean from the latest pack:',
    guideList(blocking.map((item) => `${item.category}: ${item.message} Required action: ${item.requiredAction}`), 'No blocking items in the latest PR readiness pack.', 6),
    '',
    unchecked.length ? 'Unchecked checklist items:' : 'Checklist is complete:',
    guideList(unchecked.map((item) => item.label), 'All latest PR checklist items are checked.', 6),
    '',
    'Where to go: open PR Ready to copy/review markdown, or Artifacts to inspect the saved PR Readiness Pack.'
  ].join('\n');
}

function answerWorkersGuide(ctx) {
  const workerItems = ctx.workerRuns.slice(0, 6).map((run) => {
    const output = run.output || {};
    const response = output.responseBytes ? `${output.responseBytes} bytes` : output.rawText ? 'captured' : 'not captured';
    const questions = Array.isArray(run.questions) && run.questions.length ? `, ${run.questions.length} relay question(s)` : '';
    const findings = Array.isArray(output.reviewerFindings) && output.reviewerFindings.length ? `, ${output.reviewerFindings.length} reviewer finding(s)` : '';
    return `${run.workerRoleLabel || run.workerRole}: ${guideTitleCase(run.status)} (${guideTitleCase(run.executionAgent)}), response ${response}${questions}${findings}`;
  });
  return [
    'Agent Team / worker evidence:',
    '',
    guideList(workerItems, 'No worker runs have been launched yet.', 8),
    '',
    `Latest worker: ${ctx.latestWorker?.workerRoleLabel || 'none'}`,
    `Latest closeout state: ${ctx.reviewCycleCloseout.label || 'No review cycle queued'}`,
    '',
    'How to use this:',
    '- Open Agent Team to review worker bundles, prompts, responses, logs, and relay context.',
    '- Use Ingest Output after a worker writes a response.',
    '- Use Record Evidence From Worker to convert worker output into implementation evidence.',
    '- Stop appears for active workers only; completed workers keep log/evidence actions.'
  ].join('\n');
}

function answerOracleAiConnectorsGuide(ctx) {
  const connectors = listConnectors();
  const connectorRows = connectors.map((connector) => (
    `${connector.label}: ${connector.phaseFit}. ${connector.description} Status: ${connector.enabled ? 'enabled' : 'disabled'}; server ${connector.serverConfigured ? 'configured' : 'not configured'}.`
  ));
  return [
    'How ODT 2.0 should use Oracle AI and internal agentic building blocks:',
    '',
    'Use AI where it improves analysis, retrieval, drafting, review, and coaching. Keep ODT as the workflow authority for standards, approvals, write scope, dependency decisions, evidence, and PR readiness.',
    '',
    'Current implementation stage:',
    '- Stage A: backend-owned provider foundation is being wired now.',
    '- Local deterministic RAG is default and fallback.',
    '- OCI GenAI can power ODT Guide when endpoint, model, compartment, and backend auth are configured.',
    '- OpenAI-compatible and Ollama paths use the same provider interface.',
    '- Runs and Monitoring record provider, model, tokens, latency, errors, and fallback usage.',
    '',
    'Oracle AI roadmap:',
    '- OCI GenAI Chat Completions: ODT Guide, specialist reviews, design/review summarization.',
    '- OCI GenAI Responses/conversations/files/vector stores/containers: future managed agentic adapter.',
    '- OCI embeddings and rerank: stronger enterprise RAG over standards, repo evidence, Jira, Confluence, worker output, and PR packs.',
    '- OCI Document Understanding: PDFs, scanned docs, forms, tables, and document-heavy intake before GenAI reasoning.',
    '- OCI Vision or approved document/image analysis: screenshot, mockup, diagram, OCR, and document enrichment.',
    '- OCI Speech and text-to-speech: future voice intake and accessibility walkthroughs.',
    '- OCI API Gateway plus Functions/OKE: future governed deployment boundary for ODT APIs, auth, rate limits, and routing.',
    '- OCI Object Storage plus DB audit store: durable raw artifacts, prompts, outputs, logs, approvals, and PR packages.',
    '',
    'Internal MCP / knowledge connector fit:',
    guideList(connectorRows, 'No connector catalog is loaded.', 10),
    '',
    'ODT page map:',
    '- Intake: GenAI Files/Vector Stores, Document Understanding, Vision, Speech, Jira SD, Bitbucket/SCM read context.',
    '- Planner: GenAI Responses or Agents for design, plan, impacted files, validation, risks, and assumptions.',
    '- Standards: GenAI + RAG + ODT rule engine + SKS/Confluence knowledge + human gates.',
    '- Agent Team: Codex/Cline/manual workers, MCP gateway, and future OCI tool calling after approval.',
    '- Review: GenAI review plus Bitbucket/SCM/Jira/Build evidence.',
    '- PR Ready: GenAI-generated title, description, tests, risks, rollback, reviewers, and compliance summary.',
    '- Artifacts/Runs: Object Storage, DB/JSON audit store, and memory-service evidence.',
    '',
    'Phase mapping:',
    '- Intake: Jira SD, Ask Oracle, SKS, Bitbucket/SCM read context.',
    '- Analyze: Bitbucket/SCM read tools, SKS, repo summaries, uploaded assets.',
    '- Clarify: Ask Oracle/SKS retrieval and memory-service context.',
    '- Design/Plan: provider-backed ODT Guide/Agent Foundry using retrieved evidence.',
    '- Govern: standards registry, SKS/internal standards, DevOps/runbook/security context.',
    '- Approve: human approval remains outside automated write tools.',
    '- Delegate: Codex/Cline/OCI-managed agents with approved scope and allowlisted tools.',
    '- Ingest/Review: Bitbucket/SCM PR/diff/build outputs, Build Service logs, memory/evidence capture.',
    '',
    'Internal source references provided for configuration:',
    '- MCP servers available with Codex: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20650909983',
    '- Ask Oracle Knowledge Collections: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=17328629254',
    '',
    'Public Oracle reference links:',
    '- OCI Generative AI overview: https://docs.oracle.com/en-us/iaas/Content/generative-ai/overview.htm',
    '- OCI OpenAI-compatible endpoints: https://docs.oracle.com/en-us/iaas/Content/generative-ai/openai-compatible-api.htm',
    '- OCI Generative AI Agents: https://docs.oracle.com/en-us/iaas/Content/generative-ai-agents/overview.htm',
    '- OCI Document Understanding: https://docs.oracle.com/en-us/iaas/Content/document-understanding/using/home.htm',
    '- OCI Vision: https://docs.oracle.com/en-us/iaas/Content/vision/using/overview.htm',
    '- OCI Speech: https://docs.oracle.com/iaas/Content/speech/using/speech.htm',
    '- OCI API Gateway: https://docs.oracle.com/en-us/iaas/Content/APIGateway/home.htm',
    '',
    'Safety rule:',
    'Read connectors can assist earlier phases. Write-capable SCM/Bitbucket/Build actions stay disabled until standards gates and explicit human approval are captured. Destructive actions stay blocked by default.',
    '',
    'Current task context:',
    `- Work item: ${ctx.assignment.title || 'Current assignment'}`,
    `- Workflow: ${ctx.workflow.label || ctx.workflow.state || ctx.assignment.status || 'not captured'}`
  ].join('\n');
}

function answerTestingGuide(ctx) {
  const latestTests = (ctx.latestImplementation?.tests || ctx.allTests || []).slice(0, 8).map((test) => (
    `${guideTitleCase(test.status)}: ${test.name || test.command || 'Test'}${test.notes ? ` - ${test.notes}` : ''}`
  ));
  const planned = normalizeStringItems(ctx.latestPlan.testTasks || ctx.latestDesign.testing || [], 8);
  return [
    'Testing evidence:',
    '',
    `Recorded tests: ${ctx.allTests.length}`,
    `Passed: ${ctx.passedTests.length}`,
    `Failed: ${ctx.failedTests.length}`,
    '',
    'Latest recorded outcomes:',
    guideList(latestTests, 'No test evidence recorded yet.', 8),
    '',
    'Planned / expected tests:',
    guideList(planned, 'No explicit test plan found in the latest plan/design.', 8)
  ].join('\n');
}

function answerStandardsGuide(ctx) {
  const findings = (ctx.latestCheck?.findings || ctx.standardsFindings || []).slice(0, 8).map((finding) => (
    `${finding.status}: ${finding.category} - ${finding.message}`
  ));
  return [
    `Latest standards gate: ${ctx.latestCheck?.status || 'Not run yet'}.`,
    '',
    `Standards version: ${ctx.latestCheck?.standardsVersion || 'not captured'}`,
    `Approvals captured: ${ctx.approvals.length}`,
    `Pending dependency requests: ${ctx.pendingDependencies.length}`,
    '',
    'Findings:',
    guideList(findings, 'No standards findings captured yet.', 8),
    '',
    'Governance rule:',
    '- Warnings can proceed only with human approval.',
    '- Blockers require resolution or controlled override where allowed.',
    '- Dependency installs always require package-specific approval.',
    '- Frontend secrets, destructive actions, and unapproved installs stay hard-blocked.'
  ].join('\n');
}

function answerIntakeRepoGuide(ctx) {
  const assets = ctx.intakeAssets.map((asset) => {
    const analysis = asset.analysisJson || {};
    const extraction = analysis.localExtraction?.status || 'not_analyzed';
    const ai = analysis.aiEnrichment?.recommended ? `, optional AI: ${analysis.aiEnrichment.status}` : '';
    return `${asset.originalName} (${asset.fileType}, ${asset.bytes} bytes, extraction: ${extraction}${ai})`;
  });
  const repoSignals = ctx.latestRepo.frameworks || [];
  const tests = ctx.latestRepo.testFrameworks || [];
  return [
    'Intake and repo context:',
    '',
    `Repo path: ${ctx.assignment.repoPath || ctx.latestRepo.repoPath || 'not captured'}`,
    `Package manager: ${ctx.latestRepo.packageManager || 'not detected'}`,
    `Frameworks: ${repoSignals.length ? repoSignals.join(', ') : 'not detected'}`,
    `Test frameworks: ${tests.length ? tests.join(', ') : 'not detected'}`,
    '',
    'Uploaded / attached context:',
    guideList(assets, 'No intake assets attached.', 8),
    '',
    'Storage rule:',
    'ODT copies uploads into its own workspace storage. It does not copy them into the target repo unless a write-approved worker explicitly does so inside approved scope.',
    '',
    'Enrichment rule:',
    'Text-like files are excerpted locally. PDF/DOCX/XLSX/PPTX/images are stored as evidence and can receive optional parser or vision enrichment later; if that provider is offline, ODT falls back to metadata, file path, and manual review.'
  ].join('\n');
}

function answerAssessmentPreviewGuide(ctx) {
  return [
    'Assessment Preview rule:',
    '',
    'Preview must reflect the last saved DB version, not unsaved edits.',
    '',
    'Create flow:',
    '- Preview remains disabled until the Assessment is saved/published and redirects into edit.',
    '',
    'Edit flow:',
    '- Initial Preview state comes from saved GET data.',
    '- Any Assessment field, question, answer option, or correct-answer checkbox change disables Preview immediately.',
    '- Save Draft or Publish can re-enable Preview only after success and only if submitted/saved questions are previewable.',
    '',
    'Previewable question data:',
    '- At least one question.',
    '- Every question has text.',
    '- Every question has at least two answer options with text.',
    '- Every question has at least one correct answer.',
    '',
    'Current ODT evidence says this task is at:',
    `- Workflow: ${ctx.workflow.label || ctx.workflow.state || 'not captured'}`,
    `- PR gate: ${ctx.latestPr?.status || 'not generated'}`
  ].join('\n');
}

function answerApiPayloadGuide(ctx) {
  const apiRules = normalizeStringItems([
    ...(ctx.latestDesign.apiChanges || []),
    ...(ctx.latestPlan.backendTasks || []),
    ...(ctx.latestPlan.validationTasks || [])
  ], 10);
  return [
    'Assessment update API payload rules:',
    '',
    '- Deleted question: do not send that question block.',
    '- Removed answer: do not send that answer block.',
    '- New question: do not send question id; do not send answer ids for answers under it.',
    '- New answer under existing question: keep the existing question id, omit the new answer id.',
    '- Existing question/answer: preserve ids when still present.',
    '',
    'Plan evidence related to this:',
    guideList(apiRules, 'No API payload-specific plan tasks were found.', 8)
  ].join('\n');
}

function answerPlatformTrainingGuide(ctx, input) {
  const lower = String(input || '').toLowerCase();
  if (/(customi[sz]e|modify|change|edit|tune).{0,60}(rule|governance|standard|policy|gate|approval)|(?:rule|governance|standard|policy|gate|approval).{0,60}(customi[sz]e|modify|change|edit|tune)/.test(lower)) {
    const registry = loadStandardsRegistry();
    const standardsConfig = registry.sources?.find((source) => source.id === 'standards-config');
    return [
      'How teams customize ODT governance:',
      '',
      'Current local MVP path:',
      `1. Edit the standards registry: ${standardsConfig?.path || 'server/standards/odt-standards.json'}.`,
      '2. Update the related Markdown source documents when guidance changes.',
      '3. Bump or note the standards version when the policy meaning changes.',
      '4. Restart/reload ODT if needed and rerun Standards Check on the assignment.',
      '5. Review the new findings before approving write/delegate actions.',
      '',
      'What can be customized:',
      '- Accessibility required topics and VPAT/WCAG/Section 508 expectations.',
      '- Dependency license preferences and package approval rules.',
      '- Security checks, testing expectations, UX guidance, review templates, and PR-readiness checklist.',
      '- Team-specific approval gates, worker lanes, and provider/model adapter policies.',
      '',
      'What should stay hard-gated:',
      '- Frontend secrets.',
      '- Destructive actions.',
      '- Dependency installs without package-specific approval.',
      '- Write actions without human approval.',
      '- External system writes without approval.',
      '',
      'Future production path:',
      'ODT should add a Policy Admin UI where authorized admins edit rules, preview impact, validate config, publish a new policy version, and create an audit event. ODT should not rely on random code edits for enterprise policy changes.',
      '',
      'Rule of thumb:',
      'Customization is allowed; silent governance drift is not. Every policy change and override should be versioned, reviewed, and traceable.'
    ].join('\n');
  }

  if (/(why (use )?odt|what makes odt|how is odt different|stand(s)? out|advantage|enterprise governance|traceability|customi[sz]e|configurable polic(y|ies))/.test(lower)) {
    return [
      'Why ODT stands out:',
      '',
      'ODT combines modern AI developer workflow with enterprise governance and traceability.',
      '',
      'Modern AI tools are strong at repo-aware chat, plan-first assistance, terminal delegation, code edits, and review loops. ODT adopts those patterns, then adds a governed evidence system around them.',
      '',
      'What ODT adds on top:',
      '- Standards gates for UX, accessibility, security, dependency, testing, maintainability, and PR readiness.',
      '- Human approval evidence before write actions, dependency installs, risky overrides, and external writes.',
      '- Durable records for requirement analysis, repo analysis, uploaded assets, plans, standards findings, worker runs, logs, tests, review comments, relay items, and PR packs.',
      '- Configurable team policies instead of one hardcoded rule set.',
      '- Adapter-ready execution for Codex, Cline/manual, OCI GenAI/OCA, OpenAI, Ollama, MCP, and future providers.',
      '',
      'Team customization model:',
      '- Standards can vary by team or product area.',
      '- Dependency policies can be stricter for enterprise/compliance-heavy work.',
      '- Approval gates can differ for local demo, internal tools, production apps, and regulated systems.',
      '- Worker lanes and model/provider choices can be configured behind the same governed contract.',
      '',
      'Simple positioning:',
      'AI assistants help produce work. ODT helps govern, prove, and safely operationalize that work.',
      '',
      'Current task context:',
      `- Work item: ${ctx.assignment.title || 'Current assignment'}`,
      `- Workflow: ${ctx.workflow.label || ctx.workflow.state || ctx.assignment.status || 'not captured'}`
    ].join('\n');
  }

  const action = matchPlatformGuideEntry(input, platformActionGuides);
  const page = matchPlatformGuideEntry(input, platformPageGuides);
  const entry = action || page;

  if (entry) {
    return [
      'ODT platform coach:',
      '',
      `${action ? 'Action' : 'Page'}: ${entry.title}`,
      `What it does: ${entry.what}`,
      `When to use it: ${entry.when}`,
      `Evidence it creates/uses: ${entry.evidence}`,
      `Safety rule: ${entry.safety}`,
      `Next click: ${entry.next}`,
      '',
      'Current task context:',
      `- Work item: ${ctx.assignment.title || 'Current assignment'}`,
      `- Workflow: ${ctx.workflow.label || ctx.workflow.state || ctx.assignment.status || 'not captured'}`,
      `- Latest standards gate: ${ctx.latestCheck?.status || 'not run'}`,
      `- PR readiness: ${ctx.latestPr?.status || 'not generated'}`
    ].join('\n');
  }

  const sdlcSteps = [
    '1. Intake: capture requirement/Jira text, repo or folder, branch, and context files.',
    '2. Analyze: run requirement extraction and read-only repo analysis.',
    '3. Clarify: answer, accept, or route open questions before planning.',
    '4. Design: draft technical design with UX, accessibility, security, data/API, and test impact.',
    '5. Plan: draft implementation tasks, impacted files, validation, risks, and approvals.',
    '6. Govern: run Standards and resolve warnings/blockers or document allowed exceptions.',
    '7. Approve: capture human approval before write-capable delegation.',
    '8. Delegate: launch or prepare a governed worker handoff in Agent Team.',
    '9. Ingest: pull worker output back into ODT and record implementation evidence.',
    '10. Review: resolve comments, send rework, verify tests, then generate PR Ready.'
  ];
  const pageMap = [
    'Intake = start and enrich the work item.',
    'Planner = review design and implementation plan.',
    'Standards = check governance before/after implementation.',
    'Agent Team = launch/track Codex/Cline/manual workers.',
    'Review = close comments, risks, and rework.',
    'PR Ready = generate final PR package.',
    'Artifacts/Runs = audit evidence and execution history.'
  ];

  return [
    'ODT Guide is your in-app platform coach and evidence-aware chatbot.',
    '',
    'How to use ODT for SDLC work:',
    sdlcSteps.join('\n'),
    '',
    'Page map:',
    guideList(pageMap, 'Open Overview to choose the next step.', 8),
    '',
    'Button rule of thumb:',
    '- Buttons that analyze, draft, ingest, or generate evidence are safe workflow actions.',
    '- Buttons that write files, launch workers, install dependencies, or override blockers require explicit approval.',
    '- Dependency installs always stay on their own approval path.',
    '',
    'Current task context:',
    `- Work item: ${ctx.assignment.title || 'Current assignment'}`,
    `- Next safe action: ${ctx.workflow.nextAction?.label || ctx.reviewCycleCloseout.nextAction?.label || 'Review Overview or Planner'}`
  ].join('\n');
}

function answerHowToUseGuide(ctx, input) {
  const steps = inferGuideSteps(input, { assignment: ctx.assignment });
  return [
    'How to use ODT Guide effectively:',
    '',
    guideList(steps, 'Ask about status, blockers, PR readiness, standards, worker runs, tests, repo intake, or a specific requirement rule.', 8),
    '',
    'Try questions like:',
    '- Where are we now?',
    '- Why is delegation blocked?',
    '- What did the Build Verifier run?',
    '- What is missing before PR?',
    '- Explain the Assessment Preview DB rule.',
    '- List update API payload edge cases.'
  ].join('\n');
}

function answerFromLocalRag(input, snapshot, assignmentId = 'assignment-local-mvp', options = {}) {
  const evidence = collectEvidence(assignmentId);
  const sources = options.rankedSources || rankKnowledge(input, buildKnowledgeCorpus(assignmentId), 6);
  if (options.sourceSink) {
    options.sourceSink.sources = guideSourceMetadata(sources);
  }
  const ctx = buildGuideContext(evidence, snapshot);
  const intent = inferGuideIntent(input);
  if (intent === 'casual') {
    return answerCasualGuide(input, ctx);
  }
  const responders = {
    status: answerStatusGuide,
    'next-action': answerNextActionGuide,
    blockers: answerBlockersGuide,
    'pr-readiness': answerPrGuide,
    'agent-workers': answerWorkersGuide,
    'oracle-ai-connectors': answerOracleAiConnectorsGuide,
    testing: answerTestingGuide,
    standards: answerStandardsGuide,
    'intake-repo': answerIntakeRepoGuide,
    'assessment-preview': answerAssessmentPreviewGuide,
    'api-payload': answerApiPayloadGuide,
    'platform-training': (context) => answerPlatformTrainingGuide(context, input),
    'how-to-use': (context) => answerHowToUseGuide(context, input)
  };
  const body = (responders[intent] || responders['how-to-use'])(ctx);

  return [
    body,
    '',
    'Evidence used:',
    `- Assignment: ${ctx.assignment.title || assignmentId}`,
    `- Workflow: ${ctx.workflow.label || ctx.workflow.state || 'not captured'}`,
    `- Latest standards: ${ctx.latestCheck?.status || 'not run'}`,
    `- Latest PR gate: ${ctx.latestPr?.status || 'not generated'}`,
    '',
    'Sources:',
    guideSourceList(sources)
  ].join('\n');
}

function localProviderContent(requestType, input, snapshot, assignmentId = 'assignment-local-mvp', options = {}) {
  const text = String(input || '');
  const lower = text.toLowerCase();
  if (requestType === 'chat') {
    if (!text.trim()) return 'Hi. Ask me anything about using ODT, the active task, today’s date, workflow blockers, standards gates, worker runs, tests, artifacts, or PR readiness.';
    if (aiConfig.ragEnabled) {
      return answerFromLocalRag(text, snapshot, assignmentId, options);
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
  const activeAssignmentId = assignmentId || 'assignment-local-mvp';
  const sessionId = body.sessionId || 'local-session';
  const provider = createGenAiProvider(aiConfig);
  const model = requestType === 'embed'
    ? (aiConfig.embedModelConfigured ? 'configured-server-side-embed-model' : 'local-placeholder-embed')
    : provider.model;
  let providerStatus = provider.isConfigured();
  let selectedProvider = provider.id;
  let responseModel = model;
  let fallbackUsed = provider.id === 'local';
  let providerError = null;
  let retrievedContext = [];
  let retrievedRawSources = [];
  let retrievedSources = [];

  try {
    assertInputLimit(input);
    createRunEvent(runId, 'request_received', 'running', { requestId, requestType, provider: provider.id }, assignmentId);
    createRunEvent(runId, 'provider_selected', 'running', {
      provider: provider.id,
      model,
      ready: providerStatus.ready,
      fallbackUsed,
      status: providerStatus.message
    }, assignmentId);
    const snapshot = await buildSnapshot();
    if (requestType === 'chat' && aiConfig.ragEnabled) {
      const rag = buildProviderContext(input, activeAssignmentId, 6);
      retrievedContext = rag.context;
      retrievedRawSources = rag.sources;
      retrievedSources = guideSourceMetadata(rag.sources);
      createRunEvent(runId, 'rag_context_retrieved', 'ok', {
        requestId,
        sourceCount: retrievedSources.length,
        sources: retrievedSources.slice(0, 6).map((source) => ({
          id: source.id,
          title: source.title,
          type: source.type
        }))
      }, assignmentId);
    }
    let providerResult = null;
    if (requestType === 'chat' && provider.id !== 'local' && providerStatus.ready) {
      try {
        providerResult = await provider.chat({
          question: input,
          context: retrievedContext,
          sources: retrievedRawSources,
          snapshot,
          assignmentId: activeAssignmentId,
          requestType
        });
        providerResult.sources = providerResult.sources || retrievedSources;
      } catch (error) {
        providerError = error;
        fallbackUsed = true;
        createRunEvent(runId, 'provider_fallback_used', 'warning', {
          requestId,
          provider: provider.id,
          model,
          reason: error.message
        }, assignmentId);
      }
    } else if (requestType === 'chat' && provider.id !== 'local') {
      providerError = new Error(providerStatus.message);
      fallbackUsed = true;
      createRunEvent(runId, 'provider_fallback_used', 'warning', {
        requestId,
        provider: provider.id,
        model,
        reason: providerStatus.message
      }, assignmentId);
    }

    const sourceSink = { sources: retrievedSources };
    const content = providerResult?.content || localProviderContent(requestType, input, snapshot, activeAssignmentId, {
      rankedSources: retrievedRawSources,
      sourceSink
    });
    retrievedSources = providerResult?.sources || sourceSink.sources || retrievedSources;
    selectedProvider = providerResult?.provider || (requestType === 'chat' && !providerError ? provider.id : 'local');
    responseModel = providerResult?.model || (providerError || requestType !== 'chat' ? localModelForRequest(requestType) : model);
    fallbackUsed = providerResult ? Boolean(providerResult.fallbackUsed) : true;
    const serializedContent = typeof content === 'string' ? content : JSON.stringify(content);
    const latencyMs = Date.now() - startedAt;
    const usage = providerResult?.usage || {
      promptTokens: estimateTokens(input),
      completionTokens: estimateTokens(serializedContent),
      totalTokens: estimateTokens(input) + estimateTokens(serializedContent)
    };

    aiUsageRepository.createUsage({
      id: createId('usage'),
      requestId,
      runId,
      sessionId,
      userId: body.userId || null,
      requestType,
      provider: selectedProvider,
      model: responseModel,
      inputChars: String(input || '').length,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      latencyMs,
      status: 'ok',
      error: providerError?.message || null,
      fallbackUsed,
      sources: retrievedSources
    });

    if (requestType === 'chat') {
      chatMessageRepository.createMessage({
        id: createId('msg'),
        assignmentId,
        sessionId,
        role: 'user',
        content: input,
        provider: selectedProvider,
        model: responseModel
      });
      chatMessageRepository.createMessage({
        id: createId('msg'),
        assignmentId,
        sessionId,
        role: 'assistant',
        content: serializedContent,
        provider: selectedProvider,
        model: responseModel
      });
    }

    createRunEvent(runId, 'response_generated', 'ok', {
      requestId,
      requestType,
      provider: selectedProvider,
      model: responseModel,
      latencyMs,
      fallbackUsed,
      sourceCount: retrievedSources.length,
      sources: retrievedSources.slice(0, 4).map((source) => ({
        id: source.id,
        title: source.title,
        type: source.type
      }))
    }, assignmentId);
    createRunEvent(runId, 'usage_logged', 'ok', {
      requestId,
      totalTokens: usage.totalTokens,
      provider: selectedProvider,
      model: responseModel,
      sourceCount: retrievedSources.length
    }, assignmentId);

    sendJson(response, 200, {
      provider: selectedProvider,
      model: responseModel,
      requestType,
      content,
      usage,
      latencyMs,
      requestId,
      runId,
      fallbackUsed,
      sources: retrievedSources,
      error: providerError?.message || null
    });
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const promptTokens = estimateTokens(input);
    aiUsageRepository.createUsage({
      id: createId('usage'),
      requestId,
      runId,
      sessionId,
      userId: body.userId || null,
      requestType,
      provider: selectedProvider,
      model: responseModel,
      inputChars: String(input || '').length,
      promptTokens,
      completionTokens: 0,
      totalTokens: promptTokens,
      latencyMs,
      status: 'error',
      error: error.message,
      fallbackUsed,
      sources: []
    });
    createRunEvent(runId, 'request_failed', 'error', { requestId, requestType, error: error.message, latencyMs }, assignmentId);
    sendJson(response, 400, {
      provider: selectedProvider,
      model: responseModel,
      requestType,
      content: null,
      usage: { promptTokens, completionTokens: 0, totalTokens: promptTokens },
      latencyMs,
      requestId,
      runId,
      fallbackUsed,
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
          description: 'Copies user-provided context files into the ODT workbench workspace without modifying the target repository. Generates local asset analysis, text excerpts where possible, checksum evidence, and optional AI/parser enrichment status.',
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
      '/api/intake/assets/{assetId}/enrich': {
        post: {
          operationId: 'checkIntakeAssetEnrichment',
          summary: 'Check optional intake asset enrichment',
          description: 'Returns local extraction status and optional model/parser enrichment readiness for a copied intake asset. This endpoint is fail-soft: if no provider is configured, it returns local metadata and fallback guidance instead of blocking the workflow.',
          parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'string' }, description: 'Asset id.' }],
          requestBody: {
            required: false,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id for evidence storage.' },
                provider: { type: 'string', description: 'Optional provider override such as local, oci-genai, openai, ollama, or manual.' }
              }
            })
          },
          responses: {
            200: { description: 'Asset enrichment readiness or fallback result.', content: jsonContent({ type: 'object' }) },
            404: { description: 'Asset not found.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/intake/import-jira': {
        post: {
          operationId: 'importJiraIssueForIntake',
          summary: 'Import Jira issue into Intake',
          description: 'Reads a Jira issue through the backend-only connector, classifies whether the work is active or already completed, checks optional repo references, and stores requirement evidence. Secrets and raw env-file values are never returned.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id for evidence storage.' },
                issueKey: { type: 'string', description: 'Jira issue key, for example PROJECT-12345.' },
                repoPath: { type: 'string', description: 'Optional local repo path for read-only Jira-key checks in git history and tracked files.' }
              },
              required: ['issueKey']
            })
          },
          responses: {
            200: { description: 'Imported Jira issue and requirement evidence.', content: jsonContent({ type: 'object' }) },
            403: { description: 'Jira connector is not ready or credentials are missing.', content: jsonContent({ type: 'object' }) }
          }
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
      '/api/review/cycle/{assignmentId}/closeout': {
        get: {
          operationId: 'getReviewCycleCloseout',
          summary: 'Get review-cycle closeout status',
          description: 'Derives whether a rework cycle has completed Senior Full Stack Dev rework evidence, Reviewer rerun, Build Verifier rerun, and PR-ready package generation.',
          parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Assignment id.' }],
          responses: {
            200: { description: 'Review-cycle closeout state and next action.', content: jsonContent({ type: 'object' }) }
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
          description: 'Returns read-only or write-approved allowed actions, attached standards context, Project Contract command rules, and readiness snapshot for Codex/Cline handoff. Write-approved mode requires approval after the latest standards check.',
          parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Assignment id.' }],
          responses: { 200: { description: 'Agent handoff contract.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/agents/delegate': {
        post: {
          operationId: 'delegateAgentHandoff',
          summary: 'Prepare governed agent handoff run',
          description: 'Creates auditable run and agent evidence for a Codex/Cline/manual handoff without executing code. The handoff includes Project Contract commands, blocked-command policy, readiness status, and approval notes. Write-approved delegation requires approval after the latest standards check.',
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
          description: 'Creates a Codex worker bundle with Project Contract commands/readiness and launches a visible macOS Terminal session when allowed. The endpoint is allowlisted for Codex only and refuses write-lane launch unless the current ODT contract is write-approved and Project Contract readiness has no hard blockers.',
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
      '/api/agents/worker-runs/{workerRunId}/launch': {
        post: {
          operationId: 'launchPreparedAgentWorkerRun',
          summary: 'Launch prepared worker bundle',
          description: 'Starts an existing bundle_created or manual_fallback worker run without creating a new assignment or worker id.',
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
            200: { description: 'Prepared worker launch result.', content: jsonContent({ type: 'object' }) },
            404: { description: 'Worker run not found.', content: jsonContent({ type: 'object' }) },
            409: { description: 'Worker run is not in a launchable prepared state.', content: jsonContent({ type: 'object' }) }
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
      '/api/monitoring/error-log': {
        get: {
          operationId: 'listMonitoringErrorLog',
          summary: 'List workbench error and health log',
          description: 'Aggregates backend failures, blocked workflow events, connector issues, standards findings, review comments, dependency requests, worker problems, relay items, and validation failures into one operator-facing monitoring log.',
          parameters: [{ name: 'assignmentId', in: 'query', required: false, schema: { type: 'string' }, description: 'Assignment id to scope workflow/governance health items.' }],
          responses: { 200: { description: 'Monitoring error and health log.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/validation/runs': {
        get: {
          operationId: 'listValidationRuns',
          summary: 'List ODT validation runs',
          description: 'Returns recent ODT self-validation runs scoped to the active or requested assignment, including UI smoke status, screenshot paths, and captured command output.',
          parameters: [{ name: 'assignmentId', in: 'query', required: false, schema: { type: 'string' }, description: 'Assignment id used to scope validation history.' }],
          responses: { 200: { description: 'Validation run history.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/validation/ui-smoke': {
        post: {
          operationId: 'runUiSmokeValidation',
          summary: 'Run ODT UI smoke validation',
          description: 'Runs the local ODT UI smoke validation script with a fixed local app/API scope and records the result as run evidence.',
          requestBody: {
            required: false,
            content: jsonContent({
              type: 'object',
              properties: {
                assignmentId: { type: 'string', description: 'Assignment id to validate.' },
                expectedIssue: { type: 'string', description: 'Expected Jira key for verification-mode validation.' }
              }
            })
          },
          responses: { 200: { description: 'UI smoke validation result.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/project-contracts': {
        get: {
          operationId: 'listProjectContracts',
          summary: 'List project contracts',
          description: 'Returns governed per-repository build/test/run contracts used by Agent Team readiness and handoff generation.',
          parameters: [{ name: 'assignmentId', in: 'query', required: false, schema: { type: 'string' }, description: 'Optional assignment scope. Unscoped contracts are also returned by assignment-scoped repository reads.' }],
          responses: { 200: { description: 'Project contract list.', content: jsonContent({ type: 'object' }) } }
        },
        post: {
          operationId: 'saveProjectContract',
          summary: 'Create or update a project contract',
          description: 'Stores non-secret project setup rules, commands, approval notes, known issues, and blocked command patterns.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                id: { type: 'string' },
                assignmentId: { type: 'string' },
                projectName: { type: 'string' },
                repoPath: { type: 'string' },
                baseBranch: { type: 'string' },
                buildCommand: { type: 'string' },
                testCommand: { type: 'string' },
                blockedCommands: { type: 'array', items: { type: 'string' } },
                approvalNotes: { type: 'array', items: { type: 'string' } }
              },
              required: ['projectName']
            })
          },
          responses: { 200: { description: 'Stored project contract.', content: jsonContent({ type: 'object' }) } }
        }
      },
      '/api/project-contracts/{contractId}': {
        get: {
          operationId: 'getProjectContract',
          summary: 'Get project contract',
          description: 'Returns one governed project contract by id.',
          parameters: [{ name: 'contractId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Project contract.', content: jsonContent({ type: 'object' }) },
            404: { description: 'Project contract not found.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/project-contracts/{contractId}/readiness': {
        post: {
          operationId: 'checkProjectContractReadiness',
          summary: 'Run project contract readiness checks',
          description: 'Runs read-only readiness checks for repo path, git state, Node/npm/Codex availability, documented commands, known issues, approval notes, and blocked command policy.',
          parameters: [{ name: 'contractId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Readiness snapshot.', content: jsonContent({ type: 'object' }) },
            404: { description: 'Project contract not found.', content: jsonContent({ type: 'object' }) }
          }
        }
      },
      '/api/project-contracts/{contractId}/handoff': {
        post: {
          operationId: 'generateProjectContractHandoff',
          summary: 'Generate project contract handoff',
          description: 'Builds a governed Markdown handoff that can be attached to Agent Team worker prompts without executing project build, test, deploy, or write commands.',
          parameters: [{ name: 'contractId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Project contract handoff.', content: jsonContent({ type: 'object' }) },
            404: { description: 'Project contract not found.', content: jsonContent({ type: 'object' }) }
          }
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
          description: 'Returns recent run summaries scoped to the active or requested assignment.',
          parameters: [{ name: 'assignmentId', in: 'query', required: false, schema: { type: 'string' }, description: 'Assignment id used to scope run history.' }],
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
          }, { name: 'assignmentId', in: 'query', required: false, schema: { type: 'string' }, description: 'Assignment id expected to own the run.' }],
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
          description: 'Governed connector gateway. Jira read-only issue lookup can return safe issue fields; writes require approval; destructive actions are blocked.',
          requestBody: {
            required: true,
            content: jsonContent({
              type: 'object',
              properties: {
                connectorId: { type: 'string', description: 'Connector id such as jira, knowledge, or git.' },
                action: { type: 'string', description: 'Requested connector action.' },
                mode: { type: 'string', description: 'read, write, or delete/destructive.' },
                issueKey: { type: 'string', description: 'Jira issue key for jira get-issue/read-issue actions.' },
                query: { type: 'string', description: 'Optional connector query value. For Jira issue reads this may contain an issue key.' },
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
      fallbackUsed: { type: 'boolean', description: 'True when ODT answered through local deterministic fallback instead of a remote provider.' },
      error: { type: 'string', nullable: true, description: 'Normalized error message, if failed.' }
    }
  };
}

function getSafeSettingsResponse() {
  return settingsService.getSafeSettingsResponse();
}

function getStoredSetting(key, fallback) {
  return settingsService.getStoredSetting(key, fallback);
}

function recordConnectorEvent({
  connectorId,
  action = '',
  mode = 'read',
  status,
  detail = {},
  createdAt = new Date().toISOString()
} = {}) {
  return connectorEventRepository.createEvent({
    id: createId('connector'),
    connectorId,
    action,
    mode,
    status,
    detail,
    createdAt
  });
}

async function handleConnectorQuery(response, body) {
  const connector = listConnectors().find((item) => item.id === body.connectorId);
  const action = String(body.action || '').trim();
  const normalizedAction = action.toLowerCase();
  const mode = String(body.mode || 'read').toLowerCase();
  const now = new Date().toISOString();
  const eventAssignmentId = body.assignmentId || getActiveAssignmentId();
  if (!connector || !connector.enabled) {
    const reason = connector?.readinessDetail || 'Connector is disabled or not configured.';
    recordConnectorEvent({ connectorId: body.connectorId || 'unknown', action, mode, status: 'blocked', detail: { reason, assignmentId: eventAssignmentId }, createdAt: now });
    sendJson(response, 403, { status: 'blocked', reason, connector });
    return;
  }
  if (mode.includes('delete') || mode.includes('destructive')) {
    recordConnectorEvent({ connectorId: connector.id, action, mode, status: 'blocked', detail: { reason: 'Destructive actions are blocked by default.', assignmentId: eventAssignmentId }, createdAt: now });
    sendJson(response, 403, { status: 'blocked', reason: 'Destructive actions are blocked by default.', connector });
    return;
  }
  if (mode.includes('write') && connector.requireWriteApproval && !body.approved) {
    recordConnectorEvent({ connectorId: connector.id, action, mode, status: 'approval_required', detail: { reason: 'Write actions require human approval.', assignmentId: eventAssignmentId }, createdAt: now });
    sendJson(response, 403, { status: 'approval_required', reason: 'Write actions require human approval.', connector });
    return;
  }

  if (connector.id === 'jira' && ['get-issue', 'read-issue', 'issue', 'get-ticket', 'read-ticket'].includes(normalizedAction)) {
    const issueKey = normalizeJiraIssueKey(body.issueKey || body.ticketKey || body.query);
    if (!issueKey) {
      const reason = 'A Jira issue key such as PROJECT-12345 is required for this read action.';
      recordConnectorEvent({ connectorId: connector.id, action, mode, status: 'blocked', detail: { reason, assignmentId: eventAssignmentId }, createdAt: now });
      sendJson(response, 400, { status: 'blocked', reason, connector });
      return;
    }

    const credentials = loadJiraConnectorCredentials(connector);
    if (!credentials.ready) {
      const reason = 'Jira read credentials are not available server-side. Configure JIRA_URL plus a token/password through environment or Codex MCP env-file.';
      recordConnectorEvent({ connectorId: connector.id, action, mode, status: 'blocked', detail: { reason, assignmentId: eventAssignmentId, issueKey }, createdAt: now });
      sendJson(response, 403, { status: 'blocked', reason, connector });
      return;
    }

    try {
      const issue = await fetchJiraIssue(issueKey, credentials);
      const note = `Read-only Jira lookup succeeded for ${issueKey}. ODT returned safe issue fields only.`;
      recordConnectorEvent({ connectorId: connector.id, action, mode, status: 'ok', detail: { note, assignmentId: eventAssignmentId, issueKey }, createdAt: now });
      sendJson(response, 200, {
        status: 'ok',
        connector,
        issue,
        results: [issue],
        metadata: {
          credentialSource: credentials.source,
          authMode: credentials.authMode,
          safeFieldsOnly: true
        },
        note
      });
    } catch (err) {
      const reason = err.message || 'Unable to read Jira issue.';
      const detail = {
        reason,
        upstreamStatus: err.upstreamStatus || null,
        upstreamContentType: err.upstreamContentType || '',
        upstreamResponseKind: err.upstreamResponseKind || '',
        upstreamPreview: err.upstreamPreview || '',
        assignmentId: eventAssignmentId,
        issueKey
      };
      recordConnectorEvent({ connectorId: connector.id, action, mode, status: 'error', detail, createdAt: now });
      sendJson(response, err.httpStatus || 502, { status: 'error', reason, detail, connector });
    }
    return;
  }

  const okNote = connector.configurationSource === 'codex-config'
    ? `Codex MCP server ${connector.serverName} is detected. ODT read gate is ready; direct Jira MCP query transport is the next adapter layer.`
    : 'Connector gateway is wired for governance. Actual MCP transport is an extension point.';
  recordConnectorEvent({ connectorId: connector.id, action, mode, status: 'ok', detail: { note: okNote, assignmentId: eventAssignmentId }, createdAt: now });
  sendJson(response, 200, {
    status: 'ok',
    connector,
    results: [],
    note: okNote
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
      const assignmentId = body.assignmentId || getActiveAssignmentId();
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
        assets: intakeAssetRepository.listByAssignment(assignmentId),
        uploadPolicy,
        workspaceDir: join(workspaceDir, assignmentId, 'intake-assets')
      });
      return;
    }

    const intakeAssetFileMatch = url.pathname.match(/^\/api\/intake\/assets\/([^/]+)\/file$/);
    if (request.method === 'GET' && intakeAssetFileMatch) {
      const asset = intakeAssetRepository.getById(intakeAssetFileMatch[1]);
      if (!asset || !existsSync(asset.storedPath)) {
        sendJson(response, 404, { error: 'Intake asset not found.' });
        return;
      }
      sendFile(response, asset);
      return;
    }

    const intakeAssetEnrichMatch = url.pathname.match(/^\/api\/intake\/assets\/([^/]+)\/enrich$/);
    if (request.method === 'POST' && intakeAssetEnrichMatch) {
      const body = await readBody(request);
      try {
        sendJson(response, 200, enrichIntakeAsset({
          assetId: intakeAssetEnrichMatch[1],
          assignmentId: body.assignmentId || getActiveAssignmentId(),
          provider: body.provider || aiConfig.provider
        }));
      } catch (err) {
        sendJson(response, err.statusCode || 400, { error: err.message });
      }
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/intake/import-jira') {
      try {
        const body = await readBody(request);
        sendJson(response, 200, await importJiraIssueForIntake({
          assignmentId: body.assignmentId || '',
          issueKey: body.issueKey || body.ticketKey || body.query || '',
          repoPath: body.repoPath || '',
          createNewAssignment: Boolean(body.createNewAssignment)
        }));
      } catch (err) {
        sendJson(response, err.statusCode || err.httpStatus || 400, { error: err.message || 'Unable to import Jira issue.' });
      }
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/intake/analyze') {
      const body = await readBody(request);
      const input = body.input || body.requirement || body.text || '';
      const repoPath = body.repoPath || '';
      const assignmentId = body.createNewAssignment
        ? createAssignmentForWork({ input, repoPath }).id
        : (body.assignmentId || getActiveAssignmentId());
      sendJson(response, 200, {
        assignmentId,
        activeAssignmentId: assignmentId,
        analysis: buildRequirementAnalysis({
          assignmentId,
          input,
          repoPath,
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
      const assignmentId = body.assignmentId || getActiveAssignmentId();
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
      const assignmentId = body.assignmentId || getActiveAssignmentId();
      const currentEvidence = collectEvidence(assignmentId);
      const requirement = body.requirement || currentEvidence.requirements?.[0] || {};
      const latestRepo = currentEvidence.current?.repoAnalysis?.[0] || repoAnalysisRepository.listByAssignment(assignmentId)[0];
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
      const assignmentId = body.assignmentId || getActiveAssignmentId();
      const currentEvidence = collectEvidence(assignmentId);
      const latestDesign = currentEvidence.current?.technicalDesigns?.[0] || technicalDesignRepository.listByAssignment(assignmentId)[0];
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
      const assignmentId = body.assignmentId || getActiveAssignmentId();
      const assignment = getAssignment(assignmentId) || {};
      const currentEvidence = collectEvidence(assignmentId);
      const artifact = body.artifact || {
        assignment,
        latestDesign: currentEvidence.current?.technicalDesigns?.[0]?.designJson || {},
        latestPlan: currentEvidence.current?.implementationPlans?.[0]?.planJson || {},
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
      const assignmentId = body.assignmentId || getActiveAssignmentId();
      const approvalType = body.approvalType || body.type || 'standards_warning_override';
      const status = body.status || 'approved';
      const now = new Date().toISOString();
      const approval = approvalEventRepository.createApproval({
        id: createId('approval'),
        assignmentId,
        approvalType,
        status,
        approvedBy: body.approvedBy || body.userId || process.env.USER || 'local-user',
        approvedAt: now,
        notes: body.notes || ''
      });
      createRunEvent(createId('run'), 'approval_recorded', 'ok', { assignmentId, approvalType, status }, assignmentId);
      sendJson(response, 200, { assignmentId, approvalType, status, approvedAt: now, evidence: approval });
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
      const assignmentId = body.assignmentId || getActiveAssignmentId();
      const now = new Date().toISOString();
      const id = createId('dep');
      const dependencyRequest = dependencyRequestRepository.createRequest({
        id,
        assignmentId,
        packageName,
        version: body.version || '',
        license: body.license || 'UNKNOWN',
        reason,
        alternatives: body.alternatives || '',
        status: 'pending',
        requestedBy: body.requestedBy || process.env.USER || 'local-user',
        requestedAt: now,
        notes: body.notes || ''
      });
      createRunEvent(createId('run'), 'dependency_request_created', 'warning', { assignmentId, packageName }, assignmentId);
      sendJson(response, 200, dependencyRequest);
      return;
    }

    const dependencyDecisionMatch = url.pathname.match(/^\/api\/dependencies\/([^/]+)\/(approve|reject)$/);
    if (request.method === 'POST' && dependencyDecisionMatch) {
      const body = await readBody(request);
      const id = dependencyDecisionMatch[1];
      const action = dependencyDecisionMatch[2];
      const existing = dependencyRequestRepository.getById(id);
      if (!existing) {
        sendJson(response, 404, { error: 'Dependency request not found.' });
        return;
      }
      const status = action === 'approve' ? 'approved' : 'rejected';
      const now = new Date().toISOString();
      const dependencyRequest = dependencyRequestRepository.updateDecision({
        id,
        status,
        approvedBy: body.approvedBy || body.userId || process.env.USER || 'local-user',
        decidedAt: now,
        notes: body.notes || ''
      });
      createRunEvent(createId('run'), `dependency_${status}`, status === 'approved' ? 'ok' : 'blocked', {
        assignmentId: existing.assignmentId,
        packageName: existing.packageName
      }, existing.assignmentId);
      sendJson(response, 200, dependencyRequest);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/review/comments') {
      const body = await readBody(request);
      try {
        sendJson(response, 200, createReviewComment({
          assignmentId: body.assignmentId || getActiveAssignmentId(),
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
          assignmentId: body.assignmentId || getActiveAssignmentId(),
          targetType: body.targetType || 'plan',
          notes: body.notes || ''
        }));
      } catch (err) {
        sendJson(response, err.statusCode || 400, { error: err.message });
      }
      return;
    }

    const reviewCycleCloseoutMatch = url.pathname.match(/^\/api\/review\/cycle\/([^/]+)\/closeout$/);
    if (request.method === 'GET' && reviewCycleCloseoutMatch) {
      const assignmentId = reviewCycleCloseoutMatch[1];
      sendJson(response, 200, {
        assignmentId,
        closeout: workflowService.getReviewCycleCloseout(assignmentId)
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/implementation/evidence') {
      const body = await readBody(request);
      try {
        sendJson(response, 200, recordImplementationEvidence({
          assignmentId: body.assignmentId || getActiveAssignmentId(),
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
        const assignmentId = body.assignmentId || getActiveAssignmentId();
        const evidenceRecord = body.evidenceId
          ? implementationEvidenceRepository.getById(body.evidenceId)
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
	        const result = recordImplementationEvidenceFromWorkerRun({
	          assignmentId: body.assignmentId || getActiveAssignmentId(),
	          workerRunId: implementationFromWorkerMatch[1],
	          runPostCheck: body.runPostCheck !== false,
	          dryRun: body.dryRun === true
	        });
	        sendJson(response, 200, {
	          ...result,
	          workerRun: compactWorkerRunForApi(result.workerRun)
	        });
	      } catch (err) {
	        sendJson(response, err.statusCode || 400, { error: err.message, extracted: err.extracted || null, repoVerification: err.repoVerification || null });
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
      const delegation = await prepareAgentDelegation({
        assignmentId: body.assignmentId || getActiveAssignmentId(),
        executionAgent: body.executionAgent || getStoredSetting('executionAgent', 'codex'),
        requireWriteApproved: body.requireWriteApproved !== false,
        workerRoleId: body.workerRoleId || body.workerRole || '',
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
      const assignmentId = url.searchParams.get('assignmentId') || getActiveAssignmentId();
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
        const result = await launchCodexWorker({
          assignmentId: body.assignmentId || getActiveAssignmentId(),
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
	      agentWorkerRunRepository.listByAssignment(assignmentId)
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
	        workerRuns: agentWorkerRunRepository.listByAssignment(assignmentId).map(compactWorkerRunForApi),
	        relayItems: agentRelayRepository.listByAssignment(assignmentId),
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
	          assignmentId: body.assignmentId || getActiveAssignmentId(),
	          workerRunId: workerStatusMatch[1]
	        });
	        sendJson(response, 200, {
	          ...result,
	          workerRun: compactWorkerRunForApi(result.workerRun)
	        });
	      } catch (err) {
	        sendJson(response, err.statusCode || 400, { error: err.message });
	      }
		      return;
		    }

		    const workerLaunchMatch = url.pathname.match(/^\/api\/agents\/worker-runs\/([^/]+)\/launch$/);
		    if (request.method === 'POST' && workerLaunchMatch) {
		      const body = await readBody(request);
		      try {
		        const result = launchPreparedWorkerRun({
		          assignmentId: body.assignmentId || getActiveAssignmentId(),
		          workerRunId: workerLaunchMatch[1]
		        });
		        sendJson(response, 200, {
		          ...result,
		          workerRun: compactWorkerRunForApi(result.workerRun)
		        });
		      } catch (err) {
		        sendJson(response, err.statusCode || 400, { error: err.message });
		      }
		      return;
		    }

		    const workerStopMatch = url.pathname.match(/^\/api\/agents\/worker-runs\/([^/]+)\/stop$/);
		    if (request.method === 'POST' && workerStopMatch) {
		      const body = await readBody(request);
		      try {
		        const result = requestStopWorkerRun({
		          assignmentId: body.assignmentId || getActiveAssignmentId(),
		          workerRunId: workerStopMatch[1],
		          requestedBy: body.requestedBy || process.env.USER || 'local-user',
		          reason: body.reason || ''
		        });
		        sendJson(response, 200, {
		          ...result,
		          workerRun: compactWorkerRunForApi(result.workerRun)
		        });
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
	        relayItems: agentRelayRepository.listByAssignment(assignmentId),
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
	          assignmentId: body.assignmentId || getActiveAssignmentId(),
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
          assignmentId: body.assignmentId || getActiveAssignmentId(),
          workerRunId: workerIngestMatch[1]
        });
        sendJson(response, 200, { workerRun: compactWorkerRunForApi(workerRun) });
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
        assignmentId: body.assignmentId || getActiveAssignmentId(),
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
      const assignmentId = body.assignmentId || getActiveAssignmentId();
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
        workflowState: workflowService.getWorkflowState(assignmentId)
      });
      return;
    }

    const evidenceMatch = url.pathname.match(/^\/api\/assignments\/([^/]+)\/evidence$/);
    if (request.method === 'GET' && evidenceMatch) {
      sendJson(response, 200, compactEvidenceForApi(collectEvidence(evidenceMatch[1])));
      return;
    }

    const agentContractMatch = url.pathname.match(/^\/api\/assignments\/([^/]+)\/agent-contract$/);
    if (request.method === 'GET' && agentContractMatch) {
      const assignmentId = agentContractMatch[1];
      const currentContract = await buildCurrentAgentContract(assignmentId);
      sendJson(response, 200, {
        ...currentContract.contract,
        projectContractSelection: currentContract.projectContractSelection
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/monitoring/ai-usage') {
      const events = aiUsageRepository.list().map(hydrateAiUsageEvent);
      sendJson(response, 200, { summary: summarizeUsage(events), events });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/monitoring/error-log') {
      sendJson(response, 200, buildMonitoringErrorLog({
        assignmentId: url.searchParams.get('assignmentId') || getActiveAssignmentId()
      }));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/validation/runs') {
      const assignmentId = url.searchParams.get('assignmentId') || getActiveAssignmentId();
      sendJson(response, 200, { assignmentId, runs: listValidationRuns(10, assignmentId) });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/validation/ui-smoke') {
      const body = await readBody(request);
      const result = await runUiSmokeScript({
        assignmentId: body.assignmentId || getActiveAssignmentId(),
        expectedIssue: body.expectedIssue || ''
      });
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/project-contracts') {
      const assignmentId = url.searchParams.get('assignmentId') || '';
      sendJson(response, 200, {
        assignmentId: assignmentId || null,
        contracts: projectContractService.listContracts({ assignmentId })
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/project-contracts') {
      const body = await readBody(request);
      const contract = projectContractService.saveContract({
        ...body,
        assignmentId: body.assignmentId ?? getActiveAssignmentId()
      });
      sendJson(response, 200, { contract });
      return;
    }

    const projectContractMatch = url.pathname.match(/^\/api\/project-contracts\/([^/]+)$/);
    if (request.method === 'GET' && projectContractMatch) {
      const contractId = decodeURIComponent(projectContractMatch[1]);
      const contract = projectContractService.getContract(contractId);
      if (!contract) {
        sendJson(response, 404, { error: 'Project contract not found.', contractId });
        return;
      }
      sendJson(response, 200, { contract });
      return;
    }

    const projectContractReadinessMatch = url.pathname.match(/^\/api\/project-contracts\/([^/]+)\/readiness$/);
    if (request.method === 'POST' && projectContractReadinessMatch) {
      const contractId = decodeURIComponent(projectContractReadinessMatch[1]);
      const readiness = await projectContractService.buildReadiness(contractId);
      if (!readiness) {
        sendJson(response, 404, { error: 'Project contract not found.', contractId });
        return;
      }
      sendJson(response, 200, { readiness });
      return;
    }

    const projectContractHandoffMatch = url.pathname.match(/^\/api\/project-contracts\/([^/]+)\/handoff$/);
    if (request.method === 'POST' && projectContractHandoffMatch) {
      const contractId = decodeURIComponent(projectContractHandoffMatch[1]);
      const result = await projectContractService.buildHandoff(contractId);
      if (!result) {
        sendJson(response, 404, { error: 'Project contract not found.', contractId });
        return;
      }
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/settings') {
      sendJson(response, 200, getSafeSettingsResponse());
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/settings') {
      const body = await readBody(request);
      try {
        sendJson(response, 200, settingsService.updateSafeSettings(body.settings || {}));
      } catch (err) {
        sendJson(response, err.statusCode || 400, { error: err.message });
      }
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/runs') {
      const assignmentId = url.searchParams.get('assignmentId') || getActiveAssignmentId();
      sendJson(response, 200, { assignmentId, runs: listRuns({ assignmentId }) });
      return;
    }

    const runEventsMatch = url.pathname.match(/^\/api\/runs\/([^/]+)\/events$/);
    if (request.method === 'GET' && runEventsMatch) {
      const assignmentId = url.searchParams.get('assignmentId') || getActiveAssignmentId();
      const events = runEventRepository.listByRun(runEventsMatch[1]);
      if (assignmentId && events.length && events.some((event) => event.assignmentId !== assignmentId)) {
        sendJson(response, 409, {
          error: 'Requested run does not belong to the active assignment.',
          assignmentId,
          runId: runEventsMatch[1]
        });
        return;
      }
      sendJson(response, 200, { assignmentId, runId: runEventsMatch[1], events });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/connectors') {
      sendJson(response, 200, { connectors: listConnectors(), recentEvents: connectorEventRepository.list() });
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
