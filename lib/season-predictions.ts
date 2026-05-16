import { getPolymarketSeasonSearch } from '@/lib/polymarket-api';
import { inferCanonicalTeamNameFromStockId } from '@/lib/odds-api';
import type {
    PolymarketEvent,
    PolymarketMarket,
    SeasonPrediction,
    SeasonPredictionSlotId,
    Stock,
} from '@/types';
import { useQuery } from '@tanstack/react-query';

const CURRENT_SEASON_YEAR = 2026;

const NBA_EAST_DIVISIONS = new Set(['Atlantic', 'Central', 'Southeast']);
const NBA_WEST_DIVISIONS = new Set(['Northwest', 'Pacific', 'Southwest']);

export function polymarketEventUrl(slug: string): string {
    return `https://polymarket.com/event/${slug}`;
}

type TeamContext = {
    sportKey: string;
    seasonYear: number;
    /** NBA division name or NFL division label (e.g. NFC East). */
    divisionLabel?: string;
    nbaConference?: 'Eastern' | 'Western';
    nflConference?: 'NFC' | 'AFC';
    nflDivisionName?: string;
    collegeConference?: string;
};

type SlotConfig = {
    id: SeasonPredictionSlotId;
    label: (ctx: TeamContext) => string;
    buildQuery: (ctx: TeamContext) => string | null;
    scoreEvent: (event: PolymarketEvent, ctx: TeamContext) => number;
};

