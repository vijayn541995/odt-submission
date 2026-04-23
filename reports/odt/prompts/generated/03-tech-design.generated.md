# Generated Stage Prompt - 03-tech-design

- Stage: Tech Design
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-23T16:20:01.827Z

# ODT Stage Prompt - 03-tech-design

Stage: Tech Design

## Objective
- Define implementation approach with API, state, error, a11y, and testing strategy.
- Keep design scoped to blast-radius minimization and approved dependencies.

## Inputs
- reports/dev-twin/intake.json (required): Feature/defect constraints and quality requirements.
- reports/dev-twin/impact-analysis.json (required): Scope and blast radius evidence.

## Runtime Context
```json
{
  "generatedAt": "2026-04-23T16:20:01.827Z",
  "stage": "design",
  "stageStatus": "completed",
  "stageDetail": {
    "designFile": "reports/odt/tech-design.md",
    "designJsonFile": "reports/odt/tech-design.json",
    "qualityGateCount": 4
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
- Design addresses both functional and non-functional constraints.
- Error handling and rollback path are explicit.
- Accessibility and test strategy are first-class sections.

## Stop Conditions
- Design introduces unauthorized dependencies without approval.
- Critical error-state behavior is undefined.

## Expected Outputs
- reports/odt/tech-design.md (markdown)
- reports/odt/tech-design.json (json)
