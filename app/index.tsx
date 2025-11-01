import Chart from '@/components/chart';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { portfolio, userPortfolios, users } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Friend item component with image error handling
function FriendItem({ user, portfolio, isDark, onPress, formatCurrency, formatPercentage }: {
    user: typeof users[0];
    portfolio: typeof userPortfolios[1];
    isDark: boolean;
    onPress: (userId: number) => void;
    formatCurrency: (amount: number) => string;
    formatPercentage: (percentage: number) => string;
}) {
    const [imageError, setImageError] = useState(false);
    const isPublic = user.public;

    return (
        <TouchableOpacity
            onPress={() => onPress(user.id)}
            style={styles.friendItem}
        >
            <View style={styles.friendHeader}>
                {imageError || !user.photoURL ? (
                    <View style={[styles.friendAvatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#3A3A3C' : '#E5E7EB' }]}>
                        <Ionicons
                            name="person"
                            size={25}
                            color={isDark ? '#9CA3AF' : '#6B7280'}
                        />
                    </View>
                ) : (
                    <Image
                        source={{ uri: user.photoURL }}
                        style={styles.friendAvatar}
                        onError={() => setImageError(true)}
                    />
                )}
                <View style={styles.friendInfo}>
                    <Text style={[styles.friendName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        {user.firstName} {user.lastName}
                    </Text>
                    <Text style={[styles.friendEmail, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {user.email}
                    </Text>
                </View>
            </View>

            {isPublic && (
                <View style={styles.friendPortfolio}>
                    <View style={styles.friendPortfolioRow}>
                        <Text style={[styles.friendPortfolioLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            Portfolio Value
                        </Text>
                        <Text style={[styles.friendPortfolioValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            {formatCurrency(portfolio.totalValue)}
                        </Text>
                    </View>
                    <View style={styles.friendPortfolioRow}>
                        <Text style={[styles.friendPortfolioLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            Gain/Loss
                        </Text>
                        <Text
                            style={[
                                styles.friendPortfolioValue,
                                { color: portfolio.totalGainLoss >= 0 ? '#217C0A' : '#dc2626' }
                            ]}
                        >
                            {formatCurrency(portfolio.totalGainLoss)} ({formatPercentage(portfolio.totalGainLossPercentage)})
                        </Text>
                    </View>
                    <View style={styles.friendPositions}>
                        <Text style={[styles.friendPositionsLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            Holdings: {portfolio.positions.length} positions
                        </Text>
                    </View>
                </View>
            )}

            {!isPublic && (
                <View style={styles.friendPrivate}>
                    <Text style={[styles.friendPrivateText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        Portfolio is private
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function HomeScreen() {
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const router = useRouter();
    const [activePage, setActivePage] = useState(0);
    const pageCount = Math.ceil(portfolio.positions.length / 3);
    const { setActiveStockId, friends, setActiveUserId } = useStockStore();

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

    const handleUserPress = (userId: number) => {
        lightImpact();
        setActiveUserId(userId);
    };

    // Get friends' data
    const friendsData = friends
        .map(userId => {
            const user = users.find(u => u.id === userId);
            const userPortfolio = userPortfolios[userId];
            return user && userPortfolio ? { user, portfolio: userPortfolio } : null;
        })
        .filter((item): item is { user: typeof users[0]; portfolio: typeof userPortfolios[1] } => item !== null);

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Text style={[styles.logo, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            SportStock
                        </Text>
                        <Text style={[styles.balance, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            {formatCurrency(120.00)}
                        </Text>
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
                                Portfolio Value
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
                                My Investments
                            </Text>

                            {/* Investment Overview */}
                            <View style={styles.investmentOverview}>
                                <View style={styles.investmentLeft}>
                                    <Text style={[styles.investmentAmount, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(portfolio.totalInvested)}
                                    </Text>
                                    <Text style={[styles.investmentLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Invested
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
                                        Gain/Loss
                                    </Text>
                                </View>
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />

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
                            <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />

                            {/* Stocks Owned Section */}
                            <View style={styles.stocksOwnedHeader}>
                                <View style={styles.stocksOwnedLeft}>
                                    <Text style={[styles.stocksOwnedTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        Stocks Owned
                                    </Text>
                                    <Text style={[styles.stocksOwnedSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        My Total Investment Value
                                    </Text>
                                </View>
                                <View style={[styles.sortButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
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
                                                <View style={[styles.stockValue, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
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

                {/* Friends Section */}
                {friendsData.length > 0 && (
                    <View style={styles.section}>
                        <GlassCard style={styles.friendsCard} padding={0}>
                            <View style={styles.friendsContent}>
                                <Text style={[styles.friendsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Friends ({friendsData.length})
                                </Text>

                                <FlatList
                                    data={friendsData}
                                    renderItem={({ item }) => (
                                        <FriendItem
                                            user={item.user}
                                            portfolio={item.portfolio}
                                            isDark={isDark}
                                            onPress={handleUserPress}
                                            formatCurrency={formatCurrency}
                                            formatPercentage={formatPercentage}
                                        />
                                    )}
                                    keyExtractor={(item) => item.user.id.toString()}
                                    scrollEnabled={false}
                                    ItemSeparatorComponent={() => (
                                        <View style={[styles.friendSeparator, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                                    )}
                                />
                            </View>
                        </GlassCard>
                    </View>
                )}

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
    balance: {
        fontSize: 16,
        fontWeight: '500',
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
    // Friends Section Styles
    friendsCard: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    friendsContent: {
        paddingVertical: 20,
    },
    friendsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    friendItem: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    friendHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    friendAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    friendEmail: {
        fontSize: 14,
    },
    friendPortfolio: {
        marginTop: 8,
    },
    friendPortfolioRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    friendPortfolioLabel: {
        fontSize: 14,
    },
    friendPortfolioValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    friendPositions: {
        marginTop: 4,
    },
    friendPositionsLabel: {
        fontSize: 12,
    },
    friendPrivate: {
        marginTop: 8,
        paddingVertical: 8,
    },
    friendPrivateText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    friendSeparator: {
        height: 1,
        marginHorizontal: 20,
    },
});
