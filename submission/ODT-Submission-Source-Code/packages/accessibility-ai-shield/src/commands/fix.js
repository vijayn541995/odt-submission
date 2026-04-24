const path = require('path');
const { readJson, writeFile } = require('../utils/fs');
const {
  FINDINGS_JSON,
  PATCH_PREVIEW_MD,
  CODING_AGENT_PROMPT_MD,
  CLINE_PROMPT_MD
} = require('../constants');

function buildPatchPreview(findings) {
  const lines = [
    '# Accessibility AI Shield Patch Preview',
    '',
    'This preview lists suggested edits for manual developer review before apply.',
    ''
  ];

  if (!findings.length) {
    lines.push('No findings were detected. No patch preview generated.');
    lines.push('');
    return lines.join('\n');
  }

  findings.forEach((finding, index) => {
    lines.push(`## ${index + 1}. ${finding.ruleId}`);
    lines.push(`- Severity: ${finding.severity}`);
    lines.push(`- WCAG: ${finding.wcagRef}`);
    lines.push(`- File: ${finding.file}:${finding.line}`);
    lines.push(`- Issue: ${finding.message}`);
    lines.push(`- Suggested fix: ${finding.suggestedFix}`);
    lines.push('');
  });

  return lines.join('\n');
}

function buildCodingAgentPrompt(payloadOrFindings, mode) {
  const payload = Array.isArray(payloadOrFindings)
    ? { metadata: {}, summary: {}, findings: payloadOrFindings }
    : (payloadOrFindings || { metadata: {}, summary: {}, findings: [] });
  const metadata = payload.metadata || {};
  const findings = payload.findings || [];
  const summary = payload.summary || {};
  const fileList = [...new Set(findings.map((f) => f.file))].sort();
  const standardPrimary = metadata.standardPrimary || 'Oracle VPAT guidance';
  const standardFallback = metadata.standardFallback || 'WCAG 2.1 AA';
  const lines = [
    '# Coding Agent Prompt: Accessibility AI Shield (React + Terra)',
    '',
    `Mode: ${mode || 'preview'}`,
    '',
    'You are an accessibility specialist for React + Terra. Apply only safe fixes for the findings below.',
    'Constraints:',
    `- Follow ${standardPrimary} first, fallback ${standardFallback}.`,
    '- Do not auto-commit.',
    '- Keep behavior unchanged except accessibility fixes.',
    '- If a fix is ambiguous, leave a manual-action note.',
    '',
    'Scan context:',
    `- Files scanned: ${metadata.filesScanned || 0}`,
    `- Blockers: ${summary.blocker || 0}`,
    `- Warnings: ${summary.warn || 0}`,
    `- Info: ${summary.info || 0}`,
    metadata.policySource && metadata.policySource.notes
      ? `- Policy basis: ${metadata.policySource.name || 'Oracle VPAT policy'} (${metadata.policySource.notes})`
      : '- Policy basis: Oracle VPAT guidance and manual review evidence',
    '',
    'Manual verification references:',
    '- reports/a11y/manual-checklist.md',
    '- reports/odt/compliance-mapping.md',
    '',
    'Files in scope:',
    ...(fileList.length ? fileList.map((file) => `- ${file}`) : ['- No file-specific findings in the latest scan.']),
    '',
    ...(findings.length
      ? [
        'Findings payload (verbatim):',
        '```json',
        JSON.stringify(findings, null, 2),
        '```',
        ''
      ]
      : [
        'Current posture:',
        '- No actionable static findings were detected in the latest scan.',
        '- Continue Oracle VPAT manual evidence checks for focus order, keyboard traps, page title, language, contrast, and other checklist items.',
        '- Preserve keyboard parity, semantic structure, labels/instructions, and name/role/value behavior for any new or changed UI.',
        ''
      ])
  ];

  return lines.join('\n');
}

async function runFix(options) {
  const input = options.input || FINDINGS_JSON;
  const mode = options.mode || 'preview';
  const payload = readJson(path.resolve(process.cwd(), input));
  const findings = payload.findings || [];

  writeFile(path.resolve(process.cwd(), PATCH_PREVIEW_MD), buildPatchPreview(findings));
  const prompt = buildCodingAgentPrompt(payload, mode);
  writeFile(path.resolve(process.cwd(), CODING_AGENT_PROMPT_MD), prompt);
  // Backward-compatible alias for previous integrations.
  writeFile(path.resolve(process.cwd(), CLINE_PROMPT_MD), prompt);

  // eslint-disable-next-line no-console
  console.log(`Fix preview generated for ${findings.length} finding(s).`);
  // eslint-disable-next-line no-console
  console.log(`- ${PATCH_PREVIEW_MD}`);
  // eslint-disable-next-line no-console
  console.log(`- ${CODING_AGENT_PROMPT_MD}`);
}

module.exports = {
  runFix,
  buildPatchPreview,
  buildCodingAgentPrompt,
  buildClinePrompt: buildCodingAgentPrompt
};
