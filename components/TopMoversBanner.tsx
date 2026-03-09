import { Ticker } from '@/components/Ticker';
import { GlassCard } from '@/components/ui/GlassCard';
import { Stock } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useColors } from './utils';

export type MoverItem = { stock: Stock; change: number; changePercentage: number };

interface TopMoversBannerProps {
    onStockPress?: (stock: Stock) => void;
    gainers?: MoverItem[];
    losers?: MoverItem[];
    loading?: boolean;
}

const CARD_WIDTH = 132;
const CARD_GAP = 12;
const SCROLL_PADDING_LEFT = 20;

export function TopMoversBanner({ onStockPress, gainers = [], losers = [], loading = false }: TopMoversBannerProps) {
    const Color = useColors();
    const translateX = useSharedValue(0);
    const gestureStartX = useSharedValue(0);
    const isMountedRef = useRef(true);
    const halfWidthRef = useRef(0);
    const animationRef = useRef<(() => void) | null>(null);

    const { allMovers, duplicatedMovers } = useMemo(() => {
        const all = [...gainers, ...losers];
        return { allMovers: all, duplicatedMovers: [...all, ...all] };
    }, [gainers, losers]);

    const startAnimation = useCallback(() => {
        if (!isMountedRef.current) return;
        const halfWidth = halfWidthRef.current;
        const scrollSpeed = 0.6;
        const duration = (halfWidth / scrollSpeed) * 16;

        translateX.value = withTiming(-halfWidth, {
            duration,
            easing: Easing.linear,
        }, (finished) => {
            'worklet';
            if (finished && isMountedRef.current) {
                translateX.value = 0;
                if (animationRef.current) {
                    runOnJS(animationRef.current)();
                }
            }
        });
    }, []);

    const restartAnimationFrom = useCallback((currentX: number) => {
        const halfWidth = halfWidthRef.current;
        let normalized = currentX;
        while (normalized > 0) normalized -= halfWidth;
        while (normalized < -halfWidth) normalized += halfWidth;
        translateX.value = normalized;
        startAnimation();
    }, [startAnimation]);

    useEffect(() => {
        isMountedRef.current = true;
        animationRef.current = startAnimation;
        const n = duplicatedMovers.length / 2;
        // Exact width of one "lap" (padding + N cards including gap) so reset at 0 matches -halfWidth (seamless loop)
        const halfWidth = SCROLL_PADDING_LEFT + n * (CARD_WIDTH + CARD_GAP) - CARD_GAP;
        halfWidthRef.current = halfWidth;

        translateX.value = 0;
        startAnimation();

        return () => {
            isMountedRef.current = false;
            animationRef.current = null;
            cancelAnimation(translateX);
            translateX.value = 0;
        };
    }, [duplicatedMovers.length, startAnimation]);

    const handlePress = (stock: Stock) => {
        onStockPress?.(stock);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatPercentage = (percentage: number) => {
        const sign = percentage >= 0 ? '+' : '';
        return `${sign}${percentage.toFixed(2)}%`;
    };

    const renderMoverCard = (
        stock: Stock,
        changePercentage: number,
        isGainer: boolean,
        index: number
    ) => {
        const changeColor = isGainer ? Color.green : Color.red;
        const iconName = isGainer ? 'trending-up' : 'trending-down';

        return (
            <View style={styles.moverCard}>
                <GlassCard style={styles.card} padding={12} standard={true}>
                    <View style={styles.cardContent}>
                        <Ticker ticker={stock.ticker} color={stock.secondaryColor} />
                        <View style={styles.priceRow}>
                            <Text style={[styles.price, { color: Color.baseText }]}>
                                {formatCurrency(stock.price)}
                            </Text>
                            <Ionicons name={iconName} size={16} color={changeColor} />
                        </View>
                        <Text style={[styles.change, { color: changeColor }]}>
                            {formatPercentage(changePercentage)}
                        </Text>
                    </View>
                </GlassCard>
            </View>
        );
    };

    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .minDistance(12)
                .activeOffsetX([-15, 15])
                .onStart(() => {
                    cancelAnimation(translateX);
                    gestureStartX.value = translateX.value;
                })
                .onUpdate((e) => {
                    translateX.value = gestureStartX.value + e.translationX;
                })
                .onEnd(() => {
                    const current = translateX.value;
                    runOnJS(restartAnimationFrom)(current);
                }),
        [restartAnimationFrom]
    );

    const fadeOpacity = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });
    const fadeStyle = useAnimatedStyle(() => ({
        opacity: fadeOpacity.value,
    }));

    useEffect(() => {
        if (!loading && allMovers.length > 0) {
            fadeOpacity.value = withTiming(1, { duration: 300 });
        }
    }, [loading, allMovers.length]);

    if (loading) {
        return null;
    }
    if (allMovers.length === 0) {
        return null;
    }

    return (
        <Animated.View style={[styles.container, fadeStyle]} pointerEvents="box-none">
            <View style={styles.scrollContainer} pointerEvents="box-none">
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[
                            styles.scrollContent,
                            animatedStyle,
                            { flexDirection: 'row' }
                        ]}
                        pointerEvents="box-none"
                    >
                        {duplicatedMovers.map(({ stock, changePercentage }, index) => {
                            const isGainer = changePercentage >= 0;
                            return (
                                <TouchableOpacity
                                    key={`${stock.id}-${index}`}
                                    activeOpacity={0.7}
                                    onPress={() => handlePress(stock)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={styles.cardWrapper}
                                >
                                    {renderMoverCard(stock, changePercentage, isGainer, index)}
                                </TouchableOpacity>
                            );
                        })}
                    </Animated.View>
                </GestureDetector>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: -16,
        marginBottom: 24,
        height: 80, // Fixed height to prevent expansion
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    scrollContainer: {
        height: 80, // Fixed height to prevent expansion
        overflow: 'hidden',
    },
    scrollContent: {
        paddingLeft: 20,
        height: 80,
    },
    cardWrapper: {
        marginRight: 12,
    },
    moverCard: {
        marginTop: 8,
        marginBottom: 8,
    },
    moverCardPressed: {
        opacity: 0.7,
    },
    card: {
        minWidth: 120,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    price: {
        fontSize: 14,
        fontWeight: '600',
    },
    change: {
        fontSize: 14,
        fontWeight: '600',
    },
});
