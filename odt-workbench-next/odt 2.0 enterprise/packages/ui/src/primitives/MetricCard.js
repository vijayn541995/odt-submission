import React from 'react';

export function MetricCard({ label, value, detail, tone }) {
  return React.createElement(
    'section',
    { className: `metric-card ${tone || 'neutral'}` },
    React.createElement('span', null, label),
    React.createElement('strong', null, value),
    React.createElement('p', null, detail)
  );
}
