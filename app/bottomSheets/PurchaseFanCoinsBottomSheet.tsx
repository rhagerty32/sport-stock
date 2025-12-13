import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useStockStore } from '@/stores/stockStore';
import { useWalletStore } from '@/stores/walletStore';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";
import { Easing } from "react-native-reanimated";

type PurchaseFanCoinsBottomSheetProps = {
    purchaseFanCoinsBottomSheetRef: React.RefObject<BottomSheetModal>;
};

const DUMMY_USER_ID = 1;
const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

export default function PurchaseFanCoinsBottomSheet({ purchaseFanCoinsBottomSheetRef }: PurchaseFanCoinsBottomSheetProps) {
    const { setPurchaseFanCoinsBottomSheetOpen, setWalletSystemBottomSheetOpen } = useStockStore();
    const { wallet, purchaseFanCoins, isLoading } = useWalletStore();
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [showCustomAmount, setShowCustomAmount] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const customAmountInputRef = useRef<any>(null);
    const { isDark } = useTheme();
    const { lightImpact, success } = useHaptics();

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatGoldCoins = (coins: number) => {
        if (coins >= 1000) {
            const thousands = coins / 1000;
            return `${thousands.toFixed(1)}k`;
        }
        return coins.toLocaleString();
    };

    const handleAmountSelect = (amount: number) => {
        setSelectedAmount(amount);
        setShowCustomAmount(false);
        setCustomAmount('');
        lightImpact();
    };

    const handleCustomAmountPress = () => {
        setShowCustomAmount(true);
        setSelectedAmount(null);
        lightImpact();
        setTimeout(() => {
            customAmountInputRef.current?.focus();
        }, 100);
    };

    const handleCustomAmountSubmit = () => {
        const amount = parseFloat(customAmount);
        if (amount > 0 && amount >= 10) {
            setSelectedAmount(amount);
            setShowCustomAmount(false);
            setCustomAmount('');
            lightImpact();
        }
    };

    const handleCustomAmountCancel = () => {
        setShowCustomAmount(false);
        setCustomAmount('');
        setSelectedAmount(null);
        lightImpact();
    };

    const handlePurchase = async () => {
        if (!selectedAmount) return;

        try {
            lightImpact();
            await purchaseFanCoins(DUMMY_USER_ID, selectedAmount, 'stripe');
            success();

            // Reset form
            setSelectedAmount(null);
            setCustomAmount('');
            setShowCustomAmount(false);

            // Close sheet after short delay to show success
            setTimeout(() => {
                closeModal();
            }, 1500);
        } catch (error) {
            console.error('Purchase failed:', error);
            lightImpact();
        }
    };

    const closeModal = () => {
        setPurchaseFanCoinsBottomSheetOpen(false);
        setSelectedAmount(null);
        setCustomAmount('');
        setShowCustomAmount(false);
    };

    const openHowItWorks = () => {
        setWalletSystemBottomSheetOpen(true);
        lightImpact();
    };

    // Calculate Gold Coins: 100 GC per $1
    const GOLD_COINS_PER_DOLLAR = 100;
    const goldCoinsToReceive = selectedAmount ? selectedAmount * GOLD_COINS_PER_DOLLAR : 0;
    const sportCashToReceive = selectedAmount || 0; // 1:1 ratio, no bonus

    return (
        <BottomSheetModal
            ref={purchaseFanCoinsBottomSheetRef}
            onDismiss={closeModal}
            stackBehavior='push'
            enableDynamicSizing={true}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            enableOverDrag={true}
            style={{ borderRadius: 20 }}
            snapPoints={['90%']}
            backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }}
        >
            <BottomSheetScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Buy Gold Coins
                    </Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        Get SportCash as a bonus
                    </Text>
                </View>

                {/* How It Works Link */}
                <TouchableOpacity
                    style={styles.howItWorksButton}
                    onPress={openHowItWorks}
                >
                    <Ionicons name="information-circle-outline" size={16} color="#217C0A" />
                    <Text style={styles.howItWorksText}>How It Works</Text>
                </TouchableOpacity>

                {/* Amount Selection Grid */}
                <View style={styles.amountGrid}>
                    {PRESET_AMOUNTS.map((amount) => {
                        const coinsForAmount = amount * GOLD_COINS_PER_DOLLAR;
                        return (
                            <TouchableOpacity
                                key={amount}
                                style={[
                                    styles.offerCard,
                                    {
                                        backgroundColor: selectedAmount === amount
                                            ? '#217C0A'
                                            : (isDark ? '#242428' : '#F3F4F6')
                                    }
                                ]}
                                onPress={() => handleAmountSelect(amount)}
                            >
                                {/* Free SportCash Section */}
                                <View style={styles.offerCardTopSection}>
                                    <View style={styles.sportCashRow}>
                                        <View style={[styles.sportCashIcon, { backgroundColor: '#00C853' }]}>
                                            <Text style={styles.sportCashIconText}>S</Text>
                                        </View>
                                        <Text style={[
                                            styles.sportCashAmount,
                                            {
                                                color: selectedAmount === amount
                                                    ? '#FFFFFF'
                                                    : (isDark ? '#FFFFFF' : '#000000')
                                            }
                                        ]}>
                                            {amount.toFixed(2)}
                                        </Text>
                                    </View>
                                    <Text style={[
                                        styles.sportCashLabel,
                                        {
                                            color: selectedAmount === amount
                                                ? '#FFFFFF'
                                                : (isDark ? '#FFFFFF' : '#000000')
                                        }
                                    ]}>
                                        Free SportCash
                                    </Text>
                                </View>

                                {/* Gold Coins Section */}
                                <View style={styles.offerCardMiddleSection}>
                                    <View style={styles.coinIconContainer}>
                                        <Image
                                            source={require('@/assets/images/goldCoin.png')}
                                            style={styles.offerCardCoinIcon}
                                            contentFit="contain"
                                        />
                                        <View style={styles.plusIconOverlay}>
                                            <Ionicons name="add" size={16} color="#00C853" />
                                        </View>
                                    </View>
                                    <Text style={[
                                        styles.goldCoinsAmount,
                                        {
                                            color: selectedAmount === amount
                                                ? '#FFFFFF'
                                                : (isDark ? '#FFFFFF' : '#000000')
                                        }
                                    ]}>
                                        {coinsForAmount.toLocaleString()}
                                    </Text>
                                    <Text style={[
                                        styles.goldCoinsLabel,
                                        {
                                            color: selectedAmount === amount
                                                ? '#FFFFFF'
                                                : (isDark ? '#FFFFFF' : '#000000')
                                        }
                                    ]}>
                                        Gold Coins
                                    </Text>
                                </View>

                                {/* Purchase Button */}
                                <View style={[
                                    styles.offerCardPurchaseButton,
                                    {
                                        backgroundColor: selectedAmount === amount
                                            ? '#E3F9EC'
                                            : '#0066CC'
                                    }
                                ]}>
                                    <Text style={[styles.offerCardPurchaseButtonText, { color: selectedAmount === amount ? '#217C0A' : '#FFFFFF' }]}>
                                        {formatCurrency(amount)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity
                        style={[styles.offerCard, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}
                        onPress={handleCustomAmountPress}
                    >
                        <View style={styles.offerCardMiddleSection}>
                            <Text style={[styles.goldCoinsLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                Custom
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Custom Amount Input */}
                {showCustomAmount && (
                    <View style={styles.customAmountContainer}>
                        <Text style={[styles.customAmountLabel, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Enter Amount (min. $10)
                        </Text>
                        <BottomSheetTextInput
                            ref={customAmountInputRef}
                            style={[
                                styles.customAmountInput,
                                {
                                    backgroundColor: isDark ? '#242428' : '#F3F4F6',
                                    color: isDark ? '#FFFFFF' : '#000000',
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                }
                            ]}
                            placeholder="$0.00"
                            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                            value={customAmount}
                            onChangeText={setCustomAmount}
                            keyboardType="decimal-pad"
                            returnKeyType="done"
                            onSubmitEditing={handleCustomAmountSubmit}
                        />
                        <View style={styles.customAmountButtons}>
                            <TouchableOpacity
                                style={[styles.customAmountButton, styles.cancelButton, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}
                                onPress={handleCustomAmountCancel}
                            >
                                <Text style={[styles.customAmountButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.customAmountButton, styles.submitButton, { backgroundColor: customAmount && parseFloat(customAmount) >= 10 ? '#10B981' : '#9CA3AF' }]}
                                onPress={handleCustomAmountSubmit}
                                disabled={!customAmount || parseFloat(customAmount) < 10}
                            >
                                <Text style={styles.customAmountButtonText}>
                                    Done
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Purchase Summary */}
                {selectedAmount && (
                    <View style={[styles.bonusContainer, { backgroundColor: isDark ? '#1A1D21' : '#F0FDF4' }]}>
                        <View style={styles.bonusHeader}>
                            <Text style={[styles.bonusTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                You'll Receive
                            </Text>
                        </View>
                        <View style={styles.bonusDetails}>
                            <View style={styles.bonusRow}>
                                <Text style={[styles.bonusLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Gold Coins (GC)
                                </Text>
                                <View style={styles.bonusValueContainer}>
                                    <AnimatedRollingNumber
                                        value={goldCoinsToReceive}
                                        useGrouping={true}
                                        enableCompactNotation={true}
                                        textStyle={[styles.bonusValue, { color: isDark ? '#FFFFFF' : '#000000' }]}
                                        spinningAnimationConfig={{ duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) }}
                                    />
                                    <Image
                                        source={require('@/assets/images/goldCoin.png')}
                                        style={styles.coinIcon}
                                        contentFit="contain"
                                    />
                                </View>
                            </View>
                            <View style={styles.bonusRow}>
                                <Text style={[styles.bonusLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    SportCash (SC)
                                </Text>
                                <View style={styles.bonusValueContainer}>
                                    <Text style={{ color: '#217C0A', fontWeight: 'bold', fontSize: 14 }}>$</Text>
                                    <AnimatedRollingNumber
                                        value={sportCashToReceive}
                                        useGrouping={true}
                                        enableCompactNotation={true}
                                        compactToFixed={2}
                                        textStyle={{ color: '#217C0A', fontWeight: 'bold', fontSize: 14 }}
                                        spinningAnimationConfig={{ duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) }}
                                    />
                                    <View style={[styles.bonusSportCashIcon, { backgroundColor: isDark ? '#374151' : '#1F2937' }]}>
                                        <Text style={styles.bonusSportCashIconText}>S</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Purchase Button */}
                <View style={styles.purchaseButtonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.purchaseButton,
                            {
                                backgroundColor: selectedAmount && !isLoading ? '#217C0A' : '#9CA3AF',
                                opacity: selectedAmount && !isLoading ? 1 : 0.5
                            }
                        ]}
                        onPress={handlePurchase}
                        disabled={!selectedAmount || isLoading}
                    >
                        {isLoading ? (
                            <Text style={styles.purchaseButtonText}>Processing...</Text>
                        ) : (
                            <View style={styles.purchaseButtonContent}>
                                <Text style={styles.purchaseButtonText}>Purchase</Text>
                                {selectedAmount && (
                                    <View style={styles.purchaseButtonAmount}>
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
                            </View>
                        )}
                    </TouchableOpacity>
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
        borderRadius: 20,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
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
    howItWorksButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 6,
    },
    howItWorksText: {
        color: '#217C0A',
        fontSize: 14,
        fontWeight: '600',
    },
    amountGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
        gap: 12,
    },
    offerCard: {
        width: '48%',
        borderRadius: 16,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 200,
    },
    offerCardTopSection: {
        alignItems: 'center',
        marginBottom: 12,
    },
    sportCashRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 4,
    },
    sportCashIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sportCashIconText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    sportCashAmount: {
        fontSize: 18,
        fontWeight: '600',
    },
    sportCashLabel: {
        fontSize: 11,
        fontWeight: '500',
        opacity: 0.9,
    },
    offerCardMiddleSection: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        marginVertical: 8,
    },
    coinIconContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    offerCardCoinIcon: {
        width: 48,
        height: 48,
    },
    plusIconOverlay: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    goldCoinsAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    goldCoinsLabel: {
        fontSize: 11,
        fontWeight: '500',
        opacity: 0.9,
    },
    offerCardPurchaseButton: {
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    offerCardPurchaseButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
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
    bonusContainer: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    bonusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bonusTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    bonusDetails: {
        gap: 8,
    },
    bonusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bonusLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    bonusValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    bonusValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    coinIcon: {
        width: 20,
        height: 20,
    },
    bonusSportCashIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bonusSportCashIconText: {
        color: '#00C853',
        fontSize: 12,
        fontWeight: 'bold',
    },
    firstTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        padding: 8,
        backgroundColor: 'rgba(33, 124, 10, 0.1)',
        borderRadius: 8,
    },
    firstTimeText: {
        fontSize: 12,
        color: '#217C0A',
        fontWeight: '500',
    },
    purchaseButtonContainer: {
        marginBottom: 20,
    },
    purchaseButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    purchaseButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    purchaseButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    purchaseButtonAmount: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomSpacing: {
        height: 30,
    },
});

