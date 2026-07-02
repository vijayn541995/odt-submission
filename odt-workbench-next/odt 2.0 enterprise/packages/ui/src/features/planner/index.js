export { PlannerPage } from './PlannerPage.jsx';

export const plannerFeature = {
  id: 'planner',
  label: 'Planner',
  legacyComponent: 'PlannerPage',
  legacySource: 'src/main.jsx:1223',
  migrationStatus: 'wired',
  owns: [
    'technical design review',
    'implementation plan review',
    'impacted file analysis',
    'pre-write planning gates'
  ]
};
