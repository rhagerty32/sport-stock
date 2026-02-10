import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader } from '@/components/AppHeader';
import { Ticker } from '@/components/Ticker';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useLocation } from '@/hooks/useLocation';
import { portfolio, positions, stocks, transactions, user } from '@/lib/dummy-data';
import { useSettingsStore } from '@/stores/settingsStore';
import { useStockStore } from '@/stores/stockStore';
import { useWalletStore } from '@/stores/walletStore';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PROFILE_IMAGE_STORAGE_KEY = '@sportstock_profile_image_uri';
const PROFILE_IMAGE_FILENAME = 'profile.jpg';

export default function ProfileScreen() {
    const Color = useColors();
    const { isDark } = useTheme();
    const { lightImpact, mediumImpact } = useHaptics();
    const router = useRouter();
    const { setProfileBottomSheetOpen, setLightDarkBottomSheetOpen, setPurchaseFanCoinsBottomSheetOpen, setWalletSystemBottomSheetOpen, setActiveTransaction, setTransactionDetailBottomSheetOpen, setActivePosition, setPositionDetailBottomSheetOpen } = useStockStore();
    const { wallet, initializeWallet, loadWallet } = useWalletStore();
    const { resetOnboarding } = useSettingsStore();
    const { locationInfo, loading: locationLoading } = useLocation();
    const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

    // Load persisted profile image on mount
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
                if (saved) {
                    const exists = await FileSystem.getInfoAsync(saved);
                    if (exists.exists) setProfileImageUri(saved);
                    else await AsyncStorage.removeItem(PROFILE_IMAGE_STORAGE_KEY);
                }
            } catch {
                // ignore
            }
        })();
    }, []);

    const pickProfileImage = useCallback(async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;
            mediumImpact();
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (result.canceled || !result.assets?.[0]?.uri) return;
            const docDir = FileSystem.documentDirectory;
            if (!docDir) return;
            const uri = result.assets[0].uri;
            const dest = `${docDir}${PROFILE_IMAGE_FILENAME}`;
            await FileSystem.copyAsync({ from: uri, to: dest });
            await AsyncStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, dest);
            setProfileImageUri(dest);
        } catch {
            // ignore
        }
    }, [mediumImpact]);

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
        { title: 'Buy Gold Coins', icon: 'add-circle-outline', color: Color.green, action: () => setPurchaseFanCoinsBottomSheetOpen(true) },
        { title: 'How It Works', icon: 'information-circle-outline', color: Color.green, action: () => setWalletSystemBottomSheetOpen(true) },
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
            <AppHeader />
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 120 }}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.profileContent}>
                        <TouchableOpacity
                            style={[styles.profilePhoto, !profileImageUri && { backgroundColor: Color.green }]}
                            onPress={pickProfileImage}
                            activeOpacity={0.8}
                        >
                            {profileImageUri ? (
                                <Image
                                    source={{ uri: profileImageUri }}
                                    style={styles.profilePhotoImage}
                                />
                            ) : (
                                <Text style={styles.profileInitials}>
                                    {user.firstName[0]}{user.lastName[0]}
                                </Text>
                            )}
                        </TouchableOpacity>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: Color.baseText }]}>
                                {`${user.firstName} ${user.lastName}`}
                            </Text>
                            <Text style={[styles.profileEmail, { color: Color.subText }]}>
                                {user.email}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* My Stash - team rows with Ticker, name, gain/loss */}
                <View style={styles.holdingsContainer}>
                    <View style={styles.holdingsSectionHeader}>
                        <Text style={[styles.sectionTitle, { color: Color.baseText }]}>
                            My Stash
                        </Text>
                        {positions.length > 6 && (
                            <TouchableOpacity
                                onPress={() => {
                                    lightImpact();
                                    router.push('/profile/my-stash');
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={[styles.seeAllText, { color: Color.green }]}>See all</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <GlassCard style={styles.holdingsCard} padding={0}>
                        <View style={styles.holdingsContent}>
                            {positions.slice(0, 6).map((position, index) => {
                                const teamColor = position.stock.color || position.colors[0]?.hex || Color.green;
                                const gainLossColor = position.totalGainLoss >= 0 ? Color.green : Color.red;
                                const isLast = index === Math.min(5, positions.length - 1);

                                return (
                                    <TouchableOpacity
                                        key={position.stock.id}
                                        style={[
                                            styles.stashRow,
                                            !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? '#242428' : '#E5E7EB' },
                                        ]}
                                        onPress={() => {
                                            mediumImpact();
                                            setActivePosition(position);
                                            setPositionDetailBottomSheetOpen(true);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ticker ticker={position.stock.ticker} color={teamColor} size="small" />
                                        <Text style={[styles.stashRowName, { color: Color.baseText }]} numberOfLines={1}>
                                            {position.stock.name}
                                        </Text>
                                        <Text style={[styles.stashRowGainLoss, { color: gainLossColor }]}>
                                            {position.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(position.totalGainLoss)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </GlassCard>
                </View>

                {/* Account Metrics */}
                <View style={styles.metricsContainer}>
                    <View style={styles.metricsGrid}>
                        <GlassCard style={styles.metricCard}>
                            <View style={styles.metricContent}>
                                <Text
                                    numberOfLines={2}
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.8}
                                    style={[styles.metricLabel, { color: Color.subText }]}
                                >
                                    Portfolio Value
                                </Text>
                                <Text
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.6}
                                    numberOfLines={1}
                                    style={[styles.metricValue, { color: Color.baseText }]}
                                >
                                    {formatCurrency(portfolio.totalGainLoss)}
                                </Text>
                            </View>
                        </GlassCard>
                        <GlassCard style={styles.metricCard}>
                            <View style={styles.metricContent}>
                                <Text
                                    numberOfLines={1}
                                    style={[styles.metricLabel, { color: Color.subText }]}
                                >
                                    Up %
                                </Text>
                                <Text
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.6}
                                    numberOfLines={1}
                                    style={[
                                        styles.metricValue,
                                        { color: portfolio.totalGainLossPercentage >= 0 ? Color.green : Color.red }
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
                                    style={[styles.metricLabel, { color: Color.subText }]}
                                >
                                    All-Time Winnings
                                </Text>
                                <Text
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.6}
                                    numberOfLines={1}
                                    style={[styles.metricValue, { color: Color.baseText }]}
                                >
                                    {formatCurrency(allTimeWinnings)}
                                </Text>
                            </View>
                        </GlassCard>
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
                            <Text style={[styles.sectionTitle, { color: Color.baseText }]}>
                                Trade History
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={Color.subText} />
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
                                                    { color: transaction.action === 'buy' ? Color.green : Color.red }
                                                ]}>
                                                    {transaction.action === 'buy' ? 'BUY' : 'SELL'}
                                                </Text>
                                            </View>
                                            <View style={styles.tradeHistoryInfo}>
                                                <Text style={[styles.tradeHistoryStockName, { color: Color.baseText }]}>
                                                    {stock?.name || 'Unknown'}
                                                </Text>
                                                <Text style={[styles.tradeHistoryDate, { color: Color.subText }]}>
                                                    {transaction.createdAt.toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.tradeHistoryItemRight}>
                                            <Text style={[styles.tradeHistoryQuantity, { color: Color.baseText }]}>
                                                {transaction.quantity.toFixed(1)} entries
                                            </Text>
                                            <Text style={[styles.tradeHistoryTotal, { color: Color.baseText }]}>
                                                {formatCurrency(transaction.totalPrice)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </GlassCard>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                    <Text style={[styles.sectionTitle, { color: Color.baseText }]}>
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
                            <Text style={[styles.settingsSectionTitle, { color: Color.baseText }]}>
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
                                            <Text style={[styles.settingsItemTitle, { color: Color.baseText }]}>
                                                {item.title}
                                            </Text>
                                            <View style={{ flex: 1 }} />
                                            <Text style={[styles.settingsItemChevron, { color: Color.subText }]}>
                                                ›
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </GlassCard>
                        </View>
                    ))}
                </View>

                {/* Location Information (dev only) */}
                {__DEV__ && (
                    <View style={styles.locationContainer}>
                        <Text style={[styles.sectionTitle, { color: Color.baseText }]}>
                            Location
                        </Text>
                        <GlassCard style={styles.locationCard}>
                            {locationLoading ? (
                                <View style={styles.locationLoading}>
                                    <ActivityIndicator size="small" color={Color.baseText} />
                                    <Text style={[styles.locationText, { color: Color.subText }]}>
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
                                                color={Color.subText}
                                                style={styles.locationIcon}
                                            />
                                            <Text style={[styles.locationLabel, { color: Color.subText }]}>
                                                IP Address:
                                            </Text>
                                            <Text style={[styles.locationValue, { color: Color.baseText }]}>
                                                {locationInfo.ipAddress}
                                            </Text>
                                        </View>
                                    )}
                                    {locationInfo.coordinates && (
                                        <View style={styles.locationRow}>
                                            <Ionicons
                                                name="location-outline"
                                                size={16}
                                                color={Color.subText}
                                                style={styles.locationIcon}
                                            />
                                            <Text style={[styles.locationLabel, { color: Color.subText }]}>
                                                Coordinates:
                                            </Text>
                                            <Text style={[styles.locationValue, { color: Color.baseText }]}>
                                                {locationInfo.coordinates.latitude.toFixed(4)}, {locationInfo.coordinates.longitude.toFixed(4)}
                                            </Text>
                                        </View>
                                    )}
                                    {locationInfo.state && (
                                        <View style={styles.locationRow}>
                                            <Ionicons
                                                name="map-outline"
                                                size={16}
                                                color={Color.subText}
                                                style={styles.locationIcon}
                                            />
                                            <Text style={[styles.locationLabel, { color: Color.subText }]}>
                                                State:
                                            </Text>
                                            <Text style={[styles.locationValue, { color: Color.baseText }]}>
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
                                            <Text style={[styles.locationError, { color: Color.red }]}>
                                                {locationInfo.error}
                                            </Text>
                                        </View>
                                    )}
                                    {locationInfo.coordinates && !locationInfo.state && (
                                        <View style={styles.locationRow}>
                                            <Ionicons
                                                name="information-circle-outline"
                                                size={16}
                                                color={Color.subText}
                                                style={styles.locationIcon}
                                            />
                                            <Text style={[styles.locationText, { color: Color.subText }]}>
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
                                    <Text style={[styles.locationError, { color: Color.red }]}>
                                        Unable to retrieve location information
                                    </Text>
                                </View>
                            )}
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
        overflow: 'hidden',
    },
    profilePhotoImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
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
    holdingsSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 15,
        fontWeight: '600',
    },
    holdingsCard: {
        minHeight: 120,
    },
    holdingsContent: {
        paddingVertical: 4,
    },
    stashRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    stashRowName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    stashRowGainLoss: {
        fontSize: 15,
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
        gap: 0,
    },
    metricCard: {
        width: '31%',
        minHeight: 80,
        padding: 0,
    },
    metricContent: {
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1,
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
        fontSize: 24,
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
