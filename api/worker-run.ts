import { setJobStatus } from './_lib/cache.js';
import { runReportJob } from './_lib/reportJob.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const workerSecret = req.headers['x-worker-secret'];
  if (!process.env.ADMIN_RUN_SECRET || workerSecret !== process.env.ADMIN_RUN_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { date, jobId } = req.body ?? {};
  if (!date || !jobId) return res.status(400).json({ message: 'date/jobId required' });

  try {
    const run = await runReportJob(date, jobId, { llm: 'gemini' });
    if (!run.ok && run.locked) {
      return res.status(409).json({ ok: false, message: 'already running', date });
    }

    return res.status(200).json({ ok: true, date });
  } catch (e: any) {
    await setJobStatus(jobId, { status: 'failed', date, updatedAt: Date.now(), error: String(e?.message || e) });
    return res.status(500).json({ ok: false, date, error: 'generation_failed' });
  }
}
