const fs = require('fs');
const path = require('path');
const { FINDINGS_JSON } = require('../constants');
const { readJson } = require('../utils/fs');

function resolveInputPath(inputPath) {
  const candidate = inputPath || FINDINGS_JSON;
  return path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
}

function severityWeight(severity) {
  if (severity === 'blocker') return 100;
  if (severity === 'warn') return 40;
  return 10;
}

function loadFindingsPayload(inputPath) {
  const resolvedPath = resolveInputPath(inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`findings.json not found at ${resolvedPath}. Run scan first.`);
  }
  return readJson(resolvedPath);
}

function buildIndexes(findings) {
  const byRule = {};
  const byFile = {};

  findings.forEach((finding) => {
    byRule[finding.ruleId] = (byRule[finding.ruleId] || 0) + 1;
    byFile[finding.file] = (byFile[finding.file] || 0) + 1;
  });

  return { byRule, byFile };
}

function parseFindings(inputPath) {
  const payload = loadFindingsPayload(inputPath);
  const findings = payload.findings || [];
  const indexes = buildIndexes(findings);
  const blockers = findings.filter((finding) => finding.severity === 'blocker').length;
  const warnings = findings.filter((finding) => finding.severity === 'warn').length;
  const infos = findings.filter((finding) => finding.severity === 'info').length;

  return {
    payload,
    findings,
    summary: {
      blockers,
      warnings,
      infos,
      total: findings.length
    },
    indexes,
    scoreInputs: {
      severityWeight
    }
  };
}

module.exports = {
  parseFindings,
  severityWeight
};
