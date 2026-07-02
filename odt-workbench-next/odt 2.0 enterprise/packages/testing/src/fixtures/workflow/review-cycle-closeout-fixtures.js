export const reviewCycleCloseoutFixtures = [
  {
    name: 'open rework relay',
    expectedStatus: 'REWORK_EVIDENCE_REQUIRED',
    expectedNextAction: 'Launch Rework Worker',
    evidence: {
      assignment: { id: 'assignment-review-closeout' },
      agentRelayItems: [
        {
          id: 'relay_1',
          itemType: 'rework',
          status: 'open',
          targetWorkerRole: 'fullstack-dev',
          targetLane: 'Senior Full Stack Dev Rework',
          createdAt: '2026-06-16T05:30:51.408Z'
        }
      ],
      implementationEvidence: [],
      agentWorkerRuns: [],
      prReadinessReports: [],
      reviewComments: []
    }
  },
  {
    name: 'ready for pr pack after verifier',
    expectedStatus: 'PR_PACK_REQUIRED',
    expectedNextAction: 'Prepare PR Pack',
    evidence: {
      assignment: { id: 'assignment-review-closeout' },
      agentRelayItems: [
        {
          id: 'relay_1',
          itemType: 'rework',
          status: 'assigned',
          targetWorkerRole: 'fullstack-dev',
          targetLane: 'Senior Full Stack Dev Rework',
          createdAt: '2026-06-16T05:30:51.408Z'
        }
      ],
      implementationEvidence: [
        {
          id: 'impl_1',
          createdAt: '2026-06-16T06:00:00.000Z',
          tests: [{ name: 'build', status: 'passed' }]
        }
      ],
      agentWorkerRuns: [
        {
          id: 'reviewer_1',
          workerRole: 'reviewer',
          status: 'completed',
          output: { responseBytes: 2048 },
          createdAt: '2026-06-16T06:10:00.000Z'
        },
        {
          id: 'build_1',
          workerRole: 'build-verifier',
          status: 'completed',
          output: { responseBytes: 1024, logBytes: 4096 },
          createdAt: '2026-06-16T06:20:00.000Z'
        }
      ],
      prReadinessReports: [],
      reviewComments: []
    }
  }
];
