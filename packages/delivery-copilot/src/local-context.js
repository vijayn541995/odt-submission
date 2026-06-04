const fs = require('fs');
const http = require('http');
const path = require('path');
const { execFile, execFileSync } = require('child_process');
const { promisify } = require('util');
const { defaultIntake } = require('../../accessibility-ai-shield/src/dev-twin/templates');
const { runOdt } = require('../../accessibility-ai-shield/src/commands/odt');
const { runOdtExecute } = require('../../accessibility-ai-shield/src/commands/odt-execute');
const {
  getWorkspaceRoot,
  getTargetRepoPath,
  resolveWorkspacePath
} = require('../../accessibility-ai-shield/src/utils/workspace');
const {
  launchExternalAgent,
  getAgentLaunchStatus,
  resetAgentLaunchState
} = require('./agent-launcher');
const execFileAsync = promisify(execFile);
const UPLOAD_DIR = 'reports/odt/uploads';
const CLARIFICATION_FILE = 'reports/odt/clarifications/questions.json';
const CONVERSATION_STATE_FILE = 'reports/odt/conversation/state.json';
const AGENTIC_DIR = 'reports/odt/agentic';
const TASK_GRAPH_FILE = `${AGENTIC_DIR}/task-graph.json`;
const EXECUTION_PLAN_FILE = `${AGENTIC_DIR}/execution-plan.json`;
const SCHEDULER_DECISION_FILE = `${AGENTIC_DIR}/scheduler-decision.json`;
const AGENT_ROSTER_FILE = `${AGENTIC_DIR}/agent-roster.json`;
const REVIEWER_PLAN_FILE = `${AGENTIC_DIR}/reviewer-plan.json`;
const REVIEW_PROMPTS_DIR = `${AGENTIC_DIR}/review-prompts`;
const REVIEW_RESULTS_DIR = `${AGENTIC_DIR}/reviews`;
const REVIEW_SUMMARY_FILE = `${REVIEW_RESULTS_DIR}/reviewer-findings.json`;
const REVIEW_SUGGESTIONS_FILE = `${AGENTIC_DIR}/review-suggestions.json`;
const CONTEXT_ARTIFACTS_FILE = `${AGENTIC_DIR}/context-artifacts.json`;
const REVIEW_PACKET_FILE = `${AGENTIC_DIR}/review-packet.json`;
const REVIEW_PACKET_MD = `${AGENTIC_DIR}/review-packet.md`;
const ARBITRATOR_DECISION_FILE = `${AGENTIC_DIR}/arbitrator-decision.json`;
const ARBITRATOR_DECISION_MD = `${AGENTIC_DIR}/arbitrator-decision.md`;
const CYCLES_DIR = `${AGENTIC_DIR}/cycles`;
const CYCLE_HISTORY_FILE = `${AGENTIC_DIR}/cycle-history.json`;
const CYCLE_HISTORY_MD = `${AGENTIC_DIR}/cycle-history.md`;
const CURRENT_CYCLE_FILE = `${AGENTIC_DIR}/current-cycle.json`;
const REWORK_PLAN_FILE = `${AGENTIC_DIR}/rework-plan.md`;
const REWORK_PROMPT_FILE = `${AGENTIC_DIR}/rework-prompt.md`;
const VERIFY_RESULTS_FILE = `${AGENTIC_DIR}/verify-results.json`;
const VERIFY_RESULTS_MD = `${AGENTIC_DIR}/verify-results.md`;
const STALE_RUNTIME_FILES = [
  CLARIFICATION_FILE,
  CONVERSATION_STATE_FILE,
  TASK_GRAPH_FILE,
  EXECUTION_PLAN_FILE,
  SCHEDULER_DECISION_FILE,
  AGENT_ROSTER_FILE,
  REVIEWER_PLAN_FILE,
  REVIEW_PROMPTS_DIR,
  REVIEW_RESULTS_DIR,
  REVIEW_SUGGESTIONS_FILE,
  CONTEXT_ARTIFACTS_FILE,
  REVIEW_PACKET_FILE,
  REVIEW_PACKET_MD,
  ARBITRATOR_DECISION_FILE,
  ARBITRATOR_DECISION_MD,
  CYCLES_DIR,
  CYCLE_HISTORY_FILE,
  CYCLE_HISTORY_MD,
  CURRENT_CYCLE_FILE,
  REWORK_PLAN_FILE,
  REWORK_PROMPT_FILE,
  VERIFY_RESULTS_FILE,
  VERIFY_RESULTS_MD,
  'reports/odt/run-summary.json',
  'reports/odt/run-summary.md',
  'reports/odt/developer-review-plan.json',
  'reports/odt/developer-review-plan.md',
  'reports/odt/tech-design.json',
  'reports/odt/tech-design.md',
  'reports/odt/code-patch-plan.md',
  'reports/odt/unit-test-matrix.md',
  'reports/odt/compliance-mapping.md',
  'reports/odt/verify-checklist.json',
  'reports/odt/verify-checklist.md',
  'reports/odt/impact-ranked-files.json',
  'reports/odt/impact-ranked-files.md',
  'reports/odt/execute/prompt.md',
  'reports/odt/execute/bundle.json',
  'reports/odt/execute/status.json',
  'reports/odt/execute/apply-summary.json',
  'reports/odt/execute/apply-summary.md',
  'reports/odt/execute/agent-response.md',
  'reports/odt/execute/agent-launch.log',
  'reports/odt/execute/launch-agent.sh',
  'reports/dev-twin/summary.json',
  'reports/dev-twin/summary.md',
  'reports/dev-twin/code-workpack.md',
  'reports/dev-twin/codex-workpack.md',
  'reports/dev-twin/unit-test-workpack.md',
  'reports/dev-twin/impact-analysis.json',
  'reports/dev-twin/impact-analysis.md'
];
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);
const PROMPT_OVERRIDE_KEYS = ['intake', 'impact', 'design', 'code', 'unitTests', 'compliance', 'verify'];

function resolvePath(relPath, options = {}) {
  return resolveWorkspacePath(relPath, options);
}

function exists(relPath, options = {}) {
  return fs.existsSync(resolvePath(relPath, options));
}

