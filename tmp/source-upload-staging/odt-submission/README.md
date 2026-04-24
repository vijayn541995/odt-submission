# Oracle Developer Twin (ODT) Source Code Bundle

This bundle contains the source code and operational documents needed to run the Oracle Developer Twin hackathon demo and inspect how it works.

It is intentionally focused on:

- the ODT orchestration code
- the local control plane
- the React demo target repository
- the setup and operating guides required to run the solution

It does not need presentation decks or local machine-specific secret files in order to run.

## What This Bundle Includes

- `packages/accessibility-ai-shield`
  ODT orchestration, accessibility analysis, seven-stage prompt generation, dashboards, and execution handoff logic.
- `packages/delivery-copilot`
  Local context server, repo-aware execution support, and agent launch integration.
- `demo-target-repo`
  The React sample application used as the target repository in the demo.
- `assets/branding`
  Oracle Developer Twin branding assets copied into generated ODT dashboard output.
- `scripts`
  Cleanup and OCI helper scripts used by the source bundle.
- `docs`
  The essential user, technical, OCI, and accessibility guidance for setup and operation.

## What Is Generated At Runtime

ODT creates these folders when you run it:

- `reports/odt`
- `reports/dev-twin`
- `reports/a11y`
- `reports/a11y-twin`
- `reports/mcp`

These generated artifacts are not required in the source zip because ODT recreates them from the source code during execution.

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- Python 3
- Optional: OCI CLI, if you want OCI GenAI to generate stage prompts
- Optional: Codex or Cline access, if you want to run the governed OCA-backed execution flow

## Folder Structure

```text
odt-submission/
├── README.md
├── .a11y-shieldrc.js
├── package.json
├── run-local.sh
├── assets/
├── packages/
│   ├── accessibility-ai-shield/
│   └── delivery-copilot/
├── demo-target-repo/
├── tests/
├── scripts/
└── docs/
    ├── Oracle-Developer-Twin-User-Guide.md
    ├── Oracle-Developer-Twin-Technical-Design.md
    ├── Oracle-Developer-Twin-Technical-Handout.md
    ├── OCI-GenAI-7-Stage-Prompt-Wiring.md
    └── a11y-vpat-mapping.md
```

## Quick Start

Install the demo app dependencies:

```bash
cd demo-target-repo
npm install
cd ..
```

Run the full local ODT flow:

```bash
./run-local.sh
```

Open the generated surfaces:

- ODT Workspace: `http://127.0.0.1:8080/reports/odt/fedit.html`
- ODT Review Dashboard: `http://127.0.0.1:8080/reports/odt/index.html`
- Local Context Server Health: `http://127.0.0.1:4310/health`

## Developer Starter Commands

Use these exact commands when a developer is setting up or re-running the project locally.

### First-Time Setup

```bash
cd /absolute/path/to/odt-submission/demo-target-repo
npm install
cd ..
```

### Start ODT End to End

```bash
cd /absolute/path/to/odt-submission
./run-local.sh
```

### Check Status or Reset for a Fresh Demo

```bash
cd /absolute/path/to/odt-submission
npm run odt:status
npm run odt:clean
```

### Run the Stages Manually

```bash
cd /absolute/path/to/odt-submission
npm run odt:init
npm run odt:run
npm run mcp:local:serve
python3 -m http.server 8080
```

### Run with OCI GenAI Prompt Generation

```bash
cd /absolute/path/to/odt-submission
cp scripts/odt-oci-local.example.sh scripts/odt-oci-local.sh
source scripts/odt-oci-local.sh
npm run odt:run:oci-hybrid
```

### Run the Demo Target App by Itself

```bash
cd /absolute/path/to/odt-submission/demo-target-repo
npm run dev
npm test
```

### Prepare or Inspect Agent Execution Files

```bash
cd /absolute/path/to/odt-submission
npm run odt:execute
npm run odt:status
```

## Manual Run Commands

If you want to run the steps one by one:

```bash
npm run odt:init
npm run odt:run
npm run mcp:local:serve
python3 -m http.server 8080
```

If you want ODT to include accessibility guidance:

```bash
npm run odt:run -- --withA11y
```

If you want to point to another local target repository:

```bash
npm run odt:run -- --target-repo-path /absolute/path/to/repo
```

## How To Use ODT

1. Start the local flow with `./run-local.sh`
2. Open `reports/odt/fedit.html`
3. Enter the work item and target repository
4. Run the Digital Worker
5. Review the seven generated stages:
   - Intake
   - Impact
   - Tech Design
   - Code Workpack
   - Unit Tests
   - Compliance
   - Verify
6. Add reviewer edits or stage overrides if needed
7. Re-run analysis if scope changes
8. Delegate only the approved execution path
9. Review the returned diff before accepting changes

## OCA / Agent Launching Steps

ODT does not install Codex or Cline for you. A developer should already have one of those tools available in the environment.

The governed execution flow is:

