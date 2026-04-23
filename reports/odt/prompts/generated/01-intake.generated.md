# Generated Stage Prompt - 01-intake

- Stage: Intake
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-23T16:20:00.133Z

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
  "generatedAt": "2026-04-23T16:20:00.132Z",
  "stage": "intake",
  "stageStatus": "completed",
  "stageDetail": {
    "intakeFile": "reports/dev-twin/intake.json",
    "intakeQuestionsFile": "reports/dev-twin/intake-questions.md",
    "missingFieldsFile": "reports/dev-twin/intake-missing-fields.md",
    "intakeStatus": "ready",
    "missingFieldCount": 0,
    "featureName": "change the submit request button text to submit employee form",
    "workItemType": "feature",
    "reviewEditsActive": false,
    "promptOverridesActive": 0,
    "complexity": "medium",
    "imageInputs": [],
    "workspaceRoot": "/Users/vn105957/Desktop/odt-submission",
    "targetRepoPath": "/Users/vn105957/Desktop/odt-submission/demo-target-repo/"
  },
  "targetRepoPath": "/Users/vn105957/Desktop/odt-submission/demo-target-repo/",
  "workItemType": "feature"
}
```

## Sanitized Intake Context
```json
{
  "title": "change the submit request button text to submit employee form",
  "featureName": "change the submit request button text to submit employee form",
  "summary": "change the submit request button text to submit employee form",
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
    "code": "",
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
