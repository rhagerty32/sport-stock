import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useLocation } from '@/hooks/useLocation';
import { portfolio, positions, stocks, transactions, user } from '@/lib/dummy-data';
import { useSettingsStore } from '@/stores/settingsStore';
import { useStockStore } from '@/stores/stockStore';
import { useWalletStore } from '@/stores/walletStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { isDark } = useTheme();
    const { lightImpact, mediumImpact } = useHaptics();
    const router = useRouter();
    const { setProfileBottomSheetOpen, setLightDarkBottomSheetOpen, setPurchaseFanCoinsBottomSheetOpen, setWalletSystemBottomSheetOpen, setActiveTransaction, setTransactionDetailBottomSheetOpen } = useStockStore();
    const { wallet, initializeWallet, loadWallet } = useWalletStore();
    const { resetOnboarding } = useSettingsStore();
    const { locationInfo, loading: locationLoading } = useLocation();

    // Get user's transactions (userID = 1) and sort by date (most recent first)
    const userTransactions = useMemo(() => {
        return transactions
            .filter(t => t.userID === 1)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, []);

    // Get first 5 transactions for preview
    const recentTransactions = useMemo(() => {
        return userTransactions.slice(0, 5);
    }, [userTransactions]);

    // Calculate all-time winnings from transaction history
    const allTimeWinnings = useMemo(() => {
        // Track buy transactions per stock (FIFO queue)
        const buyQueues: Record<number, Array<{ quantity: number; price: number }>> = {};
        let realizedGains = 0;

        // Process all transactions chronologically
        const sortedTransactions = [...userTransactions].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );

        for (const transaction of sortedTransactions) {
            if (transaction.action === 'buy') {
                // Add to buy queue
                if (!buyQueues[transaction.stockID]) {
                    buyQueues[transaction.stockID] = [];
                }
                buyQueues[transaction.stockID].push({
                    quantity: transaction.quantity,
                    price: transaction.price,
                });
            } else if (transaction.action === 'sell') {
                // Match sell to buys (FIFO)
                const buyQueue = buyQueues[transaction.stockID] || [];
                let remainingSellQuantity = transaction.quantity;

                while (remainingSellQuantity > 0 && buyQueue.length > 0) {
                    const buy = buyQueue[0];
                    const quantityToMatch = Math.min(remainingSellQuantity, buy.quantity);
                    const gain = (transaction.price - buy.price) * quantityToMatch;
                    realizedGains += gain;

                    remainingSellQuantity -= quantityToMatch;
                    buy.quantity -= quantityToMatch;

                    if (buy.quantity <= 0) {
                        buyQueue.shift();
                    }
                }
            }
        }

        // Add current unrealized gains
        return realizedGains + portfolio.totalGainLoss;
    }, [userTransactions, portfolio.totalGainLoss]);

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

    const accountActions = [
        { title: 'Buy Gold Coins', icon: 'add-circle-outline', color: '#00C853', action: () => setPurchaseFanCoinsBottomSheetOpen(true) },
        { title: 'How It Works', icon: 'information-circle-outline', color: '#00C853', action: () => setWalletSystemBottomSheetOpen(true) },
    ];

    const settingsSections = [
        {
            title: 'Account',
            items: [
                { title: 'Profile', iconName: 'person-outline' },
                { title: 'Light/Dark Mode', iconName: 'moon-outline' },
                { title: 'Reset Onboarding', iconName: 'refresh-outline' },
            ]
        },
        {
            title: 'Help & Support',
            items: [
                { title: 'Help Center', iconName: 'help-circle-outline' },
                { title: 'Contact Support', iconName: 'chatbubble-outline' },
                { title: 'Terms of Service', iconName: 'document-text-outline' },
                { title: 'Privacy Policy', iconName: 'shield-outline' },
            ]
        },
    ];

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.profileContent}>
                        <View style={[styles.profilePhoto, { backgroundColor: '#00C853' }]}>
                            <Text style={styles.profileInitials}>
                                {user.firstName[0]}{user.lastName[0]}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                {`${user.firstName} ${user.lastName}`}
                            </Text>
                            <Text style={[styles.profileEmail, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                {user.email}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* My Holdings Visual */}
                <View style={styles.holdingsContainer}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        My Stash
                    </Text>
                    <GlassCard style={styles.holdingsCard}>
                        <View style={styles.holdingsContent}>
                            {(() => {
                                // Limit to max 9 teams
                                const displayPositions = positions.slice(0, 9);

                                // Calculate dynamic column count (max 3 columns)
                                const getColumnCount = (count: number): number => {
                                    if (count <= 1) return 1;
                                    if (count === 2) return 2;
                                    if (count === 3) return 3;
                                    if (count === 4) return 2;
                                    return 3; // 5-9 teams use 3 columns
                                };

                                const columnCount = getColumnCount(displayPositions.length);
                                const itemWidthPercent = 100 / columnCount;

                                // Calculate portfolio percentages for all positions
                                const positionsWithPercentages = displayPositions.map((position) => {
                                    const portfolioPercentage = portfolio.totalValue > 0
                                        ? (position.currentValue / portfolio.totalValue) * 100
                                        : 0;
                                    return { position, portfolioPercentage };
                                });

                                return (
                                    <View style={styles.holdingsGrid}>
                                        {positionsWithPercentages.map(({ position, portfolioPercentage }) => {
                                            const borderColor = position.gainLossPercentage >= 0 ? '#00C853' : '#dc2626';
                                            const teamColor = position.colors[0]?.hex || '#00C853';
                                            const isPositive = position.gainLossPercentage >= 0;
                                            const trendIcon = isPositive ? 'trending-up' : 'trending-down';

                                            return (
                                                <View
                                                    key={position.stock.id}
                                                    style={[styles.holdingItem, { width: `${itemWidthPercent}%` }]}
                                                >
                                                    <View style={[
                                                        styles.holdingLogo,
                                                        {
                                                            backgroundColor: teamColor,
                                                            borderWidth: 3,
                                                            borderColor: borderColor,
                                                        }
                                                    ]}>
                                                        <Text style={styles.holdingLogoText}>
                                                            {position.stock.name.split(' ').map(word => word[0]).join('')}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.holdingPercentageContainer}>
                                                        <Ionicons
                                                            name={trendIcon as any}
                                                            size={12}
                                                            color={borderColor}
                                                            style={styles.trendIcon}
                                                        />
                                                        <Text style={[styles.holdingPercentage, { color: borderColor }]}>
                                                            {formatPercentage(position.gainLossPercentage)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })()}
                        </View>
                    </GlassCard>
                </View>

                {/* Account Metrics */}
                <View style={styles.metricsContainer}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Stats
                    </Text>
                    <View style={styles.metricsGrid}>
                        <GlassCard style={styles.metricCard}>
                            <View style={styles.metricContent}>
                                <Text
                                    numberOfLines={2}
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.8}
                                    style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                                >
                                    Current Winnings
                                </Text>
                                <Text
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.6}
                                    numberOfLines={1}
                                    style={[styles.metricValue, { color: isDark ? '#FFFFFF' : '#000000' }]}
                                >
                                    {formatCurrency(portfolio.totalGainLoss)}
                                </Text>
                            </View>
                        </GlassCard>
                        <GlassCard style={styles.metricCard}>
                            <View style={styles.metricContent}>
                                <Text
                                    numberOfLines={1}
                                    style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                                >
                                    Up %
                                </Text>
                                <Text
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.6}
                                    numberOfLines={1}
                                    style={[
                                        styles.metricValue,
                                        { color: portfolio.totalGainLossPercentage >= 0 ? '#00C853' : '#dc2626' }
                                    ]}
                                >
                                    {formatPercentage(portfolio.totalGainLossPercentage)}
                                </Text>
                            </View>
                        </GlassCard>
                        <GlassCard style={styles.metricCard}>
                            <View style={styles.metricContent}>
                                <Text
                                    numberOfLines={2}
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.8}
                                    style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                                >
                                    All-Time Winnings
                                </Text>
                                <Text
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.6}
                                    numberOfLines={1}
                                    style={[styles.metricValue, { color: isDark ? '#FFFFFF' : '#000000' }]}
                                >
                                    {formatCurrency(allTimeWinnings)}
                                </Text>
                            </View>
                        </GlassCard>
                    </View>
                </View>

                {/* Account Actions */}
                <View style={styles.actionsContainer}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Quick Actions
                    </Text>
                    <View style={styles.actionsGrid}>
                        {accountActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.actionButton}
                                onPress={() => {
                                    mediumImpact();
                                    if (action.action) {
                                        action.action();
                                    }
                                }}
                            >
                                <GlassCard style={styles.actionCard}>
                                    <View style={styles.actionContent}>
                                        <Ionicons name={action.icon as any} size={24} color={action.color} />
                                        <Text style={[styles.actionTitle, { color: action.color }]}>
                                            {action.title}
                                        </Text>
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Trade History */}
                {userTransactions.length > 0 && (
                    <View style={styles.tradeHistoryContainer}>
                        <TouchableOpacity
                            style={styles.tradeHistoryHeader}
                            onPress={() => {
                                lightImpact();
                                router.push('/profile/trade-history');
                            }}
                        >
                            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                Trade History
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        </TouchableOpacity>
                        <GlassCard style={styles.tradeHistoryCard}>
                            {recentTransactions.map((transaction, index) => {
                                const stock = stocks.find(s => s.id === transaction.stockID);
                                return (
                                    <TouchableOpacity
                                        key={transaction.id}
                                        style={[
                                            styles.tradeHistoryItem,
                                            index < recentTransactions.length - 1 && styles.tradeHistoryItemBorder
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
                                                <Text style={[styles.tradeHistoryStockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                    {stock?.name || 'Unknown'}
                                                </Text>
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
                                );
                            })}
                        </GlassCard>
                    </View>
                )}

                {/* Settings Sections */}
                <View style={styles.settingsContainer}>
                    {settingsSections.map((section, sectionIndex) => (
                        <View key={sectionIndex} style={styles.settingsSection}>
                            <Text style={[styles.settingsSectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                {section.title === 'Account' ? 'Account' : section.title === 'Help & Support' ? 'Help' : section.title}
                            </Text>
                            <GlassCard style={styles.settingsCard} padding={8}>
                                {section.items.map((item, itemIndex) => (
                                    <TouchableOpacity
                                        key={itemIndex}
                                        style={[
                                            styles.settingsItem,
                                            itemIndex < section.items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: isDark ? '#242428' : '#E5E7EB' } : {},
                                        ]}
                                        onPress={async () => {
                                            lightImpact()
                                            if (item.title === 'Light/Dark Mode') {
                                                setLightDarkBottomSheetOpen(true);
                                            } else if (item.title === 'Profile') {
                                                setProfileBottomSheetOpen(true);
                                            } else if (item.title === 'Reset Onboarding') {
                                                await resetOnboarding();
                                                mediumImpact();
                                            } else if (item.title === 'Help Center') {
                                                Linking.openURL('https://thesportstock.com/help-center');
                                            } else if (item.title === 'Contact Support') {
                                                Linking.openURL('https://thesportstock.com/contact-support');
                                            } else if (item.title === 'Terms of Service') {
                                                Linking.openURL('https://thesportstock.com/terms-of-service');
                                            } else if (item.title === 'Privacy Policy') {
                                                Linking.openURL('https://thesportstock.com/privacy-policy');
                                            }
                                        }}
                                    >
                                        <View style={styles.settingsItemContent}>
                                            {/* Icon rendered directly */}
                                            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                <Ionicons
                                                    name={item.iconName as any}
                                                    size={24}
                                                    color={isDark ? "#FFFFFF" : "#000000"}
                                                />
                                            </View>
                                            <Text style={[styles.settingsItemTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                {item.title}
                                            </Text>
                                            <View style={{ flex: 1 }} />
                                            <Text style={[styles.settingsItemChevron, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                ›
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </GlassCard>
                        </View>
                    ))}
                </View>

                {/* Location Information */}
                <View style={styles.locationContainer}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Location
                    </Text>
                    <GlassCard style={styles.locationCard}>
                        {locationLoading ? (
                            <View style={styles.locationLoading}>
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                                <Text style={[styles.locationText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Detecting location...
                                </Text>
                            </View>
                        ) : locationInfo ? (
                            <View style={styles.locationContent}>
                                {locationInfo.ipAddress && (
                                    <View style={styles.locationRow}>
                                        <Ionicons
                                            name="globe-outline"
                                            size={16}
                                            color={isDark ? '#9CA3AF' : '#6B7280'}
                                            style={styles.locationIcon}
                                        />
                                        <Text style={[styles.locationLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            IP Address:
                                        </Text>
                                        <Text style={[styles.locationValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                            {locationInfo.ipAddress}
                                        </Text>
                                    </View>
                                )}
                                {locationInfo.coordinates && (
                                    <View style={styles.locationRow}>
                                        <Ionicons
                                            name="location-outline"
                                            size={16}
                                            color={isDark ? '#9CA3AF' : '#6B7280'}
                                            style={styles.locationIcon}
                                        />
                                        <Text style={[styles.locationLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            Coordinates:
                                        </Text>
                                        <Text style={[styles.locationValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                            {locationInfo.coordinates.latitude.toFixed(4)}, {locationInfo.coordinates.longitude.toFixed(4)}
                                        </Text>
                                    </View>
                                )}
                                {locationInfo.state && (
                                    <View style={styles.locationRow}>
                                        <Ionicons
                                            name="map-outline"
                                            size={16}
                                            color={isDark ? '#9CA3AF' : '#6B7280'}
                                            style={styles.locationIcon}
                                        />
                                        <Text style={[styles.locationLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            State:
                                        </Text>
                                        <Text style={[styles.locationValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                            {locationInfo.state}
                                        </Text>
                                    </View>
                                )}
                                {locationInfo.error && (
                                    <View style={styles.locationRow}>
                                        <Ionicons
                                            name="warning-outline"
                                            size={16}
                                            color="#dc2626"
                                            style={styles.locationIcon}
                                        />
                                        <Text style={[styles.locationError, { color: '#dc2626' }]}>
                                            {locationInfo.error}
                                        </Text>
                                    </View>
                                )}
                                {locationInfo.coordinates && !locationInfo.state && (
                                    <View style={styles.locationRow}>
                                        <Ionicons
                                            name="information-circle-outline"
                                            size={16}
                                            color={isDark ? '#9CA3AF' : '#6B7280'}
                                            style={styles.locationIcon}
                                        />
                                        <Text style={[styles.locationText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            State not available. Check Mapbox token in .env file.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={styles.locationErrorContainer}>
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={16}
                                    color="#dc2626"
                                    style={styles.locationIcon}
                                />
                                <Text style={[styles.locationError, { color: '#dc2626' }]}>
                                    Unable to retrieve location information
                                </Text>
                            </View>
                        )}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    settingsButton: {
        padding: 8,
    },
    settingsIcon: {
        fontSize: 20,
    },
    profileHeader: {
        paddingHorizontal: 20,
        marginBottom: 24,
        marginTop: 84,
    },
    profileCard: {
        minHeight: 200,
    },
    profileContent: {
        alignItems: 'center',
        gap: 16,
    },
    profilePhoto: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitials: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    profileInfo: {
        alignItems: 'center',
        gap: 4,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileEmail: {
        fontSize: 14,
    },
    walletBalanceContainer: {
        width: '100%',
        marginTop: 8,
    },
    holdingsContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    holdingsCard: {
        minHeight: 120,
    },
    holdingsContent: {
        flex: 1,
    },
    holdingsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    holdingItem: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    holdingLogo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    holdingLogoText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    holdingPercentageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        gap: 4,
    },
    trendIcon: {
        marginRight: 2,
    },
    holdingPercentage: {
        fontSize: 11,
        fontWeight: '600',
    },
    metricsContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    metricCard: {
        width: '31%',
        minHeight: 80,
    },
    metricContent: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 4,
        width: '100%',
    },
    metricLabel: {
        fontSize: 11,
        textAlign: 'center',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        flexShrink: 1,
        width: '100%',
    },
    actionsContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        width: '100%',
    },
    actionCard: {
        minHeight: 80,
    },
    actionContent: {
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        fontSize: 24,
    },
    actionTitle: {
        fontSize: 12,
        fontWeight: '500',
    },
    settingsContainer: {
        paddingHorizontal: 20,
    },
    settingsSection: {
        marginBottom: 20,
    },
    settingsSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    settingsCard: {
        minHeight: 60,
    },
    settingsContent: {
        gap: 0,
    },
    settingsItem: {
        paddingVertical: 8,
        paddingHorizontal: 0,
        marginHorizontal: 8,
    },
    settingsItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingsItemIcon: {
        fontSize: 18,
    },
    settingsItemTitle: {
        fontSize: 16,
    },
    settingsItemChevron: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    bottomSpacing: {
        height: 100,
    },
    tradeHistoryContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    tradeHistoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tradeHistoryCard: {
        minHeight: 60,
    },
    tradeHistoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
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
    tradeHistoryStockName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    tradeHistoryDate: {
        fontSize: 12,
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
    locationContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    locationCard: {
        minHeight: 60,
    },
    locationLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    locationContent: {
        paddingVertical: 8,
        paddingHorizontal: 8,
        gap: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationIcon: {
        marginRight: 4,
    },
    locationLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    locationValue: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    locationError: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    locationErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        gap: 8,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '500',
    },
});
