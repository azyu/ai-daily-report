export function toReportPayload(report: any) {
  return {
    ...report,
    debug: {
      model: process.env.GEMINI_MODEL || 'unknown',
      createdAt: report.createdAt
    }
  };
}

export function buildBootstrapPayload(reports: any[], latestReport: any) {
  const detail = latestReport ? toReportPayload(latestReport) : null;

  return {
    reports,
    selectedDate: detail?.reportDate ?? null,
    detail
  };
}