1. Run ODT and review the generated artifacts
2. Open ODT Workspace
3. Use `Delegate to Agent` when the bundle is ready
4. ODT writes the execution handoff files under `reports/odt/execute/`
5. The delegated agent works against the target repo
6. The developer reviews changed files and diffs before accepting the result

Most important execution files:

- `reports/odt/execute/prompt.md`
- `reports/odt/execute/bundle.json`
- `reports/odt/execute/status.json`

## OCI GenAI Setup

ODT supports two prompt-provider modes:

- `template`
  Always available and safe as the default fallback.
- `oci`
  Uses OCI GenAI to generate the seven stage prompts when configured.

Preferred setup:

1. Review `docs/OCI-GenAI-7-Stage-Prompt-Wiring.md`
2. Copy `scripts/odt-oci-local.example.sh` to `scripts/odt-oci-local.sh`
3. Update your local OCI values in that new file
4. Source the file in your shell
5. Run:

```bash
npm run odt:run:oci-hybrid
```

Important:

- `scripts/odt-oci-local.sh` is intentionally local-only and should not be committed with real tenancy values
- this bundle includes the example helper, not a live secret-bearing file

## Accessibility / Oracle VPAT Guidance

The Oracle accessibility source of truth is expected to come from your internal Oracle A11y / VPAT Confluence guidance.

Before enterprise use, a developer should refresh:

- `docs/a11y-vpat-mapping.md`
- `packages/accessibility-ai-shield/src/policy/oracle-vpat-policy.json`

Recommended update workflow:

1. Open the current Oracle internal VPAT / accessibility Confluence source
2. Update the Oracle reference mappings in `docs/a11y-vpat-mapping.md`
3. Sync any policy changes into `oracle-vpat-policy.json`
4. Re-run ODT with accessibility enabled
5. Review the resulting compliance artifacts before delegation

## Required Documentation

Use these files together:

- `docs/Oracle-Developer-Twin-User-Guide.md`
  Step-by-step operator guide for ODT Workspace and dashboard usage.
- `docs/Oracle-Developer-Twin-Technical-Design.md`
  Tech stack, architecture, prompt development, a11y governance, OCA execution, and improvement areas.
- `docs/OCI-GenAI-7-Stage-Prompt-Wiring.md`
  OCI CLI and prompt-provider setup.
- `docs/a11y-vpat-mapping.md`
  Oracle VPAT / WCAG mapping guidance.
- `demo-target-repo/README.md`
  Demo app setup and suggested story / defect scenarios.

## Roadmap / Next Steps

The current build is already strong enough for hackathon demonstration, but the next improvements are clear and achievable on the existing stack.

### Recommended Next Release (v2)

These are the highest-value upgrades for the next iteration:

- add a `Clarifications Needed` panel in FEDIT so ODT can ask decision-critical questions, capture answers, and block delegation until high-severity questions are resolved
- introduce explicit workflow states such as `draft`, `needs_input`, `ready_for_review`, `approved_for_delegate`, `diff_review_required`, and `accepted`
- improve run freshness handling so stale agent status, stale response preview, and stale dashboard state are easier to identify and reset
- extend design-input support to include structured spreadsheet references such as `csv`, `xls`, and `xlsx`
- generate attachment summaries for uploads so prompts can use extracted context, not only file paths

### Control and Governance Hardening

These improvements would make ODT feel more like a strongly governed engineering platform:

- convert repo impact analysis into enforcement inputs such as allowed write paths, protected files, maximum changed files, and dependency policy checks
- add machine-validated stage outputs so prompt contracts are not only descriptive but also programmatically verified
- enforce stop conditions and approval states before delegation or acceptance
- add pre-delegation diff quality checks for test coverage, accessibility guidance, and unauthorized dependency changes
- introduce checkpoint or worktree-based delegated execution for easier rollback and safer experimentation

### Broader Product Expansion

These are the longer-range roadmap items after the core control loop is stronger:

- support more repo profiles beyond the current demo-oriented setup
- deepen OCI GenAI prompt-tuning options and reusable Oracle policy packs
- expand OCA-compatible execution options and provider-specific launch guidance
- add richer audit history, run comparison, and measurable delivery metrics
- support more attachment intelligence such as OCR, document extraction, and structured spreadsheet summaries

### Practical Next-Step Plan

The most realistic sequence from here is:

1. build the `Clarifications Needed` panel and approval-state model
2. add write-scope and dependency-policy enforcement before delegation
3. add structured upload preprocessing for docs, images, and spreadsheets
4. add checkpoint/worktree isolation for delegated execution
5. add richer audit, reporting, and enterprise policy packaging

Detailed implementation notes for that roadmap are kept in:

- `docs/ODT-V2-Implementation-Plan.md`

## Notes

- The source zip should exclude `node_modules`, generated `reports`, PPT decks, and local secret files.
- The demo target repo remains intentionally simple so ODT behavior is easy to explain in a hackathon setting.
- The main differentiator is the governed seven-stage prompt flow, not just code generation.
