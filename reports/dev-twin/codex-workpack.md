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
- src/journey-builder-app/modules/journey-builder/activities (source: 7, tests: 1)
- src/journey-builder-app/modules/journey-builder/journeys (source: 5, tests: 1)
- src/journey-builder-app/modules/journey-builder/events (source: 3, tests: 2)
- src/journey-builder-app/modules/journey-user/roster (source: 1, tests: 2)
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

