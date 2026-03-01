import Redis from 'ioredis';
import crypto from 'node:crypto';

const redisUrl = process.env.REDIS_URL;
let redis: any = null;

export function getRedisOptions(url: string) {
  const target = new URL(url);
  const useTls = target.protocol === 'rediss:' || (target.protocol === 'redis:' && target.hostname.endsWith('.upstash.io'));

  return {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    connectTimeout: 2000,
    ...(useTls ? { tls: { servername: target.hostname } } : {})
  };
}

export function getRedis() {
  if (!redisUrl) return null;
  if (!redis) {
    redis = new (Redis as any)(redisUrl, getRedisOptions(redisUrl));
  }
  return redis;
}

export async function ensureRedisReady<T extends { status?: string; connect?: () => Promise<unknown> } | null>(client: T): Promise<T> {
  if (!client) return client;
  if (client.status !== 'ready') await client.connect?.();
  return client;
}

export async function getReadyRedis() {
  return ensureRedisReady(getRedis());
}

const RELEASE_LUA = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end`;

export async function withReportLock<T>(key: string, fn: () => Promise<T>): Promise<{ ok: boolean; locked?: boolean; result?: T; degraded?: boolean }> {
  const r = getRedis();
  if (!r) return { ok: false, locked: true, degraded: true };

  const lockKey = `lock:${key}`;
  const token = crypto.randomUUID();

  try {
    if (r.status !== 'ready') await r.connect();
    const acquired = await r.set(lockKey, token, 'EX', 300, 'NX');
    if (!acquired) return { ok: false, locked: true };

    const result = await fn();
    await r.eval(RELEASE_LUA, 1, lockKey, token).catch(() => {});
    return { ok: true, result };
  } catch {
    return { ok: false, locked: true, degraded: true };
  }
}
