import { GlassCard } from '@/components/ui/GlassCard';
import { brightenColor, isDarkColor } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { leagues, stocks, transactions } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type TransactionDetailBottomSheetProps = {
    transactionDetailBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function TransactionDetailBottomSheet({ transactionDetailBottomSheetRef }: TransactionDetailBottomSheetProps) {
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const { activeTransaction, setActiveTransaction, setTransactionDetailBottomSheetOpen } = useStockStore();

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                enableTouchThrough={false}
                opacity={0.4}
            />
        ),
        []
    );

    // Don't render if no transaction
    if (!activeTransaction) {
        return null;
    }

    const stock = stocks.find(s => s.id === activeTransaction.stockID);
    const league = leagues.find(l => l.id === stock?.leagueID);
    const primaryColor = stock?.color || '#3B82F6';
    const isDarkBackground = stock ? isDarkColor(primaryColor) : false;
    const brightenedPrimaryColor = stock ? brightenColor(primaryColor) : '#FFFFFF';

    // Calculate returns for sell transactions
    const transactionReturns = useMemo(() => {
        if (activeTransaction.action === 'buy') {
            return null; // No returns for buy transactions
        }

        // Get all transactions for this stock by this user, sorted chronologically
        const stockTransactions = transactions
            .filter(t => t.stockID === activeTransaction.stockID && t.userID === activeTransaction.userID)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        // Track buy queue (FIFO)
        const buyQueue: Array<{ quantity: number; price: number; transactionId: number }> = [];
        let totalCost = 0;
        let matchedQuantity = 0;

        // Process transactions up to and including this sell
        for (const transaction of stockTransactions) {
            if (transaction.id === activeTransaction.id) {
                // This is our sell transaction - match it to buys
                let remainingSellQuantity = transaction.quantity;

                while (remainingSellQuantity > 0 && buyQueue.length > 0) {
                    const buy = buyQueue[0];
                    const quantityToMatch = Math.min(remainingSellQuantity, buy.quantity);
                    totalCost += buy.price * quantityToMatch;
                    matchedQuantity += quantityToMatch;

                    remainingSellQuantity -= quantityToMatch;
                    buy.quantity -= quantityToMatch;

                    if (buy.quantity <= 0) {
                        buyQueue.shift();
                    }
                }
                break;
            } else if (transaction.action === 'buy') {
                // Add to buy queue
                buyQueue.push({
                    quantity: transaction.quantity,
                    price: transaction.price,
                    transactionId: transaction.id,
                });
            } else if (transaction.action === 'sell') {
                // Match previous sells to buys first
                let remainingSellQuantity = transaction.quantity;
                while (remainingSellQuantity > 0 && buyQueue.length > 0) {
                    const buy = buyQueue[0];
                    const quantityToMatch = Math.min(remainingSellQuantity, buy.quantity);
                    remainingSellQuantity -= quantityToMatch;
                    buy.quantity -= quantityToMatch;

                    if (buy.quantity <= 0) {
                        buyQueue.shift();
                    }
                }
            }
        }

        if (matchedQuantity === 0) {
            return null;
        }

        const avgEntryPrice = totalCost / matchedQuantity;
        const totalRevenue = activeTransaction.totalPrice;
        const profit = totalRevenue - totalCost;
        const profitPercentage = (profit / totalCost) * 100;

        return {
            avgEntryPrice,
            totalCost,
            totalRevenue,
            profit,
            profitPercentage,
            matchedQuantity,
        };
    }, [activeTransaction]);

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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isBuy = activeTransaction.action === 'buy';
    const actionColor = isBuy ? '#00C853' : '#FF1744';
    const actionBgColor = isBuy ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 23, 68, 0.15)';

    return (
        <BottomSheetModal
            ref={transactionDetailBottomSheetRef}
            onDismiss={() => {
                setActiveTransaction(null);
                setTransactionDetailBottomSheetOpen(false);
            }}
            enableDynamicSizing={true}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            snapPoints={['92%']}
            style={{ borderRadius: 25 }}
            backgroundStyle={{ borderRadius: 25, backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }}
        >
            <BottomSheetScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: primaryColor }]}>
                    <View style={styles.headerContent}>
                        <View style={styles.stockInfo}>
                            <View style={styles.stockDetails}>
                                <View style={styles.stockNameRow}>
                                    <Text style={styles.stockName}>{stock?.name || 'Unknown'}</Text>
                                    {stock && (
                                        <View style={[styles.tickerBadge, { backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }]}>
                                            <Text style={[styles.tickerText, { color: primaryColor }]}>
                                                {stock.ticker}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.leagueName}>{league?.name}</Text>
                            </View>
                        </View>
                        <View style={[styles.actionBadge, { backgroundColor: actionBgColor }]}>
                            <Ionicons
                                name={isBuy ? 'arrow-up-circle' : 'arrow-down-circle'}
                                size={24}
                                color={actionColor}
                            />
                            <Text style={[styles.actionText, { color: actionColor }]}>
                                {isBuy ? 'BUY' : 'SELL'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Transaction Details Card */}
                <View style={styles.detailsContainer}>
                    <GlassCard style={styles.detailsCard}>
                        <View style={styles.detailsHeader}>
                            <Ionicons name="receipt-outline" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                            <Text style={[styles.detailsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                Transaction Details
                            </Text>
                        </View>

                        {/* Date & Time */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailLabelContainer}>
                                <Ionicons name="calendar-outline" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Date
                                </Text>
                            </View>
                            <View style={styles.detailValueContainer}>
                                <Text style={[styles.detailValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatDate(activeTransaction.createdAt)}
                                </Text>
                                <Text style={[styles.detailSubValue, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {formatTime(activeTransaction.createdAt)}
                                </Text>
                            </View>
                        </View>

                        {/* Entries */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailLabelContainer}>
                                <Ionicons name="layers-outline" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Entries
                                </Text>
                            </View>
                            <Text style={[styles.detailValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                {activeTransaction.quantity.toFixed(2)}
                            </Text>
                        </View>

                        {/* Price per Entry */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailLabelContainer}>
                                <Ionicons name="cash-outline" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Price per Entry
                                </Text>
                            </View>
                            <Text style={[styles.detailValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                {formatCurrency(activeTransaction.price)}
                            </Text>
                        </View>

                        {/* Total Value */}
                        <View style={[styles.detailRow, styles.detailRowHighlight]}>
                            <View style={styles.detailLabelContainer}>
                                <Ionicons name="wallet-outline" size={18} color={actionColor} />
                                <Text style={[styles.detailLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Total {isBuy ? 'Paid' : 'Received'}
                                </Text>
                            </View>
                            <Text style={[styles.detailValue, styles.detailValueHighlight, { color: actionColor }]}>
                                {formatCurrency(activeTransaction.totalPrice)}
                            </Text>
                        </View>
                    </GlassCard>

                    {/* Returns Card - Only for sell transactions */}
                    {transactionReturns && (
                        <GlassCard style={styles.returnsCard}>
                            <View style={styles.returnsHeader}>
                                <Ionicons
                                    name={transactionReturns.profit >= 0 ? 'trending-up' : 'trending-down'}
                                    size={24}
                                    color={transactionReturns.profit >= 0 ? '#00C853' : '#FF1744'}
                                />
                                <Text style={[styles.returnsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Returns on This Transaction
                                </Text>
                            </View>

                            {/* Average Cost */}
                            <View style={styles.returnRow}>
                                <Text style={[styles.returnLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Average Entry Price
                                </Text>
                                <Text style={[styles.returnValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatCurrency(transactionReturns.avgEntryPrice)}
                                </Text>
                            </View>

                            {/* Total Cost */}
                            <View style={styles.returnRow}>
                                <Text style={[styles.returnLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Total Cost
                                </Text>
                                <Text style={[styles.returnValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatCurrency(transactionReturns.totalCost)}
                                </Text>
                            </View>

                            {/* Total Revenue */}
                            <View style={styles.returnRow}>
                                <Text style={[styles.returnLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Total Revenue
                                </Text>
                                <Text style={[styles.returnValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {formatCurrency(transactionReturns.totalRevenue)}
                                </Text>
                            </View>

                            {/* Profit/Loss */}
                            <View style={[styles.returnRow, styles.returnRowHighlight]}>
                                <Text style={[styles.returnLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    {transactionReturns.profit >= 0 ? 'Profit' : 'Loss'}
                                </Text>
                                <View style={styles.profitContainer}>
                                    <Text
                                        style={[
                                            styles.profitValue,
                                            { color: transactionReturns.profit >= 0 ? '#00C853' : '#FF1744' },
                                        ]}
                                    >
                                        {transactionReturns.profit >= 0 ? '+' : ''}
                                        {formatCurrency(transactionReturns.profit)}
                                    </Text>
                                    <View
                                        style={[
                                            styles.profitBadge,
                                            {
                                                backgroundColor:
                                                    transactionReturns.profit >= 0
                                                        ? 'rgba(0, 200, 83, 0.15)'
                                                        : 'rgba(255, 23, 68, 0.15)',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.profitBadgeText,
                                                {
                                                    color: transactionReturns.profit >= 0 ? '#00C853' : '#FF1744',
                                                },
                                            ]}
                                        >
                                            {formatPercentage(transactionReturns.profitPercentage)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </GlassCard>
                    )}
                </View>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    stockInfo: {
        flex: 1,
    },
    stockDetails: {
        gap: 4,
    },
    stockNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    stockName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    tickerBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tickerText: {
        fontSize: 14,
        fontWeight: '700',
    },
    leagueName: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    actionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    detailsContainer: {
        padding: 20,
        gap: 16,
    },
    detailsCard: {
        padding: 20,
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    detailsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.1)',
    },
    detailRowHighlight: {
        borderBottomWidth: 0,
        marginTop: 8,
        paddingTop: 20,
        borderTopWidth: 2,
        borderTopColor: 'rgba(156, 163, 175, 0.2)',
    },
    detailLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    detailValueContainer: {
        alignItems: 'flex-end',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    detailValueHighlight: {
        fontSize: 20,
        fontWeight: '700',
    },
    detailSubValue: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: 2,
    },
    returnsCard: {
        padding: 20,
    },
    returnsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    returnsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    returnRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(156, 163, 175, 0.1)',
    },
    returnRowHighlight: {
        borderBottomWidth: 0,
        marginTop: 8,
        paddingTop: 20,
        borderTopWidth: 2,
        borderTopColor: 'rgba(156, 163, 175, 0.2)',
    },
    returnLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    returnValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    profitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    profitValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    profitBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    profitBadgeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    bottomSpacing: {
        height: 40,
    },
});
