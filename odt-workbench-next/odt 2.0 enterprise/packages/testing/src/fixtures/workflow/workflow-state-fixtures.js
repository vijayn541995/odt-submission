export const workflowStateFixtures = [
  {
    name: 'intake started',
    expectedState: 'INTAKE_STARTED',
    workflow: {
      assignmentId: 'assignment-local-mvp',
      state: 'INTAKE_STARTED',
      label: 'Intake Started',
      stage: 'intake',
      status: 'in_progress',
      nextAction: {
        label: 'Start Intake',
        detail: 'Capture requirement, Jira, repo, and scope.',
        page: 'intake'
      },
      verificationProfile: null,
      blockedReasons: [],
      completed: {
        requirement: false,
        repo: false,
        technicalDesign: false,
        implementationPlan: false,
        standardsCheck: false,
        writeApproval: false,
        agentHandoff: false,
        implementationEvidence: false,
        postImplementationCheck: false,
        prPack: false
      },
      decisionTrail: [],
      allowedActions: {
        canRunStandardsCheck: false,
        canApproveWrite: false,
        canDelegateWrite: false,
        canLaunchVerification: false,
        canRecordImplementationEvidence: false,
        canPreparePr: false,
        dependencyInstallsRequireSeparateApproval: true
      },
      counts: {
        standardsBlockers: 0,
        reviewBlockers: 0,
        pendingDependencies: 0,
        failedTests: 0,
        incompleteTests: 0,
        prBlockingItems: 0
      },
      latest: {
        standardsCheckId: '',
        postImplementationCheckId: '',
        implementationEvidenceId: '',
        prReportStatus: ''
      }
    }
  },
  {
    name: 'completed Jira verification',
    expectedState: 'JIRA_COMPLETED_VERIFICATION',
    workflow: {
      assignmentId: 'assignment_journey-25366',
      state: 'JIRA_COMPLETED_VERIFICATION',
      label: 'Completed Jira Verification',
      stage: 'review',
      status: 'in_progress',
      nextAction: {
        label: 'Launch Reviewer',
        detail: 'JOURNEY-25366 is Done in Jira and has 5 matching git commits. Use Reviewer first, then capture build/test evidence before PR readiness.',
        page: 'team',
        targetWorkerRole: 'reviewer'
      },
      verificationProfile: {
        issueKey: 'JOURNEY-25366',
        state: 'completed',
        mode: 'verification',
        label: 'Completed Jira Verification',
        createdAt: '2026-06-05T07:32:48.913Z',
        repoPath: '/Users/vn105957/Desktop/lpdev/journey-builder-js',
        hasRepoEvidence: true,
        commitCount: 5,
        summary: 'JOURNEY-25366 is Done in Jira and has 5 matching git commits.',
        nextAction: 'Launch Reviewer, then capture build/test evidence before PR readiness.'
      },
      blockedReasons: [],
      completed: {
        requirement: true,
        repo: true,
        technicalDesign: false,
        implementationPlan: false,
        standardsCheck: false,
        writeApproval: false,
        agentHandoff: false,
        implementationEvidence: false,
        postImplementationCheck: false,
        prPack: false
      },
      decisionTrail: [
        {
          type: 'requirement',
          label: 'Requirement analyzed',
          status: 'completed',
          detail: 'JOURNEY-25366 imported as completed Jira work.',
          createdAt: '2026-06-05T07:32:48.913Z',
          page: 'intake'
        }
      ],
      allowedActions: {
        canRunStandardsCheck: true,
        canApproveWrite: false,
        canDelegateWrite: false,
        canLaunchVerification: true,
        canRecordImplementationEvidence: true,
        canPreparePr: false,
        dependencyInstallsRequireSeparateApproval: true
      },
      counts: {
        standardsBlockers: 0,
        reviewBlockers: 0,
        pendingDependencies: 0,
        failedTests: 0,
        incompleteTests: 0,
        prBlockingItems: 0
      },
      latest: {
        standardsCheckId: '',
        postImplementationCheckId: '',
        implementationEvidenceId: '',
        prReportStatus: ''
      }
    }
  },
  {
    name: 'standards blocked',
    expectedState: 'BLOCKED',
    workflow: {
      assignmentId: 'assignment-standards-blocked',
      state: 'BLOCKED',
      label: 'Blocked',
      stage: 'standards',
      status: 'blocked',
      nextAction: {
        label: 'Review Blocking Items',
        detail: 'Resolve standards blockers before continuing.',
        page: 'standards'
      },
      verificationProfile: null,
      blockedReasons: [
        {
          category: 'standards',
          message: 'Frontend secrets are not allowed.',
          action: 'Move secrets to backend-owned configuration.',
          page: 'standards'
        }
      ],
      completed: {
        requirement: true,
        repo: true,
        technicalDesign: true,
        implementationPlan: true,
        standardsCheck: true,
        writeApproval: false,
        agentHandoff: false,
        implementationEvidence: false,
        postImplementationCheck: false,
        prPack: false
      },
      decisionTrail: [
        {
          type: 'standards',
          label: 'Standards check completed',
          status: 'BLOCKER',
          detail: 'Pre-write standards review found hard blocker.',
          createdAt: '2026-06-16T10:00:00.000Z',
          page: 'standards'
        }
      ],
      allowedActions: {
        canRunStandardsCheck: true,
        canApproveWrite: true,
        canDelegateWrite: false,
        canLaunchVerification: false,
        canRecordImplementationEvidence: false,
        canPreparePr: false,
        dependencyInstallsRequireSeparateApproval: true
      },
      counts: {
        standardsBlockers: 1,
        reviewBlockers: 0,
        pendingDependencies: 0,
        failedTests: 0,
        incompleteTests: 0,
        prBlockingItems: 0
      },
      latest: {
        standardsCheckId: 'check_standards_blocked',
        postImplementationCheckId: '',
        implementationEvidenceId: '',
        prReportStatus: ''
      }
    }
  },
  {
    name: 'pr ready',
    expectedState: 'PR_READY',
    workflow: {
      assignmentId: 'assignment-pr-ready',
      state: 'PR_READY',
      label: 'Ready For PR Review',
      stage: 'pr',
      status: 'ready',
      nextAction: {
        label: 'Copy PR Markdown',
        detail: 'Review and copy the generated PR package.',
        page: 'pr'
      },
      verificationProfile: null,
      blockedReasons: [],
      completed: {
        requirement: true,
        repo: true,
        technicalDesign: true,
        implementationPlan: true,
        standardsCheck: true,
        writeApproval: true,
        agentHandoff: true,
        implementationEvidence: true,
        postImplementationCheck: true,
        prPack: true
      },
      decisionTrail: [
        {
          type: 'pr',
          label: 'PR readiness pack generated',
          status: 'PR_READY_REVIEW',
          detail: 'PR-ready evidence package generated.',
          createdAt: '2026-06-16T11:00:00.000Z',
          page: 'pr'
        }
      ],
      allowedActions: {
        canRunStandardsCheck: true,
        canApproveWrite: false,
        canDelegateWrite: true,
        canLaunchVerification: false,
        canRecordImplementationEvidence: true,
        canPreparePr: true,
        dependencyInstallsRequireSeparateApproval: true
      },
      counts: {
        standardsBlockers: 0,
        reviewBlockers: 0,
        pendingDependencies: 0,
        failedTests: 0,
        incompleteTests: 0,
        prBlockingItems: 0
      },
      latest: {
        standardsCheckId: 'check_post_implementation',
        postImplementationCheckId: 'check_post_implementation',
        implementationEvidenceId: 'impl_ev_1',
        prReportStatus: 'PR_READY_REVIEW'
      }
    }
  }
];
