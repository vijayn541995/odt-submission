# ODT 2.0 Continuity Backup

Last refreshed: 2026-06-24 08:14 IST

## Current Goal

Keep the frozen ODT 2.0 baseline safe while migrating the live workbench into an enterprise-grade structure that supports browser and future native desktop shells from shared UI, domain, API-client, config, testing, API, and SQLite repository boundaries.

Immediate operating goal: preserve demo stability while extracting only low-risk backend services behind the existing API behavior. Use the final migration audit/demo-hardening runbook as the source of truth for startup and validation.

## Progress Estimate

- Enterprise restructure foundation: about 84%.
- Live app migration into enterprise modules: about 99.7%.
- Overall ODT 2.0 enterprise readiness: about 99.3%.

## Latest Implemented Changes

- Added `scripts/odt-ui-smoke.mjs` mode `ODT_SMOKE_MODE=demo-hardening`.
- Demo-hardening smoke validates core backend routes and all 12 sidebar pages: Overview, Intake, Planner, Standards, Agent Team, Review, PR Ready, Artifacts, ODT Guide, Runs, Monitoring, and Settings.
- Hardened smoke browser launch to try Playwright Chromium first and then system Chrome.
- Fixed Agent Team relay smoke so it temporarily switches active assignment for UI validation and restores the previous active assignment afterward.
- Added `odt 2.0 enterprise/docs/architecture/demo-hardening-runbook.md`.
- Refreshed `odt 2.0 enterprise/README.md` with demo-hardening status and validation evidence.
- Assignment, prompt-template, and Project Contract bootstrap persistence are now repository-backed through SQLite repositories.
- Extracted settings API response/update policy into `odt 2.0 enterprise/services/api/src/modules/settings/`.
- Added `odt 2.0 enterprise/packages/testing/src/check-settings-service.mjs` and wired it into enterprise `npm run check`.

## Active Servers And Ports

- Browser UI: `http://127.0.0.1:5189`
- Backend API: `http://127.0.0.1:5190`
- Current UI PID after restart: `55471`
- Current API PID after restart: `55448`
- API command: `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run api`
- UI command: `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run dev`
- Current active assignment after validation: `assignment_journey-25577_20260617T074250`
- Canonical relay regression assignment: `assignment_journey-25577_20260611T111639`

## Important Files

- `server/index.js`: live backend monolith; many persistence paths now delegate to enterprise repositories, but route/module extraction is not complete.
- `scripts/odt-ui-smoke.mjs`: UI/API smoke runner with `demo-hardening`, `agent-team-relay`, and completed-Jira verification modes.
- `odt 2.0 enterprise/README.md`: primary enterprise migration handoff and folder purpose guide.
- `odt 2.0 enterprise/docs/architecture/demo-hardening-runbook.md`: clean-start commands, demo path, smoke commands, screenshots, risks, and post-demo guidance.
- `odt 2.0 enterprise/docs/architecture/agent-team-operator-guide.md`: Agent Team button-by-button usage and safe relay/worker sequences.
- `odt 2.0 enterprise/docs/architecture/agent-team-migration-preflight.md`: Agent Team extraction boundary and verification checklist.
- `odt 2.0 enterprise/packages/ui/src/features/`: extracted sidebar feature pages.
- `odt 2.0 enterprise/packages/domain/src/`: shared workflow, standards, evidence, assignment, and verification selectors.
- `odt 2.0 enterprise/services/api/src/modules/workflow/`: extracted workflow derivation, review-cycle closeout, and evidence freshness helpers.
- `odt 2.0 enterprise/services/api/src/modules/settings/`: safe settings response/update service for provider/config status, connector readiness, prompt templates, stored settings, and secret-key rejection.
- `odt 2.0 enterprise/services/api/src/modules/project-contract/`: Project Contract service boundary.
- `odt 2.0 enterprise/services/sqlite/src/repositories/`: SQLite repository layer for workflow evidence, assignments, prompt templates, settings, events, approvals, dependencies, requirements, repo analysis, plans, assets, Agent Foundry runs, project contracts, relay, worker runs, review comments, implementation evidence, PR readiness, and standards checks.
- `odt 2.0 enterprise/packages/testing/src/check-sqlite-repositories.mjs`: repository fixture validation.
- `output/playwright/demo-hardening-*.png`: latest all-sidebar demo-hardening screenshots.
- `output/playwright/team-relay-closeout.png`: latest Agent Team relay regression screenshot.

