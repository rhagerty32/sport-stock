import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHaptics } from '@/hooks/useHaptics';
import { portfolio, positions } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Position } from '@/types';
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function InvestingScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { selection } = useHaptics();
    const [sortBy, setSortBy] = useState<'value' | 'gainLoss' | 'alphabetical'>('value');
    const { setActiveStockId } = useStockStore();

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

    const sortedPositions = [...positions].sort((a, b) => {
        switch (sortBy) {
            case 'value':
                return b.currentValue - a.currentValue;
            case 'gainLoss':
                return b.gainLossPercentage - a.gainLossPercentage;
            case 'alphabetical':
                return a.stock.name.localeCompare(b.stock.name);
            default:
                return 0;
        }
    });

    const renderPositionCard = ({ item: position }: { item: Position }) => {
        return (
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveStockId(position.stock.id)}>
                <GlassCard style={styles.positionCard}>
                    <View style={styles.positionContent}>
                        <View style={styles.positionHeader}>
                            <View style={[styles.teamLogo, { backgroundColor: '#E5E7EB' }]}>
                                <Text style={styles.logoText}>
                                    {position.stock.name.split(' ').map(word => word[0]).join('')}
                                </Text>
                            </View>
                            <View style={styles.positionInfo}>
                                <Text style={[styles.positionName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {position.stock.name}
                                </Text>
                                <View style={styles.positionDetails}>
                                    <Text style={[styles.positionShares, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        {position.shares.toString()} shares
                                    </Text>
                                    <Text style={[styles.positionSeparator, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        •
                                    </Text>
                                    <Text style={[styles.positionAvgCost, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        {formatCurrency(position.avgCostPerShare)} avg
                                    </Text>
                                </View>
                                <View style={styles.positionValue}>
                                    <Text style={[styles.positionCurrentValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(position.currentValue)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.positionGainLoss,
                                            { color: position.gainLossPercentage >= 0 ? '#217C0A' : '#dc2626' }
                                        ]}
                                    >
                                        {formatPercentage(position.gainLossPercentage)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        My Bag
                    </Text>
                </View>

                {/* Portfolio Summary */}
                <View style={styles.summaryContainer}>
                    <GlassCard style={styles.summaryCard}>
                        <View style={styles.summaryContent}>
                            <Text style={[styles.summaryTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                Total Value
                            </Text>

                            <Text style={[styles.summaryValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                {formatCurrency(portfolio.totalValue)}
                            </Text>

                            <View style={styles.summaryGainLoss}>
                                <Text
                                    style={[
                                        styles.summaryGainLossText,
                                        { color: portfolio.totalGainLoss >= 0 ? '#217C0A' : '#dc2626' }
                                    ]}
                                >
                                    {formatCurrency(portfolio.totalGainLoss)}
                                </Text>
                                <Text
                                    style={[
                                        styles.summaryGainLossText,
                                        { color: portfolio.totalGainLoss >= 0 ? '#217C0A' : '#dc2626' }
                                    ]}
                                >
                                    ({formatPercentage(portfolio.totalGainLossPercentage)})
                                </Text>
                            </View>

                            {/* Portfolio Stats */}
                            <View style={styles.summaryStats}>
                                <View style={styles.summaryStatItem}>
                                    <Text style={[styles.summaryStatLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Total Put In
                                    </Text>
                                    <Text style={[styles.summaryStatValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(portfolio.totalInvested)}
                                    </Text>
                                </View>
                                <View style={styles.summaryStatItem}>
                                    <Text style={[styles.summaryStatLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Total Shares
                                    </Text>
                                    <Text style={[styles.summaryStatValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {positions.reduce((sum, pos) => sum + pos.shares, 0).toFixed(1)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </GlassCard>
                </View>

                {/* Sort Options */}
                <View style={styles.sortContainer}>
                    <Text style={[styles.sortLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        Sort by:
                    </Text>
                    <View style={styles.sortButtons}>
                                {[
                            { key: 'value', label: 'Value' },
                            { key: 'gainLoss', label: 'W/L' },
                            { key: 'alphabetical', label: 'Name' },
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.sortButton,
                                    sortBy === option.key && styles.activeSortButton,
                                    { backgroundColor: sortBy === option.key ? '#217C0A' : 'transparent' }
                                ]}
                                onPress={() => {
                                    setSortBy(option.key as any);
                                    selection();
                                }}
                            >
                                <Text style={[
                                    styles.sortButtonText,
                                    { color: sortBy === option.key ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Positions List */}
                <View style={styles.positionsContainer}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        My Bets ({positions.length})
                    </Text>
                    <FlatList
                        data={sortedPositions}
                        renderItem={renderPositionCard}
                        keyExtractor={(item) => item.stock.id.toString()}
                        scrollEnabled={false}
                        contentContainerStyle={styles.positionsList}
                    />
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    summaryContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    summaryCard: {
        minHeight: 200,
    },
    summaryContent: {
        flex: 1,
    },
    summaryTitle: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 16,
    },
    summaryValue: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    summaryGainLoss: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    summaryGainLossText: {
        fontSize: 16,
        fontWeight: '500',
    },
    summaryStats: {
        gap: 8,
    },
    summaryStatItem: {
        gap: 4,
    },
    summaryStatLabel: {
        fontSize: 12,
    },
    summaryStatValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sortLabel: {
        fontSize: 14,
        marginRight: 12,
    },
    sortButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeSortButton: {
        borderColor: '#217C0A',
    },
    sortButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    positionsContainer: {
        paddingHorizontal: 0,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    positionsList: {
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    positionCard: {
        marginBottom: 12,
    },
    positionContent: {
        flex: 1,
    },
    positionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    positionInfo: {
        flex: 1,
        gap: 4,
    },
    positionName: {
        fontSize: 16,
        fontWeight: '600',
    },
    positionDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    positionShares: {
        fontSize: 14,
    },
    positionSeparator: {
        fontSize: 14,
    },
    positionAvgCost: {
        fontSize: 14,
    },
    positionValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    positionCurrentValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    positionGainLoss: {
        fontSize: 14,
        fontWeight: '500',
    },
    teamLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6B7280',
    },
    chartContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    chartCard: {
        minHeight: 200,
    },
    chartContent: {
        alignItems: 'center',
        gap: 16,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    chartPlaceholder: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartPlaceholderText: {
        fontSize: 16,
        fontWeight: '500',
    },
    chartDescription: {
        fontSize: 14,
    },
    bottomSpacing: {
        height: 50,
    },
});
