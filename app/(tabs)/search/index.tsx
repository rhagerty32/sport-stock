import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useSearch } from '@/contexts/SearchContext';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { leagues, stocks } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Stock } from '@/types';
import React from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SearchScreen() {
    const Color = useColors();
    const { isDark } = useTheme();
    const { selection } = useHaptics();
    const { searchQuery } = useSearch();
    const { setActiveStockId } = useStockStore();
    const [selectedLeague, setSelectedLeague] = React.useState<string>('All');

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

    const filteredStocks = stocks.filter(stock => {
        const matchesSearch = stock.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLeague = selectedLeague === 'All' ||
            leagues.find(l => l.id === stock.leagueID)?.name === selectedLeague;
        return matchesSearch && matchesLeague;
    });

    const getPriceChange = (stock: Stock) => {
        // Simulate price change
        const change = (Math.random() - 0.5) * 10;
        return {
            amount: change,
            percentage: (change / stock.price) * 100,
        };
    };


    const renderStockCard = ({ item: stock }: { item: Stock }) => {
        const priceChange = getPriceChange(stock);
        const league = leagues.find(l => l.id === stock.leagueID);

        return (
            <TouchableOpacity
                onPress={() => {
                    setActiveStockId(stock.id);
                    selection();
                }}
                style={styles.gridCardWrapper}
            >
                <GlassCard style={styles.gridCard}>
                    <View style={styles.gridCardContent}>
                        <View style={[styles.teamLogo, { backgroundColor: isDark ? '#2F2F2F' : '#E5E7EB' }]}>
                            <Text style={[styles.logoText, { color: isDark ? '#D1D5DB' : '#6B7280' }]}>
                                {stock.name.split(' ').map(word => word[0]).join('')}
                            </Text>
                        </View>
                        <View style={styles.gridCardInfo}>
                            <Text style={[styles.gridStockName, { color: Color.baseText }]}>
                                {stock.name}
                            </Text>
                            <Text style={[styles.gridLeagueName, { color: Color.subText }]}>
                                {league?.name}
                            </Text>
                            <Text style={[styles.gridStockPrice, { color: Color.baseText }]}>
                                {formatCurrency(stock.price)}
                            </Text>
                            <Text
                                style={[
                                    styles.gridPriceChange,
                                    { color: priceChange.amount >= 0 ? '#217C0A' : Color.red }
                                ]}
                            >
                                {formatPercentage(priceChange.percentage)}
                            </Text>
                        </View>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={styles.scrollContent}
            >
                {/* League Filter Pills */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        {['All', ...leagues.map(l => l.name)].map((league) => (
                            <TouchableOpacity
                                key={league}
                                style={[
                                    styles.filterPill,
                                    selectedLeague === league && styles.activeFilterPill,
                                    {
                                        backgroundColor: selectedLeague === league ? '#217C0A' : 'transparent',
                                        borderColor: selectedLeague === league
                                            ? '#217C0A'
                                            : (isDark ? '#4B5563' : '#E5E7EB')
                                    }
                                ]}
                                onPress={() => {
                                    setSelectedLeague(league);
                                    selection();
                                }}
                            >
                                <Text style={[
                                    styles.filterPillText,
                                    { color: selectedLeague === league ? '#FFFFFF' : (Color.subText) }
                                ]}>
                                    {league}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Results Count */}
                <View style={styles.resultsContainer}>
                    <Text style={[styles.resultsText, { color: Color.subText }]}>
                        {filteredStocks.length} teams found
                    </Text>
                </View>

                {/* Team List/Grid */}
                <View style={styles.teamsContainer}>
                    <FlatList
                        data={filteredStocks}
                        renderItem={renderStockCard}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        scrollEnabled={false}
                        contentContainerStyle={styles.teamsList}
                        columnWrapperStyle={styles.gridRow}
                    />
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
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    filterContainer: {
        marginBottom: 20,
        marginTop: 10
    },
    filterScroll: {
        paddingLeft: 20,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        // borderColor will be set dynamically
    },
    activeFilterPill: {
        borderColor: '#217C0A',
    },
    filterPillText: {
        fontSize: 14,
        fontWeight: '500',
    },
    viewModeContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    viewModeButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    viewModeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeViewModeButton: {
        borderColor: '#217C0A',
    },
    viewModeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    resultsContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    resultsText: {
        fontSize: 14,
    },
    teamsContainer: {
        paddingHorizontal: 10,
    },
    teamsList: {
        paddingBottom: 20,
    },
    gridRow: {
        justifyContent: 'space-between',
    },
    gridCardWrapper: {
        width: '48%',
        marginBottom: 16,
    },
    gridCard: {
        width: '100%',
    },
    gridCardContent: {
        alignItems: 'center',
        gap: 12,
    },
    gridCardInfo: {
        alignItems: 'center',
        gap: 4,
    },
    gridStockName: {
        fontSize: 14,
        fontWeight: '600',
    },
    gridLeagueName: {
        fontSize: 12,
    },
    gridStockPrice: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    gridPriceChange: {
        fontSize: 12,
        fontWeight: '500',
    },
    listCard: {
        marginBottom: 12,
    },
    listCardContent: {
        flex: 1,
    },
    listCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    listCardInfo: {
        flex: 1,
        gap: 4,
    },
    stockName: {
        fontSize: 16,
        fontWeight: '600',
    },
    leagueName: {
        fontSize: 14,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stockPrice: {
        fontSize: 14,
        fontWeight: '500',
    },
    priceChange: {
        fontSize: 14,
        fontWeight: '500',
    },
    teamLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 16,
        fontWeight: 'bold',
        // color will be set dynamically
    },
    bottomSpacing: {
        height: 100,
    },
});
