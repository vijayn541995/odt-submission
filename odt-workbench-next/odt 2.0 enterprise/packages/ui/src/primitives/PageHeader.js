import React from 'react';

export function PageHeader({ eyebrow, title, copy, actions }) {
  return React.createElement(
    'section',
    { className: 'page-header' },
    React.createElement(
      'div',
      null,
      React.createElement('span', { className: 'eyebrow' }, eyebrow),
      React.createElement('h2', null, title),
      React.createElement('p', null, copy)
    ),
    actions ? React.createElement('div', { className: 'page-actions' }, actions) : null
  );
}
