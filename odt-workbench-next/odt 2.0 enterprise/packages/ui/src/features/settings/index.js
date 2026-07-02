export { SettingsPage } from './SettingsPage.jsx';

export const settingsFeature = {
  id: 'settings',
  label: 'Settings',
  legacyComponent: 'SettingsPage',
  legacySource: 'src/main.jsx:4358',
  migrationStatus: 'wired',
  owns: [
    'safe provider status',
    'connector configuration status',
    'runtime settings visibility',
    'governed configuration cues'
  ]
};
