# Oracle Developer Twin User Guide

## What ODT Does

Oracle Developer Twin (ODT) is a governed Digital Worker for frontend SDLC.
It helps a developer move from requirement to review-ready implementation by combining:

- structured intake
- repo-aware impact analysis
- design, code, and test workpacks
- Oracle VPAT / WCAG accessibility evidence
- controlled delegation to an execution agent
- mandatory human review before merge

## Main Surfaces

Use these two dashboards together:

- ODT Workspace: `reports/odt/fedit.html`
- ODT Review Dashboard: `reports/odt/index.html`

## Start the Project

From the repo root:

```bash
cd /Users/vn105957/Desktop/odt-submission
./run-local.sh
```

Useful URLs:

- ODT Workspace: `http://127.0.0.1:8080/reports/odt/fedit.html`
- ODT Review Dashboard: `http://127.0.0.1:8080/reports/odt/index.html`
- MCP Health: `http://127.0.0.1:4310/health`

## How To Use ODT

### 1. Enter the Work Item

At the top of ODT Workspace:

- paste the Jira story, defect, or feature request into `Primary Requirement / Work Item`
- set `Target Repo Path`
- optionally upload mockups or reference docs

### 2. Add Human Review Guidance

If a reviewer wants changes before delegation:

- use `Reviewer Additions / Deletions` for general review notes
- use `Stage Overrides` only if a reviewer wants to steer a specific stage such as `Design` or `Code`

These inputs are saved locally and included in the next run.

### 3. Run the Digital Worker

Click `Run digital worker`.

ODT will generate a governed seven-stage flow:

1. Intake
2. Impact
3. Tech Design
4. Code Workpack
5. Unit Tests
6. Compliance
7. Verification

### 4. Review the Evidence

Human review should happen in this order:

1. `Delivery Workflow`
2. `Outcome Snapshot`
3. `Prompt Provider Status`
4. `Execution Health`
5. `Review Surface` tabs

The most important human review content is in:

- `Impact`
- `Design`
- `A11y`
- `Code`
- `Tests`
- `PR`
- `Plan`

### 5. Re-analyze if Needed

After reviewer notes are added:

- click `Update & Re-analyze`
- ODT refreshes the evidence package with those review instructions

This button only enables when meaningful intake or review changes were made.

### 6. Delegate to Agent

When the plan looks right:

- click `Delegate to Agent`
- choose `Codex` or `Cline`

ODT prepares the execution prompt here:

- `reports/odt/execute/prompt.md`

Live execution state is visible in `Execution Health` and the `Agent Status` control.

### 7. Final Human Review

ODT does not auto-merge code.

The developer or reviewer must still inspect:

- changed files in the repo
- `git diff`
- accessibility implications
- test changes
- acceptance criteria alignment

Final approval remains human-controlled.

## Resetting State

Use `Reset` to return ODT Workspace to a first-run state.

This clears saved local intake/review state and is useful before a fresh demo.

## How To Know If ODT Is Stale

ODT is current when:

- `reports/dev-twin/intake.json` matches the latest request
- `reports/odt/execute/prompt.md` matches the same request
- the dashboard status line reflects the latest run

If the dashboard still shows an older run:

1. click `Reset`
2. reload the dashboard
3. enter the new request
4. run again

## Demo Target Repo Notes

The demo target project lives at:

- `demo-target-repo`

Current demo-ready highlights:

- 300 employee records
- 10-record pagination
- `Previous` / `Next` paging
- validated employee request form
- success message and payload preview
- console logging on successful submit
- Oracle logo in the app hero
- button text updated to `Submit Employee Form`

## Recommended Demo Sequence

1. Open ODT Workspace
2. Paste a feature or defect
3. Run the digital worker
4. Show the generated evidence
5. Add a reviewer note
6. Re-analyze
7. Delegate to agent
8. Review the changed files and diff

This sequence best shows ODT as a Digital Worker rather than only a dashboard.
