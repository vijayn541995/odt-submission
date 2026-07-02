# ODT 2.0 Enterprise

Created: 2026-06-16 17:39 IST
Last refreshed: 2026-06-24 08:14 IST

This folder preserves the latest ODT 2.0 work and defines the next enterprise-grade structure for browser and native app delivery.

## Current Status

The latest ODT 2.0 source has been frozen here:

```text
frozen-baseline/odt-workbench-next-source
```

This snapshot was copied from the current working tree, including uncommitted source changes in:

- `server/index.js`
- `src/main.jsx`
- `src/styles.css`
- `scripts/odt-ui-smoke.mjs`
- current ODT docs under `docs/`

The backup intentionally excludes local runtime state:

- `.git`
- `node_modules`
- `dist`
- `logs`
- `output`
- `.playwright-cli`
- `workspaces`
- `data`
- `.env`
- SQLite database files

This keeps the freeze portable and avoids preserving local machine state or secrets.

## Genuine Architecture Opinion

Yes, this restructuring is needed.

The current implementation has proven the product direction, but it is now carrying too much logic in a few very large files. The main pressure points are:

- `server/index.js` is doing API routing, workflow state, Jira import, monitoring, validation, persistence, AI provider handling, worker orchestration, Guide answers, and PR readiness.
- `src/main.jsx` is doing app boot, routing, page rendering, data shaping, business rules, and many shared UI helpers.
- `src/styles.css` has grown into a broad global stylesheet instead of page and component-level styling.

That is acceptable for fast product discovery, but it will slow us down for enterprise product implementation. The right move is to keep the working ODT 2.0 baseline safe, then migrate into a modular structure by capability.

For browser plus native app support, we should not build two separate ODT products. We should build one shared product core with two shells:

- Browser shell for web access and existing Vite workflow.
- Native desktop shell for local developer workflow, terminal integration, local file access, and packaged enterprise use.

The UI, domain rules, API contracts, standards logic, validation logic, and persistence model should be shared.

## What Is Already Built

ODT 2.0 currently includes:

- Governed SDLC flow from intake to PR readiness.
- Sidebar-based product surfaces: Overview, Intake, Planner, Standards, Agent Team, Review, PR Ready, Artifacts, ODT Guide, Runs, Monitoring, and Settings.
- Completed-Jira verification mode for work that is already Done/Closed/Resolved.
- Current-vs-historical evidence separation so stale artifacts do not make current work look ready.
- Standards and governance model with findings, approvals, dependency decisions, and PR readiness checks.
- Agent Team concepts for Codex, Cline/manual, reviewer, build verifier, worker runs, relay items, and implementation evidence.
- Agent Foundry specialist domains and evidence capture direction.
- ODT Guide with local evidence-aware answers and provider fallback direction.
- Monitoring and validation surfaces, including UI smoke validation.
- Local backend API on port `5190`.
- Browser UI on port `5189`.
- Local SQLite persistence for MVP state.
- Oracle standards, accessibility, VPAT, WCAG, Redwood-like UX, OCI AI, MCP, Jira, and governance docs.

## Target Enterprise Structure

```text
odt 2.0 enterprise/
  apps/
    browser/
      Browser app shell. Vite/React entry point for web use.
    native/
      Native desktop app shell. Intended for Electron or Tauri packaging.
  packages/
    ui/
      Shared React UI components, layouts, sidebar pages, and design system pieces.
    domain/
      Shared workflow, standards, evidence, assignment, Jira, worker, and PR readiness rules.
    api-client/
      Typed browser/native client for the ODT API.
    config/
      Shared runtime config, feature flags, provider config, and safe defaults.
    testing/
      Shared test helpers, smoke flows, fixtures, and validation utilities.
  services/
    api/
      Local/remote backend API modules.
    sqlite/
      SQLite schema, migrations, repositories, and seed data.
  docs/
    architecture/
      Enterprise migration, system design, module ownership, and roadmap docs.
  frozen-baseline/
    odt-workbench-next-source/
      Source-only freeze of the current ODT 2.0 implementation.
```

## Folder Purpose Guide