function normalizeText(value: string): string {
    return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function titleOf(event: PolymarketEvent): string {
    return normalizeText(event.title ?? '');
}

function slugOf(event: PolymarketEvent): string {
    return normalizeText(event.slug ?? '');
}

function futureSeasonBonus(event: PolymarketEvent, ctx: TeamContext): number {
    let bonus = 0;
    const blob = `${titleOf(event)} ${slugOf(event)}`;
    const year = String(ctx.seasonYear);
    if (blob.includes(year)) bonus += 40;
    if (blob.includes('2025-26') || blob.includes('2025–26')) bonus += 30;
    const end = event.endDate ? new Date(event.endDate).getTime() : 0;
    if (end > Date.now()) bonus += 20;
    return bonus;
}

function rejectPlayoffSeries(title: string): boolean {
    return (
        title.includes('advance') ||
        title.includes(' vs.') ||
        title.includes(' vs ') ||
        title.includes('series') ||
        title.includes('mvp') ||
        title.includes('parlay') ||
        title.includes('seed') ||
        title.includes('total games') ||
        title.includes('outcome')
    );
}

function buildTeamContext(stock: Stock, sportKey: string): TeamContext {
    const ctx: TeamContext = { sportKey, seasonYear: CURRENT_SEASON_YEAR };
    const conf = stock.conference?.trim();
    if (!conf) return ctx;

    if (sportKey === 'basketball_nba') {
        ctx.divisionLabel = conf;
        if (NBA_EAST_DIVISIONS.has(conf)) ctx.nbaConference = 'Eastern';
        else if (NBA_WEST_DIVISIONS.has(conf)) ctx.nbaConference = 'Western';
        return ctx;
    }

    if (sportKey === 'americanfootball_nfl') {
        ctx.divisionLabel = conf;
        const match = conf.match(/^(AFC|NFC)\s+(.+)$/i);
        if (match) {
            ctx.nflConference = match[1].toUpperCase() as 'AFC' | 'NFC';
            ctx.nflDivisionName = match[2];
        }
        return ctx;
    }

    ctx.collegeConference = conf;
    return ctx;
}

function getTeamSearchTerms(stock: Stock): string[] {
    const terms = new Set<string>();
    if (stock.name?.trim()) terms.add(stock.name.trim());
    if (stock.fullName?.trim() && stock.fullName !== stock.name) {
        terms.add(stock.fullName.trim());
    }
    const canonical = inferCanonicalTeamNameFromStockId(stock.id);
    if (canonical) {
        terms.add(canonical);
        const words = canonical.split(/\s+/);
        if (words.length > 1) terms.add(words[words.length - 1]);
    }
    return [...terms].filter((t) => t.length >= 2);
}

function marketMatchesTeam(market: PolymarketMarket, stock: Stock): boolean {
    const blob = normalizeText(`${market.question ?? ''} ${market.groupItemTitle ?? ''}`);
    return getTeamSearchTerms(stock).some((term) => blob.includes(normalizeText(term)));
}

function isOpenMarket(market: PolymarketMarket): boolean {
    return market.closed === false && market.acceptingOrders === true;
}

function yesProbability(market: PolymarketMarket): number | null {
    try {
        const outcomes = JSON.parse(market.outcomes) as string[];
        const prices = JSON.parse(market.outcomePrices) as string[];
        const yesIndex = outcomes.findIndex((o) => o === 'Yes');
        if (yesIndex < 0) return null;
        const value = Number(prices[yesIndex]);
        if (!Number.isFinite(value)) return null;
        return Math.min(1, Math.max(0, value));
    } catch {
        return null;
    }
}

function pickOpenTeamMarket(
    event: PolymarketEvent,
    stock: Stock
): PolymarketMarket | null {
    const matches = event.markets.filter(
        (m) => isOpenMarket(m) && marketMatchesTeam(m, stock)
    );
    if (!matches.length) return null;
    matches.sort((a, b) => (b.volumeNum ?? 0) - (a.volumeNum ?? 0));
    return matches[0];
}

function normalizeCollegeConference(name: string): string {
    return name
        .replace(/\bten\b/i, '10')
        .replace(/\btwelve\b/i, '12')
        .trim();
}

function collegeConferenceQueryFragment(conf: string): string {
    const n = normalizeCollegeConference(conf).toLowerCase();
    if (n.includes('big 10') || n.includes('big ten')) return 'big ten';
    if (n.includes('big 12') || n.includes('big twelve')) return 'big 12';
    if (n.includes('sec')) return 'sec';
    if (n.includes('acc')) return 'acc';
    if (n.includes('big east')) return 'big east';
    return n;
}

const NBA_SLOTS: SlotConfig[] = [
    {
        id: 'playoffs',
        label: () => 'Make Playoffs',
        buildQuery: () => 'which teams will make the nba playoffs',
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (rejectPlayoffSeries(t)) return -1;
            if (!t.includes('which teams will make the nba playoffs')) return -1;
            return 100 + futureSeasonBonus(event, ctx);
        },
    },
    {
        id: 'division',
        label: (ctx) => `${ctx.divisionLabel ?? ''} Division Winner`.trim(),
        buildQuery: (ctx) =>
            ctx.divisionLabel
                ? `nba ${ctx.divisionLabel.toLowerCase()} division`
                : null,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            const div = ctx.divisionLabel?.toLowerCase() ?? '';
            if (!motionDivisionScore(t, div)) return -1;
            if (t.includes('all-nba') || t.includes('all-rookie') || t.includes('all-defensive')) {
                return -1;
            }
            return 100 + futureSeasonBonus(event, ctx);
        },
    },
    {
        id: 'conference',
        label: (ctx) => `${ctx.nbaConference ?? ''} Conference Winner`.trim(),
        buildQuery: (ctx) =>
            ctx.nbaConference
                ? `${ctx.seasonYear} nba ${ctx.nbaConference.toLowerCase()} conference champion`
                : null,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            const conf = ctx.nbaConference?.toLowerCase() ?? '';
            if (!conf) return -1;
            if (rejectPlayoffSeries(t) && !t.includes('conference champion')) return -1;
            if (t.includes('finals mvp') || t.includes('conference finals mvp')) return -1;
            if (
                !t.includes(`${conf} conference champion`) &&
                !t.includes(`${conf}ern conference champion`)
            ) {
                return -1;
            }
            if (t.includes('nba champion') && !t.includes('conference champion')) return -1;
            return 90 + futureSeasonBonus(event, ctx);
        },
    },
    {
        id: 'champion',
        label: () => 'Finals Winner',
        buildQuery: (ctx) => `${ctx.seasonYear} nba champion`,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            const s = slugOf(event);
            if (t.includes(String(ctx.seasonYear + 1)) || s.includes(String(ctx.seasonYear + 1))) {
                return -1;
            }
            if (t.includes('conference champion') && !t.includes('nba champion')) return -1;
            if (t.includes('rising stars')) return -1;
            if (t === `${ctx.seasonYear} nba champion` || s === `${ctx.seasonYear}-nba-champion`) {
                return 120 + futureSeasonBonus(event, ctx);
            }
            if (t.includes(`${ctx.seasonYear} nba champion`)) return 100 + futureSeasonBonus(event, ctx);
            return -1;
        },
    },
];

