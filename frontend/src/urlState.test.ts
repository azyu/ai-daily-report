import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReportHref, readReportDateFromSearch } from './urlState.ts';

test('readReportDateFromSearch returns only valid yyyy-mm-dd query values', () => {
  assert.equal(readReportDateFromSearch('?date=2026-03-14'), '2026-03-14');
  assert.equal(readReportDateFromSearch('?date=2026-3-14'), '');
  assert.equal(readReportDateFromSearch('?view=compact'), '');
});

test('buildReportHref updates and clears the date query while preserving others', () => {
  assert.equal(
    buildReportHref('/', '?view=compact', '#top', '2026-03-14'),
    '/?view=compact&date=2026-03-14#top'
  );
  assert.equal(
    buildReportHref('/', '?date=2026-03-14&view=compact', '', ''),
    '/?view=compact'
  );
});
