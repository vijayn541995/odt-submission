export { AgentTeamPage } from './AgentTeamPage.jsx';

export const agentTeamFeature = {
  id: 'team',
  label: 'Agent Team',
  legacyComponent: 'AgentTeamPage',
  legacySource: 'src/main.jsx:865',
  migrationStatus: 'wired',
  owns: [
    'execution agent selection',
    'worker role launch',
    'Agent Foundry panel',
    'worker output and relay controls'
  ]
};
