# ODT Execute Prompt

Use this prompt with Codex/Cline to produce a unified diff for the current work item.

## Objective
Implement: when attempting to add a Journey Note, after entering the note and clicking Add, the sc...
Target repo path: /Users/vn105957/Desktop/lpDev/journey-builder-js/

## Rules
- Return a unified diff inside a ```diff fenced block.
- Keep edits scoped to impacted files only.
- Follow existing repo patterns and avoid new dependencies unless explicitly approved.
- Update tests for changed behavior.
- Preserve VPAT/WCAG and keyboard accessibility expectations.

## Intake Summary
- Work item type: feature
- Summary: when attempting to add a Journey Note, after entering the note and clicking Add, the screen will go white and a 404 Page Not Found error displays. See attachments.

 

I am able to replicate this in our demo environment and also tested adding a note to an activity and an event and experienced the same issue.
- Jira: not supplied

## Candidate Files
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/journey_table.jsx
- src/journey-builder-app/modules/journey-user/roster/modal/EventTable.jsx
- src/journey-builder-app/utils/error_page.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_found.jsx
- src/journey-builder-app/modules/journey-builder/events/container-components/home/no_table_content.jsx
- src/journey-builder-app/modules/journey-reports/container-components/home/ReportGroupJourneySummaryTable.jsx
- src/journey-builder-app/modules/journey-builder/journeys/container-components/resuable/no_activities_found.jsx
- src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/dnd_table/activity_reorder_component.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/reusable-components/modals/delete_activity_failure_modal.jsx
- src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/dnd_table/stage_activity_table.jsx
- src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/journey_resource_activity_library.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx

## Hotspots
- src/journey-builder-app/modules/journey-builder/activities (7)
- src/journey-builder-app/modules/journey-builder/journeys (5)
- src/journey-builder-app/modules/journey-builder/events (3)
- src/journey-builder-app/modules/journey-user/roster (1)
- src/journey-builder-app/utils (1)
- src/journey-builder-app/modules/journey-reports/container-components (1)

## Design Inputs (uploaded via ODT Workspace)
- No mockup images provided
- No reference docs provided
- If files are present, review them before writing changes.

## Embedded Workpacks

### Tech Design
```md
# ODT Tech Design

- Feature: when attempting to add a Journey Note, after entering the note and clicking Add, the sc...
- Target repo: /Users/vn105957/Desktop/lpDev/journey-builder-js/
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

Work Item: when attempting to add a Journey Note, after entering the note and clicking Add, the sc...

You are a senior frontend developer assistant.
Use the intake, inferred repo impact, and compliance guidance below to implement a reviewable patch.

Execution steps:
1) Ask clarifying questions only for safety-critical ambiguities.
2) Review existing patterns in the inferred source files before editing.
3) Implement code changes with backward compatibility.
4) Include keyboard accessibility and semantic HTML by default.
5) Summarize edge cases and regression risk after patching.

Scope summary:
- src/journey-builder-app/modules/journey-builder/activities (source: 7, tests: 0)
- src/journey-builder-app/modules/journey-builder/journeys (source: 5, tests: 0)
- src/journey-builder-app/modules/journey-builder/events (source: 3, tests: 0)
- src/journey-builder-app/modules/journey-user/roster (source: 1, tests: 0)
- src/journey-builder-app/utils (source: 1, tests: 0)
- src/journey-builder-app/modules/journey-reports/container-components (source: 1, tests: 0)

Repo-analysis evidence:
- Target repo path: /Users/vn105957/Desktop/lpDev/journey-builder-js/
- Analysis mode: repo_inferred_manifest
- Keywords: attempting, journey, note, after, entering, clicking, screen, will, white, page, found, error, displays, attachments, able, replicate, demo, environment, also, tested, adding, activity, event, experienced
- Mockup image: none supplied
- Reference doc: none supplied
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/journey_table.jsx [score=77] exports=JourneyTable signals=path:journey, path:page, path:able, path:activity, export:JourneyTable, preview:able
- Candidate file: src/journey-builder-app/modules/journey-user/roster/modal/EventTable.jsx [score=66] exports=EventTable signals=path:journey, path:able, path:event, export:EventTable, preview:able
- Candidate file: src/journey-builder-app/utils/error_page.jsx [score=63] exports=ErrorPage signals=path:journey, path:page, path:error, export:ErrorPage
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_found.jsx [score=59] exports=NoActivitiesFound signals=path:journey, path:page, path:found, path:activity, export:NoActivitiesFound, preview:able
- Candidate file: src/journey-builder-app/modules/journey-builder/events/container-components/home/no_table_content.jsx [score=58] exports=NoTableContent signals=path:journey, path:able, path:event, export:NoTableContent, preview:journey, preview:able
- Candidate file: src/journey-builder-app/modules/journey-reports/container-components/home/ReportGroupJourneySummaryTable.jsx [score=58] exports=ReportGroupJourneySummaryTable signals=path:journey, path:able, export:ReportGroupJourneySummaryTable, preview:able
- Candidate file: src/journey-builder-app/modules/journey-builder/journeys/container-components/resuable/no_activities_found.jsx [score=55] exports=NoActivitiesFound signals=path:journey, path:found, path:able, export:NoActivitiesFound, preview:found, preview:able
- Candidate file: src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/dnd_table/activity_reorder_component.jsx [score=52] exports=ActivityReorderComponent signals=path:journey, path:able, path:activity, export:ActivityReorderComponent, preview:able, preview:activity

