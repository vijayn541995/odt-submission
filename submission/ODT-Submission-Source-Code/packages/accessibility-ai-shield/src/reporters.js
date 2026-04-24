const path = require('path');

function toRelativePath(file) {
  const cwd = process.cwd();
  return file.startsWith(cwd) ? path.relative(cwd, file) : file;
}

function normalizeFindings(findings) {
  return findings
    .map((finding) => ({ ...finding, file: toRelativePath(finding.file) }))
    .sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'blocker' ? -1 : 1;
      }
      if (a.file !== b.file) return a.file.localeCompare(b.file);
      return a.line - b.line;
    });
}

function toMarkdown(findings, metadata) {
  const blockers = findings.filter((f) => f.severity === 'blocker').length;
  const warns = findings.filter((f) => f.severity === 'warn').length;
  const infos = findings.filter((f) => f.severity === 'info').length;

  const header = [
    '# Accessibility AI Shield Report',
    '',
    `- Standard: ${metadata.standardPrimary} (fallback: ${metadata.standardFallback})`,
    `- Mode: ${metadata.mode}`,
    `- Files Scanned: ${metadata.filesScanned}`,
    `- Blockers: ${blockers}`,
    `- Warnings: ${warns}`,
    `- Info: ${infos}`,
    ''
  ];

  const table = [
    '| Severity | Priority | Criterion | Rule | WCAG | File | Line | Message | Suggested Fix |',
    '| --- | --- | --- | --- | --- | --- | ---: | --- | --- |'
  ];

  const rows = findings.length
    ? findings.map((f) => `| ${f.severity} | ${f.policyPriority || '-'} | ${f.policyCriterion || '-'} | ${f.ruleId} | ${f.wcagRef} | ${f.file} | ${f.line} | ${sanitize(f.message)} | ${sanitize(f.suggestedFix)} |`)
    : ['| info | - | - | none | - | - | - | No issues found | - |'];

  return [...header, ...table, ...rows, ''].join('\n');
}

function sanitize(text) {
  return `${text || ''}`.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

module.exports = {
  normalizeFindings,
  toMarkdown
};
