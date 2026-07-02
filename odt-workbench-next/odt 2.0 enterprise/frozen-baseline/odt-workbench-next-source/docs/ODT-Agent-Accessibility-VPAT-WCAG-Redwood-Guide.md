# Accessibility, VPAT, Section 508, WCAG 2.2, and Redwood UX Standards Guide

## Purpose

This guide defines accessibility and UX expectations that agents must follow when analyzing, planning, reviewing, or implementing UI changes in ODT Workbench or related applications.

Agents must treat accessibility as a required engineering quality gate, not as an optional cleanup step.

For full Oracle standards, tool boundaries, 3PL/dependency governance, PR readiness, and agent handoff format, use [ODT-Oracle-Standards-Agent-Operating-Guide.md](./ODT-Oracle-Standards-Agent-Operating-Guide.md) as the canonical guide.

This guide is intended for:

- Requirement analysis
- Technical design planning
- UI implementation planning
- Code review
- QA planning
- PR readiness checks
- Agent handoff instructions

## Core Principle

All UI work must be designed and implemented so that users can complete the workflow using:

- Keyboard
- Screen reader
- Mouse
- Touch or pointer input
- High contrast or accessible visual settings where applicable
- Clear labels, messages, and predictable navigation

Agents must not assume that visual design alone is sufficient.

## 1. VPAT Impact

### What VPAT Means

VPAT stands for Voluntary Product Accessibility Template. It is commonly used to document how a product supports accessibility requirements such as WCAG and Section 508.

Agents must not claim that a feature is "VPAT compliant" unless it has gone through the official product accessibility review process.

Instead, agents should say:

> This feature has accessibility considerations that may impact VPAT reporting and should be reviewed against applicable accessibility standards.

### When VPAT Impact Should Be Flagged

Flag VPAT impact when a change affects:

- New UI screens
- New forms
- New buttons or actions
- New navigation patterns
- Tables, grids, or lists
- Dialogs, drawers, modals, or popovers
- Charts, dashboards, or visualizations
- Chat interfaces
- AI-generated content surfaces
- Error messages or validation flows
- Upload/download flows
- Keyboard interaction
- Focus behavior
- Screen reader announcements
- Color, contrast, or icons
- Dynamic updates
- Loading states
- Empty states
- Required-field behavior

### VPAT Review Questions

Agents should ask:

- Does this feature introduce new user interaction?
- Can the workflow be completed fully by keyboard?
- Are all controls properly labeled?
- Are errors clearly described and associated with fields?
- Does dynamic content announce important changes?
- Are icons supported by visible text or accessible labels?
- Are dialogs and drawers focus-managed?
- Are tables/grids accessible?
- Is color used as the only way to communicate state?
- Is the feature consistent with existing accessibility behavior?
- Does this change need product accessibility review?

### Required VPAT Note In Technical Design

For any UI-facing feature, include:

```text
Accessibility / VPAT Impact:
This change introduces or modifies user-facing UI. It should be reviewed against applicable accessibility standards, including WCAG 2.2 and Section 508 where applicable. The implementation must support keyboard navigation, semantic structure, accessible labels, clear validation messages, focus management, and sufficient color contrast.
```

For non-UI backend-only work, include:

```text
Accessibility / VPAT Impact:
No direct UI impact identified. Accessibility impact is limited unless backend responses affect UI labels, messages, validation, error states, or generated content.
```

## 2. WCAG 2.2 Considerations

### General Rule

Agents must design and review frontend work against WCAG 2.2 principles:

- Perceivable
- Operable
- Understandable
- Robust

Agents do not need to memorize every WCAG criterion, but they must apply practical engineering checks.

### 2.1 Perceivable

Users must be able to perceive information through more than one sensory channel.

Requirements:

- Text must be readable and not too small.
- Text and UI controls must have sufficient color contrast.
- Do not use color alone to communicate meaning.
- Icons must have visible labels or accessible names.
- Images that convey meaning must have alt text.
- Decorative images must be hidden from assistive technology.
- Form errors must be visible and programmatically associated.
- Loading, success, warning, and error states must be clear.

Examples:

Bad:

```text
A field border turns red with no error text.
```

Good:

```text
The field shows: "Assessment name is required."
The message is associated with the input.
```

Bad:

```text
A status is shown only using green/red color.
```

Good:

```text
Status shows text and color: Completed, Failed, Needs Review.
```

### 2.2 Operable

Users must be able to operate the UI using keyboard and assistive technology.

Requirements:

- All interactive controls must be reachable by keyboard.
- Tab order must be logical.
- Visible focus indication must be present.
- Buttons, links, inputs, menus, tabs, drawers, and dialogs must support keyboard usage.
- Modals/drawers must trap focus while open.
- Focus must return to the triggering element when a modal/drawer closes.
- No keyboard trap should exist.
- Do not rely only on hover.
- Timeouts must be communicated and extendable where applicable.

