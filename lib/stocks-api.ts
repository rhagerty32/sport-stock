import { API_ENDPOINTS } from '@/constants/api-config';
import { apiGet } from '@/lib/api';
import { normalizePriceHistoryPoint, normalizeStock } from '@/lib/api-normalizers';
import type { PriceHistory, Stock } from '@/types';
import type { QueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export type MoverItem = { stock: Stock; change: number; changePercentage: number };

export const stocksKeys = {
    all: ['stocks'] as const,
    lists: () => [...stocksKeys.all, 'list'] as const,
    list: (params: Record<string, unknown> | undefined) => [...stocksKeys.lists(), params] as const,
    details: () => [...stocksKeys.all, 'detail'] as const,
    detail: (id: string | number) => [...stocksKeys.details(), id] as const,
    topMovers: (limit?: number) => [...stocksKeys.all, 'topMovers', limit] as const,
    highestVolume: (limit?: number) => [...stocksKeys.all, 'highestVolume', limit] as const,
    onTheRise: (limit?: number) => [...stocksKeys.all, 'onTheRise', limit] as const,
    upsetAlert: (limit?: number) => [...stocksKeys.all, 'upsetAlert', limit] as const,
    priceHistory: (stockId: string | number, period?: string, limit?: number) =>
        [...stocksKeys.detail(stockId), 'priceHistory', period, limit] as const,
};

export async function fetchStocks(params?: {
    leagueID?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ stocks: Stock[]; total: number; limit: number; offset: number; hasMore: boolean }> {
    const search: Record<string, string | number | undefined> = {};
    if (params?.leagueID != null) search.leagueID = params.leagueID;
    if (params?.search != null) search.search = params.search;
    if (params?.limit != null) search.limit = params.limit;
    if (params?.offset != null) search.offset = params.offset;
    const data = await apiGet<{ stocks?: unknown[]; total?: number; limit?: number; offset?: number; hasMore?: boolean }>(
        API_ENDPOINTS.STOCKS,
        search,
        { auth: false }
    );
    const list = Array.isArray(data?.stocks) ? data.stocks : [];
    return {
        stocks: list.map((s: unknown) => normalizeStock(s)),
        total: data?.total ?? 0,
        limit: data?.limit ?? 20,
        offset: data?.offset ?? 0,
        hasMore: data?.hasMore ?? false,
    };
}

export async function fetchStock(stockId: string | number): Promise<Stock | null> {
    try {
        const data = await apiGet<unknown>(API_ENDPOINTS.STOCK(String(stockId)), undefined, { auth: false });
        return normalizeStock(data);
    } catch {
        return null;
    }
}

export async function fetchTopMovers(limit = 5): Promise<{ gainers: MoverItem[]; losers: MoverItem[] }> {
    const data = await apiGet<{ gainers?: unknown[]; losers?: unknown[] }>(
        API_ENDPOINTS.STOCKS_TOP_MOVERS,
        { limit },
        { auth: false }
    );
    const mapItem = (item: any): MoverItem => ({
        stock: normalizeStock(item?.stock ?? {}),
        change: typeof item?.change === 'number' ? item.change : 0,
        changePercentage: typeof item?.changePercentage === 'number' ? item.changePercentage : 0,
    });
    return {
        gainers: (Array.isArray(data?.gainers) ? data.gainers : []).map(mapItem),
        losers: (Array.isArray(data?.losers) ? data.losers : []).map(mapItem),
    };
}

export async function fetchHighestVolume(limit = 9): Promise<Stock[]> {
    const data = await apiGet<{ stocks?: unknown[] }>(API_ENDPOINTS.STOCKS_HIGHEST_VOLUME, { limit }, { auth: false });
    const list = Array.isArray(data?.stocks) ? data.stocks : [];
    return list.map((s: unknown) => normalizeStock(s));
}

export async function fetchOnTheRise(limit = 9): Promise<MoverItem[]> {
    const data = await apiGet<{ stocks?: unknown[] }>(API_ENDPOINTS.STOCKS_ON_THE_RISE, { limit }, { auth: false });
    const list = Array.isArray(data?.stocks) ? data.stocks : [];
    return list.map((item: any) => ({
        stock: normalizeStock(item?.stock ?? {}),
        change: typeof item?.change === 'number' ? item.change : 0,
        changePercentage: typeof item?.changePercentage === 'number' ? item.changePercentage : 0,
    }));
}

export async function fetchUpsetAlert(limit = 9): Promise<MoverItem[]> {
    const data = await apiGet<{ stocks?: unknown[] }>(API_ENDPOINTS.STOCKS_UPSET_ALERT, { limit }, { auth: false });
    const list = Array.isArray(data?.stocks) ? data.stocks : [];
    return list.map((item: any) => ({
        stock: normalizeStock(item?.stock ?? {}),
        change: typeof item?.change === 'number' ? item.change : 0,
        changePercentage: typeof item?.changePercentage === 'number' ? item.changePercentage : 0,
    }));
}

type PriceHistoryApiResponse = {
    history?: unknown[];
    stockId?: string;
};

function historyPointsFromResponse(data: unknown): unknown[] {
    if (data == null) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') {
        const o = data as Record<string, unknown>;
        const h = o.history;
        if (Array.isArray(h)) return h;
    }
    return [];
}

export async function fetchPriceHistory(
    stockId: string | number,
    period?: string,
    limit?: number
): Promise<PriceHistory[]> {
    const params: Record<string, string | number | undefined> = {};
    if (period != null && period !== '') params.period = period;
    if (limit != null) params.limit = limit;
    const data = await apiGet<PriceHistoryApiResponse>(
        API_ENDPOINTS.STOCK_PRICE_HISTORY(String(stockId)),
        params,
        { auth: false }
    );
    const list = historyPointsFromResponse(data);
    // Map API → app PriceHistory: ISO strings → Date, stockId → stockID, numeric guards (API is already camelCase).
    const normalized = list.map((p: unknown) => normalizePriceHistoryPoint(p));
    normalized.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    if (__DEV__) {
        console.log('[price-history]', String(stockId), period ?? null, limit ?? null, 'points:', normalized.length);
    }
    return normalized;
}

export function useStock(stockId: string | number | null) {
    return useQuery({
        queryKey: stockId != null ? stocksKeys.detail(stockId) : ['stocks', 'detail', 'disabled'],
        queryFn: () => fetchStock(stockId!),
        enabled: stockId != null,
    });
}

export function useStocks(params?: {
    leagueID?: string;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    return useQuery({
        queryKey: stocksKeys.list(params ?? {}),
        queryFn: () => fetchStocks(params),
    });
}

export function useTopMovers(limit = 5) {
    return useQuery({
        queryKey: stocksKeys.topMovers(limit),
        queryFn: () => fetchTopMovers(limit),
    });
}

export function useHighestVolume(limit = 9) {
    return useQuery({
        queryKey: stocksKeys.highestVolume(limit),
        queryFn: () => fetchHighestVolume(limit),
    });
}

export function useOnTheRise(limit = 9) {
    return useQuery({
        queryKey: stocksKeys.onTheRise(limit),
        queryFn: () => fetchOnTheRise(limit),
    });
}

export function useUpsetAlert(limit = 9) {
    return useQuery({
        queryKey: stocksKeys.upsetAlert(limit),
        queryFn: () => fetchUpsetAlert(limit),
    });
}

/** Keep history in cache after the sheet closes so reopen is instant; avoid refetching every open. */
const PRICE_HISTORY_STALE_MS = 5 * 60 * 1000;
const PRICE_HISTORY_GC_MS = 60 * 60 * 1000;

/** Same params as StockBottomSheet chart — keep in sync with `usePriceHistory` there. */
export const STOCK_SHEET_PRICE_HISTORY = { period: 'ALL' as const, limit: 500 };

/** Warm cache as soon as a stock is selected (before the sheet finishes opening). */
export function prefetchStockSheetPriceHistory(queryClient: QueryClient, stockId: string | number) {
    const { period, limit } = STOCK_SHEET_PRICE_HISTORY;
    return queryClient.prefetchQuery({
        queryKey: stocksKeys.priceHistory(stockId, period, limit),
        queryFn: () => fetchPriceHistory(stockId, period, limit),
        staleTime: PRICE_HISTORY_STALE_MS,
        gcTime: PRICE_HISTORY_GC_MS,
    });
}

export function usePriceHistory(
    stockId: string | number | null,
    period?: string,
    limit?: number
) {
    return useQuery({
        queryKey: stockId != null ? stocksKeys.priceHistory(stockId, period, limit) : ['stocks', 'priceHistory', 'disabled'],
        queryFn: () => fetchPriceHistory(stockId!, period, limit),
        enabled: stockId != null,
        staleTime: PRICE_HISTORY_STALE_MS,
        gcTime: PRICE_HISTORY_GC_MS,
    });
}
