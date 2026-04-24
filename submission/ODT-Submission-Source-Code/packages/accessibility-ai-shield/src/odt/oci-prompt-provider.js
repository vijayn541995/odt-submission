const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return `${value}`.trim() || fallback;
}

function resolvePromptProviderConfig(options = {}) {
  const provider = toText(
    options['prompt-provider'] || process.env.ODT_PROMPT_PROVIDER,
    'template'
  ).toLowerCase();

  const ociProfile = toText(options['oci-profile'] || process.env.OCI_CLI_PROFILE || process.env.OCI_PROFILE, '');
  const ociRegion = toText(options['oci-region'] || process.env.OCI_REGION, '');
  const ociEndpoint = toText(options['oci-endpoint'] || process.env.OCI_GENAI_ENDPOINT, '');
  const compartmentId = toText(options['oci-compartment-id'] || process.env.OCI_COMPARTMENT_OCID, '');
  const modelId = toText(options['oci-model-id'] || process.env.OCI_GENAI_MODEL_ID, '');
  const servingType = toText(options['oci-serving-type'] || process.env.OCI_GENAI_SERVING_TYPE, 'ON_DEMAND').toUpperCase();
  const endpointId = toText(options['oci-endpoint-id'] || process.env.OCI_GENAI_ENDPOINT_ID, '');
  const cliPath = toText(options['oci-cli-path'] || process.env.OCI_CLI_PATH, 'oci');
  const requestedSubcommand = toText(options['oci-subcommand'] || process.env.OCI_GENAI_SUBCOMMAND, '');
  const subcommand = requestedSubcommand
    || (servingType === 'DEDICATED' ? 'chat-dedicated-serving-mode' : 'chat-on-demand-serving-mode');

  return {
    provider: provider === 'oci' ? 'oci' : 'template',
    oci: {
      cliPath,
      profile: ociProfile,
      region: ociRegion,
      endpoint: ociEndpoint,
      compartmentId,
      modelId,
      servingType,
      endpointId,
      subcommand,
      maxTokens: toNumber(options['oci-max-tokens'] || process.env.ODT_OCI_MAX_TOKENS, 900),
      temperature: toNumber(options['oci-temperature'] || process.env.ODT_OCI_TEMPERATURE, 0.2),
      topP: toNumber(options['oci-top-p'] || process.env.ODT_OCI_TOP_P, 0.8),
      timeoutMs: toNumber(options['oci-timeout-ms'] || process.env.ODT_OCI_TIMEOUT_MS, 120000),
      maxBufferBytes: toNumber(options['oci-max-buffer'] || process.env.ODT_OCI_MAX_BUFFER, 8 * 1024 * 1024)
    }
  };
}

function ociReadiness(config = {}) {
  const missing = [];
  if (!config.compartmentId) missing.push('OCI_COMPARTMENT_OCID');
  if (
    (config.subcommand === 'chat-on-demand-serving-mode' || config.servingType === 'ON_DEMAND')
    && !config.modelId
  ) {
    missing.push('OCI_GENAI_MODEL_ID');
  }
  if (
    (config.subcommand === 'chat-dedicated-serving-mode' || config.servingType === 'DEDICATED')
    && !config.endpointId
  ) {
    missing.push('OCI_GENAI_ENDPOINT_ID');
  }
  return {
    ready: missing.length === 0,
    missing
  };
}

function buildServingMode(config = {}) {
  if (config.servingType === 'DEDICATED') {
    return {
      servingType: 'DEDICATED',
      endpointId: config.endpointId
    };
  }
  return {
    servingType: 'ON_DEMAND',
    modelId: config.modelId
  };
}

function buildChatRequest(prompt, config = {}) {
  return {
    apiFormat: 'GENERIC',
    messages: [
      {
        role: 'USER',
        content: [
          {
            type: 'TEXT',
            text: prompt
          }
        ]
      }
    ],
    maxTokens: Math.max(256, Number(config.maxTokens || 900)),
    temperature: Math.max(0, Number(config.temperature || 0)),
    topP: Math.max(0.1, Number(config.topP || 0.8))
  };
}

