import { prisma } from './_lib/db.js';
import { getCachedReport, setCachedReport } from './_lib/cache.js';
import { buildBootstrapPayload, toReportPayload } from './_lib/reportPayload.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  const date = req.query?.date as string | undefined;
  const bootstrap = req.query?.bootstrap === '1';

  if (date) {
    const cached = await getCachedReport(date);
    if (cached) return res.status(200).json(cached);

    const report = await prisma.dailyReport.findUnique({
      where: { reportDate: date },
      include: { items: { orderBy: { displayOrder: 'asc' } } }
    });
    if (!report) return res.status(404).json({ message: 'Not found' });

    const payload = toReportPayload(report);

    await setCachedReport(date, payload);
    return res.status(200).json(payload);
  }

  if (bootstrap) {
    const [reports, latestReport] = await Promise.all([
      prisma.dailyReport.findMany({
        orderBy: { reportDate: 'desc' },
        select: { id: true, reportDate: true, title: true, collectedAt: true }
      }),
      prisma.dailyReport.findFirst({
        orderBy: { reportDate: 'desc' },
        include: { items: { orderBy: { displayOrder: 'asc' } } }
      })
    ]);

    const payload = buildBootstrapPayload(reports, latestReport);
    const detail = payload.detail;
    if (detail) await setCachedReport(detail.reportDate, detail);

    return res.status(200).json(payload);
  }

  const reports = await prisma.dailyReport.findMany({
    orderBy: { reportDate: 'desc' },
    select: { id: true, reportDate: true, title: true, collectedAt: true }
  });
  return res.status(200).json(reports);
}
