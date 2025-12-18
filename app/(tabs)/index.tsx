import Chart from '@/components/chart';
import { ThemedView } from '@/components/themed-view';
import { TopMoversBanner } from '@/components/TopMoversBanner';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { portfolio, priceHistory, stocks } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { useWalletStore } from '@/stores/walletStore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';


type SortType = 'percentage' | 'value' | null;

const leagueButtons = [
    { id: 'proFootball', image: require('@/assets/images/leagues/proFootball.png') },
    { id: 'proBasketball', image: require('@/assets/images/leagues/proBasketball.png') },
    { id: 'collegeFootball', image: require('@/assets/images/leagues/collegeFootball.png') },
    { id: 'collegeBasketball', image: require('@/assets/images/leagues/collegeBasketball.png') },
];

export default function HomeScreen() {
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const router = useRouter();
    const [activePage, setActivePage] = useState(0);
    const [highestVolumePage, setHighestVolumePage] = useState(0);
    const [onTheRisePage, setOnTheRisePage] = useState(0);
    const [upsetAlertPage, setUpsetAlertPage] = useState(0);
    const [sortType, setSortType] = useState<SortType>(null);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [isSortDropdownVisible, setIsSortDropdownVisible] = useState(false);
    const { setActiveStockId, setPurchaseFanCoinsBottomSheetOpen, setWalletSystemBottomSheetOpen, followedStockIds } = useStockStore();
    const { wallet, loadWallet, initializeWallet } = useWalletStore();
    const sortDropdownRef = useRef<View>(null);

    // Animation values for sort dropdown
    const sortDropdownOpacity = useSharedValue(0);
    const sortDropdownScale = useSharedValue(0.8);

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

    const formatNumber = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatVolume = (volume: number) => {
        if (volume >= 1000000) {
            return `${(volume / 1000000).toFixed(1)}M`;
        } else if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}K`;
        }
        return volume.toLocaleString('en-US');
    };

    const handlePageChange = (page: number) => {
        setActivePage(Math.round(page / (styles.stockPage.width + (styles.stockPage.marginRight / 2))));
    };

    const handleHighestVolumePageChange = (page: number) => {
        setHighestVolumePage(Math.round(page / (styles.stockPage.width + (styles.stockPage.marginRight / 2))));
    };

    const handleOnTheRisePageChange = (page: number) => {
        setOnTheRisePage(Math.round(page / (styles.stockPage.width + (styles.stockPage.marginRight / 2))));
    };

    const handleUpsetAlertPageChange = (page: number) => {
        setUpsetAlertPage(Math.round(page / (styles.stockPage.width + (styles.stockPage.marginRight / 2))));
    };

    const handleStockPress = (stockId: number) => {
        lightImpact();
        setActiveStockId(stockId);
    };

    // Sort positions based on selected sort type
    const sortedPositions = React.useMemo(() => {
        const positions = [...portfolio.positions];
        if (sortType === 'percentage') {
            return positions.sort((a, b) => b.gainLossPercentage - a.gainLossPercentage);
        } else if (sortType === 'value') {
            return positions.sort((a, b) => b.currentValue - a.currentValue);
        }
        return positions;
    }, [sortType]);

    const pageCount = Math.ceil(sortedPositions.length / 3);

    // Get followed stocks that user doesn't own
    const followedStocks = React.useMemo(() => {
        const ownedStockIds = new Set(portfolio.positions.map(p => p.stock.id));
        return stocks.filter(stock =>
            followedStockIds.includes(stock.id) && !ownedStockIds.has(stock.id)
        );
    }, [followedStockIds]);

    const getPriceChange = (stockId: number) => {
        const stockPriceHistory = priceHistory.filter(ph => ph.stockID === stockId);
        if (stockPriceHistory.length < 2) return { amount: 0, percentage: 0 };
        const currentPrice = stockPriceHistory[stockPriceHistory.length - 1].price;
        const previousPrice = stockPriceHistory[stockPriceHistory.length - 2].price;
        const change = currentPrice - previousPrice;
        const percentage = (change / previousPrice) * 100;
        return { amount: change, percentage };
    };

    // Highest Volume stocks (top 9 by volume)
    const highestVolumeStocks = React.useMemo(() => {
        return [...stocks]
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 9);
    }, []);

    // On the Rise - top 9 positive movers
    const onTheRiseStocks = React.useMemo(() => {
        const stockChanges: Array<{ stock: typeof stocks[0]; changePercentage: number }> = [];

        stocks.forEach((stock) => {
            const stockPriceHistory = priceHistory
                .filter(ph => ph.stockID === stock.id)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 2);

            if (stockPriceHistory.length >= 2) {
                const current = stockPriceHistory[0];
                const previous = stockPriceHistory[1];
                const change = current.price - previous.price;
                const changePercentage = ((change / previous.price) * 100);

                if (changePercentage > 0) {
                    stockChanges.push({
                        stock,
                        changePercentage,
                    });
                }
            }
        });

        return stockChanges
            .sort((a, b) => b.changePercentage - a.changePercentage)
            .slice(0, 9);
    }, []);

    // Upset Alert - top 9 negative movers
    const upsetAlertStocks = React.useMemo(() => {
        const stockChanges: Array<{ stock: typeof stocks[0]; changePercentage: number }> = [];

        stocks.forEach((stock) => {
            const stockPriceHistory = priceHistory
                .filter(ph => ph.stockID === stock.id)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 2);

            if (stockPriceHistory.length >= 2) {
                const current = stockPriceHistory[0];
                const previous = stockPriceHistory[1];
                const change = current.price - previous.price;
                const changePercentage = ((change / previous.price) * 100);

                if (changePercentage < 0) {
                    stockChanges.push({
                        stock,
                        changePercentage,
                    });
                }
            }
        });

        return stockChanges
            .sort((a, b) => a.changePercentage - b.changePercentage) // Sort ascending (most negative first)
            .slice(0, 9);
    }, []);

    const handleSortSelect = (type: SortType) => {
        setSortType(type);
        setShowSortDropdown(false);
        lightImpact();
        setActivePage(0); // Reset to first page when sorting changes
    };

    // Animate sort dropdown when visibility changes
    useEffect(() => {
        if (showSortDropdown) {
            setIsSortDropdownVisible(true);
            sortDropdownOpacity.value = withSpring(1, {
                damping: 150,
                stiffness: 500,
                mass: 0.8,
            });
            sortDropdownScale.value = withSpring(1, {
                damping: 150,
                stiffness: 500,
                mass: 0.8,
            });
        } else {
            sortDropdownOpacity.value = withSpring(0, {
                damping: 200,
                stiffness: 300,
                mass: 0.6,
            });
            sortDropdownScale.value = withSpring(0.8, {
                damping: 200,
                stiffness: 300,
                mass: 0.6,
            });
            // Hide component after animation completes
            const timer = setTimeout(() => {
                setIsSortDropdownVisible(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [showSortDropdown]);

    // Animated style for sort dropdown
    const sortDropdownAnimatedStyle = useAnimatedStyle(() => {
        'worklet';
        // Round scale to avoid subpixel rendering blur (round to 2 decimal places)
        const roundedScale = Math.round(sortDropdownScale.value * 100) / 100;
        return {
            opacity: sortDropdownOpacity.value,
            transform: [{ scale: roundedScale }],
        };
    }, []);

    const [showWalletDropdown, setShowWalletDropdown] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState<'GC' | 'SC'>('SC');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    // Animation values for dropdown
    const dropdownOpacity = useSharedValue(0);
    const dropdownScale = useSharedValue(0.8);

    // Animation values for coin icon fade
    const gcIconOpacity = useSharedValue(selectedCurrency === 'GC' ? 1 : 0);
    const scIconOpacity = useSharedValue(selectedCurrency === 'SC' ? 1 : 0);

    // Load selected currency from AsyncStorage on mount
    useEffect(() => {
        const loadSelectedCurrency = async () => {
            try {
                const saved = await AsyncStorage.getItem('selectedCurrency');
                if (saved === 'GC' || saved === 'SC') {
                    setSelectedCurrency(saved);
                }
            } catch (error) {
                console.error('Failed to load selected currency:', error);
            }
        };
        loadSelectedCurrency();
    }, []);

    // Animate dropdown when visibility changes
    useEffect(() => {
        if (showWalletDropdown) {
            setIsDropdownVisible(true);
            dropdownOpacity.value = withSpring(1, {
                damping: 150,
                stiffness: 500,
                mass: 0.8,
            });
            dropdownScale.value = withSpring(1, {
                damping: 150,
                stiffness: 500,
                mass: 0.8,
            });
        } else {
            dropdownOpacity.value = withSpring(0, {
                damping: 200,
                stiffness: 300,
                mass: 0.6,
            });
            dropdownScale.value = withSpring(0.8, {
                damping: 200,
                stiffness: 300,
                mass: 0.6,
            });
            // Hide component after animation completes
            const timer = setTimeout(() => {
                setIsDropdownVisible(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [showWalletDropdown]);

    // Animate coin icon fade when currency changes
    useEffect(() => {
        if (selectedCurrency === 'GC') {
            gcIconOpacity.value = withSpring(1, {
                damping: 20,
                stiffness: 300,
            });
            scIconOpacity.value = withSpring(0, {
                damping: 20,
                stiffness: 300,
            });
        } else {
            gcIconOpacity.value = withSpring(0, {
                damping: 20,
                stiffness: 300,
            });
            scIconOpacity.value = withSpring(1, {
                damping: 20,
                stiffness: 300,
            });
        }
    }, [selectedCurrency]);

    // Save selected currency to AsyncStorage when it changes
    const handleCurrencySelect = async (currency: 'GC' | 'SC') => {
        setSelectedCurrency(currency);
        setShowWalletDropdown(false);
        lightImpact();
        try {
            await AsyncStorage.setItem('selectedCurrency', currency);
        } catch (error) {
            console.error('Failed to save selected currency:', error);
        }
    };

    // Animated style for dropdown
    const dropdownAnimatedStyle = useAnimatedStyle(() => {
        'worklet';
        // Round scale to avoid subpixel rendering blur (round to 2 decimal places)
        const roundedScale = Math.round(dropdownScale.value * 100) / 100;
        return {
            opacity: dropdownOpacity.value,
            transform: [{ scale: roundedScale }],
        };
    }, []);

    // Animated styles for coin icons
    const gcIconAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: gcIconOpacity.value,
        };
    }, []);

    const scIconAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: scIconOpacity.value,
        };
    }, []);

    const WalletDropdownMenu = () => {
        if (!wallet) return null;

        const dropdownBgColor = isDark ? '#1A1A1A' : '#FFFFFF';

        return (
            <Animated.View
                style={[styles.dropdownWrapper, dropdownAnimatedStyle]}
                needsOffscreenAlphaCompositing={false}
                collapsable={false}
            >
                {/* Triangle pointer */}
                <Animated.View
                    style={[styles.dropdownTriangle, { borderBottomColor: dropdownBgColor }, dropdownAnimatedStyle]}
                    needsOffscreenAlphaCompositing={false}
                    collapsable={false}
                />
                <Animated.View
                    style={[styles.walletDropdownMenu, { backgroundColor: dropdownBgColor }, dropdownAnimatedStyle]}
                    needsOffscreenAlphaCompositing={false}
                    collapsable={false}
                >
                    {/* GC Option */}
                    <TouchableOpacity
                        style={[styles.currencyOption, { backgroundColor: selectedCurrency === 'GC' ? isDark ? '#242428' : '#F3F4F6' : 'transparent' }]}
                        onPress={() => handleCurrencySelect('GC')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.currencyAmount, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                            {formatNumber(wallet.fanCoins)}
                        </Text>
                        <View style={styles.currencyRight}>
                            <Image
                                source={require('@/assets/images/goldCoin.png')}
                                style={styles.coinIconImage}
                                contentFit="contain"
                            />
                            <Text style={[styles.currencyCode, { color: isDark ? '#D1D5DB' : '#374151' }]}>GC</Text>
                        </View>
                    </TouchableOpacity>

                    {/* SC Option */}
                    <TouchableOpacity
                        style={[styles.currencyOption, { backgroundColor: selectedCurrency === 'SC' ? isDark ? '#242428' : '#F3F4F6' : 'transparent' }]}
                        onPress={() => handleCurrencySelect('SC')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.currencyAmount, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                            {formatNumber(wallet.tradingCredits)}
                        </Text>
                        <View style={styles.currencyRight}>
                            <View style={[styles.coinIcon, { backgroundColor: isDark ? '#374151' : '#1F2937' }]}>
                                <Image
                                    source={require('@/assets/images/sportstockLogo.png')}
                                    style={styles.coinIconImage}
                                    contentFit="contain"
                                />
                            </View>
                            <Text style={[styles.currencyCode, { color: isDark ? '#D1D5DB' : '#374151' }]}>SC</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        );
    };

    return (
        <ThemedView style={styles.container}>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 120 }}>
                {/* Header - Absolutely positioned above everything */}
                <View style={[styles.header, { backgroundColor: isDark ? '#0B0F13' : '#FFFFFF' }]}>
                    <View style={styles.headerTop}>
                        <Text style={[styles.logo, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            SportStock
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                            <TouchableOpacity
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 0 }}
                                onPress={() => {
                                    setShowWalletDropdown(!showWalletDropdown);
                                    lightImpact();
                                }}
                            >
                                {wallet ? (
                                    <View
                                        style={[styles.balanceContainer, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}
                                    >
                                        <View style={styles.balanceSubContainer}>
                                            <View style={styles.balanceAmountContainer}>
                                                <AnimatedRollingNumber
                                                    value={selectedCurrency === 'GC' ? wallet.fanCoins : wallet.tradingCredits}
                                                    useGrouping={true}
                                                    enableCompactNotation={false}
                                                    compactToFixed={2}
                                                    textStyle={[styles.balance, { color: isDark ? '#FFFFFF' : '#000000' }]}
                                                    spinningAnimationConfig={{ duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) }}
                                                />
                                                <View style={styles.coinIconContainer}>
                                                    <Animated.View style={[styles.coinIconWrapper, gcIconAnimatedStyle]}>
                                                        <Image
                                                            source={require('@/assets/images/goldCoin.png')}
                                                            style={styles.balanceCoinIcon}
                                                            contentFit="contain"
                                                        />
                                                    </Animated.View>
                                                    <Animated.View style={[styles.coinIconWrapper, styles.scCoinIcon, { backgroundColor: isDark ? '#374151' : '#1F2937' }, scIconAnimatedStyle]}>
                                                        <Image
                                                            source={require('@/assets/images/sportstockLogo.png')}
                                                            style={styles.balanceCoinIcon}
                                                            contentFit="contain"
                                                        />
                                                    </Animated.View>
                                                </View>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-down" size={20} color={selectedCurrency === 'GC' ? '#F7CE37' : '#00C853'} style={{ marginLeft: 8 }} />
                                    </View>
                                ) : (
                                    <Text style={[styles.balance, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Loading...
                                    </Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={{ backgroundColor: '#00C853', padding: 3, borderRadius: 10 }}
                                onPress={() => {
                                    setShowWalletDropdown(false);
                                    setPurchaseFanCoinsBottomSheetOpen(true);
                                    lightImpact();
                                }}
                            >
                                <Ionicons name="add" size={24} color={isDark ? '#0B0F13' : '#fff'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {isDropdownVisible && wallet && <WalletDropdownMenu />}
                </View>

                {/* Top Movers Banner */}
                <TopMoversBanner onStockPress={handleStockPress} />


                {/* Portfolio Summary Card */}
                <View style={styles.cardContainer}>
                    <GlassCard
                        style={styles.portfolioCard}
                        standard={false}
                        padding={0}
                        fullWidth={true}
                    >
                        <View style={styles.portfolioContent}>
                            <Text style={[styles.portfolioTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                Total Value
                            </Text>

                            <Text style={[styles.portfolioValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                {formatCurrency(portfolio.totalValue)}
                            </Text>

                            <View style={styles.portfolioStats}>
                                <Text
                                    style={[
                                        styles.portfolioGainLoss,
                                        { color: portfolio.totalGainLoss >= 0 ? '#00C853' : '#FF1744' }
                                    ]}
                                >
                                    {formatCurrency(portfolio.totalGainLoss)}
                                </Text>
                                <Text
                                    style={[
                                        styles.portfolioGainLoss,
                                        { color: portfolio.totalGainLoss >= 0 ? '#00C853' : '#FF1744' }
                                    ]}
                                >
                                    ({formatPercentage(portfolio.totalGainLossPercentage)})
                                </Text>
                                <Text style={[styles.portfolioToday, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Today
                                </Text>
                            </View>

                            <Chart stockId={1} color="#00C853" />
                        </View>
                    </GlassCard>
                </View>

                {/* My Investments Card */}
                <View style={styles.section}>
                    <GlassCard style={styles.investmentsCard} padding={0}>
                        <View style={styles.investmentsContent}>
                            {/* My Investments Header */}
                            <Text style={[styles.investmentsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                My Portfolio
                            </Text>

                            {/* Investment Overview */}
                            <View style={styles.investmentOverview}>
                                <View style={styles.investmentLeft}>
                                    <Text style={[styles.investmentAmount, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(portfolio.totalInvested)}
                                    </Text>
                                    <Text style={[styles.investmentLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        Put In
                                    </Text>
                                </View>
                                <View style={styles.investmentRight}>
                                    <Text style={[
                                        styles.investmentAmount,
                                        { color: portfolio.totalGainLoss >= 0 ? '#00C853' : '#FF1744' }
                                    ]}>
                                        {formatCurrency(portfolio.totalGainLoss)}
                                    </Text>
                                    <Text style={[styles.investmentLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        W/L
                                    </Text>
                                </View>
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { backgroundColor: isDark ? '#242428' : '#E5E7EB' }]} />

                            {/* Summary Details */}
                            <View style={styles.summaryDetails}>
                                <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Total Value $
                                </Text>
                                <Text style={[styles.summaryValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatCurrency(portfolio.totalValue)}
                                </Text>
                            </View>
                            <View style={styles.summaryDetails}>
                                <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Total Gain %
                                </Text>
                                <Text style={[
                                    styles.summaryValue,
                                    { color: portfolio.totalGainLossPercentage >= 0 ? '#00C853' : '#FF1744' }
                                ]}>
                                    {formatPercentage(portfolio.totalGainLossPercentage)}
                                </Text>
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { backgroundColor: isDark ? '#242428' : '#E5E7EB' }]} />

                            {/* Stocks Owned Section */}
                            <View style={styles.stocksOwnedHeader}>
                                <View style={styles.stocksOwnedLeft}>
                                    <Text style={[styles.stocksOwnedTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        My Teams
                                    </Text>
                                </View>
                                <View style={styles.sortButtonContainer} ref={sortDropdownRef}>
                                    <TouchableOpacity
                                        style={[styles.sortButton, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}
                                        onPress={() => {
                                            setShowSortDropdown(!showSortDropdown);
                                            lightImpact();
                                        }}
                                        onPressIn={() => {
                                            // Ensure touch is captured
                                        }}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        delayPressIn={0}
                                    >
                                        <Text style={[styles.sortButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                            {sortType === 'percentage' ? 'Sort: %' : sortType === 'value' ? 'Sort: $' : 'Sort by'}
                                        </Text>
                                        <Ionicons
                                            name={showSortDropdown ? 'chevron-up' : 'chevron-down'}
                                            size={14}
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                            style={{ marginLeft: 4 }}
                                        />
                                    </TouchableOpacity>
                                    {isSortDropdownVisible && (
                                        <Animated.View
                                            style={styles.sortDropdownWrapper}
                                            needsOffscreenAlphaCompositing={false}
                                            collapsable={false}
                                        >
                                            {/* Triangle pointer */}
                                            <Animated.View
                                                style={[
                                                    styles.sortDropdownTriangle,
                                                    { borderBottomColor: isDark ? '#1A1D21' : '#FFFFFF' },
                                                    sortDropdownAnimatedStyle
                                                ]}
                                                needsOffscreenAlphaCompositing={false}
                                                collapsable={false}
                                            />
                                            <Animated.View
                                                style={[
                                                    styles.sortDropdown,
                                                    { backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' },
                                                    sortDropdownAnimatedStyle
                                                ]}
                                                needsOffscreenAlphaCompositing={false}
                                                collapsable={false}
                                            >
                                                <TouchableOpacity
                                                    style={[
                                                        styles.sortOption,
                                                        sortType === 'percentage' && { backgroundColor: isDark ? '#242428' : '#F3F4F6' }
                                                    ]}
                                                    onPress={() => handleSortSelect('percentage')}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[styles.sortOptionText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        Percentage
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.sortOption,
                                                        sortType === 'value' && { backgroundColor: isDark ? '#242428' : '#F3F4F6' }
                                                    ]}
                                                    onPress={() => handleSortSelect('value')}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[styles.sortOptionText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        Value
                                                    </Text>
                                                </TouchableOpacity>
                                            </Animated.View>
                                        </Animated.View>
                                    )}
                                </View>
                            </View>

                            {/* Stock List - Horizontal Scrollable */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled
                                snapToInterval={styles.stockPage.width + (styles.stockPage.marginRight / 2)}
                                snapToAlignment="center"
                                decelerationRate="fast"
                                onScroll={(event) => handlePageChange(event.nativeEvent.contentOffset.x)}
                                style={styles.stockScrollView}
                                contentContainerStyle={styles.stockScrollContent}
                                scrollEventThrottle={16}
                                nestedScrollEnabled={true}
                            >
                                {Array.from({ length: Math.ceil(sortedPositions.length / 3) }, (_, pageIndex) => (
                                    <View key={pageIndex} style={styles.stockPage}>
                                        {sortedPositions.slice(pageIndex * 3, (pageIndex + 1) * 3).map((position) => (
                                            <TouchableOpacity
                                                key={position.stock.id}
                                                style={styles.stockItem}
                                                onPress={() => {
                                                    handleStockPress(position.stock.id);
                                                }}
                                                onPressIn={() => {
                                                    // Ensure touch is captured
                                                }}
                                                activeOpacity={0.7}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                delayPressIn={0}
                                            >
                                                <View style={[styles.stockIcon, { backgroundColor: position.stock.color }]}>
                                                    <Text style={styles.stockIconText}>
                                                        {position.stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.stockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                    {position.stock.name}
                                                </Text>
                                                <View style={[styles.stockValue, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                                                    {sortType === 'percentage' ? (
                                                        <View style={styles.stockValueContent}>
                                                            <Ionicons
                                                                name={position.gainLossPercentage >= 0 ? 'trending-up' : 'trending-down'}
                                                                size={14}
                                                                color={position.gainLossPercentage >= 0 ? '#00C853' : '#FF1744'}
                                                            />
                                                            <Text style={[
                                                                styles.stockValueText,
                                                                { color: position.gainLossPercentage >= 0 ? '#00C853' : '#FF1744' }
                                                            ]}>
                                                                {formatPercentage(position.gainLossPercentage)}
                                                            </Text>
                                                        </View>
                                                    ) : (
                                                        <Text style={[
                                                            styles.stockValueText,
                                                            { color: position.gainLossPercentage >= 0 ? '#00C853' : '#FF1744' }
                                                        ]}>
                                                            {formatCurrency(position.currentValue)}
                                                        </Text>
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                            </ScrollView>

                            {/* Pagination Dots */}
                            <View style={styles.paginationDots}>
                                {Array.from({ length: pageCount }, (_, index) => (
                                    <View key={index} style={[styles.paginationDot, { backgroundColor: activePage === index ? isDark ? '#ccc' : '#777' : isDark ? '#777' : '#ccc' }]} />
                                ))}
                            </View>
                        </View>
                    </GlassCard>
                </View>

                {/* League Buttons */}
                <View style={styles.leagueButtonsContainer}>
                    {leagueButtons.map((league) => (
                        <TouchableOpacity
                            key={league.id}
                            style={styles.leagueButton}
                            onPress={() => {
                                lightImpact();
                                router.push(`/league/${league.id}`);
                            }}
                            activeOpacity={0.7}
                        >
                            <Image
                                source={league.image}
                                style={styles.leagueButtonImage}
                                contentFit="contain"
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Highest Volume Section */}
                <View style={styles.section}>
                    <GlassCard style={styles.investmentsCard} padding={0}>
                        <View style={styles.investmentsContent}>
                            <Text style={[styles.investmentsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                Highest Volume
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled
                                snapToInterval={styles.stockPage.width + (styles.stockPage.marginRight / 2)}
                                snapToAlignment="center"
                                decelerationRate="fast"
                                onScroll={(event) => handleHighestVolumePageChange(event.nativeEvent.contentOffset.x)}
                                style={styles.stockScrollView}
                                contentContainerStyle={styles.stockScrollContent}
                                scrollEventThrottle={16}
                                nestedScrollEnabled={true}
                            >
                                {Array.from({ length: Math.ceil(highestVolumeStocks.length / 3) }, (_, pageIndex) => (
                                    <View key={pageIndex} style={styles.stockPage}>
                                        {highestVolumeStocks.slice(pageIndex * 3, (pageIndex + 1) * 3).map((stock) => {
                                            return (
                                                <TouchableOpacity
                                                    key={stock.id}
                                                    style={styles.stockItem}
                                                    onPress={() => {
                                                        handleStockPress(stock.id);
                                                    }}
                                                    activeOpacity={0.7}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <View style={[styles.stockIcon, { backgroundColor: stock.color }]}>
                                                        <Text style={styles.stockIconText}>
                                                            {stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                        </Text>
                                                    </View>
                                                    <Text style={[styles.stockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        {stock.name}
                                                    </Text>
                                                    <View style={[styles.stockValue, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                                                        <Text style={[
                                                            styles.stockValueText,
                                                            { color: isDark ? '#FFFFFF' : '#000000' }
                                                        ]}>
                                                            {formatVolume(stock.volume)}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ))}
                            </ScrollView>

                            {Math.ceil(highestVolumeStocks.length / 3) > 1 && (
                                <View style={styles.paginationDots}>
                                    {Array.from({ length: Math.ceil(highestVolumeStocks.length / 3) }, (_, index) => (
                                        <View key={index} style={[styles.paginationDot, { backgroundColor: highestVolumePage === index ? isDark ? '#ccc' : '#777' : isDark ? '#777' : '#ccc' }]} />
                                    ))}
                                </View>
                            )}
                        </View>
                    </GlassCard>
                </View>

                {/* On the Rise Section */}
                <View style={styles.section}>
                    <GlassCard style={styles.investmentsCard} padding={0}>
                        <View style={styles.investmentsContent}>
                            <Text style={[styles.investmentsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                On the Rise
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled
                                snapToInterval={styles.stockPage.width + (styles.stockPage.marginRight / 2)}
                                snapToAlignment="center"
                                decelerationRate="fast"
                                onScroll={(event) => handleOnTheRisePageChange(event.nativeEvent.contentOffset.x)}
                                style={styles.stockScrollView}
                                contentContainerStyle={styles.stockScrollContent}
                                scrollEventThrottle={16}
                                nestedScrollEnabled={true}
                            >
                                {Array.from({ length: Math.ceil(onTheRiseStocks.length / 3) }, (_, pageIndex) => (
                                    <View key={pageIndex} style={styles.stockPage}>
                                        {onTheRiseStocks.slice(pageIndex * 3, (pageIndex + 1) * 3).map((item) => {
                                            return (
                                                <TouchableOpacity
                                                    key={item.stock.id}
                                                    style={styles.stockItem}
                                                    onPress={() => {
                                                        handleStockPress(item.stock.id);
                                                    }}
                                                    activeOpacity={0.7}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <View style={[styles.stockIcon, { backgroundColor: item.stock.color }]}>
                                                        <Text style={styles.stockIconText}>
                                                            {item.stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                        </Text>
                                                    </View>
                                                    <Text style={[styles.stockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        {item.stock.name}
                                                    </Text>
                                                    <View style={[styles.stockValue, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                                                        <View style={styles.stockValueContent}>
                                                            <Ionicons
                                                                name="trending-up"
                                                                size={14}
                                                                color="#00C853"
                                                            />
                                                            <Text style={[
                                                                styles.stockValueText,
                                                                { color: '#00C853' }
                                                            ]}>
                                                                {formatPercentage(item.changePercentage)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ))}
                            </ScrollView>

                            {Math.ceil(onTheRiseStocks.length / 3) > 1 && (
                                <View style={styles.paginationDots}>
                                    {Array.from({ length: Math.ceil(onTheRiseStocks.length / 3) }, (_, index) => (
                                        <View key={index} style={[styles.paginationDot, { backgroundColor: onTheRisePage === index ? isDark ? '#ccc' : '#777' : isDark ? '#777' : '#ccc' }]} />
                                    ))}
                                </View>
                            )}
                        </View>
                    </GlassCard>
                </View>

                {/* Upset Alert Section */}
                <View style={styles.section}>
                    <GlassCard style={styles.investmentsCard} padding={0}>
                        <View style={styles.investmentsContent}>
                            <Text style={[styles.investmentsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                Upset Alert
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled
                                snapToInterval={styles.stockPage.width + (styles.stockPage.marginRight / 2)}
                                snapToAlignment="center"
                                decelerationRate="fast"
                                onScroll={(event) => handleUpsetAlertPageChange(event.nativeEvent.contentOffset.x)}
                                style={styles.stockScrollView}
                                contentContainerStyle={styles.stockScrollContent}
                                scrollEventThrottle={16}
                                nestedScrollEnabled={true}
                            >
                                {Array.from({ length: Math.ceil(upsetAlertStocks.length / 3) }, (_, pageIndex) => (
                                    <View key={pageIndex} style={styles.stockPage}>
                                        {upsetAlertStocks.slice(pageIndex * 3, (pageIndex + 1) * 3).map((item) => {
                                            return (
                                                <TouchableOpacity
                                                    key={item.stock.id}
                                                    style={styles.stockItem}
                                                    onPress={() => {
                                                        handleStockPress(item.stock.id);
                                                    }}
                                                    activeOpacity={0.7}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <View style={[styles.stockIcon, { backgroundColor: item.stock.color }]}>
                                                        <Text style={styles.stockIconText}>
                                                            {item.stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                        </Text>
                                                    </View>
                                                    <Text style={[styles.stockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        {item.stock.name}
                                                    </Text>
                                                    <View style={[styles.stockValue, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                                                        <View style={styles.stockValueContent}>
                                                            <Ionicons
                                                                name="trending-down"
                                                                size={14}
                                                                color="#FF1744"
                                                            />
                                                            <Text style={[
                                                                styles.stockValueText,
                                                                { color: '#FF1744' }
                                                            ]}>
                                                                {formatPercentage(item.changePercentage)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                ))}
                            </ScrollView>

                            {Math.ceil(upsetAlertStocks.length / 3) > 1 && (
                                <View style={styles.paginationDots}>
                                    {Array.from({ length: Math.ceil(upsetAlertStocks.length / 3) }, (_, index) => (
                                        <View key={index} style={[styles.paginationDot, { backgroundColor: upsetAlertPage === index ? isDark ? '#ccc' : '#777' : isDark ? '#777' : '#ccc' }]} />
                                    ))}
                                </View>
                            )}
                        </View>
                    </GlassCard>
                </View>

                {/* Followed Stocks Section */}
                {followedStocks.length > 0 && (
                    <View style={styles.section}>
                        <GlassCard style={styles.investmentsCard} padding={0}>
                            <View style={styles.investmentsContent}>
                                {/* Followed Stocks Header */}
                                <Text style={[styles.investmentsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Following
                                </Text>

                                {/* Stock List - Horizontal Scrollable */}
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    pagingEnabled
                                    snapToInterval={styles.stockPage.width + (styles.stockPage.marginRight / 2)}
                                    snapToAlignment="center"
                                    decelerationRate="fast"
                                    style={styles.stockScrollView}
                                    contentContainerStyle={styles.stockScrollContent}
                                    scrollEventThrottle={16}
                                    nestedScrollEnabled={true}
                                >
                                    {Array.from({ length: Math.ceil(followedStocks.length / 3) }, (_, pageIndex) => (
                                        <View key={pageIndex} style={styles.stockPage}>
                                            {followedStocks.slice(pageIndex * 3, (pageIndex + 1) * 3).map((stock) => {
                                                const priceChange = getPriceChange(stock.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={stock.id}
                                                        style={styles.stockItem}
                                                        onPress={() => {
                                                            handleStockPress(stock.id);
                                                        }}
                                                        onPressIn={() => {
                                                            // Ensure touch is captured
                                                        }}
                                                        activeOpacity={0.7}
                                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                        delayPressIn={0}
                                                    >
                                                        <View style={[styles.stockIcon, { backgroundColor: stock.color }]}>
                                                            <Text style={styles.stockIconText}>
                                                                {stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                            </Text>
                                                        </View>
                                                        <Text style={[styles.stockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                            {stock.name}
                                                        </Text>
                                                        <View style={[styles.stockValue, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                                                            <View style={styles.stockValueContent}>
                                                                <Ionicons
                                                                    name={priceChange.percentage >= 0 ? 'trending-up' : 'trending-down'}
                                                                    size={14}
                                                                    color={priceChange.percentage >= 0 ? '#00C853' : '#FF1744'}
                                                                />
                                                                <Text style={[
                                                                    styles.stockValueText,
                                                                    { color: priceChange.percentage >= 0 ? '#00C853' : '#FF1744' }
                                                                ]}>
                                                                    {formatPercentage(priceChange.percentage)}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ))}
                                </ScrollView>

                                {/* Pagination Dots */}
                                {Math.ceil(followedStocks.length / 3) > 1 && (
                                    <View style={styles.paginationDots}>
                                        {Array.from({ length: Math.ceil(followedStocks.length / 3) }, (_, index) => (
                                            <View key={index} style={[styles.paginationDot, { backgroundColor: index === 0 ? isDark ? '#ccc' : '#777' : isDark ? '#777' : '#ccc' }]} />
                                        ))}
                                    </View>
                                )}
                            </View>
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 1000,
        elevation: 1000,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    balanceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 6,
        borderRadius: 10,
    },
    balanceSubContainer: {
        alignItems: 'flex-end',
    },
    balance: {
        fontSize: 16,
        fontWeight: '600',
    },
    balanceAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
    },
    coinIconContainer: {
        position: 'relative',
        width: 20,
        height: 20,
    },
    coinIconWrapper: {
        position: 'absolute',
        width: 20,
        height: 20,
    },
    balanceCoinIcon: {
        width: 20,
        height: 20,
    },
    scCoinIcon: {
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 11,
        fontWeight: '400',
        marginTop: 2,
    },
    cardContainer: {
        marginTop: -25,
        marginBottom: 24,
    },
    portfolioCard: {
        minHeight: 200,
    },
    portfolioContent: {
        flex: 1,
        alignItems: 'center',
    },
    portfolioTitle: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 16,
    },
    portfolioValue: {
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    portfolioStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    portfolioGainLoss: {
        fontSize: 16,
        fontWeight: '500',
        marginRight: 8,
    },
    portfolioToday: {
        fontSize: 14,
        marginLeft: 8,
    },
    timePeriodContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    timeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    timeButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    horizontalScroll: {
        paddingLeft: 20,
    },
    gameCard: {
        width: 200,
        marginRight: 16,
        marginBottom: 16,
    },
    gameContent: {
        flex: 1,
    },
    gameLeague: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    gameTeams: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    gameScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    gameScore: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    newsCard: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    newsContent: {
        flex: 1,
    },
    newsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    newsDescription: {
        fontSize: 14,
        marginBottom: 8,
    },
    newsMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    newsSource: {
        fontSize: 12,
    },
    newsSeparator: {
        fontSize: 12,
    },
    newsDate: {
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    bottomSpacing: {
        height: 100,
    },
    leagueButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    leagueButton: {
        width: 70,
        height: 70,
        borderRadius: 16,
        overflow: 'hidden',
    },
    leagueButtonImage: {
        width: '100%',
        height: '100%',
    },
    // Investments Card Styles
    investmentsCard: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    investmentsContent: {
        paddingVertical: 20,
    },
    investmentsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    investmentOverview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    investmentLeft: {
        alignItems: 'flex-start',
    },
    investmentRight: {
        alignItems: 'flex-end',
    },
    investmentAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    investmentLabel: {
        fontSize: 14,
        fontWeight: '400',
    },
    divider: {
        height: 1,
        marginVertical: 16,
        paddingHorizontal: 20,
    },
    summaryDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '400',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    stocksOwnedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    stocksOwnedLeft: {
        flex: 1,
    },
    stocksOwnedTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    stocksOwnedSubtitle: {
        fontSize: 12,
        fontWeight: '400',
    },
    sortButtonContainer: {
        position: 'relative',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    sortButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    sortDropdownWrapper: {
        position: 'absolute',
        top: 35,
        right: 0,
        zIndex: 1000,
        alignItems: 'flex-end',
    },
    sortDropdownTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginBottom: -1,
        marginRight: 20,
    },
    sortDropdown: {
        borderRadius: 10,
        padding: 4,
        minWidth: 120,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    sortOption: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 6,
    },
    sortOptionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    stockScrollView: {
        marginBottom: 16,
    },
    stockScrollContent: {
        paddingHorizontal: 0,
    },
    stockPage: {
        width: 360, // Width of each page (card width minus padding)
        marginRight: 20,
        paddingHorizontal: 20
    },
    stockItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        minHeight: 50,
        paddingVertical: 8,
    },
    stockIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stockIconText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stockName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    stockValueContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    stockValue: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stockValueText: {
        fontSize: 12,
        fontWeight: '500',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6B7280',
        marginHorizontal: 4,
    },
    dropdownWrapper: {
        position: 'absolute',
        top: 100,
        right: 20,
        zIndex: 1000,
        alignItems: 'flex-end',
    },
    dropdownTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginBottom: -1,
        marginRight: 20,
    },
    walletDropdownMenu: {
        borderRadius: 10,
        padding: 12,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 200,
    },
    currencyOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    currencyAmount: {
        fontSize: 16,
        fontWeight: '500',
    },
    currencyRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    coinIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coinIconImage: {
        width: 24,
        height: 24,
    },
    coinIconText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    currencyCode: {
        fontSize: 14,
        fontWeight: '500',
    },
});
