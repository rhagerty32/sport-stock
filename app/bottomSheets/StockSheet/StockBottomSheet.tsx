import Chart from '@/components/chart';
import { SportsHeadlinesBanner } from '@/components/SportsHeadlinesBanner';
import { Ticker } from '@/components/Ticker';
import { brightenColor, isDarkColor, useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useLeague, useLeagues } from '@/lib/leagues-api';
import {
    getApiTeamName,
    getSportKey,
    inferCanonicalTeamNameFromStockId,
    inferSportKeyFromStockId,
} from '@/lib/odds-api';
import { headlinesQueryEnabled, useTeamHeadlines } from '@/lib/headlines-api';
import { leagueWithPolymarketDefaults } from '@/lib/polymarket-league-defaults';
import { STOCK_SHEET_PRICE_HISTORY, usePriceHistory, useStock } from '@/lib/stocks-api';
import { usePortfolio } from '@/lib/portfolio-api';
import { useStockStore } from '@/stores/stockStore';
import { appendLivePricePoint, priceHistoryWithSteadyFallback } from '@/lib/price-history-period';
import type { PriceHistory, TimePeriod } from '@/types';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FullWindowOverlay } from 'react-native-screens';
import { ActionButtons } from './ActionButtons';
import { OddsSection } from './OddsSection';
import { PredictionMarkets } from './PredictionMarkets';
import { formatCurrency, formatPercentage } from './utils';
import { YourPosition } from './YourPosition';

const EMPTY_PRICE_HISTORY: PriceHistory[] = [];
const STOCK_SHEET_SNAP_POINTS = ['92%'];

type StockBottomSheetProps = {
    /** Kept for layout compatibility; stock sheet is index-controlled, not present()/dismiss(). */
    stockBottomSheetRef: React.RefObject<BottomSheetModal>;
};

/**
 * NativeTabs (expo-router) renders in a separate iOS window, so BottomSheetModal
 * portals often present behind the tabs (present() succeeds, UI never appears).
 * Use a controlled BottomSheet inside FullWindowOverlay instead.
 */
function SheetHost({ children, visible }: { children: React.ReactNode; visible: boolean }) {
    if (!visible) return null;
    if (Platform.OS === 'ios') {
        return (
            <FullWindowOverlay>
                <GestureHandlerRootView style={StyleSheet.absoluteFill}>{children}</GestureHandlerRootView>
            </FullWindowOverlay>
        );
    }
    return <View style={StyleSheet.absoluteFill} pointerEvents="box-none">{children}</View>;
}

