# ODT 2.0 Demo Hardening Runbook

Last updated: 2026-06-22 11:26 IST

## Purpose

This runbook is the pre-demo checklist for the migrated ODT 2.0 Workbench. It proves the current browser UI, backend API, SQLite repositories, Project Contract bootstrap, Agent Team relay path, and sidebar pages still work after the enterprise restructuring.

Use this before demos, context migration, or handoff to a fresh Codex session.

## Current Demo State

- Workspace: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next`
- Browser UI: `http://127.0.0.1:5189`
- Backend API: `http://127.0.0.1:5190`
- Active demo assignment: `assignment_journey-25577_20260617T074250`
- Canonical relay regression assignment: `assignment_journey-25577_20260611T111639`
- Current workflow state for active demo assignment: `REVIEW_CYCLE_CLOSEOUT`
- Current closeout status for active demo assignment: `REVIEWER_RERUN_REQUIRED`
- Project Contract seed: `odt-workbench-local`
- Prompt templates: `guide-chat-v1`, `json-extraction-v1`, `plan-generation-v1`

## Clean Start

Start API and UI from the workspace root:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run api
```

In a second terminal:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run dev
```

Expected listeners:

```bash
lsof -nP -iTCP:5190 -sTCP:LISTEN
lsof -nP -iTCP:5189 -sTCP:LISTEN
```

## Fast Validation

Run syntax/build checks:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check server/index.js
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check scripts/odt-ui-smoke.mjs
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm --prefix "odt 2.0 enterprise" run check
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run build
```

Run all-sidebar demo smoke:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
ODT_SMOKE_MODE=demo-hardening \
ODT_ASSIGNMENT_ID=assignment_journey-25577_20260617T074250 \
ODT_APP_BASE=http://127.0.0.1:5189 \
ODT_API_BASE=http://127.0.0.1:5190 \
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH \
npm run test:ui:smoke
```

Run Agent Team relay regression smoke:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
ODT_SMOKE_MODE=agent-team-relay \
ODT_ASSIGNMENT_ID=assignment_journey-25577_20260611T111639 \
ODT_APP_BASE=http://127.0.0.1:5189 \
ODT_API_BASE=http://127.0.0.1:5190 \
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH \
npm run test:ui:smoke
```

Note: the smoke script first tries Playwright's bundled Chromium, then falls back to system Chrome. In Codex sandboxed runs, Chrome launch may require unsandboxed approval.

## What The Demo-Hardening Smoke Checks

The `demo-hardening` mode verifies backend routes and captures screenshots for every sidebar page.

Backend routes:

- `/api/health`
- `/api/snapshot`
- `/api/settings`
- `/api/project-contracts`
- `/api/workflow/state/:assignmentId`
- `/api/review/cycle/:assignmentId/closeout`
- `/api/agents/worker-runs/:assignmentId`
- `/api/agents/relay/:assignmentId`
- `/api/monitoring/error-log?assignmentId=:assignmentId`
- `/api/runs?assignmentId=:assignmentId`
- `/api/connectors`

Sidebar screenshots:

- `output/playwright/demo-hardening-overview.png`
- `output/playwright/demo-hardening-intake.png`
- `output/playwright/demo-hardening-planner.png`
- `output/playwright/demo-hardening-standards.png`
- `output/playwright/demo-hardening-team.png`
- `output/playwright/demo-hardening-review.png`
- `output/playwright/demo-hardening-pr-ready.png`
- `output/playwright/demo-hardening-artifacts.png`
- `output/playwright/demo-hardening-guide.png`
- `output/playwright/demo-hardening-runs.png`
- `output/playwright/demo-hardening-monitoring.png`
- `output/playwright/demo-hardening-settings.png`

The relay smoke also captures:

- `output/playwright/team-relay-closeout.png`

## Demo Flow

Use this click path for a stable product walkthrough:

1. Open `http://127.0.0.1:5189`.
2. Start on `Overview` and show workflow state, current work, standards gate, and recent activity.
3. Open `Intake` and show repo/Jira/context-file intake without running new writes.
4. Open `Planner` and show plan summary, approval gate, impacted files/tests, and Agent Handoff.
5. Open `Standards` and show governance scorecard, policy flexibility, dependency approval lane, and evidence trail.
6. Open `Agent Team` and show Team Operating Model, Project Contract Readiness, Agent Foundry, Execution Health, Agent Relay Inbox, Worker Queue, and Worker Run Detail.
7. Open `Review` and show Review Cycle Closeout, review queue, rework controls, and implementation/verification evidence capture.
8. Open `PR Ready` and show PR package builder, gate decision, readiness checklist, and markdown preview.
9. Open `Artifacts` and show saved evidence/output records.
10. Open `ODT Guide` and show local provider, evidence-aware guide context, and safe coaching prompts.
11. Open `Runs` and `Monitoring` to show audit trail, validation history, error/health log, and usage visibility.
12. Open `Settings` last to show backend-owned AI provider status, connector hub, and safe configuration rules.

## What Not To Touch During Demo

- Do not run `git reset --hard`, `git checkout -- .`, or `rm -rf`.
- Do not launch new implementation workers unless the demo explicitly needs it.
- Do not treat terminal completion as success until ODT ingests output and displays evidence.
- Do not store secrets in `/api/settings`; the frontend rejects secret-like keys and this should remain true.
- Do not install dependencies during demo unless separately approved.
- Do not create PRs or deploy from ODT during the demo unless explicitly approved.

## Known Risks

- `server/index.js` is still a live backend monolith; many capabilities are repository-backed, but API routing has not been fully split into modules.
- Native app shell exists as enterprise structure only; packaging/startup hardening is still future work.
- Some connector cards are intentionally disabled until environment variables and MCP servers are configured.
- Playwright local browser launch may need unsandboxed execution in Codex or a local Chrome install.
- The active assignment state is mutable through Settings. The relay smoke temporarily switches active assignment and restores it afterward.

## Latest Verified Evidence

Verified on 2026-06-22 11:26 IST after clean restart:

- API restarted on `127.0.0.1:5190`.
- UI restarted on `127.0.0.1:5189`.
- `/api/snapshot` returned active assignment `assignment_journey-25577_20260617T074250` and 47 assignments.
- `/api/settings` returned 3 prompt templates.
- `/api/project-contracts` returned 1 default contract, `odt-workbench-local`.
- `/api/workflow/state/assignment_journey-25577_20260617T074250` returned `REVIEW_CYCLE_CLOSEOUT`.
- `/api/review/cycle/assignment_journey-25577_20260617T074250/closeout` returned `REVIEWER_RERUN_REQUIRED`.
- `/api/agents/worker-runs/assignment_journey-25577_20260617T074250` returned 4 worker runs.
- `/api/agents/relay/assignment_journey-25577_20260617T074250` returned 3 relay items.
- All-sidebar `demo-hardening` smoke passed and captured 12 screenshots.
- Agent Team relay regression smoke passed on `assignment_journey-25577_20260611T111639`, with `REVIEW_CYCLE_CLOSEOUT`, `Launch Rework Worker`, 1 relay item, and 3 worker runs.

## Next Engineering Step After Demo

After the demo, continue with backend module extraction from `server/index.js` into capability modules under `services/api/src/modules`. Start with low-risk route/service splits around settings, assignments, Project Contract, and read-only snapshot routes before touching worker launch or ingestion orchestration.
