import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBootstrapPayload, toReportPayload } from './reportPayload.ts';

test('toReportPayload appends debug metadata without changing report fields', () => {
  const payload = toReportPayload({
    id: 2,
    reportDate: '2026-03-13',
    title: 'Today',
    createdAt: '2026-03-13T06:20:00.000Z',
    items: [{ id: 10, headline: 'Headline' }]
  });

  assert.equal(payload.id, 2);
  assert.equal(payload.reportDate, '2026-03-13');
  assert.equal(payload.items.length, 1);
  assert.equal(payload.debug.createdAt, '2026-03-13T06:20:00.000Z');
});

test('buildBootstrapPayload returns the latest detail alongside the report list', () => {
  const payload = buildBootstrapPayload(
    [
      { id: 2, reportDate: '2026-03-13', title: 'Today', collectedAt: '2026-03-13T06:10:00.000Z' },
      { id: 1, reportDate: '2026-03-12', title: 'Yesterday', collectedAt: '2026-03-12T06:10:00.000Z' }
    ],
    {
      id: 2,
      reportDate: '2026-03-13',
      title: 'Today',
      createdAt: '2026-03-13T06:20:00.000Z',
      items: [{ id: 10, headline: 'Headline' }]
    }
  );

  assert.equal(payload.selectedDate, '2026-03-13');
  assert.equal(payload.reports.length, 2);
  assert.equal(payload.detail.reportDate, '2026-03-13');
  assert.equal(payload.detail.debug.createdAt, '2026-03-13T06:20:00.000Z');
});

test('buildBootstrapPayload returns an empty detail when there are no reports', () => {
  assert.deepEqual(buildBootstrapPayload([], null), {
    reports: [],
    selectedDate: null,
    detail: null
  });
});
