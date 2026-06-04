# Oracle Developer Twin Hackathon Runbook (5-Minute Version)

## Objective
Deliver a crisp 5-minute live demo that proves ODT is a practical AI Digital Worker with:

- ticket intake and prompt hardening
- repo-aware impact analysis
- design/code/test/compliance planning
- controlled delegation to coding agent
- human-in-loop governance and review

---

## Pre-Demo Setup (3-5 minutes before)

1. Terminal A:
```bash
cd /Users/vn105957/Desktop/odt-submission
./run-local.sh
```

2. Open printed URLs:
- ODT Workspace dashboard
- ODT dashboard
- MCP health endpoint

3. Optional (React target demo app):
```bash
cd /Users/vn105957/Desktop/odt-submission/demo-target-repo
npm install
npm run dev
```

4. Keep these visible:
- browser with ODT Workspace
- terminal with logs/status
- (optional) browser tab for React app

---

## Live Script (5:00)

### 0:00 - 0:35 | Problem + Positioning
Say:
"Frontend teams lose time in pre-coding work: impact analysis, quality planning, accessibility readiness, and handoff. ODT is a digital worker that automates this while keeping merge control with humans."

Show:
- ODT Workspace hero + workflow section
- status chips (Server/Repo/Agent/Completion)

### 0:35 - 1:20 | Intake + Prompt Hardening
Action:
- Paste or load ticket in ODT Workspace.
- Select target repo path (`demo-target-repo` or your real repo).
- Mention optional design input upload.

Say:
"This is structured intake. We can add reviewer edits, and only if needed, stage-specific overrides for selected stages."

### 1:20 - 2:25 | Run Digital Worker (7-stage flow)
Action:
- Click `Run digital worker`.

Narrate stage flow explicitly:
1. intake  
2. impact  
3. design  
4. code-workpack  
5. test-workpack  
6. compliance  
7. verify-summary

Say:
"ODT outputs explainable artifacts for each stage and keeps traceability in reports."

### 2:25 - 3:20 | Explainability + Governance
Show tabs:
- Impact (candidate files, blast radius)
- A11y (VPAT/WCAG mapping)
- Code/Tests workpacks
- Verify checklist summary

Say:
"This is not blind code generation. It creates governed implementation guidance with human approval gates."

### 3:20 - 4:10 | Non-Git Repo Safety + Git Init
Action:
- Show repo status panel when repo is non-git.
- Show `Initialize Git` button.

Say:
"If target folder is non-git, ODT warns clearly and allows one-click Git initialization. This protects diff-based review and release governance."

### 4:10 - 4:45 | Delegate to Agent
Action:
- Click `Delegate to Agent`.

Say:
"ODT plans and governs. Codex/Cline executes in a visible terminal flow. Developers still review changed files and diffs before merge."

### 4:45 - 5:00 | Close with Value
Say:
"ODT reduces planning friction, keeps accessibility and compliance visible, and preserves human control at release-critical checkpoints. That is why it qualifies as a production-minded digital worker."

---

## Fast Fallback Lines (if something fails live)

- If mock API fails:
"The UI auto-falls back to local employee seed data, so the demo remains deterministic."

- If MCP port is occupied:
"Launcher auto-selects the next free port and isolates the workspace context."

- If target repo is non-git:
"ODT intentionally blocks unsafe assumptions and prompts Git initialization first."

---

## Defect Ticket Follow-Up Demo (Optional Extension)

Use after feature flow:

1. Introduce a controlled defect in `demo-target-repo`.
2. Create defect ticket in intake.
3. Run ODT again.
4. Show changed impact/workpack/verify outputs.
5. Delegate fix and review diff.

This demonstrates end-to-end: `ticket -> plan -> fix -> verify`.
