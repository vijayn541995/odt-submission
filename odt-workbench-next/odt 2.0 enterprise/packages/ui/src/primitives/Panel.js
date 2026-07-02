import React from 'react';

export function Panel({ eyebrow, title, children }) {
  return React.createElement(
    'section',
    { className: 'panel' },
    React.createElement(
      'div',
      { className: 'panel-head' },
      React.createElement(
        'div',
        null,
        React.createElement('span', { className: 'eyebrow' }, eyebrow),
        React.createElement('h3', null, title)
      )
    ),
    children
  );
}
