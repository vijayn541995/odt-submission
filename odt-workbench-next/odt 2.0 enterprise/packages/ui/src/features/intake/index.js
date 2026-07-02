export { IntakePage } from './IntakePage.jsx';

export const intakeFeature = {
  id: 'intake',
  label: 'Intake',
  legacyComponent: 'IntakePage',
  legacySource: 'src/main.jsx:640',
  migrationStatus: 'wired',
  owns: [
    'requirement and Jira input',
    'target repository input',
    'context asset upload',
    'read-only repo and Jira evidence capture'
  ]
};
