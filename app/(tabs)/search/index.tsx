import { EmptyState } from '@/components/EmptyState';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useSearch } from '@/contexts/SearchContext';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useLeagues } from '@/lib/leagues-api';
import { useSearchResults } from '@/lib/search-api';
import { useStockStore } from '@/stores/stockStore';
import type { Stock } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SearchScreen() {
    const Color = useColors();
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const { setActiveStockId, setActiveStock } = useStockStore();
    const { searchQuery, setSearchQuery } = useSearch();
    const [selectedLeague, setSelectedLeague] = useState<string>('All');

    const { data: leaguesList = [] } = useLeagues();
    const leagueIdForFilter = useMemo(() => {
        if (selectedLeague === 'All') return undefined;
        const league = leaguesList.find((l) => l.name === selectedLeague);
        return league ? String(league.id) : undefined;
    }, [selectedLeague, leaguesList]);

    const {
        data: searchResults,
        isLoading: loading,
        isFetching,
        isError,
        refetch,
    } = useSearchResults(
        searchQuery,
        leagueIdForFilter,
        60
    );
    const stocks = searchResults?.stocks ?? [];
    const total = searchResults?.total ?? 0;
    const showLoading = loading || (isFetching && !searchResults);
    const hasQuery = searchQuery.trim() !== '';
    const hasStocks = stocks.length > 0;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const getLeagueForStock = useCallback(
        (stock: Stock) => leaguesList.find((l) => String(l.id) === String(stock.leagueID)),
        [leaguesList]
    );

    const renderStockCard = ({ item: stock }: { item: Stock }) => {
        const league = getLeagueForStock(stock);
        return (
            <TouchableOpacity
                onPress={() => {
                    Keyboard.dismiss();
                    lightImpact();
                    setActiveStock(stock);
                    setActiveStockId(stock.id);
                }}
                style={styles.gridCardWrapper}
            >
                <GlassCard style={styles.gridCard}>
                    <View style={styles.gridCardContent}>
                        <View style={[styles.teamLogo, { backgroundColor: stock.color || (isDark ? '#2F2F2F' : '#E5E7EB') }]}>
                            <Text style={[styles.logoText, { color: isDark && !stock.color ? '#D1D5DB' : '#FFFFFF' }]}>
                                {stock.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                            </Text>
                        </View>
                        <View style={styles.gridCardInfo}>
                            <Text style={[styles.gridStockName, { color: Color.baseText }]}>{stock.name}</Text>
                            <Text style={[styles.gridLeagueName, { color: Color.subText }]}>{league?.name ?? ''}</Text>
                            <Text style={[styles.gridStockPrice, { color: Color.baseText }]}>{formatCurrency(stock.price)}</Text>
                        </View>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    const showErrorState = isError && !showLoading && !isFetching && !hasStocks;
    const showEmpty = !showLoading && !showErrorState && hasQuery && total === 0;
    const leagueNames = useMemo(() => ['All', ...leaguesList.map((l) => l.name)], [leaguesList]);

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { backgroundColor: isDark ? '#0B0F13' : Color.white }]}>
                <Text style={[styles.headerTitle, { color: Color.baseText }]}>Search</Text>
                <TextInput
                    style={[
                        styles.searchInput,
                        {
                            backgroundColor: isDark ? '#1A1D21' : '#F3F4F6',
                            color: Color.baseText,
                            borderColor: isDark ? '#4B5563' : '#E5E7EB',
                        },
                    ]}
                    placeholder="Search teams..."
                    placeholderTextColor={Color.subText}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        {leagueNames.map((league) => (
                            <TouchableOpacity
                                key={league}
                                style={[
                                    styles.filterPill,
                                    selectedLeague === league && styles.activeFilterPill,
                                    {
                                        backgroundColor: selectedLeague === league ? '#217C0A' : 'transparent',
                                        borderColor: selectedLeague === league ? '#217C0A' : (isDark ? '#4B5563' : '#E5E7EB'),
                                    },
                                ]}
                                onPress={() => {
                                    setSelectedLeague(league);
                                    lightImpact();
                                }}
                            >
                                <Text style={[styles.filterPillText, { color: selectedLeague === league ? '#FFFFFF' : Color.subText }]}>
                                    {league}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.resultsContainer}>
                    <Text style={[styles.resultsText, { color: Color.subText }]}>
                        {showLoading
                            ? (hasQuery ? 'Searching…' : 'Loading teams…')
                            : showErrorState
                                ? 'Could not load teams. Pull to refresh.'
                            : hasQuery
                                ? `${total} teams found`
                                : `${total} teams`}
                    </Text>
                </View>

                {showLoading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={Color.green} />
                    </View>
                ) : showErrorState ? (
                    <EmptyState
                        icon="alert-circle-outline"
                        title="Could not load teams"
                        subtitle="Tap to try again."
                        actionLabel="Retry"
                        onAction={refetch}
                    />
                ) : showEmpty ? (
                    <EmptyState
                        icon="search-outline"
                        title="No results"
                        subtitle="Try a different search or league filter."
                    />
                ) : (
                    <View style={styles.teamsContainer}>
                        <FlatList
                            data={stocks}
                            renderItem={renderStockCard}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2}
                            scrollEnabled={false}
                            contentContainerStyle={styles.teamsList}
                            columnWrapperStyle={styles.gridRow}
                        />
                    </View>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    searchInput: {
        height: 44,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    scrollView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    filterContainer: { marginBottom: 20, marginTop: 10 },
    filterScroll: { paddingLeft: 20 },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
    },
    activeFilterPill: { borderColor: '#217C0A' },
    filterPillText: { fontSize: 14, fontWeight: '500' },
    resultsContainer: { paddingHorizontal: 20, marginBottom: 16 },
    resultsText: { fontSize: 14 },
    centered: { paddingVertical: 48, alignItems: 'center' },
    teamsContainer: { paddingHorizontal: 10 },
    teamsList: { paddingBottom: 20 },
    gridRow: { justifyContent: 'space-between' },
    gridCardWrapper: { width: '48%', marginBottom: 16 },
    gridCard: { width: '100%' },
    gridCardContent: { alignItems: 'center', gap: 12 },
    gridCardInfo: { alignItems: 'center', gap: 4 },
    gridStockName: { fontSize: 14, fontWeight: '600' },
    gridLeagueName: { fontSize: 12 },
    gridStockPrice: { fontSize: 16, fontWeight: 'bold' },
    teamLogo: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: 16, fontWeight: 'bold' },
    bottomSpacing: { height: 100 },
});
