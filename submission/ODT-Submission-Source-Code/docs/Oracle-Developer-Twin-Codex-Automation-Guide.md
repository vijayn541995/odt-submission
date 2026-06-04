# Oracle Developer Twin with Codex Automation

This guide explains how to run ODT as an AI digital worker across SDLC for feature, defect, and security-remediation delivery, including Oracle-aligned accessibility checks.

Primary runbook:
- `docs/Oracle-Developer-Twin-Developer-SOP.md`

## Why Codex Automation Works Here

ODT is command-driven and deterministic. That makes it suitable for Codex automations because one command can:

1. Initialize/update intake
2. Analyze repository impact
3. Generate technical design
4. Produce code + unit-test workpacks
5. Run a11y analysis and verify status
6. Publish enterprise dashboard artifacts

ODT now also includes an execution bridge:

7. Generate a reviewed execution bundle for Codex/Cline
8. Apply a returned unified diff safely into the repo

## Core Commands

1. New feature flow:
`npm run odt:feature`

2. Defect flow:
`npm run odt:defect`

3. Fully parameterized autopilot:
`npm run odt:autopilot -- --work-item feature --feature-name "Journey Search Improvements" --summary "Improve search relevance and pagination" --modules "src/journey-builder-app/modules/journey-builder/journeys,src/journey-builder-app/reusable_components" --criteria "Search returns relevant results,Empty state is informative,Keyboard flow is supported" --withA11y`

4. JOURNEY-23451 implementation-plan run:
`npm run odt:autopilot -- --profile react-js --work-item defect --feature-name "JOURNEY-23451 3PLTA Fixes" --summary "Remediate 3PLTA dependency findings using compatible upgrades, package overrides, and documented exceptions for legacy blockers" --modules "package.json,package-lock.json,webpack.config.js,webpack.prod.config.js,src/journey-builder-app,tests/jest" --criteria "Compatible dependency remediations are applied,Build and regression checks pass,Blocked findings are documented with rationale,A11y verification remains green" --withA11y`

5. Build execution bundle for Codex/Cline:
`npm run odt:execute`

6. Dry-run a reviewed patch:
`npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --dry-run`

7. Apply a reviewed patch and verify:
`npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --verify`

## Implementation Plan for JOURNEY-23451

Jira `JOURNEY-23451` is tracking **3PLTA Fixes**. For this item, ODT should be used to create a remediation plan that reduces security exposure without destabilizing the current React 16 / Webpack 4 / Terra-based application stack.

1. Intake and planning setup:
- Seed `reports/dev-twin/intake.json` with Jira key `JOURNEY-23451`, the 3PLTA summary, and security-remediation acceptance criteria.
- Add supporting references such as Jira comments, vulnerability spreadsheets, and branch/PR links under `designInputs.referenceDocs` or `designInputs.jiraLinks`.
- Mark the work item as a defect-style remediation flow even though the Jira item is a Feature, since the delivery motion is vulnerability reduction on existing behavior.

2. Dependency triage and impact analysis:
- Separate findings into direct dependencies, transitive dependencies, and blocked legacy items.
- Confirm whether each vulnerable package is runtime-shipping code or dev/build/test-only tooling.
- Use repo analysis to identify the highest-risk files first: `package.json`, `package-lock.json`, webpack configuration, test tooling, and impacted UI modules.

3. Implementation approach:
- Apply compatible version bumps for direct dependencies where the upgrade does not force a framework migration.
- Use controlled package overrides/resolution-style remediation for transitive packages when the fix can be introduced safely.
- Preserve compatibility with the current legacy stack constraints called out in Jira: React 16.x, Webpack 4.x, Terra component dependencies, and the existing Node runtime.
- Do not introduce a major-platform rewrite as part of this issue; instead, document any package that can only be fixed through a future modernization effort.

4. Validation and evidence generation:
- Run install/build/test validation after dependency changes.
- Run the ODT/a11y verification flow so the security work does not regress accessibility coverage:
  - `npm test`
  - `npm run build`
  - `npm run a11y:scan:ci || true`
  - `npm run a11y:twin:analyze`
  - `npm run a11y:twin:verify`
- Publish the generated `tech-design`, `run-summary`, code workpack, and unit-test workpack artifacts as implementation evidence.

5. Blocked findings handling:
- For items that remain blocked because secure versions require incompatible ecosystem upgrades, capture the blocker explicitly in the implementation plan.
- The current Jira discussion already highlights examples such as `http-proxy-middleware`, `node-ip`, and `pdfjs-dist-for-node` where remediation may require broader stack uplift.
- For every blocked item, record the reason, runtime exposure, compensating control, and the long-term modernization dependency.

