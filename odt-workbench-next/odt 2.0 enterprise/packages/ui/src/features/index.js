import { SIDEBAR_FEATURES } from '@odt/config';
import { agentTeamFeature } from './agent-team/index.js';
import { artifactsFeature } from './artifacts/index.js';
import { guideFeature } from './guide/index.js';
import { intakeFeature } from './intake/index.js';
import { monitoringFeature } from './monitoring/index.js';
import { overviewFeature } from './overview/index.js';
import { plannerFeature } from './planner/index.js';
import { prReadyFeature } from './pr-ready/index.js';
import { reviewFeature } from './review/index.js';
import { runsFeature } from './runs/index.js';
import { settingsFeature } from './settings/index.js';
import { standardsFeature } from './standards/index.js';

export { AgentTeamPage } from './agent-team/index.js';
export { RunsPage } from './runs/index.js';
export { SettingsPage } from './settings/index.js';
export { MonitoringPage } from './monitoring/index.js';
export { OverviewPage } from './overview/index.js';
export { IntakePage } from './intake/index.js';
export { GuidePage } from './guide/index.js';
export { ArtifactsPage } from './artifacts/index.js';
export { PlannerPage } from './planner/index.js';
export { PrReadinessPage } from './pr-ready/index.js';
export { ReviewPage } from './review/index.js';
export { StandardsPage } from './standards/index.js';

export const UI_FEATURE_MIGRATION_STATUS = {
  PLANNED: 'planned',
  EXTRACTING: 'extracting',
  EXTRACTED: 'extracted',
  WIRED: 'wired'
};

export const extractedSidebarFeatures = [
  overviewFeature,
  intakeFeature,
  plannerFeature,
  standardsFeature,
  agentTeamFeature,
  reviewFeature,
  prReadyFeature,
  artifactsFeature,
  guideFeature,
  runsFeature,
  monitoringFeature,
  settingsFeature
];

export const sidebarFeatureRegistry = SIDEBAR_FEATURES.map((feature) => {
  const extractedFeature = extractedSidebarFeatures.find((item) => item.id === feature.id) || {};
  return {
    ...feature,
    ...extractedFeature,
    status: extractedFeature.migrationStatus || UI_FEATURE_MIGRATION_STATUS.PLANNED,
    targetFolder: `packages/ui/src/features/${feature.id === 'team' ? 'agent-team' : feature.id === 'pr' ? 'pr-ready' : feature.id}`
  };
});

export function featureById(id) {
  return sidebarFeatureRegistry.find((feature) => feature.id === id) || sidebarFeatureRegistry[0];
}
