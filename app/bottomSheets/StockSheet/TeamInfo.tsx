import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useStockStore } from '@/stores/stockStore';
import { League, Stock } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatNumber } from './utils';
import { useColors } from '@/components/utils';

export const TeamInfo = ({ stock, league }: { stock: Stock, league: League }) => {
    const Color = useColors();
    const { isDark } = useTheme();
    const buySellBottomSheetRef = useRef<BottomSheetModal>(null) as React.RefObject<BottomSheetModal>;
    const { buySellBottomSheetOpen } = useStockStore();

    useEffect(() => {
        if (buySellBottomSheetOpen) {
            buySellBottomSheetRef.current?.present();
        } else {
            buySellBottomSheetRef.current?.dismiss();
        }
    }, [buySellBottomSheetOpen]);
    return (
        <View style={styles.statsContainer}>
            <GlassCard style={styles.statsCard}>
                <View style={styles.teamInfoHeader}>
                    <View>
                        <Text style={[styles.statsTitle, { color: Color.baseText }]}>
                            Team Overview
                        </Text>
                        <Text style={[styles.teamInfoSubtitle, { color: Color.subText }]}>
                            {league?.sport} • {league?.name}
                        </Text>
                    </View>
                    <View style={[
                        styles.sportBadge,
                        { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }
                    ]}>
                        <Ionicons name="trophy" size={18} color="#3B82F6" />
                    </View>
                </View>

                {/* About Text */}
                {stock.about && (
                    <View style={styles.aboutTextContainer}>
                        <Text style={[styles.aboutText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                            {stock.about}
                        </Text>
                    </View>
                )}

                {/* Key Stats Grid */}
                <View style={styles.teamStatsGrid}>
                    <View style={styles.teamStatCard}>
                        <View style={styles.teamStatIconContainer}>
                            <Ionicons name="stats-chart" size={20} color={Color.subText} />
                        </View>
                        <Text style={[styles.teamStatLabel, { color: Color.subText }]}>
                            Volume
                        </Text>
                        <Text
                            style={[styles.teamStatValue, { color: Color.baseText }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.7}
                        >
                            {formatNumber(stock.volume)}
                        </Text>
                    </View>

                    <View style={styles.teamStatCard}>
                        <View style={styles.teamStatIconContainer}>
                            <Ionicons name="cash" size={20} color={Color.subText} />
                        </View>
                        <Text style={[styles.teamStatLabel, { color: Color.subText }]}>
                            Market Cap
                        </Text>
                        <Text
                            style={[styles.teamStatValue, { color: Color.baseText }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.7}
                        >
                            {formatNumber(league?.marketCap || 0)}
                        </Text>
                    </View>

                    <View style={styles.teamStatCard}>
                        <View style={styles.teamStatIconContainer}>
                            <Ionicons name="people" size={20} color={Color.subText} />
                        </View>
                        <Text style={[styles.teamStatLabel, { color: Color.subText }]}>
                            League Vol
                        </Text>
                        <Text
                            style={[styles.teamStatValue, { color: Color.baseText }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.7}
                        >
                            {formatNumber(league?.volume || 0)}
                        </Text>
                    </View>
                </View>

                {/* Team Details Row */}
                <View style={styles.teamDetailsRow}>
                    <View style={styles.teamDetailItem}>
                        <Ionicons name="person" size={16} color={Color.subText} />
                        <View style={styles.teamDetailContent}>
                            <Text style={[styles.teamDetailLabel, { color: Color.subText }]}>
                                Coach
                            </Text>
                            <Text style={[styles.teamDetailValue, { color: Color.baseText }]}>
                                {stock.coach}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.teamDetailDivider} />

                    <View style={styles.teamDetailItem}>
                        <Ionicons name="calendar" size={16} color={Color.subText} />
                        <View style={styles.teamDetailContent}>
                            <Text style={[styles.teamDetailLabel, { color: Color.subText }]}>
                                Founded
                            </Text>
                            <Text style={[styles.teamDetailValue, { color: Color.baseText }]}>
                                {stock.founded}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Top Players */}
                {stock.topThreePlayers && stock.topThreePlayers.length > 0 && (
                    <View style={styles.topPlayersContainer}>
                        <View style={styles.topPlayersHeader}>
                            <Ionicons name="star" size={18} color={isDark ? '#F59E0B' : '#F59E0B'} />
                            <Text style={[styles.topPlayersTitle, { color: Color.baseText }]}>
                                Top Players
                            </Text>
                        </View>
                        <View style={styles.topPlayersList}>
                            {stock.topThreePlayers.map((player, index) => (
                                <View key={index} style={styles.topPlayerItem}>
                                    <View style={[
                                        styles.topPlayerRank,
                                        { backgroundColor: index === 0 ? '#F59E0B' : index === 1 ? Color.gray500 : '#CD7F32' }
                                    ]}>
                                        <Text style={styles.topPlayerRankText}>{index + 1}</Text>
                                    </View>
                                    <Text style={[styles.topPlayerName, { color: Color.baseText }]}>
                                        {player}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Listing Info */}
                <View style={styles.listingInfo}>
                    <View style={styles.listingInfoItem}>
                        <Ionicons name="time-outline" size={14} color={Color.subText} />
                        <Text style={[styles.listingInfoText, { color: Color.subText }]}>
                            Listed {stock.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </Text>
                    </View>
                    <View style={styles.listingInfoDivider} />
                    <View style={styles.listingInfoItem}>
                        <Ionicons name="refresh-outline" size={14} color={Color.subText} />
                        <Text style={[styles.listingInfoText, { color: Color.subText }]}>
                            Updated {stock.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                </View>
            </GlassCard>
        </View>
    );
};

const styles = StyleSheet.create({
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
    teamInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    teamInfoSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
    },
    sportBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aboutTextContainer: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.2)',
    },
    aboutText: {
        fontSize: 14,
        lineHeight: 20,
    },
    teamStatsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    teamStatCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(156, 163, 175, 0.08)',
        alignItems: 'center',
    },
    teamStatIconContainer: {
        marginBottom: 8,
    },
    teamStatLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    teamStatValue: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        flexShrink: 1,
    },
    teamDetailsRow: {
        flexDirection: 'row',
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.2)',
        marginBottom: 20,
    },
    teamDetailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    teamDetailContent: {
        flex: 1,
    },
    teamDetailLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    teamDetailValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    teamDetailDivider: {
        width: 1,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        marginHorizontal: 16,
    },
    topPlayersContainer: {
        marginBottom: 20,
    },
    topPlayersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    topPlayersTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    topPlayersList: {
        gap: 10,
    },
    topPlayerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    topPlayerRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topPlayerRankText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    topPlayerName: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    listingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(156, 163, 175, 0.2)',
    },
    listingInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    listingInfoText: {
        fontSize: 11,
        fontWeight: '500',
    },
    listingInfoDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        marginHorizontal: 12,
    }
});