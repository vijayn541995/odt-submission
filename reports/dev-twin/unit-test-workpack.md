# Codex Workpack: ODT Unit Test Generation

Work Item: JOURNEY-25271 Create Assessment

Generate or update Jest/RTL tests for impacted behavior.
Cover:
- Happy path
- Error path
- Empty/loading states
- Keyboard accessibility interactions where applicable

Known related test files:
- tests/jest/reducers/journey-builder-reducers/activities_reducer.test.js
- tests/jest/reducers/journey-builder-reducers/activities_type_reducer.test.js
- tests/jest/reducers/journeys_reducer.test.js

Prompt override (unit test stage):
- None supplied

Rules:
- Keep tests deterministic and isolated.
- Avoid snapshot-only validation for behavior-heavy flows.
- Assert accessibility roles/labels when adding interactive UI.

Verification command:
- npm test -- --watch=false --runInBand

