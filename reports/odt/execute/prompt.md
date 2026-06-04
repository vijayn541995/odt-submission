# ODT Execute Prompt

Use this prompt with Codex/Cline to produce a unified diff for the current work item.

## Objective
Implement: JOURNEY-25271 Create Assessment
Target repo path: /Users/vn105957/Desktop/lpDev/journey-builder-js/

## Rules
- Return a unified diff inside a ```diff fenced block.
- Keep edits scoped to impacted files only.
- Follow existing repo patterns and avoid new dependencies unless explicitly approved.
- Update tests for changed behavior.
- Preserve VPAT/WCAG and keyboard accessibility expectations.

## Intake Summary
- Work item type: feature
- Summary: JOURNEY-25271 Create Assessment
The option 'Assessment' displays in the activity dropdown list.
Selection displays the following:
Breadcrumb updated to display 'Activities >> New Assessment'.
Info icon displays the message: 'Assessments are graded evaluations of the user's proficiency.'
Title 'Activity Details - Assessment'
The activity contains the following elements:
Activity Name
Required field.
Unique Name amongst Assessments in organization.
Free text field.
Field alert message displayed when not unique: 'The Assessment name must be unique.'
Supports 155 characters.
Character counter is displayed.
Special characters are accepted.
Placeholder text 'Enter the activity name.'
When no characters are present in the field, the message is displayed: 'This field is required.'
Display Name
"Display Name” header is displayed with info icon.
Message is displayed as a tool tip upon clicking on info icon "Enter the name that is displayed to the learner." 
Free text field.
Required field.
Supports special characters.
Name is not required to be unique.
Supports 155 characters.
Character counter is displayed.
Description 
Free text field.
Placeholder text displayed: 'Enter the activity description.'
Character limit of 1024.
Character counter displayed.
Rich text editor displayed.
- Jira: ODT-DEMO-STORY-101

## Candidate Files
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx
- src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_found.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_to_import.jsx
- src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/modals/activity_details_modal_container.jsx
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity_view.jsx
- src/journey-builder-app/modules/admin-notifications/pages/create_edit/notification_details.jsx

## Hotspots
- src/journey-builder-app/modules/journey-builder/activities (15)
- src/journey-builder-app/modules/journey-builder/journeys (2)
- src/journey-builder-app/modules/admin-notifications/pages (1)

## Design Inputs (uploaded via ODT Workspace)
- Image: reports/odt/uploads/1778763461275-1-Screenshot_2026-05-14_at_2.49.57_PM.png
- Image: reports/odt/uploads/1778763541461-1-Screenshot_2026-05-14_at_6.28.44_PM.png
- No reference docs provided
- If files are present, review them before writing changes.

## Embedded Workpacks

### Tech Design
```md
# ODT Tech Design

- Feature: JOURNEY-25271 Create Assessment
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

Work Item: JOURNEY-25271 Create Assessment

You are a senior frontend developer assistant.
Use the intake, inferred repo impact, and compliance guidance below to implement a reviewable patch.

Execution steps:
1) Ask clarifying questions only for safety-critical ambiguities.
2) Review existing patterns in the inferred source files before editing.
3) Implement code changes with backward compatibility.
4) Include keyboard accessibility and semantic HTML by default.
5) Summarize edge cases and regression risk after patching.

Scope summary:
- src/journey-builder-app/modules/journey-builder/activities (source: 15, tests: 0)
- src/journey-builder-app/modules/journey-builder/journeys (source: 2, tests: 0)
- src/journey-builder-app/modules/admin-notifications/pages (source: 1, tests: 0)

