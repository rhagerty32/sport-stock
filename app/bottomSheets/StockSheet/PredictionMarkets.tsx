import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { usePolymarketData } from '@/lib/polymarket-api';
import { League, PolymarketEvent, PolymarketMarket, Stock } from '@/types';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export const PredictionMarkets = ({ league, stock }: { league: League, stock: Stock }) => {
    const Color = useColors();
    const { isDark } = useTheme();
    const [allEvents, setAllEvents] = useState<PolymarketEvent[]>([]);
    const { data: playoffData, isLoading: playoffLoading } = usePolymarketData({
        q: league?.playoffQuery || null
    });
    const { data: divisionData, isLoading: divisionLoading } = usePolymarketData({
        q: league?.divisionQuery || null
    });
    const { data: conferenceData, isLoading: conferenceLoading } = usePolymarketData({
        q: league?.conferenceQuery || null
    });
    const { data: championData, isLoading: championLoading } = usePolymarketData({
        q: league?.championQuery || null
    });

    useEffect(() => {
        if (!playoffLoading && !divisionLoading && !conferenceLoading && !championLoading) {
            // Ensure all data are arrays or default to empty array
            const safePlayoffData = Array.isArray(playoffData) ? playoffData : [];
            const safeDivisionData = Array.isArray(divisionData) ? divisionData : [];
            const safeConferenceData = Array.isArray(conferenceData) ? conferenceData : [];
            const safeChampionData = Array.isArray(championData) ? championData : [];

            const allEventsTemp = [
                ...safePlayoffData,
                ...safeDivisionData,
                ...safeConferenceData,
                ...safeChampionData
            ];

            setAllEvents(allEventsTemp);
        }
    }, [playoffLoading, divisionLoading, conferenceLoading, championLoading]);

    const sortOrder = ['Playoffs', 'Division', 'Conference', 'Champion'];
    const sortedEvents = allEvents.sort((a, b) => {
        const aIndex = sortOrder.indexOf(a.title.includes('Playoffs') ? 'Playoffs' : a.title.includes('Division') ? 'Division' : a.title.includes('Conference') ? 'Conference' : a.title.includes('Champion') ? 'Champion' : a.title);
        const bIndex = sortOrder.indexOf(b.title.includes('Playoffs') ? 'Playoffs' : b.title.includes('Division') ? 'Division' : b.title.includes('Conference') ? 'Conference' : b.title.includes('Champion') ? 'Champion' : b.title);
        return aIndex - bIndex;
    });

    return (
        <View style={styles.statsContainer}>
            <GlassCard style={styles.statsCard}>
                <View style={styles.predictionMarketsHeader}>
                    <Text style={[styles.statsTitle, { color: isDark ? Color.white : Color.black }]}>
                        SEASON PREDICTIONS
                    </Text>
                    <View style={styles.poweredByRow}>
                        <Text style={[styles.poweredByText, { color: Color.subText }]}>
                            Powered by
                        </Text>
                        <Image
                            source={require('@/assets/images/polymarket.png')}
                            style={styles.poweredByLogo}
                            contentFit="contain"
                        />
                    </View>
                </View>


                {playoffLoading || divisionLoading || conferenceLoading || championLoading ? (
                    <ActivityIndicator size="small" color={Color.black} />
                ) : allEvents.length > 0 ? (
                    <View style={styles.predictionMarketsContainer}>
                        {sortedEvents.map((event) => {
                            if (!stock?.name) return;
                            const teamMarket: PolymarketMarket | undefined = event.markets.find((market) => market.question.includes(stock?.name) || market.question.includes(stock?.fullName) || market.groupItemTitle.includes(stock?.name));

                            if (!teamMarket) return;

                            let oddsPercent = null;

                            if (JSON.parse(teamMarket.outcomes)[0] === "Yes") {
                                oddsPercent = JSON.parse(teamMarket.outcomePrices)[0];
                            } else {
                                oddsPercent = JSON.parse(teamMarket.outcomePrices)[1];
                            }

                            return (
                                <View key={event.id} style={styles.predictionMarketItem}>
                                    <Text style={[styles.predictionMarketItemText, { color: Color.baseText }]}>{event.title.includes('Playoffs') ? 'Make the Playoffs' : event.title.includes('Division') ? 'Division Champion' : event.title.includes('Conference') ? 'Conference Champion' : event.title.includes('Champion') ? `${league?.name === "NFL" ? "Super Bowl" : league?.name} Champion` : event.title}</Text>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                                        <Text style={[styles.predictionMarketItemText, { color: Color.baseText }]}>{Math.round(oddsPercent * 100)}%</Text>

                                        {/* Small lie chart for winning percentage */}
                                        <Svg width={28} height={28} viewBox="0 0 28 28">
                                            {/* Green segment: percent = event.implied_prob or event.percent or fallback */}
                                            {(() => {
                                                // fallback: 0.5 if can't find a percent
                                                const angle = oddsPercent * 360;
                                                // Calculate coordinates for pie arc
                                                const r = 14, cx = 14, cy = 14;
                                                const largeArcFlag = angle > 180 ? 1 : 0;
                                                const rad = (deg: any) => (Math.PI / 180) * deg;
                                                const x = cx + r * Math.cos(rad(-90 + angle));
                                                const y = cy + r * Math.sin(rad(-90 + angle));
                                                if (oddsPercent === 1) {
                                                    return (
                                                        <Circle
                                                            cx={cx}
                                                            cy={cy}
                                                            r={r}
                                                            fill={oddsPercent > 0.8 ? Color.green : oddsPercent < 0.2 ? Color.red : Color.offWhite}
                                                        />
                                                    );
                                                }
                                                if (oddsPercent === 0) {
                                                    return (
                                                        <Circle
                                                            cx={cx}
                                                            cy={cy}
                                                            r={r}
                                                            fill={isDark ? Color.offBlack : Color.white}
                                                        />
                                                    );
                                                }
                                                return (
                                                    <>
                                                        {/* Gray full background */}
                                                        <Circle cx={cx} cy={cy} r={r} fill={isDark ? Color.offBlack : Color.white} />
                                                        {/* Green arc */}
                                                        <Path
                                                            d={`
                                                        M ${cx} ${cy}
                                            L ${cx} ${cy - r}
                                            A ${r} ${r} 0 ${largeArcFlag} 1 ${x} ${y}
                                            Z
                                                    `}
                                                            fill={oddsPercent > 0.8 ? Color.green : oddsPercent < 0.2 ? Color.red : Color.offWhite}
                                                        />
                                                    </>
                                                );
                                            })()}
                                        </Svg>
                                    </View>
                                </View>
                            )
                        })
                        }
                    </View >
                ) : (
                    <View>
                        <Text>No prediction markets found</Text>
                    </View>
                )}

            </GlassCard >
        </View >
    )
};

const styles = StyleSheet.create({
    predictionMarketItemText: {
        fontSize: 14,
        fontWeight: '500',
    },
    statsContainer: {
        marginHorizontal: 20,
        marginBottom: 24,
    },
    statsCard: {
        padding: 20,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    predictionMarketsHeader: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 8,
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    draftkingsBranding: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    poweredByRow: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        gap: 2,
        position: 'absolute',
        top: 0,
        right: 0
    },
    poweredByText: {
        fontSize: 10,
        fontWeight: '500',
    },
    poweredByLogo: {
        width: 80,
        height: 20,
    },
    predictionMarketsContainer: {
        gap: 12,
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginVertical: 8,
    },
    predictionMarketItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        width: '100%',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
    },
    draftkingsText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    }
});