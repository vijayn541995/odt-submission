import {
  createAiWorkAuditPackRepository,
  createApprovalEventRepository,
  createAgentEventRepository,
  createAgentFoundryRunRepository,
  createAgentRelayRepository,
  createAgentWorkerRunRepository,
  createAiUsageRepository,
  createAssignmentRepository,
  createChatMessageRepository,
  createConnectorEventRepository,
  createDependencyRequestRepository,
  createImplementationPlanRepository,
  createImplementationEvidenceRepository,
  createIntakeAssetRepository,
  createPrReadinessReportRepository,
  createProjectContractRepository,
  createPromptTemplateRepository,
  createRepoAnalysisRepository,
  createRequirementRepository,
  createReviewCommentRepository,
  createRunEventRepository,
  createSettingsRepository,
  createStandardsCheckRepository,
  createTechnicalDesignRepository,
  createTestPlanRepository,
  createWorkflowEvidenceRepository
} from '../../../services/sqlite/src/index.js';

const failures = [];

function statement(rows = []) {
  return {
    all() {
      return rows;
    }
  };
}

function createAgentEventStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertAgentEvent: {
        run(id, assignmentId, agentId, eventType, status, detail, createdAt) {
          rows.push({
            id,
            assignmentId,
            agentId,
            eventType,
            status,
            detail,
            createdAt
          });
        }
      },
      selectAgentEventsByAssignment: {
        all(assignmentId) {
          return rows
            .filter((row) => row.assignmentId === assignmentId)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
        }
      }
    }
  };
}

function createRunEventStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertRunEvent: {
        run(id, runId, assignmentId, eventType, status, detail, createdAt) {
          rows.push({
            id,
            runId,
            assignmentId,
            eventType,
            status,
            detail,
            createdAt
          });
        }
      },
      selectRunEvents: {
        all() {
          return [...rows].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 500);
        }
      },
      selectRunEventsByRun: {
        all(runId) {
          return rows
            .filter((row) => row.runId === runId)
            .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
        }
      }
    }
  };
}

function createAiUsageStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertAiUsage: {
        run(
          id,
          requestId,
          runId,
          sessionId,
          userId,
          requestType,
          provider,
          model,
          inputChars,
          promptTokens,
          completionTokens,
          totalTokens,
          latencyMs,
          status,
          error,
          fallbackUsed,
          sourcesJson,
          createdAt
        ) {
          rows.push({
            id,
            requestId,
            runId,
            sessionId,
            userId,
            requestType,
            provider,
            model,
            inputChars,
            promptTokens,
            completionTokens,
            totalTokens,
            latencyMs,
            status,
            error,
            fallbackUsed,
            sourcesJson,
            createdAt
          });
        }
      },
      selectAiUsage: {
        all() {
          return [...rows].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 200);
        }
      }
    }
  };
}

function createChatMessageStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertChat: {
        run(id, assignmentId, sessionId, role, content, provider, model, createdAt) {
          rows.push({
            id,
            assignmentId,
            sessionId,
            role,
            content,
            provider,
            model,
            createdAt
          });
        }
      },
      selectChat: {
        all() {
          return [...rows].sort((left, right) => left.createdAt.localeCompare(right.createdAt)).slice(0, 200);
        }
      }
    }
  };
}

function createConnectorEventStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertConnectorEvent: {
        run(id, connectorId, action, mode, status, detail, createdAt) {
          rows.push({
            id,
            connectorId,
            action,
            mode,
            status,
            detail,
            createdAt
          });
        }
      },
      selectConnectorEvents: {
        all() {
          return [...rows].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 100);
        }
      }
    }
  };
}

function createAssignmentStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertAssignment: {
        run(id, title, requirement, owner, status, priority, repoPath, createdAt, updatedAt) {
          rows.push({
            id,
            title,
            requirement,
            owner,
            status,
            priority,
            repoPath,
            createdAt,
            updatedAt
          });
        }
      },
      updateAssignmentContext: {
        run(title, requirement, repoPath, status, updatedAt, id) {
          const row = rows.find((item) => item.id === id);
          if (!row) return;
          Object.assign(row, {
            title: title ?? row.title,
            requirement: requirement ?? row.requirement,
            repoPath: repoPath ?? row.repoPath,
            status: status ?? row.status,
            updatedAt
          });
        }
      },
      selectAssignments: {
        all() {
          return [...rows].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 50);
        }
      },
      selectAssignmentById: {
        get(id) {
          return rows.find((row) => row.id === id) || null;
        }
      }
    }
  };
}

function createPromptTemplateStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertPromptTemplate: {
        run(id, name, requestType, version, template, active, createdAt, updatedAt) {
          if (rows.some((row) => row.id === id)) return;
          rows.push({
            id,
            name,
            requestType,
            version,
            template,
            active,
            createdAt,
            updatedAt
          });
        }
      },
      selectPromptTemplates: {
        all() {
          return [...rows].sort((left, right) => {
            const requestCompare = left.requestType.localeCompare(right.requestType);
            if (requestCompare) return requestCompare;
            return right.version.localeCompare(left.version);
          });
        }
      }
    }
  };
}

function createApprovalEventStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertApprovalEvent: {
        run(id, assignmentId, approvalType, status, approvedBy, approvedAt, notes) {
          rows.push({
            id,
            assignmentId,
            approvalType,
            status,
            approvedBy,
            approvedAt,
            notes
          });
        }
      },
      selectApprovalsByAssignment: {
        all(assignmentId) {
          return rows.filter((row) => row.assignmentId === assignmentId);
        }
      }
    }
  };
}

function createAiWorkAuditPackStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertAiWorkAuditPack: {
        run(id, assignmentId, stage, status, packJson, createdAt) {
          rows.push({
            id,
            assignmentId,
            stage,
            status,
            packJson,
            createdAt
          });
        }
      },
      selectAiWorkAuditPacksByAssignment: {
        all(assignmentId) {
          return rows
            .filter((row) => row.assignmentId === assignmentId)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
        }
      },
      selectAiWorkAuditPackById: {
        get(id) {
          return rows.find((row) => row.id === id) || null;
        }
      }
    }
  };
}

function createDependencyRequestStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertDependencyRequest: {
        run(
          id,
          assignmentId,
          packageName,
          version,
          license,
          reason,
          alternatives,
          status,
          requestedBy,
          approvedBy,
          requestedAt,
          decidedAt,
          notes
        ) {
          rows.push({
            id,
            assignmentId,
            packageName,
            version,
            license,
            reason,
            alternatives,
            status,
            requestedBy,
            approvedBy,
            requestedAt,
            decidedAt,
            notes
          });
        }
      },
      updateDependencyDecision: {
        run(status, approvedBy, decidedAt, notes, id) {
          const row = rows.find((item) => item.id === id);
          if (!row) return;
          Object.assign(row, { status, approvedBy, decidedAt, notes });
        }
      },
      selectDependencyRequestById: {
        get(id) {
          return rows.find((row) => row.id === id) || null;
        }
      },
      selectDependencyRequestsByAssignment: {
        all(assignmentId) {
          return rows.filter((row) => row.assignmentId === assignmentId);
        }
      }
    }
  };
}

function createRequirementStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertRequirement: {
        run(id, assignmentId, sourceType, rawText, summary, status, createdAt, updatedAt) {
          rows.push({
            id,
            assignmentId,
            sourceType,
            rawText,
            summary,
            status,
            createdAt,
            updatedAt
          });
        }
      },
      selectRequirementsByAssignment: {
        all(assignmentId) {
          return rows
            .filter((row) => row.assignmentId === assignmentId)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
        }
      }
    }
  };
}

function createRepoAnalysisStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertRepoAnalysis: {
        run(id, assignmentId, repoPath, analysisJson, status, createdAt, updatedAt) {
          rows.push({
            id,
            assignmentId,
            repoPath,
            analysisJson,
            status,
            createdAt,
            updatedAt
          });
        }
      },
      selectRepoAnalysisByAssignment: {
        all(assignmentId) {
          return rows
            .filter((row) => row.assignmentId === assignmentId)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
        }
      }
    }
  };
}

function createTechnicalDesignStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertTechnicalDesign: {
        run(id, assignmentId, title, designJson, status, createdAt, updatedAt) {
          rows.push({
            id,
            assignmentId,
            title,
            designJson,
            status,
            createdAt,
            updatedAt
          });
        }
      },
      selectTechnicalDesignsByAssignment: {
        all(assignmentId) {
          return rows
            .filter((row) => row.assignmentId === assignmentId)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
        }
      }
    }
  };
}

function createImplementationPlanStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertImplementationPlan: {
        run(id, assignmentId, title, planJson, status, createdAt, updatedAt) {
          rows.push({
            id,
            assignmentId,
            title,
            planJson,
            status,
            createdAt,
            updatedAt
          });
        }
      },
      selectImplementationPlansByAssignment: {
        all(assignmentId) {
          return rows
            .filter((row) => row.assignmentId === assignmentId)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
        }
      }
    }
  };
}

function createTestPlanStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertTestPlan: {
        run(id, assignmentId, phase, planJson, status, createdAt, updatedAt) {
          rows.push({
            id,
            assignmentId,
            phase,
            planJson,
            status,
            createdAt,
            updatedAt
          });
        }
      },
      selectTestPlansByAssignment: {
        all(assignmentId) {
          return rows
            .filter((row) => row.assignmentId === assignmentId)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
        }
      }
    }
  };
}

function createIntakeAssetStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertIntakeAsset: {
        run(
          id,
          assignmentId,
          originalName,
          storedName,
          storedPath,
          mimeType,
          fileType,
          bytes,
          sourceKind,
          analysisJson,
          status,
          createdAt
        ) {
          rows.push({
            id,
            assignmentId,
            originalName,
            storedName,
            storedPath,
            mimeType,
            fileType,
            bytes,
            sourceKind,
            analysisJson,
            status,
            createdAt
          });
        }
      },
      selectIntakeAssetById: {
        get(assetId) {
          return rows.find((row) => row.id === assetId) || null;
        }
      },
      selectIntakeAssetsByAssignment: {
        all(assignmentId) {
          return rows
            .filter((row) => row.assignmentId === assignmentId)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
        }
      },
      updateIntakeAssetAnalysis: {
        run(analysisJson, assetId) {
          const row = rows.find((item) => item.id === assetId);
          if (!row) return;
          row.analysisJson = analysisJson;
        }
      }
    }
  };
}

function createAgentFoundryRunStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertAgentFoundryRun: {
        run(
          id,
          runId,
          assignmentId,
          phase,
          domainId,
          domainLabel,
          inputSourcesJson,
          outputJson,
          status,
          provider,
          model,
          createdAt
        ) {
          rows.push({
            id,
            runId,
            assignmentId,
            phase,
            domainId,
            domainLabel,
            inputSourcesJson,
            outputJson,
            status,
            provider,
            model,
            createdAt
          });
        }
      },
      selectAgentFoundryRunsByAssignment: {
        all(assignmentId) {
          return rows
            .filter((row) => row.assignmentId === assignmentId)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
        }
      }
    }
  };
}

function createSettingsStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      upsertSetting: {
        run(key, value, updatedAt) {
          const existing = rows.find((row) => row.key === key);
          if (existing) {
            Object.assign(existing, { value, updatedAt });
            return;
          }
          rows.push({ key, value, updatedAt });
        }
      },
      selectSettings: {
        all() {
          return [...rows].sort((left, right) => left.key.localeCompare(right.key));
        }
      }
    }
  };
}

