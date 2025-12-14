import Chart from '@/components/chart';
import { Ticker } from '@/components/Ticker';
import { GlassCard } from '@/components/ui/GlassCard';
import { brightenColor, isDarkColor } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { leagues, portfolio, priceHistory, stocks, transactions } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import BuySellBottomSheet from './BuySellBottomSheet';

type StockBottomSheetProps = {
    stockBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function StockBottomSheet({ stockBottomSheetRef }: StockBottomSheetProps) {
    const { activeStockId, setActiveStockId, addFollow, removeFollow, isFollowing, setBuySellMode } = useStockStore();
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
    const { lightImpact, selection } = useHaptics();

    // Find the stock by ID from the store
    const stock = stocks.find(s => s.id === activeStockId);
    const league = leagues.find(l => l.id === stock?.leagueID);
    const stockPriceHistory = priceHistory.filter(ph => ph.stockID === stock?.id);

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

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: followTextOpacity.value,
        };
    });

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
    const primaryColor = stock.color || '#3B82F6';
    const isDarkBackground = isDarkColor(primaryColor);
    const brightenedPrimaryColor = brightenColor(primaryColor);

    const handleBuy = () => {
        lightImpact();
        setBuySellMode('buy');
        setBuySellBottomSheetOpen(true);
    };

    const handleSell = () => {
        lightImpact();
        setBuySellMode('sell');
        setBuySellBottomSheetOpen(true);
    };

    const handleFollow = () => {
        lightImpact();
        if (userFollowsStock) {
            removeFollow(stock.id);
        } else {
            addFollow(stock.id);
        }
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
                                    <Ticker ticker={stock.ticker} color={stock.color} size="small" />
                                </View>
                                <Text style={styles.leagueName}>{league?.name}</Text>
                            </View>
                        </View>
                        <View style={[styles.priceContainer, { backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }]}>
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
                    <Chart stockId={stock.id} color={isDarkBackground && isDark ? brightenedPrimaryColor : primaryColor} backgroundColor={isDark ? '#1A1D21' : '#FFFFFF'} />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {/* Buy Button - Always shown */}
                    <TouchableOpacity
                        onPress={handleBuy}
                        style={[styles.actionButton, styles.buyButton, { backgroundColor: '#00C853' }]}
                    >
                        <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                        <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                            Buy
                        </Text>
                    </TouchableOpacity>

                    {/* Sell or Follow Button */}
                    {userOwnsStock ? (
                        <TouchableOpacity
                            onPress={handleSell}
                            style={[styles.actionButton, styles.sellButton, { backgroundColor: '#EF4444' }]}
                        >
                            <Ionicons name="remove-circle-outline" size={24} color="#FFFFFF" />
                            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                                Sell
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleFollow}
                            style={[styles.actionButton, styles.followButton, { backgroundColor: userFollowsStock ? '#E5E7EB' : '#E5E7EB' }]}
                        >
                            <Ionicons name={userFollowsStock ? "heart" : "heart-outline"} size={24} color={userFollowsStock ? '#EF4444' : '#EF4444'} />
                            <Animated.Text style={[styles.actionButtonText, animatedTextStyle]}>
                                {userFollowsStock ? 'Unfollow' : 'Follow'}
                            </Animated.Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Position Details - Only show if user owns the stock */}
                {userOwnsStock && userPosition && (
                    <View style={styles.statsContainer}>
                        <GlassCard style={styles.statsCard}>
                            <View style={styles.positionHeader}>
                                <Text style={[styles.statsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Your Position
                                </Text>
                                <View style={[
                                    styles.gainLossBadge,
                                    { backgroundColor: userPosition.totalGainLoss >= 0 ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 23, 68, 0.15)' }
                                ]}>
                                    <Ionicons
                                        name={userPosition.totalGainLoss >= 0 ? "trending-up" : "trending-down"}
                                        size={16}
                                        color={userPosition.totalGainLoss >= 0 ? '#00C853' : '#FF1744'}
                                    />
                                    <Text style={[
                                        styles.gainLossBadgeText,
                                        { color: userPosition.totalGainLoss >= 0 ? '#00C853' : '#FF1744' }
                                    ]}>
                                        {formatPercentage(userPosition.gainLossPercentage)}
                                    </Text>
                                </View>
                            </View>

                            {/* Main Metrics Grid */}
                            <View style={styles.positionMetricsGrid}>
                                <View style={styles.positionMetricCard}>
                                    <Text style={[styles.positionMetricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Current Value
                                    </Text>
                                    <Text style={[styles.positionMetricValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(userPosition.currentValue)}
                                    </Text>
                                </View>

                                <View style={styles.positionMetricCard}>
                                    <Text style={[styles.positionMetricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Entries
                                    </Text>
                                    <Text style={[styles.positionMetricValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {userPosition.entries.toFixed(1)}
                                    </Text>
                                </View>
                            </View>

                            {/* Gain/Loss Visual Bar */}
                            <View style={styles.gainLossContainer}>
                                <View style={styles.gainLossHeader}>
                                    <Text style={[styles.gainLossLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Total Gain/Loss
                                    </Text>
                                    <Text style={[
                                        styles.gainLossAmount,
                                        { color: userPosition.totalGainLoss >= 0 ? '#00C853' : '#FF1744' }
                                    ]}>
                                        {userPosition.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(userPosition.totalGainLoss)}
                                    </Text>
                                </View>

                                {/* Visual Bar Chart */}
                                <View style={styles.gainLossBarContainer}>
                                    <View style={[
                                        styles.gainLossBarBackground,
                                        { backgroundColor: isDark ? '#242428' : '#E5E7EB' }
                                    ]}>
                                        {/* Invested amount bar */}
                                        <View
                                            style={[
                                                styles.gainLossBarSegment,
                                                {
                                                    backgroundColor: isDark ? '#374151' : '#D1D5DB',
                                                    width: `${Math.min(100, (userPosition.currentValue - userPosition.totalGainLoss) / userPosition.currentValue * 100)}%`
                                                }
                                            ]}
                                        />
                                        {/* Gain/Loss bar */}
                                        {userPosition.totalGainLoss !== 0 && (
                                            <View
                                                style={[
                                                    styles.gainLossBarSegment,
                                                    {
                                                        backgroundColor: userPosition.totalGainLoss >= 0 ? '#00C853' : '#FF1744',
                                                        width: `${Math.abs(userPosition.totalGainLoss / userPosition.currentValue * 100)}%`
                                                    }
                                                ]}
                                            />
                                        )}
                                    </View>
                                </View>

                                <View style={styles.gainLossBreakdown}>
                                    <View style={styles.gainLossBreakdownItem}>
                                        <View style={[styles.gainLossBreakdownDot, { backgroundColor: isDark ? '#374151' : '#D1D5DB' }]} />
                                        <Text style={[styles.gainLossBreakdownText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            Invested: {formatCurrency(userPosition.currentValue - userPosition.totalGainLoss)}
                                        </Text>
                                    </View>
                                    {userPosition.totalGainLoss !== 0 && (
                                        <View style={styles.gainLossBreakdownItem}>
                                            <View style={[
                                                styles.gainLossBreakdownDot,
                                                { backgroundColor: userPosition.totalGainLoss >= 0 ? '#00C853' : '#FF1744' }
                                            ]} />
                                            <Text style={[
                                                styles.gainLossBreakdownText,
                                                { color: userPosition.totalGainLoss >= 0 ? '#00C853' : '#FF1744' }
                                            ]}>
                                                {userPosition.totalGainLoss >= 0 ? 'Gain' : 'Loss'}: {formatCurrency(Math.abs(userPosition.totalGainLoss))}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Secondary Metrics */}
                            <View style={styles.positionSecondaryMetrics}>
                                <View style={styles.positionSecondaryMetric}>
                                    <Text style={[styles.positionSecondaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Avg Entry Price
                                    </Text>
                                    <Text style={[styles.positionSecondaryValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(userPosition.avgEntryPrice)}
                                    </Text>
                                </View>
                                <View style={styles.positionSecondaryDivider} />
                                <View style={styles.positionSecondaryMetric}>
                                    <Text style={[styles.positionSecondaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Current Price
                                    </Text>
                                    <Text style={[styles.positionSecondaryValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(currentPrice)}
                                    </Text>
                                </View>
                            </View>
                        </GlassCard>
                    </View>
                )}

                {/* Transaction History - Only show if user has transactions */}
                {stockTransactions.length > 0 && (
                    <View style={styles.statsContainer}>
                        <GlassCard style={styles.statsCard}>
                            <Text style={[styles.statsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                Transaction History
                            </Text>

                            <View style={styles.transactionList}>
                                {stockTransactions.map((transaction, index) => (
                                    <View
                                        key={transaction.id}
                                        style={[
                                            styles.transactionItem,
                                            index === stockTransactions.length - 1 && styles.transactionItemLast
                                        ]}
                                    >
                                        <View style={styles.transactionHeader}>
                                            <View style={[
                                                styles.transactionBadge,
                                                { backgroundColor: transaction.action === 'buy' ? '#00C853' : '#FF1744' }
                                            ]}>
                                                <Text style={styles.transactionBadgeText}>
                                                    {transaction.action === 'buy' ? 'BUY' : 'SELL'}
                                                </Text>
                                            </View>
                                            <Text style={[styles.transactionDate, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                {transaction.createdAt.toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                        <View style={styles.transactionDetails}>
                                            <View style={styles.transactionDetailRow}>
                                                <Text style={[styles.transactionDetailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                    Quantity:
                                                </Text>
                                                <Text style={[styles.transactionDetailValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                    {transaction.quantity.toFixed(1)} entries
                                                </Text>
                                            </View>
                                            <View style={styles.transactionDetailRow}>
                                                <Text style={[styles.transactionDetailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                    Price:
                                                </Text>
                                                <Text style={[styles.transactionDetailValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                    {formatCurrency(transaction.price)}
                                                </Text>
                                            </View>
                                            <View style={styles.transactionDetailRow}>
                                                <Text style={[styles.transactionDetailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                    Total:
                                                </Text>
                                                <Text style={[styles.transactionDetailValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                    {formatCurrency(transaction.totalPrice)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </GlassCard>
                    </View>
                )}

                {/* Team Info & About - Combined Section */}
                <View style={styles.statsContainer}>
                    <GlassCard style={styles.statsCard}>
                        <View style={styles.teamInfoHeader}>
                            <View>
                                <Text style={[styles.statsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Team Overview
                                </Text>
                                <Text style={[styles.teamInfoSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {league?.sport} • {league?.name}
                                </Text>
                            </View>
                            <View style={[
                                styles.sportBadge,
                                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }
                            ]}>
                                <Ionicons name="trophy" size={18} color="#3B82F6" />
                            </View>
                        </View>

                        {/* About Text */}
                        {stock.about && (
                            <View style={styles.aboutTextContainer}>
                                <Text style={[styles.aboutText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                                    {stock.about}
                                </Text>
                            </View>
                        )}

                        {/* Key Stats Grid */}
                        <View style={styles.teamStatsGrid}>
                            <View style={styles.teamStatCard}>
                                <View style={styles.teamStatIconContainer}>
                                    <Ionicons name="stats-chart" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                </View>
                                <Text style={[styles.teamStatLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Volume
                                </Text>
                                <Text
                                    style={[styles.teamStatValue, { color: isDark ? '#FFFFFF' : '#000000' }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.7}
                                >
                                    {formatNumber(stock.volume)}
                                </Text>
                            </View>

                            <View style={styles.teamStatCard}>
                                <View style={styles.teamStatIconContainer}>
                                    <Ionicons name="cash" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                </View>
                                <Text style={[styles.teamStatLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Market Cap
                                </Text>
                                <Text
                                    style={[styles.teamStatValue, { color: isDark ? '#FFFFFF' : '#000000' }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.7}
                                >
                                    {formatNumber(league?.marketCap || 0)}
                                </Text>
                            </View>

                            <View style={styles.teamStatCard}>
                                <View style={styles.teamStatIconContainer}>
                                    <Ionicons name="people" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                </View>
                                <Text style={[styles.teamStatLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    League Vol
                                </Text>
                                <Text
                                    style={[styles.teamStatValue, { color: isDark ? '#FFFFFF' : '#000000' }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.7}
                                >
                                    {formatNumber(league?.volume || 0)}
                                </Text>
                            </View>
                        </View>

                        {/* Team Details Row */}
                        <View style={styles.teamDetailsRow}>
                            <View style={styles.teamDetailItem}>
                                <Ionicons name="person" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <View style={styles.teamDetailContent}>
                                    <Text style={[styles.teamDetailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Coach
                                    </Text>
                                    <Text style={[styles.teamDetailValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {stock.coach}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.teamDetailDivider} />

                            <View style={styles.teamDetailItem}>
                                <Ionicons name="calendar" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <View style={styles.teamDetailContent}>
                                    <Text style={[styles.teamDetailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Founded
                                    </Text>
                                    <Text style={[styles.teamDetailValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {stock.founded}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Top Players */}
                        {stock.topThreePlayers && stock.topThreePlayers.length > 0 && (
                            <View style={styles.topPlayersContainer}>
                                <View style={styles.topPlayersHeader}>
                                    <Ionicons name="star" size={18} color={isDark ? '#F59E0B' : '#F59E0B'} />
                                    <Text style={[styles.topPlayersTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        Top Players
                                    </Text>
                                </View>
                                <View style={styles.topPlayersList}>
                                    {stock.topThreePlayers.map((player, index) => (
                                        <View key={index} style={styles.topPlayerItem}>
                                            <View style={[
                                                styles.topPlayerRank,
                                                { backgroundColor: index === 0 ? '#F59E0B' : index === 1 ? '#9CA3AF' : '#CD7F32' }
                                            ]}>
                                                <Text style={styles.topPlayerRankText}>{index + 1}</Text>
                                            </View>
                                            <Text style={[styles.topPlayerName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                {player}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Listing Info */}
                        <View style={styles.listingInfo}>
                            <View style={styles.listingInfoItem}>
                                <Ionicons name="time-outline" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <Text style={[styles.listingInfoText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Listed {stock.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                            <View style={styles.listingInfoDivider} />
                            <View style={styles.listingInfoItem}>
                                <Ionicons name="refresh-outline" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <Text style={[styles.listingInfoText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Updated {stock.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
    teamInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    teamInfoSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
    },
    sportBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aboutTextContainer: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.2)',
    },
    aboutText: {
        fontSize: 14,
        lineHeight: 20,
    },
    teamStatsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    teamStatCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(156, 163, 175, 0.08)',
        alignItems: 'center',
    },
    teamStatIconContainer: {
        marginBottom: 8,
    },
    teamStatLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    teamStatValue: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        flexShrink: 1,
    },
    teamDetailsRow: {
        flexDirection: 'row',
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.2)',
        marginBottom: 20,
    },
    teamDetailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    teamDetailContent: {
        flex: 1,
    },
    teamDetailLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    teamDetailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    teamDetailDivider: {
        width: 1,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        marginHorizontal: 16,
    },
    topPlayersContainer: {
        marginBottom: 20,
    },
    topPlayersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    topPlayersTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    topPlayersList: {
        gap: 10,
    },
    topPlayerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    topPlayerRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topPlayerRankText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    topPlayerName: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    listingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(156, 163, 175, 0.2)',
    },
    listingInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    listingInfoText: {
        fontSize: 11,
        fontWeight: '500',
    },
    listingInfoDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        marginHorizontal: 12,
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
    sellButton: {
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
    positionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    gainLossBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    gainLossBadgeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    positionMetricsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    positionMetricCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
    },
    positionMetricLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    positionMetricValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    gainLossContainer: {
        marginBottom: 20,
    },
    gainLossHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    gainLossLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    gainLossAmount: {
        fontSize: 18,
        fontWeight: '700',
    },
    gainLossBarContainer: {
        marginBottom: 12,
    },
    gainLossBarBackground: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    gainLossBarSegment: {
        height: '100%',
    },
    gainLossBreakdown: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    gainLossBreakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    gainLossBreakdownDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    gainLossBreakdownText: {
        fontSize: 12,
        fontWeight: '500',
    },
    positionSecondaryMetrics: {
        flexDirection: 'row',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(156, 163, 175, 0.2)',
    },
    positionSecondaryMetric: {
        flex: 1,
    },
    positionSecondaryLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    positionSecondaryValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    positionSecondaryDivider: {
        width: 1,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        marginHorizontal: 16,
    },
    transactionList: {
        gap: 16,
        marginTop: 8,
    },
    transactionItem: {
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.2)',
    },
    transactionItemLast: {
        borderBottomWidth: 0,
        paddingBottom: 0,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    transactionBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    transactionBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    transactionDate: {
        fontSize: 12,
        fontWeight: '500',
    },
    transactionDetails: {
        gap: 8,
    },
    transactionDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionDetailLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    transactionDetailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
});
