import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertReviewCycleCloseoutContract,
  assertWorkflowStateContract
} from '../../domain/src/workflow-contract.js';
import {
  buildAiWorkAuditPack
} from '../../domain/src/ai-work-audit.js';
import {
  buildBranchReadinessAlert,
  resolveWorkerLaunchPolicy
} from '../../domain/src/agent-team-launch-policy.js';
import {
  createWorkflowService,
  createWorkflowStateService,
  deriveJiraVerificationProfile,
  splitEvidenceByFreshness,
  scopedCurrentEvidence,
  deriveWorkflowState,
  deriveReviewCycleCloseout
} from '../../../services/api/src/modules/workflow/index.js';
import {
  createProjectContractService,
  normalizeProjectContract,
  selectProjectContractForAssignmentContext
} from '../../../services/api/src/modules/project-contract/index.js';
import { reviewCycleCloseoutFixtures } from './fixtures/workflow/review-cycle-closeout-fixtures.js';
import { workflowDerivationFixtures } from './fixtures/workflow/workflow-derivation-fixtures.js';
import { workflowEvidenceFixtures } from './fixtures/workflow/workflow-evidence-fixtures.js';
import { workflowStateFixtures } from './fixtures/workflow/workflow-state-fixtures.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const liveFixtureDir = resolve(currentDir, 'fixtures/workflow/live');
const failures = [];

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`Expected ${label} ${expected}, received ${actual}`);
  }
}

try {
  const auditPack = buildAiWorkAuditPack({
    evidence: {
      assignment: {
        id: 'assignment-audit-pack',
        title: 'Audit pack demo',
        requirement: 'JOURNEY-25577 implement long text wrapping',
        repoPath: '/Users/vn105957/Desktop/lpDev/cerner-learning-js',
        baseBranch: 'main'
      },
      workflowState: {
        assignmentId: 'assignment-audit-pack',
        state: 'APPROVED_TO_WRITE',
        label: 'Approved To Write',
        stage: 'implement',
        status: 'in_progress',
        nextAction: { label: 'Delegate To Agent', detail: 'Prepare a governed handoff.', page: 'team' },
        blockedReasons: [],
        allowedActions: { canDelegateWrite: true }
      },
      requirements: [{ id: 'req_1', status: 'analyzed', summary: 'JOURNEY-25577 imported.', createdAt: '2026-06-24T01:00:00.000Z' }],
      repoAnalysis: [{ id: 'repo_1', repoPath: '/Users/vn105957/Desktop/lpDev/cerner-learning-js', status: 'analyzed', createdAt: '2026-06-24T01:05:00.000Z' }],
      standardsChecks: [{ id: 'std_1', phase: 'pre-implementation', status: 'PASS', createdAt: '2026-06-24T01:10:00.000Z', summary: { message: 'Pre-write standards passed.' } }],
      approvals: [
        { id: 'approval_1', approvalType: 'write_scope', status: 'approved', approvedBy: 'local-user', approvedAt: '2026-06-24T01:15:00.000Z', notes: 'Approved write scope for JOURNEY-25577 wrapping fix.' }
      ],
      reviewComments: [
        { id: 'review_1', targetType: 'plan', severity: 'warning', comment: 'Confirm branch before implementation.', status: 'accepted_risk', createdBy: 'reviewer', createdAt: '2026-06-24T01:16:00.000Z', updatedAt: '2026-06-24T01:17:00.000Z', resolutionNotes: 'Branch override accepted for this local task.' }
      ],
      implementationEvidence: [
        { id: 'impl_1', status: 'recorded', changedFiles: ['src/styles.scss'], commands: ['npm test'], tests: [{ name: 'Build', status: 'passed', notes: 'Bundle completed.' }], summary: 'Wrapped long assessment text.', createdBy: 'codex', createdAt: '2026-06-24T01:30:00.000Z' }
      ],
      prReadinessReports: [
        { id: 'pr_1', status: 'PR_READY_REVIEW', reportJson: { status: 'PR_READY_REVIEW', packId: 'prpack_1' }, createdAt: '2026-06-24T01:40:00.000Z' }
      ],
      agentWorkerRuns: [
        { id: 'worker_1', workerRoleLabel: 'Senior Full Stack Dev', status: 'completed', createdAt: '2026-06-24T01:20:00.000Z' }
      ]
    },
    branchReadiness: {
      status: 'manual',
      detail: 'Current branch main is protected.',
      currentBranch: 'main',
      expectedBranch: 'codex/JOURNEY-25577-long-text-wrapping',
      gateImpact: 'write blocked until branch is changed or approved'
    }
  });

  assertEqual(auditPack.artifactType, 'ai-work-audit-pack', 'auditPack.artifactType');
  assertEqual(auditPack.summary.workflowState, 'APPROVED_TO_WRITE', 'auditPack.summary.workflowState');
  assertEqual(auditPack.decisions[0].whatApproved, 'Write scope', 'auditPack.decisions[0].whatApproved');
  assertEqual(auditPack.decisions[0].approvedBy, 'local-user', 'auditPack.decisions[0].approvedBy');
  assertEqual(auditPack.reviewComments[0].status, 'accepted_risk', 'auditPack.reviewComments[0].status');
  assertEqual(auditPack.branchReadiness.status, 'manual', 'auditPack.branchReadiness.status');
  if (!auditPack.markdown.includes('## Decision / Gate Impact')) {
    throw new Error('audit pack markdown must include Decision / Gate Impact section.');
  }
  if (!auditPack.markdown.includes('Approved write scope for JOURNEY-25577 wrapping fix.')) {
    throw new Error('audit pack markdown must include approval notes.');
  }
  if (!auditPack.exportJson.includes('"artifactType": "ai-work-audit-pack"')) {
    throw new Error('audit pack exportJson must include artifact type.');
  }
} catch (error) {
  failures.push(`AI work audit pack: ${error.message}`);
}

