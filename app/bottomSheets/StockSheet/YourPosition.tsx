import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { Position } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatCurrency, formatPercentage } from './utils';

export const YourPosition = ({ userPosition, currentPrice }: { userPosition: Position, currentPrice: number }) => {
    const { isDark } = useTheme();
    return (
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
    );
};

const styles = StyleSheet.create({
    currentPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
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
    }
});