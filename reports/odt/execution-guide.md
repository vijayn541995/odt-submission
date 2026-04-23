# Oracle Developer Twin Execution Guide

This guide is designed for everyday developer use, stakeholder reviews, and guided walkthroughs.

## 1) New Feature Workflow
1. Initialize intake template: `npm run dev:twin:init`
2. Update `reports/dev-twin/intake.json` with ticket summary, acceptance criteria, mockups, and constraints.
3. Run ODT pipeline: `npm run odt:run -- --profile react-js --withA11y`
4. Review inferred repo impact, tech design, and code workpack.
5. Use `npm run odt:execute` to prepare/apply a reviewed Codex/Cline patch.
6. Verify with generated dashboards and run summary.

## 2) Defect Workflow
1. Set `workItemType` to `defect` in intake JSON.
2. Fill `defectContext` (observed, expected, severity).
3. Add optional suspected areas only if you already know likely root-cause zones.
4. Run ODT pipeline and use inferred impact + workpacks to patch and add regression tests.
5. Confirm compliance and run status are review-ready.

## 3) Accessibility Workflow (VPAT/WCAG + Keyboard)
1. Run: `npm run a11y:twin:demo`
2. Review `reports/a11y-twin/index.html` and `priority-queue.md`.
3. Apply fixes with `reports/a11y/coding-agent-prompt.md`.
4. Re-run verify: `npm run a11y:twin:verify`.

## 4) Unit Test Workflow
1. Run ODT pipeline to generate `reports/dev-twin/unit-test-workpack.md`.
2. Use Codex/Cline to update tests for happy, edge, and error paths.
3. Execute tests: `npm test -- --watch=false --runInBand`.

## 5) Execute Workflow
1. Run: `npm run odt:execute` to generate `reports/odt/execute/prompt.md`.
2. Paste the prompt into Codex/Cline and save the diff response to a local file.
3. Apply safely: `npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --dry-run`.
4. If dry-run passes, apply for real: `npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --verify`.

## 6) Tech Design Workflow
1. Run ODT pipeline.
2. Review `reports/odt/tech-design.md` and `tech-design.json`.
3. Validate architecture and quality gates before implementation.

## 7) Dashboard & Status
- ODT Review Dashboard: `reports/odt/index.html`
- ODT Workspace: `reports/odt/fedit.html`
- Developer Review Plan: `reports/odt/developer-review-plan.md`
- DevTwin: `reports/dev-twin/index.html`
- A11yTwin: `reports/a11y-twin/index.html`
- Run status: `npm run odt:status`

## Last Run Snapshot
- Profile: react-js
- Status: ready_for_review
- Completed: 7/7

