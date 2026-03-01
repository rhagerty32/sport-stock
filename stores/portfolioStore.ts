import { create } from 'zustand';
import type { Portfolio, Position, Transaction } from '@/types';
import { fetchPortfolio, fetchPositions, fetchPositionByStockId } from '@/lib/portfolio-api';
import { fetchTransactions } from '@/lib/transactions-api';
import { useAuthStore } from '@/stores/authStore';
import { useWalletStore } from '@/stores/walletStore';

type PortfolioStore = {
    portfolio: Portfolio | null;
    positions: Position[];
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;

    loadPortfolio: () => Promise<void>;
    loadPositions: (params?: { sortBy?: string; limit?: number; offset?: number }) => Promise<void>;
    loadTransactions: (params?: { stockID?: number; action?: string; limit?: number; offset?: number }) => Promise<void>;
    loadPositionByStockId: (stockId: string | number) => Promise<Position | null>;
    refreshAfterTrade: () => Promise<void>;
    setPortfolio: (p: Portfolio | null) => void;
    setTransactions: (t: Transaction[]) => void;
};

export const usePortfolioStore = create<PortfolioStore>()((set, get) => ({
    portfolio: null,
    positions: [],
    transactions: [],
    isLoading: false,
    error: null,

    loadPortfolio: async () => {
        const user = useAuthStore.getState().user;
        if (!user?.id) return;
        set({ isLoading: true, error: null });
        try {
            const portfolio = await fetchPortfolio();
            set({ portfolio, positions: portfolio.positions, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load portfolio',
                isLoading: false,
            });
        }
    },

    loadPositions: async (params) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) return;
        set({ isLoading: true, error: null });
        try {
            const positions = await fetchPositions(params);
            set({ positions, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load positions',
                isLoading: false,
            });
        }
    },

    loadTransactions: async (params) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) return;
        set({ isLoading: true, error: null });
        try {
            const { transactions } = await fetchTransactions(params);
            set({ transactions, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load transactions',
                isLoading: false,
            });
        }
    },

    loadPositionByStockId: async (stockId) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) return null;
        try {
            return await fetchPositionByStockId(stockId);
        } catch {
            return null;
        }
    },

    refreshAfterTrade: async () => {
        const user = useAuthStore.getState().user;
        if (!user?.id) return;
        try {
            await get().loadPortfolio();
            await get().loadTransactions({ limit: 100 });
            await useWalletStore.getState().refreshWallet(user.id);
        } catch (error) {
            console.error('Refresh after trade failed:', error);
        }
    },

    setPortfolio: (portfolio) => set({ portfolio, positions: portfolio?.positions ?? [] }),
    setTransactions: (transactions) => set({ transactions }),
}));
