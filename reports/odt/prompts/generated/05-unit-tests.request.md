You are Oracle Developer Twin, generating a strict stage execution prompt for a senior coding agent.
Stage key: unit-tests
Stage title: Unit Tests

Follow the stage contract exactly.

## Stage Contract
# ODT Prompt Contract - 05-unit-tests

Stage: Unit Tests

## Inputs (exact files)
- reports/dev-twin/unit-test-workpack.md (required): Test guidance for impacted behavior.
- reports/dev-twin/impact-analysis.json (required): Related source and test file context.

## Task
- Create deterministic test matrix for happy, edge, error, and keyboard-accessibility paths.
- Add anti-flake guidance for stable CI behavior.

## Output Contract
- Write: reports/dev-twin/unit-test-workpack.md
- Format: markdown
- Schema:
```json
{
  "includes": [
    "happy path",
    "edge path",
    "error path",
    "keyboard assertions"
  ]
}
```
- Write: reports/odt/unit-test-matrix.md
- Format: markdown
- Schema:
```json
{
  "columns": [
    "Scenario",
    "Coverage type",
    "Expected assertion",
    "Flake risk",
    "Mitigation"
  ]
}
```

## Quality Gates (senior developer checks)
- No snapshot-only strategy for behavior-critical paths.
- Keyboard and ARIA assertions are present for interactive UI.
- Anti-flake mitigations are documented.

## Stop Conditions (pause and ask human)
- No stable assertion strategy for async behavior.
- Critical user journey lacks testability due to ambiguity.


## Runtime Context (JSON)
```json
{
  "generatedAt": "2026-05-15T00:02:32.998Z",
  "stage": "test-workpack",
  "stageStatus": "completed",
  "stageDetail": {
    "testWorkpack": "reports/dev-twin/unit-test-workpack.md",
    "available": true,
    "testMatrixFile": "reports/odt/unit-test-matrix.md",
    "relatedTestFiles": 3
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

