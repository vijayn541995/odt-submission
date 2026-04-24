# Demo Verification Notes

## App Shell

- Verify the browser tab shows the robo-face favicon for the Digital Worker app.

## Filtering

- Verify typing in search filters employee cards by name/email/title/code.
- Verify department dropdown limits results to selected team.
- Verify clear button resets search and department filters.
- Verify only 10 employee cards are shown per page.
- Verify `Next` and `Previous` paginate results correctly.

## Form Validations

- Verify the `Submit Employee Form` button stays disabled until every required field is completed.
- Verify the `Submit Employee Form` button remains disabled when email format is invalid or summary is shorter than 20 trimmed characters.
- Verify required field errors appear for empty submit.
- Verify invalid email shows inline validation error.
- Verify summary less than 20 chars is rejected.
- Verify summary with exactly 20 chars is accepted.
- Verify summary with leading/trailing whitespace still validates based on trimmed content.
- Verify checkbox must be checked before submit.

## Submission Behavior

- Verify successful submit shows success status message.
- Verify browser console logs submitted payload object.
- Verify payload preview section updates with latest submission.

## Accessibility

- Verify keyboard users can tab through all controls.
- Verify moving focus away from an invalid required field announces the inline error and marks the field invalid.
- Verify failed submit returns focus to the first invalid control.
- Verify labels are associated with each input/select/textarea.
- Verify validation errors are announced (alert role + aria-invalid).
