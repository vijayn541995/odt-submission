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

## Developer Workflow Direction

The governance architecture is captured in [docs/ODT-Governance-Architecture.md](docs/ODT-Governance-Architecture.md).

The canonical Oracle standards and agent operating guide is [docs/ODT-Oracle-Standards-Agent-Operating-Guide.md](docs/ODT-Oracle-Standards-Agent-Operating-Guide.md).

The full developer-agent workflow is captured in [docs/ODT-Developer-Agent-Handoff-Plan.md](docs/ODT-Developer-Agent-Handoff-Plan.md).

Accessibility, VPAT, WCAG 2.2, Section 508, and Redwood-like UX expectations are captured in [docs/ODT-Agent-Accessibility-VPAT-WCAG-Redwood-Guide.md](docs/ODT-Agent-Accessibility-VPAT-WCAG-Redwood-Guide.md).
