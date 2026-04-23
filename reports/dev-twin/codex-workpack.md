# Codex Workpack: ODT Code Implementation

Work Item: change the submit request button text to submit employee form

You are a senior frontend developer assistant.
Use the intake, inferred repo impact, and compliance guidance below to implement a reviewable patch.

Execution steps:
1) Ask clarifying questions only for safety-critical ambiguities.
2) Review existing patterns in the inferred source files before editing.
3) Implement code changes with backward compatibility.
4) Include keyboard accessibility and semantic HTML by default.
5) Summarize edge cases and regression risk after patching.

Scope summary:
- src/components (source: 5, tests: 0)
- src/data (source: 1, tests: 0)
- src/api (source: 1, tests: 0)

Repo-analysis evidence:
- Target repo path: /Users/vn105957/Desktop/odt-submission/demo-target-repo/
- Analysis mode: repo_inferred_manifest
- Keywords: change, submit, request, button, text, employee, form, filter, activities, keyword, without, leaving, page, filtering, updates, announced, clearly, assistive, technology, users, keyboard, open, clear, navigate
- Mockup image: none supplied
- Reference doc: none supplied
- Candidate file: src/components/employeeFormUtils.js [score=111] exports=INITIAL_FORM, EMAIL_PATTERN, MIN_SUMMARY_LENGTH, TEAM_OPTIONS, FIELD_CONFIG, REQUIRED_FIELDS, SUBMIT_STATUS_ID, normalizeText, hasAllRequiredFields, getFormErrors, isFormSubmittable, getFieldDescribedBy, getSubmitStatusMessage signals=path:employee, path:form, export:INITIAL_FORM, export:SUBMIT_STATUS_ID, export:normalizeText, export:getFormErrors
- Candidate file: src/components/EmployeeForm.jsx [score=58] exports=EmployeeForm signals=path:employee, path:form, export:EmployeeForm, preview:form
- Candidate file: src/data/fallbackEmployees.js [score=30] exports=FALLBACK_EMPLOYEES signals=path:employee, export:FALLBACK_EMPLOYEES, preview:employee
- Candidate file: src/components/FilterBar.jsx [score=28] exports=FilterBar signals=path:filter, export:FilterBar, preview:filter
- Candidate file: src/api/fetchEmployees.js [score=23] exports=none signals=path:employee, preview:employee, preview:form
- Candidate file: src/components/ActivityList.jsx [score=4] exports=ActivityList signals=preview:employee
- Candidate file: src/components/OracleLogo.js [score=1] exports=OracleLogo, ORACLE_LOGO_LABEL signals=path-ranked

Reviewer refinements:
- None supplied

Prompt override (code stage):
- None supplied

Quality gates to run after implementation:
- npm run a11y:scan:ci || true
- npm run a11y:twin:verify

Feature payload:
```json
{
  "title": "change the submit request button text to submit employee form",
  "featureName": "change the submit request button text to submit employee form",
  "summary": "change the submit request button text to submit employee form",
  "reviewEdits": "",
  "promptOverrides": {
    "intake": "",
    "impact": "",
    "design": "",
    "code": "",
    "unitTests": "",
    "compliance": "",
    "verify": ""
  },
  "targetRepoPath": "/Users/vn105957/Desktop/odt-submission/demo-target-repo/",
  "workItemType": "feature",
  "jira": {
    "ticketId": "",
    "url": ""
  },
  "scope": {
    "uiSurface": "web",
    "complexity": "medium",
    "repoScan": "full"
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
    ],
    "outOfScope": [
      "No backend API changes",
      "Do not alter existing permissions behavior"
    ]
  },
  "designInputs": {
    "mockupImages": [],
    "referenceDocs": [],
    "jiraLinks": []
  },
  "constraints": {
    "noNewDependencies": true,
    "releaseWindowDays": 10,
    "approvedLibrariesOnly": true
  },
  "developerHints": {
    "suspectedAreas": [],
    "relatedComponents": [],
    "notes": "Optional only. ODT should infer impact areas from the repo when hints are not provided."
  },
  "defectContext": {
    "defectId": "",
    "observedBehavior": "",
    "expectedBehavior": "",
    "severity": "medium"
  }
}
```

