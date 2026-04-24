# ODT Unit Test Matrix

- Generated At: 2026-04-24T13:22:05.418Z

## Matrix
| Scenario | Coverage Type | Expected Assertion | Flake Risk | Mitigation |
| --- | --- | --- | --- | --- |
| Happy path | functional | Core user flow succeeds | low | Prefer explicit behavior assertions |
| Edge path | functional | Boundary inputs produce safe output | medium | Use data-driven test cases |
| Error path | resilience | Errors are surfaced accessibly | medium | Assert error copy and fallback state |
| Keyboard path | a11y | Tab/Enter/Space interactions work | medium | Use role-based queries and keyboard events |

## Related Test Files
- tests/jest/reducers/journey-builder-reducers/activities_reducer.test.js
- tests/jest/reducers/journeys_reducer.test.js
- tests/jest/reducers/journey-builder-reducers/events_reducers.test.js
- tests/jest/modules/journey-builder/events/actions/events_actions.test.js
- tests/jest/modals/roster_competency_modal.test.js
- tests/jest/modules/journey-builder/events/presentational-components/roster_competency_details.test.js

## Prompt Override (Unit Tests Stage)
- No unit-test prompt override supplied.

## Anti-flake Rules
- Avoid timing-dependent assertions without deterministic waits.
- Avoid snapshot-only verification for behavior-heavy flows.
- Prefer role/label queries over brittle selectors.

