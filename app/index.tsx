import Chart from '@/components/chart';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHaptics } from '@/hooks/useHaptics';
import { liveGames, newsItems, portfolio } from '@/lib/dummy-data';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { lightImpact } = useHaptics();

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
                        border={false}
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

                {/* Live Games */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Live Games
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {liveGames.map((game) => (
                            <GlassCard key={game.id} style={styles.gameCard}>
                                <View style={styles.gameContent}>
                                    <Text style={[styles.gameLeague, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        {game.league}
                                    </Text>
                                    <Text style={[styles.gameTeams, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {game.awayTeam} @ {game.homeTeam}
                                    </Text>
                                    <View style={styles.gameScoreContainer}>
                                        <Text style={[styles.gameScore, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                            {game.awayScore} - {game.homeScore}
                                        </Text>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: game.status === 'live' ? '#217C0A' : game.status === 'upcoming' ? '#6B7280' : '#9CA3AF' }
                                        ]}>
                                            <Text style={styles.statusText}>
                                                {game.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </GlassCard>
                        ))}
                    </ScrollView>
                </View>

                {/* News Feed */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Latest News
                    </Text>
                    {newsItems.slice(0, 3).map((news) => (
                        <GlassCard key={news.id} style={styles.newsCard}>
                            <View style={styles.newsContent}>
                                <Text style={[styles.newsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {news.title}
                                </Text>
                                <Text style={[styles.newsDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {news.content}
                                </Text>
                                <View style={styles.newsMeta}>
                                    <Text style={[styles.newsSource, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        {news.source}
                                    </Text>
                                    <Text style={[styles.newsSeparator, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        •
                                    </Text>
                                    <Text style={[styles.newsDate, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        {news.createdAt.toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        </GlassCard>
                    ))}
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
});