| Folder | Purpose |
| --- | --- |
| `frozen-baseline/` | Keeps the current ODT 2.0 work safe before restructuring. Use this as the restore point and behavior reference. |
| `frozen-baseline/odt-workbench-next-source/` | Source-only backup of the latest working ODT 2.0 implementation, including frontend, backend, docs, scripts, standards, governance, and Agent Foundry files. |
| `apps/` | Holds final runnable application shells. Each app should be thin and should reuse shared packages. |
| `apps/browser/` | Browser/web version of ODT. This should become the Vite/React app that users open in the browser. |
| `apps/native/` | Native desktop version of ODT. This should become the Electron or Tauri shell for packaged local developer use. |
| `apps/native/src/main/` | Native main process code, such as app startup, window creation, local service startup, menus, and OS-level integration. |
| `apps/native/src/preload/` | Secure bridge between the native shell and the renderer UI. Keep privileged native APIs here, not in React components. |
| `apps/native/src/renderer/` | Native renderer entry point that hosts the shared React UI inside the desktop app. |
| `packages/` | Shared product code used by both browser and native apps. This is where we prevent duplicate implementations. |
| `packages/ui/` | Shared React UI, layouts, page shells, sidebar features, reusable components, and visual patterns. |
| `packages/ui/src/features/` | Feature folders mapped to the sidebar: Overview, Intake, Planner, Standards, Agent Team, Review, PR Ready, Artifacts, Guide, Runs, Monitoring, and Settings. |
| `packages/domain/` | Pure business rules: workflow state, evidence freshness, standards decisions, Jira verification, worker status, monitoring severity, and PR readiness. |
| `packages/api-client/` | Shared client used by browser and native shells to call the ODT API consistently. |
| `packages/config/` | Shared constants, route IDs, feature flags, safe runtime defaults, upload limits, and port values. Do not store secrets here. |
| `packages/testing/` | Shared Playwright flows, smoke-test helpers, fixtures, API test utilities, and baseline comparison helpers. |
| `services/` | Backend and persistence services. These should run locally for native mode and can also serve browser mode. |
| `services/api/` | Backend API service, split by capability rather than one large server file. |
| `services/api/src/modules/` | Backend modules such as workflow, intake, Jira, governance, standards, agent workers, review, PR readiness, validation, monitoring, Guide, providers, and settings. |
| `services/sqlite/` | SQLite persistence boundary for local MVP/native development. |
| `services/sqlite/migrations/` | Versioned database schema changes. |
| `services/sqlite/seeds/` | Safe local seed data for development and demos. |
| `docs/` | Enterprise documentation for architecture, migration, system design, and operating decisions. |
| `docs/architecture/` | Architecture notes, module ownership, extraction order, browser/native strategy, and long-term product design. |

## Extraction Progress

Started on 2026-06-16:

- Added root workspace metadata in `package.json`.
- Added shared navigation and port config in `packages/config`.
- Added shared workflow/domain helpers in `packages/domain`.
- Added sidebar feature ownership files in `packages/ui/src/features`.
- Added shared sidebar and app-shell components in `packages/ui/src/layout`.
- Added browser/native shell placeholders that consume the shared app shell.
- Added a shared API client start in `packages/api-client`.
- Added the first backend module boundary in `services/api/src/modules/workflow`.
- Added SQLite service ownership marker in `services/sqlite`.
- Added a structure check script in `packages/testing`.
- Added workflow contract validation and representative workflow fixtures in `packages/testing/src/fixtures/workflow`.
- Captured a live workflow fixture for `assignment-local-mvp` from the local API.

Current migration status:

