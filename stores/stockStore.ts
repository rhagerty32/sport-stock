import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type StockStore = {
    activeStockId: number | null;
    setActiveStockId: (stockId: number | null) => void;
    activeUserId: number | null;
    setActiveUserId: (userId: number | null) => void;
    buySellBottomSheetOpen: boolean;
    setBuySellBottomSheetOpen: (open: boolean) => void;
    profileBottomSheetOpen: boolean;
    setProfileBottomSheetOpen: (open: boolean) => void;
    lightDarkBottomSheetOpen: boolean;
    setLightDarkBottomSheetOpen: (open: boolean) => void;
    purchaseFanCoinsBottomSheetOpen: boolean;
    setPurchaseFanCoinsBottomSheetOpen: (open: boolean) => void;
    walletSystemBottomSheetOpen: boolean;
    setWalletSystemBottomSheetOpen: (open: boolean) => void;
};

export const useStockStore = create<StockStore>()(
    persist(
        (set, get) => ({
            activeStockId: null,
            setActiveStockId: (stockId) => set({ activeStockId: stockId }),
            activeUserId: null,
            setActiveUserId: (userId) => set({ activeUserId: userId }),
            buySellBottomSheetOpen: false,
            setBuySellBottomSheetOpen: (open) => set({ buySellBottomSheetOpen: open }),
            profileBottomSheetOpen: false,
            setProfileBottomSheetOpen: (open) => set({ profileBottomSheetOpen: open }),
            lightDarkBottomSheetOpen: false,
            setLightDarkBottomSheetOpen: (open) => set({ lightDarkBottomSheetOpen: open }),
            purchaseFanCoinsBottomSheetOpen: false,
            setPurchaseFanCoinsBottomSheetOpen: (open) => set({ purchaseFanCoinsBottomSheetOpen: open }),
            walletSystemBottomSheetOpen: false,
            setWalletSystemBottomSheetOpen: (open) => set({ walletSystemBottomSheetOpen: open }),
        }),
        {
            name: 'stock-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Don't persist bottom sheet states as they should reset on app restart
            partialize: (state) => ({
                activeStockId: state.activeStockId,
            }),
        }
    )
);
