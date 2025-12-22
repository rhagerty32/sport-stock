import Chart from '@/components/chart';
import { Ticker } from '@/components/Ticker';
import { brightenColor, isDarkColor, useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { leagues, portfolio, priceHistory, stocks, transactions } from '@/lib/dummy-data';
import { getSportKey } from '@/lib/odds-api';
import { useStockStore } from '@/stores/stockStore';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import BuySellBottomSheet from '../BuySellBottomSheet';
import { ActionButtons } from './ActionButtons';
import { OddsSection } from './OddsSection';
import { PredictionMarkets } from './PredictionMarkets';
import { TeamInfo } from './TeamInfo';
import { TradeHistory } from './TradeHistory';
import { formatCurrency, formatPercentage } from './utils';
import { YourPosition } from './YourPosition';

type StockBottomSheetProps = {
    stockBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function StockBottomSheet({ stockBottomSheetRef }: StockBottomSheetProps) {
    const { activeStockId, setActiveStockId, removeFollow, isFollowing } = useStockStore();
    const buySellBottomSheetRef = useRef<BottomSheetModal>(null) as React.RefObject<BottomSheetModal>;
    const { buySellBottomSheetOpen } = useStockStore();
    const { isDark } = useTheme();
    const Color = useColors();

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

    // Find the stock by ID from the store
    const stock = stocks.find(s => s.id === activeStockId);
    const league = leagues.find(l => l.id === stock?.leagueID);
    const stockPriceHistory = priceHistory.filter(ph => ph.stockID === stock?.id);

    // Get team name and sport key for odds API
    const apiTeamName = useMemo(() => stock?.fullName || null, [stock]);
    const sportKey = useMemo(() => league ? getSportKey(league.name, league.sport) : null, [league]);

    // Get user's position for this stock (before early return to satisfy hooks rules)
    const userPosition = stock ? portfolio.positions.find(position => position.stock.id === stock.id) : null;
    const userOwnsStock = !!userPosition;

    // Get transaction history for this stock
    const stockTransactions = stock ? transactions
        .filter(t => t.stockID === stock.id && t.userID === 1)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Most recent first
        : [];

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

    // Don't render anything if no stock is selected
    if (!activeStockId || !stock) return null;

    // Calculate price change
    const currentPrice = stock.price;
    const previousPrice = stockPriceHistory.length > 1 ? stockPriceHistory[stockPriceHistory.length - 2].price : currentPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercentage = (priceChange / previousPrice) * 100;

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
                {(userOwnsStock && userPosition) ? (
                    <YourPosition userPosition={userPosition} currentPrice={currentPrice} />
                ) : (
                    <ActivityIndicator size="small" color="#000000" />
                )}

                {/* Trade History Section */}
                <TradeHistory stockTransactions={stockTransactions} stock={stock} />

                {(stock && apiTeamName && sportKey) ? (
                    <OddsSection apiTeamName={apiTeamName} sportKey={sportKey} stock={stock} />
                ) : (
                    <ActivityIndicator size="small" color="#000000" />
                )}

                {(league && stock) ? (
                    <PredictionMarkets league={league} stock={stock} />
                ) : (
                    <ActivityIndicator size="small" color="#000000" />
                )}

                {/* Team Info & About - Combined Section */}
                {(league && stock) ? (
                    <TeamInfo stock={stock} league={league} />
                ) : (
                    <ActivityIndicator size="small" color="#000000" />
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