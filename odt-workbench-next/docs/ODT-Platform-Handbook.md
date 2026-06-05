# ODT Platform Handbook

ODT Workbench is a governed AI-assisted SDLC control plane. It helps a developer move from requirement, Jira, repo, and context files to a PR-ready implementation package while keeping standards, approvals, agent work, evidence, and review decisions auditable.

## Core Idea

ODT does not jump straight to coding. The platform guides work through intake, repo analysis, planning, standards review, human approval, agent delegation, implementation evidence, review, verification, and PR readiness.

The developer remains in control. ODT can recommend, draft, launch governed workers, ingest evidence, and prepare PR material, but write actions, dependency installs, external updates, and risky overrides require human approval.

ODT stands out from a normal AI code assistant because it adds enterprise governance and traceability on top of modern AI development workflows. It does not only answer or edit code; it records why a plan was approved, which standards were checked, who approved risky actions, which files/assets were used, what workers did, what tests ran, and what evidence supports PR readiness.

ODT is also meant to be configurable from team to team. Standards, dependency policy, accessibility expectations, security rules, approval gates, worker lanes, model/provider adapters, and PR-readiness requirements should be policy-driven rather than hardcoded. A product team, platform team, compliance-heavy team, or local demo can run with different policy strictness while preserving the same evidence model.

## Why ODT Stands Out

Modern AI developer tools are strong at repo-aware chat, code generation, terminal delegation, and plan-first assistance. ODT adopts those strengths, then adds:

- governed SDLC stages from requirement to PR readiness
- Oracle-style standards review for UX, accessibility, security, testing, dependency, maintainability, and PR quality
- human approval gates before write actions, dependency installs, external writes, or risky overrides
- durable evidence for requirements, repo analysis, assets, designs, plans, standards checks, worker runs, logs, tests, review comments, relay items, and PR packs
- configurable policies so different teams can tune standards without rewriting the app
- adapter-ready execution for Codex, Cline/manual, OCI GenAI/OCA, OpenAI, Ollama, MCP, and future providers

In short: AI tools help produce work; ODT helps govern, prove, and safely operationalize that work.

## Main SDLC Flow

1. Open Intake.
2. Select or enter the target repo/folder.
3. Add requirement, Jira details, acceptance criteria, API samples, screenshots, mockups, PDFs, DOCX, XLSX, CSV, JSON, YAML, Markdown, or text context.
4. Let ODT copy and analyze context assets into the workbench workspace.
5. Run requirement extraction and repo analysis.
6. Review gaps and clarification questions.
7. Draft technical design and implementation plan.
8. Run the Standards gate.
9. Resolve blockers, approve warnings, or explicitly accept risk where allowed.
10. Approve write scope.
11. Open Agent Team and launch or prepare a governed worker.
12. Ingest worker output.
13. Record implementation evidence from worker output.
14. Run reviewer and build-verifier lanes when needed.
15. Generate PR Ready package.
16. Review/copy PR markdown and evidence before raising a PR outside ODT.

## Navigation Pages

### Overview

Shows current assignment status, workflow progress, standards health, next best action, active work, and PR readiness signals.

Use Overview when you want to know where the work currently stands.

### Intake

Captures requirement/Jira text, target repo or folder, base branch, and uploaded context files. Folder selection in the browser is read-only and may not expose the absolute path; a pasted absolute path is needed for backend path-level scanning and Codex worker launch.

Context assets are copied into the ODT workspace, classified, checksummed, and analyzed. Text-like files such as Markdown, text, JSON, YAML, and CSV receive local excerpts. Binary or packaged files such as PDFs, DOCX, XLSX, PPTX, and images are stored with metadata and optional AI/parser enrichment status.

Use Intake when starting a new task or adding missing requirement/repo context.

### Planner

Shows technical design, implementation plan, impacted files, open questions, standards checklist, and approval gate context.

Use Planner before approving write work.

### Standards

Runs and reviews governance checks for accessibility, WCAG/VPAT/Section 508, Redwood-like UX, security, dependency policy, testing, maintainability, performance, and PR readiness.

Use Standards to resolve warnings/blockers or approve controlled exceptions before delegation.

### Agent Team

Selects execution engine and worker lane. Codex is wired for terminal launch. Cline/manual can receive governed handoff packages. Future adapters can support OCI GenAI, OCA, OpenAI API, Ollama, and other model providers.

