import { todayKstYmd } from './_lib/date.js';
import { setJobStatus } from './_lib/cache.js';
import { verifyToken, parseCookieToken } from './_lib/adminAuth.js';
import { scheduleBackgroundTask } from './_lib/background.js';
import { runReportJob } from './_lib/reportJob.js';

function getBearer(req: any) {
  const h = req.headers['authorization'] || '';
  return h.startsWith('Bearer ') ? h.slice(7) : undefined;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const auth = verifyToken(getBearer(req) || parseCookieToken(req));
  if (!auth) return res.status(401).json({ message: 'Unauthorized' });

  const date = (req.query?.date as string | undefined) ?? todayKstYmd();
  const jobId = `job_${date}_${Date.now()}`;
  await setJobStatus(jobId, { status: 'queued', date, updatedAt: Date.now(), by: auth.adminId });

  scheduleBackgroundTask(async () => {
    try {
      await runReportJob(date, jobId);
    } catch (e) {
      await setJobStatus(jobId, { status: 'failed', date, updatedAt: Date.now(), error: String((e as any)?.message || e) });
    }
  });

  return res.status(202).json({ ok: true, queued: true, date, jobId });
}