try {
  const manualBranchReadiness = {
    checks: [
      {
        id: 'branch-readiness',
        status: 'manual',
        currentBranch: 'main',
        expectedBranch: 'codex/JOURNEY-25577-assessment-wrapping'
      }
    ]
  };
  const basePolicy = {
    selectedAgent: 'codex',
    codexLaunchHealthy: true,
    writeMode: true,
    worker: { id: 'fullstack-dev', requiresWrite: true },
    projectReadiness: manualBranchReadiness
  };
  const blocked = resolveWorkerLaunchPolicy(basePolicy);
  assertEqual(blocked.allowed, false, 'branch override missing allowed');
  assertEqual(blocked.branchOverrideRequired, true, 'branch override missing branchOverrideRequired');

  const accepted = resolveWorkerLaunchPolicy({
    ...basePolicy,
    branchOverrideAccepted: true
  });
  assertEqual(accepted.allowed, true, 'branch override accepted allowed');
  assertEqual(accepted.branchOverrideAccepted, true, 'branch override accepted flag');

  const branchAlert = buildBranchReadinessAlert({
    projectReadiness: manualBranchReadiness,
    branchOverrideAccepted: false,
    branchOverrideRecorded: false
  });
  assertEqual(branchAlert?.visible, true, 'branch alert visible');
  assertEqual(branchAlert?.status, 'manual', 'branch alert status');
  assertEqual(branchAlert?.currentBranch, 'main', 'branch alert currentBranch');
  assertEqual(branchAlert?.expectedBranch, 'codex/JOURNEY-25577-assessment-wrapping', 'branch alert expectedBranch');
  assertEqual(branchAlert?.actionLabel, 'Create branch or accept risk', 'branch alert action label');

  const overrideAlert = buildBranchReadinessAlert({
    projectReadiness: manualBranchReadiness,
    branchOverrideAccepted: true,
    branchOverrideRecorded: true
  });
  assertEqual(overrideAlert?.actionLabel, 'Override recorded', 'branch override alert action label');

  const readyAlert = buildBranchReadinessAlert({
    projectReadiness: {
      checks: [{ id: 'branch-readiness', status: 'ready', currentBranch: 'codex/JOURNEY-25577-assessment-wrapping' }]
    }
  });
  assertEqual(readyAlert, null, 'ready branch alert');
} catch (error) {
  failures.push(`Agent launch branch override: ${error.message}`);
}

