import Chart from '@/components/chart';
import { GlassCard } from '@/components/ui/GlassCard';
import { brightenColor, isDarkColor } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, leagues, priceHistory, stocks } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BuySellBottomSheet from './BuySellBottomSheet';

type StockBottomSheetProps = {
    stockBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function StockBottomSheet({ stockBottomSheetRef }: StockBottomSheetProps) {
    const { activeStockId, setActiveStockId } = useStockStore();
    const buySellBottomSheetRef = useRef<BottomSheetModal>(null) as React.RefObject<BottomSheetModal>;
    const { buySellBottomSheetOpen, setBuySellBottomSheetOpen } = useStockStore();

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

    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();

    // Find the stock by ID from the store
    const stock = stocks.find(s => s.id === activeStockId);
    const league = leagues.find(l => l.id === stock?.leagueID);
    const stockColor = colors.find(c => c.stockID === stock?.id.toString());
    const stockPriceHistory = priceHistory.filter(ph => ph.stockID === stock?.id);

    // Don't render anything if no stock is selected
    if (!activeStockId || !stock) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatPercentage = (percentage: number) => {
        const sign = percentage >= 0 ? '+' : '';
        return `${sign}${percentage.toFixed(2)}%`;
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    // Calculate price change
    const currentPrice = stock.price;
    const previousPrice = stockPriceHistory.length > 1 ? stockPriceHistory[stockPriceHistory.length - 2].price : currentPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercentage = (priceChange / previousPrice) * 100;

    // Get team colors
    const primaryColor = stockColor?.hex || '#3B82F6';
    const isDarkBackground = isDarkColor(primaryColor);
    const brightenedPrimaryColor = brightenColor(primaryColor);

    const handleBuy = () => {
        lightImpact();
        setBuySellBottomSheetOpen(true);
    };

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
            backgroundStyle={{ borderRadius: 25, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
        >
            <BottomSheetScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: primaryColor }]}>
                    <View style={styles.headerContent}>
                        <View style={styles.stockInfo}>
                            <View style={[styles.stockLogo, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}>
                                <Text style={[styles.stockLogoText, { color: '#fff' }]}>
                                    {stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                </Text>
                            </View>
                            <View style={styles.stockDetails}>
                                <Text style={styles.stockName}>{stock.name}</Text>
                                <Text style={styles.leagueName}>{league?.name}</Text>
                            </View>
                        </View>
                        <View style={[styles.priceContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                            <Text style={[styles.currentPrice, { color: isDark ? '#FFFFFF' : '#000000' }]}>{formatCurrency(currentPrice)}</Text>
                        </View>
                    </View>
                </View>

                {/* Price Performance */}
                <View style={styles.pricePerformance}>
                    <Text style={[styles.priceChange, { color: priceChange >= 0 ? '#00C853' : '#FF1744' }]}>
                        {priceChange >= 0 ? '↑' : '↓'} {formatPercentage(priceChangePercentage)}
                    </Text>
                </View>

                {/* Chart */}
                <View style={styles.chartContainer}>
                    <Chart stockId={stock.id} color={isDarkBackground && isDark ? brightenedPrimaryColor : primaryColor} backgroundColor={isDark ? '#1C1C1E' : '#FFFFFF'} />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        onPress={handleBuy}
                        style={[styles.actionButton, styles.buyButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                    >
                        <Ionicons name="cart-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                        <Text style={[styles.actionButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Buy/Sell
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => lightImpact()}
                        style={[styles.actionButton, styles.followButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                    >
                        <Text style={[styles.actionButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Follow
                        </Text>
                        <Ionicons name="heart-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                    </TouchableOpacity>
                </View>

                {/* Stock Stats */}
                <View style={styles.statsContainer}>
                    <GlassCard style={styles.statsCard}>
                        <Text style={[styles.statsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Stock Information
                        </Text>

                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Volume
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatNumber(stock.volume)}
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Market Cap
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatCurrency(league?.marketCap || 0)}
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    League Volume
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatNumber(league?.volume || 0)}
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Sport
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {league?.sport}
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Listed
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {stock.createdAt.toLocaleDateString()}
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Last Updated
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {stock.updatedAt.toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                </View>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </BottomSheetScrollView>
            <BuySellBottomSheet buySellBottomSheetRef={buySellBottomSheetRef} />
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        borderRadius: 25,
    },
    header: {
        padding: 20
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButtonText: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
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
    stockLogo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stockLogoText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    stockDetails: {
        flex: 1,
    },
    stockName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
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
    timeframeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 24,
        gap: 12,
    },
    timeframeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    timeframeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    statsContainer: {
        marginHorizontal: 20,
        marginBottom: 24,
    },
    statsCard: {
        padding: 20,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    statItem: {
        width: '100%',
        marginBottom: 16,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 12,
    },
    buyButton: {
        // Styling handled by backgroundColor
    },
    followButton: {
        // Styling handled by backgroundColor
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 50,
    },
    errorText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 100,
    },
});
