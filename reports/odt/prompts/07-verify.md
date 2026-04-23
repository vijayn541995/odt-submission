# ODT Prompt Contract - 07-verify

Stage: Verification & Release Readiness

## Inputs (exact files)
- reports/odt/run-summary.json (required): Current stage statuses and KPI snapshot.
- reports/odt/compliance-mapping.md (optional): Compliance risks and remediation posture.

## Task
- Produce go/no-go decision with blockers, risk notes, rollback, and human approvals.
- Ensure release readiness remains human-reviewed.

## Output Contract
- Write: reports/odt/verify-checklist.md
- Format: markdown
- Schema:
```json
{
  "stage": "verify",
  "decision": "go|go_with_conditions|no_go",
  "blockers": [
    "string"
  ],
  "rollbackPlan": [
    "string"
  ],
  "approvalsRequired": [
    "string"
  ]
}
```
- Write: reports/odt/run-summary.md
- Format: markdown
- Schema:
```json
{
  "includes": [
    "stage statuses",
    "status summary",
    "notes"
  ]
}
```

## Quality Gates (senior developer checks)
- Decision rationale is explicit and auditable.
- Blockers and mitigations are concrete.
- Human approval gates are clear before merge.

## Stop Conditions (pause and ask human)
- Any critical stage failed or blocker remains unresolved.
- Rollback or owner accountability is missing.

