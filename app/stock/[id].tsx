import { useStockStore } from '@/stores/stockStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';

/**
 * Transparent modal that triggers StockBottomSheet when opened from search.
 * NativeTabs puts the search tab in a different native view, so the sheet
 * won't present from there. This route pushes on top, sets activeStockId,
 * sheet presents, then we go back when the user dismisses.
 */
export default function StockTriggerScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { activeStockId, setActiveStockId } = useStockStore();
    const prevActiveStockId = useRef<number | null>(null);

    useEffect(() => {
        const stockId = id ? parseInt(id, 10) : NaN;
        if (!isNaN(stockId)) {
            console.log('StockTriggerScreen: setting activeStockId from route', { idParam: id, stockId });
            setActiveStockId(stockId);
        }
    }, [id, setActiveStockId]);

    useEffect(() => {
        console.log('StockTriggerScreen: activeStockId changed', { activeStockId, prev: prevActiveStockId.current });
        if (prevActiveStockId.current !== null && activeStockId === null) {
            console.log('StockTriggerScreen: activeStockId cleared, navigating back');
            router.back();
        }
        prevActiveStockId.current = activeStockId;
    }, [activeStockId, router]);

    // This screen exists only to hook into navigation and set/clear activeStockId.
    // We render nothing so it doesn't block interaction with the underlying tab UI;
    // the global StockBottomSheet in RootLayout handles the actual UI.
    return null;
}
