export const RSS_LATEST_CACHE_KEY = 'report:rss:latest';

type RssItem = {
  source: string;
  headline: string;
  summary: string;
  link: string;
  publishedAt?: Date | null;
  displayOrder: number;
};

type RssReport = {
  reportDate: string;
  title: string;
  summary?: string | null;
  collectedAt: Date;
  items: RssItem[];
};

export function getRssCacheKey(date: string) {
  return `report:rss:${date}`;
}

export function getSiteUrl() {
  const configured =
    process.env.APP_BASE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    'ai-daily-report-beige.vercel.app';

  return configured.startsWith('http://') || configured.startsWith('https://')
    ? configured.replace(/\/+$/, '')
    : `https://${configured.replace(/\/+$/, '')}`;
}

function escapeXml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function itemPubDate(report: RssReport, item: RssItem) {
  return (item.publishedAt ?? report.collectedAt).toUTCString();
}

export function buildReportRssXml(report: RssReport, siteUrl = getSiteUrl()) {
  const channelTitle = escapeXml(report.title);
  const channelDescription = escapeXml(report.summary || '일일 AI 뉴스 큐레이션 리포트');
  const channelLink = siteUrl;
  const selfLink = `${siteUrl}/rss.xml`;
  const pubDate = report.collectedAt.toUTCString();

  const itemsXml = [...report.items]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => {
      const guid = escapeXml(`${report.reportDate}:${item.link}`);
      const link = escapeXml(item.link);
      const title = escapeXml(item.headline);
      const description = escapeXml(item.summary);
      const category = escapeXml(item.source);

      return [
        '<item>',
        `<title>${title}</title>`,
        `<link>${link}</link>`,
        `<guid isPermaLink="false">${guid}</guid>`,
        `<pubDate>${itemPubDate(report, item)}</pubDate>`,
        `<category>${category}</category>`,
        `<description>${description}</description>`,
        '</item>'
      ].join('');
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${channelTitle}</title>`,
    `<link>${channelLink}</link>`,
    `<description>${channelDescription}</description>`,
    `<language>ko-kr</language>`,
    `<lastBuildDate>${pubDate}</lastBuildDate>`,
    `<atom:link href="${escapeXml(selfLink)}" rel="self" type="application/rss+xml" />`,
    itemsXml,
    '</channel>',
    '</rss>'
  ].join('');
}
