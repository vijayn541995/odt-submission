# Persisted Audit Pack Design

## Goal

Persist restart-safe `AI Work Audit Pack` snapshots for each assignment so ODT can later inspect a task's audit state without rebuilding it only from current UI data.

## Problem

ODT already persists implementation evidence, PR readiness reports, review comments, approvals, worker runs, relay items, and Foundry runs. The current `AI Work Audit Pack` is still derived client-side from live evidence at view time. That means:

- older tasks can be reconstructed from stored evidence, but not replayed as a frozen audit snapshot;
- audit output can drift as newer evidence lands;
- restart-safe proof is weaker than the rest of the stored workflow evidence.

## Scope

This slice introduces a dedicated persisted audit-pack artifact for assignment-scoped review.

In scope:

- SQLite table and repository for persisted audit packs
- server-side snapshot creation at key audit milestones
- evidence aggregation and current/historical splitting for audit packs
- Artifacts page reading persisted audit packs first
- enterprise checks that prove persistence and evidence API exposure

Out of scope:

- generalized artifact journal for every artifact type
- removing all remaining `server/index.js` orchestration
- full operator-flow automation

## Approach

Use a dedicated `ai_work_audit_packs` persistence boundary instead of broad artifact generalization.

Each audit pack stores:

- assignment id
- stage / source milestone
- status
- full pack JSON
- created timestamp

Server-side generation reuses `buildAiWorkAuditPack(...)` so the pack format stays aligned with the existing Artifacts rendering. The snapshot becomes a point-in-time audit artifact rather than a transient browser computation.

## Milestones

Create a fresh audit pack snapshot when:

1. implementation evidence is recorded
2. post-implementation standards review completes
3. PR readiness pack is prepared

These are the strongest current proof points and cover the most important restart-safe audit checkpoints without broadening the slice into every approval or review mutation.

## Read Path

`collectEvidence(...)` should include persisted audit packs in assignment evidence. The workflow evidence splitter should classify them into current vs historical like other assignment evidence. The Artifacts page should prefer the latest persisted audit pack and fall back to derived output only when no snapshot exists yet.

## Validation

Proof of completion requires:

- repository persistence checks for create/list/get-latest behavior
- workflow/evidence contract checks proving audit packs appear in evidence
- UI rendering still shows `AI Work Audit Pack`
- enterprise check suite passes

## Success Criteria

- ODT can inspect a saved audit pack after restart for a given assignment
- separate assignments retain separate persisted audit packs
- older assignment evidence can be reviewed without rebuilding the pack only from current in-memory UI state
- existing Artifacts behavior remains backward-compatible when no persisted pack exists yet
