import { readFile } from 'node:fs/promises';
import path from 'node:path';

const REPORT_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PREVIEW_BOT_RE =
  /(discordbot|slackbot|twitterbot|facebookexternalhit|linkedinbot|whatsapp|telegrambot|kakaotalk|kakaostory|skypeuripreview|embedly|crawler|spider|preview|bot)/i;

let cachedAppShellHtml: string | null = null;

type PreviewItem = {
  headline: string;
};

type PreviewReport = {
  reportDate: string;
  title: string;
  summary?: string | null;
  items: PreviewItem[];
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeText(input: string) {
  return input.replace(/\s+/g, ' ').trim();
}

function truncateText(input: string, maxLength: number) {
  if (input.length <= maxLength) return input;
  return `${input.slice(0, maxLength - 1).trimEnd()}…`;
}

export function isReportDate(value?: string) {
  return !!value && REPORT_DATE_RE.test(value);
}

export function isSocialPreviewUserAgent(userAgent?: string | string[]) {
  const normalized = Array.isArray(userAgent) ? userAgent[0] : userAgent;
  return !normalized || PREVIEW_BOT_RE.test(normalized);
}

export function buildReportPreviewDescription(report: PreviewReport) {
  const summary = normalizeText(report.summary || '');
  if (summary) return truncateText(summary, 220);

  const headlines = report.items
    .map((item) => normalizeText(item.headline))
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ');

  if (headlines) return truncateText(headlines, 220);
  return '일일 AI 뉴스 큐레이션 리포트';
}

export function buildReportPreviewHtml(report: PreviewReport, siteUrl = getSiteUrl()) {
  const title = normalizeText(report.title) || `AI Daily Report ${report.reportDate}`;
  const description = buildReportPreviewDescription(report);
  const reportUrl = `${siteUrl}/reports/${report.reportDate}`;
  const appUrl = `${siteUrl}/?date=${encodeURIComponent(report.reportDate)}`;
  const imageUrl = `${siteUrl}/og-default.png`;

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${escapeHtml(reportUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <link rel="canonical" href="${escapeHtml(reportUrl)}" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(appUrl)}" />
  </head>
  <body>
    <p>리포트를 여는 중입니다. 자동 이동이 되지 않으면 <a href="${escapeHtml(appUrl)}">여기를 눌러 주세요</a>.</p>
    <script>
      window.location.replace(${JSON.stringify(appUrl)});
    </script>
  </body>
</html>`;
}

export async function readAppShellHtml() {
  if (cachedAppShellHtml) return cachedAppShellHtml;

  for (const candidate of getAppShellCandidatePaths()) {
    try {
      cachedAppShellHtml = await readFile(candidate, 'utf8');
      return cachedAppShellHtml;
    } catch {}
  }

  throw new Error('missing_app_shell_html');
}

function getSiteUrl() {
  const configured =
    process.env.APP_BASE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    'ai-daily-report-beige.vercel.app';

  return configured.startsWith('http://') || configured.startsWith('https://')
    ? configured.replace(/\/+$/, '')
    : `https://${configured.replace(/\/+$/, '')}`;
}

function getAppShellCandidatePaths() {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'frontend', 'dist', 'index.html'),
    path.join(cwd, 'index.html'),
    path.join(cwd, 'frontend', 'index.html')
  ];
}
