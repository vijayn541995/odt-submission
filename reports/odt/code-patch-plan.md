# ODT Code Patch Plan

- Generated At: 2026-04-23T16:20:01.835Z
- Work Item: change the submit request button text to submit employee form

## File-by-file Intent
- src/components/employeeFormUtils.js: apply minimal blast-radius edit based on signals [path:employee, path:form, export:INITIAL_FORM, export:SUBMIT_STATUS_ID, export:normalizeText, export:getFormErrors].
- src/components/EmployeeForm.jsx: apply minimal blast-radius edit based on signals [path:employee, path:form, export:EmployeeForm, preview:form].
- src/data/fallbackEmployees.js: apply minimal blast-radius edit based on signals [path:employee, export:FALLBACK_EMPLOYEES, preview:employee].
- src/components/FilterBar.jsx: apply minimal blast-radius edit based on signals [path:filter, export:FilterBar, preview:filter].
- src/api/fetchEmployees.js: apply minimal blast-radius edit based on signals [path:employee, preview:employee, preview:form].
- src/components/ActivityList.jsx: apply minimal blast-radius edit based on signals [preview:employee].
- src/components/OracleLogo.js: apply minimal blast-radius edit based on signals [repo-ranked].

## Dependency Policy Checks
- noNewDependencies: enforced
- Verify package changes are absent unless explicitly approved.
- Preserve existing APIs and route contracts unless requirement says otherwise.

## Regression Watchpoints
- Validate keyboard interactions and ARIA names for changed UI.
- Validate state transitions in loading, empty, and error paths.
- Re-run impacted unit tests before merge.

## Reviewer Refinements
- No structured reviewer refinements were supplied.

## Prompt Override (Code Stage)
- No code-stage prompt override supplied.

## Active Prompt Overrides
- None

## Source Guidance
- `reports/dev-twin/code-workpack.md` is available and should be followed.

