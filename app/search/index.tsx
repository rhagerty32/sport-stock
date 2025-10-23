import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useSearch } from '@/contexts/SearchContext';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { leagues, stocks } from '@/lib/dummy-data';
import { Stock } from '@/types';
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SearchScreen() {
    const { isDark } = useTheme();
    const { lightImpact, selection } = useHaptics();
    const { searchQuery, setSearchQuery } = useSearch();
    const [selectedLeague, setSelectedLeague] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

        if (viewMode === 'list') {
            return (
                <GlassCard style={styles.listCard}>
                    <View style={styles.listCardContent}>
                        <View style={styles.listCardHeader}>
                            <View style={[styles.teamLogo, { backgroundColor: '#E5E7EB' }]}>
                                <Text style={styles.logoText}>
                                    {stock.name.split(' ').map(word => word[0]).join('')}
                                </Text>
                            </View>
                            <View style={styles.listCardInfo}>
                                <Text style={[styles.stockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {stock.name}
                                </Text>
                                <Text style={[styles.leagueName, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {league?.name}
                                </Text>
                                <View style={styles.priceContainer}>
                                    <Text style={[styles.stockPrice, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(stock.price)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.priceChange,
                                            { color: priceChange.amount >= 0 ? '#217C0A' : '#dc2626' }
                                        ]}
                                    >
                                        {formatPercentage(priceChange.percentage)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </GlassCard>
            );
        }

        return (
            <GlassCard style={styles.gridCard}>
                <View style={styles.gridCardContent}>
                    <View style={[styles.teamLogo, { backgroundColor: '#E5E7EB' }]}>
                        <Text style={styles.logoText}>
                            {stock.name.split(' ').map(word => word[0]).join('')}
                        </Text>
                    </View>
                    <View style={styles.gridCardInfo}>
                        <Text style={[styles.gridStockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            {stock.name}
                        </Text>
                        <Text style={[styles.gridLeagueName, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            {league?.name}
                        </Text>
                        <Text style={[styles.gridStockPrice, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            {formatCurrency(stock.price)}
                        </Text>
                        <Text
                            style={[
                                styles.gridPriceChange,
                                { color: priceChange.amount >= 0 ? '#217C0A' : '#dc2626' }
                            ]}
                        >
                            {formatPercentage(priceChange.percentage)}
                        </Text>
                    </View>
                </View>
            </GlassCard>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* League Filter Pills */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        {['All', ...leagues.map(l => l.name)].map((league) => (
                            <TouchableOpacity
                                key={league}
                                style={[
                                    styles.filterPill,
                                    selectedLeague === league && styles.activeFilterPill,
                                    { backgroundColor: selectedLeague === league ? '#217C0A' : 'transparent' }
                                ]}
                                onPress={() => {
                                    setSelectedLeague(league);
                                    selection();
                                }}
                            >
                                <Text style={[
                                    styles.filterPillText,
                                    { color: selectedLeague === league ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }
                                ]}>
                                    {league}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* View Mode Toggle */}
                <View style={styles.viewModeContainer}>
                    <View style={styles.viewModeButtons}>
                        <TouchableOpacity
                            style={[
                                styles.viewModeButton,
                                viewMode === 'grid' && styles.activeViewModeButton,
                                { backgroundColor: viewMode === 'grid' ? '#217C0A' : 'transparent' }
                            ]}
                            onPress={() => {
                                setViewMode('grid');
                                selection();
                            }}
                        >
                            <Text style={[
                                styles.viewModeText,
                                { color: viewMode === 'grid' ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }
                            ]}>
                                Grid
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.viewModeButton,
                                viewMode === 'list' && styles.activeViewModeButton,
                                { backgroundColor: viewMode === 'list' ? '#217C0A' : 'transparent' }
                            ]}
                            onPress={() => {
                                setViewMode('list');
                                selection();
                            }}
                        >
                            <Text style={[
                                styles.viewModeText,
                                { color: viewMode === 'list' ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }
                            ]}>
                                List
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Results Count */}
                <View style={styles.resultsContainer}>
                    <Text style={[styles.resultsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {filteredStocks.length} teams found
                    </Text>
                </View>

                {/* Team List/Grid */}
                <View style={styles.teamsContainer}>
                    <FlatList
                        data={filteredStocks}
                        renderItem={renderStockCard}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={viewMode === 'grid' ? 2 : 1}
                        key={viewMode} // Force re-render when view mode changes
                        scrollEnabled={false}
                        contentContainerStyle={styles.teamsList}
                        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
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
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchCard: {
        minHeight: 50,
    },
    searchContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchIcon: {
        fontSize: 18,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 0,
    },
    clearIcon: {
        fontSize: 16,
        padding: 4,
    },
    filterContainer: {
        marginBottom: 20,
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
        borderColor: '#E5E7EB',
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
        paddingHorizontal: 20,
    },
    teamsList: {
        paddingBottom: 20,
    },
    gridRow: {
        justifyContent: 'space-between',
    },
    gridCard: {
        width: '48%',
        marginBottom: 16,
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
        color: '#6B7280',
    },
    bottomSpacing: {
        height: 100,
    },
});
