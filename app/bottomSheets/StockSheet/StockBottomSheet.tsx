import Chart from '@/components/chart';
import { Ticker } from '@/components/Ticker';
import { brightenColor, isDarkColor, useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useLeague } from '@/lib/leagues-api';
import { getSportKey } from '@/lib/odds-api';
import { usePriceHistory, useStock } from '@/lib/stocks-api';
import { useTransactions } from '@/lib/transactions-api';
import { usePortfolio } from '@/lib/portfolio-api';
import { useStockStore } from '@/stores/stockStore';
import type { League, PriceHistory, Stock, Transaction } from '@/types';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import BuySellBottomSheet from '../BuySellBottomSheet';
import { ActionButtons } from './ActionButtons';
import { OddsSection } from './OddsSection';
import { PredictionMarkets } from './PredictionMarkets';
import { TradeHistory } from './TradeHistory';
import { formatCurrency, formatPercentage } from './utils';
import { YourPosition } from './YourPosition';

type StockBottomSheetProps = {
    stockBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function StockBottomSheet({ stockBottomSheetRef }: StockBottomSheetProps) {
    const { activeStockId, activeStock, setActiveStockId, setActiveStock, removeFollow, isFollowing } = useStockStore();
    const { data: portfolio } = usePortfolio();
    const buySellBottomSheetRef = useRef<BottomSheetModal>(null) as React.RefObject<BottomSheetModal>;
    const { buySellBottomSheetOpen } = useStockStore();
    const { isDark } = useTheme();
    const Color = useColors();

    const { data: fetchedStock } = useStock(activeStockId);
    const { data: league } = useLeague(
        fetchedStock?.leagueID ?? null
    );
    const { data: stockPriceHistory = [] } = usePriceHistory(activeStockId, undefined, 100);
    const { data: txData } = useTransactions(
        activeStockId ? { stockID: activeStockId, limit: 50 } : undefined
    );
    const stock = fetchedStock ?? activeStock ?? null;
    const stockTransactions: Transaction[] = txData?.transactions ?? [];
    const loading =
        (!!activeStockId && fetchedStock === undefined && !activeStock) ||
        (!!activeStockId && txData === undefined);

    useEffect(() => {
        if (fetchedStock) setActiveStock(fetchedStock);
    }, [fetchedStock, setActiveStock]);

    useEffect(() => {
        if (buySellBottomSheetOpen) {
            buySellBottomSheetRef.current?.present();
        } else {
            buySellBottomSheetRef.current?.dismiss();
        }
    }, [buySellBottomSheetOpen]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                enableTouchThrough={false}
                opacity={0.4}
            />
        ),
        []
    );

    const apiTeamName = useMemo(() => stock?.fullName || null, [stock]);
    const sportKey = useMemo(() => league ? getSportKey(league.name, league.sport) : null, [league]);

    const userPosition = stock && portfolio?.positions
        ? portfolio.positions.find((p) => p.stock.id === stock.id) ?? null
        : null;
    const userOwnsStock = !!userPosition;

    // Check if user follows this stock
    const userFollowsStock = stock ? isFollowing(stock.id) : false;

    // Remove from followed list if user owns the stock
    useEffect(() => {
        if (stock && userOwnsStock && userFollowsStock) {
            removeFollow(stock.id);
        }
    }, [stock, userOwnsStock, userFollowsStock, removeFollow]);

    // Animated opacity for Follow/Unfollow text fade
    const followTextOpacity = useSharedValue(1);

    useEffect(() => {
        // Fade out, then fade in when the text changes
        followTextOpacity.value = withTiming(0, { duration: 150 }, () => {
            followTextOpacity.value = withTiming(1, { duration: 150 });
        });
    }, [userFollowsStock]);

    const presentWhenReady = useCallback(
        (instance: BottomSheetModal | null) => {
            // Only store the instance; RootLayout is responsible for calling present()/dismiss()
            (stockBottomSheetRef as React.MutableRefObject<BottomSheetModal | null>).current = instance;
        },
        [stockBottomSheetRef]
    );

    const effectiveStock = stock ?? activeStock ?? null;
    const hasStock = !!effectiveStock;

    const currentPrice = effectiveStock?.price ?? 0;
    const previousPrice = stockPriceHistory.length > 1 ? stockPriceHistory[stockPriceHistory.length - 2].price : currentPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercentage = previousPrice ? (priceChange / previousPrice) * 100 : 0;

    // Get team colors
    const primaryColor = effectiveStock?.color || Color.blue;
    const isDarkBackground = isDarkColor(primaryColor);
    const brightenedPrimaryColor = brightenColor(primaryColor);

    return (
        <BottomSheetModal
            ref={presentWhenReady}
            onDismiss={() => setActiveStockId(null)}
            enableDynamicSizing={true}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            snapPoints={['92%']}
            style={{ borderRadius: 25 }}
            backgroundStyle={{ borderRadius: 25, backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }}
        >
            <BottomSheetScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Guard: if no active stock, render empty content so the sheet stays mounted */}
                {!activeStockId ? (
                    <View />
                ) : (loading && !hasStock) ? (
                    <View style={{ minHeight: 400, padding: 48, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={Color.green} />
                        <Text style={[styles.leagueName, { color: Color.subText, marginTop: 12 }]}>Loading…</Text>
                    </View>
                ) : hasStock ? (
                    <>
                        {/* Header */}
                        <View style={[styles.header, { backgroundColor: primaryColor }]}>
                            <View style={styles.headerContent}>
                                <Text style={styles.stockName}>{effectiveStock!.name}</Text>
                                <View style={styles.headerBottomRow}>
                                    <View style={styles.headerLeftGroup}>
                                        <Text style={styles.leagueName}>{league?.name}</Text>
                                        <Ticker ticker={effectiveStock!.ticker} color={effectiveStock!.secondaryColor} size="small" />
                                    </View>
                                    <View style={[styles.priceContainer, { backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }]}>
                                        <Text style={[styles.currentPrice, { color: Color.baseText }]}>{formatCurrency(currentPrice)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Price Performance */}
                        <View style={styles.pricePerformance}>
                            <Text style={[styles.priceChange, { color: priceChange >= 0 ? Color.green : Color.red }]}>
                                {priceChange >= 0 ? '↑' : '↓'} {formatPercentage(priceChangePercentage)}
                            </Text>
                        </View>

                        {/* Chart */}
                        <View style={styles.chartContainer}>
                            <Chart
                                stockId={effectiveStock!.id}
                                color={isDarkBackground && isDark ? brightenedPrimaryColor : primaryColor}
                                backgroundColor={isDark ? '#1A1D21' : '#FFFFFF'}
                                priceData={stockPriceHistory}
                            />
                            {stockPriceHistory.length === 0 && (
                                <Text style={[styles.chartNote, { color: Color.subText }]}>
                                    No price history available yet for this stock.
                                </Text>
                            )}
                        </View>

                        {/* Action Buttons */}
                        <ActionButtons userOwnsStock={userOwnsStock} userFollowsStock={userFollowsStock} stock={effectiveStock!} />

                        {/* Position Details - Only show if user owns the stock */}
                        {userOwnsStock && userPosition && (
                            <YourPosition userPosition={userPosition} currentPrice={currentPrice} />
                        )}

                        {/* Trade History Section */}
                        <TradeHistory stockTransactions={stockTransactions} stock={effectiveStock!} />

                        {effectiveStock && apiTeamName && sportKey && (
                            <OddsSection apiTeamName={apiTeamName} sportKey={sportKey} stock={effectiveStock} />
                        )}

                        {league && effectiveStock && (
                            <PredictionMarkets league={league} stock={effectiveStock} />
                        )}

                        {/* Bottom Spacing */}
                        <View style={styles.bottomSpacing} />
                    </>
                ) : null}
            </BottomSheetScrollView>
            <BuySellBottomSheet buySellBottomSheetRef={buySellBottomSheetRef} />
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        borderRadius: 25,
    },
    header: {
        padding: 20
    },
    headerContent: {
        flexDirection: 'column',
        gap: 8,
    },
    stockName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeftGroup: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
    },
    leagueName: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    priceContainer: {
        flexShrink: 0,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    currentPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
    },
    pricePerformance: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    priceChange: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    chartContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    chartNote: {
        marginTop: 8,
        fontSize: 12,
        textAlign: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    bottomSpacing: {
        height: 50,
    }
});