import assert from 'node:assert/strict';
import { setImmediate as nextTick } from 'node:timers/promises';
import test from 'node:test';

import { scheduleBackgroundTask } from './background.ts';

test('scheduleBackgroundTask registers background work synchronously on Vercel', async () => {
  const pending: Promise<unknown>[] = [];
  let ran = false;

  scheduleBackgroundTask(async () => {
    ran = true;
  }, {
    isVercel: true,
    waitUntil(promise) {
      pending.push(promise);
    }
  });

  assert.equal(pending.length, 1);
  assert.equal(ran, false);

  await pending[0];

  assert.equal(ran, true);
});

test('scheduleBackgroundTask logs and swallows background errors outside Vercel', async () => {
  const calls: unknown[][] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    calls.push(args);
  };

  try {
    scheduleBackgroundTask(async () => {
      throw new Error('boom');
    }, {
      isVercel: false,
      waitUntil() {}
    });

    await nextTick();

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], 'background_task_failed');
    assert.match(String(calls[0][1]), /boom/);
  } finally {
    console.error = originalError;
  }
});
