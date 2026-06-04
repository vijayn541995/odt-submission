export const agentFoundryPhases = [
  {
    id: 'full-sdlc',
    label: 'Full SDLC',
    description: 'Run all specialist domains and save one grouped delivery review.'
  },
  {
    id: 'focused-domain',
    label: 'Focused Domain',
    description: 'Run one specialist domain against the current assignment evidence.'
  }
];

export const agentFoundryDomains = [
  {
    id: 'requirements',
    label: 'Requirements',
    specialist: 'Requirement Scout',
    description: 'User stories, acceptance criteria, MoSCoW, gaps, assumptions, and clarification needs.',
    standardsFocus: ['requirements', 'traceability', 'clarifying questions'],
    nextActions: ['Map acceptance criteria to tests.', 'Close or accept open requirement gaps before write approval.']
  },
  {
    id: 'ux',
    label: 'UX',
    specialist: 'Redwood UX Sentinel',
    description: 'Redwood-like UX, personas, journeys, wireframes, accessibility, keyboard, and screen reader concerns.',
    standardsFocus: ['Redwood-like UX', 'WCAG 2.2', 'VPAT impact', 'Section 508'],
    nextActions: ['Verify keyboard flow and visible focus.', 'Make loading, empty, error, and success states explicit.']
  },
  {
    id: 'product',
    label: 'Product',
    specialist: 'Product Value Strategist',
    description: 'PRD clarity, prioritization, RICE-style tradeoffs, roadmap fit, and user value.',
    standardsFocus: ['scope control', 'priority', 'product readiness'],
    nextActions: ['Confirm priority and scope boundaries.', 'Tie next action to the user value and acceptance criteria.']
  },
  {
    id: 'architecture',
    label: 'Architecture',
    specialist: 'Architecture Cartographer',
    description: 'C4-style system thinking, boundaries, APIs, ADRs, data model, extension points, and rollback.',
    standardsFocus: ['architecture decision records', 'API boundary', 'data model', 'rollback'],
    nextActions: ['Keep React/backend/provider boundaries explicit.', 'Record architecture decisions before implementation.']
  },
  {
    id: 'development',
    label: 'Development',
    specialist: 'Delivery Engineer',
    description: 'Implementation tasks, APIs, components, data models, auth, validation, and repo patterns.',
    standardsFocus: ['implementation plan', 'validation', 'safe errors', 'repo patterns'],
    nextActions: ['Confirm impacted files.', 'Keep implementation inside approved file scope.']
  },
  {
    id: 'code-review',
    label: 'Code Review',
    specialist: 'Code Quality Advocate',
    description: 'SOLID, maintainability, OWASP Top 10 sanity, quality score, and reviewer readiness.',
    standardsFocus: ['maintainability', 'OWASP sanity', 'review readiness'],
    nextActions: ['Prepare reviewer notes.', 'Record implementation evidence before PR readiness.']
  },
  {
    id: 'compliance',
    label: 'Compliance',
    specialist: 'Compliance Guardian',
    description: 'GDPR, HIPAA, PCI-DSS, SOC2 style prompts, privacy, auditability, VPAT, and policy notes.',
    standardsFocus: ['security', 'privacy', 'audit trail', 'VPAT', 'Section 508'],
    nextActions: ['Document compliance impact.', 'Keep secrets and provider credentials out of React and artifacts.']
  },
  {
    id: 'ci-cd',
    label: 'CI/CD',
    specialist: 'Pipeline Steward',
    description: 'Build commands, GitHub Actions, Docker/Kubernetes/Terraform awareness, release gates, and rollback checks.',
    standardsFocus: ['build', 'pipeline', 'release gate', 'rollback'],
    nextActions: ['Run the repo build command.', 'Capture command evidence in Runs or Review.']
  },
  {
    id: 'qa',
    label: 'QA',
    specialist: 'Quality Strategist',
    description: 'Test strategy, positive/negative/boundary/error cases, quality gates, coverage, and regression risk.',
    standardsFocus: ['test strategy', 'coverage', 'negative testing', 'accessibility testing'],
    nextActions: ['Add negative and boundary cases.', 'Record skipped tests with reviewer notes.']
  },
  {
    id: 'operations',
    label: 'Operations',
    specialist: 'Operations Readiness Lead',
    description: 'Runbooks, SLOs, monitoring, incident response, support model, fallback, and disaster recovery thinking.',
    standardsFocus: ['runbook', 'monitoring', 'fallback', 'incident response'],
    nextActions: ['Document startup, stop, and restore steps.', 'Capture operational risks and fallback behavior.']
  }
];

