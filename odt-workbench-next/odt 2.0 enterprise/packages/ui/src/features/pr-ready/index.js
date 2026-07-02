export { PrReadinessPage } from './PrReadinessPage.jsx';

export const prReadyFeature = {
  id: 'pr',
  label: 'PR Ready',
  legacyComponent: 'PrReadinessPage',
  legacySource: 'src/main.jsx:3469',
  migrationStatus: 'wired',
  owns: [
    'PR readiness gate',
    'blocking item display',
    'copyable PR markdown',
    'verification checklist'
  ]
};
