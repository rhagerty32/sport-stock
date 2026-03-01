import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { fetchWallet, getBonusInfo, purchaseFanCoins } from '@/lib/wallet-api';
import { BonusInfo, FanCoinPurchase, Wallet } from '@/types';
import { useAuthStore } from '@/stores/authStore';

type WalletStore = {
    wallet: Wallet | null;
    bonusInfo: BonusInfo | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    initializeWallet: () => Promise<void>;
    loadWallet: (userId: string) => Promise<void>;
    loadBonusInfo: () => Promise<void>;
    purchaseFanCoins: (
        userId: string,
        amount: number,
        paymentMethod: FanCoinPurchase['paymentMethod']
    ) => Promise<FanCoinPurchase>;
    spendCredits: (amount: number) => void;
    refreshWallet: (userId: string) => Promise<void>;
    
    // Helper functions
    getBonusMultiplier: (amount: number, isFirstPurchase?: boolean) => number;
    calculateBonusCredits: (amount: number, isFirstPurchase?: boolean) => number;
};

export const useWalletStore = create<WalletStore>()(
    persist(
        (set, get) => ({
            wallet: null,
            bonusInfo: null,
            isLoading: false,
            error: null,

            initializeWallet: async () => {
                const { isAuthenticated, user } = useAuthStore.getState();
                if (!isAuthenticated || !user) return;
                const state = get();
                if (!state.wallet) {
                    await state.loadWallet(user.id);
                }
                if (!state.bonusInfo) {
                    await state.loadBonusInfo();
                }
            },

            loadWallet: async (userId: string) => {
                set({ isLoading: true, error: null });
                try {
                    const wallet = await fetchWallet(userId);
                    set({ wallet, isLoading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to load wallet',
                        isLoading: false,
                    });
                }
            },

            loadBonusInfo: async () => {
                try {
                    const bonusInfo = await getBonusInfo();
                    set({ bonusInfo });
                } catch (error) {
                    console.error('Failed to load bonus info:', error);
                }
            },

            purchaseFanCoins: async (
                userId: string,
                amount: number,
                paymentMethod: FanCoinPurchase['paymentMethod']
            ) => {
                set({ isLoading: true, error: null });
                try {
                    const purchase = await purchaseFanCoins(userId, amount, paymentMethod);
                    
                    // Refresh wallet after purchase
                    await get().refreshWallet(userId);
                    
                    set({ isLoading: false });
                    return purchase;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to purchase Gold Coins';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            spendCredits: (amount: number) => {
                const { wallet } = get();
                if (wallet && wallet.tradingCredits >= amount) {
                    set({
                        wallet: {
                            ...wallet,
                            tradingCredits: wallet.tradingCredits - amount,
                            updatedAt: new Date(),
                        },
                    });
                } else {
                    throw new Error('Insufficient trading credits');
                }
            },

            refreshWallet: async (userId: string) => {
                try {
                    const wallet = await fetchWallet(userId);
                    set({ wallet });
                } catch (error) {
                    console.error('Failed to refresh wallet:', error);
                }
            },

            getBonusMultiplier: (amount: number, isFirstPurchase: boolean = false) => {
                // Always 1:1 ratio, no bonuses
                return 1.0;
            },

            calculateBonusCredits: (amount: number, isFirstPurchase: boolean = false) => {
                // Always 1:1 ratio, no bonuses
                return amount;
            },
        }),
        {
            name: 'wallet-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                wallet: state.wallet,
                bonusInfo: state.bonusInfo,
            }),
        }
    )
);

