const path = require('path');
const { runCustomRuleScan } = require('../../../packages/accessibility-ai-shield/src/scanners/custom-rules');

describe('accessibility-ai-shield custom rules', () => {
  it('flags missing alt text, keyboard parity, form labels, and icon labels', () => {
    const fixture = path.resolve(__dirname, 'fixtures/terra_bad.jsx');
    const findings = runCustomRuleScan([fixture]);
    const ids = findings.map((f) => f.ruleId);

    expect(ids).toContain('custom/img-alt-required');
    expect(ids).toContain('custom/click-keyboard-parity');
    expect(ids).toContain('custom/form-control-label');
    expect(ids).toContain('custom/icon-a11y-label');
  });
});
