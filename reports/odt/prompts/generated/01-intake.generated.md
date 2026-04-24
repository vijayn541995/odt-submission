# Generated Stage Prompt - 01-intake

- Stage: Intake
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-24T13:22:04.832Z

# ODT Stage Prompt - 01-intake

Stage: Intake

## Objective
- Validate ticket completeness and identify missing decision-critical information.
- Ask only safety-critical clarifications when ambiguity can create incorrect implementation risk.

## Inputs
- reports/dev-twin/intake.json (required): Primary work item, constraints, Jira, and design inputs.

## Runtime Context
```json
{
  "generatedAt": "2026-04-24T13:22:04.832Z",
  "stage": "intake",
  "stageStatus": "completed",
  "stageDetail": {
    "intakeFile": "reports/dev-twin/intake.json",
    "intakeQuestionsFile": "reports/dev-twin/intake-questions.md",
    "missingFieldsFile": "reports/dev-twin/intake-missing-fields.md",
    "intakeStatus": "ready",
    "missingFieldCount": 0,
    "featureName": "when attempting to add a Journey Note, after entering the note and clicking Add, the sc...",
    "workItemType": "feature",
    "reviewEditsActive": false,
    "promptOverridesActive": 1,
    "complexity": "medium",
    "imageInputs": [],
    "workspaceRoot": "/Users/vn105957/Desktop/odt-submission",
    "targetRepoPath": "/Users/vn105957/Desktop/lpDev/journey-builder-js/"
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
- Acceptance criteria are explicit and testable.
- Backward compatibility constraints are captured.
- Accessibility expectations are visible before coding.

## Stop Conditions
- Missing acceptance criteria for core behavior.
- Conflicting requirement statements or undefined rollback expectations.
- Potential sensitive data leakage in ticket text.

## Expected Outputs
- reports/dev-twin/intake-questions.md (markdown)
- reports/dev-twin/intake-missing-fields.md (markdown)