try {
  const contracts = [
    {
      id: 'odt-workbench-local',
      assignmentId: 'assignment-local-mvp',
      repoPath: '/Users/vn105957/Desktop/odt-submission/odt-workbench-next',
      status: 'active'
    }
  ];
  const selection = selectProjectContractForAssignmentContext({
    contracts,
    assignmentId: 'assignment_journey-25577_20260624T113957',
    evidence: {
      assignment: {
        repoPath: '/Users/vn105957/Desktop/lpDev/cerner-learning-js'
      },
      repoAnalysis: [
        {
          repoPath: '/Users/vn105957/Desktop/lpDev/cerner-learning-js',
          analysisJson: {
            repoPath: '/Users/vn105957/Desktop/lpDev/cerner-learning-js'
          }
        }
      ]
    }
  });
  assertEqual(selection.contract, null, 'mismatched project contract selection');
  assertEqual(selection.targetRepoPath, '/Users/vn105957/Desktop/lpDev/cerner-learning-js', 'mismatched project contract target repo');
  assertEqual(selection.reason, 'no_matching_contract_for_target_repo', 'mismatched project contract reason');

  const unscopedSelection = selectProjectContractForAssignmentContext({
    contracts: [
      {
        id: 'single-local-contract',
        assignmentId: '',
        repoPath: '/Users/vn105957/Desktop/odt-submission/odt-workbench-next',
        status: 'active'
      }
    ],
    assignmentId: 'assignment-local-mvp',
    evidence: {}
  });
  assertEqual(unscopedSelection.contract?.id, 'single-local-contract', 'unscoped project contract fallback');
} catch (error) {
  failures.push(`Project contract mismatch guard: ${error.message}`);
}

try {
  const contracts = new Map();
  const service = createProjectContractService({
    repository: {
      getById: (id) => contracts.get(id) || null,
      list: () => [...contracts.values()],
      listByAssignment: (assignmentId) => [...contracts.values()].filter((contract) => contract.assignmentId === assignmentId),
      upsertContract: (contract) => {
        contracts.set(contract.id, contract);
        return contract;
      }
    },
    pathExists: () => true,
    runCommand: async (command, args) => {
      const key = [command, ...args].join(' ');
      if (key === 'git rev-parse --show-toplevel') return { ok: true, stdout: '/repo', stderr: '' };
      if (key === 'git rev-parse --abbrev-ref HEAD') return { ok: true, stdout: 'main', stderr: '' };
      if (key === 'git status --short') return { ok: true, stdout: '', stderr: '' };
      if (key === 'node --version') return { ok: true, stdout: 'v24.15.0', stderr: '' };
      if (key === 'npm --version') return { ok: true, stdout: '11.6.2', stderr: '' };
      if (key === 'codex --version') return { ok: true, stdout: 'codex 0.1.0', stderr: '' };
      return { ok: true, stdout: '', stderr: '' };
    }
  });
  const contract = service.saveContract(normalizeProjectContract({
    id: 'contract_branch_gate',
    assignmentId: 'assignment_journey-25577',
    projectName: 'JOURNEY-25577 Assessment Wrapping',
    repoPath: '/repo',
    baseBranch: 'main',
    buildCommand: 'npm run build',
    testCommand: 'npm test',
    knownIssues: ['Use Node 24.'],
    approvalNotes: ['Write workers require branch readiness.']
  }));
  const readiness = await service.buildReadiness(contract.id);
  const branchCheck = readiness.checks.find((item) => item.id === 'branch-readiness');
  assertEqual(branchCheck?.status, 'manual', 'branch-readiness status');
  assertEqual(branchCheck?.currentBranch, 'main', 'branch-readiness currentBranch');
  assertEqual(branchCheck?.expectedBranch, 'codex/JOURNEY-25577-assessment-wrapping', 'branch-readiness expectedBranch');
  if (!branchCheck.detail.includes('protected')) {
    throw new Error('branch-readiness detail should explain protected branch risk.');
  }
} catch (error) {
  failures.push(`Project contract branch readiness: ${error.message}`);
}

