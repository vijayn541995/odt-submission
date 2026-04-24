# @cerner/delivery-copilot

Phase-2 MCP starter service for JIRA + WIKI + GitHub requirement and sub-task orchestration.

Current status: command scaffold only (no live connector calls yet).

## Commands

- `delivery-copilot mcp:req summarize --wiki <url>`
- `delivery-copilot mcp:jira create-subtasks --project <key> --from <requirements.json>`
- `delivery-copilot mcp:local snapshot --out reports/mcp/local-context.json`
- `delivery-copilot mcp:local serve --host 127.0.0.1 --port 4310`

## Local Context Server

Useful for Oracle Developer Twin and ODT Workspace when you want a model or automation layer to read current local artifacts without manually pasting them into prompts.

It exposes structured local context from:

- `reports/odt/run-summary.json`
- `reports/dev-twin/summary.json`
- `reports/dev-twin/intake.json`
- `reports/a11y-twin/insights.json`
- generated workpacks and execution guides

Endpoints when serving locally:

- `/health`
- `/context`
- `/odt`
- `/dev-twin`
- `/a11y`
- `/intake`
