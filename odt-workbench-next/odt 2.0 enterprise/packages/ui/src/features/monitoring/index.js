export { MonitoringPage } from './MonitoringPage.jsx';

export const monitoringFeature = {
  id: 'monitoring',
  label: 'Monitoring',
  legacyComponent: 'MonitoringPage',
  legacySource: 'src/main.jsx:4078',
  migrationStatus: 'wired',
  owns: [
    'connector health',
    'validation runs',
    'error log triage',
    'UI smoke status'
  ]
};
