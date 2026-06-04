import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = dirname(__dirname);
const dataDir = join(appRoot, 'data');
const dbPath = join(dataDir, 'odt-workbench.sqlite');
const port = Number(process.env.ODT_WORKBENCH_API_PORT || 5180);
const odtApiBase = process.env.ODT_API_BASE || 'http://127.0.0.1:4310';
const aiConfig = {
  provider: process.env.ODT_AI_PROVIDER || 'local-guide',
  region: process.env.OCI_REGION || '',
  genAiEndpoint: process.env.OCI_GENAI_ENDPOINT || '',
  compartmentId: process.env.OCI_COMPARTMENT_ID || '',
  chatModelId: process.env.OCI_GENAI_CHAT_MODEL_ID || '',
  embedModelId: process.env.OCI_GENAI_EMBED_MODEL_ID || '',
  authMode: process.env.OCI_AUTH_MODE || 'config',
  configProfile: process.env.OCI_CONFIG_PROFILE || '',
  agentEndpoint: process.env.OCI_GENAI_AGENT_ENDPOINT || '',
  ragEnabled: process.env.ODT_RAG_ENABLED === 'true',
  vectorStore: process.env.ODT_VECTOR_STORE || 'disabled',
  limits: {
    maxRequestsPerMinute: Number(process.env.ODT_AI_MAX_REQUESTS_PER_MINUTE || 30),
    maxRequestsPerUserPerDay: Number(process.env.ODT_AI_MAX_REQUESTS_PER_USER_PER_DAY || 300),
    maxInputChars: Number(process.env.ODT_AI_MAX_INPUT_CHARS || 12000),
    maxOutputTokens: Number(process.env.ODT_AI_MAX_OUTPUT_TOKENS || 1200),
    requestTimeoutMs: Number(process.env.ODT_AI_REQUEST_TIMEOUT_MS || 45000),
    retryCount: Number(process.env.ODT_AI_RETRY_COUNT || 1)
  }
};

mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    requirement TEXT NOT NULL,
    repo_path TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    assignment_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agent_events (
    id TEXT PRIMARY KEY,
    assignment_id TEXT,
    agent_id TEXT,
    event_type TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_usage_events (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    request_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    input_chars INTEGER NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    created_at TEXT NOT NULL
  );
`);

const insertChat = db.prepare(`
  INSERT INTO chat_messages (id, assignment_id, role, content, created_at)
  VALUES (?, ?, ?, ?, ?)
`);
const selectChat = db.prepare(`
  SELECT id, assignment_id AS assignmentId, role, content, created_at AS createdAt
  FROM chat_messages
  ORDER BY created_at ASC
  LIMIT 200
`);
const insertAssignment = db.prepare(`
  INSERT INTO assignments (id, title, requirement, repo_path, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const selectAssignments = db.prepare(`
  SELECT id, title, requirement, repo_path AS repoPath, status, created_at AS createdAt, updated_at AS updatedAt
  FROM assignments
  ORDER BY updated_at DESC
  LIMIT 50
`);
const insertAiUsage = db.prepare(`
  INSERT INTO ai_usage_events (
    id, session_id, request_type, provider, model, input_chars, prompt_tokens,
    completion_tokens, total_tokens, latency_ms, status, error, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const selectAiUsage = db.prepare(`
  SELECT id, session_id AS sessionId, request_type AS requestType, provider, model,
    input_chars AS inputChars, prompt_tokens AS promptTokens, completion_tokens AS completionTokens,
    total_tokens AS totalTokens, latency_ms AS latencyMs, status, error, created_at AS createdAt
  FROM ai_usage_events
  ORDER BY created_at DESC
  LIMIT 200
`);

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
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
      } catch (error) {
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

async function buildContextSnapshot() {
  const [health, agentic, reviewPacket, contextArtifacts, clarifications, agentStatus] = await Promise.all([
    getOdtJson('/health'),
    getOdtJson('/odt/agentic'),
    getOdtJson('/odt/review-packet'),
    getOdtJson('/odt/context-artifacts'),
    getOdtJson('/odt/clarifications'),
    getOdtJson('/odt/agent/status')
  ]);
  return {
    online: Boolean(health),
    health,
    agentic,
    reviewPacket,
    contextArtifacts,
    clarifications,
    agentStatus
  };
}

function answerGuideQuestion(question, context) {
  const q = String(question || '').toLowerCase();
  const changedFiles = context.reviewPacket?.summary?.changedFiles || 0;
  const openQuestions = context.clarifications?.summary?.open || 0;
  const highQuestions = context.clarifications?.summary?.unresolvedHigh || 0;
  const contextTotal = context.contextArtifacts?.summary?.total || 0;
  const agentStatus = context.agentStatus?.status || 'idle';

  if (!question || !question.trim()) {
    return 'Ask me what to do next, why a run is blocked, how to use ODT, or what changed in the current assignment.';
  }

  if (q.includes('next') || q.includes('what should') || q.includes('start')) {
    if (highQuestions) return `Next: answer the ${highQuestions} high-severity clarification question(s), then continue the assignment. ODT should not delegate while those are open.`;
    if (!changedFiles && agentStatus === 'idle') return 'Next: paste the requirement, confirm the target repo, generate the plan, then approve the first implementation slice before delegation.';
    if (changedFiles) return `Next: open the Review workspace. There are ${changedFiles} changed file(s), so refresh the review packet, run reviewer lanes, then verify before closeout.`;
    return `Next: check the Agent Team page. Current delegated agent status is ${agentStatus}.`;
  }

  if (q.includes('block') || q.includes('stuck') || q.includes('why')) {
    if (!context.online) return 'ODT looks blocked because the local context API is offline. Start the local context server, then refresh this workbench.';
    if (highQuestions) return `Delegation is blocked by ${highQuestions} high-severity clarification question(s). Answer them before launching a developer agent.`;
    return 'No hard blocker is visible in the current snapshot. If an action is disabled, check target repo path, API status, and whether an agent is already running.';
  }

  if (q.includes('file') || q.includes('diff') || q.includes('changed')) {
    if (!changedFiles) return 'No changed files are currently visible in the review packet. After the developer agent edits code, refresh the Review Packet.';
    const files = (context.reviewPacket?.files || []).slice(0, 5).map((file) => file.path).join(', ');
    return `The review packet reports ${changedFiles} changed file(s). First files: ${files || 'not listed'}.`;
  }

  if (q.includes('artifact') || q.includes('mockup') || q.includes('pdf') || q.includes('schema')) {
    return `The Context Vault has ${contextTotal} artifact(s). Use it for mockups, PDFs, spreadsheets, API notes, DB schema snippets, and other inputs that materially affect implementation.`;
  }

  if (q.includes('team') || q.includes('agent')) {
    return 'Use the agent team for larger work: Lead Planner chooses order, Main Developer owns writes, reviewers stay read-only, Build Verifier checks commands, and Merge Arbitrator decides approve, rework, ask-human, or verify.';
  }

  return 'ODT is meant to be a developer/team twin: intake the task, plan with repo context, approve scope, delegate implementation, run parallel review, verify evidence, and close with human diff review.';
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function assertAiInput(input) {
  const text = typeof input === 'string' ? input : JSON.stringify(input || {});
  if (text.length > aiConfig.limits.maxInputChars) {
    throw new Error(`Input exceeds maxInputChars limit of ${aiConfig.limits.maxInputChars}`);
  }
  return text;
}

function recordAiUsage({ sessionId, requestType, model, input, output, latencyMs, status, error }) {
  const promptTokens = estimateTokens(input);
  const completionTokens = estimateTokens(output);
  insertAiUsage.run(
    createId('aiusage'),
    sessionId || null,
    requestType,
    aiConfig.provider,
    model || aiConfig.chatModelId || aiConfig.embedModelId || 'local-guide',
    String(input || '').length,
    promptTokens,
    completionTokens,
    promptTokens + completionTokens,
    latencyMs,
    status,
    error || null,
    new Date().toISOString()
  );
}

function localAiResponse(requestType, body, context) {
  const input = body.input || body.message || body.text || body.prompt || '';
  if (requestType === 'chat') return answerGuideQuestion(input, context);
  if (requestType === 'summarize') return `Summary: ${String(input).slice(0, 700)}${String(input).length > 700 ? '...' : ''}`;
  if (requestType === 'extract-json') {
    return {
      type: 'local_extraction',
      title: String(input).split('\n').find(Boolean)?.slice(0, 120) || 'Untitled',
      signals: ['requirement', 'scope', 'review'],
      needsHumanReview: true
    };
  }
  if (requestType === 'classify') {
    const text = String(input).toLowerCase();
    return {
      category: text.includes('database') || text.includes('schema') ? 'database'
        : text.includes('api') || text.includes('backend') ? 'backend'
          : text.includes('test') ? 'testing'
            : 'application',
      confidence: 0.72
    };
  }
  if (requestType === 'embed') {
    const vector = Array.from({ length: 16 }, (_, index) => {
      const code = String(input).charCodeAt(index % Math.max(1, String(input).length)) || 0;
      return Number(((code % 97) / 97).toFixed(4));
    });
    return { embedding: vector, dimensions: vector.length, provider: 'local-placeholder' };
  }
  if (requestType === 'recommend') {
    return [
      'Keep React frontend isolated from OCI credentials.',
      'Use backend /api/ai endpoints for all AI capabilities.',
      'Require human approval before write/delegate actions.',
      'Record token, latency, model, error, and request-type metrics.'
    ];
  }
  return 'Unsupported local AI request type.';
}

async function handleAiRequest(response, requestType, body) {
  const startedAt = Date.now();
  const context = await buildContextSnapshot();
  const input = assertAiInput(body.input || body.message || body.text || body.prompt || body);
  let output;
  try {
    output = localAiResponse(requestType, body, context);
    const serialized = typeof output === 'string' ? output : JSON.stringify(output);
    recordAiUsage({
      sessionId: body.sessionId,
      requestType,
      input,
      output: serialized,
      latencyMs: Date.now() - startedAt,
      status: 'ok'
    });
    sendJson(response, 200, {
      provider: aiConfig.provider,
      model: requestType === 'embed' ? aiConfig.embedModelId || 'local-placeholder' : aiConfig.chatModelId || 'local-guide',
      requestType,
      output,
      usage: {
        promptTokens: estimateTokens(input),
        completionTokens: estimateTokens(serialized),
        totalTokens: estimateTokens(input) + estimateTokens(serialized),
        latencyMs: Date.now() - startedAt
      },
      note: aiConfig.provider === 'local-guide'
        ? 'Local fallback response. Configure backend OCI environment variables to enable OCI GenAI.'
        : 'Provider adapter placeholder ready for OCI GenAI integration.'
    });
  } catch (error) {
    recordAiUsage({
      sessionId: body.sessionId,
      requestType,
      input,
      output: '',
      latencyMs: Date.now() - startedAt,
      status: 'error',
      error: error.message
    });
    throw error;
  }
}

function buildOpenApiSchema() {
  const aiOperation = (operationId, summary, description) => ({
    operationId,
    summary,
    description,
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              input: { type: 'string', description: 'Text, requirement, code, or context for the AI capability.' },
              sessionId: { type: 'string', description: 'Optional session identifier for monitoring and conversation grouping.' }
            },
            required: ['input']
          }
        }
      }
    },
    responses: {
      200: {
        description: 'AI capability result with usage metadata.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                provider: { type: 'string', description: 'Configured AI provider.' },
                model: { type: 'string', description: 'Configured model identifier.' },
                requestType: { type: 'string', description: 'AI capability request type.' },
                output: { description: 'Capability-specific result.' },
                usage: { type: 'object', description: 'Token, latency, and request metrics.' }
              }
            }
          }
        }
      }
    }
  });

  return {
    openapi: '3.0.3',
    info: {
      title: 'ODT Workbench API',
      version: '0.1.0',
      description: 'Backend-only API surface for Oracle Developer Twin workbench, AI capabilities, monitoring, and agent tool calling.'
    },
    servers: [{ url: `http://127.0.0.1:${port}`, description: 'Local ODT Workbench API' }],
    paths: {
      '/api/health': {
        get: {
          operationId: 'getWorkbenchHealth',
          summary: 'Get workbench health',
          description: 'Returns local workbench API health, SQLite path, and ODT API connectivity.',
          responses: { 200: { description: 'Workbench health response.' } }
        }
      },
      '/api/snapshot': {
        get: {
          operationId: 'getOdtSnapshot',
          summary: 'Get live ODT snapshot',
          description: 'Returns available ODT local context data for agent guidance and UI rendering.',
          responses: { 200: { description: 'ODT snapshot response.' } }
        }
      },
      '/api/ai/chat': { post: aiOperation('aiChat', 'Chat with ODT Guide', 'Answers ODT usage, current-run, and next-step questions.') },
      '/api/ai/summarize': { post: aiOperation('aiSummarize', 'Summarize input', 'Summarizes requirements, review packets, logs, or artifacts.') },
      '/api/ai/extract-json': { post: aiOperation('aiExtractJson', 'Extract structured JSON', 'Extracts structured fields from unstructured task or document text.') },
      '/api/ai/classify': { post: aiOperation('aiClassify', 'Classify work item', 'Classifies task type, risk, layer, or review category.') },
      '/api/ai/embed': { post: aiOperation('aiEmbed', 'Create embedding', 'Creates embeddings for semantic search or future Oracle DB vector RAG.') },
      '/api/ai/recommend': { post: aiOperation('aiRecommend', 'Recommend next actions', 'Generates safe recommendations for implementation, review, or verification.') },
      '/api/monitoring/ai-usage': {
        get: {
          operationId: 'listAiUsageEvents',
          summary: 'List AI usage events',
          description: 'Returns model, token, latency, error, request type, and session monitoring data.',
          responses: { 200: { description: 'Recent AI usage events.' } }
        }
      }
    }
  };
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      sendJson(response, 200, { ok: true });
      return;
    }

    const url = new URL(request.url || '/', `http://${request.headers.host}`);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      const context = await buildContextSnapshot();
      sendJson(response, 200, {
        ok: true,
        dbPath,
        odtApiBase,
        aiConfig: {
          provider: aiConfig.provider,
          region: aiConfig.region,
          genAiEndpointConfigured: Boolean(aiConfig.genAiEndpoint),
          compartmentConfigured: Boolean(aiConfig.compartmentId),
          chatModelConfigured: Boolean(aiConfig.chatModelId),
          embedModelConfigured: Boolean(aiConfig.embedModelId),
          agentEndpointConfigured: Boolean(aiConfig.agentEndpoint),
          authMode: aiConfig.authMode,
          configProfile: aiConfig.configProfile,
          ragEnabled: aiConfig.ragEnabled,
          vectorStore: aiConfig.vectorStore,
          limits: aiConfig.limits
        },
        odtOnline: context.online,
        generatedAt: new Date().toISOString()
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/snapshot') {
      sendJson(response, 200, await buildContextSnapshot());
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/chat') {
      sendJson(response, 200, { messages: selectChat.all() });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/chat') {
      const body = await readBody(request);
      const question = String(body.message || '').trim();
      const now = new Date().toISOString();
      const userId = createId('msg');
      const assistantId = createId('msg');
      const context = await buildContextSnapshot();
      const answer = answerGuideQuestion(question, context);
      insertChat.run(userId, body.assignmentId || null, 'user', question, now);
      insertChat.run(assistantId, body.assignmentId || null, 'assistant', answer, new Date().toISOString());
      sendJson(response, 200, {
        answer,
        messages: selectChat.all()
      });
      return;
    }

    if (request.method === 'POST' && url.pathname.startsWith('/api/ai/')) {
      const body = await readBody(request);
      const requestType = url.pathname.replace('/api/ai/', '');
      if (!['chat', 'summarize', 'extract-json', 'classify', 'embed', 'recommend'].includes(requestType)) {
        sendJson(response, 404, { error: 'Unsupported AI endpoint' });
        return;
      }
      await handleAiRequest(response, requestType, body);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/monitoring/ai-usage') {
      sendJson(response, 200, { events: selectAiUsage.all() });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/openapi.json') {
      sendJson(response, 200, buildOpenApiSchema());
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/assignments') {
      sendJson(response, 200, { assignments: selectAssignments.all() });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/assignments') {
      const body = await readBody(request);
      const now = new Date().toISOString();
      const id = createId('assignment');
      const title = String(body.title || body.requirement || 'Untitled assignment').slice(0, 120);
      insertAssignment.run(id, title, body.requirement || '', body.repoPath || '', 'draft', now, now);
      sendJson(response, 200, { assignment: selectAssignments.get() });
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`ODT Workbench API listening on http://127.0.0.1:${port}`);
  console.log(`SQLite data: ${dbPath}`);
});
