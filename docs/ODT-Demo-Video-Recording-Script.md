# Oracle Developer Twin Demo Video Plan and Recording Script

## Purpose of the Video

This video should help a mixed audience quickly understand:

- what real problem Oracle Developer Twin solves
- why that problem matters
- how the Digital Worker supports the workflow
- where human review happens
- how accessibility is built into the process
- why this is better than a simple one-shot code prompt

The goal is not to impress people with technical jargon.
The goal is to make the value obvious to any judge within the first minute.

## Core Story in Plain Language

Use this framing throughout the video:

`Modern software work involves understanding requirements, identifying the right files to change, keeping tests and accessibility aligned, and making sure changes are reviewed before they are accepted. Oracle Developer Twin helps with that preparation and execution, while keeping developers and reviewers in control.`

## What Problem We Are Solving

Say this in simple terms:

`In real delivery work, teams spend a lot of time translating a request into a safe and clear implementation plan. The work is not only writing code. It is understanding scope, finding impacted areas, keeping quality and accessibility in mind, and reviewing the result before it is accepted.`

Then immediately position the solution:

`Oracle Developer Twin acts like an assistant for that flow. It helps turn a request into a governed, reviewable path so people can make better decisions faster, without removing human judgment.`

## One-Line Value Proposition

Use this at the start and the end:

`Oracle Developer Twin turns a requirement into a governed, review-ready delivery path with AI assistance, accessibility guidance, and human approval at the points that matter most.`

## The Demo Story

Use two work items in one clear narrative:

### 1. Feature Story

Show that the app is missing a useful capability.

- missing capability: `Employee Finder`
- desired outcome: search and filter employees on the home page
- user value: easier navigation through a large employee list
- quality expectation: keyboard and screen-reader friendly

### 2. Defect

Show that the form has a clear issue today.

- current bug: the `Submit` button is enabled even when required fields are invalid
- why it matters: the UI gives the wrong signal to users
- accessibility relevance: validation state, focus guidance, and status clarity matter for all users, including keyboard and assistive-technology users

This pairing is strong because judges can understand both immediately:

- one missing feature
- one visible defect

## Where Human Review Happens

This must be spoken clearly because it is one of the strongest parts of the solution.

### Review Point 1: Before Delegation

In ODT Workspace:

- the user enters the work item
- ODT generates the seven-stage outputs
- a human can add reviewer notes
- a human can add stage overrides
- the human can click `Update & Re-analyze`

This means the human can reshape the plan before any implementation is delegated.

### Review Point 2: During Planning Review

In the ODT Review Dashboard:

- the human reviews intake
- impact analysis
- design
- code workpack
- tests
- accessibility/compliance
- verification guidance

This is the point where the human decides whether the execution path is good enough.

### Review Point 3: After Delegation

After ODT prepares the execution handoff:

- the agent works on the approved path
- the human reviews the changed files and diffs
- the human accepts, refines, or sends it back

Important line to say:

`ODT helps prepare and govern the work, but final acceptance stays human-controlled.`

## How Overrides Happen

If a reviewer wants something changed:

1. add reviewer notes in ODT Workspace
2. add a stage override if a specific stage needs steering
3. click `Update & Re-analyze`
4. review the refreshed outputs
5. delegate only when the path looks right

If the returned work misses something:

1. review the diff
2. note the gap
3. refine the request or override
4. re-run or re-delegate

This is how human judgment remains active throughout the flow.

## Accessibility Talking Points

Keep accessibility simple and practical in the video.

Do not say only `we support WCAG`.
Show what that means in the workflow.

### For the Feature Story

Say:

`When ODT plans the Employee Finder feature, it does not only think about the visual controls. It also carries accessibility expectations such as keyboard access, clear labels, and understandable result updates.`

### For the Defect

Say:

`This defect is also an accessibility issue because the interface suggests a form is ready when it is not. ODT helps make sure validation behavior, focus guidance, and status messaging stay aligned with accessibility expectations.`

### Simple Accessibility Examples to Mention

- keyboard users should be able to reach and use the filter controls
- screen-reader users should get meaningful labels and status context
- invalid form fields should communicate errors clearly
- button state should match actual form readiness

## Recommended Recording Setup

Before recording:

1. close notifications and unrelated windows
2. keep browser zoom around 110 to 125 percent if needed
3. keep only these surfaces ready:
   - one title slide from the PPT
   - live demo app
   - ODT Workspace
   - ODT Review Dashboard
4. record in 16:9 at 1080p if possible
5. keep the mouse movement slow and intentional

## Recommended Video Order

This order is the strongest for judges:

1. title slide
2. live app before-state
3. feature story in ODT Workspace
4. seven-stage review outputs
5. human review and override
6. defect ticket in ODT
7. execution handoff and human acceptance point
8. close with value statement

Do not spend too long on slides.
The product should appear quickly.

## 5-Minute Demo Plan

## 0:00 to 0:08 - Branded Opening

### What to Show

- one clean title slide from the PPT

### What to Say

`Oracle Developer Twin is a governed Digital Worker that helps teams move from a requirement to a review-ready implementation path with AI assistance and human approval.`

### Why This Works

It gives immediate context without delaying the live product demo.

## 0:08 to 0:35 - Show the Current App

### What to Show

- open the live demo app
- show the employee list
- show that `Employee Finder` is not present
- show the form with the `Submit` button enabled even before the form is valid

