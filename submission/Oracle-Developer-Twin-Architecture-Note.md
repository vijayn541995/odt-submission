# Oracle Developer Twin Architecture Note

## 1. Executive Summary

Oracle Developer Twin (ODT) is a human-reviewed AI digital worker for frontend SDLC. It accepts a work item, analyzes repository impact, generates implementation guidance, applies Oracle-aligned accessibility/compliance checks, and prepares a delegated handoff to an execution agent such as Codex or Cline.

The demo experience is presented through ODT Workspace, a browser-based dashboard that makes the digital worker visible, explainable, and reviewable for judges and stakeholders.

## 2. Problem Being Solved

Frontend delivery teams repeatedly spend time on:

1. clarifying requirements
2. identifying impacted files and modules
3. preparing technical implementation guidance
4. generating or updating test scope
5. validating accessibility and VPAT/WCAG expectations
6. organizing artifacts for review and release evidence

ODT reduces this manual coordination work while keeping humans in the loop for approval, merge, and release decisions.

## 3. Product Definition

ODT acts as a Digital Worker with five core responsibilities:

1. Intake:
Transforms a user story, defect summary, or Jira-style requirement into structured planning inputs.

2. Repo Analysis:
Infers modules, candidate files, blast radius, and likely regression areas from the repository.

3. Delivery Guidance:
Generates tech-design, code-workpack, and unit-test guidance for implementation.

4. Accessibility and Compliance:
Runs Oracle-aligned accessibility checks and prepares VPAT/WCAG + keyboard remediation guidance.

5. Human Review Dashboard:
Presents all generated evidence in a visible, review-ready dashboard for engineers and leadership.

## 4. High-Level Architecture

### A. Planning and Analysis Engine

Location:
- [packages/accessibility-ai-shield](/Users/vn105957/Desktop/odt-submission/packages/accessibility-ai-shield)

Responsibilities:
- CLI commands for scan, fix, twin, dev-twin, and ODT
- repository impact inference
- tech-design and workpack generation
- a11y policy mapping and rule processing
- enterprise dashboard generation

Key areas:
- [src/commands](/Users/vn105957/Desktop/odt-submission/packages/accessibility-ai-shield/src/commands)
- [src/dev-twin](/Users/vn105957/Desktop/odt-submission/packages/accessibility-ai-shield/src/dev-twin)
- [src/odt](/Users/vn105957/Desktop/odt-submission/packages/accessibility-ai-shield/src/odt)
- [src/twin](/Users/vn105957/Desktop/odt-submission/packages/accessibility-ai-shield/src/twin)
- [src/policy](/Users/vn105957/Desktop/odt-submission/packages/accessibility-ai-shield/src/policy)

### B. Local Control Plane and Agent Delegation

Location:
- [packages/delivery-copilot](/Users/vn105957/Desktop/odt-submission/packages/delivery-copilot)

Responsibilities:
- local HTTP context server
- execution status endpoints
- external agent launch handling
- status/log propagation back to ODT Workspace

Key areas:
- [src/local-context.js](/Users/vn105957/Desktop/odt-submission/packages/delivery-copilot/src/local-context.js)
- [src/agent-launcher.js](/Users/vn105957/Desktop/odt-submission/packages/delivery-copilot/src/agent-launcher.js)

### C. Demo Experience Layer

Generated outputs:
- [reports/odt/fedit.html](/Users/vn105957/Desktop/odt-submission/reports/odt/fedit.html)
- [reports/odt/fedit.css](/Users/vn105957/Desktop/odt-submission/reports/odt/fedit.css)
- [reports/odt/fedit-app.js](/Users/vn105957/Desktop/odt-submission/reports/odt/fedit-app.js)

Responsibilities:
- visible SDLC workflow
- metrics and charts
- explainability
- accessibility/compliance summaries
- agent delegation controls
- review guidance for changed files and diffs

## 5. Runtime Flow

### Step 1. Intake

Input source:
- [reports/dev-twin/intake.json](/Users/vn105957/Desktop/odt-submission/reports/dev-twin/intake.json)

ODT captures:
- title
- summary
- work item type
- acceptance criteria
- constraints
- design inputs

### Step 2. ODT Planning Run

Primary command:

```bash
npm run odt:run -- --profile react-js
```

This generates:
- repo impact analysis
- tech design
- code workpack
- test workpack
- accessibility prompt
- ODT review dashboard and ODT Workspace dashboard

### Step 3. Accessibility and Compliance

Primary evidence:
- [reports/a11y/coding-agent-prompt.md](/Users/vn105957/Desktop/odt-submission/reports/a11y/coding-agent-prompt.md)
- [docs/a11y-vpat-mapping.md](/Users/vn105957/Desktop/odt-submission/docs/a11y-vpat-mapping.md)

ODT uses Oracle VPAT/WCAG mapping plus keyboard accessibility guidance to keep compliance visible in the delivery plan.

### Step 4. Agent Delegation

ODT prepares a handoff bundle for execution agents:

- [reports/odt/execute/prompt.md](/Users/vn105957/Desktop/odt-submission/reports/odt/execute/prompt.md)
- [reports/odt/execute/agent-launch.json](/Users/vn105957/Desktop/odt-submission/reports/odt/execute/agent-launch.json)

The intent is:

1. ODT completes planning and evidence generation
2. developer delegates implementation to Codex or Cline
3. execution agent edits the repo directly
4. developer reviews changed files and diffs
5. merge remains human-controlled

### Step 5. Human Review

Review surfaces:
- [reports/odt/index.html](/Users/vn105957/Desktop/odt-submission/reports/odt/index.html)
- [reports/odt/fedit.html](/Users/vn105957/Desktop/odt-submission/reports/odt/fedit.html)
- generated markdown/json artifacts under `reports/`

## 6. Current Working State

### Already Working

1. ODT source packages are restored in this repo:
- [packages/accessibility-ai-shield](/Users/vn105957/Desktop/odt-submission/packages/accessibility-ai-shield)
- [packages/delivery-copilot](/Users/vn105957/Desktop/odt-submission/packages/delivery-copilot)

2. ODT planning pipeline works:
- intake
- impact analysis
- workpack generation
- accessibility prompt generation
- dashboard generation

3. ODT Workspace is implemented as a richer React-style generated dashboard with:
- Oracle-inspired visual styling
- workflow stages
- metrics and charts
- persistent demo state
- agent delegation UI

4. Local control plane exists for:
- health checks
- ODT run
- execution status
- agent launch status

### Partially Working / In Progress

1. Visible agent delegation flow:
- terminal-based delegation is the primary supported path
- Codex/Cline handoff design is in place

2. Post-delegation review flow:
- dashboard guidance exists
- repo diff remains the main source of truth for review

## 7. Responsible AI Design

ODT aligns to responsible AI expectations by design:

1. Human reviewed:
All merge/release decisions stay with a developer or reviewer.

2. Transparent:
It produces dashboards, workpacks, prompts, and traceable status artifacts.

3. Explainable:
It shows why modules, files, tests, and accessibility risks were surfaced.

4. Controlled:
It does not bypass developer review of changed files or Git diffs.

## 8. Why This Qualifies as a Digital Worker

ODT is not just a chatbot or prompt wrapper. It:

1. performs structured repeatable SDLC work
2. orchestrates multiple analysis/generation stages
3. produces durable artifacts
4. supports measurable engineering productivity value
5. keeps humans in the loop at critical control points

## 9. Next Implementation Step

The most important next step is to make agent delegation fully polished across launch environments.

### Recommended Next Step

Implement launch-mode support for:

1. Codex Terminal
2. Cline Terminal
3. Codex App on macOS

This will strengthen the story:

1. ODT plans the work
2. developer chooses the execution environment
3. Codex/Cline performs the implementation visibly
4. changed files and diffs are reviewed in the repo

### Why This Is the Right Next Step

It closes the final gap between:
- planning artifact generation
- live execution handoff
- visible developer confidence during demo

## 10. Judge Takeaway

Oracle Developer Twin demonstrates a practical AI Digital Worker for frontend SDLC:

1. it reduces manual planning and compliance effort
2. it keeps accessibility and governance visible
3. it supports delegated implementation through coding agents
4. it preserves human review and release control

In short:
ODT acts as a frontend engineer’s digital twin for planning, guidance, compliance, and execution handoff.
