# ODT Agent Team Operator Guide

Last updated: 2026-06-17

This guide explains every major control on the Agent Team screen, what it does,
and the safest order to use it. It is written for demo operation and day-to-day
handoff work after context loss.

## Golden Rule

ODT must remain the source of truth. A terminal worker completing outside the UI
is not enough. After any worker finishes, return to Agent Team, refresh the run,
ingest the output, and confirm ODT shows the resulting status, relay item,
review comment, or implementation evidence.

## Recommended Demo Flow

1. Open ODT Workbench and go to `Agent Team`.
2. Review the workflow decision bar at the top of the screen.
3. Click `Refresh Health` and confirm the selected adapter is healthy.
4. If the Jira is already completed, use the Completed-Jira Verification Lane:
   click `Launch Reviewer` first, not an implementation worker.
5. When reviewer output is ready, use `Refresh Status`, then `Ingest Output`.
6. In `Agent Relay Inbox`, click `Review` on any open relay item.
7. Click `Use Rework` or `Use For Next Worker` to select the correct next lane.
8. Launch the selected worker only after the lane and write gate are correct.
9. After implementation output is ready, click `Record Evidence From Worker`
   when evidence capture is needed and not blocked by repo verification.
10. Move to `Review` or `PR Ready` after evidence is captured and reviewed.

## Screen Areas

The Agent Team screen is organized around governed delegation:

| Area | Purpose |
| --- | --- |
| Workflow decision bar | Shows whether current work is blocked, review-only, or write-approved. |
| Completed-Jira Verification Lane | Forces safer review/build verification when the Jira is already completed. |
| Team Operating Model | Explains how roles, write gates, human approval, and dependency installs work. |
| Agent Foundry | Runs read-only specialist reviews from current assignment evidence. |
| Execution Health | Shows whether execution adapters are ready for launch or handoff. |
| Execution Agent | Selects agent engine, worker lane, and launch or handoff action. |
| Agent Relay Inbox | Routes reviewer findings, rework items, questions, and human answers. |
| Shared Task List | Shows the cross-lane task checklist for the assignment. |
| Worker Queue | Lists prepared, active, and completed worker runs. |
| Worker Run Detail | Shows the selected worker bundle, status, output, logs, and ingest actions. |

## Agent Foundry Buttons

Agent Foundry creates review evidence. It does not directly edit source files.

| Control | What it does | When to use it |
| --- | --- | --- |
| `Review mode` | Chooses `Full SDLC` or `Focused domain` review. | Use Full SDLC for broad readiness checks; focused domain for targeted review. |
| `Specialist domain` | Chooses the focused review domain. | Use only when `Focused domain` is selected. |
| Source checkboxes | Selects which assignment evidence the review should read. | Keep only relevant sources enabled to avoid noisy review output. |
| `Run Full SDLC Review` | Runs a broad read-only specialist review and saves results as evidence. | Use before major handoff or demo validation when you need a broad risk scan. |
| `Run Specialist Review` | Runs a focused read-only specialist review. | Use when only one domain needs review, such as standards, tests, or design. |
| `Open Foundry Evidence` | Opens the Artifacts section where saved review evidence is visible. | Use after a foundry run to confirm the output was recorded. |

Important: Foundry output is advisory. Treat it as AI-generated evidence that
requires human review before making write or delegation decisions.

## Execution Health Buttons

Execution Health tells you whether ODT can launch or hand off work safely.

| Button | What it does | When to use it |
| --- | --- | --- |
| `Refresh Health` | Rechecks adapter readiness for Codex, Cline, OCI GenAI, Ollama, OpenAI, and related launch support. | Use before launching any worker, especially before demo. |

Health cards may show:

| Field | Meaning |
| --- | --- |
| `Launch` | Whether the adapter supports direct launch, handoff only, or is not wired. |
| `Auth owner` | Who owns the credentials or setup for that adapter. |
| `Version` | Detected adapter or CLI version. |
| `Executable` | Detected executable path when available. |
| `Recent issues` | Last adapter issue ODT knows about. |

If Codex is unhealthy, do not launch a terminal worker. Fix the adapter or use a
handoff-only path.

## Completed-Jira Verification Lane

This section appears when the active Jira is already completed. Its purpose is
to avoid changing completed work before review evidence is recorded.

