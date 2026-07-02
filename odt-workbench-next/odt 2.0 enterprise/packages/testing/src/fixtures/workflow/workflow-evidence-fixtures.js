const completedJiraRequirementText = `Jira: JOURNEY-25366
ODT Work State:
- Classification: Completed in Jira
- Recommended Mode: Verification
Repository: /Users/vn105957/Desktop/lpDev/journey-builder-js
Signals:
- ticket_reference_found
- JOURNEY-25366 appears in 5 git commits`;

export const workflowEvidenceFixtures = [
  {
    name: 'completed Jira verification profile and fresh evidence split',
    evidence: {
      assignment: { id: 'assignment-completed-jira-evidence' },
      requirements: [
        {
          id: 'req_completed_jira_1',
          sourceType: 'jira-import',
          rawText: completedJiraRequirementText,
          createdAt: '2026-06-16T09:55:00.000Z',
          updatedAt: '2026-06-16T10:00:00.000Z'
        }
      ],
      repoAnalysis: [
        {
          id: 'repo_old',
          repoPath: '/Users/vn105957/Desktop/lpDev/old-analysis',
          createdAt: '2026-06-16T09:30:00.000Z'
        },
        {
          id: 'repo_current',
          repoPath: '/Users/vn105957/Desktop/lpDev/journey-builder-js',
          createdAt: '2026-06-16T10:05:00.000Z'
        }
      ],
      technicalDesigns: [],
      implementationPlans: [],
      standardsChecks: [
        {
          id: 'standards_current',
          createdAt: '2026-06-16T10:06:00.000Z',
          findings: [{ id: 'finding_current', status: 'INFO' }]
        }
      ],
      approvals: [],
      testPlans: [],
      implementationEvidence: [],
      aiWorkAuditPacks: [
        {
          id: 'audit_old',
          stage: 'implementation-evidence',
          createdAt: '2026-06-16T09:40:00.000Z',
          packJson: { artifactType: 'ai-work-audit-pack' }
        },
        {
          id: 'audit_current',
          stage: 'pr-ready',
          createdAt: '2026-06-16T10:08:00.000Z',
          packJson: { artifactType: 'ai-work-audit-pack' }
        }
      ],
      prReadinessReports: [],
      reviewComments: [],
      agentEvents: [],
      agentWorkerRuns: [],
      agentRelayItems: [],
      agentFoundryRuns: [{ id: 'foundry_all_time', createdAt: '2026-06-16T09:20:00.000Z' }],
      dependencyRequests: []
    },
    expectedProfile: {
      issueKey: 'JOURNEY-25366',
      state: 'completed',
      mode: 'verification',
      repoPath: '/Users/vn105957/Desktop/lpDev/journey-builder-js',
      hasRepoEvidence: true,
      commitCount: 5
    },
    expectedFreshness: {
      cutoffAt: '2026-06-16T10:00:00.000Z',
      current: {
        repoAnalysis: 1,
        standardsChecks: 1,
        aiWorkAuditPacks: 1
      },
      historical: {
        repoAnalysis: 1,
        standardsChecks: 0,
        aiWorkAuditPacks: 1
      }
    },
    expectedScoped: {
      repoAnalysis: 1,
      standardsFindings: 1,
      agentFoundryRuns: 1,
      aiWorkAuditPacks: 1
    }
  }
];
