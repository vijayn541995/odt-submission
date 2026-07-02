# Persisted Audit Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist restart-safe `AI Work Audit Pack` snapshots per assignment and surface them through ODT evidence and Artifacts.

**Architecture:** Add a dedicated SQLite-backed audit-pack repository, generate snapshots server-side at key evidence milestones, aggregate them through `collectEvidence(...)`, and render persisted packs in Artifacts with derived fallback compatibility.

**Tech Stack:** Node 24, SQLite via existing prepared statements, enterprise repository pattern, domain audit-pack builder, React Artifacts page, enterprise check scripts.

---

### Task 1: Persist Audit Pack Rows

**Files:**
- Create: `odt 2.0 enterprise/services/sqlite/src/repositories/ai-work-audit-pack-repository.js`
- Modify: `server/index.js`
- Test: `odt 2.0 enterprise/packages/testing/src/check-sqlite-repositories.mjs`

- [ ] Add a failing repository test for audit-pack create/list/latest behavior.
- [ ] Add SQLite schema and prepared statements for `ai_work_audit_packs`.
- [ ] Implement the repository with parsed `packJson`.
- [ ] Wire the repository into `server/index.js`.

### Task 2: Expose Audit Packs In Evidence

**Files:**
- Modify: `odt 2.0 enterprise/services/sqlite/src/repositories/workflow-evidence-repository.js`
- Modify: `odt 2.0 enterprise/services/api/src/modules/workflow/workflow-evidence.js`
- Test: `odt 2.0 enterprise/packages/testing/src/check-workflow-contract.mjs`
- Test: `odt 2.0 enterprise/packages/testing/src/fixtures/workflow/workflow-evidence-fixtures.js`

- [ ] Add a failing contract check proving assignment evidence includes audit packs.
- [ ] Extend workflow evidence aggregation to return `aiWorkAuditPacks`.
- [ ] Extend freshness splitting and scoped current evidence to classify audit packs.
- [ ] Verify current/historical behavior with fixtures.

### Task 3: Generate Snapshots At Audit Milestones

**Files:**
- Modify: `server/index.js`
- Test: `odt 2.0 enterprise/packages/testing/src/check-workflow-contract.mjs`

- [ ] Add a failing check that a persisted audit pack can be built from workflow evidence.
- [ ] Add a helper in `server/index.js` that builds and stores an audit snapshot from current assignment evidence.
- [ ] Call the helper after implementation evidence recording, post-check completion, and PR pack preparation.
- [ ] Keep snapshot metadata explicit about its source milestone.

### Task 4: Prefer Persisted Packs In Artifacts

**Files:**
- Modify: `odt 2.0 enterprise/packages/ui/src/features/artifacts/ArtifactsPage.jsx`

- [ ] Read current persisted audit packs from evidence.
- [ ] Prefer the latest persisted pack for `AI Work Audit Pack`.
- [ ] Fall back to `buildAiWorkAuditPack(...)` only when no persisted snapshot exists.
- [ ] Show persisted timing/metadata through the existing detail view.

### Task 5: Verify End-To-End Proof

**Files:**
- Modify: `odt 2.0 enterprise/services/api/src/modules/workflow/README.md`
- Modify: `odt 2.0 enterprise/README.md`

- [ ] Run repository and workflow contract checks.
- [ ] Run `npm --prefix "odt 2.0 enterprise" run check`.
- [ ] Document the new persisted audit-pack behavior in enterprise docs.
- [ ] Summarize what remains manual or architecture-coupled after this slice.
