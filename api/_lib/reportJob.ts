import { generateDailyReport } from './pipeline.js';
import { prisma } from './db.js';
import { setCachedReport, setJobStatus } from './cache.js';
import { withReportLock } from './redis.js';
import { toReportPayload } from './reportPayload.js';

type DoneMeta = Record<string, unknown>;

export async function runReportJob(date: string, jobId: string, doneMeta: DoneMeta = {}) {
  await setJobStatus(jobId, { status: 'running', date, updatedAt: Date.now() });

  const run = await withReportLock(`report:${date}`, async () => {
    await generateDailyReport(date);
    return true;
  });

  if (!run.ok && run.locked) {
    await setJobStatus(jobId, { status: 'locked', date, updatedAt: Date.now() });
    return { ok: false as const, locked: true };
  }

  const report = await prisma.dailyReport.findUnique({
    where: { reportDate: date },
    include: { items: { orderBy: { displayOrder: 'asc' } } }
  });
  if (report) await setCachedReport(date, toReportPayload(report));

  await setJobStatus(jobId, { status: 'done', date, updatedAt: Date.now(), ...doneMeta });
  return { ok: true as const };
}