function motionDivisionScore(title: string, division: string): boolean {
    if (!division) return false;
    return (
        title.includes(`${division} division winner`) ||
        title.includes(`nba ${division} division`) ||
        title.includes(`${division} division`)
    );
}

const NFL_SLOTS: SlotConfig[] = [
    {
        id: 'playoffs',
        label: () => 'Make Playoffs',
        buildQuery: () => 'which nfl teams will make the playoffs',
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (rejectPlayoffSeries(t) || t.includes('parlay')) return -1;
            if (!t.includes('which nfl teams will make the playoffs')) return -1;
            return 100 + futureSeasonBonus(event, ctx);
        },
    },
    {
        id: 'division',
        label: (ctx) => ctx.divisionLabel ?? 'Division Winner',
        buildQuery: (ctx) => {
            if (!ctx.nflConference || !ctx.nflDivisionName) return null;
            return `${ctx.nflConference.toLowerCase()} ${ctx.nflDivisionName.toLowerCase()} winner`;
        },
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            const label = ctx.divisionLabel?.toLowerCase() ?? '';
            if (!label) return -1;
            const isDivisionWinner =
                t.includes(`${label} winner`) ||
                (t.includes(label) && t.includes('champion') && !t.includes('super bowl'));
            if (!isDivisionWinner) return -1;
            if (t.includes('super bowl')) return -1;
            return 100 + futureSeasonBonus(event, ctx);
        },
    },
    {
        id: 'conference',
        label: (ctx) => `${ctx.nflConference ?? ''} Champion`.trim(),
        buildQuery: (ctx) =>
            ctx.nflConference
                ? `${ctx.nflConference.toLowerCase()} champion ${ctx.seasonYear}`
                : null,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            const conf = ctx.nflConference?.toLowerCase() ?? '';
            if (!conf) return -1;
            const divisions = ['north', 'south', 'east', 'west'];
            for (const d of divisions) {
                if (t.includes(`${conf} ${d}`)) return -1;
            }
            if (t.includes('super bowl')) return -1;
            const bareConference =
                t === `${conf} champion` ||
                t === `pro football: ${conf} champion` ||
                t === `will the ${conf} win the championship`;
            if (bareConference || (t.includes(`${conf} championship`) && !divisions.some((d) => t.includes(d)))) {
                if (t.includes(String(ctx.seasonYear + 1))) return -1;
                return 90 + futureSeasonBonus(event, ctx);
            }
            return -1;
        },
    },
    {
        id: 'champion',
        label: () => 'Super Bowl Champion',
        buildQuery: (ctx) => `${ctx.seasonYear} super bowl champion`,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (!t.includes('super bowl') || !t.includes('champion')) return -1;
            if (t.includes(String(ctx.seasonYear + 1))) return -1;
            return 100 + futureSeasonBonus(event, ctx);
        },
    },
];

