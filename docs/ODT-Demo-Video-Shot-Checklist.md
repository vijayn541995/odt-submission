# ODT Demo Video Shot-by-Shot Checklist

Keep this file open on your second monitor while recording.

## Best Recording Method

Use local screen recording on your Mac, not a Zoom call recording.

Recommended:

- record the screen directly
- speak live into the mic if you feel comfortable
- if needed, record the screen first and add voiceover in a second pass

Why this is better than Zoom:

- cleaner video
- no meeting UI
- better readability
- better control over timing
- easier final export for submission

## Quick Setup

1. Close notifications and extra windows.
2. Keep these ready:
   - one title slide
   - live app
   - ODT Workspace
   - ODT Review Dashboard
3. On Mac, press `Cmd + Shift + 5`.
4. Choose screen recording.
5. Turn microphone on.
6. Record in full screen.

## Shot Checklist

### Shot 1

- Show: title slide
- Pause: 5 seconds
- Say: `Oracle Developer Twin helps turn a requirement into a governed, review-ready delivery path with AI assistance and human approval.`

### Shot 2

- Show: live app at `http://127.0.0.1:4174/`
- Action: slowly show the page top, employee list, and request form
- Pause: 2 seconds on the missing area and 2 seconds on the form button
- Say: `Here is the current starting point. One feature is missing, and one defect is visible. Employee Finder is not present, and the Submit button is enabled even when the form is not ready.`

### Shot 3

- Show: ODT Workspace at `http://127.0.0.1:8080/reports/odt/fedit.html`
- Action: paste the feature story
- Pause: 2 seconds after pasting
- Say: `ODT starts by taking the work item and turning it into a clearer, governed plan before any implementation is delegated.`

### Shot 4

- Show: target repo path and reviewer note area
- Action: point to review controls
- Pause: 2 seconds
- Say: `A human reviewer can refine the request here, add review guidance, or steer a specific stage before execution.`

### Shot 5

- Show: run or generated outputs
- Action: move to the review dashboard
- Pause: 2 seconds
- Say: `Instead of using one large prompt, ODT breaks the work into reviewable stages such as impact, design, code, tests, compliance, and verification.`

### Shot 6

- Show: ODT Review Dashboard at `http://127.0.0.1:8080/reports/odt/index.html`
- Action: highlight intake, impact, design, tests, compliance, and verify
- Pause: 1 to 2 seconds per section
- Say: `This makes the workflow easier to understand, easier to review, and easier to improve before code is accepted.`

### Shot 7

- Show: reviewer notes, stage overrides, or re-analyze flow
- Pause: 2 seconds
- Say: `Human review happens before delegation. The reviewer can add notes, override a stage if needed, and ask ODT to re-analyze the plan.`

### Shot 8

- Show: live app again
- Action: focus on the request form and the enabled Submit button
- Pause: 2 seconds
- Say: `Now we switch to a defect. The button is enabled even when required fields are not valid. That is a quality issue and also an accessibility issue because the interface gives the wrong readiness signal.`

### Shot 9

- Show: ODT Workspace with the defect ticket
- Pause: 2 seconds
- Say: `ODT handles defects through the same governed process, with expected behavior, impacted files, testing expectations, accessibility guidance, and review checkpoints.`

### Shot 10

- Show: execution handoff or `reports/odt/execute/prompt.md`
- Pause: 2 seconds
- Say: `After the plan is reviewed, ODT can delegate the approved execution path to an agent such as Codex or Cline.`

### Shot 11

- Show: review dashboard or execution area
- Pause: 2 seconds
- Say: `Final acceptance still stays with the human. The returned diff is reviewed, refined if needed, and only then accepted.`

### Shot 12

- Show: ODT dashboard or title slide
- Pause: 4 seconds
- Say: `Oracle Developer Twin helps teams stay close to requirements, reduce repetitive work, keep accessibility in the workflow, and deliver with human judgment still at the center.`

## If You Want the Simplest Recording Style

Use this approach:

1. Record the screen locally.
2. Speak while recording.
3. If you make a mistake, pause for 2 seconds and repeat the line.
4. Trim the start and end after recording.

## If You Feel Nervous Speaking Live

Use this safer approach:

1. Record the full screen flow silently.
2. Play it back once.
3. Add a voiceover in a second pass.

This usually gives the cleanest final result when time is short.
