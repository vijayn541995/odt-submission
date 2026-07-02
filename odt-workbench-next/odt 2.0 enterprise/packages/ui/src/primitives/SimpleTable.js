import React from 'react';

export function SimpleTable({ columns, rows, empty }) {
  if (!rows.length) {
    return React.createElement('div', { className: 'empty-state' }, empty || 'No records yet.');
  }

  return React.createElement(
    'div',
    { className: 'table-wrap' },
    React.createElement(
      'table',
      null,
      React.createElement(
        'thead',
        null,
        React.createElement(
          'tr',
          null,
          columns.map((column) => React.createElement('th', { key: column }, column))
        )
      ),
      React.createElement(
        'tbody',
        null,
        rows.map((row, rowIndex) => React.createElement(
          'tr',
          { key: rowIndex },
          row.map((cell, cellIndex) => React.createElement('td', { key: cellIndex }, cell))
        ))
      )
    )
  );
}
