import { API_ENDPOINTS } from '@/constants/api-config';
import type { Stock } from '@/types';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import { normalizeStock } from '@/lib/api-normalizers';

export async function followStock(stockId: number | string): Promise<void> {
    await apiPost<unknown>(API_ENDPOINTS.FOLLOWS, { stockId });
}

export async function unfollowStock(stockId: number | string): Promise<void> {
    await apiDelete<{ success: boolean }>(API_ENDPOINTS.FOLLOW(String(stockId)));
}

export async function fetchFollowedStocksNotOwned(): Promise<Stock[]> {
    const data = await apiGet<{ stocks?: unknown[] }>(
        API_ENDPOINTS.FOLLOWS_NOT_OWNED,
        undefined,
        // Auth required for follows endpoints
        { auth: true }
    );
    const list = Array.isArray(data?.stocks) ? data.stocks : [];
    return list.map((s: unknown) => normalizeStock(s));
}

