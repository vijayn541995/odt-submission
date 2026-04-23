# Generated Stage Prompt - 06-compliance

- Stage: VPAT/WCAG Compliance
- Provider: template
- Model: n/a
- LatencyMs: 0
- Generated At: 2026-04-23T16:20:01.811Z

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
  "generatedAt": "2026-04-23T16:20:01.811Z",
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
- Top rule classes are mapped to actionable guidance.
- Keyboard gaps are explicit.
- Priority order is risk-based and explainable.

## Stop Conditions
- A11y findings are unavailable for current run.
- Compliance mapping cannot determine actionable priority.

## Expected Outputs
- reports/odt/compliance-mapping.md (markdown)
- reports/a11y/coding-agent-prompt.md (markdown)
