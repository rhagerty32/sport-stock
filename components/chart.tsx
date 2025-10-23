import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PriceHistory, TimePeriod } from '@/types';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

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
    const colorScheme = useColorScheme();
    const animationProgress = useSharedValue(0);

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

    return (
        <View style={{ width: '100%' }}>
            {/* Chart */}
            <View style={styles.chartContainer}>
                <View style={styles.chart}>
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
                    </Svg>

                    {/* Animated mask that reveals the chart from left to right */}
                    <Animated.View
                        style={[
                            styles.chartMask,
                            { backgroundColor: backgroundColor || Colors[colorScheme || 'light'].background },
                            animatedClipStyle
                        ]}
                    />
                </View>
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
});

export default Chart;