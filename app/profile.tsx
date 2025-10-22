import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHaptics } from '@/hooks/useHaptics';
import { portfolio, positions, user } from '@/lib/dummy-data';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { lightImpact, mediumImpact } = useHaptics();

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
        { title: 'Deposit', icon: '💰', color: '#217C0A' },
        { title: 'Withdraw', icon: '💸', color: '#dc2626' },
        { title: 'Transfer', icon: '🔄', color: '#6B7280' },
        { title: 'Statements', icon: '📄', color: '#6B7280' },
    ];

    const settingsSections = [
        {
            title: 'Account',
            items: [
                { title: 'Personal Information', iconName: 'person-outline' }
            ]
        },
        {
            title: 'Appearance',
            items: [
                { title: 'Light/Dark Mode', iconName: 'moon-outline' },
                { title: 'Haptics', iconName: 'phone-portrait-outline' },
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
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => lightImpact()}
                    >
                        <Text style={[styles.settingsIcon, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            ⚙️
                        </Text>
                    </TouchableOpacity>
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
                            <View style={[styles.accountBadge, { backgroundColor: '#217C0A' }]}>
                                <Text style={styles.accountBadgeText}>Premium Account</Text>
                            </View>
                            <Text style={[styles.cashBalance, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                {`Cash Balance: ${formatCurrency(120.00)}`}
                            </Text>
                        </View>
                    </GlassCard>
                </View>

                {/* My Holdings Visual */}
                <View style={styles.holdingsContainer}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        My Holdings
                    </Text>
                    <GlassCard style={styles.holdingsCard}>
                        <View style={styles.holdingsContent}>
                            <View style={styles.holdingsGrid}>
                                {positions.slice(0, 6).map((position, index) => (
                                    <View key={position.stock.id} style={styles.holdingItem}>
                                        <View style={[
                                            styles.holdingLogo,
                                            {
                                                backgroundColor: position.gainLossPercentage >= 0 ? '#217C0A' : '#dc2626',
                                                opacity: Math.abs(position.gainLossPercentage) / 10 + 0.3
                                            }
                                        ]}>
                                            <Text style={styles.holdingLogoText}>
                                                {position.stock.name.split(' ').map(word => word[0]).join('')}
                                            </Text>
                                        </View>
                                        <Text style={[styles.holdingPercentage, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            {formatPercentage(position.gainLossPercentage)}
                                        </Text>
                                    </View>
                                ))}
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
                        Account Metrics
                    </Text>
                    <View style={styles.metricsGrid}>
                        <GlassCard style={styles.metricCard}>
                            <View style={styles.metricContent}>
                                <Text style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Total Gains
                                </Text>
                                <Text style={[styles.metricValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatCurrency(portfolio.totalGainLoss)}
                                </Text>
                            </View>
                        </GlassCard>
                        <GlassCard style={styles.metricCard}>
                            <View style={styles.metricContent}>
                                <Text style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Current % Gain
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
                        Account Actions
                    </Text>
                    <View style={styles.actionsGrid}>
                        {accountActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.actionButton}
                                onPress={() => mediumImpact()}
                            >
                                <GlassCard style={styles.actionCard}>
                                    <View style={styles.actionContent}>
                                        <Text style={styles.actionIcon}>{action.icon}</Text>
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
                                {section.title}
                            </Text>
                            <GlassCard style={styles.settingsCard}>
                                <View style={styles.settingsContent}>
                                    {section.items.map((item, itemIndex) => (
                                        <TouchableOpacity
                                            key={itemIndex}
                                            style={[
                                                styles.settingsItem,
                                                itemIndex < section.items.length - 1 && styles.settingsItemBorder
                                            ]}
                                            onPress={() => lightImpact()}
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
                                </View>
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
    accountBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    accountBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cashBalance: {
        fontSize: 16,
        fontWeight: '500',
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
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    holdingLogoText: {
        fontSize: 16,
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
    },
    actionButton: {
        width: '23%',
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
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    settingsItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
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
