import { EmptyState } from '@/components/EmptyState';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuthStore } from '@/stores/authStore';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TradeHistoryScreen() {
    const Color = useColors();
    const { lightImpact, mediumImpact } = useHaptics();
    const router = useRouter();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const { portfolio, transactions, loadTransactions } = usePortfolioStore();
    const { setActiveTransaction, setTransactionDetailBottomSheetOpen } = useStockStore();

    useEffect(() => {
        if (isAuthenticated) loadTransactions({ limit: 100 });
    }, [isAuthenticated, loadTransactions]);

    const userTransactions = useMemo(
        () => [...transactions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        [transactions]
    );

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const getStockName = (stockID: number) =>
        (portfolio?.positions ?? []).find(p => p.stock.id === stockID)?.stock.name ?? `Stock #${stockID}`;

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        lightImpact();
                        router.back();
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={Color.baseText} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Color.baseText }]}>
                    Trade History
                </Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {!isAuthenticated ? (
                    <EmptyState
                        icon="lock-closed-outline"
                        title="Sign in to view history"
                        subtitle="Your buy and sell transactions will appear here."
                        actionLabel="Log in"
                        onAction={() => router.back()}
                    />
                ) : userTransactions.length === 0 ? (
                    <EmptyState
                        icon="receipt-outline"
                        title="No transactions yet"
                        subtitle="Your buy and sell history will appear here once you start trading."
                    />
                ) : (
                    <View style={styles.transactionsContainer}>
                        <GlassCard style={styles.transactionsCard}>
                            {userTransactions.map((transaction, index) => (
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
                                                { color: transaction.action === 'buy' ? Color.green : Color.red }
                                            ]}>
                                                {transaction.action === 'buy' ? 'BUY' : 'SELL'}
                                            </Text>
                                        </View>
                                        <View style={styles.transactionInfo}>
                                            <Text style={[styles.transactionStockName, { color: Color.baseText }]}>
                                                {getStockName(transaction.stockID)}
                                            </Text>
                                            <Text style={[styles.transactionDate, { color: Color.subText }]}>
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
                                        <Text style={[styles.transactionQuantity, { color: Color.baseText }]}>
                                            {transaction.quantity.toFixed(1)} entries
                                        </Text>
                                        <Text style={[styles.transactionPrice, { color: Color.subText }]}>
                                            @ {formatCurrency(transaction.price)}
                                        </Text>
                                        <Text style={[styles.transactionTotal, { color: Color.baseText }]}>
                                            {formatCurrency(transaction.totalPrice)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </GlassCard>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    scrollView: { flex: 1 },
    transactionsContainer: { paddingHorizontal: 20 },
    transactionsCard: { minHeight: 60 },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    transactionItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(156, 163, 175, 0.2)' },
    transactionItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    transactionBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    transactionBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    transactionInfo: { flex: 1 },
    transactionStockName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    transactionDate: { fontSize: 12, fontWeight: '500' },
    transactionItemRight: { alignItems: 'flex-end' },
    transactionQuantity: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    transactionPrice: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
    transactionTotal: { fontSize: 16, fontWeight: '700' },
    bottomSpacing: { height: 100 },
});