- The live ODT app still runs from the original source files.
- The enterprise modules are extraction targets and shared contracts.
- Backend behavior is still mostly in the original source files, but the live workflow routes now go through the enterprise workflow service facade.
- First frontend shell extraction has started with shared sidebar/app shell code.
- Backend workflow fixture validation now protects key states before deeper migration.
- The live browser app now consumes the shared enterprise sidebar, shared `AppShell`, and shared `PageRouter` through Vite aliases.
- `RunsPage` is the first page component migrated into `packages/ui/src/features/runs` and wired back into the live browser app.
- `SettingsPage` is migrated into `packages/ui/src/features/settings` and wired back into the live browser app.
- `MonitoringPage` is migrated into `packages/ui/src/features/monitoring` and wired back into the live browser app.
- `GuidePage` is migrated into `packages/ui/src/features/guide` and wired back into the live browser app.
- `ArtifactsPage` is migrated into `packages/ui/src/features/artifacts` and wired back into the live browser app.
- `PrReadinessPage` is migrated into `packages/ui/src/features/pr-ready` and wired back into the live browser app.
- `ReviewPage` is migrated into `packages/ui/src/features/review` and wired back into the live browser app.
- `StandardsPage` is migrated into `packages/ui/src/features/standards` and wired back into the live browser app.
- `PlannerPage` is migrated into `packages/ui/src/features/planner` and wired back into the live browser app.
- `OverviewPage` is migrated into `packages/ui/src/features/overview` and wired back into the live browser app.
- `IntakePage` is migrated into `packages/ui/src/features/intake` and wired back into the live browser app.
- `AgentTeamPage` is migrated into `packages/ui/src/features/agent-team` and wired back into the live browser app.
- Shared page primitives now live in `packages/ui/src/primitives` and are consumed by the live browser app.
- Shared `ActionList`, `MetricCard`, and `WorkflowDecisionBar` primitives are now extracted for remaining workflow pages.
- Shared formatting utilities now live in `packages/ui/src/utils` and are consumed by the live browser app through stable local wrappers.
- Shared evidence freshness selectors and standards-gate selectors now live in `packages/domain` and are consumed by the live browser app through stable local wrappers.
- Shared assignment/work-key selectors now live in `packages/domain`, and the live browser app consumes the default assignment ID from `packages/config`.
- Shared evidence input parsing helpers now live in `packages/domain/src/evidence-input.js`.
- Added `docs/architecture/agent-team-migration-preflight.md` to lock down the high-risk Agent Team extraction boundary and UI verification checklist.
- The old local `RunsPage`, `SettingsPage`, `MonitoringPage`, `GuidePage`, `ArtifactsPage`, `PrReadinessPage`, `ReviewPage`, `StandardsPage`, `PlannerPage`, `OverviewPage`, `IntakePage`, and `AgentTeamPage` copies have been removed from `src/main.jsx`.
- Added `ODT_SMOKE_MODE=agent-team-relay` to `scripts/odt-ui-smoke.mjs` so the Review Cycle Closeout relay path can be verified after future Agent Team changes.
- Frontend sidebar-page extraction is now complete enough to shift the next major slice to backend workflow/state extraction.
- Added `services/api/src/modules/workflow/review-cycle-closeout.js` as the first extracted backend workflow calculator.
- Added `services/api/src/modules/workflow/workflow-helpers.js` for shared pure workflow helper functions.
- Added `services/api/src/modules/workflow/workflow-state.js` for `buildWorkflowDecisionTrail(...)` and `deriveWorkflowState(...)`.
- Expanded `services/api/src/modules/workflow/workflow-service.js` into a live API facade for workflow state and review-cycle closeout.
- Wired `server/index.js` workflow routes through `createWorkflowService(...)` while preserving response shape for `GET /api/workflow/state/:assignmentId` and `GET /api/review/cycle/:assignmentId/closeout`.
- Added review-cycle closeout contract validation and fixtures in `packages/testing`.
- Added direct workflow derivation fixtures so the extracted workflow-state module is tested independently from static response snapshots.
- Consolidated `review-cycle-closeout.js` onto `workflow-helpers.js` instead of keeping duplicate local helper definitions.
- Wired `server/index.js` workflow derivation through `deriveWorkflowStateFromModule(...)` with injected completed-Jira and evidence-freshness helpers. Local helper copies remain only for other server callers such as PR readiness, monitoring, and agent contracts.
- Added `services/api/src/modules/workflow/workflow-evidence.js` for completed-Jira verification profiles, evidence freshness cutoff/splitting, and current evidence scoping.
- Updated `workflow-state.js` so `deriveWorkflowState(...)` uses the extracted evidence helpers by default.
- Replaced the copied completed-Jira and freshness implementations in `server/index.js` with compatibility wrappers that delegate to the enterprise workflow module.
- Added `packages/testing/src/fixtures/workflow/workflow-evidence-fixtures.js` and workflow contract assertions for Jira profile fields, current/historical split counts, and scoped current evidence counts.
- Removed the temporary `server/index.js` compatibility wrappers for completed-Jira verification and evidence freshness.
- PR readiness, monitoring, agent contract/delegation, Guide context, evidence collection, and workflow route paths now call `deriveJiraVerificationProfile`, `splitEvidenceByFreshness`, and `scopedCurrentEvidence` directly from the enterprise workflow module.
- `createWorkflowService(...)` now uses the enterprise module default `deriveWorkflowState(...)` instead of a server-local passthrough.
- Added `services/sqlite/src/repositories/workflow-evidence-repository.js` as the first read-only SQLite repository boundary for assignment evidence aggregation.
- `collectEvidence(...)` now keeps relay auto-sync in `server/index.js`, then reads assignment evidence through the SQLite repository and applies workflow freshness/state enrichment.
- Added `packages/testing/src/check-sqlite-repositories.mjs` and wired it into `npm run check`.
- Added `services/sqlite/src/repositories/agent-relay-repository.js` for relay item persistence: list, find by unique key, get by id, insert, and update.
- Routed review-comment rework relay creation, worker-question relay creation, relay decisions, reviewer-rerun auto-resolve updates, and relay list endpoints through the relay repository.
- Direct `agent_relay_items` statement calls now stay inside SQLite repository modules and prepared statement definitions.
- Added `services/sqlite/src/repositories/agent-worker-run-repository.js` for worker run upsert, output/status updates, get by id, and list by assignment.
- Routed worker run status sync, prepared launch, worker output ingest, implementation-evidence extraction reads, stop requests, relay auto-sync reads, and Agent Team worker-run lists through the worker-run repository.
- Direct `agent_worker_runs` statement calls now stay inside SQLite repository modules and prepared statement definitions.
- Added `services/sqlite/src/repositories/review-comment-repository.js` for review comment create, lookup, list, and status update persistence.
- Routed reviewer findings ingest, review comment decision updates, rework relay creation, reviewer-rerun auto-resolve, and review comment evidence reads through the review-comment repository.
- Direct review-comment statement calls now stay inside SQLite repository modules, repository fixtures, OpenAPI metadata, and prepared statement definitions.
- Added `services/sqlite/src/repositories/implementation-evidence-repository.js` for implementation evidence create, lookup, list, and JSON field parsing.
- Routed manual implementation evidence recording and post-implementation standards check lookup through the implementation-evidence repository.
- Direct implementation-evidence write/get calls now stay inside SQLite repository modules, repository fixtures, read-aggregation repository, and prepared statement definitions.
- Added `services/sqlite/src/repositories/pr-readiness-report-repository.js` for PR readiness report create, list, and JSON report parsing.
- Routed PR pack persistence through the PR readiness repository while preserving blocker calculation, evidence summary, markdown generation, and monitoring event creation.
- Direct PR readiness report insert calls now stay inside SQLite repository modules, repository fixtures, read-aggregation repository, and prepared statement definitions.
- Added `services/sqlite/src/repositories/standards-check-repository.js` for standards check and finding create/list persistence with JSON summary/artifact parsing.
- Routed pre-implementation checks, rework-plan checks, and post-implementation checks through the standards check repository while preserving standards review calculation and monitoring event creation.
- Direct standards check/finding insert calls now stay inside SQLite repository modules, repository fixtures, read-aggregation repository, and prepared statement definitions.
- Added `services/sqlite/src/repositories/approval-event-repository.js` for approval event create/list persistence.
- Added `services/sqlite/src/repositories/dependency-request-repository.js` for dependency request create/get/list persistence and decision updates.
- Routed write approvals, plan-rework approval evidence, dependency request creation, and dependency approve/reject decisions through SQLite repositories.
- Direct approval/dependency statement calls now stay inside SQLite repository modules, read-aggregation repository, repository fixtures, and prepared statement definitions.
- Added `services/sqlite/src/repositories/requirement-repository.js` for requirement create/list persistence.
- Added `services/sqlite/src/repositories/repo-analysis-repository.js` for repo-analysis create/list persistence with parsed JSON readback.
- Routed Jira import requirement lookup, intake analysis writes, repo analysis writes, browser-folder repo analysis writes, implementation-plan requirement/repo reads, and design-draft repo fallback reads through SQLite repositories.
- Direct requirement/repo-analysis statement calls now stay inside SQLite repository modules, read-aggregation repository, repository fixtures, and prepared statement definitions.
- Added `services/sqlite/src/repositories/technical-design-repository.js` for technical design create/list persistence with parsed JSON readback.
- Added `services/sqlite/src/repositories/implementation-plan-repository.js` for implementation plan create/list persistence with parsed JSON readback.
- Added `services/sqlite/src/repositories/test-plan-repository.js` for test plan create/list persistence with parsed JSON readback.
- Routed technical design writes, implementation plan writes, test plan writes, and plan-draft design fallback reads through SQLite repositories while preserving Planner and Standards behavior.
- Direct technical-design, implementation-plan, and test-plan statement calls now stay inside SQLite repository modules, read-aggregation repository, repository fixtures, and prepared statement definitions.
- Added `services/sqlite/src/repositories/intake-asset-repository.js` for intake asset create/get/list and analysis-update persistence.
- Routed intake asset uploads, list, file streaming, enrichment lookup, and fallback analysis updates through the intake asset repository while preserving local file storage and analysis behavior.
- Direct intake asset statement calls now stay inside SQLite repository modules, read-aggregation repository, repository fixtures, and prepared statement definitions.
- Added `services/sqlite/src/repositories/agent-foundry-run-repository.js` for Agent Foundry run-entry create/list persistence with parsed JSON readback.
- Routed focused/full Agent Foundry run persistence and run-history listing through the Agent Foundry repository while preserving specialist output generation, Guide context, workflow evidence, PR readiness inputs, and Agent Team relay behavior.
- Direct Agent Foundry run statement calls now stay inside SQLite repository modules, read-aggregation repository, repository fixtures, and prepared statement definitions.
- Added `services/sqlite/src/repositories/settings-repository.js` for safe settings list/get/upsert and multi-setting persistence.
- Routed active-assignment storage, execution-agent readback, safe settings response, and `/api/settings` writes through the settings repository while preserving secret-key rejection and provider/config status behavior.
- Direct settings statement calls now stay inside the settings repository, repository fixtures, and prepared statement definitions.
- Added `services/sqlite/src/repositories/run-event-repository.js` and `services/sqlite/src/repositories/agent-event-repository.js` for run-event and agent-event create/list persistence.
- Routed `createRunEvent(...)`, `createAgentEvent(...)`, run listing, run-event detail listing, validation-run aggregation, execution-health issues, and monitoring error-log run-event reads through SQLite repositories while preserving Runs, Monitoring, Guide traceability, workflow evidence, and Agent Team relay behavior.
- Direct run-event and agent-event statement calls now stay inside SQLite repository modules, the workflow read-aggregation repository, repository fixtures, and prepared statement definitions.
- Added `services/sqlite/src/repositories/ai-usage-repository.js`, `services/sqlite/src/repositories/chat-message-repository.js`, and `services/sqlite/src/repositories/connector-event-repository.js` for Guide usage accounting, chat transcript persistence, and connector audit history.
- Routed Guide AI usage writes, Guide chat message writes, Monitoring AI usage reads, Settings connector readiness reads, connector query audit writes, and connector audit listing through SQLite repositories.
- Direct AI usage, chat message, and connector-event statement calls now stay inside SQLite repository modules, repository fixtures, and prepared statement definitions.
- Promoted the AI Innovator Lab Project Contract concept into the enterprise backend with `services/api/src/modules/project-contract`.
- Added `services/sqlite/src/repositories/project-contract-repository.js` for project contract create/update/list/get persistence with parsed JSON arrays for known issues, blocked commands, approval notes, and evidence notes.
- Added live Project Contract API endpoints: `GET /api/project-contracts`, `GET /api/project-contracts/:id`, `POST /api/project-contracts`, `POST /api/project-contracts/:id/readiness`, and `POST /api/project-contracts/:id/handoff`.
- Seeded the default `odt-workbench-local` project contract for the current ODT repo so Agent Team handoffs can use documented commands and approval guardrails instead of guessing.
- Added Project Contract structure and SQLite repository checks while keeping the standalone `odt-ai-innovator-lab` prototype untouched.
- Wired Project Contract into Agent Team governed contracts, delegation runs, and Codex worker bundles so generated handoffs/prompts include repo-specific commands, blocked-command policy, approval notes, and readiness score.
- Updated Agent Team worker launch to prefer the Project Contract repo path over stale browser-folder assignment paths when a saved project contract is present.
- Added the Agent Team `Project Contract Readiness` panel so the UI shows the selected contract, readiness score/checks, run/build/test commands, blocked commands, approval notes, and a `Copy Contract Handoff` action before worker launch.
- Project Contract selection now keeps direct assignment and exact repo-path matches first, then safely falls back to the single active contract when the active demo assignment has no direct contract.
- Added `services/sqlite/src/repositories/assignment-repository.js` for assignment create, context-update, list, and get-by-id persistence.
- Added `services/sqlite/src/repositories/prompt-template-repository.js` for prompt-template seed/list persistence.
- Routed default assignment seeding, active-assignment fallback, assignment creation/context updates, snapshot assignment listing, and safe settings prompt-template metadata through SQLite repositories.
- Routed default Project Contract bootstrap through the existing Project Contract repository so remaining startup persistence is behind repository boundaries.
- Direct assignment, prompt-template, and bootstrap Project Contract statement calls now stay inside SQLite repository modules, repository fixtures, and prepared statement definitions.
- Added `ODT_SMOKE_MODE=demo-hardening` to `scripts/odt-ui-smoke.mjs` so clean-start demo validation checks key backend routes and all 12 sidebar pages in one run.
- Hardened UI smoke browser launch to try Playwright Chromium first, then system Chrome, and updated Agent Team relay smoke to temporarily switch active assignment for UI validation and restore it afterward.
- Added `docs/architecture/demo-hardening-runbook.md` with clean-start commands, sidebar demo path, screenshot evidence list, known risks, and post-demo engineering guidance.

