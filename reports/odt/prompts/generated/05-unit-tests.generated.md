# Generated Stage Prompt - 05-unit-tests

- Stage: Unit Tests
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-24T13:22:05.427Z

# ODT Stage Prompt - 05-unit-tests

Stage: Unit Tests

## Objective
- Create deterministic test matrix for happy, edge, error, and keyboard-accessibility paths.
- Add anti-flake guidance for stable CI behavior.

## Inputs
- reports/dev-twin/unit-test-workpack.md (required): Test guidance for impacted behavior.
- reports/dev-twin/impact-analysis.json (required): Related source and test file context.

## Runtime Context
```json
{
  "generatedAt": "2026-04-24T13:22:05.427Z",
  "stage": "test-workpack",
  "stageStatus": "completed",
  "stageDetail": {
    "testWorkpack": "reports/dev-twin/unit-test-workpack.md",
    "available": true,
    "testMatrixFile": "reports/odt/unit-test-matrix.md",
    "relatedTestFiles": 6
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
- No snapshot-only strategy for behavior-critical paths.
- Keyboard and ARIA assertions are present for interactive UI.
- Anti-flake mitigations are documented.

## Stop Conditions
- No stable assertion strategy for async behavior.
- Critical user journey lacks testability due to ambiguity.

## Expected Outputs
- reports/dev-twin/unit-test-workpack.md (markdown)
- reports/odt/unit-test-matrix.md (markdown)
