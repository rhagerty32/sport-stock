import { EmptyState } from '@/components/EmptyState';
import { ThemedView } from '@/components/themed-view';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useLeague } from '@/lib/leagues-api';
import type { League, Stock } from '@/types';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RANK_COL = 28;
const TEAM_ICON = 48;
const TEAM_ICON_MR = 12;
const WL_COL = 34;
const CHEVRON_COL = 22;

const LEAGUE_PILL_BY_NAME: Record<string, string> = {
    NBA: 'Prof. Basketball',
    NFL: 'Prof. Football',
    'NCAA Basketball': 'College Basketball',
    'NCAA Football': 'College Football',
    MLB: 'Prof. Baseball',
    NHL: 'Prof. Hockey',
};

function leaguePillLabel(league: League | undefined, fallbackName: string): string {
    if (league?.name && LEAGUE_PILL_BY_NAME[league.name]) {
        return LEAGUE_PILL_BY_NAME[league.name];
    }
    if (league?.sport?.trim()) {
        return league.sport.trim();
    }
    if (LEAGUE_PILL_BY_NAME[fallbackName]) {
        return LEAGUE_PILL_BY_NAME[fallbackName];
    }
    return fallbackName;
}

function sectionSortKey(title: string): number {
    if (/eastern/i.test(title)) return 0;
    if (/western/i.test(title)) return 1;
    if (/afc\b/i.test(title)) return 0;
    if (/nfc\b/i.test(title)) return 1;
    return 50;
}

type LeagueSection = { title: string; data: Stock[] };

function buildLeagueSections(teams: Stock[]): LeagueSection[] {
    const hasWins = teams.some((s) => s.wins != null);
    const sorted = [...teams].sort((a, b) => {
        if (hasWins) {
            const bw = b.wins ?? -1;
            const aw = a.wins ?? -1;
            if (bw !== aw) return bw - aw;
            const al = a.losses ?? 9999;
            const bl = b.losses ?? 9999;
            return al - bl;
        }
        return b.price - a.price;
    });

    const hasConference = sorted.some((s) => s.conference?.trim());
    if (!hasConference) {
        return [{ title: 'Standings', data: sorted }];
    }

    const byConf = new Map<string, Stock[]>();
    for (const s of sorted) {
        const key = s.conference?.trim() || 'Other';
        if (!byConf.has(key)) byConf.set(key, []);
        byConf.get(key)!.push(s);
    }

    const titles = [...byConf.keys()].sort((a, b) => {
        const da = sectionSortKey(a);
        const db = sectionSortKey(b);
        if (da !== db) return da - db;
        return a.localeCompare(b);
    });

    return titles.map((title) => ({ title, data: byConf.get(title)! }));
}