function readJson(relPath, fallback, options = {}) {
  try {
    return JSON.parse(fs.readFileSync(resolvePath(relPath, options), 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function readText(relPath, fallback, options = {}) {
  try {
    return fs.readFileSync(resolvePath(relPath, options), 'utf8');
  } catch (error) {
    return fallback;
  }
}

function writeJson(relPath, payload, options = {}) {
  const abs = resolvePath(relPath, options);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function writeText(relPath, text, options = {}) {
  const abs = resolvePath(relPath, options);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${text}`, 'utf8');
}

function includesAny(text = '', signals = []) {
  const normalized = String(text || '').toLowerCase();
  return signals.some((signal) => normalized.includes(signal));
}

function normalizeClarificationStatus(question = {}) {
  const answer = typeof question.answer === 'string' ? question.answer.trim() : '';
  if (question.status === 'resolved' || question.status === 'blocked') return question.status;
  return answer ? 'answered' : 'open';
}

function summarizeClarificationState(questions = []) {
  const openQuestions = questions.filter((question) => normalizeClarificationStatus(question) === 'open');
  const unresolvedHigh = openQuestions.filter((question) => question.severity === 'high');

  return {
    total: questions.length,
    open: openQuestions.length,
    unresolvedHigh: unresolvedHigh.length,
    status: unresolvedHigh.length ? 'needs_input' : 'ready_to_continue',
    nextAction: unresolvedHigh.length
      ? 'Answer high-severity clarification questions before continuing delegated execution.'
      : 'Continue ODT planning or delegated execution.'
  };
}

function buildClarificationCandidate(id, stage, severity, question, why, answerFormat, options = {}) {
  return {
    id,
    stage,
    severity,
    question,
    why,
    answerFormat,
    suggestedAnswer: options.suggestedAnswer || '',
    answer: '',
    status: 'open'
  };
}

function hasActionableRequirement(text = '') {
  const value = String(text || '').toLowerCase();
  const meaningfulWords = value.split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  const hasAction = includesAny(value, [
    'add',
    'create',
    'introduce',
    'implement',
    'update',
    'change',
    'fix',
    'remove',
    'display',
    'show',
    'hide',
    'enable',
    'disable',
    'filter',
    'sort',
    'validate',
    'support'
  ]);
  const hasTarget = includesAny(value, [
    'dropdown',
    'button',
    'field',
    'form',
    'module',
    'activity',
    'screen',
    'page',
    'list',
    'table',
    'api',
    'service',
    'component',
    'test',
    'option',
    'status',
    'message'
  ]);
  return meaningfulWords.length >= 5 && (hasAction || hasTarget);
}

function hasAcceptanceSignal(intake = {}, text = '') {
  const acceptanceCriteria = (intake.requirements && intake.requirements.acceptanceCriteria) || [];
  if (acceptanceCriteria.length) return true;
  return hasActionableRequirement(text);
}

function needsVisualReferenceQuestion(text = '', mockupImages = [], referenceDocs = []) {
  if (mockupImages.length || referenceDocs.length) return false;
  const value = String(text || '').toLowerCase();
  const visualIntent = includesAny(value, [
    'mockup',
    'screenshot',
    'wireframe',
    'figma',
    'design',
    'pixel',
    'layout',
    'redesign',
    'new screen',
    'new page',
    'match',
    'visual',
    'responsive',
    'mobile',
    'desktop'
  ]);
  const simpleUiChange = includesAny(value, ['dropdown', 'option', 'label', 'copy', 'button', 'field'])
    && !includesAny(value, ['layout', 'redesign', 'screen', 'page', 'responsive', 'mobile', 'desktop']);
  return visualIntent && !simpleUiChange;
}

function needsDependencyPolicyQuestion(text = '', constraints = {}) {
  if (constraints.noNewDependencies || constraints.approvedLibrariesOnly) return false;
  return includesAny(text, [
    'add dependency',
    'new dependency',
    'install package',
    'npm install',
    'library',
    'sdk',
    'upgrade dependency',
    'replace dependency',
    'third party',
    'package.json'
  ]);
}

function needsTestScopeQuestion(text = '', nonFunctional = []) {
  if (nonFunctional.some((item) => includesAny(item, ['test', 'unit', 'regression']))) return false;
  const value = String(text || '').toLowerCase();
  return includesAny(value, [
    'critical',
    'payment',
    'security',
    'permission',
    'auth',
    'migration',
    'data loss',
    'regression risk',
    'edge case',
    'test coverage'
  ]);
}

function generateClarificationCandidates(intake = {}, repoStatus = {}) {
  const summary = String(intake.summary || '').trim();
  const reviewEdits = String(intake.reviewEdits || '').trim();
  const combinedText = `${summary}\n${reviewEdits}`;
  const acceptanceCriteria = (intake.requirements && intake.requirements.acceptanceCriteria) || [];
  const nonFunctional = (intake.requirements && intake.requirements.nonFunctional) || [];
  const designInputs = intake.designInputs || {};
  const referenceDocs = designInputs.referenceDocs || [];
  const mockupImages = designInputs.mockupImages || [];
  const workItemType = String(intake.workItemType || '').toLowerCase();
  const defectContext = intake.defectContext || {};
  const constraints = intake.constraints || {};
  const questions = [];

  if (!summary || summary.length < 20 || summary === 'Paste a new ticket to simulate the workflow.') {
    questions.push(buildClarificationCandidate(
      'intake-summary',
      'intake',
      'high',
      'What is the actual work item summary?',
      'ODT needs a concrete requirement before it can safely infer repo impact or create a delegated implementation prompt.',
      'One or two sentences describing the feature, defect, or remediation.'
    ));
  }

  if (!hasAcceptanceSignal(intake, combinedText)) {
    questions.push(buildClarificationCandidate(
      'intake-acceptance-criteria',
      'intake',
      'high',
      'What are the acceptance criteria?',
      'Without acceptance criteria, ODT cannot know when the implementation is complete or whether the agent drifted.',
      '3-7 bullet points, each written as an observable behavior.'
    ));
  }

  if (!repoStatus.path) {
    questions.push(buildClarificationCandidate(
      'repo-target-path',
      'impact',
      'high',
      'Which local repository should ODT analyze and modify?',
      'Agentic execution needs a target repo so file impact, tests, and write-scope controls are grounded.',
      'Absolute local repository path.'
    ));
  }

  if (workItemType === 'defect' && (!defectContext.observedBehavior || !defectContext.expectedBehavior)) {
    questions.push(buildClarificationCandidate(
      'defect-observed-expected',
      'intake',
      'high',
      'For this defect, what are the observed and expected behaviors?',
      'Defect fixes are risky when the agent only knows that something is broken but not the before/after behavior.',
      'Observed: ... Expected: ...'
    ));
  }

  if ((summary.length > 1600 || acceptanceCriteria.length > 7) && !includesAny(reviewEdits, ['split', 'phase', 'milestone', 'workstream'])) {
    questions.push(buildClarificationCandidate(
      'large-task-split',
      'planning',
      'medium',
      'Should ODT split this large task into milestones or workstreams before implementation?',
      'Large feature prompts are more likely to drift unless ODT decomposes them into ordered slices with separate verification.',
      'Yes, split into milestones / No, implement as one scoped change.',
      { suggestedAnswer: 'Yes, split into smaller implementation milestones before delegation.' }
    ));
  }

  if (needsVisualReferenceQuestion(combinedText, mockupImages, referenceDocs)) {
    questions.push(buildClarificationCandidate(
      'ui-reference',
      'design',
      'medium',
      'Is there a mockup, screenshot, or reference screen ODT should use?',
      'UI work can look technically correct but still miss layout, copy, and interaction intent without a visual reference.',
      'Attach a file or answer "No visual reference; infer from existing app patterns."'
    ));
  }

  if (includesAny(combinedText, ['backend is not ready', 'mock json', 'mock data', 'stub api', 'fixture'])) {
    questions.push(buildClarificationCandidate(
      'mock-data-policy',
      'design',
      'medium',
      'How should ODT handle mock or temporary backend data?',
      'Mock data can accidentally become production behavior unless the boundary is explicit.',
      'Use local fixture only / Add temporary service wrapper / Do not commit mock data.'
    ));
  }

  if (needsTestScopeQuestion(combinedText, nonFunctional)) {
    questions.push(buildClarificationCandidate(
      'test-scope',
      'unit-tests',
      'medium',
      'Which tests must be created or updated for this work?',
      'The agent should know the expected test surface before it edits code.',
      'Unit tests only / Unit + integration / Existing test names or paths.'
    ));
  }

  if (needsDependencyPolicyQuestion(combinedText, constraints)) {
    questions.push(buildClarificationCandidate(
      'dependency-policy',
      'compliance',
      'medium',
      'Can the implementation add or upgrade dependencies?',
      'Dependency changes affect security review, build stability, and enterprise approval.',
      'No new dependencies / Approved dependencies only / Dependency changes allowed with justification.'
    ));
  }

  return questions;
}

function buildClarifications(intake = {}, options = {}) {
  const targetRepoPath = getTargetRepoPath({ ...options, targetRepoPath: intake.targetRepoPath });
  const repoStatus = inspectRepoPath(targetRepoPath, intake);
  const previous = readJson(CLARIFICATION_FILE, null, options);
  const previousById = ((previous && previous.questions) || []).reduce((acc, question) => {
    acc[question.id] = question;
    return acc;
  }, {});

  const questions = generateClarificationCandidates(intake, repoStatus).map((question) => {
    const previousQuestion = previousById[question.id] || {};
    const answer = typeof previousQuestion.answer === 'string' ? previousQuestion.answer : question.answer;
    const merged = {
      ...question,
      answer,
      status: previousQuestion.status || question.status,
      updatedAt: previousQuestion.updatedAt || null
    };
    return {
      ...merged,
      status: normalizeClarificationStatus(merged)
    };
  });
  const summary = summarizeClarificationState(questions);

  return {
    generatedAt: new Date().toISOString(),
    status: summary.status,
    summary,
    questions
  };
}

function persistClarifications(intake = {}, options = {}) {
  const clarifications = buildClarifications(intake, options);
  writeJson(CLARIFICATION_FILE, clarifications, options);
  writeConversationState({
    phase: clarifications.status === 'needs_input' ? 'needs_input' : 'ready_to_continue',
    status: clarifications.status,
    nextAction: clarifications.summary.nextAction,
    updatedAt: clarifications.generatedAt
  }, options);
  return clarifications;
}

function updateClarificationAnswers(payload = {}, options = {}) {
  const current = readJson(CLARIFICATION_FILE, null, options) || persistClarifications(
    readJson('reports/dev-twin/intake.json', defaultIntake(), options),
    options
  );
  const answerMap = {};

  if (Array.isArray(payload.answers)) {
    payload.answers.forEach((item) => {
      if (item && item.id) answerMap[item.id] = String(item.answer || '');
    });
  }
  if (payload.id) {
    answerMap[payload.id] = String(payload.answer || '');
  }

  const answeredAt = new Date().toISOString();
  const questions = (current.questions || []).map((question) => {
    if (!Object.prototype.hasOwnProperty.call(answerMap, question.id)) {
      return {
        ...question,
        status: normalizeClarificationStatus(question)
      };
    }
    const next = {
      ...question,
      answer: answerMap[question.id],
      updatedAt: answeredAt
    };
    return {
      ...next,
      status: normalizeClarificationStatus(next)
    };
  });
  const summary = summarizeClarificationState(questions);
  const updated = {
    ...current,
    generatedAt: current.generatedAt || answeredAt,
    updatedAt: answeredAt,
    status: summary.status,
    summary,
    questions
  };

  writeJson(CLARIFICATION_FILE, updated, options);
  writeConversationState({
    phase: updated.status === 'needs_input' ? 'needs_input' : 'ready_to_continue',
    status: updated.status,
    nextAction: updated.summary.nextAction,
    updatedAt: answeredAt
  }, options);
  return updated;
}

function writeConversationState(state = {}, options = {}) {
  const current = readJson(CONVERSATION_STATE_FILE, {}, options) || {};
  const next = {
    ...current,
    ...state,
    updatedAt: state.updatedAt || new Date().toISOString()
  };
  writeJson(CONVERSATION_STATE_FILE, next, options);
  return next;
}

function chooseTaskKind(text = '') {
  const value = String(text || '').toLowerCase();
  if (includesAny(value, ['test', 'jest', 'rtl', 'unit', 'spec'])) return 'test';
  if (includesAny(value, ['keyboard', 'screen reader', 'aria', 'focus', 'accessibility', 'vpat', 'wcag'])) return 'accessibility';
  if (includesAny(value, ['dependency', 'security', 'vulnerability', 'compliance', 'policy'])) return 'compliance';
  if (includesAny(value, ['api', 'backend', 'service', 'mock', 'fixture', 'json'])) return 'integration';
  if (includesAny(value, ['field', 'form', 'button', 'dropdown', 'modal', 'panel', 'screen', 'page', 'display'])) return 'ui';
  return 'implementation';
}

function selectAllowedFiles(kind, candidateFiles = []) {
  if (!candidateFiles.length) return [];
  const tests = candidateFiles.filter((file) => /test|spec|__tests__/i.test(file));
  if (kind === 'test') return tests.length ? tests.slice(0, 8) : [];
  if (kind === 'accessibility') return candidateFiles.filter((file) => /\.(jsx|tsx|js|ts|html)$/i.test(file)).slice(0, 8);
  if (kind === 'compliance') return candidateFiles.filter((file) => /package|lock|config|policy|security/i.test(file)).slice(0, 8);
  return candidateFiles.slice(0, 8);
}

function buildTaskTitle(criterion = '', index = 0) {
  const compact = String(criterion || '').replace(/\s+/g, ' ').trim();
  if (!compact) return `Implementation slice ${index + 1}`;
  return compact.length > 96 ? `${compact.slice(0, 93)}...` : compact;
}

function buildTaskGraph(intake = {}, options = {}) {
  const generatedAt = new Date().toISOString();
  const impact = readJson('reports/dev-twin/impact-analysis.json', {}, options) || {};
  const requirements = intake.requirements || {};
  const criteria = Array.isArray(requirements.acceptanceCriteria) ? requirements.acceptanceCriteria : [];
  const candidateFiles = (impact.inference && Array.isArray(impact.inference.candidateFiles))
    ? impact.inference.candidateFiles
    : [];
  const baseTasks = criteria.length ? criteria : [intake.summary || intake.title || 'Implement requested work item'];
  const tasks = baseTasks.map((criterion, index) => {
    const kind = chooseTaskKind(criterion);
    const dependencies = index === 0 ? [] : [`task-${String(index).padStart(3, '0')}`];
    return {
      id: `task-${String(index + 1).padStart(3, '0')}`,
      title: buildTaskTitle(criterion, index),
      kind,
      status: 'planned',
      priority: index === 0 ? 'high' : 'medium',
      dependencies,
      acceptanceCriteria: [criterion],
      suggestedAgent: kind === 'test'
        ? 'Unit Test Reviewer'
        : kind === 'accessibility'
          ? 'Accessibility Reviewer'
          : kind === 'compliance'
            ? 'Security / Compliance Reviewer'
            : 'Main Developer',
      allowedFiles: selectAllowedFiles(kind, candidateFiles),
      verification: kind === 'test'
        ? ['Run targeted unit tests', 'Confirm failing path before fix if defect-driven']
        : kind === 'accessibility'
          ? ['Keyboard path review', 'Semantic labels and status messaging review']
          : ['Run affected unit tests', 'Review changed files and Git diff']
    };
  });
  const reviewTasks = [
    {
      id: 'review-architecture',
      title: 'Review implementation fit with repo patterns',
      kind: 'review',
      status: 'planned',
      priority: 'high',
      dependencies: tasks.map((task) => task.id),
      acceptanceCriteria: ['Implementation follows existing repo patterns and avoids unnecessary dependencies.'],
      suggestedAgent: 'Architecture Reviewer',
      allowedFiles: [],
      verification: ['Review diff for scope, reuse, naming, and compatibility']
    },
    {
      id: 'review-tests-a11y',
      title: 'Review tests and accessibility coverage',
      kind: 'review',
      status: 'planned',
      priority: 'high',
      dependencies: tasks.map((task) => task.id),
      acceptanceCriteria: ['Unit test and accessibility expectations are covered before final human review.'],
      suggestedAgent: 'Unit Test Reviewer + Accessibility Reviewer',
      allowedFiles: [],
      verification: ['Run tests', 'Check keyboard and assistive technology expectations']
    }
  ];

  return {
    generatedAt,
    status: 'planned',
    workItem: intake.title || intake.featureName || 'Untitled work item',
    candidateFiles: candidateFiles.slice(0, 12),
    tasks: [...tasks, ...reviewTasks]
  };
}

function buildExecutionPlan(taskGraph = {}, clarifications = {}) {
  const tasks = Array.isArray(taskGraph.tasks) ? taskGraph.tasks : [];
  const implementationTasks = tasks.filter((task) => task.id && task.id.startsWith('task-'));
  const blocked = clarifications && clarifications.summary && clarifications.summary.unresolvedHigh > 0;
  const firstTask = implementationTasks[0] || null;
  const parallelReviewTasks = tasks.filter((task) => task.kind === 'review');

  return {
    generatedAt: new Date().toISOString(),
    status: blocked ? 'blocked' : 'ready',
    currentCycle: 1,
    currentCycleLabel: 'Review Cycle 1',
    nextAction: blocked ? 'answer_clarifications' : (firstTask ? 'implement_first_slice' : 'review_intake'),
    recommendedFirstTaskId: firstTask ? firstTask.id : null,
    parallelLanes: blocked ? [] : [
      firstTask ? {
        lane: 'main-developer',
        agent: 'Main Developer',
        taskId: firstTask.id,
        task: firstTask.title,
        allowedFiles: firstTask.allowedFiles || []
      } : null,
      {
        lane: 'test-planner',
        agent: 'Unit Test Reviewer',
        task: 'Prepare test matrix while implementation slice is in progress.',
        allowedFiles: []
      }
    ].filter(Boolean),
    blockedTasks: blocked
      ? [{
        task: 'Delegated implementation',
        reason: 'High-severity clarification questions are unresolved.'
      }]
      : parallelReviewTasks.map((task) => ({
        task: task.title,
        reason: 'Wait for main implementation patch before reviewer execution.'
      })),
    humanQuestion: blocked ? 'Answer high-severity clarification questions before delegation.' : null
  };
}

function normalizeExecutionPlan(plan = null) {
  if (!plan || typeof plan !== 'object') return plan;
  const cycleValue = Number(plan.currentCycle || plan.currentEpoch || 1);
  const currentCycle = Number.isFinite(cycleValue) && cycleValue > 0 ? cycleValue : 1;
  const { currentEpoch, ...normalized } = plan;
  return {
    ...normalized,
    currentCycle,
    currentCycleLabel: normalized.currentCycleLabel || `Review Cycle ${currentCycle}`
  };
}

function reviewerAgentDefinitions() {
  return [
    {
      id: 'architecture-reviewer',
      name: 'Architecture Reviewer',
      mode: 'read_only',
      responsibility: 'Check repo fit, boundaries, reuse, naming, and dependency discipline.',
      output: 'reports/odt/agentic/reviews/architecture-review.json'
    },
    {
      id: 'unit-test-reviewer',
      name: 'Unit Test Reviewer',
      mode: 'read_only',
      responsibility: 'Check unit, integration, regression, and edge-case coverage.',
      output: 'reports/odt/agentic/reviews/unit-test-review.json'
    },
    {
      id: 'accessibility-reviewer',
      name: 'Accessibility Reviewer',
      mode: 'read_only',
      responsibility: 'Check keyboard flow, labels, focus, semantic structure, and result announcements.',
      output: 'reports/odt/agentic/reviews/accessibility-review.json'
    },
    {
      id: 'security-compliance-reviewer',
      name: 'Security / Compliance Reviewer',
      mode: 'read_only',
      responsibility: 'Check dependency, data handling, policy, and enterprise compliance risks.',
      output: 'reports/odt/agentic/reviews/security-compliance-review.json'
    },
    {
      id: 'build-verifier',
      name: 'Build Verifier',
      mode: 'verify_only',
      responsibility: 'Run or recommend install, lint, tests, build, and smoke checks.',
      output: 'reports/odt/agentic/reviews/build-verify.json'
    }
  ];
}

function buildAgentRoster(taskGraph = {}, executionPlan = {}, clarifications = {}) {
  const tasks = Array.isArray(taskGraph.tasks) ? taskGraph.tasks : [];
  const implementationTasks = tasks.filter((task) => task.id && task.id.startsWith('task-'));
  const blocked = executionPlan.status === 'blocked'
    || (clarifications && clarifications.summary && clarifications.summary.unresolvedHigh > 0);
  const reviewers = reviewerAgentDefinitions();

  return {
    generatedAt: new Date().toISOString(),
    status: blocked ? 'blocked' : 'ready',
    strategy: 'single_writer_parallel_reviewers',
    rules: [
      'Only Main Developer writes code by default.',
      'Reviewer agents stay read-only until a patch exists.',
      'Multiple code-writing agents require disjoint write scopes in the task graph.',
      'High-severity clarification questions block delegation.'
    ],
    agents: [
      {
        id: 'planner-scheduler',
        name: 'Planner / Scheduler',
        mode: 'plan_only',
        responsibility: 'Choose task order, parallel lanes, blockers, and next action.',
        currentTaskId: executionPlan.recommendedFirstTaskId || null,
        output: SCHEDULER_DECISION_FILE
      },
      {
        id: 'main-developer',
        name: 'Main Developer',
        mode: 'write',
        responsibility: 'Implement the first approved slice while respecting allowed write scope.',
        currentTaskId: executionPlan.recommendedFirstTaskId || (implementationTasks[0] && implementationTasks[0].id) || null,
        allowedFiles: (executionPlan.parallelLanes || [])
          .filter((lane) => lane.lane === 'main-developer')
          .flatMap((lane) => lane.allowedFiles || []),
        output: 'reports/odt/execute/agent-response.md'
      },
      ...reviewers
    ]
  };
}

function buildReviewerPlan(taskGraph = {}, executionPlan = {}) {
  const tasks = Array.isArray(taskGraph.tasks) ? taskGraph.tasks : [];
  const implementationTaskIds = tasks
    .filter((task) => task.id && task.id.startsWith('task-'))
    .map((task) => task.id);
  const blocked = executionPlan.status === 'blocked';

  return {
    generatedAt: new Date().toISOString(),
    status: blocked ? 'blocked' : 'waiting_for_main_developer_patch',
    trigger: 'main_developer_patch_completed',
    canRunInParallel: !blocked,
    waitsFor: implementationTaskIds,
    reviewers: reviewerAgentDefinitions().map((agent) => ({
      id: agent.id,
      name: agent.name,
      mode: agent.mode,
      responsibility: agent.responsibility,
      status: blocked ? 'blocked' : 'waiting',
      output: agent.output
    })),
    aggregator: {
      id: 'merge-arbitrator',
      name: 'Merge Arbitrator',
      status: blocked ? 'blocked' : 'waiting_for_reviewer_findings',
      responsibility: 'Combine reviewer findings and decide continue, ask human, rework, or ready for review.',
      output: 'reports/odt/agentic/arbitrator-decision.json'
    }
  };
}

function persistAgenticPlan(intake = {}, clarifications = {}, options = {}) {
  const taskGraph = buildTaskGraph(intake, options);
  const executionPlan = buildExecutionPlan(taskGraph, clarifications);
  const schedulerDecision = {
    generatedAt: new Date().toISOString(),
    status: executionPlan.status,
    decision: executionPlan.status === 'blocked' ? 'ask_human' : 'ready_for_delegate',
    reason: executionPlan.status === 'blocked'
      ? 'Critical clarification answers are missing.'
      : 'Task graph is ready. Start with the first implementation slice and keep reviewers parallel but read-only until a patch exists.',
    nextAction: executionPlan.nextAction,
    recommendedFirstTaskId: executionPlan.recommendedFirstTaskId
  };
  const agentRoster = buildAgentRoster(taskGraph, executionPlan, clarifications);
  const reviewerPlan = buildReviewerPlan(taskGraph, executionPlan);

  writeJson(TASK_GRAPH_FILE, taskGraph, options);
  writeJson(EXECUTION_PLAN_FILE, executionPlan, options);
  writeJson(SCHEDULER_DECISION_FILE, schedulerDecision, options);
  writeJson(AGENT_ROSTER_FILE, agentRoster, options);
  writeJson(REVIEWER_PLAN_FILE, reviewerPlan, options);

  return {
    taskGraph,
    executionPlan,
    schedulerDecision,
    agentRoster,
    reviewerPlan
  };
}

function runTargetGit(args = [], options = {}) {
  const targetRepoPath = getTargetRepoPath(options);
  if (!targetRepoPath) return '';
  try {
    return execFileSync('git', ['-C', targetRepoPath, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch (error) {
    return '';
  }
}

function changedFilesFromStatus(statusText = '') {
  return String(statusText || '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const rawPath = line.length >= 4 ? line.slice(3) : line;
      return rawPath.includes(' -> ') ? rawPath.split(' -> ').pop().trim() : rawPath.trim();
    })
    .filter(Boolean)
    .map((file) => file.replace(/^"|"$/g, ''));
}

function parseGitStatusEntries(statusText = '') {
  return String(statusText || '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const indexStatus = line.slice(0, 1);
      const worktreeStatus = line.slice(1, 2);
      const rawPath = line.length >= 4 ? line.slice(3) : line;
      const filePath = rawPath.includes(' -> ') ? rawPath.split(' -> ').pop().trim() : rawPath.trim();
      const untracked = line.startsWith('??');
      const staged = !untracked && indexStatus.trim() !== '';
      const unstaged = !untracked && worktreeStatus.trim() !== '';
      let status = 'modified';
      if (untracked) status = 'untracked';
      else if (indexStatus === 'A') status = 'added';
      else if (indexStatus === 'D' || worktreeStatus === 'D') status = 'deleted';
      else if (indexStatus === 'R') status = 'renamed';
      else if (indexStatus === 'C') status = 'copied';

      return {
        code: line.slice(0, 2),
        path: filePath.replace(/^"|"$/g, ''),
        rawPath,
        status,
        staged,
        unstaged,
        untracked
      };
    })
    .filter((entry) => entry.path);
}

function truncateText(text = '', max = 5000) {
  const value = String(text || '');
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n\n[truncated ${value.length - max} chars]`;
}

function normalizeSeverity(value = '') {
  const severity = String(value || '').toLowerCase();
  if (severity === 'high' || severity === 'medium' || severity === 'low') return severity;
  return 'low';
}

function scoreFindings(findings = []) {
  const high = findings.filter((item) => normalizeSeverity(item.severity) === 'high').length;
  const medium = findings.filter((item) => normalizeSeverity(item.severity) === 'medium').length;
  const low = findings.filter((item) => normalizeSeverity(item.severity) === 'low').length;
  return Math.max(1, 10 - (high * 3) - (medium * 2) - low);
}

function readTargetPackageJson(options = {}) {
  const targetRepoPath = getTargetRepoPath(options);
  if (!targetRepoPath) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(targetRepoPath, 'package.json'), 'utf8'));
  } catch (error) {
    return null;
  }
}

function buildVerificationCommandPlan(options = {}, payload = {}) {
  if (Array.isArray(payload.commands) && payload.commands.length) {
    return payload.commands
      .map((command, index) => {
        if (Array.isArray(command)) {
          return {
            id: `custom-${index + 1}`,
            label: `Custom command ${index + 1}`,
            command: command[0],
            args: command.slice(1),
            commandLine: command.join(' '),
            required: true,
            timeoutMs: 120000
          };
        }
        if (command && typeof command === 'object' && command.command) {
          return {
            id: command.id || `custom-${index + 1}`,
            label: command.label || `Custom command ${index + 1}`,
            command: command.command,
            args: Array.isArray(command.args) ? command.args : [],
            commandLine: [command.command, ...((Array.isArray(command.args) ? command.args : []))].join(' '),
            required: command.required !== false,
            timeoutMs: Number(command.timeoutMs) || 120000
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  const pkg = readTargetPackageJson(options);
  const scripts = pkg && pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {};
  const steps = [];
  if (scripts.lint) {
    steps.push({ id: 'lint', label: 'Lint', command: 'npm', args: ['run', 'lint'], commandLine: 'npm run lint', required: true, timeoutMs: 120000 });
  }
  if (scripts.test) {
    steps.push({ id: 'test', label: 'Unit Tests', command: 'npm', args: ['test'], commandLine: 'npm test', required: true, timeoutMs: 120000 });
  }
  if (scripts.build) {
    steps.push({ id: 'build', label: 'Build', command: 'npm', args: ['run', 'build'], commandLine: 'npm run build', required: true, timeoutMs: 180000 });
  }
  return steps;
}

function shellQuote(value = '') {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function safeNvmVersion(value = '') {
  const version = String(value || '').trim();
  return /^[A-Za-z0-9._/-]+$/.test(version) ? version : '';
}

function readProjectNodeVersion(targetRepoPath = '', options = {}) {
  const candidates = [
    targetRepoPath ? path.join(targetRepoPath, '.nvmrc') : '',
    path.join(getWorkspaceRoot(options), '.nvmrc')
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const version = safeNvmVersion(fs.readFileSync(candidate, 'utf8').trim());
      if (version) return version;
    } catch (error) {
      // Continue to the next candidate.
    }
  }
  return '';
}

function getProjectNodeRuntime(targetRepoPath = '', options = {}) {
  const requestedVersion = readProjectNodeVersion(targetRepoPath, options);
  if (!requestedVersion) {
    return {
      manager: 'process',
      requestedVersion: '',
      version: process.version,
      detail: 'Using the Node.js runtime that launched ODT.'
    };
  }

  try {
    const version = execFileSync('bash', ['-lc', `source "$HOME/.nvm/nvm.sh" && nvm exec --silent ${shellQuote(requestedVersion)} node -v`], {
      cwd: targetRepoPath || getWorkspaceRoot(options),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
      env: process.env
    }).trim();
    return {
      manager: 'nvm',
      requestedVersion,
      version: version || requestedVersion,
      detail: `.nvmrc requested Node.js ${requestedVersion}.`
    };
  } catch (error) {
    return {
      manager: 'nvm',
      requestedVersion,
      version: process.version,
      unavailable: true,
      detail: `.nvmrc requested Node.js ${requestedVersion}, but nvm could not run it. Falling back to ${process.version}.`
    };
  }
}

function buildVerificationInvocation(step = {}, targetRepoPath = '', runtime = {}) {
  if (runtime && runtime.manager === 'nvm' && runtime.requestedVersion && !runtime.unavailable) {
    const commandText = [step.command, ...((step.args || []))]
      .filter(Boolean)
      .map(shellQuote)
      .join(' ');
    return {
      command: 'bash',
      args: ['-lc', `source "$HOME/.nvm/nvm.sh" && nvm exec --silent ${shellQuote(runtime.requestedVersion)} ${commandText}`],
      commandLine: `nvm exec ${runtime.requestedVersion} ${step.commandLine || [step.command, ...((step.args || []))].filter(Boolean).join(' ')}`,
      runtimeManager: runtime.manager,
      nodeVersion: runtime.version
    };
  }

  return {
    command: step.command,
    args: step.args || [],
    commandLine: step.commandLine || [step.command, ...((step.args || []))].filter(Boolean).join(' '),
    runtimeManager: runtime.manager || 'process',
    nodeVersion: runtime.version || process.version
  };
}

function runVerificationCommand(step = {}, targetRepoPath = '', runtime = {}) {
  const startedAt = new Date();
  const invocation = buildVerificationInvocation(step, targetRepoPath, runtime);
  try {
    const stdout = execFileSync(invocation.command, invocation.args || [], {
      cwd: targetRepoPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: step.timeoutMs || 120000,
      env: process.env
    });
    return {
      ...step,
      commandLine: invocation.commandLine,
      runtimeManager: invocation.runtimeManager,
      nodeVersion: invocation.nodeVersion,
      status: 'passed',
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      exitCode: 0,
      stdout: truncateText(stdout || '', 5000),
      stderr: ''
    };
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : '';
    const stderr = error.stderr ? String(error.stderr) : (error.message || '');
    const combinedOutput = `${stdout}\n${stderr}`;
    const environmentFailure = /getRandomValues is not a function|web crypto|unsupported engine|node version|requires node/i.test(combinedOutput);
    return {
      ...step,
      commandLine: invocation.commandLine,
      runtimeManager: invocation.runtimeManager,
      nodeVersion: invocation.nodeVersion,
      status: 'failed',
      failureType: environmentFailure ? 'environment' : 'command_failure',
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      exitCode: typeof error.status === 'number' ? error.status : null,
      signal: error.signal || '',
      detail: environmentFailure
        ? `Verification was blocked by the local runtime or toolchain. Current Node.js runtime: ${process.version}.`
        : 'Verification command exited with a failure status.',
      stdout: truncateText(stdout, 5000),
      stderr: truncateText(stderr, 5000)
    };
  }
}

function ensureVerificationCycle(options = {}) {
  const existing = readJson(CURRENT_CYCLE_FILE, null, options);
  if (existing && existing.id) return existing;

  const cycleId = nextCycleId(options);
  const cycleNumber = Number(cycleId.replace(/^cycle-/, '')) || 1;
  const cycleDir = `${CYCLES_DIR}/${cycleId}`;
  const cycle = {
    id: cycleId,
    number: cycleNumber,
    generatedAt: new Date().toISOString(),
    label: `Review Cycle ${cycleNumber}`,
    status: 'verification_pending',
    decision: 'verification_only',
    readinessScore: 0,
    highFindings: 0,
    mediumFindings: 0,
    changedFiles: [],
    artifacts: {
      verifyResults: `${cycleDir}/verify-results.json`
    }
  };
  writeJson(`${cycleDir}/cycle.json`, cycle, options);
  writeJson(CURRENT_CYCLE_FILE, cycle, options);
  return cycle;
}

function buildVerificationMarkdown(results = {}) {
  const steps = Array.isArray(results.steps) ? results.steps : [];
  return `${[
    '# Verification Results',
    '',
    `- Status: ${results.status || 'unknown'}`,
    `- Review cycle: ${results.cycleLabel || results.cycleId || 'n/a'}`,
    `- Target repo: ${results.targetRepoPath || 'not selected'}`,
    `- Node.js: ${results.nodeVersion || process.version}`,
    `- Runtime manager: ${results.runtimeManager || 'process'}`,
    results.requestedNodeVersion ? `- Requested Node.js: ${results.requestedNodeVersion}` : '',
    results.runtimeDetail ? `- Runtime detail: ${results.runtimeDetail}` : '',
    `- Passed: ${results.summary ? results.summary.passed : 0}`,
    `- Failed: ${results.summary ? results.summary.failed : 0}`,
    `- Skipped: ${results.summary ? results.summary.skipped : 0}`,
    `- Environment/tooling failures: ${results.summary ? (results.summary.environmentFailures || 0) : 0}`,
    '',
    '## Commands',
    ...(steps.length ? steps.map((step) => [
      `### ${step.label || step.id || 'Command'} - ${String(step.status || 'unknown').toUpperCase()}`,
      '',
      `Command: \`${step.commandLine || [step.command, ...((step.args || []))].filter(Boolean).join(' ')}\``,
      `Duration: ${step.durationMs || 0} ms`,
      typeof step.exitCode === 'number' ? `Exit code: ${step.exitCode}` : '',
      step.detail || '',
      step.stderr ? `Stderr:\n\n\`\`\`text\n${truncateText(step.stderr, 1200)}\n\`\`\`` : '',
      step.stdout ? `Stdout:\n\n\`\`\`text\n${truncateText(step.stdout, 1200)}\n\`\`\`` : ''
    ].filter(Boolean).join('\n\n')) : ['- No verification commands were available.']),
    ''
  ].join('\n')}\n`;
}

function runVerificationEvidence(options = {}, payload = {}) {
  const targetRepoPath = getTargetRepoPath(options);
  const cycle = ensureVerificationCycle(options);
  const cycleDir = `${CYCLES_DIR}/${cycle.id}`;
  const runtime = getProjectNodeRuntime(targetRepoPath, options);
  const plannedSteps = targetRepoPath ? buildVerificationCommandPlan(options, payload) : [];
  const steps = plannedSteps.length
    ? plannedSteps.map((step) => runVerificationCommand(step, targetRepoPath, runtime))
    : [{
      id: targetRepoPath ? 'no-verification-scripts' : 'target-repo-missing',
      label: targetRepoPath ? 'Verification Scripts' : 'Target Repository',
      commandLine: targetRepoPath ? 'No lint/test/build scripts found in package.json' : 'No target repository selected',
      status: 'skipped',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      exitCode: null,
      detail: targetRepoPath
        ? 'ODT could not find lint, test, or build scripts to run automatically.'
        : 'Select a target repository before running verification.'
    }];
  const summary = {
    total: steps.length,
    passed: steps.filter((step) => step.status === 'passed').length,
    failed: steps.filter((step) => step.status === 'failed').length,
    skipped: steps.filter((step) => step.status === 'skipped').length,
    environmentFailures: steps.filter((step) => step.status === 'failed' && step.failureType === 'environment').length
  };
  const status = summary.failed
    ? (summary.environmentFailures === summary.failed ? 'blocked_environment' : 'failed')
    : (summary.passed ? 'passed' : 'skipped');
  const verificationResults = {
    generatedAt: new Date().toISOString(),
    status,
    targetRepoPath,
    nodeVersion: runtime.version,
    runtimeManager: runtime.manager,
    requestedNodeVersion: runtime.requestedVersion,
    runtimeDetail: runtime.detail,
    cycleId: cycle.id,
    cycleLabel: cycle.label,
    summary,
    steps
  };
  const updatedCycle = {
    ...cycle,
    updatedAt: verificationResults.generatedAt,
    verificationStatus: status,
    verificationSummary: summary,
    artifacts: {
      ...(cycle.artifacts || {}),
      verifyResults: `${cycleDir}/verify-results.json`
    }
  };
  const markdown = buildVerificationMarkdown(verificationResults);

  writeJson(VERIFY_RESULTS_FILE, verificationResults, options);
  writeText(VERIFY_RESULTS_MD, markdown, options);
  writeJson(`${cycleDir}/verify-results.json`, verificationResults, options);
  writeText(`${cycleDir}/verify-results.md`, markdown, options);
  writeJson(`${cycleDir}/cycle.json`, updatedCycle, options);
  writeJson(CURRENT_CYCLE_FILE, updatedCycle, options);
  const cycleHistory = persistCycleHistory(options);

  return {
    verificationResults,
    verificationMarkdown: markdown,
    currentCycle: updatedCycle,
    cycleHistory
  };
}

function buildReviewContext(options = {}) {
  const intake = readJson('reports/dev-twin/intake.json', defaultIntake(), options);
  const targetRepoPath = getTargetRepoPath({ ...options, targetRepoPath: options.targetRepoPath || intake.targetRepoPath });
  const repoOptions = { ...options, targetRepoPath };
  const taskGraph = readJson(TASK_GRAPH_FILE, null, options) || buildTaskGraph(intake, options);
  const executionPlan = normalizeExecutionPlan(readJson(EXECUTION_PLAN_FILE, null, options) || buildExecutionPlan(taskGraph, {}));
  const reviewerPlan = readJson(REVIEWER_PLAN_FILE, null, options) || buildReviewerPlan(taskGraph, executionPlan);
  const applySummary = readJson('reports/odt/execute/apply-summary.json', null, options);
  const verificationResults = readJson(VERIFY_RESULTS_FILE, null, options);
  const agentLaunch = getAgentLaunchStatus(options);
  const agentResponse = readText('reports/odt/execute/agent-response.md', '', options);
  const reviewerFindings = readJson(REVIEW_SUMMARY_FILE, null, options);
  const reviewSuggestions = buildReviewSuggestions(
    reviewerFindings || { reviewers: [] },
    readJson(REVIEW_SUGGESTIONS_FILE, null, options) || {}
  );
  const statusText = runTargetGit(['status', '--porcelain'], repoOptions);
  const diffText = runTargetGit(['diff', '--', '.'], repoOptions);
  const changedFiles = uniqStrings([
    ...changedFilesFromStatus(statusText),
    ...((applySummary && Array.isArray(applySummary.targets)) ? applySummary.targets : [])
  ]);
  const mainLane = Array.isArray(executionPlan.parallelLanes)
    ? executionPlan.parallelLanes.find((lane) => lane.lane === 'main-developer')
    : null;
  const allowedFiles = uniqStrings((mainLane && mainLane.allowedFiles) || []);
  const patchAvailable = Boolean(
    agentResponse.trim()
    || diffText.trim()
    || changedFiles.length
    || (applySummary && Array.isArray(applySummary.targets) && applySummary.targets.length)
  );

  return {
    generatedAt: new Date().toISOString(),
    workspaceRoot: getWorkspaceRoot(options),
    targetRepoPath,
    intake,
    taskGraph,
    executionPlan,
    reviewerPlan,
    applySummary,
    verificationResults,
    agentLaunch,
    agentResponse,
    reviewerFindings,
    reviewSuggestions,
    statusText,
    diffText,
    changedFiles,
    allowedFiles,
    patchAvailable
  };
}

function classifyReviewFile(filePath = '') {
  if (isTestLikeFile(filePath)) return 'test';
  if (/\.(jsx|tsx|js|ts|html|css|scss|sass)$/i.test(filePath)) return 'ui';
  if (/\.(java|kt|scala|rb|py|go|cs|php)$/i.test(filePath)) return 'backend';
  if (/\.(sql|ddl|dml|prisma|graphql)$/i.test(filePath) || /(^|\/)(migrations?|schema)\//i.test(filePath)) return 'data';
  if (/(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|pom\.xml|build\.gradle|Gemfile(\.lock)?|requirements\.txt|pyproject\.toml)$/i.test(filePath)) return 'dependency';
  return 'other';
}

function reviewRiskForFile(filePath = '', allowedFiles = []) {
  if (allowedFiles.length && !allowedFiles.includes(filePath) && !isTestLikeFile(filePath) && !isProjectRuntimeConfig(filePath)) {
    return 'out_of_scope';
  }
  if (classifyReviewFile(filePath) === 'dependency') return 'dependency_review';
  if (classifyReviewFile(filePath) === 'data') return 'schema_review';
  return 'normal';
}

function buildReviewPacketMarkdown(packet = {}) {
  const files = Array.isArray(packet.files) ? packet.files : [];
  return `${[
    '# ODT Review Packet',
    '',
    `- Status: ${packet.status || 'unknown'}`,
    `- Target repo: ${packet.targetRepoPath || 'not selected'}`,
    `- Generated: ${packet.generatedAt || ''}`,
    `- Changed files: ${packet.summary ? packet.summary.changedFiles : 0}`,
    `- Staged: ${packet.summary ? packet.summary.staged : 0}`,
    `- Unstaged: ${packet.summary ? packet.summary.unstaged : 0}`,
    `- Untracked: ${packet.summary ? packet.summary.untracked : 0}`,
    '',
    '## Files',
    ...(files.length ? files.map((file) => [
      `### ${file.path}`,
      '',
      `- Status: ${file.status}`,
      `- Kind: ${file.kind}`,
      `- Planned scope: ${file.inPlannedScope ? 'yes' : 'no'}`,
      `- Risk: ${file.reviewRisk}`
    ].join('\n')) : ['- No changed files detected.']),
    '',
    '## Diff Stat',
    packet.diffStat && packet.diffStat.staged ? '### Staged\n\n```text\n' + packet.diffStat.staged + '\n```' : '',
    packet.diffStat && packet.diffStat.unstaged ? '### Unstaged\n\n```text\n' + packet.diffStat.unstaged + '\n```' : '',
    (!packet.diffStat || (!packet.diffStat.staged && !packet.diffStat.unstaged)) ? '- No git diff stat available.' : '',
    '',
    '## Diff Preview',
    '```diff',
    truncateText(packet.diffPreview || 'No git diff available.', 6000),
    '```',
    ''
  ].filter((line) => line !== '').join('\n')}\n`;
}

function buildReviewPacket(options = {}) {
  const context = buildReviewContext(options);
  const targetRepoPath = context.targetRepoPath;
  const repoOptions = { ...options, targetRepoPath };
  const isGitRepo = detectGitRepo(targetRepoPath);

  if (!targetRepoPath || !isGitRepo) {
    return {
      generatedAt: new Date().toISOString(),
      status: targetRepoPath ? 'not_git_repo' : 'missing_repo',
      targetRepoPath,
      summary: {
        changedFiles: 0,
        staged: 0,
        unstaged: 0,
        untracked: 0,
        outOfScope: 0
      },
      files: [],
      diffStat: { staged: '', unstaged: '' },
      diffPreview: '',
      nextAction: targetRepoPath
        ? 'Initialize Git or review changed files directly in the target workspace.'
        : 'Select a target repository before reviewing changes.'
    };
  }

  const statusText = runTargetGit(['status', '--porcelain'], repoOptions);
  const statusEntries = parseGitStatusEntries(statusText);
  const stagedStat = runTargetGit(['diff', '--cached', '--stat', '--', '.'], repoOptions).trim();
  const unstagedStat = runTargetGit(['diff', '--stat', '--', '.'], repoOptions).trim();
  const stagedDiff = runTargetGit(['diff', '--cached', '--', '.'], repoOptions);
  const unstagedDiff = runTargetGit(['diff', '--', '.'], repoOptions);
  const allowedFiles = context.allowedFiles || [];
  const entryByPath = statusEntries.reduce((acc, entry) => {
    acc[entry.path] = entry;
    return acc;
  }, {});
  const files = uniqStrings([
    ...statusEntries.map((entry) => entry.path),
    ...context.changedFiles
  ]).map((filePath) => {
    const entry = entryByPath[filePath] || {};
    const reviewRisk = reviewRiskForFile(filePath, allowedFiles);
    return {
      path: filePath,
      status: entry.status || 'modified',
      code: entry.code || '',
      staged: Boolean(entry.staged),
      unstaged: Boolean(entry.unstaged),
      untracked: Boolean(entry.untracked),
      kind: classifyReviewFile(filePath),
      inPlannedScope: !allowedFiles.length || allowedFiles.includes(filePath) || isTestLikeFile(filePath) || isProjectRuntimeConfig(filePath),
      reviewRisk
    };
  });
  const summary = {
    changedFiles: files.length,
    staged: files.filter((file) => file.staged).length,
    unstaged: files.filter((file) => file.unstaged).length,
    untracked: files.filter((file) => file.untracked).length,
    outOfScope: files.filter((file) => file.reviewRisk === 'out_of_scope').length,
    dependency: files.filter((file) => file.reviewRisk === 'dependency_review').length,
    data: files.filter((file) => file.reviewRisk === 'schema_review').length
  };
  const status = files.length
    ? (summary.outOfScope || summary.dependency || summary.data ? 'needs_review' : 'changes_detected')
    : 'clean';

  return {
    generatedAt: new Date().toISOString(),
    status,
    targetRepoPath,
    summary,
    files,
    diffStat: {
      staged: stagedStat,
      unstaged: unstagedStat
    },
    diffPreview: truncateText([
      stagedDiff.trim() ? `# Staged diff\n${stagedDiff}` : '',
      unstagedDiff.trim() ? `# Unstaged diff\n${unstagedDiff}` : ''
    ].filter(Boolean).join('\n\n'), 12000),
    nextAction: files.length
      ? 'Review changed files, reviewer findings, and verification evidence before approval.'
      : 'No target repo changes detected yet. Launch implementation or point ODT at the repo with the patch.'
  };
}

