import { prisma } from './prisma.js';

export async function upsertSampleReport(date: string) {
  const title = `AI 데일리 레포트 ${date}`;
  const items = [
    {
      source: 'Techmeme',
      headline: 'AI 코딩 에이전트가 개발 생산성을 끌어올리는 동시에 노동 강도와 성과 압박을 키운다는 분석',
      summary: '생산성 증가와 함께 조직 내 압박 및 노동 강도 상승 이슈가 병행된다는 관측.',
      link: 'http://www.techmeme.com/260228/p17#a260228p17',
      displayOrder: 1
    },
    {
      source: 'TLDR AI',
      headline: 'Google Nano Banana 2(Gemini 3.1 Flash Image) 공개',
      summary: '이미지 품질/추론 성능을 유지하며 생성 속도 개선에 초점.',
      link: 'https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/?utm_source=tldrai',
      displayOrder: 2
    }
  ];

  await prisma.dailyReport.upsert({
    where: { reportDate: date },
    create: {
      reportDate: date,
      title,
      summary: '일일 AI 뉴스 큐레이션 리포트',
      items: { create: items }
    },
    update: {
      title,
      summary: '일일 AI 뉴스 큐레이션 리포트(업데이트)',
      collectedAt: new Date(),
      items: {
        deleteMany: {},
        create: items
      }
    }
  });
}
