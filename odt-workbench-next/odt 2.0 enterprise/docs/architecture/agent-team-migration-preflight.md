# Agent Team Migration Preflight

Last refreshed: 2026-06-17 05:55 IST

## Purpose

`AgentTeamPage` is the highest-risk frontend sidebar migration because it is where ODT proves the worker handoff loop is actually usable inside the product. Build success is not enough for this page.

The migration must preserve reviewer findings, relay inbox items, worker evidence details, response/log byte counts, live log tail, rework launch controls, and implementation-evidence derivation.

## Current Source Boundary

Move this cluster together rather than splitting it during the first extraction:

- `AgentFoundryPanel`
- `ExecutionHealthPanel`
- `AgentTeamPage`
- `WorkerRunOutput`
- `cleanWorkerSummary`
- `workerEvidenceChips`

Current local source anchors in `src/main.jsx`:

- `AgentFoundryPanel`: starts near line 661.
- `ExecutionHealthPanel`: starts near line 795.
- `AgentTeamPage`: starts near line 865.
- `WorkerRunOutput`: starts near line 1679.

## Required Shell Inputs

The shared feature should receive these app-shell actions and helpers through the route wrapper:

- `actions.postJson`
- `actions.getJson`
- `actions.copyTextToClipboard`
- `helpers.getStoredSetting`
- `helpers.currentEvidenceItems`
- `helpers.normalizeList`
- `helpers.workflowTone`
- `helpers.standardsTone`
- `helpers.adapterTone`
- `helpers.isWorkerRunActive`
- `helpers.isWorkerRunPrepared`
- `helpers.workerRunHasReviewableOutput`
- `helpers.workerRunBlocksEvidence`
- `helpers.workerRunEvidenceBlockReason`
- `constants.teamRoles`
- `constants.executionAgents`
- `constants.foundrySourceOptions`
- `constants.qualityGates`
- `slots.CurrentWorkBrief` if it remains outside the feature during first extraction.

## Must Preserve

- Agent Foundry run action: `POST /api/agent-foundry/run`.
- Execution health display for Codex, Cline, OCI GenAI, Ollama, and OpenAI adapters.
- Execution-agent setting persistence through `POST /api/settings`.
- Worker-role setting persistence through `POST /api/settings`.
- Read-only and write-approved handoff generation.
- Codex terminal/background/manual launch messages.
- Worker status refresh: `POST /api/agents/worker-runs/:id/status`.
- Worker output ingest: `POST /api/agents/worker-runs/:id/ingest`.
- Prepared bundle launch: `POST /api/agents/worker-runs/:id/launch`.
- Worker stop request: `POST /api/agents/worker-runs/:id/stop`.
- Implementation evidence derivation: `POST /api/implementation/evidence/from-worker/:id`.
- Relay decision updates: `POST /api/agents/relay/:id/decision`.
- Relay item selection and "Use Rework" / "Use Next" behavior.
- Worker queue cards, selected worker detail, live log tail, copied path buttons, and launch status details.
- Worker evidence chips for `Response`, `Log`, `Review`, `Relay`, `Repo`, and compacted preview.
- `Response size` and `Log size` values in Worker Run Detail.
- Review/rework visibility in the Agent Relay Inbox.

## Required UI Verification

After migration, verify the Agent Team page itself, not only backend JSON:

- The page loads from the shared feature route without runtime errors.
- `Agent Relay Inbox` is visible.
- A rework relay item, when present, still shows title, message, target lane, and action buttons.
- `Worker Run Detail` is visible when worker evidence exists.
- `Response size` and `Log size` are populated when worker metadata exists.
- Worker output summary still shows evidence chips for response, log, review findings, relay questions, and repo verification.
- `Launch Rework Worker`, `Use Rework`, or equivalent rework-forward action remains visible when review closeout evidence exists.
- Live Log Tail still shows captured `logTail` and pause/follow control.
- `Ingest Output`, `Record Evidence From Worker`, `Refresh Status`, `Launch Bundle`, and `Stop Worker` enable/disable from the same worker status logic as before.

## Validation Plan

1. Extract the full Agent Team cluster into `packages/ui/src/features/agent-team/AgentTeamPage.jsx`.
2. Wire `team: AgentTeamRoute` in `src/main.jsx`.
3. Run build before deleting local code:
   `PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run build`
4. Run enterprise checks:
   `npm run check` from `odt 2.0 enterprise`
5. Remove old local cluster only after build/check pass.
6. Rerun build/check.
7. Start backend/UI and verify the Agent Team page in browser with seeded or current evidence.

## Risk Boundary

Do not migrate backend reviewer-ingest logic in the same change. Backend extraction should wait until the UI can still prove the existing handoff loop.

Do not treat Terminal completion as success unless ODT still shows the output, logs, relay path, reviewer findings, and worker details in the Agent Team UI.
