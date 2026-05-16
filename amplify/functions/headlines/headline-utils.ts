export type HeadlineSubjectKind = 'league' | 'team' | 'player';

export type AllowedSport = 'nfl' | 'nba' | 'college-basketball' | 'college-football';

export type HeadlineItem = {
    title: string;
    url: string;
    kind: HeadlineSubjectKind;
    subject: string;
    publishedHoursAgo: number;
};

export const KINDS: HeadlineSubjectKind[] = ['league', 'team', 'player'];

export const ALLOWED_LEAGUE_SUBJECTS = ['NFL', 'NBA', 'College Basketball', 'College Football'] as const;

const LEAGUE_SUBJECTS = [...ALLOWED_LEAGUE_SUBJECTS];

const NFL_MARKERS =
    /\b(nfl|nfc|afc|super bowl|wild[- ]?card|draft|quarterback|touchdown|interception|linebacker|wide receiver|running back)\b/i;
const NBA_MARKERS =
    /\b(nba|western conference|eastern conference|triple-double|double-double|play-in|free throw|three-pointer)\b/i;
const COLLEGE_FOOTBALL_MARKERS =
    /\b(college football|ncaa football|cfb|ap poll|cfp|playoff|rivalry week|bowl game|heisman|sec\b|big ten|acc\b|big 12|pac-12|notre dame|crimson tide|buckeyes|bulldogs|longhorns|sooners|wolverines|seminoles|gators|trojans|ducks football|huskies football|cardinal football|byu football)\b/i;
const COLLEGE_BASKETBALL_MARKERS =
    /\b(college basketball|ncaab|march madness|final four|elite eight|sweet 16|ncaa tournament|college hoops|duke basketball|kentucky basketball|gonzaga|uconn basketball|tar heels|blue devils|jayhawks)\b/i;

const DISALLOWED_MARKERS =
    /\b(mlb|nhl|mls|wnba|premier league|la liga|serie a|bundesliga|champions league|ufc|mma|pga|lpga|atp|wta|formula 1|f1|nascar|soccer|fifa|olympic|ovechkin|stanley cup|world series|hockey|baseball pennant|premier league)\b/i;

const NFL_TEAMS =
    /\b(eagles|cowboys|chiefs|patriots|packers|bears|bills|ravens|49ers|seahawks|steelers|bengals|dolphins|jets|giants|commanders|vikings|lions|saints|falcons|panthers|buccaneers|texans|colts|jaguars|titans|broncos|raiders|chargers|cardinals|rams|browns)\b/i;
const NBA_TEAMS =
    /\b(lakers|celtics|warriors|heat|knicks|nets|bucks|suns|nuggets|mavericks|clippers|rockets|spurs|thunder|timberwolves|grizzlies|pelicans|hawks|hornets|magic|pistons|pacers|cavaliers|wizards|raptors|76ers|sixers|blazers|kings|jazz|pacers)\b/i;

const PLAYER_TITLE_MARKERS =
    /\b(throws|threw|scores|scored|nets|netted|slams|slammed|records|recorded|signs|signed|traded|ruled out|returns|returned|injury update|touchdown|triple-double|double-double|mvp|all-star)\b/i;

const GENERIC_SUBJECTS = new Set(['sports', 'sport', 'general', 'news', 'headlines']);

export function truncateText(text: string, max: number): string {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= max) return normalized;
    const cut = normalized.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace >= Math.floor(max * 0.55)) return cut.slice(0, lastSpace).trim();
    return cut.trim();
}

export function normalizeKind(raw: unknown): HeadlineSubjectKind | null {
    if (typeof raw !== 'string') return null;
    const k = raw.trim().toLowerCase();
    if (k === 'league' || k === 'team' || k === 'player') return k;
    return null;
}

export function inferAllowedSport(subject: string, title: string): AllowedSport | null {
    const s = subject.trim();
    const blob = `${s} ${title}`;

    if (DISALLOWED_MARKERS.test(blob)) return null;

    const lowerSubject = s.toLowerCase();
    if (lowerSubject === 'nfl' || lowerSubject.includes('nfl')) return 'nfl';
    if (lowerSubject === 'nba' || lowerSubject.includes('nba')) return 'nba';
    if (lowerSubject.includes('college football') || /\bfootball\b/i.test(s) && COLLEGE_FOOTBALL_MARKERS.test(blob)) {
        return 'college-football';
    }
    if (lowerSubject.includes('college basketball') || /\bbasketball\b/i.test(s) && COLLEGE_BASKETBALL_MARKERS.test(blob)) {
        return 'college-basketball';
    }

    if (NFL_MARKERS.test(blob) || NFL_TEAMS.test(blob)) return 'nfl';
    if (NBA_MARKERS.test(blob) || NBA_TEAMS.test(blob)) return 'nba';
    if (COLLEGE_FOOTBALL_MARKERS.test(blob) || /\bfootball\b/i.test(s)) return 'college-football';
    if (COLLEGE_BASKETBALL_MARKERS.test(blob) || /\bbasketball\b/i.test(s)) return 'college-basketball';

    return null;
}

export function isAllowedHeadline(subject: string, title: string): boolean {
    return inferAllowedSport(subject, title) !== null;
}

