import { API_ENDPOINTS } from '@/constants/api-config';
import type { League } from '@/types';
import { apiGet } from '@/lib/api';
import { normalizeLeague } from '@/lib/api-normalizers';
import { useQuery } from '@tanstack/react-query';

export const leaguesKeys = {
    all: ['leagues'] as const,
    lists: () => [...leaguesKeys.all, 'list'] as const,
    list: () => [...leaguesKeys.lists()] as const,
    details: () => [...leaguesKeys.all, 'detail'] as const,
    detail: (id: string | number, includeStocks?: boolean) =>
        [...leaguesKeys.details(), id, includeStocks] as const,
};

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

export function useLeagues() {
    return useQuery({
        queryKey: leaguesKeys.list(),
        queryFn: fetchLeagues,
    });
}

export function useLeague(leagueId: string | number | null, includeStocks = false) {
    return useQuery({
        queryKey: leagueId != null ? leaguesKeys.detail(leagueId, includeStocks) : ['leagues', 'detail', 'disabled'],
        queryFn: () => fetchLeague(leagueId!, includeStocks),
        enabled: leagueId != null,
    });
}
