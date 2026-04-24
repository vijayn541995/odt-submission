# ODT V2 Implementation Plan

This document keeps the next implementation roadmap in one place so the work can be resumed later without re-discovering the design.

## Goal

Strengthen Oracle Developer Twin from a good governed demo into a more explicit, controllable Digital Worker platform without changing the core stack.

The current stack is already sufficient:

- React-based FEDIT dashboard
- generated ODT dashboard
- local Node.js context server
- filesystem-based artifacts
- ODT seven-stage planning flow
- Codex or Cline delegated execution

The next work should build on that foundation rather than replacing it.

## Product Direction

The next version should improve four things:

1. clarification handling
2. machine-enforced governance
3. richer upload intelligence
4. safer delegated execution

## Phase 1: Clarifications Needed Panel

### Outcome

ODT should be able to ask decision-critical questions, capture answers in the dashboard, and prevent delegation when critical questions remain unresolved.

### User Experience

Add a new FEDIT section named `Clarifications Needed`.

Each clarification card should show:

- stage
- severity
- question
- why it matters
- suggested answer format
- answer field
- status

Recommended statuses:

- `open`
- `answered`
- `resolved`
- `blocked`

### Data Model

Add a generated artifact such as:

- `reports/odt/clarifications/questions.json`

Suggested shape:

```json
{
  "generatedAt": "2026-04-24T00:00:00Z",
  "status": "needs_input",
  "questions": [
    {
      "id": "intake-001",
      "stage": "intake",
      "severity": "high",
      "question": "What is the expected behavior when mandatory fields are empty?",
      "why": "Required to validate the defect fix safely.",
      "answerFormat": "Short acceptance rule",
      "answer": "",
      "status": "open"
    }
  ]
}
```

### Main File Touchpoints

- `packages/accessibility-ai-shield/src/commands/odt.js`
- `packages/accessibility-ai-shield/src/odt/fedit.js`
- `packages/delivery-copilot/src/local-context.js`

### Implementation Steps

1. generate structured clarification questions from intake and later stages
2. expose clarification data through the local context server
3. render clarification cards in FEDIT
4. save answers back through a local POST endpoint
5. block delegation while any high-severity clarification is unresolved

## Phase 2: Workflow State Model

### Outcome

Make human review and approval explicit, not just implied by prompts.

### Recommended States

- `draft`
- `needs_input`
- `ready_for_review`
- `approved_for_delegate`
- `delegated`
- `diff_review_required`
- `accepted`
- `rework_required`

### Main File Touchpoints

- `packages/accessibility-ai-shield/src/commands/odt.js`
- `packages/accessibility-ai-shield/src/odt/fedit.js`
- `packages/delivery-copilot/src/local-context.js`

### Implementation Steps

1. add status fields to ODT run summaries
2. reflect status in the dashboard
3. prevent delegate actions unless the run is in `approved_for_delegate`
4. require an explicit post-diff decision before marking a run accepted

## Phase 3: Governance Hardening

### Outcome

Turn repo-impact guidance into machine-enforced controls.

### Controls To Add

- allowed write paths
- forbidden write paths
- max changed files
- max new files
- dependency policy
- protected file list

### Main File Touchpoints

- `packages/accessibility-ai-shield/src/commands/odt.js`
- `packages/accessibility-ai-shield/src/commands/odt-execute.js`
- `packages/delivery-copilot/src/agent-launcher.js`

### Implementation Steps

1. emit enforcement metadata from impact analysis
2. include that metadata in the execution bundle
3. validate returned changes against the allowed scope
4. send out-of-scope results back for rework instead of silent acceptance

## Phase 4: Richer Upload Intelligence

### Outcome

Use uploaded material as structured planning input rather than only file references.

### Priority Expansion

- support `csv`
- support `xls`
- support `xlsx`
- summarize PDFs and text documents
- extract lightweight image notes or OCR where useful

### Main File Touchpoints

- `packages/accessibility-ai-shield/src/odt/fedit.js`
- `packages/delivery-copilot/src/local-context.js`
- `packages/accessibility-ai-shield/src/commands/odt.js`

### Implementation Steps

1. extend upload accept types in FEDIT
2. classify spreadsheets separately from generic documents
3. generate attachment summary artifacts
4. feed those summaries into the stage prompts and execution bundle

## Phase 5: Safer Delegated Execution

### Outcome

Make execution more reversible and isolated.

### Recommended Improvements

- create checkpoints before delegated execution
- prefer a worktree or isolated branch per delegated run
- block destructive operations outside policy
- show cleaner status and reset behavior in FEDIT

### Main File Touchpoints

- `packages/delivery-copilot/src/agent-launcher.js`
- `packages/delivery-copilot/src/local-context.js`
- `packages/accessibility-ai-shield/src/odt/fedit.js`

### Implementation Steps

1. create a pre-delegation checkpoint
2. store checkpoint metadata in the execution status
3. add a restore or revert path for rejected runs
4. improve stale status cleanup and response preview behavior

## Phase 6: Reporting and Audit

### Outcome

Make ODT easier to explain, compare, and measure over time.

### Improvements

- run-to-run comparison view
- approval audit trail
- clarification resolution history
- prompt provider usage summary
- execution success and rework metrics

### Main File Touchpoints

- `packages/accessibility-ai-shield/src/commands/odt.js`
- `packages/accessibility-ai-shield/src/odt/dashboard.js`
- `packages/accessibility-ai-shield/src/odt/fedit.js`

## Suggested Build Order

If resumed later, implement in this order:

1. Clarifications Needed panel
2. workflow states and gating
3. governance hardening for write scope and dependencies
4. richer upload intelligence
5. safer delegated execution
6. reporting and audit improvements

## Why This Order

- the clarification panel gives the clearest Digital Worker upgrade with the least architectural disruption
- explicit workflow states make the human review path stronger immediately
- enforcement upgrades reduce risk before adding more autonomy
- richer upload handling and reporting can build on the stronger control model

## Resume Prompt For Future Work

If work resumes later, use this as the kickoff instruction:

`Continue Oracle Developer Twin v2 from docs/ODT-V2-Implementation-Plan.md, starting with Phase 1: Clarifications Needed panel, using the existing React FEDIT dashboard, local Node context server, and filesystem artifact model.`
