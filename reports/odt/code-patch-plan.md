# ODT Code Patch Plan

- Generated At: 2026-04-24T13:22:05.417Z
- Work Item: when attempting to add a Journey Note, after entering the note and clicking Add, the sc...

## File-by-file Intent
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/journey_table.jsx: apply minimal blast-radius edit based on signals [path:journey, path:page, path:able, path:activity, export:JourneyTable, preview:able].
- src/journey-builder-app/modules/journey-user/roster/modal/EventTable.jsx: apply minimal blast-radius edit based on signals [path:journey, path:able, path:event, export:EventTable, preview:able].
- src/journey-builder-app/utils/error_page.jsx: apply minimal blast-radius edit based on signals [path:journey, path:page, path:error, export:ErrorPage].
- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_found.jsx: apply minimal blast-radius edit based on signals [path:journey, path:page, path:found, path:activity, export:NoActivitiesFound, preview:able].
- src/journey-builder-app/modules/journey-builder/events/container-components/home/no_table_content.jsx: apply minimal blast-radius edit based on signals [path:journey, path:able, path:event, export:NoTableContent, preview:journey, preview:able].
- src/journey-builder-app/modules/journey-reports/container-components/home/ReportGroupJourneySummaryTable.jsx: apply minimal blast-radius edit based on signals [path:journey, path:able, export:ReportGroupJourneySummaryTable, preview:able].
- src/journey-builder-app/modules/journey-builder/journeys/container-components/resuable/no_activities_found.jsx: apply minimal blast-radius edit based on signals [path:journey, path:found, path:able, export:NoActivitiesFound, preview:found, preview:able].
- src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/dnd_table/activity_reorder_component.jsx: apply minimal blast-radius edit based on signals [path:journey, path:able, path:activity, export:ActivityReorderComponent, preview:able, preview:activity].

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
Dont use If  conditions you can change the entity_id to user_id for the fix

## Active Prompt Overrides
- Code Workpack

## Source Guidance
- `reports/dev-twin/code-workpack.md` is available and should be followed.

