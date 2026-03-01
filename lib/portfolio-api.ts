import { API_ENDPOINTS } from '@/constants/api-config';
import type { Portfolio, Position } from '@/types';
import { apiGet } from '@/lib/api';
import { normalizePortfolio, normalizePosition } from '@/lib/api-normalizers';

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
