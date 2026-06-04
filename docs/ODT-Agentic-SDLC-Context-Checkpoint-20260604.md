# ODT Agentic SDLC Context Checkpoint

Created: 2026-06-04 20:13 IST

This checkpoint captures the current ODT Workbench direction, implementation state, important user decisions, and next steps. Use it to resume work if Codex context is lost after migration.

## Why This Exists

The current ODT effort has moved beyond a simple dashboard. The product direction is now:

> ODT Workbench is a governed agentic AI-assisted developer workbench that helps developers move from requirement/Jira/repo input to PR-ready implementation while enforcing Oracle-style UX, accessibility, security, compliance, dependency, testing, and code-quality standards.

The most important correction made during this chat:

- ODT should not merely generate static handoff text.
- ODT should act as the control plane for an agentic SDLC team.
- Worker lanes such as planner, senior full stack developer, backend, frontend, reviewer, and build verifier should be powered by engines such as Codex CLI first, then Cline, OCI GenAI/OCA, MCP, and future orchestration adapters.
- Workers should pass output through ODT evidence, not directly and invisibly between themselves.

## Current Score

Idea score: 88/100.

Current product progress: approximately 40/100.

Reason:

- The governed workbench shell exists.
- Standards and evidence backbone exists.
- Agent Foundry advisory reviews exist.
- Codex worker launch path exists.
- Worker lane model is being added.
- Durable worker queue and output ingestion are now partially implemented.
- The full orchestration brain is still incomplete.

## Important Paths

ODT 2.0 app:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
```

Target demo repo:

```bash
cd /Users/vn105957/Desktop/lpdev/journey-builder-js
```

Timestamped source backup created before this checkpoint:

```text
/Users/vn105957/Desktop/odt-submission/backups/odt-agentic-checkpoint-20260604-201309
```

Earlier pre-worker-launch backup:

```text
/Users/vn105957/Desktop/odt-submission/backups/odt-workbench-next-before-worker-launch-20260604-194640
```

## Start Commands

Start ODT API:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node server/index.js
```

Start ODT UI if needed:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run dev -- --host 127.0.0.1 --port 5189
```

Open:

```text
http://127.0.0.1:5189/
```

Build check:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run build
```

Last known build status: passed after the current agentic worker changes.

## User Decisions Captured

- ODT should be an agentic AI SDLC app, not only a dashboard.
- ODT 2.0 should remain more advanced than the original POC dashboard, but can reuse proven POC mechanics.
- The original POC launcher pattern should be reused safely:
  - generate execution bundle
  - create prompt
  - create launch script
  - open visible Terminal
  - capture response/log/status evidence
- Codex CLI is the first real execution engine.
- Cline, OCI GenAI/OCA, MCP, AutoGen/AutoGPT-style orchestration can be future adapters.
- ODT must remain the orchestrator and governance source of truth.
- Dependency installs require separate explicit approval.
- Destructive actions are blocked.
- Branch creation, PR creation, external updates remain blocked unless explicitly added later.
- Agents can run sequentially by default.
- Parallel write agents are allowed only after ODT partitions scope/files to avoid conflicting edits.
- A senior IC4-style Full Stack Dev lane should exist for tightly coupled work.
- Backend/Frontend split remains useful for larger or clearly separable work.
- Reviewer and Lead Planner should be read-only advisory workers.
- Worker outputs must be passed to the next worker through ODT evidence.
- If Frontend has a question for Backend, it should write it as evidence; ODT should route it to Backend.
- If Reviewer finds an issue, ODT should route rework to the responsible lane.

## Demo Task Being Used

Assignment:

```text
Assessment Preview Enablement - journey-builder-js
```

Target repo:

```text
/Users/vn105957/Desktop/lpdev/journey-builder-js
```

Requirement summary:

- Assessment Preview should open only the last saved DB version.
- Preview must never reflect unsaved edits.
- Create flow keeps Preview disabled until first successful save/publish.
- Edit flow initializes Preview from saved GET data.
- Any assessment edit disables Preview immediately.
- Save Draft or Publish success re-enables Preview only if submitted/saved questions are previewable.
- Save Draft or Publish failure keeps Preview disabled.
- Preserve support admin behavior.
- Add reusable helper such as `isAssessmentPreviewable(questions)` in `activity_util.jsx`.
- Update API payload behavior:
  - deleting a question: do not send deleted question block
  - deleting an answer: do not send removed answer block
  - adding new question: do not send question id or answer id

