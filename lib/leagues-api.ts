import { API_ENDPOINTS } from '@/constants/api-config';
import type { League } from '@/types';
import { apiGet } from '@/lib/api';
import { normalizeLeague } from '@/lib/api-normalizers';

export async function fetchLeagues(): Promise<League[]> {
    const data = await apiGet<unknown[]>(API_ENDPOINTS.LEAGUES, undefined, { auth: false });
    const list = Array.isArray(data) ? data : [];
    return list.map((l: unknown) => normalizeLeague(l));
}

export async function fetchLeague(leagueId: string | number, includeStocks = false): Promise<League | null> {
    try {
        const data = await apiGet<unknown>(API_ENDPOINTS.LEAGUE(String(leagueId)), {
            includeStocks: includeStocks ? true : undefined,
        }, { auth: false });
        return normalizeLeague(data);
    } catch {
        return null;
    }
}
