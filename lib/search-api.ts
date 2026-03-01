import { API_ENDPOINTS } from '@/constants/api-config';
import type { League, Stock } from '@/types';
import { apiGet } from '@/lib/api';
import { normalizeLeague, normalizeStock } from '@/lib/api-normalizers';

export type SearchResult = { stocks: Stock[]; leagues: League[]; total: number };

export async function search(
    q: string,
    type: 'stock' | 'league' | 'all' = 'all',
    leagueID?: string | null
): Promise<SearchResult> {
    const params: Record<string, string | undefined> = { q, type };
    if (leagueID != null && leagueID !== '') params.leagueID = leagueID;
    const data = await apiGet<{ stocks?: unknown[]; leagues?: unknown[]; total?: number }>(
        API_ENDPOINTS.SEARCH,
        params,
        { auth: false }
    );
    return {
        stocks: (Array.isArray(data?.stocks) ? data.stocks : []).map((s: unknown) => normalizeStock(s)),
        leagues: (Array.isArray(data?.leagues) ? data.leagues : []).map((l: unknown) => normalizeLeague(l)),
        total: data?.total ?? 0,
    };
}
