const path = require('path');
const { loadConfig } = require('../config');
const { listChangedFiles, listAllSourceFiles, filterExcluded } = require('../utils/targets');
const { runCustomRuleScan } = require('../scanners/custom-rules');
const { runEslintScan } = require('../scanners/eslint-scan');
const { applySeverityPolicy } = require('../utils/severity');
const { normalizeFindings, toMarkdown } = require('../reporters');
const { writeFile, ensureDir } = require('../utils/fs');
const { OUTPUT_DIR, FINDINGS_JSON, FINDINGS_MD, MANUAL_CHECKLIST_MD } = require('../constants');
const { enrichFindingWithPolicy, buildManualChecklistMarkdown, policy } = require('../policy');

function dedupeFindings(findings) {
  const map = new Map();
  findings.forEach((finding) => {
    const key = [finding.ruleId, finding.file, finding.line, finding.message].join('::');
    if (!map.has(key)) map.set(key, finding);
  });
  return [...map.values()];
}

function summarize(findings) {
  return {
    blocker: findings.filter((f) => f.severity === 'blocker').length,
    warn: findings.filter((f) => f.severity === 'warn').length,
    info: findings.filter((f) => f.severity === 'info').length,
    total: findings.length
  };
}

async function runScan(options) {
  const config = loadConfig();
  const mode = options.full || options.ci ? 'ci' : 'local';
  const scanRoot = options.scanRoot || options['scan-root'] || process.cwd();
  const files = filterExcluded(
    options.full || options.ci ? listAllSourceFiles(scanRoot) : listChangedFiles(scanRoot),
    config
  );

  ensureDir(path.resolve(process.cwd(), OUTPUT_DIR));

  const custom = runCustomRuleScan(files);
  const eslint = runEslintScan(files);

  const withPolicy = dedupeFindings([...custom, ...eslint]).map((finding) => enrichFindingWithPolicy(finding));
  const all = applySeverityPolicy(withPolicy, config);
  const findings = normalizeFindings(all);
  const summary = summarize(findings);

  const payload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      mode,
      scanRoot,
      filesScanned: files.length,
      standardPrimary: config.standard.primary,
      standardFallback: config.standard.fallback,
      policySource: policy.source
    },
    summary,
    findings
  };

  writeFile(path.resolve(process.cwd(), FINDINGS_JSON), `${JSON.stringify(payload, null, 2)}\n`);
  writeFile(
    path.resolve(process.cwd(), FINDINGS_MD),
    toMarkdown(findings, {
      mode,
      filesScanned: files.length,
      standardPrimary: config.standard.primary,
      standardFallback: config.standard.fallback
    })
  );
  writeFile(path.resolve(process.cwd(), MANUAL_CHECKLIST_MD), buildManualChecklistMarkdown());

  // eslint-disable-next-line no-console
  console.log(`A11y scan complete. files=${files.length} blockers=${summary.blocker} warnings=${summary.warn} info=${summary.info}`);

  if (options.ci && summary.blocker > 0) {
    throw new Error(`Accessibility blocker threshold exceeded: ${summary.blocker} blocker issue(s) found.`);
  }

  return payload;
}

module.exports = { runScan, summarize, dedupeFindings };
