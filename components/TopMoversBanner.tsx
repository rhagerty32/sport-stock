import { Ticker } from '@/components/Ticker';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { priceHistory, stocks } from '@/lib/dummy-data';
import { Stock } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface TopMoversBannerProps {
    onStockPress?: (stockId: number) => void;
}

export function TopMoversBanner({ onStockPress }: TopMoversBannerProps) {
    const { isDark } = useTheme();
    const cardWidth = 132; // 120 minWidth + 12 marginRight
    const translateX = useSharedValue(0);
    const isMountedRef = useRef(true);
    const animationRef = useRef<(() => void) | null>(null);

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

    useEffect(() => {
        isMountedRef.current = true;
        const halfWidth = (duplicatedMovers.length / 2) * cardWidth;
        const scrollSpeed = 0.2; // pixels per frame (0.2px per 16ms = ~12px per second)
        const duration = (halfWidth / scrollSpeed) * 16; // Calculate duration in ms

        // Reset to starting position
        translateX.value = 0;

        // Create a worklet-safe animation function stored in ref
        const startAnimation = () => {
            if (!isMountedRef.current) return;

            translateX.value = withTiming(-halfWidth, {
                duration: duration,
                easing: Easing.linear,
            }, (finished) => {
                'worklet';
                if (finished && isMountedRef.current) {
                    // Reset to 0 instantly for seamless loop
                    translateX.value = 0;
                    // Use runOnJS to call back to JS thread safely
                    if (animationRef.current) {
                        runOnJS(animationRef.current)();
                    }
                }
            });
        };

        // Store animation function in ref so it's stable across renders
        animationRef.current = startAnimation;
        startAnimation();

        return () => {
            // Cleanup on unmount or hot reload
            isMountedRef.current = false;
            animationRef.current = null;
            cancelAnimation(translateX);
            translateX.value = 0;
        };
    }, [duplicatedMovers.length]);

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
        const changeColor = isGainer ? '#00C853' : '#FF1744';
        const iconName = isGainer ? 'trending-up' : 'trending-down';

        return (
            <View style={styles.moverCard}>
                <GlassCard style={styles.card} padding={12} standard={true}>
                    <View style={styles.cardContent}>
                        <Ticker ticker={stock.ticker} color={stock.secondaryColor} />
                        <View style={styles.priceRow}>
                            <Text style={[styles.price, { color: isDark ? '#FFFFFF' : '#000000' }]}>
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

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    return (
        <View style={styles.container} pointerEvents="box-none">
            <View style={styles.scrollContainer} pointerEvents="box-none">
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
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: -8,
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
