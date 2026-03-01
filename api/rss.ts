import { getCachedRss, setCachedRss } from './_lib/cache.js';
import { prisma } from './_lib/db.js';
import { buildReportRssXml } from './_lib/rss.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  const date = req.query?.date as string | undefined;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'invalid date' });
  }

  const cached = await getCachedRss(date);
  if (cached) {
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=300');
    return res.status(200).send(cached);
  }

  const report = date
    ? await prisma.dailyReport.findUnique({
        where: { reportDate: date },
        include: { items: { orderBy: { displayOrder: 'asc' } } }
      })
    : await prisma.dailyReport.findFirst({
        orderBy: { reportDate: 'desc' },
        include: { items: { orderBy: { displayOrder: 'asc' } } }
      });
  if (!report) return res.status(404).json({ message: 'Not found' });

  const xml = buildReportRssXml(report);
  await setCachedRss(xml, report.reportDate);
  if (!date) await setCachedRss(xml);

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=300');
  return res.status(200).send(xml);
}
