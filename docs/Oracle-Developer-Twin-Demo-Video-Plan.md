# Oracle Developer Twin Demo Video Plan

## Goal

Produce a 2 to 3 minute `.mp4` demo video that proves:

- ODT is a Digital Worker
- OCA is used in the execution flow
- the developer remains in control
- the solution is already demoable today

## Target Length

2:30 is ideal

## Recording Format

- 1920x1080
- landscape
- `.mp4`
- clear zoom level
- one browser window and one terminal window only

## Recommended Recording Tool

- QuickTime screen recording on macOS
- export as `.mov` if needed, then convert to `.mp4`

Example conversion:

```bash
ffmpeg -i input.mov -vcodec libx264 -acodec aac output.mp4
```

## Video Flow

### Scene 1 - Title Card (0:00 to 0:10)

Show:

- first slide of the hackathon deck

Voiceover:

"Oracle Developer Twin is a governed Digital Worker for software delivery."

### Scene 2 - ODT Workspace Overview (0:10 to 0:35)

Show:

- `reports/odt/fedit.html`
- hero
- intake panel
- delivery workflow

Voiceover:

"This is ODT Workspace. It is the main control surface where a developer enters a requirement, runs the digital worker, reviews evidence, and delegates implementation."

### Scene 3 - Ticket Intake (0:35 to 0:55)

Show:

- paste or highlight the work item
- target repo path
- reviewer additions area

Voiceover:

"The flow starts with structured intake. The developer can also add reviewer notes or stage-specific guidance before rerunning analysis."

### Scene 4 - Run Digital Worker (0:55 to 1:20)

Show:

- click `Run digital worker`
- workflow progress
- generated sections below

Voiceover:

"ODT runs a seven-stage workflow across intake, impact, design, code, tests, compliance, and verification."

### Scene 5 - Review Evidence (1:20 to 1:55)

Show:

- `Outcome Snapshot`
- `Prompt Provider Status`
- `Execution Health`
- `Review Surface`

Voiceover:

"The key point is that ODT does not hide the work. It produces explainable evidence, ranked impact areas, and reviewable artifacts before any implementation is accepted."

### Scene 6 - Human Review Path (1:55 to 2:10)

Show:

- `Human Review Path` callout in the dashboard
- reviewer additions / deletions

Voiceover:

"Human review is explicit. If a reviewer wants changes, they add notes here, rerun the flow, and only then delegate."

### Scene 7 - Delegate to Agent / OCA (2:10 to 2:30)

Show:

- `Delegate to Agent`
- terminal with OCA-backed execution session
- response file or status

Voiceover:

"ODT plans and governs. OCA is used in the delegated execution path. The final approval still stays with the developer reviewing the changed files and diffs."

## Final Frame

Show:

- closing slide from the deck

Voiceover:

"Oracle Developer Twin turns AI into a governed Digital Worker for software delivery."

## Pre-Recording Checklist

1. Start local services with `./run-local.sh`
2. Confirm ODT dashboards load
3. Confirm the demo target repo is ready
4. Use browser zoom around 90% to 100%
5. Close unrelated apps, tabs, and notifications
6. Keep one clean terminal window ready

## Submission Advice

If time is tight:

- record the video without voice first
- then either add voiceover or submit with concise captions

The most important thing is to keep the flow clear, clean, and believable.
