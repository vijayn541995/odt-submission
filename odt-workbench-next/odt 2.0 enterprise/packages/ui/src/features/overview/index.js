export { OverviewPage } from './OverviewPage.jsx';

export const overviewFeature = {
  id: 'overview',
  label: 'Overview',
  legacyComponent: 'OverviewPage',
  legacySource: 'src/main.jsx:628',
  migrationStatus: 'wired',
  owns: [
    'assignment status summary',
    'workflow next action',
    'standards health summary',
    'recent activity and readiness signals'
  ]
};
