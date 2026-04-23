# Oracle Developer Twin Developer SOP

## Purpose
Use Oracle Developer Twin (ODT) as a repeatable Digital Worker flow for ticket intake, repo impact analysis, planning, accessibility compliance, and agent delegation with human-controlled merge.

## Preconditions
- Work from repo root: `/Users/vn105957/Desktop/odt-submission`
- Local tools available: `node`, `npm`, `python3`, `git`
- If using Cline, keep a Node 20+ environment for Cline itself

## Daily Start
1. Start local control plane:
`npm run mcp:local:serve`
2. Start static dashboard server:
`python3 -m http.server 8080`
3. Open ODT Workspace:
`http://localhost:8080/reports/odt/fedit.html`

## Ticket Intake (Required)
1. Paste ticket/user story in ODT Workspace.
2. Set `Target Repo Path` to the codebase to analyze/change.
3. Upload design inputs (mockups/docs) if available.
4. Confirm work type (`feature` or `defect`) in intake context.

## Run ODT Planning
1. Run from ODT Workspace `Run digital worker` or CLI:
`npm run odt:run -- --profile react-js --withA11y --target-repo-path /absolute/repo/path`
2. Review these generated artifacts:
- `reports/dev-twin/intake-missing-fields.md`
- `reports/odt/impact-ranked-files.md`
- `reports/odt/tech-design.md`
- `reports/odt/code-patch-plan.md`
- `reports/odt/unit-test-matrix.md`
- `reports/odt/compliance-mapping.md`
- `reports/odt/verify-checklist.md`

## Delegate Implementation
1. In ODT Workspace, click `Delegate to Agent` and choose `Codex` or `Cline`.
2. Track progress in:
- `Agent Launch Status`
- `Agent Log Tail`
- `Response Preview`
3. If needed, use generated prompt directly:
`reports/odt/execute/prompt.md`

## Apply Patch Safely
1. Dry-run first:
`npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --dry-run --target-repo-path /absolute/repo/path`
2. Apply with verify:
`npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --verify --target-repo-path /absolute/repo/path`
3. Review in Git/IDE before merge.

## Human Review Gate (Mandatory)
Approve only when:
- Acceptance criteria are met
- Unit tests are updated and stable
- Accessibility and keyboard behavior are validated
- No unauthorized dependency/risk changes were introduced
- `reports/odt/verify-checklist.md` decision is acceptable

## External LLM Safety
If using external prompt drafting (for example chat.oracle.com):
- Use sanitized context only: `reports/odt/prompts/external-llm-sanitized-context.json`
- Follow guardrails: `reports/odt/prompts/external-llm-safety.md`
- Do not paste raw sensitive ticket/customer data

## Fast CLI Alternative
1. Feature autopilot:
`npm run odt:feature`
2. Defect autopilot:
`npm run odt:defect`
3. Status:
`npm run odt:status`
