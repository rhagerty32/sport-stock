import { create } from 'zustand';

/**
 * Wallet server state has been moved to TanStack Query.
 * Use useWallet(userId), useBonusInfo(), usePurchaseFanCoins() from lib/wallet-api.
 */
type WalletStore = {
    getBonusMultiplier: (amount: number, isFirstPurchase?: boolean) => number;
    calculateBonusCredits: (amount: number, isFirstPurchase?: boolean) => number;
};

export const useWalletStore = create<WalletStore>()(() => ({
    getBonusMultiplier: (_amount: number, _isFirstPurchase = false) => 1.0,
    calculateBonusCredits: (amount: number, _isFirstPurchase = false) => amount,
}));
