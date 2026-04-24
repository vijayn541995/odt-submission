function defaultIntake() {
  return {
    title: 'Accessible activity filtering',
    featureName: 'Accessible activity filtering',
    summary: 'Add quick filtering to the activity list with keyboard and screen-reader friendly interactions.',
    reviewEdits: '',
    promptOverrides: {
      intake: '',
      impact: '',
      design: '',
      code: '',
      unitTests: '',
      compliance: '',
      verify: ''
    },
    targetRepoPath: '',
    workItemType: 'feature',
    jira: {
      ticketId: '',
      url: ''
    },
    scope: {
      uiSurface: 'web',
      complexity: 'medium',
      repoScan: 'full'
    },
    requirements: {
      acceptanceCriteria: [
        'User can filter activities by keyword without leaving the page',
        'Filtering updates are announced clearly for assistive technology users',
        'Keyboard users can open, clear, and navigate filter controls'
      ],
      nonFunctional: ['a11y', 'performance', 'analytics'],
      outOfScope: [
        'No backend API changes',
        'Do not alter existing permissions behavior'
      ]
    },
    designInputs: {
      mockupImages: [],
      referenceDocs: [],
      jiraLinks: []
    },
    constraints: {
      noNewDependencies: true,
      releaseWindowDays: 10,
      approvedLibrariesOnly: true
    },
    developerHints: {
      suspectedAreas: [],
      relatedComponents: [],
      notes: 'Optional only. ODT should infer impact areas from the repo when hints are not provided.'
    },
    defectContext: {
      defectId: '',
      observedBehavior: '',
      expectedBehavior: '',
      severity: 'medium'
    }
  };
}

function intakeQuestionsMarkdown() {
  const lines = [
    '# Developer Twin Intake Questions',
    '',
    'Use these questions before coding to improve safety, clarity, and agent quality.',
    '',
    '## Ticket Intake',
    '- What is the Jira/story title and short summary?',
    '- Is this a feature, defect, or enhancement?',
    '- What user or business outcome should improve after this change?',
    '',
    '## Acceptance & UX',
    '- What must be true for this ticket to be accepted?',
    '- What behavior must never change?',
    '- Is there a mockup, reference screen, or interaction flow?',
    '- What are loading, empty, and error states?',
    '- Are keyboard and screen-reader behaviors defined?',
    '',
    '## Repo Analysis Inputs',
    '- Are there optional hints about suspected files, modules, or shared components?',
    '- Are there related Jira links, docs, or screenshots to attach?',
    '- What backward compatibility constraints exist?',
    '',
    '## Compliance & Review',
    '- Which VPAT/WCAG expectations are mandatory for this work?',
    '- Which unit or regression tests should be reviewed or added?',
    '- What would need explicit human approval before merge?',
    '',
    '## Defect-Only Questions',
    '- What is the observed behavior?',
    '- What is the expected behavior?',
    '- How severe is the issue and how easy is it to reproduce?',
    '',
    '## Release Notes',
    '- Are there release-window or dependency constraints?',
    '- Is rollback guidance needed if issues are found post-release?',
    '',
    '## What ODT Will Infer',
    '- Candidate impact areas in the repo',
    '- Related tests and regression surfaces',
    '- Accessibility and keyboard risks',
    '- Code and test workpacks for human review',
    '',
    '## Human Review Reminder',
    '- AI output is a draft for review, not an automatic merge decision.',
    '- Which unit/integration tests must be created or updated?',
    ''
  ];

  return `${lines.join('\n')}\n`;
}

module.exports = {
  defaultIntake,
  intakeQuestionsMarkdown
};
