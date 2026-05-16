const RSS_TIMEOUT_MS = 6000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type RssNewsItem = {
    title: string;
    link: string;
    pubDate: Date;
    sourceUrl?: string;
};

function decodeXmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

/** Google News supports `when:1d` for stories from the last 24 hours. */
export function withLast24Hours(query: string): string {
    const q = query.trim();
    if (!q) return 'when:1d';
    if (/\bwhen:\d+[hdm]\b/i.test(q)) return q;
    return `${q} when:1d`;
}

/** Rounded hours since publish; minimum 1h for display. */
export function hoursAgoFromDate(date: Date): number {
    const ms = Date.now() - date.getTime();
    if (ms < 0) return 1;
    const hours = Math.round(ms / (60 * 60 * 1000));
    if (hours < 1) return 1;
    return Math.min(24, hours);
}

export function isWithinLast24Hours(date: Date): boolean {
    return Date.now() - date.getTime() <= MAX_AGE_MS;
}

/** Strip trailing " - Publisher" from Google News titles. */
export function cleanRssTitle(raw: string): string {
    const t = decodeXmlEntities(raw.trim());
    const idx = t.lastIndexOf(' - ');
    if (idx > 20) return t.slice(0, idx).trim();
    return t;
}

function normalizeForMatch(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function parseRssItems(xml: string): RssNewsItem[] {
    const items: RssNewsItem[] = [];
    const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];

    for (const block of itemBlocks) {
        const inner = block.replace(/<\/?item>/gi, '');
        const titleMatch = inner.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = inner.match(/<link>([^<]+)<\/link>/i);
        const pubMatch = inner.match(/<pubDate>([^<]+)<\/pubDate>/i);
        const sourceMatch = inner.match(/<source[^>]*url="([^"]+)"/i);

        if (!titleMatch || !linkMatch || !pubMatch) continue;

        const title = decodeXmlEntities(titleMatch[1].trim());
        const link = linkMatch[1].trim();
        const pubDate = new Date(pubMatch[1].trim());
        if (!title || !link.startsWith('https://') || Number.isNaN(pubDate.getTime())) continue;
        if (!isWithinLast24Hours(pubDate)) continue;

        items.push({
            title,
            link,
            pubDate,
            sourceUrl: sourceMatch?.[1]?.trim(),
        });
    }

    return items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}

export async function fetchRecentRssNews(query: string, limit = 8): Promise<RssNewsItem[]> {
    const rssUrl =
        `https://news.google.com/rss/search?q=${encodeURIComponent(withLast24Hours(query))}` +
        '&hl=en-US&gl=US&ceid=US:en';

    try {
        const res = await fetch(rssUrl, { signal: AbortSignal.timeout(RSS_TIMEOUT_MS) });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRssItems(xml).slice(0, limit);
    } catch {
        return [];
    }
}

export function pickBestRssMatch(items: RssNewsItem[], hintTitle?: string): RssNewsItem | null {
    if (!items.length) return null;
    if (!hintTitle?.trim()) return items[0];

    const hint = normalizeForMatch(hintTitle);
    const hintWords = hint.split(' ').filter((w) => w.length > 3);
    let best: RssNewsItem | null = null;
    let bestScore = 0;

    for (const item of items) {
        const candidate = normalizeForMatch(cleanRssTitle(item.title));
        let score = 0;
        if (candidate.includes(hint.slice(0, 24)) || hint.includes(candidate.slice(0, 24))) {
            score += 4;
        }
        for (const word of hintWords) {
            if (candidate.includes(word)) score += 1;
        }
        if (score > bestScore) {
            bestScore = score;
            best = item;
        }
    }

    return bestScore > 0 ? best : items[0];
}

export async function fetchBestRecentArticle(
    subject: string,
    title: string
): Promise<RssNewsItem | null> {
    const queries = [
        withLast24Hours(`${subject} ${title}`.trim().slice(0, 120)),
        withLast24Hours(subject.trim()),
        withLast24Hours(title.trim().split(/\s+/).slice(0, 8).join(' ')),
    ];

    for (const query of queries) {
        if (!query.replace('when:1d', '').trim()) continue;
        const items = await fetchRecentRssNews(query, 6);
        const match = pickBestRssMatch(items, title);
        if (match) return match;
    }

    return null;
}
