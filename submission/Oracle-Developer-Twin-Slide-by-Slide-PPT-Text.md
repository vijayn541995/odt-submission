# Oracle Developer Twin Slide-by-Slide PPT Text

Use this as the content source for the final presentation deck.

## Slide 1 - Title

- Title: `Oracle Developer Twin`
- Subtitle: `Governed Digital Worker for Software Delivery`
- Footer: `Submission Category: Digital Worker using OCA`

## Slide 2 - Executive Brief

- Section title: `Executive Brief`
- Title: `Oracle Developer Twin (ODT)`
- Problem Statement:
  `A significant amount of delivery effort goes into turning a requirement into clear scope, impacted files, test direction, accessibility guidance, and reliable execution prompts before implementation begins.`
- Solution – Digital Worker:
  `ODT turns one work item into a seven-stage, repo-aware, review-ready workflow with prompt hardening, hybrid Oracle Gen AI prompting, durable artifacts, and governed delegation to an OCA-backed execution session.`
- Expected Outcomes or Improvements:
  `Impact: developers stay closer to the requirement, review becomes more consistent, accessibility is surfaced earlier, and execution handoff becomes clearer.`
  `Measurable KPIs: planning prep time reduced, review-ready artifact coverage increased, a11y issues found earlier, and less repetitive support work around delivery.`
- Who benefits most?
  `Frontend developers, reviewers, tech leads, delivery managers, and teams working across large repositories with governance expectations.`

## Slide 3 - What the Digital Worker Does

- Section title: `Executive Brief`
- Title: `What the Digital Worker does`
- Body:
  `A human-reviewed SDLC co-worker that keeps developers closer to the requirement from intake to governed implementation.`
  `It assists with ticket intake, prompt hardening, repo impact analysis, hybrid prompt generation, code and test guidance, and execution handoff.`
  `It improves the workflow between requirement -> plan -> review -> delegate -> approve.`
  `Human review is included before re-analysis, before delegation, and before merge.`
- Flow line:
  `Requirement intake -> prompt hardening -> repo impact -> OCI GenAI or fallback prompts -> code/tests/compliance guidance -> human review -> OCA delegation -> repo diff approval`
- Value proposition:
  `ODT turns necessary supporting work into a visible, governed delivery flow. It is not replacing developer expertise; it is organizing the inputs, evidence, and AI collaboration around it.`

## Slide 4 - Technical Architecture

- Title:
  `High-level architecture, OCI prompt option, OCA execution path, and governed human review.`
- Slide visual message:
  `ODT plans and governs the work. OCI GenAI is optional for stage prompting. OCA executes. Human review approves.`

## Slide 5 - How This Digital Worker Works

- Section title: `Operational Detail`
- Who uses ODT and where value is realized:
  `A developer enters the work item, chooses the repo, reviews the evidence, and delegates only when ready. A reviewer or lead can add edits, stage overrides, and request re-analysis.`
- Execution model:
  `ODT plans and governs; OCA-backed Codex or Cline sessions execute implementation against the target repo.`
- Guardrails and governance:
  `Prompt hardening, repo validation, accessibility guidance aligned to Oracle expectations, and mandatory human approval before merge.`
- Interaction flow:
  `Requirement -> ODT Workspace -> reports/odt artifacts -> execute prompt -> OCA session -> repo diff review.`
- Hybrid prompting and integration points:
  `OCI GenAI can generate stage prompts with an LLM path, while fallback prompts and reviewer overrides keep the workflow resilient and customizable. ODT connects this with the local context server, dashboards, demo React app, and OCA execution path.`
- Why judges should care:
  `ODT helps teams collaborate with AI in a way that is explainable, reviewable, requirement-aware, and demo-ready today.`

## Slide 6 - Business Impact

- Section title: `Digital Worker`
- Business impact:
  `Reduces repetitive delivery-preparation work, improves consistency, surfaces accessibility earlier, helps reduce backlog pressure, and gives teams a reusable Oracle delivery pattern.`
- Responsible AI:
  `Human-in-the-loop review is mandatory; prompts and artifacts are traceable; fallback behavior keeps the workflow safe when OCI is unavailable.`
- Demo summary:
  `The demo shows requirement hardening, repo-aware planning, OCI prompt options, dashboard evidence, reviewer edits, OCA delegation, and final repo-level human approval.`
- Closing takeaway:
  `Oracle Developer Twin helps developers and AI collaborate in a governed way by keeping the requirement, the repo, and the human review step connected.`

## Slide 7 - Appendix (Optional)

- Overline: `Appendix`
- Title: `Governed Technical Flow`
- Subtitle:
  `A step-by-step governed flow showing where accessibility guidance enters and where human review can refine the path before and after OCA execution.`
- Phase headers:
  `Phase 1  Understand and scope`
  `Phase 2  Prepare and govern`
  `Phase 3  Execute and approve`
- Flow cards:
  `1. Requirement / Jira / Reviewer Input`
  `2. ODT Intake + Prompt Hardening`
  `3. Repo Impact Analysis`
  `4. Hybrid Prompt Generation`
  `5. Code + Unit Tests + Oracle A11y Guidance`
  `6. Human Review + Refine + Re-analyze`
  `7. Delegation to OCA Codex / Cline`
  `8. Review Changed Files + Fill Gaps`
  `9. Final Human Approval + Deliver`
- OCI callout:
  `OCI GenAI remains optional for stage prompting`
- Governance strip:
  `Accessibility enters at step 5 before delegation. Human review checkpoints appear at step 6 before OCA execution and step 9 before final delivery.`
