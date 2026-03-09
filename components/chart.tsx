import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PriceHistory, TimePeriod } from '@/types';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useColors } from './utils';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth;
const CHART_HEIGHT = 200;
const FLAT_LINE_Y = CHART_HEIGHT / 2;
const PULSE_DOT_RADIUS = 5;
const PULSE_DOT_RIGHT_MARGIN = 12;

interface ChartProps {
    stockId: number;
    color?: string;
    backgroundColor?: string;
    /** When provided, chart uses this data instead of generating. Used for API-sourced data (e.g. portfolio summary). */
    priceData?: PriceHistory[] | null;
    /** Hide the time period selector when using external priceData (e.g. single period from API). */
    hideTimePeriodSelector?: boolean;
}

/** Filter API-sourced price history by selected time period (by date). */
function filterPriceDataByPeriod(data: PriceHistory[], period: TimePeriod): PriceHistory[] {
    if (data.length === 0) return [];
    const now = Date.now();
    const sorted = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let cutoff: number;
    switch (period) {
        case '1H': cutoff = now - 60 * 60 * 1000; break;
        case '1D': cutoff = now - 24 * 60 * 60 * 1000; break;
        case '1W': cutoff = now - 7 * 24 * 60 * 60 * 1000; break;
        case '1M': cutoff = now - 30 * 24 * 60 * 60 * 1000; break;
        case '3M': cutoff = now - 90 * 24 * 60 * 60 * 1000; break;
        case '1Y': cutoff = now - 365 * 24 * 60 * 60 * 1000; break;
        case '5Y': cutoff = now - 5 * 365 * 24 * 60 * 60 * 1000; break;
        case 'ALL': return sorted;
        default: return sorted;
    }
    return sorted.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
}

const Chart: React.FC<ChartProps> = ({
    stockId,
    color = useColors()?.green,
    backgroundColor = null,
    priceData: externalPriceData = null,
    hideTimePeriodSelector = false,
}) => {
    const Color = useColors();
    const [priceData, setPriceData] = useState<PriceHistory[]>([]);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('1H');
    const { isDark } = useTheme();
    const animationProgress = useSharedValue(0);
    const pingScale = useSharedValue(1);
    const pingOpacity = useSharedValue(0.7);

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

    useEffect(() => {
        let data: PriceHistory[];

        if (externalPriceData != null) {
            // Use API-sourced data; filter by selected time period. Empty array shows empty chart.
            data =
                externalPriceData.length > 0
                    ? filterPriceDataByPeriod(externalPriceData, timePeriod)
                    : [];
        } else {
            // No priceData provided: show empty chart. Callers must pass real API data.
            data = [];
        }

        setPriceData(data);

        // Start animation
        animationProgress.value = 0;
        animationProgress.value = withTiming(1, { duration: 2500 });

        // Reset to smooth lines when data changes
        smoothness.value = 1;
        setSmoothnessState(1);
    }, [timePeriod, stockId, externalPriceData]);

    const hasNoPriceHistory = priceData.length < 2;

    // Ping: one dot expands and fades out, then resets (solid dot stays put)
    useEffect(() => {
        pingScale.value = withRepeat(
            withSequence(
                withTiming(2.5, { duration: 2000 }),
                withTiming(1, { duration: 0 })
            ),
            -1,
            false
        );
        pingOpacity.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 2000 }),
                withTiming(0.7, { duration: 0 })
            ),
            -1,
            false
        );
        return () => {
            pingScale.value = 1;
            pingOpacity.value = 0.7;
        };
    }, []);


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

    const pingDotStyle = useAnimatedStyle(() => ({
        opacity: pingOpacity.value,
        transform: [{ scale: pingScale.value }],
    }));

    // Dot at end of line: center when no history, last price y when we have data
    const pulseDotY =
        priceData.length < 2
            ? FLAT_LINE_Y - PULSE_DOT_RADIUS
            : getYForPrice(priceData[priceData.length - 1].price) - PULSE_DOT_RADIUS;

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

                                {hasNoPriceHistory ? (
                                    <>
                                        {/* Flat line when no price history (Robinhood-style) */}
                                        <Line
                                            x1={0}
                                            y1={FLAT_LINE_Y}
                                            x2={CHART_WIDTH - PULSE_DOT_RIGHT_MARGIN - PULSE_DOT_RADIUS * 2}
                                            y2={FLAT_LINE_Y}
                                            stroke={color}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}

                                {/* Crosshairs (only when we have data to scrub) */}
                                {!hasNoPriceHistory && isScrubbing && currentPrice && (
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

                            {/* End dot: ping ring (expands + fades) then solid dot on top */}
                            <Animated.View
                                style={[
                                    styles.pulseDot,
                                    {
                                        left: CHART_WIDTH - PULSE_DOT_RIGHT_MARGIN - PULSE_DOT_RADIUS * 2,
                                        top: pulseDotY,
                                        width: PULSE_DOT_RADIUS * 2,
                                        height: PULSE_DOT_RADIUS * 2,
                                        borderRadius: PULSE_DOT_RADIUS,
                                        backgroundColor: color,
                                    },
                                    pingDotStyle,
                                ]}
                            />
                            <View
                                style={[
                                    styles.pulseDot,
                                    {
                                        left: CHART_WIDTH - PULSE_DOT_RIGHT_MARGIN - PULSE_DOT_RADIUS * 2,
                                        top: pulseDotY,
                                        width: PULSE_DOT_RADIUS * 2,
                                        height: PULSE_DOT_RADIUS * 2,
                                        borderRadius: PULSE_DOT_RADIUS,
                                        backgroundColor: color,
                                    },
                                ]}
                            />

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
                                                        ? '#242428'
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
                                                                ? Color.gray500
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

                            {/* Animated mask that reveals the chart from left to right (hidden when no history) */}
                            {!hasNoPriceHistory && (
                                <Animated.View
                                    style={[
                                        styles.chartMask,
                                        { backgroundColor: backgroundColor || Colors[isDark ? 'dark' : 'light'].background },
                                        animatedClipStyle
                                    ]}
                                />
                            )}
                        </Animated.View>
                    </PanGestureHandler>
                </GestureHandlerRootView>
            </View>

            {/* Time Period Selector - hidden when using external data (e.g. portfolio chart) */}
            {!hideTimePeriodSelector && (
                <View style={styles.timePeriodContainer}>
                    {['1H', '1D', '1M', '1Y', '5Y', 'ALL'].map((period) => {
                        const isActive = timePeriod === period;
                        return (
                            <TouchableOpacity
                                key={period}
                                style={[
                                    styles.timePeriodButton,
                                    isActive && styles.activeTimePeriod,
                                    isActive && { backgroundColor: color }
                                ]}
                                onPress={() => setTimePeriod(period as TimePeriod)}
                            >
                                <Text style={[
                                    styles.timePeriodText,
                                    isActive && styles.activeTimePeriodText,
                                    isActive && { color: backgroundColor || '#FFFFFF' },
                                    !isActive && { color: isDark ? Color.gray500 : '#666' }
                                ]}>
                                    {period}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
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
    pulseDot: {
        position: 'absolute',
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
        // backgroundColor will be set dynamically based on chart color
    },
    timePeriodText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTimePeriodText: {
        fontWeight: '600',
        // color will be set dynamically
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