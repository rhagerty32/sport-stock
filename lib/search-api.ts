import { API_ENDPOINTS } from '@/constants/api-config';
import type { League, Stock } from '@/types';
import { apiGet } from '@/lib/api';
import { normalizeLeague, normalizeStock } from '@/lib/api-normalizers';
import { useQuery } from '@tanstack/react-query';
import { fetchStocks } from '@/lib/stocks-api';

export type SearchResult = { stocks: Stock[]; leagues: League[]; total: number };

const EMPTY_SEARCH: SearchResult = { stocks: [], leagues: [], total: 0 };

export const searchKeys = {
    all: ['search'] as const,
    results: (q: string, leagueID?: string | null) => [...searchKeys.all, q, leagueID ?? ''] as const,
};

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

export function useSearch(q: string, type: 'stock' | 'league' | 'all' = 'all', leagueID?: string | null) {
    return useQuery({
        queryKey: searchKeys.results(q, leagueID),
        queryFn: () => search(q, type, leagueID),
        enabled: q.trim().length > 0,
    });
}

/** Browse (empty q) uses fetchStocks; with query uses search API. */
export function useSearchResults(
    q: string,
    leagueID?: string | null,
    limit = 60
) {
    return useQuery({
        queryKey: [...searchKeys.all, 'results', q.trim(), leagueID ?? '', limit] as const,
        queryFn: async (): Promise<SearchResult> => {
            const trimmed = q.trim();
            if (trimmed) {
                return search(trimmed, 'all', leagueID ?? undefined);
            }
            const result = await fetchStocks({
                leagueID: leagueID ?? undefined,
                limit,
                offset: 0,
            });
            return {
                stocks: result.stocks,
                leagues: [],
                total: result.total,
            };
        },
        placeholderData: (previousData) => previousData ?? EMPTY_SEARCH,
    });
}
