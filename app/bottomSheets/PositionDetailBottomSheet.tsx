import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PositionDetailBottomSheetProps = {
    positionDetailBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function PositionDetailBottomSheet({ positionDetailBottomSheetRef }: PositionDetailBottomSheetProps) {
    const Color = useColors();
    const { activePosition, setPositionDetailBottomSheetOpen, setActiveStockId } = useStockStore();
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();

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

    const closeModal = () => {
        setPositionDetailBottomSheetOpen(false);
    };

    const handleViewStock = () => {
        lightImpact();
        if (activePosition) {
            setActiveStockId(activePosition.stock.id);
            closeModal();
        }
    };

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

    if (!activePosition) {
        return null;
    }

    const isPositive = activePosition.totalGainLoss >= 0;
    const profitLossColor = isPositive ? Color.green : Color.red;
    const teamColor = activePosition.colors[0]?.hex || Color.green;

    return (
        <BottomSheetModal
            ref={positionDetailBottomSheetRef}
            onDismiss={closeModal}
            enableDynamicSizing={true}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            style={{ borderRadius: 20 }}
            backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }}
        >
            <BottomSheetView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.teamLogo, { backgroundColor: teamColor }]}>
                        <Text style={styles.teamLogoText}>
                            {activePosition.stock.name.split(' ').map(word => word[0]).join('')}
                        </Text>
                    </View>
                    <Text style={[styles.teamName, { color: Color.baseText }]}>
                        {activePosition.stock.name}
                    </Text>
                    <View style={[styles.percentageBadge, { backgroundColor: isPositive ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 23, 68, 0.15)' }]}>
                        <Ionicons
                            name={isPositive ? 'trending-up' : 'trending-down'}
                            size={16}
                            color={profitLossColor}
                        />
                        <Text style={[styles.percentageText, { color: profitLossColor }]}>
                            {formatPercentage(activePosition.gainLossPercentage)}
                        </Text>
                    </View>
                </View>

                {/* Metrics */}
                <View style={styles.metricsContainer}>
                    {/* Avg Cost */}
                    <View style={[styles.metricRow, { borderBottomColor: isDark ? '#242428' : '#E5E7EB' }]}>
                        <View style={styles.metricLeft}>
                            <Text style={[styles.metricLabel, { color: Color.baseText }]}>
                                Avg Cost
                            </Text>
                            <Text style={[styles.metricTooltip, { color: Color.subText }]}>
                                Your average buy price
                            </Text>
                        </View>
                        <Text style={[styles.metricValue, { color: Color.baseText }]}>
                            {formatCurrency(activePosition.avgEntryPrice)}
                        </Text>
                    </View>

                    {/* Current Price */}
                    <View style={[styles.metricRow, { borderBottomColor: isDark ? '#242428' : '#E5E7EB' }]}>
                        <View style={styles.metricLeft}>
                            <Text style={[styles.metricLabel, { color: Color.baseText }]}>
                                Current Price
                            </Text>
                            <Text style={[styles.metricTooltip, { color: Color.subText }]}>
                                What one share is worth right now
                            </Text>
                        </View>
                        <Text style={[styles.metricValue, { color: Color.baseText }]}>
                            {formatCurrency(activePosition.stock.price)}
                        </Text>
                    </View>

                    {/* Shares Held */}
                    <View style={[styles.metricRow, { borderBottomColor: isDark ? '#242428' : '#E5E7EB' }]}>
                        <View style={styles.metricLeft}>
                            <Text style={[styles.metricLabel, { color: Color.baseText }]}>
                                Shares Held
                            </Text>
                            <Text style={[styles.metricTooltip, { color: Color.subText }]}>
                                How many shares you own
                            </Text>
                        </View>
                        <Text style={[styles.metricValue, { color: Color.baseText }]}>
                            {activePosition.entries.toFixed(1)}
                        </Text>
                    </View>

                    {/* Open Profit/Loss */}
                    <View style={[styles.metricRow, styles.metricRowLast]}>
                        <View style={styles.metricLeft}>
                            <Text style={[styles.metricLabel, { color: Color.baseText }]}>
                                Open Profit/Loss
                            </Text>
                            <Text style={[styles.metricTooltip, { color: Color.subText }]}>
                                What you'd win or lose if you sold now
                            </Text>
                        </View>
                        <Text style={[styles.metricValue, { color: profitLossColor }]}>
                            {isPositive ? '+' : ''}{formatCurrency(activePosition.totalGainLoss)}
                        </Text>
                    </View>
                </View>

                {/* View Stock Button */}
                <TouchableOpacity
                    style={[styles.viewStockButton, { backgroundColor: teamColor }]}
                    onPress={handleViewStock}
                >
                    <Text style={styles.viewStockButtonText}>View {activePosition.stock.ticker}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    teamLogo: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    teamLogoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    teamName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    percentageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    percentageText: {
        fontSize: 16,
        fontWeight: '700',
    },
    metricsContainer: {
        marginBottom: 24,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    metricRowLast: {
        borderBottomWidth: 0,
    },
    metricLeft: {
        flex: 1,
    },
    metricLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    metricTooltip: {
        fontSize: 12,
        fontWeight: '400',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    viewStockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    viewStockButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 30,
    },
});
