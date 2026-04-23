# ODT Prompt Contract - 01-intake

Stage: Intake

## Inputs (exact files)
- reports/dev-twin/intake.json (required): Primary work item, constraints, Jira, and design inputs.

## Task
- Validate ticket completeness and identify missing decision-critical information.
- Ask only safety-critical clarifications when ambiguity can create incorrect implementation risk.

## Output Contract
- Write: reports/dev-twin/intake-questions.md
- Format: markdown
- Schema:
```json
{
  "sections": [
    "Ticket Intake",
    "Acceptance & UX",
    "Repo Analysis Inputs",
    "Compliance & Review"
  ]
}
```
- Write: reports/dev-twin/intake-missing-fields.md
- Format: markdown
- Schema:
```json
{
  "stage": "intake",
  "status": "ready|needs_input|blocked",
  "missingFields": [
    {
      "field": "string",
      "severity": "high|medium|low",
      "reason": "string"
    }
  ]
}
```

## Quality Gates (senior developer checks)
- Acceptance criteria are explicit and testable.
- Backward compatibility constraints are captured.
- Accessibility expectations are visible before coding.

## Stop Conditions (pause and ask human)
- Missing acceptance criteria for core behavior.
- Conflicting requirement statements or undefined rollback expectations.
- Potential sensitive data leakage in ticket text.