Reviewer refinements:
- None supplied

Prompt override (code stage):
Dont use If  conditions you can change the entity_id to user_id for the fix

Quality gates to run after implementation:
- npm run a11y:scan:ci || true
- npm run a11y:twin:verify

Feature payload:
```json
{
  "title": "when attempting to add a Journey Note, after entering the note and clicking Add, the sc...",
  "featureName": "when attempting to add a Journey Note, after entering the note and clicking Add, the sc...",
  "summary": "when attempting to add a Journey Note, after entering the note and clicking Add, the screen will go white and a 404 Page Not Found error displays. See attachments.\n\n \n\nI am able to replicate this in our demo environment and also tested adding a note to an activity and an event and experienced the same issue.",
  "reviewEdits": "",
  "promptOverrides": {
    "intake": "",
    "impact": "",
    "design": "",
    "code": "Dont use If  conditions you can change the entity_id to user_id for the fix",
    "unitTests": "",
    "compliance": "",
    "verify": ""
  },
  "targetRepoPath": "/Users/vn105957/Desktop/lpDev/journey-builder-js/",
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

Work Item: when attempting to add a Journey Note, after entering the note and clicking Add, the sc...

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
  "generatedAt": "2026-04-24T12:04:20.026Z",
  "metadata": {
    "generatedAt": "2026-04-24T12:04:20.018Z",
    "mode": "ci",
    "scanRoot": "/Users/vn105957/Desktop/lpDev/journey-builder-js/",
    "filesScanned": 458,
    "standardPrimary": "Oracle VPAT guidance (internal Confluence source of truth)",
    "standardFallback": "WCAG 2.1 AA",
    "policySource": {
      "name": "Oracle A11y and VPAT minimums",
      "updated": "2019-05-17",
      "notes": "Derived from APO OAG 3.0 checklist subset; Oracle VPAT guidance is primary."
    }
  },
  "summary": {
    "blockers": 501,
    "warnings": 0,
    "infos": 0,
    "total": 501
  },
  "ruleSummary": [
    {
      "ruleId": "custom/icon-a11y-label",
      "count": 309,
      "playbook": {
        "title": "Add icon accessibility labels",
        "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
        "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.",
        "estimatedMinutesPerFinding": 2
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "count": 162,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/form-control-label",
      "count": 30,
      "playbook": {
        "title": "Attach explicit form labels",
        "whyItMatters": "Form fields without labels create ambiguity for screen readers.",
        "implementationHint": "Connect label and control via htmlFor/id or aria-labelledby.",
        "estimatedMinutesPerFinding": 3
      }
    }
  ],
  "hotspots": [
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "count": 23
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-builder/events/presentational-components/session.jsx",
      "count": 21
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx",
      "count": 18
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/mobile_components/journey-user/users/container-components/users_list_container_mobile.jsx",
      "count": 17
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx",
      "count": 16
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-builder/events/presentational-components/roaster_table.jsx",
      "count": 14
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-user/groups/presentaional-components/add_members_stepper_container.jsx",
      "count": 14
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-user/groups/presentaional-components/add_members_stepper.jsx",
      "count": 14
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-user/users/presentaional-components/assigned_journey_table.jsx",
      "count": 12
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/mobile_components/journey-builder/events/eventListContainerMobile.jsx",
      "count": 11
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/hamburger_menu.jsx",
      "count": 10
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/admin-notifications/pages/home/notification_list.jsx",
      "count": 9
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-user/users/presentaional-components/group_association_table.jsx",
      "count": 9
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/mobile_components/journey-user/users/container-components/modal/MobilePaginationComponent.jsx",
      "count": 8
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/mobile_components/journey-user/users/container-components/user_session_list_mobile.jsx",
      "count": 8
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-builder/journeys/container-components/home/load_journeys_list.jsx",
      "count": 8
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-builder/events/presentational-components/event_list.jsx",
      "count": 7
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-user/groups/container-components/groups_list_container.jsx",
      "count": 7
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-user/roster/modal/session_assignment_report_container.jsx",
      "count": 7
    },
    {
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/publish.jsx",
      "count": 6
    }
  ],
  "priorityQueue": [
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 54,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 62,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/icon-a11y-label",
      "wcagRef": "1.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 66,
      "message": "Terra icon is missing a11y label.",
      "suggestedFix": "Add a11yLabel for functional icons; hide decorative icons from assistive tech.",
      "policyCriterion": "1.1.1",
      "policyTitle": "Non-text content alternatives",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Add icon accessibility labels",
        "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
        "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.",
        "estimatedMinutesPerFinding": 2
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 69,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/icon-a11y-label",
      "wcagRef": "1.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 73,
      "message": "Terra icon is missing a11y label.",
      "suggestedFix": "Add a11yLabel for functional icons; hide decorative icons from assistive tech.",
      "policyCriterion": "1.1.1",
      "policyTitle": "Non-text content alternatives",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Add icon accessibility labels",
        "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
        "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.",
        "estimatedMinutesPerFinding": 2
      }
    },
    {
      "ruleId": "custom/icon-a11y-label",
      "wcagRef": "1.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 75,
      "message": "Terra icon is missing a11y label.",
      "suggestedFix": "Add a11yLabel for functional icons; hide decorative icons from assistive tech.",
      "policyCriterion": "1.1.1",
      "policyTitle": "Non-text content alternatives",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Add icon accessibility labels",
        "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
        "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.",
        "estimatedMinutesPerFinding": 2
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 84,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 89,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 94,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 100,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/icon-a11y-label",
      "wcagRef": "1.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 104,
      "message": "Terra icon is missing a11y label.",
      "suggestedFix": "Add a11yLabel for functional icons; hide decorative icons from assistive tech.",
      "policyCriterion": "1.1.1",
      "policyTitle": "Non-text content alternatives",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Add icon accessibility labels",
        "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
        "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.",
        "estimatedMinutesPerFinding": 2
      }
    },
    {
      "ruleId": "custom/icon-a11y-label",
      "wcagRef": "1.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 106,
      "message": "Terra icon is missing a11y label.",
      "suggestedFix": "Add a11yLabel for functional icons; hide decorative icons from assistive tech.",
      "policyCriterion": "1.1.1",
      "policyTitle": "Non-text content alternatives",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Add icon accessibility labels",
        "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
        "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.",
        "estimatedMinutesPerFinding": 2
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 115,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 120,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 125,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 134,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 145,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 151,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/icon-a11y-label",
      "wcagRef": "1.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 156,
      "message": "Terra icon is missing a11y label.",
      "suggestedFix": "Add a11yLabel for functional icons; hide decorative icons from assistive tech.",
      "policyCriterion": "1.1.1",
      "policyTitle": "Non-text content alternatives",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Add icon accessibility labels",
        "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
        "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.",
        "estimatedMinutesPerFinding": 2
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 167,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 176,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 183,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "wcagRef": "2.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/core-components/hamburger_menu/mobile_components/mobile_navigation.jsx",
      "line": 188,
      "message": "Clickable non-interactive element lacks keyboard interaction support.",
      "suggestedFix": "Use a semantic button/link, or add role=\"button\", tabIndex=\"0\", and key handlers.",
      "policyCriterion": "2.1.1",
      "policyTitle": "Keyboard accessibility",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Restore keyboard parity for click handlers",
        "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
        "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers.",
        "estimatedMinutesPerFinding": 4
      }
    },
    {
      "ruleId": "custom/icon-a11y-label",
      "wcagRef": "1.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/mobile_components/journey-user/users/container-components/users_list_container_mobile.jsx",
      "line": 201,
      "message": "Terra icon is missing a11y label.",
      "suggestedFix": "Add a11yLabel for functional icons; hide decorative icons from assistive tech.",
      "policyCriterion": "1.1.1",
      "policyTitle": "Non-text content alternatives",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Add icon accessibility labels",
        "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
        "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.",
        "estimatedMinutesPerFinding": 2
      }
    },
    {
      "ruleId": "custom/icon-a11y-label",
      "wcagRef": "1.1.1",
      "severity": "blocker",
      "file": "/Users/vn105957/Desktop/lpDev/journey-builder-js/src/journey-builder-app/mobile_components/journey-user/users/container-components/users_list_container_mobile.jsx",
      "line": 220,
      "message": "Terra icon is missing a11y label.",
      "suggestedFix": "Add a11yLabel for functional icons; hide decorative icons from assistive tech.",
      "policyCriterion": "1.1.1",
      "policyTitle": "Non-text content alternatives",
      "policyPriority": "high",
      "score": 160,
      "playbook": {
        "title": "Add icon accessibility labels",
        "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
        "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.",
        "estimatedMinutesPerFinding": 2
      }
    }
  ],
  "recommendationBacklog": [
    {
      "rank": 1,
      "ruleId": "custom/icon-a11y-label",
      "count": 309,
      "action": "Add icon accessibility labels",
      "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
      "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden."
    },
    {
      "rank": 2,
      "ruleId": "custom/click-keyboard-parity",
      "count": 162,
      "action": "Restore keyboard parity for click handlers",
      "whyItMatters": "Mouse-only interactions block keyboard and switch-device users.",
      "implementationHint": "Use semantic button/link elements or add role, tabIndex, Enter/Space key handlers."
    },
    {
      "rank": 3,
      "ruleId": "custom/form-control-label",
      "count": 30,
      "action": "Attach explicit form labels",
      "whyItMatters": "Form fields without labels create ambiguity for screen readers.",
      "implementationHint": "Connect label and control via htmlFor/id or aria-labelledby."
    }
  ],
  "effort": {
    "remediationMinutes": 84,
    "remediationHours": 1.4,
    "triageMinutesWithoutTwin": 75,
    "triageMinutesWithTwin": 13,
    "triageReductionPercent": 83
  }
}
```