function persistReviewPacket(options = {}) {
  const packet = buildReviewPacket(options);
  writeJson(REVIEW_PACKET_FILE, packet, options);
  writeText(REVIEW_PACKET_MD, buildReviewPacketMarkdown(packet), options);
  return packet;
}

function buildReviewerPrompt(agent = {}, context = {}) {
  const tasks = Array.isArray(context.taskGraph.tasks) ? context.taskGraph.tasks : [];
  return [
    `# ${agent.name || agent.id} Prompt`,
    '',
    'You are a read-only reviewer in Oracle Developer Twin.',
    '',
    '## Responsibility',
    agent.responsibility || 'Review the current implementation and report risks.',
    '',
    '## Rules',
    '- Do not edit files.',
    '- Report findings as high, medium, or low severity.',
    '- Tie findings to changed files and acceptance criteria where possible.',
    '- Prefer actionable recommendations over generic advice.',
    '',
    '## Work Item',
    `- Title: ${context.intake.title || context.intake.featureName || 'Untitled work item'}`,
    `- Target repo: ${context.targetRepoPath || 'not selected'}`,
    '',
    '## Planned Tasks',
    ...(tasks.length ? tasks.map((task) => `- ${task.id}: ${task.title}`) : ['- No task graph available.']),
    '',
    '## Allowed Write Scope',
    ...(context.allowedFiles.length ? context.allowedFiles.map((file) => `- ${file}`) : ['- No explicit allowed file scope was generated.']),
    '',
    '## Changed Files',
    ...(context.changedFiles.length ? context.changedFiles.map((file) => `- ${file}`) : ['- No changed files detected.']),
    '',
    '## Current Git Diff Preview',
    '```diff',
    truncateText(context.diffText || 'No git diff available.', 6000),
    '```',
    '',
    '## Agent Response Preview',
    '```md',
    truncateText(context.agentResponse || 'No delegated agent response file found.', 3000),
    '```',
    ''
  ].join('\n');
}

