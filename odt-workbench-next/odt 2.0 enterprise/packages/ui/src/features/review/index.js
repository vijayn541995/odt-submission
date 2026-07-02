export { ReviewPage } from './ReviewPage.jsx';

export const reviewFeature = {
  id: 'review',
  label: 'Review',
  legacyComponent: 'ReviewPage',
  legacySource: 'src/main.jsx:2917',
  migrationStatus: 'wired',
  owns: [
    'review comments',
    'risk decisions',
    'implementation evidence capture',
    'completed-Jira verification evidence'
  ]
};
