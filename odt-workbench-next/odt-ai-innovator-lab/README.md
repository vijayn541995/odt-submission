# ODT AI Innovator Lab

This is a separate working model for ODT 2.0 value-add experiments. It does not
modify or import the existing ODT Workbench app.

## Purpose

The lab demonstrates the highest-value next slice from the AI Innovator analysis:

- Project Contract: per-repo build/test/run rules, known issues, blocked commands, and approval notes.
- Environment Readiness: lightweight checks for repo path, git state, Node/npm/Codex availability, and missing guardrail notes.
- Agent Handoff: a generated contract that can be pasted into an ODT Agent Team worker prompt.

The goal is to reduce failed agent runs, repeated setup debugging, and onboarding time by giving agents and developers one clear contract for each project.

## Run

From this folder:

```sh
npm run start
```

Then open:

```text
http://127.0.0.1:5290
```

If another process uses the port:

```sh
PORT=5291 npm run start
```

## Folder Purpose

```text
odt-ai-innovator-lab/
├── data/
│   └── project-contracts.json  Stores local project contracts and seed examples.
├── public/
│   ├── index.html              Browser UI shell for the lab.
│   ├── app.js                  UI behavior for contracts, readiness, and handoff generation.
│   └── styles.css              Lab-specific visual design.
├── server.js                   Node HTTP API, static file server, readiness checks, and handoff builder.
├── package.json                Standalone scripts; no dependency install is required.
└── README.md                   Purpose, runbook, scope, and future ODT merge path.
```

## Current Scope

This first slice is intentionally safe:

- Stores contracts in `data/project-contracts.json`.
- Runs only read-only readiness checks.
- Does not execute project build/test/deploy commands.
- Does not store secrets.
- Does not create Jira tickets, PRs, branches, or deployments.

## Future ODT Merge Path

If this model works well, merge it into ODT 2.0 as:

```text
packages/ui/src/features/project-contract/
services/api/src/modules/project-contract/
services/sqlite/src/repositories/project-contract-repository.js
```

Then feed the selected project contract into Agent Team handoffs, PR Ready evidence, and worker readiness checks.