const NCAAF_SLOTS: SlotConfig[] = [
    {
        id: 'conference',
        label: (ctx) => `${ctx.collegeConference ?? ''} Champions`.trim(),
        buildQuery: (ctx) => {
            const frag = ctx.collegeConference
                ? collegeConferenceQueryFragment(ctx.collegeConference)
                : '';
            return frag ? `${frag} championship game winner` : null;
        },
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            const frag = ctx.collegeConference
                ? collegeConferenceQueryFragment(ctx.collegeConference)
                : '';
            if (!frag || !t.includes('championship')) return -1;
            if (!t.includes(frag.replace('big ', 'big'))) return -1;
            return 90 + futureSeasonBonus(event, ctx);
        },
    },
    {
        id: 'playoffs',
        label: () => 'Make Playoffs',
        buildQuery: () => 'college football playoff',
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (t.includes('seed') && t.includes('college football playoff')) {
                return 80 + futureSeasonBonus(event, ctx);
            }
            if (t.includes('make') && t.includes('playoff')) return 70 + futureSeasonBonus(event, ctx);
            return -1;
        },
    },
    {
        id: 'champion',
        label: () => 'Win College Football Championship',
        buildQuery: (ctx) => `college football national champion ${ctx.seasonYear}`,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (
                t.includes('national champion') ||
                t.includes('college football champion') ||
                t.includes('ncaa football champion')
            ) {
                return 90 + futureSeasonBonus(event, ctx);
            }
            return -1;
        },
    },
];

const NCAAB_SLOTS: SlotConfig[] = [
    {
        id: 'conference',
        label: (ctx) => `${ctx.collegeConference ?? ''} Champions`.trim(),
        buildQuery: (ctx) => {
            const frag = ctx.collegeConference
                ? collegeConferenceQueryFragment(ctx.collegeConference)
                : '';
            return frag
                ? `${frag} men's college basketball regular season champion`
                : null;
        },
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            const frag = ctx.collegeConference
                ? collegeConferenceQueryFragment(ctx.collegeConference)
                : '';
            if (!frag) return -1;
            if (t.includes(frag) && (t.includes('regular season') || t.includes('conference'))) {
                return 90 + futureSeasonBonus(event, ctx);
            }
            return -1;
        },
    },
    {
        id: 'champion',
        label: () => 'NCAA Tournament Winner',
        buildQuery: (ctx) => `${ctx.seasonYear} ncaa tournament winner`,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (
                t.includes(`${ctx.seasonYear} ncaa tournament winner`) ||
                t.includes('ncaa tournament winner')
            ) {
                if (t.includes('women')) return -1;
                return 100 + futureSeasonBonus(event, ctx);
            }
            return -1;
        },
    },
];

const MLB_SLOTS: SlotConfig[] = [
    {
        id: 'playoffs',
        label: () => 'Make Playoffs',
        buildQuery: () => 'which mlb teams will make the playoffs',
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (rejectPlayoffSeries(t)) return -1;
            if (t.includes('make the playoffs') || t.includes('make the mlb playoffs')) {
                return 90 + futureSeasonBonus(event, ctx);
            }
            return -1;
        },
    },
    {
        id: 'division',
        label: (ctx) => `${ctx.divisionLabel ?? ''} Division Winner`.trim(),
        buildQuery: (ctx) =>
            ctx.divisionLabel ? `mlb ${ctx.divisionLabel.toLowerCase()} division` : null,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            const div = ctx.divisionLabel?.toLowerCase() ?? '';
            if (div && motionDivisionScore(t, div)) return 90 + futureSeasonBonus(event, ctx);
            return -1;
        },
    },
    {
        id: 'conference',
        label: () => 'League Champion',
        buildQuery: () => 'mlb pennant',
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (t.includes('pennant') || t.includes('league champion')) {
                return 80 + futureSeasonBonus(event, ctx);
            }
            return -1;
        },
    },
    {
        id: 'champion',
        label: () => 'World Series Champion',
        buildQuery: (ctx) => `${ctx.seasonYear} world series champion`,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (t.includes('world series') && t.includes('champion')) {
                return 90 + futureSeasonBonus(event, ctx);
            }
            return -1;
        },
    },
];