### What to Say

`Here is the current starting point. We have a working employee app, but one feature is missing and one defect is visible. The Employee Finder section is not available yet, and the Submit button is enabled even when required fields are incomplete.`

### Why This Works

Anyone can understand the before-state immediately.

## 0:35 to 1:25 - Introduce the Real Problem

### What to Show

- keep the app visible briefly
- then switch to ODT Workspace

### What to Say

`In real delivery work, the challenge is not only writing code. Teams need to understand the request clearly, identify the right files to change, consider testing and accessibility, and review the output safely before accepting it.`

`Oracle Developer Twin helps with that planning and governance so the team can move faster with more confidence.`

## 1:25 to 2:10 - Feature Story in ODT Workspace

### What to Show

- paste the feature story for `Add Employee Finder to the home page`
- show the target repo path
- show reviewer guidance input
- click or reference `Run digital worker`

### What to Say

`For the feature request, ODT turns a simple work item into structured planning. It hardens the requirement, finds the likely impact in the repository, and prepares the work so the next step is clear and reviewable.`

## 2:10 to 2:55 - Show the Seven-Stage Flow

### What to Show

- ODT Review Dashboard
- highlight intake, impact, design, code workpack, unit tests, compliance, and verify

### What to Say

`Instead of relying on one large prompt, ODT breaks the work into seven governed stages. That makes the flow easier to understand, easier to review, and easier to refine when needed.`

`This is also where accessibility is built in. The planning includes quality expectations such as keyboard support, clear labels, and understandable validation and status behavior.`

## 2:55 to 3:25 - Show Human Review and Override

### What to Show

- reviewer notes area in ODT Workspace
- mention `Stage Overrides`
- mention `Update & Re-analyze`

### What to Say

`Human review happens here before execution. A reviewer can add notes, refine a specific stage, and ask ODT to re-analyze before anything is delegated. This keeps the workflow governed instead of fully automatic.`

## 3:25 to 4:05 - Defect Story

### What to Show

- switch back to the app
- point again to the enabled `Submit` button
- then show the defect ticket text in ODT

### What to Say

`Now we switch to a defect. The Submit button is enabled even when the form is not valid. That is a quality issue and also an accessibility issue, because the interface is giving the wrong readiness signal.`

`ODT handles defects with the same governed workflow: clear problem statement, impact analysis, testing expectations, accessibility considerations, and human review before acceptance.`

## 4:05 to 4:35 - Delegation and Acceptance

### What to Show

- execution handoff area
- `reports/odt/execute/prompt.md` if useful
- explain the path to Codex or Cline

### What to Say

`After the plan is reviewed, ODT can delegate the approved execution path to an agent such as Codex or Cline. But this is not auto-accept. The returned work is still reviewed by a human before it is accepted.`

`That is the key balance: AI helps accelerate the work, while humans keep control of the outcome.`

## 4:35 to 5:00 - Close Strong

### What to Show

- ODT dashboard or title slide

### What to Say

`Oracle Developer Twin helps teams stay closer to requirements, reduce repetitive effort, keep accessibility and review in the workflow, and deliver with human judgment still at the center.`

## Full Spoken Script

Use this as the clean spoken version if you want one continuous narration.

`Oracle Developer Twin is a governed Digital Worker that helps teams move from a requirement to a review-ready implementation path with AI assistance and human approval.`

`Here is the current starting point. We have a working employee app, but one feature is missing and one defect is visible. The Employee Finder section is not available yet, and the Submit button is enabled even when required fields are incomplete.`

`In real delivery work, the challenge is not only writing code. Teams need to understand the request clearly, identify the right files to change, consider testing and accessibility, and review the output safely before accepting it. Oracle Developer Twin helps with that planning and governance so the team can move faster with more confidence.`

`For the feature request, ODT turns a simple work item into structured planning. It hardens the requirement, finds the likely impact in the repository, and prepares the work so the next step is clear and reviewable.`

`Instead of relying on one large prompt, ODT breaks the work into seven governed stages. That makes the flow easier to understand, easier to review, and easier to refine when needed. This is also where accessibility is built in. The planning includes quality expectations such as keyboard support, clear labels, and understandable validation and status behavior.`

`Human review happens here before execution. A reviewer can add notes, refine a specific stage, and ask ODT to re-analyze before anything is delegated. This keeps the workflow governed instead of fully automatic.`

`Now we switch to a defect. The Submit button is enabled even when the form is not valid. That is a quality issue and also an accessibility issue, because the interface is giving the wrong readiness signal. ODT handles defects with the same governed workflow: clear problem statement, impact analysis, testing expectations, accessibility considerations, and human review before acceptance.`

`After the plan is reviewed, ODT can delegate the approved execution path to an agent such as Codex or Cline. But this is not auto-accept. The returned work is still reviewed by a human before it is accepted.`

`Oracle Developer Twin helps teams stay closer to requirements, reduce repetitive effort, keep accessibility and review in the workflow, and deliver with human judgment still at the center.`

## Short Backup Script

Use this if you need a tighter version during recording.

`Oracle Developer Twin helps convert a requirement into a governed, review-ready path for implementation. In this demo, we show one missing feature and one visible defect. ODT analyzes the request, identifies impacted areas, prepares design, code, test, compliance, and verification guidance, and keeps human review in control before and after delegation. The result is faster, clearer, and more trustworthy delivery with accessibility included from the start.`
