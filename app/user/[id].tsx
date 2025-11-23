import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { userPortfolios, users } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Position } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function UserPortfolioScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isDark } = useTheme();
    const { selection } = useHaptics();
    const { setActiveStockId } = useStockStore();
    const [imageError, setImageError] = useState(false);

    const userId = parseInt(id || '0', 10);
    const user = users.find(u => u.id === userId);
    const portfolio = userPortfolios[userId];

    // Reset image error when user changes
    React.useEffect(() => {
        setImageError(false);
    }, [userId]);

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

    if (!user) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        User not found
                    </Text>
                </View>
            </ThemedView>
        );
    }

    if (!portfolio) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        No bag data available
                    </Text>
                </View>
            </ThemedView>
        );
    }

    const isPublic = user.public;
    const displayPositions = portfolio.positions;

    const renderPositionCard = ({ item: position }: { item: Position }) => {
        return (
            <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                    setActiveStockId(position.stock.id);
                    selection();
                }}
            >
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
                                {isPublic ? (
                                    <>
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
                                    </>
                                ) : (
                                    <View style={styles.positionValue}>
                                        <Text style={[styles.positionShares, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            Stash not disclosed
                                        </Text>
                                    </View>
                                )}
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
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            router.back();
                            selection();
                        }}
                    >
                        <Text style={[styles.backButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            ← Back
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.userInfo}>
                        {imageError || !user.photoURL ? (
                            <View style={[styles.userAvatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#2F2F2F' : '#E5E7EB' }]}>
                                <Ionicons
                                    name="person"
                                    size={40}
                                    color={isDark ? '#9CA3AF' : '#6B7280'}
                                />
                            </View>
                        ) : (
                            <Image
                                source={{ uri: user.photoURL }}
                                style={styles.userAvatar}
                                onError={() => setImageError(true)}
                            />
                        )}
                        <Text style={[styles.userName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            {user.firstName} {user.lastName}
                        </Text>
                        <Text style={[styles.userEmail, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            {user.email}
                        </Text>
                        <View style={styles.publicBadge}>
                            <Text style={[
                                styles.publicBadgeText,
                                { color: isPublic ? '#217C0A' : '#dc2626' }
                            ]}>
                                {isPublic ? 'Public Bag' : 'Private Bag'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Portfolio Summary - only show if public */}
                {isPublic && (
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
                                            {portfolio.positions.reduce((sum, pos) => sum + pos.shares, 0).toFixed(1)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </GlassCard>
                    </View>
                )}

                {/* Positions List */}
                <View style={styles.positionsContainer}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        {isPublic ? 'Stash' : 'Bets'} ({displayPositions.length})
                    </Text>
                    <FlatList
                        data={displayPositions}
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
    backButton: {
        marginBottom: 16,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    userInfo: {
        alignItems: 'center',
        gap: 8,
    },
    userAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 8,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: 14,
    },
    publicBadge: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(33, 124, 10, 0.1)',
    },
    publicBadgeText: {
        fontSize: 12,
        fontWeight: '600',
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '500',
    },
    bottomSpacing: {
        height: 50,
    },
});

