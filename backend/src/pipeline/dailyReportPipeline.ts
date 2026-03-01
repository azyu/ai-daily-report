import { upsertReportWithItems } from '../services/reportService.js';

type SeedItem = { source: string; headline: string; link: string; priority: 'top' | 'fallback'; summaryHint?: string };

function selectByPolicy(items: SeedItem[], perSource = 5): SeedItem[] {
  const out: SeedItem[] = [];
  const sources = [...new Set(items.map((x) => x.source))];

  for (const source of sources) {
    const sourceItems = items.filter((x) => x.source === source);
    const top = sourceItems.filter((x) => x.priority === 'top');
    const fallback = sourceItems.filter((x) => x.priority === 'fallback');

    const chosen = [...top, ...fallback].slice(0, perSource);
    out.push(...chosen);
  }

  return out;
}

function buildSeedItems(): SeedItem[] {
  return [
    // Techmeme - top exposure first
    { source: 'Techmeme', priority: 'top', headline: 'AI 코딩 에이전트가 개발 생산성을 끌어올리는 동시에 노동 강도와 성과 압박을 키운다는 분석', link: 'http://www.techmeme.com/260228/p17#a260228p17', summaryHint: '생산성 상승과 노동 강도 증가의 동시 효과' },
    { source: 'Techmeme', priority: 'top', headline: '아마존 AI 총괄, Trainium·Inferentia 중심 전략 재확인', link: 'http://www.techmeme.com/260228/p16#a260228p16', summaryHint: '자체 칩 기반 비용 절감과 인프라 주도권 강화' },
    { source: 'Techmeme', priority: 'top', headline: '중국, AI 생산성 확대와 고용 충격 사이 정책 균형 과제', link: 'http://www.techmeme.com/260228/p15#a260228p15', summaryHint: '성장과 고용 안정 사이 정책 균형' },
    { source: 'Techmeme', priority: 'top', headline: 'Claude 앱 급상승, 정책 이슈와 사용자 수요 동시 부각', link: 'http://www.techmeme.com/260228/p12#a260228p12', summaryHint: '정책 이벤트와 수요 확대의 동시 발생' },
    { source: 'Techmeme', priority: 'top', headline: 'MatX 인터뷰: LLM 특화 반도체 병목과 차세대 설계', link: 'http://www.techmeme.com/260228/p10#a260228p10', summaryHint: '칩 병목과 차세대 설계 방향 논의' },
    { source: 'Techmeme', priority: 'fallback', headline: 'AI 인프라 투자 확대, 클라우드·반도체·전력 경쟁 심화', link: 'http://www.techmeme.com/260228/p09#a260228p09' },

    // TLDR AI - top exposure first
    { source: 'TLDR AI', priority: 'top', headline: 'Google Nano Banana 2 공개', link: 'https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/?utm_source=tldrai', summaryHint: '품질 유지 + 생성 속도 개선' },
    { source: 'TLDR AI', priority: 'top', headline: 'Anthropic, 국방 협력 원칙과 안전장치 입장 발표', link: 'https://www.anthropic.com/news/statement-department-of-war?utm_source=tldrai', summaryHint: '협력 유지와 안전장치 해제 거부' },
    { source: 'TLDR AI', priority: 'top', headline: 'xAI 공동창업자 이탈, 조직 안정성 이슈 재점화', link: 'https://www.bloomberg.com/news/articles/2026-02-27/xai-co-founder-toby-pohlen-is-latest-executive-to-depart?utm_source=tldrai', summaryHint: '핵심 인력 이탈과 실행력 우려' },
    { source: 'TLDR AI', priority: 'top', headline: '하이퍼스케일러 AI CAPEX 급증', link: 'https://epochai.substack.com/p/hyperscaler-capex-has-quadrupled?utm_source=tldrai', summaryHint: '클라우드/반도체/전력 설비 경쟁 심화' },
    { source: 'TLDR AI', priority: 'top', headline: 'DualPath 연구, 에이전틱 LLM 추론 I/O 병목 개선 제안', link: 'https://arxiv.org/abs/2602.21548?utm_source=tldrai', summaryHint: 'KV 캐시 경로 이중화로 처리량 개선' },
    { source: 'TLDR AI', priority: 'fallback', headline: '에이전트 관측성(Observability) 도구 시장 확대', link: 'https://www.tldrai.com/sample/agent-observability' }
  ];
}

