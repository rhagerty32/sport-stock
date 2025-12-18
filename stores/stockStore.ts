import { Position, Transaction } from '@/types';
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
    buySellMode: 'buy' | 'sell';
    setBuySellMode: (mode: 'buy' | 'sell') => void;
    profileBottomSheetOpen: boolean;
    setProfileBottomSheetOpen: (open: boolean) => void;
    lightDarkBottomSheetOpen: boolean;
    setLightDarkBottomSheetOpen: (open: boolean) => void;
    purchaseFanCoinsBottomSheetOpen: boolean;
    setPurchaseFanCoinsBottomSheetOpen: (open: boolean) => void;
    walletSystemBottomSheetOpen: boolean;
    setWalletSystemBottomSheetOpen: (open: boolean) => void;
    transactionDetailBottomSheetOpen: boolean;
    setTransactionDetailBottomSheetOpen: (open: boolean) => void;
    activeTransaction: Transaction | null;
    setActiveTransaction: (transaction: Transaction | null) => void;
    positionDetailBottomSheetOpen: boolean;
    setPositionDetailBottomSheetOpen: (open: boolean) => void;
    activePosition: Position | null;
    setActivePosition: (position: Position | null) => void;
    followedStockIds: number[];
    addFollow: (stockId: number) => void;
    removeFollow: (stockId: number) => void;
    isFollowing: (stockId: number) => boolean;
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
            buySellMode: 'buy',
            setBuySellMode: (mode) => set({ buySellMode: mode }),
            profileBottomSheetOpen: false,
            setProfileBottomSheetOpen: (open) => set({ profileBottomSheetOpen: open }),
            lightDarkBottomSheetOpen: false,
            setLightDarkBottomSheetOpen: (open) => set({ lightDarkBottomSheetOpen: open }),
            purchaseFanCoinsBottomSheetOpen: false,
            setPurchaseFanCoinsBottomSheetOpen: (open) => set({ purchaseFanCoinsBottomSheetOpen: open }),
            walletSystemBottomSheetOpen: false,
            setWalletSystemBottomSheetOpen: (open) => set({ walletSystemBottomSheetOpen: open }),
            transactionDetailBottomSheetOpen: false,
            setTransactionDetailBottomSheetOpen: (open) => set({ transactionDetailBottomSheetOpen: open }),
            activeTransaction: null,
            setActiveTransaction: (transaction) => set({ activeTransaction: transaction }),
            positionDetailBottomSheetOpen: false,
            setPositionDetailBottomSheetOpen: (open) => set({ positionDetailBottomSheetOpen: open }),
            activePosition: null,
            setActivePosition: (position) => set({ activePosition: position }),
            followedStockIds: [],
            addFollow: (stockId: number) => {
                const { followedStockIds } = get();
                if (!followedStockIds.includes(stockId)) {
                    set({ followedStockIds: [...followedStockIds, stockId] });
                }
            },
            removeFollow: (stockId: number) => {
                const { followedStockIds } = get();
                set({ followedStockIds: followedStockIds.filter(id => id !== stockId) });
            },
            isFollowing: (stockId: number) => {
                const { followedStockIds } = get();
                return followedStockIds.includes(stockId);
            },
        }),
        {
            name: 'stock-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Don't persist bottom sheet states as they should reset on app restart
            partialize: (state) => ({
                activeStockId: state.activeStockId,
                followedStockIds: state.followedStockIds,
            }),
        }
    )
);
