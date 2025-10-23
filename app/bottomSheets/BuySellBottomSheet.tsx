import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { stocks } from '@/lib/dummy-data';
import { useStockStore } from '@/stores/stockStore';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";
import { Easing } from "react-native-reanimated";

type BuySellBottomSheetProps = {
    buySellBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function BuySellBottomSheet({ buySellBottomSheetRef }: BuySellBottomSheetProps) {
    const { activeStockId } = useStockStore();
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const { setBuySellBottomSheetOpen } = useStockStore();
    const [showCustomAmount, setShowCustomAmount] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const customAmountInputRef = useRef<any>(null);

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
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();

    // Find the stock by ID from the store
    const stock = stocks.find(s => s.id === activeStockId);

    // Don't render anything if no stock is selected
    if (!activeStockId || !stock) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const handleAmountSelect = (amount: number) => {
        setSelectedAmount(amount);
        lightImpact();
    };

    const handleAdd = () => {
        if (selectedAmount) {
            // TODO: Implement add to cart functionality
            console.log(`Adding ${formatCurrency(selectedAmount)} of ${stock.name}`);
            lightImpact();
        }
    };

    const handleOrderTypeChange = () => {
        // TODO: Implement order type change functionality
        lightImpact();
    };

    const handleCustomAmountPress = () => {
        setShowCustomAmount(true);
        lightImpact();
        // Focus the input after a short delay to ensure the modal is fully rendered
        setTimeout(() => {
            customAmountInputRef.current?.focus();
        }, 100);
    };

    const handleCustomAmountSubmit = () => {
        const amount = parseFloat(customAmount);
        console.log('amount', amount);
        if (amount > 0) {
            setSelectedAmount(amount);
            setShowCustomAmount(false);
            setCustomAmount('');
            lightImpact();
        }
    };

    const handleCustomAmountCancel = () => {
        setShowCustomAmount(false);
        setCustomAmount('');
        lightImpact();
    };

    const closeModal = () => {
        setBuySellBottomSheetOpen(false);
        setSelectedAmount(null);
    };

    const presetAmounts = [1, 10, 20, 50, 100];

    return (
        <BottomSheetModal
            ref={buySellBottomSheetRef}
            onDismiss={closeModal}
            stackBehavior='push'
            enableDynamicSizing={true}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            enableOverDrag={true}
            style={{ borderRadius: 20 }}
            backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
        >
            <BottomSheetView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Buy {stock.name}
                    </Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        One-Time Order
                    </Text>
                </View>

                {/* Amount Selection Grid */}
                <View style={styles.amountGrid}>
                    {presetAmounts.map((amount) => (
                        <TouchableOpacity
                            key={amount}
                            style={[
                                styles.amountButton,
                                {
                                    backgroundColor: selectedAmount === amount
                                        ? '#bbb'
                                        : (isDark ? '#374151' : '#F3F4F6')
                                }
                            ]}
                            onPress={() => handleAmountSelect(amount)}
                        >
                            <Text style={[
                                styles.amountText,
                                {
                                    color: selectedAmount === amount
                                        ? '#FFFFFF'
                                        : (isDark ? '#FFFFFF' : '#000000')
                                }
                            ]}>
                                {formatCurrency(amount)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[styles.amountButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                        onPress={handleCustomAmountPress}
                    >
                        <Text style={[styles.amountText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            ...
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Custom Amount Input */}
                {showCustomAmount && (
                    <View style={styles.customAmountContainer}>
                        <Text style={[styles.customAmountLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Enter Custom Amount
                        </Text>
                        <BottomSheetTextInput
                            ref={customAmountInputRef}
                            style={[
                                styles.customAmountInput,
                                {
                                    backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                    color: isDark ? '#FFFFFF' : '#000000',
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                }
                            ]}
                            placeholder="Enter amount"
                            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                            value={customAmount}
                            onChangeText={setCustomAmount}
                            keyboardType="decimal-pad"
                            returnKeyType="done"
                            onSubmitEditing={handleCustomAmountSubmit}
                        />
                        <View style={styles.customAmountButtons}>
                            <TouchableOpacity
                                style={[styles.customAmountButton, styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                                onPress={handleCustomAmountCancel}
                            >
                                <Text style={[styles.customAmountButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.customAmountButton, styles.submitButton, { backgroundColor: customAmount ? '#10B981' : '#9CA3AF' }]}
                                onPress={handleCustomAmountSubmit}
                                disabled={!customAmount}
                            >
                                <Text style={styles.customAmountButtonText}>
                                    Done
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Add Button */}
                <View style={styles.addButtonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            {
                                backgroundColor: selectedAmount ? '#F87171' : '#9CA3AF', // light shade of red
                                opacity: selectedAmount ? 1 : 0.5
                            }
                        ]}
                        onPress={handleAdd}
                        disabled={!selectedAmount}
                    >
                        <Text style={styles.addButtonText}>Sell</Text>
                        {selectedAmount && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>$</Text>
                                <AnimatedRollingNumber
                                    value={selectedAmount ? selectedAmount : 0}
                                    useGrouping={true}
                                    enableCompactNotation={true}
                                    compactToFixed={2}
                                    textStyle={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}
                                    spinningAnimationConfig={{ duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) }}
                                />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            {
                                backgroundColor: selectedAmount ? '#10B981' : '#9CA3AF',
                                opacity: selectedAmount ? 1 : 0.5
                            }
                        ]}
                        onPress={handleAdd}
                        disabled={!selectedAmount}
                    >
                        <Text style={styles.addButtonText}>Buy</Text>
                        {selectedAmount && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>$</Text>
                                <AnimatedRollingNumber
                                    value={selectedAmount ? selectedAmount : 0}
                                    useGrouping={true}
                                    enableCompactNotation={true}
                                    textStyle={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}
                                    spinningAnimationConfig={{ duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) }}
                                />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    orderTypeContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    orderTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    orderTypeText: {
        fontSize: 16,
        fontWeight: '500',
    },
    amountGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 40,
        gap: 12,
    },
    amountButton: {
        width: '30%',
        aspectRatio: 1.2,
        display: 'flex',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    amountText: {
        fontSize: 16,
        fontWeight: '600',
    },
    addButtonContainer: {
        marginBottom: 20,
        width: '100%',
        flexDirection: 'row',
        gap: 12,
    },
    addButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: 12,
        gap: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 30,
    },
    customAmountContainer: {
        marginBottom: 30,
    },
    customAmountLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    customAmountInput: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
        marginBottom: 16,
        textAlign: 'center',
    },
    customAmountButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    customAmountButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        // Styles handled by backgroundColor in component
    },
    submitButton: {
        // Styles handled by backgroundColor in component
    },
    customAmountButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