6. Definition of done:
- All compatible 3PLTA fixes are applied and validated.
- Build and regression checks pass.
- Accessibility verification remains acceptable for the impacted surfaces.
- Remaining findings, if any, are documented in Jira and in ODT artifacts with clear business/technical rationale.

## Recommended Intake Seed for JOURNEY-23451

Use this as the starting point for `reports/dev-twin/intake.json` when generating the implementation plan:

```json
{
  "title": "JOURNEY-23451 - 3PLTA Fixes",
  "featureName": "3PLTA Fixes",
  "summary": "Remediate compatible dependency vulnerabilities and document legacy blockers without breaking the current React/Terra stack.",
  "workItemType": "defect",
  "jira": {
    "ticketId": "JOURNEY-23451",
    "url": "https://jira2.cerner.com/browse/JOURNEY-23451"
  },
  "constraints": {
    "noNewDependencies": true,
    "approvedLibrariesOnly": true
  }
}
```

## Artifact Outputs (Demo + Review)

1. `reports/odt/index.html` (enterprise dashboard)
2. `reports/odt/fedit.html` (interactive developer dashboard)
3. `reports/dev-twin/index.html` (planning dashboard)
4. `reports/a11y-twin/index.html` (a11y dashboard)
5. `reports/dev-twin/code-workpack.md`
6. `reports/dev-twin/unit-test-workpack.md`
7. `reports/dev-twin/intake-missing-fields.md`
8. `reports/odt/tech-design.md`
9. `reports/odt/run-summary.md`
10. `reports/odt/impact-ranked-files.md`
11. `reports/odt/code-patch-plan.md`
12. `reports/odt/unit-test-matrix.md`
13. `reports/odt/compliance-mapping.md`
14. `reports/odt/verify-checklist.md`
15. `reports/odt/execution-guide.md`
16. `reports/odt/codex-automation.md`
17. `reports/odt/execute/prompt.md`
18. `reports/odt/execute/status.json`
19. `reports/odt/execute/apply-summary.json`
20. `reports/odt/prompts/stage-contracts.json`
21. `reports/odt/prompts/external-llm-sanitized-context.json`
22. `reports/odt/prompts/external-llm-safety.md`

## Suggested Codex Automations

1. Daily SDLC health run:
- command: `npm run odt:autopilot -- --profile react-js --work-item feature --withA11y`

2. Defect triage run:
- command: `npm run odt:autopilot -- --profile react-js --work-item defect --withA11y`

3. Accessibility-only validation run:
- commands:
  - `npm run a11y:scan:ci || true`
  - `npm run a11y:twin:analyze`
  - `npm run a11y:twin:verify`

4. JOURNEY-23451 targeted remediation run:
- command: `npm run odt:autopilot -- --profile react-js --work-item defect --feature-name "JOURNEY-23451 3PLTA Fixes" --summary "Remediate compatible dependency vulnerabilities and document blocked legacy findings" --modules "package.json,package-lock.json,webpack.config.js,webpack.prod.config.js,src/journey-builder-app,tests/jest" --withA11y`

5. Execution-bundle generation:
- command: `npm run odt:execute`

6. Patch application dry run:
- command: `npm run odt:execute -- --response-file reports/odt/execute/agent-response.md --dry-run`

## Practical Team Model

1. Product/PO updates intake fields and acceptance criteria.
2. Developer runs ODT flow from ODT Workspace (`Run digital worker`) or CLI.
3. Developer reviews impact/design/a11y/test artifacts before delegation.
4. Developer uses `reports/odt/execute/prompt.md` with Codex/Cline to produce a unified diff.
5. Developer applies the reviewed diff through `odt:execute`.
6. Security/dependency owner confirms fixable versus blocked 3PLTA items and records rationale.
7. Reviewer validates dashboards + run summary as release evidence.

## Notes

1. Keep Oracle VPAT mappings updated in `docs/a11y-vpat-mapping.md`.
2. Keep policy source in `packages/accessibility-ai-shield/src/policy/oracle-vpat-policy.json`.
3. Maintain human-in-loop review before merge/release.
4. For JOURNEY-23451-style security work, always distinguish runtime-shipping risk from dev-only tooling risk in the final documentation.
5. For external prompt drafting, use only `reports/odt/prompts/external-llm-sanitized-context.json`.
