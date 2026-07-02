import React from 'react';

export function JsonBlock({ value }) {
  return React.createElement(
    'pre',
    { className: 'json-block' },
    JSON.stringify(value, null, 2)
  );
}
