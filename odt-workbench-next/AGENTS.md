# Repository Guidelines

## Project Structure & Module Organization

This repo contains the live ODT Workbench app plus the ongoing enterprise migration.

- `src/`: React/Vite browser UI entrypoint, styles, and local sidebar icons.
- `server/`: Node 24 backend API, governance services, Agent Foundry logic, standards registry loading, and SQLite-backed orchestration.
- `scripts/`: local automation such as `odt-ui-smoke.mjs`.
- `docs/`: product, governance, accessibility, AI setup, and handoff references.
- `odt 2.0 enterprise/`: modular target structure. Key areas are `apps/browser`, `apps/native`, `packages/ui`, `packages/domain`, `packages/api-client`, `services/api`, `services/sqlite`, and `packages/testing`.
- `data/`, `logs/`, `output/`, `workspaces/`, and `dist/`: local runtime/build artifacts; avoid committing generated content unless explicitly needed.

## Build, Test, and Development Commands

Use Node 24+.

```bash
npm run api
```
Starts the backend on `http://127.0.0.1:5190`.

```bash
npm run dev
```
Starts the Vite UI on `http://127.0.0.1:5189`.

```bash
npm run build
```
Runs the production Vite build.

```bash
npm run test:ui:smoke
```
Runs the Playwright-based ODT smoke script. Set `ODT_SMOKE_MODE=demo-hardening` or `ODT_SMOKE_MODE=agent-team-relay` for focused validation.

```bash
npm --prefix "odt 2.0 enterprise" run check
```
Runs enterprise structure, workflow contract, SQLite repository, and settings-service checks.

## Coding Style & Naming Conventions

Use ES modules, 2-space indentation, single quotes, semicolons, and descriptive camelCase names. React components use PascalCase. Keep backend extraction low-risk: move one service/repository boundary at a time and preserve existing response shapes. Prefer explicit small helpers over broad abstractions.

## Testing Guidelines

There is no global unit-test runner yet. Use `node --check <file>` for touched Node modules, `npm run build` for frontend safety, enterprise `npm run check` for modular contracts, and UI smoke tests for workflow behavior. Store screenshots under `output/playwright/`.

## Commit & Pull Request Guidelines

Recent history uses short ODT progress summaries such as `odt 2.0 progress`; keep commits concise but more specific when possible, for example `Extract settings API service`. PRs should include purpose, changed areas, validation commands/results, screenshots for UI changes, linked Jira/work item if relevant, and any known risks or follow-up slices.

## Security & Configuration Tips

Do not commit secrets, bearer tokens, OCI IDs, local database dumps, or generated worker outputs. Keep provider credentials server-side through environment variables. Frontend code must only receive safe provider/config status from the backend.
