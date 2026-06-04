import { loadStandardsRegistry } from './standardsRegistry.js';

const BLOCKER = 'BLOCKER';
const WARNING = 'WARNING';
const PASS = 'PASS';
const NEEDS_REVIEW = 'NEEDS_REVIEW';
const APPROVAL_REQUIRED = 'APPROVAL_REQUIRED';

export function runStandardsReview({ phase = 'pre-implementation', artifact = {}, assignment = {} } = {}) {
  const registry = loadStandardsRegistry();
  const text = normalizeArtifactText(artifact);
  const findings = [
    ...checkRequirementAndRepo(text, phase),
    ...checkAccessibility(text),
    ...checkSecurity(text),
    ...checkDependencyPolicy(text),
    ...checkTesting(text),
    ...checkUx(text),
    ...checkPerformanceMaintainability(text),
    ...checkImplementationEvidence(text, phase),
    ...checkApprovalReadiness(text, phase, assignment)
  ];
  const status = summarizeFindings(findings);
  return {
    standardsVersion: registry.standardsVersion,
    phase,
    status,
    summary: summarizeByStatus(findings),
    findings,
    registry
  };
}

export function summarizeFindings(findings) {
  if (findings.some((finding) => finding.status === BLOCKER)) return BLOCKER;
  if (findings.some((finding) => finding.status === APPROVAL_REQUIRED)) return APPROVAL_REQUIRED;
  if (findings.some((finding) => finding.status === NEEDS_REVIEW)) return NEEDS_REVIEW;
  if (findings.some((finding) => finding.status === WARNING)) return WARNING;
  return PASS;
}

function normalizeArtifactText(artifact) {
  if (typeof artifact === 'string') return artifact.toLowerCase();
  return JSON.stringify(artifact || {}).toLowerCase();
}

function finding(category, status, message, recommendation) {
  return { category, status, message, recommendation };
}

function checkRequirementAndRepo(text, phase) {
  return [
    hasAny(text, ['requirement', 'jira', 'user story', 'acceptance criteria'])
      ? finding('requirement', PASS, 'Requirement context is present.', 'Keep assumptions and open questions visible.')
      : finding('requirement', WARNING, 'Requirement or Jira context is missing or thin.', 'Capture requirement/Jira details before implementation planning.'),
    hasAny(text, ['repo', 'repository', 'codebase', 'architecture', 'patterns'])
      ? finding('repo-analysis', PASS, 'Repo/codebase analysis is represented.', 'Keep detected stack, patterns, and impacted files attached.')
      : finding('repo-analysis', phase === 'post-implementation' ? BLOCKER : WARNING, 'Repo analysis is missing.', 'Analyze repository structure, technologies, and existing patterns before write approval.'),
    hasAny(text, ['impacted file', 'files to change', 'files likely impacted'])
      ? finding('impact-analysis', PASS, 'Impacted files are represented.', 'Explain why each impacted area matters.')
      : finding('impact-analysis', WARNING, 'Impacted files are not listed.', 'Add likely files to change and files to review only.')
  ];
}

function checkAccessibility(text) {
  return [
    hasAny(text, ['accessibility', 'wcag', 'vpat', 'section 508'])
      ? finding('accessibility', PASS, 'Accessibility/VPAT/WCAG/Section 508 is considered.', 'Keep explicit notes in design and PR summary.')
      : finding('accessibility', WARNING, 'Accessibility/VPAT/WCAG/Section 508 considerations are missing.', 'Add accessibility impact, keyboard, focus, labels, contrast, and VPAT/WCAG notes.'),
    hasAny(text, ['keyboard', 'focus', 'label', 'contrast'])
      ? finding('accessibility-detail', PASS, 'Practical accessibility details are present.', 'Validate keyboard and focus behavior during review.')
      : finding('accessibility-detail', WARNING, 'Practical accessibility details are incomplete.', 'Include keyboard navigation, visible focus, labels, and non-color-only status checks.')
  ];
}

function checkSecurity(text) {
  const secretTerms = ['api key', 'private key', 'bearer token', 'secret in react', 'oci credential in react'];
  return [
    hasAny(text, ['security', 'compliance', 'secrets', 'validation', 'safe error'])
      ? finding('security', PASS, 'Security/compliance is considered.', 'Keep frontend secrets blocked and backend validation explicit.')
      : finding('security', WARNING, 'Security/compliance considerations are missing.', 'Add no-frontend-secrets, validation, safe errors, auth/role, and audit notes.'),
    hasAny(text, secretTerms)
      ? finding('frontend-secrets', BLOCKER, 'Possible frontend secret or credential exposure is mentioned.', 'Move credentials/config to backend and expose only safe status.')
      : finding('frontend-secrets', PASS, 'No frontend secret exposure detected in the plan text.', 'Continue to verify React bundle/settings responses before PR.')
  ];
}

