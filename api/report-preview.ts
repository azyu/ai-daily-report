import { prisma } from './_lib/db.js';
import { buildReportPreviewHtml, isReportDate, isSocialPreviewUserAgent, readAppShellHtml } from './_lib/reportPreview.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  const date = req.query?.date as string | undefined;
  if (!isReportDate(date)) return res.status(400).json({ message: 'invalid date' });
  res.setHeader('Vary', 'User-Agent');

  if (!isSocialPreviewUserAgent(req.headers?.['user-agent'])) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(await readAppShellHtml());
  }

  const report = await prisma.dailyReport.findUnique({
    where: { reportDate: date },
    select: {
      reportDate: true,
      title: true,
      summary: true,
      items: {
        orderBy: { displayOrder: 'asc' },
        select: { headline: true }
      }
    }
  });
  if (!report) return res.status(404).json({ message: 'Not found' });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=300');
  return res.status(200).send(buildReportPreviewHtml(report));
}
