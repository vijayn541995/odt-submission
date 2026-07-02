# ODT Workbench Next

Fresh implementation of Oracle Developer Twin Workbench as a governed AI-assisted developer workbench.

ODT Workbench helps developers move from requirement/Jira/repo input to PR-ready implementation while enforcing Oracle-style UX, accessibility, security, compliance, 3PL, testing, and code-quality standards.

## Run

Use Node 24+:

```bash
source "$HOME/.nvm/nvm.sh"
nvm use
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
npm run api
npm run dev
```

Local URLs:

- React app: `http://127.0.0.1:5189`
- Backend API: `http://127.0.0.1:5190`
- OpenAPI: `http://127.0.0.1:5190/openapi.json`

## UI Smoke Test

With the API and React app running, use the Playwright smoke test to validate the completed-Jira verification workflow:

```bash
cd /Users/vn105957/Desktop/odt-submission/odt-workbench-next
PATH=/Users/vn105957/.nvm/versions/node/v24.15.0/bin:$PATH npm run test:ui:smoke
```

The smoke test checks Planner, Standards, and Agent Team for `JOURNEY-25366` verification behavior:

- historical Assessment Preview artifacts are hidden from the current Planner and Agent Team surfaces
- Planner shows a verification plan instead of a stale implementation plan
- Standards shows the completed-Jira verification contract
- Agent Team keeps implementation lanes gated and points to Reviewer first

Screenshots are written to `output/playwright/`, which is intentionally ignored by git.

You can also run the same self-check from the Monitoring page with **Run UI Smoke**. The backend records the result under validation run evidence and displays the latest status, screenshot paths, and any failure output in ODT Validation.

## Design Boundaries

- React never calls OCI GenAI, MCP, or secrets directly.
- Backend owns provider routing, prompts, settings, monitoring, limits, fallback, and approvals.
- SQLite is local v1 persistence.
- OCI GenAI, OCI GenAI Agent, Oracle DB 23ai/26ai, RAG, and MCP are extension points.
- Standards checks and evidence storage are mandatory for non-trivial workflows.
- Theme, wording, and non-critical standards thresholds can be overridden with documented approval notes.
- Frontend secrets, destructive actions, and unapproved dependency installs remain hard blockers.

## Governance Backbone

The current MVP includes a backend Standards & Governance Layer:

- Standards registry from Markdown/JSON assets.
- Pre-implementation and pre-PR standards checks.
- Findings classified as `PASS`, `WARNING`, `BLOCKER`, `NEEDS_REVIEW`, or `APPROVAL_REQUIRED`.
- Evidence tables for standards checks, findings, approvals, dependency requests, test plans, and PR readiness reports.
- A Standards Command Center UI for review, controlled overrides, and PR Readiness Packs.

## Agent Foundry

Agent Foundry is the governed specialist review surface inside Agent Team. It turns the generated agent idea into native ODT evidence without adding AutoGPT or AutoGen to core.

- Full SDLC mode runs 10 specialist domains: Requirements, UX, Product, Architecture, Development, Code Review, Compliance, CI/CD, QA, and Operations.
- Focused mode runs one selected specialist domain.
- Outputs are saved as evidence with summary, findings, risks, recommendations, missing information, standards impact, required approvals, and next actions.
- Every output is marked as an AI-generated suggestion and requires human review before write/delegate decisions.
- Dependency installs still require package-specific approval.

Agent Foundry endpoints:

- `GET /api/agent-foundry/domains`
- `POST /api/agent-foundry/run`
- `GET /api/agent-foundry/runs/:assignmentId`

## Intake Workspace

The Intake page now starts from a real developer setup:

- A target repository or folder path can be provided and analyzed in read-only mode.
- A base branch and frontend/backend/full-stack/docs scope can be recorded.
- Context files can be attached: screenshots, mockups, PDF, DOCX, XLSX/XLS/CSV, JSON/YAML, Markdown, text, SVG, images, and PPTX.
- Upload limits are shown in the UI and enforced by the backend.
- Uploaded files are copied into `/Users/vn105957/Desktop/odt-submission/odt-workbench-next/workspaces/<assignment>/intake-assets`.
- ODT never copies uploaded files into the target repository automatically.

This preserves the rule that repo analysis is safe/read-only until explicit write approval is captured.

## Local Knowledge Assist

ODT Guide uses a lightweight local evidence corpus for Q&A in the MVP. It retrieves from:

- ODT plan and standards documents.
- Standards registry JSON.
- Requirement, repo, standards, approval, dependency, test, and PR readiness evidence.
- Intake asset metadata and text-like attachment excerpts.

