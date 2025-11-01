import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { PriceHistory, TimePeriod } from '@/types';
import { Host, Picker } from '@expo/ui/swift-ui';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedReaction,
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
const generatePriceHistory = (
    stockId: number,
    days: number = 365,
    interval: 'daily' | 'hourly' | 'minute' | 'weekly' | 'monthly' = 'daily'
): PriceHistory[] => {
    const history: PriceHistory[] = [];
    let currentPrice = Math.random() * 100 + 20; // Start between $20-$120

    let totalIntervals: number;
    if (interval === 'minute') {
        totalIntervals = days * 24 * 60; // minutes
    } else if (interval === 'hourly') {
        totalIntervals = days * 24; // hours
    } else if (interval === 'weekly') {
        totalIntervals = Math.ceil(days / 7); // weeks (rounded up)
    } else if (interval === 'monthly') {
        totalIntervals = Math.ceil(days / 30); // months (approximate, rounded up)
    } else {
        totalIntervals = days; // days
    }

    for (let i = 0; i < totalIntervals; i++) {
        const date = new Date();
        if (interval === 'minute') {
            date.setMinutes(date.getMinutes() - (totalIntervals - i));
        } else if (interval === 'hourly') {
            date.setHours(date.getHours() - (totalIntervals - i));
        } else if (interval === 'weekly') {
            date.setDate(date.getDate() - ((totalIntervals - i) * 7));
        } else if (interval === 'monthly') {
            date.setMonth(date.getMonth() - (totalIntervals - i));
        } else {
            date.setDate(date.getDate() - (days - i));
        }

        // Random walk with slight upward bias
        // Smaller changes for smaller intervals (less volatility per interval)
        let volatility: number;
        if (interval === 'minute') {
            volatility = 0.002; // Very small changes per minute
        } else if (interval === 'hourly') {
            volatility = 0.01; // Small changes per hour
        } else if (interval === 'weekly') {
            volatility = 0.15; // Moderate changes per week
        } else if (interval === 'monthly') {
            volatility = 0.5; // Larger changes per month
        } else {
            volatility = 0.05; // Normal changes per day
        }
        const change = (Math.random() - 0.45) * volatility; // Slight upward bias
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
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('1H');
    const { isDark } = useTheme();
    const { selection } = useHaptics();
    const animationProgress = useSharedValue(0);

    const timePeriodOptions = ['1H', '1D', '1M', '1Y', '5Y', 'ALL'];
    const timePeriodKeys: TimePeriod[] = ['1H', '1D', '1M', '1Y', '5Y', 'ALL'];
    const initialTimeIndex = timePeriodKeys.indexOf(timePeriod);
    const [selectedTimeIndex, setSelectedTimeIndex] = useState<number>(initialTimeIndex >= 0 ? initialTimeIndex : 0);

    // Interactive chart state
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubPosition, setScrubPosition] = useState<{ x: number; y: number } | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [currentDate, setCurrentDate] = useState<string | null>(null);

    // Animated values for crosshairs
    const crosshairX = useSharedValue(0);
    const crosshairY = useSharedValue(0);
    const tooltipOpacity = useSharedValue(0);

    // Animated value for smooth/sharp transition (1 = smooth, 0 = sharp)
    const smoothness = useSharedValue(1);
    const [smoothnessState, setSmoothnessState] = useState(1);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const animationFrameRef = useRef<number | null>(null);
    const smoothnessStateRef = useRef(1);
    const timeoutRef = useRef<number | null>(null);
    const isScrubbingRef = useRef(false);

    // Keep refs in sync with state
    useEffect(() => {
        smoothnessStateRef.current = smoothnessState;
    }, [smoothnessState]);

    useEffect(() => {
        isScrubbingRef.current = isScrubbing;
    }, [isScrubbing]);

    // Sync tooltipOpacity to tooltipVisible state - use lower threshold for better responsiveness
    useAnimatedReaction(
        () => tooltipOpacity.value,
        (value, previousValue) => {
            // Update when crossing the threshold or when value changes significantly
            const wasVisible = previousValue !== undefined && previousValue !== null && previousValue > 0.1;
            const isVisible = value > 0.1;

            if (wasVisible !== isVisible) {
                runOnJS(setTooltipVisible)(isVisible);
            }
        }
    );

    // Watch isScrubbing and animate smoothness accordingly
    useEffect(() => {
        // Determine target smoothness: 
        // - If scrubbing: always sharp (even if tooltip hasn't appeared yet)
        // - If not scrubbing: smooth (regardless of tooltip visibility, tooltip will fade)
        const targetSmoothness = isScrubbing ? 0 : 1;

        // Cancel any existing animation FIRST
        if (animationFrameRef.current !== null) {
            if (typeof cancelAnimationFrame !== 'undefined') {
                cancelAnimationFrame(animationFrameRef.current);
            } else {
                clearTimeout(animationFrameRef.current);
            }
            animationFrameRef.current = null;
        }
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Update ref with current state value
        smoothnessStateRef.current = smoothnessState;

        // Get current value
        const currentValue = smoothnessStateRef.current;

        // If already at target, don't animate
        if (Math.abs(currentValue - targetSmoothness) < 0.001) {
            return;
        }

        const duration = 300;
        const startTime = Date.now();
        const startValue = currentValue;
        const endValue = targetSmoothness;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (endValue - startValue) * eased;

            setSmoothnessState(currentValue);

            if (progress < 1) {
                if (typeof requestAnimationFrame !== 'undefined') {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    animationFrameRef.current = setTimeout(animate, 16) as unknown as number;
                }
            } else {
                setSmoothnessState(endValue);
                animationFrameRef.current = null;
            }
        };

        // Start animation immediately
        if (typeof requestAnimationFrame !== 'undefined') {
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            animationFrameRef.current = setTimeout(animate, 16) as unknown as number;
        }

        return () => {
            if (animationFrameRef.current !== null) {
                if (typeof cancelAnimationFrame !== 'undefined') {
                    cancelAnimationFrame(animationFrameRef.current);
                } else {
                    clearTimeout(animationFrameRef.current);
                }
                animationFrameRef.current = null;
            }
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isScrubbing]); // Only watch isScrubbing for reliability

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

        const priceDataResult = getPriceAtX(x);
        if (priceDataResult) {
            setCurrentPrice(priceDataResult.price);
            setCurrentDate(priceDataResult.date.toLocaleDateString());
            setScrubPosition({ x, y });
        }
    };

    const startSmoothnessAnimation = (targetValue: number) => {
        // Cancel any existing animation
        if (animationFrameRef.current !== null) {
            if (typeof cancelAnimationFrame !== 'undefined') {
                cancelAnimationFrame(animationFrameRef.current);
            } else {
                clearTimeout(animationFrameRef.current);
            }
            animationFrameRef.current = null;
        }
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        const duration = 300;
        const startTime = Date.now();
        const startValue = smoothnessStateRef.current;
        const endValue = targetValue;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (endValue - startValue) * eased;

            setSmoothnessState(currentValue);

            if (progress < 1) {
                if (typeof requestAnimationFrame !== 'undefined') {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    animationFrameRef.current = setTimeout(animate, 16) as unknown as number;
                }
            } else {
                setSmoothnessState(endValue);
                animationFrameRef.current = null;
            }
        };

        if (typeof requestAnimationFrame !== 'undefined') {
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            animationFrameRef.current = setTimeout(animate, 16) as unknown as number;
        }
    };

    const handleGestureBegin = () => {
        isScrubbingRef.current = true; // Set ref immediately for synchronous access
        setIsScrubbing(true);
        tooltipOpacity.value = withTiming(1, { duration: 200 });
        // Immediately start animation to sharp
        smoothnessStateRef.current = smoothnessState;
        startSmoothnessAnimation(0);
    };

    const handleGestureEnd = () => {
        isScrubbingRef.current = false; // Set ref immediately for synchronous access
        setIsScrubbing(false);
        tooltipOpacity.value = withTiming(0, { duration: 200 });

        // Immediately start animation back to smooth
        // Ensure we have the latest value - use functional update to guarantee current state
        setSmoothnessState((currentValue) => {
            // Update ref with the current value from the state
            smoothnessStateRef.current = currentValue;
            // Start the animation immediately
            startSmoothnessAnimation(1);
            // Return current value so state update doesn't interfere
            return currentValue;
        });

        setScrubPosition(null);
        setCurrentPrice(null);
        setCurrentDate(null);
    };

    // Get data points based on time period
    const getDataPoints = (period: TimePeriod) => {
        switch (period) {
            case '1H':
                // Generate minute-by-minute data for last hour (60 minutes = 60 data points)
                // Generate at least 2 hours of minute data to ensure we have enough
                // 2 hours = 2/24 days = 1/12 days
                const minuteData = generatePriceHistory(stockId, 2 / 24, 'minute');
                return minuteData.slice(-60); // Last 60 minutes
            case '1D':
                // Generate hourly data for last 24 hours (24 data points)
                // Generate at least 2 days of hourly data to ensure we have enough
                const dayHourlyData = generatePriceHistory(stockId, 2, 'hourly');
                return dayHourlyData.slice(-24); // Last 24 hours
            case '1W':
                // Daily data for last 7 days
                return generatePriceHistory(stockId, 7, 'daily');
            case '1M':
                // Daily data for last 30 days
                return generatePriceHistory(stockId, 30, 'daily');
            case '3M':
                // Daily data for last 90 days
                return generatePriceHistory(stockId, 90, 'daily');
            case '1Y':
                // Daily data for last year
                return generatePriceHistory(stockId, 365, 'daily');
            case '5Y':
                // Weekly data for last 5 years (much more performant than daily)
                // 5 years = ~1825 days = ~260 weeks
                return generatePriceHistory(stockId, 1825, 'weekly');
            case 'ALL':
                // Weekly data for all available data (optimized for performance)
                return generatePriceHistory(stockId, 1825, 'weekly');
            default:
                return generatePriceHistory(stockId, 1, 'hourly').slice(-24);
        }
    };

    // Sync selectedTimeIndex when timePeriod changes externally
    useEffect(() => {
        const newIndex = timePeriodKeys.indexOf(timePeriod);
        if (newIndex >= 0 && newIndex !== selectedTimeIndex) {
            setSelectedTimeIndex(newIndex);
        }
    }, [timePeriod]);

    useEffect(() => {
        const data = getDataPoints(timePeriod);
        setPriceData(data);

        // Start animation
        animationProgress.value = 0;
        animationProgress.value = withTiming(1, { duration: 2500 });

        // Reset to smooth lines when data changes
        smoothness.value = 1;
        setSmoothnessState(1);
    }, [timePeriod, stockId]);



    // Helper function to create smooth cubic bezier curve path
    const createSmoothPath = (data: PriceHistory[]) => {
        if (data.length < 2) return '';

        const stepX = CHART_WIDTH / (data.length - 1);
        const minPrice = Math.min(...data.map(d => d.price));
        const maxPrice = Math.max(...data.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;

        // Calculate points
        const points = data.map((point, index) => {
            const x = index * stepX;
            const y = CHART_HEIGHT - ((point.price - minPrice + padding) / (priceRange + padding * 2)) * CHART_HEIGHT;
            return { x, y };
        });

        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${points[0].y}`;

        // For smooth curves, use cubic bezier with control points
        // Calculate control points using cardinal spline
        const tension = 0.5;

        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            let cp1x, cp1y, cp2x, cp2y;

            if (i === 0) {
                // First segment
                const dx = (next.x - current.x) * tension;
                const dy = (next.y - current.y) * tension;
                cp1x = current.x + dx * 0.3;
                cp1y = current.y + dy * 0.3;
                cp2x = next.x - dx * 0.7;
                cp2y = next.y - dy * 0.7;
            } else if (i === points.length - 2) {
                // Last segment
                const prev = points[i - 1];
                const dx = (next.x - prev.x) * tension;
                const dy = (next.y - prev.y) * tension;
                cp1x = current.x + dx * 0.3;
                cp1y = current.y + dy * 0.3;
                cp2x = next.x - dx * 0.3;
                cp2y = next.y - dy * 0.3;
            } else {
                // Middle segments
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

    // Create SVG path for the line (sharp/straight version)
    const createSharpPath = (data: PriceHistory[]) => {
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

    // Create interpolated path that smoothly transitions between smooth and sharp
    const createInterpolatedPath = (data: PriceHistory[], smoothnessValue: number) => {
        if (data.length < 2) return '';

        const stepX = CHART_WIDTH / (data.length - 1);
        const minPrice = Math.min(...data.map(d => d.price));
        const maxPrice = Math.max(...data.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;

        // Calculate points
        const points = data.map((point, index) => {
            const x = index * stepX;
            const y = CHART_HEIGHT - ((point.price - minPrice + padding) / (priceRange + padding * 2)) * CHART_HEIGHT;
            return { x, y };
        });

        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${points[0].y}`;

        // When smoothness is 0, use straight lines
        // When smoothness is 1, use full bezier curves
        // Interpolate control points between these states
        const tension = 0.5;

        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            let cp1x, cp1y, cp2x, cp2y;

            if (i === 0) {
                // First segment
                const dx = (next.x - current.x) * tension;
                const dy = (next.y - current.y) * tension;
                // Interpolate control points: at smoothness=0, control points are on the line (straight)
                // at smoothness=1, control points are at calculated positions (curved)
                cp1x = current.x + dx * 0.3 * smoothnessValue;
                cp1y = current.y + dy * 0.3 * smoothnessValue;
                cp2x = next.x - dx * (0.7 * smoothnessValue);
                cp2y = next.y - dy * (0.7 * smoothnessValue);
            } else if (i === points.length - 2) {
                // Last segment
                const prev = points[i - 1];
                const dx = (next.x - prev.x) * tension;
                const dy = (next.y - prev.y) * tension;
                cp1x = current.x + dx * 0.3 * smoothnessValue;
                cp1y = current.y + dy * 0.3 * smoothnessValue;
                cp2x = next.x - dx * 0.3 * smoothnessValue;
                cp2y = next.y - dy * 0.3 * smoothnessValue;
            } else {
                // Middle segments
                const prev = points[i - 1];
                const nextNext = points[i + 2];
                const dx1 = (next.x - prev.x) * tension;
                const dy1 = (next.y - prev.y) * tension;
                const dx2 = (nextNext.x - current.x) * tension;
                const dy2 = (nextNext.y - current.y) * tension;

                cp1x = current.x + dx1 * 0.3 * smoothnessValue;
                cp1y = current.y + dy1 * 0.3 * smoothnessValue;
                cp2x = next.x - dx2 * 0.3 * smoothnessValue;
                cp2y = next.y - dy2 * 0.3 * smoothnessValue;
            }

            // Always use bezier curves, but interpolate control points to approach the line when smoothness is 0
            // This ensures smooth transitions without snapping
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }

        return path;
    };

    // Create gradient path for area under the line (smooth version)
    const createSmoothAreaPath = (data: PriceHistory[]) => {
        if (data.length < 2) return '';

        const stepX = CHART_WIDTH / (data.length - 1);
        const minPrice = Math.min(...data.map(d => d.price));
        const maxPrice = Math.max(...data.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;

        // Calculate points
        const points = data.map((point, index) => {
            const x = index * stepX;
            const y = CHART_HEIGHT - ((point.price - minPrice + padding) / (priceRange + padding * 2)) * CHART_HEIGHT;
            return { x, y };
        });

        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${CHART_HEIGHT} L ${points[0].x} ${points[0].y}`;

        // Use same smooth curve logic as line path
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

        // Close the path
        const lastX = (data.length - 1) * stepX;
        path += ` L ${lastX} ${CHART_HEIGHT} Z`;

        return path;
    };

    // Create gradient path for area under the line (sharp version)
    const createSharpAreaPath = (data: PriceHistory[]) => {
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

    // Create interpolated area path that smoothly transitions between smooth and sharp
    const createInterpolatedAreaPath = (data: PriceHistory[], smoothnessValue: number) => {
        if (data.length < 2) return '';

        const stepX = CHART_WIDTH / (data.length - 1);
        const minPrice = Math.min(...data.map(d => d.price));
        const maxPrice = Math.max(...data.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;

        // Calculate points
        const points = data.map((point, index) => {
            const x = index * stepX;
            const y = CHART_HEIGHT - ((point.price - minPrice + padding) / (priceRange + padding * 2)) * CHART_HEIGHT;
            return { x, y };
        });

        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${CHART_HEIGHT} L ${points[0].x} ${points[0].y}`;

        const tension = 0.5;

        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            let cp1x, cp1y, cp2x, cp2y;

            if (i === 0) {
                const dx = (next.x - current.x) * tension;
                const dy = (next.y - current.y) * tension;
                cp1x = current.x + dx * 0.3 * smoothnessValue;
                cp1y = current.y + dy * 0.3 * smoothnessValue;
                cp2x = next.x - dx * (0.7 * smoothnessValue);
                cp2y = next.y - dy * (0.7 * smoothnessValue);
            } else if (i === points.length - 2) {
                const prev = points[i - 1];
                const dx = (next.x - prev.x) * tension;
                const dy = (next.y - prev.y) * tension;
                cp1x = current.x + dx * 0.3 * smoothnessValue;
                cp1y = current.y + dy * 0.3 * smoothnessValue;
                cp2x = next.x - dx * 0.3 * smoothnessValue;
                cp2y = next.y - dy * 0.3 * smoothnessValue;
            } else {
                const prev = points[i - 1];
                const nextNext = points[i + 2];
                const dx1 = (next.x - prev.x) * tension;
                const dy1 = (next.y - prev.y) * tension;
                const dx2 = (nextNext.x - current.x) * tension;
                const dy2 = (nextNext.y - current.y) * tension;

                cp1x = current.x + dx1 * 0.3 * smoothnessValue;
                cp1y = current.y + dy1 * 0.3 * smoothnessValue;
                cp2x = next.x - dx2 * 0.3 * smoothnessValue;
                cp2y = next.y - dy2 * 0.3 * smoothnessValue;
            }

            // Always use bezier curves, but interpolate control points to approach the line when smoothness is 0
            // This ensures smooth transitions without snapping
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }

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
                                    d={createInterpolatedAreaPath(priceData, smoothnessState)}
                                    fill="url(#gradient)"
                                />

                                {/* Line */}
                                <Path
                                    d={createInterpolatedPath(priceData, smoothnessState)}
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
                <Host style={{ width: '100%', minHeight: 20 }}>
                    <Picker
                        options={timePeriodOptions}
                        selectedIndex={selectedTimeIndex}
                        onOptionSelected={({ nativeEvent: { index } }) => {
                            setSelectedTimeIndex(index);
                            setTimePeriod(timePeriodKeys[index]);
                            selection();
                        }}
                        variant="segmented"
                    />
                </Host>
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
        paddingHorizontal: 20,
        marginBottom: 0,
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