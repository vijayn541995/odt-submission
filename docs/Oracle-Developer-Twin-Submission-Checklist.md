# Oracle Developer Twin Submission Checklist

## Required Uploads

1. Presentation Deck
2. Demo Video
3. Codebase

## Deck

Primary deck:

- `docs/Oracle-Developer-Twin-Hackathon-Submission-Template-Deck.pptx`

Backup polished deck:

- `docs/Oracle-Developer-Twin-Hackathon-Deck.pptx`

Presenter script:

- `docs/Oracle-Developer-Twin-Hackathon-Template-Presenter-Script.md`

## Demo Video

Recording plan:

- `docs/Oracle-Developer-Twin-Demo-Video-Plan.md`

Recommended final filename:

- `Oracle-Developer-Twin-Demo.mp4`

## Codebase

Recommended upload artifact:

- `submission/Oracle-Developer-Twin-Codebase.zip`

## Supporting Documents

- `docs/Oracle-Developer-Twin-User-Guide.md`
- `docs/Oracle-Developer-Twin-Technical-Handout.md`
- `docs/Oracle-Developer-Twin-Architecture-Note.md`
- `docs/OCI-GenAI-7-Stage-Prompt-Wiring.md`

## Final Functional Checks

1. ODT Workspace loads
2. ODT Review Dashboard loads
3. `reports/dev-twin/intake.json` matches the final demo story
4. `reports/odt/execute/prompt.md` matches the same story
5. demo target repo still shows:
   - Oracle logo
   - 300 employees
   - 10-record pagination
   - `Submit Employee Form`
   - success message and payload preview

## Packaging Rules

- exclude `node_modules`
- exclude `.git`
- exclude `.DS_Store`
- exclude temp folders and runtime logs where not needed
- keep docs, source, reports, and the demo target repo

## Final Message To Remember

ODT is strongest when presented as:

- a governed Digital Worker
- using OCA in the execution path
- with optional OCI prompt generation
- keeping human review mandatory