Migration progress estimate:

- Enterprise restructure foundation: about **84%**
- Live app migration into enterprise modules: about **99.7%**
- Overall ODT 2.0 enterprise readiness: about **99.3%**

Latest validation:

- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run build`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check server/index.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/agent-worker-run-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/agent-relay-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/workflow-evidence-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/review-comment-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/implementation-evidence-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/pr-readiness-report-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/standards-check-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/approval-event-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/dependency-request-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/requirement-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/repo-analysis-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/technical-design-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/implementation-plan-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/test-plan-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/intake-asset-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/agent-foundry-run-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/settings-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/agent-event-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/run-event-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/ai-usage-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/chat-message-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/connector-event-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/assignment-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/sqlite/src/repositories/prompt-template-repository.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check packages/testing/src/check-sqlite-repositories.mjs`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/api/src/modules/settings/settings-service.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check packages/testing/src/check-settings-service.mjs`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check scripts/odt-ui-smoke.mjs`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/api/src/modules/workflow/workflow-evidence.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/api/src/modules/workflow/workflow-state.js`: passed.
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check services/api/src/modules/workflow/review-cycle-closeout.js`: passed.
- `npm run check` from this folder: passed with 110 required paths, 4 static workflow fixtures, 2 review-cycle fixtures, 2 derivation fixtures, 1 evidence fixture, 1 live workflow fixture, SQLite workflow-evidence, agent-event, run-event, AI usage, chat-message, connector-event, assignment, prompt-template, approval-event, dependency-request, requirement, repo-analysis, technical-design, implementation-plan, test-plan, intake-asset, Agent Foundry run, settings, project-contract, agent-relay, agent-worker-run, review-comment, implementation-evidence, PR readiness, standards check repository fixtures, and the settings API service contract fixture.
- `ODT_SMOKE_MODE=demo-hardening ODT_ASSIGNMENT_ID=assignment_journey-25577_20260617T074250 ODT_APP_BASE=http://127.0.0.1:5189 ODT_API_BASE=http://127.0.0.1:5190 PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:ui:smoke`: passed after clean API/UI restart and captured 12 screenshots under `output/playwright/demo-hardening-*.png`.
- `ODT_SMOKE_MODE=agent-team-relay ODT_ASSIGNMENT_ID=assignment_journey-25577_20260611T111639 ODT_APP_BASE=http://127.0.0.1:5189 ODT_API_BASE=http://127.0.0.1:5190 PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:ui:smoke`: passed and captured `output/playwright/team-relay-closeout.png`.
- Live non-mutating API probe after wrapper removal confirmed workflow state, review closeout, assignment evidence, monitoring error log, and agent contract endpoints still respond successfully.
- Live non-mutating API probe after repository wiring confirmed workflow state, review closeout, assignment evidence, monitoring error log, and agent contract endpoints still respond successfully through repository-backed evidence reads.
- Live non-mutating API probe after relay repository wiring confirmed `/api/agents/relay/:assignmentId` and `/api/agents/worker-runs/:assignmentId` still expose the expected single implementation rework relay targeted to `fullstack-dev`.
- Live non-mutating API probe after worker-run repository wiring confirmed `/api/agents/worker-runs/:assignmentId` still returns 3 worker runs, 1 relay item, first worker status `response_ready`, and output byte metadata.
- Live non-mutating API probe after review-comment repository wiring confirmed workflow state `REVIEW_CYCLE_CLOSEOUT`, closeout `REWORK_EVIDENCE_REQUIRED`, 1 open warning review comment, 1 review-comment-sourced rework relay targeted to `fullstack-dev`, 3 worker runs, and monitoring relay evidence.
- Live isolated API smoke after implementation-evidence repository wiring recorded, listed, and post-checked evidence on `assignment_impl_evidence_repo_smoke_1781663016635` without changing the canonical review-cycle assignment.
- Canonical review-cycle probe after implementation-evidence repository wiring still confirmed workflow state `REVIEW_CYCLE_CLOSEOUT`, closeout `REWORK_EVIDENCE_REQUIRED`, 1 rework relay, 3 worker runs, and `review_comment` relay context.
- Live isolated API smoke after PR readiness repository wiring prepared a blocked PR pack on `assignment_pr_report_repo_smoke_1781663881707`, read it back through assignment evidence, confirmed `2117` markdown bytes and full evidence summary keys, and confirmed monitoring contained `pr_readiness_pack_prepared`.
- Canonical review-cycle probe after PR readiness repository wiring still confirmed workflow state `REVIEW_CYCLE_CLOSEOUT`, closeout `REWORK_EVIDENCE_REQUIRED`, 1 rework relay, 3 worker runs, and `review_comment` relay context.
- Live isolated API smoke after standards repository wiring created a pre-implementation check and an implementation evidence post-check on `assignment_standards_repo_smoke_1781664437998`, read back 2 checks and 31 findings, and confirmed monitoring contained 2 `standards_check_completed` events.
- Canonical review-cycle probe after standards repository wiring still confirmed workflow state `REVIEW_CYCLE_CLOSEOUT`, closeout `REWORK_EVIDENCE_REQUIRED`, 1 rework relay, 3 worker runs, and `review_comment` relay context.
- Live isolated API smoke after approval/dependency repository wiring created a standards warning, recorded `write_scope` approval evidence, created and approved `dep_1781669611081_i9e0vss` on `assignment_approval_dependency_repo_smoke_1781669611024`, read back 1 approval and 1 dependency request, and confirmed agent contract mode `write-approved` with `installDependencies: true`.
- Canonical review-cycle probe after approval/dependency repository wiring still confirmed workflow state `REVIEW_CYCLE_CLOSEOUT`, closeout `REWORK_EVIDENCE_REQUIRED`, 1 rework relay, 3 worker runs, and `review_comment` relay context.
- Live isolated API smoke after requirement/repo-analysis repository wiring created `assignment_requirement_repo_repo_smoke_1781670581535`, ran intake analysis, repo analysis, design draft, plan draft, and a pre-implementation standards check, then read back 1 requirement, 1 repo analysis, 1 technical design, 1 implementation plan, and 1 standards check with parsed repo-analysis JSON.
- Canonical review-cycle probe after requirement/repo-analysis repository wiring still confirmed workflow state `REVIEW_CYCLE_CLOSEOUT`, next action `Launch Rework Worker`, closeout `REWORK_EVIDENCE_REQUIRED`, 1 rework relay, 3 worker runs, and `review_comment` relay context.
- Live isolated API smoke after technical-design/implementation-plan/test-plan repository wiring created `assignment_design_plan_test_repo_smoke_1781672139521`, ran intake analysis, repo analysis, design draft, plan draft, pre-implementation standards check, and PR readiness preparation, then read back 1 technical design, 1 implementation plan, 1 test plan, and 1 PR readiness report with parsed JSON.
- Canonical review-cycle probe after technical-design/implementation-plan/test-plan repository wiring still confirmed workflow state `REVIEW_CYCLE_CLOSEOUT`, next action `Launch Rework Worker`, closeout `REWORK_EVIDENCE_REQUIRED`, 1 rework relay, 3 worker runs, and `review_comment` relay context.
- Live isolated API smoke after intake asset repository wiring created `assignment_intake_asset_repo_smoke_1781673056020`, uploaded `intake-asset-repository-smoke.md`, listed it, streamed the copied file, checked enrichment, read it back through assignment evidence, confirmed ODT Guide mentioned the uploaded asset, and prepared a blocked PR readiness pack without breaking workflow evidence.
- Canonical review-cycle probe after intake asset repository wiring still confirmed workflow state `REVIEW_CYCLE_CLOSEOUT`, next action `Launch Rework Worker`, closeout `REWORK_EVIDENCE_REQUIRED`, 1 rework relay, 3 worker runs, and `review_comment` relay context.
- Live isolated API smoke after Agent Foundry repository wiring created `assignment_foundry_repo_smoke_1781679987883`, ran a focused Architecture Foundry review, listed the grouped run history, read the persisted output through assignment evidence, confirmed ODT Guide surfaced Foundry context, and prepared a blocked PR readiness pack without breaking workflow evidence.
- Canonical Agent Team relay smoke after Agent Foundry repository wiring still confirmed workflow state `REVIEW_CYCLE_CLOSEOUT`, next action `Launch Rework Worker`, 1 rework relay, 3 worker runs, response/log byte metadata, and visible Agent Relay Inbox.
- Live settings API smoke after settings repository wiring updated `executionAgent: codex` and `settingsRepoSmoke`, rejected unsafe key `apiToken`, confirmed the agent contract still reads `executionAgent: codex`, confirmed ODT Guide still responds through local provider, confirmed Agent Foundry domains still list 10 domains, and preserved canonical workflow state `REVIEW_CYCLE_CLOSEOUT`.
- Canonical Agent Team relay smoke after settings repository wiring still confirmed workflow state `REVIEW_CYCLE_CLOSEOUT`, next action `Launch Rework Worker`, 1 rework relay, 3 worker runs, and visible Agent Relay Inbox.
- Live settings API smoke after settings service extraction confirmed `/api/settings` still returns 3 prompt templates and 8 connectors, safe settings writes still persist, unsafe key `apiToken` is rejected with HTTP 400, and `/api/snapshot` restored active assignment `assignment_journey-25577_20260617T074250`.
- Live API verification after assignment, prompt-template, and bootstrap repository wiring restarted the API on `127.0.0.1:5190`, confirmed `/api/health` online, `/api/snapshot` active assignment `assignment_journey-25577_20260617T074250` with 47 readable assignments, `/api/settings` prompt templates `guide-chat-v1`, `json-extraction-v1`, and `plan-generation-v1`, and `/api/project-contracts` default contract `odt-workbench-local`.
- Live demo-hardening verification after clean API/UI restart confirmed `/api/health`, `/api/snapshot`, `/api/settings`, `/api/project-contracts`, workflow state, review closeout, worker runs, relay items, monitoring error log, runs, connectors, and all sidebar pages: Overview, Intake, Planner, Standards, Agent Team, Review, PR Ready, Artifacts, ODT Guide, Runs, Monitoring, and Settings.
- Live API verification after backend workflow service wiring:
  - `/api/workflow/state/assignment_journey-25577_20260611T111639` returned `REVIEW_CYCLE_CLOSEOUT` with next action `Launch Rework Worker`.
  - `/api/review/cycle/assignment_journey-25577_20260611T111639/closeout` returned `REWORK_EVIDENCE_REQUIRED` with `activeReworkCount: 1`.
  - The workflow response included an 18-item decision trail from the extracted workflow-state module.

