# Generated Stage Prompt - 06-compliance

- Stage: VPAT/WCAG Compliance
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-24T13:22:04.931Z

# ODT Stage Prompt - 06-compliance

Stage: VPAT/WCAG Compliance

## Objective
- Map findings to VPAT/WCAG and keyboard accessibility obligations.
- Prioritize remediations by blocker impact and implementation risk.

## Inputs
- reports/a11y/findings.json (required): Raw accessibility findings from scans.
- reports/a11y/coding-agent-prompt.md (optional): A11y remediation instructions if generated.

## Runtime Context
```json
{
  "generatedAt": "2026-04-24T13:22:04.931Z",
  "stage": "compliance",
  "stageStatus": "completed",
  "stageDetail": {
    "status": "completed",
    "blockers": 0,
    "verifyStatus": "pass",
    "dashboard": "reports/a11y-twin/index.html",
    "complianceMapFile": "reports/odt/compliance-mapping.md",
    "topRules": 0,
    "repoMode": "external_target",
    "note": "A11y scan executed against the selected target repo and reports were saved in the ODT workspace artifacts."
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
- Top rule classes are mapped to actionable guidance.
- Keyboard gaps are explicit.
- Priority order is risk-based and explainable.

## Stop Conditions
- A11y findings are unavailable for current run.
- Compliance mapping cannot determine actionable priority.

## Expected Outputs
- reports/odt/compliance-mapping.md (markdown)
- reports/a11y/coding-agent-prompt.md (markdown)
