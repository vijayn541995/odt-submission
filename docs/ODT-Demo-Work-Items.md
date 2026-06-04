# ODT Demo Work Items

Use these two work items during the hackathon demo.

## Feature Story: Employee Finder

### Business Story
As a team lead or operations user,
I want an Employee Finder panel on the home page,
so that I can quickly find employees by key identity fields and narrow the list by department without leaving the page.

### Demo Prompt / Primary Requirement
Add an Employee Finder panel to the home page using the attached mockup. The panel should support search by employee name, email, role, or employee code, support department filtering, display filtered and total result counts, and preserve keyboard and screen-reader usability.

### Mockup Reference
- [employee-finder-mockup.png](/Users/vn105957/Desktop/odt-submission/docs/demo-assets/employee-finder-mockup.png)

### Acceptance Criteria
1. Add an `Employee Finder` section on the home page aligned with the attached mockup.
2. Provide a search field with helpful placeholder guidance such as employee name, email, role, or employee code.
3. Provide a department filter dropdown with a default `All departments` option.
4. Provide `Apply Filters` and `Clear Filters` actions.
5. Show filtered result count and total result count in the finder header.
6. Filtering must update the visible employee list without leaving the page.
7. Keyboard users must be able to reach, operate, and clear all controls.
8. Screen-reader users must receive clear labels, control names, and understandable result updates.
9. No new dependencies should be introduced.

### Non-Functional Expectations
- Accessibility aligned to Oracle guidance / WCAG expectations
- Deterministic unit-test coverage for filtering behavior
- Minimal blast radius in the existing React demo app

### Suggested Reviewer Note
Keep the implementation visually close to the mockup, but prioritize semantic HTML, keyboard access, and clear status messaging over pixel-perfect duplication.

## Defect Story: Submit Button Enabled Too Early

### Defect Summary
The employee request form currently shows the `Submit` button as enabled even when mandatory fields are incomplete or validation errors are present.

### Observed Behavior
Without filling all mandatory fields, the primary button remains enabled and suggests the form is ready to submit.

### Expected Behavior
The `Submit` button should remain disabled until all required fields are valid and the form is actually submittable.

### Demo Prompt / Defect Requirement
Fix the defect where the `Submit` button is enabled before mandatory fields are valid. Keep validation messaging consistent, preserve keyboard and screen-reader behavior, and ensure the button state reflects true form readiness.

### Acceptance Criteria
1. The primary button remains disabled until all required fields are complete and valid.
2. Validation messaging stays visible and understandable for invalid inputs.
3. Button state must stay consistent with actual form readiness.
4. Keyboard flow and screen-reader behavior must remain intact.
5. Unit tests should cover invalid, valid, and transition states.

### Suggested Reviewer Note
Please verify both visual button state and behavioral submittability so the UI does not imply readiness before the form is truly valid.
