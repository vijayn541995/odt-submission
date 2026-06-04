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
  "generatedAt": "2026-05-15T00:01:22.382Z",
  "stage": "impact",
  "stageStatus": "completed",
  "stageDetail": {
    "blastRadius": 21,
    "modules": 2,
    "sourceFiles": 18,
    "testFiles": 3,
    "inferenceMode": "repo_inferred_manifest",
    "candidateFiles": 12,
    "keywords": [
      "journey",
      "25271",
      "create",
      "assessment",
      "option",
      "displays",
      "activity",
      "dropdown"
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
  "title": "JOURNEY-25271 Create Assessment",
  "featureName": "JOURNEY-25271 Create Assessment",
  "summary": "JOURNEY-25271 Create Assessment\nThe option 'Assessment' displays in the activity dropdown list.\nSelection displays the following:\nBreadcrumb updated to display 'Activities >> New Assessment'.\nInfo icon displays the message: 'Assessments are graded evaluations of the user's proficiency.'\nTitle 'Activity Details - Assessment'\nThe activity contains the following elements:\nActivity Name\nRequired field.\nUnique Name amongst Assessments in organization.\nFree text field.\nField alert message displayed when not unique: 'The Assessment name must be unique.'\nSupports 155 characters.\nCharacter counter is displayed.\nSpecial characters are accepted.\nPlaceholder text 'Enter the activity name.'\nWhen no characters are present in the field, the message is displayed: 'This field is required.'\nDisplay Name\n\"Display Name” header is displayed with info icon.\nMessage is displayed as a tool tip upon clicking on info icon \"Enter the name that is displayed to the learner.\" \nFree text field.\nRequired field.\nSupports special characters.\nName is not required to be unique.\nSupports 155 characters.\nCharacter counter is displayed.\nDescription \nFree text field.\nPlaceholder text displayed: 'Enter the activity description.'\nCharacter limit of 1024.\nCharacter counter displayed.\nRich text editor displayed.",
  "reviewEdits": "",
  "workItemType": "feature",
  "jira": {
    "ticketId": "ODT-DEMO-STORY-101",
    "url": ""
  },
  "requirements": {
    "acceptanceCriteria": [
      "JOURNEY-25271 Create Assessment The option 'Assessment' displays in the activity dropdown list."
    ],
    "nonFunctional": [
      "a11y",
      "performance",
      "unit-tests"
    ]
  },
  "defectContext": {
    "defectId": "",
    "observedBehavior": "",
    "expectedBehavior": "",
    "severity": "medium"
  },
  "designInputs": {
    "mockupImages": [
      "reports/odt/uploads/1778763461275-1-Screenshot_2026-05-14_at_2.49.57_PM.png",
      "reports/odt/uploads/1778763541461-1-Screenshot_2026-05-14_at_6.28.44_PM.png"
    ],
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

## Output Rules
- Output markdown only.
- Keep sections: Objective, Inputs, Execution Steps, Quality Gates, Stop Conditions, Expected Outputs.
- Keep language deterministic and auditable.
- Preserve human-review gates and accessibility obligations.

