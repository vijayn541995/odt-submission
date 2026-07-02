# Project Contract Module

This module promotes the `odt-ai-innovator-lab` Project Contract prototype into
the enterprise ODT backend.

## Owns

- Per-repository build/test/run/deploy command contracts.
- Known setup issues and demo/runbook notes.
- Blocked command policy.
- Human approval notes for writes, dependency installs, PRs, and deploys.
- Read-only readiness checks before Agent Team handoff.
- Markdown handoff generation for worker prompts.

## Current Integration

The live backend wires this module through:

```text
GET  /api/project-contracts
GET  /api/project-contracts/:id
POST /api/project-contracts
POST /api/project-contracts/:id/readiness
POST /api/project-contracts/:id/handoff
```

Persistence is owned by:

```text
services/sqlite/src/repositories/project-contract-repository.js
```

The live Agent Team handoff path now attaches the selected Project Contract and
readiness snapshot to:

- `GET /api/assignments/:assignmentId/agent-contract`
- `POST /api/agents/delegate`
- `POST /api/agents/launch-worker`
- generated `handoff.json` and `prompt.md` worker bundle files

## Guardrails

- Readiness checks are read-only.
- Build, test, deploy, dependency install, PR, and write commands are not
  executed by this module.
- Secrets are not stored in project contracts.
