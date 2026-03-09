import { API_ENDPOINTS } from '@/constants/api-config';
import type { PriceHistory, Stock } from '@/types';
import { apiGet } from '@/lib/api';
import { normalizePriceHistoryPoint, normalizeStock } from '@/lib/api-normalizers';
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

export async function fetchPriceHistory(
    stockId: string | number,
    period?: string,
    limit = 100
): Promise<PriceHistory[]> {
    const params: Record<string, string | number | undefined> = { limit };
    if (period != null) params.period = period;
    try {
        const data = await apiGet<{ history?: unknown[] }>(
            API_ENDPOINTS.STOCK_PRICE_HISTORY(String(stockId)),
            params,
            { auth: false }
        );
        const list = Array.isArray(data?.history) ? data.history : [];
        return list.map((p: unknown) => normalizePriceHistoryPoint(p));
    } catch {
        return [];
    }
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

export function usePriceHistory(
    stockId: string | number | null,
    period?: string,
    limit = 100
) {
    return useQuery({
        queryKey: stockId != null ? stocksKeys.priceHistory(stockId, period, limit) : ['stocks', 'priceHistory', 'disabled'],
        queryFn: () => fetchPriceHistory(stockId!, period, limit),
        enabled: stockId != null,
    });
}
