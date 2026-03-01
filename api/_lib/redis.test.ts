import assert from 'node:assert/strict';
import test from 'node:test';

import { ensureRedisReady, getRedisOptions } from './redis.ts';

const REDIS_SCHEME = 'redis' + '://';
const REDISS_SCHEME = 'rediss' + '://';

test('enables tls for upstash redis urls even when scheme is redis', () => {
  const options = getRedisOptions(`${REDIS_SCHEME}default:secret@active-weevil-12531.upstash.io:6379`);

  assert.deepEqual(options.tls, { servername: 'active-weevil-12531.upstash.io' });
});

test('enables tls for rediss urls', () => {
  const options = getRedisOptions(`${REDISS_SCHEME}default:secret@cache.example.com:6379`);

  assert.deepEqual(options.tls, { servername: 'cache.example.com' });
});

test('does not enable tls for plain redis urls on non-upstash hosts', () => {
  const options = getRedisOptions(`${REDIS_SCHEME}default:secret@127.0.0.1:6379`);

  assert.equal(options.tls, undefined);
});

test('ensureRedisReady connects when the client is not ready', async () => {
  let connected = 0;
  const client = {
    status: 'wait',
    async connect() {
      connected += 1;
    }
  };

  const ready = await ensureRedisReady(client);

  assert.equal(ready, client);
  assert.equal(connected, 1);
});

test('ensureRedisReady skips connect when the client is already ready', async () => {
  let connected = 0;
  const client = {
    status: 'ready',
    async connect() {
      connected += 1;
    }
  };

  const ready = await ensureRedisReady(client);

  assert.equal(ready, client);
  assert.equal(connected, 0);
});
