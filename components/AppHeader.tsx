import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useStockStore } from '@/stores/stockStore';
import { useWalletStore } from '@/stores/walletStore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function AppHeader() {
    const Color = useColors();
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const { setPurchaseFanCoinsBottomSheetOpen } = useStockStore();
    const { wallet } = useWalletStore();

    const [showWalletDropdown, setShowWalletDropdown] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState<'GC' | 'SC'>('SC');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const dropdownOpacity = useSharedValue(0);
    const dropdownScale = useSharedValue(0.8);
    const gcIconOpacity = useSharedValue(selectedCurrency === 'GC' ? 1 : 0);
    const scIconOpacity = useSharedValue(selectedCurrency === 'SC' ? 1 : 0);

    useEffect(() => {
        const loadSelectedCurrency = async () => {
            try {
                const saved = await AsyncStorage.getItem('selectedCurrency');
                if (saved === 'GC' || saved === 'SC') {
                    setSelectedCurrency(saved);
                }
            } catch (error) {
                console.error('Failed to load selected currency:', error);
            }
        };
        loadSelectedCurrency();
    }, []);

    useEffect(() => {
        if (showWalletDropdown) {
            setIsDropdownVisible(true);
            dropdownOpacity.value = withSpring(1, { damping: 150, stiffness: 500, mass: 0.8 });
            dropdownScale.value = withSpring(1, { damping: 150, stiffness: 500, mass: 0.8 });
        } else {
            dropdownOpacity.value = withSpring(0, { damping: 200, stiffness: 300, mass: 0.6 });
            dropdownScale.value = withSpring(0.8, { damping: 200, stiffness: 300, mass: 0.6 });
            const timer = setTimeout(() => setIsDropdownVisible(false), 200);
            return () => clearTimeout(timer);
        }
    }, [showWalletDropdown]);

    useEffect(() => {
        if (selectedCurrency === 'GC') {
            gcIconOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
            scIconOpacity.value = withSpring(0, { damping: 20, stiffness: 300 });
        } else {
            gcIconOpacity.value = withSpring(0, { damping: 20, stiffness: 300 });
            scIconOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
        }
    }, [selectedCurrency]);

    const formatNumber = (amount: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

    const handleCurrencySelect = async (currency: 'GC' | 'SC') => {
        setSelectedCurrency(currency);
        setShowWalletDropdown(false);
        lightImpact();
        try {
            await AsyncStorage.setItem('selectedCurrency', currency);
        } catch (error) {
            console.error('Failed to save selected currency:', error);
        }
    };

    const dropdownAnimatedStyle = useAnimatedStyle(() => ({
        opacity: dropdownOpacity.value,
        transform: [{ scale: Math.round(dropdownScale.value * 100) / 100 }],
    }), []);

    const gcIconAnimatedStyle = useAnimatedStyle(() => ({ opacity: gcIconOpacity.value }), []);
    const scIconAnimatedStyle = useAnimatedStyle(() => ({ opacity: scIconOpacity.value }), []);

    const dropdownBgColor = isDark ? '#1A1A1A' : '#FFFFFF';

    const WalletDropdownMenu = () => {
        if (!wallet) return null;
        return (
            <Animated.View style={[styles.dropdownWrapper, dropdownAnimatedStyle]} collapsable={false}>
                <Animated.View
                    style={[styles.dropdownTriangle, { borderBottomColor: dropdownBgColor }, dropdownAnimatedStyle]}
                    collapsable={false}
                />
                <Animated.View
                    style={[styles.walletDropdownMenu, { backgroundColor: dropdownBgColor }, dropdownAnimatedStyle]}
                    collapsable={false}
                >
                    <TouchableOpacity
                        style={[styles.currencyOption, { backgroundColor: selectedCurrency === 'GC' ? isDark ? '#242428' : '#F3F4F6' : 'transparent' }]}
                        onPress={() => handleCurrencySelect('GC')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.currencyAmount, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                            {formatNumber(wallet.fanCoins)}
                        </Text>
                        <View style={styles.currencyRight}>
                            <Image source={require('@/assets/images/goldCoin.png')} style={styles.coinIconImage} contentFit="contain" />
                            <Text style={[styles.currencyCode, { color: isDark ? '#D1D5DB' : '#374151' }]}>GC</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.currencyOption, { backgroundColor: selectedCurrency === 'SC' ? isDark ? '#242428' : '#F3F4F6' : 'transparent' }]}
                        onPress={() => handleCurrencySelect('SC')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.currencyAmount, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                            {formatNumber(wallet.tradingCredits)}
                        </Text>
                        <View style={styles.currencyRight}>
                            <View style={[styles.coinIcon, { backgroundColor: isDark ? '#374151' : '#1F2937' }]}>
                                <Image source={require('@/assets/images/sportstockLogo.png')} style={styles.coinIconImage} contentFit="contain" />
                            </View>
                            <Text style={[styles.currencyCode, { color: isDark ? '#D1D5DB' : '#374151' }]}>SC</Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.header, { backgroundColor: isDark ? '#0B0F13' : '#FFFFFF' }]}>
            <View style={styles.headerTop}>
                <Text style={[styles.logo, { color: Color.baseText }]}>SportStock</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 0 }}
                        onPress={() => {
                            setShowWalletDropdown(!showWalletDropdown);
                            lightImpact();
                        }}
                    >
                        {wallet ? (
                            <View style={[styles.balanceContainer, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                                <View style={styles.balanceSubContainer}>
                                    <View style={styles.balanceAmountContainer}>
                                        <AnimatedRollingNumber
                                            value={selectedCurrency === 'GC' ? wallet.fanCoins : wallet.tradingCredits}
                                            useGrouping={true}
                                            enableCompactNotation={false}
                                            compactToFixed={2}
                                            textStyle={[styles.balance, { color: Color.baseText }]}
                                            spinningAnimationConfig={{ duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1.0) }}
                                        />
                                        <View style={styles.coinIconContainer}>
                                            <Animated.View style={[styles.coinIconWrapper, gcIconAnimatedStyle]}>
                                                <Image source={require('@/assets/images/goldCoin.png')} style={styles.balanceCoinIcon} contentFit="contain" />
                                            </Animated.View>
                                            <Animated.View style={[styles.coinIconWrapper, styles.scCoinIcon, { backgroundColor: isDark ? '#374151' : '#1F2937' }, scIconAnimatedStyle]}>
                                                <Image source={require('@/assets/images/sportstockLogo.png')} style={styles.balanceCoinIcon} contentFit="contain" />
                                            </Animated.View>
                                        </View>
                                    </View>
                                </View>
                                <Ionicons name="chevron-down" size={20} color={selectedCurrency === 'GC' ? '#F7CE37' : Color.green} style={styles.chevron} />
                            </View>
                        ) : (
                            <Text style={[styles.balance, { color: Color.subText }]}>Loading...</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={[styles.addButton, { backgroundColor: Color.green }]}
                        onPress={() => {
                            setShowWalletDropdown(false);
                            setPurchaseFanCoinsBottomSheetOpen(true);
                            lightImpact();
                        }}
                    >
                        <Ionicons name="add" size={24} color={isDark ? '#0B0F13' : '#fff'} />
                    </TouchableOpacity>
                </View>
            </View>
            {isDropdownVisible && wallet && <WalletDropdownMenu />}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 1000,
        elevation: 1000,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    balanceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 6,
        borderRadius: 10,
    },
    balanceSubContainer: {
        alignItems: 'flex-end',
    },
    balance: {
        fontSize: 16,
        fontWeight: '600',
    },
    balanceAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
    },
    coinIconContainer: {
        position: 'relative',
        width: 20,
        height: 20,
    },
    coinIconWrapper: {
        position: 'absolute',
        width: 20,
        height: 20,
    },
    balanceCoinIcon: {
        width: 20,
        height: 20,
    },
    scCoinIcon: {
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chevron: {
        marginLeft: 8,
    },
    addButton: {
        padding: 3,
        borderRadius: 10,
    },
    dropdownWrapper: {
        position: 'absolute',
        top: 100,
        right: 20,
        zIndex: 1000,
        alignItems: 'flex-end',
    },
    dropdownTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginBottom: -1,
        marginRight: 20,
    },
    walletDropdownMenu: {
        borderRadius: 10,
        padding: 12,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 200,
    },
    currencyOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    currencyAmount: {
        fontSize: 16,
        fontWeight: '500',
    },
    currencyRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    coinIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coinIconImage: {
        width: 24,
        height: 24,
    },
    currencyCode: {
        fontSize: 14,
        fontWeight: '500',
    },
});
