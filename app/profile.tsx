import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { portfolio, positions, user } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { useWalletStore } from '@/stores/walletStore';
import { useSettingsStore } from '@/stores/settingsStore';
import WalletBalance from '@/components/wallet/WalletBalance';
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
        { title: 'Buy Gold Coins', icon: 'add-circle-outline', color: '#217C0A', action: () => setPurchaseFanCoinsBottomSheetOpen(true) },
        { title: 'How It Works', icon: 'information-circle-outline', color: '#217C0A', action: () => setWalletSystemBottomSheetOpen(true) },
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
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Profile
                    </Text>
                </View>

                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <GlassCard style={styles.profileCard}>
                        <View style={styles.profileContent}>
                            <View style={[styles.profilePhoto, { backgroundColor: '#217C0A' }]}>
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
                            <View style={styles.walletBalanceContainer}>
                                <WalletBalance showFanCoins={true} size="medium" />
                            </View>
                        </View>
                    </GlassCard>
                </View>

                {/* My Holdings Visual */}
                <View style={styles.holdingsContainer}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        My Stash
                    </Text>
                    <GlassCard style={styles.holdingsCard}>
                        <View style={styles.holdingsContent}>
                            <View style={styles.holdingsGrid}>
                                {(() => {
                                    // Calculate portfolio percentages for all positions
                                    const positionsWithPercentages = positions.slice(0, 6).map((position) => {
                                        const portfolioPercentage = portfolio.totalValue > 0 
                                            ? (position.currentValue / portfolio.totalValue) * 100 
                                            : 0;
                                        return { position, portfolioPercentage };
                                    });
                                    
                                    // Find min and max percentages to normalize
                                    const percentages = positionsWithPercentages.map(p => p.portfolioPercentage);
                                    const minPercent = Math.min(...percentages);
                                    const maxPercent = Math.max(...percentages);
                                    const percentRange = maxPercent - minPercent || 1; // Avoid division by zero
                                    
                                    // Size range: 30px to 80px for more noticeable differences
                                    const minSize = 30;
                                    const maxSize = 80;
                                    
                                    return positionsWithPercentages.map(({ position, portfolioPercentage }, index) => {
                                        // Normalize percentage to 0-1 range, then scale to size range
                                        // This ensures the smallest holding is minSize and largest is maxSize
                                        const normalizedPercent = percentRange > 0 
                                            ? (portfolioPercentage - minPercent) / percentRange 
                                            : 0.5;
                                        
                                        // Use square root for more pronounced differences
                                        const bubbleSize = minSize + Math.sqrt(normalizedPercent) * (maxSize - minSize);
                                        
                                        // Font size scales with bubble size
                                        const fontSize = Math.max(10, Math.min(18, bubbleSize * 0.25));
                                        
                                        return (
                                            <View key={position.stock.id} style={styles.holdingItem}>
                                                <View style={[
                                                    styles.holdingLogo,
                                                    {
                                                        width: bubbleSize,
                                                        height: bubbleSize,
                                                        borderRadius: bubbleSize / 2,
                                                        backgroundColor: position.gainLossPercentage >= 0 ? '#217C0A' : '#dc2626',
                                                        opacity: Math.abs(position.gainLossPercentage) / 10 + 0.3
                                                    }
                                                ]}>
                                                    <Text style={[styles.holdingLogoText, { fontSize }]}>
                                                        {position.stock.name.split(' ').map(word => word[0]).join('')}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.holdingPercentage, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                    {formatPercentage(portfolioPercentage)}
                                                </Text>
                                            </View>
                                        );
                                    });
                                })()}
                                {positions.length > 6 && (
                                    <TouchableOpacity
                                        style={styles.seeAllButton}
                                        onPress={() => lightImpact()}
                                    >
                                        <Text style={[styles.seeAllText, { color: '#217C0A' }]}>
                                            See All
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
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
                                        { color: portfolio.totalGainLossPercentage >= 0 ? '#217C0A' : '#dc2626' }
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
                                            itemIndex < section.items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: isDark ? '#262626' : '#E5E7EB' } : {},
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
        justifyContent: 'space-between',
    },
    holdingItem: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 16,
    },
    holdingLogo: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    holdingLogoText: {
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    holdingPercentage: {
        fontSize: 12,
        fontWeight: '500',
    },
    seeAllButton: {
        width: '30%',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '500',
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