export function getAgentFoundryDomain(domainId) {
  return agentFoundryDomains.find((domain) => domain.id === domainId) || null;
}

export function getAgentFoundryPhase(phaseId) {
  return agentFoundryPhases.find((phase) => phase.id === phaseId) || agentFoundryPhases[0];
}

export function resolveAgentFoundryDomains({ phase = 'full-sdlc', domainId = '' } = {}) {
  if (phase === 'full-sdlc') return agentFoundryDomains;
  const domain = getAgentFoundryDomain(domainId);
  if (!domain) {
    const error = new Error('A valid specialist domain is required for focused Agent Foundry runs.');
    error.statusCode = 400;
    throw error;
  }
  return [domain];
}

export function summarizeFoundryContext(evidence = {}) {
  const latestRequirement = evidence.requirements?.[0] || {};
  const latestRepo = evidence.repoAnalysis?.[0]?.analysisJson || {};
  const latestDesign = evidence.technicalDesigns?.[0]?.designJson || {};
  const latestPlan = evidence.implementationPlans?.[0]?.planJson || {};
  const latestStandards = evidence.standardsChecks?.[0] || {};
  const latestImplementation = evidence.implementationEvidence?.[0] || null;
  const latestPr = evidence.prReadinessReports?.[0]?.reportJson || null;
  const openReviewBlockers = (evidence.reviewComments || []).filter((comment) => comment.status === 'open' && comment.severity === 'blocker');
  const standardsBlockers = latestStandards.findings?.filter((finding) => finding.status === 'BLOCKER') || [];
  const pendingDependencies = (evidence.dependencyRequests || []).filter((request) => request.status === 'pending');
  const approvedDependencies = (evidence.dependencyRequests || []).filter((request) => request.status === 'approved');
  const testPlans = evidence.testPlans || [];

  return {
    assignmentTitle: evidence.assignment?.title || 'ODT assignment',
    requirementSummary: latestRequirement.summary || evidence.assignment?.requirement || '',
    repoPath: latestRepo.repoPath || evidence.assignment?.repoPath || '',
    frameworks: latestRepo.frameworks || [],
    testFrameworks: latestRepo.testFrameworks || [],
    hasRequirement: Boolean(latestRequirement.id || evidence.assignment?.requirement),
    hasRepoAnalysis: Boolean(evidence.repoAnalysis?.length),
    hasDesign: Boolean(evidence.technicalDesigns?.length),
    hasPlan: Boolean(evidence.implementationPlans?.length),
    hasStandardsCheck: Boolean(evidence.standardsChecks?.length),
    hasWriteApproval: Boolean(evidence.workflowState?.allowedActions?.canDelegateWrite),
    hasImplementationEvidence: Boolean(latestImplementation),
    hasPrPack: Boolean(latestPr),
    latestStandardsStatus: latestStandards.status || 'NOT_RUN',
    standardsBlockers,
    openReviewBlockers,
    pendingDependencies,
    approvedDependencies,
    testPlans,
    planFileCount: latestPlan.filesToChange?.length || 0,
    planHasAccessibility: containsText(latestPlan, ['accessibility', 'WCAG', 'VPAT', 'Section 508']),
    planHasSecurity: containsText(latestPlan, ['security', 'secret', 'validation', 'safe error']),
    planHasTesting: containsText(latestPlan, ['test', 'coverage', 'negative', 'boundary']),
    designHasArchitecture: containsText(latestDesign, ['architecture', 'API', 'backend', 'React', 'data']),
    designHasRollback: containsText(latestDesign, ['rollback']),
    implementationTestCount: latestImplementation?.tests?.length || 0,
    failedImplementationTests: (latestImplementation?.tests || []).filter((test) => test.status === 'failed'),
    latestPrStatus: latestPr?.status || ''
  };
}

