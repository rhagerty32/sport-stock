import { API_ENDPOINTS } from '@/constants/api-config';
import type { Portfolio, Position } from '@/types';
import { apiGet } from '@/lib/api';
import { normalizePortfolio, normalizePosition } from '@/lib/api-normalizers';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

export const portfolioKeys = {
    /** Per-user cache — avoids showing the previous account's portfolio after sign-in. */
    root: (userId: string | undefined) => ['portfolio', userId ?? ''] as const,
    positions: (userId: string | undefined, params?: Record<string, unknown>) =>
        [...portfolioKeys.root(userId), 'positions', params] as const,
    position: (userId: string | undefined, stockId: string | number) =>
        [...portfolioKeys.root(userId), 'position', stockId] as const,
};

export async function fetchPortfolio(): Promise<Portfolio> {
    const data = await apiGet<unknown>(API_ENDPOINTS.PORTFOLIO);
    return normalizePortfolio(data);
}

export async function fetchPositions(params?: { sortBy?: string; limit?: number; offset?: number }): Promise<Position[]> {
    const search: Record<string, string | number | undefined> = {};
    if (params?.sortBy != null) search.sortBy = params.sortBy;
    if (params?.limit != null) search.limit = params.limit;
    if (params?.offset != null) search.offset = params.offset;
    const data = await apiGet<{ positions?: unknown[] }>(API_ENDPOINTS.PORTFOLIO_POSITIONS, search);
    const list = Array.isArray(data?.positions) ? data.positions : [];
    return list.map((p: unknown) => normalizePosition(p));
}

export async function fetchPositionByStockId(stockId: string | number): Promise<Position | null> {
    try {
        const data = await apiGet<unknown>(API_ENDPOINTS.PORTFOLIO_POSITION(String(stockId)));
        return normalizePosition(data);
    } catch {
        return null;
    }
}

export function usePortfolio() {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
        queryKey: portfolioKeys.root(userId),
        queryFn: fetchPortfolio,
        enabled: !!userId,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });
}

export function usePositions(params?: { sortBy?: string; limit?: number; offset?: number }) {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
        queryKey: portfolioKeys.positions(userId, params),
        queryFn: () => fetchPositions(params),
        enabled: !!userId,
    });
}

export function usePositionByStockId(stockId: string | number | null) {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
        queryKey:
            stockId != null ? portfolioKeys.position(userId, stockId) : ['portfolio', 'position', 'disabled'],
        queryFn: () => fetchPositionByStockId(stockId!),
        enabled: !!userId && stockId != null,
    });
}