function getPath(obj, path) {
  return path.reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function collectStrings(value, out = []) {
  if (typeof value === 'string') {
    const text = value.trim();
    if (text) out.push(text);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, out));
    return out;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, out));
  }
  return out;
}

function extractPromptText(payload) {
  const directPaths = [
    ['data', 'chatResponse', 'choices', 0, 'message', 'content', 0, 'text'],
    ['data', 'chatResponse', 'choices', 0, 'text'],
    ['data', 'chatResponse', 'text'],
    ['data', 'outputText'],
    ['data', 'generatedText'],
    ['message', 'content', 0, 'text'],
    ['text']
  ];

  for (let i = 0; i < directPaths.length; i += 1) {
    const candidate = getPath(payload, directPaths[i]);
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  const strings = collectStrings(payload).filter((item) => item.length > 30);
  if (!strings.length) return '';
  strings.sort((a, b) => b.length - a.length);
  return strings[0];
}

async function generatePromptWithOci({ prompt, stageKey, config }) {
  const readiness = ociReadiness(config);
  if (!readiness.ready) {
    return {
      ok: false,
      provider: 'oci',
      stageKey,
      error: `Missing OCI config: ${readiness.missing.join(', ')}.`,
      missing: readiness.missing,
      latencyMs: 0,
      modelId: config.modelId || config.endpointId || ''
    };
  }

  const subcommand = config.subcommand || 'chat-on-demand-serving-mode';
  const args = [
    'generative-ai-inference',
    'chat-result',
    subcommand,
    '--compartment-id',
    config.compartmentId,
    '--chat-request',
    JSON.stringify(buildChatRequest(prompt, config)),
    '--output',
    'json'
  ];

  if (subcommand === 'chat-on-demand-serving-mode') {
    args.push('--serving-mode-model-id', config.modelId);
  } else if (subcommand === 'chat-dedicated-serving-mode') {
    args.push('--serving-mode-endpoint-id', config.endpointId);
  } else if (subcommand === 'chat-cohere-chat-request') {
    args.splice(args.indexOf('--chat-request'), 2);
    args.push('--chat-request-message', prompt);
    args.push('--serving-mode', JSON.stringify(buildServingMode(config)));
  } else {
    args.push('--serving-mode', JSON.stringify(buildServingMode(config)));
  }

  if (config.profile) args.push('--profile', config.profile);
  if (config.region) args.push('--region', config.region);
  if (config.endpoint) args.push('--endpoint', config.endpoint);

  const startedAt = Date.now();
  try {
    const { stdout, stderr } = await execFileAsync(config.cliPath || 'oci', args, {
      timeout: config.timeoutMs || 120000,
      maxBuffer: config.maxBufferBytes || (8 * 1024 * 1024)
    });
    const latencyMs = Date.now() - startedAt;
    const parsed = stdout ? JSON.parse(stdout) : {};
    const text = extractPromptText(parsed);
    if (!text) {
      return {
        ok: false,
        provider: 'oci',
        stageKey,
        error: 'OCI response did not contain prompt text.',
        latencyMs,
        modelId: config.modelId || config.endpointId || '',
        raw: parsed,
        stderr: stderr || ''
      };
    }
    return {
      ok: true,
      provider: 'oci',
      stageKey,
      text,
      latencyMs,
      modelId: config.modelId || config.endpointId || '',
      raw: parsed,
      stderr: stderr || ''
    };
  } catch (error) {
    return {
      ok: false,
      provider: 'oci',
      stageKey,
      error: error && error.message ? error.message : 'OCI command failed.',
      latencyMs: Date.now() - startedAt,
      modelId: config.modelId || config.endpointId || '',
      stderr: error && error.stderr ? `${error.stderr}` : '',
      stdout: error && error.stdout ? `${error.stdout}` : ''
    };
  }
}

module.exports = {
  resolvePromptProviderConfig,
  generatePromptWithOci
};
