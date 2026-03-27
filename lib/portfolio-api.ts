import { API_ENDPOINTS } from '@/constants/api-config';
import { apiGet } from '@/lib/api';
import { normalizePortfolio, normalizePortfolioHistoryPoint, normalizePosition } from '@/lib/api-normalizers';
import { useAuthStore } from '@/stores/authStore';
import type { Portfolio, Position, PriceHistory } from '@/types';
import { useQuery } from '@tanstack/react-query';

export const portfolioKeys = {
    /** Per-user cache — avoids showing the previous account's portfolio after sign-in. */
    root: (userId: string | undefined) => ['portfolio', userId ?? ''] as const,
    positions: (userId: string | undefined, params?: Record<string, unknown>) =>
        [...portfolioKeys.root(userId), 'positions', params] as const,
    position: (userId: string | undefined, stockId: string | number) =>
        [...portfolioKeys.root(userId), 'position', stockId] as const,
    history: (userId: string | undefined, period?: string, limit?: number) =>
        [...portfolioKeys.root(userId), 'history', period, limit] as const,
};

export async function fetchPortfolio(): Promise<Portfolio> {
    const data = await apiGet<unknown>(API_ENDPOINTS.PORTFOLIO);
    console.log('fetchPortfolio', JSON.stringify(data, null, 2));
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

/** Same query shape as stock `price-history` — full series for client-side period tabs on the home chart. */
export const PORTFOLIO_CHART_HISTORY_PARAMS = { period: 'ALL' as const, limit: 500 };

const PORTFOLIO_HISTORY_STALE_MS = 5 * 60 * 1000;
const PORTFOLIO_HISTORY_GC_MS = 60 * 60 * 1000;

export async function fetchPortfolioHistory(period?: string, limit?: number): Promise<PriceHistory[]> {
    const params: Record<string, string | number | undefined> = {};
    if (period != null && period !== '') params.period = period;
    if (limit != null) params.limit = limit;
    const data = await apiGet<{ history?: unknown[] }>(API_ENDPOINTS.PORTFOLIO_HISTORY, params);
    const list = Array.isArray(data?.history) ? data.history : [];
    const normalized = list.map((p: unknown) => normalizePortfolioHistoryPoint(p));
    normalized.sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    return normalized;
}

/** Shared with prefetch in root layout so cache behavior matches `usePortfolio`. */
export const PORTFOLIO_STALE_MS = 45_000;

export function usePortfolio() {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
        queryKey: portfolioKeys.root(userId),
        queryFn: fetchPortfolio,
        enabled: !!userId,
        staleTime: PORTFOLIO_STALE_MS,
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

export function usePortfolioHistory(
    enabled: boolean,
    options?: { period?: string; limit?: number }
) {
    const userId = useAuthStore((s) => s.user?.id);
    const period = options?.period ?? PORTFOLIO_CHART_HISTORY_PARAMS.period;
    const limit = options?.limit ?? PORTFOLIO_CHART_HISTORY_PARAMS.limit;
    return useQuery({
        queryKey: portfolioKeys.history(userId, period, limit),
        queryFn: () => fetchPortfolioHistory(period, limit),
        enabled: !!userId && enabled,
        staleTime: PORTFOLIO_HISTORY_STALE_MS,
        gcTime: PORTFOLIO_HISTORY_GC_MS,
    });
}
