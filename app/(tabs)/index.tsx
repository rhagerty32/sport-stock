import { AppHeader } from '@/components/AppHeader';
import Chart from '@/components/chart';
import { ChartLoadingSkeleton } from '@/components/ChartLoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { PortfolioPreviewMarquee, type PortfolioPreviewCard } from '@/components/PortfolioPreviewMarquee';
import { ThemedView } from '@/components/themed-view';
import { TopMoversBanner } from '@/components/TopMoversBanner';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useFollowedStocksNotOwned } from '@/lib/follows-api';
import { useLeagues } from '@/lib/leagues-api';
import { buildTimeAxisPriceSeries, portfolioChartPeriodMetrics } from '@/lib/price-history-period';
import {
    PORTFOLIO_CHART_HISTORY_PARAMS,
    usePortfolio,
    usePortfolioHistory,
} from '@/lib/portfolio-api';
import { fetchStocks, useHighestVolume, useOnTheRise, useTopMovers, useUpsetAlert } from '@/lib/stocks-api';
import { useWallet } from '@/lib/wallet-api';
import { useAuthStore } from '@/stores/authStore';
import { useStockStore } from '@/stores/stockStore';
import type { League, Stock, TimePeriod } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSharedValue, withSpring } from 'react-native-reanimated';

type SortType = 'percentage' | 'value' | null;

const PORTFOLIO_CHART_PERIOD_LABEL: Record<TimePeriod, string> = {
    '1H': 'Past hour',
    '1D': 'Past day',
    '1W': 'Past week',
    '1M': 'Past month',
    '3M': 'Past 3 months',
    '1Y': 'Past year',
    '5Y': 'Past 5 years',
    ALL: 'All time',
};

const leagueImages: Record<string, any> = {
    'NFL': require('@/assets/images/leagues/proFootball.png'),
    'NBA': require('@/assets/images/leagues/proBasketball.png'),
    'NCAA Football': require('@/assets/images/leagues/collegeFootball.png'),
    'NCAA Basketball': require('@/assets/images/leagues/collegeBasketball.png'),
};

