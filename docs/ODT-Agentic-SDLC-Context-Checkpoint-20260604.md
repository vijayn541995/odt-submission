# ODT Agentic SDLC Context Checkpoint

Created: 2026-06-04 20:13 IST
Last updated: 2026-06-05 13:03 IST
Automation: hourly-odt-2-0-context-backup

This refresh keeps the same core ODT 2.0 slice in focus: completed-Jira verification, evidence scoping, Connector Hub governance, source-aware Guide behavior, and Monitoring-backed self-validation. The main material change since the prior checkpoint is operational rather than architectural: the Jira connector remains configured, but the latest live read now returns an HTML/SSO page instead of Jira JSON, so the connector is currently degraded even though the saved workflow state still reflects successful earlier imports.

## Current Goal

Keep the current demo-grade ODT 2.0 workflow coherent around completed-Jira verification and governed operator flows:

- preserve the `JIRA_COMPLETED_VERIFICATION` path across Intake, Planner, Standards, Agent Team, Review, PR Ready, and Monitoring
- keep current-vs-historical evidence separation so stale artifacts do not drive the active task
- keep Monitoring useful as the operator command center for validation history and connector health
- keep ODT Guide and specialist review surfaces source-aware
- keep the large uncommitted server/UI/docs delta resume-safe until it is committed or intentionally reworked

## Progress Estimate

- Demo-grade ODT 2.0: about **87%**
- Oracle-internal production-grade ODT: about **59%**

Reason: the governed shell, completed-Jira verification workflow, evidence freshness split, Monitoring validation lane, and Connector Hub/readiness model are all implemented and running locally, but direct governed MCP transport, broader connector depth, stronger retrieval quality, wider regression coverage, and enterprise auth/policy hardening still remain. The current Jira auth/read degradation is also a real short-term blocker for connector confidence.

## Latest Implemented Changes

- `server/index.js`
  - detects Codex MCP server metadata from local Codex config
  - exposes governed Jira read-only connector behavior and Jira import handling
  - keeps completed Jira work in `JIRA_COMPLETED_VERIFICATION`
  - separates `current` vs `historical` evidence so stale artifacts stop driving the active workflow
  - powers Monitoring validation history and connector/error health state
  - records source metadata for Guide/AI usage traces
- `src/main.jsx`
  - Intake supports Jira import and completed-work classification
  - Planner, Standards, Agent Team, Review, and PR Ready now prefer current-scoped evidence and verification-specific UX
  - Monitoring surfaces validation runs and error/health status
  - Guide and specialist review UI show source/input chips more explicitly
- `src/styles.css`
  - styles the verification, connector, monitoring, validation, and source-chip surfaces
- `scripts/odt-ui-smoke.mjs`
  - adds Playwright smoke coverage for the completed-Jira verification path
- `package.json`
  - adds `npm run test:ui:smoke`
- `README.md`
  - documents CLI smoke execution and Monitoring-triggered smoke validation
- `docs/ODT-Platform-Handbook.md`
  - documents Jira import, verification evidence behavior, Connector Hub behavior, and Monitoring/self-validation guidance

## Current Git / Worktree State

Modified tracked files:

- `/Users/vn105957/Desktop/odt-submission/docs/ODT-Agentic-SDLC-Context-Checkpoint-20260604.md`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/.gitignore`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/README.md`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Platform-Handbook.md`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/package.json`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/server/index.js`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/src/main.jsx`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/src/styles.css`

Untracked:

- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/scripts/odt-ui-smoke.mjs`

Tracked diff summary before this refresh:

- `8 files changed, 3435 insertions(+), 900 deletions(-)`
- no staged changes
- the delta is still concentrated in backend workflow logic, Monitoring/validation, verification-mode UI, docs, and git-ignored output handling

## Active Servers And Ports

- React dev server: `http://127.0.0.1:5189`
- Backend API: `http://127.0.0.1:5190`
- OpenAPI: `http://127.0.0.1:5190/openapi.json`

Confirmed listening during this run:

- PID `41596` on `127.0.0.1:5189`
- PID `18701` on `127.0.0.1:5190`

## Important Files

- App root: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next`
- Checkpoint: `/Users/vn105957/Desktop/odt-submission/docs/ODT-Agentic-SDLC-Context-Checkpoint-20260604.md`
- Product/usage doc: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Platform-Handbook.md`
- Runtime/setup doc: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/README.md`
- Developer workflow spec: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Developer-Agent-Handoff-Plan.md`
- Backend: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/server/index.js`
- Frontend: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/src/main.jsx`
- Frontend styles: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/src/styles.css`
- Smoke validator: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/scripts/odt-ui-smoke.mjs`
- Local SQLite DB: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/data/odt-workbench-next.sqlite`

## Validation Status

Validated in this automation run:

- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check server/index.js` passed
- `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run build` passed
- both local servers are listening on `127.0.0.1:5189` and `127.0.0.1:5190`
- `GET /api/settings` returns `8` connectors
- Jira connector metadata still shows:
  - `enabled: true`
  - `configurationSource: codex-config`
  - `serverName: jira2`
  - `readOnly: true`
  - `readiness: DEGRADED`
