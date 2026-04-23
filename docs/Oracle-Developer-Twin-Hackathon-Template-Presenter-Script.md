# Oracle Developer Twin Hackathon Template Presenter Script

Use this script with:

- `docs/Oracle-Developer-Twin-Hackathon-Submission-Template-Deck.pptx`

## Duration

5 minutes total

## Slide 1 - Title

"This is Oracle Developer Twin, or ODT. It is a Digital Worker for software delivery. Instead of starting with code generation, it starts with the work that usually slows teams down before coding even begins: understanding the request, finding repo impact, planning changes, checking accessibility, and preparing a safe handoff."

## Slide 2 - Executive Brief

"The core problem is that software delivery has a hidden preparation cost. Developers still need to translate business asks into engineering action, infer which files are impacted, decide what to test, and remember accessibility obligations. ODT solves that by creating a governed workflow around those steps. The people who feel this problem most are frontend developers, reviewers, and delivery leads."

## Slide 3 - What the Digital Worker Does

"ODT takes one work item and turns it into a structured seven-stage flow: intake, impact, design, code, tests, compliance, and verify. Human review is intentionally built in. A developer reviews the evidence, adds reviewer notes or stage-specific guidance if needed, re-analyzes, and only then delegates implementation. The unique value here is that ODT makes the work before coding visible, repeatable, and reviewable."

## Slide 4 - Technical Architecture

"Technically, the solution is simple and clear. The intake and planning engine live in the ODT CLI. A local context server handles repo inspection and execution control. The ODT dashboards make the workflow visible. OCA is used in the execution path when we delegate implementation, and OCI GenAI can be used to generate the seven stage prompts with a safe fallback path. ODT plans, OCA executes, and the human still decides."

Short speaking line:

"ODT plans and governs the work, OCI can optionally generate stage prompts, OCA executes the implementation path, and the human remains the approval gate."

## Slide 5 - How It Works in Practice

"In practice, a developer opens ODT Workspace, pastes the requirement, selects the repo, and runs the Digital Worker. ODT generates the evidence package, highlights likely files, adds accessibility context, and prepares an execution prompt. The reviewer can add changes in the dashboard, rerun analysis, and then delegate. Guardrails include prompt hardening, repo validation, optional Git initialization, accessibility evidence, and visible execution status. This is what makes the solution feel enterprise-ready instead of experimental."

Short speaking line:

"The workflow is simple for the user: enter the request, review the generated evidence, refine it if needed, then delegate with control and traceability."

## Slide 6 - Business Impact and Close

"The business value is straightforward. ODT reduces planning friction, improves delivery consistency, brings accessibility and verification forward, and keeps accountability human. Our demo shows a working dashboard, a repo-aware planning flow, controlled delegation to OCA, and a real React target app that can be changed and re-reviewed live. The takeaway is simple: ODT turns AI into a governed Digital Worker for software delivery, not just a coding shortcut."

Short speaking line:

"This is not just faster coding. It is safer, more reviewable, and more enterprise-ready delivery."

## Slide 7 - Appendix Technical Flow (Optional)

"Use this slide only if judges ask for technical depth. It shows the detailed runtime path: requirement intake, ODT planning, human review, OCA-backed delegation, repo updates, and final human approval. The point is that automation accelerates the path, but it never removes the approval gate."

Short speaking line:

"ODT creates the evidence, OCA runs the implementation path, and the repo diff approval remains human."

## Strong Closing Line

"Oracle Developer Twin does not remove developer judgement. It removes the hidden setup work that keeps slowing delivery, and it does that with visible governance."
