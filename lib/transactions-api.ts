import { API_ENDPOINTS } from '@/constants/api-config';
import type { Transaction } from '@/types';
import { apiGet, apiPost } from '@/lib/api';
import { normalizeTransaction } from '@/lib/api-normalizers';
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

/** When `"usd"`, `quantity` is a dollar notional; server fills ~within 1%. Omit for share/entry quantity. */
export type TransactionQuantityUnit = 'usd';

export type TransactionCreate = {
    action: 'buy' | 'sell';
    stockId: number | string;
    quantity: number;
    quantityUnit?: TransactionQuantityUnit;
    price?: number | null;
    /** 8–128 chars when set; duplicate POSTs with the same key return the original queued order. */
    idempotencyKey?: string;
};

/**
 * Create a buy/sell transaction via POST /api/transactions.
 * API_DOCS: Create Transaction.
 */
export async function createTransaction(body: TransactionCreate): Promise<Transaction> {
    if (body.idempotencyKey != null) {
        assertValidTransactionIdempotencyKey(body.idempotencyKey);
    }

    if (body.action === 'buy') {
        // Debug logging for buy requests
        console.log('[createTransaction][BUY] request body', {
            action: body.action,
            stockId: body.stockId,
            quantity: body.quantity,
            quantityUnit: body.quantityUnit,
            price: body.price,
            hasIdempotencyKey: body.idempotencyKey != null,
        });
    }

    const payload: Record<string, unknown> = {
        action: body.action,
        stockId: body.stockId,
        quantity: body.quantity,
    };
    if (body.quantityUnit != null) {
        payload.quantityUnit = body.quantityUnit;
    }
    if (body.price != null) {
        payload.price = body.price;
    }
    if (body.idempotencyKey != null) {
        payload.idempotencyKey = body.idempotencyKey;
    }

    const data = await apiPost<unknown>(API_ENDPOINTS.TRANSACTIONS, payload);
    return normalizeTransaction(data);
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
        mutationFn: ({ body }: { body: TransactionCreate }) => createTransaction(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
        },
    });
}
