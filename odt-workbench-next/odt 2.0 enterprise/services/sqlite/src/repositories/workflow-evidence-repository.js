const REQUIRED_STATEMENTS = [
  'selectStandardsChecksByAssignment',
  'selectStandardsFindingsByAssignment',
  'selectAgentEventsByAssignment',
  'selectRequirementsByAssignment',
  'selectRepoAnalysisByAssignment',
  'selectTechnicalDesignsByAssignment',
  'selectImplementationPlansByAssignment',
  'selectApprovalsByAssignment',
  'selectDependencyRequestsByAssignment',
  'selectReviewCommentsByAssignment',
  'selectTestPlansByAssignment',
  'selectImplementationEvidenceByAssignment',
  'selectAiWorkAuditPacksByAssignment',
  'selectPrReportsByAssignment',
  'selectIntakeAssetsByAssignment',
  'selectAgentFoundryRunsByAssignment',
  'selectAgentWorkerRunsByAssignment',
  'selectAgentRelayItemsByAssignment'
];

function defaultParseJsonValue(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function requireStatement(statements = {}, name = '') {
  const statement = statements[name];
  if (!statement || typeof statement.all !== 'function') {
    throw new TypeError(`workflow evidence repository requires statements.${name}.all(...)`);
  }
  return statement;
}

export function createWorkflowEvidenceRepository({
  statements,
  getAssignment,
  parseJsonValue = defaultParseJsonValue,
  parseAgentWorkerRun = (row) => row,
  parseAgentRelayItem = (row) => row,
  parseIntakeAssetRow = (row) => row
} = {}) {
  if (!statements) {
    throw new TypeError('createWorkflowEvidenceRepository requires statements');
  }
  if (typeof getAssignment !== 'function') {
    throw new TypeError('createWorkflowEvidenceRepository requires getAssignment');
  }

  REQUIRED_STATEMENTS.forEach((name) => requireStatement(statements, name));

  const attachJson = (row, key) => ({ ...row, [key]: parseJsonValue(row[key], {}) });
  const parseImplementationEvidence = (row) => ({
    ...row,
    changedFiles: parseJsonValue(row.changedFilesJson, []),
    commands: parseJsonValue(row.commandsJson, []),
    tests: parseJsonValue(row.testsJson, [])
  });
  const parseAgentFoundryRun = (row) => ({
    ...row,
    inputSources: parseJsonValue(row.inputSourcesJson, []),
    output: parseJsonValue(row.outputJson, {})
  });
  const parseAiWorkAuditPack = (row) => ({
    ...row,
    packJson: parseJsonValue(row.packJson, {})
  });

  return {
    getAssignmentEvidence(assignmentId = 'assignment-local-mvp') {
      const checks = statements.selectStandardsChecksByAssignment.all(assignmentId).map((check) => ({
        ...check,
        summary: parseJsonValue(check.summary, {}),
        artifact: parseJsonValue(check.artifact, {})
      }));
      const findings = statements.selectStandardsFindingsByAssignment.all(assignmentId);
      const agentEvents = statements.selectAgentEventsByAssignment.all(assignmentId).map((row) => ({
        ...row,
        detailJson: parseJsonValue(row.detail, {})
      }));

      return {
        assignment: getAssignment(assignmentId),
        requirements: statements.selectRequirementsByAssignment.all(assignmentId),
        repoAnalysis: statements.selectRepoAnalysisByAssignment.all(assignmentId).map((row) => attachJson(row, 'analysisJson')),
        technicalDesigns: statements.selectTechnicalDesignsByAssignment.all(assignmentId).map((row) => attachJson(row, 'designJson')),
        implementationPlans: statements.selectImplementationPlansByAssignment.all(assignmentId).map((row) => attachJson(row, 'planJson')),
        standardsChecks: checks.map((check) => ({
          ...check,
          findings: findings.filter((finding) => finding.standardsCheckId === check.id)
        })),
        standardsFindings: findings,
        approvals: statements.selectApprovalsByAssignment.all(assignmentId),
        dependencyRequests: statements.selectDependencyRequestsByAssignment.all(assignmentId),
        reviewComments: statements.selectReviewCommentsByAssignment.all(assignmentId),
        agentEvents,
        testPlans: statements.selectTestPlansByAssignment.all(assignmentId).map((row) => attachJson(row, 'planJson')),
        implementationEvidence: statements.selectImplementationEvidenceByAssignment.all(assignmentId).map(parseImplementationEvidence),
        aiWorkAuditPacks: statements.selectAiWorkAuditPacksByAssignment.all(assignmentId).map(parseAiWorkAuditPack),
        prReadinessReports: statements.selectPrReportsByAssignment.all(assignmentId).map((row) => attachJson(row, 'reportJson')),
        intakeAssets: statements.selectIntakeAssetsByAssignment.all(assignmentId).map(parseIntakeAssetRow),
        agentFoundryRuns: statements.selectAgentFoundryRunsByAssignment.all(assignmentId).map(parseAgentFoundryRun),
        agentWorkerRuns: statements.selectAgentWorkerRunsByAssignment.all(assignmentId).map(parseAgentWorkerRun),
        agentRelayItems: statements.selectAgentRelayItemsByAssignment.all(assignmentId).map(parseAgentRelayItem)
      };
    }
  };
}
