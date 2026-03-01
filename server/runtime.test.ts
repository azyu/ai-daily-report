import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { getContentType, resolvePublicFile, toQueryObject } from './runtime.ts';

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
