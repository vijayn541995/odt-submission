# ODT Agentic SDLC Context Checkpoint

Created: 2026-06-04 20:13 IST
Last updated: 2026-06-05 21:20 IST
Automation: hourly-odt-2-0-context-backup

This refresh is a continuity update only. No new product commit or app-doc change was detected since the prior checkpoint refresh at 2026-06-05 15:04 IST. The codebase is still anchored on `28d179129a298ecd6620c01b935bbc3019282627` (`odt 2.0 progress`). No material change was detected in this run; ports `5189` and `5190` are still down, so API/UI state was not revalidated live.

## Current Goal

Keep the ODT 2.0 demo workflow coherent around completed-Jira verification and governed operator flows:

- preserve `JIRA_COMPLETED_VERIFICATION` across Intake, Planner, Standards, Agent Team, Review, PR Ready, and Monitoring
- keep current-scope evidence isolated from stale historical artifacts
- keep Monitoring useful for validation history and connector health
- keep ODT Guide and Agent Foundry source-aware and grounded in stored evidence
- stabilize this workflow slice before broader connector and governed MCP expansion

## Progress Estimate

- demo-grade ODT 2.0: about **88%**
- Oracle-internal production-grade ODT: about **60%**

No material progress change in this run. The completed-Jira verification slice remains implemented; the remaining work is mainly connector recovery, broader verification evidence closure, and hardening.

## Latest Implemented Changes

Latest product commit still in force:

- commit: `28d179129a298ecd6620c01b935bbc3019282627`
- subject: `odt 2.0 progress`
- commit time: `2026-06-05T13:54:30+05:30`

Key shipped changes from that commit:

- `server/index.js`
  - completed-Jira verification state flow
  - current-vs-historical evidence separation
  - Monitoring validation and connector-health evidence
  - source metadata for Guide and specialist reviews
- `src/main.jsx`
  - verification-mode UI across Intake, Planner, Standards, Agent Team, Review, and PR Ready
  - Monitoring validation and connector-health views
  - clearer source/input cues in Guide and specialist surfaces
- `src/styles.css`
  - verification, monitoring, connector, validation, and source-chip styling
- `scripts/odt-ui-smoke.mjs`
  - Playwright smoke coverage for the completed-Jira verification path
- `package.json`
  - `npm run test:ui:smoke`
- `README.md`
  - local run steps and smoke-test guidance
- `docs/ODT-Platform-Handbook.md`
  - verification, Monitoring, and connector-governance updates

Recent git summary from this run:

- branch: `main`
- worktree change: only this checkpoint file is modified
- `git diff --stat`: checkpoint-only refresh
- `git show --stat -n 1 HEAD`: still `9 files changed, 3725 insertions(+), 891 deletions(-)`

## Active Servers And Ports

Current run:

- no listeners detected on `127.0.0.1:5189` or `127.0.0.1:5190`
- `curl` checks to `/api/settings`, `/api/workflow/state/assignment-local-mvp`, `/api/validation/runs`, and `/api/monitoring/error-log` failed because the backend was not running

Expected local endpoints when resumed:

- React app: `http://127.0.0.1:5189`
- Backend API: `http://127.0.0.1:5190`
- OpenAPI: `http://127.0.0.1:5190/openapi.json`

## Important Files

- app root: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next`
- continuity checkpoint: `/Users/vn105957/Desktop/odt-submission/docs/ODT-Agentic-SDLC-Context-Checkpoint-20260604.md`
- runtime/setup doc: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/README.md`
- platform handbook: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Platform-Handbook.md`
- developer workflow spec: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Developer-Agent-Handoff-Plan.md`
- Oracle AI setup reference: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Oracle-AI-Services-Setup-Reference.md`
- backend: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/server/index.js`
- frontend: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/src/main.jsx`
- styles: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/src/styles.css`
- UI smoke script: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/scripts/odt-ui-smoke.mjs`
- local SQLite DB: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/data/odt-workbench-next.sqlite`

## Validation Status

What was revalidated in this run:

- current docs still match the committed completed-Jira verification workflow
- latest product commit is unchanged from the prior checkpoint
- local dev servers are currently down, so no live API state was available

Last known live state from the previous successful runtime validation (not revalidated in this run):