Use Agent Team to launch Lead Planner, Senior Full Stack Dev, Backend Dev, Frontend Dev, Reviewer, or Build Verifier lanes. Worker output, logs, relay questions, and evidence chips are shown here.

Uploaded context assets are included in worker handoff with file path, checksum, role, usage guidance, local extraction status, optional enrichment status, and any local excerpt. Workers should use these assets as requirement evidence, not copy them into the target repo unless the approved scope explicitly requires it.

### Review

Captures human review comments, blocker decisions, accepted risk, rework routing, implementation evidence, and review-cycle closeout.

Use Review when something must be resolved, accepted as risk, or sent back to an agent for rework.

### PR Ready

Generates and displays the PR readiness package: summary, changed files, tests, accessibility notes, security notes, dependency notes, risks, rollback plan, reviewer notes, blockers, and checklist.

Use PR Ready after implementation evidence, reviewer pass, and build verification are complete.

### Artifacts

Shows saved evidence: design, implementation blueprint, OpenAPI contract, run evidence, review log, worker relay queue, Agent Foundry reviews, context vault, and PR readiness pack.

Use Artifacts to inspect what ODT can prove happened.

### ODT Guide

Acts as the platform handbook and evidence-aware assistant. It explains how to use ODT, what pages/buttons do, SDLC steps, governance rules, current status, blockers, agent work, testing, and PR readiness.

Use ODT Guide whenever you are unsure where to click or why a workflow is gated.

ODT Guide should feel like a normal helpful chatbot for simple questions such as greetings, today's date, or "how can you help?" For task questions, it should switch into governed workbench mode and answer from handbook, standards, assignment evidence, repo analysis, uploaded assets, worker runs, review comments, and PR readiness evidence.

The preferred architecture is local RAG plus optional GenAI:

- Local RAG is the grounding and fallback path.
- OCI GenAI, OCA, OpenAI, Ollama, or another approved provider can be used through backend provider adapters.
- Retrieved ODT context should be sent to the model only from the backend.
- Provider secrets must stay backend-side.
- Responses should be logged for provider, model, latency, token usage, and fallback visibility.
- If the model/provider is unavailable, ODT Guide should still answer from local handbook/evidence.

Current provider behavior:

- `GENAI_PROVIDER=local` uses deterministic local handbook/evidence answers.
- `GENAI_PROVIDER=oci` routes Guide chat through OCI GenAI when endpoint, model, and backend auth are configured.
- `GENAI_PROVIDER=openai` routes through an OpenAI-compatible endpoint.
- `GENAI_PROVIDER=ollama` routes through a local Ollama model.
- Any provider failure falls back to local RAG and records fallback evidence in Runs/Monitoring.

Oracle AI services that can strengthen ODT:

- OCI Generative AI Chat Completions: richer ODT Guide answers, design reviews, specialist domain output, and review summaries.
- OCI Generative AI Responses / Conversations / Files / Vector Stores / Containers: future managed agentic adapter for richer tool use, memory, and file-backed workflows.
- OCI Generative AI embeddings and rerank: enterprise RAG for handbook, standards, repo, Jira, Confluence, evidence, and PR history.
- OCI Document Understanding: extraction for PDFs, scanned documents, tables, forms, and document-heavy intake before GenAI reasoning.
- OCI Vision or document/image analysis services: optional enrichment for screenshots, UI mockups, diagrams, OCR-like extraction, and image/PDF-like context.
- OCI Speech: future voice input for hands-free workbench operation or meeting-note intake.
- OCI text-to-speech options: future voice output for accessibility or guided walkthroughs.
- OCI API Gateway plus Functions/OKE: future governed deployment boundary for ODT backend APIs, auth, rate limits, CORS, custom domains, and service routing.
- OCI Object Storage plus DB audit store: future durable storage for raw artifacts, run metadata, approvals, prompts, model outputs, logs, and PR packages.

Best-fit page map for Oracle AI services:

- Intake: OCI GenAI Responses/Files/Vector Stores, Document Understanding, Vision, Speech, Jira SD, Bitbucket/SCM read context.
- Planner: OCI GenAI Responses or GenAI Agents for design, implementation plan, impacted files, validation plan, risks, and assumptions.
- Standards: GenAI agent with RAG, ODT rule engine, standards registry, SKS/Confluence knowledge, and human approval gates.
- Agent Team: Codex/Cline/manual workers, MCP gateway, and future OCI GenAI tool calling; write tools only after approval.
- Review: GenAI review agent plus Bitbucket/SCM/Jira/Build evidence for comments, rework, risk closure, and verification.
- PR Ready: GenAI Responses or provider client for PR title, summary, test evidence, risk notes, rollback, reviewers, and compliance summary.
- Artifacts/Runs: Object Storage, DB/JSON audit store, and memory-service for durable traceability.

ODT rule:

AI can enrich analysis, drafting, summarization, search, and coaching. ODT remains the authority for workflow state, standards gates, approvals, evidence, write scope, dependency decisions, and PR readiness.

Internal agentic/MCP building blocks that can strengthen ODT:

- Jira SD MCP: Intake, requirement capture, issue details, SLA, attachments, and review context.
- Bitbucket MCP: repository browsing, branch/PR context, diffs, comments, PR creation, and merge/decline only when approved.
- SCM MCP: local git or SCM actions for repo analysis, file/branch context, implementation support, and PR comments.
- Build Service MCP: build status, logs, artifacts, and approved build triggers for verification evidence.
- DevOps MCP: alarms, logs, runbooks, service metadata, regions, release/security context, and operational review.
- memory-service: persistent project memory, handoff context, namespaces, ACLs, and cross-agent relay.
- SKS Knowledge MCP: internal standards, architecture, SDLC, and knowledge retrieval.
- Ask Oracle Knowledge Collections: internal knowledge lookup for clarify/design/guide flows.

Suggested ODT phase mapping:

- Intake: Jira SD, Ask Oracle, SKS, Bitbucket/SCM read context.
- Analyze: Bitbucket/SCM read tools, SKS, repo summaries, uploaded assets.
- Clarify: Ask Oracle/SKS retrieval plus memory-service persisted context.
- Design/Plan: ODT Guide and Agent Foundry using retrieved evidence and configured model provider.
- Govern: standards registry, SKS/internal standards, DevOps/runbook/security context.
- Approve: human approval remains outside automated write tools.
- Delegate: Codex/Cline/OCI-managed agents with governed MCP access only after approval.
- Ingest/Review: Bitbucket/SCM PR/diff/build outputs, Build Service logs/status, memory/evidence capture.

Internal source references provided by the product owner:

- MCP servers available with Codex: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20650909983
- Ask Oracle Knowledge Collections: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=17328629254

Internal setup references provided by the product owner:

- OCI Document Understanding: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=6125311809
- OCI Document Understanding extraction/key-value guide: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=9841210181
- OCI Vision Service: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=6088317392
- Vision plus GenAI example: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=18713010204
- OCI Speech Service: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=6086874487
- OCI Audio To Text Batch App setup/runbook: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20316524484
- Enterprise AI Agents getting started: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20203043271
- Agent Lifecycle Configuration: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20095744696
- Vector Store workload identity policies: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=19346719734
- MCP servers available with Codex: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20059334493
- MCP Gateway Setup: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20275172276
- MCP Gateway Setup SOP for Mac/Codex/Oracle MCP: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20123320016
- Codex OCI Dev Platform Gateway MCP: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20059110863
- MCP access/network constraints: https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20616154173

Suggested internal reading order:

1. MCP servers available with Codex.
2. Codex OCI Dev Platform Gateway MCP.
3. MCP Gateway Setup SOP.
4. OCI Document Understanding, Vision, and Speech setup pages.
5. Enterprise AI Agents getting started and Agent Lifecycle Configuration.
6. Vector Store workload identity policies.

Public Oracle reference links provided by the product owner:

- OCI Generative AI overview: https://docs.oracle.com/en-us/iaas/Content/generative-ai/overview.htm
- OCI OpenAI-compatible endpoints: https://docs.oracle.com/en-us/iaas/Content/generative-ai/openai-compatible-api.htm
- OCI Generative AI Agents: https://docs.oracle.com/en-us/iaas/Content/generative-ai-agents/overview.htm
- OCI Document Understanding: https://docs.oracle.com/en-us/iaas/Content/document-understanding/using/home.htm
- OCI Vision: https://docs.oracle.com/en-us/iaas/Content/vision/using/overview.htm
- OCI Speech: https://docs.oracle.com/iaas/Content/speech/using/speech.htm
- OCI API Gateway: https://docs.oracle.com/en-us/iaas/Content/APIGateway/home.htm