| Button | What it does | Safe usage |
| --- | --- | --- |
| `Launch Reviewer` | Launches the read-only Reviewer lane through Codex. | Use this first for completed Jira validation. |
| `Select Reviewer` | Selects the Reviewer worker lane without launching. | Use when you want to inspect or prepare before launching. |
| `Select Build Verifier` | Selects the Build Verifier lane. | Use after review when build/test verification is needed. |
| `Open PR Ready` | Opens the PR Ready section. | Use after review/build evidence is sufficient for PR or release packaging. |

Safe order for completed Jira:

1. `Launch Reviewer`
2. `Refresh Status`
3. `Ingest Output`
4. Review relay findings
5. `Select Build Verifier` if build validation is needed
6. `Open PR Ready`

## Execution Agent Controls

Use this section to choose who executes the next step and what lane receives the
work.

### Agent Selection

| Agent | What it means | Best use |
| --- | --- | --- |
| `Codex` | Direct terminal worker launch when the Codex adapter is healthy. | Use for local ODT-governed worker execution. |
| `Cline` | Handoff-only execution in the current slice. | Use when another agent should receive a copied handoff. |
| `Manual` | Human execution outside the workbench. | Use when a person will run the work manually but ODT should still prepare context. |

Clicking an agent saves it to settings. It does not launch by itself.

### Worker Lane Selection

| Lane | Access | Purpose |
| --- | --- | --- |
| `Lead Planner` | Read-only | Breaks down scope, risks, plan, and next steps. |
| `Senior Full Stack Dev` | Write-gated | Handles end-to-end implementation across UI, API, and persistence. |
| `Backend Dev` | Write-gated | Handles API, workflow, repository, and data-layer work. |
| `Frontend Dev` | Write-gated | Handles React UI, sidebar features, and browser-facing behavior. |
| `Reviewer` | Read-only | Reviews diff, risks, tests, security, accessibility, and standards. |
| `Build Verifier` | Write-gated | Runs build/test verification and records evidence. |

Clicking a lane saves it to settings. It does not launch by itself.

## Execution Agent Buttons

| Button | What it does | When to use it |
| --- | --- | --- |
| `Launch <Worker Name>` | Creates a worker bundle and launches a Codex terminal worker for the selected lane. | Use only when Codex is selected, health is good, and the lane is allowed by current gates. |
| `Delegate to <Agent>` | Creates and copies a write-approved handoff for a non-Codex agent. | Use when Cline or another agent will execute outside direct ODT launch. |
| `Delegate Read-only to <Agent>` | Creates and copies a read-only handoff. | Use when writes are not approved or the next step is planning/review only. |
| `Prepare Handoff Only` | Creates and copies a governed handoff without launching. | Use when you want manual control or need to paste context elsewhere. |
| `Unlock Write Delegation` | Opens Standards so a human can approve or override write scope. | Use only when write work is required and the gate is locked. |
| `Copy Read-only Handoff` | Copies the current assignment agent contract as read-only JSON. | Use for safe sharing, context backup, or manual review. |

Why `Launch <Worker Name>` may be disabled:

| Reason | What to do |
| --- | --- |
| Codex is not selected | Select `Codex`. |
| Codex health is not healthy | Click `Refresh Health`, then fix adapter setup if needed. |
| Write lane is selected but write mode is locked | Use `Unlock Write Delegation` and complete Standards approval. |
| Jira is completed and implementation is blocked | Launch `Reviewer` first, then build verification or PR Ready. |
| Review blockers exist | Resolve, override with human approval, or route through relay/rework. |

## Agent Relay Inbox Buttons

Relay items are durable cross-lane work items extracted from worker output and
review findings. They preserve questions, rework, and next-worker context.

### Relay Table Buttons

| Button | What it does | When to use it |
| --- | --- | --- |
| `Review` | Selects the relay item and opens its detail panel. | Use before making any relay decision. |
| `Use Rework` | Selects the relay target worker lane for a rework item. | Use when reviewer output says implementation needs follow-up. |
| `Use Next` | Selects the relay target worker lane for a non-rework item. | Use when a question or handoff should guide the next lane. |

### Selected Relay Buttons

| Button | What it does | When to use it |
| --- | --- | --- |
| `Assign Lane` | Marks the relay as assigned to its target lane. | Use after confirming the correct worker lane owns it. |
| `Record Answer` | Saves human decision notes against the relay item. | Use when a question needs a human answer before the next worker proceeds. |
| `Reopen` | Reopens a relay item. | Use if a closed/answered relay needs more work. |
| `Use For Next Worker` | Selects the relay target lane as the next worker lane. | Use immediately before launching or preparing the next handoff. |

Relay flow for reviewer rework:

