import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useSearch } from '@/contexts/SearchContext';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { leagues, stocks, users } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Stock, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SearchScreen() {
    const { isDark } = useTheme();
    const { lightImpact, selection } = useHaptics();
    const { searchQuery, setSearchQuery } = useSearch();
    const { setActiveUserId, setActiveStockId } = useStockStore();
    const [selectedLeague, setSelectedLeague] = useState<string>('All');
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const searchTab = selectedIndex === 0 ? 'stocks' : 'users';

    const stocksOpacity = useRef(new Animated.Value(searchTab === 'stocks' ? 1 : 0)).current;
    const usersOpacity = useRef(new Animated.Value(searchTab === 'users' ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(stocksOpacity, {
                toValue: searchTab === 'stocks' ? 1 : 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(usersOpacity, {
                toValue: searchTab === 'users' ? 1 : 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [searchTab, stocksOpacity, usersOpacity]);

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

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        const matchesName = `${user.firstName} ${user.lastName}`.toLowerCase().includes(query);
        const matchesEmail = user.email.toLowerCase().includes(query);
        return matchesName || matchesEmail;
    });

    const getPriceChange = (stock: Stock) => {
        // Simulate price change
        const change = (Math.random() - 0.5) * 10;
        return {
            amount: change,
            percentage: (change / stock.price) * 100,
        };
    };

    // User card component with image error handling
    const UserCard = ({ user }: { user: User }) => {
        const [imageError, setImageError] = useState(false);

        return (
            <TouchableOpacity
                onPress={() => {
                    setActiveUserId(user.id);
                    selection();
                }}
                style={{ paddingHorizontal: 10 }}
            >
                <GlassCard style={styles.listCard}>
                    <View style={styles.listCardContent}>
                        <View style={styles.listCardHeader}>
                            {imageError || !user.photoURL ? (
                                <View style={[styles.userAvatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#2F2F2F' : '#E5E7EB' }]}>
                                    <Ionicons
                                        name="person"
                                        size={25}
                                        color={isDark ? '#9CA3AF' : '#6B7280'}
                                    />
                                </View>
                            ) : (
                                <Image
                                    source={{ uri: user.photoURL }}
                                    style={styles.userAvatar}
                                    onError={() => setImageError(true)}
                                />
                            )}
                            <View style={styles.listCardInfo}>
                                <Text style={[styles.stockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {user.firstName} {user.lastName}
                                </Text>
                                <Text style={[styles.leagueName, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {user.email}
                                </Text>
                                <View style={styles.priceContainer}>
                                    <Text style={[
                                        styles.priceChange,
                                        { color: user.public ? '#217C0A' : '#dc2626' }
                                    ]}>
                                        {user.public ? 'Public Portfolio' : 'Private Portfolio'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    const renderUserCard = ({ item: user }: { item: User }) => {
        return <UserCard user={user} />;
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
                {/* Search Tabs */}
                <View style={[styles.tabsContainer, { backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            searchTab === 'stocks' && {
                                backgroundColor: isDark ? '#1A1D21' : '#FFFFFF',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }
                        ]}
                        onPress={() => {
                            setSelectedIndex(0);
                            selection();
                        }}
                    >
                        <Text style={[
                            styles.tabButtonText,
                            {
                                color: searchTab === 'stocks'
                                    ? (isDark ? '#FFFFFF' : '#000000')
                                    : (isDark ? '#9CA3AF' : '#6B7280')
                            }
                        ]}>
                            Stocks
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            searchTab === 'users' && {
                                backgroundColor: isDark ? '#1A1D21' : '#FFFFFF',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }
                        ]}
                        onPress={() => {
                            setSelectedIndex(1);
                            selection();
                        }}
                    >
                        <Text style={[
                            styles.tabButtonText,
                            {
                                color: searchTab === 'users'
                                    ? (isDark ? '#FFFFFF' : '#000000')
                                    : (isDark ? '#9CA3AF' : '#6B7280')
                            }
                        ]}>
                            Users
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ position: 'relative', minHeight: 400 }}>
                    {/* Stocks Section */}
                    <Animated.View
                        style={{
                            opacity: stocksOpacity,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            width: '100%',
                            zIndex: searchTab === 'stocks' ? 1 : 0,
                            pointerEvents: searchTab === 'stocks' ? 'auto' : 'none',
                        }}
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
                                            { color: selectedLeague === league ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }
                                        ]}>
                                            {league}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
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
                                numColumns={2}
                                key={'grid'} // Force re-render when view mode changes
                                scrollEnabled={false}
                                contentContainerStyle={styles.teamsList}
                                columnWrapperStyle={styles.gridRow}
                            />
                        </View>
                    </Animated.View>

                    {/* Users Section */}
                    <Animated.View
                        style={{
                            opacity: usersOpacity,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            width: '100%',
                            zIndex: searchTab === 'users' ? 1 : 0,
                            pointerEvents: searchTab === 'users' ? 'auto' : 'none',
                        }}
                    >
                        {/* Results Count */}
                        <View style={styles.resultsContainer}>
                            <Text style={[styles.resultsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                {filteredUsers.length} users found
                            </Text>
                        </View>

                        {/* Users List */}
                        <View style={styles.teamsContainer}>
                            <FlatList
                                data={filteredUsers}
                                renderItem={renderUserCard}
                                keyExtractor={(item) => item.id.toString()}
                                scrollEnabled={false}
                                contentContainerStyle={styles.teamsList}
                            />
                        </View>
                    </Animated.View>

                    {/* Invisible spacer to maintain layout height */}
                    <View style={{ opacity: 0, pointerEvents: 'none' }}>
                        {searchTab === 'stocks' ? (
                            <>
                                <View style={styles.filterContainer}>
                                    <View style={{ height: 40 }} />
                                </View>
                                <View style={styles.resultsContainer}>
                                    <Text style={[styles.resultsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>0 teams found</Text>
                                </View>
                                <View style={styles.teamsContainer}>
                                    <FlatList
                                        data={filteredStocks}
                                        renderItem={() => <View style={{ height: 100, width: '48%', marginBottom: 16 }} />}
                                        keyExtractor={(item) => item.id.toString()}
                                        numColumns={2}
                                        scrollEnabled={false}
                                        columnWrapperStyle={styles.gridRow}
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.resultsContainer}>
                                    <Text style={[styles.resultsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>0 users found</Text>
                                </View>
                                <View style={styles.teamsContainer}>
                                    <FlatList
                                        data={filteredUsers}
                                        renderItem={() => <View style={{ height: 100, marginBottom: 12 }} />}
                                        keyExtractor={(item) => item.id.toString()}
                                        scrollEnabled={false}
                                    />
                                </View>
                            </>
                        )}
                    </View>
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
    tabsContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
