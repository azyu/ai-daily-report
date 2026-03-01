import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAdminCookie, isHttpsRequest } from './adminCookie.ts';

test('isHttpsRequest trusts x-forwarded-proto first', () => {
  assert.equal(isHttpsRequest({ headers: { 'x-forwarded-proto': 'https' } }), true);
  assert.equal(isHttpsRequest({ headers: { 'x-forwarded-proto': 'http' }, socket: { encrypted: true } }), false);
});

test('buildAdminCookie omits Secure for localhost over plain http', () => {
  const cookie = buildAdminCookie('token', { headers: { host: 'localhost:3000' } });

  assert.match(cookie, /HttpOnly/);
  assert.doesNotMatch(cookie, /(?:^|;\s)Secure(?:;|$)/);
});

test('buildAdminCookie omits Secure for loopback hosts over plain http', () => {
  assert.doesNotMatch(buildAdminCookie('token', { headers: { host: '127.0.0.1:3000' } }), /(?:^|;\s)Secure(?:;|$)/);
  assert.doesNotMatch(buildAdminCookie('token', { headers: { host: '[::1]:3000' } }), /(?:^|;\s)Secure(?:;|$)/);
});

test('buildAdminCookie keeps Secure for https and non-local hosts', () => {
  assert.match(buildAdminCookie('token', { headers: { host: 'localhost:3000', 'x-forwarded-proto': 'https' } }), /(?:^|;\s)Secure(?:;|$)/);
  assert.match(buildAdminCookie('token', { headers: { host: 'app.example.com' } }), /(?:^|;\s)Secure(?:;|$)/);
});
