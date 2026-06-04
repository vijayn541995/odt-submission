# ODT Code Patch Plan

- Generated At: 2026-05-15T00:02:32.977Z
- Work Item: JOURNEY-25271 Create Assessment

## File-by-file Intent
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx: apply minimal blast-radius edit based on signals [path:journey, path:activity, path:list, path:activities, export:ActivitySearchHistoryList, preview:icon].
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx: apply minimal blast-radius edit based on signals [path:journey, path:assessment, path:activity, path:activities, path:details].
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx: apply minimal blast-radius edit based on signals [path:journey, path:activity, path:activities, path:details].
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx: apply minimal blast-radius edit based on signals [path:journey, path:activity, path:list, path:activities].
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx: apply minimal blast-radius edit based on signals [path:journey, path:activity, path:display, path:activities].
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx: apply minimal blast-radius edit based on signals [path:journey, path:activity, path:activities, path:details].
- src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx: apply minimal blast-radius edit based on signals [path:journey, path:activity, path:list, export:ActivityLibraryTable].
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx: apply minimal blast-radius edit based on signals [path:journey, path:activity, path:activities, export:ActivityApplication, preview:activity, preview:activities].

## Dependency Policy Checks
- noNewDependencies: enforced
- Verify package changes are absent unless explicitly approved.
- Preserve existing APIs and route contracts unless requirement says otherwise.

## Regression Watchpoints
- Validate keyboard interactions and ARIA names for changed UI.
- Validate state transitions in loading, empty, and error paths.
- Re-run impacted unit tests before merge.

## Reviewer Refinements
- No structured reviewer refinements were supplied.

## Prompt Override (Code Stage)
- No code-stage prompt override supplied.

## Active Prompt Overrides
- None

## Source Guidance
- `reports/dev-twin/code-workpack.md` is available and should be followed.

