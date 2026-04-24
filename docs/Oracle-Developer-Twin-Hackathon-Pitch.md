# Oracle Developer Twin Hackathon Pitch

## 300-Character Abstract

Oracle Developer Twin is a governed Digital Worker that turns requirements into review-ready execution. It analyzes repo impact, prepares code, test, and accessibility workpacks, can use OCI GenAI and OCA-backed agents, and keeps humans in control before changes are accepted.

## 1-Paragraph Pitch

Oracle Developer Twin (ODT) is a governed Digital Worker for software delivery. A developer or reviewer provides a story, defect, mockup, or requirement, and ODT turns that input into a review-ready path by analyzing repo impact, preparing staged design, code, test, compliance, and verification guidance, and supporting optional OCI GenAI prompt generation plus OCA-backed execution. It does not replace the human; it reduces repetitive orchestration while keeping review, refinement, and final acceptance under human control.

## Problem Statement

Frontend developers spend significant time translating tickets into engineering action:

- understanding requirements
- finding impacted files
- planning changes
- identifying regression areas
- remembering VPAT/WCAG and keyboard rules
- preparing prompts for coding assistants

That orchestration work is repetitive, hard to standardize, and easy to miss under delivery pressure.

## What ODT Does

1. Intake
- captures ticket, requirements, mockups, and constraints

2. Repo Analysis
- scans the codebase and infers candidate impact areas with ranked confidence

3. Guidance Generation
- creates technical design, code workpack, patch plan, and unit-test matrix artifacts

4. Accessibility & Compliance
- adds VPAT/WCAG and keyboard review gates by default with compliance mapping

5. Human Review
- shows outputs in ODT Workspace before merge or release

## Why This Is More Than "Just Codex"

Codex can generate code, but ODT adds the workflow around it:

- standardized intake
- repo-aware impact inference
- durable artifacts on disk
- contract-based stage prompts with defined output schemas
- built-in accessibility/compliance gates
- explainable output
- human approval before merge

That is the Digital Worker layer.

## Demo Narrative

"A developer gives Oracle Developer Twin a ticket and a mockup. ODT scans the repo, identifies likely impact areas, prepares code and test guidance, checks accessibility obligations, and hands the developer a reviewable workpack. The human stays in control, but the manual orchestration is dramatically reduced."

## Core Value For Judges

- repeatable engineering workflow
- stronger delivery consistency
- earlier accessibility/compliance visibility
- better developer focus
- safer human-in-the-loop AI adoption

## Responsible External Prompting

- ODT generates `external-llm-sanitized-context.json` for safe external drafting (for example chat.oracle.com).
- Sensitive fields are redacted before external usage.
- Repo-grounded implementation is still driven through local Codex/Cline + human review.