Detailed ODT setup reference:

- ODT Oracle AI Services Setup Reference: docs/ODT-Oracle-AI-Services-Setup-Reference.md

### Runs

Shows execution history, event timeline, provider/model usage, latency, token counts, and run status.

Use Runs to audit what happened.

### Monitoring

Shows AI usage metrics and provider health.

Use Monitoring to check AI request volume, latency, tokens, and errors.

### Settings

Shows local configuration, provider status, feature flags, and safe runtime settings. Secrets should stay backend-side and should not be exposed in frontend settings.

Use Settings to confirm environment and provider behavior.

## Important Buttons And Actions

### New Intake

Starts or opens the Intake workflow for requirement and repo context.

### Analyze Repo Read-only

Scans the selected repo or folder for framework, package manager, scripts, test tools, folders, and likely impacted areas without writing to the repo.

### Copy to ODT Workspace

Copies selected context files into ODT workspace storage and creates asset evidence. The target repository is not modified.

ODT records:
- file type
- context role
- size
- SHA-256 checksum
- local extraction status
- optional AI/parser enrichment status
- storage path for governed worker handoff

Text-like files get a local excerpt immediately. PDFs, DOCX, XLSX, PPTX, and images can be enriched later by an approved document parser, vision model, OCR model, OCI GenAI adapter, OpenAI adapter, Ollama/local model, or manual review path. If the provider is unavailable, ODT falls back to stored metadata and manual review.

### Check Enrichment

Checks whether an uploaded asset already has local extraction or whether optional AI/parser enrichment is recommended.

This action is fail-soft. If no model or parser is connected, ODT does not block the task. It reports that the asset is stored and available through metadata, file path, local excerpt when available, and manual review.

### Extract Structure

Turns unstructured requirement/Jira text into structured requirement evidence, gaps, assumptions, and clarification questions.

### Draft Design

Creates technical design evidence based on requirement and repo context.

### Draft Plan

Creates implementation plan evidence, including tasks, impacted files, validation, security, accessibility, testing, risks, and approval needs.

### Run Standards Check

Runs governance checks against the current plan/design or implementation evidence.

### Approve With Warnings

Allows work to proceed despite non-critical warnings. This creates human approval evidence. It should not bypass hard safety blockers such as secrets, destructive actions, or unapproved dependency installs.

### Block Implementation

Records a human decision that implementation should not continue until issues are addressed.

### Unlock Write Delegation

Takes the user to the standards approval path when the selected worker needs write permission.

### Launch Worker

Creates a governed worker bundle and launches a visible Codex terminal session for the selected worker lane when the Codex adapter is healthy and the workflow allows that lane.

### Prepare Handoff Only

Creates a governed handoff package without launching a terminal worker. Use this for Cline/manual workflows or when launch is not supported.

### Ingest Output

Reads a worker response file and stores parsed output, reviewer findings, and relay questions as ODT evidence.

### Record Evidence From Worker

Converts worker output into implementation evidence: changed files, commands, test outcomes, summary, and post-implementation standards review.

### Stop Worker

Requests termination for an active worker. ODT writes a stop request and attempts to send SIGINT to the Codex process when a process id is available.

### Send Rework

Routes a review finding to a rework relay item so the next worker receives the issue in its prompt.

### Resolve

Marks a review comment resolved. This can unblock later workflow states.

### Accept Risk

Allows a human to continue with documented risk. Use only when the risk is understood and acceptable.

### Generate PR Pack

Creates the PR readiness report from all available evidence.

### Copy PR Markdown

Copies the generated PR-ready markdown for human review or external PR creation.

## Worker Lanes

### Lead Planner

Read-only planning lane. Clarifies scope, gaps, risks, worker sequencing, and coordination questions.

### Senior Full Stack Dev

Write-approved implementation lane. Best default for multi-area product work that spans UI, API integration, state, utilities, tests, and architecture.

### Backend Dev

Write-approved lane for APIs, data flow, utilities, service integration, payloads, validation, and backend-facing tests.

### Frontend Dev