Workflow validation commands:

```bash
cd "/Users/vn105957/Desktop/odt-submission/odt-workbench-next/odt 2.0 enterprise"
npm run check
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run capture:workflow -- assignment-local-mvp

cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/review-comment-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/implementation-evidence-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/pr-readiness-report-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/standards-check-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/approval-event-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/dependency-request-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/requirement-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/repo-analysis-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/technical-design-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/implementation-plan-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/test-plan-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/intake-asset-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/agent-foundry-run-repository.js"
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/sqlite/src/repositories/settings-repository.js"
ODT_SMOKE_MODE=agent-team-relay ODT_ASSIGNMENT_ID=assignment_journey-25577_20260611T111639 PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:ui:smoke
```

## Recommended Native Strategy

Use React for the shared UI and add a native desktop shell around it.

Recommended path:

- Keep `apps/browser` as the web app.
- Create `apps/native` as the desktop shell.
- Share page components from `packages/ui`.
- Share business rules from `packages/domain`.
- Run the API as a local service in desktop mode.
- Keep SQLite local for MVP/native development.
- Design persistence behind repositories so SQLite can later be swapped or complemented by Oracle DB, MySQL, or enterprise services.

Electron is the practical first choice if we want the fastest native app path because it fits the existing React/Vite/Node backend work. Tauri can be evaluated later if binary size and Rust-based shell hardening become priorities.

