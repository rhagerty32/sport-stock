import { EmptyState } from '@/components/EmptyState';
import { ThemedView } from '@/components/themed-view';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { fetchLeague } from '@/lib/leagues-api';
import type { League, Stock } from '@/types';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LeaguePage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const { setActiveStockId } = useStockStore();
    const router = useRouter();
    const Color = useColors();
    const [league, setLeague] = useState<League | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        fetchLeague(id, true)
            .then((l) => {
                if (!cancelled) setLeague(l ?? null);
            })
            .catch(() => {
                if (!cancelled) setLeague(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [id]);

    const leagueTeams: Stock[] = league?.stocks ?? [];
    const leagueName = league?.name ?? id ?? 'League';

    const handleTeamPress = (stockId: number) => {
        lightImpact();
        setActiveStockId(stockId);
    };

    const renderTeam = ({ item }: { item: Stock }) => (
        <TouchableOpacity
            style={[styles.teamItem, { backgroundColor: isDark ? '#1A1D21' : '#F3F4F6' }]}
            onPress={() => handleTeamPress(item.id)}
            activeOpacity={0.7}
        >
            <View style={[styles.teamIcon, { backgroundColor: item.color }]}>
                <Text style={styles.teamIconText}>
                    {item.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                </Text>
            </View>
            <View style={styles.teamInfo}>
                <Text style={[styles.teamName, { color: Color.baseText }]}>
                    {item.name}
                </Text>
                <Text style={[styles.teamPrice, { color: Color.subText }]}>
                    ${item.price.toFixed(2)}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : Color.gray500} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <View style={[styles.header, { backgroundColor: isDark ? '#0B0F13' : '#FFFFFF' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={Color.baseText} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: Color.baseText }]}>{leagueName}</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Color.green} />
                </View>
            </ThemedView>
        );
    }

    if (!league) {
        return (
            <ThemedView style={styles.container}>
                <View style={[styles.header, { backgroundColor: isDark ? '#0B0F13' : '#FFFFFF' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={Color.baseText} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: Color.baseText }]}>League</Text>
                    <View style={styles.placeholder} />
                </View>
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
            <View style={[styles.header, { backgroundColor: isDark ? '#0B0F13' : '#FFFFFF' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={Color.baseText} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: Color.baseText }]}>
                    {leagueName}
                </Text>
                <View style={styles.placeholder} />
            </View>

            {leagueTeams.length === 0 ? (
                <EmptyState
                    icon="people-outline"
                    title="No teams yet"
                    subtitle="Teams in this league will show up here once they're added."
                />
            ) : (
                <FlatList
                    data={leagueTeams}
                    renderItem={renderTeam}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 36,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    teamItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    teamIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    teamIconText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    teamInfo: {
        flex: 1,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    teamPrice: {
        fontSize: 14,
    },
});
