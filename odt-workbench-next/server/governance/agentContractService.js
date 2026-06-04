export function buildAgentContract({ assignment, mode = 'read-only', executionAgent = 'codex', repoAnalysis = {}, technicalDesign = {}, implementationPlan = {}, standards = {}, approvedDependencies = [], pendingDependencies = [] } = {}) {
  const writeApproved = mode === 'write-approved';
  const dependencyInstallsApproved = writeApproved && approvedDependencies.length > 0;
  return {
    assignmentId: assignment?.id || 'assignment-local-mvp',
    executionAgent,
    mode: writeApproved ? 'write-approved' : 'read-only',
    repoPath: assignment?.repoPath || '',
    baseBranch: assignment?.baseBranch || '',
    requirement: {
      title: assignment?.title || '',
      content: assignment?.requirement || ''
    },
    repoAnalysis,
    technicalDesign,
    implementationPlan,
    standards: {
      standardsVersion: standards.standardsVersion || 'odt-baseline-1.0',
      accessibilityRequired: true,
      securityRequired: true,
      dependencyApprovalRequired: true,
      testingRequired: true,
      latestStandardsCheckId: standards.latestStandardsCheckId || '',
      blockerOverrideCaptured: Boolean(standards.blockerOverrideCaptured),
      unresolvedBlockers: standards.unresolvedBlockers || [],
      openReviewBlockers: standards.openReviewBlockers || [],
      approvedDependencies,
      pendingDependencies,
      dependencyInstallPolicy: dependencyInstallsApproved
        ? 'Only approved dependency requests listed in approvedDependencies may be installed.'
        : 'Dependency installs are blocked until a package-specific approval is captured.'
    },
    allowedActions: {
      readFiles: true,
      writeFiles: writeApproved,
      runTests: writeApproved,
      installDependencies: dependencyInstallsApproved,
      createBranch: false,
      raisePr: false,
      updateExternalSystems: false,
      destructiveActions: false
    },
    requiredReturnEvidence: {
      changedFiles: true,
      commandsRun: true,
      testOutcomes: true,
      implementationSummary: true,
      skippedChecksOrKnownRisks: true,
      recordInWorkbenchEndpoint: '/api/implementation/evidence'
    }
  };
}
