import React from 'react';

export function InfoList({ items }) {
  return React.createElement(
    'div',
    { className: 'info-list' },
    items.map(([label, value]) => React.createElement(
      'div',
      { key: label },
      React.createElement('span', null, label),
      React.createElement('strong', null, value === 0 ? 0 : value || 'Missing')
    ))
  );
}