function finding(severity, title, detail, options = {}) {
  return {
    severity,
    title,
    detail,
    recommendation: options.recommendation || '',
    files: options.files || []
  };
}

function isTestLikeFile(file = '') {
  return /(^|\/)(tests?|__tests__)\/|(\.test|\.spec)\.[jt]sx?$|\.spec\.md$/i.test(String(file || ''));
}

function isProjectRuntimeConfig(file = '') {
  return /(^|\/)(\.nvmrc|\.node-version)$/i.test(String(file || ''));
}

function reviewArchitecture(context = {}) {
  const findings = [];
  const outOfScopeFiles = context.allowedFiles.length
    ? context.changedFiles.filter((file) => !context.allowedFiles.includes(file) && !isTestLikeFile(file) && !isProjectRuntimeConfig(file))
    : [];

  if (!context.patchAvailable) {
    findings.push(finding(
      'medium',
      'No implementation patch is available yet',
      'The architecture reviewer is waiting for a main developer patch before it can validate repo fit.',
      { recommendation: 'Run the Main Developer agent, then rerun the reviewer swarm.' }
    ));
  }
  if (outOfScopeFiles.length) {
    findings.push(finding(
      'high',
      'Changed files fall outside the planned write scope',
      `${outOfScopeFiles.length} changed file(s) are not in the main developer allowed file list.`,
      {
        recommendation: 'Confirm the planner scope or move these changes into an approved task before final review.',
        files: outOfScopeFiles
      }
    ));
  }
  if (context.changedFiles.length > 12) {
    findings.push(finding(
      'medium',
      'Large patch footprint',
      `The patch touches ${context.changedFiles.length} files, which raises review and regression risk.`,
      { recommendation: 'Consider splitting the work into smaller planner slices.' }
    ));
  }
  if (!findings.length) {
    findings.push(finding(
      'low',
      'Architecture review passed initial scope checks',
      'Changed files are within the planned footprint and no large-blast-radius concern was detected.',
      { recommendation: 'Proceed to test, accessibility, and compliance review.' }
    ));
  }
  return findings;
}

function reviewUnitTests(context = {}) {
  const testFiles = context.changedFiles.filter((file) => isTestLikeFile(file));
  const sourceFiles = context.changedFiles.filter((file) => /\.(jsx|tsx|js|ts)$/i.test(file) && !testFiles.includes(file));
  const findings = [];

  if (!context.patchAvailable) {
    findings.push(finding(
      'medium',
      'No implementation patch is available for test review',
      'The test reviewer can prepare expectations, but cannot validate coverage until code exists.',
      { recommendation: 'Run the Main Developer agent, then rerun reviewer checks.' }
    ));
  } else if (sourceFiles.length && !testFiles.length) {
    findings.push(finding(
      'medium',
      'No test files changed with source changes',
      'Source files changed, but no nearby unit, integration, or regression test changes were detected.',
      {
        recommendation: 'Add or update deterministic tests for the changed behavior.',
        files: sourceFiles
      }
    ));
  }
  if (testFiles.length) {
    findings.push(finding(
      'low',
      'Test files changed',
      `${testFiles.length} test-related file(s) changed.`,
      {
        recommendation: 'Run the targeted test command and confirm the assertions cover acceptance criteria.',
        files: testFiles
      }
    ));
  }
  return findings.length ? findings : [
    finding('low', 'No test coverage concern detected', 'No obvious test coverage issue was detected from changed files.', {
      recommendation: 'Still run the repo test command before final review.'
    })
  ];
}

function reviewAccessibility(context = {}) {
  const uiFiles = context.changedFiles.filter((file) => /\.(jsx|tsx|html|css)$/i.test(file));
  const diff = context.diffText || '';
  const findings = [];

  if (!context.patchAvailable) {
    findings.push(finding(
      'medium',
      'No UI patch is available for accessibility review',
      'Accessibility checks need the implemented UI diff.',
      { recommendation: 'Run the Main Developer agent, then rerun the reviewer swarm.' }
    ));
  }
  if (uiFiles.length && /onClick=|onClick\s*=/.test(diff) && !/onKeyDown=|onKeyUp=|role=|aria-|<button/i.test(diff)) {
    findings.push(finding(
      'medium',
      'Clickable UI changes need keyboard and semantic confirmation',
      'The diff appears to add click handling without an obvious keyboard or semantic companion in the same patch preview.',
      {
        recommendation: 'Confirm native buttons, keyboard reachability, focus order, and accessible names.',
        files: uiFiles
      }
    ));
  }
  if (uiFiles.length && !/aria-live|role=["']status|screen.reader|assistive|keyboard/i.test(diff)) {
    findings.push(finding(
      'low',
      'Result announcements are not visible in the patch preview',
      'The UI patch may still be valid, but no explicit live region or status messaging was visible in the diff preview.',
      {
        recommendation: 'Confirm screen-reader users receive meaningful updates for dynamic changes.',
        files: uiFiles
      }
    ));
  }
  return findings.length ? findings : [
    finding('low', 'Accessibility review found no obvious blocker', 'No immediate keyboard, semantics, or status messaging blocker was detected from the diff preview.', {
      recommendation: 'Perform a keyboard pass and inspect accessible names before final approval.'
    })
  ];
}

function reviewSecurityCompliance(context = {}) {
  const dependencyFiles = context.changedFiles.filter((file) => /(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock)$/i.test(file));
  const diff = context.diffText || '';
  const findings = [];

  if (dependencyFiles.length) {
    findings.push(finding(
      'medium',
      'Dependency files changed',
      'Package or lock files changed and need explicit dependency approval.',
      {
        recommendation: 'Confirm the dependency change is approved and documented before merge.',
        files: dependencyFiles
      }
    ));
  }
  if (/(password|secret|token|api[_-]?key)\s*[:=]/i.test(diff)) {
    findings.push(finding(
      'high',
      'Possible secret-like value in diff',
      'The diff preview contains a token/password/key-shaped assignment.',
      { recommendation: 'Remove secrets from code and use approved configuration or secret storage.' }
    ));
  }
  if (/localStorage|sessionStorage/i.test(diff)) {
    findings.push(finding(
      'medium',
      'Browser storage usage changed',
      'Browser storage can create privacy or stale-state issues if sensitive data is stored.',
      { recommendation: 'Confirm no sensitive data is stored and cleanup behavior is defined.' }
    ));
  }
  return findings.length ? findings : [
    finding('low', 'No dependency or secret risk detected', 'No dependency, obvious secret, or browser-storage risk was detected from the diff preview.', {
      recommendation: 'Continue normal compliance review.'
    })
  ];
}

function reviewBuildVerification(context = {}) {
  const verify = context.applySummary && Array.isArray(context.applySummary.verify)
    ? context.applySummary.verify
    : [];
  const recorded = context.verificationResults && Array.isArray(context.verificationResults.steps)
    ? context.verificationResults.steps
    : [];
  const evidence = recorded.length ? recorded : verify;
  const failed = evidence.filter((item) => item.status === 'failed');
  const passed = evidence.filter((item) => item.status === 'passed');
  const environmentFailures = failed.filter((item) => item.failureType === 'environment');
  const findings = [];

  if (failed.length && environmentFailures.length === failed.length) {
    findings.push(finding(
      'medium',
      'Verification blocked by local environment',
      `${failed.length} verification step(s) failed because the local runtime or toolchain could not execute them.`,
      {
        recommendation: 'Fix the local runtime/tooling or rerun verification in a supported environment before final review.',
        files: []
      }
    ));
  } else if (failed.length) {
    findings.push(finding(
      'high',
      'Verification command failed',
      `${failed.length} verification step(s) failed in the latest verification evidence.`,
      {
        recommendation: 'Fix failed checks or document environmental failures before final review.',
        files: []
      }
    ));
  } else if (passed.length) {
    findings.push(finding(
      'low',
      'Verification commands passed',
      `${passed.length} verification step(s) were recorded without failure.`,
      { recommendation: 'Include verification evidence in final review.' }
    ));
  } else if (evidence.length) {
    findings.push(finding(
      'medium',
      'Verification commands were skipped',
      'Verification evidence exists, but no automated lint, test, or build command was executed.',
      { recommendation: 'Run manual checks or add target repo verification scripts before final review.' }
    ));
  } else {
    findings.push(finding(
      'medium',
      'No verification evidence recorded',
      'No test, lint, build, or smoke verification output was found in the execute summary.',
      { recommendation: 'Run targeted tests and build checks before final review.' }
    ));
  }
  return findings;
}

function runReviewerForAgent(agent = {}, context = {}) {
  const reviewers = {
    'architecture-reviewer': reviewArchitecture,
    'unit-test-reviewer': reviewUnitTests,
    'accessibility-reviewer': reviewAccessibility,
    'security-compliance-reviewer': reviewSecurityCompliance,
    'build-verifier': reviewBuildVerification
  };
  const reviewFn = reviewers[agent.id] || (() => [
    finding('low', 'Reviewer executed', 'No specialized checks were configured for this reviewer.')
  ]);
  const findings = reviewFn(context);
  const high = findings.filter((item) => normalizeSeverity(item.severity) === 'high').length;
  const medium = findings.filter((item) => normalizeSeverity(item.severity) === 'medium').length;
  const score = scoreFindings(findings);

  return {
    generatedAt: new Date().toISOString(),
    id: agent.id,
    name: agent.name,
    mode: agent.mode,
    status: context.patchAvailable ? 'completed' : 'waiting_for_main_developer_patch',
    score,
    summary: `${high} high, ${medium} medium, ${findings.length - high - medium} low finding(s).`,
    findings,
    prompt: `${REVIEW_PROMPTS_DIR}/${agent.id}.md`,
    output: agent.output
  };
}

function buildReviewerMarkdown(result = {}) {
  const lines = [
    `# ${result.name || result.id} Findings`,
    '',
    `- Status: ${result.status || 'unknown'}`,
    `- Score: ${result.score || 'n/a'}`,
    `- Summary: ${result.summary || ''}`,
    '',
    '## Findings',
    ...((result.findings || []).map((item) => [
      `### ${String(item.severity || 'low').toUpperCase()}: ${item.title}`,
      '',
      item.detail || '',
      item.recommendation ? `Recommendation: ${item.recommendation}` : '',
      item.files && item.files.length ? `Files: ${item.files.join(', ')}` : ''
    ].filter(Boolean).join('\n\n')))
  ];
  return `${lines.join('\n')}\n`;
}

function buildArbitratorDecision(results = [], context = {}) {
  const allFindings = results.flatMap((result) => result.findings || []);
  const high = allFindings.filter((item) => normalizeSeverity(item.severity) === 'high').length;
  const medium = allFindings.filter((item) => normalizeSeverity(item.severity) === 'medium').length;
  const averageScore = results.length
    ? Math.round(results.reduce((sum, result) => sum + (Number(result.score) || 0), 0) / results.length)
    : 0;
  const decision = !context.patchAvailable
    ? 'waiting_for_main_developer_patch'
    : high > 0
      ? 'rework_required'
      : medium > 2
        ? 'human_review_with_cautions'
        : 'ready_for_human_review';

  return {
    generatedAt: new Date().toISOString(),
    status: decision,
    decision,
    readinessScore: averageScore,
    highFindings: high,
    mediumFindings: medium,
    reviewerCount: results.length,
    changedFiles: context.changedFiles,
    reason: !context.patchAvailable
      ? 'Reviewer agents are waiting for a main developer patch.'
      : high > 0
        ? 'High-severity reviewer findings require rework before final review.'
        : medium > 2
          ? 'Several medium-severity findings need human attention before approval.'
          : 'No high-severity reviewer findings were detected.',
    nextAction: !context.patchAvailable
      ? 'Run or attach the main developer patch, then rerun reviewer swarm.'
      : high > 0
        ? 'Send focused rework instructions to the Main Developer.'
        : 'Proceed to human diff review with reviewer findings visible.'
  };
}

function buildArbitratorMarkdown(decision = {}, results = []) {
  return `${[
    '# Merge Arbitrator Decision',
    '',
    `- Decision: ${decision.decision || 'unknown'}`,
    `- Readiness score: ${decision.readinessScore || 0}/10`,
    `- High findings: ${decision.highFindings || 0}`,
    `- Medium findings: ${decision.mediumFindings || 0}`,
    `- Reason: ${decision.reason || ''}`,
    `- Next action: ${decision.nextAction || ''}`,
    '',
    '## Reviewer Scores',
    ...results.map((result) => `- ${result.name}: ${result.score}/10 (${result.summary})`),
    ''
  ].join('\n')}\n`;
}

function cycleIdFromNumber(value) {
  return `cycle-${String(value).padStart(3, '0')}`;
}

function nextCycleId(options = {}) {
  const abs = resolvePath(CYCLES_DIR, options);
  try {
    const existing = fs.readdirSync(abs)
      .map((item) => {
        const match = /^cycle-(\d+)$/i.exec(item);
        return match ? Number(match[1]) : 0;
      })
      .filter(Boolean);
    return cycleIdFromNumber((existing.length ? Math.max(...existing) : 0) + 1);
  } catch (error) {
    return cycleIdFromNumber(1);
  }
}

function readCycleArtifacts(cycleId = '', options = {}) {
  if (!cycleId) return {};
  const cycleDir = `${CYCLES_DIR}/${cycleId}`;
  return {
    cycle: readJson(`${cycleDir}/cycle.json`, null, options),
    reviewerFindings: readJson(`${cycleDir}/reviewer-findings.json`, null, options),
    arbitratorDecision: readJson(`${cycleDir}/arbitrator-decision.json`, null, options),
    verificationResults: readJson(`${cycleDir}/verify-results.json`, null, options)
  };
}

function findingCountsFromReviewers(reviewerFindings = {}) {
  const reviewers = Array.isArray(reviewerFindings.reviewers) ? reviewerFindings.reviewers : [];
  const findings = reviewers.flatMap((reviewer) => Array.isArray(reviewer.findings) ? reviewer.findings : []);
  return {
    high: findings.filter((item) => normalizeSeverity(item.severity) === 'high').length,
    medium: findings.filter((item) => normalizeSeverity(item.severity) === 'medium').length,
    low: findings.filter((item) => normalizeSeverity(item.severity) === 'low').length
  };
}

function buildCycleHistory(options = {}) {
  const cyclesRoot = resolvePath(CYCLES_DIR, options);
  let cycleIds = [];
  try {
    cycleIds = fs.readdirSync(cyclesRoot)
      .filter((item) => /^cycle-\d+$/i.test(item))
      .sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));
  } catch (error) {
    cycleIds = [];
  }

  const cycles = cycleIds.map((cycleId) => {
    const artifacts = readCycleArtifacts(cycleId, options);
    const cycle = artifacts.cycle || {};
    const decision = artifacts.arbitratorDecision || {};
    const verification = artifacts.verificationResults || {};
    const counts = findingCountsFromReviewers(artifacts.reviewerFindings || {});
    const readinessScore = Number(cycle.readinessScore || decision.readinessScore || 0);
    const verificationSummary = cycle.verificationSummary || verification.summary || null;
    return {
      id: cycle.id || cycleId,
      number: Number(cycle.number || cycleId.replace(/\D/g, '')) || 0,
      label: cycle.label || `Review Cycle ${Number(cycleId.replace(/\D/g, '')) || ''}`.trim(),
      generatedAt: cycle.generatedAt || decision.generatedAt || verification.generatedAt || '',
      updatedAt: cycle.updatedAt || verification.generatedAt || decision.generatedAt || '',
      status: cycle.status || decision.status || 'unknown',
      decision: cycle.decision || decision.decision || 'unknown',
      readinessScore,
      highFindings: Number(cycle.highFindings || decision.highFindings || counts.high || 0),
      mediumFindings: Number(cycle.mediumFindings || decision.mediumFindings || counts.medium || 0),
      lowFindings: counts.low,
      verificationStatus: cycle.verificationStatus || verification.status || '',
      verificationSummary,
      changedFileCount: Array.isArray(cycle.changedFiles) ? cycle.changedFiles.length : 0,
      artifacts: {
        ...(cycle.artifacts || {}),
        cycle: `${CYCLES_DIR}/${cycleId}/cycle.json`,
        reviewerFindings: `${CYCLES_DIR}/${cycleId}/reviewer-findings.json`,
        arbitratorDecision: `${CYCLES_DIR}/${cycleId}/arbitrator-decision.json`,
        reworkPlan: `${CYCLES_DIR}/${cycleId}/rework-plan.md`,
        reworkPrompt: `${CYCLES_DIR}/${cycleId}/rework-prompt.md`,
        verifyResults: `${CYCLES_DIR}/${cycleId}/verify-results.json`
      }
    };
  });

  const latest = cycles[cycles.length - 1] || null;
  const previous = cycles.length > 1 ? cycles[cycles.length - 2] : null;
  const scores = cycles.map((cycle) => cycle.readinessScore).filter((score) => Number.isFinite(score));
  const summary = {
    total: cycles.length,
    latestCycleId: latest ? latest.id : '',
    latestDecision: latest ? latest.decision : 'not_run',
    latestReadinessScore: latest ? latest.readinessScore : 0,
    latestVerificationStatus: latest ? latest.verificationStatus || 'not_run' : 'not_run',
    readinessDelta: latest && previous ? latest.readinessScore - previous.readinessScore : 0,
    bestReadinessScore: scores.length ? Math.max(...scores) : 0,
    cyclesWithHighFindings: cycles.filter((cycle) => cycle.highFindings > 0).length,
    cyclesWithFailedVerification: cycles.filter((cycle) => ['failed', 'blocked_environment'].includes(cycle.verificationStatus)).length
  };

  return {
    generatedAt: new Date().toISOString(),
    status: cycles.length ? 'ready' : 'empty',
    summary,
    cycles
  };
}

