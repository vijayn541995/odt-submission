# Developer Twin Intake Questions

Use these questions before coding to improve safety, clarity, and agent quality.

## Ticket Intake
- What is the Jira/story title and short summary?
- Is this a feature, defect, or enhancement?
- What user or business outcome should improve after this change?

## Acceptance & UX
- What must be true for this ticket to be accepted?
- What behavior must never change?
- Is there a mockup, reference screen, or interaction flow?
- What are loading, empty, and error states?
- Are keyboard and screen-reader behaviors defined?

## Repo Analysis Inputs
- Are there optional hints about suspected files, modules, or shared components?
- Are there related Jira links, docs, or screenshots to attach?
- What backward compatibility constraints exist?

## Compliance & Review
- Which VPAT/WCAG expectations are mandatory for this work?
- Which unit or regression tests should be reviewed or added?
- What would need explicit human approval before merge?

## Defect-Only Questions
- What is the observed behavior?
- What is the expected behavior?
- How severe is the issue and how easy is it to reproduce?

## Release Notes
- Are there release-window or dependency constraints?
- Is rollback guidance needed if issues are found post-release?

## What ODT Will Infer
- Candidate impact areas in the repo
- Related tests and regression surfaces
- Accessibility and keyboard risks
- Code and test workpacks for human review

## Human Review Reminder
- AI output is a draft for review, not an automatic merge decision.
- Which unit/integration tests must be created or updated?