function teamCircleLabel(stock: Stock): string {
    const t = stock.ticker?.trim();
    if (t) return t.toUpperCase().slice(0, 3);
    return stock.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export default function LeaguePage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const { setActiveStockId } = useStockStore();
    const router = useRouter();
    const Color = useColors();
    const { data: league, isLoading: loading } = useLeague(id ?? null, true);

    const leagueTeams: Stock[] = league?.stocks ?? [];
    const headerTitle = league?.name ?? id ?? 'League';
    const pillLabel =
        league != null ? leaguePillLabel(league, league.name) : loading ? '…' : '—';

    const sections = useMemo(() => buildLeagueSections(leagueTeams), [leagueTeams]);

    const headerBg = isDark ? '#0B0F13' : '#FFFFFF';
    const cardBg = isDark ? '#1A1D21' : '#F3F4F6';
    const pillBorder = isDark ? '#2A2F36' : '#E5E7EB';
    const pillBg = isDark ? '#14181C' : '#F9FAFB';

    const handleTeamPress = (stockId: number) => {
        lightImpact();
        setActiveStockId(stockId);
    };

    const renderHeaderBar = (centerTitle: string) => (
        <View style={[styles.header, { backgroundColor: headerBg }]}>
            <View style={styles.headerSide}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={Color.baseText} />
                </TouchableOpacity>
            </View>
            <Text style={[styles.title, { color: Color.baseText }]} numberOfLines={1}>
                {centerTitle}
            </Text>
            <View style={styles.headerPillWrap}>
                <View style={[styles.headerPill, { borderColor: pillBorder, backgroundColor: pillBg }]}>
                    <Text style={[styles.headerPillText, { color: Color.subText }]} numberOfLines={1}>
                        {pillLabel}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderColumnHeaderRow = () => (
        <View style={styles.columnHeaderOuter}>
            <View style={{ width: RANK_COL }} />
            <View style={styles.columnHeaderInner}>
                <View style={{ width: TEAM_ICON + TEAM_ICON_MR }} />
                <Text style={[styles.columnHeaderTeam, { color: Color.subText }]}>Team</Text>
                <Text style={[styles.columnHeaderWL, { color: Color.subText, width: WL_COL }]}>W</Text>
                <Text style={[styles.columnHeaderWL, { color: Color.subText, width: WL_COL }]}>L</Text>
                <View style={{ width: CHEVRON_COL }} />
            </View>
        </View>
    );

    const renderSectionHeader = ({ section }: { section: LeagueSection }) => (
        <View style={styles.sectionHeaderBlock}>
            <Text style={[styles.sectionTitle, { color: Color.baseText }]}>{section.title}</Text>
            {renderColumnHeaderRow()}
        </View>
    );

    const renderTeamRow = ({ item, index }: { item: Stock; index: number }) => {
        const rank = index + 1;
        const wText = item.wins != null ? String(item.wins) : '—';
        const lText = item.losses != null ? String(item.losses) : '—';
        const circleText = teamCircleLabel(item);
        const circleFontSize = circleText.length >= 3 ? 11 : 14;

        return (
            <View style={styles.rowOuter}>
                <Text style={[styles.rankText, { color: Color.subText }]}>{rank}</Text>
                <TouchableOpacity
                    style={[styles.teamCard, { backgroundColor: cardBg }]}
                    onPress={() => handleTeamPress(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.teamIcon, { backgroundColor: item.color }]}>
                        <Text style={[styles.teamIconText, { fontSize: circleFontSize }]}>{circleText}</Text>
                    </View>
                    <View style={styles.teamInfo}>
                        <Text style={[styles.teamName, { color: Color.baseText }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.teamPrice, { color: Color.subText }]}>${item.price.toFixed(2)}</Text>
                    </View>
                    <Text style={[styles.wlCell, { color: Color.baseText, width: WL_COL }]}>{wText}</Text>
                    <Text style={[styles.wlCell, { color: Color.baseText, width: WL_COL }]}>{lText}</Text>
                    <View style={styles.chevronWrap}>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : Color.gray500} />
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                {renderHeaderBar(headerTitle)}
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Color.green} />
                </View>
            </ThemedView>
        );
    }

    if (!league) {
        return (
            <ThemedView style={styles.container}>
                {renderHeaderBar('League')}
                <EmptyState
                    icon="trophy-outline"
                    title="League not found"
                    subtitle="This league may not exist or could not be loaded."
                />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            {renderHeaderBar(headerTitle)}

            {leagueTeams.length === 0 ? (
                <EmptyState
                    icon="people-outline"
                    title="No teams yet"
                    subtitle="Teams in this league will show up here once they're added."
                />
            ) : (
                <SectionList
                    sections={sections}
                    renderItem={renderTeamRow}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={false}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 12,
        paddingBottom: 16,
    },
    headerSide: {
        width: 40,
        alignItems: 'flex-start',
    },
    backButton: {
        padding: 4,
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    headerPillWrap: {
        maxWidth: '40%',
        minWidth: 40,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    headerPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        maxWidth: '100%',
    },
    headerPillText: {
        fontSize: 11,
        fontWeight: '600',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    sectionHeaderBlock: {
        marginBottom: 8,
        paddingTop: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 8,
    },
    columnHeaderOuter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    columnHeaderInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    columnHeaderTeam: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
    },
    columnHeaderWL: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    rowOuter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    rankText: {
        width: RANK_COL,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    teamCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    teamIcon: {
        width: TEAM_ICON,
        height: TEAM_ICON,
        borderRadius: TEAM_ICON / 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: TEAM_ICON_MR,
    },
    teamIconText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    teamInfo: {
        flex: 1,
        minWidth: 0,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    teamPrice: {
        fontSize: 14,
    },
    wlCell: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right',
    },
    chevronWrap: {
        width: CHEVRON_COL,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
});
