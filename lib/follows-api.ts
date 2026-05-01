import { API_ENDPOINTS } from '@/constants/api-config';
import type { Stock } from '@/types';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import { normalizeStock } from '@/lib/api-normalizers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const followsKeys = {
    all: ['followedStocks'] as const,
    notOwned: () => [...followsKeys.all, 'notOwned'] as const,
};

export async function followStock(stockId: number | string): Promise<void> {
    await apiPost<unknown>(API_ENDPOINTS.FOLLOWS, { stockID: stockId });
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

export function useFollowedStocksNotOwned(enabled = true) {
    return useQuery({
        queryKey: followsKeys.notOwned(),
        queryFn: fetchFollowedStocksNotOwned,
        enabled,
    });
}

export function useFollowStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: followStock,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: followsKeys.all });
        },
    });
}

export function useUnfollowStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: unfollowStock,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: followsKeys.all });
        },
    });
}

