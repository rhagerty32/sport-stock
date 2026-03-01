// API Configuration - SportStock backend
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.sportstock.com';

export const API_ENDPOINTS = {
    // Users
    USERS_REGISTER: '/api/users/',
    USERS_ME: '/api/users/me',

    // Wallet
    WALLET: (userId: string) => `/api/wallet/${userId}`,
    WALLET_PURCHASE: '/api/wallet/purchase',
    WALLET_HISTORY: (userId: string) => `/api/wallet/${userId}/history`,
    WALLET_BONUS_INFO: '/api/wallet/bonus-info',

    // Portfolio
    PORTFOLIO: '/api/portfolio',
    PORTFOLIO_POSITIONS: '/api/portfolio/positions',
    PORTFOLIO_POSITION: (stockId: string) => `/api/portfolio/positions/${stockId}`,

    // Transactions
    TRANSACTIONS: '/api/transactions',
    TRANSACTION: (id: number) => `/api/transactions/${id}`,

    // Stocks
    STOCKS: '/api/stocks',
    STOCK: (stockId: string) => `/api/stocks/${stockId}`,
    STOCK_PRICE_HISTORY: (stockId: string) => `/api/stocks/${stockId}/price-history`,
    STOCKS_TOP_MOVERS: '/api/stocks/top-movers',
    STOCKS_HIGHEST_VOLUME: '/api/stocks/highest-volume',
    STOCKS_ON_THE_RISE: '/api/stocks/on-the-rise',
    STOCKS_UPSET_ALERT: '/api/stocks/upset-alert',

    // Leagues
    LEAGUES: '/api/leagues',
    LEAGUE: (leagueId: string) => `/api/leagues/${leagueId}`,

    // Search
    SEARCH: '/api/search',
} as const;