Keyboard expectations:

| Component | Expected Keyboard Behavior |
| --- | --- |
| Button | Tab to focus, Enter/Space to activate |
| Link | Tab to focus, Enter to activate |
| Modal/Dialog | Focus moves inside; Esc closes if allowed |
| Drawer | Focus moves inside; returns on close |
| Tabs | Arrow keys if implemented as tabs |
| Menu | Arrow keys and Escape behavior if implemented |
| Form | Logical tab order; submit button reachable |
| Chat input | Keyboard send behavior must not block normal typing |

Agent review checklist:

- Can the full workflow be completed without mouse?
- Is focus visible at all times?
- Does focus move predictably after submit, error, modal open, and modal close?
- Are disabled controls handled correctly?
- Are tooltips and hover-only actions also available by keyboard?

### 2.3 Understandable

Users must understand the UI, instructions, errors, and expected actions.

Requirements:

- Use clear page titles.
- Use clear section headings.
- Use descriptive button names.
- Avoid vague labels like "Click here", "Submit", or "OK" without context.
- Error messages must explain what went wrong and how to fix it.
- Required fields must be identified.
- Form validation should be specific.
- AI-generated recommendations must be clearly marked as suggestions, not facts.

Good error message examples:

Bad:

```text
Invalid input.
```

Good:

```text
Assessment name is required. Enter a name before continuing.
```

Bad:

```text
Failed.
```

Good:

```text
The AI provider timed out after 30 seconds. You can retry or continue with local fallback.
```

AI-specific understandability:

AI output must clearly show:

- What was generated
- What context was used
- Whether review is required
- What action the user can take next
- Whether the output may be incomplete or uncertain

Use labels like:

- AI-generated suggestion
- Needs review
- Based on available context
- Confidence: Low / Medium / High

Do not present AI output as final truth without review.

### 2.4 Robust

The UI must work reliably across browsers, assistive technologies, and future changes.

Requirements:

- Use semantic HTML whenever possible.
- Prefer native controls before custom controls.
- Use correct heading hierarchy.
- Use correct button/link semantics.
- Do not use `div` or `span` as buttons unless fully accessible.
- Ensure dynamic updates are announced when needed.
- Avoid fragile DOM-only behavior.
- Ensure ARIA attributes are valid and necessary.
- Do not add ARIA that conflicts with native semantics.

Prefer:

```html
<button>Save plan</button>
<a href="/runs">View runs</a>
<label for="assignmentName">Assignment name</label>
<input id="assignmentName" name="assignmentName" />
```

Avoid:

```html
<div onclick="save()">Save</div>
<span role="button">Submit</span>
```

Only use ARIA when native HTML cannot express the behavior.

## 3. Section 508 Considerations

### When Section 508 Applies

Section 508 may apply when software is used in contexts requiring accessibility compliance for government, public-sector, regulated, or enterprise procurement scenarios.

Agents should not make legal compliance claims. Instead, agents should ensure implementation supports common Section 508-aligned accessibility expectations.

### Practical Section 508 Checks

Agents should verify:

- Keyboard accessibility
- Screen reader compatibility
- Text alternatives for meaningful images/icons
- Proper labels for form controls
- Clear error identification and instructions
- Sufficient contrast
- No color-only indicators
- Accessible tables
- Accessible dialogs/modals
- Predictable navigation
- Meaningful page titles and headings
- Consistent UI behavior
- Compatibility with assistive technology

### Required Section 508 Note

For UI features:

```text
Section 508 Consideration:
This feature includes user-facing UI and should support Section 508-aligned accessibility expectations where applicable, including keyboard access, screen reader compatibility, visible focus, labels, error identification, and non-color-only status communication.
```

For backend-only features:

```text
Section 508 Consideration:
No direct Section 508 UI impact identified unless backend data is rendered in UI messages, labels, validation errors, or generated content.
```

## 4. Oracle Redwood-Like UX Consistency

### Design Direction

ODT Workbench should follow a modern Oracle Redwood-like enterprise UX approach:

- Calm
- Spacious
- Task-oriented
- Readable
- Consistent
- Minimal visual noise
- Clear actions
- Human-in-control AI behavior
- Enterprise-grade review and governance

The UI should not feel like a flashy chatbot or experimental AI demo. It should feel like a professional engineering workbench.

### Redwood-Like UX Principles

1. Task-oriented layout

Each page should answer:

- What is the user doing here?
- What is the current state?
- What is the recommended next action?
- What needs review?

2. Clear page structure

Use:

- Page title
- Short description
- Primary action
- Secondary actions
- Main content area
- Status/metadata where useful

Example:

```text
Page: Planner
Description: Review and approve the implementation plan before write actions.
Primary action: Approve for Write
Secondary action: Request Changes
```

3. Calm visual hierarchy

Use:

- Simple cards
- Clear headings
- Subtle borders
- Consistent spacing
- Minimal colors
- Status badges
- Tables only where useful
- Avoid cluttered dashboards

4. Consistent navigation

Use a stable left navigation:

- Overview
- Intake
- Planner
- Agent Team
- Review
- Artifacts
- ODT Guide
- Runs
- Monitoring
- Settings

The user should always know where they are.

5. Clear status language

Use understandable statuses:

- Draft
- Needs Review
- Approved
- Running
- Blocked
- Failed
- Done
- Ready for PR
- Read-only
- Fallback
- Configured
- Missing Config

Avoid technical-only statuses unless shown in details.

6. Human approval gates

For AI or agent actions:

```text
AI suggests -> User reviews -> User approves -> Backend executes -> System records audit event
```

UI must clearly show when an action requires approval.

7. Safe AI interaction

AI-generated content must be visibly marked.

Use labels:

- AI-generated
- Needs review
- Based on repo analysis
- Based on Jira context
- Local fallback response
- OCI GenAI response

Do not hide provider/fallback status from the user.

## 5. Accessibility Requirements By UI Pattern

### Forms

Forms must include:

- Visible labels
- Required field indication
- Helpful placeholder only as supplemental text
- Field-level validation
- Error messages near the field
- Summary error message for large forms if needed
- Logical tab order
- Submit button state
- Loading state after submit

Checklist:

- [ ] Every input has a visible label.
- [ ] Required fields are clearly marked.
- [ ] Error messages explain how to fix the issue.
- [ ] Error messages are programmatically associated with fields.
- [ ] Submit is keyboard accessible.
- [ ] Loading and success states are clear.

### Buttons

Buttons must:

- Use clear action text.
- Be keyboard accessible.
- Have visible focus.
- Not rely on icon alone.
- Clearly show disabled/loading state.

Good:

- Approve for Write
- Generate Plan
- Retry with Local Fallback
- Save Artifact

Bad:

- OK
- Go
- Click
- Checkmark-only button

### Links

Use links for navigation and buttons for actions.

Good:

```html
<a href="/runs">View runs</a>
<button>Generate plan</button>
```

Bad:

```html
<a onclick="generatePlan()">Generate plan</a>
```

### Tables And Grids

Tables must include:

- Clear column headers
- Meaningful row actions
- Sort/filter controls with labels
- Empty state
- Loading state
- Error state
- Keyboard-accessible actions

Checklist:

- [ ] Table has column headers.
- [ ] Row actions have descriptive labels.
- [ ] Status is not color-only.
- [ ] Empty state explains what to do next.
- [ ] Pagination/filter controls are accessible.

### Dialogs, Modals, And Drawers

Dialogs and drawers must:

- Move focus inside when opened.
- Trap focus while open.
- Return focus to triggering control when closed.
- Have accessible title.
- Support Escape close where appropriate.
- Provide clear primary/secondary actions.

Checklist:

- [ ] Dialog has a title.
- [ ] Focus moves into dialog.
- [ ] Focus does not escape unintentionally.
- [ ] Escape behavior is defined.
- [ ] Focus returns after close.
- [ ] Buttons have clear labels.

### Chat Interfaces

Chat UI must include:

- Label for message input
- Clear send button
- Loading state while waiting
- Error state with retry
- Keyboard-friendly interaction
- Screen-reader-friendly message updates where feasible
- Distinction between user and assistant messages
- AI-generated content label
- Copy/save actions with accessible labels

Checklist:

- [ ] Message input has accessible label.
- [ ] Send button is keyboard accessible.
- [ ] Empty messages cannot be submitted.
- [ ] Loading state is announced or visible.
- [ ] Error state includes retry option.
- [ ] AI response is marked as AI-generated.
- [ ] Long responses remain readable.

### Loading States

Loading states must:

- Tell the user what is happening.
- Avoid layout jumps where possible.
- Not trap the user.
- Provide timeout/error state if request fails.

Good:

- Generating implementation plan...
- Analyzing repository structure...
- Checking accessibility impact...

Bad:

```text
Loading...
```

### Error States

Error states must:

- Be visible.
- Be understandable.
- Explain the next action.
- Avoid leaking sensitive technical details.
- Include retry or fallback where possible.

Example:

```text
Unable to reach OCI GenAI provider.
The Workbench is using local fallback mode.
You can continue or update provider settings.
```

### Empty States

Empty states must:

