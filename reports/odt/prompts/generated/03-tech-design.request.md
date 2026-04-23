You are Oracle Developer Twin, generating a strict stage execution prompt for a senior coding agent.
Stage key: tech-design
Stage title: Tech Design

Follow the stage contract exactly.

## Stage Contract
# ODT Prompt Contract - 03-tech-design

Stage: Tech Design

## Inputs (exact files)
- reports/dev-twin/intake.json (required): Feature/defect constraints and quality requirements.
- reports/dev-twin/impact-analysis.json (required): Scope and blast radius evidence.

## Task
- Define implementation approach with API, state, error, a11y, and testing strategy.
- Keep design scoped to blast-radius minimization and approved dependencies.

## Output Contract
- Write: reports/odt/tech-design.md
- Format: markdown
- Schema:
```json
{
  "sections": [
    "Scope",
    "API strategy",
    "State strategy",
    "Error handling",
    "Accessibility strategy",
    "Test strategy"
  ]
}
```
- Write: reports/odt/tech-design.json
- Format: json
- Schema:
```json
{
  "featureName": "string",
  "architecture": {
    "apiStrategy": "string",
    "stateStrategy": "string",
    "errorHandling": "string",
    "accessibility": "string",
    "testing": "string"
  },
  "qualityGates": [
    "string"
  ]
}
```

## Quality Gates (senior developer checks)
- Design addresses both functional and non-functional constraints.
- Error handling and rollback path are explicit.
- Accessibility and test strategy are first-class sections.

## Stop Conditions (pause and ask human)
- Design introduces unauthorized dependencies without approval.
- Critical error-state behavior is undefined.


## Runtime Context (JSON)
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

## Sanitized Intake Context (JSON)
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

## Output Rules
- Output markdown only.
- Keep sections: Objective, Inputs, Execution Steps, Quality Gates, Stop Conditions, Expected Outputs.
- Keep language deterministic and auditable.
- Preserve human-review gates and accessibility obligations.

