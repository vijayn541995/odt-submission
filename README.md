# Oracle Developer Twin (Submission Bundle)

This folder is a sanitized, demo-ready source bundle.

## Quick Start

1. `cd odt-submission`
2. `npm run odt:init`
3. `npm run mcp:local:serve`
4. In a new terminal: `npm run odt:run`
5. Open ODT Workspace at `reports/odt/fedit.html`

## Hackathon One-Command Run

Use:

1. `./run-local.sh`

What it does:

- runs `odt:init`
- runs `odt:run` (default profile: `react-js`, with a11y enabled)
- starts local context server (`mcp:local:serve`)
- starts static report server for dashboards
- auto-selects free ports if `4310` or `8080` are already occupied
- avoids reusing an MCP server from a different workspace/target repo
- prints live URLs for ODT Workspace and health checks

Optional environment overrides:

- `TARGET_REPO_PATH=/absolute/repo/path`
- `ODT_PROFILE=react-js|python|java`
- `WITH_A11Y=1|0`
- `MCP_PORT=4310`
- `WEB_PORT=8080`
- `ODT_PROMPT_PROVIDER=template|oci`
- `OCI_COMPARTMENT_OCID=ocid1.compartment...`
- `OCI_GENAI_MODEL_ID=cohere.command-a-03-2025`

## 5-Minute Hackathon Script

- Runbook: `docs/Oracle-Developer-Twin-Hackathon-Runbook-5-Minute.md`
- OCI setup: `docs/OCI-GenAI-7-Stage-Prompt-Wiring.md`

## Delegate to Agent Flow

1. Fill ticket fields in ODT Workspace
2. Click `Run Digital Worker`
3. Click `Delegate to Agent` (Codex/Cline)
4. Review changed files in `demo-target-repo`

## What Is Included

- `packages/accessibility-ai-shield`
- `packages/delivery-copilot`
- `scripts/odt-clean.js`
- `docs/Oracle-Developer-Twin-*`
- `demo-target-repo` (safe sample repo)

## Notes

- This bundle intentionally excludes enterprise source modules.
- Use `--target-repo-path` to point to any other local repo.
