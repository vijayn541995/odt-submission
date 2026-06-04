# ODT Workbench Oracle Standards & Agent Operating Guide

## Purpose

This document is intended to be stored as a Markdown reference file and provided to Codex, Cline, or other implementation agents when working on ODT Workbench or any developer workflow automation.

The goal is to make ODT Workbench work like a governed developer assistant that can:

- accept requirements, Jira details, and repository paths
- analyze the existing codebase and architecture
- detect impacted files and missing requirements
- ask clarifying questions before implementation
- draft a technical design
- plan implementation and tests
- check accessibility, VPAT, WCAG, Section 508, security, compliance, and dependency rules
- support human review and re-drafting
- prepare PR-ready output

ODT Workbench should be an AI-governed engineering workflow system, not only a dashboard, not only a chatbot, and not only an agent runner.

The current implementation direction adds a first-class Standards & Governance Layer. Every non-trivial workflow should pass standards review before write execution and before PR readiness. Standards review must create evidence for accessibility, security, dependency policy, testing, UX consistency, performance, maintainability, and approval status.

Controlled flexibility is allowed: teams may override theme details, page titles, UI wording, non-critical warning handling, repo-specific commands, and review templates when the decision is documented. Hard safety blockers remain enforced: frontend secrets, destructive actions, unapproved dependency installs, unknown/disallowed licenses, and write/delegate actions without approval.

After implementation, agents or developers must record implementation evidence before PR readiness. Evidence must include changed files, commands run, test outcomes, implementation notes, and any skipped verification or accepted risk. PR readiness must be blocked when this evidence is missing, failed tests are unaddressed, review blockers remain open, or dependency requests are unresolved.

The backend must derive the current workflow state from evidence and expose it to the UI and agent contracts. Agents should treat this derived state as authoritative for next action, blockers, completed milestones, and allowed transitions.

---

## 1. Reference Links Found in Oracle Knowledge Sources

These references were found from Oracle Central Confluence search. Access depends on Oracle permissions. SharePoint search did not return reliable broad matches for the requested standards, so Confluence is the stronger reference source for now.

### Redwood / Theme / UX

| Topic | Reference |
|---|---|
| Redwood Developer Resources | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=1910550758 |
| ERPM Redwood Resources | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=13211439633 |
| Microsoft 365 for Oracle Sales Redwood UX | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=19432361167 |

### Accessibility / VPAT / WCAG / Section 508

| Topic | Reference |
|---|---|
| Non-Legal Response Text - Accessibility / WCAG / VPAT | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=15223546098 |
| Legal, Non-Product Response Text, Oracle Health | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=18308093657 |
| FA-OAG 3.1 WCAG 2.1 Accessibility Standards | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=2164624229 |
| Oracle Accessibility Standards | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=469184941 |
| Oracle Health Accessibility Office Hours / WCAG references | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=9175501392 |

### Definition of Done / Quality Gates

| Topic | Reference |
|---|---|
| 26C Definition of Done | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=19946348469 |
| ASRIX - CICD Pipeline - OCI DevOps | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20244308543 |

### PR Templates / Code Review

| Topic | Reference |
|---|---|
| Pull Request Template | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=13619005936 |
| Pull Request Description Template | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=14408682167 |
| Pull Request Review Checklist for NRB/Cutsheet Team | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=15932397372 |
| RMS Code Review Checklist Templates | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=19219859898 |
| Pull Request: Checklist | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=12822657692 |
| Pull Requests, Backports, Code Reviews, and All Things GIT | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=63378171 |

### Security / OSSA / Compliance

| Topic | Reference |
|---|---|
| Oracle Software Security Assurance - OSSA Process | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=16581504949 |
| Healthelife Oracle Health OSSA Alignment | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20350989615 |
| Platinum and MAA Engineering Security Management Plans | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=18139361153 |
| Architecture Review | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=2339995259 |

### 3PL / Open Source / License Approval

