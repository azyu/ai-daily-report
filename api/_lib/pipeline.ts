import { prisma } from './db.js';
import { setCachedRss } from './cache.js';
import { buildReportRssXml } from './rss.js';
import { buildSeeds } from './seeds.js';
import { summarizeWithGemini } from './gemini.js';

export async function generateDailyReport(reportDate: string) {
  const perSource = 5;
  const selected = await buildSeeds(perSource);

  // LLM-only mode: if Gemini fails, do not generate templated summaries.
  const summarized = await summarizeWithGemini(selected);
  const sourceItems = new Map(selected.map((item) => [item.link, item]));

  const items = summarized.map((x, i) => ({
    source: x.source,
    headline: x.headline,
    summary: x.summary,
    link: x.link,
    publishedAt: sourceItems.get(x.link)?.publishedAt,
    displayOrder: i + 1
  }));

  await prisma.dailyReport.upsert({
    where: { reportDate },
    create: {
      reportDate,
      title: `AI 데일리 레포트 ${reportDate}`,
      summary: '일일 AI 뉴스 큐레이션 리포트',
      items: { create: items }
    },
    update: {
      collectedAt: new Date(),
      title: `AI 데일리 레포트 ${reportDate}`,
      summary: '일일 AI 뉴스 큐레이션 리포트',
      items: { deleteMany: {}, create: items }
    }
  });

  const report = await prisma.dailyReport.findUnique({
    where: { reportDate },
    include: { items: { orderBy: { displayOrder: 'asc' } } }
  });
  if (!report) return;

  const xml = buildReportRssXml(report);
  await setCachedRss(xml, reportDate);

  const latest = await prisma.dailyReport.findFirst({
    orderBy: { reportDate: 'desc' },
    select: { reportDate: true }
  });
  if (latest?.reportDate === reportDate) {
    await setCachedRss(xml);
  }
}