This is not the future enterprise RAG layer. Oracle DB 23ai/26ai vector search remains the enterprise extension point, while the local corpus gives practical, grounded answers during local development.

## GenAI Provider Configuration

ODT keeps provider selection backend-owned. The frontend only receives safe status such as provider name, model label, readiness, and fallback usage.

Default local deterministic mode:

```bash
export GENAI_PROVIDER=local
```

OCI GenAI through an OpenAI-compatible backend endpoint:

```bash
export GENAI_PROVIDER=oci
# ODT appends /chat/completions only when needed.
export OCI_GENAI_OPENAI_BASE_URL="https://inference.generativeai.<region>.oci.oraclecloud.com/openai/v1"
# or:
# export OCI_GENAI_OPENAI_BASE_URL="https://inference.generativeai.<region>.oci.oraclecloud.com/20231130/actions/v1"
export OCI_GENAI_BEARER_TOKEN="<server-side-token>"
export OCI_COMPARTMENT_OCID="<compartment-ocid>"
export GENAI_MODEL="<model-name-or-ocid>"
export OCI_GENAI_OPENAI_COMPATIBLE=true
```

OpenAI-compatible provider:

```bash
export GENAI_PROVIDER=openai
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_API_KEY="<server-side-api-key>"
export GENAI_MODEL="gpt-4o-mini"
```

Ollama local model:

```bash
export GENAI_PROVIDER=ollama
export OLLAMA_BASE_URL="http://localhost:11434"
export GENAI_MODEL="llama3.1"
```

All modes follow the same request flow: retrieve ODT handbook/evidence context, call the configured provider if ready, fall back to local deterministic RAG if unavailable, and log provider/model/tokens/latency/fallback evidence.

Useful OCI service expansion path:

- OCI Generative AI Chat Completions for ODT Guide and specialist reviews.
- OCI Generative AI Responses, conversations, files, vector stores, and containers for future managed agentic workflows.
- OCI embeddings and rerank for enterprise RAG over ODT standards, evidence, Jira, Confluence, repo history, and PR packs.
- OCI Vision or document/image analysis services for screenshot, mockup, diagram, and document enrichment.
- OCI Speech and text-to-speech options for future voice intake and accessibility.

Internal connector expansion path:

- Jira SD MCP for intake and issue/request context.
- Bitbucket and SCM MCP for repo/branch/PR/diff analysis, approved comments, and approved PR actions.
- Build Service MCP for validation logs, artifacts, and approved build triggers.
- DevOps MCP for runbooks, operational context, alarms, logs, regions, and release/security context.
- memory-service for persistent project memory, cross-agent relay, and evidence context.
- SKS and Ask Oracle Knowledge Collections for internal standards, architecture, SDLC, and knowledge retrieval.

Internal references provided by the product owner:

- MCP servers available with Codex: `https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20650909983`
- Ask Oracle Knowledge Collections: `https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=17328629254`

Suggested internal setup reading order:

1. `https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20059334493` - MCP servers available with Codex.
2. `https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20059110863` - Codex OCI Dev Platform Gateway MCP.
3. `https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20123320016` - MCP Gateway Setup SOP for Mac/Codex/Oracle MCP.
4. `https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=6125311809` - OCI Document Understanding setup.
5. `https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=6088317392` - OCI Vision setup.
6. `https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=6086874487` - OCI Speech setup.
7. `https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20203043271` - Enterprise AI Agents getting started.
8. `https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20095744696` - Agent Lifecycle Configuration.

Detailed OCI/AI setup notes are preserved in [docs/ODT-Oracle-AI-Services-Setup-Reference.md](docs/ODT-Oracle-AI-Services-Setup-Reference.md).

## Developer Workflow Direction

The governance architecture is captured in [docs/ODT-Governance-Architecture.md](docs/ODT-Governance-Architecture.md).

The canonical Oracle standards and agent operating guide is [docs/ODT-Oracle-Standards-Agent-Operating-Guide.md](docs/ODT-Oracle-Standards-Agent-Operating-Guide.md).

The full developer-agent workflow is captured in [docs/ODT-Developer-Agent-Handoff-Plan.md](docs/ODT-Developer-Agent-Handoff-Plan.md).

Accessibility, VPAT, WCAG 2.2, Section 508, and Redwood-like UX expectations are captured in [docs/ODT-Agent-Accessibility-VPAT-WCAG-Redwood-Guide.md](docs/ODT-Agent-Accessibility-VPAT-WCAG-Redwood-Guide.md).