1. Ingest reviewer output.
2. Open `Agent Relay Inbox`.
3. Click `Review` on the rework item.
4. Read the finding and target lane.
5. Click `Use Rework` or `Use For Next Worker`.
6. Confirm the selected worker lane changed.
7. Launch or prepare handoff for that lane.

`Use Rework` and `Use For Next Worker` do not launch a worker. They only select
the correct lane so the next worker receives the relay context.

## Worker Queue Buttons

Worker Queue lists all prepared, launched, active, completed, and ingested worker
runs for the current assignment.

| Button | What it does | When to use it |
| --- | --- | --- |
| `Review` | Selects a worker run and opens its detail panel. | Use before refreshing, ingesting, or copying run details. |
| `Refresh` | Reads latest status, response, and log files for that run. | Use after a terminal worker starts or finishes. |
| `Launch` | Launches a prepared worker bundle. | Use for prepared/manual fallback runs that were not launched yet. |
| `Stop` | Requests the active worker to stop. | Use only when a worker is stuck, wrong, or no longer needed. |
| `Ingest` | Reads worker response back into ODT and updates workflow evidence. | Use after the worker response exists. This is required for ODT continuity. |
| `Record Evidence` | Extracts implementation evidence from worker output and runs post-checks. | Use after implementation output is reviewable and repo verification does not block evidence. |
| `Evidence Blocked` | Indicates ODT will not record evidence because repo verification is blocking it. | Resolve the verification issue first. |

Safe worker completion flow:

1. Wait for worker terminal completion or visible response output.
2. Click `Refresh`.
3. Confirm response/log byte counts or output timestamp updated.
4. Click `Ingest`.
5. Confirm ODT shows review comments, relay items, or updated worker status.
6. Click `Record Evidence` only when implementation evidence should be captured.

## Worker Run Detail Buttons

Worker Run Detail gives the strongest evidence for what happened in a specific
run.

| Button | What it does | When to use it |
| --- | --- | --- |
| `Copy Manual Command` | Copies the command needed to run the worker manually. | Use when automatic launch is unavailable or blocked. |
| `Copy Prompt Path` | Copies the generated prompt file path. | Use to inspect exactly what context the worker received. |
| `Copy Response Path` | Copies the expected response/output file path. | Use to locate worker output on disk. |
| `Refresh Status` | Refreshes the selected run status, response, and log output. | Use after launch, during execution, and after completion. |
| `Launch Bundle` | Launches the selected prepared worker bundle. | Use if the run is prepared but not launched. |
| `Stop Worker` | Requests the active worker to stop. | Use if the run is wrong, stuck, or should be cancelled. |
| `Ingest Output` | Imports the selected worker output into ODT. | Use after every completed worker run with response output. |
| `Record Evidence From Worker` | Converts implementation output into ODT implementation evidence and runs post-checks. | Use after implementation work is ingested and reviewable. |
| `Repo Verification Blocks Evidence` | Shows evidence capture is disabled because repo verification blocks it. | Resolve verification before recording evidence. |
| Live log toggle | Shows or hides the latest worker log tail. | Use while watching an active worker or debugging launch issues. |

Important ingest rule:

1. `Refresh Status` proves files changed.
2. `Ingest Output` makes ODT understand the worker result.
3. `Record Evidence From Worker` captures implementation evidence when needed.

Skipping ingest is the most common reason a terminal run looks successful but
ODT still shows no review comments, relay item, or updated workflow state.

## Common Operating Sequences

### Planning Only

1. Select `Manual`, `Cline`, or `Codex`.
2. Select `Lead Planner`.
3. Use `Prepare Handoff Only` or `Launch Lead Planner`.
4. Refresh and ingest output if the worker runs through ODT.

### Read-Only Review

1. Select `Codex`.
2. Select `Reviewer`.
3. Click `Refresh Health`.
4. Click `Launch Reviewer`.
5. Click `Refresh Status`.
6. Click `Ingest Output`.
7. Review comments and relay items created by ingestion.

### Reviewer Finding To Rework

1. Ingest reviewer output.
2. Open `Agent Relay Inbox`.
3. Click `Review` on the rework item.
4. Click `Use Rework`.
5. Confirm selected lane is `Senior Full Stack Dev`, `Backend Dev`, or
   `Frontend Dev` as appropriate.
6. Confirm write delegation is approved if the lane requires writes.
7. Click `Launch <Worker Name>` or prepare a handoff.

### Implementation Worker To Evidence

1. Launch or hand off the implementation worker.
2. Click `Refresh Status` after it completes.
3. Click `Ingest Output`.
4. Click `Record Evidence From Worker`.
5. Confirm changed files, commands, tests, and post-check evidence appear in ODT.
6. Move to Reviewer or PR Ready.

