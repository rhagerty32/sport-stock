// API Configuration
// Set USE_LIVE_API to true when backend API is ready
export const USE_LIVE_API = false;

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.sportstock.com';

export const API_ENDPOINTS = {
    WALLET: {
        GET: (userId: number) => `/api/wallet/${userId}`,
        PURCHASE: '/api/wallet/purchase',
        HISTORY: (userId: number) => `/api/wallet/${userId}/history`,
        BONUS_INFO: '/api/wallet/bonus-info',
    },
} as const;

