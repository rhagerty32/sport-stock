import { useQuery } from '@tanstack/react-query';

const HEADLINES_URL = (process.env.EXPO_PUBLIC_HEADLINES_URL ?? '').trim();

/** ~3 lines in headline cards without ellipsis. */
export const HEADLINE_TITLE_MAX_LENGTH = 72;
export const HEADLINE_SUBJECT_MAX_LENGTH = 28;

export type HeadlineSubjectKind = 'league' | 'team' | 'player';

export type SportsHeadline = {
    title: string;
    url: string;
    kind: HeadlineSubjectKind;
    subject: string;
    publishedHoursAgo: number;
};

export const headlinesKeys = {
    root: ['sports-headlines', 'v9'] as const,
    team: (team: string, sportKey: string) => ['team-headlines', team, sportKey, 'v9'] as const,
};

const DISALLOWED_MARKERS =
    /\b(mlb|nhl|mls|wnba|premier league|soccer|ufc|pga|formula 1|nascar|hockey|baseball|ovechkin|stanley cup|world series)\b/i;

const KINDS: HeadlineSubjectKind[] = ['league', 'team', 'player'];
const GENERIC_SUBJECTS = new Set(['sports', 'sport', 'general', 'news', 'headlines']);

export function headlinesQueryEnabled(): boolean {
    return HEADLINES_URL.length > 0;
}

function clampHoursAgo(value: number): number {
    return Math.min(24, Math.max(1, Math.round(value)));
}