Write-approved lane for UI behavior, component state, accessibility, validation, and frontend tests.

### Reviewer

Read-only lane that reviews requirement, plan, diffs/evidence, risks, tests, accessibility, and security. Reviewer findings can create rework items.

### Build Verifier

Write-approved test lane. Runs approved build/test commands and reports outcomes without implementing feature changes.

## Governance Rules

- Read-only is the default.
- Write actions require explicit approval.
- Dependency installs require a separate dependency approval path.
- Destructive actions are blocked.
- Frontend secrets are blocked.
- External system writes require approval.
- Standards evidence is required before non-trivial write work.
- PR readiness should include accessibility, security, testing, dependency, risk, rollback, and reviewer notes.

## Customizing Governance And Rules

ODT governance should be configurable by team, product area, and risk profile. A local demo, internal tool, production service, and compliance-heavy product may use different strictness while preserving the same evidence model.

Current local MVP customization path:

1. Edit `server/standards/odt-standards.json`.
2. Update related source Markdown documents when policy guidance changes.
3. Bump or document the standards version when the meaning of the policy changes.
4. Restart/reload ODT if needed.
5. Rerun Standards Check on the assignment.
6. Review the new findings before approving write/delegate actions.

Teams can customize:

- accessibility required topics and VPAT/WCAG/Section 508 expectations
- dependency license preferences and package approval rules
- security checks
- testing expectations
- UX guidance
- override policy
- approval gates
- worker lanes
- model/provider adapter policy
- PR-readiness checklist

Hard safety rules should stay protected unless an authorized policy owner changes the policy itself:

- no frontend secrets
- no destructive actions
- no dependency installs without package-specific approval
- no write actions without approval
- no external writes without approval

Future production ODT should provide a Policy Admin UI. Authorized admins should be able to edit rules, validate policy config, preview impact, publish a new policy version, and create an audit event. Enterprise ODT should not depend on random code edits for governance changes.

## Common Questions

### Where do I start?

Start in Intake. Add the requirement/Jira details, select or enter repo/folder context, attach useful artifacts, then run extraction and repo analysis.

### Why is Delegate disabled?

Delegation can be disabled because standards have not run, write approval is missing, review blockers are open, dependency approval is pending, the selected worker requires write approval, or the adapter is unhealthy.

### Why is Preview or PR Ready blocked?

Preview/PR readiness can be blocked by incomplete implementation evidence, failed tests, open review blockers, unresolved standards blockers, pending dependency decisions, or missing reviewer/build-verifier closeout.

### What happens when I launch Codex?

ODT creates a worker bundle with a handoff JSON, prompt, launch script, response file, log file, status file, and stop request file. A visible Terminal session runs Codex against the approved repo and mode. The worker must return evidence to ODT.

### Can ODT work with Cline, OCI GenAI, OCA, OpenAI API, Ollama, Jira, GitHub, or MCP?

The architecture is adapter-ready. Codex terminal launch is wired in the current local slice. Cline/manual handoff is supported. OCI GenAI/OCA, OpenAI API, Ollama, Jira/GitHub MCP, knowledge MCP, and database-aware adapters are roadmap items behind governance gates.

### Should ODT have login, roles, and access control?

For the local MVP, ODT can use local user mode and record the OS/user label on approvals and events. For enterprise ODT, yes: use SSO/OIDC/SAML or an approved identity provider. ODT should not store user passwords. Authentication belongs to the identity provider; ODT stores safe user metadata, roles, and audit events.

Authorization should be policy-driven. Different roles may be allowed to approve write scope, override blockers, approve dependencies, launch workers, view sensitive context assets, configure adapters, run DB introspection, or prepare PR packs.

### Does ODT modify uploaded files or target repos automatically?

No. Intake uploads are copied into ODT workspace storage. Target repositories remain read-only until write-approved agent execution.

### What happens if AI image/PDF/Excel analysis is unavailable?

ODT still stores the file, classifies it, records checksum evidence, shows it in Context Vault, and includes it in worker handoff. Optional AI/parser enrichment is useful, but not required for the workflow to continue.

### What does ODT prove?

ODT stores requirement analysis, repo analysis, plans, standards checks, findings, approvals, dependency decisions, worker runs, logs, implementation evidence, tests, review comments, rework relay, and PR readiness reports.
