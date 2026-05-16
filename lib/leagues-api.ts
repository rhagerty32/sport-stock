import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import { LEAGUES } from '@/constants/leagues';
import type { League, Stock } from '@/types';
import { apiGet } from '@/lib/api';
import { normalizeLeague } from '@/lib/api-normalizers';
import { search } from '@/lib/search-api';
import { fetchAllStocksForLeague } from '@/lib/stocks-api';
import { useQuery } from '@tanstack/react-query';

/** When true, `fetchLeagues` uses bundled `LEAGUES` if the API fails (5xx, network, etc.). */
function shouldUseLeaguesFallbackOnError(): boolean {
    const raw = process.env.EXPO_PUBLIC_LEAGUES_FALLBACK;
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;
    return __DEV__;
}

function inferSportFromLeagueName(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('basketball')) return 'Basketball';
    if (n.includes('football')) return 'Football';
    return 'Basketball';
}

function leagueEntryToApiPayload(entry: (typeof LEAGUES)[number]): unknown {
    return {
        id: entry.id,
        name: entry.name,
        photoUrl: entry.photoURL,
        sport: inferSportFromLeagueName(entry.name),
        marketCap: 0,
        volume: 0,
        playoffQuery: '',
        championQuery: '',
    };
}

function staticFallbackLeaguesPayload(): unknown[] {
    return LEAGUES.map(leagueEntryToApiPayload);
}

function staticFallbackLeaguePayloadById(leagueId: string | number): unknown | null {
    const idStr = String(leagueId);
    const entry = LEAGUES.find((l) => String(l.id) === idStr);
    return entry ? leagueEntryToApiPayload(entry) : null;
}

/** List stocks for a league id; if none (e.g. static placeholder id), resolve real market id via GET /api/search per OpenAPI. */
async function resolveStocksForLeague(leagueIdStr: string, leagueName: string): Promise<Stock[]> {
    let stocks: Stock[] = [];
    try {
        stocks = await fetchAllStocksForLeague(leagueIdStr);
    } catch {
        stocks = [];
    }
    if (stocks.length > 0) {
        return stocks;
    }
    try {
        const { leagues } = await search(leagueName, 'league');
        const nameLower = leagueName.trim().toLowerCase();
        const exact = leagues.find((l) => l.name.trim().toLowerCase() === nameLower);
        const hit = exact ?? leagues[0];
        if (hit != null && String(hit.id) !== leagueIdStr) {
            stocks = await fetchAllStocksForLeague(String(hit.id));
        }
    } catch {
        /* ignore */
    }
    return stocks;
}

export const leaguesKeys = {
    all: ['leagues'] as const,
    lists: () => [...leaguesKeys.all, 'list'] as const,
    list: () => [...leaguesKeys.lists()] as const,
    details: () => [...leaguesKeys.all, 'detail'] as const,
    detail: (id: string | number, includeStocks?: boolean) =>
        [...leaguesKeys.details(), id, includeStocks] as const,
};

export async function fetchLeagues(): Promise<League[]> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.LEAGUES}`;
    try {
        const data = await apiGet<unknown[]>(API_ENDPOINTS.LEAGUES, undefined, { auth: false });
        const list = Array.isArray(data) ? data : [];
        return list.map((l: unknown) => normalizeLeague(l));
    } catch (e) {
        if (!shouldUseLeaguesFallbackOnError()) {
            throw e;
        }
        // eslint-disable-next-line no-console
        console.warn(
            `[fetchLeagues] ${url} failed; using static LEAGUES fallback. Fix the API or set EXPO_PUBLIC_LEAGUES_FALLBACK=0 to surface this error.`,
            e
        );
        return staticFallbackLeaguesPayload().map((l) => normalizeLeague(l));
    }
}

export async function fetchLeague(leagueId: string | number, includeStocks = false): Promise<League | null> {
    const detailUrl = `${API_BASE_URL}${API_ENDPOINTS.LEAGUE(String(leagueId))}`;
    try {
        const data = await apiGet<unknown>(API_ENDPOINTS.LEAGUE(String(leagueId)), {
            includeStocks: includeStocks ? true : undefined,
        }, { auth: false });
        let league = normalizeLeague(data);
        if (includeStocks) {
            const embedded = league.stocks;
            const missing = embedded == null || embedded.length === 0;
            if (missing) {
                try {
                    const stocks = await resolveStocksForLeague(String(league.id), league.name);
                    league = { ...league, stocks };
                } catch {
                    league = { ...league, stocks: embedded ?? [] };
                }
            }
        }
        return league;
    } catch (e) {
        if (!shouldUseLeaguesFallbackOnError()) {
            return null;
        }
        const payload = staticFallbackLeaguePayloadById(leagueId);
        if (payload == null) {
            return null;
        }
        let league = normalizeLeague(payload);
        if (includeStocks) {
            try {
                const stocks = await resolveStocksForLeague(String(leagueId), league.name);
                league = { ...league, stocks };
            } catch {
                league = { ...league, stocks: [] };
            }
        }
        // eslint-disable-next-line no-console
        console.warn(`[fetchLeague] ${detailUrl} failed; using static fallback for id=${String(leagueId)}`, e);
        return league;
    }
}

export function useLeagues(enabled = true) {
    return useQuery({
        queryKey: leaguesKeys.list(),
        queryFn: fetchLeagues,
        enabled,
    });
}

function isUsableLeagueId(leagueId: string | number | null | undefined): leagueId is string | number {
    if (leagueId == null) return false;
    if (leagueId === '') return false;
    if (typeof leagueId === 'number' && leagueId === 0) return false;
    if (typeof leagueId === 'string' && leagueId.trim() === '0') return false;
    return true;
}

export function useLeague(leagueId: string | number | null, includeStocks = false) {
    const enabled = isUsableLeagueId(leagueId);
    return useQuery({
        queryKey: enabled ? leaguesKeys.detail(leagueId, includeStocks) : ['leagues', 'detail', 'disabled'],
        queryFn: () => fetchLeague(leagueId!, includeStocks),
        enabled,
    });
}
