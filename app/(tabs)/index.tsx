import { AppHeader } from '@/components/AppHeader';
import Chart from '@/components/chart';
import { ThemedView } from '@/components/themed-view';
import { TopMoversBanner } from '@/components/TopMoversBanner';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { portfolio, priceHistory, stocks } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { useWalletStore } from '@/stores/walletStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type SortType = 'percentage' | 'value' | null;

const leagueButtons = [
    { id: 'proFootball', image: require('@/assets/images/leagues/proFootball.png') },
    { id: 'proBasketball', image: require('@/assets/images/leagues/proBasketball.png') },
    { id: 'collegeFootball', image: require('@/assets/images/leagues/collegeFootball.png') },
    { id: 'collegeBasketball', image: require('@/assets/images/leagues/collegeBasketball.png') },
];

export default function HomeScreen() {
    const Color = useColors();
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const router = useRouter();
    const [activePage, setActivePage] = useState(0);
    const [highestVolumePage, setHighestVolumePage] = useState(0);
    const [onTheRisePage, setOnTheRisePage] = useState(0);
    const [upsetAlertPage, setUpsetAlertPage] = useState(0);
    const [sortType, setSortType] = useState<SortType>(null);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const { setActiveStockId, setPurchaseFanCoinsBottomSheetOpen, followedStockIds } = useStockStore();
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
        }
    }, [showSortDropdown]);

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 120 }}>
                <AppHeader />

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
                            <Text style={[styles.portfolioTitle, { color: Color.baseText }]}>
                                Total Value
                            </Text>

                            <Text style={[styles.portfolioValue, { color: Color.baseText }]}>
                                {formatCurrency(portfolio.totalValue)}
                            </Text>

                            <View style={styles.portfolioStats}>
                                <Text
                                    style={[
                                        styles.portfolioGainLoss,
                                        { color: portfolio.totalGainLoss >= 0 ? Color.green : Color.red }
                                    ]}
                                >
                                    {formatCurrency(portfolio.totalGainLoss)}
                                </Text>
                                <Text
                                    style={[
                                        styles.portfolioGainLoss,
                                        { color: portfolio.totalGainLoss >= 0 ? Color.green : Color.red }
                                    ]}
                                >
                                    ({formatPercentage(portfolio.totalGainLossPercentage)})
                                </Text>
                                <Text style={[styles.portfolioToday, { color: Color.subText }]}>
                                    Today
                                </Text>
                            </View>

                            <Chart stockId={1} color={Color.green} />
                        </View>
                    </GlassCard>
                </View>

                {/* My Investments Card */}
                <View style={styles.section}>
                    <GlassCard style={styles.investmentsCard} padding={0}>
                        <View style={styles.investmentsContent}>
                            {/* My Investments Header */}
                            <Text style={[styles.investmentsTitle, { color: Color.baseText }]}>
                                My Portfolio
                            </Text>

                            {/* Investment Overview */}
                            <View style={styles.investmentOverview}>
                                <View style={styles.investmentLeft}>
                                    <Text style={[styles.investmentAmount, { color: Color.baseText }]}>
                                        {formatCurrency(portfolio.totalInvested)}
                                    </Text>
                                    <Text style={[styles.investmentLabel, { color: Color.subText }]}>
                                        Put In
                                    </Text>
                                </View>
                                <View style={styles.investmentRight}>
                                    <Text style={[
                                        styles.investmentAmount,
                                        { color: portfolio.totalGainLoss >= 0 ? Color.green : Color.red }
                                    ]}>
                                        {formatCurrency(portfolio.totalGainLoss)}
                                    </Text>
                                    <Text style={[styles.investmentLabel, { color: Color.subText }]}>
                                        W/L
                                    </Text>
                                </View>
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { backgroundColor: isDark ? '#242428' : '#E5E7EB' }]} />

                            {/* Summary Details */}
                            <View style={styles.summaryDetails}>
                                <Text style={[styles.summaryLabel, { color: Color.subText }]}>
                                    Total Value $
                                </Text>
                                <Text style={[styles.summaryValue, { color: Color.baseText }]}>
                                    {formatCurrency(portfolio.totalValue)}
                                </Text>
                            </View>
                            <View style={styles.summaryDetails}>
                                <Text style={[styles.summaryLabel, { color: Color.subText }]}>
                                    Total Gain %
                                </Text>
                                <Text style={[
                                    styles.summaryValue,
                                    { color: portfolio.totalGainLossPercentage >= 0 ? Color.green : Color.red }
                                ]}>
                                    {formatPercentage(portfolio.totalGainLossPercentage)}
                                </Text>
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { backgroundColor: isDark ? '#242428' : '#E5E7EB' }]} />

                            {/* Stocks Owned Section */}
                            <View style={styles.stocksOwnedHeader}>
                                <View style={styles.stocksOwnedLeft}>
                                    <Text style={[styles.stocksOwnedTitle, { color: Color.baseText }]}>
                                        My Teams
                                    </Text>
                                </View>
                                <View style={styles.sortButtonContainer} ref={sortDropdownRef}>
                                    <TouchableOpacity
                                        style={[styles.sortButton, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}
                                        onPress={() => {
                                            sortType === 'percentage' ? handleSortSelect('value') : handleSortSelect('percentage');
                                            lightImpact();
                                        }}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        delayPressIn={0}
                                    >
                                        <Text style={[styles.sortButtonText, { color: Color.baseText }]}>
                                            {sortType === 'percentage' ? 'Sort: %' : sortType === 'value' ? 'Sort: $' : 'Sort by'}
                                        </Text>
                                    </TouchableOpacity>
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
                                                    <Text style={[styles.stockIconText, { color: Color.white }]}>
                                                        {position.stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.stockName, { color: Color.baseText }]}>
                                                    {position.stock.name}
                                                </Text>
                                                <View style={[styles.stockValue, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                                                    {sortType === 'percentage' ? (
                                                        <View style={styles.stockValueContent}>
                                                            <Ionicons
                                                                name={position.gainLossPercentage >= 0 ? 'trending-up' : 'trending-down'}
                                                                size={14}
                                                                color={position.gainLossPercentage >= 0 ? Color.green : Color.red}
                                                            />
                                                            <Text style={[
                                                                styles.stockValueText,
                                                                { color: position.gainLossPercentage >= 0 ? Color.green : Color.red }
                                                            ]}>
                                                                {formatPercentage(position.gainLossPercentage)}
                                                            </Text>
                                                        </View>
                                                    ) : (
                                                        <Text style={[
                                                            styles.stockValueText,
                                                            { color: position.gainLossPercentage >= 0 ? Color.green : Color.red }
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

                {/* Followed Stocks Section */}
                {followedStocks.length > 0 && (
                    <View style={styles.section}>
                        <GlassCard style={styles.investmentsCard} padding={0}>
                            <View style={styles.investmentsContent}>
                                {/* Followed Stocks Header */}
                                <Text style={[styles.investmentsTitle, { color: Color.baseText }]}>
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
                                                            <Text style={[styles.stockIconText, { color: Color.white }]}>
                                                                {stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                            </Text>
                                                        </View>
                                                        <Text style={[styles.stockName, { color: Color.baseText }]}>
                                                            {stock.name}
                                                        </Text>
                                                        <View style={[styles.stockValue, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                                                            <View style={styles.stockValueContent}>
                                                                <Ionicons
                                                                    name={priceChange.percentage >= 0 ? 'trending-up' : 'trending-down'}
                                                                    size={14}
                                                                    color={priceChange.percentage >= 0 ? Color.green : Color.red}
                                                                />
                                                                <Text style={[
                                                                    styles.stockValueText,
                                                                    { color: priceChange.percentage >= 0 ? Color.green : Color.red }
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

                {/* League Buttons */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.leagueButtonsScrollContent}
                    style={styles.leagueButtonsScrollView}
                >
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
                </ScrollView>

                {/* Highest Volume Section */}
                <View style={styles.section}>
                    <GlassCard style={styles.investmentsCard} padding={0}>
                        <View style={styles.investmentsContent}>
                            <Text style={[styles.investmentsTitle, { color: Color.baseText }]}>
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
                                                        <Text style={[styles.stockIconText, { color: Color.white }]}>
                                                            {stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                        </Text>
                                                    </View>
                                                    <Text style={[styles.stockName, { color: Color.baseText }]}>
                                                        {stock.name}
                                                    </Text>
                                                    <View style={[styles.stockValue, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                                                        <Text style={[
                                                            styles.stockValueText,
                                                            { color: Color.baseText }
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
                            <Text style={[styles.investmentsTitle, { color: Color.baseText }]}>
                                ON THE RISE
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: Color.subText }]}>
                                These stocks were bought and sold more over the last 30 days than any other stocks available on SportStock.
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
                                                        <Text style={[styles.stockIconText, { color: Color.white }]}>
                                                            {item.stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                        </Text>
                                                    </View>
                                                    <Text style={[styles.stockName, { color: Color.baseText }]}>
                                                        {item.stock.name}
                                                    </Text>
                                                    <View style={[styles.stockValue, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                                                        <View style={styles.stockValueContent}>
                                                            <Ionicons
                                                                name="trending-up"
                                                                size={14}
                                                                color={Color.green}
                                                            />
                                                            <Text style={[
                                                                styles.stockValueText,
                                                                { color: Color.green }
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
                            <Text style={[styles.investmentsTitle, { color: Color.baseText }]}>
                                UPSET ALERT
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: Color.subText }]}>
                                These teams gained or lost the most value today of any stock on SportStock.
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
                                                        <Text style={[styles.stockIconText, { color: Color.white }]}>
                                                            {item.stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                                        </Text>
                                                    </View>
                                                    <Text style={[styles.stockName, { color: Color.baseText }]}>
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
                                                                { color: Color.red }
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
    bottomSpacing: {
        height: 100,
    },
    leagueButtonsScrollView: {
        marginBottom: 24,
    },
    leagueButtonsScrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 16,
        paddingRight: 20,
    },
    leagueButton: {
        width: 132,
        height: 132,
        borderRadius: 20,
        overflow: 'hidden',
    },
    leagueButtonImage: {
        width: '100%',
        height: '100%',
    },
    sectionSubtitle: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
        paddingHorizontal: 20,
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stockIconText: {
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
        marginHorizontal: 4,
    },
});