- Explain why the area is empty.
- Suggest the next step.
- Include an action when useful.

Example:

```text
No AI usage events yet.
Ask ODT Guide a question to generate the first usage event.
[Open ODT Guide]
```

## 6. Implementation Rules For Agents

Agents must follow these rules when generating or modifying UI code.

Required:

- [ ] Use semantic HTML wherever possible.
- [ ] Use clear labels for all form fields.
- [ ] Ensure all controls are keyboard accessible.
- [ ] Add visible focus states.
- [ ] Provide loading, empty, error, and success states.
- [ ] Do not rely on color alone.
- [ ] Use readable status text.
- [ ] Add accessible names for icon-only controls.
- [ ] Keep AI actions reviewable and transparent.
- [ ] Keep React free of secrets and provider credentials.
- [ ] Follow existing project naming conventions.
- [ ] Reuse existing components/patterns where available.

Avoid:

- [ ] Do not use clickable `div`/`span` elements.
- [ ] Do not create icon-only actions without labels.
- [ ] Do not hide errors in console only.
- [ ] Do not use placeholder text as the only label.
- [ ] Do not create hover-only interactions.
- [ ] Do not remove focus outline without replacement.
- [ ] Do not make AI outputs look final without review.
- [ ] Do not introduce new packages without approval.

## 7. Testing Requirements

### Accessibility Test Planning

Agents should include accessibility tests/checks in the test plan.

Minimum checks:

- [ ] Keyboard-only navigation
- [ ] Focus visibility
- [ ] Form labels
- [ ] Error message behavior
- [ ] Required field behavior
- [ ] Button/link semantics
- [ ] Dialog/drawer focus behavior
- [ ] Color not used as only indicator
- [ ] Screen reader label sanity check where possible
- [ ] Loading/error/empty states

### Unit / Component Test Examples

For frontend:

- [ ] Renders page title.
- [ ] Renders accessible form labels.
- [ ] Send button is disabled for empty chat input.
- [ ] Loading state appears during API call.
- [ ] Error message appears on failed API call.
- [ ] Retry action is available.
- [ ] Status badge displays text, not color only.
- [ ] Approval button is hidden/disabled until required state.

For backend-driven UI data:

- [ ] Validation errors return user-safe messages.
- [ ] Missing fields return structured error response.
- [ ] Oversized input is rejected.
- [ ] AI provider timeout returns controlled response.
- [ ] Secrets are not returned in settings API.

## 8. PR Checklist

Every PR with UI impact should include:

```markdown
## Accessibility / UX Checklist

- [ ] Keyboard navigation verified
- [ ] Visible focus states preserved
- [ ] Semantic HTML used where possible
- [ ] Form fields have visible labels
- [ ] Error messages are clear and actionable
- [ ] Status is not communicated by color alone
- [ ] Loading, empty, error, and success states handled
- [ ] Dialog/drawer focus behavior considered
- [ ] AI-generated content is clearly labeled
- [ ] No secrets or provider credentials exposed in React
- [ ] No unapproved package added
- [ ] VPAT/WCAG/Section 508 impact considered
- [ ] Redwood-like UX consistency maintained
```

## 9. Standard Accessibility Notes For Technical Design

Use this in every design document:

```markdown
## Accessibility / VPAT / WCAG / Section 508 Considerations

This feature must follow accessibility-first implementation practices. Any user-facing UI must support keyboard navigation, visible focus indicators, semantic structure, accessible labels, clear error handling, non-color-only status indicators, and understandable loading/empty/error states.

This change may have VPAT impact if it introduces or modifies user-facing workflows, forms, controls, dialogs, tables, chat surfaces, or dynamic content. The implementation should be reviewed against applicable WCAG 2.2 and Section 508 expectations where applicable.

The UI should remain consistent with Oracle Redwood-like enterprise UX principles: calm layout, clear hierarchy, task-oriented flows, readable content, consistent navigation, clear status language, and human-in-control AI interactions.
```

## 10. Agent Instruction Summary

Agents must follow this summary before making UI changes.

Before implementation:

1. Identify whether the change has UI impact.
2. Identify VPAT/WCAG/Section 508 considerations.
3. Identify affected screens, forms, controls, and workflows.
4. Check existing UI patterns and reuse them.
5. Ask clarifying questions if accessibility behavior is unclear.

During implementation:

1. Use semantic HTML.
2. Provide labels, focus states, validation messages, and keyboard support.
3. Add loading, error, empty, and success states.
4. Keep AI actions transparent and reviewable.
5. Avoid unapproved dependencies.

Before PR:

1. Verify keyboard navigation.
2. Verify labels and error messages.
3. Verify no color-only status.
4. Verify no secrets in frontend.
5. Document accessibility impact and test coverage.
