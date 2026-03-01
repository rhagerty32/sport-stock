import Chart from '@/components/chart';
import { Ticker } from '@/components/Ticker';
import { brightenColor, isDarkColor, useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { fetchLeague } from '@/lib/leagues-api';
import { fetchPriceHistory, fetchStock } from '@/lib/stocks-api';
import { fetchTransactions } from '@/lib/transactions-api';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useStockStore } from '@/stores/stockStore';
import type { League, Stock, Transaction } from '@/types';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { getSportKey } from '@/lib/odds-api';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    const { activeStockId, setActiveStockId, setActiveStock, removeFollow, isFollowing } = useStockStore();
    const { portfolio } = usePortfolioStore();
    const buySellBottomSheetRef = useRef<BottomSheetModal>(null) as React.RefObject<BottomSheetModal>;
    const { buySellBottomSheetOpen } = useStockStore();
    const { isDark } = useTheme();
    const Color = useColors();

    const [stock, setStock] = useState<Stock | null>(null);
    const [league, setLeague] = useState<League | null>(null);
    const [stockPriceHistory, setStockPriceHistory] = useState<{ price: number }[]>([]);
    const [stockTransactions, setStockTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (buySellBottomSheetOpen) {
            buySellBottomSheetRef.current?.present();
        } else {
            buySellBottomSheetRef.current?.dismiss();
        }
    }, [buySellBottomSheetOpen]);

    useEffect(() => {
        if (!activeStockId) {
            setStock(null);
            setLeague(null);
            setStockPriceHistory([]);
            setStockTransactions([]);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        Promise.all([
            fetchStock(activeStockId),
            fetchPriceHistory(activeStockId),
            fetchTransactions({ stockID: activeStockId, limit: 50 }),
        ]).then(([s, history, txRes]) => {
            if (cancelled) return;
            setStock(s ?? null);
            if (s) {
                setActiveStock(s);
                fetchLeague(s.leagueID).then((l) => {
                    if (!cancelled) setLeague(l ?? null);
                });
            }
            setStockPriceHistory(history.map((h) => ({ price: h.price })));
            setStockTransactions(txRes.transactions ?? []);
        }).catch(() => {
            if (!cancelled) {
                setStock(null);
                setLeague(null);
                setStockPriceHistory([]);
                setStockTransactions([]);
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [activeStockId, setActiveStock]);

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

    if (!activeStockId) return null;
    if (loading || !stock) {
        return (
            <BottomSheetModal
                ref={stockBottomSheetRef}
                onDismiss={() => setActiveStockId(null)}
                enableDynamicSizing
                backdropComponent={renderBackdrop}
                style={{ borderRadius: 25 }}
                backgroundStyle={{ borderRadius: 25, backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }}
            >
                <View style={{ padding: 48, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Color.green} />
                    <Text style={[styles.leagueName, { color: Color.subText, marginTop: 12 }]}>Loading…</Text>
                </View>
            </BottomSheetModal>
        );
    }

    const currentPrice = stock.price;
    const previousPrice = stockPriceHistory.length > 1 ? stockPriceHistory[stockPriceHistory.length - 2].price : currentPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercentage = previousPrice ? (priceChange / previousPrice) * 100 : 0;

    // Get team colors
    const primaryColor = stock.color || Color.blue;
    const isDarkBackground = isDarkColor(primaryColor);
    const brightenedPrimaryColor = brightenColor(primaryColor);

    return (
        <BottomSheetModal
            ref={stockBottomSheetRef}
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
                {/* Header */}
                <View style={[styles.header, { backgroundColor: primaryColor }]}>
                    <View style={styles.headerContent}>
                        <View style={styles.stockInfo}>
                            <View style={styles.stockDetails}>
                                <View style={styles.stockNameRow}>
                                    <Text style={styles.stockName}>{stock.name}</Text>
                                    <Ticker ticker={stock.ticker} color={stock.secondaryColor} size="small" />
                                </View>
                                <Text style={styles.leagueName}>{league?.name}</Text>
                            </View>
                        </View>
                        <View style={[styles.priceContainer, { backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }]}>
                            <Text style={[styles.currentPrice, { color: Color.baseText }]}>{formatCurrency(currentPrice)}</Text>
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
                    <Chart stockId={stock.id} color={isDarkBackground && isDark ? brightenedPrimaryColor : primaryColor} backgroundColor={isDark ? '#1A1D21' : '#FFFFFF'} />
                </View>

                {/* Action Buttons */}
                <ActionButtons userOwnsStock={userOwnsStock} userFollowsStock={userFollowsStock} stock={stock} />

                {/* Position Details - Only show if user owns the stock */}
                {userOwnsStock && userPosition && (
                    <YourPosition userPosition={userPosition} currentPrice={currentPrice} />
                )}

                {/* Trade History Section */}
                <TradeHistory stockTransactions={stockTransactions} stock={stock} />

                {stock && apiTeamName && sportKey && (
                    <OddsSection apiTeamName={apiTeamName} sportKey={sportKey} stock={stock} />
                )}

                {league && stock && (
                    <PredictionMarkets league={league} stock={stock} />
                )}

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    stockDetails: {
        flex: 1,
    },
    stockNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    stockName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    leagueName: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    priceContainer: {
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