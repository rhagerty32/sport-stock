import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PriceHistory, TimePeriod } from '@/types';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth;
const CHART_HEIGHT = 200;

interface ChartProps {
    stockId: number;
    color?: string;
    backgroundColor?: string;
}

// Generate price history data (simplified version of the one in dummy-data)
const generatePriceHistory = (stockId: number, days: number = 365): PriceHistory[] => {
    const history: PriceHistory[] = [];
    let currentPrice = Math.random() * 100 + 20; // Start between $20-$120

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));

        // Random walk with slight upward bias
        const change = (Math.random() - 0.45) * 0.05; // Slight upward bias
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

const Chart: React.FC<ChartProps> = ({
    stockId,
    color = '#00C853',
    backgroundColor = null
}) => {
    const [priceData, setPriceData] = useState<PriceHistory[]>([]);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('1D');
    const { isDark } = useTheme();
    const animationProgress = useSharedValue(0);

    // Interactive chart state
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubPosition, setScrubPosition] = useState<{ x: number; y: number } | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [currentDate, setCurrentDate] = useState<string | null>(null);

    // Animated values for crosshairs
    const crosshairX = useSharedValue(0);
    const crosshairY = useSharedValue(0);
    const tooltipOpacity = useSharedValue(0);

    // Helper function to get price at x position
    const getPriceAtX = (x: number) => {
        if (priceData.length < 2) return null;

        const stepX = CHART_WIDTH / (priceData.length - 1);
        const dataIndex = Math.round(x / stepX);
        const clampedIndex = Math.max(0, Math.min(dataIndex, priceData.length - 1));

        return {
            price: priceData[clampedIndex].price,
            date: priceData[clampedIndex].timestamp,
            index: clampedIndex
        };
    };

    // Helper function to get y position for a given price
    const getYForPrice = (price: number) => {
        if (priceData.length < 2) return 0;

        const minPrice = Math.min(...priceData.map(d => d.price));
        const maxPrice = Math.max(...priceData.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;

        return CHART_HEIGHT - ((price - minPrice + padding) / (priceRange + padding * 2)) * CHART_HEIGHT;
    };

    // Handle gesture events
    const handleGestureEvent = (event: any) => {
        const { x, y } = event.nativeEvent;
        crosshairX.value = x;
        crosshairY.value = y;

        const priceData = getPriceAtX(x);
        if (priceData) {
            setCurrentPrice(priceData.price);
            setCurrentDate(priceData.date.toLocaleDateString());
            setScrubPosition({ x, y });
        }
    };

    const handleGestureBegin = () => {
        setIsScrubbing(true);
        tooltipOpacity.value = withTiming(1, { duration: 200 });
    };

    const handleGestureEnd = () => {
        setIsScrubbing(false);
        tooltipOpacity.value = withTiming(0, { duration: 200 });
        setScrubPosition(null);
        setCurrentPrice(null);
        setCurrentDate(null);
    };

    // Get data points based on time period
    const getDataPoints = (period: TimePeriod) => {
        const fullData = generatePriceHistory(stockId);

        switch (period) {
            case '1D':
                return fullData.slice(-24); // Last 24 hours (hourly data)
            case '1W':
                return fullData.slice(-7); // Last 7 days
            case '1M':
                return fullData.slice(-30); // Last 30 days
            case '3M':
                return fullData.slice(-90); // Last 90 days
            case '1Y':
                return fullData.slice(-365); // Last year
            case '5Y':
                return fullData; // All data
            default:
                return fullData.slice(-24);
        }
    };

    useEffect(() => {
        const data = getDataPoints(timePeriod);
        setPriceData(data);

        // Start animation
        animationProgress.value = 0;
        animationProgress.value = withTiming(1, { duration: 2500 });
    }, [timePeriod, stockId]);

    // Create SVG path for the line
    const createPath = (data: PriceHistory[]) => {
        if (data.length < 2) return '';

        const stepX = CHART_WIDTH / (data.length - 1);
        const minPrice = Math.min(...data.map(d => d.price));
        const maxPrice = Math.max(...data.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1; // 10% padding

        let path = '';

        data.forEach((point, index) => {
            const x = index * stepX;
            const y = CHART_HEIGHT - ((point.price - minPrice + padding) / (priceRange + padding * 2)) * CHART_HEIGHT;

            if (index === 0) {
                path += `M ${x} ${y}`;
            } else {
                path += ` L ${x} ${y}`;
            }
        });

        return path;
    };

    // Create gradient path for area under the line
    const createAreaPath = (data: PriceHistory[]) => {
        if (data.length < 2) return '';

        const stepX = CHART_WIDTH / (data.length - 1);
        const minPrice = Math.min(...data.map(d => d.price));
        const maxPrice = Math.max(...data.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;

        let path = '';

        data.forEach((point, index) => {
            const x = index * stepX;
            const y = CHART_HEIGHT - ((point.price - minPrice + padding) / (priceRange + padding * 2)) * CHART_HEIGHT;

            if (index === 0) {
                path += `M ${x} ${CHART_HEIGHT} L ${x} ${y}`;
            } else {
                path += ` L ${x} ${y}`;
            }
        });

        // Close the path
        const lastX = (data.length - 1) * stepX;
        path += ` L ${lastX} ${CHART_HEIGHT} Z`;

        return path;
    };

    const animatedClipStyle = useAnimatedStyle(() => {
        const progress = animationProgress.value;
        return {
            width: interpolate(progress, [0, 1], [CHART_WIDTH, 0]),
        };
    });

    const tooltipStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: Math.max(10, Math.min(crosshairX.value - 40, CHART_WIDTH - 80)),
        top: Math.max(10, crosshairY.value - 30),
        opacity: tooltipOpacity.value,
    }));

    return (
        <View style={{ width: '100%' }}>
            {/* Chart */}
            <View style={styles.chartContainer}>
                <GestureHandlerRootView style={styles.chart}>
                    <PanGestureHandler
                        onGestureEvent={handleGestureEvent}
                        onBegan={handleGestureBegin}
                        onEnded={handleGestureEnd}
                        onCancelled={handleGestureEnd}
                    >
                        <Animated.View style={styles.chart}>
                            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                                <Defs>
                                    <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
                                        <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
                                    </LinearGradient>
                                    <ClipPath id="chartClip">
                                        <Rect
                                            x="0"
                                            y="0"
                                            width={CHART_WIDTH}
                                            height={CHART_HEIGHT}
                                        />
                                    </ClipPath>
                                </Defs>

                                {/* Area under the line */}
                                <Path
                                    d={createAreaPath(priceData)}
                                    fill="url(#gradient)"
                                />

                                {/* Line */}
                                <Path
                                    d={createPath(priceData)}
                                    stroke={color}
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Crosshairs */}
                                {isScrubbing && currentPrice && (
                                    <>
                                        {/* Vertical crosshair */}
                                        <Line
                                            x1={crosshairX.value}
                                            y1={0}
                                            x2={crosshairX.value}
                                            y2={CHART_HEIGHT}
                                            stroke={color}
                                            strokeWidth={1}
                                            strokeOpacity={0.6}
                                        />
                                        {/* Price point indicator */}
                                        {currentPrice && (
                                            <Circle
                                                cx={crosshairX.value}
                                                cy={getYForPrice(currentPrice)}
                                                r={4}
                                                fill={color}
                                                stroke={backgroundColor || '#FFFFFF'}
                                                strokeWidth={2}
                                            />
                                        )}
                                    </>
                                )}
                            </Svg>

                            {/* Price tooltip */}
                            {isScrubbing && currentPrice && (
                                <Animated.View style={[styles.tooltip, tooltipStyle]}>
                                    <View
                                        style={[
                                            styles.tooltipContent,
                                            {
                                                backgroundColor:
                                                    backgroundColor ||
                                                    (isDark
                                                        ? '#23272e'
                                                        : '#FFFFFF'),
                                                borderColor:
                                                    isDark
                                                        ? '#374151'
                                                        : '#E5E7EB',
                                                borderWidth: 1,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.tooltipPrice, { color: isDark ? '#fff' : color }]}>
                                            ${currentPrice.toFixed(2)}
                                        </Text>
                                        {currentDate && (
                                            <Text
                                                style={[
                                                    styles.tooltipDate,
                                                    {
                                                        color:
                                                            isDark
                                                                ? '#9CA3AF'
                                                                : Colors.light.text,
                                                    },
                                                ]}
                                            >
                                                {currentDate}
                                            </Text>
                                        )}
                                    </View>
                                </Animated.View>
                            )}

                            {/* Animated mask that reveals the chart from left to right */}
                            <Animated.View
                                style={[
                                    styles.chartMask,
                                    { backgroundColor: backgroundColor || Colors[isDark ? 'dark' : 'light'].background },
                                    animatedClipStyle
                                ]}
                            />
                        </Animated.View>
                    </PanGestureHandler>
                </GestureHandlerRootView>
            </View>

            {/* Time Period Selector */}
            <View style={styles.timePeriodContainer}>
                {['1H', '1D', '1M', '1Y', '5Y', 'ALL'].map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={styles.timePeriodButton}
                        onPress={() => setTimePeriod(period as TimePeriod)}
                    >
                        <Text style={styles.timePeriodText}>
                            {period}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    priceContainer: {
        marginBottom: 20,
    },
    currentPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    changeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    chart: {
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
        position: 'relative',
    },
    chartMask: {
        position: 'absolute',
        top: 0,
        right: 0,
        height: CHART_HEIGHT,
    },
    timePeriodContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
    },
    timePeriodButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    activeTimePeriod: {
        backgroundColor: '#00C853',
    },
    timePeriodText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTimePeriodText: {
        color: 'white',
    },
    tooltip: {
        position: 'absolute',
        zIndex: 1000,
        transform: [{ translateY: -50 }],
    },
    tooltipContent: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tooltipPrice: {
        fontSize: 14,
        fontWeight: '600',
    },
    tooltipDate: {
        fontSize: 12,
        marginTop: 2,
    },
});

export default Chart;