const NHL_SLOTS: SlotConfig[] = [
    {
        id: 'playoffs',
        label: () => 'Make Playoffs',
        buildQuery: () => 'which nhl teams will make the playoffs',
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (rejectPlayoffSeries(t)) return -1;
            if (t.includes('make the playoffs')) return 90 + futureSeasonBonus(event, ctx);
            return -1;
        },
    },
    {
        id: 'division',
        label: (ctx) => `${ctx.divisionLabel ?? ''} Division Winner`.trim(),
        buildQuery: (ctx) =>
            ctx.divisionLabel ? `nhl ${ctx.divisionLabel.toLowerCase()} division` : null,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            const div = ctx.divisionLabel?.toLowerCase() ?? '';
            if (motionDivisionScore(t, div)) return 90 + futureSeasonBonus(event, ctx);
            return -1;
        },
    },
    {
        id: 'conference',
        label: (ctx) => `${ctx.nbaConference ?? 'Conference'} Winner`.trim(),
        buildQuery: (ctx) => {
            const side =
                ctx.divisionLabel &&
                ['Atlantic', 'Metropolitan'].includes(ctx.divisionLabel)
                    ? 'eastern'
                    : 'western';
            return `${ctx.seasonYear} nhl ${side} conference champion`;
        },
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (t.includes('conference champion')) return 85 + futureSeasonBonus(event, ctx);
            return -1;
        },
    },
    {
        id: 'champion',
        label: () => 'Stanley Cup Champion',
        buildQuery: (ctx) => `${ctx.seasonYear} stanley cup champion`,
        scoreEvent: (event, ctx) => {
            const t = titleOf(event);
            if (t.includes('stanley cup')) return 90 + futureSeasonBonus(event, ctx);
            return -1;
        },
    },
];

function slotsForSport(sportKey: string): SlotConfig[] {
    switch (sportKey) {
        case 'basketball_nba':
            return NBA_SLOTS;
        case 'americanfootball_nfl':
            return NFL_SLOTS;
        case 'americanfootball_ncaaf':
            return NCAAF_SLOTS;
        case 'basketball_ncaab':
            return NCAAB_SLOTS;
        case 'baseball_mlb':
            return MLB_SLOTS;
        case 'icehockey_nhl':
            return NHL_SLOTS;
        default:
            return [];
    }
}

async function resolveSlot(
    slot: SlotConfig,
    ctx: TeamContext,
    stock: Stock
): Promise<SeasonPrediction | null> {
    const query = slot.buildQuery(ctx);
    if (!query) return null;

    const events = await getPolymarketSeasonSearch(query);
    let best: { event: PolymarketEvent; score: number; market: PolymarketMarket } | null = null;

    for (const event of events) {
        const score = slot.scoreEvent(event, ctx);
        if (score < 0) continue;
        const market = pickOpenTeamMarket(event, stock);
        if (!market) continue;
        if (!best || score > best.score) {
            best = { event, score, market };
        }
    }

    if (!best) return null;

    const yesProb = yesProbability(best.market);
    if (yesProb === null) return null;

    const label = slot.label(ctx);
    if (!label) return null;

    return {
        slotId: slot.id,
        label,
        yesPercent: Math.round(yesProb * 100),
        eventSlug: best.event.slug,
        marketSlug: best.market.slug,
        url: polymarketEventUrl(best.event.slug),
    };
}

export async function resolveSeasonPredictions(
    stock: Stock,
    sportKey: string | null
): Promise<SeasonPrediction[]> {
    if (!sportKey || !stock?.id) return [];

    const slots = slotsForSport(sportKey);
    if (!slots.length) return [];

    const ctx = buildTeamContext(stock, sportKey);
    const results: SeasonPrediction[] = [];

    for (const slot of slots) {
        const resolved = await resolveSlot(slot, ctx, stock);
        if (resolved) results.push(resolved);
    }

    return results;
}

export function useSeasonPredictions(stock: Stock | null, sportKey: string | null) {
    return useQuery({
        queryKey: ['seasonPredictions', stock?.id, sportKey],
        queryFn: () => resolveSeasonPredictions(stock!, sportKey),
        enabled: !!stock?.id && !!sportKey,
        staleTime: 5 * 60 * 1000,
    });
}
