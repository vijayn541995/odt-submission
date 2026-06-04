(function () {
  var MODEL = {"meta":{"generatedAt":"2026-05-15T00:02:33.017Z","profile":"react-js","profileName":"React","workItemType":"feature","workspaceRoot":"/Users/vn105957/Desktop/odt-submission","targetRepoPath":"/Users/vn105957/Desktop/lpDev/journey-builder-js/"},"designInputs":{"mockupImages":["reports/odt/uploads/1778763461275-1-Screenshot_2026-05-14_at_2.49.57_PM.png","reports/odt/uploads/1778763541461-1-Screenshot_2026-05-14_at_6.28.44_PM.png"],"referenceDocs":[]},"contextArtifacts":{"status":"empty","summary":{"total":0,"ready":0,"missing":0,"invalid":0},"artifacts":[]},"reviewPacket":{"status":"empty","summary":{"changedFiles":0,"staged":0,"unstaged":0,"untracked":0,"outOfScope":0},"files":[]},"reviewEdits":"","promptOverrides":{"intake":"","impact":"","design":"","code":"","unitTests":"","compliance":"","verify":""},"promptOverrideStages":[{"key":"intake","label":"Intake"},{"key":"impact","label":"Impact"},{"key":"design","label":"Tech Design"},{"key":"code","label":"Code Workpack"},{"key":"unitTests","label":"Unit Tests"},{"key":"compliance","label":"Compliance"},{"key":"verify","label":"Verification"}],"ticket":"JOURNEY-25271 Create Assessment\nThe option 'Assessment' displays in the activity dropdown list.\nSelection displays the following:\nBreadcrumb updated to display 'Activities >> New Assessment'.\nInfo icon displays the message: 'Assessments are graded evaluations of the user's proficiency.'\nTitle 'Activity Details - Assessment'\nThe activity contains the following elements:\nActivity Name\nRequired field.\nUnique Name amongst Assessments in organization.\nFree text field.\nField alert message displayed when not unique: 'The Assessment name must be unique.'\nSupports 155 characters.\nCharacter counter is displayed.\nSpecial characters are accepted.\nPlaceholder text 'Enter the activity name.'\nWhen no characters are present in the field, the message is displayed: 'This field is required.'\nDisplay Name\n\"Display Name” header is displayed with info icon.\nMessage is displayed as a tool tip upon clicking on info icon \"Enter the name that is displayed to the learner.\" \nFree text field.\nRequired field.\nSupports special characters.\nName is not required to be unique.\nSupports 155 characters.\nCharacter counter is displayed.\nDescription \nFree text field.\nPlaceholder text displayed: 'Enter the activity description.'\nCharacter limit of 1024.\nCharacter counter displayed.\nRich text editor displayed.","summary":"JOURNEY-25271 Create Assessment · feature","headline":"JOURNEY-25271 Create Assessment","readinessScore":82,"metrics":{"stagesCompleted":"7/7","repoAnalysisMode":"repo_inferred_manifest","candidateFiles":12,"blastRadius":21,"blockers":0,"scopedBlockers":0,"scopedFilesWithA11yFindings":0,"reviewStatus":"ready_for_review","artifactsReady":"7/7","promptProvider":"template","promptFallbacks":0},"steps":[{"id":"analyze","label":"Prompt hardening","detail":"Validate acceptance criteria, constraints, and input completeness."},{"id":"impact","label":"Repository impact scan","detail":"Infer impacted modules, files, and blast radius from the repo."},{"id":"design","label":"Technical design","detail":"Draft implementation guidance, guardrails, and delivery structure."},{"id":"guidance","label":"Code and test guidance","detail":"Produce scoped workpacks for implementation and test updates."},{"id":"a11y","label":"VPAT/WCAG risk check","detail":"Apply Oracle accessibility, keyboard, and compliance guidance."},{"id":"code","label":"Implementation workpack","detail":"Prepare execution-ready prompts for Codex or Cline."},{"id":"review","label":"Human review gate","detail":"Keep release decisions transparent, explainable, and reviewable."}],"promptHardening":{"readinessScore":82,"questions":[{"label":"Acceptance criteria grounded","status":"resolved","detail":"1 acceptance criteria captured"},{"label":"Mockups or visual references","status":"resolved","detail":"2 mockup image(s) attached"},{"label":"Backward compatibility guardrails","status":"resolved","detail":"No-new-dependency constraint enforced"},{"label":"Accessibility expectations","status":"resolved","detail":"A11y explicitly requested in non-functional scope"}],"criteria":["JOURNEY-25271 Create Assessment The option 'Assessment' displays in the activity dropdown list."]},"explainability":[{"title":"Why these modules are in scope","detail":"journey-builder/activities, journey-builder/journeys were selected from intake scope and expanded through repo impact analysis."},{"title":"Why these files were selected","detail":"ODT inferred candidate files from the ticket language, acceptance criteria, optional hints, and matching repo paths."},{"title":"Why accessibility is highlighted","detail":"Accessibility rules are tracked but no active findings are loaded."},{"title":"Why these tests are suggested","detail":"3 related test files were discovered, so test strategy is grounded in existing module coverage instead of starting blind."}],"artifacts":[{"label":"Intake","path":"reports/dev-twin/intake.json","status":"ready","note":"Source ticket, constraints, and work item type"},{"label":"Tech Design","path":"reports/odt/tech-design.md","status":"ready","note":"Implementation approach and quality gates"},{"label":"Code Workpack","path":"reports/dev-twin/code-workpack.md","status":"ready","note":"Scoped implementation instructions for Codex/Cline"},{"label":"Unit Test Workpack","path":"reports/dev-twin/unit-test-workpack.md","status":"ready","note":"Happy, edge, and error test scenarios"},{"label":"A11y Prompt","path":"reports/a11y/coding-agent-prompt.md","status":"ready","note":"Oracle VPAT/WCAG + keyboard remediation guidance"},{"label":"Developer Review Plan","path":"reports/odt/developer-review-plan.md","status":"ready","note":"Human-readable phased plan for implementation review"},{"label":"Run Summary","path":"reports/odt/run-summary.md","status":"ready","note":"Review-ready execution audit trail"}],"charts":{"readiness":82,"artifactCompletion":{"ready":7,"missing":0},"topRules":[],"hotspotFiles":[],"repoSignals":[{"label":"Candidate files","value":12},{"label":"Blast radius","value":21},{"label":"Test files","value":3},{"label":"Modules","value":2}]},"promptGeneration":{"generatedAt":"2026-05-15T00:02:33.019Z","provider":"template","model":"","profile":"","region":"","servingType":"ON_DEMAND","summary":{"totalStages":7,"generated":7,"fallback":0,"failed":0},"stages":[{"stage":"intake","label":"Intake","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"impact","label":"Impact","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"compliance","label":"Compliance","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"design","label":"Tech Design","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"code-workpack","label":"Code Workpack","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"test-workpack","label":"Unit Tests","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""},{"stage":"verify-summary","label":"Verification","provider":"template","model":"","latencyMs":0,"fallback":false,"status":"generated","error":""}]},"clarifications":{"generatedAt":"2026-05-14T14:30:01.025Z","updatedAt":"","status":"ready_to_continue","summary":{"total":0,"open":0,"unresolvedHigh":0,"status":"ready_to_continue","nextAction":"Continue ODT planning or delegated execution."},"questions":[]},"conversation":{"phase":"needs_input","status":"context_artifact_missing","nextAction":"Remove stale references or re-upload missing files before launching an agent.","updatedAt":"2026-05-14T14:30:01.026Z"},"agentic":{"taskGraph":{"generatedAt":"2026-05-14T14:30:01.025Z","status":"planned","workItem":"Smoke test context gate","candidateFiles":["src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx","src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_found.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_to_import.jsx","src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/modals/activity_details_modal_container.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity_view.jsx"],"tasks":[{"id":"task-001","title":"JOURNEY-25271 Create Assessment The option 'Assessment' displays in the activity dropdown list.","kind":"ui","status":"planned","priority":"high","dependencies":[],"acceptanceCriteria":["JOURNEY-25271 Create Assessment The option 'Assessment' displays in the activity dropdown list."],"suggestedAgent":"Main Developer","allowedFiles":["src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx","src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx"],"verification":["Run affected unit tests","Review changed files and Git diff"]},{"id":"review-architecture","title":"Review implementation fit with repo patterns","kind":"review","status":"planned","priority":"high","dependencies":["task-001"],"acceptanceCriteria":["Implementation follows existing repo patterns and avoids unnecessary dependencies."],"suggestedAgent":"Architecture Reviewer","allowedFiles":[],"verification":["Review diff for scope, reuse, naming, and compatibility"]},{"id":"review-tests-a11y","title":"Review tests and accessibility coverage","kind":"review","status":"planned","priority":"high","dependencies":["task-001"],"acceptanceCriteria":["Unit test and accessibility expectations are covered before final human review."],"suggestedAgent":"Unit Test Reviewer + Accessibility Reviewer","allowedFiles":[],"verification":["Run tests","Check keyboard and assistive technology expectations"]}]},"executionPlan":{"generatedAt":"2026-05-14T14:30:01.026Z","status":"ready","currentCycle":1,"currentCycleLabel":"Review Cycle 1","nextAction":"implement_first_slice","recommendedFirstTaskId":"task-001","parallelLanes":[{"lane":"main-developer","agent":"Main Developer","taskId":"task-001","task":"JOURNEY-25271 Create Assessment The option 'Assessment' displays in the activity dropdown list.","allowedFiles":["src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx","src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx"]},{"lane":"test-planner","agent":"Unit Test Reviewer","task":"Prepare test matrix while implementation slice is in progress.","allowedFiles":[]}],"blockedTasks":[{"task":"Review implementation fit with repo patterns","reason":"Wait for main implementation patch before reviewer execution."},{"task":"Review tests and accessibility coverage","reason":"Wait for main implementation patch before reviewer execution."}],"humanQuestion":null},"schedulerDecision":{"generatedAt":"2026-05-14T14:30:01.026Z","status":"ready","decision":"ready_for_delegate","reason":"Task graph is ready. Start with the first implementation slice and keep reviewers parallel but read-only until a patch exists.","nextAction":"implement_first_slice","recommendedFirstTaskId":"task-001"},"agentRoster":{"generatedAt":"2026-05-14T14:30:01.026Z","status":"ready","strategy":"single_writer_parallel_reviewers","rules":["Only Main Developer writes code by default.","Reviewer agents stay read-only until a patch exists.","Multiple code-writing agents require disjoint write scopes in the task graph.","High-severity clarification questions block delegation."],"agents":[{"id":"planner-scheduler","name":"Planner / Scheduler","mode":"plan_only","responsibility":"Choose task order, parallel lanes, blockers, and next action.","currentTaskId":"task-001","output":"reports/odt/agentic/scheduler-decision.json"},{"id":"main-developer","name":"Main Developer","mode":"write","responsibility":"Implement the first approved slice while respecting allowed write scope.","currentTaskId":"task-001","allowedFiles":["src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx","src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx"],"output":"reports/odt/execute/agent-response.md"},{"id":"architecture-reviewer","name":"Architecture Reviewer","mode":"read_only","responsibility":"Check repo fit, boundaries, reuse, naming, and dependency discipline.","output":"reports/odt/agentic/reviews/architecture-review.json"},{"id":"unit-test-reviewer","name":"Unit Test Reviewer","mode":"read_only","responsibility":"Check unit, integration, regression, and edge-case coverage.","output":"reports/odt/agentic/reviews/unit-test-review.json"},{"id":"accessibility-reviewer","name":"Accessibility Reviewer","mode":"read_only","responsibility":"Check keyboard flow, labels, focus, semantic structure, and result announcements.","output":"reports/odt/agentic/reviews/accessibility-review.json"},{"id":"security-compliance-reviewer","name":"Security / Compliance Reviewer","mode":"read_only","responsibility":"Check dependency, data handling, policy, and enterprise compliance risks.","output":"reports/odt/agentic/reviews/security-compliance-review.json"},{"id":"build-verifier","name":"Build Verifier","mode":"verify_only","responsibility":"Run or recommend install, lint, tests, build, and smoke checks.","output":"reports/odt/agentic/reviews/build-verify.json"}]},"reviewerPlan":{"generatedAt":"2026-05-14T14:30:01.026Z","status":"waiting_for_main_developer_patch","trigger":"main_developer_patch_completed","canRunInParallel":true,"waitsFor":["task-001"],"reviewers":[{"id":"architecture-reviewer","name":"Architecture Reviewer","mode":"read_only","responsibility":"Check repo fit, boundaries, reuse, naming, and dependency discipline.","status":"waiting","output":"reports/odt/agentic/reviews/architecture-review.json"},{"id":"unit-test-reviewer","name":"Unit Test Reviewer","mode":"read_only","responsibility":"Check unit, integration, regression, and edge-case coverage.","status":"waiting","output":"reports/odt/agentic/reviews/unit-test-review.json"},{"id":"accessibility-reviewer","name":"Accessibility Reviewer","mode":"read_only","responsibility":"Check keyboard flow, labels, focus, semantic structure, and result announcements.","status":"waiting","output":"reports/odt/agentic/reviews/accessibility-review.json"},{"id":"security-compliance-reviewer","name":"Security / Compliance Reviewer","mode":"read_only","responsibility":"Check dependency, data handling, policy, and enterprise compliance risks.","status":"waiting","output":"reports/odt/agentic/reviews/security-compliance-review.json"},{"id":"build-verifier","name":"Build Verifier","mode":"verify_only","responsibility":"Run or recommend install, lint, tests, build, and smoke checks.","status":"waiting","output":"reports/odt/agentic/reviews/build-verify.json"}],"aggregator":{"id":"merge-arbitrator","name":"Merge Arbitrator","status":"waiting_for_reviewer_findings","responsibility":"Combine reviewer findings and decide continue, ask human, rework, or ready for review.","output":"reports/odt/agentic/arbitrator-decision.json"}},"reviewerFindings":{"generatedAt":"2026-05-14T12:37:48.224Z","status":"completed","patchAvailable":true,"changedFiles":["src/App.jsx","src/components/EmployeeForm.jsx","src/components/FilterBar.jsx","tests/activity-filter.spec.md","tests/employee-form.test.mjs","src/components/employeeFilterUtils.js"],"reviewers":[{"generatedAt":"2026-05-14T12:37:48.220Z","id":"architecture-reviewer","name":"Architecture Reviewer","mode":"read_only","status":"completed","score":9,"summary":"0 high, 0 medium, 1 low finding(s).","findings":[{"severity":"low","title":"Architecture review passed initial scope checks","detail":"Changed files are within the planned footprint and no large-blast-radius concern was detected.","recommendation":"Proceed to test, accessibility, and compliance review.","files":[]}],"prompt":"reports/odt/agentic/review-prompts/architecture-reviewer.md","output":"reports/odt/agentic/reviews/architecture-review.json"},{"generatedAt":"2026-05-14T12:37:48.221Z","id":"unit-test-reviewer","name":"Unit Test Reviewer","mode":"read_only","status":"completed","score":9,"summary":"0 high, 0 medium, 1 low finding(s).","findings":[{"severity":"low","title":"Test files changed","detail":"2 test-related file(s) changed.","recommendation":"Run the targeted test command and confirm the assertions cover acceptance criteria.","files":["tests/activity-filter.spec.md","tests/employee-form.test.mjs"]}],"prompt":"reports/odt/agentic/review-prompts/unit-test-reviewer.md","output":"reports/odt/agentic/reviews/unit-test-review.json"},{"generatedAt":"2026-05-14T12:37:48.222Z","id":"accessibility-reviewer","name":"Accessibility Reviewer","mode":"read_only","status":"completed","score":9,"summary":"0 high, 0 medium, 1 low finding(s).","findings":[{"severity":"low","title":"Accessibility review found no obvious blocker","detail":"No immediate keyboard, semantics, or status messaging blocker was detected from the diff preview.","recommendation":"Perform a keyboard pass and inspect accessible names before final approval.","files":[]}],"prompt":"reports/odt/agentic/review-prompts/accessibility-reviewer.md","output":"reports/odt/agentic/reviews/accessibility-review.json"},{"generatedAt":"2026-05-14T12:37:48.223Z","id":"security-compliance-reviewer","name":"Security / Compliance Reviewer","mode":"read_only","status":"completed","score":9,"summary":"0 high, 0 medium, 1 low finding(s).","findings":[{"severity":"low","title":"No dependency or secret risk detected","detail":"No dependency, obvious secret, or browser-storage risk was detected from the diff preview.","recommendation":"Continue normal compliance review.","files":[]}],"prompt":"reports/odt/agentic/review-prompts/security-compliance-reviewer.md","output":"reports/odt/agentic/reviews/security-compliance-review.json"},{"generatedAt":"2026-05-14T12:37:48.224Z","id":"build-verifier","name":"Build Verifier","mode":"verify_only","status":"completed","score":9,"summary":"0 high, 0 medium, 1 low finding(s).","findings":[{"severity":"low","title":"Verification commands passed","detail":"2 verification step(s) were recorded without failure.","recommendation":"Include verification evidence in final review.","files":[]}],"prompt":"reports/odt/agentic/review-prompts/build-verifier.md","output":"reports/odt/agentic/reviews/build-verify.json"}]},"arbitratorDecision":{"generatedAt":"2026-05-14T12:37:48.224Z","status":"ready_for_human_review","decision":"ready_for_human_review","readinessScore":9,"highFindings":0,"mediumFindings":0,"reviewerCount":5,"changedFiles":["src/App.jsx","src/components/EmployeeForm.jsx","src/components/FilterBar.jsx","tests/activity-filter.spec.md","tests/employee-form.test.mjs","src/components/employeeFilterUtils.js"],"reason":"No high-severity reviewer findings were detected.","nextAction":"Proceed to human diff review with reviewer findings visible."},"currentCycle":{"id":"cycle-007","number":7,"generatedAt":"2026-05-14T12:37:48.288Z","label":"Review Cycle 7","status":"ready_for_human_review","decision":"ready_for_human_review","readinessScore":9,"highFindings":0,"mediumFindings":0,"verificationStatus":"passed","verificationSummary":{"total":2,"passed":2,"failed":0,"skipped":0,"environmentFailures":0},"changedFiles":["src/App.jsx","src/components/EmployeeForm.jsx","src/components/FilterBar.jsx","tests/activity-filter.spec.md","tests/employee-form.test.mjs","src/components/employeeFilterUtils.js"],"artifacts":{"reviewerFindings":"reports/odt/agentic/cycles/cycle-007/reviewer-findings.json","arbitratorDecision":"reports/odt/agentic/cycles/cycle-007/arbitrator-decision.json","reworkPlan":"reports/odt/agentic/cycles/cycle-007/rework-plan.md","reworkPrompt":"reports/odt/agentic/cycles/cycle-007/rework-prompt.md","verifyResults":"reports/odt/agentic/cycles/cycle-007/verify-results.json"}},"reworkPlan":"# Review Cycle 7 Rework Plan\n\n- Cycle: cycle-007\n- Decision: ready_for_human_review\n- Readiness score: 9/10\n- Action: No code rework is required by the arbitrator. Complete verification evidence and proceed to human review.\n\n## Changed Files\n- src/App.jsx\n- src/components/EmployeeForm.jsx\n- src/components/FilterBar.jsx\n- tests/activity-filter.spec.md\n- tests/employee-form.test.mjs\n- src/components/employeeFilterUtils.js\n\n## Findings To Address\n### LOW: Architecture review passed initial scope checks\n\nReviewer: Architecture Reviewer\n\nChanged files are within the planned footprint and no large-blast-radius concern was detected.\n\nRecommendation: Proceed to test, accessibility, and compliance review.\n### LOW: Test files changed\n\nReviewer: Unit Test Reviewer\n\n2 test-related file(s) changed.\n\nRecommendation: Run the targeted test command and confirm the assertions cover acceptance criteria.\n\nFiles: tests/activity-filter.spec.md, tests/employee-form.test.mjs\n### LOW: Accessibility review found no obvious blocker\n\nReviewer: Accessibility Reviewer\n\nNo immediate keyboard, semantics, or status messaging blocker was detected from the diff preview.\n\nRecommendation: Perform a keyboard pass and inspect accessible names before final approval.\n### LOW: No dependency or secret risk detected\n\nReviewer: Security / Compliance Reviewer\n\nNo dependency, obvious secret, or browser-storage risk was detected from the diff preview.\n\nRecommendation: Continue normal compliance review.\n### LOW: Verification commands passed\n\nReviewer: Build Verifier\n\n2 verification step(s) were recorded without failure.\n\nRecommendation: Include verification evidence in final review.\n\n## Human Review Suggestions Accepted For Rework\n### LOW: Architecture review passed initial scope checks\n\nReviewer: Architecture Reviewer\n\nDecision: accepted\n\nSuggestion: Keep this architecture finding accepted; no code change needed, but preserve scoped edits in the final summary.\n\nDeveloper note: Developer accepted the reviewer guidance.\n\n## Completion Criteria\n- High-severity findings are resolved or explicitly accepted by a human reviewer.\n- Medium findings are resolved or documented with rationale.\n- Targeted tests/build checks are run or documented as unavailable.\n- Reviewer swarm is rerun after rework if files changed.\n\n","reworkPrompt":"# Main Developer Rework Prompt\n\nReview cycle: cycle-007\nArbitrator decision: ready_for_human_review\nReadiness score: 9/10\n\n## Objective\nNo code rework is required. Add or document verification evidence if still missing, then prepare for human review.\n\n## Rules\n- Keep changes scoped to the existing task and changed files unless the rework item explicitly requires more.\n- Do not add dependencies unless the dependency policy explicitly allows it.\n- Preserve accessibility behavior and existing repo patterns.\n- Update or add deterministic tests when behavior changes.\n- After changes, report what was changed and which finding each change addresses.\n\n## Planned Implementation Tasks\n- task-001: JOURNEY-25271 Create Assessment The option 'Assessment' displays in the activity dropdown list.\n\n## Changed Files From Current Cycle\n- src/App.jsx\n- src/components/EmployeeForm.jsx\n- src/components/FilterBar.jsx\n- tests/activity-filter.spec.md\n- tests/employee-form.test.mjs\n- src/components/employeeFilterUtils.js\n\n## Reviewer Findings\n### LOW: Architecture review passed initial scope checks\n\nReviewer: Architecture Reviewer\n\nChanged files are within the planned footprint and no large-blast-radius concern was detected.\n\nRecommendation: Proceed to test, accessibility, and compliance review.\n### LOW: Test files changed\n\nReviewer: Unit Test Reviewer\n\n2 test-related file(s) changed.\n\nRecommendation: Run the targeted test command and confirm the assertions cover acceptance criteria.\n\nFiles: tests/activity-filter.spec.md, tests/employee-form.test.mjs\n### LOW: Accessibility review found no obvious blocker\n\nReviewer: Accessibility Reviewer\n\nNo immediate keyboard, semantics, or status messaging blocker was detected from the diff preview.\n\nRecommendation: Perform a keyboard pass and inspect accessible names before final approval.\n### LOW: No dependency or secret risk detected\n\nReviewer: Security / Compliance Reviewer\n\nNo dependency, obvious secret, or browser-storage risk was detected from the diff preview.\n\nRecommendation: Continue normal compliance review.\n### LOW: Verification commands passed\n\nReviewer: Build Verifier\n\n2 verification step(s) were recorded without failure.\n\nRecommendation: Include verification evidence in final review.\n\n## Accepted Human Review Suggestions\n### LOW: Architecture review passed initial scope checks\n\nReviewer: Architecture Reviewer\n\nDecision: accepted\n\nSuggestion: Keep this architecture finding accepted; no code change needed, but preserve scoped edits in the final summary.\n\nDeveloper note: Developer accepted the reviewer guidance.\n\n## Verification\n- Run targeted tests for changed behavior.\n- Run lint/build checks when available.\n- Rerun ODT Reviewer Swarm after rework.\n\n","verificationResults":{"generatedAt":"2026-05-14T12:37:39.353Z","status":"passed","targetRepoPath":"/Users/vn105957/Desktop/odt-submission/demo-target-repo","nodeVersion":"v24.15.0","runtimeManager":"nvm","requestedNodeVersion":"24.15.0","runtimeDetail":".nvmrc requested Node.js 24.15.0.","cycleId":"cycle-007","cycleLabel":"Review Cycle 7","summary":{"total":2,"passed":2,"failed":0,"skipped":0,"environmentFailures":0},"steps":[{"id":"test","label":"Unit Tests","command":"npm","args":["test"],"commandLine":"nvm exec 24.15.0 npm test","required":true,"timeoutMs":120000,"runtimeManager":"nvm","nodeVersion":"v24.15.0","status":"passed","startedAt":"2026-05-14T12:37:35.673Z","finishedAt":"2026-05-14T12:37:37.283Z","durationMs":1610,"exitCode":0,"stdout":"\n> odt-demo-target-repo@1.0.0 test\n> node tests/employee-form.test.mjs\n\nPASS empty required fields keep the form disabled\nPASS filled but invalid values still block submission\nPASS submittable state transitions from invalid to valid\nPASS valid required values enable submission\nPASS aria descriptions only include hint and error ids when needed\nPASS submit status messages explain why the button is disabled\nPASS employee finder filters by query across identity fields\nPASS employee finder combines query and department filters\nPASS employee finder returns all employees when no filters are applied\nPASS department options are unique and sorted\nPASS employee form source disables submit unless the form is ready\nPASS oracle logo markup stays accessible for the home page hero\nPASS app uses employee finder panel and result counts\nPASS app hero uses the updated heading copy and oracle red heading color\n\n14 tests passed.\n","stderr":""},{"id":"build","label":"Build","command":"npm","args":["run","build"],"commandLine":"nvm exec 24.15.0 npm run build","required":true,"timeoutMs":180000,"runtimeManager":"nvm","nodeVersion":"v24.15.0","status":"passed","startedAt":"2026-05-14T12:37:37.284Z","finishedAt":"2026-05-14T12:37:39.353Z","durationMs":2069,"exitCode":0,"stdout":"\n> odt-demo-target-repo@1.0.0 build\n> vite build\n\nvite v5.4.21 building for production...\ntransforming...\n✓ 39 modules transformed.\nrendering chunks...\ncomputing gzip size...\ndist/index.html                   0.61 kB │ gzip:  0.37 kB\ndist/assets/index-0kn3OYVR.css    6.79 kB │ gzip:  2.40 kB\ndist/assets/index-ClVx3taI.js   158.97 kB │ gzip: 51.37 kB\n✓ built in 406ms\n","stderr":""}],"linkedFromCycleId":"cycle-006"},"cycleHistory":{"generatedAt":"2026-05-14T12:37:48.293Z","status":"ready","summary":{"total":7,"latestCycleId":"cycle-007","latestDecision":"ready_for_human_review","latestReadinessScore":9,"latestVerificationStatus":"passed","readinessDelta":0,"bestReadinessScore":9,"cyclesWithHighFindings":1,"cyclesWithFailedVerification":2},"cycles":[{"id":"cycle-001","number":1,"label":"Review Cycle 1","generatedAt":"2026-05-14T08:53:11.149Z","updatedAt":"2026-05-14T09:12:11.396Z","status":"ready_for_human_review","decision":"ready_for_human_review","readinessScore":9,"highFindings":0,"mediumFindings":1,"lowFindings":4,"verificationStatus":"blocked_environment","verificationSummary":{"total":2,"passed":1,"failed":1,"skipped":0,"environmentFailures":1},"changedFileCount":6,"artifacts":{"reviewerFindings":"reports/odt/agentic/cycles/cycle-001/reviewer-findings.json","arbitratorDecision":"reports/odt/agentic/cycles/cycle-001/arbitrator-decision.json","reworkPlan":"reports/odt/agentic/cycles/cycle-001/rework-plan.md","reworkPrompt":"reports/odt/agentic/cycles/cycle-001/rework-prompt.md","verifyResults":"reports/odt/agentic/cycles/cycle-001/verify-results.json","cycle":"reports/odt/agentic/cycles/cycle-001/cycle.json"}},{"id":"cycle-002","number":2,"label":"Review Cycle 2","generatedAt":"2026-05-14T09:12:32.569Z","updatedAt":"2026-05-14T09:14:36.501Z","status":"ready_for_human_review","decision":"ready_for_human_review","readinessScore":9,"highFindings":0,"mediumFindings":1,"lowFindings":4,"verificationStatus":"blocked_environment","verificationSummary":{"total":2,"passed":1,"failed":1,"skipped":0,"environmentFailures":1},"changedFileCount":6,"artifacts":{"reviewerFindings":"reports/odt/agentic/cycles/cycle-002/reviewer-findings.json","arbitratorDecision":"reports/odt/agentic/cycles/cycle-002/arbitrator-decision.json","reworkPlan":"reports/odt/agentic/cycles/cycle-002/rework-plan.md","reworkPrompt":"reports/odt/agentic/cycles/cycle-002/rework-prompt.md","verifyResults":"reports/odt/agentic/cycles/cycle-002/verify-results.json","cycle":"reports/odt/agentic/cycles/cycle-002/cycle.json"}},{"id":"cycle-003","number":3,"label":"Review Cycle 3","generatedAt":"2026-05-14T09:14:55.166Z","updatedAt":"2026-05-14T10:02:40.175Z","status":"ready_for_human_review","decision":"ready_for_human_review","readinessScore":9,"highFindings":0,"mediumFindings":1,"lowFindings":4,"verificationStatus":"passed","verificationSummary":{"total":2,"passed":2,"failed":0,"skipped":0,"environmentFailures":0},"changedFileCount":6,"artifacts":{"reviewerFindings":"reports/odt/agentic/cycles/cycle-003/reviewer-findings.json","arbitratorDecision":"reports/odt/agentic/cycles/cycle-003/arbitrator-decision.json","reworkPlan":"reports/odt/agentic/cycles/cycle-003/rework-plan.md","reworkPrompt":"reports/odt/agentic/cycles/cycle-003/rework-prompt.md","verifyResults":"reports/odt/agentic/cycles/cycle-003/verify-results.json","cycle":"reports/odt/agentic/cycles/cycle-003/cycle.json"}},{"id":"cycle-004","number":4,"label":"Review Cycle 4","generatedAt":"2026-05-14T10:02:57.570Z","updatedAt":"2026-05-14T10:02:40.175Z","status":"rework_required","decision":"rework_required","readinessScore":9,"highFindings":1,"mediumFindings":0,"lowFindings":4,"verificationStatus":"passed","verificationSummary":{"total":2,"passed":2,"failed":0,"skipped":0,"environmentFailures":0},"changedFileCount":7,"artifacts":{"reviewerFindings":"reports/odt/agentic/cycles/cycle-004/reviewer-findings.json","arbitratorDecision":"reports/odt/agentic/cycles/cycle-004/arbitrator-decision.json","reworkPlan":"reports/odt/agentic/cycles/cycle-004/rework-plan.md","reworkPrompt":"reports/odt/agentic/cycles/cycle-004/rework-prompt.md","verifyResults":"reports/odt/agentic/cycles/cycle-004/verify-results.json","cycle":"reports/odt/agentic/cycles/cycle-004/cycle.json"}},{"id":"cycle-005","number":5,"label":"Review Cycle 5","generatedAt":"2026-05-14T10:04:03.180Z","updatedAt":"2026-05-14T10:04:46.743Z","status":"ready_for_human_review","decision":"ready_for_human_review","readinessScore":9,"highFindings":0,"mediumFindings":0,"lowFindings":5,"verificationStatus":"passed","verificationSummary":{"total":2,"passed":2,"failed":0,"skipped":0,"environmentFailures":0},"changedFileCount":7,"artifacts":{"reviewerFindings":"reports/odt/agentic/cycles/cycle-005/reviewer-findings.json","arbitratorDecision":"reports/odt/agentic/cycles/cycle-005/arbitrator-decision.json","reworkPlan":"reports/odt/agentic/cycles/cycle-005/rework-plan.md","reworkPrompt":"reports/odt/agentic/cycles/cycle-005/rework-prompt.md","verifyResults":"reports/odt/agentic/cycles/cycle-005/verify-results.json","cycle":"reports/odt/agentic/cycles/cycle-005/cycle.json"}},{"id":"cycle-006","number":6,"label":"Review Cycle 6","generatedAt":"2026-05-14T10:05:02.566Z","updatedAt":"2026-05-14T12:37:39.353Z","status":"ready_for_human_review","decision":"ready_for_human_review","readinessScore":9,"highFindings":0,"mediumFindings":0,"lowFindings":5,"verificationStatus":"passed","verificationSummary":{"total":2,"passed":2,"failed":0,"skipped":0,"environmentFailures":0},"changedFileCount":6,"artifacts":{"reviewerFindings":"reports/odt/agentic/cycles/cycle-006/reviewer-findings.json","arbitratorDecision":"reports/odt/agentic/cycles/cycle-006/arbitrator-decision.json","reworkPlan":"reports/odt/agentic/cycles/cycle-006/rework-plan.md","reworkPrompt":"reports/odt/agentic/cycles/cycle-006/rework-prompt.md","verifyResults":"reports/odt/agentic/cycles/cycle-006/verify-results.json","cycle":"reports/odt/agentic/cycles/cycle-006/cycle.json"}},{"id":"cycle-007","number":7,"label":"Review Cycle 7","generatedAt":"2026-05-14T12:37:48.288Z","updatedAt":"2026-05-14T12:37:39.353Z","status":"ready_for_human_review","decision":"ready_for_human_review","readinessScore":9,"highFindings":0,"mediumFindings":0,"lowFindings":5,"verificationStatus":"passed","verificationSummary":{"total":2,"passed":2,"failed":0,"skipped":0,"environmentFailures":0},"changedFileCount":6,"artifacts":{"reviewerFindings":"reports/odt/agentic/cycles/cycle-007/reviewer-findings.json","arbitratorDecision":"reports/odt/agentic/cycles/cycle-007/arbitrator-decision.json","reworkPlan":"reports/odt/agentic/cycles/cycle-007/rework-plan.md","reworkPrompt":"reports/odt/agentic/cycles/cycle-007/rework-prompt.md","verifyResults":"reports/odt/agentic/cycles/cycle-007/verify-results.json","cycle":"reports/odt/agentic/cycles/cycle-007/cycle.json"}}]}},"server":{"apiBase":"http://127.0.0.1:4310"},"a11yPrompt":"# Coding Agent Prompt: Accessibility AI Shield (React + Terra)\n\nMode: baseline\n\nYou are an accessibility specialist for React + Terra. Apply only safe fixes for the findings below.\nConstraints:\n- Follow Oracle VPAT guidance (internal Confluence source of truth) first, fallback WCAG 2.1 AA.\n- Do not auto-commit.\n- Keep behavior unchanged except accessibility fixes.\n- If a fix is ambiguous, leave a manual-action note.\n\nScan context:\n- Files scanned: 10\n- Blockers: 0\n- Warnings: 0\n- Info: 0\n- Policy basis: Oracle A11y and VPAT minimums (Derived from APO OAG 3.0 checklist subset; Oracle VPAT guidance is primary.)\n\nManual verification references:\n- reports/a11y/manual-checklist.md\n- reports/odt/compliance-mapping.md\n\nFiles in scope:\n- No file-specific findings in the latest scan.\n\nCurrent posture:\n- No actionable static findings were detected in the latest scan.\n- Continue Oracle VPAT manual evidence checks for focus order, keyboard traps, page title, language, contrast, and other checklist items.\n- Preserve keyboard parity, semantic structure, labels/instructions, and name/role/value behavior for any new or changed UI.\n","reviewPlanMarkdown":"# ODT Developer Review Plan\n\n- Generated At: 2026-05-15T00:02:33.018Z\n- Work Item: JOURNEY-25271 Create Assessment\n- Review Status: ready_for_review\n\n## Executive Summary\nJOURNEY-25271 Create Assessment should be implemented as a minimal blast-radius change starting with 6 ranked file candidate(s) already inferred from the repository. Dependency policy already indicates no new packages should be introduced.\n\n## Review Workflow\n1. **Confirm intent and guardrails** - Review the intake summary, acceptance criteria, design inputs, and reviewer notes before touching code. Work item type: feature.\n2. **Validate impacted repo surfaces** - Start with the top-ranked candidate files and confirm they match the requested outcome before implementation begins.\n3. **Implement the minimal patch** - Follow the tech design and code workpack, preserve existing contracts, and keep the patch scoped to the smallest safe set of files.\n4. **Verify tests and accessibility** - Update deterministic happy, edge, and error tests, then validate keyboard interactions, semantic controls, and accessibility expectations.\n5. **Complete human review** - Use this plan, the run summary, and generated workpacks as review evidence before delegation approval, patch application, or merge.\n\n## Planned File Actions\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx | score=69 | confidence=0.99 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx. | signals=path:journey, path:activity, path:list, path:activities, export:ActivitySearchHistoryList, preview:icon\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx | score=63 | confidence=0.99 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx. | signals=path:journey, path:assessment, path:activity, path:activities, path:details\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx | score=54 | confidence=0.9 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx. | signals=path:journey, path:activity, path:activities, path:details\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx | score=54 | confidence=0.9 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx. | signals=path:journey, path:activity, path:list, path:activities\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx | score=54 | confidence=0.9 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx. | signals=path:journey, path:activity, path:display, path:activities\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx | score=54 | confidence=0.9 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx. | signals=path:journey, path:activity, path:activities, path:details\n\n## Reviewer Inputs\n- No reviewer edits supplied.\n\n### Active Prompt Overrides\n- None\n\n## Risk Watchpoints\n- No critical planning risk detected. Keep human-in-loop for merge approvals.\n\n## Approval Checklist\n- Requirement intent matches the planned implementation.\n- No new dependencies are introduced.\n- Candidate-file selection still makes sense after local code review.\n- Unit tests cover happy, edge, and error paths.\n- Keyboard and accessibility behavior remain intact or improve.\n- Final diff is reviewed by a human before merge.\n- Quality gate: No unauthorized dependencies\n- Quality gate: Backward compatibility preserved\n- Quality gate: Keyboard and ARIA behavior validated\n\n## Required Approvals\n- Feature owner approval\n- QA/Test owner approval\n- Accessibility reviewer approval\n\n## Blocking Conditions\n- None\n\n## Supporting Artifacts\n- reports/odt/tech-design.md\n- reports/dev-twin/code-workpack.md\n- reports/dev-twin/unit-test-workpack.md\n- reports/odt/code-patch-plan.md\n- reports/odt/verify-checklist.md\n- reports/odt/run-summary.md\n\n","techDesignMarkdown":"# ODT Tech Design\n\n- Feature: JOURNEY-25271 Create Assessment\n- Target repo: /Users/vn105957/Desktop/lpDev/journey-builder-js/\n- UI: React/Terra minimal-blast-radius update\n- API strategy: reuse current contracts unless explicitly approved\n- State strategy: incremental updates in existing store/actions\n- Error handling: loading/empty/error states with deterministic behavior\n- Testing: Jest/RTL unit coverage for happy/edge/error paths\n- Accessibility: VPAT/WCAG and keyboard parity validation\n- Governance: human-reviewed approvals before merge\n\n## Prompt Override (Design Stage)\n- No design-stage prompt override supplied.\n\n## Quality Gates\n- No unauthorized dependencies\n- Backward compatibility preserved\n- Keyboard and ARIA behavior validated\n- Deterministic unit tests updated\n","codeWorkpack":"# Codex Workpack: ODT Code Implementation\n\nWork Item: JOURNEY-25271 Create Assessment\n\nYou are a senior frontend developer assistant.\nUse the intake, inferred repo impact, and compliance guidance below to implement a reviewable patch.\n\nExecution steps:\n1) Ask clarifying questions only for safety-critical ambiguities.\n2) Review existing patterns in the inferred source files before editing.\n3) Implement code changes with backward compatibility.\n4) Include keyboard accessibility and semantic HTML by default.\n5) Summarize edge cases and regression risk after patching.\n\nScope summary:\n- src/journey-builder-app/modules/journey-builder/activities (source: 16, tests: 2)\n- src/journey-builder-app/modules/journey-builder/journeys (source: 2, tests: 1)\n\nRepo-analysis evidence:\n- Target repo path: /Users/vn105957/Desktop/lpDev/journey-builder-js/\n- Analysis mode: repo_inferred_manifest\n- Keywords: journey, 25271, create, assessment, option, displays, activity, dropdown, list, selection, following, breadcrumb, updated, display, activities, info, icon, message, assessments, graded, evaluations, proficiency, title, details\n- Mockup image: reports/odt/uploads/1778763461275-1-Screenshot_2026-05-14_at_2.49.57_PM.png\n- Mockup image: reports/odt/uploads/1778763541461-1-Screenshot_2026-05-14_at_6.28.44_PM.png\n- Reference doc: none supplied\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx [score=69] exports=ActivitySearchHistoryList signals=path:journey, path:activity, path:list, path:activities, export:ActivitySearchHistoryList, preview:icon\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx [score=63] exports=connect signals=path:journey, path:assessment, path:activity, path:activities, path:details\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx [score=54] exports=connect signals=path:journey, path:activity, path:activities, path:details\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx [score=54] exports=withRouter, sortDatesDescending signals=path:journey, path:activity, path:list, path:activities\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx [score=54] exports=withDisclosureManager signals=path:journey, path:activity, path:display, path:activities\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx [score=54] exports=connect signals=path:journey, path:activity, path:activities, path:details\n- Candidate file: src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx [score=54] exports=ActivityLibraryTable signals=path:journey, path:activity, path:list, export:ActivityLibraryTable\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx [score=52] exports=ActivityApplication signals=path:journey, path:activity, path:activities, export:ActivityApplication, preview:activity, preview:activities\n\nReviewer refinements:\n- None supplied\n\nPrompt override (code stage):\n- None supplied\n\nQuality gates to run after implementation:\n- npm run a11y:scan:ci || true\n- npm run a11y:twin:verify\n\nFeature payload:\n```json\n{\n  \"title\": \"JOURNEY-25271 Create Assessment\",\n  \"featureName\": \"JOURNEY-25271 Create Assessment\",\n  \"summary\": \"JOURNEY-25271 Create Assessment\\nThe option 'Assessment' displays in the activity dropdown list.\\nSelection displays the following:\\nBreadcrumb updated to display 'Activities >> New Assessment'.\\nInfo icon displays the message: 'Assessments are graded evaluations of the user's proficiency.'\\nTitle 'Activity Details - Assessment'\\nThe activity contains the following elements:\\nActivity Name\\nRequired field.\\nUnique Name amongst Assessments in organization.\\nFree text field.\\nField alert message displayed when not unique: 'The Assessment name must be unique.'\\nSupports 155 characters.\\nCharacter counter is displayed.\\nSpecial characters are accepted.\\nPlaceholder text 'Enter the activity name.'\\nWhen no characters are present in the field, the message is displayed: 'This field is required.'\\nDisplay Name\\n\\\"Display Name” header is displayed with info icon.\\nMessage is displayed as a tool tip upon clicking on info icon \\\"Enter the name that is displayed to the learner.\\\" \\nFree text field.\\nRequired field.\\nSupports special characters.\\nName is not required to be unique.\\nSupports 155 characters.\\nCharacter counter is displayed.\\nDescription \\nFree text field.\\nPlaceholder text displayed: 'Enter the activity description.'\\nCharacter limit of 1024.\\nCharacter counter displayed.\\nRich text editor displayed.\",\n  \"reviewEdits\": \"\",\n  \"promptOverrides\": {\n    \"intake\": \"\",\n    \"impact\": \"\",\n    \"design\": \"\",\n    \"code\": \"\",\n    \"unitTests\": \"\",\n    \"compliance\": \"\",\n    \"verify\": \"\"\n  },\n  \"targetRepoPath\": \"/Users/vn105957/Desktop/lpDev/journey-builder-js/\",\n  \"workItemType\": \"feature\",\n  \"jira\": {\n    \"ticketId\": \"ODT-DEMO-STORY-101\",\n    \"url\": \"\"\n  },\n  \"scope\": {\n    \"uiSurface\": \"web\",\n    \"complexity\": \"medium\",\n    \"repoScan\": \"full\"\n  },\n  \"requirements\": {\n    \"acceptanceCriteria\": [\n      \"JOURNEY-25271 Create Assessment The option 'Assessment' displays in the activity dropdown list.\"\n    ],\n    \"nonFunctional\": [\n      \"a11y\",\n      \"performance\",\n      \"unit-tests\"\n    ],\n    \"outOfScope\": [\n      \"No backend API changes\",\n      \"Do not alter existing permissions behavior\"\n    ]\n  },\n  \"designInputs\": {\n    \"mockupImages\": [\n      \"reports/odt/uploads/1778763461275-1-Screenshot_2026-05-14_at_2.49.57_PM.png\",\n      \"reports/odt/uploads/1778763541461-1-Screenshot_2026-05-14_at_6.28.44_PM.png\"\n    ],\n    \"referenceDocs\": [],\n    \"jiraLinks\": []\n  },\n  \"constraints\": {\n    \"noNewDependencies\": true,\n    \"releaseWindowDays\": 10,\n    \"approvedLibrariesOnly\": true\n  },\n  \"developerHints\": {\n    \"suspectedAreas\": [\n      \"src/App.jsx\",\n      \"src/components/FilterBar.jsx\",\n      \"src/components/ActivityList.jsx\"\n    ],\n    \"relatedComponents\": [\n      \"Employee list\",\n      \"Filter controls\",\n      \"Home page hero and content layout\"\n    ],\n    \"notes\": \"Use the attached mockup as visual direction for the finder section and keep accessibility behavior explicit in labels, status text, keyboard flow, and clear actions.\"\n  },\n  \"defectContext\": {\n    \"defectId\": \"\",\n    \"observedBehavior\": \"\",\n    \"expectedBehavior\": \"\",\n    \"severity\": \"medium\"\n  }\n}\n```\n\n","testWorkpack":"# Codex Workpack: ODT Unit Test Generation\n\nWork Item: JOURNEY-25271 Create Assessment\n\nGenerate or update Jest/RTL tests for impacted behavior.\nCover:\n- Happy path\n- Error path\n- Empty/loading states\n- Keyboard accessibility interactions where applicable\n\nKnown related test files:\n- tests/jest/reducers/journey-builder-reducers/activities_reducer.test.js\n- tests/jest/reducers/journey-builder-reducers/activities_type_reducer.test.js\n- tests/jest/reducers/journeys_reducer.test.js\n\nPrompt override (unit test stage):\n- None supplied\n\nRules:\n- Keep tests deterministic and isolated.\n- Avoid snapshot-only validation for behavior-heavy flows.\n- Assert accessibility roles/labels when adding interactive UI.\n\nVerification command:\n- npm test -- --watch=false --runInBand\n\n","tabs":{"plan":{"summary":"JOURNEY-25271 Create Assessment should be implemented as a minimal blast-radius change starting with 6 ranked file candidate(s) already inferred from the repository. Dependency policy already indicates no new packages should be introduced.","phases":[{"title":"Confirm intent and guardrails","detail":"Review the intake summary, acceptance criteria, design inputs, and reviewer notes before touching code. Work item type: feature."},{"title":"Validate impacted repo surfaces","detail":"Start with the top-ranked candidate files and confirm they match the requested outcome before implementation begins."},{"title":"Implement the minimal patch","detail":"Follow the tech design and code workpack, preserve existing contracts, and keep the patch scoped to the smallest safe set of files."},{"title":"Verify tests and accessibility","detail":"Update deterministic happy, edge, and error tests, then validate keyboard interactions, semantic controls, and accessibility expectations."},{"title":"Complete human review","detail":"Use this plan, the run summary, and generated workpacks as review evidence before delegation approval, patch application, or merge."}],"fileActions":[{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx","score":69,"confidence":0.99,"reasons":["path:journey","path:activity","path:list","path:activities","export:ActivitySearchHistoryList","preview:icon"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx."},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx","score":63,"confidence":0.99,"reasons":["path:journey","path:assessment","path:activity","path:activities","path:details"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx."},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx","score":54,"confidence":0.9,"reasons":["path:journey","path:activity","path:activities","path:details"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx."},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx","score":54,"confidence":0.9,"reasons":["path:journey","path:activity","path:list","path:activities"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx."},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx","score":54,"confidence":0.9,"reasons":["path:journey","path:activity","path:display","path:activities"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx."},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx","score":54,"confidence":0.9,"reasons":["path:journey","path:activity","path:activities","path:details"],"intent":"Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx."}],"reviewChecklist":["Requirement intent matches the planned implementation.","No new dependencies are introduced.","Candidate-file selection still makes sense after local code review.","Unit tests cover happy, edge, and error paths.","Keyboard and accessibility behavior remain intact or improve.","Final diff is reviewed by a human before merge.","Quality gate: No unauthorized dependencies","Quality gate: Backward compatibility preserved","Quality gate: Keyboard and ARIA behavior validated"],"approvalsRequired":["Feature owner approval","QA/Test owner approval","Accessibility reviewer approval"],"risks":["No critical planning risk detected. Keep human-in-loop for merge approvals."],"blockers":[],"content":"# ODT Developer Review Plan\n\n- Generated At: 2026-05-15T00:02:33.018Z\n- Work Item: JOURNEY-25271 Create Assessment\n- Review Status: ready_for_review\n\n## Executive Summary\nJOURNEY-25271 Create Assessment should be implemented as a minimal blast-radius change starting with 6 ranked file candidate(s) already inferred from the repository. Dependency policy already indicates no new packages should be introduced.\n\n## Review Workflow\n1. **Confirm intent and guardrails** - Review the intake summary, acceptance criteria, design inputs, and reviewer notes before touching code. Work item type: feature.\n2. **Validate impacted repo surfaces** - Start with the top-ranked candidate files and confirm they match the requested outcome before implementation begins.\n3. **Implement the minimal patch** - Follow the tech design and code workpack, preserve existing contracts, and keep the patch scoped to the smallest safe set of files.\n4. **Verify tests and accessibility** - Update deterministic happy, edge, and error tests, then validate keyboard interactions, semantic controls, and accessibility expectations.\n5. **Complete human review** - Use this plan, the run summary, and generated workpacks as review evidence before delegation approval, patch application, or merge.\n\n## Planned File Actions\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx | score=69 | confidence=0.99 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx. | signals=path:journey, path:activity, path:list, path:activities, export:ActivitySearchHistoryList, preview:icon\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx | score=63 | confidence=0.99 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx. | signals=path:journey, path:assessment, path:activity, path:activities, path:details\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx | score=54 | confidence=0.9 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx. | signals=path:journey, path:activity, path:activities, path:details\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx | score=54 | confidence=0.9 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx. | signals=path:journey, path:activity, path:list, path:activities\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx | score=54 | confidence=0.9 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx. | signals=path:journey, path:activity, path:display, path:activities\n- src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx | score=54 | confidence=0.9 | intent=Review and, if confirmed in scope, apply the smallest safe edit in src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx. | signals=path:journey, path:activity, path:activities, path:details\n\n## Reviewer Inputs\n- No reviewer edits supplied.\n\n### Active Prompt Overrides\n- None\n\n## Risk Watchpoints\n- No critical planning risk detected. Keep human-in-loop for merge approvals.\n\n## Approval Checklist\n- Requirement intent matches the planned implementation.\n- No new dependencies are introduced.\n- Candidate-file selection still makes sense after local code review.\n- Unit tests cover happy, edge, and error paths.\n- Keyboard and accessibility behavior remain intact or improve.\n- Final diff is reviewed by a human before merge.\n- Quality gate: No unauthorized dependencies\n- Quality gate: Backward compatibility preserved\n- Quality gate: Keyboard and ARIA behavior validated\n\n## Required Approvals\n- Feature owner approval\n- QA/Test owner approval\n- Accessibility reviewer approval\n\n## Blocking Conditions\n- None\n\n## Supporting Artifacts\n- reports/odt/tech-design.md\n- reports/dev-twin/code-workpack.md\n- reports/dev-twin/unit-test-workpack.md\n- reports/odt/code-patch-plan.md\n- reports/odt/verify-checklist.md\n- reports/odt/run-summary.md\n\n"},"design":{"requirementAnalysis":"JOURNEY-25271 Create Assessment\nThe option 'Assessment' displays in the activity dropdown list.\nSelection displays the following:\nBreadcrumb updated to display 'Activities >> New Assessment'.\nInfo icon displays the message: 'Assessments are graded evaluations of the user's proficiency.'\nTitle 'Activity Details - Assessment'\nThe activity contains the following elements:\nActivity Name\nRequired field.\nUnique Name amongst Assessments in organization.\nFree text field.\nField alert message displayed when not unique: 'The Assessment name must be unique.'\nSupports 155 characters.\nCharacter counter is displayed.\nSpecial characters are accepted.\nPlaceholder text 'Enter the activity name.'\nWhen no characters are present in the field, the message is displayed: 'This field is required.'\nDisplay Name\n\"Display Name” header is displayed with info icon.\nMessage is displayed as a tool tip upon clicking on info icon \"Enter the name that is displayed to the learner.\" \nFree text field.\nRequired field.\nSupports special characters.\nName is not required to be unique.\nSupports 155 characters.\nCharacter counter is displayed.\nDescription \nFree text field.\nPlaceholder text displayed: 'Enter the activity description.'\nCharacter limit of 1024.\nCharacter counter displayed.\nRich text editor displayed.","technicalDesign":"# ODT Tech Design\n\n- Feature: JOURNEY-25271 Create Assessment\n- Target repo: /Users/vn105957/Desktop/lpDev/journey-builder-js/\n- UI: React/Terra minimal-blast-radius update\n- API strategy: reuse current contracts unless explicitly approved\n- State strategy: incremental updates in existing store/actions\n- Error handling: loading/empty/error states with deterministic behavior\n- Testing: Jest/RTL unit coverage for happy/edge/error paths\n- Accessibility: VPAT/WCAG and keyboard parity validation\n- Governance: human-reviewed approvals before merge\n\n## Prompt Override (Design Stage)\n- No design-stage prompt override supplied.\n\n## Quality Gates\n- No unauthorized dependencies\n- Backward compatibility preserved\n- Keyboard and ARIA behavior validated\n- Deterministic unit tests updated\n","impactHighlights":[{"modulePath":"src/journey-builder-app/modules/journey-builder/activities","blastRadius":18},{"modulePath":"src/journey-builder-app/modules/journey-builder/journeys","blastRadius":3}]},"impact":{"mode":"repo_inferred_manifest","keywords":["journey","25271","create","assessment","option","displays","activity","dropdown","list","selection","following","breadcrumb","updated","display","activities","info","icon","message","assessments","graded","evaluations","proficiency","title","details"],"candidateFiles":["src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx","src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_found.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_to_import.jsx","src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/modals/activity_details_modal_container.jsx","src/journey-builder-app/modules/journey-builder/activities/container-components/activity_view.jsx"],"candidateDetails":[{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx","score":69,"exportNames":["ActivitySearchHistoryList"],"preview":"import React from 'react'; import PropTypes from 'prop-types'; import { MdHistory } from \"react-icons/md\"; import { FaTimes } from \"react-icons/fa\";","reasons":["path:journey","path:activity","path:list","path:activities","export:ActivitySearchHistoryList","preview:icon"]},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx","score":63,"exportNames":["connect"],"preview":"import React from 'react'; import PropTypes from 'prop-types'; import TerraField from 'terra-form-field'; import Textarea from 'terra-form-textarea';","reasons":["path:journey","path:assessment","path:activity","path:activities","path:details"]},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx","score":54,"exportNames":["connect"],"preview":"import React from 'react'; import PropTypes from 'prop-types'; import Field from 'terra-form-field'; import { connect } from 'react-redux';","reasons":["path:journey","path:activity","path:activities","path:details"]},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx","score":54,"exportNames":["withRouter","sortDatesDescending"],"preview":"import React, { useState, useEffect } from 'react'; import ReactTable from 'react-table-6'; import { Link, withRouter } from 'react-router-dom'; import PropTypes from 'prop-types';","reasons":["path:journey","path:activity","path:list","path:activities"]},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx","score":54,"exportNames":["withDisclosureManager"],"preview":"import PropTypes, { func } from 'prop-types'; import ReactTable from 'react-table-6'; import { Link } from 'react-router-dom'; import React from 'react';","reasons":["path:journey","path:activity","path:display","path:activities"]},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx","score":54,"exportNames":["connect"],"preview":"import React from 'react'; import PropTypes from 'prop-types'; import Field from 'terra-form-field'; import Textarea from 'terra-form-textarea';","reasons":["path:journey","path:activity","path:activities","path:details"]},{"file":"src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx","score":54,"exportNames":["ActivityLibraryTable"],"preview":"import PropTypes from 'prop-types'; import ReactTable from 'react-table-6'; import React from 'react'; import 'react-table-6/react-table.css';","reasons":["path:journey","path:activity","path:list","export:ActivityLibraryTable"]},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx","score":52,"exportNames":["ActivityApplication"],"preview":"import React from 'react'; import PropTypes from 'prop-types'; import ApplicationWrapper from 'terra-base'; import ActivityContainer from './activities_container';","reasons":["path:journey","path:activity","path:activities","export:ActivityApplication","preview:activity","preview:activities"]},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_found.jsx","score":50,"exportNames":["NoActivitiesFound"],"preview":"import React from 'react'; import { FaFileAlt } from 'react-icons/fa'; import 'react-table-6/react-table.css'; import '../../../assets/styles/base/media-home.scss';","reasons":["path:journey","path:activity","path:activities","export:NoActivitiesFound","preview:icon"]},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/no_activities_to_import.jsx","score":50,"exportNames":["NoActivitiesToImport"],"preview":"import React from 'react'; import { FaFileAlt } from 'react-icons/fa'; import 'react-table-6/react-table.css'; import PropTypes from 'prop-types';","reasons":["path:journey","path:activity","path:activities","export:NoActivitiesToImport","preview:icon"]},{"file":"src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/modals/activity_details_modal_container.jsx","score":50,"exportNames":["withDisclosureManager"],"preview":"import React from 'react'; import PropTypes from 'prop-types'; import { withDisclosureManager, disclosureManagerShape } from 'terra-disclosure-manager'; import ActivityDetailsModal from './activity_details_modal';","reasons":["path:journey","path:activity","path:details","preview:activity","preview:details"]},{"file":"src/journey-builder-app/modules/journey-builder/activities/container-components/activity_view.jsx","score":49,"exportNames":["ActivityView"],"preview":"import React from 'react'; import './assets/styles/main-css.scss'; import ActivityRouteProvider from './util/activity_route_provider'; // Wrapping the main React code in 'HashRouter' to keep the URL in sync with the UI.","reasons":["path:journey","path:activity","path:activities","export:ActivityView","preview:activity"]}],"risks":["No critical planning risk detected. Keep human-in-loop for merge approvals."]},"a11y":{"blockers":0,"scopedBlockers":0,"scopedFilesWithFindings":0,"topRules":[],"scopedTopRules":[],"hotspots":[]},"code":{"content":"# Codex Workpack: ODT Code Implementation\n\nWork Item: JOURNEY-25271 Create Assessment\n\nYou are a senior frontend developer assistant.\nUse the intake, inferred repo impact, and compliance guidance below to implement a reviewable patch.\n\nExecution steps:\n1) Ask clarifying questions only for safety-critical ambiguities.\n2) Review existing patterns in the inferred source files before editing.\n3) Implement code changes with backward compatibility.\n4) Include keyboard accessibility and semantic HTML by default.\n5) Summarize edge cases and regression risk after patching.\n\nScope summary:\n- src/journey-builder-app/modules/journey-builder/activities (source: 16, tests: 2)\n- src/journey-builder-app/modules/journey-builder/journeys (source: 2, tests: 1)\n\nRepo-analysis evidence:\n- Target repo path: /Users/vn105957/Desktop/lpDev/journey-builder-js/\n- Analysis mode: repo_inferred_manifest\n- Keywords: journey, 25271, create, assessment, option, displays, activity, dropdown, list, selection, following, breadcrumb, updated, display, activities, info, icon, message, assessments, graded, evaluations, proficiency, title, details\n- Mockup image: reports/odt/uploads/1778763461275-1-Screenshot_2026-05-14_at_2.49.57_PM.png\n- Mockup image: reports/odt/uploads/1778763541461-1-Screenshot_2026-05-14_at_6.28.44_PM.png\n- Reference doc: none supplied\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx [score=69] exports=ActivitySearchHistoryList signals=path:journey, path:activity, path:list, path:activities, export:ActivitySearchHistoryList, preview:icon\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/assessment_details.jsx [score=63] exports=connect signals=path:journey, path:assessment, path:activity, path:activities, path:details\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/edit/components/activity_details.jsx [score=54] exports=connect signals=path:journey, path:activity, path:activities, path:details\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/activity_list.jsx [score=54] exports=withRouter, sortDatesDescending signals=path:journey, path:activity, path:list, path:activities\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx [score=54] exports=withDisclosureManager signals=path:journey, path:activity, path:display, path:activities\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/upload/components/activity_details.jsx [score=54] exports=connect signals=path:journey, path:activity, path:activities, path:details\n- Candidate file: src/journey-builder-app/modules/journey-builder/journeys/container-components/stages/associate_activity/activity_library_list.jsx [score=54] exports=ActivityLibraryTable signals=path:journey, path:activity, path:list, export:ActivityLibraryTable\n- Candidate file: src/journey-builder-app/modules/journey-builder/activities/container-components/activity_application.jsx [score=52] exports=ActivityApplication signals=path:journey, path:activity, path:activities, export:ActivityApplication, preview:activity, preview:activities\n\nReviewer refinements:\n- None supplied\n\nPrompt override (code stage):\n- None supplied\n\nQuality gates to run after implementation:\n- npm run a11y:scan:ci || true\n- npm run a11y:twin:verify\n\nFeature payload:\n```json\n{\n  \"title\": \"JOURNEY-25271 Create Assessment\",\n  \"featureName\": \"JOURNEY-25271 Create Assessment\",\n  \"summary\": \"JOURNEY-25271 Create Assessment\\nThe option 'Assessment' displays in the activity dropdown list.\\nSelection displays the following:\\nBreadcrumb updated to display 'Activities >> New Assessment'.\\nInfo icon displays the message: 'Assessments are graded evaluations of the user's proficiency.'\\nTitle 'Activity Details - Assessment'\\nThe activity contains the following elements:\\nActivity Name\\nRequired field.\\nUnique Name amongst Assessments in organization.\\nFree text field.\\nField alert message displayed when not unique: 'The Assessment name must be unique.'\\nSupports 155 characters.\\nCharacter counter is displayed.\\nSpecial characters are accepted.\\nPlaceholder text 'Enter the activity name.'\\nWhen no characters are present in the field, the message is displayed: 'This field is required.'\\nDisplay Name\\n\\\"Display Name” header is displayed with info icon.\\nMessage is displayed as a tool tip upon clicking on info icon \\\"Enter the name that is displayed to the learner.\\\" \\nFree text field.\\nRequired field.\\nSupports special characters.\\nName is not required to be unique.\\nSupports 155 characters.\\nCharacter counter is displayed.\\nDescription \\nFree text field.\\nPlaceholder text displayed: 'Enter the activity description.'\\nCharacter limit of 1024.\\nCharacter counter displayed.\\nRich text editor displayed.\",\n  \"reviewEdits\": \"\",\n  \"promptOverrides\": {\n    \"intake\": \"\",\n    \"impact\": \"\",\n    \"design\": \"\",\n    \"code\": \"\",\n    \"unitTests\": \"\",\n    \"compliance\": \"\",\n    \"verify\": \"\"\n  },\n  \"targetRepoPath\": \"/Users/vn105957/Desktop/lpDev/journey-builder-js/\",\n  \"workItemType\": \"feature\",\n  \"jira\": {\n    \"ticketId\": \"ODT-DEMO-STORY-101\",\n    \"url\": \"\"\n  },\n  \"scope\": {\n    \"uiSurface\": \"web\",\n    \"complexity\": \"medium\",\n    \"repoScan\": \"full\"\n  },\n  \"requirements\": {\n    \"acceptanceCriteria\": [\n      \"JOURNEY-25271 Create Assessment The option 'Assessment' displays in the activity dropdown list.\"\n    ],\n    \"nonFunctional\": [\n      \"a11y\",\n      \"performance\",\n      \"unit-tests\"\n    ],\n    \"outOfScope\": [\n      \"No backend API changes\",\n      \"Do not alter existing permissions behavior\"\n    ]\n  },\n  \"designInputs\": {\n    \"mockupImages\": [\n      \"reports/odt/uploads/1778763461275-1-Screenshot_2026-05-14_at_2.49.57_PM.png\",\n      \"reports/odt/uploads/1778763541461-1-Screenshot_2026-05-14_at_6.28.44_PM.png\"\n    ],\n    \"referenceDocs\": [],\n    \"jiraLinks\": []\n  },\n  \"constraints\": {\n    \"noNewDependencies\": true,\n    \"releaseWindowDays\": 10,\n    \"approvedLibrariesOnly\": true\n  },\n  \"developerHints\": {\n    \"suspectedAreas\": [\n      \"src/App.jsx\",\n      \"src/components/FilterBar.jsx\",\n      \"src/components/ActivityList.jsx\"\n    ],\n    \"relatedComponents\": [\n      \"Employee list\",\n      \"Filter controls\",\n      \"Home page hero and content layout\"\n    ],\n    \"notes\": \"Use the attached mockup as visual direction for the finder section and keep accessibility behavior explicit in labels, status text, keyboard flow, and clear actions.\"\n  },\n  \"defectContext\": {\n    \"defectId\": \"\",\n    \"observedBehavior\": \"\",\n    \"expectedBehavior\": \"\",\n    \"severity\": \"medium\"\n  }\n}\n```\n\n"},"tests":{"content":"# Codex Workpack: ODT Unit Test Generation\n\nWork Item: JOURNEY-25271 Create Assessment\n\nGenerate or update Jest/RTL tests for impacted behavior.\nCover:\n- Happy path\n- Error path\n- Empty/loading states\n- Keyboard accessibility interactions where applicable\n\nKnown related test files:\n- tests/jest/reducers/journey-builder-reducers/activities_reducer.test.js\n- tests/jest/reducers/journey-builder-reducers/activities_type_reducer.test.js\n- tests/jest/reducers/journeys_reducer.test.js\n\nPrompt override (unit test stage):\n- None supplied\n\nRules:\n- Keep tests deterministic and isolated.\n- Avoid snapshot-only validation for behavior-heavy flows.\n- Assert accessibility roles/labels when adding interactive UI.\n\nVerification command:\n- npm test -- --watch=false --runInBand\n\n"},"pr":{"content":"## Summary\nJOURNEY-25271 Create Assessment: JOURNEY-25271 Create Assessment\nThe option 'Assessment' displays in the activity dropdown list.\nSelection displays the following:\nBreadcrumb updated to display 'Activities >> New Assessment'.\nInfo icon displays the message: 'Assessments are graded evaluations of the user's proficiency.'\nTitle 'Activity Details - Assessment'\nThe activity contains the following elements:\nActivity Name\nRequired field.\nUnique Name amongst Assessments in organization.\nFree text field.\nField alert message displayed when not unique: 'The Assessment name must be unique.'\nSupports 155 characters.\nCharacter counter is displayed.\nSpecial characters are accepted.\nPlaceholder text 'Enter the activity name.'\nWhen no characters are present in the field, the message is displayed: 'This field is required.'\nDisplay Name\n\"Display Name” header is displayed with info icon.\nMessage is displayed as a tool tip upon clicking on info icon \"Enter the name that is displayed to the learner.\" \nFree text field.\nRequired field.\nSupports special characters.\nName is not required to be unique.\nSupports 155 characters.\nCharacter counter is displayed.\nDescription \nFree text field.\nPlaceholder text displayed: 'Enter the activity description.'\nCharacter limit of 1024.\nCharacter counter displayed.\nRich text editor displayed.\n\n## Scope\n- Work item type: feature\n- Modules in scope: 2\n- Blast radius: 21 files\n- Repo analysis mode: repo_inferred_manifest\n\n## Delivery Plan\n- Apply scoped implementation changes from the code workpack.\n- Update deterministic unit tests for happy, edge, and error paths.\n- Run VPAT/WCAG and keyboard accessibility verification before review.\n\n## Repo Analysis Signals\n- Candidate files surfaced: 12\n- Keywords used for inference: journey, 25271, create, assessment, option, displays, activity, dropdown\n\n## Accessibility\n- Current blocker count in baseline scan: 0\n- Keyboard parity and semantic controls included in implementation guidance.\n\n## Verification\n- Human review required before merge.\n- Use generated dashboards and workpacks as evidence artifacts."}},"artifactLabelsByStep":{"analyze":["Intake"],"impact":["Tech Design"],"design":["Tech Design"],"guidance":["Code Workpack","Unit Test Workpack"],"a11y":["A11y Prompt"],"code":["Code Workpack"],"review":["Developer Review Plan","Run Summary"]},"stageLabels":{"analyze":"Prompt hardening","impact":"Repository impact scan","design":"Technical design","guidance":"Code and test guidance","a11y":"VPAT/WCAG risk check","code":"Implementation workpack","review":"Human review gate"}};
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
  var useRef = React.useRef;
  var STORAGE_SCOPE = [
    (MODEL.meta && MODEL.meta.workspaceRoot) || '',
    (MODEL.meta && MODEL.meta.targetRepoPath) || '',
    (MODEL.meta && MODEL.meta.profile) || '',
    (MODEL.meta && MODEL.meta.workItemType) || ''
  ].join('|');
  var STORAGE_KEY = 'odt-fedit-runtime-v10::' + STORAGE_SCOPE;
  var RUN_SESSION_KEY = 'odt-fedit-active-run-v1::' + STORAGE_SCOPE;
  var RUN_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;
  var THEME_STORAGE_KEY = 'oracle-developer-twin-theme-v1';
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
  var EMPTY_CLARIFICATIONS = { status: 'not_generated', summary: { total: 0, open: 0, unresolvedHigh: 0 }, questions: [] };
  var EMPTY_CONVERSATION = { phase: 'draft', status: 'not_started', nextAction: 'Start with intake, then run ODT.' };
  var EMPTY_AGENTIC = { taskGraph: null, executionPlan: null, schedulerDecision: null, agentRoster: null, reviewerPlan: null, reviewerFindings: null, reviewSuggestions: null, arbitratorDecision: null, currentCycle: null, reworkPlan: '', reworkPrompt: '', verificationResults: null, cycleHistory: null };
  var EMPTY_CONTEXT_ARTIFACTS = { status: 'empty', summary: { total: 0, ready: 0, missing: 0, invalid: 0 }, artifacts: [] };
  var EMPTY_REVIEW_PACKET = { status: 'not_refreshed', summary: { changedFiles: 0, staged: 0, unstaged: 0, untracked: 0, outOfScope: 0 }, files: [], nextAction: 'Refresh after a patch exists.' };

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

  function clearRunSession() {
    try {
      window.sessionStorage.removeItem(RUN_SESSION_KEY);
    } catch (error) {
      // ignore storage failures in demo mode
    }
  }

  function readRunSession() {
    try {
      var raw = window.sessionStorage.getItem(RUN_SESSION_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      var savedAt = Number(parsed && parsed.savedAt);
      if (!parsed || !parsed.fingerprint || !savedAt || (Date.now() - savedAt) > RUN_SESSION_MAX_AGE_MS) {
        clearRunSession();
        return null;
      }
      return parsed;
    } catch (error) {
      clearRunSession();
      return null;
    }
  }

  function markRunSession(fingerprint) {
    if (!fingerprint) return;
    try {
      window.sessionStorage.setItem(RUN_SESSION_KEY, JSON.stringify({
        fingerprint: fingerprint,
        savedAt: Date.now()
      }));
    } catch (error) {
      // ignore storage failures in demo mode
    }
  }

  function shouldRestoreSavedRun(saved) {
    if (!saved || !saved.hasRun) return false;
    var activeSession = readRunSession();
    if (!activeSession || !activeSession.fingerprint) return false;
    var savedFingerprint = saved.lastRunFingerprint || buildRunFingerprint(saved);
    return savedFingerprint === activeSession.fingerprint;
  }

  function readTheme() {
    try {
      var savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    } catch (error) {
      // ignore storage failures in demo mode
    }
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (error) {
      // ignore media query failures in demo mode
    }
    return 'light';
  }

  function applyTheme(theme) {
    var nextTheme = theme === 'dark' ? 'dark' : 'light';
    try {
      document.documentElement.setAttribute('data-theme', nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
    } catch (error) {
      // ignore DOM update failures in demo mode
    }
    return nextTheme;
  }

  function writeTheme(theme) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme === 'dark' ? 'dark' : 'light');
    } catch (error) {
      // ignore storage failures in demo mode
    }
  }

  function buildIdleCodexLaunch(detail) {
    return {
      status: 'idle',
      detail: detail || 'No Codex launch started yet.',
      logTail: '',
      responseExists: false,
      responsePreview: ''
    };
  }

  function buildIdleCompletion(detail) {
    return {
      status: 'idle',
      detail: detail || 'No delegated agent execution has started yet.'
    };
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
      codexLaunch: buildIdleCodexLaunch(),
      completion: buildIdleCompletion(),
      clarifications: normalizeClarifications(EMPTY_CLARIFICATIONS),
      conversation: normalizeConversation(EMPTY_CONVERSATION),
      agentic: normalizeAgentic(EMPTY_AGENTIC),
      contextArtifacts: normalizeContextArtifacts(EMPTY_CONTEXT_ARTIFACTS),
      reviewPacket: normalizeReviewPacket(EMPTY_REVIEW_PACKET),
      lastRunFingerprint: '',
      promptProviderStatus: getPromptProviderStatus(),
      reviewEdits: '',
      promptOverrides: normalizePromptOverrides({}),
      uploadStatus: ''
    };

    if (forceClean) {
      clearRunSession();
    }

    if (forceClean || !saved) {
      return base;
    }

    var savedHasRun = shouldRestoreSavedRun(saved);
    return {
      ticket: saved.ticket || base.ticket,
      targetRepoPath: saved.targetRepoPath || base.targetRepoPath,
      mockupImages: Array.isArray(saved.mockupImages) ? uniqStrings(saved.mockupImages) : base.mockupImages,
      referenceDocs: Array.isArray(saved.referenceDocs) ? uniqStrings(saved.referenceDocs) : base.referenceDocs,
      agentTool: saved.agentTool || base.agentTool,
      running: false,
      hasRun: savedHasRun,
      activeTab: saved.activeTab || base.activeTab,
      stepStatus: savedHasRun ? createDoneStepStatus() : base.stepStatus,
      apiStatus: base.apiStatus,
      serverHealth: base.serverHealth,
      repoStatus: base.repoStatus,
      codexLaunch: base.codexLaunch,
      completion: base.completion,
      clarifications: savedHasRun ? normalizeClarifications(MODEL.clarifications || EMPTY_CLARIFICATIONS) : base.clarifications,
      conversation: savedHasRun ? normalizeConversation(MODEL.conversation || EMPTY_CONVERSATION) : base.conversation,
      agentic: savedHasRun ? normalizeAgentic(MODEL.agentic || EMPTY_AGENTIC) : base.agentic,
      contextArtifacts: savedHasRun ? normalizeContextArtifacts(MODEL.contextArtifacts || EMPTY_CONTEXT_ARTIFACTS) : base.contextArtifacts,
      reviewPacket: savedHasRun ? normalizeReviewPacket(MODEL.reviewPacket || EMPTY_REVIEW_PACKET) : base.reviewPacket,
      lastRunFingerprint: savedHasRun ? (saved.lastRunFingerprint || buildRunFingerprint(saved)) : '',
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

  function formatBytes(bytes) {
    var value = Number(bytes) || 0;
    if (!value) return '0 B';
    if (value < 1024) return value + ' B';
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
    return (value / (1024 * 1024)).toFixed(1) + ' MB';
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

  function parseRunFingerprint(fingerprint) {
    if (!fingerprint) return {};
    try {
      return JSON.parse(fingerprint);
    } catch (error) {
      return {};
    }
  }

  function isNewAssignmentRequest(runtime, requestPayload) {
    if (!runtime || !runtime.hasRun) return false;
    var previous = parseRunFingerprint(runtime.lastRunFingerprint || '');
    if (!previous.ticket && !previous.targetRepoPath) return false;
    var previousTicket = String(previous.ticket || '').trim();
    var previousRepo = String(previous.targetRepoPath || '').trim();
    var nextTicket = String((requestPayload && requestPayload.ticket) || '').trim();
    var nextRepo = String((requestPayload && requestPayload.targetRepoPath) || '').trim();
    return previousTicket !== nextTicket || previousRepo !== nextRepo;
  }

  function hasCurrentWorkflowState(runtime) {
    if (!runtime) return false;
    if (runtime.hasRun) return true;
    if (runtime.running) return true;
    if (runtime.codexLaunch && runtime.codexLaunch.status && runtime.codexLaunch.status !== 'idle') return true;
    var clarifications = normalizeClarifications(runtime.clarifications);
    if (clarifications.questions.length || clarifications.status !== 'not_generated') return true;
    var conversation = normalizeConversation(runtime.conversation);
    if (conversation.phase !== 'draft' || conversation.status !== 'not_started') return true;
    var agentic = normalizeAgentic(runtime.agentic);
    if (agentic.taskGraph || agentic.executionPlan || agentic.agentRoster || agentic.reviewerFindings || agentic.currentCycle) return true;
    var contextArtifacts = normalizeContextArtifacts(runtime.contextArtifacts);
    if (contextArtifacts.artifacts.length || (contextArtifacts.summary && contextArtifacts.summary.total)) return true;
    return false;
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

  function normalizeClarifications(source) {
    var payload = source && typeof source === 'object' ? source : {};
    var summary = payload.summary && typeof payload.summary === 'object' ? payload.summary : {};
    var questions = Array.isArray(payload.questions) ? payload.questions : [];
    return {
      generatedAt: payload.generatedAt || '',
      updatedAt: payload.updatedAt || '',
      status: payload.status || (questions.length ? 'ready_to_continue' : 'not_generated'),
      summary: {
        total: Number(summary.total) || questions.length,
        open: Number(summary.open) || 0,
        unresolvedHigh: Number(summary.unresolvedHigh) || 0,
        status: summary.status || payload.status || '',
        nextAction: summary.nextAction || payload.nextAction || ''
      },
      questions: questions.map(function (question, index) {
        return {
          id: question.id || ('question-' + (index + 1)),
          stage: question.stage || 'intake',
          severity: question.severity || 'medium',
          question: question.question || '',
          why: question.why || '',
          answerFormat: question.answerFormat || '',
          suggestedAnswer: question.suggestedAnswer || '',
          answer: typeof question.answer === 'string' ? question.answer : '',
          status: question.status || (question.answer ? 'answered' : 'open'),
          updatedAt: question.updatedAt || '',
          draftDirty: Boolean(question.draftDirty)
        };
      })
    };
  }

  function mergeClarificationDrafts(serverSource, localSource) {
    var serverClarifications = normalizeClarifications(serverSource);
    var localClarifications = normalizeClarifications(localSource);
    var localById = {};
    localClarifications.questions.forEach(function (question) {
      if (question.id) localById[question.id] = question;
    });
    var mergedQuestions = serverClarifications.questions.map(function (question) {
      var localQuestion = localById[question.id];
      if (!localQuestion || !localQuestion.draftDirty) return question;
      var answer = typeof localQuestion.answer === 'string' ? localQuestion.answer : '';
      return Object.assign({}, question, {
        answer: answer,
        status: answer.trim() ? 'answered' : 'open',
        draftDirty: true
      });
    });
    return Object.assign({}, serverClarifications, { questions: mergedQuestions });
  }

  function normalizeConversation(source) {
    var payload = source && typeof source === 'object' ? source : {};
    return {
      phase: payload.phase || 'draft',
      status: payload.status || 'not_started',
      nextAction: payload.nextAction || 'Generate clarifications or run ODT.',
      updatedAt: payload.updatedAt || '',
      clearedAt: payload.clearedAt || ''
    };
  }

  function hasBlockingClarifications(runtime) {
    var clarifications = normalizeClarifications(runtime && runtime.clarifications);
    return Boolean(clarifications.summary && clarifications.summary.unresolvedHigh > 0);
  }

  function normalizeReviewDecision(value) {
    var decision = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (decision === 'accepted' || decision === 'rejected' || decision === 'needs_rework' || decision === 'ignored') return decision;
    return 'pending';
  }

  function summarizeReviewSuggestions(suggestions) {
    var items = Array.isArray(suggestions) ? suggestions : [];
    return {
      total: items.length,
      pending: items.filter(function (item) { return normalizeReviewDecision(item.decision) === 'pending'; }).length,
      accepted: items.filter(function (item) { return normalizeReviewDecision(item.decision) === 'accepted'; }).length,
      needsRework: items.filter(function (item) { return normalizeReviewDecision(item.decision) === 'needs_rework'; }).length,
      rejected: items.filter(function (item) { return normalizeReviewDecision(item.decision) === 'rejected'; }).length,
      ignored: items.filter(function (item) { return normalizeReviewDecision(item.decision) === 'ignored'; }).length
    };
  }

  function normalizeReviewSuggestions(source) {
    var payload = source && typeof source === 'object' ? source : {};
    var suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];
    var normalized = suggestions.map(function (item, index) {
      return {
        id: item.id || ('suggestion-' + (index + 1)),
        reviewerId: item.reviewerId || '',
        reviewerName: item.reviewerName || 'Reviewer',
        findingIndex: Number(item.findingIndex) || 0,
        severity: item.severity || 'low',
        title: item.title || 'Reviewer finding',
        detail: item.detail || '',
        sourceRecommendation: item.sourceRecommendation || '',
        files: Array.isArray(item.files) ? item.files : [],
        decision: normalizeReviewDecision(item.decision),
        suggestion: typeof item.suggestion === 'string' ? item.suggestion : (item.sourceRecommendation || ''),
        note: typeof item.note === 'string' ? item.note : '',
        updatedAt: item.updatedAt || ''
      };
    });
    return {
      generatedAt: payload.generatedAt || '',
      updatedAt: payload.updatedAt || '',
      status: payload.status || (normalized.length ? 'ready' : 'empty'),
      cycleId: payload.cycleId || '',
      summary: payload.summary && typeof payload.summary === 'object' ? payload.summary : summarizeReviewSuggestions(normalized),
      suggestions: normalized
    };
  }

  function normalizeAgentic(source) {
    var payload = source && typeof source === 'object' ? source : {};
    return {
      taskGraph: payload.taskGraph && typeof payload.taskGraph === 'object' ? payload.taskGraph : null,
      executionPlan: payload.executionPlan && typeof payload.executionPlan === 'object' ? payload.executionPlan : null,
      schedulerDecision: payload.schedulerDecision && typeof payload.schedulerDecision === 'object' ? payload.schedulerDecision : null,
      agentRoster: payload.agentRoster && typeof payload.agentRoster === 'object' ? payload.agentRoster : null,
      reviewerPlan: payload.reviewerPlan && typeof payload.reviewerPlan === 'object' ? payload.reviewerPlan : null,
      reviewerFindings: payload.reviewerFindings && typeof payload.reviewerFindings === 'object' ? payload.reviewerFindings : null,
      reviewSuggestions: normalizeReviewSuggestions(payload.reviewSuggestions),
      arbitratorDecision: payload.arbitratorDecision && typeof payload.arbitratorDecision === 'object' ? payload.arbitratorDecision : null,
      currentCycle: payload.currentCycle && typeof payload.currentCycle === 'object' ? payload.currentCycle : null,
      reworkPlan: typeof payload.reworkPlan === 'string' ? payload.reworkPlan : '',
      reworkPrompt: typeof payload.reworkPrompt === 'string' ? payload.reworkPrompt : '',
      verificationResults: payload.verificationResults && typeof payload.verificationResults === 'object' ? payload.verificationResults : null,
      cycleHistory: payload.cycleHistory && typeof payload.cycleHistory === 'object' ? payload.cycleHistory : null
    };
  }

  function normalizeContextArtifacts(source) {
    var payload = source && typeof source === 'object' ? source : {};
    var rawArtifacts = Array.isArray(payload.artifacts) ? payload.artifacts : [];
    var artifacts = rawArtifacts.map(function (item, index) {
      return {
        id: item.id || item.path || ('context-artifact-' + (index + 1)),
        path: item.path || '',
        absolutePath: item.absolutePath || '',
        name: item.name || item.path || 'Context artifact',
        extension: item.extension || '',
        kind: item.kind || 'document',
        managed: Boolean(item.managed),
        exists: Boolean(item.exists),
        size: Number(item.size) || 0,
        status: item.status || 'missing',
        processingStrategy: item.processingStrategy || '',
        recommendation: item.recommendation || ''
      };
    });
    var sourceSummary = payload.summary && typeof payload.summary === 'object' ? payload.summary : {};
    var ready = Number(sourceSummary.ready);
    var missing = Number(sourceSummary.missing);
    var invalid = Number(sourceSummary.invalid);
    var summary = {
      total: Number(sourceSummary.total) || artifacts.length,
      ready: Number.isFinite(ready) ? ready : artifacts.filter(function (item) { return item.status === 'ready'; }).length,
      missing: Number.isFinite(missing) ? missing : artifacts.filter(function (item) { return item.status === 'missing'; }).length,
      invalid: Number.isFinite(invalid) ? invalid : artifacts.filter(function (item) { return item.status === 'invalid'; }).length,
      images: Number(sourceSummary.images) || artifacts.filter(function (item) { return item.kind === 'image'; }).length,
      pdfs: Number(sourceSummary.pdfs) || artifacts.filter(function (item) { return item.kind === 'pdf'; }).length,
      spreadsheets: Number(sourceSummary.spreadsheets) || artifacts.filter(function (item) { return item.kind === 'spreadsheet'; }).length,
      documents: Number(sourceSummary.documents) || artifacts.filter(function (item) { return item.kind === 'document'; }).length
    };
    return {
      generatedAt: payload.generatedAt || '',
      status: payload.status || (summary.missing || summary.invalid ? 'needs_attention' : (summary.total ? 'ready' : 'empty')),
      summary: summary,
      artifacts: artifacts,
      nextAction: payload.nextAction || ''
    };
  }

  function hasBlockingContextArtifacts(runtime) {
    var contextArtifacts = normalizeContextArtifacts(runtime && runtime.contextArtifacts);
    return Boolean((contextArtifacts.summary.missing || 0) + (contextArtifacts.summary.invalid || 0));
  }

  function normalizeReviewPacket(source) {
    var payload = source && typeof source === 'object' ? source : {};
    var rawFiles = Array.isArray(payload.files) ? payload.files : [];
    var files = rawFiles.map(function (file, index) {
      return {
        path: file.path || ('changed-file-' + (index + 1)),
        status: file.status || 'modified',
        code: file.code || '',
        staged: Boolean(file.staged),
        unstaged: Boolean(file.unstaged),
        untracked: Boolean(file.untracked),
        kind: file.kind || 'other',
        inPlannedScope: file.inPlannedScope !== false,
        reviewRisk: file.reviewRisk || 'normal'
      };
    });
    var rawSummary = payload.summary && typeof payload.summary === 'object' ? payload.summary : {};
    return {
      generatedAt: payload.generatedAt || '',
      status: payload.status || (files.length ? 'changes_detected' : 'clean'),
      targetRepoPath: payload.targetRepoPath || '',
      summary: {
        changedFiles: Number(rawSummary.changedFiles) || files.length,
        staged: Number(rawSummary.staged) || files.filter(function (file) { return file.staged; }).length,
        unstaged: Number(rawSummary.unstaged) || files.filter(function (file) { return file.unstaged; }).length,
        untracked: Number(rawSummary.untracked) || files.filter(function (file) { return file.untracked; }).length,
        outOfScope: Number(rawSummary.outOfScope) || files.filter(function (file) { return file.reviewRisk === 'out_of_scope'; }).length,
        dependency: Number(rawSummary.dependency) || files.filter(function (file) { return file.reviewRisk === 'dependency_review'; }).length,
        data: Number(rawSummary.data) || files.filter(function (file) { return file.reviewRisk === 'schema_review'; }).length
      },
      files: files,
      diffStat: payload.diffStat && typeof payload.diffStat === 'object' ? payload.diffStat : { staged: '', unstaged: '' },
      diffPreview: payload.diffPreview || '',
      nextAction: payload.nextAction || ''
    };
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
    var clarifications = normalizeClarifications(props.runtime.clarifications);
    var agentic = normalizeAgentic(props.runtime.agentic);
    var questions = clarifications.questions || [];
    var hasAnswers = questions.some(function (question) {
      return Boolean(String(question.answer || '').trim());
    });
    var hasPlan = Boolean(agentic.taskGraph || agentic.executionPlan || props.runtime.hasRun);
    var hasAgentRun = Boolean(props.runtime.codexLaunch && props.runtime.codexLaunch.status && props.runtime.codexLaunch.status !== 'idle');
    var hasReviewCycle = Boolean(agentic.currentCycle || (agentic.cycleHistory && agentic.cycleHistory.summary && agentic.cycleHistory.summary.total));
    var verification = agentic.verificationResults || {};
    var flowSteps = [
      {
        label: '1. Intake',
        status: props.runtime.ticket && props.runtime.targetRepoPath ? 'done' : 'running',
        state: props.runtime.ticket && props.runtime.targetRepoPath ? 'Ready' : 'Current',
        detail: 'Paste the work item and select the target repo. Mockups/docs are optional but useful.',
        action: props.runtime.ticket && props.runtime.targetRepoPath ? 'Intake is ready.' : 'Start here.'
      },
      {
        label: '2. Clarify',
        status: questions.length ? (hasAnswers ? 'done' : 'running') : '',
        state: questions.length ? (hasAnswers ? 'Answered' : 'Needs Input') : 'Optional',
        detail: 'ODT asks only when missing context can change implementation, review, or safety decisions.',
        action: questions.length ? 'Save answers before continuing.' : 'No blockers detected; continue or generate questions if you want a double-check.'
      },
      {
        label: '3. Plan',
        status: hasPlan ? 'done' : '',
        state: hasPlan ? 'Planned' : 'Waiting',
        detail: 'Run ODT to build the task graph, scheduler decision, file impact, and workpacks.',
        action: props.runtime.hasRun ? 'Review Planner / Scheduler.' : 'Click Run digital worker.'
      },
      {
        label: '4. Delegate',
        status: hasAgentRun ? 'done' : '',
        state: hasAgentRun ? 'Launched' : 'Waiting',
        detail: 'Send the planned work or focused rework prompt to Codex/Cline from the dashboard.',
        action: hasAgentRun ? 'Monitor Execution Health.' : 'Delegate after plan looks right.'
      },
      {
        label: '5. Review Cycle',
        status: hasReviewCycle ? 'done' : '',
        state: hasReviewCycle ? 'Recorded' : 'Waiting',
        detail: 'Run reviewer swarm so architecture, test, accessibility, security, and build reviewers produce a decision.',
        action: hasReviewCycle ? 'Use the scoreboard to decide next step.' : 'Run after agent changes are ready.'
      },
      {
        label: '6. Verify / Close',
        status: verification.status ? (verification.status === 'passed' ? 'done' : 'running') : '',
        state: verification.status ? titleizeStatus(verification.status) : 'Waiting',
        detail: 'Run tests/build evidence, then do the final human diff review before merge.',
        action: verification.status ? 'Evidence is attached to the current cycle.' : 'Run verification before closeout.'
      }
    ];
    var kpis = [
      {
        label: 'Current Flow',
        value: props.runtime.hasRun ? 'Agentic' : 'Intake',
        note: props.runtime.hasRun ? 'Planner, reviewers, and cycles are available' : 'Start with requirement and repo'
      },
      {
        label: 'Questions',
        value: String((clarifications.summary && clarifications.summary.total) || questions.length || 0),
        note: ((clarifications.summary && clarifications.summary.unresolvedHigh) || 0) + ' high-severity open'
      },
      {
        label: 'Review Cycles',
        value: String((agentic.cycleHistory && agentic.cycleHistory.summary && agentic.cycleHistory.summary.total) || 0),
        note: agentic.currentCycle ? (agentic.currentCycle.label || agentic.currentCycle.id || 'Latest cycle ready') : 'None yet'
      },
      {
        label: 'Verification',
        value: verification.status ? titleizeStatus(verification.status) : 'Not Run',
        note: 'Tests/build evidence for the latest cycle'
      }
    ];
    return h('section', { className: 'card workflow-panel' }, [
      h('div', { className: 'workflow-header', key: 'head' }, [
        h('div', { key: 'copy' }, [
          h('p', { className: 'card-title', key: 'label' }, 'Developer Flow'),
          h('h2', { key: 'title' }, 'Use ODT as an interactive coding copilot control room'),
          h('p', { className: 'card-subtitle', key: 'desc' }, 'This is the practical path for a new developer: give ODT the work item, clarify only what matters, plan, delegate, review, verify, and close with a human diff review.')
        ]),
        h('div', { className: 'workflow-summary', key: 'summary' }, [
          h('span', { key: 'label' }, 'Next'),
          h('strong', { key: 'value' }, props.runtime.hasRun ? 'Review' : 'Run'),
          h('small', { key: 'note' }, props.runtime.hasRun
            ? 'Inspect the Planner, Review Cycle, and Execution Health panels.'
            : 'Paste the work item, select the repo, then run the digital worker.')
        ])
      ]),
      h('div', { className: 'workflow-kpis', key: 'kpis' }, kpis.map(function (item) {
        return h('article', { className: 'workflow-kpi', key: item.label }, [
          h('label', { key: 'label' }, item.label),
          h('strong', { key: 'value' }, item.value),
          h('p', { key: 'note' }, item.note)
        ]);
      })),
      h('div', { className: 'workflow-grid', key: 'grid' }, flowSteps.map(function (step) {
        return h('article', { className: 'workflow-card ' + step.status, key: step.label }, [
          h('div', { className: 'workflow-index', key: 'index' }, step.label.slice(0, 1)),
          h('div', { className: 'workflow-copy', key: 'copy' }, [
            h('strong', { key: 'label' }, step.label),
            h('p', { key: 'detail' }, step.detail),
            h('span', { className: 'workflow-state', key: 'state' }, step.state),
            h('div', { className: 'workflow-artifacts', key: 'artifacts' }, step.action)
          ])
        ]);
      }))
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

  function avatarForAgent(agent) {
    var id = String((agent && agent.id) || '').toLowerCase();
    var name = String((agent && agent.name) || '').toLowerCase();
    var text = id + ' ' + name;
    if (text.indexOf('planner') >= 0 || text.indexOf('scheduler') >= 0) return { label: 'PLAN', tone: 'plan' };
    if (text.indexOf('main-developer') >= 0 || text.indexOf('developer') >= 0) return { label: 'DEV', tone: 'dev' };
    if (text.indexOf('architecture') >= 0) return { label: 'ARCH', tone: 'arch' };
    if (text.indexOf('unit') >= 0 || text.indexOf('test') >= 0) return { label: 'TEST', tone: 'test' };
    if (text.indexOf('accessibility') >= 0 || text.indexOf('a11y') >= 0) return { label: 'A11Y', tone: 'a11y' };
    if (text.indexOf('security') >= 0 || text.indexOf('compliance') >= 0) return { label: 'SEC', tone: 'sec' };
    if (text.indexOf('build') >= 0 || text.indexOf('verify') >= 0) return { label: 'BUILD', tone: 'build' };
    if (text.indexOf('arbitrator') >= 0 || text.indexOf('merge') >= 0) return { label: 'ARB', tone: 'arb' };
    return { label: 'AI', tone: 'dev' };
  }

  function toneForDecision(value) {
    var decision = normalizeReviewDecision(value);
    if (decision === 'accepted') return 'good';
    if (decision === 'needs_rework') return 'bad';
    if (decision === 'rejected' || decision === 'ignored') return 'warn';
    return 'low';
  }

  function toneForAgentStatus(value) {
    var status = String(value || '').toLowerCase();
    if (status.indexOf('failed') >= 0 || status.indexOf('blocked') >= 0 || status.indexOf('rework') >= 0) return 'bad';
    if (status.indexOf('running') >= 0 || status.indexOf('waiting') >= 0 || status.indexOf('pending') >= 0) return 'warn';
    if (status.indexOf('completed') >= 0 || status.indexOf('ready') >= 0 || status.indexOf('passed') >= 0) return 'good';
    return 'low';
  }

  function isAgentMatch(agent, value) {
    var text = String(value || '').toLowerCase();
    var id = String((agent && agent.id) || '').toLowerCase();
    var name = String((agent && agent.name) || '').toLowerCase();
    if (!text) return false;
    return Boolean((id && (text === id || text.indexOf(id) >= 0)) || (name && (text === name || text.indexOf(name) >= 0)));
  }

  function findAgentTask(agent, agentic) {
    var taskId = agent && agent.currentTaskId;
    var tasks = agentic && agentic.taskGraph && Array.isArray(agentic.taskGraph.tasks) ? agentic.taskGraph.tasks : [];
    var lanes = agentic && agentic.executionPlan && Array.isArray(agentic.executionPlan.parallelLanes) ? agentic.executionPlan.parallelLanes : [];
    var task = taskId ? tasks.find(function (item) { return item.id === taskId; }) : null;
    var lane = lanes.find(function (item) {
      return (taskId && item.taskId === taskId) || isAgentMatch(agent, item.lane) || isAgentMatch(agent, item.agent);
    }) || null;
    return { task: task || null, lane: lane };
  }

  function promptPathForAgent(agent) {
    var id = String((agent && agent.id) || '').toLowerCase();
    if (id === 'main-developer') return 'reports/odt/execute/prompt.md';
    if (id === 'planner-scheduler') return 'reports/odt/agentic/scheduler-decision.json';
    if (id === 'merge-arbitrator') return 'reports/odt/agentic/arbitrator-decision.json';
    if (id === 'build-verifier') return 'reports/odt/agentic/review-prompts/build-verifier.md';
    if (id.indexOf('reviewer') >= 0) return 'reports/odt/agentic/review-prompts/' + id + '.md';
    return (agent && agent.output) || 'reports/odt/agentic/';
  }

  function expectedOutputForAgent(agent) {
    var id = String((agent && agent.id) || '').toLowerCase();
    if (id === 'planner-scheduler') return 'Task order, parallel lanes, blockers, and next action.';
    if (id === 'main-developer') return 'A focused patch inside the approved write scope, with notes for reviewers.';
    if (id === 'merge-arbitrator') return 'Merged reviewer decision: approve, ask human, rework, or verify.';
    if (id === 'build-verifier') return 'Install, lint, test, build, and smoke-check evidence or exact manual commands.';
    if (id.indexOf('reviewer') >= 0) return 'Read-only findings with severity, affected files, and developer action.';
    return 'Agent-owned evidence for the current assignment.';
  }

  function buildAgentDetailModel(agent, agentic, reviewerStatus) {
    var match = findAgentTask(agent, agentic);
    var task = match.task || {};
    var lane = match.lane || {};
    var allowedFiles = Array.isArray(agent.allowedFiles) && agent.allowedFiles.length
      ? agent.allowedFiles
      : (Array.isArray(lane.allowedFiles) && lane.allowedFiles.length ? lane.allowedFiles : (Array.isArray(task.allowedFiles) ? task.allowedFiles : []));
    var acceptance = Array.isArray(task.acceptanceCriteria) && task.acceptanceCriteria.length
      ? ' Acceptance: ' + task.acceptanceCriteria.slice(0, 2).join(' ')
      : '';
    var plan = task.title || lane.task || agent.responsibility || 'Plan appears after ODT generates the task graph.';
    return {
      plan: plan + acceptance,
      expectedOutput: expectedOutputForAgent(agent),
      scope: allowedFiles.length ? allowedFiles.slice(0, 5).join(', ') + (allowedFiles.length > 5 ? ' +' + (allowedFiles.length - 5) : '') : 'Read-only or repo-wide review scope.',
      promptPath: promptPathForAgent(agent),
      artifactPath: agent.output || (reviewerStatus && reviewerStatus.output) || promptPathForAgent(agent)
    };
  }

  function findSuggestionForFinding(reviewSuggestions, reviewer, findingIndex, finding) {
    var suggestions = normalizeReviewSuggestions(reviewSuggestions).suggestions;
    var reviewerId = reviewer.id || '';
    var title = finding && finding.title ? finding.title : '';
    return suggestions.find(function (item) {
      return item.reviewerId === reviewerId && Number(item.findingIndex) === Number(findingIndex);
    }) || suggestions.find(function (item) {
      return item.reviewerName === reviewer.name && item.title === title;
    }) || null;
  }

  function patchLocalReviewSuggestion(setRuntime, suggestion) {
    if (!suggestion || !suggestion.id) return;
    setRuntime(function (current) {
      var agentic = normalizeAgentic(current.agentic);
      var reviewSuggestions = normalizeReviewSuggestions(agentic.reviewSuggestions);
      var matched = false;
      var nextSuggestions = reviewSuggestions.suggestions.map(function (item) {
        if (item.id !== suggestion.id) return item;
        matched = true;
        return Object.assign({}, item, suggestion, {
          decision: normalizeReviewDecision(suggestion.decision)
        });
      });
      if (!matched) {
        nextSuggestions.push(Object.assign({}, suggestion, {
          decision: normalizeReviewDecision(suggestion.decision)
        }));
      }
      var nextReviewSuggestions = Object.assign({}, reviewSuggestions, {
        updatedAt: new Date().toISOString(),
        summary: summarizeReviewSuggestions(nextSuggestions),
        suggestions: nextSuggestions
      });
      return Object.assign({}, current, {
        agentic: Object.assign({}, agentic, { reviewSuggestions: nextReviewSuggestions })
      });
    });
  }

  function ClarificationsPanel(props) {
    var runtime = props.runtime;
    var clarifications = normalizeClarifications(runtime.clarifications);
    var conversation = normalizeConversation(runtime.conversation);
    var questions = clarifications.questions || [];
    var summary = clarifications.summary || {};
    var blocked = Number(summary.unresolvedHigh || 0) > 0;
    var isOnline = runtime.serverHealth.status === 'online';
    var locked = runtime.running || isAgentExecutionBusy(runtime) || !isOnline;
    var subtitle = questions.length
      ? (blocked
        ? 'ODT is paused until critical answers are supplied.'
        : 'Only decision-critical questions are shown here.')
      : 'No blocking questions detected. For clear work, you can run or delegate without answering generic prompts.';

    return h(SectionCard, {
      title: 'Clarifications Needed',
      subtitle: subtitle,
      className: 'clarifications-panel',
      extra: h('span', { className: 'status-pill ' + (blocked ? 'bad' : questions.length ? 'good' : 'warn') }, blocked ? 'Blocked' : questions.length ? 'Ready' : 'Not Generated')
    }, [
      h('div', { className: 'clarification-summary', key: 'summary' }, [
        h('div', { className: 'mini-stat', key: 'total' }, [
          h('label', { key: 'l' }, 'Questions'),
          h(MiniStatValue, { value: String(summary.total || questions.length || 0), variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Decision-critical prompts')
        ]),
        h('div', { className: 'mini-stat', key: 'open' }, [
          h('label', { key: 'l' }, 'Open'),
          h(MiniStatValue, { value: String(summary.open || 0), variant: blocked ? 'danger' : 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Need developer input')
        ]),
        h('div', { className: 'mini-stat', key: 'high' }, [
          h('label', { key: 'l' }, 'High Severity'),
          h(MiniStatValue, { value: String(summary.unresolvedHigh || 0), variant: blocked ? 'danger' : 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Blocks delegation')
        ])
      ]),
      h('div', { className: 'conversation-state', key: 'conversation' }, [
        h('strong', { key: 'phase' }, 'Conversation: ' + titleizeStatus(conversation.phase || conversation.status || 'draft')),
        h('div', { className: 'small-note', key: 'next' }, conversation.nextAction || (summary.nextAction || 'Generate clarifications or continue.'))
      ]),
      questions.length ? h('div', { className: 'clarification-list', key: 'questions' }, questions.map(function (question, index) {
        var severityClass = question.severity === 'high' ? 'high' : question.severity === 'low' ? 'low' : 'medium';
        return h('article', { className: 'clarification-card ' + severityClass, key: question.id || index }, [
          h('div', { className: 'clarification-card-head', key: 'head' }, [
            h('span', { className: 'status-pill ' + severityClass, key: 'severity' }, titleizeStatus(question.severity || 'medium')),
            h('span', { className: 'meta-pill soft', key: 'stage' }, stageLabelFromKey(question.stage || 'intake')),
            h('span', { className: 'meta-pill soft', key: 'status' }, titleizeStatus(question.status || 'open'))
          ]),
          h('strong', { key: 'question' }, question.question || 'Clarification question'),
          question.why ? h('div', { className: 'small-note', key: 'why' }, question.why) : null,
          question.answerFormat ? h('div', { className: 'small-note', key: 'format' }, 'Answer format: ' + question.answerFormat) : null,
          question.suggestedAnswer ? h('button', {
            className: 'btn ghost tiny',
            disabled: locked,
            onClick: function () {
              props.setRuntime(function (current) {
	                var currentClarifications = normalizeClarifications(current.clarifications);
	                var nextQuestions = currentClarifications.questions.map(function (item) {
	                  return item.id === question.id ? Object.assign({}, item, {
	                    answer: question.suggestedAnswer,
	                    status: question.suggestedAnswer.trim() ? 'answered' : 'open',
	                    draftDirty: true
	                  }) : item;
	                });
	                return Object.assign({}, current, {
	                  clarifications: Object.assign({}, currentClarifications, { questions: nextQuestions })
                });
              });
            },
            key: 'suggested'
          }, 'Use Suggested Answer') : null,
          h('textarea', {
            className: 'control-textarea clarification-answer',
            value: question.answer || '',
            disabled: locked,
            placeholder: 'Type the answer ODT should remember for this task...',
            onChange: function (event) {
              var nextValue = event && event.target ? event.target.value : '';
              props.setRuntime(function (current) {
	                var currentClarifications = normalizeClarifications(current.clarifications);
	                var nextQuestions = currentClarifications.questions.map(function (item) {
	                  return item.id === question.id ? Object.assign({}, item, {
	                    answer: nextValue,
	                    status: nextValue.trim() ? 'answered' : 'open',
	                    draftDirty: true
	                  }) : item;
	                });
	                return Object.assign({}, current, {
	                  clarifications: Object.assign({}, currentClarifications, { questions: nextQuestions })
                });
              });
            },
            key: 'answer'
          })
        ]);
      })) : h('div', { className: 'small-note', key: 'empty' }, 'No required clarification questions right now. ODT will infer normal UI, test, accessibility, and dependency defaults from the repo unless the requirement is ambiguous.'),
      h('div', { className: 'section-inline-actions', key: 'actions' }, [
        h('button', {
          className: 'btn ghost',
          disabled: locked,
          onClick: props.onGenerate,
          title: 'Ask ODT to generate only decision-critical clarification questions from the current intake.',
          key: 'generate'
        }, questions.length ? 'Refresh Questions' : 'Generate Questions'),
        h('button', {
          className: 'btn secondary',
          disabled: locked || !questions.length,
          onClick: props.onSave,
          title: 'Save the current clarification answers for this assignment.',
          key: 'save'
        }, 'Save Answers'),
        h('button', {
          className: 'btn primary',
          disabled: locked || blocked,
          onClick: props.onContinue,
          title: blocked ? 'Answer high-severity questions before continuing.' : 'Continue the current assignment using saved clarification answers.',
          key: 'continue'
        }, blocked ? 'Answer Required' : 'Continue Task')
      ])
    ]);
  }

  function ContextVaultPanel(props) {
    var contextArtifacts = normalizeContextArtifacts(props.runtime.contextArtifacts);
    var summary = contextArtifacts.summary || {};
    var artifacts = contextArtifacts.artifacts || [];
    var blocked = Boolean((summary.missing || 0) + (summary.invalid || 0));
    var statusTone = blocked ? 'bad' : (summary.total ? 'good' : 'warn');
    var statusLabel = blocked ? 'Fix Needed' : (summary.total ? 'Ready' : 'Optional');

    return h(SectionCard, {
      title: 'Context Vault',
      subtitle: blocked
        ? 'ODT found stale or invalid attachment references that would break delegated agent prompts.'
        : 'Images, PDFs, spreadsheets, and reference docs are checked before agents receive them.',
      className: 'context-vault-panel',
      extra: h('span', { className: 'status-pill ' + statusTone }, statusLabel)
    }, [
      h('div', { className: 'context-vault-summary', key: 'summary' }, [
        h('div', { className: 'mini-stat', key: 'total' }, [
          h('label', { key: 'l' }, 'Artifacts'),
          h(MiniStatValue, { value: String(summary.total || 0), variant: 'numeric', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Attached to this task')
        ]),
        h('div', { className: 'mini-stat', key: 'ready' }, [
          h('label', { key: 'l' }, 'Ready'),
          h(MiniStatValue, { value: String(summary.ready || 0), variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Safe for agent prompts')
        ]),
        h('div', { className: 'mini-stat', key: 'missing' }, [
          h('label', { key: 'l' }, 'Missing'),
          h(MiniStatValue, { value: String((summary.missing || 0) + (summary.invalid || 0)), variant: blocked ? 'danger' : 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Blocks delegation')
        ])
      ]),
      h('div', { className: 'small-note', key: 'next' }, contextArtifacts.nextAction || (summary.total ? 'Context artifacts are available for this task.' : 'Upload only the files that materially help the implementation.')),
      artifacts.length ? h('div', { className: 'context-artifact-list', key: 'artifacts' }, artifacts.map(function (artifact) {
        var tone = artifact.status === 'ready' ? 'good' : 'bad';
        var label = artifact.kind === 'image'
          ? 'Image'
          : artifact.kind === 'pdf'
            ? 'PDF'
            : artifact.kind === 'spreadsheet'
              ? 'Sheet'
              : 'Doc';
        return h('article', { className: 'context-artifact-card ' + artifact.status, key: artifact.id }, [
          h('div', { className: 'context-artifact-head', key: 'head' }, [
            h('span', { className: 'status-pill ' + tone, key: 'status' }, titleizeStatus(artifact.status)),
            h('span', { className: 'meta-pill soft', key: 'kind' }, label),
            h('span', { className: 'meta-pill soft', key: 'size' }, formatBytes(artifact.size))
          ]),
          h('strong', { key: 'name', title: artifact.name }, shorten(artifact.name, 82)),
          h('div', { className: 'artifact-path', key: 'path' }, artifact.path || artifact.absolutePath || 'No path available'),
          artifact.processingStrategy ? h('div', { className: 'small-note', key: 'strategy' }, artifact.processingStrategy) : null,
          artifact.recommendation ? h('div', { className: 'small-note', key: 'recommendation' }, artifact.recommendation) : null
        ]);
      })) : h('div', { className: 'input-item empty', key: 'empty' }, 'No context artifacts attached. That is fine for pure backend, API, refactor, or test-only work.')
    ]);
  }

  function AgentCockpit(props) {
    var runtime = props.runtime;
    var agentic = normalizeAgentic(runtime.agentic);
    var roster = agentic.agentRoster || {};
    var reviewerPlan = agentic.reviewerPlan || {};
    var reviewerFindings = agentic.reviewerFindings || {};
    var arbitrator = agentic.arbitratorDecision || {};
    var rosterAgents = Array.isArray(roster.agents) ? roster.agents : [];
    var reviewerStatuses = {};
    (Array.isArray(reviewerPlan.reviewers) ? reviewerPlan.reviewers : []).forEach(function (reviewer) {
      reviewerStatuses[reviewer.id] = reviewer;
    });
    (Array.isArray(reviewerFindings.reviewers) ? reviewerFindings.reviewers : []).forEach(function (reviewer) {
      reviewerStatuses[reviewer.id] = Object.assign({}, reviewerStatuses[reviewer.id] || {}, reviewer);
    });
    var cards = rosterAgents.map(function (agent) {
      var merged = Object.assign({}, agent, reviewerStatuses[agent.id] || {});
      var status = agent.id === 'main-developer'
        ? getAgentExecutionState(runtime).status
        : (merged.status || (agent.id === 'planner-scheduler' ? ((agentic.executionPlan && agentic.executionPlan.status) || roster.status || 'planned') : 'waiting'));
      return Object.assign({}, merged, {
        status: status,
        statusLabel: titleizeStatus(status),
        tone: toneForAgentStatus(status)
      });
    });
    if (arbitrator.decision) {
      cards.push({
        id: 'merge-arbitrator',
        name: 'Merge Arbitrator',
        mode: 'decision',
        responsibility: arbitrator.reason || 'Combine reviewer findings and decide the next step.',
        status: arbitrator.decision,
        statusLabel: titleizeStatus(arbitrator.decision),
        tone: toneForAgentStatus(arbitrator.decision),
        score: arbitrator.readinessScore || null,
        output: 'reports/odt/agentic/arbitrator-decision.json'
      });
    }
    var _a = useState(cards[0] && cards[0].id), activeAgentId = _a[0], setActiveAgentId = _a[1];
    var active = cards.find(function (item) { return item.id === activeAgentId; }) || cards[0] || null;
    var activeFindings = active && Array.isArray((reviewerStatuses[active.id] || {}).findings)
      ? (reviewerStatuses[active.id] || {}).findings
      : [];
    var activeDetail = active ? buildAgentDetailModel(active, agentic, reviewerStatuses[active.id] || {}) : null;

    return h(SectionCard, {
      title: 'Agent Cockpit',
      subtitle: cards.length
        ? 'Click an agent to see what it owns, current state, output, and next evidence.'
        : 'Agent status appears after the planner creates the roster.',
      className: 'agent-cockpit',
      extra: h('span', { className: 'status-pill ' + (cards.length ? 'good' : 'warn') }, cards.length ? cards.length + ' Agents' : 'Waiting')
    }, [
      cards.length ? h('div', { className: 'agent-cockpit-grid', key: 'grid' }, [
        h('div', { className: 'agent-card-grid', key: 'cards' }, cards.map(function (agent) {
          var avatar = avatarForAgent(agent);
          return h('button', {
            className: 'agent-card ' + (active && active.id === agent.id ? 'active' : ''),
            onClick: function () { setActiveAgentId(agent.id); },
            key: agent.id || agent.name
          }, [
            h('div', { className: 'agent-card-head', key: 'head' }, [
              h('span', {
                className: 'agent-avatar ' + avatar.tone,
                title: (agent.name || agent.id || 'Agent') + ' role',
                key: 'avatar'
              }, avatar.label),
              h('span', { className: 'status-pill ' + agent.tone, key: 'status' }, agent.statusLabel || 'Status')
            ]),
            h('strong', { key: 'name' }, agent.name || agent.id || 'Agent'),
            h('p', { key: 'role' }, shorten(agent.responsibility || 'Role assigned by ODT planner.', 120))
          ]);
        })),
        active ? h('aside', { className: 'agent-detail-panel', key: 'detail' }, [
          h('h3', { key: 'name' }, active.name || active.id || 'Agent'),
          h('div', { className: 'status-pill-row', key: 'pills' }, [
            h('span', { className: 'status-pill ' + active.tone, key: 'status' }, active.statusLabel || 'Status'),
            h('span', { className: 'meta-pill soft', key: 'mode' }, titleizeStatus(active.mode || 'agent')),
            active.score ? h('span', { className: 'meta-pill soft', key: 'score' }, active.score + '/10') : null
          ]),
          h('div', { className: 'agent-detail-section', key: 'plan' }, [
            h('label', { key: 'label' }, 'Plan / prompt'),
            h('p', { key: 'value' }, activeDetail.plan)
          ]),
          h('div', { className: 'agent-detail-section', key: 'expected' }, [
            h('label', { key: 'label' }, 'Expected output'),
            h('p', { key: 'value' }, activeDetail.expectedOutput)
          ]),
          h('div', { className: 'agent-detail-section', key: 'scope' }, [
            h('label', { key: 'label' }, 'Scope'),
            h('p', { key: 'value' }, activeDetail.scope)
          ]),
          h('div', { className: 'artifact-path', key: 'prompt' }, 'Prompt source: ' + activeDetail.promptPath),
          activeFindings.length ? h('div', { key: 'findings' }, [
            h('strong', { key: 'title' }, 'Latest findings'),
            h('ul', { className: 'list-inline', key: 'list' }, activeFindings.slice(0, 3).map(function (finding, index) {
              return h('li', { key: active.id + '-finding-' + index }, titleizeStatus(finding.severity || 'low') + ': ' + (finding.title || 'Finding'));
            }))
          ]) : null,
          activeDetail.artifactPath ? h('div', { className: 'artifact-path', key: 'output' }, 'Output: ' + activeDetail.artifactPath) : null
        ]) : null
      ]) : h('div', { className: 'small-note', key: 'empty' }, 'Run ODT planning to create the planner, main developer, reviewer, verifier, and arbitrator roster.')
    ]);
  }

  function ReviewWorkspace(props) {
    var runtime = props.runtime;
    var agentic = normalizeAgentic(runtime.agentic);
    var reviewerFindings = agentic.reviewerFindings || {};
    var reviewSuggestions = normalizeReviewSuggestions(agentic.reviewSuggestions);
    var reviewers = Array.isArray(reviewerFindings.reviewers) ? reviewerFindings.reviewers : [];
    var summary = reviewSuggestions.summary || summarizeReviewSuggestions(reviewSuggestions.suggestions);
    var _a = useState(reviewers[0] && reviewers[0].id), activeReviewerId = _a[0], setActiveReviewerId = _a[1];
    var activeReviewer = reviewers.find(function (reviewer) { return reviewer.id === activeReviewerId; }) || reviewers[0] || null;
    var locked = runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online';

    return h(SectionCard, {
      title: 'Review Workspace',
      subtitle: reviewers.length
        ? 'Open each reviewer tab, decide which findings matter, and send accepted suggestions into the next rework prompt.'
        : 'Run the reviewer swarm after a patch exists to create actionable review tabs.',
      className: 'review-workspace',
      extra: h('span', { className: 'status-pill ' + (reviewers.length ? 'good' : 'warn') }, reviewers.length ? (summary.accepted || 0) + ' Accepted' : 'No Reviews')
    }, [
      reviewers.length ? h('div', { className: 'planner-summary', key: 'summary' }, [
        h('div', { className: 'mini-stat', key: 'total' }, [
          h('label', { key: 'l' }, 'Review Items'),
          h(MiniStatValue, { value: String(summary.total || 0), variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Findings available for developer decision')
        ]),
        h('div', { className: 'mini-stat', key: 'accepted' }, [
          h('label', { key: 'l' }, 'Accepted'),
          h(MiniStatValue, { value: String(summary.accepted || 0), variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Included in rework prompt')
        ]),
        h('div', { className: 'mini-stat', key: 'rework' }, [
          h('label', { key: 'l' }, 'Needs Rework'),
          h(MiniStatValue, { value: String(summary.needsRework || 0), variant: (summary.needsRework || 0) ? 'danger' : 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Must be addressed before close')
        ]),
        h('div', { className: 'mini-stat', key: 'pending' }, [
          h('label', { key: 'l' }, 'Pending'),
          h(MiniStatValue, { value: String(summary.pending || 0), variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Awaiting developer decision')
        ])
      ]) : null,
      reviewers.length ? h('div', { className: 'review-workspace-grid', key: 'grid' }, [
        h('div', { className: 'reviewer-tab-list', key: 'tabs' }, reviewers.map(function (reviewer) {
          var findings = Array.isArray(reviewer.findings) ? reviewer.findings : [];
          var high = findings.filter(function (item) { return item.severity === 'high'; }).length;
          var medium = findings.filter(function (item) { return item.severity === 'medium'; }).length;
          return h('button', {
            className: 'reviewer-tab ' + (activeReviewer && activeReviewer.id === reviewer.id ? 'active' : ''),
            onClick: function () { setActiveReviewerId(reviewer.id); },
            key: reviewer.id || reviewer.name
          }, [
            h('strong', { key: 'name' }, reviewer.name || reviewer.id || 'Reviewer'),
            h('span', { key: 'summary' }, reviewer.summary || (findings.length + ' finding(s)')),
            h('span', { key: 'risk' }, high + ' high · ' + medium + ' medium · score ' + (reviewer.score || 'n/a'))
          ]);
        })),
        activeReviewer ? h('div', { className: 'review-detail', key: 'detail' }, [
          h('div', { className: 'subcard', key: 'intro' }, [
            h('h3', { key: 'title' }, activeReviewer.name || 'Reviewer'),
            h('div', { className: 'small-note', key: 'summary' }, activeReviewer.summary || 'Review details are available below.'),
            h('div', { className: 'artifact-path', key: 'output' }, activeReviewer.output || 'reports/odt/agentic/reviews/')
          ]),
          (Array.isArray(activeReviewer.findings) ? activeReviewer.findings : []).map(function (finding, index) {
            var suggestion = findSuggestionForFinding(reviewSuggestions, activeReviewer, index, finding);
            if (!suggestion) {
              suggestion = {
                id: (activeReviewer.id || activeReviewer.name || 'reviewer') + '-' + index,
                reviewerId: activeReviewer.id || '',
                reviewerName: activeReviewer.name || '',
                findingIndex: index,
                severity: finding.severity || 'low',
                title: finding.title || 'Reviewer finding',
                detail: finding.detail || '',
                sourceRecommendation: finding.recommendation || '',
                files: finding.files || [],
                decision: 'pending',
                suggestion: finding.recommendation || '',
                note: ''
              };
            }
            return h('article', { className: 'review-finding-card', key: suggestion.id || index }, [
              h('div', { className: 'review-finding-head', key: 'head' }, [
                h('span', { className: 'status-pill ' + (finding.severity === 'high' ? 'bad' : finding.severity === 'medium' ? 'warn' : 'low'), key: 'severity' }, titleizeStatus(finding.severity || 'low')),
                h('span', { className: 'status-pill ' + toneForDecision(suggestion.decision), key: 'decision' }, titleizeStatus(normalizeReviewDecision(suggestion.decision))),
                suggestion.files && suggestion.files.length ? h('span', { className: 'meta-pill soft', key: 'files' }, suggestion.files.length + ' file(s)') : null
              ]),
              h('strong', { key: 'title' }, finding.title || 'Reviewer finding'),
              h('div', { className: 'small-note', key: 'detail' }, finding.detail || 'No detail supplied.'),
              finding.recommendation ? h('div', { className: 'small-note', key: 'recommendation' }, 'Recommendation: ' + finding.recommendation) : null,
              suggestion.files && suggestion.files.length ? h('div', { className: 'artifact-path', key: 'paths' }, suggestion.files.join(', ')) : null,
              h('div', { className: 'suggestion-editor', key: 'editor' }, [
                h('label', { key: 'label' }, 'Developer suggestion / decision note'),
                h('textarea', {
                  value: suggestion.suggestion || '',
                  disabled: locked,
                  placeholder: 'Rewrite the action you want the Main Developer agent to consider...',
                  onChange: function (event) {
                    var nextValue = event && event.target ? event.target.value : '';
                    patchLocalReviewSuggestion(props.setRuntime, Object.assign({}, suggestion, { suggestion: nextValue }));
                  },
                  key: 'suggestion'
                }),
                h('textarea', {
                  value: suggestion.note || '',
                  disabled: locked,
                  placeholder: 'Optional rationale, rejection reason, or human note...',
                  onChange: function (event) {
                    var nextValue = event && event.target ? event.target.value : '';
                    patchLocalReviewSuggestion(props.setRuntime, Object.assign({}, suggestion, { note: nextValue }));
                  },
                  key: 'note'
                }),
                h('div', { className: 'review-action-row', key: 'actions' }, [
                  h('button', {
                    className: 'btn secondary tiny',
                    disabled: locked,
                    onClick: function () { props.onSaveReviewSuggestion(Object.assign({}, suggestion, { decision: 'accepted' })); },
                    title: 'Accept this finding and include it in the next rework prompt.',
                    key: 'accept'
                  }, 'Accept'),
                  h('button', {
                    className: 'btn secondary tiny',
                    disabled: locked,
                    onClick: function () { props.onSaveReviewSuggestion(Object.assign({}, suggestion, { decision: 'needs_rework' })); },
                    title: 'Mark this finding as required rework.',
                    key: 'rework'
                  }, 'Needs Rework'),
                  h('button', {
                    className: 'btn ghost tiny',
                    disabled: locked,
                    onClick: function () { props.onSaveReviewSuggestion(Object.assign({}, suggestion, { decision: 'rejected' })); },
                    title: 'Reject this finding and save the rationale.',
                    key: 'reject'
                  }, 'Reject'),
                  h('button', {
                    className: 'btn ghost tiny',
                    disabled: locked,
                    onClick: function () { props.onSaveReviewSuggestion(Object.assign({}, suggestion, { decision: 'ignored' })); },
                    title: 'Ignore this finding for the current cycle.',
                    key: 'ignore'
                  }, 'Ignore'),
                  h('button', {
                    className: 'btn ghost tiny',
                    disabled: locked,
                    onClick: function () { props.onSaveReviewSuggestion(suggestion); },
                    title: 'Save the current note without changing the decision.',
                    key: 'save'
                  }, 'Save Note')
                ])
              ])
            ]);
          })
        ]) : null
      ]) : h('div', { className: 'blocked-task-list', key: 'empty' }, [
        h('strong', { key: 'title' }, 'No reviewer tabs yet'),
        h('div', { className: 'small-note', key: 'copy' }, 'After the Main Developer produces changes, run the reviewer swarm. ODT will split architecture, tests, accessibility, security, and build verification into separate review tabs.'),
        h('div', { className: 'section-inline-actions', key: 'actions' }, [
          h('button', {
            className: 'btn secondary',
            disabled: locked,
            onClick: props.onRunReviewers,
            key: 'run'
          }, 'Run Reviewer Swarm')
        ])
      ])
    ]);
  }

  function ReviewPacketPanel(props) {
    var packet = normalizeReviewPacket(props.runtime.reviewPacket);
    var summary = packet.summary || {};
    var files = packet.files || [];
    var risky = (summary.outOfScope || 0) + (summary.dependency || 0) + (summary.data || 0);
    var tone = risky ? 'bad' : (files.length ? 'good' : 'warn');
    var diffStat = [packet.diffStat && packet.diffStat.staged ? 'Staged:\n' + packet.diffStat.staged : '', packet.diffStat && packet.diffStat.unstaged ? 'Unstaged:\n' + packet.diffStat.unstaged : ''].filter(Boolean).join('\n\n');
    var locked = props.runtime.running || props.runtime.serverHealth.status !== 'online';

    return h(SectionCard, {
      title: 'Review Packet',
      subtitle: files.length
        ? 'Source-of-truth changed files from the target repo, before final approval.'
        : 'No target repo changes detected yet. This stays useful for frontend, backend, database, and test-only tasks.',
      className: 'review-packet-panel',
      extra: h('span', { className: 'status-pill ' + tone }, titleizeStatus(packet.status || 'clean'))
    }, [
      h('div', { className: 'review-packet-summary', key: 'summary' }, [
        h('div', { className: 'mini-stat', key: 'changed' }, [
          h('label', { key: 'l' }, 'Changed'),
          h(MiniStatValue, { value: String(summary.changedFiles || 0), variant: 'numeric', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Files in target repo')
        ]),
        h('div', { className: 'mini-stat', key: 'unstaged' }, [
          h('label', { key: 'l' }, 'Unstaged'),
          h(MiniStatValue, { value: String(summary.unstaged || 0), variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Needs developer review')
        ]),
        h('div', { className: 'mini-stat', key: 'untracked' }, [
          h('label', { key: 'l' }, 'Untracked'),
          h(MiniStatValue, { value: String(summary.untracked || 0), variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'New files')
        ]),
        h('div', { className: 'mini-stat', key: 'risk' }, [
          h('label', { key: 'l' }, 'Review Risk'),
          h(MiniStatValue, { value: String(risky), variant: risky ? 'danger' : 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Scope, dependency, or data flags')
        ])
      ]),
      h('div', { className: 'small-note', key: 'next' }, packet.nextAction || 'Review packet refreshes from the local context server.'),
      h('div', { className: 'section-inline-actions', key: 'actions' }, [
        h('button', {
          className: 'btn secondary',
          disabled: locked,
          onClick: props.onRefresh,
          title: 'Refresh changed files, scope flags, and git diff stats from the target repo.',
          key: 'refresh'
        }, 'Refresh Review Packet')
      ]),
      files.length ? h('div', { className: 'review-file-list', key: 'files' }, files.slice(0, 12).map(function (file) {
        var risk = file.reviewRisk && file.reviewRisk !== 'normal';
        return h('article', { className: 'review-file-card ' + (risk ? 'risk' : ''), key: file.path }, [
          h('div', { className: 'review-finding-head', key: 'head' }, [
            h('span', { className: 'status-pill ' + (risk ? 'bad' : 'good'), key: 'status' }, titleizeStatus(file.status)),
            h('span', { className: 'meta-pill soft', key: 'kind' }, titleizeStatus(file.kind)),
            h('span', { className: 'meta-pill soft', key: 'scope' }, file.inPlannedScope ? 'Planned Scope' : 'Outside Scope')
          ]),
          h('strong', { key: 'path' }, file.path),
          risk ? h('div', { className: 'small-note', key: 'risk' }, 'Risk: ' + titleizeStatus(file.reviewRisk)) : null
        ]);
      })) : h('div', { className: 'input-item empty', key: 'empty' }, 'No changed files detected in the selected target repo.'),
      diffStat ? h('pre', { className: 'review-diff-stat', key: 'diff' }, diffStat) : null
    ]);
  }

  function PlannerPanel(props) {
    var agentic = normalizeAgentic(props.runtime.agentic);
    var taskGraph = agentic.taskGraph || {};
    var executionPlan = agentic.executionPlan || {};
    var schedulerDecision = agentic.schedulerDecision || {};
    var agentRoster = agentic.agentRoster || {};
    var reviewerPlan = agentic.reviewerPlan || {};
    var reviewerFindings = agentic.reviewerFindings || {};
    var arbitratorDecision = agentic.arbitratorDecision || {};
    var currentCycle = agentic.currentCycle || {};
    var reworkPrompt = agentic.reworkPrompt || '';
    var verificationResults = agentic.verificationResults || {};
    var tasks = Array.isArray(taskGraph.tasks) ? taskGraph.tasks : [];
    var implementationTasks = tasks.filter(function (task) {
      return String(task.id || '').indexOf('task-') === 0;
    });
    var reviewTasks = tasks.filter(function (task) {
      return task.kind === 'review';
    });
    var lanes = Array.isArray(executionPlan.parallelLanes) ? executionPlan.parallelLanes : [];
    var blockedTasks = Array.isArray(executionPlan.blockedTasks) ? executionPlan.blockedTasks : [];
    var rosterAgents = Array.isArray(agentRoster.agents) ? agentRoster.agents : [];
    var reviewerAgents = Array.isArray(reviewerPlan.reviewers) ? reviewerPlan.reviewers : [];
    var reviewerResults = Array.isArray(reviewerFindings.reviewers) ? reviewerFindings.reviewers : [];
    var verificationSteps = Array.isArray(verificationResults.steps) ? verificationResults.steps : [];
    var locked = props.runtime.running || isAgentExecutionBusy(props.runtime) || props.runtime.serverHealth.status !== 'online';
    var arbitratorTone = arbitratorDecision.decision === 'rework_required'
      ? 'bad'
      : arbitratorDecision.decision === 'human_review_with_cautions'
        ? 'warn'
        : arbitratorDecision.decision === 'ready_for_human_review'
          ? 'good'
          : 'warn';

    return h(SectionCard, {
      title: 'Planner / Scheduler',
      subtitle: tasks.length
        ? 'ODT task order, parallel lanes, and blocked work for this assignment.'
        : 'Planner output appears after clarifications are generated or a run starts.',
      className: 'planner-panel',
      extra: h('span', { className: 'status-pill ' + (executionPlan.status === 'blocked' ? 'bad' : tasks.length ? 'good' : 'warn') }, executionPlan.status ? titleizeStatus(executionPlan.status) : 'Not Planned')
    }, [
      h('div', { className: 'planner-summary', key: 'summary' }, [
        h('div', { className: 'mini-stat', key: 'tasks' }, [
          h('label', { key: 'l' }, 'Tasks'),
          h(MiniStatValue, { value: String(tasks.length || 0), variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, implementationTasks.length + ' implementation · ' + reviewTasks.length + ' review')
        ]),
        h('div', { className: 'mini-stat', key: 'next' }, [
          h('label', { key: 'l' }, 'Next Action'),
          h(MiniStatValue, { value: titleizeStatus(executionPlan.nextAction || 'not planned'), max: 28, variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, schedulerDecision.reason || 'Generate a plan to see sequencing guidance.')
        ]),
        h('div', { className: 'mini-stat', key: 'first' }, [
          h('label', { key: 'l' }, 'First Task'),
          h(MiniStatValue, { value: executionPlan.recommendedFirstTaskId || 'n/a', variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'What the scheduler recommends first')
        ]),
        h('div', { className: 'mini-stat', key: 'arbitrator' }, [
          h('label', { key: 'l' }, 'Arbitrator'),
          h(MiniStatValue, { value: arbitratorDecision.decision ? titleizeStatus(arbitratorDecision.decision) : 'not run', max: 28, variant: arbitratorTone === 'bad' ? 'danger' : 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, arbitratorDecision.readinessScore ? ('Readiness ' + arbitratorDecision.readinessScore + '/10') : 'Run reviewer swarm after patch')
        ]),
        h('div', { className: 'mini-stat', key: 'verification' }, [
          h('label', { key: 'l' }, 'Verification'),
          h(MiniStatValue, { value: verificationResults.status ? titleizeStatus(verificationResults.status) : 'not run', max: 20, variant: verificationResults.status === 'failed' ? 'danger' : 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, verificationResults.summary
            ? ((verificationResults.summary.passed || 0) + ' passed · ' + (verificationResults.summary.failed || 0) + ' failed')
            : 'Run tests/build evidence for this cycle')
        ])
      ]),
      lanes.length ? h('div', { className: 'planner-lanes', key: 'lanes' }, [
        h('strong', { key: 'title' }, 'Parallel Lanes'),
        h('div', { className: 'planner-lane-grid', key: 'grid' }, lanes.map(function (lane, index) {
          return h('article', { className: 'planner-lane', key: lane.lane || index }, [
            h('span', { className: 'meta-pill soft', key: 'agent' }, lane.agent || lane.lane || 'Agent'),
            h('strong', { key: 'task' }, lane.task || lane.taskId || 'Planned work'),
            h('div', { className: 'small-note', key: 'files' }, lane.allowedFiles && lane.allowedFiles.length
              ? 'Allowed files: ' + lane.allowedFiles.slice(0, 3).join(', ') + (lane.allowedFiles.length > 3 ? ' +' + (lane.allowedFiles.length - 3) : '')
              : 'No write scope yet; read/review only.')
          ]);
        }))
      ]) : null,
      rosterAgents.length ? h('div', { className: 'planner-lanes', key: 'roster' }, [
        h('strong', { key: 'title' }, 'Agent Roster'),
        h('div', { className: 'small-note', key: 'strategy' }, titleizeStatus(agentRoster.strategy || 'single_writer_parallel_reviewers')),
        h('div', { className: 'planner-lane-grid', key: 'grid' }, rosterAgents.slice(0, 6).map(function (agent) {
          return h('article', { className: 'planner-lane', key: agent.id || agent.name }, [
            h('span', { className: 'meta-pill soft', key: 'mode' }, titleizeStatus(agent.mode || 'agent')),
            h('strong', { key: 'name' }, agent.name || agent.id || 'Agent'),
            h('div', { className: 'small-note', key: 'role' }, agent.responsibility || 'Role will be assigned by the planner.')
          ]);
        }))
      ]) : null,
      reviewerAgents.length ? h('div', { className: 'blocked-task-list', key: 'reviewer-plan' }, [
        h('strong', { key: 'title' }, 'Reviewer Swarm'),
        h('div', { className: 'small-note', key: 'summary' }, titleizeStatus(reviewerPlan.status || 'waiting') + ' · ' + reviewerAgents.length + ' reviewer lanes · Trigger: ' + titleizeStatus(reviewerPlan.trigger || 'main_developer_patch_completed')),
        h('div', { className: 'section-inline-actions', key: 'actions' }, [
          h('button', {
            className: 'btn secondary',
            disabled: locked || !reviewerAgents.length,
            onClick: props.onRunReviewers,
            title: 'Run read-only reviewer agents and generate a merge arbitrator decision.',
            key: 'run-reviewers'
          }, 'Run Reviewer Swarm')
        ].concat([
          h('button', {
            className: 'btn ghost',
            disabled: locked,
            onClick: props.onRunVerification,
            title: 'Run target repo lint, test, and build scripts and attach evidence to the current review cycle.',
            key: 'run-verification'
          }, 'Run Verification')
        ]).concat(arbitratorDecision.decision ? [
          h('button', {
            className: 'btn ghost',
            disabled: locked,
            onClick: props.onPrepareRework,
            title: 'Create a focused Main Developer prompt from reviewer findings and the arbitrator decision.',
            key: 'prepare-rework'
          }, 'Prepare Rework Prompt')
        ] : []).concat(reworkPrompt ? [
          h('button', {
            className: 'btn secondary',
            disabled: locked,
            onClick: props.onLaunchRework,
            title: 'Open the selected coding agent with the prepared Review Cycle rework prompt.',
            key: 'launch-rework'
          }, 'Send Rework to Main Developer')
        ] : [])),
        h('ul', { className: 'list-inline', key: 'items' }, reviewerAgents.slice(0, 5).map(function (agent) {
          return h('li', { key: agent.id || agent.name }, (agent.name || 'Reviewer') + ': ' + titleizeStatus(agent.status || 'waiting') + (agent.score ? ' · ' + agent.score + '/10' : ''));
        })),
        reviewerPlan.aggregator ? h('div', { className: 'small-note', key: 'aggregator' }, 'Aggregator: ' + (reviewerPlan.aggregator.name || 'Merge Arbitrator') + ' - ' + titleizeStatus(reviewerPlan.aggregator.status || 'waiting')) : null
      ]) : null,
      currentCycle.id ? h('div', { className: 'blocked-task-list', key: 'review-cycle' }, [
        h('strong', { key: 'title' }, currentCycle.label || ('Review Cycle ' + (currentCycle.number || ''))),
        h('div', { className: 'small-note', key: 'state' }, titleizeStatus(currentCycle.decision || currentCycle.status || 'unknown') + ' · readiness ' + (currentCycle.readinessScore || 0) + '/10'),
        h('div', { className: 'small-note', key: 'verify' }, 'Verification: ' + titleizeStatus(currentCycle.verificationStatus || verificationResults.status || 'not run')),
        h('div', { className: 'small-note', key: 'artifacts' }, 'Artifacts: ' + ((currentCycle.artifacts && (currentCycle.artifacts.verifyResults || currentCycle.artifacts.reworkPrompt)) || 'reports/odt/agentic/rework-prompt.md'))
      ]) : null,
      verificationResults.status ? h('div', { className: 'blocked-task-list', key: 'verification-results' }, [
        h('strong', { key: 'title' }, 'Verification Evidence'),
        h('div', { className: 'small-note', key: 'summary' }, titleizeStatus(verificationResults.status) + ' · ' + ((verificationResults.summary && verificationResults.summary.total) || verificationSteps.length || 0) + ' command(s) · reports/odt/agentic/verify-results.md'),
        verificationSteps.length ? h('ul', { className: 'list-inline', key: 'steps' }, verificationSteps.slice(0, 4).map(function (step) {
          return h('li', { key: step.id || step.label || step.commandLine }, (step.label || step.id || 'Command') + ': ' + titleizeStatus(step.status || 'unknown'));
        })) : null
      ]) : null,
      reworkPrompt ? h('div', { className: 'blocked-task-list', key: 'rework-prompt' }, [
        h('strong', { key: 'title' }, 'Main Developer Rework Prompt'),
        h('div', { className: 'small-note', key: 'summary' }, 'Prepared from reviewer findings. Open reports/odt/agentic/rework-prompt.md for the full prompt.'),
        h('pre', { className: 'log-preview', key: 'preview' }, reworkPrompt.slice(0, 900) + (reworkPrompt.length > 900 ? '\n...' : ''))
      ]) : null,
      reviewerResults.length ? h('div', { className: 'task-list', key: 'reviewer-results' }, reviewerResults.slice(0, 5).map(function (result) {
        var highCount = (result.findings || []).filter(function (item) { return item.severity === 'high'; }).length;
        var mediumCount = (result.findings || []).filter(function (item) { return item.severity === 'medium'; }).length;
        return h('article', { className: 'task-card', key: result.id || result.name }, [
          h('div', { className: 'clarification-card-head', key: 'head' }, [
            h('span', { className: 'status-pill ' + (highCount ? 'bad' : mediumCount ? 'warn' : 'good'), key: 'status' }, result.score ? result.score + '/10' : titleizeStatus(result.status || 'reviewed')),
            h('span', { className: 'meta-pill soft', key: 'mode' }, titleizeStatus(result.mode || 'read_only'))
          ]),
          h('strong', { key: 'name' }, result.name || result.id || 'Reviewer'),
          h('div', { className: 'small-note', key: 'summary' }, result.summary || 'Reviewer findings are available in artifacts.'),
          result.findings && result.findings.length ? h('div', { className: 'small-note', key: 'first-finding' }, result.findings[0].title + ': ' + result.findings[0].detail) : null
        ]);
      })) : null,
      arbitratorDecision.reason ? h('div', { className: 'blocked-task-list', key: 'arbitrator-decision' }, [
        h('strong', { key: 'title' }, 'Merge Arbitrator Decision'),
        h('div', { className: 'small-note', key: 'reason' }, arbitratorDecision.reason),
        h('div', { className: 'small-note', key: 'next' }, 'Next: ' + (arbitratorDecision.nextAction || 'review findings'))
      ]) : null,
      tasks.length ? h('div', { className: 'task-list', key: 'tasks' }, implementationTasks.slice(0, 6).map(function (task) {
        return h('article', { className: 'task-card', key: task.id }, [
          h('div', { className: 'clarification-card-head', key: 'head' }, [
            h('span', { className: 'status-pill good', key: 'id' }, task.id),
            h('span', { className: 'meta-pill soft', key: 'kind' }, titleizeStatus(task.kind)),
            h('span', { className: 'meta-pill soft', key: 'agent' }, task.suggestedAgent || 'Main Developer')
          ]),
          h('strong', { key: 'title' }, task.title || 'Planned task'),
          h('div', { className: 'small-note', key: 'verify' }, task.verification && task.verification.length
            ? 'Verify: ' + task.verification.join(', ')
            : 'Verification will be added by the planner.')
        ]);
      })) : h('div', { className: 'small-note', key: 'empty' }, 'No task graph has been generated yet. Generate clarifications or run ODT to create Planner v1 output.'),
      blockedTasks.length ? h('div', { className: 'blocked-task-list', key: 'blocked' }, [
        h('strong', { key: 'title' }, 'Blocked / Waiting'),
        h('ul', { className: 'list-inline', key: 'items' }, blockedTasks.map(function (item, index) {
          return h('li', { key: 'blocked-' + index }, (item.task || 'Task') + ': ' + (item.reason || 'waiting'));
        }))
      ]) : null
    ]);
  }

  function cycleTone(value) {
    var status = String(value || '').toLowerCase();
    if (status.indexOf('ready') >= 0 || status === 'passed') return 'good';
    if (status.indexOf('rework') >= 0 || status === 'failed') return 'bad';
    return 'warn';
  }

  function ReviewCycleScoreboard(props) {
    var agentic = normalizeAgentic(props.runtime.agentic);
    var history = agentic.cycleHistory || {};
    var summary = history.summary || {};
    var cycles = Array.isArray(history.cycles) ? history.cycles : [];
    var latest = cycles.length ? cycles[cycles.length - 1] : null;
    var bars = cycles.slice(-8).map(function (cycle) {
      return {
        label: cycle.label || cycle.id,
        value: Number(cycle.readinessScore || 0),
        color: cycle.highFindings ? '#8b1e13' : (cycle.verificationStatus === 'passed' ? 'linear-gradient(90deg, #2f7d57, #66a981)' : 'linear-gradient(90deg, #c74634, #de7d61)')
      };
    });

    return h(SectionCard, {
      title: 'Review Cycle Scoreboard',
      subtitle: cycles.length
        ? 'Cycle trend, decisions, findings, and verification evidence.'
        : 'Review cycle history appears after reviewer or verification runs.',
      className: 'planner-panel',
      extra: h('span', { className: 'status-pill ' + (latest ? cycleTone(latest.decision || latest.status) : 'warn') }, latest ? titleizeStatus(latest.decision || latest.status) : 'No Cycles')
    }, [
      h('div', { className: 'planner-summary', key: 'summary' }, [
        h('div', { className: 'mini-stat', key: 'total' }, [
          h('label', { key: 'l' }, 'Cycles'),
          h(MiniStatValue, { value: String(summary.total || cycles.length || 0), variant: 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, latest ? (latest.label || latest.id) : 'No cycle yet')
        ]),
        h('div', { className: 'mini-stat', key: 'score' }, [
          h('label', { key: 'l' }, 'Latest Score'),
          h(MiniStatValue, { value: String(summary.latestReadinessScore || (latest && latest.readinessScore) || 0) + '/10', variant: 'numeric', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, 'Delta ' + ((summary.readinessDelta || 0) >= 0 ? '+' : '') + (summary.readinessDelta || 0))
        ]),
        h('div', { className: 'mini-stat', key: 'verification' }, [
          h('label', { key: 'l' }, 'Verification'),
          h(MiniStatValue, { value: titleizeStatus(summary.latestVerificationStatus || (latest && latest.verificationStatus) || 'not run'), max: 22, variant: summary.latestVerificationStatus === 'failed' ? 'danger' : 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, (summary.cyclesWithFailedVerification || 0) + ' cycle(s) with failed/blocking verification')
        ]),
        h('div', { className: 'mini-stat', key: 'highs' }, [
          h('label', { key: 'l' }, 'High Findings'),
          h(MiniStatValue, { value: String(latest ? (latest.highFindings || 0) : 0), variant: latest && latest.highFindings ? 'danger' : 'status', key: 'v' }),
          h('div', { className: 'small-note', key: 'n' }, (summary.cyclesWithHighFindings || 0) + ' cycle(s) with high findings')
        ])
      ]),
      bars.length ? h('div', { className: 'planner-lanes', key: 'trend' }, [
        h('strong', { key: 'title' }, 'Readiness Trend'),
        h(BarChart, { items: bars, key: 'bars' })
      ]) : null,
      cycles.length ? h('div', { className: 'task-list', key: 'cycles' }, cycles.slice(-6).reverse().map(function (cycle) {
        var verificationSummary = cycle.verificationSummary || {};
        return h('article', { className: 'task-card', key: cycle.id || cycle.label }, [
          h('div', { className: 'clarification-card-head', key: 'head' }, [
            h('span', { className: 'status-pill ' + cycleTone(cycle.decision || cycle.status), key: 'decision' }, titleizeStatus(cycle.decision || cycle.status || 'unknown')),
            h('span', { className: 'meta-pill soft', key: 'score' }, (cycle.readinessScore || 0) + '/10'),
            h('span', { className: 'meta-pill soft', key: 'verify' }, 'Verify ' + titleizeStatus(cycle.verificationStatus || 'not run'))
          ]),
          h('strong', { key: 'title' }, cycle.label || cycle.id || 'Review Cycle'),
          h('div', { className: 'small-note', key: 'findings' }, 'Findings: ' + (cycle.highFindings || 0) + ' high · ' + (cycle.mediumFindings || 0) + ' medium · ' + (cycle.lowFindings || 0) + ' low'),
          h('div', { className: 'small-note', key: 'verify-summary' }, verificationSummary.total
            ? ('Checks: ' + (verificationSummary.passed || 0) + ' passed · ' + (verificationSummary.failed || 0) + ' failed')
            : 'Checks: not recorded'),
          h('div', { className: 'small-note', key: 'artifacts' }, 'Artifacts: ' + ((cycle.artifacts && (cycle.artifacts.arbitratorDecision || cycle.artifacts.verifyResults)) || 'reports/odt/agentic/cycles/'))
        ]);
      })) : null
    ]);
  }

  function AdvancedEvidencePanel(props) {
    return h(SectionCard, {
      title: 'Advanced Evidence',
      subtitle: 'Detailed reports, diagnostics, charts, and generated artifacts for deeper audit work.',
      className: 'advanced-evidence-panel',
      extra: h('span', { className: 'status-pill warn' }, 'Collapsed')
    }, [
      h('details', { className: 'advanced-evidence-details', key: 'details' }, [
        h('summary', { key: 'summary' }, 'Open detailed evidence and diagnostics'),
        h('div', { className: 'advanced-evidence-content', key: 'content' }, [
          h(ReviewCycleScoreboard, { runtime: props.runtime, key: 'cycle-scoreboard' }),
          h(ServerPanel, { runtime: props.runtime, key: 'server' }),
          h(ChartPanel, { runtime: props.runtime, key: 'charts-a' }),
          h(AnalysisPanel, { runtime: props.runtime, key: 'charts-b' }),
          h(TabPanel, { runtime: props.runtime, setRuntime: props.setRuntime, onReanalyze: props.onReanalyze, key: 'tabs' })
        ])
      ])
    ]);
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
    var uploadedFiles = uniqStrings([].concat(runtime.mockupImages || [], runtime.referenceDocs || []));
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
            uploadedFiles.length ? h('div', { className: 'section-inline-actions', key: 'upload-actions' }, [
              h('button', {
                className: 'btn ghost',
                disabled: controlsLocked || !isOnline,
                onClick: props.onClearDesignInputs,
                title: 'Remove all uploaded mockups and reference docs from this governed work item.',
                key: 'clear-uploads'
              }, 'Clear Uploads')
            ]) : null,
            h('div', { className: 'input-list', key: 'files' }, uploadedFiles.length
              ? uploadedFiles.map(function (filePath, index) {
                return h('div', { className: 'input-item', key: filePath + '-' + index }, [
                  h('span', { className: 'input-item-text', key: 'label' }, shorten(filePath, 84)),
                  h('button', {
                    className: 'input-item-action',
                    disabled: controlsLocked || !isOnline,
                    onClick: function () {
                      props.onRemoveDesignInput(filePath);
                    },
                    title: 'Remove this uploaded design input from the next run.',
                    key: 'remove'
                  }, 'Remove')
                ]);
              })
              : [h('div', { className: 'input-item empty', key: 'empty' }, 'No mockups or supporting docs uploaded yet.')])
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
            h('p', { key: 'step-1' }, '1. Confirm Context Vault, Planner, Review Workspace, and Review Packet.'),
            h('p', { key: 'step-2' }, '2. Accept, reject, or mark reviewer findings as required rework. Use Stage Overrides only when one stage needs special steering.'),
            h('p', { key: 'step-3' }, runtime.hasRun
              ? '3. Refresh the Review Packet before approval so final review is grounded in the target repo diff.'
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
    var responsePreviewFallback = 'No current agent response captured for this run. Launch or complete a delegated task to populate this evidence pane.';
    var responsePreviewGuide = 'Supporting evidence only. Review changed files and the repo diff as the source of truth before approval.';
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
            h('h3', { key: 'title' }, 'Agent Response Preview'),
            h('div', { className: 'small-note', key: 'note' }, responsePreviewGuide),
            h('pre', { className: 'code-block', key: 'code' }, responsePreviewFallback)
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
          h('h3', { key: 'title' }, 'Agent Response Preview'),
          h('div', { className: 'small-note', key: 'note' }, responsePreviewGuide),
          h('pre', { className: 'code-block', key: 'code' }, props.runtime.codexLaunch.responsePreview || responsePreviewFallback)
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
    var nextThemeLabel = props.theme === 'dark' ? 'Light mode' : 'Dark mode';
    return h('section', { className: 'hero hero-slim' }, [
      h('div', { className: 'hero-theme-bar', key: 'theme-bar' }, [
        h('button', {
          type: 'button',
          className: 'theme-toggle',
          onClick: props.onToggleTheme,
          'aria-label': 'Switch to ' + nextThemeLabel.toLowerCase(),
          title: 'Switch to ' + nextThemeLabel.toLowerCase(),
          key: 'theme-toggle'
        }, [
          h('span', { className: 'theme-toggle-label', key: 'label' }, 'Theme'),
          h('span', { className: 'theme-toggle-value', key: 'value' }, props.theme === 'dark' ? 'Dark' : 'Light')
        ])
      ]),
      h('div', { className: 'hero-slim-row', key: 'row' }, [
        h('div', { className: 'hero-slim-brand', key: 'brand' }, [
          h('img', { className: 'hero-worker-logo hero-slim-logo', src: DIGITAL_WORKER_ASSET_RELATIVE_PATH, alt: 'Oracle Developer Twin digital worker', key: 'logo' })
        ]),
        h('div', { className: 'hero-slim-copy', key: 'copy' }, [
          h('h1', { className: 'hero-slim-title', key: 'title' }, 'Oracle Developer Twin'),
          h('p', { className: 'hero-slim-kicker', key: 'kicker' }, 'Agent cockpit for governed developer work')
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
    var _b = useState(readTheme), theme = _b[0], setTheme = _b[1];
    var runtimeRef = useRef(runtime);

    useEffect(function () {
      runtimeRef.current = runtime;
      writeStorage(persistable(runtime));
    }, [runtime]);

    useEffect(function () {
      var nextTheme = applyTheme(theme);
      writeTheme(nextTheme);
    }, [theme]);

    useEffect(function () {
      try {
        if (window.location && window.location.search && window.location.search.indexOf('fresh=1') !== -1) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (error) {
        // ignore url cleanup failures
      }
    }, []);

    function getRuntimeSnapshot() {
      return runtimeRef.current || runtime;
    }

    function refreshServerHealth() {
      var currentRuntime = getRuntimeSnapshot();
      return getJson('/health').then(function (health) {
        var targetRepoPath = currentRuntime.targetRepoPath || 'not selected';
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
      var currentRuntime = getRuntimeSnapshot();
      return postJson('/repo/status', {
        targetRepoPath: currentRuntime.targetRepoPath || '',
        ticket: currentRuntime.ticket || '',
        workItemType: MODEL.meta.workItemType,
        reviewEdits: currentRuntime.reviewEdits || '',
        promptOverrides: normalizePromptOverrides(currentRuntime.promptOverrides)
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
        return getPromptProviderStatus(getRuntimeSnapshot());
      });
    }

    function refreshClarifications() {
      return getJson('/odt/clarifications').then(function (payload) {
        return normalizeClarifications(payload);
      }).catch(function () {
        return normalizeClarifications(getRuntimeSnapshot().clarifications || MODEL.clarifications);
      });
    }

    function refreshConversation() {
      return getJson('/odt/conversation').then(function (payload) {
        return normalizeConversation(payload);
      }).catch(function () {
        return normalizeConversation(getRuntimeSnapshot().conversation || MODEL.conversation);
      });
    }

    function refreshAgentic() {
      return getJson('/odt/agentic').then(function (payload) {
        return normalizeAgentic(payload);
      }).catch(function () {
        return normalizeAgentic(getRuntimeSnapshot().agentic || MODEL.agentic);
      });
    }

    function refreshContextArtifacts() {
      return getJson('/odt/context-artifacts').then(function (payload) {
        return normalizeContextArtifacts(payload);
      }).catch(function () {
        return normalizeContextArtifacts(getRuntimeSnapshot().contextArtifacts || MODEL.contextArtifacts);
      });
    }

    function syncStatuses() {
      var requestedRuntime = getRuntimeSnapshot();
      var requestedRepoPath = requestedRuntime.targetRepoPath || '';
      Promise.all([refreshServerHealth(), refreshRepoStatus(), refreshCodexStatus(), refreshPromptProviderStatus(), refreshClarifications(), refreshConversation(), refreshAgentic(), refreshContextArtifacts()]).then(function (values) {
        var completion = completionFromLaunch(values[2]);
        setRuntime(function (current) {
          var nextRepoStatus = values[1];
          var repoStatus = (nextRepoStatus.path || '') === (current.targetRepoPath || '')
            ? nextRepoStatus
            : current.repoStatus;
          var nextLaunch = values[2];
          var nextCompletion = completion;
          var currentLaunchStatus = inferCompletionStatus(current.codexLaunch);
          if (current.running && currentLaunchStatus === 'idle' && (nextLaunch.status === 'completed' || nextLaunch.status === 'failed')) {
            nextLaunch = current.codexLaunch;
            nextCompletion = current.completion;
          }
          if (!hasCurrentWorkflowState(current)) {
            nextLaunch = current.codexLaunch;
            nextCompletion = current.completion;
          }
          var useLiveWorkflowArtifacts = hasCurrentWorkflowState(current);
          return Object.assign({}, current, {
            serverHealth: values[0],
            repoStatus: (requestedRepoPath === (current.targetRepoPath || '')) ? repoStatus : current.repoStatus,
            codexLaunch: nextLaunch,
            completion: nextCompletion,
            promptProviderStatus: values[3],
            clarifications: useLiveWorkflowArtifacts ? mergeClarificationDrafts(values[4], current.clarifications) : current.clarifications,
            conversation: useLiveWorkflowArtifacts ? values[5] : current.conversation,
            agentic: useLiveWorkflowArtifacts ? values[6] : current.agentic,
            contextArtifacts: useLiveWorkflowArtifacts ? values[7] : current.contextArtifacts
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
      if (runtime.running || runtime.serverHealth.status !== 'online') return;
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
      var currentRuntime = getRuntimeSnapshot();
      var fileList = event && event.target && event.target.files ? Array.prototype.slice.call(event.target.files) : [];
      if (!fileList.length || currentRuntime.running || isAgentExecutionBusy(currentRuntime) || currentRuntime.serverHealth.status !== 'online') return;

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
          targetRepoPath: currentRuntime.targetRepoPath || '',
          ticket: currentRuntime.ticket || '',
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
            contextArtifacts: normalizeContextArtifacts(result.contextArtifacts || current.contextArtifacts),
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

    function removeDesignInput(filePath) {
      var currentRuntime = getRuntimeSnapshot();
      if (!filePath || currentRuntime.running || isAgentExecutionBusy(currentRuntime) || currentRuntime.serverHealth.status !== 'online') return;

      setRuntime(function (current) {
        return Object.assign({}, current, {
          uploadStatus: 'Removing selected design input...',
          apiStatus: 'Updating uploaded design inputs...'
        });
      });

      postJson('/files/remove', {
        targetRepoPath: currentRuntime.targetRepoPath || '',
        filePath: filePath
      }).then(function (result) {
        var intake = result.intake || {};
        var designInputs = intake.designInputs || {};
        setRuntime(function (current) {
          return Object.assign({}, current, {
            mockupImages: uniqStrings(designInputs.mockupImages || []),
            referenceDocs: uniqStrings(designInputs.referenceDocs || []),
            contextArtifacts: normalizeContextArtifacts(result.contextArtifacts || current.contextArtifacts),
            uploadStatus: result.removed
              ? 'Design input removed. The next run will use the updated file set.'
              : 'That design input was already cleared.',
            apiStatus: 'Uploaded design inputs refreshed.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            uploadStatus: 'Unable to remove the selected design input. ' + error.message,
            apiStatus: 'Design input removal failed. ' + error.message
          });
        });
      });
    }

    function clearDesignInputs() {
      var currentRuntime = getRuntimeSnapshot();
      if (currentRuntime.running || isAgentExecutionBusy(currentRuntime) || currentRuntime.serverHealth.status !== 'online') return;
      if (!(currentRuntime.mockupImages.length || currentRuntime.referenceDocs.length)) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            uploadStatus: 'There are no uploaded design inputs to clear.',
            apiStatus: 'No uploaded design inputs are stored for this work item.'
          });
        });
        return;
      }

      setRuntime(function (current) {
        return Object.assign({}, current, {
          uploadStatus: 'Clearing all uploaded design inputs...',
          apiStatus: 'Removing uploaded mockups and supporting docs from ODT...'
        });
      });

      postJson('/files/clear', {
        targetRepoPath: currentRuntime.targetRepoPath || ''
      }).then(function (result) {
        var intake = result.intake || {};
        var designInputs = intake.designInputs || {};
        setRuntime(function (current) {
          return Object.assign({}, current, {
            mockupImages: uniqStrings(designInputs.mockupImages || []),
            referenceDocs: uniqStrings(designInputs.referenceDocs || []),
            contextArtifacts: normalizeContextArtifacts(result.contextArtifacts || current.contextArtifacts),
            uploadStatus: 'All uploaded design inputs were cleared.',
            apiStatus: 'Uploaded design inputs cleared. Re-analyze when you are ready.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            uploadStatus: 'Unable to clear uploaded design inputs. ' + error.message,
            apiStatus: 'Clear uploads failed. ' + error.message
          });
        });
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

    function buildCurrentRequestPayload(extra) {
      return Object.assign({
        ticket: runtime.ticket || '',
        reviewEdits: runtime.reviewEdits || '',
        promptOverrides: normalizePromptOverrides(runtime.promptOverrides),
        targetRepoPath: runtime.targetRepoPath || '',
        profile: MODEL.meta.profile,
        workItemType: MODEL.meta.workItemType,
        mockupImages: runtime.mockupImages,
        referenceDocs: runtime.referenceDocs
      }, extra || {});
    }

    function applyNeedsInputResult(result, fallbackMessage) {
      var clarifications = normalizeClarifications(result && result.clarifications);
      var conversation = normalizeConversation({
        phase: 'needs_input',
        status: clarifications.status,
        nextAction: (clarifications.summary && clarifications.summary.nextAction) || fallbackMessage
      });
      setRuntime(function (current) {
        return Object.assign({}, current, {
          running: false,
          clarifications: clarifications,
          contextArtifacts: normalizeContextArtifacts((result && result.contextArtifacts) || current.contextArtifacts),
          conversation: conversation,
          apiStatus: result.note || fallbackMessage || 'ODT paused for clarification answers before continuing.'
        });
      });
    }

    function generateClarifications() {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online') return;
      var requestPayload = buildCurrentRequestPayload();
      setRuntime(function (current) {
        return Object.assign({}, current, {
          apiStatus: 'Generating decision-critical clarification questions...'
        });
      });
      postJson('/odt/clarifications/generate', requestPayload).then(function (result) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            clarifications: normalizeClarifications(result.clarifications),
            agentic: normalizeAgentic(result.agentic),
            contextArtifacts: normalizeContextArtifacts(result.contextArtifacts || current.contextArtifacts),
            conversation: normalizeConversation({
              phase: result.status === 'needs_input' ? 'needs_input' : 'ready_to_continue',
              status: result.status,
              nextAction: result.clarifications && result.clarifications.summary ? result.clarifications.summary.nextAction : ''
            }),
            apiStatus: result.status === 'needs_input'
              ? 'Clarifications generated. Answer high-severity questions before continuing.'
              : 'No critical blockers found. ODT can continue.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            apiStatus: 'Unable to generate clarifications. ' + error.message
          });
        });
      });
    }

    function saveClarificationAnswers() {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online') return;
      var clarifications = normalizeClarifications(runtime.clarifications);
      setRuntime(function (current) {
        return Object.assign({}, current, {
          apiStatus: 'Saving clarification answers...'
        });
      });
      postJson('/odt/clarifications/answer', {
        targetRepoPath: runtime.targetRepoPath || '',
        answers: clarifications.questions.map(function (question) {
          return {
            id: question.id,
            answer: question.answer || ''
          };
        })
      }).then(function (result) {
        var nextClarifications = normalizeClarifications(result.clarifications);
        setRuntime(function (current) {
          return Object.assign({}, current, {
            clarifications: nextClarifications,
            agentic: normalizeAgentic(result.agentic),
            contextArtifacts: normalizeContextArtifacts(result.contextArtifacts || current.contextArtifacts),
            conversation: normalizeConversation({
              phase: nextClarifications.status === 'needs_input' ? 'needs_input' : 'ready_to_continue',
              status: nextClarifications.status,
              nextAction: nextClarifications.summary.nextAction
            }),
            apiStatus: nextClarifications.summary.unresolvedHigh
              ? 'Answers saved. High-severity questions are still open.'
              : 'Answers saved. ODT can continue.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            apiStatus: 'Unable to save clarification answers. ' + error.message
          });
        });
      });
    }

    function continueCurrentTask() {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online') return;
      var requestPayload = buildCurrentRequestPayload();
      var submittedFingerprint = buildRunFingerprint(requestPayload);
      setRuntime(function (current) {
        return Object.assign({}, current, {
          running: true,
          apiStatus: 'Continuing current assignment with saved clarification answers...'
        });
      });
      postJson('/odt/continue', requestPayload).then(function (result) {
        if (result && result.status === 'needs_input') {
          applyNeedsInputResult(result, 'ODT is still paused for high-severity clarification answers.');
          return { paused: true };
        }
        markRunSession(submittedFingerprint);
        setRuntime(function (current) {
          return Object.assign({}, current, {
            running: false,
            hasRun: true,
            lastRunFingerprint: submittedFingerprint,
            clarifications: normalizeClarifications(result && result.clarifications),
            agentic: normalizeAgentic(result && result.agentic),
            contextArtifacts: normalizeContextArtifacts((result && result.contextArtifacts) || current.contextArtifacts),
            conversation: normalizeConversation({ phase: 'ready_for_review', status: 'ok', nextAction: 'Review refreshed artifacts.' }),
            apiStatus: 'Current assignment continued. Reloading latest artifacts...'
          });
        });
        window.setTimeout(function () {
          window.location.reload();
        }, 900);
        return { paused: false };
      }).catch(function (error) {
        Promise.all([refreshServerHealth(), refreshCodexStatus(), refreshPromptProviderStatus()]).then(function (values) {
          var completion = completionFromLaunch(values[1]);
          setRuntime(function (current) {
            return Object.assign({}, current, {
              running: false,
              apiStatus: 'Continue failed. ' + error.message,
              serverHealth: values[0],
              codexLaunch: values[1],
              completion: completion,
              promptProviderStatus: values[2]
            });
          });
        });
      });
    }

    function runReviewerSwarm() {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online') return;
      var requestPayload = buildCurrentRequestPayload();
      setRuntime(function (current) {
        return Object.assign({}, current, {
          running: true,
          apiStatus: 'Running read-only reviewer swarm and merge arbitrator...'
        });
      });
      postJson('/odt/reviewers/run', requestPayload).then(function (result) {
        var decision = result && result.arbitratorDecision ? result.arbitratorDecision : {};
        setRuntime(function (current) {
          return Object.assign({}, current, {
            running: false,
            agentic: normalizeAgentic(result && result.agentic),
            reviewPacket: normalizeReviewPacket((result && result.reviewPacket) || current.reviewPacket),
            apiStatus: decision.decision
              ? 'Reviewer swarm complete. Arbitrator decision: ' + titleizeStatus(decision.decision) + '.'
              : 'Reviewer swarm complete.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            running: false,
            apiStatus: 'Reviewer swarm failed. ' + error.message
          });
        });
      });
    }

    function saveReviewSuggestion(suggestion) {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online' || !suggestion || !suggestion.id) return;
      var normalizedSuggestion = Object.assign({}, suggestion, {
        decision: normalizeReviewDecision(suggestion.decision)
      });
      patchLocalReviewSuggestion(setRuntime, normalizedSuggestion);
      setRuntime(function (current) {
        return Object.assign({}, current, {
          apiStatus: 'Saving review decision for ' + (normalizedSuggestion.reviewerName || 'reviewer') + '...'
        });
      });
      postJson('/odt/review-suggestions/update', buildCurrentRequestPayload({
        suggestions: [normalizedSuggestion]
      })).then(function (result) {
        var summary = result && result.reviewSuggestions && result.reviewSuggestions.summary ? result.reviewSuggestions.summary : {};
        setRuntime(function (current) {
          return Object.assign({}, current, {
            agentic: normalizeAgentic(result && result.agentic),
            apiStatus: 'Review decision saved. Accepted ' + (summary.accepted || 0) + ', needs rework ' + (summary.needsRework || 0) + '.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            apiStatus: 'Unable to save review decision. ' + error.message
          });
        });
      });
    }

    function prepareReworkPrompt() {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online') return;
      var requestPayload = buildCurrentRequestPayload();
      setRuntime(function (current) {
        return Object.assign({}, current, {
          running: true,
          apiStatus: 'Preparing focused Main Developer rework prompt from reviewer findings...'
        });
      });
      postJson('/odt/rework/prepare', requestPayload).then(function (result) {
        var cycle = result && result.currentCycle ? result.currentCycle : {};
        setRuntime(function (current) {
          return Object.assign({}, current, {
            running: false,
            agentic: normalizeAgentic(result && result.agentic),
            apiStatus: cycle.id
              ? 'Prepared ' + (cycle.label || cycle.id) + ' rework prompt.'
              : 'Prepared rework prompt.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            running: false,
            apiStatus: 'Unable to prepare rework prompt. ' + error.message
          });
        });
      });
    }

    function launchReworkPrompt() {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online') return;
      var selectedTool = runtime.agentTool || 'codex';
      var requestPayload = buildCurrentRequestPayload({
        tool: selectedTool,
        mode: 'terminal'
      });
      setRuntime(function (current) {
        return Object.assign({}, current, {
          running: true,
          apiStatus: 'Opening focused Review Cycle rework in a visible ' + selectedTool + ' task...',
          codexLaunch: buildIdleCodexLaunch('Clearing stale delegated agent logs before launching focused Main Developer rework.'),
          completion: buildIdleCompletion('Preparing focused rework delegation from the latest reviewer findings.')
        });
      });
      postJson('/odt/rework/launch', requestPayload).then(function (result) {
        return Promise.all([refreshCodexStatus(), refreshPromptProviderStatus()]).then(function (values) {
          var launch = values[0] || (result && result.launch);
          var completion = completionFromLaunch(launch);
          setRuntime(function (current) {
            return Object.assign({}, current, {
              running: false,
              agentic: normalizeAgentic((result && result.agentic) || current.agentic),
              apiStatus: selectedTool + ' was opened in Terminal with the focused Review Cycle rework prompt.',
              codexLaunch: launch,
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
              apiStatus: 'Focused rework launch failed. Ensure the local context server is active and the CLI is authenticated. ' + error.message,
              serverHealth: values[0],
              codexLaunch: values[1],
              completion: completion,
              promptProviderStatus: values[2]
            });
          });
        });
      });
    }

    function runVerificationEvidence() {
      if (runtime.running || isAgentExecutionBusy(runtime) || runtime.serverHealth.status !== 'online') return;
      var requestPayload = buildCurrentRequestPayload();
      setRuntime(function (current) {
        return Object.assign({}, current, {
          running: true,
          apiStatus: 'Running target repo verification for the current review cycle...'
        });
      });
      postJson('/odt/verify/run', requestPayload).then(function (result) {
        var verification = result && result.verificationResults ? result.verificationResults : {};
        setRuntime(function (current) {
          return Object.assign({}, current, {
            running: false,
            agentic: normalizeAgentic(result && result.agentic),
            apiStatus: verification.status
              ? 'Verification ' + titleizeStatus(verification.status) + '. Evidence written to reports/odt/agentic/verify-results.md.'
              : 'Verification evidence written.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            running: false,
            apiStatus: 'Verification failed to run. ' + error.message
          });
        });
      });
    }

    function refreshReviewPacketNow() {
      if (runtime.running || runtime.serverHealth.status !== 'online') return;
      var requestPayload = buildCurrentRequestPayload();
      setRuntime(function (current) {
        return Object.assign({}, current, {
          apiStatus: 'Refreshing Review Packet from the target repo git diff...'
        });
      });
      postJson('/odt/review-packet/refresh', requestPayload).then(function (result) {
        var packet = normalizeReviewPacket(result && result.reviewPacket);
        setRuntime(function (current) {
          return Object.assign({}, current, {
            reviewPacket: packet,
            apiStatus: 'Review Packet refreshed. Changed files: ' + (packet.summary.changedFiles || 0) + '.'
          });
        });
      }).catch(function (error) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            apiStatus: 'Review Packet refresh failed. ' + error.message
          });
        });
      });
    }

    function runWorker() {
      if (runtime.running || isAgentExecutionBusy(runtime)) return;
      var requestPayload = buildCurrentRequestPayload();
      var startsNewAssignment = isNewAssignmentRequest(runtime, requestPayload);
      if (startsNewAssignment) {
        requestPayload = Object.assign({}, requestPayload, { newTask: true });
        clearRunSession();
      }
      var submittedFingerprint = buildRunFingerprint(requestPayload);
      setRuntime(function (current) {
        return Object.assign({}, current, startsNewAssignment ? {
          hasRun: false,
          lastRunFingerprint: '',
          clarifications: normalizeClarifications(EMPTY_CLARIFICATIONS),
          conversation: normalizeConversation(EMPTY_CONVERSATION),
          agentic: normalizeAgentic(EMPTY_AGENTIC),
          contextArtifacts: normalizeContextArtifacts(EMPTY_CONTEXT_ARTIFACTS),
          reviewPacket: normalizeReviewPacket(EMPTY_REVIEW_PACKET)
        } : {}, {
          running: true,
          stepStatus: {},
          apiStatus: startsNewAssignment
            ? 'Starting a new assignment. Clearing stale runtime state before ODT runs...'
            : 'Updating intake and running ODT pipeline...',
          codexLaunch: buildIdleCodexLaunch(startsNewAssignment
            ? 'Starting a new assignment. Previous delegated agent preview and stale execution state will be cleared.'
            : 'Starting a fresh governed run. Previous delegated agent preview has been cleared.'),
          completion: buildIdleCompletion(startsNewAssignment
            ? 'Preparing a clean governed run for the new assignment.'
            : 'Preparing a fresh governed run. Delegated agent status will repopulate after launch.')
        });
      });

      refreshServerHealth().then(function (health) {
        setRuntime(function (current) {
          return Object.assign({}, current, { serverHealth: health });
        });
        return postJson('/odt/run', requestPayload);
      }).then(function (result) {
        if (result && result.status === 'needs_input') {
          applyNeedsInputResult(result, 'ODT paused. Answer the critical clarification questions, then continue.');
          return { paused: true };
        }
        markRunSession(submittedFingerprint);
        setRuntime(function (current) {
          return Object.assign({}, current, {
            hasRun: true,
            lastRunFingerprint: submittedFingerprint,
            clarifications: normalizeClarifications(result && result.clarifications),
            agentic: normalizeAgentic(result && result.agentic),
            contextArtifacts: normalizeContextArtifacts((result && result.contextArtifacts) || current.contextArtifacts)
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
        return chain.then(function () { return { paused: false }; });
      }).then(function (previous) {
        if (previous && previous.paused) return null;
        return Promise.all([refreshCodexStatus(), refreshPromptProviderStatus()]).then(function (values) {
          var completion = completionFromLaunch(values[0]);
          markRunSession(submittedFingerprint);
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
      if (hasBlockingClarifications(runtime)) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            apiStatus: 'Delegation is blocked until high-severity clarification questions are answered.'
          });
        });
        return;
      }
      if (hasBlockingContextArtifacts(runtime)) {
        setRuntime(function (current) {
          return Object.assign({}, current, {
            apiStatus: 'Delegation is blocked because one or more attached context files are missing. Re-upload or remove stale references first.'
          });
        });
        return;
      }
      var requestPayload = buildCurrentRequestPayload();
      var startsNewAssignment = isNewAssignmentRequest(runtime, requestPayload);
      if (startsNewAssignment) {
        requestPayload = Object.assign({}, requestPayload, { newTask: true });
        clearRunSession();
      }
      var submittedFingerprint = buildRunFingerprint(requestPayload);
      setRuntime(function (current) {
        return Object.assign({}, current, startsNewAssignment ? {
          hasRun: false,
          lastRunFingerprint: '',
          clarifications: normalizeClarifications(EMPTY_CLARIFICATIONS),
          conversation: normalizeConversation(EMPTY_CONVERSATION),
          agentic: normalizeAgentic(EMPTY_AGENTIC),
          contextArtifacts: normalizeContextArtifacts(EMPTY_CONTEXT_ARTIFACTS),
          reviewPacket: normalizeReviewPacket(EMPTY_REVIEW_PACKET)
        } : {}, {
          running: true,
          apiStatus: startsNewAssignment
            ? 'Preparing a clean new assignment before opening a visible ' + selectedTool + ' task...'
            : 'Preparing execution prompt and opening a visible ' + selectedTool + ' task...',
          codexLaunch: buildIdleCodexLaunch(startsNewAssignment
            ? 'Clearing stale execution state before launching the selected agent...'
            : 'Refreshing the execution bundle and clearing the prior agent response preview...'),
          completion: buildIdleCompletion(startsNewAssignment
            ? 'Preparing a clean delegated agent launch for the new assignment.'
            : 'Preparing the next delegated agent launch...')
        });
      });
      refreshServerHealth().then(function (health) {
        setRuntime(function (current) {
          return Object.assign({}, current, { serverHealth: health });
        });
        return postJson('/odt/run', requestPayload);
      }).then(function (result) {
        if (result && result.status === 'needs_input') {
          applyNeedsInputResult(result, 'Delegation paused. Answer the critical clarification questions, then continue.');
          return { paused: true };
        }
        markRunSession(submittedFingerprint);
        setRuntime(function (current) {
          return Object.assign({}, current, {
            hasRun: true,
            lastRunFingerprint: submittedFingerprint,
            clarifications: normalizeClarifications(result && result.clarifications),
            agentic: normalizeAgentic(result && result.agentic),
            contextArtifacts: normalizeContextArtifacts((result && result.contextArtifacts) || current.contextArtifacts)
          });
        });
        return { paused: false };
      }).then(function (result) {
        if (result && result.paused) return { skipped: true };
        return postJson('/odt/agent/launch', {
          targetRepoPath: runtime.targetRepoPath || '',
          tool: selectedTool,
          mode: 'terminal',
          refresh: false
        });
      }).then(function (launchResult) {
        if (launchResult && launchResult.skipped) return null;
        if (launchResult && launchResult.status === 'needs_input') {
          setRuntime(function (current) {
            return Object.assign({}, current, {
              running: false,
              contextArtifacts: normalizeContextArtifacts(launchResult.contextArtifacts || current.contextArtifacts),
              apiStatus: launchResult.note || 'Agent launch paused. Fix context artifacts before retrying.'
            });
          });
          return null;
        }
        return Promise.all([refreshCodexStatus(), refreshPromptProviderStatus()]).then(function (values) {
          var completion = completionFromLaunch(values[0]);
          markRunSession(submittedFingerprint);
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
      var currentRuntime = getRuntimeSnapshot();
      function finishReset(message) {
        clearStorage();
        clearRunSession();
        setRuntime(function () {
          var fresh = createInitialRuntime({ forceClean: true });
          return Object.assign({}, fresh, {
            apiStatus: message || 'Workspace reset. Ready to run digital worker.',
            uploadStatus: ''
          });
        });
        window.setTimeout(function () {
          var cleanPath = window.location.pathname + '?fresh=1&t=' + Date.now();
          window.location.assign(cleanPath);
        }, 120);
      }

      if (currentRuntime.serverHealth.status !== 'online') {
        finishReset('Workspace reset locally. Start the local context server next time to clear server-side uploads and agent state too.');
        return;
      }

      setRuntime(function (current) {
        return Object.assign({}, current, {
          apiStatus: 'Resetting workspace, uploaded inputs, and delegated agent state...'
        });
      });

      Promise.all([
        postJson('/files/clear', {
          targetRepoPath: currentRuntime.targetRepoPath || ''
        }).catch(function () {
          return null;
        }),
        postJson('/intake', {
          targetRepoPath: currentRuntime.targetRepoPath || '',
          resetStaleState: true
        }).catch(function () {
          return null;
        }),
        postJson('/odt/agent/reset', {
          targetRepoPath: currentRuntime.targetRepoPath || '',
          tool: currentRuntime.agentTool || 'codex',
          note: 'Workspace reset requested from ODT Workspace.'
        }).catch(function () {
          return null;
        })
      ]).finally(function () {
        finishReset('Workspace reset. Uploaded inputs and delegated agent state were cleared for the next run.');
      });
    }

    return h('main', { className: 'fedit-shell' }, [
      h(HeroHeader, {
        runtime: runtime,
        theme: theme,
        onToggleTheme: function () {
          setTheme(function (currentTheme) {
            return currentTheme === 'dark' ? 'light' : 'dark';
          });
        }
      }),
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
        onRemoveDesignInput: removeDesignInput,
        onClearDesignInputs: clearDesignInputs,
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
          h(ClarificationsPanel, {
            runtime: runtime,
            setRuntime: setRuntime,
            onGenerate: generateClarifications,
            onSave: saveClarificationAnswers,
            onContinue: continueCurrentTask,
            key: 'clarifications'
          }),
          h(ContextVaultPanel, {
            runtime: runtime,
            key: 'context-vault'
          }),
          h(AgentCockpit, {
            runtime: runtime,
            key: 'agent-cockpit'
          }),
          h(PlannerPanel, {
            runtime: runtime,
            onRunReviewers: runReviewerSwarm,
            onRunVerification: runVerificationEvidence,
            onPrepareRework: prepareReworkPrompt,
            onLaunchRework: launchReworkPrompt,
            key: 'planner'
          }),
          h(ReviewWorkspace, {
            runtime: runtime,
            setRuntime: setRuntime,
            onRunReviewers: runReviewerSwarm,
            onSaveReviewSuggestion: saveReviewSuggestion,
            key: 'review-workspace'
          }),
          h(ReviewPacketPanel, {
            runtime: runtime,
            onRefresh: refreshReviewPacketNow,
            key: 'review-packet'
          }),
          h(AdvancedEvidencePanel, {
            runtime: runtime,
            setRuntime: setRuntime,
            onReanalyze: runWorker,
            key: 'advanced-evidence'
          })
        ])
      ])
    ]);
  }

  ReactDOM.render(React.createElement(App), document.getElementById('app'));
}());