import React from 'react';

export function Timeline({
  events,
  empty,
  toneFor = (value) => value || 'neutral',
  formatTime = (value) => value || ''
}) {
  if (!events.length) {
    return React.createElement('div', { className: 'empty-state' }, empty);
  }

  return React.createElement(
    'div',
    { className: 'timeline' },
    events.map((event, index) => React.createElement(
      'div',
      {
        className: 'timeline-item',
        key: `${event.title}-${index}`
      },
      React.createElement('span', { className: `timeline-dot ${toneFor(event.status)}` }),
      React.createElement(
        'div',
        null,
        React.createElement('strong', null, event.title),
        React.createElement('p', null, event.detail),
        React.createElement('small', null, formatTime(event.createdAt))
      )
    ))
  );
}
