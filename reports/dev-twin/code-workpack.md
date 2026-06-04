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
- src/journey-builder-app/modules/journey-builder/activities (source: 16, tests: 2)
- src/journey-builder-app/modules/journey-builder/journeys (source: 2, tests: 1)

Repo-analysis evidence:
- Target repo path: /Users/vn105957/Desktop/lpDev/journey-builder-js/
- Analysis mode: repo_inferred_manifest
- Keywords: journey, 25271, create, assessment, option, displays, activity, dropdown, list, selection, following, breadcrumb, updated, display, activities, info, icon, message, assessments, graded, evaluations, proficiency, title, details
- Mockup image: reports/odt/uploads/1778763461275-1-Screenshot_2026-05-14_at_2.49.57_PM.png
- Mockup image: reports/odt/uploads/1778763541461-1-Screenshot_2026-05-14_at_6.28.44_PM.png
- Reference doc: none supplied
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx [score=69] exports=ActivitySearchHistoryList signals=path:journey, path:activity, path:list, path:activities, export:ActivitySearchHistoryList, preview:icon
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx [score=63] exports=connect signals=path:journey, path:assessment, path:activity, path:activities, path:details
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx [score=54] exports=connect signals=path:journey, path:activity, path:activities, path:details
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx [score=54] exports=withRouter, sortDatesDescending signals=path:journey, path:activity, path:list, path:activities
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx [score=54] exports=withDisclosureManager signals=path:journey, path:activity, path:display, path:activities
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx [score=54] exports=connect signals=path:journey, path:activity, path:activities, path:details
- Candidate file: src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx [score=54] exports=ActivityLibraryTable signals=path:journey, path:activity, path:list, export:ActivityLibraryTable
- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx [score=52] exports=ActivityApplication signals=path:journey, path:activity, path:activities, export:ActivityApplication, preview:activity, preview:activities

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

