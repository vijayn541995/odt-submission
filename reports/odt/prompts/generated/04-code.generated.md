# Generated Stage Prompt - 04-code

- Stage: Code Workpack
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-23T16:20:01.843Z

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
  "generatedAt": "2026-04-23T16:20:01.843Z",
  "stage": "code-workpack",
  "stageStatus": "completed",
  "stageDetail": {
    "codeWorkpack": "reports/dev-twin/code-workpack.md",
    "available": true,
    "patchPlanFile": "reports/odt/code-patch-plan.md",
    "targetFiles": 7,
    "noNewDependencies": true
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
- Every candidate file has a clear edit intent.
- Dependency policy checks are explicit.
- Backward compatibility is validated before implementation.

## Stop Conditions
- Patch intent cannot be mapped to candidate files.
- Requested behavior requires out-of-scope architecture changes.

## Expected Outputs
- reports/dev-twin/code-workpack.md (markdown)
- reports/odt/code-patch-plan.md (markdown)
