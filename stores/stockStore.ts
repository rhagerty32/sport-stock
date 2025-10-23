import { create } from 'zustand';

type StockStore = {
    activeStockId: number | null;
    setActiveStockId: (stockId: number | null) => void;
};

export const useStockStore = create<StockStore>((set) => ({
    activeStockId: null,
    setActiveStockId: (stockId) => set({ activeStockId: stockId }),
}));
