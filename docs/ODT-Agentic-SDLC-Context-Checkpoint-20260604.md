# ODT Agentic SDLC Context Checkpoint

Created: 2026-06-04 20:13 IST

Last updated: 2026-06-05 06:55 IST

This checkpoint captures the current ODT Workbench direction, implementation state, important user decisions, and next steps. Use it to resume work if Codex context is lost after migration.

## Latest Update - 2026-06-05

ODT 2.0 has moved from the earlier 40/100 agentic checkpoint to roughly:

- **76-78/100 for demo-grade ODT 2.0**
- **45-50/100 for full Oracle-internal production-grade ODT**

The product direction is now more precise:

> ODT 2.0 is an Oracle-internal-ready governed agentic SDLC control plane. It should combine modern AI developer workflows with enterprise governance, configurable policy, auditable evidence, provider flexibility, Oracle AI services, and internal MCP/tool connectors.

### Latest Chat Backup Refresh - 2026-06-05 06:55 IST

This section captures the newest state after the Oracle AI, MCP connector, guide/RAG, intake UX, and backup-continuity discussions. The user specifically asked to keep this backup current because a Codex migration may lose the live chat context.

Current product intent:

- Build ODT 2.0 as a production-quality, Oracle-internal-ready agentic SDLC workbench.
- ODT should orchestrate specialist workers and external tools, not act as a loose chatbot.
- Agent work should be sequential by default, with relay context passed from one worker to the next.
- Parallel work is future-safe only when ODT can partition file scope and prevent conflicting edits.
- The practical write-capable implementation lane is a senior IC4-style **Senior Full Stack Dev** agent. Backend/Frontend split remains available for large, separable work.
- ODT should be model/provider-flexible: Codex CLI first, Cline/manual/OCI GenAI/OCA/Ollama/OpenAI/OpenAI-compatible APIs as adapter-ready paths.
- ODT Guide should behave like a training handbook chatbot for the ODT platform, with local RAG grounding first and optional GenAI enhancement when a backend provider is configured.
- Every AI/model/tool output must remain evidence-backed. ODT owns workflow state, approvals, policy, evidence, logs, and PR readiness.

Current technical status:

- Frontend: `http://127.0.0.1:5189`
- Backend API: `http://127.0.0.1:5190`
- API was restarted and listening on port `5190`.
- `node --check server/index.js` passed.
- `npm run build` passed after the latest connector/intake/guide/provider edits.
- `/api/settings` returned 8 connector definitions with readiness and missing config metadata.
- `POST /api/connectors/query` for Jira returned a safe blocked response listing missing config:
  - `ENABLE_MCP`
  - `ENABLE_JIRA_MCP`
  - `JIRA_MCP_SERVER_NAME`
- Browser DOM check confirmed the Settings Connector Hub content exists:
  - Connector Hub
  - Jira SD MCP
  - Missing config
  - Test Read Gate
  - Writes approval-gated
- Remaining UI caveat: visually scroll Settings and click one `Test Read Gate` button to confirm the lower Connector Hub card layout and notice behavior in the browser.

Newest roadmap decisions to preserve:

- Oracle AI can improve ODT in multiple places:
  - ODT Guide answers and handbook training
  - requirement analysis and clarification prompts
  - specialist Agent Foundry reviews
  - retrieval/rerank over ODT evidence and internal knowledge
  - uploaded PDF/Excel/image/mockup understanding
  - worker prompt grounding
  - review summary and PR-readiness packaging
- Provider behavior must stay safe:
  - no provider configured -> local deterministic answer only
  - provider configured -> model receives retrieved ODT context plus user question
  - always log selected provider, model label, fallback status, latency, token/usage metadata where available
  - never expose provider secrets in frontend, prompts, screenshots, docs, or `/api/settings`
- Internal MCP/tool connector direction:
  - Jira SD MCP for intake tickets
  - Bitbucket/SCM MCP for repo, branch, PR, diff, and comments
  - Build Service MCP for build/log/artifact evidence
  - DevOps MCP for service, alarm, runbook, and operational context
  - memory-service for durable task/team context
  - SKS and Ask Oracle Knowledge for standards and internal documentation
  - all writes remain approval-gated; read-only import is the default
- Future DB awareness is required:
  - detect `database.yml`, `.env.example`, Prisma, Sequelize, Knex, Rails, Spring, and similar config files
  - metadata/schema-only introspection after approval
  - credentials stay backend-only and masked
  - business-data queries, exports, DDL, migrations, and mutations require separate DB safety approval
- Future enterprise identity is required:
  - use SSO/OIDC/SAML or approved enterprise identity provider
  - ODT does not store passwords
  - ODT stores safe user metadata, roles, groups, and audit events
  - approvals, blocker overrides, adapter config, worker launch, dependency approval, DB introspection, and sensitive asset viewing must be role-aware
- Policy customization should be a first-class future capability:
  - teams can customize standards, dependency policy, approval gates, worker lanes, provider adapters, testing expectations, and PR-readiness criteria
  - hard safety controls remain protected by explicit policy ownership and audit

Immediate next actions from this refreshed checkpoint:

1. Finish visual validation of the Settings Connector Hub by scrolling the Settings page and testing one read gate.
2. Update ODT Guide/Handbook with connector behavior if the UI text needs sharper training language.
3. Move into Stage B: retrieval-source evidence, stronger guide/RAG ranking, and active-requirement-specific answers.
4. When real OCI endpoint/model/auth are provided, test `GENAI_PROVIDER=oci` and confirm local fallback still works.
5. Keep this checkpoint refreshed hourly via automation and manually before risky work or context migration.

Latest implemented / in-progress changes:

- ODT Guide is now a handbook/evidence-aware assistant with casual chatbot responses and local RAG fallback.
- Backend GenAI provider foundation has started:
  - `GENAI_PROVIDER=local|oci|openai|ollama`
  - local deterministic fallback remains default
  - OCI/OpenAI-compatible/Ollama adapters are backend-owned
  - frontend exposes only safe provider readiness, model label, fallback status, and no secrets
  - usage logging records provider, model, latency, tokens, and fallback
- OCI setup aliases were added:
  - `OCI_GENAI_REGION`
  - `OCI_GENAI_BASE_URL`
  - `OCI_GENAI_API_KEY`
  - existing explicit aliases such as `OCI_GENAI_OPENAI_BASE_URL` and `OCI_GENAI_BEARER_TOKEN` still work
- ODT Guide now answers Oracle AI/MCP questions with a specific map for:
  - OCI GenAI Chat Completions
  - OCI Responses / Conversations / Files / Vector Stores / Containers
  - embeddings and rerank
  - Document Understanding
  - Vision
  - Speech / text-to-speech
  - API Gateway, Functions/OKE, Object Storage, DB audit store
  - Jira SD, Bitbucket, SCM, Build Service, DevOps, memory-service, SKS, Ask Oracle
- Internal and public source links were captured in:
  - `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Platform-Handbook.md`
  - `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Oracle-AI-Services-Setup-Reference.md`
- A separate detailed OCI/AI setup reference was created:
  - `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/docs/ODT-Oracle-AI-Services-Setup-Reference.md`
- README now documents:
  - provider configuration
  - OCI/OpenAI/Ollama examples
  - internal connector expansion path
  - suggested internal setup reading order
- Large roadmap and frozen plan now include staged Oracle AI/GenAI roadmap:
  - Stage A: provider foundation
  - Stage B: embeddings/rerank enterprise RAG
  - Stage C: OCI-enhanced specialist reviews
  - Stage D: asset intelligence
  - Stage E: managed agentic adapter
  - Stage F: enterprise identity, policy, connectors, DB awareness
- Intake page was redesigned from cramped two-column cards into a vertical numbered intake journey:
  - Project workspace
  - Work request
  - Context files
  - Repository signals
  - Extracted structure
  - Clarification prompts
- Connector Hub work is mostly implemented and backend/API validated:
  - backend connector readiness metadata has been improved
  - Settings UI has been upgraded from a plain table to connector cards with readiness and a safe Test Read Gate action
  - API smoke confirmed safe blocked behavior when connector config is missing
  - browser DOM check confirmed Connector Hub content is present
  - still needs final visual scroll/click verification in Settings before calling it fully complete
- An hourly automation was created:
  - automation id: `hourly-odt-2-0-context-backup`
  - purpose: refresh ODT 2.0 continuity backup hourly
  - workspace: `/Users/vn105957/Desktop/odt-submission/odt-workbench-next`

Current active app URLs:

```text
Frontend: http://127.0.0.1:5189
Backend:  http://127.0.0.1:5190
```

Current backend screen/session pattern:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run api
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run dev
```

Latest validation before this update:

```bash
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH node --check server/index.js
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run build
```

Both passed after the latest Intake, OCI reference, provider, guide, and Connector Hub edits. API smoke for `/api/settings` and `/api/connectors/query` also passed. Final browser visual validation of the lower Settings Connector Hub remains the main unfinished check.

Immediate next implementation steps:

1. Browser-scroll Settings and visually verify the Connector Hub layout.
2. Click one `Test Read Gate` button and confirm the notice/blocked state is clear.
3. Add connector readiness/test-read behavior to the handbook if needed.
4. Move next into Stage B groundwork: retrieval-source evidence and stronger Guide/RAG ranking.
5. When the user provides real OCI endpoint/model/auth, test live `GENAI_PROVIDER=oci` with local fallback preserved.

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

Current product progress as of 2026-06-05:

- Demo-grade ODT 2.0: approximately 76-78/100.
- Oracle-internal production-grade ODT: approximately 45-50/100.

Historical progress at checkpoint creation on 2026-06-04 was approximately 40/100.

Reason:

- The governed workbench shell exists.
- Standards and evidence backbone exists.
- Agent Foundry advisory reviews exist.
- Codex worker launch path exists.
- Worker lane model is being added.
- Durable worker queue and output ingestion are now partially implemented.
- ODT Guide, local RAG, provider abstraction, Oracle AI roadmap, internal connector catalog, and Intake UX have materially improved.
- The full orchestration brain, enterprise RAG, live OCI provider validation, production auth/roles, real MCP transport, and policy admin UI are still incomplete.

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
