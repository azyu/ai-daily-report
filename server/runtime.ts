import path from 'node:path';

const REPORT_DATE_PATH_RE = /^\/reports\/(\d{4}-\d{2}-\d{2})\/?$/;
const REPORT_PREVIEW_USER_AGENT_RE =
  /(Discordbot|Slackbot(?:-LinkExpanding)?|Twitterbot|facebookexternalhit|LinkedInBot|WhatsApp|TelegramBot|SkypeUriPreview|Googlebot|bingbot)/i;

export function toQueryObject(searchParams: URLSearchParams) {
  const query: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    if (!(key in query)) query[key] = value;
  }

  return query;
}

export function getContentType(filePath: string) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.ico':
      return 'image/x-icon';
    case '.jpeg':
    case '.jpg':
      return 'image/jpeg';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.map':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.svg':
      return 'image/svg+xml';
    case '.txt':
      return 'text/plain; charset=utf-8';
    case '.webp':
      return 'image/webp';
    case '.woff2':
      return 'font/woff2';
    case '.xml':
      return 'application/xml; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

export function resolvePublicFile(publicDir: string, pathname: string) {
  const decodedPath = decodeURIComponent(pathname);
  const segments = decodedPath.split('/');
  if (segments.includes('..')) return null;

  const normalizedPath = path.posix.normalize(decodedPath);
  const relativePath = normalizedPath.replace(/^\/+/, '');
  const resolved = path.resolve(publicDir, relativePath);

  if (resolved !== publicDir && !resolved.startsWith(`${publicDir}${path.sep}`)) {
    return null;
  }

  return resolved;
}

export function getReportDatePathname(pathname: string) {
  return REPORT_DATE_PATH_RE.exec(pathname)?.[1] ?? null;
}

export function shouldServeReportPreview(userAgent: string | string[] | undefined) {
  if (Array.isArray(userAgent)) return userAgent.some((value) => REPORT_PREVIEW_USER_AGENT_RE.test(value));
  return !!userAgent && REPORT_PREVIEW_USER_AGENT_RE.test(userAgent);
}
