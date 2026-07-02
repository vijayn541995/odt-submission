export { StandardsPage } from './StandardsPage.jsx';

export const standardsFeature = {
  id: 'standards',
  label: 'Standards',
  legacyComponent: 'StandardsPage',
  legacySource: 'src/main.jsx:1410',
  migrationStatus: 'wired',
  owns: [
    'standards check execution',
    'findings review',
    'approval and override capture',
    'dependency governance'
  ]
};
