import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useStockStore } from '@/stores/stockStore';
import { useWalletStore } from '@/stores/walletStore';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WalletBalance from '@/components/wallet/WalletBalance';

type WalletSystemBottomSheetProps = {
    walletSystemBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function WalletSystemBottomSheet({ walletSystemBottomSheetRef }: WalletSystemBottomSheetProps) {
    const { setWalletSystemBottomSheetOpen } = useStockStore();
    const { wallet } = useWalletStore();
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
        setWalletSystemBottomSheetOpen(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <BottomSheetModal
            ref={walletSystemBottomSheetRef}
            onDismiss={closeModal}
            stackBehavior='push'
            snapPoints={['90%']}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            enableOverDrag={true}
            style={{ borderRadius: 20 }}
            backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
        >
            <BottomSheetScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        How The Wallet System Works
                    </Text>
                </View>

                {/* Current Balances */}
                {wallet && (
                    <View style={[styles.balanceCard, { backgroundColor: isDark ? '#2C2C2E' : '#F9FAFB' }]}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Your Current Balances
                        </Text>
                        <WalletBalance showFanCoins={true} size="medium" />
                    </View>
                )}

                {/* FanCoins Explanation */}
                <View style={styles.section}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="logo-bitcoin" size={32} color="#217C0A" />
                    </View>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        What Are FanCoins?
                    </Text>
                    <Text style={[styles.sectionText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        FanCoins are entertainment tokens that you purchase with real money. They have no monetary value and cannot be exchanged for cash. Think of them as collectible tokens that show your support for SportStock.
                    </Text>
                </View>

                {/* Trading Credits Explanation */}
                <View style={styles.section}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="wallet" size={32} color="#217C0A" />
                    </View>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        What Are Trading Credits?
                    </Text>
                    <Text style={[styles.sectionText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        Trading Credits are promotional bonus credits that we grant you when you purchase FanCoins. These credits can be used to invest in sports teams, build your portfolio, and participate in trading activities on SportStock.
                    </Text>
                </View>

                {/* Bonus System Explanation */}
                <View style={styles.section}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="gift" size={32} color="#217C0A" />
                    </View>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        How FanCoins Work
                    </Text>
                    <Text style={[styles.sectionText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        When you purchase FanCoins, you receive 100 FanCoins for every $1 you spend. FanCoins are entertainment tokens with no monetary value. For every dollar you spend, you also receive $1 in Trading Credits that you can use to invest in sports teams.
                    </Text>
                    <View style={[styles.bonusTiers, { backgroundColor: isDark ? '#2C2C2E' : '#F9FAFB' }]}>
                        <View style={styles.tierRow}>
                            <Text style={[styles.tierAmount, { color: isDark ? '#FFFFFF' : '#000000' }]}>Example: $100 Purchase</Text>
                        </View>
                        <View style={styles.tierRow}>
                            <Text style={[styles.tierAmount, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>FanCoins Received</Text>
                            <Text style={[styles.tierBonus, { color: '#217C0A' }]}>10,000</Text>
                        </View>
                        <View style={styles.tierRow}>
                            <Text style={[styles.tierAmount, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Trading Credits</Text>
                            <Text style={[styles.tierBonus, { color: '#217C0A' }]}>$100.00</Text>
                        </View>
                    </View>
                </View>

                {/* How It Works Flow */}
                <View style={styles.section}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="arrow-forward-circle" size={32} color="#217C0A" />
                    </View>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        How It Works
                    </Text>
                    <View style={styles.flowContainer}>
                        <View style={styles.flowStep}>
                            <View style={[styles.stepNumber, { backgroundColor: '#217C0A' }]}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={[styles.flowText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                Purchase FanCoins with real money
                            </Text>
                        </View>
                        <Ionicons name="arrow-down" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} style={styles.flowArrow} />
                        <View style={styles.flowStep}>
                            <View style={[styles.stepNumber, { backgroundColor: '#217C0A' }]}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={[styles.flowText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                Receive Trading Credits as a bonus
                            </Text>
                        </View>
                        <Ionicons name="arrow-down" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} style={styles.flowArrow} />
                        <View style={styles.flowStep}>
                            <View style={[styles.stepNumber, { backgroundColor: '#217C0A' }]}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={[styles.flowText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                Use Trading Credits to invest in teams
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Legal Note */}
                <View style={[styles.legalNote, { backgroundColor: isDark ? '#1F2937' : '#FEF3C7' }]}>
                    <Ionicons name="information-circle" size={20} color={isDark ? '#9CA3AF' : '#92400E'} />
                    <Text style={[styles.legalText, { color: isDark ? '#9CA3AF' : '#92400E' }]}>
                        FanCoins are entertainment tokens with no monetary value. Trading Credits are promotional credits that can only be used within the SportStock platform. This system is designed to comply with applicable regulations.
                    </Text>
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
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    balanceCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    section: {
        marginBottom: 32,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    sectionText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    bonusTiers: {
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        gap: 12,
    },
    tierRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tierAmount: {
        fontSize: 14,
        fontWeight: '500',
    },
    tierBonus: {
        fontSize: 14,
        fontWeight: '600',
    },
    flowContainer: {
        alignItems: 'center',
        marginTop: 16,
    },
    flowStep: {
        alignItems: 'center',
        width: '100%',
    },
    stepNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    flowText: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    flowArrow: {
        marginVertical: 12,
    },
    legalNote: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    legalText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 16,
    },
    bottomSpacing: {
        height: 30,
    },
});

