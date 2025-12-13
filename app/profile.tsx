import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { portfolio, positions, user } from '@/lib/dummy-data';
import { useSettingsStore } from '@/stores/settingsStore';
import { useStockStore } from '@/stores/stockStore';
import { useWalletStore } from '@/stores/walletStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { isDark } = useTheme();
    const { lightImpact, mediumImpact } = useHaptics();
    const { setProfileBottomSheetOpen, setLightDarkBottomSheetOpen, setPurchaseFanCoinsBottomSheetOpen, setWalletSystemBottomSheetOpen } = useStockStore();
    const { wallet, initializeWallet, loadWallet } = useWalletStore();
    const { resetOnboarding } = useSettingsStore();

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
                                <Text style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Total Winnings
                                </Text>
                                <Text style={[styles.metricValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatCurrency(portfolio.totalGainLoss)}
                                </Text>
                            </View>
                        </GlassCard>
                        <GlassCard style={styles.metricCard}>
                            <View style={styles.metricContent}>
                                <Text style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Up %
                                </Text>
                                <Text
                                    style={[
                                        styles.metricValue,
                                        { color: portfolio.totalGainLossPercentage >= 0 ? '#00C853' : '#dc2626' }
                                    ]}
                                >
                                    {formatPercentage(portfolio.totalGainLossPercentage)}
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
    },
    metricCard: {
        width: '48%',
        minHeight: 80,
    },
    metricContent: {
        alignItems: 'center',
        gap: 8,
    },
    metricLabel: {
        fontSize: 12,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: 'bold',
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
        marginBottom: 24,
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
});
