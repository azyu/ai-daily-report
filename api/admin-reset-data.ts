import { verifyToken, parseCookieToken } from './_lib/adminAuth.js';
import { flushAllCache, setCachedReport } from './_lib/cache.js';
import { prisma } from './_lib/db.js';
import { todayKstYmd } from './_lib/date.js';
import { generateDailyReport } from './_lib/pipeline.js';

function getBearer(req: any) {
  const h = req.headers['authorization'] || '';
  return h.startsWith('Bearer ') ? h.slice(7) : undefined;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const v = verifyToken(getBearer(req) || parseCookieToken(req));
  if (!v) return res.status(401).json({ message: 'Unauthorized' });

  const date = todayKstYmd();
  await prisma.reportItem.deleteMany();
  await prisma.dailyReport.deleteMany();
  await flushAllCache();

  await generateDailyReport(date);
  const report = await prisma.dailyReport.findUnique({ where: { reportDate: date }, include: { items: { orderBy: { displayOrder: 'asc' } } } });
  if (report) await setCachedReport(date, { ...report, debug: { model: process.env.GEMINI_MODEL || 'unknown', createdAt: report.createdAt } });

  return res.status(200).json({ ok: true, date, regenerated: !!report, items: report?.items?.length ?? 0 });
}
