import { API_ENDPOINTS } from '@/constants/api-config';
import type { Transaction } from '@/types';
import { apiGet, apiPost } from '@/lib/api';
import { normalizeTransaction } from '@/lib/api-normalizers';
import { listMarketAssets, listMarketPositions, listMarkets, submitMarketOrders } from '@/lib/markets-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useAuthStore } from '@/stores/authStore';

const IDEMPOTENCY_KEY_MIN_LEN = 8;
const IDEMPOTENCY_KEY_MAX_LEN = 128;

/** New UUIDv4 (36 chars), valid for `TransactionCreate.idempotencyKey`. */
export function newTransactionIdempotencyKey(): string {
    return Crypto.randomUUID();
}

function assertValidTransactionIdempotencyKey(key: string): void {
    const len = key.length;
    if (len < IDEMPOTENCY_KEY_MIN_LEN || len > IDEMPOTENCY_KEY_MAX_LEN) {
        throw new Error(
            `idempotencyKey must be ${IDEMPOTENCY_KEY_MIN_LEN}–${IDEMPOTENCY_KEY_MAX_LEN} characters (got ${len})`
        );
    }
}

export const transactionsKeys = {
    all: ['transactions'] as const,
    lists: () => [...transactionsKeys.all, 'list'] as const,
    list: (params: Record<string, unknown> | undefined) => [...transactionsKeys.lists(), params] as const,
    details: () => [...transactionsKeys.all, 'detail'] as const,
    detail: (id: number) => [...transactionsKeys.details(), id] as const,
};

export type TransactionCreate = {
    action: 'buy' | 'sell';
    stockId: number;
    quantity: number;
    price?: number | null;
    /** 8–128 chars when set; duplicate POSTs with the same key return the original queued order. */
    idempotencyKey?: string;
};

/** Stock context for markets API fallback when transaction API returns "No position". */
export type TransactionStockContext = {
    leagueID: number;
    ticker?: string;
};

/**
 * Create a buy/sell transaction. If the API returns "No position for this stock; open a position
 * via the markets API first", falls back to markets API: resolve market_id, then either use
 * existing position or open a new position via POST /api/markets/{market_id}/orders.
 * API_DOCS: Create Transaction and Submit Orders.
 */
export async function createTransaction(
    body: TransactionCreate,
    stockContext?: TransactionStockContext
): Promise<Transaction> {
    try {
        if (body.idempotencyKey != null) {
            assertValidTransactionIdempotencyKey(body.idempotencyKey);
        }

        if (body.action === 'buy') {
            // Debug logging for buy requests
            console.log('[createTransaction][BUY] request body', {
                action: body.action,
                stockId: body.stockId,
                quantity: body.quantity,
                price: body.price,
                hasIdempotencyKey: body.idempotencyKey != null,
                stockContext,
            });
        }

        const data = await apiPost<unknown>(API_ENDPOINTS.TRANSACTIONS, {
            action: body.action,
            stockId: body.stockId,
            quantity: body.quantity,
            ...(body.price != null && { price: body.price }),
            ...(body.idempotencyKey != null && { idempotencyKey: body.idempotencyKey }),
        });
        return normalizeTransaction(data);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const useMarkets =
            stockContext &&
            body.action === 'buy' &&
            (message.includes('No position') || message.includes('open a position'));
        if (!useMarkets) throw err;

        const assetIdStr = String(body.stockId);

        // Build candidate market_ids: ticker prefix (e.g. "ncaab"), numeric league id, then all markets
        const marketIdCandidates: string[] = [];
        if (stockContext.ticker && stockContext.ticker.includes('_')) {
            marketIdCandidates.push(stockContext.ticker.split('_')[0]);
        }
        marketIdCandidates.push(String(stockContext.leagueID));

        let positions: Awaited<ReturnType<typeof listMarketPositions>> = [];
        let usedMarketId: string | null = null;
        for (const marketId of marketIdCandidates) {
            try {
                positions = await listMarketPositions(marketId);
                usedMarketId = marketId;
                break;
            } catch {
                continue;
            }
        }

        // If no market found by league/ticker, find market that contains this asset (stock id = asset_id)
        if (!usedMarketId) {
            const markets = await listMarkets();
            for (const m of markets) {
                try {
                    const assets = await listMarketAssets(m.market_id);
                    const hasAsset = assets.some((a) => a.asset_id === assetIdStr);
                    if (hasAsset) {
                        usedMarketId = m.market_id;
                        positions = await listMarketPositions(m.market_id);
                        break;
                    }
                } catch {
                    continue;
                }
            }
        }

        if (!usedMarketId) {
            throw new Error('Market not found. Unable to place order for this stock.');
        }

        const position = positions.find(
            (p) => p.asset_id === assetIdStr || p.asset_id === stockContext!.ticker
        );

        if (position) {
            await submitMarketOrders(usedMarketId, [
                { position_id: position.position_id, delta_quantity: body.quantity },
            ]);
        } else {
            // Backend requires position_id from GET .../positions; it does not accept asset_id to open a new position (422 Field required).
            throw new Error(
                "You don't have a position in this stock yet. The server only allows adding to existing positions—first-time buys for new stocks aren't supported from the app. Contact support or try a stock you've bought before."
            );
        }

        return normalizeTransaction({
            id: 0,
            action: body.action,
            stockId: body.stockId,
            quantity: body.quantity,
            price: body.price ?? 0,
            totalPrice: (body.price ?? 0) * body.quantity,
            userId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }
}

export async function fetchTransactions(params?: {
    stockID?: number;
    action?: string;
    limit?: number;
    offset?: number;
}): Promise<{ transactions: Transaction[]; total: number; hasMore: boolean }> {
    const search: Record<string, string | number | undefined> = {};
    if (params?.stockID != null) search.stockID = params.stockID;
    if (params?.action != null) search.action = params.action;
    if (params?.limit != null) search.limit = params.limit;
    if (params?.offset != null) search.offset = params.offset;
    const data = await apiGet<{
        transactions?: unknown[];
        total?: number;
        hasMore?: boolean;
    }>(API_ENDPOINTS.TRANSACTIONS, search);
    const list = Array.isArray(data?.transactions) ? data.transactions : [];
    return {
        transactions: list.map((t: unknown) => normalizeTransaction(t)),
        total: data?.total ?? 0,
        hasMore: data?.hasMore ?? false,
    };
}

export async function fetchTransaction(transactionId: number): Promise<Transaction> {
    const data = await apiGet<unknown>(API_ENDPOINTS.TRANSACTION(transactionId));
    return normalizeTransaction(data);
}

export function useTransactions(params?: {
    stockID?: number;
    action?: string;
    limit?: number;
    offset?: number;
}) {
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
        queryKey: transactionsKeys.list(params ?? {}),
        queryFn: () => fetchTransactions(params),
        enabled: !!userId,
    });
}

export function useTransaction(transactionId: number | null) {
    return useQuery({
        queryKey: transactionId != null ? transactionsKeys.detail(transactionId) : ['transactions', 'detail', 'disabled'],
        queryFn: () => fetchTransaction(transactionId!),
        enabled: transactionId != null,
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            body,
            stockContext,
        }: {
            body: TransactionCreate;
            stockContext?: TransactionStockContext;
        }) => createTransaction(body, stockContext),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
        },
    });
}
