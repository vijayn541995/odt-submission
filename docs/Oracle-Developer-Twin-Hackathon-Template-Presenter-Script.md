# Oracle Developer Twin Final Presenter Script

Use this script with:

- `docs/Oracle-Developer-Twin-Hackathon-Submission-Template-Deck.pptx`

## Duration

- 5 minutes total

## Slide 1 - Title

"This is Oracle Developer Twin, or ODT. It is a human-reviewed Digital Worker for software delivery. Instead of starting with code generation, it starts by helping developers stay closer to the requirement, understand scope, and prepare a safe path to implementation."

## Slide 2 - Executive Brief

"In enterprise delivery, a significant amount of effort goes into turning a requirement into clear scope, impacted files, test direction, accessibility guidance, and reliable execution prompts before implementation begins."

"Those activities are essential, but they are also repetitive and time-consuming. Oracle Developer Twin helps organize that necessary work so developers can focus on the decisions that matter most."

"ODT turns one work item into a seven-stage, repo-aware, review-ready workflow with prompt hardening, hybrid Oracle Gen AI prompting, durable artifacts, and governed delegation to an OCA-backed execution session."

## Slide 3 - What the Digital Worker Does

"ODT acts as a human-reviewed SDLC co-worker. It helps with ticket intake, prompt hardening, repo impact analysis, hybrid prompt generation, code and test guidance, and execution handoff."

"The workflow is requirement first: plan, review, delegate, and approve."

"The key point is that ODT is not replacing developer expertise. It is organizing the inputs, evidence, and AI collaboration around that expertise."

## Slide 4 - Technical Architecture

"This is the architecture view of that workflow."

"ODT plans and governs the work, OCI can optionally generate stage prompts, OCA executes the implementation path, and the human remains the approval gate."

"That is the model we want to show clearly: governed planning, optional GenAI prompting, controlled execution, and human approval."

## Slide 5 - How This Digital Worker Works

"In practice, a developer enters the work item, chooses the repository, reviews the generated evidence, and delegates only when ready."

"A reviewer or lead can add edits, provide stage overrides, and request re-analysis before implementation is handed off."

"OCI GenAI can generate stage prompts using an LLM path, while fallback prompts and reviewer overrides keep the workflow resilient and customizable."

"ODT governs the planning and evidence. OCA-backed Codex or Cline sessions execute implementation against the target repository."

"Accessibility guidance aligned to Oracle expectations stays visible in the workflow, and human approval is still required before merge."

## Slide 6 - Business Impact and Close

"The business value is straightforward."

"Oracle Developer Twin reduces repetitive delivery-preparation work, improves consistency, surfaces accessibility earlier, helps reduce backlog pressure, and enables better collaboration between developers and AI."

"This is not about questioning developer capability. It is about reducing supporting effort around delivery while keeping developer judgment at the center."

"The takeaway is simple: Oracle Developer Twin helps developers and AI collaborate in a governed way by keeping the requirement, the repository, and the human review step connected."

## Slide 7 - Appendix Technical Flow (Optional)

"Use this slide only if judges ask for technical depth."

"It shows the governed sequence more precisely: requirement intake, prompt hardening, impact analysis, hybrid OCI or fallback prompt generation, and code plus test guidance."

"The important addition is that accessibility guidance appears before delegation, not only at the end."

"You can also see a human review checkpoint before OCA execution and a final approval gate after the returned changes are reviewed."

"The message remains the same. Automation accelerates the path, but approval still stays with the developer."

## Strong Closing Line

"Oracle Developer Twin does not replace developer judgment. It reduces the repetitive supporting work around delivery and helps teams move from requirement to governed implementation with more clarity, consistency, and control."
