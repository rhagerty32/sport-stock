import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { leagues, stocks } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const leagueImages: Record<string, any> = {
    'NFL': require('@/assets/images/leagues/proFootball.png'),
    'NBA': require('@/assets/images/leagues/proBasketball.png'),
    'NCAA Football': require('@/assets/images/leagues/collegeFootball.png'),
    'NCAA Basketball': require('@/assets/images/leagues/collegeBasketball.png'),
};

const leagueNames: Record<string, string> = {
    'proFootball': 'NFL',
    'proBasketball': 'NBA',
    'collegeFootball': 'NCAA Football',
    'collegeBasketball': 'NCAA Basketball',
};

export default function LeaguePage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const { setActiveStockId } = useStockStore();
    const router = useRouter();

    const leagueName = leagueNames[id] || id;

    // Find league and get its teams
    const league = leagues.find(l => l.name === leagueName);
    const leagueTeams = useMemo(() => {
        if (!league) return [];
        return stocks.filter(s => s.leagueID === league.id);
    }, [league]);

    const handleTeamPress = (stockId: number) => {
        lightImpact();
        setActiveStockId(stockId);
    };

    const renderTeam = ({ item }: { item: typeof stocks[0] }) => (
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

            <FlatList
                data={leagueTeams}
                renderItem={renderTeam}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
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
