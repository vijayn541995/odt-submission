# Codex Workpack: ODT Unit Test Generation

Work Item: when attempting to add a Journey Note, after entering the note and clicking Add, the sc...

Generate or update Jest/RTL tests for impacted behavior.
Cover:
- Happy path
- Error path
- Empty/loading states
- Keyboard accessibility interactions where applicable

Known related test files:
- tests/jest/reducers/journey-builder-reducers/activities_reducer.test.js
- tests/jest/reducers/journeys_reducer.test.js
- tests/jest/reducers/journey-builder-reducers/events_reducers.test.js
- tests/jest/modules/journey-builder/events/actions/events_actions.test.js
- tests/jest/modals/roster_competency_modal.test.js
- tests/jest/modules/journey-builder/events/presentational-components/roster_competency_details.test.js

Prompt override (unit test stage):
- None supplied

Rules:
- Keep tests deterministic and isolated.
- Avoid snapshot-only validation for behavior-heavy flows.
- Assert accessibility roles/labels when adding interactive UI.

Verification command:
- npm test -- --watch=false --runInBand