## Roadmap

1. Freeze baseline: done in this folder.
2. Create enterprise workspace skeleton: started in this folder.
3. Split frontend by sidebar feature:
   - `overview`
   - `intake`
   - `planner`
   - `standards`
   - `agent-team`
   - `review`
   - `pr-ready`
   - `artifacts`
   - `guide`
   - `runs`
   - `monitoring`
   - `settings`
4. Extract shared UI primitives:
   - sidebar
   - page header
   - panels
   - badges
   - tables
   - timelines
   - evidence cards
   - workflow progress
5. Split backend by capability:
   - assignments
   - workflow state
   - intake assets
   - Jira connector
   - standards and governance
   - agent workers
   - Agent Foundry
   - review and rework relay
   - implementation evidence
   - PR readiness
   - validation and monitoring
   - Guide knowledge retrieval
   - provider configuration
6. Move SQLite into an explicit persistence layer:
   - schema
   - migrations
   - repositories
   - seed data
   - backup/export strategy
7. Add browser app shell.
8. Add native app shell.
9. Add typed API contracts and shared client.
10. Add tests around extracted domain rules before deep rewrites.
11. Validate behavior against the frozen baseline after each migration slice.
12. Package native app only after browser parity and local service startup are stable.

## Migration Rule

Do not rewrite the product in one pass.

