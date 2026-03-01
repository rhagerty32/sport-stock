import { API_ENDPOINTS } from '@/constants/api-config';
import type { BonusInfo, FanCoinPurchase, Wallet } from '@/types';
import { apiGet, apiPost } from '@/lib/api';
import { normalizeBonusInfo, normalizeWallet } from '@/lib/api-normalizers';

/**
 * Fetch wallet balances for a user (user_id is string from auth).
 */
export async function fetchWallet(userId: string): Promise<Wallet> {
    const data = await apiGet<unknown>(API_ENDPOINTS.WALLET(userId));
    return normalizeWallet(data);
}

/**
 * Purchase fan coins (API may not be implemented; stub for compatibility).
 */
export async function purchaseFanCoins(
    _userId: string,
    amount: number,
    paymentMethod: FanCoinPurchase['paymentMethod']
): Promise<FanCoinPurchase> {
    await apiPost<unknown>(API_ENDPOINTS.WALLET_PURCHASE, {
        amount,
        paymentMethod,
    });
    return {
        id: 0,
        userId: 0,
        amount,
        fanCoinsReceived: amount,
        tradingCreditsGranted: amount,
        bonusPercentage: 0,
        paymentMethod,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Get purchase history for a user (API may return empty; stub for compatibility).
 */
export async function getPurchaseHistory(_userId: string): Promise<FanCoinPurchase[]> {
    return [];
}

/**
 * Get bonus information (public, no auth).
 */
export async function getBonusInfo(): Promise<BonusInfo> {
    const data = await apiGet<unknown>(API_ENDPOINTS.WALLET_BONUS_INFO, undefined, { auth: false });
    return normalizeBonusInfo(data);
}
