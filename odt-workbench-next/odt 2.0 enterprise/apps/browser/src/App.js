import React from 'react';
import { AppShell, sidebarFeatureRegistry } from '@odt/ui';

export function BrowserApp({ activePage = 'overview', onNavigate = () => {} } = {}) {
  return React.createElement(
    AppShell,
    {
      activePage,
      onNavigate,
      sidebarProps: {
        features: sidebarFeatureRegistry
      },
      header: React.createElement('header', { className: 'top-header' }, 'ODT Browser Shell')
    },
    React.createElement('section', { className: 'page-placeholder' }, 'Shared ODT UI will render the active feature here.')
  );
}
