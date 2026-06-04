# Main Developer Rework Prompt

Review cycle: cycle-004
Arbitrator decision: rework_required
Readiness score: 9/10

## Objective
Apply the smallest safe patch that resolves the reviewer findings below.

## Rules
- Keep changes scoped to the existing task and changed files unless the rework item explicitly requires more.
- Do not add dependencies unless the dependency policy explicitly allows it.
- Preserve accessibility behavior and existing repo patterns.
- Update or add deterministic tests when behavior changes.
- After changes, report what was changed and which finding each change addresses.

## Planned Implementation Tasks
- task-001: JOURNEY-25271 Create Assessment The option 'Assessment' displays in the activity dropdown list.

## Changed Files From Current Cycle
- src/App.jsx
- src/components/EmployeeForm.jsx
- src/components/FilterBar.jsx
- tests/activity-filter.spec.md
- tests/employee-form.test.mjs
- .nvmrc
- src/components/employeeFilterUtils.js

## Reviewer Findings
### LOW: Test files changed

Reviewer: Unit Test Reviewer

2 test-related file(s) changed.

Recommendation: Run the targeted test command and confirm the assertions cover acceptance criteria.

Files: tests/activity-filter.spec.md, tests/employee-form.test.mjs
### LOW: Accessibility review found no obvious blocker

Reviewer: Accessibility Reviewer

No immediate keyboard, semantics, or status messaging blocker was detected from the diff preview.

Recommendation: Perform a keyboard pass and inspect accessible names before final approval.
### LOW: No dependency or secret risk detected

Reviewer: Security / Compliance Reviewer

No dependency, obvious secret, or browser-storage risk was detected from the diff preview.

Recommendation: Continue normal compliance review.
### LOW: Verification commands passed

Reviewer: Build Verifier

2 verification step(s) were recorded without failure.

Recommendation: Include verification evidence in final review.
### HIGH: Changed files fall outside the planned write scope

Reviewer: Architecture Reviewer

1 changed file(s) are not in the main developer allowed file list.

Recommendation: Confirm the planner scope or move these changes into an approved task before final review.

Files: .nvmrc

## Verification
- Run targeted tests for changed behavior.
- Run lint/build checks when available.
- Rerun ODT Reviewer Swarm after rework.

