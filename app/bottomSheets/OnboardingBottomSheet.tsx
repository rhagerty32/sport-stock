import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSettingsStore } from '@/stores/settingsStore';
import { PriceHistory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
// Confetti Piece Component
function ConfettiPiece({
    id,
    screenWidth,
    screenHeight,
    isActive,
    colors
}: {
    id: number;
    screenWidth: number;
    screenHeight: number;
    isActive: boolean;
    colors: string[];
}) {
    // Start from top portion of screen - explode outward in all directions
    const blastCenterX = screenWidth / 2;
    const blastCenterY = screenHeight * 0.25; // Start from top quarter of screen
    const angle = Math.random() * 2 * Math.PI; // Full 360 degrees for proper explosion
    const blastDistance = 100 + Math.random() * 150; // How far to explode outward
    const blastSpeed = 300 + Math.random() * 200; // Speed of explosion

    const startX = blastCenterX;
    const startY = blastCenterY;
    const endX = startX + Math.cos(angle) * blastDistance;
    const endY = startY + Math.sin(angle) * blastDistance;
    // Make sure confetti falls all the way to the bottom of the screen
    const finalY = screenHeight + 200; // Extra distance to ensure it falls past the bottom
    const finalX = endX + (Math.random() - 0.5) * 150; // Additional drift while falling

    const translateY = useSharedValue(startY);
    const translateX = useSharedValue(startX);
    const rotation = useSharedValue(Math.random() * 360);
    const opacity = useSharedValue(1);
    const delay = Math.random() * 100; // Small random delay
    const blastDuration = blastSpeed;
    const fallDuration = 2500 + Math.random() * 1500;
    const color = colors[Math.floor(Math.random() * colors.length)];
    // Confetti shape: rectangular pieces (wider than tall)
    const width = 6 + Math.random() * 8;
    const height = 3 + Math.random() * 4;
    const isSquare = Math.random() > 0.7; // 30% chance of square pieces

    useEffect(() => {
        if (isActive) {
            // Reset to starting position
            translateY.value = startY;
            translateX.value = startX;
            opacity.value = 1;
            rotation.value = Math.random() * 360;

            // Phase 1: Explosion - blast outward quickly
            setTimeout(() => {
                translateX.value = withTiming(
                    endX,
                    {
                        duration: blastDuration,
                        easing: Easing.out(Easing.ease),
                    }
                );
                translateY.value = withTiming(
                    endY,
                    {
                        duration: blastDuration,
                        easing: Easing.out(Easing.ease),
                    }
                );

                // Phase 2: After explosion, fall down
                setTimeout(() => {
                    translateY.value = withTiming(
                        finalY,
                        {
                            duration: fallDuration,
                            easing: Easing.in(Easing.ease),
                        }
                    );
                    translateX.value = withTiming(
                        finalX,
                        {
                            duration: fallDuration,
                            easing: Easing.inOut(Easing.ease),
                        }
                    );
                }, blastDuration);
            }, delay);

            // Animate rotation continuously
            rotation.value = withRepeat(
                withTiming(rotation.value + 360, {
                    duration: 800 + Math.random() * 400,
                    easing: Easing.linear,
                }),
                -1,
                false
            );

            // Fade out near the end
            setTimeout(() => {
                opacity.value = withTiming(0, { duration: 500 });
            }, delay + blastDuration + fallDuration - 500);
        }
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotation.value}deg` },
        ],
        opacity: opacity.value,
    }));

    if (!isActive) return null;

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    width: isSquare ? width : width,
                    height: isSquare ? width : height,
                    backgroundColor: color,
                    borderRadius: isSquare ? width / 4 : 1, // Square pieces have rounded corners, rectangles are sharp
                    zIndex: 99999, // Ensure confetti is on top of everything
                    elevation: 99999, // Android elevation
                },
                animatedStyle,
            ]}
        />
    );
}

// Simple Confetti Component using Reanimated (no Skia required)
function SimpleConfetti({ isActive }: { isActive: boolean }) {
    // Use full screen dimensions to cover everything including navigation
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const confettiCount = 100; // Increased from 50 to 100 for more confetti
    const colors = ['#00C853', '#34D399', '#FBBF24', '#60A5FA', '#FF6B6B', '#4ECDC4', '#FFD700', '#FF69B4'];

    if (!isActive) return null;

    return (
        <View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: screenWidth,
                height: screenHeight,
                zIndex: 99999,
                elevation: 99999,
                pointerEvents: 'none',
            }}
        >
            {Array.from({ length: confettiCount }, (_, i) => (
                <ConfettiPiece
                    key={i}
                    id={i}
                    screenWidth={screenWidth}
                    screenHeight={screenHeight}
                    isActive={isActive}
                    colors={colors}
                />
            ))}
        </View>
    );
}

type OnboardingBottomSheetProps = {
    onboardingBottomSheetRef: React.RefObject<BottomSheetModal>;
};

const CARD_GAP = 0; // Gap between cards
const getPageWidth = () => Dimensions.get('window').width; // Full screen width

// Generate price history for mini charts
const generateMiniPriceHistory = (stockId: number, days: number = 7): PriceHistory[] => {
    const history: PriceHistory[] = [];
    let currentPrice = Math.random() * 100 + 20;

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        const change = (Math.random() - 0.45) * 0.05;
        currentPrice = Math.max(1, currentPrice * (1 + change));

        const changeAmount = i > 0 ? currentPrice - history[i - 1].price : 0;
        const changePercentage = i > 0 ? (changeAmount / history[i - 1].price) * 100 : 0;

        history.push({
            stockID: stockId,
            timestamp: date,
            price: Math.round(currentPrice * 100) / 100,
            change: Math.round(changeAmount * 100) / 100,
            changePercentage: Math.round(changePercentage * 100) / 100,
        });
    }

    return history;
};

// Sample stocks for the second page
const sampleStocks = [
    { id: 62, name: 'Ohio State Football', ticker: 'OSU', price: 99.89, changePercent: 37.89, color: '#BB0000' },
    { id: 20, name: 'PHI Eagles', ticker: 'PHI', price: 90.69, changePercent: 37.89, color: '#006BB6' },
    { id: 61, name: 'Michigan Football', ticker: 'MICH', price: 15.29, changePercent: -37.89, color: '#00274C' },
    { id: 1, name: 'Kansas City Chiefs', ticker: 'KC', price: 125.50, changePercent: 12.45, color: '#E31837' },
    { id: 11, name: 'Los Angeles Lakers', ticker: 'LAL', price: 156.80, changePercent: 8.23, color: '#552583' },
    { id: 45, name: 'Duke Blue Devils', ticker: 'DUKE', price: 72.85, changePercent: 15.67, color: '#001A57' },
    { id: 74, name: 'Kansas Jayhawks', ticker: 'KU', price: 65.30, changePercent: -5.32, color: '#0051BA' },
];

// Mini Chart Component
function MiniChart({
    data,
    color,
    isDark,
    chartId,
    shouldAnimate,
    width = 120,
    height = 40
}: {
    data: PriceHistory[];
    color: string;
    isDark: boolean;
    chartId: string | number;
    shouldAnimate: boolean;
    width?: number;
    height?: number;
}) {
    const animationProgress = useSharedValue(0);

    useEffect(() => {
        if (shouldAnimate) {
            animationProgress.value = 0;
            animationProgress.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) });
        }
    }, [data, shouldAnimate]);

    const createSmoothPath = (data: PriceHistory[], progress: number) => {
        if (data.length < 2) return '';

        const stepX = width / (data.length - 1);
        const minPrice = Math.min(...data.map(d => d.price));
        const maxPrice = Math.max(...data.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;

        const points = data.map((point, index) => {
            const x = index * stepX;
            const y = height - ((point.price - minPrice + padding) / (priceRange + padding * 2)) * height;
            return { x, y };
        });

        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${points[0].y}`;
        const tension = 0.5;

        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            let cp1x, cp1y, cp2x, cp2y;

            if (i === 0) {
                const dx = (next.x - current.x) * tension;
                const dy = (next.y - current.y) * tension;
                cp1x = current.x + dx * 0.3;
                cp1y = current.y + dy * 0.3;
                cp2x = next.x - dx * 0.7;
                cp2y = next.y - dy * 0.7;
            } else if (i === points.length - 2) {
                const prev = points[i - 1];
                const dx = (next.x - prev.x) * tension;
                const dy = (next.y - prev.y) * tension;
                cp1x = current.x + dx * 0.3;
                cp1y = current.y + dy * 0.3;
                cp2x = next.x - dx * 0.3;
                cp2y = next.y - dy * 0.3;
            } else {
                const prev = points[i - 1];
                const nextNext = points[i + 2];
                const dx1 = (next.x - prev.x) * tension;
                const dy1 = (next.y - prev.y) * tension;
                const dx2 = (nextNext.x - current.x) * tension;
                const dy2 = (nextNext.y - current.y) * tension;

                cp1x = current.x + dx1 * 0.3;
                cp1y = current.y + dy1 * 0.3;
                cp2x = next.x - dx2 * 0.3;
                cp2y = next.y - dy2 * 0.3;
            }

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }

        return path;
    };

    const createAreaPath = (data: PriceHistory[]) => {
        if (data.length < 2) return '';

        const stepX = width / (data.length - 1);
        const minPrice = Math.min(...data.map(d => d.price));
        const maxPrice = Math.max(...data.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;

        const points = data.map((point, index) => {
            const x = index * stepX;
            const y = height - ((point.price - minPrice + padding) / (priceRange + padding * 2)) * height;
            return { x, y };
        });

        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${height} L ${points[0].x} ${points[0].y}`;
        const tension = 0.5;

        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            let cp1x, cp1y, cp2x, cp2y;

            if (i === 0) {
                const dx = (next.x - current.x) * tension;
                const dy = (next.y - current.y) * tension;
                cp1x = current.x + dx * 0.3;
                cp1y = current.y + dy * 0.3;
                cp2x = next.x - dx * 0.7;
                cp2y = next.y - dy * 0.7;
            } else if (i === points.length - 2) {
                const prev = points[i - 1];
                const dx = (next.x - prev.x) * tension;
                const dy = (next.y - prev.y) * tension;
                cp1x = current.x + dx * 0.3;
                cp1y = current.y + dy * 0.3;
                cp2x = next.x - dx * 0.3;
                cp2y = next.y - dy * 0.3;
            } else {
                const prev = points[i - 1];
                const nextNext = points[i + 2];
                const dx1 = (next.x - prev.x) * tension;
                const dy1 = (next.y - prev.y) * tension;
                const dx2 = (nextNext.x - current.x) * tension;
                const dy2 = (nextNext.y - current.y) * tension;

                cp1x = current.x + dx1 * 0.3;
                cp1y = current.y + dy1 * 0.3;
                cp2x = next.x - dx2 * 0.3;
                cp2y = next.y - dy2 * 0.3;
            }

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }

        const lastX = (data.length - 1) * (width / (data.length - 1));
        path += ` L ${lastX} ${height} Z`;

        return path;
    };

    const animatedClipStyle = useAnimatedStyle(() => {
        const progress = animationProgress.value;
        return {
            width: interpolate(progress, [0, 1], [width, 0]),
        };
    });

    const path = createSmoothPath(data, 1);
    const areaPath = createAreaPath(data);

    const gradientId = `gradient-${chartId}-${color.replace('#', '')}`;

    return (
        <View style={{ width, height, position: 'relative' }}>
            <Svg width={width} height={height}>
                <Defs>
                    <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </LinearGradient>
                </Defs>
                <Path d={areaPath} fill={`url(#${gradientId})`} />
                <Path
                    d={path}
                    stroke={color}
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        height: height,
                        backgroundColor: isDark ? '#1E2225' : '#FFFFFF',
                    },
                    animatedClipStyle
                ]}
            />
        </View>
    );
}

