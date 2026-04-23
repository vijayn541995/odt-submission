# Codex Workpack: ODT Unit Test Generation

Work Item: change the submit request button text to submit employee form

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

