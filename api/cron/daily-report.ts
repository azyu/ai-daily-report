import { generateDailyReport } from '../_lib/pipeline.js';
import { todayKstYmd } from '../_lib/date.js';
import { isAuthorizedCronRequest } from '../_lib/cronAuth.js';
import { withReportLock } from '../_lib/redis.js';

export default async function handler(req: any, res: any) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return res.status(500).json({ ok: false, message: 'cron_secret_missing' });

  if (!isAuthorizedCronRequest(req, expected)) {
    return res.status(401).json({ ok: false, message: 'unauthorized cron' });
  }

  const date = todayKstYmd();
  const run = await withReportLock(`report:${date}`, async () => {
    await generateDailyReport(date);
    return true;
  });

  if (!run.ok && run.locked) return res.status(409).json({ ok: false, message: 'already running', date });
  return res.status(200).json({ ok: true, date, redisLock: true });
}
