# Generated Stage Prompt - 02-impact

- Stage: Repo Impact
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-24T13:22:05.403Z

# ODT Stage Prompt - 02-impact

Stage: Repo Impact

## Objective
- Rank likely impacted files with confidence and explain selection signals.
- Surface regression risks tied to impacted modules and related tests.

## Inputs
- reports/dev-twin/intake.json (required): Requirement intent and scope.
- reports/dev-twin/impact-analysis.json (required): Repo-inferred module and file candidates.

## Runtime Context
```json
{
  "generatedAt": "2026-04-24T13:22:05.403Z",
  "stage": "impact",
  "stageStatus": "completed",
  "stageDetail": {
    "blastRadius": 24,
    "modules": 6,
    "sourceFiles": 18,
    "testFiles": 6,
    "inferenceMode": "repo_inferred_manifest",
    "candidateFiles": 12,
    "keywords": [
      "attempting",
      "journey",
      "note",
      "after",
      "entering",
      "clicking",
      "screen",
      "will"
    ],
    "rankedFileCount": 12,
    "topConfidence": 0.99,
    "regressionRisks": [
      "No critical planning risk detected. Keep human-in-loop for merge approvals."
    ]
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
- Confidence and rationale are present for each top candidate.
- Regression risks reference concrete repo surfaces.
- No broad, unbounded blast radius without explanation.

## Stop Conditions
- No candidate files are inferred and no module hints exist.
- Risk hotspots cannot be tied to any test or component area.

## Expected Outputs
- reports/dev-twin/impact-analysis.json (json)
- reports/odt/impact-ranked-files.json (json)