// Stock Card Component for second page
function StockCard({
    stock,
    isDark,
    index,
    shouldAnimate,
    cardWidth
}: {
    stock: typeof sampleStocks[0];
    isDark: boolean;
    index: number;
    shouldAnimate: boolean;
    cardWidth: number;
}) {
    const [priceData] = useState(() => generateMiniPriceHistory(stock.id, 7));
    const isPositive = stock.changePercent >= 0;

    return (
        <Animated.View
            entering={FadeIn.duration(500).delay(index * 150)}
            style={[
                styles.stockCard,
                {
                    backgroundColor: isDark ? '#1E2225' : '#FFFFFF',
                    width: cardWidth,
                },
            ]}
        >
            <View style={styles.stockCardHeader}>
                <View style={[styles.stockLogo, { backgroundColor: stock.color + '20' }]}>
                    <Text style={[styles.stockLogoText, { color: stock.color }]}>
                        {stock.ticker.slice(0, 2)}
                    </Text>
                </View>
                <View style={styles.stockCardInfo}>
                    <Text style={[styles.stockCardName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        {stock.name}
                    </Text>
                    <Text style={[styles.stockCardPrice, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        ${stock.price.toFixed(2)}
                    </Text>
                    <View style={styles.stockCardChange}>
                        <Ionicons
                            name={isPositive ? 'arrow-up' : 'arrow-down'}
                            size={12}
                            color={isPositive ? '#00C853' : '#dc2626'}
                        />
                        <Text style={[styles.stockCardChangeText, { color: isPositive ? '#00C853' : '#dc2626' }]}>
                            {Math.abs(stock.changePercent).toFixed(2)}%
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.stockChartContainer}>
                <MiniChart
                    data={priceData}
                    color={isPositive ? '#00C853' : '#dc2626'}
                    isDark={isDark}
                    chartId={stock.id}
                    shouldAnimate={shouldAnimate}
                    width={cardWidth} // Card width minus padding, min 80
                    height={40}
                />
            </View>
        </Animated.View>
    );
}

const ONBOARDING_PAGES = [
    {
        title: '1. Pick Your Teams',
        description: "Use your sports knowledge and instincts to buy SportStock in teams you believe are hot -  or about to heat up.",
        icon: 'trending-up',
        iconColor: '#00C853',
        gradientColors: ['#00C853', '#34D399'],
    },
    {
        title: '2. Follow Your Teams',
        description: "SportStock prices rise when people buy and fall when people sell.",
        icon: 'flash',
        iconColor: '#00C853',
        gradientColors: ['#00C853', '#60A5FA'],
    },
    {
        title: '3. What Effects You Buying?',
        description: "SportStock is a Performance Market - Win/Loss Record (Rankings), --Expectation, --Momentum, --Injuries, --Media Buzz & Fan Hype, --Coach and Player Trades, --Betting Odds, --Prediction Markets, Everything Matters",
        icon: 'stats-chart',
        iconColor: '#00C853',
        gradientColors: ['#00C853', '#60A5FA'],
    },
    {
        title: '4. Sell and Profit',
        description: "Sell your SportStocks at any time when you believe the downfall is coming. Cash out the profits. Prove you know ball!",
        icon: 'trophy',
        iconColor: '#00C853',
        gradientColors: ['#00C853', '#FBBF24'],
    },
];

// Stock Carousel Page Component
function StockCarouselPage({
    page,
    isDark,
    isActive
}: {
    page: typeof ONBOARDING_PAGES[1];
    isDark: boolean;
    isActive: boolean;
}) {
    const carouselTranslateX = useSharedValue(0);
    const screenWidth = Dimensions.get('window').width;
    // Calculate card width: full screen width divided by 3, with gaps
    const gapBetweenCards = 12;
    const cardWidth = (screenWidth - (gapBetweenCards * 2)) / 3;
    const totalCardWidth = cardWidth + gapBetweenCards;

    // Duplicate stocks for seamless infinite scroll
    const duplicatedStocks = [...sampleStocks, ...sampleStocks, ...sampleStocks];

    useEffect(() => {
        if (isActive) {
            // Start infinite scroll animation
            carouselTranslateX.value = 0;
            carouselTranslateX.value = withRepeat(
                withTiming(-totalCardWidth * sampleStocks.length, {
                    duration: 30000, // 30 seconds for slow movement
                    easing: Easing.linear,
                }),
                -1,
                false
            );
        } else {
            // Reset when not active
            carouselTranslateX.value = 0;
        }
    }, [isActive, totalCardWidth]);

    const animatedCarouselStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: carouselTranslateX.value }],
    }));

    return (
        <OnboardingCard index={1} style={{ paddingHorizontal: 0 }}>
            <Text
                style={[
                    styles.title,
                    {
                        color: isDark ? '#FFFFFF' : '#000000',
                        marginBottom: 10,
                        paddingHorizontal: 20, // Add padding only to title
                    },
                ]}
            >
                {page.title}
            </Text>
            <View style={styles.stocksCarouselWrapper}>
                <Animated.View style={[styles.stocksCarousel, animatedCarouselStyle]}>
                    {duplicatedStocks.map((stock, stockIndex) => (
                        <StockCard
                            key={`${stock.id}-${stockIndex}`}
                            stock={stock}
                            isDark={isDark}
                            index={stockIndex}
                            shouldAnimate={isActive}
                            cardWidth={cardWidth}
                        />
                    ))}
                </Animated.View>
            </View>
            <Text
                style={[
                    styles.description,
                    {
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        paddingHorizontal: 20, // Add padding only to description
                    },
                ]}
            >
                {page.description}
            </Text>
        </OnboardingCard>
    );
}

