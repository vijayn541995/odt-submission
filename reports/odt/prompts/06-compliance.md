# ODT Prompt Contract - 06-compliance

Stage: VPAT/WCAG Compliance

## Inputs (exact files)
- reports/a11y/findings.json (required): Raw accessibility findings from scans.
- reports/a11y/coding-agent-prompt.md (optional): A11y remediation instructions if generated.

## Task
- Map findings to VPAT/WCAG and keyboard accessibility obligations.
- Prioritize remediations by blocker impact and implementation risk.

## Output Contract
- Write: reports/odt/compliance-mapping.md
- Format: markdown
- Schema:
```json
{
  "sections": [
    "VPAT/WCAG mapping",
    "Keyboard gaps",
    "Remediation priority",
    "Residual risk"
  ]
}
```
- Write: reports/a11y/coding-agent-prompt.md
- Format: markdown
- Schema:
```json
{
  "includes": [
    "safe fixes",
    "keyboard parity",
    "semantic guidance"
  ]
}
```

## Quality Gates (senior developer checks)
- Top rule classes are mapped to actionable guidance.
- Keyboard gaps are explicit.
- Priority order is risk-based and explainable.

## Stop Conditions (pause and ask human)
- A11y findings are unavailable for current run.
- Compliance mapping cannot determine actionable priority.

