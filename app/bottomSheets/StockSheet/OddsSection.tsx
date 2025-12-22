import { Ticker } from '@/components/Ticker';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useGameOdds } from '@/lib/odds-api';
import { Stock } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import { calculateWinProbability, getTeamAbbreviation, getTeamColor } from './utils';

export const OddsSection = ({ apiTeamName, sportKey, stock }: { apiTeamName: string, sportKey: string, stock: Stock }) => {
    const { isDark } = useTheme();
    const { data: gameOdds, isLoading: oddsLoading, error: oddsError } = useGameOdds(apiTeamName, sportKey);
    return (
        <View style={styles.statsContainer}>
            <GlassCard style={styles.statsCard}>
                <View style={styles.gameOddsHeader}>
                    <Text style={[styles.statsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        GAME ODDS
                    </Text>
                    <View style={styles.draftkingsBranding}>
                        <Text style={[styles.draftkingsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            Odds by DRAFTKINGS
                        </Text>
                    </View>
                </View>

                {oddsLoading ? (
                    <View style={styles.oddsLoadingContainer}>
                        <ActivityIndicator size="small" color={isDark ? '#9CA3AF' : '#6B7280'} />
                        <Text style={[styles.oddsLoadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            Loading odds...
                        </Text>
                    </View>
                ) : oddsError || !gameOdds ? (
                    <View style={styles.emptyOddsState}>
                        <Ionicons name="calendar-outline" size={48} color={isDark ? '#4B5563' : '#9CA3AF'} />
                        <Text style={[styles.emptyOddsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            No Upcoming Games
                        </Text>
                        <Text style={[styles.emptyOddsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            {stock?.name} doesn't have any upcoming games scheduled.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Game Time */}
                        <View style={styles.gameTimeContainer}>
                            <Text style={[styles.gameTime, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                {new Date(gameOdds.event.commence_time).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                }) === new Date().toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                }) ? 'Today' : new Date(gameOdds.event.commence_time).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </Text>
                            <Text style={[styles.gameTime, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                @
                            </Text>
                            <Text style={[styles.gameTime, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                {new Date(gameOdds.event.commence_time).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </Text>
                        </View>

                        {/* Odds Table */}
                        <View style={styles.oddsTable}>
                            {/* Header Row */}
                            <View style={styles.oddsTableHeader}>
                                <View style={styles.oddsTableHeaderTeam} />
                                <Text style={[styles.oddsTableHeaderText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    SPREAD
                                </Text>
                                <Text style={[styles.oddsTableHeaderText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    TOTAL
                                </Text>
                                <Text style={[styles.oddsTableHeaderText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    ML
                                </Text>
                            </View>

                            {/* Home Team Row */}
                            <View style={styles.oddsTableRow}>
                                <View style={styles.oddsTableTeamCell}>
                                    <Text style={[styles.oddsTableTeamName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {gameOdds.event.home_team}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.oddsTableCell,
                                    gameOdds.spread.home && styles.oddsTableCellHighlighted
                                ]}>
                                    {gameOdds.spread.home ? (
                                        <>
                                            <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                {gameOdds.spread.home.point > 0 ? '+' : ''}{gameOdds.spread.home.point}
                                            </Text>
                                            <Text style={[styles.oddsTablePrice, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                {gameOdds.spread.home.price > 0 ? '+' : ''}{gameOdds.spread.home.price}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                            —
                                        </Text>
                                    )}
                                </View>
                                <View style={[
                                    styles.oddsTableCell,
                                    gameOdds.total.over && styles.oddsTableCellHighlighted
                                ]}>
                                    {gameOdds.total.over ? (
                                        <>
                                            <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                o{gameOdds.total.over.point}
                                            </Text>
                                            <Text style={[styles.oddsTablePrice, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                {gameOdds.total.over.price > 0 ? '+' : ''}{gameOdds.total.over.price}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                            —
                                        </Text>
                                    )}
                                </View>
                                <View style={[
                                    styles.oddsTableCell,
                                    gameOdds.moneyline.home !== null && styles.oddsTableCellHighlighted
                                ]}>
                                    {gameOdds.moneyline.home !== null ? (
                                        <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                            {gameOdds.moneyline.home > 0 ? '+' : ''}{gameOdds.moneyline.home}
                                        </Text>
                                    ) : (
                                        <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                            —
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Away Team Row */}
                            <View style={styles.oddsTableRow}>
                                <View style={styles.oddsTableTeamCell}>
                                    <Text style={[styles.oddsTableTeamName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {gameOdds.event.away_team}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.oddsTableCell,
                                    gameOdds.spread.away && styles.oddsTableCellHighlighted
                                ]}>
                                    {gameOdds.spread.away ? (
                                        <>
                                            <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                {gameOdds.spread.away.point > 0 ? '+' : ''}{gameOdds.spread.away.point}
                                            </Text>
                                            <Text style={[styles.oddsTablePrice, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                {gameOdds.spread.away.price > 0 ? '+' : ''}{gameOdds.spread.away.price}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                            —
                                        </Text>
                                    )}
                                </View>
                                <View style={[
                                    styles.oddsTableCell,
                                    gameOdds.total.under && styles.oddsTableCellHighlighted
                                ]}>
                                    {gameOdds.total.under ? (
                                        <>
                                            <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                u{gameOdds.total.under.point}
                                            </Text>
                                            <Text style={[styles.oddsTablePrice, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                {gameOdds.total.under.price > 0 ? '+' : ''}{gameOdds.total.under.price}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                            —
                                        </Text>
                                    )}
                                </View>
                                <View style={[
                                    styles.oddsTableCell,
                                    gameOdds.moneyline.away !== null && styles.oddsTableCellHighlighted
                                ]}>
                                    {gameOdds.moneyline.away !== null ? (
                                        <Text style={[styles.oddsTableValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                            {gameOdds.moneyline.away > 0 ? '+' : ''}{gameOdds.moneyline.away}
                                        </Text>
                                    ) : (
                                        <Text style={[styles.oddsTableValue, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>
                                            —
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Matchup Predictor Chart */}
                        {gameOdds.moneyline.home !== null && gameOdds.moneyline.away !== null && (
                            <View style={styles.matchupPredictorContainer}>
                                <Text style={[styles.matchupPredictorTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    TO WIN
                                </Text>

                                {(() => {
                                    const homeProb = calculateWinProbability(gameOdds.moneyline.home);
                                    const awayProb = calculateWinProbability(gameOdds.moneyline.away);
                                    const totalProb = homeProb + awayProb;
                                    // Normalize to 100%
                                    const homePercent = (homeProb / totalProb) * 100;
                                    const awayPercent = (awayProb / totalProb) * 100;

                                    const homeAbbr = getTeamAbbreviation(gameOdds.event.home_team);
                                    const awayAbbr = getTeamAbbreviation(gameOdds.event.away_team);

                                    // Check if current stock is home or away team
                                    const isHomeTeam = stock?.fullName.toLowerCase().trim() === gameOdds.event.home_team.toLowerCase().trim();

                                    const homeColor = isHomeTeam ? stock.secondaryColor : getTeamColor(gameOdds.event.home_team);
                                    const awayColor = getTeamColor(gameOdds.event.away_team);

                                    const chartSize = 300;
                                    const centerX = chartSize / 2;
                                    const centerY = chartSize / 2;
                                    const radius = 95;
                                    const innerRadius = 75;

                                    // Calculate angles for donut chart
                                    const homeAngle = (homePercent / 100) * 360;
                                    const awayAngle = (awayPercent / 100) * 360;

                                    // Convert angles to radians and calculate arc paths
                                    const homeStartAngle = -90; // Start at top
                                    const homeEndAngle = homeStartAngle + homeAngle;
                                    const awayStartAngle = homeEndAngle;
                                    const awayEndAngle = awayStartAngle + awayAngle;

                                    const toRadians = (deg: number) => (deg * Math.PI) / 180;

                                    const createArc = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
                                        const startRad = toRadians(startAngle);
                                        const endRad = toRadians(endAngle);

                                        const x1 = centerX + outerR * Math.cos(startRad);
                                        const y1 = centerY + outerR * Math.sin(startRad);
                                        const x2 = centerX + outerR * Math.cos(endRad);
                                        const y2 = centerY + outerR * Math.sin(endRad);

                                        const x3 = centerX + innerR * Math.cos(endRad);
                                        const y3 = centerY + innerR * Math.sin(endRad);
                                        const x4 = centerX + innerR * Math.cos(startRad);
                                        const y4 = centerY + innerR * Math.sin(startRad);

                                        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

                                        return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
                                    };

                                    return (
                                        <View style={styles.matchupPredictorContent}>
                                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                                {/* Left side - Away team */}
                                                <View style={styles.matchupPredictorSide}>
                                                    <Text style={[styles.matchupPredictorPercent, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        {awayPercent.toFixed(1)}%
                                                    </Text>
                                                </View>

                                                {/* Right side - Home team */}
                                                <View style={styles.matchupPredictorSide}>
                                                    <Text style={[styles.matchupPredictorPercent, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                        {homePercent.toFixed(1)}%
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Center - Donut Chart */}
                                            <View style={styles.matchupPredictorChart}>
                                                <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
                                                    <Defs>
                                                        <Pattern id="stripesPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                                            <Rect width="4" height="8" fill={isDark ? '#FFFFFF' : '#000000'} opacity="0.4" />
                                                        </Pattern>
                                                    </Defs>

                                                    {/* Home team segment */}
                                                    <Path
                                                        d={createArc(homeStartAngle, homeEndAngle, innerRadius, radius)}
                                                        fill={homeColor}
                                                        stroke={isDark ? '#4B5563' : '#9CA3AF'}
                                                        strokeWidth="1"
                                                    />

                                                    {/* Away team segment */}
                                                    <Path
                                                        d={createArc(awayStartAngle, awayEndAngle, innerRadius, radius)}
                                                        fill={awayColor}
                                                        stroke={isDark ? '#4B5563' : '#9CA3AF'}
                                                        strokeWidth="1"
                                                    />

                                                    {/* Center circle for logos */}
                                                    <Circle
                                                        cx={centerX}
                                                        cy={centerY}
                                                        r={innerRadius}
                                                        fill={isDark ? '#1A1D21' : '#FFFFFF'}
                                                    />

                                                    {/* Tickers for the teams */}
                                                    <View style={styles.matchupPredictorTickers}>
                                                        <Ticker ticker={awayAbbr} color={awayColor} />
                                                        <Ticker ticker={homeAbbr} color={homeColor} />
                                                    </View>
                                                </Svg>
                                            </View>
                                        </View>
                                    );
                                })()}
                            </View>
                        )}
                    </>
                )}
            </GlassCard>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        padding: 20
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
    gameOddsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    draftkingsBranding: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    draftkingsText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    gameTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    gameTime: {
        fontSize: 14,
        fontWeight: '500',
    },
    oddsLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    oddsLoadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyOddsState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyOddsTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    emptyOddsText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },
    oddsTable: {
        marginTop: 8,
    },
    oddsTableHeader: {
        flexDirection: 'row',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.2)',
        marginBottom: 12,
    },
    oddsTableHeaderTeam: {
        flex: 2,
    },
    oddsTableHeaderText: {
        flex: 1,
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    oddsTableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 6,
        borderBottomColor: 'rgba(156, 163, 175, 0.1)',
    },
    oddsTableTeamCell: {
        flex: 2,
        justifyContent: 'center',
    },
    oddsTableTeamName: {
        fontSize: 14,
        fontWeight: '600',
    },
    oddsTableCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 6,
    },
    oddsTableCellHighlighted: {
        backgroundColor: 'rgba(156, 163, 175, 0.15)',
    },
    oddsTableValue: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    oddsTablePrice: {
        fontSize: 12,
        fontWeight: '500',
    },
    matchupPredictorContainer: {
        marginTop: 16,
    },
    matchupPredictorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    matchupPredictorContent: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    matchupPredictorSide: {
        flex: 1,
        alignItems: 'center',
    },
    matchupPredictorPercent: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    matchupPredictorChart: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    matchupPredictorTickers: {
        position: 'absolute',
        flexDirection: 'row',
        top: 135,
        left: 92,
        zIndex: 1000,
        gap: 8,
    }
});