for (const fixture of workflowStateFixtures) {
  try {
    assertWorkflowStateContract(fixture.workflow);
    if (fixture.workflow.state !== fixture.expectedState) {
      throw new Error(`Expected state ${fixture.expectedState}, received ${fixture.workflow.state}`);
    }

    const service = createWorkflowStateService({
      collectEvidence: () => ({ fixtureName: fixture.name }),
      deriveWorkflowState: () => fixture.workflow
    });
    const serviceWorkflow = service.getWorkflowState(fixture.workflow.assignmentId);
    assertWorkflowStateContract(serviceWorkflow);

    const workflowService = createWorkflowService({
      collectEvidence: () => ({
        workflowState: fixture.workflow,
        reviewCycleCloseout: deriveReviewCycleCloseout({ assignment: { id: fixture.workflow.assignmentId } })
      })
    });
    assertWorkflowStateContract(workflowService.getWorkflowState(fixture.workflow.assignmentId));
    assertReviewCycleCloseoutContract(workflowService.getReviewCycleCloseout(fixture.workflow.assignmentId));
  } catch (error) {
    failures.push(`${fixture.name}: ${error.message}`);
  }
}

for (const fixture of reviewCycleCloseoutFixtures) {
  try {
    const closeout = deriveReviewCycleCloseout(fixture.evidence);
    assertReviewCycleCloseoutContract(closeout);
    if (closeout.status !== fixture.expectedStatus) {
      throw new Error(`Expected closeout status ${fixture.expectedStatus}, received ${closeout.status}`);
    }
    if (closeout.nextAction?.label !== fixture.expectedNextAction) {
      throw new Error(`Expected next action ${fixture.expectedNextAction}, received ${closeout.nextAction?.label || 'none'}`);
    }
  } catch (error) {
    failures.push(`${fixture.name}: ${error.message}`);
  }
}

for (const fixture of workflowDerivationFixtures) {
  try {
    const workflow = deriveWorkflowState(fixture.evidence);
    assertWorkflowStateContract(workflow);
    if (workflow.state !== fixture.expectedState) {
      throw new Error(`Expected derived state ${fixture.expectedState}, received ${workflow.state}`);
    }
  } catch (error) {
    failures.push(`${fixture.name}: ${error.message}`);
  }
}

for (const fixture of workflowEvidenceFixtures) {
  try {
    const profile = deriveJiraVerificationProfile(fixture.evidence);
    for (const [field, expectedValue] of Object.entries(fixture.expectedProfile || {})) {
      assertEqual(profile?.[field], expectedValue, `profile.${field}`);
    }

    const freshness = splitEvidenceByFreshness(fixture.evidence);
    assertEqual(freshness.current.cutoffAt, fixture.expectedFreshness.cutoffAt, 'freshness.current.cutoffAt');
    for (const [field, expectedCount] of Object.entries(fixture.expectedFreshness.current || {})) {
      assertEqual(freshness.current[field]?.length || 0, expectedCount, `freshness.current.${field}.length`);
    }
    for (const [field, expectedCount] of Object.entries(fixture.expectedFreshness.historical || {})) {
      assertEqual(freshness.historical[field]?.length || 0, expectedCount, `freshness.historical.${field}.length`);
    }

    const scoped = scopedCurrentEvidence(fixture.evidence);
    for (const [field, expectedCount] of Object.entries(fixture.expectedScoped || {})) {
      assertEqual(scoped[field]?.length || 0, expectedCount, `scoped.${field}.length`);
    }
  } catch (error) {
    failures.push(`${fixture.name}: ${error.message}`);
  }
}

let liveFixtureCount = 0;
if (existsSync(liveFixtureDir)) {
  const liveFixtureFiles = readdirSync(liveFixtureDir)
    .filter((fileName) => fileName.endsWith('.workflow.json'))
    .sort();

  for (const fileName of liveFixtureFiles) {
    try {
      const fixturePath = join(liveFixtureDir, fileName);
      const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
      assertWorkflowStateContract(fixture.workflow || fixture);
      liveFixtureCount += 1;
    } catch (error) {
      failures.push(`${fileName}: ${error.message}`);
    }
  }
}

if (failures.length) {
  console.error('Workflow contract check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Workflow contract check passed (${workflowStateFixtures.length} static workflow fixtures, ${reviewCycleCloseoutFixtures.length} review-cycle fixtures, ${workflowDerivationFixtures.length} derivation fixtures, ${workflowEvidenceFixtures.length} evidence fixtures, ${liveFixtureCount} live fixtures).`);