Target tests mentioned:

```text
tests/jest/modules/activity/edit_publish.test.js
tests/jest/modules/activity/edit_activity.test.js
tests/jest/modules/activity/assessment_details.test.js
tests/jest/modules/activity/Publish.test.js
tests/jest/modules/journey-builder/activities/container-components/util/activity_util.test.js
```

## Current ODT Features Already Built

Implemented before this checkpoint:

- React workbench shell.
- Sidebar icons and polished layout.
- Overview with task-specific Assessment Preview context.
- Intake with folder selection and context file upload.
- Planner with requirement-specific content.
- Standards and governance layer.
- Standards review UI.
- Approval/override behavior.
- Dependency approval UI.
- Artifacts view.
- ODT Guide Q&A/RAG-like local evidence behavior.
- Agent Foundry with 10 specialist domains.
- OpenAPI endpoint exposure.
- Worker lane UI:
  - Lead Planner
  - Senior Full Stack Dev
  - Backend Dev
  - Frontend Dev
  - Reviewer
  - Build Verifier
- Codex worker launch endpoint:
  - bundle generation
  - `handoff.json`
  - `prompt.md`
  - `launch-codex.sh`
  - response/log/status files
  - visible Terminal launch for real mode
  - bundle-only mode for safe validation

## Worker Roles

Current intended worker lanes:

| Lane | Mode | Purpose |
| --- | --- | --- |
| Lead Planner | read-only | Clarifies scope, sequencing, gaps, risks, and worker split |
| Senior Full Stack Dev | write-approved | IC4-style multi-stack implementation for tightly coupled work |
| Backend Dev | write-approved | API/data/utility/service integration work |
| Frontend Dev | write-approved | UI/component/state/accessibility/frontend tests |
| Reviewer | read-only | Reviews diffs, risks, standards, security, tests |
| Build Verifier | write-approved/test | Runs approved tests/builds and captures evidence |

Important:

- Lead Planner and Reviewer should stay read-only even when assignment is write-approved.
- Senior Full Stack Dev, Backend Dev, Frontend Dev, and Build Verifier require write approval.
- Dependency installs remain separately blocked unless package-specific approval exists.

## Current Code Changes In Progress

Modified files:

```text
/Users/vn105957/Desktop/odt-submission/odt-workbench-next/server/index.js
/Users/vn105957/Desktop/odt-submission/odt-workbench-next/src/main.jsx
/Users/vn105957/Desktop/odt-submission/odt-workbench-next/src/styles.css
```

Recent backend additions:

- `agentWorkerRoles` registry.
- `GET /api/agents/worker-roles`.
- `POST /api/agents/launch-worker`.
- `GET /api/agents/worker-runs/:assignmentId`.
- `POST /api/agents/worker-runs/:workerRunId/ingest`.
- Codex launch bundle builder.
- Worker prompt builder.
- Prior-worker relay evidence injection into future prompts.
- `agent_worker_runs` table added to SQLite schema.
- Worker response ingestion helper started:
  - reads response file
  - stores parsed summary/raw output
  - extracts sections like `Questions for Backend`
  - marks worker as `completed` or `needs_input`

Recent frontend additions:

- Agent Team renamed around agentic SDLC worker lanes.
- Execution engine selector remains Codex/Cline/Manual.
- Worker lane cards added.
- Launch button changes based on selected lane, e.g. `Launch Backend Dev`.
- Worker Queue table added.
- Ingest Output button added.
- Artifacts now include:
  - Agent Worker Launch
  - Worker Relay Queue

Recent styling additions:

- Worker lane card grid.
- Three-column layout for six lanes.

## Current Verification Status

Passed:

```bash
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run build
```

Passed earlier:

- Worker roles API returned expected lane list.
- Bundle-only Lead Planner launch created:
  - handoff
  - prompt
  - launch script
  - response/log/status files
- Artifacts showed Agent Worker Launch evidence.
- Agent Team lane selection changed primary button to `Launch Backend Dev`.
- Target repo remained unchanged during safe validation.

Needs to be completed after current schema additions:

