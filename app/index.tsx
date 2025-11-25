import Chart from '@/components/chart';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { portfolio } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { useWalletStore } from '@/stores/walletStore';
import WalletBalance from '@/components/wallet/WalletBalance';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function HomeScreen() {
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const router = useRouter();
    const [activePage, setActivePage] = useState(0);
    const pageCount = Math.ceil(portfolio.positions.length / 3);
    const { setActiveStockId, setPurchaseFanCoinsBottomSheetOpen } = useStockStore();
    const { wallet, loadWallet, initializeWallet } = useWalletStore();

    // Initialize wallet on mount
    useEffect(() => {
        const DUMMY_USER_ID = 1;
        initializeWallet();
        if (!wallet) {
            loadWallet(DUMMY_USER_ID);
        }
    }, []);

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

    const handlePageChange = (page: number) => {
        setActivePage(Math.round(page / (styles.stockPage.width + (styles.stockPage.marginRight / 2))));
    };

    const handleStockPress = (stockId: number) => {
        lightImpact();
        setActiveStockId(stockId);
    };


    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Text style={[styles.logo, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            SportStock
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setPurchaseFanCoinsBottomSheetOpen(true);
                                lightImpact();
                            }}
                        >
                            {wallet ? (
                                <View style={styles.balanceContainer}>
                                    <Text style={[styles.balance, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(wallet.tradingCredits)}
                                    </Text>
                                    <Text style={[styles.balanceLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        SportCash (SC)
                                    </Text>
                                </View>
                            ) : (
                                <Text style={[styles.balance, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Loading...
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Portfolio Summary Card */}
                <View style={styles.cardContainer}>
                    <GlassCard
                        style={styles.portfolioCard}
                        standard={false}
                        padding={0}
                        fullWidth={true}
                    >
                        <View style={styles.portfolioContent}>
                            <Text style={[styles.portfolioTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                Total Value
                            </Text>

                            <Text style={[styles.portfolioValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                {formatCurrency(portfolio.totalValue)}
                            </Text>

                            <View style={styles.portfolioStats}>
                                <Text
                                    style={[
                                        styles.portfolioGainLoss,
                                        { color: portfolio.totalGainLoss >= 0 ? '#00C853' : '#FF1744' }
                                    ]}
                                >
                                    {formatCurrency(portfolio.totalGainLoss)}
                                </Text>
                                <Text
                                    style={[
                                        styles.portfolioGainLoss,
                                        { color: portfolio.totalGainLoss >= 0 ? '#00C853' : '#FF1744' }
                                    ]}
                                >
                                    ({formatPercentage(portfolio.totalGainLossPercentage)})
                                </Text>
                                <Text style={[styles.portfolioToday, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Today
                                </Text>
                            </View>

                            <Chart stockId={1} color="#00C853" />
                        </View>
                    </GlassCard>
                </View>

                {/* My Investments Card */}
                <View style={styles.section}>
                    <GlassCard style={styles.investmentsCard} padding={0}>
                        <View style={styles.investmentsContent}>
                            {/* My Investments Header */}
                            <Text style={[styles.investmentsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                My Bets
                            </Text>

                            {/* Investment Overview */}
                            <View style={styles.investmentOverview}>
                                <View style={styles.investmentLeft}>
                                    <Text style={[styles.investmentAmount, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(portfolio.totalInvested)}
                                    </Text>
                                    <Text style={[styles.investmentLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Put In
                                    </Text>
                                </View>
                                <View style={styles.investmentRight}>
                                    <Text style={[
                                        styles.investmentAmount,
                                        { color: portfolio.totalGainLoss >= 0 ? '#00C853' : '#FF1744' }
                                    ]}>
                                        {formatCurrency(portfolio.totalGainLoss)}
                                    </Text>
                                    <Text style={[styles.investmentLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        W/L
                                    </Text>
                                </View>
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]} />

                            {/* Summary Details */}
                            <View style={styles.summaryDetails}>
                                <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Total Value $
                                </Text>
                                <Text style={[styles.summaryValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatCurrency(portfolio.totalValue)}
                                </Text>
                            </View>
                            <View style={styles.summaryDetails}>
                                <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Total Gain %
                                </Text>
                                <Text style={[
                                    styles.summaryValue,
                                    { color: portfolio.totalGainLossPercentage >= 0 ? '#00C853' : '#FF1744' }
                                ]}>
                                    {formatPercentage(portfolio.totalGainLossPercentage)}
                                </Text>
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]} />

                            {/* Stocks Owned Section */}
                            <View style={styles.stocksOwnedHeader}>
                                <View style={styles.stocksOwnedLeft}>
                                <Text style={[styles.stocksOwnedTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Teams Backed
                                </Text>
                                <Text style={[styles.stocksOwnedSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Total Bag Value
                                </Text>
                                </View>
                                <View style={[styles.sortButton, { backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                                    <Text style={[styles.sortButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        Sort by
                                    </Text>
                                </View>
                            </View>

                            {/* Stock List - Horizontal Scrollable */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled
                                snapToInterval={styles.stockPage.width + (styles.stockPage.marginRight / 2)}
                                snapToAlignment="center"
                                decelerationRate="fast"
                                onScroll={(event) => handlePageChange(event.nativeEvent.contentOffset.x)}
                                style={styles.stockScrollView}
                                contentContainerStyle={styles.stockScrollContent}
                            >
                                {Array.from({ length: Math.ceil(portfolio.positions.length / 3) }, (_, pageIndex) => (
                                    <View key={pageIndex} style={styles.stockPage}>
                                        {portfolio.positions.slice(pageIndex * 3, (pageIndex + 1) * 3).map((position) => (
                                            <TouchableOpacity
                                                key={position.stock.id}
                                                style={styles.stockItem}
                                                onPress={() => {
                                                    console.log('TouchableOpacity pressed for stock:', position.stock.id);
                                                    console.log('About to call handleStockPress...');
                                                    handleStockPress(position.stock.id);
                                                    console.log('handleStockPress called');
                                                }}
                                                activeOpacity={0.7}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <View style={styles.stockIcon}>
                                                    <Text style={styles.stockIconText}>
                                                        {position.stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.stockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                    {position.stock.name}
                                                </Text>
                                                <View style={[styles.stockValue, { backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                                                    <Text style={[styles.stockValueText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        {formatCurrency(position.currentValue)}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                            </ScrollView>

                            {/* Pagination Dots */}
                            <View style={styles.paginationDots}>
                                {Array.from({ length: pageCount }, (_, index) => (
                                    <View key={index} style={[styles.paginationDot, { backgroundColor: activePage === index ? '#777' : '#ccc' }]} />
                                ))}
                            </View>
                        </View>
                    </GlassCard>
                </View>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    balanceContainer: {
        alignItems: 'flex-end',
    },
    balance: {
        fontSize: 16,
        fontWeight: '600',
    },
    balanceLabel: {
        fontSize: 11,
        fontWeight: '400',
        marginTop: 2,
    },
    cardContainer: {
        marginBottom: 24,
    },
    portfolioCard: {
        minHeight: 200,
    },
    portfolioContent: {
        flex: 1,
        alignItems: 'center',
    },
    portfolioTitle: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 16,
    },
    portfolioValue: {
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    portfolioStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    portfolioGainLoss: {
        fontSize: 16,
        fontWeight: '500',
        marginRight: 8,
    },
    portfolioToday: {
        fontSize: 14,
        marginLeft: 8,
    },
    timePeriodContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    timeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    timeButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    horizontalScroll: {
        paddingLeft: 20,
    },
    gameCard: {
        width: 200,
        marginRight: 16,
        marginBottom: 16,
    },
    gameContent: {
        flex: 1,
    },
    gameLeague: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    gameTeams: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    gameScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    gameScore: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    newsCard: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    newsContent: {
        flex: 1,
    },
    newsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    newsDescription: {
        fontSize: 14,
        marginBottom: 8,
    },
    newsMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    newsSource: {
        fontSize: 12,
    },
    newsSeparator: {
        fontSize: 12,
    },
    newsDate: {
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    bottomSpacing: {
        height: 100,
    },
    // Investments Card Styles
    investmentsCard: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    investmentsContent: {
        paddingVertical: 20,
    },
    investmentsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    investmentOverview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    investmentLeft: {
        alignItems: 'flex-start',
    },
    investmentRight: {
        alignItems: 'flex-end',
    },
    investmentAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    investmentLabel: {
        fontSize: 14,
        fontWeight: '400',
    },
    divider: {
        height: 1,
        marginVertical: 16,
        paddingHorizontal: 20,
    },
    summaryDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '400',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    stocksOwnedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    stocksOwnedLeft: {
        flex: 1,
    },
    stocksOwnedTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    stocksOwnedSubtitle: {
        fontSize: 12,
        fontWeight: '400',
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    sortButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    stockScrollView: {
        marginBottom: 16,
    },
    stockScrollContent: {
        paddingHorizontal: 0,
    },
    stockPage: {
        width: 360, // Width of each page (card width minus padding)
        marginRight: 20,
        paddingHorizontal: 20
    },
    stockItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        minHeight: 50,
        paddingVertical: 8,
    },
    stockIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stockIconText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stockName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    stockValue: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stockValueText: {
        fontSize: 12,
        fontWeight: '500',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6B7280',
        marginHorizontal: 4,
    },
});