| Topic | Reference |
|---|---|
| Open Source Software Approval and Usage Policy | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20468328947 |
| Open Source Approval Policy | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=374846934 |
| Thirdparty Business approvals for Open source software | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=13745679414 |
| ASEP Services 3 PL Libraries | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=7486215935 |
| New Sample Code or Open Source Projects | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=113505751 |

### MCP / Jira / Knowledge Integrations

| Topic | Reference |
|---|---|
| MCP POCs | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20468315324 |
| Model Context Protocol Servers - Internal Guide | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20468315354 |
| Jira MCP Server with Cline | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=19843747468 |
| Jira MCP Server | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=19038109924 |
| Set up Jira MCP server for Codex | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=19970360051 |
| Configuring Jira and Confluence MCP servers | https://confluence.oraclecorp.com/confluence/pages/viewpage.action?pageId=20468318137 |

---

## 2. Product Direction

ODT Workbench should help developers move from requirement intake to PR-ready implementation.

The application should support this lifecycle:

```text
Requirement / Jira / Repo Input
        -> Requirement Analysis
        -> Repo and Pattern Analysis
        -> Impacted File Detection
        -> Gap and Clarification Questions
        -> Technical Design Draft
        -> Accessibility / Security / Compliance Review
        -> Implementation Plan
        -> Developer Approval
        -> Agent Handover to Codex / Cline
        -> Code Implementation
        -> Implementation Evidence Capture
        -> Post-Implementation Standards Check
        -> Automated Test + Coverage Plan
        -> Review Comments
        -> Re-draft / Rework
        -> Final QA + Acceptance Mapping
        -> PR-ready Summary
```

The core operating model:

```text
AI assists and recommends.
Developer reviews and approves.
Backend governs and records.
Codex / Cline implements.
ODT Workbench orchestrates the workflow.
```

### 2.1 Governed Workflow States

Agents and UI surfaces should use the backend-derived workflow state instead of inventing page-local gate logic.

Supported MVP states:

```text
INTAKE_STARTED
REQUIREMENT_ANALYZED
REPO_ANALYZED
TECH_DESIGN_DRAFTED
STANDARDS_REVIEW_PENDING
PLAN_REVIEW
STANDARDS_REVIEW_PASSED
APPROVED_TO_WRITE
IMPLEMENTING
IMPLEMENTATION_EVIDENCE_RECORDED
POST_IMPLEMENTATION_REVIEW
PR_READY
BLOCKED
```

Rules:

```text
Delegate only when canDelegateWrite is true.
Record implementation evidence only when canRecordImplementationEvidence is true.
Prepare PR-ready output only when canPreparePr is true or when generating a blocked review report.
Treat block_implementation as active until a newer write approval is captured.
Keep dependency installs separate from write approval.
Use the decision trail to explain current blocker or readiness state before asking for another action.
```

---

## 3. Required Intake Inputs

When starting a new work item, ODT Workbench should request the following.

### 3.1 Target Repo

Required information:

```text
Target repo path:
Base branch:
Target branch name:
Package manager:
Can ODT run commands:
Can ODT modify files:
Can ODT create branch:
Can ODT prepare PR:
Can ODT raise PR:
```

Example:

```text
Repo path: /Users/vn105957/Desktop/my-project
Base branch: main
Target branch: feature/odt-guide-chat
Allowed commands: npm test, npm run build
Write access: only after approval
PR creation: prepare PR text only for now
```

Write approval must be current. If a new standards review is generated after approval, the previous approval no longer unlocks write/delegate mode until the developer reviews the latest findings and records a fresh approval or controlled override.

### 3.2 Requirement / Jira

The app should accept:

```text
Jira ID
Jira title
Jira description
Acceptance criteria
Design notes
API samples
Screenshots
Priority
Target release
Owner
Dependencies
```

If requirement details are missing, the agent must not start coding. It should first ask clarifying questions.