Repo-analysis evidence:
- Target repo path: /Users/vn105957/Desktop/lpDev/journey-builder-js/
- Analysis mode: repo_inferred_manifest
- Keywords: journey, 25271, create, assessment, option, displays, activity, dropdown, list, selection, following, breadcrumb, updated, display, activities, info, icon, message, assessments, graded, evaluations, proficiency, title, details
- Mockup image: reports/odt/uploads/1778763461275-1-Screenshot_2026-05-14_at_2.49.57_PM.png
- Mockup image: reports/odt/uploads/1778763541461-1-Screenshot_2026-05-14_at_6.28.44_PM.png
- Reference doc: none supplied
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx [score=69] exports=ActivitySearchHistoryList signals=path:journey, path:activity, path:list, path:activities, export:ActivitySearchHistoryList, preview:icon
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx [score=54] exports=connect signals=path:journey, path:activity, path:activities, path:details
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx [score=54] exports=withRouter, sortDatesDescending signals=path:journey, path:activity, path:list, path:activities
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx [score=54] exports=withDisclosureManager signals=path:journey, path:activity, path:display, path:activities
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx [score=54] exports=connect signals=path:journey, path:activity, path:activities, path:details
- Candidate file: src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx [score=54] exports=ActivityLibraryTable signals=path:journey, path:activity, path:list, export:ActivityLibraryTable
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx [score=52] exports=ActivityApplication signals=path:journey, path:activity, path:activities, export:ActivityApplication, preview:activity, preview:activities
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_found.jsx [score=50] exports=NoActivitiesFound signals=path:journey, path:activity, path:activities, export:NoActivitiesFound, preview:icon

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
  "title": "JOURNEY-25271 Create Assessment",
  "featureName": "JOURNEY-25271 Create Assessment",
  "summary": "JOURNEY-25271 Create Assessment\nThe option 'Assessment' displays in the activity dropdown list.\nSelection displays the following:\nBreadcrumb updated to display 'Activities >> New Assessment'.\nInfo icon displays the message: 'Assessments are graded evaluations of the user's proficiency.'\nTitle 'Activity Details - Assessment'\nThe activity contains the following elements:\nActivity Name\nRequired field.\nUnique Name amongst Assessments in organization.\nFree text field.\nField alert message displayed when not unique: 'The Assessment name must be unique.'\nSupports 155 characters.\nCharacter counter is displayed.\nSpecial characters are accepted.\nPlaceholder text 'Enter the activity name.'\nWhen no characters are present in the field, the message is displayed: 'This field is required.'\nDisplay Name\n\"Display Name” header is displayed with info icon.\nMessage is displayed as a tool tip upon clicking on info icon \"Enter the name that is displayed to the learner.\" \nFree text field.\nRequired field.\nSupports special characters.\nName is not required to be unique.\nSupports 155 characters.\nCharacter counter is displayed.\nDescription \nFree text field.\nPlaceholder text displayed: 'Enter the activity description.'\nCharacter limit of 1024.\nCharacter counter displayed.\nRich text editor displayed.",
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
  "targetRepoPath": "/Users/vn105957/Desktop/lpDev/journey-builder-js/",
  "workItemType": "feature",
  "jira": {
    "ticketId": "ODT-DEMO-STORY-101",
    "url": ""
  },
  "scope": {
    "uiSurface": "web",
    "complexity": "medium",
    "repoScan": "full"
  },
  "requirements": {
    "acceptanceCriteria": [
      "JOURNEY-25271 Create Assessment The option 'Assessment' displays in the activity dropdown list."
    ],
    "nonFunctional": [
      "a11y",
      "performance",
      "unit-tests"
    ],
    "outOfScope": [
      "No backend API changes",
      "Do not alter existing permissions behavior"
    ]
  },
  "designInputs": {
    "mockupImages": [
      "reports/odt/uploads/1778763461275-1-Screenshot_2026-05-14_at_2.49.57_PM.png",
      "reports/odt/uploads/1778763541461-1-Screenshot_2026-05-14_at_6.28.44_PM.png"
    ],
    "referenceDocs": [],
    "jiraLinks": []
  },
  "constraints": {
    "noNewDependencies": true,
    "releaseWindowDays": 10,
    "approvedLibrariesOnly": true
  },
  "developerHints": {
    "suspectedAreas": [
      "src/App.jsx",
      "src/components/FilterBar.jsx",
      "src/components/ActivityList.jsx"
    ],
    "relatedComponents": [
      "Employee list",
      "Filter controls",
      "Home page hero and content layout"
    ],
    "notes": "Use the attached mockup as visual direction for the finder section and keep accessibility behavior explicit in labels, status text, keyboard flow, and clear actions."
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

Work Item: JOURNEY-25271 Create Assessment

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
  "generatedAt": "2026-05-14T13:04:55.414Z",
  "metadata": {
    "generatedAt": "2026-05-14T13:04:55.407Z",
    "mode": "ci",
    "scanRoot": "/Users/vn105957/Desktop/lpDev/journey-builder-js/",
    "filesScanned": 459,
    "standardPrimary": "Oracle VPAT guidance (internal Confluence source of truth)",
    "standardFallback": "WCAG 2.1 AA",
    "policySource": {
      "name": "Oracle A11y and VPAT minimums",
      "updated": "2019-05-17",
      "notes": "Derived from APO OAG 3.0 checklist subset; Oracle VPAT guidance is primary."
    }
  },
  "summary": {
    "blockers": 505,
    "warnings": 0,
    "infos": 0,
    "total": 505
  },
  "ruleSummary": [
    {
      "ruleId": "custom/icon-a11y-label",
      "count": 311,
      "playbook": {
        "title": "Add icon accessibility labels",
        "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
        "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden.",
        "estimatedMinutesPerFinding": 2
      }
    },
    {
      "ruleId": "custom/click-keyboard-parity",
      "count": 164,
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
      "count": 311,
      "action": "Add icon accessibility labels",
      "whyItMatters": "Unlabeled functional icons are silent for assistive technology users.",
      "implementationHint": "Add a11yLabel to functional Terra icons. Hide decorative icons with aria-hidden."
    },
    {
      "rank": 2,
      "ruleId": "custom/click-keyboard-parity",
      "count": 164,
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

