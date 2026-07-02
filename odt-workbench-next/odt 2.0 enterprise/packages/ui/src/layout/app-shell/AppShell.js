import React from 'react';
import { Sidebar } from '../sidebar/index.js';

export function AppShell({
  activePage,
  onNavigate,
  sidebarProps = {},
  header = null,
  children
}) {
  return React.createElement(
    'div',
    { className: 'app-shell' },
    React.createElement(Sidebar, {
      activePage,
      onNavigate,
      ...sidebarProps
    }),
    React.createElement(
      'main',
      { className: 'main-shell' },
      header,
      children
    )
  );
}