### 3.3 Company Standards / Docs

The developer should provide links or files when available for:

```text
Coding standards
Accessibility / WCAG / VPAT / Section 508 guidance
Security checklist
Compliance checklist
PR template
Definition of Done
3PL / open-source license policy
Approved tool boundaries
Team-specific architecture docs
```

If these are not provided, the agent should use the standard fallback checklist in this file and clearly say:

```text
No team-specific standard was provided. Applying ODT Workbench baseline standards.
```

---

## 4. Allowed Tool Boundaries

ODT Workbench must not assume it has permission to perform all actions.

### 4.1 Default Mode

Default mode must be read-only.

Allowed by default:

```text
Read repo structure
Analyze files
Summarize requirements
Draft technical design
Draft implementation plan
Draft test plan
Draft PR description
Suggest impacted files
Suggest package dependencies
```

Not allowed by default:

```text
Modify files
Install packages
Run destructive commands
Create branches
Push commits
Raise PRs
Update Jira
Post comments to Jira
Modify Confluence
Delete files
```

### 4.2 Approval Required

Human approval is required for:

```text
Writing files
Running build/test commands if command safety is unclear
Installing dependencies
Creating branches
Committing changes
Pushing changes
Raising PRs
Updating Jira
Writing to external systems
Using MCP write tools
```

### 4.3 Blocked by Default

These should be blocked unless explicitly enabled by policy:

```text
Deleting repository files
Deleting Jira tickets/comments
Changing production configuration
Running database migrations against non-local environments
Publishing packages
Deploying services
Changing secrets
Changing permissions
```

---

## 5. Developer Workflow

### 5.1 Requirement Analysis

The agent must produce:

```text
Requirement summary
User story interpretation
Functional requirements
Non-functional requirements
Assumptions
Open questions
Missing acceptance criteria
Frontend impact
Backend impact
Data model impact
API impact
Testing impact
Accessibility impact
Security impact
Performance impact
```

Required clarifying questions when applicable:

```text
Should this action be synchronous or asynchronous?
What roles are allowed to perform this action?
What should happen on partial failure?
What is the expected empty state?
What is the expected loading state?
What is the expected validation message?
Should this data be persisted?
Is audit history required?
Should this be accessible from keyboard only?
Are there localization requirements?
```

### 5.2 Repo and Codebase Analysis

Before drafting an implementation plan, the agent should inspect the repo and detect:

```text
Frontend framework
Backend framework
Build tool
Package manager
Test framework
Linting setup
Formatting setup
Folder structure
Architecture pattern
State management pattern
API client pattern
Validation pattern
Error handling pattern
Logging pattern
Component naming convention
Service naming convention
Existing reusable components
Existing tests
Accessibility helpers
Security utilities
Configuration pattern
```

Output format:

```markdown
## Repo Analysis

### Detected Stack
- Frontend:
- Backend:
- Build tool:
- Package manager:
- Test framework:
- Styling:

### Existing Patterns
- API pattern:
- Component pattern:
- State pattern:
- Validation pattern:
- Error handling pattern:
- Test pattern:

### Likely Impacted Files
- file 1
- file 2

### Files to Review Only
- file 1
- file 2
```

### 5.3 Gap Analysis

The agent must identify gaps before implementation.

Required gap categories:

```text
Requirement gaps
Design gaps
API contract gaps
Data validation gaps
Accessibility gaps
Security gaps
Performance gaps
Test coverage gaps
Error handling gaps
Dependency/license gaps
Operational gaps
```

Example:

```text
Gap: API response schema is not defined.
Recommendation: Define success/error response contract before backend implementation.

Gap: Empty state is not specified.
Recommendation: Add message and CTA for empty result state.

Gap: Accessibility behavior for modal focus is not specified.
Recommendation: Define focus entry, focus trap, escape behavior, and focus return.
```

### 5.4 Technical Design Draft

The agent must draft a technical design before coding.

Template:

```markdown
# Technical Design

## Requirement Summary

## Scope

## Out of Scope

## Existing Architecture Observed

## Proposed Architecture

## Impacted Files

## API Changes

## Data Model Changes

## Frontend Changes

## Backend Changes

## Validation Rules

## Error Handling

## Accessibility / VPAT / WCAG / Section 508 Considerations

## Security and Compliance

## Performance Considerations

## Reusability and Maintainability

## Test Strategy

## Rollback Plan

## Open Questions

## Approval Required Before Implementation
```

---

## 6. Oracle Redwood-like Theme and UX Guidelines

ODT Workbench should follow a modern Oracle Redwood-like enterprise UX direction.

The UI should feel:

```text
Calm
Professional
Spacious
Task-oriented
Readable
Governed
Human-in-control
Enterprise-ready
```

The UI should not feel:

```text
Flashy
Experimental
Neon-styled
Chatbot-only
Overloaded
Autonomous without review
Developer-hostile
```

### 6.1 Layout Standard

Use a stable enterprise shell:

```text
Top Header
Left Navigation
Main Work Area
Optional Right Details Drawer
```

Recommended navigation:

```text
Overview
Intake
Planner
Agent Team
Review
Artifacts
ODT Guide
Runs
Monitoring
Settings
```

V1 navigation may be smaller:

```text
Overview
Intake
ODT Guide
Agent Team
Runs
Settings
```

### 6.2 Page Structure

Each page should include:

```text
Page title
Short description
Primary action
Secondary action if needed
Main content
Status metadata
Helpful empty/loading/error state
```

Example:

```text
Page: Planner
Description: Review and approve the implementation plan before write actions.
Primary action: Approve for Write
Secondary action: Request Changes
```

### 6.3 Visual Style

Use:

```text
Warm off-white or light gray app background
White cards
Soft borders
Subtle shadows
Medium rounded corners
Readable typography
Restrained color usage
Clear spacing
Status badges with text
```

Avoid:

```text
Too many gradients
Large color blocks
Icon-only actions
Crowded tables
Dense dashboards
Color-only status
Unlabeled AI output
```

### 6.4 Component Guidelines

Recommended reusable components:

```text
AppShell
TopHeader
SideNav
PageHeader
MetricCard
StatusBadge
ActionBar
DataTable
RightDrawer
Timeline
ChatPanel
PromptStarter
ApprovalGate
UsageBadge
ProviderStatus
EmptyState
ErrorState
LoadingState
ReviewPanel
```

Status labels:

```text
Draft
Needs Review
Approved
Running
Blocked
Failed
Done
Ready for PR
Read-only
Fallback
Configured
Missing Config
```

### 6.5 AI-Specific UX

AI actions must be transparent.

Every AI-generated output should show:

```text
Generated by
Provider
Model if safe to show
Prompt template
Context used
Confidence if applicable
Review required
Next actions
```

Use labels such as:

```text
AI-generated suggestion
Needs review
Based on repo analysis
Based on Jira context
Local fallback response
OCI GenAI response
```

AI must not silently perform write actions.

Required flow:

```text
AI suggests
Developer reviews
Developer approves
Backend executes
System records event
```

---

## 7. Accessibility Standards

Accessibility is a required engineering quality gate.

Agents must consider:

```text
VPAT impact
WCAG 2.2 considerations
Section 508 considerations where applicable
Oracle Redwood-like UX consistency
```

The agent must not claim official compliance unless reviewed through the proper product accessibility process.

Use this wording:

```text
This implementation includes accessibility considerations and should be reviewed against applicable WCAG 2.2, VPAT, and Section 508 expectations where applicable.
```

### 7.1 VPAT Impact

Flag VPAT impact when a change affects:

