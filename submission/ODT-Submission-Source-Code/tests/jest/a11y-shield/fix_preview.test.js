const { buildPatchPreview, buildClinePrompt } = require('../../../packages/accessibility-ai-shield/src/commands/fix');

describe('accessibility-ai-shield fix preview', () => {
  it('builds deterministic preview and prompt', () => {
    const findings = [
      {
        ruleId: 'custom/button-accessible-name',
        wcagRef: '4.1.2',
        severity: 'blocker',
        file: 'src/example.jsx',
        line: 18,
        message: 'Button has no accessible name',
        suggestedFix: 'Add aria-label'
      }
    ];

    const preview = buildPatchPreview(findings);
    const prompt = buildClinePrompt(findings, 'preview');

    expect(preview).toContain('custom/button-accessible-name');
    expect(preview).toContain('src/example.jsx:18');
    expect(prompt).toContain('Accessibility AI Shield (React + Terra)');
    expect(prompt).toContain('Follow Oracle VPAT guidance first');
  });
});