function summarize(item: SeedItem): string {
  const map: Record<string, string> = {
    'AI 코딩 에이전트가 개발 생산성을 끌어올리는 동시에 노동 강도와 성과 압박을 키운다는 분석': 'AI 코딩 에이전트 도입으로 개발 속도는 빨라졌지만, 엔지니어 개인의 업무 밀도와 경영진의 성과 기대치도 함께 높아지고 있다는 분석입니다.',
    '아마존 AI 총괄, Trainium·Inferentia 중심 전략 재확인': '아마존은 자체 AI 칩(Trainium·Inferentia) 중심 전략으로 모델 개발 비용을 낮추고, 인프라 주도권을 강화하려는 방향을 분명히 했습니다.',
    '중국, AI 생산성 확대와 고용 충격 사이 정책 균형 과제': '중국은 AI를 통한 생산성 확대를 추진하면서도 자동화로 인한 고용 충격을 완화해야 하는 정책적 균형 과제에 직면해 있습니다.',
    'Claude 앱 급상승, 정책 이슈와 사용자 수요 동시 부각': '미 국방부의 공급망 리스크 지정 직후 Claude 앱이 미국 앱스토어 상위권으로 올라, 규제 이슈와 사용자 수요가 동시에 커진 흐름이 확인됐습니다.',
    'MatX 인터뷰: LLM 특화 반도체 병목과 차세대 설계': '전 구글 TPU 아키텍트가 만든 MatX 인터뷰에서 LLM 특화 반도체의 병목 지점과 차세대 설계 방향이 구체적으로 논의됐습니다.',
    'Google Nano Banana 2 공개': '구글은 Nano Banana 2(Gemini 3.1 Flash Image)를 공개하며, 이미지 품질과 추론 성능을 유지한 채 생성 속도를 높이는 데 집중했습니다.',
    'Anthropic, 국방 협력 원칙과 안전장치 입장 발표': 'Anthropic은 국방 협력은 이어가되 대규모 감시·완전 자율무기 등 안전장치 해제를 요구하는 조건은 수용하지 않겠다는 입장을 밝혔습니다.',
    'xAI 공동창업자 이탈, 조직 안정성 이슈 재점화': 'xAI 공동창업자 Toby Pohlen의 이탈로, 최근 이어지는 핵심 인력 유출이 조직 안정성과 실행력에 미칠 영향이 다시 주목받고 있습니다.',
    '하이퍼스케일러 AI CAPEX 급증': 'GPT-4 이후 하이퍼스케일러의 AI 인프라 CAPEX가 크게 늘면서, 클라우드·반도체·전력 중심의 설비 경쟁이 한층 가속되고 있습니다.',
    'DualPath 연구, 에이전틱 LLM 추론 I/O 병목 개선 제안': 'DualPath 연구는 에이전틱 LLM 추론에서 KV 캐시 로딩 경로를 이중화해 I/O 병목을 줄이고 처리량을 높일 수 있음을 제시했습니다.',
    'AI 인프라 투자 확대, 클라우드·반도체·전력 경쟁 심화': 'AI 인프라 투자가 확대되며 클라우드·반도체·전력 영역에서 설비와 공급망 주도권 경쟁이 더욱 치열해지는 흐름입니다.',
    '에이전트 관측성(Observability) 도구 시장 확대': '에이전트 운영이 본격화되면서 작업 추적·재시도·비용 모니터링을 통합하는 관측성 도구 수요가 빠르게 커지고 있습니다.'
  };
  return map[item.headline] ?? `${item.headline} 이슈가 업계에서 주목받고 있습니다.`;
}

export async function collectDailyReport(date: string) {
  const selected = selectByPolicy(buildSeedItems(), 5);

  const items = selected.map((x, i) => ({
    source: x.source,
    headline: x.headline,
    summary: summarize(x),
    link: x.link,
    displayOrder: i + 1
  }));

  await upsertReportWithItems({
    date,
    title: `AI 데일리 레포트 ${date}`,
    summary: '일일 AI 뉴스 큐레이션 리포트',
    items
  });
}
