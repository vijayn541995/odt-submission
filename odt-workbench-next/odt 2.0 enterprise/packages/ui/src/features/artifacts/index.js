export { ArtifactsPage } from './ArtifactsPage.jsx';

export const artifactsFeature = {
  id: 'artifacts',
  label: 'Artifacts',
  legacyComponent: 'ArtifactsPage',
  legacySource: 'src/main.jsx:3712',
  migrationStatus: 'wired',
  owns: [
    'stored evidence browser',
    'design and plan artifacts',
    'context vault display',
    'PR and worker evidence views'
  ]
};
