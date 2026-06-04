# Generated Stage Prompt - 04-code

- Stage: Code Workpack
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-05-15T00:02:32.988Z

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
  "generatedAt": "2026-05-15T00:02:32.988Z",
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