## Validation Status

Passed on 2026-06-24 after clean API/UI restart:

- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check server/index.js`
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check scripts/odt-ui-smoke.mjs`
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/services/api/src/modules/settings/settings-service.js"`
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check "odt 2.0 enterprise/packages/testing/src/check-settings-service.mjs"`
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm --prefix "odt 2.0 enterprise" run check`
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run build`
- `ODT_SMOKE_MODE=demo-hardening ODT_ASSIGNMENT_ID=assignment_journey-25577_20260617T074250 ODT_APP_BASE=http://127.0.0.1:5189 ODT_API_BASE=http://127.0.0.1:5190 PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:ui:smoke`
- `ODT_SMOKE_MODE=agent-team-relay ODT_ASSIGNMENT_ID=assignment_journey-25577_20260611T111639 ODT_APP_BASE=http://127.0.0.1:5189 ODT_API_BASE=http://127.0.0.1:5190 PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:ui:smoke`

Latest live probe evidence:

- `/api/snapshot` returned active assignment `assignment_journey-25577_20260617T074250` and 47 assignments.
- `/api/settings` returned 3 prompt templates.
- Live settings API smoke returned 8 connectors, persisted a safe `settingsModuleSmoke` setting, rejected unsafe key `apiToken` with HTTP 400, and did not store the unsafe key.
- `/api/project-contracts` returned default contract `odt-workbench-local`.
- `/api/workflow/state/assignment_journey-25577_20260617T074250` returned `REVIEW_CYCLE_CLOSEOUT`.
- `/api/review/cycle/assignment_journey-25577_20260617T074250/closeout` returned `REVIEWER_RERUN_REQUIRED`.
- `/api/agents/worker-runs/assignment_journey-25577_20260617T074250` returned 4 worker runs.
- `/api/agents/relay/assignment_journey-25577_20260617T074250` returned 3 relay items.
- Agent Team relay regression on `assignment_journey-25577_20260611T111639` returned `REVIEW_CYCLE_CLOSEOUT`, next action `Launch Rework Worker`, 1 relay item, and 3 worker runs.

## Commands To Resume

Start services:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run api
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run dev
```

Run validation:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm --prefix "odt 2.0 enterprise" run check
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run build
ODT_SMOKE_MODE=demo-hardening ODT_ASSIGNMENT_ID=assignment_journey-25577_20260617T074250 ODT_APP_BASE=http://127.0.0.1:5189 ODT_API_BASE=http://127.0.0.1:5190 PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:ui:smoke
```

Open demo:

```bash
open http://127.0.0.1:5189
```

## Next Roadmap Steps

1. Pause major extraction until after the demo.
2. Use `demo-hardening-runbook.md` for demo startup, page order, and risks.
3. Continue low-risk backend route/service extraction from `server/index.js`: assignments, snapshot/read-only routes, and remaining Project Contract callers.
4. Then extract worker launch/ingest orchestration only after another Agent Team relay smoke passes.
5. Start native shell hardening after browser demo stability is accepted.

## Known Risks And Blockers

- `server/index.js` remains large and should not be aggressively rewritten before demo.
- Native app shell is structural only; packaging and local API lifecycle hardening are not complete.
- Connector cards other than Jira are intentionally disabled until env/MCP config exists.
- Playwright browser launch may require unsandboxed Codex approval or a local Chrome install.
- Active assignment is mutable through Settings; smoke scripts should restore it after fixture-specific checks.
- Terminal worker completion is not sufficient evidence. ODT must ingest output and show review comments, relay items, implementation evidence, or workflow state.
- Do not include secrets in docs, settings, screenshots, or handoffs.

## Source Links

- [Enterprise README](../../README.md)
- [Demo Hardening Runbook](./demo-hardening-runbook.md)
- [Agent Team Operator Guide](./agent-team-operator-guide.md)
- [Agent Team Migration Preflight](./agent-team-migration-preflight.md)
