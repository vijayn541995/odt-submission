jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

const fs = require('fs');
const { execSync } = require('child_process');
const { analyzeImpact } = require('../../../packages/accessibility-ai-shield/src/dev-twin/impact');

describe('developer twin impact manifest scoring', () => {
  beforeEach(() => {
    execSync.mockImplementation((command) => {
      if (command === 'rg --files src') {
        return [
          'src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/display_activity.jsx',
          'src/journey-builder-app/modules/journey-builder/activities/container-components/activity-pages/home/components/SearchHistoryList.jsx',
          'src/journey-builder-app/modules/admin/users/components/user_grid.jsx'
        ].join('\n');
      }

      if (command.startsWith('rg --files tests/jest')) {
        return 'tests/jest/modules/activity/display_activity.test.js';
      }

      return '';
    });

    jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, encoding) => {
      if (encoding !== 'utf8') return '';

      if (`${filePath}`.includes('display_activity.jsx')) {
        return [
          'import React from "react";',
          'export class DisplayActivity extends React.Component {',
          '  render() {',
          '    return <div>Quick filter activities</div>;',
          '  }',
          '}'
        ].join('\n');
      }

      if (`${filePath}`.includes('SearchHistoryList.jsx')) {
        return [
          'import React from "react";',
          'export default function SearchHistoryList() {',
          '  return <div>Recent activity searches</div>;',
          '}'
        ].join('\n');
      }

      if (`${filePath}`.includes('user_grid.jsx')) {
        return [
          'import React from "react";',
          'export const UserGrid = () => <div>Users</div>;'
        ].join('\n');
      }

      return '';
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    execSync.mockReset();
  });

  it('surfaces candidate details with export, preview, and scoring signals', () => {
    const impact = analyzeImpact({
      title: 'Accessible activity filtering',
      featureName: 'Accessible activity filtering',
      summary: 'Add quick filter for activities with keyboard friendly interactions.',
      workItemType: 'feature',
      requirements: {
        acceptanceCriteria: [
          'User can filter activities by keyword',
          'Keyboard users can operate filter controls'
        ],
        nonFunctional: ['a11y']
      },
      developerHints: {
        suspectedAreas: [],
        relatedComponents: []
      },
      scope: {
        modulesTouched: []
      },
      defectContext: {}
    });

    expect(impact.inference.mode).toBe('repo_inferred_manifest');
    expect(impact.inference.candidateFiles[0]).toContain('display_activity.jsx');
    expect(impact.inference.candidateDetails[0].exportNames).toContain('DisplayActivity');
    expect(impact.inference.candidateDetails[0].preview).toContain('Quick filter activities');
    expect(impact.inference.candidateDetails[0].reasons.join(' ')).toContain('preview:filter');
  });
});
