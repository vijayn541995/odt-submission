import React from 'react';
import {
  PageHeader,
  Panel,
  SimpleTable,
  StatusBadge,
  Timeline
} from '../../primitives/index.js';

function requireDependency(value, name) {
  if (!value) {
    throw new Error(`RunsPage requires ${name}`);
  }
  return value;
}

export function RunsPage({
  data,
  helpers = {}
}) {
  const shortId = requireDependency(helpers.shortId, 'helpers.shortId');
  const titleCase = requireDependency(helpers.titleCase, 'helpers.titleCase');
  const toneFor = requireDependency(helpers.toneFor, 'helpers.toneFor');
  const formatTime = requireDependency(helpers.formatTime, 'helpers.formatTime');
  const safeDetail = requireDependency(helpers.safeDetail, 'helpers.safeDetail');

  const runs = data?.runs || [];
  const runEvents = data?.runEvents || [];

  return React.createElement(
    'div',
    { className: 'page-stack' },
    React.createElement(PageHeader, {
      eyebrow: 'Runs',
      title: 'Execution history and evidence',
      copy: 'Inspect what happened, when provider selection occurred, and whether usage was logged.'
    }),
    React.createElement(
      'div',
      { className: 'two-column wide-left' },
      React.createElement(
        Panel,
        { title: 'Recent Runs', eyebrow: 'History' },
        React.createElement(SimpleTable, {
          columns: ['Run', 'Type', 'Status', 'Provider', 'Events'],
          rows: runs.map((run) => [
            React.createElement(
              'button',
              {
                className: 'link-button',
                type: 'button',
                onClick: () => data?.setSelectedRunId?.(run.id)
              },
              shortId(run.id)
            ),
            titleCase(run.requestType),
            React.createElement(StatusBadge, {
              label: titleCase(run.status),
              tone: toneFor(run.status)
            }),
            run.provider || 'local',
            run.eventCount
          ]),
          empty: 'No runs yet.'
        })
      ),
      React.createElement(
        Panel,
        {
          title: 'Selected Run Timeline',
          eyebrow: data?.selectedRunId ? shortId(data.selectedRunId) : 'No Run'
        },
        React.createElement(Timeline, {
          events: runEvents.map((event) => ({
            title: titleCase(event.eventType),
            detail: safeDetail(event.detail),
            createdAt: event.createdAt,
            status: event.status
          })),
          empty: 'Select a run or ask ODT Guide to create one.',
          toneFor,
          formatTime
        })
      )
    )
  );
}
