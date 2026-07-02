import React from 'react';
import { AppShell, sidebarFeatureRegistry } from '@odt/ui';

export function NativeRendererApp({ activePage = 'overview', onNavigate = () => {} } = {}) {
  return React.createElement(
    AppShell,
    {
      activePage,
      onNavigate,
      sidebarProps: {
        features: sidebarFeatureRegistry,
        productSubtitle: 'Native engineering control plane'
      },
      header: React.createElement('header', { className: 'top-header' }, 'ODT Native Shell')
    },
    React.createElement('section', { className: 'page-placeholder' }, 'Native shell will host the shared ODT UI here.')
  );
}
