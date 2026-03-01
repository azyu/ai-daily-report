import { getReadyRedis, getRedis } from './redis.js';
import { getRssCacheKey, RSS_LATEST_CACHE_KEY } from './rss.js';

const TTL_SEC = Number(process.env.REPORT_CACHE_TTL_SEC ?? 60 * 60 * 6);

export async function getCachedReport(date: string) {
  try {
    const r = await getReadyRedis();
    if (!r) return null;
    const raw = await r.get(`report:${date}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setCachedReport(date: string, report: any) {
  try {
    const r = await getReadyRedis();
    if (!r) return;
    await r.set(`report:${date}`, JSON.stringify(report), 'EX', TTL_SEC);
  } catch {}
}

export async function getCachedRss(date?: string) {
  try {
    const r = await getReadyRedis();
    if (!r) return null;
    const raw = await r.get(date ? getRssCacheKey(date) : RSS_LATEST_CACHE_KEY);
    return raw || null;
  } catch {
    return null;
  }
}

export async function setCachedRss(xml: string, date?: string) {
  try {
    const r = await getReadyRedis();
    if (!r) return;
    await r.set(date ? getRssCacheKey(date) : RSS_LATEST_CACHE_KEY, xml, 'EX', TTL_SEC);
  } catch (error: any) {
    console.warn('rss_cache_write_failed', String(error?.message || error), date ?? 'latest');
  }
}

export async function setJobStatus(jobId: string, status: any) {
  try {
    const r = await getReadyRedis();
    if (!r) return;
    await r.set(`job:${jobId}`, JSON.stringify(status), 'EX', 60 * 60);
  } catch {}
}

export async function getJobStatus(jobId: string) {
  try {
    const r = await getReadyRedis();
    if (!r) return null;
    const raw = await r.get(`job:${jobId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function delByPrefix(prefix: string) {
  const r = getRedis();
  if (!r) return 0;
  let cursor = '0';
  let deleted = 0;
  do {
    const res = await r.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
    cursor = res[0];
    const keys = res[1] as string[];
    if (keys.length) {
      deleted += await r.unlink(...keys);
    }
  } while (cursor !== '0');
  return deleted;
}

export async function flushAllCache() {
  try {
    const deletedReports = await delByPrefix('report:');
    const deletedJobs = await delByPrefix('job:');
    return { ok: true, deletedReports, deletedJobs };
  } catch {
    return { ok: false, deletedReports: 0, deletedJobs: 0 };
  }
}
