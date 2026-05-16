import { curateHeadlines } from './headline-ai';
import { cacheKeyGeneral, getCachedHeadlines, setCachedHeadlines } from './headline-cache';
import {
    enforceAllowedSports,
    interleaveByKind,
    isAllowedHeadline,
    refineHeadlineItem,
    truncateText,
    type HeadlineItem,
    type HeadlineSubjectKind,
} from './headline-utils';
import { cleanRssTitle, fetchRecentRssNews, hoursAgoFromDate, withLast24Hours } from './rss-news';

const TITLE_MAX_LENGTH = 72;
const RSS_PER_FEED = 6;

const FEEDS: { query: string; fallbackSubject: string; fallbackKind: HeadlineSubjectKind }[] = [
    { query: 'NFL', fallbackSubject: 'NFL', fallbackKind: 'league' },
    { query: 'NBA', fallbackSubject: 'NBA', fallbackKind: 'league' },
    { query: 'college football', fallbackSubject: 'College Football', fallbackKind: 'league' },
    { query: 'college basketball', fallbackSubject: 'College Basketball', fallbackKind: 'league' },
];

function rssItemToHeadline(
    item: Awaited<ReturnType<typeof fetchRecentRssNews>>[number],
    fallbackSubject: string,
    fallbackKind: HeadlineSubjectKind
): HeadlineItem {
    const title = cleanRssTitle(item.title);
    return refineHeadlineItem({
        title: truncateText(title, TITLE_MAX_LENGTH),
        subject: fallbackSubject,
        kind: fallbackKind,
        publishedHoursAgo: hoursAgoFromDate(item.pubDate),
        url: item.link,
    });
}

async function fetchCandidatePool(): Promise<HeadlineItem[]> {
    const all: HeadlineItem[] = [];
    const seenUrls = new Set<string>();

    const feedResults = await Promise.all(
        FEEDS.map((feed) => fetchRecentRssNews(withLast24Hours(feed.query), RSS_PER_FEED))
    );

    for (let i = 0; i < FEEDS.length; i++) {
        const feed = FEEDS[i];
        const items = feedResults[i];
        for (const item of items) {
            const headline = rssItemToHeadline(item, feed.fallbackSubject, feed.fallbackKind);
            if (!isAllowedHeadline(headline.subject, headline.title)) continue;
            if (seenUrls.has(headline.url)) continue;
            seenUrls.add(headline.url);
            all.push(headline);
        }
    }

    if (all.length === 0) {
        const fallbackItems = await fetchRecentRssNews(
            withLast24Hours('NFL NBA college football basketball'),
            12
        );
        for (const item of fallbackItems) {
            const headline = rssItemToHeadline(item, 'NFL', 'league');
            if (!isAllowedHeadline(headline.subject, headline.title)) continue;
            if (seenUrls.has(headline.url)) continue;
            seenUrls.add(headline.url);
            all.push(headline);
        }
    }

    return all;
}

function rssOnlyFallback(candidates: HeadlineItem[]): HeadlineItem[] {
    const interleaved = interleaveByKind(candidates);
    return enforceAllowedSports(interleaved, [], 8).slice(0, 8);
}

export type GeneralHeadlinesResult = {
    headlines: HeadlineItem[];
    source: 'cache' | 'ai' | 'rss';
};

/** Home feed: RSS articles curated by AI when available. */
export async function buildGeneralHeadlines(): Promise<GeneralHeadlinesResult> {
    const cacheKey = cacheKeyGeneral();
    const cached = getCachedHeadlines(cacheKey);
    if (cached && cached.length > 0) {
        return { headlines: cached, source: 'cache' };
    }

    const candidates = await fetchCandidatePool();
    if (candidates.length === 0) {
        return { headlines: [], source: 'rss' };
    }

    const curated = await curateHeadlines(candidates, { mode: 'general' });
    if (curated && curated.length > 0) {
        setCachedHeadlines(cacheKey, curated);
        return { headlines: curated, source: 'ai' };
    }

    return { headlines: rssOnlyFallback(candidates), source: 'rss' };
}
