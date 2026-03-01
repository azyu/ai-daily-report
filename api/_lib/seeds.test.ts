import assert from 'node:assert/strict';
import test from 'node:test';

import { parseTechmemeFeed, parseTldrAiIssue } from './seeds.ts';

test('parseTechmemeFeed keeps AI-relevant items and extracts source links', () => {
  const xml = `<?xml version="1.0"?>
  <rss version="2.0"><channel>
    <item>
      <title>Cursor is in talks for a new round (Bloomberg)</title>
      <link>http://www.techmeme.com/260312/p54#a260312p54</link>
      <description><![CDATA[
        <A HREF="https://www.bloomberg.com/news/articles/2026-03-12/ai-coding-startup-cursor-in-talks-for-about-50-billion-valuation"><IMG></A>
        <P>AI coding startup Cursor keeps growing fast.</P>
      ]]></description>
      <pubDate>Thu, 12 Mar 2026 19:50:15 -0400</pubDate>
    </item>
    <item>
      <title>Apple releases iOS 15.8.7 (Apple)</title>
      <link>http://www.techmeme.com/260312/p45#a260312p45</link>
      <description><![CDATA[
        <A HREF="https://support.apple.com/en-us/126632"><IMG></A>
        <P>Security update for older devices.</P>
      ]]></description>
      <pubDate>Thu, 12 Mar 2026 16:20:02 -0400</pubDate>
    </item>
  </channel></rss>`;

  const items = parseTechmemeFeed(xml);

  assert.equal(items.length, 1);
  assert.equal(items[0].source, 'Techmeme');
  assert.equal(items[0].headline, 'Cursor is in talks for a new round');
  assert.equal(
    items[0].link,
    'https://www.bloomberg.com/news/articles/2026-03-12/ai-coding-startup-cursor-in-talks-for-about-50-billion-valuation'
  );
  assert.equal(items[0].publishedAt?.toISOString(), '2026-03-12T23:50:15.000Z');
});

test('parseTldrAiIssue strips sponsor items and minute-read suffixes', () => {
  const html = `
    <section>
      <article class="mt-3">
        <a class="font-bold" href="https://example.com/sponsor"><h3>Great Product (Sponsor)</h3></a>
        <div class="newsletter-html">Skip this.</div>
      </article>
      <article class="mt-3">
        <a class="font-bold" href="https://cursor.com/blog/new-plugins?utm_source=tldrai"><h3>Cursor Expands Marketplace With 30+ New Plugins (3 minute read)</h3></a>
        <div class="newsletter-html">Cursor added <b>30+</b> plugins &amp; more integrations.</div>
      </article>
    </section>`;

  const items = parseTldrAiIssue(html, 'https://tldr.tech/ai/2026-03-12');

  assert.equal(items.length, 1);
  assert.equal(items[0].source, 'TLDR AI');
  assert.equal(items[0].headline, 'Cursor Expands Marketplace With 30+ New Plugins');
  assert.equal(items[0].link, 'https://cursor.com/blog/new-plugins?utm_source=tldrai');
  assert.equal(items[0].summaryHint, 'Cursor added 30+ plugins & more integrations.');
  assert.equal(items[0].publishedAt?.toISOString(), '2026-03-12T00:00:00.000Z');
});
