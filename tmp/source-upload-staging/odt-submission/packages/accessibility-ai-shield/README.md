# @cerner/accessibility-ai-shield

Reusable AI-assisted delivery toolkit for React + Terra projects.

It combines:
- accessibility scan/fix/verify flows
- A11y Twin prioritization and remediation workpacks
- Developer Twin repo-aware impact analysis
- Oracle Developer Twin (ODT) SDLC orchestration and execution handoff

## Commands

- `a11y-shield scan --changed`
- `a11y-shield scan --full --ci`
- `a11y-shield fix --input reports/a11y/findings.json --mode preview`
- `a11y-shield verify`
- `a11y-shield twin:analyze --input reports/a11y/findings.json --limit 25`
- `a11y-shield twin:workpack --input reports/a11y/findings.json --limit 20 --max-files 2`
- `a11y-shield twin:verify`
- `a11y-shield twin:demo`
- `a11y-shield dev:twin:init`
- `a11y-shield dev:twin:analyze --input reports/dev-twin/intake.json`
- `a11y-shield dev:twin:demo`
- `a11y-shield odt:init`
- `a11y-shield odt:run --profile react-js --withA11y`
- `a11y-shield odt:autopilot --work-item feature --withA11y`
- `a11y-shield odt:autopilot --work-item defect --withA11y`
- `a11y-shield odt:execute`
- `a11y-shield odt:status`

## A11y Findings Contract

`findings.json` includes:
- `ruleId`
- `wcagRef`
- `severity` (`blocker|warn|info`)
- `file`
- `line`
- `message`
- `suggestedFix`

## A11y Twin Outputs

`twin:analyze` writes:
- `reports/a11y-twin/insights.json`
- `reports/a11y-twin/priority-queue.md`
- `reports/a11y-twin/index.html`

`twin:workpack` writes:
- `reports/a11y-twin/coding-agent-workpack.md`
- `reports/a11y-twin/cline-workpack.md` (legacy alias)
- `reports/a11y-twin/workpack.json`

`twin:verify` writes:
- `reports/a11y-twin/verify.json`
- `reports/a11y-twin/verify.md`

## Developer Twin Outputs

`dev:twin:init` writes:
- `reports/dev-twin/intake.json`
- `reports/dev-twin/intake-questions.md`

`dev:twin:analyze` writes:
- `reports/dev-twin/summary.json`
- `reports/dev-twin/summary.md`
- `reports/dev-twin/code-workpack.md`
- `reports/dev-twin/unit-test-workpack.md`
- `reports/dev-twin/best-practices.md`
- `reports/dev-twin/impact-analysis.json`
- `reports/dev-twin/codex-workpack.md` (alias of code workpack)
- `reports/dev-twin/index.html`

ODT stage intake enrichment (during `odt:run`) also writes:
- `reports/dev-twin/intake-missing-fields.json`
- `reports/dev-twin/intake-missing-fields.md`

## ODT Outputs

`odt:init` writes:
- `reports/odt/README.md`
- `reports/odt/prompts/01-intake.md` ... `07-verify.md`
- `reports/odt/prompts/stage-contracts.json`
- `reports/odt/prompts/external-llm-safety.md`
- `reports/odt/prompts/external-llm-sanitized-context.json`

`odt:run` writes:
- `reports/odt/run-summary.json`
- `reports/odt/run-summary.md`
- `reports/odt/index.html`
- `reports/odt/fedit.html`
- `reports/odt/tech-design.md`
- `reports/odt/tech-design.json`
- `reports/odt/execution-guide.md`
- `reports/odt/impact-ranked-files.json`
- `reports/odt/impact-ranked-files.md`
- `reports/odt/code-patch-plan.md`
- `reports/odt/unit-test-matrix.md`
- `reports/odt/compliance-mapping.md`
- `reports/odt/verify-checklist.json`
- `reports/odt/verify-checklist.md`
- `reports/odt/db/history.json`

`odt:execute` writes:
- `reports/odt/execute/bundle.json`
- `reports/odt/execute/prompt.md`
- `reports/odt/execute/response-template.md`
- `reports/odt/execute/apply-summary.json`
- `reports/odt/execute/apply-summary.md`
- `reports/odt/execute/status.json`

## ODT Prompt Contracts

Each stage prompt now follows:
- `Inputs (exact files)`
- `Task`
- `Output Contract` (schema-driven)
- `Quality Gates`
- `Stop Conditions`

This keeps agent output explainable and reviewable for enterprise delivery.

## External LLM Safety

Before external prompt drafting (for example `chat.oracle.com`):
- use `reports/odt/prompts/external-llm-sanitized-context.json`
- avoid sending raw sensitive ticket content
- keep humans in the loop for final decisions

For repo-grounded implementation, prefer local Codex/Cline flow.

## Profiles

- `react-js` (active)
- `python` (scaffold)
- `java` (scaffold)

## Recommended Developer Flow

1. `npm run mcp:local:serve`
2. `npm run odt:run -- --profile react-js --withA11y`
3. Open `reports/odt/fedit.html`
4. Review Design / Impact / A11y / Code / Tests / PR tabs
5. Delegate to Codex or Cline
6. Apply reviewed patch via `odt:execute` (dry-run first)
7. Human review before merge
