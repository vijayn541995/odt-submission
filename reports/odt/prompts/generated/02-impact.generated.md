# Generated Stage Prompt - 02-impact

- Stage: Repo Impact
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-23T16:20:00.408Z

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
  "generatedAt": "2026-04-23T16:20:00.407Z",
  "stage": "impact",
  "stageStatus": "completed",
  "stageDetail": {
    "blastRadius": 7,
    "modules": 3,
    "sourceFiles": 7,
    "testFiles": 0,
    "inferenceMode": "repo_inferred_manifest",
    "candidateFiles": 7,
    "keywords": [
      "change",
      "submit",
      "request",
      "button",
      "text",
      "employee",
      "form",
      "filter"
    ],
    "rankedFileCount": 7,
    "topConfidence": 0.99,
    "regressionRisks": [
      "No critical planning risk detected. Keep human-in-loop for merge approvals."
    ]
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
- Confidence and rationale are present for each top candidate.
- Regression risks reference concrete repo surfaces.
- No broad, unbounded blast radius without explanation.

## Stop Conditions
- No candidate files are inferred and no module hints exist.
- Risk hotspots cannot be tied to any test or component area.

## Expected Outputs
- reports/dev-twin/impact-analysis.json (json)
- reports/odt/impact-ranked-files.json (json)
