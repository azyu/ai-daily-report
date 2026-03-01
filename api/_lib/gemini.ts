import type { SeedItem } from './seeds.js';

type GeminiSummary = { source: string; headline: string; link: string; summary: string };

async function callGemini(model: string, apiKey: string, prompt: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      throw new Error(`Gemini API failed(${model}): ${r.status} ${text.slice(0, 200)}`);
    }
    const data = (await r.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const first = text.indexOf('[');
    const last = text.lastIndexOf(']');
    if (first < 0 || last < 0) throw new Error(`Gemini JSON parse failed(${model})`);
    return JSON.parse(text.slice(first, last + 1));
  } finally {
    clearTimeout(timeout);
  }
}

export async function summarizeWithGemini(items: SeedItem[]): Promise<GeminiSummary[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  const primary = process.env.GEMINI_MODEL ?? 'gemini-1.5-pro';
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL ?? 'gemini-1.5-flash';
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 18000);
  const minChars = Number(process.env.SUMMARY_MIN_CHARS ?? 120);
  const maxChars = Number(process.env.SUMMARY_MAX_CHARS ?? 220);

  const batches: SeedItem[][] = [];
  for (let i = 0; i < items.length; i += 5) batches.push(items.slice(i, i + 5));

  const out: GeminiSummary[] = [];
  for (const batch of batches) {
    const prompt = `다음 뉴스 목록을 한국어로 1문장씩 요약해줘.\n규칙:\n- 사실 중심\n- 제목 반복 금지\n- 톤: 뉴스 브리핑체\n- 각 항목 2~3줄 분량(약 ${minChars}~${maxChars}자)\n- 출력: JSON 배열만\n- 각 원소: source, headline, link, summary\n\n입력:\n${JSON.stringify(batch)}`;

    let parsed: GeminiSummary[] | null = null;

    // 1) primary model retry x2
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        parsed = await callGemini(primary, apiKey, prompt, timeoutMs);
        break;
      } catch {
        if (attempt === 2) parsed = null;
      }
    }

    // 2) fallback model retry x1
    if (!parsed) {
      parsed = await callGemini(fallbackModel, apiKey, prompt, timeoutMs);
    }
    if (!parsed) throw new Error(`Gemini returned no summaries for batch using ${fallbackModel}`);

    out.push(...parsed);
  }

  return out;
}
