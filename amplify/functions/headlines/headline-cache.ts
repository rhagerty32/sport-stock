import type { HeadlineItem } from './headline-utils';

const TTL_MS = 12 * 60 * 1000;

type CacheEntry = {
    expiresAt: number;
    headlines: HeadlineItem[];
};

const store = new Map<string, CacheEntry>();

export function cacheKeyGeneral(): string {
    return 'general';
}

export function cacheKeyTeam(teamName: string, sportKey: string): string {
    const team = teamName.trim().toLowerCase();
    const sport = sportKey.trim().toLowerCase() || 'unknown';
    return `team:${team}:${sport}`;
}

export function getCachedHeadlines(key: string): HeadlineItem[] | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry.headlines;
}

export function setCachedHeadlines(key: string, headlines: HeadlineItem[]): void {
    store.set(key, {
        headlines,
        expiresAt: Date.now() + TTL_MS,
    });
}
