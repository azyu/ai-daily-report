import { prisma } from '../prisma.js';

export async function listReports() {
  return prisma.dailyReport.findMany({
    orderBy: { reportDate: 'desc' },
    select: { id: true, reportDate: true, title: true, collectedAt: true }
  });
}

export async function getReportByDate(date: string) {
  return prisma.dailyReport.findUnique({
    where: { reportDate: date },
    include: { items: { orderBy: { displayOrder: 'asc' } } }
  });
}

export async function upsertReportWithItems(params: {
  date: string;
  title: string;
  summary?: string;
  items: Array<{ source: string; headline: string; summary: string; link: string; displayOrder: number }>;
}) {
  const { date, title, summary, items } = params;
  return prisma.dailyReport.upsert({
    where: { reportDate: date },
    create: { reportDate: date, title, summary, items: { create: items } },
    update: { title, summary, collectedAt: new Date(), items: { deleteMany: {}, create: items } }
  });
}
