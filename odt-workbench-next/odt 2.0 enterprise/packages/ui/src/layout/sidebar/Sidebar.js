import React from 'react';
import { SIDEBAR_FEATURES } from '@odt/config';

export function Sidebar({
  activePage = 'overview',
  features = SIDEBAR_FEATURES,
  onNavigate,
  icons = {},
  LogoComponent,
  GovernanceIconComponent,
  productName = 'ODT Workbench',
  productSubtitle = 'Engineering control plane',
  governanceTitle = 'Enterprise Governance',
  governanceDetail = 'Human-approved writes. Audit-ready controls.'
}) {
  return React.createElement(
    'aside',
    { className: 'sidebar', 'aria-label': productName },
    React.createElement(
      'div',
      { className: 'brand-lockup' },
      LogoComponent
        ? React.createElement(LogoComponent)
        : React.createElement('div', { className: 'odt-logo odt-logo-fallback', 'aria-hidden': 'true' }, 'ODT'),
      React.createElement(
        'div',
        null,
        React.createElement('strong', null, productName),
        React.createElement('span', null, productSubtitle)
      )
    ),
    React.createElement(
      'nav',
      { 'aria-label': productName, className: 'nav-list' },
      features.map((item) => React.createElement(
        'button',
        {
          key: item.id,
          type: 'button',
          className: `nav-item ${activePage === item.id ? 'active' : ''}`,
          onClick: () => onNavigate?.(item.id),
          'aria-current': activePage === item.id ? 'page' : undefined
        },
        React.createElement('span', { className: 'nav-icon', 'aria-hidden': 'true' }, icons[item.id] || null),
        React.createElement('span', null, item.label)
      ))
    ),
    React.createElement(
      'div',
      { className: 'governance-badge' },
      React.createElement(
        'span',
        { className: 'governance-icon', 'aria-hidden': 'true' },
        GovernanceIconComponent ? React.createElement(GovernanceIconComponent) : null
      ),
      React.createElement(
        'span',
        null,
        React.createElement('strong', null, governanceTitle),
        React.createElement('span', null, governanceDetail)
      )
    )
  );
}
