import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { stocks, transactions } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TradeHistoryScreen() {
    const { isDark } = useTheme();
    const { lightImpact, mediumImpact } = useHaptics();
    const router = useRouter();
    const { setActiveTransaction, setTransactionDetailBottomSheetOpen } = useStockStore();

    // Get user's transactions (userID = 1) and sort by date (most recent first)
    const userTransactions = useMemo(() => {
        return transactions
            .filter(t => t.userID === 1)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        lightImpact();
                        router.back();
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    Trade History
                </Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {userTransactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-outline" size={64} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        <Text style={[styles.emptyStateText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            No transactions yet
                        </Text>
                    </View>
                ) : (
                    <View style={styles.transactionsContainer}>
                        <GlassCard style={styles.transactionsCard}>
                            {userTransactions.map((transaction, index) => {
                                const stock = stocks.find(s => s.id === transaction.stockID);
                                return (
                                    <TouchableOpacity
                                        key={transaction.id}
                                        style={[
                                            styles.transactionItem,
                                            index < userTransactions.length - 1 && styles.transactionItemBorder
                                        ]}
                                        onPress={() => {
                                            mediumImpact();
                                            setActiveTransaction(transaction);
                                            setTransactionDetailBottomSheetOpen(true);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.transactionItemLeft}>
                                            <View style={[
                                                styles.transactionBadge,
                                                { backgroundColor: transaction.action === 'buy' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 23, 68, 0.15)' }
                                            ]}>
                                                <Text style={[
                                                    styles.transactionBadgeText,
                                                    { color: transaction.action === 'buy' ? '#00C853' : '#FF1744' }
                                                ]}>
                                                    {transaction.action === 'buy' ? 'BUY' : 'SELL'}
                                                </Text>
                                            </View>
                                            <View style={styles.transactionInfo}>
                                                <Text style={[styles.transactionStockName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                    {stock?.name || 'Unknown'}
                                                </Text>
                                                <Text style={[styles.transactionDate, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                    {transaction.createdAt.toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.transactionItemRight}>
                                            <Text style={[styles.transactionQuantity, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                {transaction.quantity.toFixed(1)} shares
                                            </Text>
                                            <Text style={[styles.transactionPrice, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                @ {formatCurrency(transaction.price)}
                                            </Text>
                                            <Text style={[styles.transactionTotal, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                {formatCurrency(transaction.totalPrice)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </GlassCard>
                    </View>
                )}

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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 16,
    },
    transactionsContainer: {
        paddingHorizontal: 20,
    },
    transactionsCard: {
        minHeight: 60,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    transactionItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.2)',
    },
    transactionItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    transactionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    transactionBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionStockName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        fontWeight: '500',
    },
    transactionItemRight: {
        alignItems: 'flex-end',
    },
    transactionQuantity: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    transactionPrice: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    transactionTotal: {
        fontSize: 16,
        fontWeight: '700',
    },
    bottomSpacing: {
        height: 100,
    },
});
