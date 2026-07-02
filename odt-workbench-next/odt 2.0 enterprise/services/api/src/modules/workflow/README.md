# Workflow Module

This is the first backend extraction target.

## Current Legacy Ownership

Most implementation still lives in `server/index.js`.

Important legacy functions:

- `collectEvidence`
- `deriveWorkflowState`
- `buildWorkflowDecisionTrail`
- approval and blocker helpers
- worker status helpers
- test and PR readiness helpers

## Extracted So Far

- `workflow-service.js` exposes `createWorkflowService(...)`, now used by the live backend route handlers for workflow state and review-cycle closeout.
- `workflow-helpers.js` owns shared pure helper functions for approvals, blockers, worker output, implementation tests, labels, and time sorting.
- `workflow-evidence.js` owns completed-Jira verification profile detection, evidence freshness cutoff/splitting, and current evidence scoping.
- `workflow-state.js` owns `buildWorkflowDecisionTrail(...)` and `deriveWorkflowState(...)`.
- `review-cycle-closeout.js` owns the pure review-cycle closeout calculator and imports shared helpers from `workflow-helpers.js`.
- `packages/testing/src/fixtures/workflow/review-cycle-closeout-fixtures.js` protects the open-rework and ready-for-PR-pack closeout states.
- `packages/testing/src/fixtures/workflow/workflow-derivation-fixtures.js` protects direct workflow-state derivation.
- `packages/testing/src/fixtures/workflow/workflow-evidence-fixtures.js` protects completed-Jira profile parsing, persisted audit-pack presence, and freshness scoping.
- `services/sqlite/src/repositories/agent-relay-repository.js` owns relay item persistence used by review rework relay, worker question relay, relay decision, and auto-resolve flows.
- `services/sqlite/src/repositories/agent-worker-run-repository.js` owns worker run upsert, output/status update, lookup, and list persistence.
- `services/sqlite/src/repositories/approval-event-repository.js` owns approval event create/list persistence used by write approval and plan-rework approval evidence flows.
- `services/sqlite/src/repositories/dependency-request-repository.js` owns dependency request create/get/list persistence and decision updates.
- `services/sqlite/src/repositories/implementation-evidence-repository.js` owns implementation evidence create, lookup, list, and JSON field parsing.
- `services/sqlite/src/repositories/ai-work-audit-pack-repository.js` owns persisted AI work audit-pack snapshots for restart-safe audit review.
- `services/sqlite/src/repositories/pr-readiness-report-repository.js` owns PR readiness report create, list, and JSON report parsing.
- `services/sqlite/src/repositories/requirement-repository.js` owns requirement create/list persistence.
- `services/sqlite/src/repositories/repo-analysis-repository.js` owns repo-analysis create/list persistence with parsed JSON readback.
- `services/sqlite/src/repositories/review-comment-repository.js` owns review comment create, lookup, list, and status update persistence.
- `services/sqlite/src/repositories/standards-check-repository.js` owns standards check and finding create/list persistence with JSON summary/artifact parsing.
- `services/sqlite/src/repositories/technical-design-repository.js` owns technical design create/list persistence with parsed JSON readback.
- `services/sqlite/src/repositories/implementation-plan-repository.js` owns implementation plan create/list persistence with parsed JSON readback.
- `services/sqlite/src/repositories/test-plan-repository.js` owns test plan create/list persistence with parsed JSON readback.
- `services/sqlite/src/repositories/intake-asset-repository.js` owns intake asset create/get/list persistence and analysis updates.
- `services/sqlite/src/repositories/agent-foundry-run-repository.js` owns Agent Foundry run-entry create/list persistence with parsed JSON readback.
- `services/sqlite/src/repositories/settings-repository.js` owns safe settings list/get/upsert and multi-setting persistence.
- `services/sqlite/src/repositories/workflow-evidence-repository.js` owns read-only assignment evidence aggregation used by live `collectEvidence(...)`.

`server/index.js` now imports completed-Jira and evidence-freshness helpers directly from this module. The remaining major server coupling is implementation evidence orchestration, standards review orchestration, approval/dependency orchestration, PR blocker/markdown orchestration, Agent Foundry output orchestration, intake/repo/planner orchestration, settings response orchestration, run/monitoring persistence, and broader SQLite statement ownership.

## Target Ownership

This module should own:

- workflow state derivation
- allowed actions
- blocked reasons
- decision trail
- completed-Jira verification mode
- workflow route handler for `GET /api/workflow/state/:assignmentId`
- review-cycle closeout route handler for `GET /api/review/cycle/:assignmentId/closeout`

## Migration Plan

1. Keep the live app behavior stable through `server/index.js` while route calls pass through `createWorkflowService(...)`.
2. Move persistence behind injected repositories after the workflow rules are stable.
3. Extract run-event and agent-event persistence next, keeping Runs, Monitoring, Guide traceability, workflow evidence, and Agent Team relay behavior identical.
4. Keep completed-Jira verification, review-cycle closeout, blocked standards, blocked review, and PR-ready states covered by fixtures.

## Current Test Coverage

Workflow contract fixtures now live in:

```text
packages/testing/src/fixtures/workflow/workflow-state-fixtures.js
```

Run:

```bash
npm run check:workflow
```

Current fixtures cover:

- intake started
- completed Jira verification
- standards blocked
- PR ready
- open rework relay closeout
- ready-for-PR-pack closeout after reviewer/build-verifier evidence
- direct intake workflow derivation
- direct review-cycle closeout workflow derivation
- completed-Jira evidence profile parsing
- current-vs-historical evidence freshness splitting
- scoped current evidence helper output

A live fixture has also been captured from:

```text
/api/workflow/state/assignment-local-mvp
```

Refresh it with Node 24 while the local API is running:

```bash
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run capture:workflow -- assignment-local-mvp
```
