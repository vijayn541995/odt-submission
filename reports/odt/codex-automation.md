# Codex Automation Template - Oracle Developer Twin

Use these with Codex automations (or manually run in terminal).

## Daily SDLC + A11y Twin
`npm run odt:autopilot -- --profile react-js --work-item feature --withA11y`

## Defect-focused SDLC + A11y Twin
`npm run odt:autopilot -- --profile react-js --work-item defect --withA11y`

## Build execution bundle
`npm run odt:execute`

## Apply reviewed patch
`npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --dry-run`
`npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --verify`

## Useful options
- `--feature-name "..."`
- `--ticket-id "JIRA-123"`
- `--summary "..."`
- `--modules "src/path/a,src/path/b"` (optional hints only)
- `--components "ActivityList,SearchPanel"`
- `--criteria "criterion 1,criterion 2"`
- `--images "/tmp/mock1.png,/tmp/mock2.png"`
- `--refs "https://wiki...,https://jira..."`

## External LLM Safety
- Use `reports/odt/prompts/external-llm-sanitized-context.json` for chat.oracle.com prompt drafting.
- Never paste raw incident/customer data directly into external prompts.

Generated from run: 2026-04-23T16:20:01.866Z