/** Client fallback only — Lambda resolves real article URLs via Google News RSS. */
export function headlineArticleUrl(subject: string, title: string): string {
    const q = [subject, title, 'when:1d'].filter(Boolean).join(' ');
    return `https://news.google.com/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
}

export function truncateHeadlineText(text: string, max: number): string {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= max) return normalized;
    const cut = normalized.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace >= Math.floor(max * 0.55)) return cut.slice(0, lastSpace).trim();
    return cut.trim();
}

function isAllowedHeadline(subject: string, title: string): boolean {
    const blob = `${subject} ${title}`.toLowerCase();
    if (DISALLOWED_MARKERS.test(blob)) return false;
    if (/\bnfl\b|nfc|afc|super bowl/i.test(blob)) return true;
    if (/\bnba\b|western conference|eastern conference/i.test(blob)) return true;
    if (/\bcollege football|ncaa football|cfb|ap poll|cfp|heisman/i.test(blob)) return true;
    if (/\bcollege basketball|ncaab|march madness|final four/i.test(blob)) return true;
    if (/\b(eagles|cowboys|chiefs|patriots|lakers|celtics|warriors|byu football|crimson tide|buckeyes)\b/i.test(blob)) {
        return true;
    }
    if (subject.toLowerCase() === 'nfl' || subject.toLowerCase() === 'nba') return true;
    if (subject.toLowerCase().includes('college football')) return true;
    if (subject.toLowerCase().includes('college basketball')) return true;
    if (/\bfootball\b/i.test(subject) || /\bbasketball\b/i.test(subject)) return true;
    return false;
}

function normalizeKind(raw: unknown, subject: string, title: string): HeadlineSubjectKind {
    if (typeof raw === 'string' && KINDS.includes(raw as HeadlineSubjectKind)) {
        return raw as HeadlineSubjectKind;
    }
    return inferKind(subject, title);
}

function inferKind(subject: string, title: string): HeadlineSubjectKind {
    const s = subject.trim().toLowerCase();
    const blob = `${subject} ${title}`.toLowerCase();

    const leagues = ['nba', 'nfl', 'college basketball', 'college football', 'ncaa'];
    if (leagues.some((l) => s === l || s.includes(l))) return 'league';
    if (/\b(league|conference|standings|seedings|ap poll|playoff race)\b/i.test(blob)) return 'league';
    if (/\b(throws|scores|touchdown|triple-double|double-double)\b/i.test(title)) return 'player';
    if (/\b(eagles|cowboys|chiefs|lakers|celtics|warriors|patriots|heat|packers|byu|buckeyes|crimson tide)\b/i.test(blob)) {
        return 'team';
    }

    const words = subject.trim().split(/\s+/);
    if (words.length === 2 && !GENERIC_SUBJECTS.has(s)) return 'player';
    if (words.length >= 2 && !GENERIC_SUBJECTS.has(s)) return 'team';
    return 'league';
}

function interleaveByKind(items: SportsHeadline[]): SportsHeadline[] {
    const pools: Record<HeadlineSubjectKind, SportsHeadline[]> = { league: [], team: [], player: [] };
    for (const item of items) pools[item.kind].push(item);

    const pattern: HeadlineSubjectKind[] = ['team', 'player', 'league'];
    const indices = { league: 0, team: 0, player: 0 };
    const out: SportsHeadline[] = [];
    const seen = new Set<string>();

    const take = (kind: HeadlineSubjectKind) => {
        const pool = pools[kind];
        while (indices[kind] < pool.length) {
            const item = pool[indices[kind]++];
            if (!seen.has(item.title)) return item;
        }
        return null;
    };

    while (out.length < items.length) {
        let added = false;
        for (const kind of pattern) {
            const next = take(kind);
            if (next) {
                seen.add(next.title);
                out.push(next);
                added = true;
                if (out.length >= items.length) break;
            }
        }
        if (!added) break;
    }

    for (const kind of KINDS) {
        for (const item of pools[kind]) {
            if (!seen.has(item.title)) out.push(item);
        }
    }
    return out;
}

function isVerifiedArticleUrl(url: string): boolean {
    return url.startsWith('https://') && !url.includes('news.google.com/search');
}

function normalizeHeadline(raw: unknown, options?: { teamScope?: boolean }): SportsHeadline | null {
    if (!raw || typeof raw !== 'object') return null;

    const o = raw as {
        title?: unknown;
        url?: unknown;
        kind?: unknown;
        subject?: unknown;
        publishedHoursAgo?: unknown;
    };

    const title = typeof o.title === 'string' ? truncateHeadlineText(o.title, HEADLINE_TITLE_MAX_LENGTH) : '';
    if (!title) return null;

    let subject =
        typeof o.subject === 'string' ? truncateHeadlineText(o.subject, HEADLINE_SUBJECT_MAX_LENGTH) : '';
    if (GENERIC_SUBJECTS.has(subject.toLowerCase())) subject = '';

    const kind = options?.teamScope ? 'team' : normalizeKind(o.kind, subject, title);
    const resolvedSubject =
        subject ||
        (kind === 'league' ? 'NBA' : kind === 'player' ? 'Patrick Mahomes' : 'Philadelphia Eagles');

    if (typeof o.publishedHoursAgo !== 'number' || !Number.isFinite(o.publishedHoursAgo)) return null;
    const publishedHoursAgo = clampHoursAgo(o.publishedHoursAgo);
    if (publishedHoursAgo < 1 || publishedHoursAgo > 24) return null;

    const url = typeof o.url === 'string' ? o.url : '';
    if (!isVerifiedArticleUrl(url)) return null;

    return { title, url, kind, subject: resolvedSubject, publishedHoursAgo };
}

function parseHeadlinesResponse(
    data: { headlines?: unknown },
    options?: { teamScope?: boolean; teamName?: string }
): SportsHeadline[] {
    if (!Array.isArray(data.headlines)) return [];
    const seen = new Set<string>();
    const out: SportsHeadline[] = [];

    for (const item of data.headlines) {
        const headline = normalizeHeadline(item, options);
        if (!headline || seen.has(headline.title)) continue;
        if (!options?.teamScope && !isAllowedHeadline(headline.subject, headline.title)) continue;
        if (headline.publishedHoursAgo > 24) continue;
        seen.add(headline.title);
        out.push(headline);
        if (out.length >= 12) break;
    }

    if (options?.teamScope) return out;
    return interleaveByKind(out);
}

function buildHeadlinesUrl(params?: { team?: string; sportKey?: string }): string {
    if (!HEADLINES_URL) return '';
    if (!params?.team) return HEADLINES_URL;
    const url = new URL(HEADLINES_URL);
    url.searchParams.set('team', params.team);
    if (params.sportKey) url.searchParams.set('sport', params.sportKey);
    return url.toString();
}

export async function fetchSportsHeadlines(): Promise<SportsHeadline[]> {
    const url = buildHeadlinesUrl();
    if (!url) return [];
    const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { headlines?: unknown };
    return parseHeadlinesResponse(data);
}

export async function fetchTeamHeadlines(team: string, sportKey: string): Promise<SportsHeadline[]> {
    const url = buildHeadlinesUrl({ team, sportKey });
    if (!url) return [];
    const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { headlines?: unknown };
    return parseHeadlinesResponse(data, { teamScope: true, teamName: team });
}

const STALE_MS = 15 * 60 * 1000;
const GC_MS = 60 * 60 * 1000;

export function useSportsHeadlines() {
    const enabled = headlinesQueryEnabled();
    return useQuery({
        queryKey: headlinesKeys.root,
        queryFn: fetchSportsHeadlines,
        enabled,
        staleTime: STALE_MS,
        gcTime: GC_MS,
    });
}

export function useTeamHeadlines(teamName: string | null | undefined, sportKey: string | null | undefined) {
    const team = teamName?.trim() ?? '';
    const sport = sportKey?.trim() ?? '';
    const enabled = headlinesQueryEnabled() && team.length > 0 && sport.length > 0;

    return useQuery({
        queryKey: headlinesKeys.team(team, sport),
        queryFn: () => fetchTeamHeadlines(team, sport),
        enabled,
        staleTime: STALE_MS,
        gcTime: GC_MS,
    });
}

export function headlineKindLabel(kind: HeadlineSubjectKind): string {
    switch (kind) {
        case 'team':
            return 'Team';
        case 'player':
            return 'Player';
        default:
            return 'League';
    }
}