```text
New UI screens
New forms
Buttons or actions
Navigation
Tables, grids, or lists
Dialogs, drawers, modals, popovers
Charts or visualizations
Chat interfaces
AI-generated content surfaces
Error messages or validation flows
Upload/download flows
Keyboard interaction
Focus behavior
Screen reader announcements
Color, contrast, or icons
Dynamic updates
Loading states
Empty states
Required field behavior
```

Required VPAT note for UI features:

```text
Accessibility / VPAT Impact:
This change introduces or modifies user-facing UI. It should be reviewed against applicable accessibility standards, including WCAG 2.2 and Section 508 where applicable. The implementation must support keyboard navigation, semantic structure, accessible labels, clear validation messages, focus management, and sufficient color contrast.
```

For backend-only work:

```text
Accessibility / VPAT Impact:
No direct UI impact identified. Accessibility impact is limited unless backend responses affect UI labels, messages, validation, error states, or generated content.
```

### 7.2 WCAG 2.2 Practical Checklist

#### Perceivable

Check:

```text
Readable text
Sufficient contrast
No color-only status
Meaningful icons have labels
Meaningful images have alt text
Decorative images hidden from assistive tech
Form errors visible and associated
Loading/success/warning/error states clear
```

#### Operable

Check:

```text
Keyboard access
Logical tab order
Visible focus
No keyboard trap
Dialogs/drawers trap focus
Focus returns after close
No hover-only actions
Timeouts communicated where applicable
```

#### Understandable

Check:

```text
Clear titles
Clear headings
Clear instructions
Descriptive buttons
Specific validation messages
Required fields marked
AI output marked as suggestion
Next actions clear
```

#### Robust

Check:

```text
Semantic HTML
Native controls preferred
Correct heading hierarchy
Correct button/link semantics
Valid ARIA only when needed
Dynamic updates announced when important
No clickable divs/spans unless fully accessible
```

### 7.3 Section 508 Considerations

Section 508 may apply in government, regulated, public-sector, or enterprise procurement contexts.

Agents should not make legal compliance claims.

Practical checks:

```text
Keyboard accessibility
Screen reader compatibility
Text alternatives for meaningful images/icons
Labels for form controls
Clear error identification
Sufficient contrast
No color-only indicators
Accessible tables
Accessible dialogs/modals
Predictable navigation
Meaningful headings
Assistive technology compatibility
```

Required note:

```text
Section 508 Consideration:
This feature includes user-facing UI and should support Section 508-aligned accessibility expectations where applicable, including keyboard access, screen reader compatibility, visible focus, labels, error identification, and non-color-only status communication.
```

### 7.4 Accessibility by UI Pattern

#### Forms

Required:

```text
Visible labels
Required field indication
Validation messages
Error association with fields
Logical tab order
Submit/loading/success/error state
```

#### Buttons

Required:

```text
Clear action text
Keyboard accessible
Visible focus
No icon-only action without accessible label
Disabled/loading state clear
```

Good labels:

```text
Approve for Write
Generate Plan
Retry with Local Fallback
Save Artifact
```

Avoid:

```text
OK
Go
Click
Checkmark-only labels
```

#### Tables

Required:

```text
Column headers
Accessible row actions
Text-based status
Empty state
Loading state
Error state
Pagination/filter labels
```

#### Dialogs / Drawers

Required:

```text
Accessible title
Focus moves inside on open
Focus trapped while open
Escape behavior defined
Focus returns after close
Clear primary/secondary actions
```

#### Chat Interfaces

Required:

```text
Accessible message input label
Keyboard-accessible send button
Empty message validation
Loading state
Error state with retry
User and assistant messages clearly separated
AI-generated label
Copy/save actions with accessible labels
```

---

## 8. Security and Compliance Standards

Agents must consider security before implementation.

Required checks:

```text
No secrets in React
No OCI credentials in frontend
No hardcoded model IDs, endpoints, or compartment IDs
No raw sensitive prompt logging unless approved
Input validation
Output encoding
Authentication/authorization boundaries
Role checks where applicable
Rate limiting
Safe error messages
Dependency/license review
No unapproved packages
No destructive action without approval
Audit logging for AI/tool actions
```

