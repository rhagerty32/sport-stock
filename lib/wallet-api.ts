import { API_BASE_URL, API_ENDPOINTS, USE_LIVE_API } from '@/constants/api-config';
import { BonusInfo, FanCoinPurchase, Wallet } from '@/types';
import {
    getDummyBonusInfo,
    getDummyPurchaseHistory,
    getDummyWallet,
    simulatePurchase,
} from './wallet-dummy-data';

// API Service Layer for Wallet Operations
// This layer abstracts the data source (API vs dummy data) based on USE_LIVE_API flag

/**
 * Fetch wallet balances for a user
 */
export const fetchWallet = async (userId: number): Promise<Wallet> => {
    if (USE_LIVE_API) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WALLET.GET(userId)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth token here when available
                    // 'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch wallet: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                ...data,
                updatedAt: new Date(data.updatedAt),
            };
        } catch (error) {
            console.error('Error fetching wallet:', error);
            throw error;
        }
    } else {
        return getDummyWallet(userId);
    }
};

/**
 * Purchase Gold Coins
 */
export const purchaseFanCoins = async (
    userId: number,
    amount: number,
    paymentMethod: FanCoinPurchase['paymentMethod']
): Promise<FanCoinPurchase> => {
    if (USE_LIVE_API) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WALLET.PURCHASE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth token here when available
                    // 'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId,
                    amount,
                    paymentMethod,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to purchase Gold Coins: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                ...data,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
            };
        } catch (error) {
            console.error('Error purchasing Gold Coins:', error);
            throw error;
        }
    } else {
        return simulatePurchase(userId, amount, paymentMethod);
    }
};

/**
 * Get purchase history for a user
 */
export const getPurchaseHistory = async (userId: number): Promise<FanCoinPurchase[]> => {
    if (USE_LIVE_API) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WALLET.HISTORY(userId)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth token here when available
                    // 'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch purchase history: ${response.statusText}`);
            }

            const data = await response.json();
            return data.map((item: any) => ({
                ...item,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt),
            }));
        } catch (error) {
            console.error('Error fetching purchase history:', error);
            throw error;
        }
    } else {
        return getDummyPurchaseHistory(userId);
    }
};

/**
 * Get bonus information
 */
export const getBonusInfo = async (): Promise<BonusInfo> => {
    if (USE_LIVE_API) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WALLET.BONUS_INFO}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch bonus info: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching bonus info:', error);
            throw error;
        }
    } else {
        return getDummyBonusInfo();
    }
};