export default function HomeScreen() {
    const Color = useColors();
    const { isDark } = useTheme();
    const { lightImpact, mediumImpact } = useHaptics();
    const router = useRouter();
    const [activePage, setActivePage] = useState(0);
    const [highestVolumePage, setHighestVolumePage] = useState(0);
    const [onTheRisePage, setOnTheRisePage] = useState(0);
    const [upsetAlertPage, setUpsetAlertPage] = useState(0);
    const [sortType, setSortType] = useState<SortType>(null);
    const [portfolioChartPeriod, setPortfolioChartPeriod] = useState<TimePeriod>('1M');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const user = useAuthStore((s) => s.user);
    const {
        setActiveStockId,
        setActiveStock,
        setActivePosition,
        setPositionDetailBottomSheetOpen,
        setPurchaseFanCoinsBottomSheetOpen,
        followedStockIds,
    } = useStockStore();
    const sortDropdownRef = useRef<View>(null);

    const {
        data: portfolio,
        isPending: portfolioPending,
        isFetching: portfolioFetching,
        isError: portfolioQueryError,
        refetch: refetchPortfolio,
    } = usePortfolio();

    const [discoveryEnabled, setDiscoveryEnabled] = useState(!isAuthenticated);
    useEffect(() => {
        if (!isAuthenticated) {
            setDiscoveryEnabled(true);
            return;
        }
        setDiscoveryEnabled(false);
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const task = InteractionManager.runAfterInteractions(() => {
            timeoutId = setTimeout(() => setDiscoveryEnabled(true), 150);
        });
        return () => {
            task.cancel();
            if (timeoutId != null) clearTimeout(timeoutId);
        };
    }, [isAuthenticated]);

    const discoveryQueryEnabled = !isAuthenticated || discoveryEnabled;

    const { data: wallet } = useWallet(isAuthenticated && user?.id ? user.id : null);

    const positions = portfolio?.positions ?? [];
    const sortedPositions = useMemo(() => {
        const list = [...positions];
        if (sortType === 'percentage') return list.sort((a, b) => b.gainLossPercentage - a.gainLossPercentage);
        if (sortType === 'value') return list.sort((a, b) => b.currentValue - a.currentValue);
        return list;
    }, [positions, sortType]);

    const portfolioCompositionKey = useMemo(
        () =>
            [...positions]
                .map((p) => `${String(p.stock.id)}:${p.entries}`)
                .sort()
                .join(','),
        [positions]
    );

    const portfolioHistoryQuery = usePortfolioHistory(
        isAuthenticated && positions.length > 0,
        PORTFOLIO_CHART_HISTORY_PARAMS
    );

    const chartLoading =
        isAuthenticated &&
        positions.length > 0 &&
        (portfolioHistoryQuery.isPending ||
            (portfolioHistoryQuery.isFetching && portfolioHistoryQuery.data === undefined));

    const chartData = useMemo(() => {
        if (positions.length === 0) return null;
        const d = portfolioHistoryQuery.data;
        if (d == null || d.length === 0) return null;
        return d;
    }, [positions.length, portfolioHistoryQuery.data]);

    useEffect(() => {
        setPortfolioChartPeriod('1M');
    }, [portfolioCompositionKey]);

    /** Period $/% and line color from chart history (`portfolioChartPeriodMetrics`). */
    const { portfolioPeriodStats, portfolioChartLineColor } = useMemo(() => {
        if (!chartData?.length) {
            return { portfolioPeriodStats: null, portfolioChartLineColor: Color.green };
        }
        const nowMs = Date.now();
        const series = buildTimeAxisPriceSeries(
            chartData,
            portfolioChartPeriod,
            portfolio?.totalValue ?? null,
            nowMs
        );
        const stats = portfolioChartPeriodMetrics(series, portfolioChartPeriod, nowMs);
        if (!stats) {
            return { portfolioPeriodStats: null, portfolioChartLineColor: Color.green };
        }
        return {
            portfolioPeriodStats: stats,
            portfolioChartLineColor: stats.endPrice >= stats.startPrice ? Color.green : Color.red,
        };
    }, [chartData, portfolioChartPeriod, portfolio?.totalValue, Color.green, Color.red]);

    const topMoversQuery = useTopMovers(5, discoveryQueryEnabled);
    const highestVolumeQuery = useHighestVolume(9, discoveryQueryEnabled);
    const onTheRiseQuery = useOnTheRise(9, discoveryQueryEnabled);
    const upsetAlertQuery = useUpsetAlert(9, discoveryQueryEnabled);
    const leaguesQuery = useLeagues(discoveryQueryEnabled);
    const { data: followedStocksFromApi = [] } = useFollowedStocksNotOwned(
        isAuthenticated && discoveryQueryEnabled
    );

    const topMovers = topMoversQuery.data ?? { gainers: [], losers: [] };
    const highestVolumeStocks = highestVolumeQuery.data ?? [];
    const onTheRiseStocks = onTheRiseQuery.data ?? [];
    const upsetAlertStocks = upsetAlertQuery.data ?? [];
    const leaguesList: League[] = leaguesQuery.data ?? [];
    const sectionsLoading =
        (isAuthenticated && !discoveryEnabled) ||
        topMoversQuery.isLoading ||
        highestVolumeQuery.isLoading ||
        onTheRiseQuery.isLoading ||
        upsetAlertQuery.isLoading ||
        leaguesQuery.isLoading;

    const showPortfolioSkeleton =
        isAuthenticated && portfolio == null && (portfolioPending || portfolioFetching);
    const portfolioLoadError =
        isAuthenticated && portfolio == null && portfolioQueryError && !portfolioPending && !portfolioFetching;

    const skeletonBg = isDark ? '#2C2C32' : '#E5E7EB';

    // Animation values for sort dropdown
    const sortDropdownOpacity = useSharedValue(0);
    const sortDropdownScale = useSharedValue(0.8);

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

    const handleStockPress = (stockOrId: Stock | number) => {
        lightImpact();
        if (typeof stockOrId === 'object') {
            setActiveStock(stockOrId);
            setActiveStockId(stockOrId.id);
        } else {
            setActiveStockId(stockOrId);
        }
    };

    const handlePortfolioMarqueePress = useCallback(
        async (card: PortfolioPreviewCard) => {
            lightImpact();
            if (card.stockId != null) {
                setActiveStockId(card.stockId);
                return;
            }
            try {
                const { stocks } = await fetchStocks({ search: card.ticker, limit: 24 });
                const match = stocks.find(
                    (s) => s.ticker.toUpperCase() === card.ticker.toUpperCase()
                );
                if (match) {
                    setActiveStock(match);
                    setActiveStockId(match.id);
                }
            } catch {
                /* ignore */
            }
        },
        [lightImpact, setActiveStockId, setActiveStock]
    );

    const pageCount = Math.ceil(sortedPositions.length / 3);

    const ownedStockIds = useMemo(() => new Set(positions.map(p => p.stock.id)), [positions]);
    const allStocksFromSections = useMemo(() => {
        const set = new Map<number, Stock>();
        topMovers.gainers.forEach((m) => set.set(m.stock.id, m.stock));
        topMovers.losers.forEach((m) => set.set(m.stock.id, m.stock));
        highestVolumeStocks.forEach((s) => set.set(s.id, s));
        onTheRiseStocks.forEach((m) => set.set(m.stock.id, m.stock));
        upsetAlertStocks.forEach((m) => set.set(m.stock.id, m.stock));
        return Array.from(set.values());
    }, [topMovers, highestVolumeStocks, onTheRiseStocks, upsetAlertStocks]);
    const followedStocksSection = useMemo(() => {
        const map = new Map<number, Stock>();
        // Start with stocks from backend (already filtered to not-owned)
        followedStocksFromApi.forEach((s) => {
            map.set(s.id, s);
        });
        // Add any locally-followed stocks that appear in other sections
        allStocksFromSections.forEach((s) => {
            if (followedStockIds.includes(s.id) && !ownedStockIds.has(s.id)) {
                if (!map.has(s.id)) {
                    map.set(s.id, s);
                }
            }
        });
        return Array.from(map.values());
    }, [followedStocksFromApi, allStocksFromSections, followedStockIds, ownedStockIds]);

    const getPriceChange = useCallback((stockId: number) => {
        const g = topMovers.gainers.find(m => m.stock.id === stockId);
        if (g) return { amount: g.change, percentage: g.changePercentage };
        const l = topMovers.losers.find(m => m.stock.id === stockId);
        if (l) return { amount: l.change, percentage: l.changePercentage };
        const r = onTheRiseStocks.find(m => m.stock.id === stockId);
        if (r) return { amount: 0, percentage: r.changePercentage };
        const u = upsetAlertStocks.find(m => m.stock.id === stockId);
        if (u) return { amount: 0, percentage: u.changePercentage };
        return { amount: 0, percentage: 0 };
    }, [topMovers, onTheRiseStocks, upsetAlertStocks]);

    const leagueButtons = useMemo(() => {
        const order = ['NFL', 'NBA', 'NCAA Basketball', 'NCAA Football'];
        const byName = new Map(leaguesList.map(l => [l.name, l]));
        return order.map(name => {
            const league = byName.get(name);
            return league ? { id: league.id, name: league.name, image: leagueImages[league.name] ?? null } : null;
        }).filter((b): b is { id: number; name: string; image: any } => b != null && b.image != null);
    }, [leaguesList]);

    const stocksByTicker = useMemo(() => {
        const m = new Map<string, Stock>();
        for (const s of allStocksFromSections) {
            m.set(s.ticker.toUpperCase(), s);
        }
        return m;
    }, [allStocksFromSections]);

    const loggedOutPortfolioCards = useMemo<PortfolioPreviewCard[]>(() => {
        const defs: Omit<PortfolioPreviewCard, 'stockId'>[] = [
            { id: 'kc', ticker: 'KC', changePercent: -67.69, backgroundColor: '#D70000' },
            { id: 'phi', ticker: 'PHI', changePercent: 69.67, backgroundColor: '#205A0A' },
            { id: 'bama', ticker: 'BAMA', changePercent: -23.40, backgroundColor: '#3D020A' },
            { id: 'jac', ticker: 'JAC', changePercent: -42.07, backgroundColor: '#2F8FCD' },
            { id: 'mia', ticker: 'MIA', changePercent: 32.18, backgroundColor: '#067A73' },
        ];
        return defs.map((d) => {
            const stock = stocksByTicker.get(d.ticker.toUpperCase());
            return {
                ...d,
                ...(stock ? { stockId: stock.id } : {}),
            };
        });
    }, [stocksByTicker]);

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

                {/* Top Movers Banner - wrapper reserves space so content below doesn't snap when banner loads */}
                <View style={styles.topMoversBannerWrapper}>
                    <TopMoversBanner
                        onStockPress={(stock) => handleStockPress(stock)}
                        gainers={topMovers.gainers}
                        losers={topMovers.losers}
                        loading={sectionsLoading}
                    />
                </View>

                {/* Portfolio Summary Card - only when logged in */}
                {isAuthenticated && (
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

                                {portfolioLoadError ? (
                                    <>
                                        <Text style={[styles.portfolioErrorText, { color: Color.subText }]}>
                                            {"Couldn't load portfolio"}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                lightImpact();
                                                refetchPortfolio();
                                            }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Text style={[styles.portfolioRetryText, { color: Color.green }]}>Tap to retry</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : showPortfolioSkeleton ? (
                                    <>
                                        <View style={[styles.skeletonBar, { width: 200, height: 40, backgroundColor: skeletonBg }]} />
                                        <View style={[styles.portfolioStats, { marginTop: 8 }]}>
                                            <View style={[styles.skeletonBar, { width: 88, height: 18, backgroundColor: skeletonBg }]} />
                                            <View style={[styles.skeletonBar, { width: 72, height: 18, backgroundColor: skeletonBg }]} />
                                            <View style={[styles.skeletonBar, { width: 48, height: 14, backgroundColor: skeletonBg, marginLeft: 8 }]} />
                                        </View>
                                    </>
                                ) : portfolio != null ? (
                                    <>
                                        <Text style={[styles.portfolioValue, { color: Color.baseText }]}>
                                            {formatCurrency(portfolio.totalValue)}
                                        </Text>

                                        <View style={styles.portfolioStats}>
                                            {positions.length > 0 && chartLoading ? (
                                                <>
                                                    <View style={[styles.skeletonBar, { width: 88, height: 18, backgroundColor: skeletonBg }]} />
                                                    <View style={[styles.skeletonBar, { width: 72, height: 18, backgroundColor: skeletonBg }]} />
                                                    <Text style={[styles.portfolioToday, { color: Color.subText }]}>
                                                        {PORTFOLIO_CHART_PERIOD_LABEL[portfolioChartPeriod]} · Portfolio
                                                    </Text>
                                                </>
                                            ) : positions.length > 0 && chartData && chartData.length > 0 ? (
                                                <>
                                                    <Text
                                                        style={[
                                                            styles.portfolioGainLoss,
                                                            {
                                                                color:
                                                                    (portfolioPeriodStats?.dollar ?? 0) >= 0
                                                                        ? Color.green
                                                                        : Color.red,
                                                            },
                                                        ]}
                                                    >
                                                        {formatCurrency(portfolioPeriodStats?.dollar ?? 0)}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.portfolioGainLoss,
                                                            {
                                                                color:
                                                                    (portfolioPeriodStats?.percent ?? 0) >= 0
                                                                        ? Color.green
                                                                        : Color.red,
                                                            },
                                                        ]}
                                                    >
                                                        ({formatPercentage(portfolioPeriodStats?.percent ?? 0)})
                                                    </Text>
                                                    <Text style={[styles.portfolioToday, { color: Color.subText }]}>
                                                        {PORTFOLIO_CHART_PERIOD_LABEL[portfolioChartPeriod]} · Portfolio
                                                    </Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Text
                                                        style={[
                                                            styles.portfolioGainLoss,
                                                            { color: portfolio.totalGainLoss >= 0 ? Color.green : Color.red },
                                                        ]}
                                                    >
                                                        {formatCurrency(portfolio.totalGainLoss)}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.portfolioGainLoss,
                                                            { color: portfolio.totalGainLoss >= 0 ? Color.green : Color.red },
                                                        ]}
                                                    >
                                                        ({formatPercentage(portfolio.totalGainLossPercentage)})
                                                    </Text>
                                                    <Text style={[styles.portfolioToday, { color: Color.subText }]}>
                                                        Total return
                                                    </Text>
                                                </>
                                            )}
                                        </View>
                                    </>
                                ) : null}

                                {showPortfolioSkeleton ? (
                                    <View style={styles.chartPlaceholder}>
                                        <ChartLoadingSkeleton isDark={isDark} />
                                    </View>
                                ) : portfolioLoadError ? (
                                    <View style={styles.chartPlaceholder} />
                                ) : chartLoading ? (
                                    <View style={styles.chartPlaceholder}>
                                        <ChartLoadingSkeleton isDark={isDark} />
                                    </View>
                                ) : positions.length === 0 || !chartData || chartData.length === 0 ? (
                                    <EmptyState
                                        icon="stats-chart-outline"
                                        title="No chart data yet"
                                        subtitle="Buy your first stock to see price history here."
                                        actionLabel="Browse stocks"
                                        onAction={() => router.push('/(tabs)/search')}
                                        style={styles.chartEmptyState}
                                    />
                                ) : (
                                    <Chart
                                        stockId="portfolio"
                                        color={portfolioChartLineColor}
                                        priceData={chartData}
                                        defaultTimePeriod="1M"
                                        timePeriod={portfolioChartPeriod}
                                        onTimePeriodChange={setPortfolioChartPeriod}
                                        timeScaledX
                                        livePrice={portfolio?.totalValue ?? null}
                                    />
                                )}
                            </View>
                        </GlassCard>
                    </View>
                )}

                {/* My Portfolio: full content when logged in, CTA when logged out */}
                <View style={styles.section}>
                    {isAuthenticated ? (
                        <GlassCard style={styles.investmentsCard} padding={0}>
                            <View style={styles.investmentsContent}>
                                    <Text style={[styles.investmentsTitle, { color: Color.baseText }]}>
                                        My Portfolio
                                    </Text>

                                    {portfolioLoadError ? (
                                        <View style={styles.portfolioInlineError}>
                                            <Text style={[styles.portfolioErrorText, { color: Color.subText }]}>
                                                {"Couldn't load portfolio"}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    lightImpact();
                                                    refetchPortfolio();
                                                }}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Text style={[styles.portfolioRetryText, { color: Color.green }]}>Tap to retry</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : showPortfolioSkeleton ? (
                                        <>
                                            <View style={styles.investmentOverview}>
                                                <View style={styles.investmentLeft}>
                                                    <View style={[styles.skeletonBar, { width: 100, height: 22, backgroundColor: skeletonBg }]} />
                                                    <View style={[styles.skeletonBar, { width: 52, height: 14, backgroundColor: skeletonBg, marginTop: 6 }]} />
                                                </View>
                                                <View style={styles.investmentRight}>
                                                    <View style={[styles.skeletonBar, { width: 88, height: 22, backgroundColor: skeletonBg }]} />
                                                    <View style={[styles.skeletonBar, { width: 36, height: 14, backgroundColor: skeletonBg, marginTop: 6 }]} />
                                                </View>
                                            </View>
                                            <View style={[styles.divider, { backgroundColor: isDark ? '#242428' : '#E5E7EB' }]} />
                                            <View style={styles.summaryDetails}>
                                                <View style={[styles.skeletonBar, { width: 96, height: 14, backgroundColor: skeletonBg }]} />
                                                <View style={[styles.skeletonBar, { width: 120, height: 18, backgroundColor: skeletonBg }]} />
                                            </View>
                                            <View style={styles.summaryDetails}>
                                                <View style={[styles.skeletonBar, { width: 88, height: 14, backgroundColor: skeletonBg }]} />
                                                <View style={[styles.skeletonBar, { width: 56, height: 18, backgroundColor: skeletonBg }]} />
                                            </View>
                                            <View style={[styles.divider, { backgroundColor: isDark ? '#242428' : '#E5E7EB' }]} />
                                            <View style={styles.stocksOwnedHeader}>
                                                <View style={styles.stocksOwnedLeft}>
                                                    <Text style={[styles.stocksOwnedTitle, { color: Color.baseText }]}>
                                                        My Teams
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.skeletonTeamsBlock}>
                                                {[0, 1, 2].map((i) => (
                                                    <View key={i} style={styles.skeletonTeamRow}>
                                                        <View style={[styles.skeletonBar, { width: 36, height: 14, backgroundColor: skeletonBg }]} />
                                                        <View style={[styles.skeletonBar, { flex: 1, height: 14, backgroundColor: skeletonBg, marginHorizontal: 12 }]} />
                                                        <View style={[styles.skeletonBar, { width: 64, height: 14, backgroundColor: skeletonBg }]} />
                                                    </View>
                                                ))}
                                            </View>
                                        </>
                                    ) : portfolio != null ? (
                                        <>
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

                                    <View style={[styles.divider, { backgroundColor: isDark ? '#242428' : '#E5E7EB' }]} />

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

                                    <View style={[styles.divider, { backgroundColor: isDark ? '#242428' : '#E5E7EB' }]} />

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

                                    {sortedPositions.length === 0 ? (
                                        <EmptyState
                                            icon="wallet-outline"
                                            title="No teams yet"
                                            subtitle="Buy your first stock to start building your portfolio."
                                            actionLabel="Browse stocks"
                                            onAction={() => router.push('/(tabs)/search')}
                                        />
                                    ) : (
                                        <>
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
                                                                    mediumImpact();
                                                                    setActivePosition(position);
                                                                    setPositionDetailBottomSheetOpen(true);
                                                                }}
                                                                onPressIn={() => { }}
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

                                            <View style={styles.paginationDots}>
                                                {Array.from({ length: pageCount }, (_, index) => (
                                                    <View key={index} style={[styles.paginationDot, { backgroundColor: activePage === index ? isDark ? '#ccc' : '#777' : isDark ? '#777' : '#ccc' }]} />
                                                ))}
                                            </View>
                                        </>
                                    )}
                                </>
                                    ) : null}

                            </View>
                        </GlassCard>
                    ) : (
                        <>
                            <PortfolioPreviewMarquee
                                cards={loggedOutPortfolioCards}
                                onCardPress={handlePortfolioMarqueePress}
                            />
                            <TouchableOpacity
                                style={styles.buySportStocksButton}
                                onPress={() => {
                                    lightImpact();
                                    router.push('/(tabs)/search');
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buySportStocksButtonText}>Buy SportStocks</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Followed Stocks Section - when authenticated and has followed stocks or show empty */}
                {isAuthenticated && (
                    <View style={styles.section}>
                        <GlassCard style={styles.investmentsCard} padding={0}>
                            <View style={styles.investmentsContent}>
                                <Text style={[styles.investmentsTitle, { color: Color.baseText }]}>
                                    Following
                                </Text>
                                {followedStocksSection.length === 0 ? (
                                    <EmptyState
                                        icon="star-outline"
                                        title="No followed stocks"
                                        subtitle="Follow stocks you're interested in to see them here."
                                        actionLabel="Discover stocks"
                                        onAction={() => router.push('/(tabs)/search')}
                                    />
                                ) : (
                                    <>
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
                                            {Array.from({ length: Math.ceil(followedStocksSection.length / 3) }, (_, pageIndex) => (
                                                <View key={pageIndex} style={styles.stockPage}>
                                                    {followedStocksSection.slice(pageIndex * 3, (pageIndex + 1) * 3).map((stock) => {
                                                        const priceChange = getPriceChange(stock.id);
                                                        return (
                                                            <TouchableOpacity
                                                                key={stock.id}
                                                                style={styles.stockItem}
                                                                onPress={() => {
                                                                    handleStockPress(stock);
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
                                        {Math.ceil(followedStocksSection.length / 3) > 1 && (
                                            <View style={styles.paginationDots}>
                                                {Array.from({ length: Math.ceil(followedStocksSection.length / 3) }, (_, index) => (
                                                    <View key={index} style={[styles.paginationDot, { backgroundColor: index === 0 ? isDark ? '#ccc' : '#777' : isDark ? '#777' : '#ccc' }]} />
                                                ))}
                                            </View>
                                        )}
                                    </>
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
                            {highestVolumeStocks.length === 0 && !sectionsLoading ? (
                                <EmptyState
                                    icon="bar-chart-outline"
                                    title="No volume data yet"
                                    subtitle="Trading volume will appear here once the market is active."
                                />
                            ) : (
                                <>
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
                                                                handleStockPress(stock);
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
                                </>
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
                            {onTheRiseStocks.length === 0 && !sectionsLoading ? (
                                <EmptyState
                                    icon="trending-up-outline"
                                    title="No risers yet"
                                    subtitle="Stocks with positive movement will show up here."
                                />
                            ) : (
                                <>
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
                                                                handleStockPress(item.stock);
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
                                </>
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
                            {upsetAlertStocks.length === 0 && !sectionsLoading ? (
                                <EmptyState
                                    icon="trending-down-outline"
                                    title="No upset data yet"
                                    subtitle="Stocks with big drops will show up here."
                                />
                            ) : (
                                <>
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
                                                                handleStockPress(item.stock);
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
                                </>
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
    topMoversBannerWrapper: {
        minHeight: 88, // banner height 80 + marginBottom 24 + marginTop -16 = 88; reserves space so no snap when it loads
    },
    cardContainer: {
        marginTop: 0,
        marginBottom: 24,
    },
    portfolioCard: {
        minHeight: 200,
    },
    chartPlaceholder: {
        minHeight: 200,
        width: '100%',
        alignSelf: 'stretch',
        justifyContent: 'center',
    },
    chartEmptyState: {
        minHeight: 160,
    },
    portfolioContent: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 20,
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
    portfolioErrorText: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 8,
    },
    portfolioRetryText: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    portfolioInlineError: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    skeletonBar: {
        borderRadius: 6,
    },
    skeletonTeamsBlock: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 14,
    },
    skeletonTeamRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
    buySportStocksButton: {
        alignSelf: 'center',
        marginTop: 20,
        minWidth: 260,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 999,
        backgroundColor: '#000000',
        marginHorizontal: 20,
    },
    buySportStocksButtonText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
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
