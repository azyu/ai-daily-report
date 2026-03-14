import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildReportPreviewDescription,
  buildReportPreviewHtml,
  isReportDate
} from './reportPreview.ts';

test('isReportDate accepts yyyy-mm-dd and rejects invalid input', () => {
  assert.equal(isReportDate('2026-03-14'), true);
  assert.equal(isReportDate('2026-3-14'), false);
  assert.equal(isReportDate('not-a-date'), false);
  assert.equal(isReportDate(undefined), false);
});

test('buildReportPreviewDescription prefers report summary', () => {
  const description = buildReportPreviewDescription({
    reportDate: '2026-03-14',
    title: 'AI Daily Report',
    summary: '  요약   본문  ',
    items: [{ headline: '첫 번째 헤드라인' }]
  });

  assert.equal(description, '요약 본문');
});

test('buildReportPreviewDescription falls back to top headlines', () => {
  const description = buildReportPreviewDescription({
    reportDate: '2026-03-14',
    title: 'AI Daily Report',
    summary: '',
    items: [
      { headline: '첫 번째 헤드라인' },
      { headline: '두 번째 헤드라인' },
      { headline: '세 번째 헤드라인' },
      { headline: '네 번째 헤드라인' }
    ]
  });

  assert.equal(description, '첫 번째 헤드라인 · 두 번째 헤드라인 · 세 번째 헤드라인');
});

test('buildReportPreviewHtml renders escaped social metadata and redirect target', () => {
  const html = buildReportPreviewHtml({
    reportDate: '2026-03-14',
    title: 'AI <Daily> & Report',
    summary: '요약 <태그> & 설명',
    items: [{ headline: '첫 번째 헤드라인' }]
  }, 'https://example.com');

  assert.match(html, /<meta property="og:title" content="AI &lt;Daily&gt; &amp; Report"/);
  assert.match(html, /<meta property="og:description" content="요약 &lt;태그&gt; &amp; 설명"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/example\.com\/og-default\.png"/);
  assert.match(html, /<meta property="og:url" content="https:\/\/example\.com\/reports\/2026-03-14"/);
  assert.match(html, /<meta http-equiv="refresh" content="0;url=https:\/\/example\.com\/\?date=2026-03-14"/);
  assert.match(html, /window\.location\.replace\("https:\/\/example\.com\/\?date=2026-03-14"\)/);
});
