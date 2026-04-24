# Oracle Developer Twin Technical Handout

## One-Line Definition

Oracle Developer Twin (ODT) is a governed Digital Worker that prepares, explains, and coordinates frontend implementation work before code is accepted.

## Why It Matters

Most AI coding demos start at the code-generation step.
Real delivery friction usually starts earlier:

- the requirement is unclear
- repo impact is unknown
- test scope is guessed
- accessibility is late
- prompts are inconsistent
- human review is fragmented

ODT solves that orchestration layer.

## Core Architecture

### 1. Intake Layer

Inputs:

- work item text
- repo path
- optional design inputs
- reviewer notes
- optional stage overrides

Primary artifact:

- `reports/dev-twin/intake.json`

### 2. Planning and Analysis Engine

Primary package:

- `packages/accessibility-ai-shield`

Responsibilities:

- normalize intake
- infer candidate files and blast radius
- generate seven-stage prompt/workpack artifacts
- run accessibility evidence generation
- build ODT dashboards

### 3. Control Plane

Primary package:

- `packages/delivery-copilot`

Responsibilities:

- local context server
- repo inspection
- execution prompt delivery
- agent launch and status reporting

### 4. Experience Layer

Primary dashboards:

- `reports/odt/fedit.html`
- `reports/odt/index.html`

Responsibilities:

- intake and controls
- workflow visibility
- explainability
- execution status
- human review guidance

## How OCA Is Used

The hackathon theme is Digital Worker usage through OCA.

In this project, ODT uses OCA in the execution layer:

- ODT prepares the governed implementation package
- `Delegate to Agent` launches the execution agent session
- the current environment shows Codex using provider `oca`
- the delegated session works from the target repo with the ODT-generated prompt

In short:

- ODT = orchestration, governance, evidence, review surface
- OCA = execution engine used for implementation handoff

## How OCI GenAI Is Used

OCI GenAI is wired as an optional prompt provider for the seven-stage prompt flow.

Current behavior:

- `template` is always available as the safe fallback
- `oci` can generate prompts for intake, impact, design, code, unitTests, compliance, and verify
- provider audit and per-stage output are written to disk

Primary reference:

- `docs/OCI-GenAI-7-Stage-Prompt-Wiring.md`

This gives the project a hybrid story:

- OCA for delegated execution
- OCI GenAI for prompt generation when configured
- safe fallback when OCI is unavailable

## Seven-Stage Digital Worker Flow

1. Intake
2. Impact
3. Design
4. Code
5. Unit Tests
6. Compliance
7. Verify

Each stage produces durable artifacts instead of hidden reasoning.

## Human-in-the-Loop Design

ODT intentionally keeps human control at three points:

1. Before re-analysis
   - reviewer can add notes or stage overrides

2. Before delegation
   - human checks the generated evidence in the dashboard

3. Before merge
   - human reviews repo diffs and changed files

This is a key differentiator for responsible AI and hackathon judging.

## Why This Qualifies as a Digital Worker

ODT is more than a prompt wrapper because it:

- performs repeatable multi-stage SDLC work
- creates durable artifacts and evidence
- coordinates an execution agent
- enforces review and governance
- explains the reasoning path in a visible interface

## Current Demo-Ready State

- intake-first ODT Workspace dashboard
- explicit agent status visibility
- smart `Update & Re-analyze` gating
- human review callout at the top of the workspace
- Oracle-branded demo target React app
- validated form demo with payload logging
- 300 employees and pagination
- optional OCI prompt-provider path

## Final Judge Message

ODT does not try to replace developers.
It removes the hidden planning work between a ticket and a safe code change, then uses OCA as a controlled execution path with human approval preserved.