### Adapter Problem

1. Click `Refresh Health`.
2. Read adapter status and recent issue text.
3. If Codex is unhealthy, do not force `Launch`.
4. Use `Prepare Handoff Only` or `Copy Read-only Handoff` if work must continue.
5. Fix adapter setup before returning to direct launch.

## Demo Safety Checklist

Before demo:

| Check | Expected state |
| --- | --- |
| API server | Running on the configured local API port. |
| UI server | Running on the configured local UI port. |
| Active assignment | Correct assignment selected in ODT. |
| Execution health | Codex healthy if launching terminal workers. |
| Write gate | Approved only when implementation work is intentional. |
| Worker queue | Previous run outputs are ingested if they are part of the story. |
| Relay inbox | Open items are understood and routed to the right lane. |
| Artifacts | Foundry/review/evidence outputs are visible when needed. |

During demo:

1. Explain that ODT uses governed handoff, not blind agent execution.
2. Show `Refresh Health`.
3. Show lane selection and write gate state.
4. Show relay inbox as the handoff bridge between Reviewer and Dev lanes.
5. Show ingest as the step that makes external worker output durable inside ODT.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Worker finished in terminal but ODT did not update | Output was not ingested. | Use `Refresh Status`, then `Ingest Output`. |
| `Launch` is disabled | Adapter unhealthy, wrong agent selected, write gate locked, or completed-Jira verification block. | Check Execution Health, selected agent, selected lane, and Standards approval. |
| No relay item appears after reviewer run | Reviewer output may not have been ingested or did not contain rework/questions. | Refresh and ingest the reviewer run, then inspect Worker Run Detail. |
| `Record Evidence From Worker` is disabled | No reviewable output or repo verification blocks evidence. | Refresh status, ingest output, or resolve repo verification. |
| Cline or Manual does not launch terminal | Current slice treats them as handoff-only. | Use `Delegate`, `Prepare Handoff Only`, or copy the handoff. |
| Clipboard copy fails | Browser clipboard access may be blocked. | Use Artifacts, prompt path, response path, or copied file path from Worker Run Detail. |

## Button Meaning Summary

| Button | One-line meaning |
| --- | --- |
| `Refresh Health` | Recheck whether execution adapters can launch or hand off work. |
| `Launch Reviewer` | Start a read-only review worker through Codex. |
| `Select Reviewer` | Pick Reviewer as the next worker lane. |
| `Select Build Verifier` | Pick Build Verifier as the next worker lane. |
| `Open PR Ready` | Move to PR readiness packaging and evidence. |
| `Run Full SDLC Review` | Run broad read-only specialist review evidence. |
| `Run Specialist Review` | Run focused read-only specialist review evidence. |
| `Open Foundry Evidence` | Open saved review artifacts. |
| `Launch <Worker Name>` | Launch the selected Codex worker lane. |
| `Delegate to <Agent>` | Prepare and copy write-approved handoff for another agent. |
| `Delegate Read-only to <Agent>` | Prepare and copy read-only handoff. |
| `Prepare Handoff Only` | Prepare handoff without launching. |
| `Unlock Write Delegation` | Go to Standards for write approval. |
| `Copy Read-only Handoff` | Copy a safe read-only agent contract. |
| `Review` | Select a relay item or worker run for inspection. |
| `Use Rework` | Select the rework target lane from a relay item. |
| `Use Next` | Select the next target lane from a relay item. |
| `Assign Lane` | Mark relay ownership against its target lane. |
| `Record Answer` | Save human decision notes on a relay item. |
| `Reopen` | Reopen a relay item for more work. |
| `Use For Next Worker` | Select the relay target lane for the next worker. |
| `Refresh` | Refresh status/output for a worker run. |
| `Launch` | Launch a prepared worker run. |
| `Stop` | Stop an active worker run. |
| `Ingest` | Import worker output into ODT. |
| `Record Evidence` | Capture implementation evidence from worker output. |
| `Copy Manual Command` | Copy shell command for manual execution. |
| `Copy Prompt Path` | Copy path to the worker prompt file. |
| `Copy Response Path` | Copy path to expected worker response output. |
| `Refresh Status` | Refresh selected worker run detail. |
| `Launch Bundle` | Launch selected prepared worker bundle. |
| `Stop Worker` | Stop selected active worker. |
| `Ingest Output` | Import selected worker output into ODT. |
| `Record Evidence From Worker` | Convert selected worker output into implementation evidence. |