export function buildAgentFoundryOutput({ domain, phase, evidence, inputSources = [], provider = 'local', model = 'local-foundry-model' }) {
  const context = summarizeFoundryContext(evidence);
  const findings = buildDomainFindings(domain.id, context);
  const risks = buildDomainRisks(domain.id, context);
  const recommendations = buildDomainRecommendations(domain, context);
  const missingInformation = buildDomainMissingInformation(domain.id, context);
  const requiredApprovals = buildRequiredApprovals(context);
  const status = findings.some((finding) => ['BLOCKER', 'NEEDS_REVIEW', 'APPROVAL_REQUIRED'].includes(finding.status))
    ? 'NEEDS_REVIEW'
    : findings.some((finding) => finding.status === 'WARNING')
      ? 'WARNING'
      : 'PASS';

  return {
    label: 'AI-generated suggestion',
    humanReviewRequired: true,
    specialistDomain: domain.id,
    specialistLabel: domain.label,
    specialistName: domain.specialist,
    phase,
    provider,
    model,
    status,
    summary: `${domain.specialist} reviewed ${context.assignmentTitle} for ${domain.label.toLowerCase()} readiness. Status: ${status}.`,
    inputSources,
    contextSnapshot: {
      hasRequirement: context.hasRequirement,
      hasRepoAnalysis: context.hasRepoAnalysis,
      hasDesign: context.hasDesign,
      hasPlan: context.hasPlan,
      latestStandardsStatus: context.latestStandardsStatus,
      pendingDependencies: context.pendingDependencies.length,
      openReviewBlockers: context.openReviewBlockers.length
    },
    findings,
    risks,
    recommendations,
    missingInformation,
    standardsImpact: {
      categories: domain.standardsFocus,
      accessibilityRequired: domain.id === 'ux' || domain.id === 'compliance' || context.planHasAccessibility,
      securityRequired: domain.id === 'compliance' || domain.id === 'development' || domain.id === 'code-review' || context.planHasSecurity,
      dependencyApprovalRequired: true,
      testingRequired: domain.id === 'qa' || domain.id === 'ci-cd' || context.planHasTesting,
      note: 'Foundry output is advisory evidence. It does not approve write, dependency install, or PR readiness gates.'
    },
    requiredApprovals,
    nextActions: domain.nextActions,
    createdAt: new Date().toISOString()
  };
}

function containsText(value, needles) {
  const haystack = JSON.stringify(value || {}).toLowerCase();
  return needles.some((needle) => haystack.includes(String(needle).toLowerCase()));
}

function finding(category, status, message, recommendation) {
  return { category, status, message, recommendation };
}

function baseFindings(context) {
  return [
    context.hasRequirement
      ? finding('requirement', 'PASS', 'Requirement context is available.', 'Keep requirement evidence linked to the plan.')
      : finding('requirement', 'BLOCKER', 'Requirement context is missing.', 'Capture requirement or Jira details in Intake.'),
    context.hasRepoAnalysis
      ? finding('repo-analysis', 'PASS', 'Repository analysis evidence is available.', 'Use detected repo patterns before implementation.')
      : finding('repo-analysis', 'WARNING', 'Repository analysis has not been recorded.', 'Run read-only repo analysis before implementation planning.'),
    context.hasStandardsCheck
      ? finding('standards', context.latestStandardsStatus === 'PASS' ? 'PASS' : 'NEEDS_REVIEW', `Latest standards gate is ${context.latestStandardsStatus}.`, 'Review standards findings before write or delegate actions.')
      : finding('standards', 'WARNING', 'No standards review is recorded yet.', 'Run standards review before write approval.')
  ];
}

