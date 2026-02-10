import { Ticker } from '@/components/Ticker';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { positions } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MyStashScreen() {
    const Color = useColors();
    const { isDark } = useTheme();
    const { lightImpact, mediumImpact } = useHaptics();
    const router = useRouter();
    const { setActivePosition, setPositionDetailBottomSheetOpen } = useStockStore();

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { backgroundColor: isDark ? '#0B0F13' : '#FFFFFF' }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        lightImpact();
                        router.back();
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={Color.baseText} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Color.baseText }]}>My Stash</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.listContainer}>
                    <GlassCard style={styles.listCard} padding={0}>
                        <View style={styles.listContent}>
                            {positions.map((position, index) => {
                                const teamColor = position.stock.color || position.colors[0]?.hex || Color.green;
                                const gainLossColor = position.totalGainLoss >= 0 ? Color.green : Color.red;
                                const isLast = index === positions.length - 1;

                                return (
                                    <TouchableOpacity
                                        key={position.stock.id}
                                        style={[
                                            styles.stashRow,
                                            !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? '#242428' : '#E5E7EB' },
                                        ]}
                                        onPress={() => {
                                            mediumImpact();
                                            setActivePosition(position);
                                            setPositionDetailBottomSheetOpen(true);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ticker ticker={position.stock.ticker} color={teamColor} size="small" />
                                        <Text style={[styles.stashRowName, { color: Color.baseText }]} numberOfLines={1}>
                                            {position.stock.name}
                                        </Text>
                                        <Text style={[styles.stashRowGainLoss, { color: gainLossColor }]}>
                                            {position.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(position.totalGainLoss)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </GlassCard>
                </View>
            </ScrollView>
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
        padding: 8,
        minWidth: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100,
    },
    listContainer: {
        marginBottom: 24,
    },
    listCard: {
        minHeight: 120,
    },
    listContent: {
        paddingVertical: 4,
    },
    stashRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    stashRowName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    stashRowGainLoss: {
        fontSize: 15,
        fontWeight: '600',
    },
});
