# ODT Execute Prompt

Use this prompt with Codex/Cline to produce a unified diff for the current work item.

## Objective
Implement: change the submit request button text to submit employee form
Target repo path: /Users/vn105957/Desktop/odt-submission/demo-target-repo/

## Rules
- Return a unified diff inside a ```diff fenced block.
- Keep edits scoped to impacted files only.
- Follow existing repo patterns and avoid new dependencies unless explicitly approved.
- Update tests for changed behavior.
- Preserve VPAT/WCAG and keyboard accessibility expectations.

## Intake Summary
- Work item type: feature
- Summary: change the submit request button text to submit employee form
- Jira: not supplied

## Candidate Files
- src/components/employeeFormUtils.js
- src/components/EmployeeForm.jsx
- src/data/fallbackEmployees.js
- src/components/FilterBar.jsx
- src/api/fetchEmployees.js
- src/components/ActivityList.jsx
- src/components/OracleLogo.js

## Hotspots
- src/components (5)
- src/data (1)
- src/api (1)

## Design Inputs (uploaded via ODT Workspace)
- No mockup images provided
- No reference docs provided
- If files are present, review them before writing changes.

## Embedded Workpacks

### Tech Design
```md
# ODT Tech Design

- Feature: change the submit request button text to submit employee form
- Target repo: /Users/vn105957/Desktop/odt-submission/demo-target-repo/
- UI: React/Terra minimal-blast-radius update
- API strategy: reuse current contracts unless explicitly approved
- State strategy: incremental updates in existing store/actions
- Error handling: loading/empty/error states with deterministic behavior
- Testing: Jest/RTL unit coverage for happy/edge/error paths
- Accessibility: VPAT/WCAG and keyboard parity validation
- Governance: human-reviewed approvals before merge

## Prompt Override (Design Stage)
- No design-stage prompt override supplied.

## Quality Gates
- No unauthorized dependencies
- Backward compatibility preserved
- Keyboard and ARIA behavior validated
- Deterministic unit tests updated
```

### Code Workpack
```md
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
```

### Unit Test Workpack
```md
# Codex Workpack: ODT Unit Test Generation

Work Item: change the submit request button text to submit employee form

Generate or update Jest/RTL tests for impacted behavior.
Cover:
- Happy path
- Error path
- Empty/loading states
- Keyboard accessibility interactions where applicable

Known related test files:
- No direct tests matched; create nearest-module tests.

Prompt override (unit test stage):
- None supplied

Rules:
- Keep tests deterministic and isolated.
- Avoid snapshot-only validation for behavior-heavy flows.
- Assert accessibility roles/labels when adding interactive UI.

Verification command:
- npm test -- --watch=false --runInBand
```

### Accessibility Summary
```json
{
  "generatedAt": "2026-04-23T15:12:00.074Z",
  "metadata": {
    "generatedAt": "2026-04-23T15:12:00.072Z",
    "mode": "ci",
    "scanRoot": "/Users/vn105957/Desktop/odt-submission/demo-target-repo/",
    "filesScanned": 9,
    "standardPrimary": "Oracle VPAT guidance (internal Confluence source of truth)",
    "standardFallback": "WCAG 2.1 AA",
    "policySource": {
      "name": "Oracle A11y and VPAT minimums",
      "updated": "2019-05-17",
      "notes": "Derived from APO OAG 3.0 checklist subset; Oracle VPAT guidance is primary."
    }
  },
  "summary": {
    "blockers": 0,
    "warnings": 0,
    "infos": 0,
    "total": 0
  },
  "ruleSummary": [],
  "hotspots": [],
  "priorityQueue": [],
  "recommendationBacklog": [],
  "effort": {
    "remediationMinutes": 0,
    "remediationHours": 0,
    "triageMinutesWithoutTwin": 0,
    "triageMinutesWithTwin": 0,
    "triageReductionPercent": null
  }
}
```

