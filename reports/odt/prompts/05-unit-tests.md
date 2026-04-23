# ODT Prompt Contract - 05-unit-tests

Stage: Unit Tests

## Inputs (exact files)
- reports/dev-twin/unit-test-workpack.md (required): Test guidance for impacted behavior.
- reports/dev-twin/impact-analysis.json (required): Related source and test file context.

## Task
- Create deterministic test matrix for happy, edge, error, and keyboard-accessibility paths.
- Add anti-flake guidance for stable CI behavior.

## Output Contract
- Write: reports/dev-twin/unit-test-workpack.md
- Format: markdown
- Schema:
```json
{
  "includes": [
    "happy path",
    "edge path",
    "error path",
    "keyboard assertions"
  ]
}
```
- Write: reports/odt/unit-test-matrix.md
- Format: markdown
- Schema:
```json
{
  "columns": [
    "Scenario",
    "Coverage type",
    "Expected assertion",
    "Flake risk",
    "Mitigation"
  ]
}
```

## Quality Gates (senior developer checks)
- No snapshot-only strategy for behavior-critical paths.
- Keyboard and ARIA assertions are present for interactive UI.
- Anti-flake mitigations are documented.

## Stop Conditions (pause and ask human)
- No stable assertion strategy for async behavior.
- Critical user journey lacks testability due to ambiguity.

