# ODT Prompt Contract - 04-code

Stage: Code Workpack

## Inputs (exact files)
- reports/dev-twin/code-workpack.md (required): Implementation guidance from Dev Twin.
- reports/odt/tech-design.md (required): Design constraints and quality gates.
- reports/dev-twin/impact-analysis.json (required): Impacted files and module evidence.

## Task
- Generate file-scoped patch intent and dependency policy checks before coding.
- Require backward compatibility and minimal blast-radius edits.

## Output Contract
- Write: reports/dev-twin/code-workpack.md
- Format: markdown
- Schema:
```json
{
  "includes": [
    "execution steps",
    "quality gates",
    "repo-analysis evidence"
  ]
}
```
- Write: reports/odt/code-patch-plan.md
- Format: markdown
- Schema:
```json
{
  "sections": [
    "File-by-file intent",
    "Dependency policy checks",
    "Regression watchpoints"
  ]
}
```

## Quality Gates (senior developer checks)
- Every candidate file has a clear edit intent.
- Dependency policy checks are explicit.
- Backward compatibility is validated before implementation.

## Stop Conditions (pause and ask human)
- Patch intent cannot be mapped to candidate files.
- Requested behavior requires out-of-scope architecture changes.

