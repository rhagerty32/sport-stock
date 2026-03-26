import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { Ticker } from '@/components/Ticker';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useLocation } from '@/hooks/useLocation';
import { fetchStock, stocksKeys } from '@/lib/stocks-api';
import { usePortfolio } from '@/lib/portfolio-api';
import { useTransactions } from '@/lib/transactions-api';
import { useWallet } from '@/lib/wallet-api';
import { getProfileHeaderDisplay } from '@/lib/user-display';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PROFILE_IMAGE_STORAGE_KEY = '@sportstock_profile_image_uri';
const PROFILE_IMAGE_FILENAME = 'profile.jpg';

export default function ProfileScreen() {
    const Color = useColors();
    const { isDark } = useTheme();
    const { lightImpact, mediumImpact } = useHaptics();
    const router = useRouter();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const authUser = useAuthStore((s) => s.user);
    const signOut = useAuthStore((s) => s.signOut);
    const { setProfileBottomSheetOpen, setLightDarkBottomSheetOpen, setPurchaseFanCoinsBottomSheetOpen, setWalletSystemBottomSheetOpen, setActiveTransaction, setTransactionDetailBottomSheetOpen, setActivePosition, setPositionDetailBottomSheetOpen, setLoginBottomSheetOpen } = useStockStore();
    const { data: wallet } = useWallet(isAuthenticated && authUser?.id ? authUser.id : null);
    const {
        data: portfolio,
        isPending: portfolioPending,
        isFetching: portfolioFetching,
        isError: portfolioQueryError,
        refetch: refetchPortfolio,
    } = usePortfolio();

    const showPortfolioSkeleton =
        isAuthenticated && portfolio == null && (portfolioPending || portfolioFetching);
    const portfolioLoadError =
        isAuthenticated && portfolio == null && portfolioQueryError && !portfolioPending && !portfolioFetching;
    const skeletonBg = isDark ? '#2C2C32' : '#E5E7EB';
    const { data: transactionsData } = useTransactions(
        isAuthenticated && authUser?.id ? { limit: 100 } : undefined
    );
    const transactions = transactionsData?.transactions ?? [];
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

    const userTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [transactions]);

    const recentTransactions = useMemo(() => userTransactions.slice(0, 5), [userTransactions]);

    const positionStockIds = useMemo(
        () => new Set((portfolio?.positions ?? []).map((p) => p.stock.id)),
        [portfolio?.positions]
    );

    const missingStockIds = useMemo(
        () =>
            [...new Set(recentTransactions.map((t) => t.stockID))].filter((id) => !positionStockIds.has(id)),
        [recentTransactions, positionStockIds]
    );

    const stockQueries = useQueries({
        queries: missingStockIds.map((id) => ({
            queryKey: stocksKeys.detail(id),
            queryFn: () => fetchStock(id),
        })),
    });

    const stockNameCache = useMemo(() => {
        const map: Record<number, string> = {};
        stockQueries.forEach((q, i) => {
            const id = missingStockIds[i];
            const stock = q.data;
            if (id != null && stock)
                map[id] = stock.name ?? stock.fullName ?? `Stock #${id}`;
        });
        return map;
    }, [missingStockIds, stockQueries]);

    const getStockName = useCallback(
        (stockID: number) => {
            const fromPosition = (portfolio?.positions ?? []).find((p) => p.stock.id === stockID)?.stock.name;
            if (fromPosition) return fromPosition;
            if (stockNameCache[stockID]) return stockNameCache[stockID];
            return `Stock #${stockID}`;
        },
        [portfolio?.positions, stockNameCache]
    );

    const allTimeWinnings = useMemo(() => {
        const buyQueues: Record<number, Array<{ quantity: number; price: number }>> = {};
        let realizedGains = 0;
        const sortedTransactions = [...userTransactions].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        for (const transaction of sortedTransactions) {
            if (transaction.action === 'buy') {
                if (!buyQueues[transaction.stockID]) buyQueues[transaction.stockID] = [];
                buyQueues[transaction.stockID].push({ quantity: transaction.quantity, price: transaction.price });
            } else if (transaction.action === 'sell') {
                const buyQueue = buyQueues[transaction.stockID] || [];
                let remainingSellQuantity = transaction.quantity;
                while (remainingSellQuantity > 0 && buyQueue.length > 0) {
                    const buy = buyQueue[0];
                    const quantityToMatch = Math.min(remainingSellQuantity, buy.quantity);
                    realizedGains += (transaction.price - buy.price) * quantityToMatch;
                    remainingSellQuantity -= quantityToMatch;
                    buy.quantity -= quantityToMatch;
                    if (buy.quantity <= 0) buyQueue.shift();
                }
            }
        }
        return realizedGains + (portfolio?.totalGainLoss ?? 0);
    }, [userTransactions, portfolio?.totalGainLoss]);

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

    const profileHeader = useMemo(() => getProfileHeaderDisplay(authUser), [authUser]);

    const accountActions = [
        { title: 'Buy Gold Coins', icon: 'add-circle-outline', color: Color.green, action: () => setPurchaseFanCoinsBottomSheetOpen(true) },
        { title: 'How It Works', icon: 'information-circle-outline', color: Color.green, action: () => setWalletSystemBottomSheetOpen(true) },
    ];

    const accountItems = [
        { title: 'Profile', iconName: 'person-outline' as const },
        { title: 'Light/Dark Mode', iconName: 'moon-outline' as const },
        ...(isAuthenticated ? [{ title: 'Reset Onboarding', iconName: 'refresh-outline' as const }] : []),
        ...(isAuthenticated ? [{ title: 'Log out', iconName: 'log-out-outline' as const }] : []),
    ];
    const settingsSections = [
        {
            title: 'Account',
            items: accountItems,
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
                {/* Profile Header: guest + Login CTA when logged out, full header when logged in */}
                <View style={styles.profileHeader}>
                    {isAuthenticated ? (
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
                                    <Text style={styles.profileInitials}>{profileHeader.avatarInitials}</Text>
                                )}
                            </TouchableOpacity>
                            <View style={styles.profileInfo}>
                                <Text style={[styles.profileName, { color: Color.baseText }]}>
                                    {profileHeader.title}
                                </Text>
                                {profileHeader.subtitle ? (
                                    <Text
                                        style={[styles.profileEmail, { color: Color.subText }]}
                                        numberOfLines={2}
                                        selectable
                                    >
                                        {profileHeader.subtitle}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.profileContent}>
                            <View style={[styles.profilePhoto, { backgroundColor: isDark ? '#3a3a3a' : '#E5E7EB' }]}>
                                <Ionicons name="person-outline" size={40} color={Color.subText} />
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={[styles.profileName, { color: Color.baseText }]}>
                                    Profile
                                </Text>
                                <Text style={[styles.profileEmail, { color: Color.subText }]}>
                                    Log in to access your portfolio and settings
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.loginButton, { backgroundColor: Color.green }]}
                                onPress={() => {
                                    lightImpact();
                                    setLoginBottomSheetOpen(true);
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.loginButtonText}>Log in</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* My Stash - only when logged in */}
                {isAuthenticated && (
                    <View style={styles.holdingsContainer}>
                        <View style={styles.holdingsSectionHeader}>
                            <Text style={[styles.sectionTitle, { color: Color.baseText }]}>
                                My Stash
                            </Text>
                            {!showPortfolioSkeleton && (portfolio?.positions?.length ?? 0) > 6 && (
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
                                {portfolioLoadError ? (
                                    <View style={styles.stashLoadError}>
                                        <Text style={[styles.metricsErrorText, { color: Color.subText }]}>
                                            {"Couldn't load stash"}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                lightImpact();
                                                refetchPortfolio();
                                            }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Text style={[styles.metricsRetryText, { color: Color.green }]}>Tap to retry</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : showPortfolioSkeleton ? (
                                    <View style={styles.stashSkeleton}>
                                        {[0, 1, 2].map((i) => (
                                            <View key={i} style={styles.stashSkeletonRow}>
                                                <View style={[styles.stashSkeletonBar, { backgroundColor: skeletonBg, width: 32 }]} />
                                                <View style={[styles.stashSkeletonBar, { backgroundColor: skeletonBg, flex: 1, marginHorizontal: 12 }]} />
                                                <View style={[styles.stashSkeletonBar, { backgroundColor: skeletonBg, width: 56 }]} />
                                            </View>
                                        ))}
                                    </View>
                                ) : (portfolio?.positions?.length ?? 0) === 0 ? (
                                    <EmptyState
                                        icon="wallet-outline"
                                        title="No positions yet"
                                        subtitle="Buy stocks to see your stash here."
                                        actionLabel="Browse stocks"
                                        onAction={() => router.push('/(tabs)/search')}
                                        style={styles.stashEmptyState}
                                    />
                                ) : (
                                    (portfolio?.positions ?? []).slice(0, 6).map((position, index) => {
                                        const teamColor = position.stock.color || position.colors[0]?.hex || Color.green;
                                        const gainLossColor = position.totalGainLoss >= 0 ? Color.green : Color.red;
                                        const isLast = index === Math.min(5, (portfolio?.positions?.length ?? 0) - 1);

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
                                    })
                                )}
                            </View>
                        </GlassCard>
                    </View>
                )}

                {/* Account Metrics - only when logged in */}
                {isAuthenticated && (
                <View style={styles.metricsContainer}>
                    {portfolioLoadError ? (
                        <View style={styles.metricsError}>
                            <Text style={[styles.metricsErrorText, { color: Color.subText }]}>
                                {"Couldn't load portfolio metrics"}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    lightImpact();
                                    refetchPortfolio();
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={[styles.metricsRetryText, { color: Color.green }]}>Tap to retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
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
                                {showPortfolioSkeleton ? (
                                    <View style={[styles.metricSkeletonBar, { backgroundColor: skeletonBg }]} />
                                ) : portfolio != null ? (
                                    <Text
                                        adjustsFontSizeToFit={true}
                                        minimumFontScale={0.6}
                                        numberOfLines={1}
                                        style={[styles.metricValue, { color: Color.baseText }]}
                                    >
                                        {formatCurrency(portfolio.totalGainLoss)}
                                    </Text>
                                ) : null}
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
                                {showPortfolioSkeleton ? (
                                    <View style={[styles.metricSkeletonBar, { backgroundColor: skeletonBg, width: '55%' }]} />
                                ) : portfolio != null ? (
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
                                ) : null}
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
                                {showPortfolioSkeleton ? (
                                    <View style={[styles.metricSkeletonBar, { backgroundColor: skeletonBg }]} />
                                ) : portfolio != null ? (
                                    <Text
                                        adjustsFontSizeToFit={true}
                                        minimumFontScale={0.6}
                                        numberOfLines={1}
                                        style={[styles.metricValue, { color: Color.baseText }]}
                                    >
                                        {formatCurrency(allTimeWinnings)}
                                    </Text>
                                ) : null}
                            </View>
                        </GlassCard>
                    </View>
                    )}
                </View>
                )}

                {/* Trade History - only when logged in */}
                {isAuthenticated && userTransactions.length > 0 && (
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
                            {recentTransactions.length === 0 ? (
                                <EmptyState
                                    icon="receipt-outline"
                                    title="No transactions yet"
                                    subtitle="Your buy and sell history will appear here."
                                    actionLabel="View all"
                                    onAction={() => router.push('/(tabs)/profile/trade-history')}
                                />
                            ) : recentTransactions.map((transaction, index) => (
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
                                                    {getStockName(transaction.stockID)}
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
                                ))}
                        </GlassCard>
                    </View>
                )}

                {/* Quick Actions - only when logged in */}
                {isAuthenticated && (
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
                )}

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
                                            lightImpact();
                                            if (item.title === 'Light/Dark Mode') {
                                                setLightDarkBottomSheetOpen(true);
                                            } else if (item.title === 'Profile') {
                                                setProfileBottomSheetOpen(true);
                                            } else if (item.title === 'Reset Onboarding') {
                                                await resetOnboarding();
                                                mediumImpact();
                                            } else if (item.title === 'Log out') {
                                                signOut();
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
    grayedOutSection: {
        opacity: 0.5,
    },
    loginButton: {
        alignSelf: 'center',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
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
    stashEmptyState: {
        paddingVertical: 24,
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
    metricsError: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    metricsErrorText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
    },
    metricsRetryText: {
        fontSize: 15,
        fontWeight: '600',
    },
    metricSkeletonBar: {
        width: '72%',
        height: 20,
        borderRadius: 6,
        marginTop: 4,
    },
    stashLoadError: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    stashSkeleton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 14,
    },
    stashSkeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stashSkeletonBar: {
        height: 14,
        borderRadius: 6,
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