function checkDependencyPolicy(text) {
  const explicitNoNewDependency = hasAny(text, ['no new dependency', 'no new dependencies', 'dependency-free', 'without new package', 'no package install']);
  if (explicitNoNewDependency) {
    return [finding('dependency', PASS, 'No new dependency request detected.', 'Keep dependency-free implementation unless approval is captured.')];
  }
  const packageIntent = hasAny(text, ['npm install', 'pnpm add', 'yarn add', 'new dependency', 'install package', 'package:']);
  if (!packageIntent) {
    return [finding('dependency', PASS, 'No new dependency request detected.', 'Keep dependency-free implementation unless approval is captured.')];
  }
  const hasApproval = hasAny(text, ['approved dependency', 'developer approved', 'approval captured']);
  const hasLicense = hasAny(text, ['mit', 'apache-2.0', 'apache 2.0', 'bsd']);
  return [
    hasApproval
      ? finding('dependency', PASS, 'Dependency approval appears to be captured.', 'Record package, version, license, reason, and approver.')
      : finding('dependency', BLOCKER, 'New package installation requires explicit developer approval.', 'Approve or reject dependency request before implementation.'),
    hasLicense
      ? finding('dependency-license', PASS, 'Preferred open-source license is mentioned.', 'Verify actual package and transitive license metadata.')
      : finding('dependency-license', APPROVAL_REQUIRED, 'Dependency license evidence is missing.', 'Record license, version, alternatives, and approval decision.')
  ];
}

function checkTesting(text) {
  return [
    hasAny(text, ['test', 'unit', 'integration', 'coverage'])
      ? finding('testing', PASS, 'Testing is considered.', 'Include commands and evidence after execution.')
      : finding('testing', WARNING, 'Test plan is missing.', 'Add unit/API/component/accessibility/security tests as appropriate.'),
    hasAny(text, ['branch coverage', 'statement coverage', 'function coverage', 'line coverage', 'negative', 'boundary', 'error scenario'])
      ? finding('coverage', PASS, 'Coverage/scenario types are represented.', 'Map coverage to repo test framework where possible.')
      : finding('coverage', WARNING, 'Coverage/scenario detail is incomplete.', 'Include statement, branch, function, line, positive, negative, boundary, and error scenarios.')
  ];
}

function checkUx(text) {
  return [
    hasAny(text, ['redwood', 'oracle ux', 'loading', 'empty state', 'error state', 'success state'])
      ? finding('ux', PASS, 'UX states and Oracle-style consistency are considered.', 'Keep page actions clear and AI output reviewable.')
      : finding('ux', WARNING, 'UX states or Redwood-like consistency are missing.', 'Add loading, empty, error, success, status language, and human approval states.')
  ];
}

function checkPerformanceMaintainability(text) {
  return [
    hasAny(text, ['performance', 'timeout', 'pagination', 'debounce', 'latency'])
      ? finding('performance', PASS, 'Performance is considered.', 'Keep request limits, timeouts, and large-data behavior explicit.')
      : finding('performance', WARNING, 'Performance considerations are missing.', 'Add latency, timeout, large input, pagination/filtering, and retry/fallback notes.'),
    hasAny(text, ['maintainable', 'reusable', 'naming', 'existing pattern', 'readable'])
      ? finding('maintainability', PASS, 'Maintainability/reuse is considered.', 'Follow repo conventions before adding abstractions.')
      : finding('maintainability', WARNING, 'Maintainability/reuse guidance is missing.', 'Add naming, readability, reuse, and existing-pattern guidance.')
  ];
}

function checkImplementationEvidence(text, phase) {
  if (phase !== 'post-implementation') return [];
  return [
    hasAny(text, ['changed files', 'modified files', 'files changed'])
      ? finding('implementation-evidence', PASS, 'Changed-file evidence is represented.', 'Keep file-level explanations attached to PR readiness.')
      : finding('implementation-evidence', WARNING, 'Changed-file evidence is missing.', 'Record files changed and why they changed before PR readiness.'),
    hasAny(text, ['commands run', 'command evidence', 'npm run', 'test command', 'build command'])
      ? finding('command-evidence', PASS, 'Command/build/test evidence is represented.', 'Keep exact commands and outcomes attached.')
      : finding('command-evidence', WARNING, 'Command evidence is missing.', 'Record build, lint, test, or smoke commands and outcomes.'),
    hasAny(text, ['test evidence', 'testing performed', 'passed', 'failed', 'not_run'])
      ? finding('test-evidence', PASS, 'Test outcome evidence is represented.', 'Failed or skipped tests need a fix or accepted-risk note.')
      : finding('test-evidence', WARNING, 'Test outcome evidence is missing.', 'Record tests run, tests not run, and rationale.')
  ];
}

function checkApprovalReadiness(text, phase, assignment) {
  const hasApproval = Boolean(assignment.writeApproved) || hasAny(text, ['approved_to_write', 'approve for write', 'write scope approved']);
  if (phase === 'post-implementation') {
    return [
      hasAny(text, ['pr summary', 'rollback', 'testing performed', 'accessibility notes', 'security notes'])
        ? finding('pr-readiness', PASS, 'PR readiness evidence is represented.', 'Attach final PR summary and evidence to the assignment.')
        : finding('pr-readiness', WARNING, 'PR readiness evidence is incomplete.', 'Add PR summary, tests, accessibility/security notes, risk, and rollback.')
    ];
  }
  return [
    hasApproval
      ? finding('approval', PASS, 'Write approval appears to be represented.', 'Ensure approval event is stored before execution.')
      : finding('approval', APPROVAL_REQUIRED, 'Write action must remain blocked until explicit human approval.', 'Capture approval before implementation or external write actions.')
  ];
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function summarizeByStatus(findings) {
  return findings.reduce((summary, finding) => {
    summary[finding.status] = (summary[finding.status] || 0) + 1;
    return summary;
  }, {});
}