function createProjectContractStatementFixture() {
  const rows = [];
  const selectRow = (id) => rows.find((row) => row.id === id) || null;
  const sortRows = (items) => [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return {
    rows,
    statements: {
      upsertProjectContract: {
        run(
          id,
          assignmentId,
          projectName,
          ownerTeam,
          repoPath,
          baseBranch,
          riskProfile,
          installCommand,
          buildCommand,
          testCommand,
          runUiCommand,
          runApiCommand,
          deployCommand,
          knownIssuesJson,
          blockedCommandsJson,
          approvalNotesJson,
          evidenceNotesJson,
          status,
          createdAt,
          updatedAt
        ) {
          const nextRow = {
            id,
            assignmentId,
            projectName,
            ownerTeam,
            repoPath,
            baseBranch,
            riskProfile,
            installCommand,
            buildCommand,
            testCommand,
            runUiCommand,
            runApiCommand,
            deployCommand,
            knownIssuesJson,
            blockedCommandsJson,
            approvalNotesJson,
            evidenceNotesJson,
            status,
            createdAt,
            updatedAt
          };
          const existingIndex = rows.findIndex((row) => row.id === id);
          if (existingIndex >= 0) {
            rows[existingIndex] = {
              ...rows[existingIndex],
              ...nextRow,
              createdAt: rows[existingIndex].createdAt
            };
            return;
          }
          rows.push(nextRow);
        }
      },
      selectProjectContracts: {
        all() {
          return sortRows(rows);
        }
      },
      selectProjectContractsByAssignment: {
        all(assignmentId) {
          return sortRows(rows.filter((row) => row.assignmentId === assignmentId || row.assignmentId === ''));
        }
      },
      selectProjectContractById: {
        get(id) {
          return selectRow(id);
        }
      }
    }
  };
}

function createRelayStatementFixture() {
  const rows = [];
  const parseRow = (row) => row || null;
  return {
    rows,
    statements: {
      insertAgentRelayItem: {
        run(
          id,
          assignmentId,
          sourceWorkerRunId,
          sourceWorkerRole,
          sourceWorkerRoleLabel,
          targetWorkerRole,
          targetLane,
          itemType,
          status,
          severity,
          title,
          message,
          contextJson,
          decisionJson,
          uniqueKey,
          createdBy,
          createdAt,
          updatedAt,
          resolvedAt
        ) {
          if (rows.some((row) => row.uniqueKey === uniqueKey)) return;
          rows.push({
            id,
            assignmentId,
            sourceWorkerRunId,
            sourceWorkerRole,
            sourceWorkerRoleLabel,
            targetWorkerRole,
            targetLane,
            itemType,
            status,
            severity,
            title,
            message,
            contextJson,
            decisionJson,
            uniqueKey,
            createdBy,
            createdAt,
            updatedAt,
            resolvedAt
          });
        }
      },
      selectAgentRelayItemsByAssignment: {
        all(assignmentId) {
          return rows.filter((row) => row.assignmentId === assignmentId);
        }
      },
      selectAgentRelayItemById: {
        get(relayItemId) {
          return parseRow(rows.find((row) => row.id === relayItemId));
        }
      },
      updateAgentRelayItem: {
        run(targetWorkerRole, targetLane, status, severity, decisionJson, updatedAt, resolvedAt, relayItemId) {
          const row = rows.find((item) => item.id === relayItemId);
          if (!row) return;
          Object.assign(row, {
            targetWorkerRole,
            targetLane,
            status,
            severity,
            decisionJson,
            updatedAt,
            resolvedAt
          });
        }
      }
    }
  };
}

function createWorkerRunStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      upsertAgentWorkerRun: {
        run(
          id,
          assignmentId,
          runId,
          workerRole,
          workerRoleLabel,
          executionAgent,
          mode,
          sandboxMode,
          status,
          sequenceIndex,
          launchMode,
          bundleDir,
          handoffFile,
          promptFile,
          scriptFile,
          responseFile,
          logFile,
          statusFile,
          manualCommand,
          outputJson,
          questionsJson,
          createdAt,
          updatedAt,
          completedAt
        ) {
          const nextRow = {
            id,
            assignmentId,
            runId,
            workerRole,
            workerRoleLabel,
            executionAgent,
            mode,
            sandboxMode,
            status,
            sequenceIndex,
            launchMode,
            bundleDir,
            handoffFile,
            promptFile,
            scriptFile,
            responseFile,
            logFile,
            statusFile,
            manualCommand,
            outputJson,
            questionsJson,
            createdAt,
            updatedAt,
            completedAt
          };
          const existingIndex = rows.findIndex((row) => row.id === id);
          if (existingIndex >= 0) {
            rows[existingIndex] = {
              ...rows[existingIndex],
              ...nextRow,
              completedAt: completedAt || rows[existingIndex].completedAt
            };
            return;
          }
          rows.push(nextRow);
        }
      },
      updateAgentWorkerOutput: {
        run(status, outputJson, questionsJson, updatedAt, completedAt, workerRunId) {
          const row = rows.find((item) => item.id === workerRunId);
          if (!row) return;
          Object.assign(row, {
            status,
            outputJson,
            questionsJson,
            updatedAt,
            completedAt
          });
        }
      },
      selectAgentWorkerRunsByAssignment: {
        all(assignmentId) {
          return rows.filter((row) => row.assignmentId === assignmentId);
        }
      },
      selectAgentWorkerRunById: {
        get(workerRunId) {
          return rows.find((row) => row.id === workerRunId) || null;
        }
      }
    }
  };
}

function createReviewCommentStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertReviewComment: {
        run(id, assignmentId, targetType, targetId, severity, comment, status, createdBy, createdAt, updatedAt, resolutionNotes) {
          rows.push({
            id,
            assignmentId,
            targetType,
            targetId,
            severity,
            comment,
            status,
            createdBy,
            createdAt,
            updatedAt,
            resolutionNotes
          });
        }
      },
      updateReviewCommentStatus: {
        run(status, updatedAt, resolutionNotes, id) {
          const row = rows.find((item) => item.id === id);
          if (!row) return;
          Object.assign(row, { status, updatedAt, resolutionNotes });
        }
      },
      selectReviewCommentById: {
        get(id) {
          return rows.find((row) => row.id === id) || null;
        }
      },
      selectReviewCommentsByAssignment: {
        all(assignmentId) {
          return rows.filter((row) => row.assignmentId === assignmentId);
        }
      }
    }
  };
}

function createImplementationEvidenceStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertImplementationEvidence: {
        run(
          id,
          assignmentId,
          runId,
          phase,
          changedFilesJson,
          commandsJson,
          testsJson,
          summary,
          status,
          createdBy,
          createdAt,
          updatedAt
        ) {
          rows.push({
            id,
            assignmentId,
            runId,
            phase,
            changedFilesJson,
            commandsJson,
            testsJson,
            summary,
            status,
            createdBy,
            createdAt,
            updatedAt
          });
        }
      },
      selectImplementationEvidenceById: {
        get(id) {
          return rows.find((row) => row.id === id) || null;
        }
      },
      selectImplementationEvidenceByAssignment: {
        all(assignmentId) {
          return rows.filter((row) => row.assignmentId === assignmentId);
        }
      }
    }
  };
}

function createPrReadinessReportStatementFixture() {
  const rows = [];
  return {
    rows,
    statements: {
      insertPrReadinessReport: {
        run(id, assignmentId, title, reportJson, status, createdAt) {
          rows.push({
            id,
            assignmentId,
            title,
            reportJson,
            status,
            createdAt
          });
        }
      },
      selectPrReportsByAssignment: {
        all(assignmentId) {
          return rows.filter((row) => row.assignmentId === assignmentId);
        }
      }
    }
  };
}

function createStandardsCheckStatementFixture() {
  const checkRows = [];
  const findingRows = [];
  return {
    checkRows,
    findingRows,
    statements: {
      insertStandardsCheck: {
        run(id, assignmentId, phase, standardsVersion, status, summary, artifact, createdAt) {
          checkRows.push({
            id,
            assignmentId,
            phase,
            standardsVersion,
            status,
            summary,
            artifact,
            createdAt
          });
        }
      },
      insertStandardsFinding: {
        run(id, standardsCheckId, assignmentId, category, status, message, recommendation, createdAt) {
          findingRows.push({
            id,
            standardsCheckId,
            assignmentId,
            category,
            status,
            message,
            recommendation,
            createdAt
          });
        }
      },
      selectStandardsChecksByAssignment: {
        all(assignmentId) {
          return checkRows.filter((row) => row.assignmentId === assignmentId);
        }
      },
      selectStandardsFindingsByAssignment: {
        all(assignmentId) {
          return findingRows.filter((row) => row.assignmentId === assignmentId);
        }
      }
    }
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`Expected ${label} ${expected}, received ${actual}`);
  }
}

