import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { leagues, userPortfolios, users } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type UserBottomSheetProps = {
    userBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function UserBottomSheet({ userBottomSheetRef }: UserBottomSheetProps) {
    const { activeUserId, setActiveUserId, setActiveStockId } = useStockStore();
    const { isDark } = useTheme();
    const { selection } = useHaptics();
    const [imageError, setImageError] = useState(false);

    // Reset image error when user changes
    useEffect(() => {
        setImageError(false);
    }, [activeUserId]);

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

    // Find the user by ID from the store
    const user = users.find(u => u.id === activeUserId);
    const portfolio = user ? userPortfolios[activeUserId!] : null;

    // Don't render anything if no user is selected
    if (!activeUserId || !user) {
        return null;
    }

    const isPublic = user.public;
    const displayPositions = portfolio?.positions || [];

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

    const handleStockPress = (stockId: number) => {
        selection();
        setActiveStockId(stockId);
        setActiveUserId(null); // Close user sheet when opening stock sheet
    };


    const renderPositionCard = ({ item: position }: { item: typeof displayPositions[0] }) => {
        const league = leagues.find(l => l.id === position.stock.leagueID);

        return (
            <TouchableOpacity
                onPress={() => handleStockPress(position.stock.id)}
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
                                <Text style={[styles.leagueName, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {league?.name}
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
        <BottomSheetModal
            ref={userBottomSheetRef}
            onDismiss={() => setActiveUserId(null)}
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
                <View style={[styles.header, { backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                    <View style={styles.headerContent}>
                        <View style={styles.userInfo}>
                            {imageError || !user.photoURL ? (
                                <View style={[styles.userAvatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#2F2F2F' : '#E5E7EB' }]}>
                                    <Ionicons
                                        name="person"
                                        size={30}
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
                            <View style={styles.userDetails}>
                                <Text style={[styles.userName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {user.firstName} {user.lastName}
                                </Text>
                                <Text style={[styles.userEmail, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {user.email}
                                </Text>
                                <View style={[
                                    styles.publicBadge,
                                    { backgroundColor: isPublic ? (isDark ? 'rgba(33, 124, 10, 0.2)' : 'rgba(33, 124, 10, 0.1)') : (isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.1)') }
                                ]}>
                                    <Text style={[
                                        styles.publicBadgeText,
                                        { color: isPublic ? '#217C0A' : '#dc2626' }
                                    ]}>
                                        {isPublic ? 'Public Bag' : 'Private Bag'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Portfolio Summary - only show if public */}
                {isPublic && portfolio && (
                    <>
                        <View style={styles.portfolioSummary}>
                            <View style={styles.summaryCard}>
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
                        </View>
                    </>
                )}

                {/* Positions Section */}
                <View style={styles.positionsSection}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        {isPublic ? 'Stash' : 'Bets'} ({displayPositions.length})
                    </Text>

                    {displayPositions.length > 0 ? (
                        <FlatList
                            data={displayPositions}
                            renderItem={renderPositionCard}
                            keyExtractor={(item) => item.stock.id.toString()}
                            scrollEnabled={false}
                            contentContainerStyle={styles.positionsList}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyStateText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                No bets found
                            </Text>
                        </View>
                    )}
                </View>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        borderRadius: 25,
    },
    header: {
        padding: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    userDetails: {
        flex: 1,
        gap: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        marginBottom: 8,
    },
    publicBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    publicBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    portfolioSummary: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
    },
    summaryCard: {
        gap: 16,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    summaryGainLoss: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryGainLossText: {
        fontSize: 16,
        fontWeight: '500',
    },
    summaryStats: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 8,
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
    positionsSection: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    positionsList: {
        gap: 12,
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
    leagueName: {
        fontSize: 14,
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
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
    },
    bottomSpacing: {
        height: 50,
    },
});

