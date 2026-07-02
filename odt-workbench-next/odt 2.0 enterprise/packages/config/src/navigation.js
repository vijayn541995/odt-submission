export const DEFAULT_ASSIGNMENT_ID = 'assignment-local-mvp';

export const SIDEBAR_FEATURES = [
  { id: 'overview', label: 'Overview', componentName: 'OverviewPage', legacyLine: 521 },
  { id: 'intake', label: 'Intake', componentName: 'IntakePage', legacyLine: 627 },
  { id: 'planner', label: 'Planner', componentName: 'PlannerPage', legacyLine: 1129 },
  { id: 'standards', label: 'Standards', componentName: 'StandardsPage', legacyLine: 1410 },
  { id: 'team', label: 'Agent Team', componentName: 'AgentTeamPage', legacyLine: 2111 },
  { id: 'review', label: 'Review', componentName: 'ReviewPage', legacyLine: 2917 },
  { id: 'pr', label: 'PR Ready', componentName: 'PrReadinessPage', legacyLine: 3469 },
  { id: 'artifacts', label: 'Artifacts', componentName: 'ArtifactsPage', legacyLine: 3712 },
  { id: 'guide', label: 'ODT Guide', componentName: 'GuidePage', legacyLine: 3930 },
  { id: 'runs', label: 'Runs', componentName: 'RunsPage', legacyLine: 4040 },
  { id: 'monitoring', label: 'Monitoring', componentName: 'MonitoringPage', legacyLine: 4078 },
  { id: 'settings', label: 'Settings', componentName: 'SettingsPage', legacyLine: 4358 }
];

export const SIDEBAR_FEATURE_IDS = SIDEBAR_FEATURES.map((feature) => feature.id);

export function isKnownSidebarFeature(pageId) {
  return SIDEBAR_FEATURE_IDS.includes(pageId);
}

export function defaultSidebarFeature(pageId) {
  return isKnownSidebarFeature(pageId) ? pageId : 'overview';
}