export function inferKind(subject: string, title: string): HeadlineSubjectKind {
    const s = subject.trim();
    const blob = `${s} ${title}`.toLowerCase();

    if (LEAGUE_SUBJECTS.some((league) => s.toLowerCase() === league.toLowerCase())) {
        return 'league';
    }
    if (/\b(conference|division|standings|seedings|ap poll|playoff race)\b/i.test(blob)) {
        return 'league';
    }
    if (NFL_TEAMS.test(blob) || NBA_TEAMS.test(blob) || /\bfootball\b/i.test(s) || /\bbasketball\b/i.test(s)) {
        return 'team';
    }
    if (PLAYER_TITLE_MARKERS.test(title)) {
        return 'player';
    }

    const words = s.split(/\s+/).filter(Boolean);
    if (
        words.length === 2 &&
        /^[A-Z][a-zA-Z'-]+$/.test(words[0]) &&
        /^[A-Z][a-zA-Z'-]+$/.test(words[1])
    ) {
        return 'player';
    }
    if (words.length >= 2 && !GENERIC_SUBJECTS.has(s.toLowerCase())) {
        return 'team';
    }
    return 'league';
}

export function isGenericSubject(subject: string): boolean {
    const s = subject.trim().toLowerCase();
    return !s || GENERIC_SUBJECTS.has(s);
}

function defaultLeagueSubject(sport: AllowedSport): string {
    switch (sport) {
        case 'nfl':
            return 'NFL';
        case 'nba':
            return 'NBA';
        case 'college-basketball':
            return 'College Basketball';
        case 'college-football':
            return 'College Football';
    }
}

export function refineHeadlineItem(item: HeadlineItem): HeadlineItem {
    let subject = item.subject.trim();
    let kind = item.kind;

    if (isGenericSubject(subject)) {
        kind = inferKind(subject, item.title);
        subject = inferSubjectFromTitle(item.title, kind);
    } else if (!normalizeKind(kind)) {
        kind = inferKind(subject, item.title);
    }

    const sport = inferAllowedSport(subject, item.title);
    if (!sport && !isGenericSubject(subject)) {
        kind = inferKind(subject, item.title);
        subject = inferSubjectFromTitle(item.title, kind);
    }

    return {
        ...item,
        kind,
        subject: truncateText(subject, 28),
        title: truncateText(item.title, 72),
    };
}

function inferSubjectFromTitle(title: string, kind: HeadlineSubjectKind): string {
    const sport = inferAllowedSport('', title);
    if (sport) return defaultLeagueSubject(sport);

    const teamMatch = title.match(
        /\b((?:Philadelphia|Dallas|Kansas City|Green Bay|New York|Los Angeles|San Francisco|Golden State|Boston|Chicago|Miami|Denver|Seattle|Las Vegas|Oklahoma City|BYU|Alabama|Ohio State|Georgia|Texas|USC|Notre Dame|Duke|Kentucky|UConn|Gonzaga)\s+[A-Z][a-zA-Z]+)\b/
    );
    if (teamMatch) return teamMatch[1];

    const playerMatch = title.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/);
    if (kind === 'player' && playerMatch) return playerMatch[1];

    if (kind === 'league') return 'NFL';
    if (kind === 'team') return 'Philadelphia Eagles';
    return 'Patrick Mahomes';
}

export function filterAllowedHeadlines(items: HeadlineItem[]): HeadlineItem[] {
    return items.filter((item) => isAllowedHeadline(item.subject, item.title));
}

export function interleaveByKind(items: HeadlineItem[]): HeadlineItem[] {
    const pools: Record<HeadlineSubjectKind, HeadlineItem[]> = {
        league: [],
        team: [],
        player: [],
    };
    for (const item of items) {
        pools[item.kind].push(item);
    }

    const pattern: HeadlineSubjectKind[] = ['team', 'player', 'league'];
    const indices = { league: 0, team: 0, player: 0 };
    const out: HeadlineItem[] = [];
    const seen = new Set<string>();

    const takeNext = (kind: HeadlineSubjectKind): HeadlineItem | null => {
        const pool = pools[kind];
        while (indices[kind] < pool.length) {
            const candidate = pool[indices[kind]++];
            if (!seen.has(candidate.title)) return candidate;
        }
        return null;
    };

    while (out.length < items.length) {
        let added = false;
        for (const kind of pattern) {
            const next = takeNext(kind);
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
            if (!seen.has(item.title)) {
                seen.add(item.title);
                out.push(item);
            }
        }
    }

    return out;
}

export function enforceKindMix(items: HeadlineItem[], targetCount = 8): HeadlineItem[] {
    const refined = items.map(refineHeadlineItem);
    const interleaved = interleaveByKind(refined);
    return interleaved.slice(0, targetCount);
}

export function enforceAllowedSports(
    items: HeadlineItem[],
    fallbacks: HeadlineItem[],
    targetCount = 8
): HeadlineItem[] {
    const allowed = filterAllowedHeadlines(items.map(refineHeadlineItem));
    const seen = new Set(allowed.map((h) => h.title));

    for (const fb of fallbacks) {
        if (allowed.length >= targetCount) break;
        const refined = refineHeadlineItem(fb);
        if (!seen.has(refined.title) && isAllowedHeadline(refined.subject, refined.title)) {
            allowed.push(refined);
            seen.add(refined.title);
        }
    }

    return enforceKindMix(allowed, targetCount);
}
