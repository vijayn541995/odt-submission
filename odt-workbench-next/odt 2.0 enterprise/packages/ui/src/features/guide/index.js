export { GuidePage } from './GuidePage.jsx';

export const guideFeature = {
  id: 'guide',
  label: 'ODT Guide',
  legacyComponent: 'GuidePage',
  legacySource: 'src/main.jsx:3930',
  migrationStatus: 'wired',
  owns: [
    'evidence-aware guide chat',
    'source metadata display',
    'suggested prompts',
    'provider fallback messaging'
  ]
};
