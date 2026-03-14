import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReportHref, readReportDate } from './urlState.ts';

test('readReportDate prefers /reports/yyyy-mm-dd and falls back to query values', () => {
  assert.equal(readReportDate('/reports/2026-03-14', ''), '2026-03-14');
  assert.equal(readReportDate('/reports/2026-3-14', '?date=2026-03-13'), '2026-03-13');
  assert.equal(readReportDate('/', '?date=2026-03-14'), '2026-03-14');
  assert.equal(readReportDate('/', '?date=2026-3-14'), '');
  assert.equal(readReportDate('/', '?view=compact'), '');
});

test('buildReportHref rewrites report dates into /reports paths while preserving others', () => {
  assert.equal(
    buildReportHref('/', '?view=compact', '#top', '2026-03-14'),
    '/reports/2026-03-14?view=compact#top'
  );
  assert.equal(
    buildReportHref('/reports/2026-03-14', '?date=2026-03-14&view=compact', '', ''),
    '/?view=compact'
  );
});
