# Generated Stage Prompt - 04-code

- Stage: Code Workpack
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-24T13:22:05.422Z

# ODT Stage Prompt - 04-code

Stage: Code Workpack

## Objective
- Generate file-scoped patch intent and dependency policy checks before coding.
- Require backward compatibility and minimal blast-radius edits.

## Inputs
- reports/dev-twin/code-workpack.md (required): Implementation guidance from Dev Twin.
- reports/odt/tech-design.md (required): Design constraints and quality gates.
- reports/dev-twin/impact-analysis.json (required): Impacted files and module evidence.

## Runtime Context
```json
{
  "generatedAt": "2026-04-24T13:22:05.422Z",
  "stage": "code-workpack",
  "stageStatus": "completed",
  "stageDetail": {
    "codeWorkpack": "reports/dev-twin/code-workpack.md",
    "available": true,
    "patchPlanFile": "reports/odt/code-patch-plan.md",
    "targetFiles": 8,
    "noNewDependencies": true
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
- Every candidate file has a clear edit intent.
- Dependency policy checks are explicit.
- Backward compatibility is validated before implementation.

## Stop Conditions
- Patch intent cannot be mapped to candidate files.
- Requested behavior requires out-of-scope architecture changes.

## Expected Outputs
- reports/dev-twin/code-workpack.md (markdown)
- reports/odt/code-patch-plan.md (markdown)