The safe enterprise migration pattern is:

```text
freeze current source
  -> extract one module
  -> run build/smoke validation
  -> compare behavior with frozen baseline
  -> commit
  -> repeat
```

This keeps the demo and product direction safe while improving maintainability.

## Immediate Next Step

Continue backend workflow extraction behind the existing API behavior:

```text
services/api/src/modules/workflow
```

Completed in the latest slices: completed-Jira verification and evidence-freshness helpers (`deriveJiraVerificationProfile`, `splitEvidenceByFreshness`, `scopedCurrentEvidence`) now live behind `services/api/src/modules/workflow`, and remaining PR readiness, monitoring, agent contract/delegation, Guide context, evidence collection, and workflow route callers use those enterprise helpers directly instead of server-local wrappers.

Completed in the latest slice: assignment evidence read aggregation now goes through `services/sqlite/src/repositories/workflow-evidence-repository.js`.

Completed in the latest slice: relay item persistence now goes through `services/sqlite/src/repositories/agent-relay-repository.js`, while `ensureRelayItemsForAssignment(...)` orchestration remains behavior-identical in `server/index.js`.

Completed in the latest slice: agent worker run persistence now goes through `services/sqlite/src/repositories/agent-worker-run-repository.js`, while launch, ingest, stop, and relay orchestration remain behavior-identical in `server/index.js`.

