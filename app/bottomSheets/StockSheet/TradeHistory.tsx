import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useStockStore } from '@/stores/stockStore';
import { Stock, Transaction } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatCurrency } from './utils';

export const TradeHistory = ({ stockTransactions, stock }: { stockTransactions: Transaction[], stock: Stock }) => {
    const Color = useColors();
    const { mediumImpact, lightImpact } = useHaptics();
    const { setActiveTransaction, setTransactionDetailBottomSheetOpen, setBuySellMode, setBuySellBottomSheetOpen } = useStockStore();

    const handleBuy = () => {
        lightImpact();
        setBuySellMode('buy');
        setBuySellBottomSheetOpen(true);
    };

    return (
        <View style={styles.statsContainer}>
            <GlassCard style={styles.statsCard}>
                <Text style={[styles.statsTitle, { color: Color.baseText }]}>
                    Trade History
                </Text>

                {stockTransactions.length > 0 ? (
                    <View style={styles.tradeHistoryList}>
                        {stockTransactions.slice(0, 5).map((transaction, index) => (
                            <TouchableOpacity
                                key={transaction.id}
                                style={[
                                    styles.tradeHistoryItem,
                                    index < Math.min(stockTransactions.length, 5) - 1 && styles.tradeHistoryItemBorder
                                ]}
                                onPress={() => {
                                    mediumImpact();
                                    setActiveTransaction(transaction);
                                    setTransactionDetailBottomSheetOpen(true);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.tradeHistoryItemLeft}>
                                    <View style={[
                                        styles.tradeHistoryBadge,
                                        { backgroundColor: transaction.action === 'buy' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 23, 68, 0.15)' }
                                    ]}>
                                        <Text style={[
                                            styles.tradeHistoryBadgeText,
                                            { color: transaction.action === 'buy' ? Color.green : Color.red }
                                        ]}>
                                            {transaction.action === 'buy' ? 'BUY' : 'SELL'}
                                        </Text>
                                    </View>
                                    <View style={styles.tradeHistoryInfo}>
                                        <Text style={[styles.tradeHistoryDate, { color: Color.subText }]}>
                                            {transaction.createdAt.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.tradeHistoryItemRight}>
                                    <Text style={[styles.tradeHistoryQuantity, { color: Color.baseText }]}>
                                        {transaction.quantity.toFixed(1)} entries
                                    </Text>
                                    <Text style={[styles.tradeHistoryTotal, { color: Color.baseText }]}>
                                        {formatCurrency(transaction.totalPrice)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyTradeHistory}>
                        <Ionicons name="receipt-outline" size={48} color={Color.subText} />
                        <Text style={[styles.emptyTradeHistoryTitle, { color: Color.baseText }]}>
                            No Trades Yet
                        </Text>
                        <Text style={[styles.emptyTradeHistoryText, { color: Color.subText }]}>
                            You haven't made any trades for {stock.name}. Start building your position!
                        </Text>
                        <TouchableOpacity
                            style={[styles.emptyTradeHistoryCTA, { backgroundColor: Color.green }]}
                            onPress={handleBuy}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                            <Text style={[styles.emptyTradeHistoryCTAText, { color: Color.white }]}>Buy {stock.ticker}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </GlassCard>
        </View>
    );
};

const styles = StyleSheet.create({
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
    },
    tradeHistoryList: {
        marginTop: 8,
    },
    tradeHistoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    tradeHistoryItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.2)',
    },
    tradeHistoryItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    tradeHistoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tradeHistoryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    tradeHistoryInfo: {
        flex: 1,
    },
    tradeHistoryDate: {
        fontSize: 13,
        fontWeight: '500',
    },
    tradeHistoryItemRight: {
        alignItems: 'flex-end',
    },
    tradeHistoryQuantity: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    tradeHistoryTotal: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyTradeHistory: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyTradeHistoryTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    emptyTradeHistoryText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    emptyTradeHistoryCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyTradeHistoryCTAText: {
        fontSize: 16,
        fontWeight: '600',
    }
});