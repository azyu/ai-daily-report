const REPORT_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function readReportDateFromSearch(search: string) {
  const value = new URLSearchParams(search).get('date') || '';
  return REPORT_DATE_RE.test(value) ? value : '';
}

export function buildReportHref(pathname: string, search: string, hash: string, date: string) {
  const params = new URLSearchParams(search);

  if (REPORT_DATE_RE.test(date)) {
    params.set('date', date);
  } else {
    params.delete('date');
  }

  const nextSearch = params.toString();
  return `${pathname}${nextSearch ? `?${nextSearch}` : ''}${hash}`;
}
