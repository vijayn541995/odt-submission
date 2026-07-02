import React from 'react';

export function ActionList({ items }) {
  return React.createElement(
    'div',
    { className: 'action-list' },
    items.map(([title, copy]) => React.createElement(
      'div',
      { className: 'action-item', key: title },
      React.createElement('strong', null, title),
      React.createElement('span', null, copy)
    ))
  );
}
