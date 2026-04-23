# ODT React Demo Target

This is a hackathon-ready React demo app used as the ODT target repository.

## What This Demo Includes

- Mock employee data from `https://jsonplaceholder.typicode.com/users`
- Expanded dataset to 300 employees from mock API seed data
- Automatic fallback local employee seed dataset if API is unavailable
- Search + department filtering UI
- Pagination (10 employees per page) with `Previous` and `Next` controls
- Validated request form with:
  - required field validation
  - email format validation
  - minimum summary-length validation
  - accessibility-friendly inline errors
- Success confirmation after submit
- Console logging of submitted form payload
- Live payload preview panel in UI

## Run Locally

```bash
cd demo-target-repo
npm install
npm run dev
```

Open:

- `http://127.0.0.1:5173`

## ODT Demo Notes

In ODT Workspace:

1. Set `Target Repo Path` to this folder.
2. Run digital worker to generate impact/workpacks.
3. Delegate to agent for implementation/fixes.

## Planned Defect Ticket Demo (For Later ODT Fix)

Use this scenario when you want to show ODT bug-fixing:

- Introduce defect manually: in `src/components/EmployeeForm.jsx`, change summary validation threshold from `20` to `200`.
- Resulting bug: valid user summaries fail unexpectedly.
- Then create ODT/Jira defect ticket:

`Title`: Employee request form rejects valid summaries  
`Description`: The form currently blocks submission unless summary text is unrealistically long. Update validation so intended minimum length works and keep existing success + logging behavior.  
`Acceptance Criteria`:
- Form accepts valid summaries >= 20 chars.
- Inline validation remains accessible.
- Success message appears on submit.
- Submitted payload still logs in console.
- No regression in required fields or email validation.

This gives you a strong “introduce defect -> ticket -> ODT plan -> agent fix -> verify” story for hackathon judging.
