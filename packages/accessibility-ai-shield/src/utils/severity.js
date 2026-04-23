function applySeverityPolicy(findings, config) {
  const overrides = (config.severityPolicy && config.severityPolicy.ruleOverrides) || {};
  const fallback = (config.severityPolicy && config.severityPolicy.default) || 'warn';

  return findings.map((finding) => ({
    ...finding,
    severity: overrides[finding.ruleId] || finding.severity || fallback
  }));
}

module.exports = { applySeverityPolicy };
