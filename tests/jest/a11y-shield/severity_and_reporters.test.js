const { applySeverityPolicy } = require('../../../packages/accessibility-ai-shield/src/utils/severity');
const { normalizeFindings, toMarkdown } = require('../../../packages/accessibility-ai-shield/src/reporters');
const { dedupeFindings } = require('../../../packages/accessibility-ai-shield/src/commands/scan');

describe('accessibility-ai-shield severity/reporting', () => {
  it('applies severity overrides and deduplicates repeated findings', () => {
    const base = [
      {
        ruleId: 'custom/img-alt-required',
        wcagRef: '1.1.1',
        severity: 'warn',
        file: '/tmp/a.jsx',
        line: 10,
        message: 'missing alt',
        suggestedFix: 'add alt'
      },
      {
        ruleId: 'custom/img-alt-required',
        wcagRef: '1.1.1',
        severity: 'warn',
        file: '/tmp/a.jsx',
        line: 10,
        message: 'missing alt',
        suggestedFix: 'add alt'
      }
    ];

    const deduped = dedupeFindings(base);
    expect(deduped).toHaveLength(1);

    const withSeverity = applySeverityPolicy(deduped, {
      severityPolicy: {
        default: 'warn',
        ruleOverrides: { 'custom/img-alt-required': 'blocker' }
      }
    });

    expect(withSeverity[0].severity).toBe('blocker');

    const normalized = normalizeFindings(withSeverity);
    const md = toMarkdown(normalized, {
      mode: 'ci',
      filesScanned: 1,
      standardPrimary: 'Oracle VPAT guidance',
      standardFallback: 'WCAG 2.1 AA'
    });

    expect(md).toContain('Accessibility AI Shield Report');
    expect(md).toContain('Blockers: 1');
    expect(md).toContain('custom/img-alt-required');
  });
});
