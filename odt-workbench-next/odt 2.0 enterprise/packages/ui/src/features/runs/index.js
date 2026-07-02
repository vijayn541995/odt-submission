export { RunsPage } from './RunsPage.js';

export const runsFeature = {
  id: 'runs',
  label: 'Runs',
  legacyComponent: 'RunsPage',
  legacySource: 'src/main.jsx:4040',
  migrationStatus: 'wired',
  owns: [
    'run timeline',
    'run event details',
    'worker run evidence',
    'activity history'
  ]
};
