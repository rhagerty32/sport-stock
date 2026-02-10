import { Ticker } from '@/components/Ticker';
import { GlassCard } from '@/components/ui/GlassCard';
import { priceHistory, stocks } from '@/lib/dummy-data';
import { Stock } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useColors } from './utils';

interface TopMoversBannerProps {
    onStockPress?: (stockId: number) => void;
}

export function TopMoversBanner({ onStockPress }: TopMoversBannerProps) {
    const Color = useColors();
    const cardWidth = 132; // 120 minWidth + 12 marginRight
    const translateX = useSharedValue(0);
    const gestureStartX = useSharedValue(0);
    const isMountedRef = useRef(true);
    const animationRef = useRef<(() => void) | null>(null);
    const halfWidthRef = useRef(0);

    // Calculate top movers (up and down) based on recent price changes
    const { allMovers, duplicatedMovers } = useMemo(() => {
        const stockChanges: Array<{ stock: Stock; change: number; changePercentage: number }> = [];

        stocks.forEach((stock) => {
            // Get the most recent price history entries for this stock
            const stockPriceHistory = priceHistory
                .filter((ph) => ph.stockID === stock.id)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 2); // Get last 2 entries to calculate change

            if (stockPriceHistory.length >= 2) {
                const current = stockPriceHistory[0];
                const previous = stockPriceHistory[1];
                const change = current.price - previous.price;
                const changePercentage = ((change / previous.price) * 100);

                stockChanges.push({
                    stock,
                    change,
                    changePercentage,
                });
            }
        });

        // Sort by change percentage
        stockChanges.sort((a, b) => b.changePercentage - a.changePercentage);

        // Get top gainers (top 5) and top losers (bottom 5)
        const topGainers = stockChanges.slice(0, 5);
        const topLosers = stockChanges.slice(-5).reverse(); // Reverse to show biggest losers first

        // Combine them: gainers first, then losers
        const allMovers = [...topGainers, ...topLosers];

        // Duplicate the array for seamless infinite scroll
        const duplicatedMovers = [...allMovers, ...allMovers];

        return { allMovers, duplicatedMovers };
    }, []);

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
        const halfWidth = (duplicatedMovers.length / 2) * cardWidth;
        halfWidthRef.current = halfWidth;

        animationRef.current = startAnimation;
        translateX.value = 0;
        startAnimation();

        return () => {
            isMountedRef.current = false;
            animationRef.current = null;
            cancelAnimation(translateX);
            translateX.value = 0;
        };
    }, [duplicatedMovers.length, startAnimation]);

    const handlePress = (stockId: number) => {
        // Call the handler immediately
        onStockPress?.(stockId);
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

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    return (
        <View style={styles.container} pointerEvents="box-none">
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
                                    onPress={() => handlePress(stock.id)}
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
        </View>
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