function buildCycleHistoryMarkdown(history = {}) {
  const cycles = Array.isArray(history.cycles) ? history.cycles : [];
  const summary = history.summary || {};
  return `${[
    '# Review Cycle History',
    '',
    `- Total cycles: ${summary.total || 0}`,
    `- Latest cycle: ${summary.latestCycleId || 'n/a'}`,
    `- Latest decision: ${summary.latestDecision || 'not_run'}`,
    `- Latest readiness: ${summary.latestReadinessScore || 0}/10`,
    `- Latest verification: ${summary.latestVerificationStatus || 'not_run'}`,
    `- Readiness delta: ${summary.readinessDelta || 0}`,
    '',
    '## Cycles',
    ...(cycles.length ? cycles.map((cycle) => [
      `### ${cycle.label || cycle.id}`,
      '',
      `- Decision: ${cycle.decision || 'unknown'}`,
      `- Readiness: ${cycle.readinessScore || 0}/10`,
      `- Findings: ${cycle.highFindings || 0} high, ${cycle.mediumFindings || 0} medium, ${cycle.lowFindings || 0} low`,
      `- Verification: ${cycle.verificationStatus || 'not_run'}`,
      `- Changed files: ${cycle.changedFileCount || 0}`
    ].join('\n')) : ['- No review cycles recorded yet.']),
    ''
  ].join('\n')}\n`;
}

function persistCycleHistory(options = {}) {
  const history = buildCycleHistory(options);
  writeJson(CYCLE_HISTORY_FILE, history, options);
  writeText(CYCLE_HISTORY_MD, buildCycleHistoryMarkdown(history), options);
  return history;
}

function reviewSuggestionId(reviewer = {}, findingItem = {}, index = 0) {
  const reviewerId = String(reviewer.id || reviewer.name || 'reviewer')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 44) || 'reviewer';
  const titleSlug = String(findingItem.title || 'finding')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56) || 'finding';
  return `${reviewerId}-${index + 1}-${titleSlug}`;
}

function normalizeReviewDecision(value = '') {
  const decision = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['accepted', 'rejected', 'needs_rework', 'ignored'].includes(decision)) return decision;
  return 'pending';
}

function flattenReviewSuggestions(reviewerFindings = {}) {
  const reviewers = Array.isArray(reviewerFindings.reviewers) ? reviewerFindings.reviewers : [];
  return reviewers.flatMap((reviewer) => {
    const findings = Array.isArray(reviewer.findings) ? reviewer.findings : [];
    return findings.map((findingItem, index) => ({
      id: reviewSuggestionId(reviewer, findingItem, index),
      reviewerId: reviewer.id || '',
      reviewerName: reviewer.name || reviewer.id || 'Reviewer',
      findingIndex: index,
      severity: normalizeSeverity(findingItem.severity),
      title: findingItem.title || 'Reviewer finding',
      detail: findingItem.detail || '',
      sourceRecommendation: findingItem.recommendation || '',
      files: Array.isArray(findingItem.files) ? findingItem.files : [],
      decision: 'pending',
      suggestion: findingItem.recommendation || '',
      note: '',
      updatedAt: ''
    }));
  });
}

function summarizeReviewSuggestions(suggestions = []) {
  return {
    total: suggestions.length,
    pending: suggestions.filter((item) => normalizeReviewDecision(item.decision) === 'pending').length,
    accepted: suggestions.filter((item) => normalizeReviewDecision(item.decision) === 'accepted').length,
    needsRework: suggestions.filter((item) => normalizeReviewDecision(item.decision) === 'needs_rework').length,
    rejected: suggestions.filter((item) => normalizeReviewDecision(item.decision) === 'rejected').length,
    ignored: suggestions.filter((item) => normalizeReviewDecision(item.decision) === 'ignored').length
  };
}

function buildReviewSuggestions(reviewerFindings = {}, existing = {}) {
  const existingItems = Array.isArray(existing.suggestions) ? existing.suggestions : [];
  const existingById = new Map(existingItems.map((item) => [item.id, item]));
  const seeds = flattenReviewSuggestions(reviewerFindings);
  const suggestions = (seeds.length ? seeds : existingItems).map((seed) => {
    const previous = existingById.get(seed.id) || {};
    return {
      ...seed,
      decision: normalizeReviewDecision(previous.decision || seed.decision),
      suggestion: typeof previous.suggestion === 'string' ? previous.suggestion : (seed.suggestion || ''),
      note: typeof previous.note === 'string' ? previous.note : '',
      updatedAt: previous.updatedAt || seed.updatedAt || ''
    };
  });

  return {
    generatedAt: existing.generatedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: suggestions.length ? 'ready' : 'empty',
    cycleId: existing.cycleId || '',
    summary: summarizeReviewSuggestions(suggestions),
    suggestions
  };
}

function writeReviewSuggestionsToCurrentCycle(reviewSuggestions = {}, options = {}) {
  const currentCycle = readJson(CURRENT_CYCLE_FILE, null, options);
  if (!currentCycle || !currentCycle.id) return;
  writeJson(`${CYCLES_DIR}/${currentCycle.id}/review-suggestions.json`, {
    ...reviewSuggestions,
    cycleId: currentCycle.id
  }, options);
}

function persistReviewSuggestions(reviewerFindings = {}, options = {}) {
  const existing = readJson(REVIEW_SUGGESTIONS_FILE, null, options) || {};
  const reviewSuggestions = buildReviewSuggestions(reviewerFindings, existing);
  writeJson(REVIEW_SUGGESTIONS_FILE, reviewSuggestions, options);
  writeReviewSuggestionsToCurrentCycle(reviewSuggestions, options);
  return reviewSuggestions;
}

function updateReviewSuggestions(payload = {}, options = {}) {
  const reviewerFindings = readJson(REVIEW_SUMMARY_FILE, null, options) || { reviewers: [] };
  const existing = readJson(REVIEW_SUGGESTIONS_FILE, null, options) || {};
  const current = buildReviewSuggestions(reviewerFindings, existing);
  const updates = Array.isArray(payload.suggestions) ? payload.suggestions : [];
  const updatesById = new Map(updates.map((item) => [String(item.id || ''), item]));
  const suggestions = current.suggestions.map((item) => {
    const update = updatesById.get(item.id);
    if (!update) return item;
    return {
      ...item,
      decision: normalizeReviewDecision(update.decision || item.decision),
      suggestion: typeof update.suggestion === 'string' ? update.suggestion : item.suggestion,
      note: typeof update.note === 'string' ? update.note : item.note,
      updatedAt: new Date().toISOString()
    };
  });
  const updated = {
    ...current,
    updatedAt: new Date().toISOString(),
    status: suggestions.length ? 'ready' : 'empty',
    summary: summarizeReviewSuggestions(suggestions),
    suggestions
  };
  writeJson(REVIEW_SUGGESTIONS_FILE, updated, options);
  writeReviewSuggestionsToCurrentCycle(updated, options);
  return updated;
}

function actionableReviewSuggestions(reviewSuggestions = {}) {
  return (Array.isArray(reviewSuggestions.suggestions) ? reviewSuggestions.suggestions : [])
    .filter((item) => ['accepted', 'needs_rework'].includes(normalizeReviewDecision(item.decision)))
    .slice(0, 20);
}

function importantFindings(results = []) {
  const severityRank = { high: 0, medium: 1, low: 2 };
  return results
    .flatMap((result) => (result.findings || []).map((item) => ({
      ...item,
      reviewer: result.name || result.id
    })))
    .sort((a, b) => (severityRank[normalizeSeverity(a.severity)] || 3) - (severityRank[normalizeSeverity(b.severity)] || 3))
    .slice(0, 10);
}

function buildReworkPlanMarkdown(cycle = {}, decision = {}, results = [], context = {}) {
  const findings = importantFindings(results);
  const humanSuggestions = actionableReviewSuggestions(context.reviewSuggestions || {});
  const action = decision.decision === 'ready_for_human_review'
    ? 'No code rework is required by the arbitrator. Complete verification evidence and proceed to human review.'
    : decision.nextAction || 'Prepare focused rework before final review.';

  return `${[
    `# Review Cycle ${cycle.number || 1} Rework Plan`,
    '',
    `- Cycle: ${cycle.id || 'cycle-001'}`,
    `- Decision: ${decision.decision || 'unknown'}`,
    `- Readiness score: ${decision.readinessScore || 0}/10`,
    `- Action: ${action}`,
    '',
    '## Changed Files',
    ...((context.changedFiles || []).length ? context.changedFiles.map((file) => `- ${file}`) : ['- No changed files detected.']),
    '',
    '## Findings To Address',
    ...(findings.length ? findings.map((item) => [
      `### ${String(item.severity || 'low').toUpperCase()}: ${item.title}`,
      '',
      `Reviewer: ${item.reviewer}`,
      item.detail || '',
      item.recommendation ? `Recommendation: ${item.recommendation}` : '',
      item.files && item.files.length ? `Files: ${item.files.join(', ')}` : ''
    ].filter(Boolean).join('\n\n')) : ['- No reviewer findings require rework.']),
    '',
    '## Human Review Suggestions Accepted For Rework',
    ...(humanSuggestions.length ? humanSuggestions.map((item) => [
      `### ${String(item.severity || 'low').toUpperCase()}: ${item.title}`,
      '',
      `Reviewer: ${item.reviewerName || item.reviewerId || 'Reviewer'}`,
      `Decision: ${normalizeReviewDecision(item.decision)}`,
      item.suggestion ? `Suggestion: ${item.suggestion}` : '',
      item.note ? `Developer note: ${item.note}` : '',
      item.files && item.files.length ? `Files: ${item.files.join(', ')}` : ''
    ].filter(Boolean).join('\n\n')) : ['- No accepted developer review suggestions yet.']),
    '',
    '## Completion Criteria',
    '- High-severity findings are resolved or explicitly accepted by a human reviewer.',
    '- Medium findings are resolved or documented with rationale.',
    '- Targeted tests/build checks are run or documented as unavailable.',
    '- Reviewer swarm is rerun after rework if files changed.',
    ''
  ].join('\n')}\n`;
}

function buildReworkPromptMarkdown(cycle = {}, decision = {}, results = [], context = {}) {
  const findings = importantFindings(results);
  const humanSuggestions = actionableReviewSuggestions(context.reviewSuggestions || {});
  const taskGraph = context.taskGraph || {};
  const tasks = Array.isArray(taskGraph.tasks) ? taskGraph.tasks.filter((task) => task.id && task.id.startsWith('task-')) : [];

  return `${[
    '# Main Developer Rework Prompt',
    '',
    `Review cycle: ${cycle.id || 'cycle-001'}`,
    `Arbitrator decision: ${decision.decision || 'unknown'}`,
    `Readiness score: ${decision.readinessScore || 0}/10`,
    '',
    '## Objective',
    decision.decision === 'ready_for_human_review'
      ? 'No code rework is required. Add or document verification evidence if still missing, then prepare for human review.'
      : 'Apply the smallest safe patch that resolves the reviewer findings below.',
    '',
    '## Rules',
    '- Keep changes scoped to the existing task and changed files unless the rework item explicitly requires more.',
    '- Do not add dependencies unless the dependency policy explicitly allows it.',
    '- Preserve accessibility behavior and existing repo patterns.',
    '- Update or add deterministic tests when behavior changes.',
    '- After changes, report what was changed and which finding each change addresses.',
    '',
    '## Planned Implementation Tasks',
    ...(tasks.length ? tasks.map((task) => `- ${task.id}: ${task.title}`) : ['- No task graph available.']),
    '',
    '## Changed Files From Current Cycle',
    ...((context.changedFiles || []).length ? context.changedFiles.map((file) => `- ${file}`) : ['- No changed files detected.']),
    '',
    '## Reviewer Findings',
    ...(findings.length ? findings.map((item) => [
      `### ${String(item.severity || 'low').toUpperCase()}: ${item.title}`,
      '',
      `Reviewer: ${item.reviewer}`,
      item.detail || '',
      item.recommendation ? `Recommendation: ${item.recommendation}` : '',
      item.files && item.files.length ? `Files: ${item.files.join(', ')}` : ''
    ].filter(Boolean).join('\n\n')) : ['- No reviewer findings require rework.']),
    '',
    '## Accepted Human Review Suggestions',
    ...(humanSuggestions.length ? humanSuggestions.map((item) => [
      `### ${String(item.severity || 'low').toUpperCase()}: ${item.title}`,
      '',
      `Reviewer: ${item.reviewerName || item.reviewerId || 'Reviewer'}`,
      `Decision: ${normalizeReviewDecision(item.decision)}`,
      item.suggestion ? `Suggestion: ${item.suggestion}` : '',
      item.note ? `Developer note: ${item.note}` : '',
      item.files && item.files.length ? `Files: ${item.files.join(', ')}` : ''
    ].filter(Boolean).join('\n\n')) : ['- No accepted developer review suggestions were supplied.']),
    '',
    '## Verification',
    '- Run targeted tests for changed behavior.',
    '- Run lint/build checks when available.',
    '- Rerun ODT Reviewer Swarm after rework.',
    ''
  ].join('\n')}\n`;
}

function createReviewCycleArtifacts(reviewerRun = {}, options = {}) {
  const context = buildReviewContext(options);
  const reviewerFindings = reviewerRun.reviewerFindings || readJson(REVIEW_SUMMARY_FILE, null, options) || { reviewers: [] };
  const results = Array.isArray(reviewerFindings.reviewers) ? reviewerFindings.reviewers : [];
  const decision = reviewerRun.arbitratorDecision || readJson(ARBITRATOR_DECISION_FILE, null, options) || buildArbitratorDecision(results, context);
  const existingVerification = readJson(VERIFY_RESULTS_FILE, null, options);
  const cycleId = nextCycleId(options);
  const cycleNumber = Number(cycleId.replace(/^cycle-/, '')) || 1;
  const cycleDir = `${CYCLES_DIR}/${cycleId}`;
  const cycleVerification = existingVerification
    ? {
      ...existingVerification,
      cycleId,
      cycleLabel: `Review Cycle ${cycleNumber}`,
      linkedFromCycleId: existingVerification.cycleId || ''
    }
    : null;
  const cycle = {
    id: cycleId,
    number: cycleNumber,
    generatedAt: new Date().toISOString(),
    label: `Review Cycle ${cycleNumber}`,
    status: decision.status || decision.decision || 'unknown',
    decision: decision.decision || 'unknown',
    readinessScore: decision.readinessScore || 0,
    highFindings: decision.highFindings || 0,
    mediumFindings: decision.mediumFindings || 0,
    verificationStatus: cycleVerification ? cycleVerification.status : '',
    verificationSummary: cycleVerification ? cycleVerification.summary : null,
    changedFiles: context.changedFiles || [],
    artifacts: {
      reviewerFindings: `${cycleDir}/reviewer-findings.json`,
      reviewSuggestions: `${cycleDir}/review-suggestions.json`,
      arbitratorDecision: `${cycleDir}/arbitrator-decision.json`,
      reworkPlan: `${cycleDir}/rework-plan.md`,
      reworkPrompt: `${cycleDir}/rework-prompt.md`,
      verifyResults: `${cycleDir}/verify-results.json`
    }
  };
  const reworkPlan = buildReworkPlanMarkdown(cycle, decision, results, context);
  const reworkPrompt = buildReworkPromptMarkdown(cycle, decision, results, context);

  writeJson(`${cycleDir}/cycle.json`, cycle, options);
  writeJson(`${cycleDir}/reviewer-findings.json`, reviewerFindings, options);
  writeJson(`${cycleDir}/review-suggestions.json`, {
    ...(context.reviewSuggestions || buildReviewSuggestions(reviewerFindings, {})),
    cycleId
  }, options);
  writeJson(`${cycleDir}/arbitrator-decision.json`, decision, options);
  writeText(`${cycleDir}/rework-plan.md`, reworkPlan, options);
  writeText(`${cycleDir}/rework-prompt.md`, reworkPrompt, options);
  if (cycleVerification) {
    const verificationMarkdown = buildVerificationMarkdown(cycleVerification);
    writeJson(`${cycleDir}/verify-results.json`, cycleVerification, options);
    writeText(`${cycleDir}/verify-results.md`, verificationMarkdown, options);
    writeJson(VERIFY_RESULTS_FILE, cycleVerification, options);
    writeText(VERIFY_RESULTS_MD, verificationMarkdown, options);
  }
  writeJson(CURRENT_CYCLE_FILE, cycle, options);
  writeText(REWORK_PLAN_FILE, reworkPlan, options);
  writeText(REWORK_PROMPT_FILE, reworkPrompt, options);
  const cycleHistory = persistCycleHistory(options);

  return {
    currentCycle: cycle,
    reworkPlan,
    reworkPrompt,
    cycleHistory
  };
}

function refreshCurrentReworkArtifacts(options = {}) {
  const currentCycle = readJson(CURRENT_CYCLE_FILE, null, options);
  const reviewerFindings = readJson(REVIEW_SUMMARY_FILE, null, options);
  const decision = readJson(ARBITRATOR_DECISION_FILE, null, options);
  if (!currentCycle || !reviewerFindings || !decision) {
    return {
      currentCycle,
      reworkPlan: readText(REWORK_PLAN_FILE, '', options),
      reworkPrompt: readText(REWORK_PROMPT_FILE, '', options)
    };
  }
  const context = buildReviewContext(options);
  const results = Array.isArray(reviewerFindings.reviewers) ? reviewerFindings.reviewers : [];
  const reworkPlan = buildReworkPlanMarkdown(currentCycle, decision, results, context);
  const reworkPrompt = buildReworkPromptMarkdown(currentCycle, decision, results, context);
  writeText(REWORK_PLAN_FILE, reworkPlan, options);
  writeText(REWORK_PROMPT_FILE, reworkPrompt, options);
  writeText(`${CYCLES_DIR}/${currentCycle.id}/rework-plan.md`, reworkPlan, options);
  writeText(`${CYCLES_DIR}/${currentCycle.id}/rework-prompt.md`, reworkPrompt, options);
  return {
    currentCycle,
    reworkPlan,
    reworkPrompt,
    reviewSuggestions: context.reviewSuggestions
  };
}

function runReviewerSwarm(options = {}) {
  const context = buildReviewContext(options);
  const reviewerPlan = context.reviewerPlan || buildReviewerPlan(context.taskGraph, context.executionPlan);
  const reviewers = Array.isArray(reviewerPlan.reviewers) ? reviewerPlan.reviewers : reviewerAgentDefinitions();

  const results = reviewers.map((agent) => {
    const prompt = buildReviewerPrompt(agent, context);
    const promptPath = `${REVIEW_PROMPTS_DIR}/${agent.id}.md`;
    const result = runReviewerForAgent(agent, context);
    const outputPath = agent.output || `${REVIEW_RESULTS_DIR}/${agent.id}.json`;
    const markdownPath = outputPath.replace(/\.json$/i, '.md');

    writeText(promptPath, `${prompt}\n`, options);
    writeJson(outputPath, result, options);
    writeText(markdownPath, buildReviewerMarkdown(result), options);
    return result;
  });

  const arbitratorDecision = buildArbitratorDecision(results, context);
  const reviewerFindings = {
    generatedAt: new Date().toISOString(),
    status: context.patchAvailable ? 'completed' : 'waiting_for_main_developer_patch',
    patchAvailable: context.patchAvailable,
    changedFiles: context.changedFiles,
    reviewers: results
  };
  const reviewSuggestions = persistReviewSuggestions(reviewerFindings, options);
  const nextReviewerPlan = {
    ...reviewerPlan,
    generatedAt: new Date().toISOString(),
    status: context.patchAvailable ? 'completed' : 'waiting_for_main_developer_patch',
    canRunInParallel: context.patchAvailable,
    reviewers: reviewers.map((agent) => ({
      ...agent,
      status: context.patchAvailable ? 'completed' : 'waiting_for_main_developer_patch',
      score: (results.find((result) => result.id === agent.id) || {}).score || null
    })),
    aggregator: {
      ...(reviewerPlan.aggregator || {}),
      id: 'merge-arbitrator',
      name: 'Merge Arbitrator',
      status: arbitratorDecision.status,
      output: ARBITRATOR_DECISION_FILE
    }
  };

  writeJson(REVIEW_SUMMARY_FILE, reviewerFindings, options);
  writeJson(REVIEW_SUGGESTIONS_FILE, reviewSuggestions, options);
  writeJson(REVIEWER_PLAN_FILE, nextReviewerPlan, options);
  writeJson(ARBITRATOR_DECISION_FILE, arbitratorDecision, options);
  writeText(ARBITRATOR_DECISION_MD, buildArbitratorMarkdown(arbitratorDecision, results), options);
  const cycleArtifacts = createReviewCycleArtifacts({ reviewerFindings, arbitratorDecision }, options);

  return {
    reviewerPlan: nextReviewerPlan,
    reviewerFindings,
    reviewSuggestions,
    arbitratorDecision,
    ...cycleArtifacts
  };
}

function uniqStrings(values = []) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))];
}

function normalizePromptOverrides(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return PROMPT_OVERRIDE_KEYS.reduce((acc, key) => {
    acc[key] = typeof source[key] === 'string' ? source[key] : '';
    return acc;
  }, {});
}

function sanitizeFileName(name = '') {
  const cleaned = String(name || 'file')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'file';
}

function fileExtension(name = '') {
  return path.extname(String(name || '')).toLowerCase();
}

function isImageAsset(name = '', mimeType = '') {
  const ext = fileExtension(name);
  const mime = String(mimeType || '').toLowerCase();
  return IMAGE_EXTENSIONS.has(ext) || mime.startsWith('image/');
}

function normalizeStoredFilePath(filePath = '') {
  return String(filePath || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
}

function isManagedUploadPath(filePath = '', options = {}) {
  const normalizedPath = normalizeStoredFilePath(filePath);
  if (!normalizedPath || !normalizedPath.startsWith(`${UPLOAD_DIR}/`)) {
    return false;
  }

  const uploadRoot = resolvePath(UPLOAD_DIR, options);
  const absPath = resolvePath(normalizedPath, options);
  const relative = path.relative(uploadRoot, absPath);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function deleteManagedUpload(filePath = '', options = {}) {
  if (!isManagedUploadPath(filePath, options)) {
    return false;
  }

  try {
    fs.rmSync(resolvePath(normalizeStoredFilePath(filePath), options), { force: true });
    return true;
  } catch (error) {
    return false;
  }
}

function clearManagedUploads(options = {}) {
  try {
    fs.rmSync(resolvePath(UPLOAD_DIR, options), { recursive: true, force: true });
  } catch (error) {
    // Ignore explicit demo cleanup failures.
  }
}

function pruneUploadDirectory(options = {}) {
  const uploadRoot = resolvePath(UPLOAD_DIR, options);
  try {
    if (fs.existsSync(uploadRoot) && !fs.readdirSync(uploadRoot).length) {
      fs.rmSync(uploadRoot, { recursive: true, force: true });
    }
  } catch (error) {
    // Ignore best-effort cleanup failures.
  }
}

function saveDesignInputs(payload = {}, options = {}) {
  const files = Array.isArray(payload.files) ? payload.files : [];
  if (!files.length) {
    return { saved: [] };
  }

  const uploadRoot = resolvePath(UPLOAD_DIR, options);
  fs.mkdirSync(uploadRoot, { recursive: true });

  const saved = files.map((file, index) => {
    const originalName = sanitizeFileName(file.name || `attachment-${index + 1}`);
    const stamp = `${Date.now()}-${index + 1}`;
    const storedName = `${stamp}-${originalName}`;
    const relPath = `${UPLOAD_DIR}/${storedName}`;
    const absPath = resolvePath(relPath, options);
    const buffer = Buffer.from(String(file.dataBase64 || ''), 'base64');
    fs.writeFileSync(absPath, buffer);

    return {
      originalName,
      storedName,
      path: relPath,
      mimeType: file.type || 'application/octet-stream',
      size: buffer.length,
      kind: isImageAsset(originalName, file.type) ? 'image' : 'document'
    };
  });

  return { saved };
}

function removeDesignInput(filePath = '', options = {}) {
  const normalizedPath = normalizeStoredFilePath(filePath);
  const current = readJson('reports/dev-twin/intake.json', defaultIntake(), options);
  const designInputs = current.designInputs || {};
  const currentImages = uniqStrings((designInputs.mockupImages || []).map(normalizeStoredFilePath));
  const currentDocs = uniqStrings((designInputs.referenceDocs || []).map(normalizeStoredFilePath));
  const nextImages = currentImages.filter((item) => item !== normalizedPath);
  const nextDocs = currentDocs.filter((item) => item !== normalizedPath);
  const removed = nextImages.length !== currentImages.length || nextDocs.length !== currentDocs.length;

  if (removed && isManagedUploadPath(normalizedPath, options)) {
    deleteManagedUpload(normalizedPath, options);
    pruneUploadDirectory(options);
  }

  const intake = updateIntake({
    mockupImages: nextImages,
    referenceDocs: nextDocs
  }, options);

  return {
    removed,
    intake
  };
}

function removeRuntimeFile(relPath, options = {}) {
  try {
    const abs = resolvePath(relPath, options);
    if (!fs.existsSync(abs)) return false;
    fs.rmSync(abs, { force: true, recursive: true });
    return true;
  } catch (error) {
    return false;
  }
}

function clearStaleRuntimeState(options = {}) {
  const removed = STALE_RUNTIME_FILES
    .filter((relPath) => removeRuntimeFile(relPath, options));
  const resetLaunch = resetAgentLaunchState({
    ...options,
    note: 'Starting a fresh assignment. Stale execution logs, responses, and generated workpacks were cleared.'
  });
  writeConversationState({
    phase: 'draft',
    status: 'fresh_assignment',
    nextAction: 'Enter or confirm the work item, then generate clarifications or run ODT.',
    clearedAt: new Date().toISOString()
  }, options);

  return {
    status: 'cleared',
    removed,
    resetLaunch
  };
}

function clearDesignInputs(options = {}) {
  clearManagedUploads(options);
  const intake = updateIntake({
    mockupImages: [],
    referenceDocs: []
  }, options);

  return {
    cleared: true,
    intake
  };
}

function contextArtifactKind(filePath = '', declaredKind = '') {
  const ext = fileExtension(filePath);
  if (declaredKind === 'image' || IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (ext === '.pdf') return 'pdf';
  if (['.xls', '.xlsx', '.csv', '.tsv'].includes(ext)) return 'spreadsheet';
  if (['.doc', '.docx', '.txt', '.md', '.rtf'].includes(ext)) return 'document';
  return declaredKind || 'document';
}

function contextArtifactStrategy(kind = '') {
  if (kind === 'image') {
    return 'Vision-ready: pass as a local image reference only after the file exists in the managed ODT vault.';
  }
  if (kind === 'pdf') {
    return 'Document-ready: extract text/page notes first, then cite only the relevant sections in agent prompts.';
  }
  if (kind === 'spreadsheet') {
    return 'Table-ready: summarize workbook sheets, headers, row counts, and schema samples before sharing with an agent.';
  }
  return 'Reference-ready: summarize useful constraints and keep the original file as supporting evidence.';
}

function describeContextArtifact(filePath = '', declaredKind = '', options = {}) {
  const normalizedPath = normalizeStoredFilePath(filePath);
  const kind = contextArtifactKind(normalizedPath, declaredKind);
  const base = {
    id: normalizedPath || `missing-${declaredKind || 'artifact'}`,
    path: normalizedPath,
    absolutePath: normalizedPath ? resolvePath(normalizedPath, options) : '',
    name: normalizedPath ? path.basename(normalizedPath) : 'Missing path',
    extension: fileExtension(normalizedPath),
    kind,
    managed: isManagedUploadPath(normalizedPath, options),
    exists: false,
    size: 0,
    status: 'missing',
    processingStrategy: contextArtifactStrategy(kind),
    recommendation: 'Re-upload the file or remove this stale reference before launching an agent.'
  };

  if (!normalizedPath) {
    return {
      ...base,
      status: 'invalid',
      recommendation: 'Remove the empty attachment reference before continuing.'
    };
  }

  try {
    const stats = fs.statSync(base.absolutePath);
    if (!stats.isFile()) {
      return {
        ...base,
        exists: true,
        status: 'invalid',
        recommendation: 'This reference points to a folder or unsupported filesystem object. Attach a file instead.'
      };
    }

    return {
      ...base,
      exists: true,
      size: stats.size,
      status: 'ready',
      recommendation: base.managed
        ? 'Ready for ODT planning and delegated agent prompts.'
        : 'Ready, but consider uploading it through ODT so future runs use a project-owned stable copy.'
    };
  } catch (error) {
    return base;
  }
}

function buildContextArtifacts(intake = {}, options = {}) {
  const designInputs = intake && intake.designInputs ? intake.designInputs : {};
  const imagePaths = uniqStrings((designInputs.mockupImages || []).map(normalizeStoredFilePath));
  const documentPaths = uniqStrings((designInputs.referenceDocs || []).map(normalizeStoredFilePath));
  const artifacts = [
    ...imagePaths.map((filePath) => describeContextArtifact(filePath, 'image', options)),
    ...documentPaths.map((filePath) => describeContextArtifact(filePath, 'document', options))
  ];
  const ready = artifacts.filter((item) => item.status === 'ready').length;
  const missing = artifacts.filter((item) => item.status === 'missing').length;
  const invalid = artifacts.filter((item) => item.status === 'invalid').length;
  const summary = {
    total: artifacts.length,
    ready,
    missing,
    invalid,
    images: artifacts.filter((item) => item.kind === 'image').length,
    pdfs: artifacts.filter((item) => item.kind === 'pdf').length,
    spreadsheets: artifacts.filter((item) => item.kind === 'spreadsheet').length,
    documents: artifacts.filter((item) => item.kind === 'document').length
  };
  const blocked = missing + invalid;

  return {
    generatedAt: new Date().toISOString(),
    status: blocked ? 'needs_attention' : (artifacts.length ? 'ready' : 'empty'),
    summary,
    artifacts,
    nextAction: blocked
      ? 'Remove stale references or re-upload missing files before launching an agent.'
      : (artifacts.length ? 'Context files are stable and ready for planning.' : 'Attach mockups, PDFs, spreadsheets, or docs only when the task needs them.')
  };
}

function persistContextArtifacts(intake = {}, options = {}) {
  const contextArtifacts = buildContextArtifacts(intake, options);
  writeJson(CONTEXT_ARTIFACTS_FILE, contextArtifacts, options);
  return contextArtifacts;
}

function hasBlockingContextArtifacts(contextArtifacts = {}) {
  const summary = contextArtifacts.summary || {};
  return Boolean((summary.missing || 0) + (summary.invalid || 0));
}

function detectRepoIntent(payload = {}) {
  const workItemType = String(payload.workItemType || '').toLowerCase();
  const summary = `${payload.ticket || payload.summary || payload.title || ''}`.toLowerCase();
  const scaffoldSignals = ['scaffold', 'bootstrap', 'new app', 'create react project', 'create project', 'greenfield'];
  const scaffoldFromText = scaffoldSignals.some((signal) => summary.includes(signal));

  if (workItemType === 'scaffold' || workItemType === 'new-app' || scaffoldFromText) {
    return 'scaffold';
  }
  return 'existing';
}

function detectGitRepo(targetRepoPath) {
  if (!targetRepoPath) return false;

  try {
    const stdout = execFileSync('git', ['-C', targetRepoPath, 'rev-parse', '--is-inside-work-tree'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return String(stdout || '').trim() === 'true';
  } catch (error) {
    return fs.existsSync(path.join(targetRepoPath, '.git'));
  }
}

function inspectRepoPath(targetRepoPath, payload = {}) {
  const intent = detectRepoIntent(payload);
  const result = {
    checkedAt: new Date().toISOString(),
    path: targetRepoPath || '',
    exists: false,
    isDirectory: false,
    entryCount: 0,
    isEmpty: false,
    isGitRepo: false,
    intent,
    status: 'missing_path',
    tone: 'warn',
    detail: 'Provide a target repository path to continue.',
    recommendation: '',
    canInitializeGit: false,
    shouldWarn: true
  };

  if (!targetRepoPath) {
    result.recommendation = intent === 'scaffold'
      ? 'Select an empty folder for scaffolding a new app, or choose an existing repo if you want to extend a codebase.'
      : 'Select an existing local repository. Feature and defect work are safest in a Git-backed repo.';
    return result;
  }

  let stats;
  try {
    stats = fs.statSync(targetRepoPath);
  } catch (error) {
    result.detail = 'The selected path does not exist on disk.';
    result.recommendation = 'Choose an existing local folder, or create one first if you are scaffolding a new project.';
    return result;
  }

  result.exists = true;
  result.isDirectory = stats.isDirectory();
  if (!result.isDirectory) {
    result.status = 'not_directory';
    result.tone = 'bad';
    result.detail = 'The selected path is not a folder.';
    result.recommendation = 'Choose a directory instead of a file path.';
    return result;
  }

  let entries = [];
  try {
    entries = fs.readdirSync(targetRepoPath);
  } catch (error) {
    result.status = 'unreadable';
    result.tone = 'bad';
    result.detail = 'The selected folder could not be read.';
    result.recommendation = 'Check folder permissions and try again.';
    return result;
  }

  result.entryCount = entries.length;
  result.isEmpty = entries.length === 0;
  result.isGitRepo = detectGitRepo(targetRepoPath);
  result.canInitializeGit = result.exists && result.isDirectory && !result.isGitRepo;

  if (result.isGitRepo) {
    result.status = 'git_repo';
    result.tone = 'good';
    result.detail = 'Git repository detected. This is the safest mode for feature, defect, and review workflows.';
    result.recommendation = 'You can proceed with repo-aware analysis and delegated agent execution.';
    result.shouldWarn = false;
    return result;
  }

  if (result.isEmpty) {
    result.status = 'empty_folder';
    result.tone = intent === 'scaffold' ? 'good' : 'warn';
    result.detail = intent === 'scaffold'
      ? 'Empty folder detected. This is valid for scaffolding a new app or starting a fresh project.'
      : 'Empty folder detected. This is fine for scaffolding, but feature or defect work usually expects an existing codebase.';
    result.recommendation = intent === 'scaffold'
      ? 'You can continue, and optionally initialize Git before or after the agent generates files.'
      : 'If you intended to change an existing codebase, choose a Git repo instead. Otherwise treat this as a scaffold flow.';
    result.shouldWarn = intent !== 'scaffold';
    return result;
  }

  result.status = 'existing_non_git';
  result.tone = 'warn';
  result.detail = 'Existing folder detected, but it is not a Git repo.';
  result.recommendation = intent === 'scaffold'
    ? 'This can still work for scaffolding, but initializing Git is recommended before you start delegating changes.'
    : 'For feature and defect work, Git is strongly recommended so diffs and human review stay safe and traceable.';
  result.shouldWarn = true;
  return result;
}

function buildLocalContext(options = {}) {
  const odtSummary = readJson('reports/odt/run-summary.json', null, options);
  const devTwinSummary = readJson('reports/dev-twin/summary.json', null, options);
  const a11yInsights = readJson('reports/a11y-twin/insights.json', null, options);
  const intake = readJson('reports/dev-twin/intake.json', null, options);
  const contextArtifacts = buildContextArtifacts(intake || {}, options);
  const targetRepoPath = getTargetRepoPath({ ...options, targetRepoPath: intake && intake.targetRepoPath });
  const reviewPacket = readJson(REVIEW_PACKET_FILE, null, options) || {
    generatedAt: '',
    status: 'not_refreshed',
    targetRepoPath,
    summary: { changedFiles: 0, staged: 0, unstaged: 0, untracked: 0, outOfScope: 0 },
    files: [],
    diffStat: { staged: '', unstaged: '' },
    diffPreview: '',
    nextAction: 'Refresh the Review Packet when you want to inspect the current target repo diff.'
  };
  const repoStatus = inspectRepoPath(targetRepoPath, intake || {});
  const clarifications = readJson(CLARIFICATION_FILE, null, options);
  const conversation = readJson(CONVERSATION_STATE_FILE, null, options);
  const taskGraph = readJson(TASK_GRAPH_FILE, null, options);
  const executionPlan = normalizeExecutionPlan(readJson(EXECUTION_PLAN_FILE, null, options));
  const schedulerDecision = readJson(SCHEDULER_DECISION_FILE, null, options);
  const agentRoster = readJson(AGENT_ROSTER_FILE, null, options);
  const reviewerPlan = readJson(REVIEWER_PLAN_FILE, null, options);
  const reviewerFindings = readJson(REVIEW_SUMMARY_FILE, null, options);
  const reviewSuggestions = buildReviewSuggestions(
    reviewerFindings || { reviewers: [] },
    readJson(REVIEW_SUGGESTIONS_FILE, null, options) || {}
  );
  const arbitratorDecision = readJson(ARBITRATOR_DECISION_FILE, null, options);
  const currentCycle = readJson(CURRENT_CYCLE_FILE, null, options);
  const reworkPlan = readText(REWORK_PLAN_FILE, '', options);
  const reworkPrompt = readText(REWORK_PROMPT_FILE, '', options);
  const verificationResults = readJson(VERIFY_RESULTS_FILE, null, options);
  const cycleHistory = readJson(CYCLE_HISTORY_FILE, null, options) || buildCycleHistory(options);

  return {
    generatedAt: new Date().toISOString(),
    source: 'local-context-server',
    workspaceRoot: getWorkspaceRoot(options),
    targetRepoPath,
    repoStatus,
    available: {
      odt: Boolean(odtSummary),
      devTwin: Boolean(devTwinSummary),
      a11yTwin: Boolean(a11yInsights),
      intake: Boolean(intake),
      contextArtifacts: Boolean(contextArtifacts.summary && contextArtifacts.summary.total)
    },
    intake,
    contextArtifacts,
    reviewPacket,
    odt: odtSummary,
    clarifications,
    conversation,
    agentic: {
      taskGraph,
      executionPlan,
      schedulerDecision,
      agentRoster,
      reviewerPlan,
      reviewerFindings,
      reviewSuggestions,
      arbitratorDecision,
      currentCycle,
      reworkPlan,
      reworkPrompt,
      verificationResults,
      cycleHistory
    },
    promptProviderStatus: readJson('reports/odt/prompts/provider-status.json', null, options),
    devTwin: devTwinSummary,
    a11yTwin: a11yInsights,
    execute: {
      status: readJson('reports/odt/execute/status.json', null, options),
      applySummary: readJson('reports/odt/execute/apply-summary.json', null, options),
      agentLaunch: getAgentLaunchStatus(options),
      prompt: readText('reports/odt/execute/prompt.md', '', options),
      responseTemplate: readText('reports/odt/execute/response-template.md', '', options)
    },
    workpacks: {
      code: readText('reports/dev-twin/code-workpack.md', '', options),
      tests: readText('reports/dev-twin/unit-test-workpack.md', '', options),
      techDesign: readText('reports/odt/tech-design.md', '', options),
      executionGuide: readText('reports/odt/execution-guide.md', '', options),
      a11yPrompt: readText('reports/a11y/coding-agent-prompt.md', '', options)
    }
  };
}

function writeSnapshot(outputPath, options = {}) {
  const output = outputPath || 'reports/mcp/local-context.json';
  const payload = buildLocalContext(options);
  const abs = resolvePath(output, options);

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return {
    output,
    payload
  };
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function deriveTitle(text) {
  const firstLine = `${text || ''}`.split('\n').map((line) => line.trim()).find(Boolean) || 'Untitled work item';
  return firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine;
}

async function chooseRepoFolder(payload = {}) {
  if (process.platform !== 'darwin') {
    return {
      status: 'unsupported',
      message: 'Native repo browse helper is currently implemented for macOS only.'
    };
  }

  const prompt = payload.prompt || 'Select the target repository folder for Oracle Developer Twin';
  const currentPath = payload.currentPath && fs.existsSync(payload.currentPath) ? payload.currentPath : '';
  const lines = [
    `set dialogPrompt to ${JSON.stringify(prompt)}`,
    currentPath
      ? `set chosenFolder to choose folder with prompt dialogPrompt default location (POSIX file ${JSON.stringify(currentPath)})`
      : 'set chosenFolder to choose folder with prompt dialogPrompt',
    'POSIX path of chosenFolder'
  ];

  try {
    const result = await execFileAsync('osascript', lines.flatMap((line) => ['-e', line]), {
      encoding: 'utf8'
    });
    const pickedPath = String(result.stdout || '').trim();
    if (!pickedPath) {
      return {
        status: 'cancelled',
        message: 'No folder was selected.'
      };
    }
    return {
      status: 'ok',
      path: pickedPath
    };
  } catch (error) {
    const stderr = String(error.stderr || error.message || '').trim();
    if (stderr.includes('-128') || /user canceled/i.test(stderr)) {
      return {
        status: 'cancelled',
        message: 'Folder selection was cancelled.'
      };
    }
    throw new Error(stderr || 'Unable to open the macOS folder chooser.');
  }
}

async function initializeGitRepo(targetRepoPath) {
  if (!targetRepoPath) {
    throw new Error('Target repo path is required before initializing Git.');
  }

  const status = inspectRepoPath(targetRepoPath, {});
  if (!status.exists || !status.isDirectory) {
    throw new Error('Select an existing folder before initializing Git.');
  }
  if (status.isGitRepo) {
    return {
      status: 'already_git',
      path: targetRepoPath,
      detail: 'Git is already initialized for this folder.'
    };
  }

  await execFileAsync('git', ['init'], {
    cwd: targetRepoPath,
    encoding: 'utf8'
  });

  return {
    status: 'initialized',
    path: targetRepoPath,
    detail: 'Git repository initialized successfully.'
  };
}

function blankAssignmentIntake() {
  const base = defaultIntake();
  return {
    ...base,
    title: '',
    featureName: '',
    summary: '',
    reviewEdits: '',
    targetRepoPath: '',
    workItemType: 'feature',
    jira: {
      ticketId: '',
      url: ''
    },
    requirements: {
      ...(base.requirements || {}),
      acceptanceCriteria: [],
      nonFunctional: [],
      outOfScope: []
    },
    designInputs: {
      mockupImages: [],
      referenceDocs: [],
      jiraLinks: []
    },
    developerHints: {
      suspectedAreas: [],
      relatedComponents: [],
      notes: ''
    },
    defectContext: {
      defectId: '',
      observedBehavior: '',
      expectedBehavior: '',
      severity: 'medium'
    }
  };
}

function normalizeListItem(value = '') {
  return String(value || '')
    .replace(/^\s*(?:[-*]|\u2022|\d+[.)]|[a-z][.)])\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSectionHeading(line = '') {
  return /^[a-z][a-z0-9 /&().-]{1,48}:$/i.test(line.trim());
}

function extractListSection(text = '', headingPattern) {
  const lines = String(text || '').split(/\r?\n/);
  const items = [];
  let active = false;

  lines.forEach((line) => {
    const trimmed = String(line || '').trim();
    if (!trimmed) return;

    const inlineMatch = trimmed.match(headingPattern);
    if (inlineMatch && inlineMatch.index === 0) {
      active = true;
      const afterHeading = trimmed.slice(inlineMatch[0].length).replace(/^[:\-\s]+/, '').trim();
      if (afterHeading) {
        afterHeading.split(/[;|]/).map(normalizeListItem).filter(Boolean).forEach((item) => items.push(item));
      }
      return;
    }

    if (!active) return;
    if (isSectionHeading(trimmed) && !/^(and|or)\b/i.test(trimmed)) {
      active = false;
      return;
    }

    const isListItem = /^\s*(?:[-*]|\u2022|\d+[.)]|[a-z][.)])\s+/.test(line);
    if (!isListItem && items.length) {
      items[items.length - 1] = `${items[items.length - 1]} ${normalizeListItem(trimmed)}`.trim();
      return;
    }

    const item = normalizeListItem(trimmed);
    if (item) items.push(item);
  });

  return uniqStrings(items).slice(0, 12);
}

function inferNonFunctionalSignals(text = '') {
  const value = String(text || '').toLowerCase();
  const signals = [];
  if (includesAny(value, ['a11y', 'accessibility', 'wcag', 'keyboard', 'screen reader', 'aria'])) signals.push('a11y');
  if (includesAny(value, ['performance', 'latency', 'fast', 'slow', 'render time'])) signals.push('performance');
  if (includesAny(value, ['analytics', 'telemetry', 'tracking', 'metric'])) signals.push('analytics');
  if (includesAny(value, ['security', 'permission', 'authorization', 'auth', 'privacy'])) signals.push('security');
  if (includesAny(value, ['unit test', 'regression test', 'integration test', 'test coverage'])) signals.push('tests');
  return uniqStrings(signals);
}

function updateIntake(payload = {}, options = {}) {
  const resetAssignment = Boolean(payload.newTask || payload.resetStaleState || options.resetIntake);
  const current = resetAssignment
    ? blankAssignmentIntake()
    : readJson('reports/dev-twin/intake.json', defaultIntake(), options);
  const currentRequirements = current.requirements || {};
  const currentDesignInputs = current.designInputs || {};
  const ticket = payload.ticket || payload.summary || current.summary;
  const targetRepoPath = getTargetRepoPath({ ...options, targetRepoPath: payload.targetRepoPath || current.targetRepoPath });
  const currentPromptOverrides = normalizePromptOverrides(current.promptOverrides);
  const payloadPromptOverrides = payload.promptOverrides && typeof payload.promptOverrides === 'object'
    ? normalizePromptOverrides(payload.promptOverrides)
    : null;
  const payloadHasIntakeText = typeof payload.ticket === 'string'
    || typeof payload.summary === 'string'
    || typeof payload.reviewEdits === 'string';
  const combinedIntakeText = `${ticket || ''}\n${payload.reviewEdits || current.reviewEdits || ''}`;
  const parsedAcceptanceCriteria = extractListSection(
    combinedIntakeText,
    /^(?:acceptance criteria|acceptance|ac|must have|done when)\s*(?::|-|$)/i
  );
  const parsedNonFunctional = extractListSection(
    combinedIntakeText,
    /^(?:non[- ]?functional requirements?|nfrs?|quality requirements?|constraints?)\s*(?::|-|$)/i
  );
  const nextAcceptanceCriteria = Array.isArray(payload.acceptanceCriteria) && payload.acceptanceCriteria.length
    ? payload.acceptanceCriteria
    : (payloadHasIntakeText && parsedAcceptanceCriteria.length
      ? parsedAcceptanceCriteria
      : (resetAssignment ? [] : (currentRequirements.acceptanceCriteria || [])));
  const nextNonFunctional = Array.isArray(payload.nonFunctional) && payload.nonFunctional.length
    ? payload.nonFunctional
    : (payloadHasIntakeText && parsedNonFunctional.length
      ? parsedNonFunctional
      : (resetAssignment ? inferNonFunctionalSignals(combinedIntakeText) : (currentRequirements.nonFunctional || [])));
  const next = {
    ...current,
    title: payload.title || deriveTitle(ticket),
    featureName: payload.title || deriveTitle(ticket),
    summary: ticket,
    reviewEdits: typeof payload.reviewEdits === 'string'
      ? payload.reviewEdits
      : (typeof current.reviewEdits === 'string' ? current.reviewEdits : ''),
    promptOverrides: payloadPromptOverrides
      ? { ...currentPromptOverrides, ...payloadPromptOverrides }
      : currentPromptOverrides,
    targetRepoPath,
    workItemType: payload.workItemType || current.workItemType || 'feature',
    jira: {
      ...(current.jira || {}),
      ticketId: payload.ticketId || (current.jira && current.jira.ticketId) || '',
      url: payload.ticketUrl || (current.jira && current.jira.url) || ''
    },
    requirements: {
      ...currentRequirements,
      acceptanceCriteria: nextAcceptanceCriteria,
      nonFunctional: nextNonFunctional
    },
    designInputs: {
      ...currentDesignInputs,
      mockupImages: Array.isArray(payload.mockupImages)
        ? uniqStrings(payload.mockupImages)
        : uniqStrings(currentDesignInputs.mockupImages || []),
      referenceDocs: Array.isArray(payload.referenceDocs)
        ? uniqStrings(payload.referenceDocs)
        : uniqStrings(currentDesignInputs.referenceDocs || [])
    }
  };

  writeJson('reports/dev-twin/intake.json', next, options);
  return next;
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload, null, 2));
}

async function handlePost(req, res, serverOptions = {}) {
  const payload = await collectBody(req);
  const runtimeOptions = {
    workspaceRoot: payload.workspaceRoot || serverOptions.workspaceRoot || process.cwd(),
    targetRepoPath: payload.targetRepoPath || serverOptions.targetRepoPath
  };

  if (req.url === '/intake') {
    if (payload.newTask || payload.resetStaleState) {
      clearStaleRuntimeState(runtimeOptions);
    }
    const intake = updateIntake(payload, runtimeOptions);
    const contextArtifacts = persistContextArtifacts(intake, runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, { status: 'ok', intake, contextArtifacts });
    return;
  }

  if (req.url === '/odt/new-task') {
    const cleanup = clearStaleRuntimeState(runtimeOptions);
    const intake = updateIntake({
      ...payload,
      newTask: true,
      reviewEdits: payload.reviewEdits || '',
      promptOverrides: normalizePromptOverrides(payload.promptOverrides || {})
    }, runtimeOptions);
    const contextArtifacts = persistContextArtifacts(intake, runtimeOptions);
    const clarifications = persistClarifications(intake, runtimeOptions);
    const agentic = persistAgenticPlan(intake, clarifications, runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: clarifications.status,
      cleanup,
      intake,
      contextArtifacts,
      clarifications,
      agentic
    });
    return;
  }

  if (req.url === '/repo/pick') {
    const picked = await chooseRepoFolder({
      currentPath: payload.currentPath || runtimeOptions.targetRepoPath || runtimeOptions.workspaceRoot,
      prompt: payload.prompt
    });
    json(res, 200, picked);
    return;
  }

  if (req.url === '/repo/status') {
    const targetRepoPath = payload.targetRepoPath || runtimeOptions.targetRepoPath || '';
    json(res, 200, inspectRepoPath(targetRepoPath, payload));
    return;
  }

  if (req.url === '/repo/init-git') {
    const targetRepoPath = payload.targetRepoPath || runtimeOptions.targetRepoPath || '';
    const initResult = await initializeGitRepo(targetRepoPath);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, initResult);
    return;
  }

  if (req.url === '/files/upload') {
    const uploadResult = saveDesignInputs(payload, runtimeOptions);
    const current = readJson('reports/dev-twin/intake.json', defaultIntake(), runtimeOptions);
    const currentImages = ((current.designInputs && current.designInputs.mockupImages) || []);
    const currentDocs = ((current.designInputs && current.designInputs.referenceDocs) || []);
    const nextImages = uniqStrings([
      ...currentImages,
      ...uploadResult.saved.filter((item) => item.kind === 'image').map((item) => item.path)
    ]);
    const nextDocs = uniqStrings([
      ...currentDocs,
      ...uploadResult.saved.filter((item) => item.kind !== 'image').map((item) => item.path)
    ]);
    const intake = updateIntake({
      ...payload,
      mockupImages: nextImages,
      referenceDocs: nextDocs
    }, runtimeOptions);
    const contextArtifacts = persistContextArtifacts(intake, runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      saved: uploadResult.saved,
      intake,
      contextArtifacts
    });
    return;
  }

  if (req.url === '/files/remove') {
    const result = removeDesignInput(payload.filePath || payload.path || '', runtimeOptions);
    const contextArtifacts = persistContextArtifacts(result.intake, runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      removed: result.removed,
      intake: result.intake,
      contextArtifacts
    });
    return;
  }

  if (req.url === '/files/clear') {
    const result = clearDesignInputs(runtimeOptions);
    const contextArtifacts = persistContextArtifacts(result.intake, runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      cleared: result.cleared,
      intake: result.intake,
      contextArtifacts
    });
    return;
  }

  if (req.url === '/odt/run') {
    if (payload.newTask || payload.resetStaleState) {
      clearStaleRuntimeState(runtimeOptions);
    }
    const intake = updateIntake(payload, runtimeOptions);
    const contextArtifacts = persistContextArtifacts(intake, runtimeOptions);
    const clarifications = persistClarifications(intake, runtimeOptions);
    const agentic = persistAgenticPlan(intake, clarifications, runtimeOptions);
    if (hasBlockingContextArtifacts(contextArtifacts) && !payload.forceRun) {
      writeConversationState({
        phase: 'needs_input',
        status: 'context_artifact_missing',
        nextAction: contextArtifacts.nextAction,
        updatedAt: new Date().toISOString()
      }, runtimeOptions);
      writeSnapshot(undefined, runtimeOptions);
      json(res, 200, {
        status: 'needs_input',
        intake,
        contextArtifacts,
        clarifications,
        agentic,
        note: 'ODT paused because one or more attached context files are missing or invalid. This prevents delegated agents from receiving stale image/document paths.'
      });
      return;
    }
    if (clarifications.summary.unresolvedHigh && !payload.forceRun) {
      writeSnapshot(undefined, runtimeOptions);
      json(res, 200, {
        status: 'needs_input',
        intake,
        contextArtifacts,
        clarifications,
        agentic,
        note: 'ODT paused before planning because high-severity clarification questions are unresolved.'
      });
      return;
    }
    resetAgentLaunchState({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      note: 'Starting a fresh digital worker run. Previous agent response and status were cleared.'
    });
    const run = await runOdt({
      ...runtimeOptions,
      profile: payload.profile || 'react-js',
      withA11y: payload.withA11y === false ? false : true
    });
    const execute = await runOdtExecute(runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      intake,
      contextArtifacts,
      clarifications,
      agentic,
      runSummary: run.summary,
      execute: execute.apply
    });
    return;
  }

  if (req.url === '/odt/clarifications/generate') {
    const intake = updateIntake(payload, runtimeOptions);
    const contextArtifacts = persistContextArtifacts(intake, runtimeOptions);
    const clarifications = persistClarifications(intake, runtimeOptions);
    const agentic = persistAgenticPlan(intake, clarifications, runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: clarifications.status,
      intake,
      contextArtifacts,
      clarifications,
      agentic
    });
    return;
  }

  if (req.url === '/odt/clarifications/answer') {
    const clarifications = updateClarificationAnswers(payload, runtimeOptions);
    const intake = readJson('reports/dev-twin/intake.json', defaultIntake(), runtimeOptions);
    const contextArtifacts = persistContextArtifacts(intake, runtimeOptions);
    const agentic = persistAgenticPlan(intake, clarifications, runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: clarifications.status,
      contextArtifacts,
      clarifications,
      agentic
    });
    return;
  }

  if (req.url === '/odt/continue') {
    const intake = updateIntake(payload, runtimeOptions);
    const contextArtifacts = persistContextArtifacts(intake, runtimeOptions);
    const clarifications = persistClarifications(intake, runtimeOptions);
    const agentic = persistAgenticPlan(intake, clarifications, runtimeOptions);
    if (hasBlockingContextArtifacts(contextArtifacts) && !payload.forceRun) {
      writeConversationState({
        phase: 'needs_input',
        status: 'context_artifact_missing',
        nextAction: contextArtifacts.nextAction,
        updatedAt: new Date().toISOString()
      }, runtimeOptions);
      writeSnapshot(undefined, runtimeOptions);
      json(res, 200, {
        status: 'needs_input',
        intake,
        contextArtifacts,
        clarifications,
        agentic,
        note: 'ODT is still paused because one or more attached context files are missing or invalid.'
      });
      return;
    }
    if (clarifications.summary.unresolvedHigh && !payload.forceRun) {
      writeSnapshot(undefined, runtimeOptions);
      json(res, 200, {
        status: 'needs_input',
        intake,
        contextArtifacts,
        clarifications,
        agentic,
        note: 'ODT is still paused. Answer high-severity clarification questions or continue with forceRun.'
      });
      return;
    }
    resetAgentLaunchState({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      note: 'Continuing the current assignment. Previous delegated agent response and status were cleared.'
    });
    const run = await runOdt({
      ...runtimeOptions,
      profile: payload.profile || 'react-js',
      withA11y: payload.withA11y === false ? false : true
    });
    const execute = await runOdtExecute(runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      intake,
      contextArtifacts,
      clarifications,
      agentic,
      runSummary: run.summary,
      execute: execute.apply
    });
    return;
  }

  if (req.url === '/odt/execute') {
    resetAgentLaunchState({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      note: 'Execution bundle refreshed. Previous agent response and status were cleared.'
    });
    const result = await runOdtExecute({
      ...runtimeOptions,
      refresh: Boolean(payload.refresh),
      'response-file': payload.responseFile,
      'patch-file': payload.patchFile,
      'dry-run': Boolean(payload.dryRun),
      verify: Boolean(payload.verify),
      'allow-dirty-targets': Boolean(payload.allowDirtyTargets)
    });
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      execute: result.apply
    });
    return;
  }

  if (req.url === '/odt/reviewers/run') {
    const intake = readJson('reports/dev-twin/intake.json', defaultIntake(), runtimeOptions);
    const clarifications = readJson(CLARIFICATION_FILE, null, runtimeOptions) || persistClarifications(intake, runtimeOptions);
    const plan = persistAgenticPlan(intake, clarifications, runtimeOptions);
    const reviewPacket = persistReviewPacket(runtimeOptions);
    const reviewerRun = runReviewerSwarm(runtimeOptions);
    const agentic = {
      ...plan,
      reviewerPlan: reviewerRun.reviewerPlan,
      reviewerFindings: reviewerRun.reviewerFindings,
      reviewSuggestions: reviewerRun.reviewSuggestions,
      reviewPacket,
      arbitratorDecision: reviewerRun.arbitratorDecision,
      currentCycle: reviewerRun.currentCycle,
      reworkPlan: reviewerRun.reworkPlan,
      reworkPrompt: reviewerRun.reworkPrompt,
      cycleHistory: reviewerRun.cycleHistory
    };
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: reviewerRun.arbitratorDecision.status,
      agentic,
      reviewerFindings: reviewerRun.reviewerFindings,
      reviewSuggestions: reviewerRun.reviewSuggestions,
      reviewPacket,
      arbitratorDecision: reviewerRun.arbitratorDecision,
      currentCycle: reviewerRun.currentCycle,
      reworkPlan: reviewerRun.reworkPlan,
      reworkPrompt: reviewerRun.reworkPrompt,
      cycleHistory: reviewerRun.cycleHistory
    });
    return;
  }

  if (req.url === '/odt/review-packet/refresh') {
    const reviewPacket = persistReviewPacket(runtimeOptions);
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: reviewPacket.status,
      reviewPacket
    });
    return;
  }

  if (req.url === '/odt/review-suggestions/update') {
    const reviewSuggestions = updateReviewSuggestions(payload, runtimeOptions);
    const refreshed = refreshCurrentReworkArtifacts(runtimeOptions);
    const agentic = {
      taskGraph: readJson(TASK_GRAPH_FILE, null, runtimeOptions),
      executionPlan: normalizeExecutionPlan(readJson(EXECUTION_PLAN_FILE, null, runtimeOptions)),
      schedulerDecision: readJson(SCHEDULER_DECISION_FILE, null, runtimeOptions),
      agentRoster: readJson(AGENT_ROSTER_FILE, null, runtimeOptions),
      reviewerPlan: readJson(REVIEWER_PLAN_FILE, null, runtimeOptions),
      reviewerFindings: readJson(REVIEW_SUMMARY_FILE, null, runtimeOptions),
      reviewSuggestions,
      arbitratorDecision: readJson(ARBITRATOR_DECISION_FILE, null, runtimeOptions),
      currentCycle: refreshed.currentCycle || readJson(CURRENT_CYCLE_FILE, null, runtimeOptions),
      reworkPlan: refreshed.reworkPlan || readText(REWORK_PLAN_FILE, '', runtimeOptions),
      reworkPrompt: refreshed.reworkPrompt || readText(REWORK_PROMPT_FILE, '', runtimeOptions),
      verificationResults: readJson(VERIFY_RESULTS_FILE, null, runtimeOptions),
      cycleHistory: readJson(CYCLE_HISTORY_FILE, null, runtimeOptions) || buildCycleHistory(runtimeOptions)
    };
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: reviewSuggestions.status,
      agentic,
      reviewSuggestions
    });
    return;
  }

  if (req.url === '/odt/rework/prepare') {
    let reviewerFindings = readJson(REVIEW_SUMMARY_FILE, null, runtimeOptions);
    let arbitratorDecision = readJson(ARBITRATOR_DECISION_FILE, null, runtimeOptions);
    let reviewerRun = null;
    if (!reviewerFindings || !arbitratorDecision) {
      reviewerRun = runReviewerSwarm(runtimeOptions);
      reviewerFindings = reviewerRun.reviewerFindings;
      arbitratorDecision = reviewerRun.arbitratorDecision;
    }
    const cycleArtifacts = reviewerRun
      ? {
        currentCycle: reviewerRun.currentCycle,
        reworkPlan: reviewerRun.reworkPlan,
        reworkPrompt: reviewerRun.reworkPrompt,
        cycleHistory: reviewerRun.cycleHistory
      }
      : createReviewCycleArtifacts({ reviewerFindings, arbitratorDecision }, runtimeOptions);
    const agentic = {
      taskGraph: readJson(TASK_GRAPH_FILE, null, runtimeOptions),
      executionPlan: normalizeExecutionPlan(readJson(EXECUTION_PLAN_FILE, null, runtimeOptions)),
      schedulerDecision: readJson(SCHEDULER_DECISION_FILE, null, runtimeOptions),
      agentRoster: readJson(AGENT_ROSTER_FILE, null, runtimeOptions),
      reviewerPlan: readJson(REVIEWER_PLAN_FILE, null, runtimeOptions),
      reviewerFindings,
      reviewSuggestions: readJson(REVIEW_SUGGESTIONS_FILE, null, runtimeOptions),
      arbitratorDecision,
      ...cycleArtifacts
    };
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: cycleArtifacts.currentCycle.status,
      agentic,
      ...cycleArtifacts
    });
    return;
  }

  if (req.url === '/odt/rework/launch') {
    let reviewerFindings = readJson(REVIEW_SUMMARY_FILE, null, runtimeOptions);
    let arbitratorDecision = readJson(ARBITRATOR_DECISION_FILE, null, runtimeOptions);
    let currentCycle = readJson(CURRENT_CYCLE_FILE, null, runtimeOptions);
    let reworkPlan = readText(REWORK_PLAN_FILE, '', runtimeOptions);
    let reworkPrompt = readText(REWORK_PROMPT_FILE, '', runtimeOptions);
    let cycleHistory = readJson(CYCLE_HISTORY_FILE, null, runtimeOptions);

    if (!reworkPrompt.trim()) {
      let reviewerRun = null;
      if (!reviewerFindings || !arbitratorDecision) {
        reviewerRun = runReviewerSwarm(runtimeOptions);
        reviewerFindings = reviewerRun.reviewerFindings;
        arbitratorDecision = reviewerRun.arbitratorDecision;
      }
      const cycleArtifacts = reviewerRun
        ? {
          currentCycle: reviewerRun.currentCycle,
          reworkPlan: reviewerRun.reworkPlan,
          reworkPrompt: reviewerRun.reworkPrompt,
          cycleHistory: reviewerRun.cycleHistory
        }
        : createReviewCycleArtifacts({ reviewerFindings, arbitratorDecision }, runtimeOptions);
      currentCycle = cycleArtifacts.currentCycle;
      reworkPlan = cycleArtifacts.reworkPlan;
      reworkPrompt = cycleArtifacts.reworkPrompt;
      cycleHistory = cycleArtifacts.cycleHistory;
    }

    if (!reworkPrompt.trim()) {
      throw new Error('Rework prompt is not ready. Run the reviewer swarm or prepare a rework prompt first.');
    }

    resetAgentLaunchState({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      note: 'Clearing stale delegated agent state before launching focused Main Developer rework.'
    });
    const launch = launchExternalAgent({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      mode: payload.mode || 'terminal',
      promptFile: REWORK_PROMPT_FILE
    });
    const agentic = {
      taskGraph: readJson(TASK_GRAPH_FILE, null, runtimeOptions),
      executionPlan: normalizeExecutionPlan(readJson(EXECUTION_PLAN_FILE, null, runtimeOptions)),
      schedulerDecision: readJson(SCHEDULER_DECISION_FILE, null, runtimeOptions),
      agentRoster: readJson(AGENT_ROSTER_FILE, null, runtimeOptions),
      reviewerPlan: readJson(REVIEWER_PLAN_FILE, null, runtimeOptions),
      reviewerFindings,
      reviewSuggestions: readJson(REVIEW_SUGGESTIONS_FILE, null, runtimeOptions),
      arbitratorDecision,
      currentCycle,
      reworkPlan,
      reworkPrompt,
      verificationResults: readJson(VERIFY_RESULTS_FILE, null, runtimeOptions),
      cycleHistory
    };
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      launch,
      agentic,
      currentCycle,
      reworkPlan,
      reworkPrompt,
      cycleHistory
    });
    return;
  }

  if (req.url === '/odt/verify/run') {
    const verificationRun = runVerificationEvidence(runtimeOptions, payload);
    const agentic = {
      taskGraph: readJson(TASK_GRAPH_FILE, null, runtimeOptions),
      executionPlan: normalizeExecutionPlan(readJson(EXECUTION_PLAN_FILE, null, runtimeOptions)),
      schedulerDecision: readJson(SCHEDULER_DECISION_FILE, null, runtimeOptions),
      agentRoster: readJson(AGENT_ROSTER_FILE, null, runtimeOptions),
      reviewerPlan: readJson(REVIEWER_PLAN_FILE, null, runtimeOptions),
      reviewerFindings: readJson(REVIEW_SUMMARY_FILE, null, runtimeOptions),
      reviewSuggestions: readJson(REVIEW_SUGGESTIONS_FILE, null, runtimeOptions),
      arbitratorDecision: readJson(ARBITRATOR_DECISION_FILE, null, runtimeOptions),
      currentCycle: verificationRun.currentCycle,
      reworkPlan: readText(REWORK_PLAN_FILE, '', runtimeOptions),
      reworkPrompt: readText(REWORK_PROMPT_FILE, '', runtimeOptions),
      verificationResults: verificationRun.verificationResults,
      cycleHistory: verificationRun.cycleHistory
    };
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: verificationRun.verificationResults.status,
      agentic,
      verificationResults: verificationRun.verificationResults,
      currentCycle: verificationRun.currentCycle,
      cycleHistory: verificationRun.cycleHistory
    });
    return;
  }

  if (req.url === '/odt/agent/reset') {
    const launch = resetAgentLaunchState({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      note: payload.note || 'Delegated agent status was reset.'
    });
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, {
      status: 'ok',
      launch
    });
    return;
  }

  if (req.url === '/odt/agent/launch') {
    const intake = readJson('reports/dev-twin/intake.json', defaultIntake(), runtimeOptions);
    const contextArtifacts = persistContextArtifacts(intake, runtimeOptions);
    if (hasBlockingContextArtifacts(contextArtifacts) && !payload.forceLaunch) {
      writeSnapshot(undefined, runtimeOptions);
      json(res, 200, {
        status: 'needs_input',
        contextArtifacts,
        note: 'Agent launch paused because one or more context artifacts are missing or invalid.'
      });
      return;
    }
    if (payload.refresh !== false || !exists('reports/odt/execute/prompt.md', runtimeOptions)) {
      await runOdtExecute({ ...runtimeOptions, refresh: true });
    }
    const launch = launchExternalAgent({
      ...runtimeOptions,
      tool: payload.tool || 'codex',
      mode: payload.mode || 'terminal'
    });
    writeSnapshot(undefined, runtimeOptions);
    json(res, 200, { status: 'ok', launch, contextArtifacts });
    return;
  }

  json(res, 404, { error: 'Not found', path: req.url });
}

function serveLocalContext(args) {
  const port = Number(args.port || 4310);
  const host = args.host || '127.0.0.1';
  const serverOptions = {
    workspaceRoot: args['workspace-root'] || process.cwd(),
    targetRepoPath: args['target-repo-path']
  };

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      json(res, 200, { ok: true });
      return;
    }

    try {
      if (req.url === '/health') {
        json(res, 200, { ok: true, generatedAt: new Date().toISOString() });
        return;
      }

      const payload = buildLocalContext(serverOptions);
      const routes = {
        '/context': payload,
        '/repo/status': payload.repoStatus,
        '/odt': payload.odt,
        '/odt/clarifications': payload.clarifications || { status: 'not_generated', questions: [] },
        '/odt/conversation': payload.conversation || { phase: 'draft', status: 'not_started' },
        '/odt/agentic': payload.agentic || {
          taskGraph: null,
          executionPlan: null,
          schedulerDecision: null,
          agentRoster: null,
          reviewerPlan: null,
          reviewerFindings: null,
          reviewSuggestions: null,
          arbitratorDecision: null,
          currentCycle: null,
          reworkPlan: '',
          reworkPrompt: '',
          verificationResults: null,
          cycleHistory: null
        },
        '/odt/context-artifacts': payload.contextArtifacts || { status: 'empty', summary: { total: 0, ready: 0, missing: 0, invalid: 0 }, artifacts: [] },
        '/odt/review-packet': payload.reviewPacket || { status: 'empty', summary: { changedFiles: 0 }, files: [] },
        '/odt/review-suggestions': payload.agentic && payload.agentic.reviewSuggestions ? payload.agentic.reviewSuggestions : { status: 'empty', suggestions: [] },
        '/odt/verify-results': payload.agentic && payload.agentic.verificationResults ? payload.agentic.verificationResults : null,
        '/odt/cycle-history': payload.agentic && payload.agentic.cycleHistory ? payload.agentic.cycleHistory : buildCycleHistory(serverOptions),
        '/odt/prompt-provider-status': payload.promptProviderStatus,
        '/dev-twin': payload.devTwin,
        '/a11y': payload.a11yTwin,
        '/intake': payload.intake,
        '/odt/execute/status': payload.execute.applySummary || payload.execute.status,
        '/odt/agent/status': payload.execute.agentLaunch
      };

      if (req.method === 'POST') {
        await handlePost(req, res, serverOptions);
        return;
      }

      if (!routes[req.url]) {
        json(res, 404, { error: 'Not found', path: req.url });
        return;
      }

      json(res, 200, routes[req.url]);
    } catch (error) {
      json(res, 500, { error: error.message || 'Unexpected server error' });
    }
  });

  server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE') {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        command: 'mcp:local serve',
        status: 'already_running',
        host,
        port,
        message: `Local context server is already running at http://${host}:${port}. Reuse the existing server or stop the stale process before restarting.`
      }, null, 2));
      return;
    }

    throw error;
  });

  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      command: 'mcp:local serve',
      status: 'listening',
      host,
      port,
      endpoints: [
        '/health',
        '/context',
        '/repo/status',
        '/odt',
        '/odt/clarifications',
        '/odt/conversation',
        '/odt/agentic',
        '/odt/context-artifacts',
        '/odt/review-packet',
        '/odt/review-suggestions',
        '/odt/verify-results',
        '/odt/cycle-history',
        '/odt/prompt-provider-status',
        '/dev-twin',
        '/a11y',
        '/intake',
        '/odt/execute/status',
        '/odt/agent/status',
        'POST /intake',
        'POST /repo/pick',
        'POST /repo/status',
        'POST /repo/init-git',
        'POST /files/upload',
        'POST /files/remove',
        'POST /files/clear',
        'POST /odt/new-task',
        'POST /odt/run',
        'POST /odt/continue',
        'POST /odt/clarifications/generate',
        'POST /odt/clarifications/answer',
        'POST /odt/execute',
        'POST /odt/reviewers/run',
        'POST /odt/review-packet/refresh',
        'POST /odt/review-suggestions/update',
        'POST /odt/rework/prepare',
        'POST /odt/rework/launch',
        'POST /odt/verify/run',
        'POST /odt/agent/reset',
        'POST /odt/agent/launch'
      ]
    }, null, 2));
  });

  return server;
}

module.exports = {
  buildLocalContext,
  writeSnapshot,
  serveLocalContext
};