try {
  const statements = {
    selectStandardsChecksByAssignment: statement([
      {
        id: 'std_1',
        assignmentId: 'assignment-repo-test',
        summary: '{"overall":"PASS"}',
        artifact: '{"path":"standards.md"}',
        createdAt: '2026-06-16T10:00:00.000Z'
      }
    ]),
    selectStandardsFindingsByAssignment: statement([
      { id: 'finding_1', standardsCheckId: 'std_1', status: 'INFO' }
    ]),
    selectAgentEventsByAssignment: statement([
      { id: 'event_1', detail: '{"message":"handoff prepared"}' }
    ]),
    selectRequirementsByAssignment: statement([
      { id: 'req_1', rawText: 'Jira: JOURNEY-25366' }
    ]),
    selectRepoAnalysisByAssignment: statement([
      { id: 'repo_1', analysisJson: '{"repoName":"journey-builder-js"}' }
    ]),
    selectTechnicalDesignsByAssignment: statement([
      { id: 'design_1', designJson: '{"title":"Design"}' }
    ]),
    selectImplementationPlansByAssignment: statement([
      { id: 'plan_1', planJson: '{"title":"Plan"}' }
    ]),
    selectApprovalsByAssignment: statement([
      { id: 'approval_1', status: 'approved' }
    ]),
    selectDependencyRequestsByAssignment: statement([]),
    selectReviewCommentsByAssignment: statement([]),
    selectTestPlansByAssignment: statement([
      { id: 'test_plan_1', planJson: '{"commands":["npm test"]}' }
    ]),
    selectImplementationEvidenceByAssignment: statement([
      {
        id: 'impl_1',
        changedFilesJson: '["src/main.jsx"]',
        commandsJson: '[{"command":"npm run build","status":"passed"}]',
        testsJson: '[{"name":"build","status":"passed"}]'
      }
    ]),
    selectPrReportsByAssignment: statement([
      { id: 'pr_1', reportJson: '{"status":"READY"}' }
    ]),
    selectIntakeAssetsByAssignment: statement([
      { id: 'asset_1', analysisJson: '{"summary":"asset"}' }
    ]),
    selectAgentFoundryRunsByAssignment: statement([
      { id: 'foundry_1', inputSourcesJson: '["repo"]', outputJson: '{"summary":"ok"}' }
    ]),
    selectAgentWorkerRunsByAssignment: statement([
      { id: 'worker_1', outputJson: '{"summary":"worker done"}', questionsJson: '[]' }
    ]),
    selectAgentRelayItemsByAssignment: statement([
      { id: 'relay_1', contextJson: '{"source":"review"}', decisionJson: '{}' }
    ]),
    selectAiWorkAuditPacksByAssignment: statement([
      { id: 'audit_1', stage: 'pr-ready', status: 'ready', createdAt: '2026-06-29T10:00:00.000Z', packJson: '{"artifactType":"ai-work-audit-pack","summary":{"workflowState":"PR_READY_REVIEW"}}' }
    ])
  };

  const repository = createWorkflowEvidenceRepository({
    statements,
    getAssignment: (assignmentId) => ({ id: assignmentId, title: 'Repository boundary test' }),
    parseAgentWorkerRun: (row) => ({ ...row, output: JSON.parse(row.outputJson), questions: JSON.parse(row.questionsJson) }),
    parseAgentRelayItem: (row) => ({ ...row, context: JSON.parse(row.contextJson), decision: JSON.parse(row.decisionJson) }),
    parseIntakeAssetRow: (row) => ({ ...row, analysisJson: JSON.parse(row.analysisJson), parsedByFixture: true })
  });

  const evidence = repository.getAssignmentEvidence('assignment-repo-test');

  assertEqual(evidence.assignment.id, 'assignment-repo-test', 'assignment.id');
  assertEqual(evidence.standardsChecks[0].summary.overall, 'PASS', 'standardsChecks[0].summary.overall');
  assertEqual(evidence.standardsChecks[0].findings.length, 1, 'standardsChecks[0].findings.length');
  assertEqual(evidence.repoAnalysis[0].analysisJson.repoName, 'journey-builder-js', 'repoAnalysis[0].analysisJson.repoName');
  assertEqual(evidence.implementationEvidence[0].changedFiles[0], 'src/main.jsx', 'implementationEvidence[0].changedFiles[0]');
  assertEqual(evidence.agentEvents[0].detailJson.message, 'handoff prepared', 'agentEvents[0].detailJson.message');
  assert(evidence.intakeAssets[0].parsedByFixture, 'Expected intake asset parser callback to be used');
  assertEqual(evidence.agentWorkerRuns[0].output.summary, 'worker done', 'agentWorkerRuns[0].output.summary');
  assertEqual(evidence.agentRelayItems[0].context.source, 'review', 'agentRelayItems[0].context.source');
  assertEqual(evidence.aiWorkAuditPacks[0].packJson.artifactType, 'ai-work-audit-pack', 'aiWorkAuditPacks[0].packJson.artifactType');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createAiWorkAuditPackStatementFixture();
  const repository = createAiWorkAuditPackRepository({ statements: fixture.statements });

  const created = repository.createPack({
    id: 'auditpack_1',
    assignmentId: 'assignment-repo-test',
    stage: 'post-implementation',
    status: 'recorded',
    pack: {
      artifactType: 'ai-work-audit-pack',
      summary: { workflowState: 'POST_IMPLEMENTATION_CHECK' }
    },
    createdAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'auditpack_1', 'created audit pack id');
  assertEqual(created.packJson.artifactType, 'ai-work-audit-pack', 'audit pack artifact type');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'audit pack list count');
  assertEqual(repository.getLatestByAssignment('assignment-repo-test').stage, 'post-implementation', 'latest audit pack stage');
  assertEqual(repository.getById('auditpack_1').packJson.summary.workflowState, 'POST_IMPLEMENTATION_CHECK', 'audit pack workflow state');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createAgentEventStatementFixture();
  const repository = createAgentEventRepository({ statements: fixture.statements });

  const created = repository.createEvent({
    id: 'agentevent_1',
    assignmentId: 'assignment-repo-test',
    agentId: 'codex',
    eventType: 'worker_launch_prepared',
    status: 'prepared',
    detail: {
      runId: 'run_1',
      workerRole: 'fullstack-dev',
      message: 'Worker launch was prepared.'
    },
    createdAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'agentevent_1', 'created agent event id');
  assertEqual(JSON.parse(created.detail).workerRole, 'fullstack-dev', 'created agent event detail workerRole');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'agent event list count');
  assertEqual(repository.listByAssignment('assignment-repo-test')[0].agentId, 'codex', 'agent event agentId');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createRunEventStatementFixture();
  const repository = createRunEventRepository({ statements: fixture.statements });

  repository.createEvent({
    id: 'event_1',
    runId: 'run_1',
    assignmentId: 'assignment-repo-test',
    eventType: 'request_received',
    status: 'running',
    detail: { requestType: 'chat', provider: 'local' },
    createdAt: '2026-06-16T10:00:00.000Z'
  });
  const completed = repository.createEvent({
    id: 'event_2',
    runId: 'run_1',
    assignmentId: 'assignment-repo-test',
    eventType: 'response_generated',
    status: 'ok',
    detail: { latencyMs: 42 },
    createdAt: '2026-06-16T10:01:00.000Z'
  });

  assertEqual(completed.id, 'event_2', 'created run event id');
  assertEqual(JSON.parse(completed.detail).latencyMs, 42, 'created run event detail latencyMs');
  assertEqual(repository.list().length, 2, 'run event list count');
  assertEqual(repository.list()[0].id, 'event_2', 'run event descending list order');
  assertEqual(repository.listByRun('run_1')[0].id, 'event_1', 'run event by-run ascending order');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createAiUsageStatementFixture();
  const repository = createAiUsageRepository({ statements: fixture.statements });

  const created = repository.createUsage({
    id: 'usage_1',
    requestId: 'aireq_1',
    runId: 'run_1',
    sessionId: 'session_1',
    userId: 'local-user',
    requestType: 'chat',
    provider: 'local',
    model: 'local-guide-model',
    inputChars: 21,
    promptTokens: 6,
    completionTokens: 12,
    totalTokens: 18,
    latencyMs: 42,
    status: 'ok',
    fallbackUsed: true,
    sources: [{ id: 'source_1', title: 'ODT Guide' }],
    createdAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'usage_1', 'created AI usage id');
  assertEqual(created.fallbackUsed, 1, 'created AI usage fallback flag');
  assertEqual(JSON.parse(created.sourcesJson)[0].title, 'ODT Guide', 'created AI usage source title');
  assertEqual(repository.list().length, 1, 'AI usage list count');
  assertEqual(repository.list()[0].requestType, 'chat', 'AI usage request type');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createChatMessageStatementFixture();
  const repository = createChatMessageRepository({ statements: fixture.statements });

  repository.createMessage({
    id: 'msg_1',
    assignmentId: 'assignment-repo-test',
    sessionId: 'session_1',
    role: 'user',
    content: 'What is next?',
    provider: 'local',
    model: 'local-guide-model',
    createdAt: '2026-06-16T10:00:00.000Z'
  });
  const assistantMessage = repository.createMessage({
    id: 'msg_2',
    assignmentId: 'assignment-repo-test',
    sessionId: 'session_1',
    role: 'assistant',
    content: 'Run repository checks.',
    provider: 'local',
    model: 'local-guide-model',
    createdAt: '2026-06-16T10:01:00.000Z'
  });

  assertEqual(assistantMessage.id, 'msg_2', 'created chat message id');
  assertEqual(repository.list().length, 2, 'chat message list count');
  assertEqual(repository.list()[0].role, 'user', 'chat message ascending order');
  assertEqual(repository.list()[1].content, 'Run repository checks.', 'chat assistant message content');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createConnectorEventStatementFixture();
  const repository = createConnectorEventRepository({ statements: fixture.statements });

  repository.createEvent({
    id: 'connector_1',
    connectorId: 'jira',
    action: 'get-issue',
    mode: 'read',
    status: 'blocked',
    detail: {
      reason: 'A Jira issue key is required.',
      assignmentId: 'assignment-repo-test'
    },
    createdAt: '2026-06-16T10:00:00.000Z'
  });
  const okEvent = repository.createEvent({
    id: 'connector_2',
    connectorId: 'jira',
    action: 'get-issue',
    mode: 'read',
    status: 'ok',
    detail: {
      note: 'Read-only Jira lookup succeeded.',
      issueKey: 'JOURNEY-25577'
    },
    createdAt: '2026-06-16T10:01:00.000Z'
  });

  assertEqual(okEvent.id, 'connector_2', 'created connector event id');
  assertEqual(JSON.parse(okEvent.detail).issueKey, 'JOURNEY-25577', 'connector event detail issue key');
  assertEqual(repository.list().length, 2, 'connector event list count');
  assertEqual(repository.list()[0].status, 'ok', 'connector event descending order');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createAssignmentStatementFixture();
  const repository = createAssignmentRepository({ statements: fixture.statements });

  const created = repository.createAssignment({
    id: 'assignment-repo-test',
    title: 'Repository-backed assignment',
    requirement: 'Validate assignment persistence boundaries.',
    owner: 'local-user',
    status: 'needs review',
    priority: 'high',
    repoPath: '/tmp/odt',
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'assignment-repo-test', 'created assignment id');
  assertEqual(repository.list().length, 1, 'assignment list count');
  assertEqual(repository.getById('assignment-repo-test').repoPath, '/tmp/odt', 'assignment repo path');

  const updated = repository.updateContext({
    assignmentId: 'assignment-repo-test',
    title: 'Updated assignment',
    requirement: 'Updated requirement.',
    repoPath: '/tmp/updated-odt',
    status: 'needs review',
    updatedAt: '2026-06-16T10:05:00.000Z'
  });

  assertEqual(updated.title, 'Updated assignment', 'updated assignment title');
  assertEqual(updated.requirement, 'Updated requirement.', 'updated assignment requirement');
  assertEqual(updated.repoPath, '/tmp/updated-odt', 'updated assignment repo path');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createPromptTemplateStatementFixture();
  const repository = createPromptTemplateRepository({ statements: fixture.statements });

  const created = repository.createTemplate({
    id: 'guide-chat-v1',
    name: 'ODT Guide Chat',
    requestType: 'chat',
    version: 'v1',
    template: 'Answer with workflow context.',
    active: 1,
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });
  repository.createTemplate({
    id: 'guide-chat-v1',
    name: 'Duplicate ignored',
    requestType: 'chat',
    version: 'v1',
    template: 'Should not replace.',
    active: 1,
    createdAt: '2026-06-16T10:01:00.000Z',
    updatedAt: '2026-06-16T10:01:00.000Z'
  });

  assertEqual(created.id, 'guide-chat-v1', 'created prompt template id');
  assertEqual(repository.list().length, 1, 'prompt template insert-ignore list count');
  assertEqual(repository.list()[0].template, 'Answer with workflow context.', 'prompt template preserved value');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createApprovalEventStatementFixture();
  const repository = createApprovalEventRepository({ statements: fixture.statements });

  const created = repository.createApproval({
    id: 'approval_1',
    assignmentId: 'assignment-repo-test',
    approvalType: 'write_scope',
    status: 'approved',
    approvedBy: 'local-user',
    approvedAt: '2026-06-16T10:00:00.000Z',
    notes: 'Approved after standards review.'
  });

  assertEqual(created.id, 'approval_1', 'created approval id');
  assertEqual(created.approvalType, 'write_scope', 'approval type');
  assertEqual(created.status, 'approved', 'approval status');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'approval list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createDependencyRequestStatementFixture();
  const repository = createDependencyRequestRepository({ statements: fixture.statements });

  const created = repository.createRequest({
    id: 'dep_1',
    assignmentId: 'assignment-repo-test',
    packageName: '@testing-library/react',
    version: '^15.0.0',
    license: 'MIT',
    reason: 'Needed for focused UI regression tests.',
    alternatives: 'Manual DOM tests only.',
    status: 'pending',
    requestedBy: 'local-user',
    requestedAt: '2026-06-16T10:00:00.000Z',
    notes: 'Install remains blocked until approved.'
  });

  assertEqual(created.id, 'dep_1', 'created dependency request id');
  assertEqual(created.status, 'pending', 'dependency initial status');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'dependency request list count');

  const approved = repository.updateDecision({
    id: 'dep_1',
    status: 'approved',
    approvedBy: 'local-user',
    decidedAt: '2026-06-16T10:05:00.000Z',
    notes: 'Approved for package-specific install.'
  });

  assertEqual(approved.status, 'approved', 'dependency approved status');
  assertEqual(approved.approvedBy, 'local-user', 'dependency approvedBy');
  assertEqual(approved.decidedAt, '2026-06-16T10:05:00.000Z', 'dependency decidedAt');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createRequirementStatementFixture();
  const repository = createRequirementRepository({ statements: fixture.statements });

  const created = repository.createRequirement({
    id: 'req_1',
    assignmentId: 'assignment-repo-test',
    sourceType: 'manual',
    rawText: 'Fix long text overflow in Journey Builder preview.',
    summary: 'Long text overflow fix',
    status: 'REQUIREMENT_ANALYZED',
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'req_1', 'created requirement id');
  assertEqual(created.rawText, 'Fix long text overflow in Journey Builder preview.', 'created requirement rawText');
  assertEqual(created.summary, 'Long text overflow fix', 'created requirement summary');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'requirement list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createRepoAnalysisStatementFixture();
  const repository = createRepoAnalysisRepository({ statements: fixture.statements });

  const created = repository.createAnalysis({
    id: 'repo_1',
    assignmentId: 'assignment-repo-test',
    repoPath: '/Users/vn105957/Desktop/lpDev/journey-builder-js',
    analysis: {
      repoName: 'journey-builder-js',
      status: 'REPO_ANALYZED',
      impactAnalysis: {
        likelyImpactedFiles: ['src/journey_preview.jsx'],
        candidateTestFiles: ['src/__tests__/journey_preview.test.jsx']
      }
    },
    status: 'REPO_ANALYZED',
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'repo_1', 'created repo analysis id');
  assertEqual(created.analysisJson.repoName, 'journey-builder-js', 'created repo analysis repoName');
  assertEqual(created.analysisJson.impactAnalysis.likelyImpactedFiles[0], 'src/journey_preview.jsx', 'repo likely impacted file');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'repo analysis list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createTechnicalDesignStatementFixture();
  const repository = createTechnicalDesignRepository({ statements: fixture.statements });

  const created = repository.createDesign({
    id: 'design_1',
    assignmentId: 'assignment-repo-test',
    title: 'Repository boundary design',
    design: {
      title: 'Repository boundary design',
      scope: ['Keep Planner behavior stable.'],
      candidateFiles: ['server/index.js']
    },
    status: 'TECH_DESIGN_DRAFTED',
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'design_1', 'created technical design id');
  assertEqual(created.designJson.title, 'Repository boundary design', 'technical design title');
  assertEqual(created.designJson.candidateFiles[0], 'server/index.js', 'technical design candidate file');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'technical design list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createImplementationPlanStatementFixture();
  const repository = createImplementationPlanRepository({ statements: fixture.statements });

  const created = repository.createPlan({
    id: 'plan_1',
    assignmentId: 'assignment-repo-test',
    title: 'Repository boundary plan',
    plan: {
      title: 'Repository boundary plan',
      filesToChange: ['server/index.js'],
      validationTasks: ['Run enterprise checks.']
    },
    status: 'PLAN_REVIEW',
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'plan_1', 'created implementation plan id');
  assertEqual(created.planJson.title, 'Repository boundary plan', 'implementation plan title');
  assertEqual(created.planJson.validationTasks[0], 'Run enterprise checks.', 'implementation validation task');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'implementation plan list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createTestPlanStatementFixture();
  const repository = createTestPlanRepository({ statements: fixture.statements });

  const created = repository.createTestPlan({
    id: 'testplan_1',
    assignmentId: 'assignment-repo-test',
    phase: 'pre-implementation',
    plan: {
      backend: ['Validate API smoke.'],
      frontend: ['Validate Agent Team relay smoke.'],
      targetedCommands: ['npm run check']
    },
    status: 'DRAFT',
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'testplan_1', 'created test plan id');
  assertEqual(created.planJson.targetedCommands[0], 'npm run check', 'test plan targeted command');
  assertEqual(created.phase, 'pre-implementation', 'test plan phase');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'test plan list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createIntakeAssetStatementFixture();
  const repository = createIntakeAssetRepository({
    statements: fixture.statements,
    parseIntakeAssetRow: (row) => row
      ? { ...row, analysisJson: JSON.parse(row.analysisJson || '{}') }
      : null
  });

  const created = repository.createAsset({
    id: 'asset_1',
    assignmentId: 'assignment-repo-test',
    originalName: 'mockup.md',
    storedName: 'asset_1-mockup.md',
    storedPath: '/tmp/odt/mockup.md',
    mimeType: 'text/markdown',
    fileType: 'notes',
    bytes: 128,
    sourceKind: 'upload',
    analysis: {
      version: 'asset-analysis-1.0',
      role: 'Plain-text requirement notes, Markdown brief, logs, or implementation context.'
    },
    status: 'stored',
    createdAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'asset_1', 'created intake asset id');
  assertEqual(created.analysisJson.version, 'asset-analysis-1.0', 'intake asset analysis version');
  assertEqual(repository.getById('asset_1').originalName, 'mockup.md', 'intake asset get originalName');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'intake asset list count');

  const updated = repository.updateAnalysis({
    assetId: 'asset_1',
    analysis: {
      version: 'asset-analysis-1.0',
      role: 'Updated role',
      localExtraction: { status: 'extracted', excerpt: 'Acceptance criteria' }
    }
  });

  assertEqual(updated.analysisJson.role, 'Updated role', 'updated intake asset role');
  assertEqual(updated.analysisJson.localExtraction.excerpt, 'Acceptance criteria', 'updated intake asset excerpt');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createAgentFoundryRunStatementFixture();
  const repository = createAgentFoundryRunRepository({
    statements: fixture.statements,
    parseAgentFoundryRun: (row) => row
      ? {
          ...row,
          inputSources: JSON.parse(row.inputSourcesJson || '[]'),
          output: JSON.parse(row.outputJson || '{}')
        }
      : null
  });

  const created = repository.createRunEntry({
    id: 'foundry_1',
    runId: 'foundryrun_1',
    assignmentId: 'assignment-repo-test',
    phase: 'full-sdlc',
    domainId: 'architecture',
    domainLabel: 'Architecture',
    inputSources: ['repo-analysis', 'implementation-plan'],
    output: {
      status: 'WARNING',
      specialistName: 'Architecture Specialist',
      summary: 'Review repository boundaries before implementation.'
    },
    status: 'WARNING',
    provider: 'local',
    model: 'local-foundry-model',
    createdAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'foundry_1', 'created Agent Foundry run id');
  assertEqual(created.inputSources[0], 'repo-analysis', 'Agent Foundry input source');
  assertEqual(created.output.specialistName, 'Architecture Specialist', 'Agent Foundry specialist name');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'Agent Foundry run list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createSettingsStatementFixture();
  const repository = createSettingsRepository({ statements: fixture.statements });

  const created = repository.setValue('executionAgent', 'codex', '2026-06-16T10:00:00.000Z');
  assertEqual(created.key, 'executionAgent', 'created setting key');
  assertEqual(repository.getValue('executionAgent', 'manual'), 'codex', 'settings getValue string');

  repository.setMany({
    activeAssignmentId: 'assignment-repo-test',
    uiDensity: 'compact',
    featureFlags: { nativeShell: true }
  }, '2026-06-16T10:05:00.000Z');

  assertEqual(repository.getValue('activeAssignmentId', ''), 'assignment-repo-test', 'settings active assignment');
  assertEqual(repository.getValue('featureFlags', {}).nativeShell, true, 'settings object value');
  assertEqual(repository.getValue('missingSetting', 'fallback'), 'fallback', 'settings fallback');
  assertEqual(repository.listSettings().length, 4, 'settings list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createProjectContractStatementFixture();
  const repository = createProjectContractRepository({ statements: fixture.statements });

  const created = repository.upsertContract({
    id: 'contract_1',
    assignmentId: 'assignment-repo-test',
    projectName: 'ODT Workbench Local',
    ownerTeam: 'ODT 2.0',
    repoPath: '/tmp/odt-workbench-next',
    baseBranch: 'main',
    riskProfile: 'medium',
    installCommand: 'npm install',
    buildCommand: 'npm run build',
    testCommand: 'npm --prefix "odt 2.0 enterprise" run check',
    runUiCommand: 'npm run dev',
    runApiCommand: 'npm run api',
    knownIssues: ['Use Node 24+', 'Keep API/UI ports documented'],
    blockedCommands: ['git reset --hard', 'rm -rf'],
    approvalNotes: ['Writes and PR creation require approval.'],
    evidenceNotes: ['Record validation output in ODT.'],
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'contract_1', 'created project contract id');
  assertEqual(created.knownIssues.length, 2, 'project contract known issue count');
  assertEqual(created.blockedCommands[0], 'git reset --hard', 'project contract blocked command');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'project contract assignment list count');
  assertEqual(repository.getById('contract_1').approvalNotes[0], 'Writes and PR creation require approval.', 'project contract approval note');

  const updated = repository.upsertContract({
    ...created,
    testCommand: 'node --check server/index.js',
    evidenceNotes: ['Updated validation note.'],
    updatedAt: '2026-06-16T10:05:00.000Z'
  });

  assertEqual(updated.testCommand, 'node --check server/index.js', 'updated project contract test command');
  assertEqual(updated.evidenceNotes[0], 'Updated validation note.', 'updated project contract evidence note');
  assertEqual(repository.list().length, 1, 'project contract list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createReviewCommentStatementFixture();
  const repository = createReviewCommentRepository({ statements: fixture.statements });

  const created = repository.createComment({
    id: 'review_1',
    assignmentId: 'assignment-repo-test',
    targetType: 'implementation',
    targetId: 'worker_1',
    severity: 'warning',
    comment: 'Reviewer found a test gap.',
    status: 'open',
    createdBy: 'odt-reviewer-ingest',
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z',
    resolutionNotes: 'sourceWorkerRunId=worker_1;findingIndex=1'
  });

  assertEqual(created.id, 'review_1', 'created review comment id');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'review comment list count');
  assertEqual(repository.getById('review_1').severity, 'warning', 'review comment severity');

  const updated = repository.updateStatus({
    id: 'review_1',
    status: 'resolved',
    updatedAt: '2026-06-16T10:05:00.000Z',
    resolutionNotes: 'Resolved after reviewer rerun.'
  });

  assertEqual(updated.status, 'resolved', 'updated review comment status');
  assertEqual(updated.resolutionNotes, 'Resolved after reviewer rerun.', 'updated review comment notes');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createImplementationEvidenceStatementFixture();
  const repository = createImplementationEvidenceRepository({ statements: fixture.statements });

  const created = repository.createEvidence({
    id: 'implev_1',
    assignmentId: 'assignment-repo-test',
    runId: 'run_1',
    phase: 'implementation',
    changedFiles: ['src/main.jsx'],
    commands: [{ command: 'npm run build', status: 'passed' }],
    tests: [{ name: 'build', command: 'npm run build', status: 'passed' }],
    summary: 'Implementation evidence captured.',
    status: 'recorded',
    createdBy: 'codex:Senior Full Stack Dev',
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'implev_1', 'created implementation evidence id');
  assertEqual(created.changedFiles[0], 'src/main.jsx', 'implementation evidence changed file');
  assertEqual(created.commands[0].status, 'passed', 'implementation evidence command status');
  assertEqual(created.tests[0].name, 'build', 'implementation evidence test name');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'implementation evidence list count');
  assertEqual(repository.getById('implev_1').summary, 'Implementation evidence captured.', 'implementation evidence summary');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createPrReadinessReportStatementFixture();
  const repository = createPrReadinessReportRepository({ statements: fixture.statements });

  const created = repository.createReport({
    id: 'prpack_1',
    assignmentId: 'assignment-repo-test',
    title: 'PR Readiness Pack: Repository boundary test',
    report: {
      status: 'PR_READY_REVIEW',
      markdown: '## Summary\nRepository backed PR pack.',
      evidenceSummary: { implementationEvidence: 1 }
    },
    status: 'PR_READY_REVIEW',
    createdAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'prpack_1', 'created PR readiness report id');
  assertEqual(created.reportJson.status, 'PR_READY_REVIEW', 'PR readiness report status');
  assertEqual(created.reportJson.evidenceSummary.implementationEvidence, 1, 'PR readiness evidence summary');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'PR readiness list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createStandardsCheckStatementFixture();
  const repository = createStandardsCheckRepository({ statements: fixture.statements });

  const created = repository.createCheck({
    id: 'stdcheck_1',
    assignmentId: 'assignment-repo-test',
    phase: 'post-implementation',
    standardsVersion: 'odt-baseline-1.0',
    status: 'WARNING',
    summary: { blockers: 0, warnings: 1 },
    artifact: { implementationEvidenceId: 'implev_1' },
    findings: [{
      category: 'testing',
      status: 'WARNING',
      message: 'Visual evidence is missing.',
      recommendation: 'Attach browser or screenshot proof.'
    }],
    createFindingId: () => 'finding_1',
    createdAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'stdcheck_1', 'created standards check id');
  assertEqual(created.summary.warnings, 1, 'standards summary warnings');
  assertEqual(created.artifact.implementationEvidenceId, 'implev_1', 'standards artifact implementationEvidenceId');
  assertEqual(created.findings.length, 1, 'standards finding count');
  assertEqual(created.findings[0].recommendation, 'Attach browser or screenshot proof.', 'standards finding recommendation');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'standards check list count');
  assertEqual(repository.listFindingsByAssignment('assignment-repo-test').length, 1, 'standards finding list count');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createRelayStatementFixture();
  const repository = createAgentRelayRepository({
    statements: fixture.statements,
    parseAgentRelayItem: (row) => row
      ? {
          ...row,
          context: JSON.parse(row.contextJson || '{}'),
          decision: JSON.parse(row.decisionJson || '{}')
        }
      : null
  });

  const created = repository.createRelayItem({
    id: 'relay_1',
    assignmentId: 'assignment-repo-test',
    sourceWorkerRunId: 'worker_1',
    sourceWorkerRole: 'reviewer',
    sourceWorkerRoleLabel: 'Reviewer',
    targetWorkerRole: 'fullstack-dev',
    targetLane: 'Senior Full Stack Dev Rework',
    itemType: 'rework',
    status: 'open',
    severity: 'needs_review',
    title: 'Rework required: Implementation',
    message: 'Fix the review finding.',
    context: { reviewCommentId: 'comment_1' },
    decision: {},
    uniqueKey: 'review:comment_1',
    createdBy: 'odt-review',
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.id, 'relay_1', 'created relay id');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'relay list count');
  assertEqual(repository.findByUniqueKey('assignment-repo-test', 'review:comment_1').context.reviewCommentId, 'comment_1', 'relay context reviewCommentId');

  const updated = repository.updateRelayItem({
    relayItemId: 'relay_1',
    targetWorkerRole: 'fullstack-dev',
    targetLane: 'Senior Full Stack Dev Rework',
    status: 'answered',
    severity: 'needs_review',
    decision: {
      action: 'answer',
      decision: 'Rework completed.',
      decidedBy: 'local-user'
    },
    updatedAt: '2026-06-16T10:05:00.000Z',
    resolvedAt: '2026-06-16T10:05:00.000Z'
  });

  assertEqual(updated.status, 'answered', 'updated relay status');
  assertEqual(updated.decision.action, 'answer', 'updated relay decision action');
  assertEqual(updated.resolvedAt, '2026-06-16T10:05:00.000Z', 'updated relay resolvedAt');
} catch (error) {
  failures.push(error.message);
}

try {
  const fixture = createWorkerRunStatementFixture();
  const repository = createAgentWorkerRunRepository({
    statements: fixture.statements,
    parseAgentWorkerRun: (row) => row
      ? {
          ...row,
          output: JSON.parse(row.outputJson || '{}'),
          questions: JSON.parse(row.questionsJson || '[]')
        }
      : null
  });

  const created = repository.upsertWorkerRun({
    id: 'worker_1',
    assignmentId: 'assignment-repo-test',
    runId: 'run_1',
    workerRole: 'reviewer',
    workerRoleLabel: 'Reviewer',
    executionAgent: 'codex',
    mode: 'read-only',
    sandboxMode: 'read-only',
    status: 'bundle_created',
    sequenceIndex: 1,
    launchMode: 'bundle-only',
    bundleDir: '/tmp/worker',
    handoffFile: '/tmp/worker/handoff.json',
    promptFile: '/tmp/worker/prompt.md',
    scriptFile: '/tmp/worker/launch.sh',
    responseFile: '/tmp/worker/response.md',
    logFile: '/tmp/worker/worker.log',
    statusFile: '/tmp/worker/status.json',
    manualCommand: 'bash /tmp/worker/launch.sh',
    output: { summary: 'Worker prepared.' },
    questions: [],
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z'
  });

  assertEqual(created.status, 'bundle_created', 'created worker status');
  assertEqual(repository.listByAssignment('assignment-repo-test').length, 1, 'worker list count');
  assertEqual(repository.getById('worker_1').output.summary, 'Worker prepared.', 'worker output summary');

  const updated = repository.updateWorkerOutput({
    workerRunId: 'worker_1',
    status: 'needs_review',
    output: { summary: 'Reviewer finding captured.', responseBytes: 1024 },
    questions: [{ targetLane: 'Senior Full Stack Dev Rework', question: 'Can you fix this?', status: 'open' }],
    updatedAt: '2026-06-16T10:05:00.000Z',
    completedAt: '2026-06-16T10:05:00.000Z'
  });

  assertEqual(updated.status, 'needs_review', 'updated worker status');
  assertEqual(updated.output.responseBytes, 1024, 'updated worker responseBytes');
  assertEqual(updated.questions[0].targetLane, 'Senior Full Stack Dev Rework', 'updated worker question lane');
  assertEqual(updated.completedAt, '2026-06-16T10:05:00.000Z', 'updated worker completedAt');
} catch (error) {
  failures.push(error.message);
}

if (failures.length) {
  console.error('SQLite repository check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('SQLite repository check passed (workflow evidence, AI work audit pack, agent event, run event, AI usage, chat message, connector event, assignment, prompt template, approval event, dependency request, requirement, repo analysis, technical design, implementation plan, test plan, intake asset, Agent Foundry run, settings, project contract, agent relay, agent worker run, review comment, implementation evidence, PR readiness, and standards check repository fixtures).');
