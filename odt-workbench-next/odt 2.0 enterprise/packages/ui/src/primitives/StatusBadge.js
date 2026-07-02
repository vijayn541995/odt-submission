import React from 'react';

export function StatusBadge({ label, tone, title }) {
  return React.createElement(
    'span',
    {
      className: `status-badge ${tone || 'neutral'}`,
      title: title || label
    },
    label
  );
}
