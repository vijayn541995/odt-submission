# Generated Stage Prompt - 07-verify

- Stage: Verification & Release Readiness
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-24T13:22:05.438Z

# ODT Stage Prompt - 07-verify

Stage: Verification & Release Readiness

## Objective
- Produce go/no-go decision with blockers, risk notes, rollback, and human approvals.
- Ensure release readiness remains human-reviewed.

## Inputs
- reports/odt/run-summary.json (required): Current stage statuses and KPI snapshot.
- reports/odt/compliance-mapping.md (optional): Compliance risks and remediation posture.

## Runtime Context
```json
{
  "generatedAt": "2026-04-24T13:22:05.437Z",
  "stage": "verify-summary",
  "stageStatus": "completed",
  "stageDetail": {
    "note": "Run summary generated for human review.",
    "decision": "go",
    "blockerCount": 0,
    "verifyChecklistFile": "reports/odt/verify-checklist.md"
  },
  "targetRepoPath": "/Users/vn105957/Desktop/lpDev/journey-builder-js/",
  "workItemType": "feature"
}
```

## Sanitized Intake Context
```json
{
  "title": "when attempting to add a Journey Note, after entering the note and clicking Add, the sc...",
  "featureName": "when attempting to add a Journey Note, after entering the note and clicking Add, the sc...",
  "summary": "when attempting to add a Journey Note, after entering the note and clicking Add, the screen will go white and a 404 Page Not Found error displays. See attachments.\n\n \n\nI am able to replicate this in our demo environment and also tested adding a note to an activity and an event and experienced the same issue.",
  "reviewEdits": "",
  "workItemType": "feature",
  "jira": {
    "ticketId": "",
    "url": ""
  },
  "requirements": {
    "acceptanceCriteria": [
      "User can filter activities by keyword without leaving the page",
      "Filtering updates are announced clearly for assistive technology users",
      "Keyboard users can open, clear, and navigate filter controls"
    ],
    "nonFunctional": [
      "a11y",
      "performance",
      "analytics"
    ]
  },
  "defectContext": {
    "defectId": "",
    "observedBehavior": "",
    "expectedBehavior": "",
    "severity": "medium"
  },
  "designInputs": {
    "mockupImages": [],
    "referenceDocs": [],
    "jiraLinks": []
  },
  "promptOverrides": {
    "intake": "",
    "impact": "",
    "design": "",
    "code": "Dont use If  conditions you can change the entity_id to user_id for the fix",
    "unitTests": "",
    "compliance": "",
    "verify": ""
  }
}
```

## Quality Gates
- Decision rationale is explicit and auditable.
- Blockers and mitigations are concrete.
- Human approval gates are clear before merge.

## Stop Conditions
- Any critical stage failed or blocker remains unresolved.
- Rollback or owner accountability is missing.

## Expected Outputs
- reports/odt/verify-checklist.md (markdown)
- reports/odt/run-summary.md (markdown)
