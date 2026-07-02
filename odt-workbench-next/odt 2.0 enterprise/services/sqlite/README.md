# SQLite Persistence

SQLite persistence boundary for ODT 2.0 Enterprise.

Target role:

- schema ownership
- migrations
- seed data
- repository functions
- local backup/export
- future adapter boundary for Oracle DB, MySQL, or managed enterprise persistence

Current runtime database files were not copied into the frozen baseline to avoid preserving local machine state.

## Extracted So Far

- `src/repositories/workflow-evidence-repository.js` owns read-only assignment evidence aggregation from prepared SQLite statements.
- `src/repositories/agent-relay-repository.js` owns relay item list, lookup, insert, and update persistence.
- `src/repositories/agent-worker-run-repository.js` owns worker run upsert, output/status update, lookup, and list persistence.
- `src/repositories/approval-event-repository.js` owns approval event create/list persistence.
- `src/repositories/dependency-request-repository.js` owns dependency request create/get/list persistence and decision updates.
- `src/repositories/implementation-evidence-repository.js` owns implementation evidence create, lookup, list, and JSON field parsing.
- `src/repositories/ai-work-audit-pack-repository.js` owns persisted AI work audit-pack snapshots with parsed JSON readback.
- `src/repositories/pr-readiness-report-repository.js` owns PR readiness report create, list, and JSON report parsing.
- `src/repositories/requirement-repository.js` owns requirement create/list persistence.
- `src/repositories/repo-analysis-repository.js` owns repo-analysis create/list persistence with parsed JSON readback.
- `src/repositories/review-comment-repository.js` owns review comment create, lookup, list, and status update persistence.
- `src/repositories/standards-check-repository.js` owns standards check and finding create/list persistence with JSON summary/artifact parsing.
- `src/repositories/technical-design-repository.js` owns technical design create/list persistence with parsed JSON readback.
- `src/repositories/implementation-plan-repository.js` owns implementation plan create/list persistence with parsed JSON readback.
- `src/repositories/test-plan-repository.js` owns test plan create/list persistence with parsed JSON readback.
- `src/repositories/intake-asset-repository.js` owns intake asset create/get/list persistence and analysis updates.
- `src/repositories/agent-foundry-run-repository.js` owns Agent Foundry run-entry create/list persistence with parsed JSON readback.
- `src/repositories/settings-repository.js` owns safe settings list/get/upsert and multi-setting persistence.
- The live backend now uses this repository from `collectEvidence(...)` after preserving the existing relay auto-sync step in `server/index.js`.
- The live backend uses the relay repository for review-comment rework relays, worker-question relays, relay decisions, reviewer-rerun auto-resolve updates, and relay list endpoints.
- The live backend uses the worker-run repository for launch preparation, status refresh, ingest, stop requests, implementation-evidence extraction reads, and Agent Team worker-run lists.
- The live backend uses the approval repository for write approval recording and plan-rework approval evidence.
- The live backend uses the dependency repository for dependency request creation and approve/reject decisions.
- The live backend uses the implementation-evidence repository for manual evidence recording and post-implementation standards check evidence lookup.
- The live backend uses the PR readiness repository for PR pack persistence while keeping blocker calculation and markdown generation in the API layer.
- The live backend uses the requirement repository for intake analysis writes, Jira-import requirement lookup, and planner requirement reads.
- The live backend uses the repo-analysis repository for repo analysis writes, browser-folder repo analysis writes, planner repo reads, and design-draft fallback reads.
- The live backend uses the technical-design repository for design draft persistence and plan-draft design fallback reads.
- The live backend uses the implementation-plan repository for plan draft persistence.
- The live backend uses the test-plan repository for plan draft test-plan persistence.
- The live backend uses the intake-asset repository for upload persistence, asset listing, file streaming lookup, enrichment lookup, and fallback analysis updates.
- The live backend uses the Agent Foundry repository for focused/full specialist run persistence and grouped run-history listing.
- The live backend uses the settings repository for active-assignment storage, execution-agent readback, safe settings response, and `/api/settings` updates.
- The live backend uses the review-comment repository for reviewer findings ingest, review comment decisions, rework relay creation, reviewer-rerun auto-resolve, and review comment evidence reads.
- The live backend uses the standards repository for pre-implementation, rework-plan, and post-implementation standards check persistence.
- The live backend uses the AI work audit-pack repository for restart-safe audit snapshots created from implementation-evidence, post-check, and PR-ready milestones.
- `packages/testing/src/check-sqlite-repositories.mjs` validates these repositories with fake prepared statements.

## Not Yet Moved

- Schema creation and migrations.
- Assignment, prompt-template, chat, AI usage, connector-event, run-event, and agent-event repositories.

`ensureRelayItemsForAssignment(...)`, intake/Jira orchestration, upload policy enforcement, file copying, local extraction, requirement parsing, repo signal analysis, planner/design orchestration, Agent Foundry output generation, settings response assembly, worker launch, worker ingest, review ingest orchestration, standards review calculation, approval gating, dependency blocker calculation, implementation evidence extraction, post-check orchestration, PR blocker calculation, PR markdown generation, and worker stop orchestration still live in `server/index.js` intentionally. Requirement, repo-analysis, technical-design, implementation-plan, test-plan, intake-asset, Agent Foundry run, settings, worker, relay, approval, dependency request, review-comment, standards, implementation-evidence, and PR readiness rows are repository-backed.

Next safe persistence slice: extract run-event and agent-event persistence behind repositories while keeping Runs, Monitoring, Guide traceability, workflow evidence, and Agent Team relay smoke green.
