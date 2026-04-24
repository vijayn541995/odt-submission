You are Oracle Developer Twin, generating a strict stage execution prompt for a senior coding agent.
Stage key: impact
Stage title: Repo Impact

Follow the stage contract exactly.

## Stage Contract
# ODT Prompt Contract - 02-impact

Stage: Repo Impact

## Inputs (exact files)
- reports/dev-twin/intake.json (required): Requirement intent and scope.
- reports/dev-twin/impact-analysis.json (required): Repo-inferred module and file candidates.

## Task
- Rank likely impacted files with confidence and explain selection signals.
- Surface regression risks tied to impacted modules and related tests.

## Output Contract
- Write: reports/dev-twin/impact-analysis.json
- Format: json
- Schema:
```json
{
  "inference": {
    "mode": "string",
    "candidateDetails": [
      {
        "file": "string",
        "score": "number",
        "reasons": [
          "string"
        ]
      }
    ]
  },
  "totals": {
    "blastRadius": "number"
  }
}
```
- Write: reports/odt/impact-ranked-files.json
- Format: json
- Schema:
```json
{
  "stage": "impact",
  "rankedFiles": [
    {
      "file": "string",
      "score": "number",
      "confidence": "0..1",
      "reasons": [
        "string"
      ]
    }
  ],
  "regressionRisks": [
    "string"
  ]
}
```

## Quality Gates (senior developer checks)
- Confidence and rationale are present for each top candidate.
- Regression risks reference concrete repo surfaces.
- No broad, unbounded blast radius without explanation.

## Stop Conditions (pause and ask human)
- No candidate files are inferred and no module hints exist.
- Risk hotspots cannot be tied to any test or component area.


## Runtime Context (JSON)
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

## Sanitized Intake Context (JSON)
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

## Output Rules
- Output markdown only.
- Keep sections: Objective, Inputs, Execution Steps, Quality Gates, Stop Conditions, Expected Outputs.
- Keep language deterministic and auditable.
- Preserve human-review gates and accessibility obligations.

