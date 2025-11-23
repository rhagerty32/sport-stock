import Chart from '@/components/chart';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, leagues, priceHistory, stocks, userPortfolios, users } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { FriendInvested, TimePeriod } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StockDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { lightImpact, selection } = useHaptics();
    const { friends, setActiveUserId } = useStockStore();

    const [selectedTimeframe, setSelectedTimeframe] = useState<TimePeriod>('1D');

    // Find the stock by ID
    const stock = stocks.find(s => s.id === parseInt(id || '0'));
    const league = leagues.find(l => l.id === stock?.leagueID);
    const stockColor = colors.find(c => c.stockID === stock?.id.toString());
    const stockPriceHistory = priceHistory.filter(ph => ph.stockID === stock?.id);

    // Find friends who are invested in this stock
    const friendsInvested = useMemo((): FriendInvested[] => {
        console.log('STOCK:', stock);
        if (!stock) return [];

        const result = friends
            .map(friendId => {
                const friend = users.find(u => u.id === friendId);
                const friendPortfolio = userPortfolios[friendId];

                if (!friend) {
                    console.log(`Friend ${friendId} not found in users`);
                    return null;
                }

                if (!friendPortfolio) {
                    console.log(`Portfolio not found for friend ${friendId}`);
                    return null;
                }

                // Check if friend has a position in this stock
                const position = friendPortfolio.positions.find(
                    pos => pos.stock.id === stock.id
                );

                if (position) {
                    console.log(`✅ Friend ${friendId} (${friend.firstName} ${friend.lastName}) has ${position.shares} shares of ${stock.name}`);
                    return {
                        user: friend,
                        position,
                    };
                } else {
                    console.log(`❌ Friend ${friendId} (${friend.firstName} ${friend.lastName}) does NOT have ${stock.name} (ID: ${stock.id})`);
                    console.log(`   Their positions: ${friendPortfolio.positions.map(p => `${p.stock.name} (ID: ${p.stock.id})`).join(', ')}`);
                }

                return null;
            })
            .filter((item): item is FriendInvested => item !== null);

        console.log(`📊 Stock: ${stock.name} (ID: ${stock.id})`);
        console.log(`👥 Friends list: [${friends.join(', ')}]`);
        console.log(`✅ Friends invested: ${result.length}`);
        result.forEach(f => console.log(`   - ${f.user.firstName} ${f.user.lastName}: ${f.position.shares} shares`));

        return result;
    }, [stock, friends]);

    if (!stock) {
        return (
            <ThemedView style={styles.container}>
                <Text style={[styles.errorText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    Stock not found
                </Text>
            </ThemedView>
        );
    }

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

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    // Calculate price change
    const currentPrice = stock.price;
    const previousPrice = stockPriceHistory.length > 1 ? stockPriceHistory[stockPriceHistory.length - 2].price : currentPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercentage = (priceChange / previousPrice) * 100;

    // Get team colors
    const primaryColor = stockColor?.hex || '#3B82F6';
    const secondaryColor = isDark ? '#1A1D21' : '#F9FAFB';

    const timeframes: TimePeriod[] = ['1D', '1W', '1M', '1Y', 'ALL'];

    const handleTimeframeChange = (timeframe: TimePeriod) => {
        setSelectedTimeframe(timeframe);
        lightImpact();
    };

    const handleBack = () => {
        router.back();
        lightImpact();
    };

    const handleBuy = () => {
        // TODO: Implement buy functionality
        lightImpact();
    };

    const handleFollow = () => {
        // TODO: Implement follow functionality
        lightImpact();
    };

    const handleFriendPress = (userId: number) => {
        setActiveUserId(userId);
        router.push(`/user/${userId}`);
        selection();
    };

    // Avatar component with fallback
    const FriendAvatar = ({ user, isDark }: { user: typeof users[0]; isDark: boolean }) => {
        const [imageError, setImageError] = useState(false);
        const hasPhoto = user.photoURL && !imageError;
        const initials = `${user.firstName[0]}${user.lastName[0]}`;

        if (hasPhoto) {
            return (
                <Image
                    source={{ uri: user.photoURL }}
                    style={styles.friendAvatar}
                    onError={() => setImageError(true)}
                />
            );
        }

        return (
            <View style={[styles.friendAvatar, styles.friendAvatarPlaceholder, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]}>
                {user.photoURL ? (
                    <Ionicons
                        name="person"
                        size={30}
                        color={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                ) : (
                    <Text style={[styles.friendAvatarInitials, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {initials}
                    </Text>
                )}
            </View>
        );
    };

    const renderFriendCard = ({ item }: { item: FriendInvested }) => {
        return (
            <TouchableOpacity
                onPress={() => handleFriendPress(item.user.id)}
            >
                <GlassCard style={styles.friendCard}>
                    <View style={styles.friendCardContent}>
                        <View style={styles.friendCardHeader}>
                            <FriendAvatar user={item.user} isDark={isDark} />
                            <View style={styles.friendCardInfo}>
                                <Text style={[styles.friendName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {item.user.firstName} {item.user.lastName}
                                </Text>
                                <Text style={[styles.friendShares, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {item.position.shares} shares
                                </Text>
                                <View style={styles.friendValueContainer}>
                                    <Text style={[styles.friendValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                        {formatCurrency(item.position.currentValue)}
                                    </Text>
                                    {item.user.public && (
                                        <Text
                                            style={[
                                                styles.friendGainLoss,
                                                { color: item.position.gainLossPercentage >= 0 ? '#217C0A' : '#dc2626' }
                                            ]}
                                        >
                                            {formatPercentage(item.position.gainLossPercentage)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    console.log(friendsInvested)

    return (
        <ThemedView style={[styles.container, { backgroundColor: secondaryColor }]}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: primaryColor }]}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <View style={styles.stockInfo}>
                            <View style={[styles.stockLogo, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}>
                                <Text style={[styles.stockLogoText, { color: primaryColor }]}>
                                    {stock.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                </Text>
                            </View>
                            <View style={styles.stockDetails}>
                                <Text style={styles.stockName}>{stock.name}</Text>
                                <Text style={styles.leagueName}>{league?.name}</Text>
                            </View>
                        </View>
                        <View style={[styles.priceContainer, { backgroundColor: isDark ? '#262626' : '#FFFFFF' }]}>
                            <Text style={styles.currentPrice}>{formatCurrency(currentPrice)}</Text>
                        </View>
                    </View>
                </View>

                {/* Price Performance */}
                <View style={styles.pricePerformance}>
                    <Text style={[styles.priceChange, { color: priceChange >= 0 ? '#00C853' : '#FF1744' }]}>
                        {priceChange >= 0 ? '↑' : '↓'} {formatPercentage(priceChangePercentage)}
                    </Text>
                </View>

                {/* Chart */}
                <View style={styles.chartContainer}>
                    <Chart stockId={stock.id} color={primaryColor} />
                </View>

                {/* Timeframe Selector */}
                <View style={styles.timeframeContainer}>
                    {timeframes.map((timeframe) => (
                        <TouchableOpacity
                            key={timeframe}
                            onPress={() => handleTimeframeChange(timeframe)}
                            style={[
                                styles.timeframeButton,
                                selectedTimeframe === timeframe && { backgroundColor: isDark ? '#262626' : '#E5E7EB' }
                            ]}
                        >
                            <Text style={[
                                styles.timeframeText,
                                { color: isDark ? '#FFFFFF' : '#000000' }
                            ]}>
                                {timeframe}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Stock Stats */}
                <View style={styles.statsContainer}>
                    <GlassCard style={styles.statsCard}>
                        <Text style={[styles.statsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Team Info
                        </Text>

                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Volume
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatNumber(stock.volume)}
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Market Cap
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatCurrency(league?.marketCap || 0)}
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    League Volume
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatNumber(league?.volume || 0)}
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Sport
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {league?.sport}
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Listed
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {stock.createdAt.toLocaleDateString()}
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Last Updated
                                </Text>
                                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {stock.updatedAt.toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        onPress={handleBuy}
                        style={[styles.actionButton, styles.buyButton, { backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}
                    >
                        <Text style={[styles.actionButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Buy/Sell
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleFollow}
                        style={[styles.actionButton, styles.followButton, { backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}
                    >
                        <Text style={[styles.actionButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Follow
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Friends Invested Section */}
                <View style={styles.friendsContainer}>
                    <Text style={[styles.friendsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Squad In ({friendsInvested.length})
                    </Text>
                    {friendsInvested.length > 0 ? (
                        <FlatList
                            data={friendsInvested}
                            renderItem={renderFriendCard}
                            keyExtractor={(item) => item.user.id.toString()}
                            scrollEnabled={false}
                            contentContainerStyle={styles.friendsList}
                        />
                    ) : (
                        <View style={styles.noFriendsContainer}>
                            <Text style={[styles.noFriendsText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                No one in your squad is backing this team
                            </Text>
                            {friends.length > 0 && (
                                <Text style={[styles.noFriendsHint, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                                    You have {friends.length} friend{friends.length !== 1 ? 's' : ''}, but none are in on {stock.name}
                                </Text>
                            )}
                        </View>
                    )}
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
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButtonText: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    stockLogo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stockLogoText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    stockDetails: {
        flex: 1,
    },
    stockName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    leagueName: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    priceContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    currentPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
    },
    pricePerformance: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    priceChange: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    chartContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
        height: 200,
    },
    timeframeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 24,
        gap: 12,
    },
    timeframeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    timeframeText: {
        fontSize: 14,
        fontWeight: '500',
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
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    statItem: {
        width: '48%',
        marginBottom: 16,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buyButton: {
        // Styling handled by backgroundColor
    },
    followButton: {
        // Styling handled by backgroundColor
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 100,
    },
    errorText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 100,
    },
    friendsContainer: {
        marginHorizontal: 20,
        marginBottom: 24,
    },
    friendsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    friendsList: {
        gap: 12,
    },
    friendCard: {
        padding: 16,
    },
    friendCardContent: {
        flex: 1,
    },
    friendCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    friendAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    friendAvatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendAvatarInitials: {
        fontSize: 18,
        fontWeight: '600',
    },
    friendCardInfo: {
        flex: 1,
        gap: 4,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
    },
    friendShares: {
        fontSize: 14,
    },
    friendValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    friendValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    friendGainLoss: {
        fontSize: 14,
        fontWeight: '500',
    },
    noFriendsContainer: {
        paddingVertical: 16,
        alignItems: 'center',
        gap: 8,
    },
    noFriendsText: {
        fontSize: 14,
        textAlign: 'center',
    },
    noFriendsHint: {
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
