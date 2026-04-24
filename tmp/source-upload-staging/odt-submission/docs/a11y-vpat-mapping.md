# Accessibility AI Shield VPAT Mapping (Oracle + WCAG)

This document is the team reference for how Accessibility AI Shield maps findings to Oracle VPAT guidance and WCAG fallback criteria.

## How to Use This File

1. Add/update Oracle internal VPAT/Confluence links in the table below.
2. Keep severity mapping aligned with `.a11y-shieldrc.js`.
3. Treat Oracle VPAT guidance as primary and WCAG 2.1 AA as fallback.
4. Review this mapping when adding new custom rules.

## Developer Update Workflow

Use this workflow whenever Oracle internal accessibility guidance changes:

1. Open the latest Oracle internal accessibility / VPAT Confluence source of truth.
2. Update the `Oracle VPAT Reference` column in this file with the current internal section names or links.
3. Sync any policy changes into `packages/accessibility-ai-shield/src/policy/oracle-vpat-policy.json`.
4. Re-run ODT with accessibility enabled so the refreshed policy is reflected in compliance artifacts.
5. Review generated findings and compliance output before delegating code changes.

## Rule Mapping

| Rule ID | Scanner Source | Oracle VPAT Reference | WCAG Reference | Default Severity | Notes |
| --- | --- | --- | --- | --- | --- |
| `custom/img-alt-required` | Custom React/Terra rule | TODO: Add internal Confluence URL/section | 1.1.1 | blocker | Missing alt text for non-decorative images. |
| `custom/button-accessible-name` | Custom React/Terra rule | TODO | 4.1.2 | blocker | Button needs accessible name via text/aria-label. |
| `custom/form-control-label` | Custom React/Terra rule | TODO | 1.3.1 | blocker | Input/select/textarea must have label association or aria naming. |
| `custom/click-keyboard-parity` | Custom React/Terra rule | TODO | 2.1.1 | blocker | Non-semantic click targets need keyboard support. |
| `custom/icon-a11y-label` | Custom React/Terra rule | TODO | 1.1.1 | warn | Terra icon accessibility label requirement for functional icons. |
| `jsx-a11y/alt-text` | ESLint jsx-a11y | TODO | 1.1.1 | blocker | Lint-based alt text coverage. |
| `jsx-a11y/label-has-associated-control` | ESLint jsx-a11y | TODO | 1.3.1 | blocker | Label-control association. |
| `jsx-a11y/control-has-associated-label` | ESLint jsx-a11y | TODO | 1.3.1 | blocker | Programmatic name requirement. |
| `jsx-a11y/no-static-element-interactions` | ESLint jsx-a11y | TODO | 2.1.1 | blocker | Static element interaction semantics. |
| `jsx-a11y/click-events-have-key-events` | ESLint jsx-a11y | TODO | 2.1.1 | blocker | Click parity keyboard events. |
| `jsx-a11y/anchor-is-valid` | ESLint jsx-a11y | TODO | 2.4.4 | warn | Anchor validity and navigation semantics. |

## Oracle Priority Baseline (from internal minimums list)

Critical (release blockers):

1. `2.3.1` Three flashes
2. `2.1.2` No keyboard trap
3. `1.4.2` Audio control
4. `2.2.2` Pause, Stop, Hide

High:

1. `2.1.1` Keyboard accessibility
2. `1.1.1` Non-text alternatives
3. `1.3.1` Info and relationships
4. `4.1.2` Name, role, value
5. `3.3.2` Labels/instructions
6. `2.4.3` Focus order
7. `1.3.2` Meaningful sequence

## Governance

1. Keep `blocker` reserved for high-impact accessibility issues that should fail CI.
2. Use `warn` for advisory issues where context-specific review is needed.
3. Revisit severity levels after each sprint if false positives are recurring.

## Related Files

1. `.a11y-shieldrc.js`
2. `packages/accessibility-ai-shield/src/scanners/custom-rules.js`
3. `packages/accessibility-ai-shield/src/scanners/eslint-scan.js`
4. `reports/a11y/findings.json` and `reports/a11y/findings.md`
