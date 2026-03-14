import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { getContentType, getReportDatePathname, resolvePublicFile, shouldServeReportPreview, toQueryObject } from './runtime.ts';

test('toQueryObject keeps the first value for duplicate keys', () => {
  const query = toQueryObject(new URLSearchParams('date=2026-03-13&date=2026-03-12&bootstrap=1'));

  assert.deepEqual(query, {
    date: '2026-03-13',
    bootstrap: '1'
  });
});

test('getContentType returns expected frontend content types', () => {
  assert.equal(getContentType('index.html'), 'text/html; charset=utf-8');
  assert.equal(getContentType('assets/app.js'), 'application/javascript; charset=utf-8');
  assert.equal(getContentType('feed.xml'), 'application/xml; charset=utf-8');
});

test('resolvePublicFile prevents directory traversal outside the public root', () => {
  const publicDir = path.resolve('/tmp/public');

  assert.equal(resolvePublicFile(publicDir, '/assets/app.js'), path.resolve(publicDir, 'assets/app.js'));
  assert.equal(resolvePublicFile(publicDir, '/../secrets.txt'), null);
});

test('getReportDatePathname extracts valid shared report dates from public routes', () => {
  assert.equal(getReportDatePathname('/reports/2026-03-14'), '2026-03-14');
  assert.equal(getReportDatePathname('/reports/2026-03-14/'), '2026-03-14');
  assert.equal(getReportDatePathname('/reports/today'), null);
});

test('shouldServeReportPreview matches social preview crawlers but not browsers', () => {
  assert.equal(shouldServeReportPreview('Discordbot/2.0'), true);
  assert.equal(shouldServeReportPreview('Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'), true);
  assert.equal(shouldServeReportPreview('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), false);
});