export default function StockBottomSheet({ stockBottomSheetRef: _stockBottomSheetRef }: StockBottomSheetProps) {
    const { activeStockId, activeStock, setActiveStockId, setActiveStock, removeFollow, isFollowing } = useStockStore();
    const { data: portfolio } = usePortfolio();
    const { isDark } = useTheme();
    const Color = useColors();
    const isOpen = activeStockId != null;

    const { data: fetchedStock } = useStock(activeStockId);
    /** Prefer store stock so league id is available before detail fetch finishes; skip invalid 0 from normalizer. */
    const leagueQueryId = useMemo((): string | number | null => {
        const raw = (fetchedStock ?? activeStock)?.leagueID as string | number | undefined | null;
        if (raw == null) return null;
        if (typeof raw === 'number' && raw === 0) return null;
        if (typeof raw === 'string') {
            const t = raw.trim();
            if (t === '' || t === '0') return null;
            return raw;
        }
        return raw;
    }, [fetchedStock, activeStock]);
    const { data: league } = useLeague(leagueQueryId);
    const { data: leaguesList = [] } = useLeagues();
    const priceHistoryQuery = usePriceHistory(
        activeStockId,
        STOCK_SHEET_PRICE_HISTORY.period,
        STOCK_SHEET_PRICE_HISTORY.limit
    );
    const stockPriceHistory = priceHistoryQuery.data ?? EMPTY_PRICE_HISTORY;
    const priceHistoryInitialPending =
        priceHistoryQuery.isPending ||
        (priceHistoryQuery.isFetching && priceHistoryQuery.data === undefined);
    const stock = fetchedStock ?? activeStock ?? null;
    const loading = !!activeStockId && fetchedStock === undefined && !activeStock;

    useEffect(() => {
        if (fetchedStock) setActiveStock(fetchedStock);
    }, [fetchedStock, setActiveStock]);

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

    /** Name used for The Odds API team matching (id slug hint wins over incomplete fullName like "Oklahoma City"). */
    const oddsTeamName = useMemo(() => {
        if (!stock) return null;
        const fromSlug = inferCanonicalTeamNameFromStockId(stock.id ?? activeStockId);
        return fromSlug || getApiTeamName(stock.fullName || stock.name);
    }, [stock, activeStockId]);

    const slugSportKey = useMemo(
        () => inferSportKeyFromStockId(stock?.id ?? activeStockId),
        [stock?.id, activeStockId]
    );

    const leagueFallbackFromList = useMemo(() => {
        if (!slugSportKey) return null;
        // Prefer league from detail when available; otherwise match by sport key from list.
        if (league) return null;
        return leaguesList.find((l) => getSportKey(l.name, l.sport) === slugSportKey) ?? null;
    }, [leaguesList, slugSportKey, league]);
    const leagueForUi = league ?? leagueFallbackFromList;
    const leagueForPolymarket = useMemo(
        () => leagueWithPolymarketDefaults(leagueForUi, slugSportKey),
        [leagueForUi, slugSportKey]
    );
    const sportKey = useMemo(() => {
        if (leagueForUi) return getSportKey(leagueForUi.name, leagueForUi.sport);
        return slugSportKey;
    }, [leagueForUi, slugSportKey]);

    const userPosition = stock && portfolio?.positions
        ? portfolio.positions.find((p) => p.stock.id === stock.id) ?? null
        : null;
    const userOwnsStock = !!userPosition;

    const userFollowsStock = stock ? isFollowing(stock.id) : false;

    useEffect(() => {
        if (stock && userOwnsStock && userFollowsStock) {
            removeFollow(stock.id);
        }
    }, [stock, userOwnsStock, userFollowsStock, removeFollow]);

    const effectiveStock = stock ?? activeStock ?? null;
    const hasStock = !!effectiveStock;

    const teamHeadlineName = useMemo(() => {
        if (!effectiveStock && !oddsTeamName) return null;
        return oddsTeamName || effectiveStock?.fullName || effectiveStock?.name || null;
    }, [effectiveStock, oddsTeamName]);

    const headlinesEnabled = headlinesQueryEnabled();
    const teamHeadlinesQuery = useTeamHeadlines(teamHeadlineName, sportKey ?? null);

    const currentPrice = effectiveStock?.price ?? 0;
    const [sheetChartPeriod, setSheetChartPeriod] = useState<TimePeriod>('ALL');

    const chartPriceData = useMemo(
        () => appendLivePricePoint(stockPriceHistory, currentPrice),
        [stockPriceHistory, currentPrice]
    );

    const sheetChartDisplaySeries = useMemo(() => {
        if (!chartPriceData.length) return null;
        return priceHistoryWithSteadyFallback(chartPriceData, sheetChartPeriod);
    }, [chartPriceData, sheetChartPeriod]);

    const priceChange =
        sheetChartDisplaySeries && sheetChartDisplaySeries.length >= 2
            ? sheetChartDisplaySeries[sheetChartDisplaySeries.length - 1].price -
              sheetChartDisplaySeries[0].price
            : 0;
    const priceChangePercentage =
        sheetChartDisplaySeries &&
        sheetChartDisplaySeries.length >= 2 &&
        sheetChartDisplaySeries[0].price > 0
            ? (priceChange / sheetChartDisplaySeries[0].price) * 100
            : 0;

    useEffect(() => {
        setSheetChartPeriod('ALL');
    }, [activeStockId]);

    const primaryColor = effectiveStock?.color || Color.blue;
    const isDarkBackground = isDarkColor(primaryColor);
    const brightenedPrimaryColor = brightenColor(primaryColor);

    const onSheetChange = useCallback(
        (index: number) => {
            if (__DEV__) {
                // eslint-disable-next-line no-console
                console.log('[StockBottomSheet] sheet change', {
                    index,
                    stockId: activeStockId,
                });
            }
            if (index < 0) {
                setActiveStockId(null);
            }
        },
        [activeStockId, setActiveStockId]
    );

    useEffect(() => {
        if (!__DEV__ || !activeStockId) return;
        if (priceHistoryQuery.dataUpdatedAt === 0) return;
        const n = Array.isArray(priceHistoryQuery.data) ? priceHistoryQuery.data.length : 0;
        // eslint-disable-next-line no-console
        console.log('[StockBottomSheet] price history loaded', {
            stockId: activeStockId,
            pointCount: n,
            dataUpdatedAt: priceHistoryQuery.dataUpdatedAt,
        });
    }, [activeStockId, priceHistoryQuery.data, priceHistoryQuery.dataUpdatedAt]);

    useEffect(() => {
        if (!__DEV__ || !activeStockId || !effectiveStock) return;
        // eslint-disable-next-line no-console
        console.log('[StockBottomSheet] oddsPolymarketWiring', {
            stockId: activeStockId,
            stockName: effectiveStock.name,
            stockFullName: effectiveStock.fullName,
            leagueQueryId,
            slugSportKey,
            leagueFromDetail: !!league,
            leagueFromListFallback: !!leagueFallbackFromList,
            oddsTeamName,
            leagueLoaded: !!leagueForUi,
            leagueName: leagueForUi?.name,
            leagueSport: leagueForUi?.sport,
            sportKey,
            showGameOddsSection: !!(effectiveStock && oddsTeamName && sportKey),
            polymarketQueries: leagueForPolymarket
                ? {
                      playoff: leagueForPolymarket.playoffQuery?.trim() || null,
                      division: leagueForPolymarket.divisionQuery?.trim() || null,
                      conference: leagueForPolymarket.conferenceQuery?.trim() || null,
                      champion: leagueForPolymarket.championQuery?.trim() || null,
                  }
                : null,
            polymarketAnyQuery:
                !!leagueForPolymarket &&
                !!(leagueForPolymarket.playoffQuery?.trim() ||
                    leagueForPolymarket.divisionQuery?.trim() ||
                    leagueForPolymarket.conferenceQuery?.trim() ||
                    leagueForPolymarket.championQuery?.trim()),
        });
    }, [
        activeStockId,
        effectiveStock,
        leagueForUi,
        leagueForPolymarket,
        leagueQueryId,
        leagueFallbackFromList,
        league,
        oddsTeamName,
        slugSportKey,
        sportKey,
    ]);

    return (
        <SheetHost visible={isOpen}>
            <BottomSheet
                index={0}
                onChange={onSheetChange}
                enableDynamicSizing={false}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                handleStyle={{ display: 'none' }}
                snapPoints={STOCK_SHEET_SNAP_POINTS}
                style={{ borderRadius: 25 }}
                backgroundStyle={{ borderRadius: 25, backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }}
            >
                <BottomSheetScrollView showsVerticalScrollIndicator={false}>
                    {!activeStockId ? (
                        <View />
                    ) : loading && !hasStock ? (
                        <View style={{ minHeight: 400, padding: 48, alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="large" color={Color.green} />
                            <Text style={[styles.leagueName, { color: Color.subText, marginTop: 12 }]}>Loading…</Text>
                        </View>
                    ) : hasStock ? (
                        <>
                            <View style={[styles.header, { backgroundColor: primaryColor }]}>
                                <View style={styles.headerContent}>
                                    <Text style={styles.stockName}>{effectiveStock!.name}</Text>
                                    <View style={styles.headerBottomRow}>
                                        <View style={styles.headerLeftGroup}>
                                            <Text style={styles.leagueName}>{leagueForPolymarket?.name}</Text>
                                            <Ticker
                                                ticker={effectiveStock!.ticker}
                                                color={effectiveStock!.secondaryColor}
                                                size="small"
                                            />
                                        </View>
                                        <View
                                            style={[
                                                styles.priceContainer,
                                                { backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' },
                                            ]}
                                        >
                                            <Text style={[styles.currentPrice, { color: Color.baseText }]}>
                                                {formatCurrency(currentPrice)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.pricePerformance}>
                                <Text style={[styles.priceChange, { color: priceChange >= 0 ? Color.green : Color.red }]}>
                                    {priceChange >= 0 ? '↑' : '↓'} {formatPercentage(priceChangePercentage)}
                                </Text>
                            </View>

                            <View style={styles.chartContainer}>
                                <Chart
                                    stockId={effectiveStock!.id}
                                    color={isDarkBackground && isDark ? brightenedPrimaryColor : primaryColor}
                                    backgroundColor={isDark ? '#1A1D21' : '#FFFFFF'}
                                    priceData={chartPriceData}
                                    isInitialLoadPending={priceHistoryInitialPending}
                                    defaultTimePeriod="ALL"
                                    timePeriod={sheetChartPeriod}
                                    onTimePeriodChange={setSheetChartPeriod}
                                />
                                {stockPriceHistory.length === 0 && !priceHistoryInitialPending && (
                                    <Text style={[styles.chartNote, { color: Color.subText }]}>
                                        No price history available yet for this stock.
                                    </Text>
                                )}
                            </View>

                            <ActionButtons
                                userOwnsStock={userOwnsStock}
                                userFollowsStock={userFollowsStock}
                                stock={effectiveStock!}
                            />

                            {headlinesEnabled &&
                            teamHeadlineName &&
                            sportKey &&
                            (teamHeadlinesQuery.isLoading || (teamHeadlinesQuery.data?.length ?? 0) > 0) ? (
                                <View style={styles.teamHeadlinesWrapper}>
                                    <SportsHeadlinesBanner
                                        headlines={teamHeadlinesQuery.data ?? []}
                                        loading={teamHeadlinesQuery.isLoading}
                                    />
                                </View>
                            ) : null}

                            {userOwnsStock && userPosition && (
                                <YourPosition userPosition={userPosition} currentPrice={currentPrice} />
                            )}

                            {effectiveStock && oddsTeamName && sportKey && (
                                <OddsSection apiTeamName={oddsTeamName} sportKey={sportKey} stock={effectiveStock} />
                            )}

                            {effectiveStock && sportKey && (
                                <PredictionMarkets stock={effectiveStock} sportKey={sportKey} />
                            )}

                            <View style={styles.bottomSpacing} />
                        </>
                    ) : null}
                </BottomSheetScrollView>
            </BottomSheet>
        </SheetHost>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 20,
    },
    headerContent: {
        flexDirection: 'column',
        gap: 8,
    },
    stockName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeftGroup: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
    },
    leagueName: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    priceContainer: {
        flexShrink: 0,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    currentPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
    },
    pricePerformance: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    priceChange: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    chartContainer: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    teamHeadlinesWrapper: {
        minHeight: 126,
        marginBottom: 8,
    },
    chartNote: {
        marginTop: 8,
        fontSize: 12,
        textAlign: 'center',
    },
    bottomSpacing: {
        height: 50,
    },
});
