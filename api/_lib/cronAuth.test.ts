import assert from 'node:assert/strict';
import test from 'node:test';

import { getCronSecret, isAuthorizedCronRequest } from './cronAuth.ts';

test('accepts bearer cron secret from authorization header', () => {
  const req = { headers: { authorization: 'Bearer top-secret' } };

  assert.equal(getCronSecret(req), 'top-secret');
  assert.equal(isAuthorizedCronRequest(req, 'top-secret'), true);
});

test('accepts x-cron-secret header', () => {
  const req = { headers: { 'x-cron-secret': 'top-secret' } };

  assert.equal(getCronSecret(req), 'top-secret');
  assert.equal(isAuthorizedCronRequest(req, 'top-secret'), true);
});
