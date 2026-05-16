import { curateHeadlines } from './headline-ai';
import { cacheKeyTeam, getCachedHeadlines, setCachedHeadlines } from './headline-cache';
import type { HeadlineItem } from './headline-utils';
import { refineHeadlineItem, truncateText } from './headline-utils';
import { cleanRssTitle, fetchRecentRssNews, hoursAgoFromDate, withLast24Hours } from './rss-news';

const TITLE_MAX_LENGTH = 72;
const RSS_LIMIT = 12;

function rssToHeadlines(teamName: string, items: Awaited<ReturnType<typeof fetchRecentRssNews>>): HeadlineItem[] {
    return items.map((item) =>
        refineHeadlineItem({
            title: truncateText(cleanRssTitle(item.title), TITLE_MAX_LENGTH),
            subject: truncateText(teamName, 28),
            kind: 'team',
            publishedHoursAgo: hoursAgoFromDate(item.pubDate),
            url: item.link,
        })
    );
}

export type TeamHeadlinesResult = {
    headlines: HeadlineItem[];
    source: 'cache' | 'ai' | 'rss';
};

/** Team page: RSS stories curated by AI when available. */
export async function buildTeamHeadlines(teamName: string, sportKey: string): Promise<TeamHeadlinesResult> {
    const trimmedTeam = teamName.trim();
    if (!trimmedTeam) return { headlines: [], source: 'rss' };

    const cacheKey = cacheKeyTeam(trimmedTeam, sportKey);
    const cached = getCachedHeadlines(cacheKey);
    if (cached && cached.length > 0) {
        return { headlines: cached, source: 'cache' };
    }

    const rssItems = await fetchRecentRssNews(withLast24Hours(trimmedTeam), RSS_LIMIT);
    const candidates = rssToHeadlines(trimmedTeam, rssItems);
    if (candidates.length === 0) {
        return { headlines: [], source: 'rss' };
    }

    const curated = await curateHeadlines(candidates, { mode: 'team', teamName: trimmedTeam });
    if (curated && curated.length > 0) {
        setCachedHeadlines(cacheKey, curated);
        return { headlines: curated, source: 'ai' };
    }

    return { headlines: candidates.slice(0, 8), source: 'rss' };
}
