(function () {
  var MODEL = {"meta":{"generatedAt":"2026-04-23T16:20:01.866Z","profile":"react-js","profileName":"React","workItemType":"feature","workspaceRoot":"/Users/vn105957/Desktop/odt-submission","targetRepoPath":"/Users/vn105957/Desktop/odt-submission/demo-target-repo/"},"designInputs":{"mockupImages":[],"referenceDocs":[]},"reviewEdits":"","promptOverrides":{"intake":"","impact":"","design":"","code":"","unitTests":"","compliance":"","verify":""},"promptOverrideStages":[{"key":"intake","label":"Intake"},{"key":"impact","label":"Impact"},{"key":"design","label":"Tech Design"},{"key":"code","label":"Code Workpack"},{"key":"unitTests","label":"Unit Tests"},{"key":"compliance","label":"Compliance"},{"key":"verify","label":"Verification"}],"ticket":"change the submit request button text to submit employee form","summary":"change the submit request button text to submit employee form · feature","headline":"change the submit request button text to submit employee form","readinessScore":94,"metrics":{"stagesCompleted":"7/7","repoAnalysisMode":"repo_inferred_manifest","candidateFiles":7,"blastRadius":7,"blockers":0,"scopedBlockers":0,"scopedFilesWithA11yFindings":0,"reviewStatus":"ready_for_review","artifactsReady":"7/7","promptProvider":"template","promptFallbacks":0},"steps":[{"id":"analyze","label":"Prompt hardening","detail":"Validate acceptance criteria, constraints, and input completeness."},{"id":"impact","label":"Repository impact scan","detail":"Infer impacted modules, files, and blast radius from the repo."},{"id":"design","label":"Technical design","detail":"Draft implementation guidance, guardrails, and delivery structure."},{"id":"guidance","label":"Code and test guidance","detail":"Produce scoped workpacks for implementation and test updates."},{"id":"a11y","label":"VPAT/WCAG risk check","detail":"Apply Oracle accessibility, keyboard, and compliance guidance."},{"id":"code","label":"Implementation workpack","detail":"Prepare execution-ready prompts for Codex or Cline."},{"id":"review","label":"Human review gate","detail":"Keep release decisions transparent, explainable, and reviewable."}],"promptHardening":{"readinessScore":94,"questions":[{"label":"Acceptance criteria grounded","status":"resolved","detail":"3 acceptance criteria captured"},{"label":"Mockups or visual references","status":"needs_input","detail":"No mockup or image attached; UI intent may drift"},{"label":"Backward compatibility guardrails","status":"resolved","detail":"No-new-dependency constraint enforced"},{"label":"Accessibility expectations","status":"resolved","detail":"A11y explicitly requested in non-functional scope"}],"criteria":["User can filter activities by keyword without leaving the page","Filtering updates are announced clearly for assistive technology users","Keyboard users can open, clear, and navigate filter controls"]},"explainability":[{"title":"Why these modules are in scope","detail":"src/components, src/data, src/api were selected from intake scope and expanded through repo impact analysis."},{"title":"Why these files were selected","detail":"ODT inferred candidate files from the ticket language, acceptance criteria, optional hints, and matching repo paths."},{"title":"Why accessibility is highlighted","detail":"Accessibility rules are tracked but no active findings are loaded."},{"title":"Why these tests are suggested","detail":"No related tests were found; create nearest-module regression coverage."}],"artifacts":[{"label":"Intake","path":"reports/dev-twin/intake.json","status":"ready","note":"Source ticket, constraints, and work item type"},{"label":"Tech Design","path":"reports/odt/tech-design.md","status":"ready","note":"Implementation approach and quality gates"},{"label":"Code Workpack","path":"reports/dev-twin/code-workpack.md","status":"ready","note":"Scoped implementation instructions for Codex/Cline"},{"label":"Unit Test Workpack","path":"reports/dev-twin/unit-test-workpack.md","status":"ready","note":"Happy, edge, and error test scenarios"},{"label":"A11y Prompt","path":"reports/a11y/coding-agent-prompt.md","status":"ready","note":"Oracle VPAT/WCAG + keyboard remediation guidance"},{"label":"Developer Review Plan","path":"reports/odt/developer-review-plan.md","status":"ready","note":"Human-readable phased plan for implementation review"},{"label":"Run Summary","path":"reports/odt/run-summary.md","status":"ready","note":"Review-ready execution audit trail"}],"charts":{"readiness":94,"artifactCompletion":{"ready":7,"missing":0},"topRules":[],"hotspotFiles":[],"repoSignals":[{"label":"Candidate files","value":7},{"label":"Blast radius","value":7},{"label":"Test files","value":0},{"label":"Modules","value":3}]},"promptGeneration":{"generatedAt":"2026-04-23T16:20:01.867Z","provider":"template","model":"","profile":"","region":"","servingType":"ON_DEMAND","summary":{"totalStages":7,"generated":7,"fallback":0,"failed":0},"stages":[{"stage":"intake","label":"Intake","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"impact","label":"Impact","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"compliance","label":"Compliance","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"design","label":"Tech Design","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"code-workpack","label":"Code Workpack","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"test-workpack","label":"Unit Tests","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"verify-summary","label":"Verification","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""}]},"server":{"apiBase":"http://127.0.0.1:4310"},"a11yPrompt":"# Coding Agent Prompt: Accessibility AI Shield (React + Terra)\n\nMode: baseline\n\nYou are an accessibility specialist for React + Terra. Apply only safe fixes for the findings below.\nConstraints:\n- Follow Oracle VPAT guidance (internal Confluence source of truth) first, fallback WCAG 2.1 AA.\n- Do not auto-commit.\n- Keep behavior unchanged except accessibility fixes.\n- If a fix is ambiguous, leave a manual-action note.\n\nScan context:\n- Files scanned: 9\n- Blockers: 0\n- Warnings: 0\n- Info: 0\n- Policy basis: Oracle A11y and VPAT minimums (Derived from APO OAG 3.0 checklist subset; Oracle VPAT guidance is primary.)\n\nManual verification references:\n- reports/a11y/manual-checklist.md\n- reports/odt/compliance-mapping.md\n\nFiles in scope:\n- No file-specific findings in the latest scan.\n\nCurrent posture:\n- No actionable static findings were detected in the latest scan.\n- Continue Oracle VPAT manual evidence checks for focus order, keyboard traps, page title, language, contrast, and other checklist items.\n- Preserve keyboard parity, semantic structure, labels/instructions, and name/role/value behavior for any new or changed UI.\n","reviewPlanMarkdown":"# ODT Developer Review Plan\n\n- Generated At: 2026-04-23T16:20:01.867Z\n- Work Item: change the submit request button text to submit employee form\n- Review Status: ready_for_review\n\n## Executive Summary\nchange the submit request button text to submit employee form should be implemented as a minimal blast-radius change starting with 6 ranked file candidate(s) already inferred from the repository. Dependency policy already indicates no new packages should be introduced.\n\n## Review Workflow\n1. **Confirm intent and guardrails** - Review the intake summary, acceptance criteria, design inputs, and reviewer notes before touching code. Work item type: feature.\n2. **Validate impacted repo surfaces** - Start with the top-ranked candidate files and confirm they match the requested outcome before implementation begins.\n3. **Implement the minimal patch** - Follow the tech design and code workpack, preserve existing contracts, and keep the patch scoped to the smallest safe set of files.\n4. **Verify tests and accessibility** - Update deterministic happy, edge, and error tests, then validate keyboard interactions, semantic controls, and accessibility expectations.\n5. **Complete human review** - Use this plan, the run summary, and generated workpacks as review evidence before delegation approval, patch application, or merge.\n\n## Planned File Actions\n- src/components/employeeFormUtils.js | score=111 | confidence=0.99 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/components/employeeFormUtils.js. | signals=path:employee, path:form, export:INITIAL_FORM, export:SUBMIT_STATUS_ID, export:normalizeText, export:getFormErrors\n- src/components/EmployeeForm.jsx | score=58 | confidence=0.97 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/components/EmployeeForm.jsx. | signals=path:employee, path:form, export:EmployeeForm, preview:form\n- src/data/fallbackEmployees.js | score=30 | confidence=0.5 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/data/fallbackEmployees.js. | signals=path:employee, export:FALLBACK_EMPLOYEES, preview:employee\n- src/components/FilterBar.jsx | score=28 | confidence=0.47 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/components/FilterBar.jsx. | signals=path:filter, export:FilterBar, preview:filter\n- src/api/fetchEmployees.js | score=23 | confidence=0.38 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/api/fetchEmployees.js. | signals=path:employee, preview:employee, preview:form\n- src/components/ActivityList.jsx | score=4 | confidence=0.07 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/components/ActivityList.jsx. | signals=preview:employee\n\n## Reviewer Inputs\n- No reviewer edits supplied.\n\n### Active Prompt Overrides\n- None\n\n## Risk Watchpoints\n- No critical planning risk detected. Keep human-in-loop for merge approvals.\n\n## Approval Checklist\n- Requirement intent matches the planned implementation.\n- No new dependencies are introduced.\n- Candidate-file selection still makes sense after local code review.\n- Unit tests cover happy, edge, and error paths.\n- Keyboard and accessibility behavior remain intact or improve.\n- Final diff is reviewed by a human before merge.\n- Quality gate: No unauthorized dependencies\n- Quality gate: Backward compatibility preserved\n- Quality gate: Keyboard and ARIA behavior validated\n\n## Required Approvals\n- Feature owner approval\n- QA/Test owner approval\n- Accessibility reviewer approval\n\n## Blocking Conditions\n- None\n\n## Supporting Artifacts\n- reports/odt/tech-design.md\n- reports/dev-twin/code-workpack.md\n- reports/dev-twin/unit-test-workpack.md\n- reports/odt/code-patch-plan.md\n- reports/odt/verify-checklist.md\n- reports/odt/run-summary.md\n\n","techDesignMarkdown":"# ODT Tech Design\n\n- Feature: change the submit request button text to submit employee form\n- Target repo: /Users/vn105957/Desktop/odt-submission/demo-target-repo/\n- UI: React/Terra minimal-blast-radius update\n- API strategy: reuse current contracts unless explicitly approved\n- State strategy: incremental updates in existing store/actions\n- Error handling: loading/empty/error states with deterministic behavior\n- Testing: Jest/RTL unit coverage for happy/edge/error paths\n- Accessibility: VPAT/WCAG and keyboard parity validation\n- Governance: human-reviewed approvals before merge\n\n## Prompt Override (Design Stage)\n- No design-stage prompt override supplied.\n\n## Quality Gates\n- No unauthorized dependencies\n- Backward compatibility preserved\n- Keyboard and ARIA behavior validated\n- Deterministic unit tests updated\n","codeWorkpack":"# Codex Workpack: ODT Code Implementation\n\nWork Item: change the submit request button text to submit employee form\n\nYou are a senior frontend developer assistant.\nUse the intake, inferred repo impact, and compliance guidance below to implement a reviewable patch.\n\nExecution steps:\n1) Ask clarifying questions only for safety-critical ambiguities.\n2) Review existing patterns in the inferred source files before editing.\n3) Implement code changes with backward compatibility.\n4) Include keyboard accessibility and semantic HTML by default.\n5) Summarize edge cases and regression risk after patching.\n\nScope summary:\n- src/components (source: 5, tests: 0)\n- src/data (source: 1, tests: 0)\n- src/api (source: 1, tests: 0)\n\nRepo-analysis evidence:\n- Target repo path: /Users/vn105957/Desktop/odt-submission/demo-target-repo/\n- Analysis mode: repo_inferred_manifest\n- Keywords: change, submit, request, button, text, employee, form, filter, activities, keyword, without, leaving, page, filtering, updates, announced, clearly, assistive, technology, users, keyboard, open, clear, navigate\n- Mockup image: none supplied\n- Reference doc: none supplied\n- Candidate file: src/components/employeeFormUtils.js [score=111] exports=INITIAL_FORM, EMAIL_PATTERN, MIN_SUMMARY_LENGTH, TEAM_OPTIONS, FIELD_CONFIG, REQUIRED_FIELDS, SUBMIT_STATUS_ID, normalizeText, hasAllRequiredFields, getFormErrors, isFormSubmittable, getFieldDescribedBy, getSubmitStatusMessage signals=path:employee, path:form, export:INITIAL_FORM, export:SUBMIT_STATUS_ID, export:normalizeText, export:getFormErrors\n- Candidate file: src/components/EmployeeForm.jsx [score=58] exports=EmployeeForm signals=path:employee, path:form, export:EmployeeForm, preview:form\n- Candidate file: src/data/fallbackEmployees.js [score=30] exports=FALLBACK_EMPLOYEES signals=path:employee, export:FALLBACK_EMPLOYEES, preview:employee\n- Candidate file: src/components/FilterBar.jsx [score=28] exports=FilterBar signals=path:filter, export:FilterBar, preview:filter\n- Candidate file: src/api/fetchEmployees.js [score=23] exports=none signals=path:employee, preview:employee, preview:form\n- Candidate file: src/components/ActivityList.jsx [score=4] exports=ActivityList signals=preview:employee\n- Candidate file: src/components/OracleLogo.js [score=1] exports=OracleLogo, ORACLE_LOGO_LABEL signals=path-ranked\n\nReviewer refinements:\n- None supplied\n\nPrompt override (code stage):\n- None supplied\n\nQuality gates to run after implementation:\n- npm run a11y:scan:ci || true\n- npm run a11y:twin:verify\n\nFeature payload:\n```json\n{\n  \"title\": \"change the submit request button text to submit employee form\",\n  \"featureName\": \"change the submit request button text to submit employee form\",\n  \"summary\": \"change the submit request button text to submit employee form\",\n  \"reviewEdits\": \"\",\n  \"promptOverrides\": {\n    \"intake\": \"\",\n    \"impact\": \"\",\n    \"design\": \"\",\n    \"code\": \"\",\n    \"unitTests\": \"\",\n    \"compliance\": \"\",\n    \"verify\": \"\"\n  },\n  \"targetRepoPath\": \"/Users/vn105957/Desktop/odt-submission/demo-target-repo/\",\n  \"workItemType\": \"feature\",\n  \"jira\": {\n    \"ticketId\": \"\",\n    \"url\": \"\"\n  },\n  \"scope\": {\n    \"uiSurface\": \"web\",\n    \"complexity\": \"medium\",\n    \"repoScan\": \"full\"\n  },\n  \"requirements\": {\n    \"acceptanceCriteria\": [\n      \"User can filter activities by keyword without leaving the page\",\n      \"Filtering updates are announced clearly for assistive technology users\",\n      \"Keyboard users can open, clear, and navigate filter controls\"\n    ],\n    \"nonFunctional\": [\n      \"a11y\",\n      \"performance\",\n      \"analytics\"\n    ],\n    \"outOfScope\": [\n      \"No backend API changes\",\n      \"Do not alter existing permissions behavior\"\n    ]\n  },\n  \"designInputs\": {\n    \"mockupImages\": [],\n    \"referenceDocs\": [],\n    \"jiraLinks\": []\n  },\n  \"constraints\": {\n    \"noNewDependencies\": true,\n    \"releaseWindowDays\": 10,\n    \"approvedLibrariesOnly\": true\n  },\n  \"developerHints\": {\n    \"suspectedAreas\": [],\n    \"relatedComponents\": [],\n    \"notes\": \"Optional only. ODT should infer impact areas from the repo when hints are not provided.\"\n  },\n  \"defectContext\": {\n    \"defectId\": \"\",\n    \"observedBehavior\": \"\",\n    \"expectedBehavior\": \"\",\n    \"severity\": \"medium\"\n  }\n}\n```\n\n","testWorkpack":"# Codex Workpack: ODT Unit Test Generation\n\nWork Item: change the submit request button text to submit employee form\n\nGenerate or update Jest/RTL tests for impacted behavior.\nCover:\n- Happy path\n- Error path\n- Empty/loading states\n- Keyboard accessibility interactions where applicable\n\nKnown related test files:\n- No direct tests matched; create nearest-module tests.\n\nPrompt override (unit test stage):\n- None supplied\n\nRules:\n- Keep tests deterministic and isolated.\n- Avoid snapshot-only validation for behavior-heavy flows.\n- Assert accessibility roles/labels when adding interactive UI.\n\nVerification command:\n- npm test -- --watch=false --runInBand\n\n","tabs":{"plan":{"summary":"change the submit request button text to submit employee form should be implemented as a minimal blast-radius change starting with 6 ranked file candidate(s) already inferred from the repository. Dependency policy already indicates no new packages should be introduced.","phases":[{"title":"Confirm intent and guardrails","detail":"Review the intake summary, acceptance criteria, design inputs, and reviewer notes before touching code. Work item type: feature."},{"title":"Validate impacted repo surfaces","detail":"Start with the top-ranked candidate files and confirm they match the requested outcome before implementation begins."},{"title":"Implement the minimal patch","detail":"Follow the tech design and code workpack, preserve existing contracts, and keep the patch scoped to the smallest safe set of files."},{"title":"Verify tests and accessibility","detail":"Update deterministic happy, edge, and error tests, then validate keyboard interactions, semantic controls, and accessibility expectations."},{"title":"Complete human review","detail":"Use this plan, the run summary, and generated workpacks as review evidence before delegation approval, patch application, or merge."}],"fileActions":[{"file":"src/components/employeeFormUtils.js","score":111,"confidence":0.99,"reasons":["path:employee","path:form","export:INITIAL_FORM","export:SUBMIT_STATUS_ID","export:normalizeText","export:getFormErrors"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/components/employeeFormUtils.js."},{"file":"src/components/EmployeeForm.jsx","score":58,"confidence":0.97,"reasons":["path:employee","path:form","export:EmployeeForm","preview:form"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/components/EmployeeForm.jsx."},{"file":"src/data/fallbackEmployees.js","score":30,"confidence":0.5,"reasons":["path:employee","export:FALLBACK_EMPLOYEES","preview:employee"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/data/fallbackEmployees.js."},{"file":"src/components/FilterBar.jsx","score":28,"confidence":0.47,"reasons":["path:filter","export:FilterBar","preview:filter"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/components/FilterBar.jsx."},{"file":"src/api/fetchEmployees.js","score":23,"confidence":0.38,"reasons":["path:employee","preview:employee","preview:form"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/api/fetchEmployees.js."},{"file":"src/components/ActivityList.jsx","score":4,"confidence":0.07,"reasons":["preview:employee"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/components/ActivityList.jsx."}],"reviewChecklist":["Requirement intent matches the planned implementation.","No new dependencies are introduced.","Candidate-file selection still makes sense after local code review.","Unit tests cover happy, edge, and error paths.","Keyboard and accessibility behavior remain intact or improve.","Final diff is reviewed by a human before merge.","Quality gate: No unauthorized dependencies","Quality gate: Backward compatibility preserved","Quality gate: Keyboard and ARIA behavior validated"],"approvalsRequired":["Feature owner approval","QA/Test owner approval","Accessibility reviewer approval"],"risks":["No critical planning risk detected. Keep human-in-loop for merge approvals."],"blockers":[],"content":"# ODT Developer Review Plan\n\n- Generated At: 2026-04-23T16:20:01.867Z\n- Work Item: change the submit request button text to submit employee form\n- Review Status: ready_for_review\n\n## Executive Summary\nchange the submit request button text to submit employee form should be implemented as a minimal blast-radius change starting with 6 ranked file candidate(s) already inferred from the repository. Dependency policy already indicates no new packages should be introduced.\n\n## Review Workflow\n1. **Confirm intent and guardrails** - Review the intake summary, acceptance criteria, design inputs, and reviewer notes before touching code. Work item type: feature.\n2. **Validate impacted repo surfaces** - Start with the top-ranked candidate files and confirm they match the requested outcome before implementation begins.\n3. **Implement the minimal patch** - Follow the tech design and code workpack, preserve existing contracts, and keep the patch scoped to the smallest safe set of files.\n4. **Verify tests and accessibility** - Update deterministic happy, edge, and error tests, then validate keyboard interactions, semantic controls, and accessibility expectations.\n5. **Complete human review** - Use this plan, the run summary, and generated workpacks as review evidence before delegation approval, patch application, or merge.\n\n## Planned File Actions\n- src/components/employeeFormUtils.js | score=111 | confidence=0.99 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/components/employeeFormUtils.js. | signals=path:employee, path:form, export:INITIAL_FORM, export:SUBMIT_STATUS_ID, export:normalizeText, export:getFormErrors\n- src/components/EmployeeForm.jsx | score=58 | confidence=0.97 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/components/EmployeeForm.jsx. | signals=path:employee, path:form, export:EmployeeForm, preview:form\n- src/data/fallbackEmployees.js | score=30 | confidence=0.5 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/data/fallbackEmployees.js. | signals=path:employee, export:FALLBACK_EMPLOYEES, preview:employee\n- src/components/FilterBar.jsx | score=28 | confidence=0.47 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/components/FilterBar.jsx. | signals=path:filter, export:FilterBar, preview:filter\n- src/api/fetchEmployees.js | score=23 | confidence=0.38 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/api/fetchEmployees.js. | signals=path:employee, preview:employee, preview:form\n- src/components/ActivityList.jsx | score=4 | confidence=0.07 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/components/ActivityList.jsx. | signals=preview:employee\n\n## Reviewer Inputs\n- No reviewer edits supplied.\n\n### Active Prompt Overrides\n- None\n\n## Risk Watchpoints\n- No critical planning risk detected. Keep human-in-loop for merge approvals.\n\n## Approval Checklist\n- Requirement intent matches the planned implementation.\n- No new dependencies are introduced.\n- Candidate-file selection still makes sense after local code review.\n- Unit tests cover happy, edge, and error paths.\n- Keyboard and accessibility behavior remain intact or improve.\n- Final diff is reviewed by a human before merge.\n- Quality gate: No unauthorized dependencies\n- Quality gate: Backward compatibility preserved\n- Quality gate: Keyboard and ARIA behavior validated\n\n## Required Approvals\n- Feature owner approval\n- QA/Test owner approval\n- Accessibility reviewer approval\n\n## Blocking Conditions\n- None\n\n## Supporting Artifacts\n- reports/odt/tech-design.md\n- reports/dev-twin/code-workpack.md\n- reports/dev-twin/unit-test-workpack.md\n- reports/odt/code-patch-plan.md\n- reports/odt/verify-checklist.md\n- reports/odt/run-summary.md\n\n"},"design":{"requirementAnalysis":"change the submit request button text to submit employee form","technicalDesign":"# ODT Tech Design\n\n- Feature: change the submit request button text to submit employee form\n- Target repo: /Users/vn105957/Desktop/odt-submission/demo-target-repo/\n- UI: React/Terra minimal-blast-radius update\n- API strategy: reuse current contracts unless explicitly approved\n- State strategy: incremental updates in existing store/actions\n- Error handling: loading/empty/error states with deterministic behavior\n- Testing: Jest/RTL unit coverage for happy/edge/error paths\n- Accessibility: VPAT/WCAG and keyboard parity validation\n- Governance: human-reviewed approvals before merge\n\n## Prompt Override (Design Stage)\n- No design-stage prompt override supplied.\n\n## Quality Gates\n- No unauthorized dependencies\n- Backward compatibility preserved\n- Keyboard and ARIA behavior validated\n- Deterministic unit tests updated\n","impactHighlights":[{"modulePath":"src/components","blastRadius":5},{"modulePath":"src/data","blastRadius":1},{"modulePath":"src/api","blastRadius":1}]},"impact":{"mode":"repo_inferred_manifest","keywords":["change","submit","request","button","text","employee","form","filter","activities","keyword","without","leaving","page","filtering","updates","announced","clearly","assistive","technology","users","keyboard","open","clear","navigate"],"candidateFiles":["src/components/employeeFormUtils.js","src/components/EmployeeForm.jsx","src/data/fallbackEmployees.js","src/components/FilterBar.jsx","src/api/fetchEmployees.js","src/components/ActivityList.jsx","src/components/OracleLogo.js"],"candidateDetails":[{"file":"src/components/employeeFormUtils.js","score":111,"exportNames":["INITIAL_FORM","EMAIL_PATTERN","MIN_SUMMARY_LENGTH","TEAM_OPTIONS","FIELD_CONFIG","REQUIRED_FIELDS","SUBMIT_STATUS_ID","normalizeText","hasAllRequiredFields","getFormErrors","isFormSubmittable","getFieldDescribedBy","getSubmitStatusMessage"],"preview":"export const INITIAL_FORM = { requesterName: \"\", requesterEmail: \"\", team: \"\",","reasons":["path:employee","path:form","export:INITIAL_FORM","export:SUBMIT_STATUS_ID","export:normalizeText","export:getFormErrors"]},{"file":"src/components/EmployeeForm.jsx","score":58,"exportNames":["EmployeeForm"],"preview":"import React, { useMemo, useState } from \"react\"; import { FIELD_CONFIG, INITIAL_FORM,","reasons":["path:employee","path:form","export:EmployeeForm","preview:form"]},{"file":"src/data/fallbackEmployees.js","score":30,"exportNames":["FALLBACK_EMPLOYEES"],"preview":"export const FALLBACK_EMPLOYEES = [ { id: 101, name: \"Amelia Hart\",","reasons":["path:employee","export:FALLBACK_EMPLOYEES","preview:employee"]},{"file":"src/components/FilterBar.jsx","score":28,"exportNames":["FilterBar"],"preview":"import React from \"react\"; export default function FilterBar({ query, selectedDepartment,","reasons":["path:filter","export:FilterBar","preview:filter"]},{"file":"src/api/fetchEmployees.js","score":23,"exportNames":[],"preview":"import { FALLBACK_EMPLOYEES } from \"../data/fallbackEmployees.js\"; const DEPARTMENTS = [ \"Platform Engineering\", \"Experience Design\",","reasons":["path:employee","preview:employee","preview:form"]},{"file":"src/components/ActivityList.jsx","score":4,"exportNames":["ActivityList"],"preview":"import React from \"react\"; function EmployeeCard({ employee, index }) { return ( \u003cli className=\"employee-card\" style={{ \"--stagger\": `${index * 60}ms` }}>","reasons":["preview:employee"]},{"file":"src/components/OracleLogo.js","score":1,"exportNames":["OracleLogo","ORACLE_LOGO_LABEL"],"preview":"import React from \"react\"; export const ORACLE_LOGO_LABEL = \"Oracle logo\"; export default function OracleLogo({ className = \"oracle-logo\" }) { return React.createElement(","reasons":[]}],"risks":["No critical planning risk detected. Keep human-in-loop for merge approvals."]},"a11y":{"blockers":0,"scopedBlockers":0,"scopedFilesWithFindings":0,"topRules":[],"scopedTopRules":[],"hotspots":[]},"code":{"content":"# Codex Workpack: ODT Code Implementation\n\nWork Item: change the submit request button text to submit employee form\n\nYou are a senior frontend developer assistant.\nUse the intake, inferred repo impact, and compliance guidance below to implement a reviewable patch.\n\nExecution steps:\n1) Ask clarifying questions only for safety-critical ambiguities.\n2) Review existing patterns in the inferred source files before editing.\n3) Implement code changes with backward compatibility.\n4) Include keyboard accessibility and semantic HTML by default.\n5) Summarize edge cases and regression risk after patching.\n\nScope summary:\n- src/components (source: 5, tests: 0)\n- src/data (source: 1, tests: 0)\n- src/api (source: 1, tests: 0)\n\nRepo-analysis evidence:\n- Target repo path: /Users/vn105957/Desktop/odt-submission/demo-target-repo/\n- Analysis mode: repo_inferred_manifest\n- Keywords: change, submit, request, button, text, employee, form, filter, activities, keyword, without, leaving, page, filtering, updates, announced, clearly, assistive, technology, users, keyboard, open, clear, navigate\n- Mockup image: none supplied\n- Reference doc: none supplied\n- Candidate file: src/components/employeeFormUtils.js [score=111] exports=INITIAL_FORM, EMAIL_PATTERN, MIN_SUMMARY_LENGTH, TEAM_OPTIONS, FIELD_CONFIG, REQUIRED_FIELDS, SUBMIT_STATUS_ID, normalizeText, hasAllRequiredFields, getFormErrors, isFormSubmittable, getFieldDescribedBy, getSubmitStatusMessage signals=path:employee, path:form, export:INITIAL_FORM, export:SUBMIT_STATUS_ID, export:normalizeText, export:getFormErrors\n- Candidate file: src/components/EmployeeForm.jsx [score=58] exports=EmployeeForm signals=path:employee, path:form, export:EmployeeForm, preview:form\n- Candidate file: src/data/fallbackEmployees.js [score=30] exports=FALLBACK_EMPLOYEES signals=path:employee, export:FALLBACK_EMPLOYEES, preview:employee\n- Candidate file: src/components/FilterBar.jsx [score=28] exports=FilterBar signals=path:filter, export:FilterBar, preview:filter\n- Candidate file: src/api/fetchEmployees.js [score=23] exports=none signals=path:employee, preview:employee, preview:form\n- Candidate file: src/components/ActivityList.jsx [score=4] exports=ActivityList signals=preview:employee\n- Candidate file: src/components/OracleLogo.js [score=1] exports=OracleLogo, ORACLE_LOGO_LABEL signals=path-ranked\n\nReviewer refinements:\n- None supplied\n\nPrompt override (code stage):\n- None supplied\n\nQuality gates to run after implementation:\n- npm run a11y:scan:ci || true\n- npm run a11y:twin:verify\n\nFeature payload:\n```json\n{\n  \"title\": \"change the submit request button text to submit employee form\",\n  \"featureName\": \"change the submit request button text to submit employee form\",\n  \"summary\": \"change the submit request button text to submit employee form\",\n  \"reviewEdits\": \"\",\n  \"promptOverrides\": {\n    \"intake\": \"\",\n    \"impact\": \"\",\n    \"design\": \"\",\n    \"code\": \"\",\n    \"unitTests\": \"\",\n    \"compliance\": \"\",\n    \"verify\": \"\"\n  },\n  \"targetRepoPath\": \"/Users/vn105957/Desktop/odt-submission/demo-target-repo/\",\n  \"workItemType\": \"feature\",\n  \"jira\": {\n    \"ticketId\": \"\",\n    \"url\": \"\"\n  },\n  \"scope\": {\n    \"uiSurface\": \"web\",\n    \"complexity\": \"medium\",\n    \"repoScan\": \"full\"\n  },\n  \"requirements\": {\n    \"acceptanceCriteria\": [\n      \"User can filter activities by keyword without leaving the page\",\n      \"Filtering updates are announced clearly for assistive technology users\",\n      \"Keyboard users can open, clear, and navigate filter controls\"\n    ],\n    \"nonFunctional\": [\n      \"a11y\",\n      \"performance\",\n      \"analytics\"\n    ],\n    \"outOfScope\": [\n      \"No backend API changes\",\n      \"Do not alter existing permissions behavior\"\n    ]\n  },\n  \"designInputs\": {\n    \"mockupImages\": [],\n    \"referenceDocs\": [],\n    \"jiraLinks\": []\n  },\n  \"constraints\": {\n    \"noNewDependencies\": true,\n    \"releaseWindowDays\": 10,\n    \"approvedLibrariesOnly\": true\n  },\n  \"developerHints\": {\n    \"suspectedAreas\": [],\n    \"relatedComponents\": [],\n    \"notes\": \"Optional only. ODT should infer impact areas from the repo when hints are not provided.\"\n  },\n  \"defectContext\": {\n    \"defectId\": \"\",\n    \"observedBehavior\": \"\",\n    \"expectedBehavior\": \"\",\n    \"severity\": \"medium\"\n  }\n}\n```\n\n"},"tests":{"content":"# Codex Workpack: ODT Unit Test Generation\n\nWork Item: change the submit request button text to submit employee form\n\nGenerate or update Jest/RTL tests for impacted behavior.\nCover:\n- Happy path\n- Error path\n- Empty/loading states\n- Keyboard accessibility interactions where applicable\n\nKnown related test files:\n- No direct tests matched; create nearest-module tests.\n\nPrompt override (unit test stage):\n- None supplied\n\nRules:\n- Keep tests deterministic and isolated.\n- Avoid snapshot-only validation for behavior-heavy flows.\n- Assert accessibility roles/labels when adding interactive UI.\n\nVerification command:\n- npm test -- --watch=false --runInBand\n\n"},"pr":{"content":"## Summary\nchange the submit request button text to submit employee form: change the submit request button text to submit employee form\n\n## Scope\n- Work item type: feature\n- Modules in scope: 3\n- Blast radius: 7 files\n- Repo analysis mode: repo_inferred_manifest\n\n## Delivery Plan\n- Apply scoped implementation changes from the code workpack.\n- Update deterministic unit tests for happy, edge, and error paths.\n- Run VPAT/WCAG and keyboard accessibility verification before review.\n\n## Repo Analysis Signals\n- Candidate files surfaced: 7\n- Keywords used for inference: change, submit, request, button, text, employee, form, filter\n\n## Accessibility\n- Current blocker count in baseline scan: 0\n- Keyboard parity and semantic controls included in implementation guidance.\n\n## Verification\n- Human review required before merge.\n- Use generated dashboards and workpacks as evidence artifacts."}},"artifactLabelsByStep":{"analyze":["Intake"],"impact":["Tech Design"],"design":["Tech Design"],"guidance":["Code Workpack","Unit Test Workpack"],"a11y":["A11y Prompt"],"code":["Code Workpack"],"review":["Developer Review Plan","Run Summary"]},"stageLabels":{"analyze":"Prompt hardening","impact":"Repository impact scan","design":"Technical design","guidance":"Code and test guidance","a11y":"VPAT/WCAG risk check","code":"Implementation workpack","review":"Human review gate"}};
  var ORACLE_WORDMARK_DATA_URI = "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%20232%2048'%3E%3Crect%20x%3D'1.5'%20y%3D'1.5'%20width%3D'229'%20height%3D'45'%20rx%3D'22.5'%20fill%3D'%23fff8f1'%20stroke%3D'%23c74634'%20stroke-width%3D'3'%2F%3E%3Ctext%20x%3D'116'%20y%3D'31'%20text-anchor%3D'middle'%20font-family%3D'Arial%2C%20Helvetica%2C%20sans-serif'%20font-size%3D'21'%20font-weight%3D'700'%20letter-spacing%3D'5'%20fill%3D'%23c74634'%3EORACLE%3C%2Ftext%3E%3C%2Fsvg%3E";
  var DIGITAL_WORKER_ASSET_RELATIVE_PATH = "./assets/oracle-dev-twin-collab.png";
  var ODT_COLLAB_ASSET_RELATIVE_PATH = "./assets/oracle-dev-twin-collab.png";
  var React = window.React;
  var ReactDOM = window.ReactDOM;
  if (!React || !ReactDOM) {
    throw new Error('React and ReactDOM must be loaded before Oracle Developer Twin app script.');
  }

  var h = function (type, props) {
    var children = [];
    for (var i = 2; i < arguments.length; i += 1) {
      var child = arguments[i];
      if (Array.isArray(child)) {
        for (var j = 0; j < child.length; j += 1) children.push(child[j]);
      } else {
        children.push(child);
      }
    }
    return React.createElement.apply(React, [type, props].concat(children));
  };

  var useState = React.useState;
  var useEffect = React.useEffect;
  var useMemo = React.useMemo;
  var STORAGE_SCOPE = [
    (MODEL.meta && MODEL.meta.workspaceRoot) || '',
    (MODEL.meta && MODEL.meta.targetRepoPath) || '',
    (MODEL.meta && MODEL.meta.profile) || '',
    (MODEL.meta && MODEL.meta.workItemType) || ''
  ].join('|');
  var STORAGE_KEY = 'odt-fedit-runtime-v10::' + STORAGE_SCOPE;
  var TABS = [
    { id: 'plan', label: 'Plan' },
    { id: 'design', label: 'Design' },
    { id: 'impact', label: 'Impact' },
    { id: 'a11y', label: 'A11y' },
    { id: 'code', label: 'Code' },
    { id: 'tests', label: 'Tests' },
    { id: 'pr', label: 'PR Draft' }
  ];
  var SAMPLE = 'As a frontend admin, I want quick filtering in the activity list so I can find activities faster, with full keyboard accessibility and screen reader support.';
  var PROMPT_OVERRIDE_STAGES = Array.isArray(MODEL.promptOverrideStages) && MODEL.promptOverrideStages.length
    ? MODEL.promptOverrideStages
    : [
      { key: 'intake', label: 'Intake' },
      { key: 'impact', label: 'Impact' },
      { key: 'design', label: 'Tech Design' },
      { key: 'code', label: 'Code Workpack' },
      { key: 'unitTests', label: 'Unit Tests' },
      { key: 'compliance', label: 'Compliance' },
      { key: 'verify', label: 'Verification' }
    ];

  function parseStageCounts() {
    var raw = String((MODEL.metrics && MODEL.metrics.stagesCompleted) || '0/0').split('/');
    return {
      completed: Number(raw[0]) || 0,
      total: Number(raw[1]) || (MODEL.steps || []).length
    };
  }

  function createDoneStepStatus() {
    var result = {};
    (MODEL.steps || []).forEach(function (step) {
      result[step.id] = 'done';
    });
    return result;
  }

  function toneForText(text) {
    var value = String(text || '').toLowerCase();
    if (value.indexOf('failed') !== -1 || value.indexOf('error') !== -1 || value.indexOf('offline') !== -1 || value.indexOf('missing') !== -1) return 'bad';
    if (value.indexOf('running') !== -1 || value.indexOf('checking') !== -1 || value.indexOf('starting') !== -1 || value.indexOf('awaiting') !== -1) return 'warn';
    return 'good';
  }

  function readStorage() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStorage(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      // ignore storage failures in demo mode
    }
  }

  function clearStorage() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // ignore storage failures in demo mode
    }
  }

  function createInitialRuntime(options) {
    var fromQuery = false;
    try {
      fromQuery = window.location && window.location.search && window.location.search.indexOf('fresh=1') !== -1;
    } catch (error) {
      fromQuery = false;
    }
    var forceClean = Boolean((options && options.forceClean) || fromQuery);
    var counts = parseStageCounts();
    var saved = readStorage();
    var base = {
      ticket: '',
      targetRepoPath: '',
      mockupImages: [],
      referenceDocs: [],
      agentTool: 'codex',
      running: false,
      hasRun: false,
      activeTab: 'design',
      stepStatus: {},
      apiStatus: 'Start the local context server, select target repo, and run digital worker.',
      serverHealth: {
        status: 'unknown',
        detail: 'Checking local context server...'
      },
      repoStatus: {
        status: 'missing_path',
        tone: 'warn',
        detail: 'Provide a target repository path to continue.',
        recommendation: 'Select a target repo or scaffold folder.',
        canInitializeGit: false
      },
      codexLaunch: {
        status: 'idle',
        detail: 'No Codex launch started yet.',
        logTail: '',
        responseExists: false,
        responsePreview: ''
      },
      completion: {
        status: 'idle',
        detail: 'No delegated agent execution has started yet.'
      },
      lastRunFingerprint: '',
      promptProviderStatus: getPromptProviderStatus(),
      reviewEdits: '',
      promptOverrides: normalizePromptOverrides({}),
      uploadStatus: ''
    };

    if (forceClean || !saved) {
      return base;
    }

    return {
      ticket: saved.ticket || base.ticket,
      targetRepoPath: saved.targetRepoPath || base.targetRepoPath,
      mockupImages: Array.isArray(saved.mockupImages) ? uniqStrings(saved.mockupImages) : base.mockupImages,
      referenceDocs: Array.isArray(saved.referenceDocs) ? uniqStrings(saved.referenceDocs) : base.referenceDocs,
      agentTool: saved.agentTool || base.agentTool,
      running: false,
      hasRun: Boolean(saved.hasRun),
      activeTab: saved.activeTab || base.activeTab,
      stepStatus: Boolean(saved.hasRun) ? createDoneStepStatus() : base.stepStatus,
      apiStatus: base.apiStatus,
      serverHealth: base.serverHealth,
      repoStatus: base.repoStatus,
      codexLaunch: base.codexLaunch,
      completion: base.completion,
      lastRunFingerprint: saved.lastRunFingerprint || (saved.hasRun ? buildRunFingerprint(saved) : ''),
      promptProviderStatus: base.promptProviderStatus,
      reviewEdits: typeof saved.reviewEdits === 'string' ? saved.reviewEdits : base.reviewEdits,
      promptOverrides: normalizePromptOverrides(saved.promptOverrides || base.promptOverrides),
      uploadStatus: base.uploadStatus
    };
  }

  function persistable(runtime) {
    return {
      ticket: runtime.ticket,
      targetRepoPath: runtime.targetRepoPath,
      agentTool: runtime.agentTool,
      activeTab: runtime.activeTab,
      mockupImages: runtime.mockupImages,
      referenceDocs: runtime.referenceDocs,
      hasRun: Boolean(runtime.hasRun),
      lastRunFingerprint: runtime.lastRunFingerprint || '',
      reviewEdits: runtime.reviewEdits,
      promptOverrides: runtime.promptOverrides,
      generatedAt: MODEL.meta.generatedAt,
      persistedAt: new Date().toISOString()
    };
  }

  function metricNumericValue(value) {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined) return 0;
    var text = String(value);
    if (text.indexOf('/') !== -1) return Number(text.split('/')[0]) || 0;
    var parsed = Number(text.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function shorten(text, max) {
    var raw = String(text || '');
    return raw.length > max ? raw.slice(0, max - 1) + '…' : raw;
  }

  function formatRepoAnalysisMode(mode, includeSuffix) {
    var raw = String(mode || 'unknown').toLowerCase();
    if (raw === 'repo_inferred_manifest') return includeSuffix ? 'Repo-inferred scan' : 'Repo-inferred';
    if (raw === 'fallback_manifest') return includeSuffix ? 'Fallback scan' : 'Fallback';
    if (raw === 'hinted') return includeSuffix ? 'Hinted scan' : 'Hinted';
    if (raw === 'unknown') return includeSuffix ? 'Unknown scan' : 'Unknown';
    var titleized = raw.replace(/[_-]+/g, ' ').replace(/[a-z]/g, function (char) {
      return char.toUpperCase();
    });
    return includeSuffix ? titleized + ' scan' : titleized;
  }

  function MiniStatValue(props) {
    var raw = props.value === null || props.value === undefined ? '' : String(props.value);
    var display = typeof props.max === 'number' ? shorten(raw, props.max) : raw;
    var className = 'mini-stat-value' + (props.variant ? ' ' + props.variant : '') + (display !== raw ? ' truncated' : '');
    return h('strong', {
      className: className,
      title: raw,
      tabIndex: display !== raw ? 0 : undefined
    }, display);
  }

  function normalizePromptOverrides(source) {
    var base = source && typeof source === 'object' ? source : {};
    var next = {};
    PROMPT_OVERRIDE_STAGES.forEach(function (stage) {
      next[stage.key] = typeof base[stage.key] === 'string' ? base[stage.key] : '';
    });
    return next;
  }

  function activePromptOverrideCount(overrides) {
    var normalized = normalizePromptOverrides(overrides);
    return PROMPT_OVERRIDE_STAGES.filter(function (stage) {
      return normalized[stage.key] && normalized[stage.key].trim();
    }).length;
  }

  function buildRunFingerprint(source) {
    var base = source && typeof source === 'object' ? source : {};
    return JSON.stringify({
      ticket: String(base.ticket || '').trim(),
      targetRepoPath: String(base.targetRepoPath || '').trim(),
      reviewEdits: String(base.reviewEdits || '').trim(),
      promptOverrides: normalizePromptOverrides(base.promptOverrides),
      mockupImages: uniqStrings(base.mockupImages || []).slice().sort(),
      referenceDocs: uniqStrings(base.referenceDocs || []).slice().sort()
    });
  }

  function getAgentExecutionState(runtime) {
    var launch = runtime && runtime.codexLaunch ? runtime.codexLaunch : null;
    var completion = runtime && runtime.completion ? runtime.completion : null;
    var status = inferCompletionStatus(launch);
    if (status === 'idle' && completion && completion.status && completion.status !== 'idle') {
      status = completion.status;
    }

    if (status === 'running') {
      return {
        status: 'running',
        label: 'Running',
        detail: (completion && completion.detail) || summarizeCodexLaunch(launch)
      };
    }
    if (status === 'completed') {
      return {
        status: 'completed',
        label: 'Completed',
        detail: (completion && completion.detail) || summarizeCodexLaunch(launch)
      };
    }
    if (status === 'failed') {
      return {
        status: 'failed',
        label: 'Failed',
        detail: (completion && completion.detail) || summarizeCodexLaunch(launch)
      };
    }
    if (status === 'unknown') {
      return {
        status: 'unknown',
        label: 'Unknown',
        detail: (completion && completion.detail) || 'Unable to determine the delegated agent status from the local server.'
      };
    }
    return {
      status: 'ready',
      label: runtime && runtime.hasRun ? 'Ready' : 'Not started',
      detail: runtime && runtime.hasRun
        ? 'No delegated agent task is currently running. Launch implementation when you are ready.'
        : 'Run Oracle Developer Twin first to prepare the planning and execution handoff package.'
    };
  }

  function isAgentExecutionBusy(runtime) {
    return getAgentExecutionState(runtime).status === 'running';
  }

  function stageLabelFromKey(key) {
    var value = String(key || '').toLowerCase();
    if (value === 'intake') return 'Intake';
    if (value === 'impact') return 'Impact';
    if (value === 'design' || value === 'tech-design') return 'Tech Design';
    if (value === 'code' || value === 'code-workpack') return 'Code Workpack';
    if (value === 'unit-tests' || value === 'test-workpack') return 'Unit Tests';
    if (value === 'compliance') return 'Compliance';
    if (value === 'verify' || value === 'verify-summary') return 'Verification';
    return key || 'Stage';
  }

  function titleizeStatus(value) {
    return String(value || '')
      .replace(/[_-]+/g, ' ')
      .replace(/[a-z]/g, function (char) { return char.toUpperCase(); });
  }

  function resolveDisplayStatus(status, context) {
    var raw = String(status || '').trim().toLowerCase();
    if (!raw) return null;

    if (context === 'checklist') {
      if (raw === 'resolved' || raw === 'ready' || raw === 'done') return { label: 'Ready', tone: 'ready' };
      if (raw === 'open' || raw === 'needs_input' || raw === 'needs-input' || raw === 'missing') return { label: 'Needs Input', tone: 'needs-input' };
      if (raw === 'review' || raw === 'attention' || raw === 'warn') return { label: 'Attention', tone: 'attention' };
      if (raw === 'failed' || raw === 'error') return { label: 'Attention', tone: 'attention' };
    }

    if (context === 'prompt-provider') {
      if (raw === 'direct' || raw === 'generated' || raw === 'resolved' || raw === 'ready') return { label: 'Direct', tone: 'direct' };
      if (raw === 'fallback' || raw === 'needs_input' || raw === 'needs-input') return { label: 'Fallback', tone: 'fallback' };
      if (raw === 'failed' || raw === 'error') return { label: 'Failed', tone: 'failed' };
    }

    if (context === 'artifact') {
      if (raw === 'ready' || raw === 'resolved') return { label: 'Ready', tone: 'ready' };
      if (raw === 'missing' || raw === 'open' || raw === 'needs_input' || raw === 'needs-input' || raw === 'failed') return { label: 'Missing', tone: 'missing' };
    }

    if (context === 'informational') {
      return null;
    }

    return {
      label: titleizeStatus(raw),
      tone: raw.replace(/_/g, '-')
    };
  }

  function normalizePromptProviderStatus(source) {
    var payload = source && typeof source === 'object' ? source : {};
    var rawSummary = payload.summary && typeof payload.summary === 'object' ? payload.summary : {};
    var rawStages = Array.isArray(payload.stages) ? payload.stages : [];
    var stages = rawStages.map(function (stage, index) {
      var key = String(stage.slug || stage.stage || ('stage-' + (index + 1))).toLowerCase();
      return {
        stage: stage.stage || key,
        label: stage.label || stageLabelFromKey(key),
        provider: stage.provider || payload.provider || 'template',
        model: stage.model || payload.model || (payload.oci && payload.oci.modelId) || '',
        latencyMs: Number(stage.latencyMs) || 0,
        fallback: Boolean(stage.fallback),
        status: stage.status || 'generated',
        error: stage.error || ''
      };
    });
    var fallbackCount = typeof rawSummary.fallback === 'number'
      ? rawSummary.fallback
      : stages.filter(function (stage) { return stage.fallback; }).length;
    var failedCount = typeof rawSummary.failed === 'number'
      ? rawSummary.failed
      : stages.filter(function (stage) { return stage.status === 'failed'; }).length;
    var generatedCount = typeof rawSummary.generated === 'number'
      ? rawSummary.generated
      : stages.filter(function (stage) { return stage.status === 'generated'; }).length;

    return {
      generatedAt: payload.generatedAt || MODEL.meta.generatedAt || '',
      provider: payload.provider || 'template',
      model: payload.model || (payload.oci && payload.oci.modelId) || (stages[0] && stages[0].model) || '',
      profile: payload.profile || (payload.oci && payload.oci.profile) || '',
      region: payload.region || (payload.oci && payload.oci.region) || '',
      servingType: payload.servingType || (payload.oci && payload.oci.servingType) || '',
      summary: {
        totalStages: typeof rawSummary.totalStages === 'number' ? rawSummary.totalStages : stages.length,
        generated: generatedCount,
        fallback: fallbackCount,
        failed: failedCount
      },
      stages: stages
    };
  }

  function getPromptProviderStatus(runtime) {
    return normalizePromptProviderStatus((runtime && runtime.promptProviderStatus) || MODEL.promptGeneration || {});
  }

  function summarizePromptProviderStatus(status) {
    var summary = status && status.summary ? status.summary : {};
    var total = typeof summary.totalStages === 'number' ? summary.totalStages : 0;
    var generated = typeof summary.generated === 'number' ? summary.generated : 0;
    var fallback = typeof summary.fallback === 'number' ? summary.fallback : 0;
    var failed = typeof summary.failed === 'number' ? summary.failed : 0;
    if (!total && !generated) {
      return 'Prompt provider telemetry will appear after the first run.';
    }
    if (failed > 0) {
      return failed + ' stage prompt(s) failed. Review the stage list before continuing.';
    }
    if (fallback > 0) {
      return fallback + ' of ' + total + ' stage prompt(s) used the safe template fallback in the latest run.';
    }
    if (String(status.provider || '').toLowerCase() === 'oci') {
      return 'All ' + generated + ' stage prompts were generated through OCI with no template fallback.';
    }
    return 'Prompt generation completed in ' + (status.provider || 'template') + ' mode.';
  }

  function getJson(path) {
    return fetch(MODEL.server.apiBase + path).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (text) {
          throw new Error(text || ('Request failed: ' + response.status));
        });
      }
      return response.json();
    });
  }

  function postJson(path, payload) {
    return fetch(MODEL.server.apiBase + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload || {})
    }).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (text) {
          throw new Error(text || ('Request failed: ' + response.status));
        });
      }
      return response.json();
    });
  }

  function uniqStrings(values) {
    var seen = {};
    var out = [];
    (values || []).forEach(function (value) {
      var next = String(value || '').trim();
      if (!next || seen[next]) return;
      seen[next] = true;
      out.push(next);
    });
    return out;
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('Failed to read file: ' + (file && file.name ? file.name : 'unknown'))); };
      reader.readAsDataURL(file);
    });
  }

  function readAgentExitCode(payload) {
    if (payload && Number.isFinite(Number(payload.exitCode))) {
      return Number(payload.exitCode);
    }
    var logText = payload && payload.logTail ? String(payload.logTail) : '';
    if (!logText) return null;
    var matcher = /\[odt\]\s+Agent task finished with exit code\s+(-?\d+)/g;
    var match = null;
    var exitCode = null;
    while ((match = matcher.exec(logText)) !== null) {
      exitCode = Number(match[1]);
    }
    return Number.isFinite(exitCode) ? exitCode : null;
  }

  function inferCompletionStatus(payload) {
    if (!payload) return 'idle';
    if (payload.completionStatus) return payload.completionStatus;

    var status = payload.status || payload.rawStatus || 'idle';
    var exitCode = readAgentExitCode(payload);

    if (exitCode !== null) return exitCode === 0 ? 'completed' : 'failed';
    if (status === 'delegated_visible' || status === 'starting' || status === 'running') return 'running';
    if (status === 'completed') return 'completed';
    if (status === 'failed' || status === 'failed_to_start' || status === 'failed_to_open') return 'failed';
    if (status === 'idle') return 'idle';
    return 'unknown';
  }

  function summarizeCodexLaunch(payload) {
    var status = payload && payload.status ? payload.status : 'idle';
    var toolLabel = payload && payload.tool ? String(payload.tool) : 'agent';
    var inferred = inferCompletionStatus(payload);
    var exitCode = readAgentExitCode(payload);
    if (inferred === 'completed') {
      if (payload && payload.completionDetail) return payload.completionDetail;
      if (payload && payload.responseExists) return toolLabel + ' completed and wrote a response artifact.';
      if (exitCode === 0) return toolLabel + ' completed with exit code 0.';
      return toolLabel + ' completed successfully.';
    }
    if (inferred === 'failed') {
      if (payload && payload.error) return toolLabel + ' failed: ' + payload.error;
      if (payload && payload.completionDetail) return payload.completionDetail;
      if (exitCode !== null) return toolLabel + ' failed with exit code ' + exitCode + '.';
      return toolLabel + ' failed.';
    }
    if (inferred === 'running') {
      if (payload && payload.completionDetail) return payload.completionDetail;
      return toolLabel + ' is running in a visible Terminal session.';
    }
    if (status === 'delegated_visible') return payload.note || (toolLabel + ' was opened in a visible Terminal session.');
    if (status === 'running') return 'Codex is currently running with the generated execution prompt.';
    if (status === 'completed') return payload.responseExists ? 'Codex completed and wrote a response artifact.' : 'Codex completed, but no response artifact was detected yet.';
    if (status === 'failed' || status === 'failed_to_start' || status === 'failed_to_open') return payload.error ? (toolLabel + ' failed: ' + payload.error) : (toolLabel + ' launch failed. Review the log tail below.');
    if (status === 'idle') return 'No agent launch started yet.';
    return payload.note || (toolLabel + ' status: ' + status);
  }

  function completionFromLaunch(payload) {
    var status = inferCompletionStatus(payload);
    var detail = (payload && payload.completionDetail) || summarizeCodexLaunch(payload);
    if (status === 'failed' && payload && payload.error) {
      detail = payload.error;
    }
    return {
      status: status,
      detail: detail
    };
  }

  function repoStatusTitle(status) {
    if (status === 'git_repo') return 'Git repo ready';
    if (status === 'empty_folder') return 'Empty folder detected';
    if (status === 'existing_non_git') return 'Existing non-git folder';
    if (status === 'not_directory') return 'Invalid selection';
    if (status === 'unreadable') return 'Folder unreadable';
    if (status === 'missing_path') return 'Target repo required';
    return 'Repo status';
  }

  function useAnimatedNumber(target, duration) {
    var _a = useState(0), value = _a[0], setValue = _a[1];
    useEffect(function () {
      var nextTarget = Number(target) || 0;
      var start = 0;
      var raf = 0;
      var startTs = 0;
      function tick(ts) {
        if (!startTs) startTs = ts;
        var progress = Math.min((ts - startTs) / (duration || 800), 1);
        var next = start + ((nextTarget - start) * progress);
        setValue(progress === 1 ? nextTarget : next);
        if (progress < 1) raf = window.requestAnimationFrame(tick);
      }
      setValue(0);
      raf = window.requestAnimationFrame(tick);
      return function () {
        window.cancelAnimationFrame(raf);
      };
    }, [target, duration]);
    return value;
  }

  function StatusChip(props) {
    var tone = props.tone || toneForText(props.value);
    return h('div', { className: 'health-chip ' + tone }, [
      h('label', { key: 'label' }, props.label),
      h('strong', { key: 'value' }, [
        h('span', { className: 'health-dot', key: 'dot' }),
        props.value
      ])
    ]);
  }

  function MetricCard(props) {
    var animated = useAnimatedNumber(metricNumericValue(props.value), 900);
    return h('article', { className: 'card metric-card' }, [
      h('p', { className: 'metric-label', key: 'label' }, props.label),
      h('div', { className: 'metric-value', key: 'value' }, props.format ? props.format(animated, props.value) : Math.round(animated)),
      h('div', { className: 'metric-footnote', key: 'footnote' }, props.footnote)
    ]);
  }

  function RingChart(props) {
    var value = Math.max(0, Math.min(100, Number(props.value) || 0));
    var radius = 50;
    var circumference = 2 * Math.PI * radius;
    var offset = circumference - ((value / 100) * circumference);
    return h('div', { className: 'ring-wrap' }, [
      h('svg', { key: 'svg', viewBox: '0 0 160 160', width: 140, height: 140 }, [
        h('circle', { key: 'track', cx: 80, cy: 80, r: radius, fill: 'none', stroke: '#edf1f4', strokeWidth: 14 }),
        h('circle', {
          key: 'value',
          cx: 80,
          cy: 80,
          r: radius,
          fill: 'none',
          stroke: props.color || '#c74634',
          strokeWidth: 14,
          strokeLinecap: 'round',
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          transform: 'rotate(-90 80 80)'
        })
      ]),
      h('div', { className: 'ring-center', key: 'center' }, [
        h('div', { key: 'copy' }, [
          h('strong', { key: 'value' }, value + '%'),
          h('span', { key: 'label' }, props.label)
        ])
      ])
    ]);
  }

  function BarChart(props) {
    var items = props.items || [];
    var max = items.reduce(function (acc, item) {
      return Math.max(acc, Number(item.count || item.value || 0));
    }, 1);
    return h('div', { className: 'bar-chart' }, items.map(function (item, index) {
      var numeric = Number(item.count || item.value || 0);
      var percent = max ? Math.max(8, Math.round((numeric / max) * 100)) : 0;
      return h('div', { className: 'bar-row', key: item.label + '-' + index }, [
        h('div', { className: 'bar-label', key: 'label', title: item.fullPath || item.label }, shorten(item.label, 28)),
        h('div', { className: 'bar-track', key: 'track' }, [
          h('div', {
            className: 'bar-fill',
            key: 'fill',
            style: { width: percent + '%', background: item.color || 'linear-gradient(90deg, #c74634, #de7d61)' }
          })
        ]),
        h('div', { className: 'bar-value', key: 'value' }, numeric)
      ]);
    }));
  }

  function SectionCard(props) {
    return h('section', { className: 'card panel-pad ' + (props.className || '') }, [
      h('div', { className: 'card-header', key: 'header' }, [
        h('div', { key: 'copy' }, [
          h('p', { className: 'card-title', key: 'title' }, props.title),
          props.subtitle ? h('p', { className: 'card-subtitle', key: 'subtitle' }, props.subtitle) : null
        ]),
        props.extra || null
      ]),
      props.children
    ]);
  }

  function WorkflowBoard(props) {
    var doneCount = (MODEL.steps || []).filter(function (step) {
      return props.runtime.stepStatus[step.id] === 'done';
    }).length;
    var totalStages = (MODEL.steps || []).length || 7;
    var workflowCards = (MODEL.steps || []).map(function (step, index) {
      var status = props.runtime.stepStatus[step.id] || '';
      var stateLabel = status === 'done' ? 'Completed' : status === 'running' ? 'Running' : 'Queued';
      var artifacts = MODEL.artifactLabelsByStep && MODEL.artifactLabelsByStep[step.id] ? MODEL.artifactLabelsByStep[step.id].join(', ') : 'Generated artifacts vary by step';
      return h('article', { className: 'workflow-card ' + status, key: step.id }, [
        h('div', { className: 'workflow-index', key: 'index' }, status === 'done' ? '✓' : String(index + 1)),
        h('div', { className: 'workflow-copy', key: 'copy' }, [
          h('strong', { key: 'label' }, step.label),
          h('p', { key: 'detail' }, step.detail),
          h('span', { className: 'workflow-state', key: 'state' }, stateLabel),
          h('div', { className: 'workflow-artifacts', key: 'artifacts' }, 'Artifacts: ' + artifacts)
        ])
      ]);
    });
    var kpis = [
      {
        label: 'Stages Completed',
        value: doneCount + '/' + totalStages,
        note: 'Completed workflow checkpoints'
      },
      {
        label: 'Readiness Score',
        value: props.runtime.hasRun ? (MODEL.readinessScore + '%') : '0%',
        note: 'Intake and evidence readiness'
      },
      {
        label: 'Candidate Files',
        value: props.runtime.hasRun ? String(MODEL.metrics.candidateFiles || 0) : '0',
        note: 'Repo-informed implementation targets'
      },
      {
        label: 'Blast Radius',
        value: props.runtime.hasRun ? String(MODEL.metrics.blastRadius || 0) : '0',
        note: 'Potentially impacted files'
      }
    ];
    return h('section', { className: 'card workflow-panel' }, [
      h('div', { className: 'workflow-header', key: 'head' }, [
        h('div', { key: 'copy' }, [
          h('p', { className: 'card-title', key: 'label' }, 'Delivery Workflow'),
          h('h2', { key: 'title' }, 'Seven governed stages from intake to review'),
          h('p', { className: 'card-subtitle', key: 'desc' }, 'Track how Oracle Developer Twin moves a work item through planning, evidence, implementation guidance, and human review without losing visibility.')
        ]),
        h('div', { className: 'workflow-summary', key: 'summary' }, [
          h('span', { key: 'label' }, 'Progress'),
          h('strong', { key: 'value' }, doneCount + '/' + totalStages),
          h('small', { key: 'note' }, props.runtime.hasRun
            ? 'Evidence stays visible for review after the latest run.'
            : 'Run once to populate the workflow with evidence and handoff context.')
        ])
      ]),
      h('div', { className: 'workflow-kpis', key: 'kpis' }, kpis.map(function (item) {
        return h('article', { className: 'workflow-kpi', key: item.label }, [
          h('label', { key: 'label' }, item.label),
          h('strong', { key: 'value' }, item.value),
          h('p', { key: 'note' }, item.note)
        ]);
      })),
      h('div', { className: 'workflow-grid', key: 'grid' }, workflowCards)
    ]);
  }

  function ArtifactList(props) {
    var items = props.items || [];
    return h('div', { className: 'artifact-list' }, items.map(function (item) {
      var displayStatus = props.showStatus === false ? null : resolveDisplayStatus(item.status, props.statusContext || 'artifact');
      return h('div', { className: 'artifact-item', key: item.label }, [
        displayStatus ? h('div', { className: 'artifact-status ' + displayStatus.tone, key: 'status' }, displayStatus.label) : null,
        h('div', { className: 'artifact-copy' + (displayStatus ? '' : ' full'), key: 'copy' }, [
          h('strong', { key: 'label' }, item.label),
          h('div', { className: 'small-note', key: 'note' }, item.note),
          h('div', { className: 'artifact-path', key: 'path' }, item.path)
        ])
      ]);
    }));
  }

  function DetailList(props) {
    var items = props.items || [];
    return h('div', { className: 'detail-list' }, items.map(function (item, index) {
      var displayStatus = props.showStatus === false ? null : resolveDisplayStatus(item.status, props.statusContext || 'default');
      return h('div', { className: 'detail-item' + (displayStatus ? '' : ' no-status'), key: (item.title || item.label || 'detail') + '-' + index }, [
        displayStatus ? h('div', { className: 'detail-status ' + displayStatus.tone, key: 'status' }, displayStatus.label) : null,
        h('div', { className: 'detail-copy' + (displayStatus ? '' : ' full'), key: 'copy' }, [
          h('strong', { key: 'label' }, item.title || item.label),
          h('div', { className: 'small-note', key: 'detail' }, item.detail)
        ])
      ]);
    }));
  }

  function CandidateGrid(props) {
    var items = props.items || [];
    if (!items.length) {
      return h('div', { className: 'small-note' }, 'No candidate file details surfaced.');
    }
    return h('div', { className: 'candidate-grid' }, items.map(function (item, index) {
      var exports = item.exportNames || [];
      var reasons = item.reasons || [];
      return h('article', { className: 'candidate-card', key: (item.file || 'candidate') + '-' + index }, [
        h('strong', { key: 'file' }, shorten(item.file || 'unknown', 72)),
        h('div', { className: 'candidate-meta', key: 'meta' }, [
          h('span', { className: 'candidate-pill score', key: 'score' }, 'Score ' + (item.score || 0)),
          h('span', { className: 'candidate-pill exports', key: 'exports' }, (exports.length ? exports.length : 0) + ' exports')
        ]),
        h('div', { className: 'candidate-signals', key: 'signals' }, 'Signals: ' + (reasons.length ? reasons.join(', ') : 'path-ranked')),
        h('div', { className: 'candidate-preview', key: 'preview' }, item.preview || 'No preview available.')
      ]);
    }));
  }

  function CommandPanel(props) {
    var runtime = props.runtime;
    var activeOverrideCount = activePromptOverrideCount(runtime.promptOverrides);
    var _a = useState(false), showOverrideEditor = _a[0], setShowOverrideEditor = _a[1];
    var _b = useState((PROMPT_OVERRIDE_STAGES[0] && PROMPT_OVERRIDE_STAGES[0].key) || 'intake'), selectedOverrideStage = _b[0], setSelectedOverrideStage = _b[1];
    var selectedOverrideValue = runtime.promptOverrides && runtime.promptOverrides[selectedOverrideStage]
      ? runtime.promptOverrides[selectedOverrideStage]
      : '';
    var agentState = getAgentExecutionState(runtime);
    var isAgentBusy = agentState.status === 'running';
    var controlsLocked = runtime.running || isAgentBusy;
    var isDirtySinceLastRun = runtime.hasRun
      ? buildRunFingerprint(runtime) !== (runtime.lastRunFingerprint || '')
      : false;
    var hasAgentLaunch = Boolean(runtime.codexLaunch && runtime.codexLaunch.status && runtime.codexLaunch.status !== 'idle');
    var showRetryAction = runtime.hasRun && hasAgentLaunch && !isAgentBusy;
    var showAgentStatusAction = runtime.hasRun;
    var showInitializeGit = Boolean(runtime.repoStatus && runtime.repoStatus.canInitializeGit);
    var isOnline = runtime.serverHealth.status === 'online';
    var recentFiles = uniqStrings([].concat(runtime.mockupImages || [], runtime.referenceDocs || [])).slice(-4);
    var repoTone = runtime.repoStatus && runtime.repoStatus.tone ? runtime.repoStatus.tone : 'warn';
    var reanalyzeTitle = runtime.running
      ? 'Oracle Developer Twin is already analyzing the current request.'
      : !isOnline
        ? 'Start the local context server to run a fresh analysis.'
        : isAgentBusy
          ? 'Wait for the active delegated agent to finish before starting another analysis.'
          : !isDirtySinceLastRun
            ? 'No intake changes detected since the last analysis.'
            : 'Run Oracle Developer Twin again using the current intake, reviewer notes, and stage overrides.';
    var launchTitle = runtime.running
      ? 'Oracle Developer Twin is still preparing the current work item.'
      : !isOnline
        ? 'Start the local context server before delegating to an agent.'
        : isAgentBusy
          ? 'An agent is already working on the current request. Refresh Agent Status or wait for completion before launching again.'
          : 'Launch the selected coding agent with the current Oracle Developer Twin workpack and reviewer context.';
    var statusHint = isAgentBusy
      ? 'Agent execution is still in progress. Refresh Agent Status or wait for completion before starting another run or delegation.'
      : runtime.hasRun
        ? (isDirtySinceLastRun
          ? 'Saved intake changes are waiting. Update & Re-analyze is ready whenever you want a fresh plan.'
          : 'No intake changes detected since the last analysis. Update & Re-analyze will enable after the work item, repo path, uploads, reviewer notes, or stage overrides change.')
        : 'Complete the intake, then run Oracle Developer Twin to generate planning, evidence, and governed handoff guidance.';

    return h('section', { className: 'card intake-panel panel-pad' }, [
      h('div', { className: 'intake-header', key: 'header' }, [
        h('div', { key: 'copy' }, [
          h('p', { className: 'card-title', key: 'title' }, 'Oracle Developer Twin Intake'),
          h('h2', { key: 'headline' }, 'Start with the requirement and launch the digital worker'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Paste the Jira story, business request, or defect summary. Oracle Developer Twin turns it into repo-aware planning, accessibility evidence, implementation guidance, and governed agent handoff.')
        ])
      ]),
      h('div', { className: 'intake-grid', key: 'grid' }, [
        h('div', { className: 'intake-column', key: 'left' }, [
          h('div', { className: 'control-row', key: 'ticket-row' }, [
            h('label', { htmlFor: 'ticket-input', key: 'label' }, 'Primary Requirement / Work Item'),
            h('div', { className: 'small-note', key: 'guide' }, 'Paste the requirement exactly as the developer or reviewer would frame it for planning and implementation.'),
            h('textarea', {
              id: 'ticket-input',
              className: 'control-textarea ticket-textarea',
              key: 'input',
              value: runtime.ticket,
              disabled: controlsLocked,
              title: 'Primary requirement input. Paste the Jira story, request, or defect summary that Oracle Developer Twin should analyze.',
              placeholder: 'Paste the Jira story, business requirement, or defect summary for analysis...',
              onChange: function (event) {
                var nextValue = event && event.target ? event.target.value : '';
                props.setRuntime(function (current) {
                  return Object.assign({}, current, { ticket: nextValue });
                });
              }
            })
          ]),
          h('div', { className: 'control-row', key: 'target-repo-row' }, [
            h('label', { htmlFor: 'target-repo-path-input', key: 'label' }, 'Target Repo Path'),
            h('div', { className: 'control-inline', key: 'inline' }, [
              h('input', {
                id: 'target-repo-path-input',
                className: 'control-input',
                type: 'text',
                value: runtime.targetRepoPath,
                disabled: controlsLocked,
                placeholder: '/Users/you/projects/target-repo',
                onChange: function (event) {
                  var nextPath = event && event.target ? event.target.value : '';
                  props.setRuntime(function (current) {
                    return Object.assign({}, current, { targetRepoPath: nextPath });
                  });
                },
                key: 'input'
              }),
              h('button', {
                className: 'btn ghost inline-helper',
                disabled: controlsLocked || !isOnline,
                onClick: props.onBrowse,
                title: 'Open a folder picker and choose the repository Oracle Developer Twin should analyze and use for delegation.',
                key: 'browse'
              }, 'Browse…')
            ]),
            h('div', { className: 'small-note', key: 'note' }, 'ODT stores reports in this workspace, but repo analysis and agent delegation use this target path.'),
            h('div', { className: 'repo-inline-state ' + repoTone, key: 'repo-state' }, [
              h('strong', { key: 'title' }, repoStatusTitle(runtime.repoStatus.status)),
              h('p', { key: 'detail' }, runtime.repoStatus.detail || 'Select a target repository to continue.')
            ])
          ]),
          h('div', { className: 'control-row', key: 'design-input-row' }, [
            h('label', { htmlFor: 'design-input-files', key: 'label' }, 'Design Inputs (images/docs)'),
            h('div', { className: 'control-inline stack', key: 'inline' }, [
              h('input', {
                id: 'design-input-files',
                className: 'control-input',
                type: 'file',
                multiple: true,
                accept: '.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.pdf,.md,.txt,.json,.doc,.docx',
                onChange: props.onFilesSelected,
                disabled: controlsLocked || !isOnline,
                key: 'input'
              }),
              h('span', { className: 'meta-pill', key: 'count' }, 'Images ' + runtime.mockupImages.length + ' · Docs ' + runtime.referenceDocs.length)
            ]),
            h('div', { className: 'small-note', key: 'note' }, runtime.uploadStatus || 'Upload mockups and reference docs so ODT can bring visual intent and supporting constraints into planning and execution prompts.'),
            h('div', { className: 'input-list', key: 'files' }, recentFiles.length
              ? recentFiles.map(function (filePath, index) {
                return h('div', { className: 'input-item', key: filePath + '-' + index }, shorten(filePath, 84));
              })
              : [h('div', { className: 'small-note', key: 'empty' }, 'No mockups or supporting docs uploaded yet.')])
          ])
        ]),
        h('div', { className: 'intake-column', key: 'right' }, [
          h('div', { className: 'control-row', key: 'tool-row' }, [
            h('label', { htmlFor: 'agent-tool-select', key: 'label' }, 'Delegation Agent'),
            h('select', {
              id: 'agent-tool-select',
              className: 'control-select',
              value: runtime.agentTool,
              disabled: controlsLocked,
              onChange: function (event) {
                var nextTool = event && event.target ? event.target.value : 'codex';
                props.setRuntime(function (current) {
                  return Object.assign({}, current, { agentTool: nextTool });
                });
              },
              key: 'select'
            }, [
              h('option', { value: 'codex', key: 'codex' }, 'Codex'),
              h('option', { value: 'cline', key: 'cline' }, 'Cline')
            ]),
            h('div', { className: 'small-note', key: 'note' }, 'Select the implementation agent used when you delegate after planning and review.')
          ]),
          h('div', { className: 'control-row', key: 'review-edit-row' }, [
            h('label', { htmlFor: 'review-edits-input', key: 'label' }, 'Reviewer Additions / Deletions'),
            h('textarea', {
              id: 'review-edits-input',
              className: 'control-textarea review-textarea',
              value: runtime.reviewEdits || '',
              disabled: controlsLocked,
              title: 'Reviewer notes input. Add edits, additions, removals, or clarifications to include in the next run or delegation.',
              placeholder: 'Type reviewer additions, deletions, clarifications, or delivery notes here. These notes are included in the next Run, Re-analyze, or Delegate request.',
              onChange: function (event) {
                var nextValue = event && event.target ? event.target.value : '';
                props.setRuntime(function (current) {
                  return Object.assign({}, current, { reviewEdits: nextValue });
                });
              },
              key: 'input'
            }),
            h('div', { className: 'small-note', key: 'note' }, 'This is saved locally and included automatically in the next digital worker run and agent delegation.'),
            h('div', { className: 'section-inline-actions', key: 'actions' }, [
              h('button', {
                className: 'btn ghost',
                disabled: controlsLocked || !(runtime.reviewEdits && runtime.reviewEdits.trim()),
                onClick: function () {
                  props.setRuntime(function (current) {
                    return Object.assign({}, current, { reviewEdits: '' });
                  });
                },
                title: 'Remove the current reviewer additions and deletions from local state.',
                key: 'clear'
              }, 'Clear Review Edits')
            ])
          ]),
          h('div', { className: 'control-row', key: 'prompt-override-row' }, [
            h('label', { key: 'label' }, 'Stage Overrides'),
            h('div', { className: 'small-note', key: 'note' }, activeOverrideCount
              ? ('Overrides active for ' + activeOverrideCount + ' stage(s). These instructions are applied in re-analysis and delegation flows.')
              : 'No overrides active. Add one only when a reviewer wants to alter behavior for a specific stage.'
            ),
            h('div', { className: 'section-inline-actions', key: 'actions' }, [
              h('button', {
                className: 'btn ghost',
                disabled: controlsLocked,
                onClick: function () {
                  setShowOverrideEditor(!showOverrideEditor);
                },
                title: 'Open the stage override editor to add reviewer guidance for a specific workflow stage.',
                key: 'toggle'
              }, showOverrideEditor ? 'Hide Override Editor' : 'Add / Edit Stage Override'),
              h('button', {
                className: 'btn ghost',
                disabled: controlsLocked || activeOverrideCount === 0,
                onClick: function () {
                  props.setRuntime(function (current) {
                    return Object.assign({}, current, { promptOverrides: normalizePromptOverrides({}) });
                  });
                  setShowOverrideEditor(false);
                },
                title: 'Clear all saved stage-specific prompt overrides from local state.',
                key: 'clear-overrides'
              }, 'Clear Prompt Overrides')
            ]),
            showOverrideEditor ? h('div', { className: 'override-editor', key: 'editor' }, [
              h('div', { className: 'control-row', key: 'stage-selector' }, [
                h('label', { htmlFor: 'override-stage-select', key: 'stage-label' }, 'Select Stage'),
                h('select', {
                  id: 'override-stage-select',
                  className: 'control-select',
                  value: selectedOverrideStage,
                  disabled: controlsLocked,
                  onChange: function (event) {
                    setSelectedOverrideStage(event && event.target ? event.target.value : selectedOverrideStage);
                  },
                  key: 'select'
                }, PROMPT_OVERRIDE_STAGES.map(function (stage) {
                  return h('option', { value: stage.key, key: stage.key }, stage.label);
                }))
              ]),
              h('div', { className: 'control-row', key: 'stage-editor' }, [
                h('label', { htmlFor: 'override-stage-text', key: 'text-label' }, 'Override Instruction'),
                h('textarea', {
                  id: 'override-stage-text',
                  className: 'control-textarea',
                  value: selectedOverrideValue,
                  disabled: controlsLocked,
                  title: 'Override instruction for the selected workflow stage.',
                  placeholder: 'Add a reviewer override instruction for the selected stage...',
                  onChange: function (event) {
                    var nextValue = event && event.target ? event.target.value : '';
                    props.setRuntime(function (current) {
                      var nextOverrides = Object.assign({}, current.promptOverrides || {});
                      nextOverrides[selectedOverrideStage] = nextValue;
                      return Object.assign({}, current, { promptOverrides: nextOverrides });
                    });
                  },
                  key: 'textarea'
                }),
                h('div', { className: 'section-inline-actions', key: 'editor-actions' }, [
                  h('button', {
                    className: 'btn ghost',
                    disabled: controlsLocked || !(selectedOverrideValue && selectedOverrideValue.trim()),
                    onClick: function () {
                      props.setRuntime(function (current) {
                        var nextOverrides = Object.assign({}, current.promptOverrides || {});
                        nextOverrides[selectedOverrideStage] = '';
                          return Object.assign({}, current, { promptOverrides: nextOverrides });
                      });
                    },
                    title: 'Remove the override for the currently selected stage only.',
                    key: 'clear-selected'
                  }, 'Clear Selected Override')
                ])
              ])
            ]) : null
          ])
        ])
      ]),
      h('div', { className: 'intake-actions', key: 'cta' }, [
        h('div', { className: 'intake-actions-bar', key: 'bar' }, [
          h('div', { className: 'intake-action-cluster primary-cluster', key: 'primary' }, runtime.hasRun ? [
            h('button', {
              className: 'btn primary',
              disabled: runtime.running || !isOnline || isAgentBusy || !isDirtySinceLastRun,
              onClick: props.onReanalyze,
              title: reanalyzeTitle,
              key: 'reanalyze'
            }, runtime.running ? 'Analyzing…' : 'Update & Re-analyze'),
            h('button', {
              className: 'btn secondary',
              disabled: runtime.running || !isOnline || isAgentBusy,
              onClick: props.onLaunch,
              title: launchTitle,
              key: 'launch'
            }, isAgentBusy ? 'Agent Running' : 'Delegate to Agent'),
            showRetryAction ? h('button', {
              className: 'btn secondary',
              disabled: runtime.running || !isOnline || isAgentBusy,
              onClick: props.onRetry,
              title: 'Retry the most recent coding-agent launch with the current selected agent.',
              key: 'retry'
            }, 'Retry ' + (runtime.agentTool === 'cline' ? 'Cline' : 'Codex')) : null,
            showAgentStatusAction ? h('button', {
              className: 'btn agent-status-button ' + agentState.status,
              disabled: runtime.running || !isOnline,
              onClick: function () {
                try {
                  var panel = document.querySelector('.server-panel');
                  if (panel && panel.scrollIntoView) {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                } catch (error) {
                  // ignore smooth scroll failures
                }
                props.onRefreshStatus();
              },
              title: 'Refresh delegated agent progress and jump to the Execution Health section without rerunning the full analysis.',
              key: 'refresh-status'
            }, 'Agent Status: ' + agentState.label) : null
          ] : [
            h('button', {
              className: 'btn primary',
              disabled: runtime.running || !isOnline || isAgentBusy,
              onClick: props.onRun,
              title: 'Run Oracle Developer Twin for the first time and generate the planning, evidence, and review artifacts.',
              key: 'run'
            }, runtime.running ? 'Analyzing…' : 'Run digital worker')
          ]),
          h('div', { className: 'intake-action-cluster utility-cluster', key: 'utility' }, [
            showInitializeGit ? h('button', {
              className: 'btn ghost',
              disabled: controlsLocked || !isOnline || !runtime.repoStatus.canInitializeGit,
              onClick: props.onInitGit,
              title: 'Initialize a Git repository in the selected folder when the folder exists but is not yet a Git repo.',
              key: 'init-git'
            }, 'Initialize Git') : null,
            h('button', {
              className: 'btn ghost',
              disabled: controlsLocked,
              onClick: function () {
                props.setRuntime(function (current) {
                  return Object.assign({}, current, { ticket: SAMPLE });
                });
              },
              title: 'Populate the intake with the built-in sample story for a guided walkthrough.',
              key: 'sample'
            }, 'Load Sample'),
            h('button', {
              className: 'btn ghost',
              disabled: controlsLocked,
              onClick: props.onReset,
              title: 'Clear saved intake state and return the dashboard to a fresh first-run state.',
              key: 'reset'
            }, 'Reset')
          ])
        ]),
        h('div', { className: 'intake-status-line small-note', key: 'status' }, [
          h('div', { key: 'api' }, runtime.apiStatus),
          h('div', { className: 'intake-status-hint', key: 'hint' }, statusHint),
          controlsLocked && isAgentBusy ? h('div', { className: 'intake-status-hint', key: 'lock' }, 'Inputs are temporarily locked while the current delegated agent run is active so the work item stays governed and traceable.') : null,
          h('div', { className: 'human-review-guide', key: 'review-guide' }, [
            h('strong', { key: 'title' }, 'Human Review Path'),
            h('p', { key: 'step-1' }, '1. Review the generated evidence below in Delivery Workflow, Outcome Snapshot, Execution Health, and the Review Surface tabs.'),
            h('p', { key: 'step-2' }, '2. Add requested changes in Reviewer Additions / Deletions or use Stage Overrides when a reviewer wants to steer one specific stage.'),
            h('p', { key: 'step-3' }, runtime.hasRun
              ? '3. Click Update & Re-analyze after review edits, then Delegate to Agent only after the plan looks right. Final code approval still happens in the repo diff and changed files.'
              : '3. Run the digital worker first. After the first run, use the same review path before delegating implementation.')
          ])
        ])
      ])
    ]);
  }

  function OutcomePanel(props) {
    var promptStatus = getPromptProviderStatus(props.runtime);
    if (!props.runtime.hasRun) {
      return h(SectionCard, {
        title: 'Outcome Snapshot',
        subtitle: 'No run data yet.'
      }, [
        h('div', { className: 'small-note', key: 'copy' }, 'Run the digital worker to populate design, impact, accessibility, and execution artifacts.'),
        h('div', { className: 'split-grid', key: 'stats' }, [
          h('div', { className: 'mini-stat', key: 'repo' }, [
            h('label', { key: 'l' }, 'Target repo'),
            h(MiniStatValue, { value: props.runtime.targetRepoPath || 'not selected', max: 28, variant: 'path', key: 'v' }),
            h('div', { className: 'small-note', key: 'n' }, 'Select or paste the repo path first, then run.')
          ]),
          h('div', { className: 'mini-stat', key: 'agent' }, [
            h('label', { key: 'l' }, 'Execution agent'),
            h(MiniStatValue, { value: props.runtime.agentTool === 'cline' ? 'Cline' : 'Codex', variant: 'status', key: 'v' }),
            h('div', { className: 'small-note', key: 'n' }, 'Chosen implementation agent for delegation after planning.')
          ])
        ]),
        h('div', { className: 'small-note', key: 'status' }, props.runtime.apiStatus)
      ]);
    }

    return h(SectionCard, {
      title: 'Outcome Snapshot',
      subtitle: 'Current generated evidence and review posture for the digital worker run.'
    }, [
      h('div', { className: 'split-grid', key: 'stats' }, [
        h('div', { className: 'mini-stat', key: 'summary' }, [
          h('label', { key: 'l' }, 'Story'),
          h(MiniStatValue, { value: MODEL.summary, max: 26, variant: 'story', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Current scenario prepared for the dashboard.')
        ]),
        h('div', { className: 'mini-stat', key: 'readiness' }, [
          h('label', { key: 'l' }, 'Prompt readiness'),
          h(MiniStatValue, { value: MODEL.readinessScore + '%', variant: 'numeric', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Combines acceptance criteria, scope, accessibility, and module signals.')
        ]),
        h('div', { className: 'mini-stat', key: 'review' }, [
          h('label', { key: 'l' }, 'Review status'),
          h(MiniStatValue, { value: String(MODEL.metrics.reviewStatus || 'ready').replace(/_/g, ' '), max: 20, variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Human review remains the final merge and release gate.')
        ]),
        h('div', { className: 'mini-stat', key: 'artifact' }, [
          h('label', { key: 'l' }, 'Artifacts ready'),
          h(MiniStatValue, { value: MODEL.metrics.artifactsReady, variant: 'numeric', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Generated workpacks, prompts, and evidence files available for review.')
        ]),
        h('div', { className: 'mini-stat', key: 'repo' }, [
          h('label', { key: 'l' }, 'Target repo'),
          h(MiniStatValue, { value: props.runtime.targetRepoPath || 'not selected', max: 24, variant: 'path', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Repo-aware analysis and delegated execution use this path.')
        ]),
        h('div', { className: 'mini-stat', key: 'provider' }, [
          h('label', { key: 'l' }, 'Prompt provider'),
          h(MiniStatValue, { value: String(promptStatus.provider || 'template').toUpperCase(), max: 18, variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, summarizePromptProviderStatus(promptStatus))
        ]),
        h('div', { className: 'mini-stat', key: 'agent' }, [
          h('label', { key: 'l' }, 'Execution agent'),
          h(MiniStatValue, { value: props.runtime.agentTool === 'cline' ? 'Cline' : 'Codex', variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Delegation target selected for implementation after planning.')
        ]),
        h('div', { className: 'mini-stat', key: 'repo-status' }, [
          h('label', { key: 'l' }, 'Repo status'),
          h(MiniStatValue, { value: repoStatusTitle(props.runtime.repoStatus.status), max: 20, variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, props.runtime.repoStatus.detail || 'Repo status is being checked.')
        ])
      ]),
      h('div', { className: 'small-note', key: 'status' }, props.runtime.apiStatus)
    ]);
  }

  function PromptProviderPanel(props) {
    var promptStatus = getPromptProviderStatus(props.runtime);
    if (!props.runtime.hasRun) {
      return h(SectionCard, {
        title: 'Prompt Provider Status',
        subtitle: 'No run data yet.'
      }, [
        h('div', { className: 'small-note', key: 'copy' }, 'Run digital worker to show whether each stage prompt came from OCI directly or used the safe template fallback path.')
      ]);
    }

    return h(SectionCard, {
      title: 'Prompt Provider Status',
      subtitle: 'Shows whether the 7 stage prompts came from OCI directly or fell back to the built-in template path.'
    }, [
      h('div', { className: 'split-grid', key: 'stats' }, [
        h('div', { className: 'mini-stat', key: 'provider' }, [
          h('label', { key: 'l' }, 'Provider'),
          h('strong', { key: 'v' }, String(promptStatus.provider || 'template').toUpperCase()),
          h('div', { className: 'small-note', key: 'n' }, (promptStatus.region || promptStatus.profile)
            ? [promptStatus.region || '', promptStatus.profile || ''].filter(Boolean).join(' · ')
            : 'Latest prompt source used by the SDLC stages.')
        ]),
        h('div', { className: 'mini-stat', key: 'model' }, [
          h('label', { key: 'l' }, 'Model'),
          h('strong', { key: 'v' }, shorten(promptStatus.model || 'n/a', 24)),
          h('div', { className: 'small-note', key: 'n' }, promptStatus.servingType ? ('Serving: ' + promptStatus.servingType) : 'Model used for prompt generation when OCI is active.')
        ]),
        h('div', { className: 'mini-stat', key: 'fallbacks' }, [
          h('label', { key: 'l' }, 'Fallbacks'),
          h('strong', { key: 'v' }, String((promptStatus.summary && promptStatus.summary.fallback) || 0)),
          h('div', { className: 'small-note', key: 'n' }, 'Stage prompts that switched to the safe template fallback path.')
        ]),
        h('div', { className: 'mini-stat', key: 'failures' }, [
          h('label', { key: 'l' }, 'Failures'),
          h('strong', { key: 'v' }, String((promptStatus.summary && promptStatus.summary.failed) || 0)),
          h('div', { className: 'small-note', key: 'n' }, 'Prompt-generation failures that need attention before the next run or delegation.')
        ])
      ]),
      h('div', { className: 'small-note', key: 'summary' }, summarizePromptProviderStatus(promptStatus) + ' Updated: ' + shorten(promptStatus.generatedAt || MODEL.meta.generatedAt, 24)),
      h(DetailList, {
        items: (promptStatus.stages || []).map(function (stage) {
          var detail = String(stage.provider || 'template').toUpperCase() + ' · ' + (stage.latencyMs || 0) + 'ms';
          if (stage.fallback) detail += ' · template fallback used';
          else detail += ' · direct generation';
          if (stage.error) detail += ' · ' + shorten(stage.error, 96);
          return {
            label: stage.label || stage.stage,
            status: stage.status === 'failed' ? 'failed' : (stage.fallback ? 'fallback' : 'direct'),
            detail: detail
          };
        }),
        statusContext: 'prompt-provider',
        key: 'stages'
      })
    ]);
  }

  function ServerPanel(props) {
    if (!props.runtime.hasRun) {
      return h(SectionCard, {
        title: 'Execution Health',
        subtitle: 'Live control-plane status, response visibility, and completion state for the delegated coding agent.',
        className: 'server-panel'
      }, [
        h('div', { className: 'server-grid', key: 'grid' }, [
          h('div', { className: 'subcard', key: 'server' }, [
            h('h3', { key: 'title' }, 'Local Context Server'),
            h('div', { className: 'small-note', key: 'body' }, props.runtime.serverHealth.detail)
          ]),
          h('div', { className: 'subcard', key: 'codex' }, [
            h('h3', { key: 'title' }, 'Agent Launch Status'),
            h('div', { className: 'small-note', key: 'body' }, 'No run/delegation yet. Launch details appear after Run or Delegate.')
          ]),
          h('div', { className: 'subcard', key: 'target' }, [
            h('h3', { key: 'title' }, 'Current Target Repo'),
            h('div', { className: 'small-note', key: 'body' }, props.runtime.targetRepoPath || 'No target repo selected yet.')
          ]),
          h('div', { className: 'subcard wide', key: 'preview' }, [
            h('h3', { key: 'title' }, 'Response Preview'),
            h('pre', { className: 'code-block', key: 'code' }, 'No agent response captured yet.')
          ]),
          h('div', { className: 'subcard wide', key: 'log' }, [
            h('h3', { key: 'title' }, 'Agent Log Tail'),
            h('pre', { className: 'code-block', key: 'code' }, 'No launch log yet.')
          ]),
          h('div', { className: 'subcard', key: 'completion' }, [
            h('h3', { key: 'title' }, 'Agent Completion Status'),
            h('div', { className: 'small-note', key: 'body' }, 'No delegated agent execution has started yet.')
          ])
        ])
      ]);
    }

    return h(SectionCard, {
      title: 'Execution Health',
      subtitle: 'Live control-plane status, response visibility, and completion state for the delegated coding agent.',
      className: 'server-panel'
    }, [
      h('div', { className: 'server-grid', key: 'grid' }, [
        h('div', { className: 'subcard', key: 'server' }, [
          h('h3', { key: 'title' }, 'Local Context Server'),
          h('div', { className: 'small-note', key: 'body' }, props.runtime.serverHealth.detail)
        ]),
        h('div', { className: 'subcard', key: 'codex' }, [
          h('h3', { key: 'title' }, 'Agent Launch Status'),
          h('div', { className: 'small-note', key: 'body' }, props.runtime.codexLaunch.detail)
        ]),
        h('div', { className: 'subcard', key: 'target' }, [
          h('h3', { key: 'title' }, 'Current Target Repo'),
          h('div', { className: 'small-note', key: 'body' }, props.runtime.targetRepoPath || 'No target repo selected yet.')
        ]),
        h('div', { className: 'subcard wide', key: 'preview' }, [
          h('h3', { key: 'title' }, 'Response Preview'),
          h('pre', { className: 'code-block', key: 'code' }, props.runtime.codexLaunch.responsePreview || 'No agent response captured yet.')
        ]),
        h('div', { className: 'subcard wide', key: 'log' }, [
          h('h3', { key: 'title' }, 'Agent Log Tail'),
          h('pre', { className: 'code-block', key: 'code' }, props.runtime.codexLaunch.logTail || 'No launch log yet.')
        ]),
        h('div', { className: 'subcard', key: 'completion' }, [
          h('h3', { key: 'title' }, 'Agent Completion Status'),
          h('div', { className: 'small-note', key: 'body' }, props.runtime.completion.detail)
        ]),
        props.runtime.codexLaunch.status && props.runtime.codexLaunch.status !== 'idle' ? h('div', { className: 'subcard wide', key: 'inspect-help' }, [
          h('h3', { key: 'title' }, 'Open Changed Files / Inspect Diff'),
          h('div', { className: 'small-note', key: 'copy' }, 'Once the delegated agent is running or has finished, review the actual workspace changes in your editor or Git tools.'),
          h('ul', { className: 'help-list', key: 'list' }, [
            h('li', { key: 'one' }, 'In VS Code Source Control, review modified files and staged/unstaged diffs.'),
            h('li', { key: 'two' }, 'In terminal, use git diff to inspect code changes after the agent task updates the repo.'),
            h('li', { key: 'three' }, 'Use the response preview and log panel here as supporting evidence, but treat the repo diff as the source of truth.'),
            h('li', { key: 'four' }, 'After review, continue with your normal human approval flow before merge.')
          ])
        ]) : null
      ])
    ]);
  }

  function ChartPanel(props) {
    if (!props.runtime.hasRun) {
      return h('div', { className: 'chart-grid' }, [
        h('section', { className: 'card chart-card', key: 'readiness-empty' }, [
          h('div', { className: 'card-header', key: 'head' }, [
            h('div', { key: 'copy' }, [
              h('p', { className: 'card-title', key: 'title' }, 'Readiness Framework'),
              h('p', { className: 'card-subtitle', key: 'subtitle' }, 'What Oracle Developer Twin measures before implementation begins.')
            ])
          ]),
          h(DetailList, { key: 'details', statusContext: 'checklist', items: [
            { label: 'Ticket clarity', status: 'review', detail: 'ODT checks whether the request is specific enough to produce a safe implementation plan.' },
            { label: 'Delivery guardrails', status: 'resolved', detail: 'Repo path, reviewer edits, design inputs, and stage overrides are folded into the planning flow.' },
            { label: 'Readiness score', status: 'resolved', detail: 'After the first run, this area turns into a visible readiness gauge for judges and reviewers.' }
          ] })
        ]),
        h('section', { className: 'card chart-card', key: 'rules-empty' }, [
          h('div', { className: 'card-header', key: 'head' }, [
            h('div', { key: 'copy' }, [
              h('p', { className: 'card-title', key: 'title' }, 'Signal Preview'),
              h('p', { className: 'card-subtitle', key: 'subtitle' }, 'The first run turns this into visible repo and accessibility evidence.')
            ])
          ]),
          h('ul', { className: 'list-inline', key: 'body' }, [
            h('li', { key: 'one' }, 'Repository signal map for candidate files, blast radius, tests, and modules'),
            h('li', { key: 'two' }, 'Oracle VPAT / WCAG rule distribution for the latest scan artifacts'),
            h('li', { key: 'three' }, 'A11y hotspot files that help reviewers focus quickly')
          ])
        ])
      ]);
    }

    return h('div', { className: 'chart-grid' }, [
      h('section', { className: 'card chart-card', key: 'readiness' }, [
        h('div', { className: 'card-header', key: 'head' }, [
          h('div', { key: 'copy' }, [
            h('p', { className: 'card-title', key: 'title' }, 'Readiness Gauge'),
            h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Measures how complete and safe the intake is before implementation begins.')
          ])
        ]),
        h('div', { className: 'chart-shell', key: 'body' }, [
          h(RingChart, { value: MODEL.charts.readiness, label: 'intake readiness', color: '#c74634', key: 'ring' }),
          h('div', { className: 'chart-copy', key: 'copy' }, [
            h('strong', { key: 'headline' }, MODEL.readinessScore + '% delivery readiness'),
            h('p', { key: 'desc' }, 'This score is built from requirements clarity, accessibility expectations, module inference, and delivery constraints. It gives judges a clear view of where the digital worker reduces uncertainty early in SDLC.')
          ])
        ])
      ]),
      h('section', { className: 'card chart-card', key: 'rules' }, [
        h('div', { className: 'card-header', key: 'head' }, [
          h('div', { key: 'copy' }, [
            h('p', { className: 'card-title', key: 'title' }, 'Accessibility Risk Distribution'),
            h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Most impactful rule classes surfaced from the latest Oracle VPAT/WCAG scan.')
          ])
        ]),
        h(BarChart, { items: MODEL.charts.topRules, key: 'bars' })
      ])
    ]);
  }

  function AnalysisPanel(props) {
    if (!props.runtime.hasRun) {
      return h('div', { className: 'chart-grid' }, [
        h('section', { className: 'card chart-card', key: 'repo-empty' }, [
          h('div', { className: 'card-header', key: 'head' }, [
            h('div', { key: 'copy' }, [
              h('p', { className: 'card-title', key: 'title' }, 'Repository Signal Map'),
              h('p', { className: 'card-subtitle', key: 'subtitle' }, 'What becomes visible after the first analysis run.')
            ])
          ]),
          h(DetailList, { key: 'details', statusContext: 'checklist', items: [
            { label: 'Candidate files', status: 'review', detail: 'ODT surfaces the files most likely to be affected before any patch is applied.' },
            { label: 'Blast radius', status: 'resolved', detail: 'Reviewers get a fast sense of how broad the change could be across the repo.' },
            { label: 'Test posture', status: 'resolved', detail: 'Test coverage gaps and related files are made visible as part of the workpack story.' }
          ] })
        ]),
        h('section', { className: 'card chart-card', key: 'hotspots-empty' }, [
          h('div', { className: 'card-header', key: 'head' }, [
            h('div', { key: 'copy' }, [
              h('p', { className: 'card-title', key: 'title' }, 'Explainability Preview'),
              h('p', { className: 'card-subtitle', key: 'subtitle' }, 'How Oracle Developer Twin turns analysis into a story leaders can follow.')
            ])
          ]),
          h('ul', { className: 'list-inline', key: 'body' }, [
            h('li', { key: 'one' }, 'Why these modules are in scope'),
            h('li', { key: 'two' }, 'Why these files were selected'),
            h('li', { key: 'three' }, 'Why accessibility and review signals are highlighted')
          ])
        ])
      ]);
    }

    return h('div', { className: 'chart-grid' }, [
      h('section', { className: 'card chart-card', key: 'repo' }, [
        h('div', { className: 'card-header', key: 'head' }, [
          h('div', { key: 'copy' }, [
            h('p', { className: 'card-title', key: 'title' }, 'Repository Signal Map'),
            h('p', { className: 'card-subtitle', key: 'subtitle' }, 'How much of the codebase the digital worker had to reason about before implementation.')
          ])
        ]),
        h(BarChart, {
          items: (MODEL.charts.repoSignals || []).map(function (item, index) {
            return {
              label: item.label,
              value: item.value,
              color: index % 2 === 0 ? 'linear-gradient(90deg, #c74634, #de7d61)' : 'linear-gradient(90deg, #0c7a7a, #36a3a3)'
            };
          }),
          key: 'bars'
        })
      ]),
      h('section', { className: 'card chart-card', key: 'hotspots' }, [
        h('div', { className: 'card-header', key: 'head' }, [
          h('div', { key: 'copy' }, [
            h('p', { className: 'card-title', key: 'title' }, 'A11y Hotspot Files'),
            h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Top files currently attracting the highest accessibility finding density.')
          ])
        ]),
        h(BarChart, { items: MODEL.charts.hotspotFiles, key: 'bars' })
      ])
    ]);
  }

  function HeroHeader(props) {
    return h('section', { className: 'hero hero-slim' }, [
      h('div', { className: 'hero-slim-row', key: 'row' }, [
        h('div', { className: 'hero-slim-brand', key: 'brand' }, [
          h('img', { className: 'hero-worker-logo hero-slim-logo', src: DIGITAL_WORKER_ASSET_RELATIVE_PATH, alt: 'Oracle Developer Twin digital worker', key: 'logo' })
        ]),
        h('div', { className: 'hero-slim-copy', key: 'copy' }, [
          h('img', { className: 'oracle-wordmark hero-slim-wordmark', src: ORACLE_WORDMARK_DATA_URI, alt: 'Oracle', key: 'wordmark' }),
          h('h1', { className: 'hero-slim-title', key: 'title' }, 'Oracle Developer Twin'),
          h('p', { className: 'hero-slim-kicker', key: 'kicker' }, 'Human-reviewed digital worker for frontend delivery'),
          h('p', { className: 'hero-slim-text', key: 'text' }, 'Turns one requirement into repo-aware planning, accessibility evidence, and governed implementation handoff.')
        ])
      ])
    ]);
  }

  function TabPanel(props) {
    var active = props.runtime.activeTab;
    var tab = MODEL.tabs[active] || {};
    var content = null;
    var reviewSurfaceLocked = props.runtime.running || isAgentExecutionBusy(props.runtime);
    var reviewSurfaceDirty = props.runtime.hasRun
      ? buildRunFingerprint(props.runtime) !== (props.runtime.lastRunFingerprint || '')
      : false;

    if (!props.runtime.hasRun) {
      content = [
        h('div', { className: 'subcard', key: 'empty' }, [
          h('h3', { key: 'title' }, 'What appears here after run'),
          h('div', { className: 'small-note', key: 'body' }, 'Oracle Developer Twin will load design guidance, impact explanation, accessibility evidence, code workpacks, unit-test guidance, and a PR draft in one working surface.')
        ]),
        h('div', { className: 'subcard', key: 'first-step' }, [
          h('h3', { key: 'title' }, 'Best first step'),
          h('ul', { className: 'list-inline', key: 'list' }, [
            h('li', { key: 'one' }, 'Paste the work item or load the sample story.'),
            h('li', { key: 'two' }, 'Select the target repo and optional design inputs.'),
            h('li', { key: 'three' }, 'Run digital worker to populate the evidence surface.')
          ])
        ]),
        h('div', { className: 'subcard', key: 'why' }, [
          h('h3', { key: 'title' }, 'Why this matters'),
          h('div', { className: 'small-note', key: 'body' }, 'The goal is not to hide complexity. It is to organize planning, evidence, and execution so the full SDLC flow is visible before code changes are accepted.')
        ])
      ];
    } else if (active === 'plan') {
      content = [
        h('div', { className: 'subcard', key: 'summary' }, [
          h('h3', { key: 'title' }, 'Developer Review Summary'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Human-readable implementation and review plan generated from the latest Oracle Developer Twin run.'),
          h('div', { key: 'body' }, tab.summary || 'Developer review plan not generated yet.')
        ]),
        h('div', { className: 'subcard', key: 'phases' }, [
          h('h3', { key: 'title' }, 'Review Workflow'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'The recommended sequence a developer or reviewer can follow before approving execution.'),
          (tab.phases || []).length ? h(DetailList, {
            items: (tab.phases || []).map(function (phase) {
              return {
                label: phase.title,
                detail: phase.detail
              };
            }),
            showStatus: false,
            key: 'list'
          }) : h('div', { className: 'small-note', key: 'empty' }, 'No phased review workflow is available yet.')
        ]),
        h('div', { className: 'subcard wide', key: 'files' }, [
          h('h3', { key: 'title' }, 'Planned File Actions'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Ranked repo targets that should be reviewed first before implementation or delegation approval.'),
          (tab.fileActions || []).length ? h(DetailList, {
            items: (tab.fileActions || []).map(function (item) {
              return {
                label: item.file,
                detail: item.intent + ' Confidence: ' + item.confidence + '. Signals: ' + ((item.reasons || []).join(', ') || 'repo-ranked') + '.'
              };
            }),
            showStatus: false,
            key: 'list'
          }) : h('div', { className: 'small-note', key: 'empty' }, 'No planned file actions were generated.')
        ]),
        h('div', { className: 'subcard', key: 'checklist' }, [
          h('h3', { key: 'title' }, 'Review Checklist'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Use this as the final human review gate before delegation, apply, or merge.'),
          (tab.reviewChecklist || []).length ? h('ul', { className: 'list-inline', key: 'list' }, (tab.reviewChecklist || []).map(function (item, index) {
            return h('li', { key: 'check-' + index }, item);
          })) : h('div', { className: 'small-note', key: 'empty' }, 'No review checklist generated.')
        ]),
        h('div', { className: 'subcard', key: 'approvals' }, [
          h('h3', { key: 'title' }, 'Approvals and Watchpoints'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Approval requirements, blockers, and risk notes carried into the final review package.'),
          h('div', { className: 'small-note', key: 'approvals-copy' }, (tab.approvalsRequired || []).length ? 'Required approvals:' : 'No approval metadata generated.'),
          (tab.approvalsRequired || []).length ? h('ul', { className: 'list-inline', key: 'approvals' }, (tab.approvalsRequired || []).map(function (item, index) {
            return h('li', { key: 'approval-' + index }, item);
          })) : null,
          h('div', { className: 'small-note', key: 'risks-copy' }, (tab.risks || []).length ? 'Risk watchpoints:' : 'No risk watchpoints generated.'),
          (tab.risks || []).length ? h('ul', { className: 'list-inline', key: 'risks' }, (tab.risks || []).map(function (item, index) {
            return h('li', { key: 'risk-' + index }, item);
          })) : null,
          h('div', { className: 'small-note', key: 'blockers-copy' }, (tab.blockers || []).length ? 'Blocking conditions:' : 'No blocking conditions recorded.'),
          (tab.blockers || []).length ? h('ul', { className: 'list-inline', key: 'blockers' }, (tab.blockers || []).map(function (item, index) {
            return h('li', { key: 'blocker-' + index }, item);
          })) : null
        ]),
        h('div', { className: 'subcard wide', key: 'doc' }, [
          h('h3', { key: 'title' }, 'Downloadable Review Document'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Full markdown artifact saved at reports/odt/developer-review-plan.md for developer review outside the dashboard.'),
          h('pre', { className: 'code-block', key: 'code' }, tab.content || 'Developer review plan not available.')
        ])
      ];
    } else if (active === 'design') {
      content = [
        h('div', { className: 'subcard', key: 'analysis' }, [
          h('h3', { key: 'title' }, 'Design Brief'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'What Oracle Developer Twin understood from the requested change.'),
          h('div', { key: 'body' }, tab.requirementAnalysis || 'Requirement summary not provided.')
        ]),
        h('div', { className: 'subcard', key: 'focus' }, [
          h('h3', { key: 'title' }, 'Delivery Focus'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Keep the implementation grounded in the repo signals surfaced during analysis.'),
          h('div', { className: 'split-grid three', key: 'grid' }, [
            h('div', { className: 'mini-stat', key: 'blast' }, [
              h('label', { key: 'l' }, 'Blast radius'),
              h('strong', { key: 'v' }, (MODEL.metrics.blastRadius || 0) + ' files')
            ]),
            h('div', { className: 'mini-stat', key: 'files' }, [
              h('label', { key: 'l' }, 'Candidate files'),
              h('strong', { key: 'v' }, ((MODEL.tabs.impact && MODEL.tabs.impact.candidateFiles) || []).length)
            ]),
            h('div', { className: 'mini-stat', key: 'mode' }, [
              h('label', { key: 'l' }, 'Repo scan'),
              h(MiniStatValue, {
                value: formatRepoAnalysisMode((MODEL.tabs.impact && MODEL.tabs.impact.mode) || 'unknown', false),
                max: 18,
                variant: 'status',
                key: 'v'
              })
            ])
          ])
        ]),
        h('div', { className: 'subcard wide', key: 'design' }, [
          h('h3', { key: 'title' }, 'Technical Design'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Implementation guidance prepared for the current work item.'),
          h('pre', { className: 'code-block', key: 'code' }, tab.technicalDesign || 'Technical design not generated.')
        ]),
        h('div', { className: 'subcard wide', key: 'hotspots' }, [
          h('h3', { key: 'title' }, 'Impact Hotspots'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Modules that deserve reviewer attention before execution begins.'),
          (tab.impactHighlights || []).length ? h(DetailList, {
            items: tab.impactHighlights.map(function (item) {
              return {
                label: item.modulePath,
                detail: 'Blast radius: ' + item.blastRadius + ' files'
              };
            }),
            key: 'list'
          }) : h('div', { className: 'small-note', key: 'empty' }, 'No hotspots available.')
        ])
      ];
    } else if (active === 'impact') {
      content = [
        h('div', { className: 'subcard wide', key: 'summary' }, [
          h('h3', { key: 'title' }, 'Impact Summary'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Oracle Developer Twin matched the work item against repo paths, exports, and surrounding context to narrow the likely blast radius before implementation starts.'),
          h('div', { className: 'split-grid three', key: 'grid' }, [
            h('div', { className: 'mini-stat', key: 'mode' }, [
              h('label', { key: 'l' }, 'Scan mode'),
              h(MiniStatValue, {
                value: formatRepoAnalysisMode(tab.mode || 'unknown', false),
                max: 18,
                variant: 'status',
                key: 'v'
              })
            ]),
            h('div', { className: 'mini-stat', key: 'files' }, [h('label', { key: 'l' }, 'Candidate files'), h('strong', { key: 'v' }, (tab.candidateFiles || []).length)]),
            h('div', { className: 'mini-stat', key: 'blast' }, [h('label', { key: 'l' }, 'Blast radius'), h('strong', { key: 'v' }, (MODEL.metrics.blastRadius || 0) + ' files')])
          ]),
          h('div', { className: 'evidence-note', key: 'note' }, (tab.keywords || []).length
            ? 'Intent cues were translated into ranked repo candidates, then checked against file names, exports, and nearby implementation context for reviewer visibility.'
            : 'Repo candidates were ranked from the available work-item context and current repository signals.')
        ]),
        h('div', { className: 'subcard wide', key: 'files' }, [
          h('h3', { key: 'title' }, 'Candidate Files'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Ranked repo surfaces most likely to change or influence the requested outcome.'),
          h(CandidateGrid, { items: tab.candidateDetails || [], key: 'grid' })
        ]),
        h('div', { className: 'subcard wide', key: 'risks' }, [
          h('h3', { key: 'title' }, 'Risk Notes'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Potential review concerns surfaced during the repo analysis pass.'),
          (tab.risks || []).length ? h('ul', { className: 'list-inline', key: 'list' }, (tab.risks || []).map(function (risk, index) {
            return h('li', { key: 'risk-' + index }, risk);
          })) : h('div', { className: 'small-note', key: 'empty' }, 'No risk notes generated.')
        ])
      ];
    } else if (active === 'a11y') {
      content = [
        h('div', { className: 'subcard wide', key: 'overview' }, [
          h('h3', { key: 'title' }, 'Accessibility Overview'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Accessibility evidence stays visible so reviewers can compare the repo baseline with the current work-item scope before implementation begins.'),
          h('div', { className: 'split-grid three', key: 'grid' }, [
            h('div', { className: 'mini-stat', key: 'baseline' }, [
              h('label', { key: 'l' }, 'Baseline blockers'),
              h('strong', { key: 'v' }, tab.blockers === null ? 'n/a' : String(tab.blockers)),
              h('p', { key: 'copy' }, 'Latest repo-wide baseline from the Oracle VPAT/WCAG scan artifact.')
            ]),
            h('div', { className: 'mini-stat', key: 'scoped' }, [
              h('label', { key: 'l' }, 'Current-scope blockers'),
              h('strong', { key: 'v' }, String(tab.scopedBlockers || 0)),
              h('p', { key: 'copy' }, 'Findings intersecting the inferred candidate-file set for this work item.')
            ]),
            h('div', { className: 'mini-stat', key: 'files' }, [
              h('label', { key: 'l' }, 'Files with findings'),
              h('strong', { key: 'v' }, String(tab.scopedFilesWithFindings || 0)),
              h('p', { key: 'copy' }, 'Repo files currently carrying scoped accessibility findings.')
            ])
          ])
        ]),
        h('div', { className: 'subcard wide', key: 'prompt' }, [
          h('h3', { key: 'title' }, 'Oracle VPAT / WCAG Remediation Brief'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Agent-ready accessibility guidance grounded in Oracle VPAT standards, with WCAG 2.1 AA fallback when a repo-specific prompt is not available.'),
          MODEL.a11yPrompt
            ? h('pre', { className: 'code-block', key: 'code' }, MODEL.a11yPrompt)
            : h('div', { className: 'evidence-note', key: 'empty' }, 'A repo-specific remediation brief is not available yet. Run ODT with accessibility enabled to generate reports/a11y/coding-agent-prompt.md. Oracle VPAT guidance remains anchored in reports/odt/compliance-mapping.md with WCAG 2.1 AA fallback.')
        ]),
        h('div', { className: 'subcard', key: 'rules' }, [
          h('h3', { key: 'title' }, 'Frequent Rule Patterns'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Most common rule families currently present across the repo baseline.'),
          (tab.topRules || []).length ? h(DetailList, {
            items: (tab.topRules || []).map(function (rule) {
              return {
                label: rule.ruleId,
                detail: String(rule.count) + ' findings. ' + (rule.playbook && rule.playbook.implementationHint ? rule.playbook.implementationHint : '')
              };
            }),
            key: 'list'
          }) : h('div', { className: 'small-note', key: 'empty' }, 'No repo-wide accessibility rules are loaded yet.')
        ]),
        h('div', { className: 'subcard', key: 'scope-rules' }, [
          h('h3', { key: 'title' }, 'Current Work Item Intersections'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Rule patterns that directly intersect the inferred file set for this request.'),
          (tab.scopedTopRules || []).length ? h(DetailList, {
            items: (tab.scopedTopRules || []).map(function (rule) {
              return {
                label: rule.ruleId,
                detail: String(rule.count) + ' scoped findings in the current candidate-file set'
              };
            }),
            key: 'list'
          }) : h('div', { className: 'small-note', key: 'empty' }, 'No current-scope a11y findings intersect with the inferred candidate files.')
        ]),
        h('div', { className: 'subcard wide', key: 'hotspots' }, [
          h('h3', { key: 'title' }, 'Hotspot Files'),
          h('p', { className: 'card-subtitle', key: 'subtitle' }, 'Files attracting the highest accessibility finding density in the current evidence pack.'),
          (tab.hotspots || []).length ? h(DetailList, {
            items: (tab.hotspots || []).map(function (item) {
              return {
                label: item.file,
                detail: String(item.count) + ' findings'
              };
            }),
            key: 'list'
          }) : h('div', { className: 'small-note', key: 'empty' }, 'No hotspot files are available yet.')
        ])
      ];
    } else if (active === 'code') {
      content = [h('pre', { className: 'code-block', key: 'code' }, tab.content || 'Code workpack not available.')];
    } else if (active === 'tests') {
      content = [h('pre', { className: 'code-block', key: 'code' }, tab.content || 'Unit test workpack not available.')];
    } else if (active === 'pr') {
      content = [
        h('div', { className: 'subcard', key: 'draft' }, [
          h('h3', { key: 'title' }, 'Generated PR Draft'),
          h('pre', { className: 'code-block', key: 'code' }, tab.content || 'PR draft not available.')
        ]),
        h('div', { className: 'subcard', key: 'review-edits' }, [
          h('h3', { key: 'title' }, 'Reviewer Additions / Deletions'),
          h('textarea', {
            className: 'review-editor',
            value: props.runtime.reviewEdits || '',
            disabled: reviewSurfaceLocked,
            placeholder: 'Add reviewer notes, additions, removals, edge cases, or wording changes here. These edits are appended to the next Run / Delegate request.',
            onChange: function (event) {
              var nextValue = event && event.target ? event.target.value : '';
              props.setRuntime(function (current) {
                return Object.assign({}, current, { reviewEdits: nextValue });
              });
            },
            key: 'input'
          }),
          h('div', { className: 'small-note', key: 'note' }, 'Reviewer edits are preserved and automatically included in the next digital-worker run and agent delegation request.'),
          h('div', { className: 'small-note', key: 'overrides-note' }, 'Active prompt overrides: ' + activePromptOverrideCount(props.runtime.promptOverrides)),
          h('div', { className: 'button-row', key: 'actions' }, [
            h('button', {
              className: 'btn ghost',
              disabled: reviewSurfaceLocked || !(props.runtime.reviewEdits && props.runtime.reviewEdits.trim()),
              onClick: function () {
                props.setRuntime(function (current) {
                  return Object.assign({}, current, { reviewEdits: '' });
                });
              },
              key: 'clear'
            }, 'Clear Review Edits'),
            h('button', {
              className: 'btn secondary',
              disabled: reviewSurfaceLocked || props.runtime.serverHealth.status !== 'online' || !reviewSurfaceDirty,
              onClick: props.onReanalyze,
              key: 'reanalyze'
            }, props.runtime.running ? 'Analyzing…' : 'Update & Re-analyze')
          ])
        ])
      ];
    } else {
      content = [h('pre', { className: 'code-block', key: 'code' }, tab.content || '')];
    }

    return h('section', { className: 'card content-card' }, [
      h('div', { className: 'tab-head', key: 'head' }, [
        h('div', { className: 'tab-header-copy', key: 'copy' }, [
          h('p', { className: 'card-title', key: 'title' }, 'Review Surface'),
          h('p', { key: 'body' }, 'Inspect the review plan, design, impact, accessibility, code, tests, and PR evidence Oracle Developer Twin prepared before delegation or approval.')
        ]),
        h('div', { className: 'meta-pills', key: 'pills' }, [
          h('span', { className: 'meta-pill', key: 'scan' }, formatRepoAnalysisMode(MODEL.metrics.repoAnalysisMode, true)),
          h('span', { className: 'meta-pill', key: 'files' }, MODEL.metrics.candidateFiles + ' candidate files'),
          h('span', { className: 'meta-pill', key: 'blast' }, MODEL.metrics.blastRadius + ' files in scope')
        ])
      ]),
      h('div', { className: 'tabs', key: 'tabs' }, TABS.map(function (tabInfo) {
        return h('button', {
          className: 'tab-btn ' + (props.runtime.activeTab === tabInfo.id ? 'active' : ''),
          onClick: function () {
            props.setRuntime(function (current) {
              return Object.assign({}, current, { activeTab: tabInfo.id });
            });
          },
          key: tabInfo.id
        }, tabInfo.label);
      })),
      h('div', { className: 'tab-content', key: 'content' }, content)
    ]);
  }

  function App() {
    var _a = useState(createInitialRuntime), runtime = _a[0], setRuntime = _a[1];

    useEffect(function () {
      writeStorage(persistable(runtime));
    }, [runtime]);

    useEffect(function () {
      try {
        if (window.location && window.location.search && window.location.search.indexOf('fresh=1') !== -1) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (error) {
        // ignore url cleanup failures
      }
    }, []);

    function refreshServerHealth() {
      return getJson('/health').then(function (health) {
        var targetRepoPath = runtime.targetRepoPath || 'not selected';
        return {
          status: 'online',
          detail: 'Local context server is online at 127.0.0.1:4310. Target repo: ' + targetRepoPath + '. Last heartbeat: ' + (health.generatedAt || 'n/a')
        };
      }).catch(function () {
        return {
          status: 'offline',
          detail: 'Local context server is unreachable. Start it with npm run mcp:local:serve.'
        };
      });
    }

    function refreshCodexStatus() {
      return getJson('/odt/agent/status').then(function (launch) {
        var completion = completionFromLaunch(launch);
        return {
          status: launch.status || 'idle',
          detail: summarizeCodexLaunch(launch),
          completionStatus: completion.status,
          completionDetail: completion.detail,
          logTail: launch.logTail || '',
          responseExists: Boolean(launch.responseExists),
          responsePreview: launch.responsePreview || ''
        };
      }).catch(function () {
        return {
          status: 'unknown',
          detail: 'Unable to read Codex launch status from the local server.',
          completionStatus: 'unknown',
          completionDetail: 'Unable to determine completion status from the local server.',
          logTail: '',
          responseExists: false,
          responsePreview: ''
        };
      });
    }

    function refreshRepoStatus() {
      return postJson('/repo/status', {
        targetRepoPath: runtime.targetRepoPath || '',
        ticket: runtime.ticket || '',
        workItemType: MODEL.meta.workItemType,
        reviewEdits: runtime.reviewEdits || '',
        promptOverrides: normalizePromptOverrides(runtime.promptOverrides)
      }).then(function (status) {
        return status;
      }).catch(function () {
        return {
          status: 'unknown',
          tone: 'warn',
          detail: 'Unable to inspect the selected repo path from the local server.',
          recommendation: 'You can still proceed manually, but repo validation is unavailable.',
          canInitializeGit: false
        };
      });
    }

    function refreshPromptProviderStatus() {
      return getJson('/odt/prompt-provider-status').then(function (status) {
        return normalizePromptProviderStatus(status);
      }).catch(function () {
        return getPromptProviderStatus(runtime);
      });
    }

    function syncStatuses() {
      Promise.all([refreshServerHealth(), refreshRepoStatus(), refreshCodexStatus(), refreshPromptProviderStatus()]).then(function (values) {
        var completion = completionFromLaunch(values[2]);
        setRuntime(function (current) {
          return Object.assign({}, current, {
            serverHealth: values[0],
            repoStatus: values[1],
            codexLaunch: values[2],
            completion: completion,
            promptProviderStatus: values[3]
          });
        });
      });
    }

    function refreshCompletionStatus() {
      if (runtime.running || runtime.serverHealth.status !== 'online') return;
      setRuntime(function (current) {
        return Object.assign({}, current, {
          apiStatus: 'Refreshing delegated agent completion status...'
        });
      });
      Promise.all([refreshServerHealth(), refreshCodexStatus(), refreshPromptProviderStatus()]).then(function (values) {
        var completion = completionFromLaunch(values[1]);
        setRuntime(function (current) {
          return Object.assign({}, current, {
            serverHealth: values[0],
            codexLaunch: values[1],
            completion: completion,
            promptProviderStatus: values[2],
            apiStatus: completion.detail || 'Completion status refreshed.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            apiStatus: 'Unable to refresh completion status. ' + error.message
          });
        });
      });
    }

    function browseForRepo() {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online') return;
      setRuntime(function (current) {
        return Object.assign({}, current, {
          apiStatus: 'Opening macOS folder chooser for target repo selection...'
        });
      });
      postJson('/repo/pick', {
        currentPath: runtime.targetRepoPath || MODEL.meta.workspaceRoot || ''
      }).then(function (result) {
        if (result.status === 'ok' && result.path) {
          setRuntime(function (current) {
            return Object.assign({}, current, {
              targetRepoPath: result.path,
              apiStatus: 'Target repo selected. Review the path and run the digital worker when ready.'
            });
          });
          return;
        }
        setRuntime(function (current) {
          return Object.assign({}, current, {
            apiStatus: result.message || 'Folder selection was cancelled.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            apiStatus: 'Browse helper failed. You can still paste the repo path manually. ' + error.message
          });
        });
      });
    }

    function initializeGit() {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online' || !runtime.repoStatus.canInitializeGit) return;
      setRuntime(function (current) {
        return Object.assign({}, current, {
          apiStatus: 'Initializing Git in the selected target repo...'
        });
      });
      postJson('/repo/init-git', {
        targetRepoPath: runtime.targetRepoPath || ''
      }).then(function (result) {
        return refreshRepoStatus().then(function (status) {
          setRuntime(function (current) {
            return Object.assign({}, current, {
              repoStatus: status,
              apiStatus: result.detail || 'Git initialized successfully.'
            });
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            apiStatus: 'Initialize Git failed. ' + error.message
          });
        });
      });
    }

    function uploadDesignInputs(event) {
      var fileList = event && event.target && event.target.files ? Array.prototype.slice.call(event.target.files) : [];
      if (!fileList.length || runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online') return;

      setRuntime(function (current) {
        return Object.assign({}, current, {
          uploadStatus: 'Uploading ' + fileList.length + ' file(s) for planning context...',
          apiStatus: 'Uploading design inputs to ODT...'
        });
      });

      Promise.all(fileList.map(function (file) {
        return readFileAsDataUrl(file).then(function (dataUrl) {
          var base64 = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : '';
          return {
            name: file.name,
            type: file.type || 'application/octet-stream',
            dataBase64: base64
          };
        });
      })).then(function (preparedFiles) {
        return postJson('/files/upload', {
          targetRepoPath: runtime.targetRepoPath || '',
          ticket: runtime.ticket || '',
          workItemType: MODEL.meta.workItemType,
          files: preparedFiles
        });
      }).then(function (result) {
        var intake = result.intake || {};
        var designInputs = intake.designInputs || {};
        setRuntime(function (current) {
          return Object.assign({}, current, {
            mockupImages: uniqStrings(designInputs.mockupImages || current.mockupImages || []),
            referenceDocs: uniqStrings(designInputs.referenceDocs || current.referenceDocs || []),
            uploadStatus: 'Uploaded ' + ((result.saved && result.saved.length) || 0) + ' file(s). These will be used for analysis and planning prompts.',
            apiStatus: 'Design inputs uploaded successfully. Run digital worker to refresh full artifacts.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            uploadStatus: 'Upload failed: ' + error.message,
            apiStatus: 'Upload failed. ' + error.message
          });
        });
      }).finally(function () {
        if (event && event.target) event.target.value = '';
      });
    }

    useEffect(function () {
      syncStatuses();
      var timer = window.setInterval(function () {
        syncStatuses();
      }, 5000);
      return function () {
        window.clearInterval(timer);
      };
    }, []);

    useEffect(function () {
      if (!runtime.targetRepoPath) return;
      refreshRepoStatus().then(function (status) {
        setRuntime(function (current) {
          return Object.assign({}, current, { repoStatus: status });
        });
      });
    }, [runtime.targetRepoPath, runtime.ticket]);

    function runWorker() {
      if (runtime.running || isAgentExecutionBusy(runtime)) return;
      var requestPayload = {
        ticket: runtime.ticket || '',
        reviewEdits: runtime.reviewEdits || '',
        promptOverrides: normalizePromptOverrides(runtime.promptOverrides),
        targetRepoPath: runtime.targetRepoPath || '',
        profile: MODEL.meta.profile,
        workItemType: MODEL.meta.workItemType,
        mockupImages: runtime.mockupImages,
        referenceDocs: runtime.referenceDocs
      };
      var submittedFingerprint = buildRunFingerprint(requestPayload);
      setRuntime(function (current) {
        return Object.assign({}, current, {
          running: true,
          stepStatus: {},
          apiStatus: 'Updating intake and running ODT pipeline...'
        });
      });

      refreshServerHealth().then(function (health) {
        setRuntime(function (current) {
          return Object.assign({}, current, { serverHealth: health });
        });
        return postJson('/odt/run', requestPayload);
      }).then(function () {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            hasRun: true,
            lastRunFingerprint: submittedFingerprint
          });
        });
        var chain = Promise.resolve();
        (MODEL.steps || []).forEach(function (step, index) {
          chain = chain.then(function () {
            setRuntime(function (current) {
              return Object.assign({}, current, {
                stepStatus: Object.assign({}, current.stepStatus, (function () {
                  var next = {};
                  next[step.id] = 'running';
                  return next;
                })())
              });
            });
            return new Promise(function (resolve) {
              window.setTimeout(resolve, 240 + (index * 80));
            }).then(function () {
              setRuntime(function (current) {
                return Object.assign({}, current, {
                  stepStatus: Object.assign({}, current.stepStatus, (function () {
                    var next = {};
                    next[step.id] = 'done';
                    return next;
                  })())
                });
              });
            });
          });
        });
        return chain;
      }).then(function () {
        return Promise.all([refreshCodexStatus(), refreshPromptProviderStatus()]).then(function (values) {
          var completion = completionFromLaunch(values[0]);
          setRuntime(function (current) {
            return Object.assign({}, current, {
              running: false,
              hasRun: true,
              lastRunFingerprint: submittedFingerprint,
              apiStatus: 'Artifacts refreshed. Preserving workflow state and reloading the latest dashboard...',
              codexLaunch: values[0],
              completion: completion,
              promptProviderStatus: values[1]
            });
          });
          window.setTimeout(function () {
            window.location.reload();
          }, 900);
        });
      }).catch(function (error) {
        Promise.all([refreshServerHealth(), refreshCodexStatus(), refreshPromptProviderStatus()]).then(function (values) {
          var completion = completionFromLaunch(values[1]);
          setRuntime(function (current) {
            return Object.assign({}, current, {
              running: false,
              apiStatus: 'Run failed. Make sure the local context server is active. ' + error.message,
              serverHealth: values[0],
              codexLaunch: values[1],
              completion: completion,
              promptProviderStatus: values[2]
            });
          });
        });
      });
    }

    function launchCodex() {
      if (runtime.running || isAgentExecutionBusy(runtime)) return;
      var selectedTool = runtime.agentTool || 'codex';
      var requestPayload = {
        ticket: runtime.ticket || '',
        reviewEdits: runtime.reviewEdits || '',
        promptOverrides: normalizePromptOverrides(runtime.promptOverrides),
        targetRepoPath: runtime.targetRepoPath || '',
        profile: MODEL.meta.profile,
        workItemType: MODEL.meta.workItemType,
        mockupImages: runtime.mockupImages,
        referenceDocs: runtime.referenceDocs
      };
      var submittedFingerprint = buildRunFingerprint(requestPayload);
      setRuntime(function (current) {
        return Object.assign({}, current, {
          running: true,
          apiStatus: 'Preparing execution prompt and opening a visible ' + selectedTool + ' task...'
        });
      });
      refreshServerHealth().then(function (health) {
        setRuntime(function (current) {
          return Object.assign({}, current, { serverHealth: health });
        });
        return postJson('/odt/run', requestPayload);
      }).then(function () {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            hasRun: true,
            lastRunFingerprint: submittedFingerprint
          });
        });
        return postJson('/odt/agent/launch', {
          targetRepoPath: runtime.targetRepoPath || '',
          tool: selectedTool,
          mode: 'terminal',
          refresh: false
        });
      }).then(function () {
        return Promise.all([refreshCodexStatus(), refreshPromptProviderStatus()]).then(function (values) {
          var completion = completionFromLaunch(values[0]);
          setRuntime(function (current) {
            return Object.assign({}, current, {
              running: false,
              hasRun: true,
              lastRunFingerprint: submittedFingerprint,
              apiStatus: selectedTool + ' was opened in Terminal. Continue the task there; changed files and diffs will be handled by the agent in the selected target repo.',
              codexLaunch: values[0],
              completion: completion,
              promptProviderStatus: values[1]
            });
          });
        });
      }).catch(function (error) {
        Promise.all([refreshServerHealth(), refreshCodexStatus(), refreshPromptProviderStatus()]).then(function (values) {
          var completion = completionFromLaunch(values[1]);
          setRuntime(function (current) {
            return Object.assign({}, current, {
              running: false,
              apiStatus: selectedTool + ' launch failed. Ensure the local context server is active and the CLI is authenticated. ' + error.message,
              serverHealth: values[0],
              codexLaunch: values[1],
              completion: completion,
              promptProviderStatus: values[2]
            });
          });
        });
      });
    }

    function retryCodex() {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online') return;
      launchCodex();
    }

    function resetDemoState() {
      if (runtime.running || isAgentExecutionBusy(runtime)) return;
      clearStorage();
      setRuntime(function () {
        var fresh = createInitialRuntime({ forceClean: true });
        return Object.assign({}, fresh, {
          apiStatus: 'Workspace reset. Ready to run digital worker.'
        });
      });
      window.setTimeout(function () {
        var cleanPath = window.location.pathname + '?fresh=1&t=' + Date.now();
        window.location.assign(cleanPath);
      }, 120);
    }

    var overrideCount = activePromptOverrideCount(runtime.promptOverrides);
    var hasOptionalIntakeSignals = Boolean(
      (runtime.mockupImages && runtime.mockupImages.length)
      || (runtime.referenceDocs && runtime.referenceDocs.length)
      || (runtime.reviewEdits && runtime.reviewEdits.trim())
      || overrideCount
    );
    var preRunPromptHardening = [
      {
        label: 'Requirement clarity',
        status: runtime.ticket && runtime.ticket.trim() ? 'ready' : 'needs_input',
        detail: runtime.ticket && runtime.ticket.trim()
          ? 'A work item has been provided and is ready for the first analysis pass.'
          : 'Paste the Jira story, defect, or request so ODT can plan safely.'
      },
      {
        label: 'Repository context',
        status: runtime.targetRepoPath && runtime.targetRepoPath.trim() ? 'ready' : 'needs_input',
        detail: runtime.targetRepoPath && runtime.targetRepoPath.trim()
          ? 'The target repo path is set for impact analysis and delegated execution.'
          : 'Add the target repository path so ODT can reason about real code impact.'
      },
      {
        label: 'Design and reviewer input',
        status: hasOptionalIntakeSignals ? 'ready' : 'attention',
        detail: hasOptionalIntakeSignals
          ? 'Design references, reviewer notes, or stage overrides are attached and will flow into the next run.'
          : 'Optional inputs are not attached yet. You can still run, but the digital worker will rely on default intent.'
      },
      {
        label: 'Accessibility posture',
        status: 'ready',
        detail: 'Oracle VPAT / WCAG guidance stays in the planning path from the start.'
      }
    ];
    var preRunArtifacts = (MODEL.artifacts || []).map(function (item) {
      return {
        label: item.label,
        path: item.path,
        status: 'missing',
        note: item.note
      };
    });
    var preRunExplainability = [
      {
        label: 'Why these modules are in scope',
        detail: 'ODT explains how the request maps to likely modules before any implementation handoff begins.'
      },
      {
        label: 'Why these files were selected',
        detail: 'Candidate-file reasoning becomes visible after the first repo analysis run.'
      },
      {
        label: 'Why human review matters',
        detail: 'Delegation stays visible, but approval and release decisions remain with the developer or reviewer.'
      }
    ];

    return h('main', { className: 'fedit-shell' }, [
      h(HeroHeader, { runtime: runtime }),
      h(CommandPanel, {
        runtime: runtime,
        setRuntime: setRuntime,
        onRun: runWorker,
        onReanalyze: runWorker,
        onLaunch: launchCodex,
        onRetry: retryCodex,
        onRefreshStatus: refreshCompletionStatus,
        onBrowse: browseForRepo,
        onInitGit: initializeGit,
        onFilesSelected: uploadDesignInputs,
        onReset: resetDemoState,
        key: 'command'
      }),
      h(WorkflowBoard, { runtime: runtime, key: 'workflow' }),
      h('section', { className: 'layout-grid', key: 'layout' }, [
        h('div', { className: 'stack sidebar-rail', key: 'left' }, [
          h(OutcomePanel, { runtime: runtime, key: 'outcome' }),
          h(PromptProviderPanel, { runtime: runtime, key: 'provider' })
        ]),
        h('div', { className: 'stack main-rail', key: 'right' }, [
          h(ServerPanel, { runtime: runtime, key: 'server' }),
          h(ChartPanel, { runtime: runtime, key: 'charts-a' }),
          h(AnalysisPanel, { runtime: runtime, key: 'charts-b' }),
          h(TabPanel, { runtime: runtime, setRuntime: setRuntime, onReanalyze: runWorker, key: 'tabs' })
        ])
      ]),
      h('section', { className: 'footer-grid', key: 'footer' }, runtime.hasRun ? [
        h(SectionCard, {
          title: 'Prompt Hardening Checkpoints',
          subtitle: 'Show what the digital worker validated before recommending implementation work.'
        }, [
          h(DetailList, { items: MODEL.promptHardening.questions, statusContext: 'checklist', key: 'details' }),
          h('ul', { className: 'list-inline', key: 'criteria' }, (MODEL.promptHardening.criteria || []).map(function (item, index) {
            return h('li', { key: 'criterion-' + index }, item);
          }))
        ]),
        h('div', { className: 'stack', key: 'right' }, [
          h(SectionCard, {
            title: 'Artifact Timeline',
            subtitle: 'These generated files are the evidence package for implementation, review, and stakeholder walkthroughs.',
            key: 'artifacts'
          }, [h(ArtifactList, { items: MODEL.artifacts, statusContext: 'artifact', key: 'list' })]),
          h(SectionCard, {
            title: 'Explainability',
            subtitle: 'Narrative evidence showing why Oracle Developer Twin surfaced these areas.',
            key: 'explain'
          }, [h(DetailList, { items: MODEL.explainability, showStatus: false, key: 'list' })])
        ])
      ] : [
        h(SectionCard, {
          title: 'Prompt Hardening Checkpoints',
          subtitle: 'What Oracle Developer Twin validates before the first run begins.'
        }, [
          h(DetailList, { key: 'list', items: preRunPromptHardening, statusContext: 'checklist' })
        ]),
        h('div', { className: 'stack', key: 'right-empty' }, [
          h(SectionCard, {
            title: 'Artifact Timeline',
            subtitle: 'What the first successful run will generate.',
            key: 'artifacts-empty'
          }, [h(ArtifactList, { key: 'list', items: preRunArtifacts, statusContext: 'artifact' })]),
          h(SectionCard, {
            title: 'Explainability',
            subtitle: 'How Oracle Developer Twin tells the story after analysis.',
            key: 'explain-empty'
          }, [h(DetailList, { key: 'list', items: preRunExplainability, showStatus: false })])
        ])
      ])
    ]);
  }

  ReactDOM.render(React.createElement(App), document.getElementById('app'));
}());