### 8.1 Frontend Security Rules

React must never contain:

```text
OCI private keys
API keys
Bearer tokens
Tenancy OCID if sensitive
User OCID
Fingerprint
Compartment OCID unless approved
Raw config profile
Secrets
Internal service credentials
```

React may show safe status only:

```text
Configured
Missing
Disabled
Invalid
Test failed
Local fallback active
```

### 8.2 Backend Security Rules

Backend owns:

```text
OCI authentication
Provider routing
Prompt templates
Rate limits
Audit logging
Fallback handling
Tool configuration
MCP access
Validation
Secrets
```

Backend must return safe error messages.

Bad:

```text
OCI request failed: private key file /Users/.../secret.pem not found
```

Good:

```text
OCI provider is not configured. Continue with local fallback or update backend settings.
```

### 8.3 MCP / Jira / Knowledge Tool Rules

Default:

```text
Read-only
Disabled unless configured
Audited
Limited result size
Timeout enforced
```

Allowed if configured:

```text
Read Jira details
Summarize Jira
Search knowledge docs
Analyze code context
Prepare comments
Draft updates
```

Approval required:

```text
Post Jira comment
Update Jira status
Create ticket
Modify docs
Write to external systems
```

Blocked by default:

```text
Delete Jira issue/comment
Delete Confluence page
Modify permissions
Run destructive tool action
```

---

## 9. Dependency and 3PL / Open Source Governance

No new dependency should be installed without explicit developer approval.

Preferred licenses:

```text
MIT
Apache-2.0
BSD-style licenses, if approved by policy
```

Avoid unless explicitly approved:

```text
GPL
AGPL
LGPL
Unknown license
Commercial license
Unmaintained packages
Packages with high/critical vulnerabilities
Packages with unclear transitive dependencies
```

### Dependency Approval Request Template

```markdown
## Dependency Approval Request

Package:
Version:
License:
Purpose:
Used by:
Runtime or dev dependency:
Alternatives considered:
Can this be implemented without new dependency:
Security/vulnerability check:
Transitive dependency concern:
Approval needed from:
Developer decision:
```

### Agent Rule

Before installing a package, the agent must say:

```text
This requires a new dependency. Installation is blocked until approved.
```

---

## 10. Implementation Quality Standards

Code should be:

```text
Readable
Maintainable
Small and focused
Consistent with existing patterns
Easy to test
Reusable where appropriate
Strongly typed where project supports types
Validated at boundaries
Safe on errors
Accessible by design
Performant enough for expected use
```

### Naming

Follow repo conventions first.

If no convention is detected:

```text
Components: PascalCase
Hooks: useSomething
Utilities: camelCase
Constants: UPPER_SNAKE_CASE
Files: follow existing folder convention
API methods: verb + noun
Tests: match source file name
```

### Reusability

Prefer:

```text
Existing shared components
Existing API client wrappers
Existing validators
Existing layout patterns
Existing test helpers
```

Avoid:

```text
Duplicate logic
One-off components that should be shared
Hardcoded strings everywhere
Large unstructured files
Over-engineering
```

---

## 11. Performance Standards

Agents must consider:

```text
Avoid unnecessary re-renders
Avoid large blocking operations in UI
Use pagination/limits for large data
Debounce search inputs where needed
Show loading states
Avoid fetching more data than needed
Cache carefully if existing pattern supports it
Use backend filtering when possible
Avoid repeated AI calls for same user action
Enforce timeout and retry limits
```

For AI:

```text
Limit input size
Summarize context before sending if large
Log latency
Show fallback option on timeout
Avoid sending unnecessary sensitive data
```

---

## 12. Error Handling and Messaging

Every feature should handle:

```text
Loading
Success
Empty
Validation error
Network error
Server error
Timeout
Unauthorized
Forbidden
Fallback mode
Partial success
```

