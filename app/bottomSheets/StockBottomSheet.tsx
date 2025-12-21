import Chart from '@/components/chart';
import { Ticker } from '@/components/Ticker';
import { GlassCard } from '@/components/ui/GlassCard';
import { brightenColor, isDarkColor } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { leagues, portfolio, priceHistory, stocks, transactions } from '@/lib/dummy-data';
import { getSportKey, useGameOdds } from '@/lib/odds-api';
import { usePolymarketData } from '@/lib/polymarket-api';
import { useStockStore } from '@/stores/stockStore';
import { PolymarketEvent, PolymarketMarket } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import BuySellBottomSheet from './BuySellBottomSheet';

type StockBottomSheetProps = {
    stockBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function StockBottomSheet({ stockBottomSheetRef }: StockBottomSheetProps) {
    const { activeStockId, setActiveStockId, addFollow, removeFollow, isFollowing, setBuySellMode, setActiveTransaction, setTransactionDetailBottomSheetOpen } = useStockStore();
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
    const { lightImpact, mediumImpact } = useHaptics();

    // Find the stock by ID from the store
    const stock = stocks.find(s => s.id === activeStockId);
    const league = leagues.find(l => l.id === stock?.leagueID);
    const stockPriceHistory = priceHistory.filter(ph => ph.stockID === stock?.id);

    // Get team name and sport key for odds API
    const apiTeamName = useMemo(() => stock?.fullName || null, [stock]);
    const sportKey = useMemo(() => league ? getSportKey(league.name, league.sport) : null, [league]);

    const PredictionMarkets = () => {
        const [allEvents, setAllEvents] = useState<PolymarketEvent[]>([]);
        const { data: playoffData, isLoading: playoffLoading } = usePolymarketData({
            q: league?.playoffQuery || null
        });
        const { data: divisionData, isLoading: divisionLoading } = usePolymarketData({
            q: league?.divisionQuery || null
        });
        const { data: conferenceData, isLoading: conferenceLoading } = usePolymarketData({
            q: league?.conferenceQuery || null
        });
        const { data: championData, isLoading: championLoading } = usePolymarketData({
            q: league?.championQuery || null
        });

        useEffect(() => {
            if (!playoffLoading && !divisionLoading && !conferenceLoading && !championLoading) {
                // Ensure all data are arrays or default to empty array
                const safePlayoffData = Array.isArray(playoffData) ? playoffData : [];
                const safeDivisionData = Array.isArray(divisionData) ? divisionData : [];
                const safeConferenceData = Array.isArray(conferenceData) ? conferenceData : [];
                const safeChampionData = Array.isArray(championData) ? championData : [];

                const allEventsTemp = [
                    ...safePlayoffData,
                    ...safeDivisionData,
                    ...safeConferenceData,
                    ...safeChampionData
                ];

                setAllEvents(allEventsTemp);
            }
        }, [playoffLoading, divisionLoading, conferenceLoading, championLoading]);

        const sortOrder = ['Playoffs', 'Division', 'Conference', 'Champion'];
        const sortedEvents = allEvents.sort((a, b) => {
            const aIndex = sortOrder.indexOf(a.title.includes('Playoffs') ? 'Playoffs' : a.title.includes('Division') ? 'Division' : a.title.includes('Conference') ? 'Conference' : a.title.includes('Champion') ? 'Champion' : a.title);
            const bIndex = sortOrder.indexOf(b.title.includes('Playoffs') ? 'Playoffs' : b.title.includes('Division') ? 'Division' : b.title.includes('Conference') ? 'Conference' : b.title.includes('Champion') ? 'Champion' : b.title);
            return aIndex - bIndex;
        });

        return (
            <View style={styles.statsContainer}>
                <GlassCard style={styles.statsCard}>
                    <View style={styles.predictionMarketsHeader}>
                        <Text style={[styles.statsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            SEASON PREDICTIONS
                        </Text>
                        <View style={styles.draftkingsBranding}>
                            <Text style={[styles.draftkingsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                Straight from Polymarket
                            </Text>
                        </View>
                    </View>


                    {playoffLoading || divisionLoading || conferenceLoading || championLoading ? (
                        <ActivityIndicator size="small" color="#000000" />
                    ) : allEvents.length > 0 ? (
                        <View style={styles.predictionMarketsContainer}>
                            {sortedEvents.map((event) => {
                                if (!stock?.name) return;
                                const teamMarket: PolymarketMarket | undefined = event.markets.find((market) => market.question.includes(stock?.name) || market.question.includes(stock?.fullName) || market.groupItemTitle.includes(stock?.name));

                                if (!teamMarket) return;

                                let oddsPercent = null;

                                if (JSON.parse(teamMarket.outcomes)[0] === "Yes") {
                                    oddsPercent = JSON.parse(teamMarket.outcomePrices)[0];
                                } else {
                                    oddsPercent = JSON.parse(teamMarket.outcomePrices)[1];
                                }

                                return (
                                    <View key={event.id} style={styles.predictionMarketItem}>
                                        <Text>{event.title.includes('Playoffs') ? 'Make the Playoffs' : event.title.includes('Division') ? 'Division Champion' : event.title.includes('Conference') ? 'Conference Champion' : event.title.includes('Champion') ? `${league?.name === "NFL" ? "Super Bowl" : league?.name} Champion` : event.title}</Text>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                                            <Text>{Math.round(oddsPercent * 100)}%</Text>

                                            {/* Small lie chart for winning percentage */}
                                            <Svg width={28} height={28} viewBox="0 0 28 28">
                                                {/* Green segment: percent = event.implied_prob or event.percent or fallback */}
                                                {(() => {
                                                    // fallback: 0.5 if can't find a percent
                                                    const angle = oddsPercent * 360;
                                                    // Calculate coordinates for pie arc
                                                    const r = 14, cx = 14, cy = 14;
                                                    const largeArcFlag = angle > 180 ? 1 : 0;
                                                    const rad = (deg: any) => (Math.PI / 180) * deg;
                                                    const x = cx + r * Math.cos(rad(-90 + angle));
                                                    const y = cy + r * Math.sin(rad(-90 + angle));
                                                    if (oddsPercent === 1) {
                                                        return (
                                                            <Circle
                                                                cx={cx}
                                                                cy={cy}
                                                                r={r}
                                                                fill={oddsPercent > 0.8 ? '#00C853' : oddsPercent < 0.2 ? '#EF4444' : '#E5E7EB'}
                                                            />
                                                        );
                                                    }
                                                    if (oddsPercent === 0) {
                                                        return (
                                                            <Circle
                                                                cx={cx}
                                                                cy={cy}
                                                                r={r}
                                                                fill={isDark ? '#1A1D21' : '#FFFFFF'}
                                                            />
                                                        );
                                                    }
                                                    return (
                                                        <>
                                                            {/* Gray full background */}
                                                            <Circle cx={cx} cy={cy} r={r} fill={isDark ? '#1A1D21' : '#FFFFFF'} />
                                                            {/* Green arc */}
                                                            <Path
                                                                d={`
                                                        M ${cx} ${cy}
                                            L ${cx} ${cy - r}
                                            A ${r} ${r} 0 ${largeArcFlag} 1 ${x} ${y}
                                            Z
                                                    `}
                                                                fill={oddsPercent > 0.8 ? '#00C853' : oddsPercent < 0.2 ? '#EF4444' : '#E5E7EB'}
                                                            />
                                                        </>
                                                    );
                                                })()}
                                            </Svg>
                                        </View>
                                    </View>
                                )
                            })
                            }
                        </View >
                    ) : (
                        <View>
                            <Text>No prediction markets found</Text>
                        </View>
                    )}

                </GlassCard >
            </View >
        )
    }

    // Fetch game odds
    const { data: gameOdds, isLoading: oddsLoading, error: oddsError } = useGameOdds(apiTeamName, sportKey);

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

    // Calculate win probability from American odds
    const calculateWinProbability = (americanOdds: number): number => {
        if (americanOdds > 0) {
            return 100 / (americanOdds + 100);
        } else {
            return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
        }
    };

    // Get team abbreviation from full name
    const getTeamAbbreviation = (teamName: string): string => {
        // Try to find stock by fullName
        const stockMatch = stocks.find(s =>
            s.fullName.toLowerCase() === teamName.toLowerCase() ||
            teamName.toLowerCase().includes(s.fullName.toLowerCase()) ||
            s.fullName.toLowerCase().includes(teamName.toLowerCase())
        );
        if (stockMatch) {
            return stockMatch.ticker;
        }
        // Fallback: extract first letters of words
        return teamName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 3);
    };

    const getTeamColor = (teamName: string): string => {
        if (!teamName) return '#999999';

        const normalizedApiName = teamName.toLowerCase().trim();

        // First try exact match
        let stockMatch = stocks.find(s =>
            s.fullName.toLowerCase().trim() === normalizedApiName
        );

        // If no exact match, try matching by team name (last word or words, excluding location)
        if (!stockMatch) {
            // Extract team name part (usually the last 1-2 words, excluding common location prefixes)
            const apiWords = normalizedApiName.split(' ');
            // Get the team name part (last 1-2 words, or all if short)
            const teamNamePart = apiWords.length > 2
                ? apiWords.slice(-2).join(' ') // Last 2 words (e.g., "Los Angeles Chargers" -> "Angeles Chargers")
                : normalizedApiName;

            // Also try just the last word (e.g., "Chargers")
            const lastWord = apiWords[apiWords.length - 1];

            stockMatch = stocks.find(s => {
                const normalizedStockName = s.fullName.toLowerCase().trim();
                const stockWords = normalizedStockName.split(' ');
                const stockTeamNamePart = stockWords.length > 2
                    ? stockWords.slice(-2).join(' ')
                    : normalizedStockName;
                const stockLastWord = stockWords[stockWords.length - 1];

                // Match on team name part (more specific)
                if (teamNamePart === stockTeamNamePart ||
                    normalizedStockName.includes(teamNamePart) ||
                    normalizedApiName.includes(stockTeamNamePart)) {
                    return true;
                }

                // Match on last word if it's distinctive (longer than 4 chars)
                if (lastWord.length > 4 && lastWord === stockLastWord) {
                    return true;
                }

                return false;
            });
        }

        // If still no match, try full contains matching (but only if one fully contains the other)
        if (!stockMatch) {
            stockMatch = stocks.find(s => {
                const normalizedStockName = s.fullName.toLowerCase().trim();
                // Only match if one fully contains the other AND they're similar length
                const lengthDiff = Math.abs(normalizedApiName.length - normalizedStockName.length);
                if (lengthDiff < 10) { // Only if lengths are similar
                    return normalizedApiName.includes(normalizedStockName) ||
                        normalizedStockName.includes(normalizedApiName);
                }
                return false;
            });
        }

        const color = stockMatch?.secondaryColor || '#999999';
        return color;
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
                                    <Ticker ticker={stock.ticker} color={stock.secondaryColor} size="small" />
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

                {/* Trade History Section */}
                <View style={styles.statsContainer}>
                    <GlassCard style={styles.statsCard}>
                        <Text style={[styles.statsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Trade History
                        </Text>

                        {stockTransactions.length > 0 ? (
                            <View style={styles.tradeHistoryList}>
                                {stockTransactions.slice(0, 5).map((transaction, index) => (
                                    <TouchableOpacity
                                        key={transaction.id}
                                        style={[
                                            styles.tradeHistoryItem,
                                            index < Math.min(stockTransactions.length, 5) - 1 && styles.tradeHistoryItemBorder
                                        ]}
                                        onPress={() => {
                                            mediumImpact();
                                            setActiveTransaction(transaction);
                                            setTransactionDetailBottomSheetOpen(true);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.tradeHistoryItemLeft}>
                                            <View style={[
                                                styles.tradeHistoryBadge,
                                                { backgroundColor: transaction.action === 'buy' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 23, 68, 0.15)' }
                                            ]}>
                                                <Text style={[
                                                    styles.tradeHistoryBadgeText,
                                                    { color: transaction.action === 'buy' ? '#00C853' : '#FF1744' }
                                                ]}>
                                                    {transaction.action === 'buy' ? 'BUY' : 'SELL'}
                                                </Text>
                                            </View>
                                            <View style={styles.tradeHistoryInfo}>
                                                <Text style={[styles.tradeHistoryDate, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                    {transaction.createdAt.toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.tradeHistoryItemRight}>
                                            <Text style={[styles.tradeHistoryQuantity, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                {transaction.quantity.toFixed(1)} entries
                                            </Text>
                                            <Text style={[styles.tradeHistoryTotal, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                {formatCurrency(transaction.totalPrice)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyTradeHistory}>
                                <Ionicons name="receipt-outline" size={48} color={isDark ? '#4B5563' : '#9CA3AF'} />
                                <Text style={[styles.emptyTradeHistoryTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    No Trades Yet
                                </Text>
                                <Text style={[styles.emptyTradeHistoryText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    You haven't made any trades for {stock.name}. Start building your position!
                                </Text>
                                <TouchableOpacity
                                    style={styles.emptyTradeHistoryCTA}
                                    onPress={handleBuy}
                                >
                                    <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.emptyTradeHistoryCTAText}>Buy {stock.ticker}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </GlassCard>
                </View>

                {/* Game Odds Section */}
                <View style={styles.statsContainer}>
                    <GlassCard style={styles.statsCard}>
                        <View style={styles.gameOddsHeader}>
                            <Text style={[styles.statsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                GAME ODDS
                            </Text>
                            <View style={styles.draftkingsBranding}>
                                <Text style={[styles.draftkingsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Odds by DRAFTKINGS
                                </Text>
                            </View>
                        </View>

                        {oddsLoading ? (
                            <View style={styles.oddsLoadingContainer}>
                                <ActivityIndicator size="small" color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <Text style={[styles.oddsLoadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Loading odds...
                                </Text>
                            </View>
                        ) : oddsError || !gameOdds ? (
                            <View style={styles.emptyOddsState}>
                                <Ionicons name="calendar-outline" size={48} color={isDark ? '#4B5563' : '#9CA3AF'} />
                                <Text style={[styles.emptyOddsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    No Upcoming Games
                                </Text>
                                <Text style={[styles.emptyOddsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {stock?.name} doesn't have any upcoming games scheduled.
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Game Time */}
                                <View style={styles.gameTimeContainer}>
                                    <Text style={[styles.gameTime, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        {new Date(gameOdds.event.commence_time).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) === new Date().toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) ? 'Today' : new Date(gameOdds.event.commence_time).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                    <Text style={[styles.gameTime, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        @
                                    </Text>
                                    <Text style={[styles.gameTime, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        {new Date(gameOdds.event.commence_time).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </Text>
                                </View>

                                {/* Odds Table */}
                                <View style={styles.oddsTable}>
                                    {/* Header Row */}
                                    <View style={styles.oddsTableHeader}>
                                        <View style={styles.oddsTableHeaderTeam} />
                                        <Text style={[styles.oddsTableHeaderText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            SPREAD
                                        </Text>
                                        <Text style={[styles.oddsTableHeaderText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            TOTAL
                                        </Text>
                                        <Text style={[styles.oddsTableHeaderText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            ML
                                        </Text>
                                    </View>

                                    {/* Home Team Row */}
                                    <View style={styles.oddsTableRow}>
                                        <View style={styles.oddsTableTeamCell}>
                                            <Text style={[styles.oddsTableTeamName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                {gameOdds.event.home_team}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.oddsTableCell,
                                            gameOdds.spread.home && styles.oddsTableCellHighlighted
                                        ]}>
                                            {gameOdds.spread.home ? (
                                                <>
                                                    <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        {gameOdds.spread.home.point > 0 ? '+' : ''}{gameOdds.spread.home.point}
                                                    </Text>
                                                    <Text style={[styles.oddsTablePrice, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                        {gameOdds.spread.home.price > 0 ? '+' : ''}{gameOdds.spread.home.price}
                                                    </Text>
                                                </>
                                            ) : (
                                                <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                                    —
                                                </Text>
                                            )}
                                        </View>
                                        <View style={[
                                            styles.oddsTableCell,
                                            gameOdds.total.over && styles.oddsTableCellHighlighted
                                        ]}>
                                            {gameOdds.total.over ? (
                                                <>
                                                    <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        o{gameOdds.total.over.point}
                                                    </Text>
                                                    <Text style={[styles.oddsTablePrice, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                        {gameOdds.total.over.price > 0 ? '+' : ''}{gameOdds.total.over.price}
                                                    </Text>
                                                </>
                                            ) : (
                                                <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                                    —
                                                </Text>
                                            )}
                                        </View>
                                        <View style={[
                                            styles.oddsTableCell,
                                            gameOdds.moneyline.home !== null && styles.oddsTableCellHighlighted
                                        ]}>
                                            {gameOdds.moneyline.home !== null ? (
                                                <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                    {gameOdds.moneyline.home > 0 ? '+' : ''}{gameOdds.moneyline.home}
                                                </Text>
                                            ) : (
                                                <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                                    —
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    {/* Away Team Row */}
                                    <View style={styles.oddsTableRow}>
                                        <View style={styles.oddsTableTeamCell}>
                                            <Text style={[styles.oddsTableTeamName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                {gameOdds.event.away_team}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.oddsTableCell,
                                            gameOdds.spread.away && styles.oddsTableCellHighlighted
                                        ]}>
                                            {gameOdds.spread.away ? (
                                                <>
                                                    <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        {gameOdds.spread.away.point > 0 ? '+' : ''}{gameOdds.spread.away.point}
                                                    </Text>
                                                    <Text style={[styles.oddsTablePrice, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                        {gameOdds.spread.away.price > 0 ? '+' : ''}{gameOdds.spread.away.price}
                                                    </Text>
                                                </>
                                            ) : (
                                                <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                                    —
                                                </Text>
                                            )}
                                        </View>
                                        <View style={[
                                            styles.oddsTableCell,
                                            gameOdds.total.under && styles.oddsTableCellHighlighted
                                        ]}>
                                            {gameOdds.total.under ? (
                                                <>
                                                    <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        u{gameOdds.total.under.point}
                                                    </Text>
                                                    <Text style={[styles.oddsTablePrice, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                        {gameOdds.total.under.price > 0 ? '+' : ''}{gameOdds.total.under.price}
                                                    </Text>
                                                </>
                                            ) : (
                                                <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                                    —
                                                </Text>
                                            )}
                                        </View>
                                        <View style={[
                                            styles.oddsTableCell,
                                            gameOdds.moneyline.away !== null && styles.oddsTableCellHighlighted
                                        ]}>
                                            {gameOdds.moneyline.away !== null ? (
                                                <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                    {gameOdds.moneyline.away > 0 ? '+' : ''}{gameOdds.moneyline.away}
                                                </Text>
                                            ) : (
                                                <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                                    —
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                {/* Matchup Predictor Chart */}
                                {gameOdds.moneyline.home !== null && gameOdds.moneyline.away !== null && (
                                    <View style={styles.matchupPredictorContainer}>
                                        <Text style={[styles.matchupPredictorTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                            TO WIN
                                        </Text>

                                        {(() => {
                                            const homeProb = calculateWinProbability(gameOdds.moneyline.home);
                                            const awayProb = calculateWinProbability(gameOdds.moneyline.away);
                                            const totalProb = homeProb + awayProb;
                                            // Normalize to 100%
                                            const homePercent = (homeProb / totalProb) * 100;
                                            const awayPercent = (awayProb / totalProb) * 100;

                                            const homeAbbr = getTeamAbbreviation(gameOdds.event.home_team);
                                            const awayAbbr = getTeamAbbreviation(gameOdds.event.away_team);

                                            // Check if current stock is home or away team
                                            const isHomeTeam = stock?.fullName.toLowerCase().trim() === gameOdds.event.home_team.toLowerCase().trim();

                                            const homeColor = isHomeTeam ? stock.secondaryColor : getTeamColor(gameOdds.event.home_team);
                                            const awayColor = getTeamColor(gameOdds.event.away_team);

                                            const chartSize = 300;
                                            const centerX = chartSize / 2;
                                            const centerY = chartSize / 2;
                                            const radius = 95;
                                            const innerRadius = 75;

                                            // Calculate angles for donut chart
                                            const homeAngle = (homePercent / 100) * 360;
                                            const awayAngle = (awayPercent / 100) * 360;

                                            // Convert angles to radians and calculate arc paths
                                            const homeStartAngle = -90; // Start at top
                                            const homeEndAngle = homeStartAngle + homeAngle;
                                            const awayStartAngle = homeEndAngle;
                                            const awayEndAngle = awayStartAngle + awayAngle;

                                            const toRadians = (deg: number) => (deg * Math.PI) / 180;

                                            const createArc = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
                                                const startRad = toRadians(startAngle);
                                                const endRad = toRadians(endAngle);

                                                const x1 = centerX + outerR * Math.cos(startRad);
                                                const y1 = centerY + outerR * Math.sin(startRad);
                                                const x2 = centerX + outerR * Math.cos(endRad);
                                                const y2 = centerY + outerR * Math.sin(endRad);

                                                const x3 = centerX + innerR * Math.cos(endRad);
                                                const y3 = centerY + innerR * Math.sin(endRad);
                                                const x4 = centerX + innerR * Math.cos(startRad);
                                                const y4 = centerY + innerR * Math.sin(startRad);

                                                const largeArc = endAngle - startAngle > 180 ? 1 : 0;

                                                return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
                                            };

                                            return (
                                                <View style={styles.matchupPredictorContent}>
                                                    <View style={{ flexDirection: 'row', gap: 16 }}>
                                                        {/* Left side - Away team */}
                                                        <View style={styles.matchupPredictorSide}>
                                                            <Text style={[styles.matchupPredictorPercent, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                                {awayPercent.toFixed(1)}%
                                                            </Text>
                                                        </View>

                                                        {/* Right side - Home team */}
                                                        <View style={styles.matchupPredictorSide}>
                                                            <Text style={[styles.matchupPredictorPercent, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                                {homePercent.toFixed(1)}%
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    {/* Center - Donut Chart */}
                                                    <View style={styles.matchupPredictorChart}>
                                                        <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
                                                            <Defs>
                                                                <Pattern id="stripesPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                                                    <Rect width="4" height="8" fill={isDark ? '#FFFFFF' : '#000000'} opacity="0.4" />
                                                                </Pattern>
                                                            </Defs>

                                                            {/* Home team segment */}
                                                            <Path
                                                                d={createArc(homeStartAngle, homeEndAngle, innerRadius, radius)}
                                                                fill={homeColor}
                                                                stroke={isDark ? '#4B5563' : '#9CA3AF'}
                                                                strokeWidth="1"
                                                            />

                                                            {/* Away team segment */}
                                                            <Path
                                                                d={createArc(awayStartAngle, awayEndAngle, innerRadius, radius)}
                                                                fill={awayColor}
                                                                stroke={isDark ? '#4B5563' : '#9CA3AF'}
                                                                strokeWidth="1"
                                                            />

                                                            {/* Center circle for logos */}
                                                            <Circle
                                                                cx={centerX}
                                                                cy={centerY}
                                                                r={innerRadius}
                                                                fill={isDark ? '#1A1D21' : '#FFFFFF'}
                                                            />

                                                            {/* Tickers for the teams */}
                                                            <View style={styles.matchupPredictorTickers}>
                                                                <Ticker ticker={awayAbbr} color={awayColor} />
                                                                <Ticker ticker={homeAbbr} color={homeColor} />
                                                            </View>
                                                        </Svg>
                                                    </View>
                                                </View>
                                            );
                                        })()}
                                    </View>
                                )}
                            </>
                        )}
                    </GlassCard>
                </View>

                <PredictionMarkets />

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
    tradeHistoryList: {
        marginTop: 8,
    },
    tradeHistoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    tradeHistoryItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.2)',
    },
    tradeHistoryItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    tradeHistoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tradeHistoryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    tradeHistoryInfo: {
        flex: 1,
    },
    tradeHistoryDate: {
        fontSize: 13,
        fontWeight: '500',
    },
    tradeHistoryItemRight: {
        alignItems: 'flex-end',
    },
    tradeHistoryQuantity: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    tradeHistoryTotal: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyTradeHistory: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyTradeHistoryTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    emptyTradeHistoryText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    emptyTradeHistoryCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#00C853',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyTradeHistoryCTAText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    gameOddsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    predictionMarketsHeader: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 8,
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    draftkingsBranding: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    predictionMarketsContainer: {
        gap: 12,
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginVertical: 8,
    },
    predictionMarketItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        width: '100%',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
    },
    draftkingsText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    gameTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    gameTime: {
        fontSize: 14,
        fontWeight: '500',
    },
    oddsLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    oddsLoadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyOddsState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyOddsTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    emptyOddsText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },
    oddsTable: {
        marginTop: 8,
    },
    oddsTableHeader: {
        flexDirection: 'row',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.2)',
        marginBottom: 12,
    },
    oddsTableHeaderTeam: {
        flex: 2,
    },
    oddsTableHeaderText: {
        flex: 1,
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    oddsTableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 6,
        borderBottomColor: 'rgba(156, 163, 175, 0.1)',
    },
    oddsTableTeamCell: {
        flex: 2,
        justifyContent: 'center',
    },
    oddsTableTeamName: {
        fontSize: 14,
        fontWeight: '600',
    },
    oddsTableCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 6,
    },
    oddsTableCellHighlighted: {
        backgroundColor: 'rgba(156, 163, 175, 0.15)',
    },
    oddsTableValue: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    oddsTablePrice: {
        fontSize: 12,
        fontWeight: '500',
    },
    matchupPredictorContainer: {
        marginTop: 16,
    },
    matchupPredictorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    matchupPredictorContent: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    matchupPredictorSide: {
        flex: 1,
        alignItems: 'center',
    },
    matchupPredictorPercent: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    matchupPredictorTeamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    matchupPredictorAbbr: {
        fontSize: 16,
        fontWeight: '600',
    },
    matchupPredictorIndicator: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    matchupPredictorChart: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    matchupPredictorTickers: {
        position: 'absolute',
        flexDirection: 'row',
        top: 135,
        left: 92,
        zIndex: 1000,
        gap: 8,
    },
    matchupPredictorSource: {
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 8,
    },
});