function buildDomainFindings(domainId, context) {
  const findings = baseFindings(context);
  const add = (item) => findings.push(item);

  if (domainId === 'requirements') {
    add(context.requirementSummary.length > 80
      ? finding('requirements-depth', 'PASS', 'Requirement summary has enough substance for planning.', 'Map it to acceptance criteria and tests.')
      : finding('requirements-depth', 'WARNING', 'Requirement detail is thin or not yet summarized.', 'Add user story, acceptance criteria, constraints, and out-of-scope notes.'));
    add(context.hasPlan
      ? finding('traceability', 'PASS', 'Implementation plan is available for traceability review.', 'Trace plan tasks back to requirement outcomes.')
      : finding('traceability', 'NEEDS_REVIEW', 'Implementation plan is not yet available.', 'Draft the plan before handoff.'));
  }

  if (domainId === 'ux') {
    add(context.planHasAccessibility
      ? finding('accessibility', 'PASS', 'Plan includes accessibility language.', 'Verify keyboard, focus, labels, contrast, and screen reader names in UI review.')
      : finding('accessibility', 'WARNING', 'Accessibility detail is not explicit in the current plan.', 'Add WCAG 2.2, VPAT, Section 508, keyboard, and focus checks.'));
    add(finding('redwood-ux', 'NEEDS_REVIEW', 'Redwood-like UX consistency needs human visual review.', 'Confirm calm hierarchy, readable status language, and no color-only state.'));
  }

  if (domainId === 'product') {
    add(context.hasPlan
      ? finding('product-scope', 'PASS', 'A plan exists for product review.', 'Confirm MVP value and defer non-critical expansion.')
      : finding('product-scope', 'WARNING', 'Product scope is not yet tied to an implementation plan.', 'Draft plan and rank must-have vs nice-to-have work.'));
    add(finding('prioritization', 'NEEDS_REVIEW', 'RICE or release priority is not captured as structured evidence.', 'Record priority, user impact, and release tradeoffs if this becomes a real Jira.'));
  }

  if (domainId === 'architecture') {
    add(context.designHasArchitecture
      ? finding('architecture-boundary', 'PASS', 'Architecture boundary is described in design evidence.', 'Keep AI/provider calls behind backend APIs.')
      : finding('architecture-boundary', 'WARNING', 'Architecture boundary is not explicit enough.', 'Add UI/backend/data/provider boundaries before implementation.'));
    add(context.designHasRollback
      ? finding('rollback', 'PASS', 'Rollback thinking is present.', 'Keep rollback notes in PR readiness.')
      : finding('rollback', 'WARNING', 'Rollback plan is missing or weak.', 'Add fallback or rollback notes before PR readiness.'));
  }

  if (domainId === 'development') {
    add(context.planFileCount
      ? finding('impacted-files', 'PASS', `${context.planFileCount} planned file(s) are listed.`, 'Keep implementation inside approved scope or record changes.')
      : finding('impacted-files', 'WARNING', 'Impacted files are not listed.', 'List files before write approval.'));
    add(context.planHasSecurity
      ? finding('validation', 'PASS', 'Security/validation language is present.', 'Keep safe errors and input validation explicit.')
      : finding('validation', 'WARNING', 'Validation and safe-error details are not explicit.', 'Add validation, safe errors, and secret-handling notes.'));
  }

  if (domainId === 'code-review') {
    add(context.hasImplementationEvidence
      ? finding('review-evidence', 'PASS', 'Implementation evidence is available for review.', 'Review changed files, command results, and known risks.')
      : finding('review-evidence', 'NEEDS_REVIEW', 'No implementation evidence is recorded yet.', 'Record changed files, commands, tests, and summary before PR readiness.'));
    add(finding('owasp-solid', 'NEEDS_REVIEW', 'OWASP/SOLID review needs a human code pass.', 'Use Foundry output as a checklist, not proof of code quality.'));
  }

  if (domainId === 'compliance') {
    add(context.planHasSecurity
      ? finding('security-compliance', 'PASS', 'Security/compliance intent is present in planning evidence.', 'Keep secrets backend-only and audit decisions.')
      : finding('security-compliance', 'WARNING', 'Security/compliance notes are not explicit.', 'Add privacy, audit, safe error, and secret-handling notes.'));
    add(context.pendingDependencies.length
      ? finding('dependency-policy', 'APPROVAL_REQUIRED', `${context.pendingDependencies.length} dependency request(s) are pending.`, 'Approve or reject each dependency through the dependency approval path.')
      : finding('dependency-policy', 'PASS', 'No pending dependency approvals are recorded.', 'Continue to keep package installs separate from write approval.'));
  }

  if (domainId === 'ci-cd') {
    add(context.testFrameworks.length
      ? finding('test-tooling', 'PASS', `Detected test/build signals: ${context.testFrameworks.join(', ')}.`, 'Use existing scripts instead of adding tooling.')
      : finding('test-tooling', 'WARNING', 'No test framework signal is recorded.', 'Confirm build/test commands before PR readiness.'));
    add(context.hasImplementationEvidence
      ? finding('command-evidence', 'PASS', 'Implementation evidence can carry command results.', 'Record npm build/test command outputs.')
      : finding('command-evidence', 'WARNING', 'No command evidence is recorded yet.', 'Capture commands after implementation.'));
  }

  if (domainId === 'qa') {
    add(context.planHasTesting || context.testPlans.length
      ? finding('test-plan', 'PASS', 'Testing evidence is present in plan or test plan records.', 'Include positive, negative, boundary, error, and accessibility cases.')
      : finding('test-plan', 'WARNING', 'Test plan evidence is missing.', 'Add a test plan before implementation.'));
    add(context.failedImplementationTests.length
      ? finding('failed-tests', 'BLOCKER', `${context.failedImplementationTests.length} failed test(s) are recorded.`, 'Fix failures or record accepted implementation risk before PR readiness.')
      : finding('failed-tests', 'PASS', 'No failed implementation tests are recorded.', 'Keep this updated after implementation.'));
  }

  if (domainId === 'operations') {
    add(context.hasPrPack
      ? finding('pr-readiness', 'PASS', 'PR readiness evidence exists.', 'Confirm rollback and reviewer notes are complete.')
      : finding('pr-readiness', 'WARNING', 'PR readiness pack is not generated yet.', 'Prepare PR pack after implementation evidence and post-check.'));
    add(finding('runbook', 'NEEDS_REVIEW', 'Operational runbook and support expectations need review for real projects.', 'Document startup, stop, monitoring, fallback, and restore steps.'));
  }

  return findings;
}