- connector count: `8`
- Jira connector metadata:
  - `enabled: true`
  - `configurationSource: codex-config`
  - `serverName: jira2`
  - `readOnly: true`
  - `readiness: DEGRADED`
- workflow state for `assignment-local-mvp`:
  - state `JIRA_COMPLETED_VERIFICATION`
  - stage `review`
  - issue `JOURNEY-25366`
  - repo path `/Users/vn105957/Desktop/lpdev/journey-builder-js`
  - `5` matching git commits
  - next action `Launch Reviewer`
  - `canDelegateWrite: false`
  - `canLaunchVerification: true`
  - `canPreparePr: false`
- latest validation run:
  - `run_1780645562185_lhfxh7g`
  - status `passed`
  - updated at `2026-06-05T07:46:33.394Z`
  - screenshots under `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/output/playwright/monitoring/run_1780645562185_lhfxh7g`
- Monitoring error-log summary:
  - `status: critical`
  - `total: 23`
  - `critical: 2`
  - `blocked: 1`
  - `warning: 6`
  - `resolved: 14`
  - `needsAttention: 9`
  - `latestAt: 2026-06-05T07:32:48.913Z`
- live Jira import remained degraded:
  - `POST /api/intake/import-jira` for `JOURNEY-25366` failed with `Jira returned an HTML page instead of JSON`

Still not revalidated in this run:

- `npm run build`
- `node --check server/index.js`
- fresh `npm run test:ui:smoke`
- live OCI/OpenAI/Ollama provider calls
- fresh worker launch/stop flows

## Next Roadmap Steps

1. Start the local API/UI again and re-run the runtime checks before assuming stored workflow evidence is current.
2. Fix Jira read/import so the connector returns JSON again, then re-run Monitoring and completed-Jira verification.
3. Push verification mode deeper into Reviewer and build-verifier evidence capture so PR readiness reflects real proof.
4. Expand stale-vs-current evidence protections across remaining artifact types and edge states.
5. Keep the Playwright smoke path aligned between CLI and Monitoring-triggered validation.
6. Continue Guide/foundry retrieval grounding and plan the move toward governed MCP transport.

## Known Risks And Blockers

- live Jira read/import is still degraded and likely blocked by login, SSO, proxy, or base-URL drift
- saved workflow evidence can be mistaken for fresh live health if the API is not restarted and rechecked
- Monitoring was last known `critical` because Jira connector failures remained open
- PR readiness is still not credible without Reviewer plus build/test verification evidence
- regression coverage is still targeted, not broad across the full workflow surface

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
git status -sb
git show --stat --format='commit %H%nAuthorDate: %aI%nCommitDate: %cI%nSubject: %s' -n 1 HEAD
lsof -nP -iTCP -sTCP:LISTEN | rg ':(5189|5190)\b'
curl --max-time 5 -s http://127.0.0.1:5190/api/settings | jq '.connectors[] | select(.id=="jira")'
curl --max-time 5 -s http://127.0.0.1:5190/api/workflow/state/assignment-local-mvp | jq '.workflowState'
curl --max-time 5 -s http://127.0.0.1:5190/api/validation/runs | jq '.runs[0] | {runId,status,passed,updatedAt,screenshotDir}'
curl --max-time 5 -s 'http://127.0.0.1:5190/api/monitoring/error-log?assignmentId=assignment-local-mvp' | jq '.summary'
curl --max-time 10 -s -X POST http://127.0.0.1:5190/api/intake/import-jira \
  -H 'Content-Type: application/json' \
  -d '{"issueKey":"JOURNEY-25366","assignmentId":"assignment-local-mvp","repoPath":"/Users/vn105957/Desktop/lpdev/journey-builder-js"}' | jq
```

Optional UI smoke:

```bash
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:ui:smoke
```

Optional backend-triggered smoke:

```bash
curl -s -X POST http://127.0.0.1:5190/api/validation/ui-smoke \
  -H 'Content-Type: application/json' \
  -d '{"assignmentId":"assignment-local-mvp"}'
```

## Source Links To Keep Using

Preserve the useful source links already captured in:

- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/README.md`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Platform-Handbook.md`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Developer-Agent-Handoff-Plan.md`
- `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Oracle-AI-Services-Setup-Reference.md`
