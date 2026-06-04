# ODT Demo Scenario: Feature Story, Defect, and Video Plan

## Current Demo Starting State

Use the current `demo-target-repo` app as the intentional before-state for the video:

- the `Employee Finder` section is not shown on the home page
- the employee list is still visible with pagination
- the form button label is `Submit`
- the `Submit` button stays enabled even when required fields are empty or invalid
- inline validation errors can still appear, which makes the defect easy to explain

This gives ODT a clear feature story and a clear defect to analyze.

## Feature Story

### Jira-Style Story

- `Type`: Story
- `Title`: Add Employee Finder to the home page
- `Summary`: Add an Employee Finder panel above the employee list so users can search and filter employees without leaving the page.

### Business Goal

Help users quickly narrow a large employee list by keyword and department while preserving accessibility and keyboard usability.

### Detailed Requirement

Add a new `Employee Finder` section above the employee list on the home page.

The desired section should include:

- a heading: `Employee Finder`
- a count summary on the same row, in the style of `Showing 10 of 300 filtered (300 total)`
- a search input for name, email, role, or employee code
- a department dropdown
- an `Apply Filters` button
- a `Clear Filters` button

### Visual Direction

Use the provided design reference during the demo as the desired future-state visual:

- warm Oracle-themed card styling
- large heading on the left
- count summary on the right
- large rounded input and select controls
- primary `Apply Filters` button and secondary `Clear Filters` button

### Acceptance Criteria

- Users can search employees by name, email, role, or employee code.
- Users can filter employees by department.
- Search and filter work without leaving the page.
- The employee count summary updates to reflect filtered and total results.
- `Clear Filters` resets the search input, department filter, and results state.
- Keyboard users can reach, use, and clear all filter controls.
- Screen-reader users receive meaningful labels and updated result context.
- Existing pagination continues to work with filtered results.
- No backend API changes are introduced.

### Likely Impacted Files

- `demo-target-repo/src/App.jsx`
- `demo-target-repo/src/components/FilterBar.jsx`
- `demo-target-repo/src/components/ActivityList.jsx`
- `demo-target-repo/src/styles.css`
- `demo-target-repo/tests/activity-filter.spec.md`

### Paste-Ready ODT Work Item

```text
Add Employee Finder to the home page above the employee list. Include a keyword search for name, email, role, or employee code, a department filter, Apply Filters and Clear Filters actions, and a count summary like "Showing X of Y filtered (Z total)". Preserve pagination, keyboard behavior, screen-reader clarity, and Oracle accessibility expectations. Use the provided design reference for the visual direction.
```

## Defect Ticket

### Jira-Style Defect

- `Type`: Bug
- `Title`: Submit button is enabled before mandatory fields are valid
- `Severity`: Medium

### Observed Behavior

The `Submit` button is enabled even when required fields are empty or invalid.

Examples:

- requester name is empty
- requester email is invalid
- team or manager is not selected
- summary is missing or too short
- compliance checkbox is not checked

Inline validation errors can still appear, but the button remains enabled.

### Expected Behavior

The `Submit` button should remain disabled until all mandatory fields are complete and valid.

The button should become disabled again if a required field later becomes empty or invalid.

### Reproduction Steps

1. Open the employee request form.
2. Leave one or more required fields empty.
3. Observe that the `Submit` button is still enabled.
4. Trigger validation errors by focusing out of fields or attempting submission.
5. Confirm that errors are shown while the button still appears enabled.

### Acceptance Criteria

- The `Submit` button is disabled when any required field is empty.
- The `Submit` button is disabled when email format is invalid.
- The `Submit` button is disabled when summary length is below the minimum.
- The `Submit` button is disabled when the compliance checkbox is unchecked.
- Disabled-state and validation status messaging remain accessible.
- Focus management and inline error announcements continue to work.

### Likely Impacted Files

- `demo-target-repo/src/components/EmployeeForm.jsx`
- `demo-target-repo/src/components/employeeFormUtils.js`
- `demo-target-repo/tests/employee-form.test.mjs`

### Paste-Ready ODT Work Item

```text
Fix the defect where the Submit button is enabled even when mandatory fields are empty or invalid in the employee request form. Keep the button label as Submit. Preserve inline validation errors, focus management, keyboard behavior, screen-reader support, and existing success handling.
```

## Reviewer Guidance for the Demo

Use this reviewer note in ODT if you want to emphasize governance:

```text
Please keep user-facing copy consistent, preserve keyboard and screen-reader behavior, and update impacted validation or verification assets alongside the code change.
```

## Recommended Demo Video Flow

### Best Opening

Do not spend the first minute on slides.

Recommended opening:

1. start with one branded PPT title slide for 5 to 8 seconds
2. move immediately to the live app before-state
3. then open ODT Workspace and show the governed flow

That gives you branding without losing demo momentum.

### Suggested 5-Minute Sequence

#### 0:00 to 0:08

Show one branded title slide from the PPT.

Voice line:

`Oracle Developer Twin helps developers move from requirement to governed, review-ready execution with AI and human approval working together.`

#### 0:08 to 0:35

Show the current demo app.

Point out:

- the Employee Finder section is currently missing
- the employee list is present
- the `Submit` button is enabled even before the form is valid

Voice line:

`Here is the current before-state. One feature is missing, and one defect is visible in the request form.`

#### 0:35 to 1:40

Open ODT Workspace and paste the feature story.

Show:

- work item entry
- target repo path
- reviewer note area
- run action

Voice line:

`ODT takes the work item, hardens the scope, identifies impacted files, and prepares governed stage outputs before any code is delegated.`

#### 1:40 to 2:30

Show the seven-stage outputs and review surfaces.

Focus on:

- intake
- impact
- tech design
- code workpack
- compliance
- verify

Voice line:

`Instead of one opaque prompt, ODT breaks the work into reviewable stages covering design, code, tests, accessibility, and verification.`

#### 2:30 to 3:10

Show reviewer input and the human approval gate.

Voice line:

`A reviewer can refine the plan before execution, and approval stays human-controlled at the points that matter most.`

#### 3:10 to 4:00

Switch to the defect ticket and show that ODT can also handle bug fixing with the same governed path.

Voice line:

`The same workflow also supports defect resolution. In this case, the form button is enabled even while required validation is failing.`

#### 4:00 to 4:35

Show agent delegation readiness or the execution handoff artifacts.

Focus on:

- `reports/odt/execute/prompt.md`
- execution path to Codex or Cline
- human diff review after execution

Voice line:

`ODT plans and governs the work, OCI can optionally generate stage prompts, OCA-backed execution carries out the implementation path, and the human remains the approval gate.`

#### 4:35 to 5:00

Close with value.

Voice line:

`Oracle Developer Twin helps developers stay close to requirements, accelerate implementation, preserve accessibility and governance, and deliver with human judgment still in control.`

## Recommended Recording Order

Use this order when recording:

1. branded intro slide
2. current app before-state
3. ODT Workspace with feature story
4. ODT review surfaces and human review
5. defect ticket in ODT
6. execution handoff view
7. short closing statement

This is stronger than starting with multiple PPT slides because judges quickly see both the problem and the governed workflow in action.
