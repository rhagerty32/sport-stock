import { API_ENDPOINTS } from '@/constants/api-config';
import type { Transaction } from '@/types';
import { apiGet, apiPost } from '@/lib/api';
import { normalizeTransaction } from '@/lib/api-normalizers';

export type TransactionCreate = {
    action: 'buy' | 'sell';
    stockId: number;
    quantity: number;
    price?: number | null;
};

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

export async function createTransaction(body: TransactionCreate): Promise<Transaction> {
    const data = await apiPost<unknown>(API_ENDPOINTS.TRANSACTIONS, {
        action: body.action,
        stockId: body.stockId,
        quantity: body.quantity,
        ...(body.price != null && { price: body.price }),
    });
    return normalizeTransaction(data);
}

export async function fetchTransaction(transactionId: number): Promise<Transaction> {
    const data = await apiGet<unknown>(API_ENDPOINTS.TRANSACTION(transactionId));
    return normalizeTransaction(data);
}
