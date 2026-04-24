# ODT React Demo Target

This is a hackathon-ready React demo app used as the ODT target repository.

## What This Demo Includes

- Mock employee data from `https://jsonplaceholder.typicode.com/users`
- Expanded dataset to 300 employees from mock API seed data
- Automatic fallback local employee seed dataset if API is unavailable
- Pagination (10 employees per page) with `Previous` and `Next` controls
- Employee request form with:
  - required field validation messages
  - email format validation
  - minimum summary-length validation
  - accessibility-friendly inline errors
  - intentionally broken submit-button enablement for defect demo use
- Success confirmation after submit
- Console logging of submitted form payload
- Live payload preview panel in UI

## Run Locally

```bash
cd demo-target-repo
npm install
npm run dev
npm test
```

Open:

- `http://127.0.0.1:5173`

## ODT Demo Notes

In ODT Workspace:

1. Set `Target Repo Path` to this folder.
2. Run digital worker to generate impact/workpacks.
3. Delegate to agent for implementation/fixes.

## Suggested Story and Defect Demo

Use this pairing when you want to show ODT handling both feature delivery and defect fixing:

### Story

`Title`: Add Employee Finder to the home page

Expected scope:

- restore an Employee Finder panel above the employee list
- search by name, email, role, or employee code
- department filtering
- apply and clear filter actions
- visible, filtered, and total employee counts
- preserved keyboard and screen-reader behavior

### Defect

`Title`: Submit button is enabled before mandatory fields are valid

Current demo state:

- the button label is `Submit`
- the button remains enabled even when required fields are empty or invalid
- inline validation errors can still appear, which makes the defect obvious in the UI

Expected fix:

- button stays disabled until mandatory fields are complete and valid
- button becomes disabled again if a required field becomes empty or invalid
- validation and disabled-state messaging remain accessible

This gives you a strong “story + defect -> ODT plan -> governed execution -> review -> verify” demo path.

For the paste-ready work items and the full video sequence, use:

- `../docs/ODT-Demo-Feature-Defect-Video-Plan.md`