function buildDomainRisks(domainId, context) {
  const risks = [];
  if (!context.hasRepoAnalysis) risks.push('Planning may miss repo conventions until read-only repo analysis is captured.');
  if (!context.hasStandardsCheck) risks.push('Standards impact is not yet evidenced.');
  if (context.pendingDependencies.length) risks.push('Pending dependency requests can block install commands and PR readiness.');
  if (context.openReviewBlockers.length) risks.push('Open review blockers must be resolved, accepted as risk, or reworked.');
  if (domainId === 'ux') risks.push('Visual UX and keyboard behavior still require human/browser verification.');
  if (domainId === 'compliance') risks.push('Compliance review is advisory and should not be treated as legal certification.');
  if (domainId === 'operations') risks.push('Operational readiness can be under-scoped if rollback, monitoring, and support ownership are omitted.');
  return risks.length ? risks : ['No domain-specific high risk detected from current evidence.'];
}

function buildDomainRecommendations(domain, context) {
  const recommendations = [
    `Keep ${domain.label} output review-only until a human accepts or reworks it.`,
    'Attach this Foundry output to Artifacts before PR readiness review.'
  ];
  if (!context.hasPlan) recommendations.push('Draft implementation plan before using Foundry results for delegation.');
  if (!context.hasStandardsCheck) recommendations.push('Run standards check after updating the plan.');
  if (context.standardsBlockers.length) recommendations.push('Resolve standards blockers or capture controlled override where allowed.');
  return recommendations;
}

function buildDomainMissingInformation(domainId, context) {
  const missing = [];
  if (!context.hasRequirement) missing.push('Requirement or Jira detail.');
  if (!context.hasRepoAnalysis) missing.push('Read-only repository analysis.');
  if (!context.hasDesign) missing.push('Technical design evidence.');
  if (!context.hasPlan) missing.push('Implementation plan evidence.');
  if (domainId === 'qa' && !context.testPlans.length) missing.push('Structured test plan.');
  if (domainId === 'ci-cd' && !context.testFrameworks.length) missing.push('Confirmed build/test commands.');
  if (domainId === 'operations' && !context.hasPrPack) missing.push('Rollback and PR readiness evidence.');
  return missing.length ? missing : ['No critical missing information detected for this specialist review.'];
}

function buildRequiredApprovals(context) {
  const approvals = [];
  if (!context.hasWriteApproval) approvals.push('Write scope approval before delegate/write actions.');
  if (context.pendingDependencies.length) approvals.push('Dependency-specific approval before install commands.');
  if (context.standardsBlockers.length) approvals.push('Standards blocker resolution or controlled override where allowed.');
  if (context.openReviewBlockers.length) approvals.push('Review blocker resolution, accepted risk, or rework.');
  return approvals.length ? approvals : ['Human review of AI-generated suggestion before using it in a PR-ready package.'];
}
