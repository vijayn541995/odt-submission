# ODT Unit Test Matrix

- Generated At: 2026-05-15T00:02:32.978Z

## Matrix
| Scenario | Coverage Type | Expected Assertion | Flake Risk | Mitigation |
| --- | --- | --- | --- | --- |
| Happy path | functional | Core user flow succeeds | low | Prefer explicit behavior assertions |
| Edge path | functional | Boundary inputs produce safe output | medium | Use data-driven test cases |
| Error path | resilience | Errors are surfaced accessibly | medium | Assert error copy and fallback state |
| Keyboard path | a11y | Tab/Enter/Space interactions work | medium | Use role-based queries and keyboard events |

## Related Test Files
- tests/jest/reducers/journey-builder-reducers/activities_reducer.test.js
- tests/jest/reducers/journey-builder-reducers/activities_type_reducer.test.js
- tests/jest/reducers/journeys_reducer.test.js

## Prompt Override (Unit Tests Stage)
- No unit-test prompt override supplied.

## Anti-flake Rules
- Avoid timing-dependent assertions without deterministic waits.
- Avoid snapshot-only verification for behavior-heavy flows.
- Prefer role/label queries over brittle selectors.

