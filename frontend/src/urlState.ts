const REPORT_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REPORT_DATE_PATH_RE = /^\/reports\/(\d{4}-\d{2}-\d{2})\/?$/;

export function readReportDate(pathname: string, search: string) {
  const pathMatch = REPORT_DATE_PATH_RE.exec(pathname)?.[1] || '';
  if (REPORT_DATE_RE.test(pathMatch)) return pathMatch;

  const value = new URLSearchParams(search).get('date') || '';
  return REPORT_DATE_RE.test(value) ? value : '';
}

export function buildReportHref(pathname: string, search: string, hash: string, date: string) {
  const params = new URLSearchParams(search);
  params.delete('date');

  const basePath = REPORT_DATE_PATH_RE.test(pathname) || pathname === '/' ? '/reports' : pathname;

  if (REPORT_DATE_RE.test(date)) {
    const nextSearch = params.toString();
    return `${basePath.replace(/\/$/, '')}/${date}${nextSearch ? `?${nextSearch}` : ''}${hash}`;
  } else {
    const nextSearch = params.toString();
    return `${basePath === '/reports' ? '/' : basePath}${nextSearch ? `?${nextSearch}` : ''}${hash}`;
  }
}
