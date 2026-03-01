import assert from 'node:assert/strict';
import test from 'node:test';

import { RSS_LATEST_CACHE_KEY, buildReportRssXml, getRssCacheKey } from './rss.ts';

test('buildReportRssXml renders channel and items in display order with escaped xml', () => {
  const xml = buildReportRssXml(
    {
      reportDate: '2026-03-13',
      title: 'AI 데일리 레포트 2026-03-13',
      summary: '오늘의 <AI> & 뉴스',
      collectedAt: new Date('2026-03-13T06:10:00.000Z'),
      items: [
        {
          source: 'TLDR AI',
          headline: 'B item & more',
          summary: 'Summary with <tags> & symbols',
          link: 'https://example.com/b',
          displayOrder: 2,
          publishedAt: new Date('2026-03-13T01:00:00.000Z')
        },
        {
          source: 'Techmeme',
          headline: 'A item',
          summary: 'Earlier item',
          link: 'https://example.com/a',
          displayOrder: 1,
          publishedAt: new Date('2026-03-13T00:00:00.000Z')
        }
      ]
    },
    'https://ai-daily-report-beige.vercel.app'
  );

  assert.match(xml, /<rss version="2.0"/);
  assert.match(xml, /<title>AI 데일리 레포트 2026-03-13<\/title>/);
  assert.match(xml, /<description>오늘의 &lt;AI&gt; &amp; 뉴스<\/description>/);

  const aIndex = xml.indexOf('<title>A item</title>');
  const bIndex = xml.indexOf('<title>B item &amp; more</title>');
  assert.ok(aIndex > -1);
  assert.ok(bIndex > aIndex);
  assert.match(xml, /<description>Summary with &lt;tags&gt; &amp; symbols<\/description>/);
  assert.match(xml, /<guid isPermaLink="false">2026-03-13:https:\/\/example\.com\/a<\/guid>/);
});

test('buildReportRssXml falls back to collectedAt when an item has no publishedAt', () => {
  const xml = buildReportRssXml(
    {
      reportDate: '2026-03-13',
      title: 'AI 데일리 레포트 2026-03-13',
      summary: null,
      collectedAt: new Date('2026-03-13T06:10:00.000Z'),
      items: [
        {
          source: 'Techmeme',
          headline: 'No pub date',
          summary: 'Fallback date check',
          link: 'https://example.com/fallback',
          displayOrder: 1,
          publishedAt: undefined
        }
      ]
    },
    'https://ai-daily-report-beige.vercel.app'
  );

  assert.match(xml, /<pubDate>Fri, 13 Mar 2026 06:10:00 GMT<\/pubDate>/);
});

test('rss cache keys keep latest and per-date feeds separate', () => {
  assert.equal(RSS_LATEST_CACHE_KEY, 'report:rss:latest');
  assert.equal(getRssCacheKey('2026-03-13'), 'report:rss:2026-03-13');
});
