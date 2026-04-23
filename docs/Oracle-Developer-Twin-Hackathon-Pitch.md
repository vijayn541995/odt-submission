# Oracle Developer Twin Hackathon Pitch

## 300-Character Abstract

Oracle Developer Twin is a human-reviewed AI workflow for frontend teams. It turns tickets, mockups, and requirements into repo-aware impact analysis, code and test workpacks, and VPAT/WCAG plus keyboard accessibility review, with a dashboard that keeps developers in control.

## 1-Paragraph Pitch

Oracle Developer Twin (ODT) is a Digital Worker for frontend SDLC. A developer provides a Jira ticket, acceptance criteria, mockups, and optional hints. ODT analyzes the repository to infer likely impact areas, prepares implementation and unit-test workpacks, runs accessibility and compliance checks, and presents everything in a reviewable dashboard before code is accepted. It does not replace the developer; it removes repetitive orchestration and makes delivery more consistent, explainable, and standards-aligned.

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
