import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { collectDailyReport } from './pipeline/dailyReportPipeline.js';

const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

export const reportQueue = new Queue('daily-report', { connection });

export function startReportWorker() {
  return new Worker(
    'daily-report',
    async (job) => {
      const date = job.data.date as string;
      await collectDailyReport(date);
      return { ok: true, date };
    },
    { connection }
  );
}