Good error message pattern:

```text
What happened.
Why it matters.
What user can do next.
```

Example:

```text
The AI provider timed out after 30 seconds.
Your request was not lost. You can retry or continue with local fallback.
```

---

## 13. Validation Standards

Validate at both frontend and backend where appropriate.

Frontend validation:

```text
Required fields
Basic format checks
Max length guidance
Immediate user feedback
```

Backend validation:

```text
Required fields
Type checks
Length limits
Enum validation
Authorization checks
Business rules
Input sanitization
```

Standard API error shape:

```json
{
  "status": "ERROR",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Assessment name is required.",
    "details": [
      {
        "field": "name",
        "message": "Name is required."
      }
    ]
  }
}
```

---

## 14. Test Planning Standards

The agent must produce a test plan before implementation.

Coverage categories:

```text
Statement coverage
Branch coverage
Function coverage
Line coverage
Positive scenarios
Negative scenarios
Boundary scenarios
Error scenarios
Accessibility scenarios
Security scenarios
Regression scenarios
```

### Backend Test Checklist

```text
Valid request succeeds
Missing field returns validation error
Invalid type returns validation error
Oversized input rejected
Unauthorized request blocked where applicable
Provider timeout handled
Fallback provider used when configured
Usage event logged
No secrets returned in settings API
Error response is safe
```

### Frontend Test Checklist

```text
Page renders
Primary action works
Input validation works
Loading state shown
Error state shown
Empty state shown
Retry works
Status is text-based
Keyboard navigation works
Focus state visible
No icon-only unlabeled controls
```

### Accessibility Test Checklist

```text
Keyboard-only navigation
Focus visibility
Labels on inputs
Error message association
Required field behavior
Button/link semantics
Dialog/drawer focus behavior
Color not only indicator
Screen reader label sanity check
Loading/error/empty states
```

---

## 15. PR Readiness Standards

Before PR, the agent must generate:

```text
PR title
PR summary
Linked Jira
Scope
Out of scope
Files changed
Implementation details
Implementation evidence id
Commands run
Test outcomes
Testing done
Accessibility notes
Security notes
Performance notes
Dependency notes
Risk/rollback notes
Screenshots if UI
Known limitations
Follow-up items
```

ODT should generate this through the PR Readiness Command Center after implementation evidence is recorded. The output must be reviewable and copyable as Markdown. ODT should not raise or update an external PR unless the developer explicitly approves that integration path.

### PR Template

```markdown
# PR Summary

## Problem Statement

## Solution Summary

## Scope

## Out of Scope

## Linked Jira

## Files Changed

## Backend Changes

## Frontend Changes

## Data / Config Changes

## Accessibility / VPAT / WCAG / Section 508 Notes

## Security / Compliance Notes

## Dependency / 3PL Notes

## Testing Performed

## Implementation Evidence

## Coverage Notes

## Screenshots / UX Notes

## Risks

## Rollback Plan

## Reviewer Notes

## Checklist
- [ ] Requirement reviewed
- [ ] Repo patterns followed
- [ ] Technical design prepared
- [ ] Implementation plan approved
- [ ] No secrets exposed
- [ ] No unapproved dependencies added
- [ ] Accessibility considered
- [ ] Error/loading/empty states handled
- [ ] Tests added/updated
- [ ] Build/test commands run or documented
- [ ] Implementation evidence recorded
- [ ] Failed/skipped tests resolved or accepted as risk
- [ ] PR summary prepared
```

---

## 16. Agent Handover Template

Use this template when handing work to Codex/Cline.