- `GET /api/workflow/state/assignment-local-mvp` still returns:
  - workflow state `JIRA_COMPLETED_VERIFICATION`
  - issue `JOURNEY-25366`
  - repo path `/Users/vn105957/Desktop/lpdev/journey-builder-js`
  - `5` matching git commits
  - next action `Launch Reviewer`
  - `canDelegateWrite: false`
  - `canLaunchVerification: true`
- `GET /api/validation/runs` now includes the latest backend-triggered UI smoke run
- latest validation run is `run_1780645562185_lhfxh7g` with status `passed`
- latest passed validation screenshots are under `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/output/playwright/monitoring/run_1780645562185_lhfxh7g`
- workflow state after stale-evidence fix:
  - `state: JIRA_COMPLETED_VERIFICATION`
  - `nextAction: Launch Reviewer`
  - `canDelegateWrite: false`
  - `canPreparePr: false`
  - `blockedReasons: []`
- PR readiness now requires real Reviewer/build-verifier evidence, passed test evidence, or explicit accepted-risk review notes; launched worker runs and pending tests no longer count as ready evidence.
- failed/incomplete test checks are scoped to current evidence, so historical pending test evidence no longer blocks the active completed-Jira verification workflow.
- `GET /api/monitoring/error-log?assignmentId=assignment-local-mvp` now reports:
  - `status: critical`
  - `total: 23`
  - `critical: 2`
  - `blocked: 1`
  - `warning: 6`
  - `resolved: 14`
  - `needsAttention: 9`
  - `latestAt: 2026-06-05T07:32:48.913Z`
- a live Jira read check now fails:
  - `POST /api/connectors/query` for `JOURNEY-25366` returns an error because Jira responded with HTML instead of JSON
  - connector readiness detail now points to login/SSO/proxy/base-URL drift rather than missing local config
- `POST /api/intake/import-jira` is currently blocked by the same live Jira HTML-response failure

Not revalidated in this automation run:

- live OCI/OpenAI/Ollama model requests
- worker launch/stop flows beyond the persisted workflow state and validation evidence
- full product regression coverage outside targeted build/API/validation checks

## Known Risks And Blockers

- Jira is configured but currently degraded; live read/import now fails with an HTML login/SSO response, which blocks fresh intake verification against Jira until auth/base URL behavior is corrected
- the saved assignment state still shows completed-Jira verification from earlier successful imports, so a fresh session should distinguish persisted workflow state from current connector health
- `scripts/odt-ui-smoke.mjs` is still untracked; if it is intended to stay, it should be added/committed intentionally
- the server/UI/doc delta is still large and uncommitted, so new work should be stacked carefully after reviewing diffs
- direct governed MCP transport is still not implemented; connector behavior is still ODT-owned HTTP handling around detected configuration
- regression coverage is still narrow relative to the breadth of pages and workflow states touched
- provider fallback exists, but live provider validation still depends on real endpoint/model/auth setup

## Next Roadmap Steps

1. Fix the Jira connector regression so live read/import works again without HTML/SSO redirects, then re-run Monitoring and verification import checks.
2. Commit or otherwise stabilize the current large backend/frontend/docs delta before layering on more workflow states.
3. Expand current-vs-historical evidence handling across remaining pages/artifacts and regression-test stale-artifact hiding.
4. Keep hardening the Playwright smoke path so CLI and Monitoring-triggered validation stay in sync and predictable.
5. Push completed-Jira verification deeper into Reviewer/Build Verifier flows and evidence capture.
6. Continue Stage B retrieval improvements for better Guide ranking and clearer source-grounded answers.
7. Plan movement from safe HTTP Jira reads toward direct governed MCP transport, then add the next read-first connector.

## Resume Commands

Use Node 24+:

```bash
source "$HOME/.nvm/nvm.sh"
nvm use
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
```

Start backend:

```bash
npm run api
```

Start frontend:

```bash
npm run dev
```

Quick resume checks:

```bash
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check server/index.js
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run build
curl -s http://127.0.0.1:5190/api/settings | jq '.connectors[] | select(.id=="jira")'
curl -s http://127.0.0.1:5190/api/workflow/state/assignment-local-mvp | jq '.workflowState'
curl -s http://127.0.0.1:5190/api/validation/runs | jq '.runs[:2]'
curl -s 'http://127.0.0.1:5190/api/monitoring/error-log?assignmentId=assignment-local-mvp' | jq '.summary'
curl -s -X POST http://127.0.0.1:5190/api/connectors/query \
  -H 'Content-Type: application/json' \
  -d '{"connectorId":"jira","action":"read-issue","mode":"read","issueKey":"JOURNEY-25366"}' | jq
git status --short
git diff --stat
git diff -- server/index.js src/main.jsx src/styles.css docs/ODT-Platform-Handbook.md README.md package.json
```

Optional backend-owned UI smoke trigger:

```bash
curl -s -X POST http://127.0.0.1:5190/api/validation/ui-smoke \
  -H 'Content-Type: application/json' \
  -d '{"assignmentId":"assignment-local-mvp"}'
```

Optional CLI smoke:

```bash
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:ui:smoke
```

## Source Links To Keep Using

Preserve the useful source links already captured in:

- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Platform-Handbook.md`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Oracle-AI-Services-Setup-Reference.md`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/README.md`
