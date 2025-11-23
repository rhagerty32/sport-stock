import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type StockStore = {
    activeStockId: number | null;
    setActiveStockId: (stockId: number | null) => void;
    activeUserId: number | null;
    setActiveUserId: (userId: number | null) => void;
    friends: number[]; // Array of user IDs
    addFriend: (userId: number) => void;
    removeFriend: (userId: number) => void;
    isFriend: (userId: number) => boolean;
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
            friends: [],
            addFriend: (userId) => {
                const currentFriends = get().friends;
                if (!currentFriends.includes(userId)) {
                    set({ friends: [...currentFriends, userId] });
                }
            },
            removeFriend: (userId) => {
                set({ friends: get().friends.filter(id => id !== userId) });
            },
            isFriend: (userId) => {
                return get().friends.includes(userId);
            },
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
                friends: state.friends,
            }),
        }
    )
);