1. Restart API so new `agent_worker_runs` table exists in the live SQLite connection.
2. Run build again if further edits occur.
3. Test worker-run list API.
4. Test bundle-only Senior Full Stack Dev launch.
5. Write simulated response text to the generated response file.
6. Call ingest endpoint.
7. Confirm worker status becomes `completed` or `needs_input`.
8. Confirm extracted questions show in Worker Relay Queue and future prompts.
9. Browser-check Agent Team and Artifacts.

## Safe Smoke Test Plan

Use bundle-only mode so the target repo is not modified:

```bash
curl -s -X POST http://127.0.0.1:5190/api/agents/launch-worker \
  -H 'Content-Type: application/json' \
  -d '{
    "assignmentId":"assignment-local-mvp",
    "executionAgent":"codex",
    "workerRole":"fullstack-dev",
    "launchMode":"bundle-only",
    "notes":"Smoke test bundle-only Senior Full Stack Dev lane."
  }'
```

Then write a simulated response to the returned `responseFile`:

```md
# Senior Full Stack Dev Output

Summary: inspected the plan and identified the core implementation path.

Questions for Reviewer
- Should preview gating tests assert disabled state immediately after every assessment field mutation?

Known risks:
- Need repo-specific confirmation of save success callback path.
```

Then ingest:

```bash
curl -s -X POST http://127.0.0.1:5190/api/agents/worker-runs/<workerRunId>/ingest \
  -H 'Content-Type: application/json' \
  -d '{"assignmentId":"assignment-local-mvp"}'
```

Expected:

- worker status becomes `needs_input`
- extracted question target lane is `Reviewer`
- next worker prompt includes prior worker relay evidence

## Architecture Direction To Reach 100/100

### Phase 1: Core Agentic Orchestrator

Target progress: 50/100.

Build:

- Worker queue state.
- Lane sequencing:
  - Lead Planner
  - Senior Full Stack Dev or Backend/Frontend
  - Reviewer
  - Build Verifier
- Worker states:
  - pending
  - bundle_created
  - running
  - completed
  - needs_input
  - failed
  - blocked
- Output ingestion.
- Cross-lane question routing.
- Resume next worker button.

### Phase 2: Worker Output Ingestion

Target progress: 62/100.

Build:

- Read Codex response files automatically.
- Parse:
  - summary
  - files changed
  - commands run
  - tests
  - risks
  - questions for other lanes
  - answers to prior lane questions
- Show parsed outputs in Review and Artifacts.
- Let developer accept/reject/request rework.

### Phase 3: Real Implementation Loop

Target progress: 72/100.

Build:

- Senior Full Stack Dev write-approved Codex session.
- Backend/Frontend split sessions when needed.
- Reviewer read-only Codex session.
- Build Verifier session.
- Rework loop:
  - Reviewer comment
  - assigned worker
  - fix
  - reviewer re-check

### Phase 4: Safe Parallel Work

Target progress: 80/100.

Build:

- File/module partitioning.
- Parallel launch only when no file overlap.
- Conflict detection.
- Shared evidence and lock status.
- Default to sequential.

### Phase 5: Multi-Engine Agent Support

Target progress: 88/100.

Build:

- Cline adapter.
- OCI GenAI/OCA adapter.
- MCP adapters:
  - Jira
  - Confluence/Knowledge
  - repo search
  - Git tooling
- Engine policy:
  - which engines can read
  - which engines can write
  - which engines can run tests

### Phase 6: Governance Completion

Target progress: 94/100.

Build:

- Dependency approval workflow completion.
- Security evidence.
- Accessibility/VPAT/WCAG evidence.
- Section 508 evidence.
- Test evidence.
- Standards override audit.
- PR readiness gate.

### Phase 7: PR-Ready Automation

Target progress: 100/100.

Build:

- PR summary generator.
- Acceptance criteria mapping.
- Changed file explanation.
- Test result summary.
- Accessibility/security/dependency notes.
- Known risks and rollback plan.
- Optional PR creation only behind approval.

## Do Not Forget

- ODT is the orchestrator.
- Agents are engines/workers.
- ODT evidence is the shared memory.
- Human approval remains central.
- Full Stack Dev is the practical default for tightly coupled tasks.
- Backend/Frontend split is for larger separable work.
- Reviewer and Planner stay read-only.
- Build Verifier should verify, not implement feature changes.
- Parallel work requires file partitioning first.
- Dependency installs are never implicit.
- Target repo should not be modified during ODT validation unless a real write-approved worker launch is intentionally triggered.

