export const workflowDerivationFixtures = [
  {
    name: 'derive intake started',
    expectedState: 'INTAKE_STARTED',
    evidence: {
      assignment: { id: 'assignment-derived-intake' }
    }
  },
  {
    name: 'derive review cycle closeout',
    expectedState: 'REVIEW_CYCLE_CLOSEOUT',
    evidence: {
      assignment: { id: 'assignment-derived-closeout' },
      requirements: [{ id: 'req_1', createdAt: '2026-06-16T05:00:00.000Z', status: 'REQUIREMENT_ANALYZED' }],
      repoAnalysis: [{ id: 'repo_1', createdAt: '2026-06-16T05:01:00.000Z', status: 'REPO_ANALYZED' }],
      technicalDesigns: [{ id: 'design_1', createdAt: '2026-06-16T05:02:00.000Z', status: 'TECH_DESIGN_DRAFTED' }],
      implementationPlans: [{ id: 'plan_1', createdAt: '2026-06-16T05:03:00.000Z', status: 'PLAN_REVIEW' }],
      standardsChecks: [{ id: 'std_1', createdAt: '2026-06-16T05:04:00.000Z', status: 'PASS', findings: [] }],
      approvals: [
        {
          id: 'approval_1',
          approvalType: 'write_scope',
          status: 'approved',
          approvedAt: '2026-06-16T05:05:00.000Z'
        }
      ],
      agentEvents: [{ id: 'event_1', eventType: 'handoff_prepared', status: 'prepared', createdAt: '2026-06-16T05:06:00.000Z' }],
      agentRelayItems: [
        {
          id: 'relay_1',
          itemType: 'rework',
          status: 'open',
          targetWorkerRole: 'fullstack-dev',
          targetLane: 'Senior Full Stack Dev Rework',
          createdAt: '2026-06-16T05:07:00.000Z'
        }
      ],
      agentWorkerRuns: [],
      implementationEvidence: [],
      prReadinessReports: [],
      reviewComments: [],
      dependencyRequests: []
    }
  }
];