```markdown
# Agent Handover

## Objective

## Execution Target

Codex / Cline / Manual

## Delegation Mode

Read-only / Write-approved

## Handoff Run Evidence

Run id:
Standards check id:
Approval evidence:
Dependency install status:
Allowed actions:
Next step:

## Required Return Evidence After Implementation

Changed files:
Commands run:
Test outcomes:
Implementation summary:
Skipped checks or known risks:

## Requirement / Jira

## Repo Path

## Base Branch

## Current Architecture Observed

## Existing Patterns to Follow

## Scope

## Out of Scope

## Files Likely Impacted

## Files to Review Only

## Technical Design Summary

## Backend Tasks

## Frontend Tasks

## Data / API Tasks

## Accessibility Requirements

## Security Requirements

## Performance Requirements

## Validation Requirements

## Error Handling Requirements

## Test Plan

## Dependency Rules
- Do not install new packages without approval.
- Only free/open-source packages are allowed.
- MIT or Apache-2.0 preferred.
- Follow Oracle 3PL approval process if applicable.

## Tool Boundaries
- Read repo first.
- Ask before writing.
- Ask before running commands if unsafe.
- Ask before installing dependencies.
- Do not push or raise PR unless explicitly approved.
- Treat write approval as valid only when it was recorded after the latest standards review.
- Treat open blocker review comments as delegation blockers until resolved, accepted as risk, or sent back for rework.

## Acceptance Criteria

## Review Checklist
```

---

## 17. ODT Workbench Governance States

Use these states for workflows:

```text
INTAKE_STARTED
REQUIREMENT_ANALYZED
REPO_ANALYZED
CLARIFICATION_REQUIRED
TECH_DESIGN_DRAFTED
PLAN_REVIEW
APPROVED_TO_WRITE
IMPLEMENTING
IMPLEMENTATION_EVIDENCE_RECORDED
POST_IMPLEMENTATION_REVIEW
REVIEWING
TESTING
READY_FOR_PR
DONE
FAILED
BLOCKED
```

Write actions are only allowed after:

```text
APPROVED_TO_WRITE
```

Open review blockers still hold the workflow even after write approval. A developer must resolve the blocker, accept the risk with notes, or request rework before Codex/Cline receives a write-approved handoff.

Review comment statuses:

```text
open
resolved
accepted_risk
```

Requesting rework should create a blocker review comment, draft a revised design and implementation plan, and run a fresh standards check so older write approval is treated as stale.

---

## 18. Required Final Implementation Plan Format

Before implementation, generate:

```markdown
# Final Implementation Plan

## Requirement Summary

## Scope

## Out of Scope

## Assumptions

## Open Questions

## Existing Repo Patterns

## Impacted Files

## Backend Plan

## Frontend Plan

## Data / API Plan

## Validation Plan

## Accessibility Plan

## Security / Compliance Plan

## Dependency / 3PL Plan

## Performance Plan

## Test Plan

## Rollback Plan

## Agent Handover

## Approval Required
```

---

## 19. Final Agent Instruction Summary

Agents must follow this operating model:

```text
1. Read requirement.
2. Read repo.
3. Detect architecture and patterns.
4. Identify impacted files.
5. Identify gaps.
6. Ask clarifying questions if needed.
7. Draft technical design.
8. Include accessibility, security, performance, test, and 3PL considerations.
9. Draft implementation plan.
10. Ask for approval before write actions.
11. Implement with Codex/Cline only after approval.
12. Run tests if allowed.
13. Summarize changes.
14. Prepare PR-ready output.
```

Mandatory rule:

```text
Do not skip design and review gates for non-trivial work.
Do not expose secrets.
Do not install dependencies without approval.
Do not claim accessibility/compliance certification without formal review.
Do not silently write to external systems.
```

---

## 20. Short Version for Agents

```text
ODT Workbench is a governed developer workflow assistant. For every real work item, analyze the requirement and repo first, identify gaps and impacted files, ask clarifying questions, draft a technical design, include accessibility/security/performance/test/3PL considerations, then produce an implementation plan. Only after human approval can files be changed. Follow existing repo patterns, keep code readable and maintainable, avoid unapproved dependencies, keep AI/tool actions transparent, and prepare PR-ready output with test and compliance notes.
```
