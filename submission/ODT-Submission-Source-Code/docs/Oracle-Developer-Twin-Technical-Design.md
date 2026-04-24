# Oracle Developer Twin Technical Design

## Purpose

Oracle Developer Twin (ODT) is a governed Digital Worker for software delivery. Its purpose is to convert one work item into a reviewable delivery path before code is accepted.

The design goal is not raw code generation. The design goal is:

- requirement hardening
- repo-aware impact analysis
- prompt governance
- test and accessibility guidance
- controlled execution handoff
- mandatory human approval

## Technology Stack

### Core Runtime

- Node.js
- npm
- Python 3 for local static serving during demos

### ODT Orchestration Layer

- `packages/accessibility-ai-shield`
- CLI entrypoint: `packages/accessibility-ai-shield/bin/a11y-shield.js`

Responsibilities:

- intake and prompt hardening
- impact analysis
- seven-stage prompt generation
- technical design and workpack creation
- accessibility guidance generation
- dashboard rendering
- execution handoff preparation

### Local Control Plane

- `packages/delivery-copilot`

Responsibilities:

- local HTTP context server
- repo and workspace context exposure
- execution state visibility
- agent launch support

### Demo Target Application

- React 18
- Vite
- Plain CSS

Demo target path:

- `demo-target-repo`

### Optional GenAI Integration

- OCI CLI
- OCI Generative AI Inference

Used for:

- optional stage-prompt generation through the `oci` prompt provider

### OCA / Agent Execution Path

ODT supports a governed execution handoff to coding agents such as:

- Codex
- Cline

ODT prepares the reviewed execution bundle. The agent performs the repo change. Human review remains mandatory after the agent returns output.

## Runtime Architecture

### 1. Intake and Planning

Primary source files:

- `packages/accessibility-ai-shield/src/commands/odt.js`
- `packages/accessibility-ai-shield/src/commands/dev-twin.js`
- `packages/accessibility-ai-shield/src/dev-twin/impact.js`

Responsibilities:

- collect work item inputs
- normalize and harden the request
- infer impacted files
- generate design, code, test, compliance, and verify artifacts

### 2. Dashboard Experience

Primary source files:

- `packages/accessibility-ai-shield/src/odt/fedit.js`
- `packages/accessibility-ai-shield/src/odt/dashboard.js`

Responsibilities:

- render ODT Workspace
- show review and execution state
- expose reviewer edits and stage overrides
- keep the human in the loop

### 3. Local Context Server

Primary source files:

- `packages/delivery-copilot/src/local-context.js`
- `packages/delivery-copilot/src/agent-launcher.js`

Responsibilities:

- serve local context and health endpoints
- expose generated artifacts to the UI
- launch agent sessions
- track execution files and status

### 4. Target Repository

Primary source files:

- `demo-target-repo/src/App.jsx`
- `demo-target-repo/src/components/*`
- `demo-target-repo/tests/*`

Responsibilities:

- provide a real repo for ODT analysis
- show feature and defect handling in a safe sample app

## Seven-Stage Prompt System

ODT does not send one raw prompt to an agent. It orchestrates seven governed prompts across the delivery lifecycle:

1. Intake
2. Impact
3. Tech Design
4. Code Workpack
5. Unit Tests
6. Compliance
7. Verify

Each stage produces artifacts that can be reviewed independently.

## How Prompts Are Developed

### Stage Contracts

ODT maintains prompt contracts that define:

- exact inputs
- task objective
- output contract
- quality gates
- stop conditions

Relevant files:

- `reports/odt/prompts/01-intake.md` through `07-verify.md`
- `reports/odt/prompts/stage-contracts.json`

### Prompt Providers

ODT supports:

- `template`
  deterministic fallback prompts
- `oci`
  OCI GenAI generated prompts

Prompt-generation behavior:

- each stage may use OCI if configured
- fallback templates remain available if OCI is unavailable or fails
- reviewer edits and stage overrides can reshape prompts before delegation

### Generated Artifacts

Typical generated outputs include:

- `reports/dev-twin/intake.json`
- `reports/odt/impact-ranked-files.md`
- `reports/odt/tech-design.md`
- `reports/odt/code-patch-plan.md`
- `reports/odt/unit-test-matrix.md`
- `reports/odt/compliance-mapping.md`
- `reports/odt/verify-checklist.md`
- `reports/odt/execute/prompt.md`

## Accessibility Design

Accessibility is intentionally introduced before delegation, not after code generation.

### Source Files

- `packages/accessibility-ai-shield/src/policy/oracle-vpat-policy.json`
- `packages/accessibility-ai-shield/src/scanners/custom-rules.js`
- `packages/accessibility-ai-shield/src/scanners/eslint-scan.js`
- `docs/a11y-vpat-mapping.md`

### Accessibility Approach

- Oracle VPAT guidance is treated as the primary policy basis
- WCAG 2.1 AA acts as fallback guidance
- accessibility-related guidance is fed into ODT during the compliance stage
- keyboard parity, semantic HTML, labels, and validation messaging are treated as first-class concerns

### Required Developer Maintenance

Before production use, the developer should refresh the local accessibility mappings from the latest Oracle internal Confluence / VPAT source of truth by updating:

- `docs/a11y-vpat-mapping.md`
- `packages/accessibility-ai-shield/src/policy/oracle-vpat-policy.json`

## OCA-Backed Execution Flow

1. Developer runs ODT
2. ODT generates seven-stage artifacts
3. Reviewer adds notes or stage overrides if needed
4. ODT prepares execution bundle
5. `Delegate to Agent` launches Codex or Cline
6. Agent returns patch or diff
7. Human reviews changed files, tests, and accessibility expectations
8. Only then are changes accepted

This keeps the automation boundary clear:

- no auto-merge
- no silent acceptance
- no bypass of human review

## Installation and Setup

### Required

- Node.js 18+
- npm 9+
- Python 3

### Optional

- OCI CLI and OCI config for GenAI-backed prompt generation
- Codex or Cline access for governed execution

### Main Local Commands

```bash
./run-local.sh
```

or

```bash
npm run odt:init
npm run odt:run
npm run mcp:local:serve
python3 -m http.server 8080
```

### OCI Setup

Reference:

- `docs/OCI-GenAI-7-Stage-Prompt-Wiring.md`

Recommended local pattern:

1. Copy `scripts/odt-oci-local.example.sh` to `scripts/odt-oci-local.sh`
2. Add your local OCI configuration
3. Source that file
4. Run `npm run odt:run:oci-hybrid`

## Demo Story and Defect Fit

The sample app and ODT flow support both:

- feature delivery
- defect resolution

Examples:

- Story: add Employee Finder to the home page
- Defect: Submit button remains enabled before mandatory fields are valid

This makes the demo realistic because the same governed flow supports both planned delivery and bug fixing.

## Improvement Areas

Practical next improvements would be:

- richer profile support beyond current `react-js`, `python`, and `java`
- more formal repo onboarding for non-demo projects
- stronger automated verification for returned diffs
- deeper Oracle policy synchronization workflows for accessibility mapping
- expanded support for more OCA-compatible agent providers
- stronger packaging automation for source-only and submission-ready artifacts

## Summary

ODT stands out because it governs execution before code is accepted.

It combines:

- repo-aware planning
- seven-stage prompt generation
- optional OCI GenAI
- OCA-backed execution handoff
- Oracle accessibility guidance
- mandatory human approval

That is the technical reason it behaves like a Digital Worker instead of a simple coding assistant.