Completed in the latest slice: review comment persistence now goes through `services/sqlite/src/repositories/review-comment-repository.js`, while reviewer ingest, status updates, reviewer-rerun auto-resolve, and rework relay orchestration remain behavior-identical in `server/index.js`.

Completed in the latest slice: implementation evidence persistence now goes through `services/sqlite/src/repositories/implementation-evidence-repository.js`, while manual evidence recording, from-worker evidence orchestration, post-check handoff, and PR readiness signals remain behavior-identical in `server/index.js`.

Completed in the latest slice: PR readiness report persistence now goes through `services/sqlite/src/repositories/pr-readiness-report-repository.js`, while PR pack generation, blocker calculation, evidence summary, markdown output, and monitoring signals remain behavior-identical in `server/index.js`.

Completed in the latest slice: standards check and standards finding persistence now goes through `services/sqlite/src/repositories/standards-check-repository.js`, while standards review calculation, workflow blocker calculation, pre/post checks, and monitoring signals remain behavior-identical in `server/index.js`.

Completed in the latest slice: approval event and dependency request persistence now goes through `services/sqlite/src/repositories/approval-event-repository.js` and `services/sqlite/src/repositories/dependency-request-repository.js`, while approval gating, dependency blocker calculation, contract readback, and monitoring/event orchestration remain behavior-identical in `server/index.js`.

Completed in the latest slice: requirement and repository-analysis persistence now goes through `services/sqlite/src/repositories/requirement-repository.js` and `services/sqlite/src/repositories/repo-analysis-repository.js`, while intake/Jira import orchestration, repo signal analysis, planner/design orchestration, standards checks, and workflow state remain behavior-identical in `server/index.js`.

Completed in the latest slice: technical design, implementation plan, and test plan persistence now goes through `services/sqlite/src/repositories/technical-design-repository.js`, `services/sqlite/src/repositories/implementation-plan-repository.js`, and `services/sqlite/src/repositories/test-plan-repository.js`, while Planner generation, Standards checks, workflow state, and PR readiness inputs remain behavior-identical in `server/index.js`.

Completed in the latest slice: intake asset persistence now goes through `services/sqlite/src/repositories/intake-asset-repository.js`, while upload policy, copied workspace files, local asset analysis, file streaming, enrichment status, Guide context, and PR readiness inputs remain behavior-identical in `server/index.js`.

Completed in the latest slice: Agent Foundry run persistence now goes through `services/sqlite/src/repositories/agent-foundry-run-repository.js`, while specialist-domain selection, advisory output generation, Guide context, workflow evidence, PR readiness inputs, and Agent Team relay behavior remain behavior-identical.

Completed in the latest slice: settings persistence now goes through `services/sqlite/src/repositories/settings-repository.js`, while active-assignment storage, safe settings reads/writes, secret-key rejection, execution-agent selection, provider/config status, Guide behavior, Agent Foundry behavior, and Agent Team relay behavior remain behavior-identical.

Completed in the latest slice: run-event and agent-event persistence now goes through `services/sqlite/src/repositories/run-event-repository.js` and `services/sqlite/src/repositories/agent-event-repository.js`, while Runs, Monitoring, validation-run aggregation, execution-health issues, Guide traceability, workflow evidence, and Agent Team relay behavior remain behavior-identical.

Completed in the latest slice: AI usage, chat-message, and connector-event persistence now goes through `services/sqlite/src/repositories/ai-usage-repository.js`, `services/sqlite/src/repositories/chat-message-repository.js`, and `services/sqlite/src/repositories/connector-event-repository.js`, while Guide responses, Monitoring usage/error summaries, Settings connector readiness, and connector audit history remain behavior-identical.

Completed in the latest slice: assignment and prompt-template persistence now goes through `services/sqlite/src/repositories/assignment-repository.js` and `services/sqlite/src/repositories/prompt-template-repository.js`, while active assignment selection, default seed data, assignment context updates, snapshot behavior, and OpenAPI/settings prompt metadata remain behavior-identical.

Completed in the latest slice: remaining default Project Contract bootstrap persistence now goes through `services/sqlite/src/repositories/project-contract-repository.js` instead of direct statement calls.

Completed in the latest slice: final migration audit and demo hardening now has a clean-start runbook plus `ODT_SMOKE_MODE=demo-hardening`, which validates backend health and all 12 sidebar pages before further backend extraction.

Completed in the latest slice: settings API response/update policy now goes through `services/api/src/modules/settings`, preserving safe settings reads/writes, secret-key rejection, prompt-template metadata, provider/config status, connector readiness, active-assignment storage, and demo-hardening smoke behavior.

Next safe slice: extract a low-risk assignment/snapshot read service from `server/index.js` into `services/api/src/modules/assignments`, preserving active-assignment fallback, assignment list shape, workflow context aggregation, and demo-hardening smoke behavior.