// Factors that affect stock prices with colors
const priceFactors = [
    { text: 'Rivalries', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF8E8E'] },
    { text: 'AP Polls', color: '#4ECDC4', gradient: ['#4ECDC4', '#6EDDD6'] },
    { text: 'Playoffs', color: '#FFD93D', gradient: ['#FFD93D', '#FFE66D'] },
    { text: 'Win/Loss', color: '#95E1D3', gradient: ['#95E1D3', '#B5EDE3'] },
    { text: 'Momentum', color: '#F38181', gradient: ['#F38181', '#F9A5A5'] },
    { text: 'Rankings', color: '#AA96DA', gradient: ['#AA96DA', '#C4B5E8'] },
    { text: 'Injuries', color: '#FCBAD3', gradient: ['#FCBAD3', '#FDD1E1'] },
    { text: 'Media Buzz', color: '#A8E6CF', gradient: ['#A8E6CF', '#C4F0DD'] },
    { text: 'Coaches', color: '#FFD3A5', gradient: ['#FFD3A5', '#FFE0C2'] },
    { text: 'Trades', color: '#C7CEEA', gradient: ['#C7CEEA', '#D9DFF0'] },
    { text: 'Betting Odds', color: '#FF8B94', gradient: ['#FF8B94', '#FFA8AF'] },
    { text: 'Game Performance', color: '#B8E6B8', gradient: ['#B8E6B8', '#D1F0D1'] },
    { text: 'Fan Hype', color: '#FFB6C1', gradient: ['#FFB6C1', '#FFCED6'] },
    { text: 'Prediction Markets', color: '#DDA0DD', gradient: ['#DDA0DD', '#E8BEE8'] },
    { text: 'Expectation', color: '#87CEEB', gradient: ['#87CEEB', '#A8DDF0'] },
];

// Factors Page Component (Third page)
function FactorsPage({
    page,
    isDark,
    index,
    isActive
}: {
    page: typeof ONBOARDING_PAGES[2];
    isDark: boolean;
    index: number;
    isActive: boolean;
}) {
    const scrollY = useSharedValue(0);
    const screenWidth = Dimensions.get('window').width;
    const badgeWidth = (screenWidth - 60) / 3; // 3 columns with padding
    const badgeHeight = 50;
    const badgeGap = 10;
    const rowHeight = badgeHeight + badgeGap;

    // Duplicate factors for seamless infinite scroll
    const duplicatedFactors = [...priceFactors, ...priceFactors, ...priceFactors];
    // Scroll distance for one set of factors (for seamless looping)
    const oneSetRows = Math.ceil(priceFactors.length / 3);
    const scrollDistance = oneSetRows * rowHeight;

    // Badge colors for variety
    const badgeColors = [
        ['#FF6B6B', '#FF8E8E'],
        ['#4ECDC4', '#6EDDD6'],
        ['#FFD93D', '#FFE66D'],
        ['#95E1D3', '#B5EDE3'],
        ['#F38181', '#F9A5A5'],
        ['#AA96DA', '#C4B5E8'],
        ['#FCBAD3', '#FDD1E1'],
        ['#A8E6CF', '#C4F0DD'],
        ['#FFD3A5', '#FFE0C2'],
        ['#C7CEEA', '#D9DFF0'],
        ['#FF8B94', '#FFA8AF'],
        ['#B8E6B8', '#D1F0D1'],
        ['#FFB6C1', '#FFCED6'],
        ['#DDA0DD', '#E8BEE8'],
        ['#87CEEB', '#A8DDF0'],
    ];

    useEffect(() => {
        if (isActive) {
            scrollY.value = 0;
            scrollY.value = withRepeat(
                withTiming(scrollDistance, {
                    duration: 30000, // 30 seconds for slow movement
                    easing: Easing.linear,
                }),
                -1,
                false
            );
        } else {
            scrollY.value = 0;
        }
    }, [isActive, scrollDistance]);

    const animatedScrollStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -scrollY.value }],
    }));

    return (
        <OnboardingCard index={index} style={{ flex: 1, paddingHorizontal: 20, width: '100%' }}>
            <Text
                style={[
                    styles.title,
                    {
                        color: isDark ? '#FFFFFF' : '#000000',
                        marginBottom: 24,
                        marginTop: 30,
                    },
                ]}
            >
                {page.title}
            </Text>

            {/* Badges Visualization - Redesigned with gradients */}
            <View style={[styles.badgesContainer, { height: 220 }]}>
                {/* Top Fade Mask with gradient */}
                <View
                    style={[
                        styles.fadeMask,
                        styles.fadeMaskTop,
                    ]}
                    pointerEvents="none"
                >
                    <Svg style={StyleSheet.absoluteFill} height="100%" width="100%">
                        <Defs>
                            <LinearGradient id={`topFade-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor={isDark ? '#1A1D21' : '#FFFFFF'} stopOpacity="1" />
                                <Stop offset="100%" stopColor={isDark ? '#1A1D21' : '#FFFFFF'} stopOpacity="0" />
                            </LinearGradient>
                        </Defs>
                        <Path
                            d={`M 0 0 L ${screenWidth - 40} 0 L ${screenWidth - 40} 50 L 0 50 Z`}
                            fill={`url(#topFade-${index})`}
                        />
                    </Svg>
                </View>

                {/* Scrolling Badges with gradients */}
                <View style={styles.badgesScrollWrapper}>
                    <Animated.View style={[styles.badgesScrollContent, animatedScrollStyle, { width: screenWidth - 40 }]}>
                        {duplicatedFactors.map((factor, factorIndex) => {
                            const row = Math.floor(factorIndex / 3);
                            const col = factorIndex % 3;
                            const factorData = typeof factor === 'string'
                                ? { text: factor, gradient: badgeColors[factorIndex % badgeColors.length] }
                                : factor;

                            return (
                                <View
                                    key={`${factorData.text}-${factorIndex}`}
                                    style={[
                                        styles.badge,
                                        {
                                            backgroundColor: isDark ? '#1E2225' : '#FFFFFF',
                                            width: badgeWidth,
                                            height: badgeHeight,
                                            position: 'absolute',
                                            left: col * (badgeWidth + badgeGap),
                                            top: row * rowHeight,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.badgeText,
                                            {
                                                color: isDark ? '#FFFFFF' : '#333333',
                                            },
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {factorData.text}
                                    </Text>
                                </View>
                            );
                        })}
                    </Animated.View>
                </View>

                {/* Bottom Fade Mask with gradient */}
                <View
                    style={[
                        styles.fadeMask,
                        styles.fadeMaskBottom,
                    ]}
                    pointerEvents="none"
                >
                    <Svg style={StyleSheet.absoluteFill} height="100%" width="100%">
                        <Defs>
                            <LinearGradient id={`bottomFade-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor={isDark ? '#1A1D21' : '#FFFFFF'} stopOpacity="0" />
                                <Stop offset="100%" stopColor={isDark ? '#1A1D21' : '#FFFFFF'} stopOpacity="1" />
                            </LinearGradient>
                        </Defs>
                        <Path
                            d={`M 0 0 L ${screenWidth - 40} 0 L ${screenWidth - 40} 50 L 0 50 Z`}
                            fill={`url(#bottomFade-${index})`}
                        />
                    </Svg>
                </View>
            </View>

            {/* Bullet Points Section - Redesigned */}
            <View style={styles.bulletPointsContainer}>
                <View style={[styles.bulletPointCard, { backgroundColor: isDark ? '#1E2225' : '#F8F9FA' }]}>
                    <View style={styles.bulletPointHeader}>
                        <View style={[styles.bulletPointIcon, { backgroundColor: '#00C85320' }]}>
                            <Ionicons name="trending-up" size={16} color="#00C853" />
                        </View>
                        <Text style={[styles.bulletPointLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            SportStock is a Performance Market
                        </Text>
                    </View>
                    {/* Everything Matters - Redesigned */}
                    <View style={styles.everythingMattersContainer}>
                        <View style={[styles.everythingMattersBadge, { backgroundColor: isDark ? '#7c2d12' : '#ffedd5' }]}>
                            <Ionicons name="alert-circle-outline" size={18} color={isDark ? '#fbbf24' : '#f59e0b'} />
                            <Text style={[styles.everythingMattersText, { color: isDark ? '#fbbf24' : '#f59e0b' }]}>
                                So Everything Matters
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

        </OnboardingCard>
    );
}

// Profit Page Component (Fourth page)
function ProfitPage({
    page,
    isDark,
    index,
    isActive
}: {
    page: typeof ONBOARDING_PAGES[3];
    isDark: boolean;
    index: number;
    isActive: boolean;
}) {
    // Simple confetti effect using Reanimated

    return (
        <View style={{ flex: 1, position: 'relative' }}>
            {/* Confetti is now rendered at bottom sheet level */}
            <OnboardingCard index={index} style={{ flex: 1, paddingHorizontal: 20, width: '100%' }}>
                {/* Stock Card */}
                <View style={[styles.profitStockCard, { backgroundColor: isDark ? '#1E2225' : '#FFFFFF', marginTop: 10 }]}>
                    <View style={styles.profitStockHeader}>
                        <View style={styles.profitStockInfo}>
                            <Text style={[styles.profitStockName, { color: isDark ? '#FFFFFF' : '#552583' }]}>
                                LA Lakers
                            </Text>
                            <Text style={[styles.profitStockLeague, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                Pro Basketball
                            </Text>
                        </View>
                        <View style={[styles.profitStockLogo, { backgroundColor: '#552583' }]}>
                            <Text style={styles.profitStockLogoText}>LA</Text>
                        </View>
                    </View>
                    <View style={styles.profitStockDetails}>
                        <View style={styles.profitStockDetailRow}>
                            <Text style={[styles.profitStockDetailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                Entries Sold
                            </Text>
                            <Text style={[styles.profitStockDetailValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                10
                            </Text>
                        </View>
                        <View style={styles.profitStockDetailRow}>
                            <Text style={[styles.profitStockDetailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                Price per Entry
                            </Text>
                            <Text style={[styles.profitStockDetailValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                $120
                            </Text>
                        </View>
                        <View style={styles.profitStockDetailRow}>
                            <Text style={[styles.profitStockDetailLabel, { color: '#00C853' }]}>
                                Total Winnings
                            </Text>
                            <Text style={[styles.profitStockDetailValue, { color: '#00C853' }]}>
                                $1,200
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Buy/Sell Buttons */}
                <View style={styles.profitButtonsContainer}>
                    <TouchableOpacity style={[styles.profitButton, styles.buyButton]}>
                        <Text style={styles.profitButtonText}>Buy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.profitButton, styles.sellButton]}>
                        <Text style={styles.profitButtonText}>Sell</Text>
                    </TouchableOpacity>
                </View>

                {/* Title and Description */}
                <Text
                    style={[
                        styles.title,
                        {
                            color: isDark ? '#FFFFFF' : '#000000',
                            marginTop: 20,
                            marginBottom: 10,
                        },
                    ]}
                >
                    {page.title}
                </Text>
                <Text
                    style={[
                        styles.description,
                        { color: isDark ? '#9CA3AF' : '#6B7280' },
                    ]}
                >
                    {page.description}
                </Text>
            </OnboardingCard>
        </View>
    );
}

// Card Component with shadow
function OnboardingCard({
    children,
    style,
    index
}: {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    index: number;
}) {
    return (
        <Animated.View
            entering={FadeIn.duration(500).delay(index * 150)}
            style={[
                styles.cardWrapper,
                style,
                {
                    backgroundColor: 'transparent',
                    shadowColor: '#000000',
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}

// First Page Content Component with image error handling
function FirstPageContent({
    page,
    isDark,
    index
}: {
    page: typeof ONBOARDING_PAGES[0];
    isDark: boolean;
    index: number;
}) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <OnboardingCard index={index} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
            <View style={styles.imageContainer}>
                {!imageError ? (
                    <Image
                        source={require('@/assets/images/helmets.png')}
                        style={styles.battleImage}
                        contentFit="contain"
                        onError={() => {
                            setImageError(true);
                            setImageLoaded(false);
                        }}
                        onLoad={() => setImageLoaded(true)}
                        transition={200}
                        cachePolicy="memory-disk"
                    />
                ) : null}
            </View>
            <Text
                style={[
                    styles.title,
                    {
                        color: isDark ? '#FFFFFF' : '#000000',
                        marginBottom: 10,
                        marginTop: 10,
                    },
                ]}
            >
                {page.title}
            </Text>
            <Text
                style={[
                    styles.description,
                    {
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        paddingHorizontal: 0,
                    },
                ]}
            >
                {page.description}
            </Text>
        </OnboardingCard>
    );
}

// Animated Pagination Dot Component
function PaginationDot({
    isActive,
    isDark,
}: {
    isActive: boolean;
    isDark: boolean;
}) {
    const width = useSharedValue(isActive ? 24 : 8);

    useEffect(() => {
        width.value = withTiming(isActive ? 24 : 8, {
            duration: 300,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1.0), // Smooth bezier with minimal springiness
        });
    }, [isActive, width]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: width.value,
        };
    });

    return (
        <Animated.View
            style={[
                styles.paginationDot,
                {
                    backgroundColor: isActive
                        ? '#00C853'
                        : isDark
                            ? '#2C2C2C'
                            : '#E5E7EB',
                },
                animatedStyle,
            ]}
        />
    );
}

export default function OnboardingBottomSheet({ onboardingBottomSheetRef }: OnboardingBottomSheetProps) {
    const { isDark } = useTheme();
    const { lightImpact, mediumImpact, success } = useHaptics();
    const { completeOnboarding } = useSettingsStore();

    // Dev variable: Set to 0-3 to start at a specific step (0 = first page, 1 = second, etc.)
    const DEV_START_PAGE = 0;

    const [currentPage, setCurrentPage] = useState(DEV_START_PAGE);
    const translateX = useSharedValue(0);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                enableTouchThrough={false}
                opacity={0.5}
            />
        ),
        []
    );

    useEffect(() => {
        // Reset to dev start page when sheet opens
        setCurrentPage(DEV_START_PAGE);
        const pageWidth = getPageWidth();
        translateX.value = -DEV_START_PAGE * (pageWidth + CARD_GAP);
    }, []);

    const handleNext = () => {
        if (currentPage < ONBOARDING_PAGES.length - 1) {
            mediumImpact();
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            const pageWidth = getPageWidth();
            // Smooth Bezier curve easing - ease-in-out with cubic bezier
            translateX.value = withTiming(-nextPage * (pageWidth + CARD_GAP), {
                duration: 400,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1.0), // Material Design standard easing
            });
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentPage > 0) {
            lightImpact();
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            const pageWidth = getPageWidth();
            // Smooth Bezier curve easing - ease-in-out with cubic bezier
            translateX.value = withTiming(-prevPage * (pageWidth + CARD_GAP), {
                duration: 400,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1.0), // Material Design standard easing
            });
        }
    };

    const handleComplete = () => {
        success();
        completeOnboarding();
        closeModal();
    };

    const closeModal = () => {
        onboardingBottomSheetRef.current?.dismiss();
    };

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const isLastPage = currentPage === ONBOARDING_PAGES.length - 1;

    return (
        <BottomSheetModal
            ref={onboardingBottomSheetRef}
            onDismiss={closeModal}
            stackBehavior="push"
            enableDynamicSizing={true}
            enablePanDownToClose={false}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            snapPoints={['90%']}
            enableOverDrag={false}
            style={{ borderRadius: 20 }}
            backgroundStyle={{
                borderRadius: 20,
                backgroundColor: isDark ? '#1A1D21' : '#FFFFFF',
            }}
        >
            {/* Confetti - rendered at bottom sheet level to cover everything */}
            {currentPage === 3 && <SimpleConfetti isActive={currentPage === 3} />}
            <BottomSheetView style={styles.container}>
                {/* Content Container */}
                <View style={styles.contentContainer}>
                    <Animated.View
                        style={[styles.pagesContainer, animatedContainerStyle]}
                    >
                        {ONBOARDING_PAGES.map((page, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.page,
                                    {
                                        width: getPageWidth(),
                                        marginRight: index < ONBOARDING_PAGES.length - 1 ? CARD_GAP : 0,
                                    },
                                ]}
                            >
                                <View style={styles.cardContent}>
                                    {index === 0 ? (
                                        // First page with image
                                        <FirstPageContent page={page} isDark={isDark} index={index} />
                                    ) : index === 1 ? (
                                        // Second page with stock cards carousel
                                        <StockCarouselPage
                                            page={page}
                                            isDark={isDark}
                                            isActive={currentPage === 1}
                                        />
                                    ) : index === 2 ? (
                                        // Third page with factors and badges
                                        <FactorsPage
                                            page={page}
                                            isDark={isDark}
                                            index={index}
                                            isActive={currentPage === 2}
                                        />
                                    ) : (
                                        // Fourth page with stock card and buy/sell buttons
                                        <ProfitPage
                                            page={page}
                                            isDark={isDark}
                                            index={index}
                                            isActive={currentPage === index}
                                        />
                                    )}
                                </View>
                            </View>
                        ))}
                    </Animated.View>
                </View>

                {/* Pagination Dots */}
                <View style={styles.paginationContainer}>
                    {ONBOARDING_PAGES.map((_, index) => (
                        <PaginationDot
                            key={index}
                            isActive={index === currentPage}
                            isDark={isDark}
                        />
                    ))}
                </View>

                {/* Navigation Buttons */}
                <View style={styles.navigationContainer}>
                    {currentPage > 0 && (
                        <TouchableOpacity
                            style={[
                                styles.navButton,
                                styles.backButton,
                                { backgroundColor: isDark ? '#1E2225' : '#F3F4F6' },
                            ]}
                            onPress={handlePrevious}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={20}
                                color={isDark ? '#FFFFFF' : '#000000'}
                            />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            styles.nextButton,
                            {
                                backgroundColor: '#00C853',
                                flex: currentPage === 0 ? 1 : 0.85,
                            },
                        ]}
                        onPress={handleNext}
                    >
                        <Text style={styles.nextButtonText}>
                            {isLastPage ? 'Get Started' : 'Next'}
                        </Text>
                        {!isLastPage && (
                            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
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
    container: {
        flex: 1,
        borderRadius: 20,
        paddingTop: 10,
        overflow: 'visible',
    },
    contentContainer: {
        flex: 1,
        overflow: 'visible',
        paddingHorizontal: 0,
    },
    pagesContainer: {
        flexDirection: 'row',
        height: '100%',
    },
    page: {
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Prevent content from bleeding into adjacent pages
    },
    cardContent: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    cardWrapper: {
        width: '100%',
        maxWidth: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 48,
        textAlign: 'center',
        width: '100%',
    },
    iconIllustrationContainer: {
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'visible',
    },
    gradientLayer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 80,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: 8,
        fontWeight: '400',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginVertical: 24,
        width: '100%',
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
    },
    navigationContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
        paddingHorizontal: 12,
    },
    navButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    backButton: {
        width: 50,
    },
    nextButton: {
        flex: 1,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 20,
    },
    imageContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        marginTop: 10,
        minHeight: 0, // Allow container to collapse if image fails
    },
    battleImage: {
        width: '100%',
        height: 240,
        maxWidth: 320,
        marginVertical: 0,
    },
    stocksCarouselWrapper: {
        width: Dimensions.get('window').width, // Full screen width
        overflow: 'hidden', // Keep hidden for carousel effect
        marginVertical: 20,
        marginLeft: -12, // Negative margin to extend to edge (compensate for container padding)
        marginRight: -12, // Negative margin to extend to edge
        paddingBottom: 4, // Add padding to prevent bottom cutoff
        position: 'relative', // Ensure proper containment
        zIndex: 1, // Ensure it's above other content
    },
    stocksCarousel: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingBottom: 12,
    },
    stockCard: {
        borderRadius: 12,
        marginRight: 12,
        flexShrink: 0,
        justifyContent: 'space-between',
        height: 175, // Fixed height so all cards are the same
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    stockCardHeader: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 0,
        padding: 12,
        paddingBottom: 0,
        width: '100%',
    },
    stockLogo: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        marginRight: 0,
    },
    stockLogoText: {
        fontSize: 12,
        fontWeight: '700',
    },
    stockCardInfo: {
        width: '100%',
    },
    stockCardName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    stockCardPrice: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    stockCardChange: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    stockCardChangeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    stockChartContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        overflow: 'hidden',
        borderRadius: 12,
    },
    profitStockCard: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    profitStockHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    profitStockInfo: {
        flex: 1,
    },
    profitStockName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    profitStockLeague: {
        fontSize: 14,
        fontWeight: '400',
    },
    profitStockLogo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#552583',
    },
    profitStockLogoText: {
        color: '#FDB927',
        fontSize: 18,
        fontWeight: 'bold',
    },
    profitStockDetails: {
        gap: 12,
    },
    profitStockDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profitStockDetailLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    profitStockDetailValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    profitButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
        width: '100%',
    },
    profitButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buyButton: {
        backgroundColor: '#00C853',
    },
    sellButton: {
        backgroundColor: '#dc2626',
    },
    profitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    confettiContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
    },
    bulletPointsContainer: {
        width: '100%',
    },
    bulletPointCard: {
        borderRadius: 16,
        padding: 16,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 24,
    },
    bulletPointHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bulletPointIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bulletPointLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    bulletPointMainText: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
    },
    factorTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    factorTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    factorTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    badgesContainer: {
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 24,
        borderRadius: 20,
    },
    badgesScrollWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
    badgesScrollContent: {
        position: 'relative',
    },
    badge: {
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
    },
    fadeMask: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 50,
        zIndex: 10,
        width: '100%',
    },
    fadeMaskTop: {
        top: 0,
    },
    fadeMaskBottom: {
        bottom: 0,
    },
    everythingMattersContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 8,
    },
    everythingMattersBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    everythingMattersText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

