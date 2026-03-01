export type SeedItem = {
  source: 'Techmeme' | 'TLDR AI';
  priority: 'top' | 'fallback';
  headline: string;
  link: string;
  summaryHint?: string;
  publishedAt?: Date;
};

const TLDR_LATEST_URL = 'https://tldr.tech/api/latest/ai';
const TECHMEME_FEED_URL = 'https://www.techmeme.com/feed.xml';
const FETCH_TIMEOUT_MS = 8000;
const AI_KEYWORD_RE =
  /\b(ai|artificial intelligence|llm|llms|openai|anthropic|claude|gemini|copilot|chatgpt|cursor|replit|perplexity|mistral|deepseek|hugging face|nvidia|agent|agents|inference|trainium|inferentia)\b/i;

function decodeHtml(input: string) {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '-')
    .replace(/&ldquo;|&rdquo;/g, '"');
}

function stripHtml(input: string) {
  return decodeHtml(input).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function classifyPriority(index: number): SeedItem['priority'] {
  return index < 5 ? 'top' : 'fallback';
}

function withTimeout(signal?: AbortSignal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });
  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timeout);
    }
  };
}

async function fetchText(url: string, signal?: AbortSignal) {
  const timeout = withTimeout(signal);
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'ai-daily-report/1.0'
      },
      redirect: 'follow',
      signal: timeout.signal
    });
    if (!response.ok) throw new Error(`fetch_failed ${url} ${response.status}`);
    return { text: await response.text(), url: response.url };
  } finally {
    timeout.clear();
  }
}

function selectByPolicy(items: SeedItem[], perSource: number) {
  const sources = [...new Set(items.map((item) => item.source))] as Array<SeedItem['source']>;
  return sources.flatMap((source) => {
    const sourceItems = items.filter((item) => item.source === source);
    return [...sourceItems.filter((item) => item.priority === 'top'), ...sourceItems.filter((item) => item.priority === 'fallback')].slice(0, perSource);
  });
}

function extractIssueDate(url: string) {
  const match = url.match(/\/ai\/(\d{4}-\d{2}-\d{2})(?:$|[/?#])/);
  return match?.[1];
}

export function parseTldrAiIssue(html: string, issueUrl: string): SeedItem[] {
  const issueDate = extractIssueDate(issueUrl);
  if (!issueDate) throw new Error(`invalid_tldr_issue_url ${issueUrl}`);

  return [...html.matchAll(/<article class="mt-3">([\s\S]*?)<\/article>/g)].flatMap((match, index) => {
    const hrefMatch = match[1].match(/<a class="font-bold" href="([^"]+)"/);
    const titleMatch = match[1].match(/<h3>([\s\S]*?)<\/h3>/);
    const summaryMatch = match[1].match(/<div class="newsletter-html">([\s\S]*?)<\/div>/);
    if (!hrefMatch || !titleMatch || !summaryMatch) return [];

    const headline = stripHtml(titleMatch[1]).replace(/\s+\(\d+\s+minute read\)\s*$/i, '');
    if (!headline || /\(Sponsor\)$/i.test(headline)) return [];

    return [{
      source: 'TLDR AI' as const,
      priority: classifyPriority(index),
      headline,
      link: decodeHtml(hrefMatch[1]),
      summaryHint: stripHtml(summaryMatch[1]),
      publishedAt: new Date(`${issueDate}T00:00:00.000Z`)
    }];
  });
}

export function parseTechmemeFeed(xml: string): SeedItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .flatMap((match) => {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
      const externalLinkMatch =
        itemXml.match(/<SPAN STYLE="font-size:1\.3em;"><B><A HREF="([^"]+)">([\s\S]*?)<\/A><\/B><\/SPAN>/i) ||
        itemXml.match(/<A HREF="([^"]+)"><IMG/i);
      const descriptionMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      if (!titleMatch || !externalLinkMatch) return [];

      const headline = stripHtml(externalLinkMatch[2] || titleMatch[1]).replace(/\s+\([^()]+\)\s*$/, '');
      const summaryHint = descriptionMatch ? stripHtml(descriptionMatch[1]) : undefined;
      if (!AI_KEYWORD_RE.test(`${headline} ${summaryHint ?? ''}`)) return [];

      return [{
        source: 'Techmeme' as const,
        priority: 'fallback' as const,
        headline,
        link: decodeHtml(externalLinkMatch[1]),
        summaryHint,
        publishedAt: pubDateMatch ? new Date(pubDateMatch[1]) : undefined
      }];
    })
    .slice(0, 10)
    .map((item, index) => ({ ...item, priority: classifyPriority(index) }));
}

export async function buildSeeds(perSource = 5) {
  const [tldr, techmeme] = await Promise.allSettled([
    fetchText(TLDR_LATEST_URL).then(({ text, url }) => parseTldrAiIssue(text, url)),
    fetchText(TECHMEME_FEED_URL).then(({ text }) => parseTechmemeFeed(text))
  ]);

  const items: SeedItem[] = [];
  const failures: string[] = [];

  for (const result of [tldr, techmeme]) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    } else {
      failures.push(String(result.reason?.message || result.reason));
    }
  }

  if (!items.length) {
    throw new Error(`seed_collection_failed ${failures.join(' | ')}`);
  }

  if (failures.length) {
    console.warn('seed_collection_partial_failure', failures.join(' | '));
  }

  return selectByPolicy(items, perSource);
}
