import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
    buildTimeAxisPriceSeries,
    expandPriceHistoryStepHold,
    getChartTimeAxisDomain,
    priceHistoryWithSteadyFallback,
} from '@/lib/price-history-period';
import { PriceHistory, TimePeriod } from '@/types';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
/** Plot height for price→Y mapping, line, and scrubber. */
const CHART_HEIGHT = 200;
/** Extra SVG height below the plot so the area fill can fade to fully transparent before the time-range row. */
const CHART_FILL_BLEED = 56;
const CHART_SVG_HEIGHT = CHART_HEIGHT + CHART_FILL_BLEED;
const FLAT_LINE_Y = CHART_HEIGHT / 2;
const PULSE_DOT_RADIUS = 5;
const PULSE_DOT_RIGHT_MARGIN = 12;
/** Line ends here; pulse dot is centered so it sits on the stroke. */
const PULSE_DOT_CENTER_X = CHART_WIDTH - PULSE_DOT_RIGHT_MARGIN - PULSE_DOT_RADIUS;

const MIN_PRICE_SPREAD = 1e-9;

/** Y scale shared by path, scrubber, and end dot (handles flat price = horizontal line). */
function priceToYMapper(data: PriceHistory[]): (price: number) => number {
    const minPrice = Math.min(...data.map((d) => d.price));
    const maxPrice = Math.max(...data.map((d) => d.price));
    const spread = maxPrice - minPrice;
    if (spread < MIN_PRICE_SPREAD) {
        return () => FLAT_LINE_Y;
    }
    const padding = spread * 0.1;
    const denom = spread + padding * 2;
    return (price: number) =>
        CHART_HEIGHT - ((price - minPrice + padding) / denom) * CHART_HEIGHT;
}

/** X from 0 .. PULSE_DOT_CENTER_X so the last sample aligns with the pulse dot. */
function pixelPointsForData(data: PriceHistory[]): { x: number; y: number }[] {
    const n = data.length;
    if (n < 2) return [];
    const priceToY = priceToYMapper(data);
    const stepX = PULSE_DOT_CENTER_X / (n - 1);
    return data.map((point, index) => ({
        x: index * stepX,
        y: priceToY(point.price),
    }));
}

/** X from actual time in [minT, maxT] so flat stretches (e.g. portfolio) match the calendar. */
function pixelPointsForTimeScaledData(
    data: PriceHistory[],
    minT: number,
    maxT: number
): { x: number; y: number }[] {
    const n = data.length;
    if (n < 2) return [];
    const priceToY = priceToYMapper(data);
    const span = Math.max(maxT - minT, 1);
    const sorted = [...data].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    return sorted.map((point) => {
        const t = +new Date(point.timestamp);
        const x = ((t - minT) / span) * PULSE_DOT_CENTER_X;
        return { x, y: priceToY(point.price) };
    });
}

/** Last sample at or before `t` (hold flat until next event). `nowClampMs` caps scrub time so the future part of the axis does not show fake dates. */
function getPriceAtXTimeScaledStepHold(
    x: number,
    logicalSeries: PriceHistory[],
    minT: number,
    maxT: number,
    nowClampMs: number
): { price: number; date: Date; index: number } | null {
    if (logicalSeries.length < 2) return null;
    const span = Math.max(maxT - minT, 1);
    const plotX = Math.min(Math.max(0, x), PULSE_DOT_CENTER_X);
    const t = Math.min(minT + (plotX / PULSE_DOT_CENTER_X) * span, nowClampMs);
    const sorted = [...logicalSeries].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    let best = sorted[0];
    let idx = 0;
    for (let i = 0; i < sorted.length; i++) {
        if (+new Date(sorted[i].timestamp) <= t) {
            best = sorted[i];
            idx = i;
        } else {
            break;
        }
    }
    return { price: best.price, date: new Date(t), index: idx };
}

function yOnChartLineStepHold(
    plotX: number,
    logicalSeries: PriceHistory[],
    minT: number,
    maxT: number,
    yScaleData: PriceHistory[],
    nowClampMs: number
): number {
    const hit = getPriceAtXTimeScaledStepHold(plotX, logicalSeries, minT, maxT, nowClampMs);
    if (!hit) return FLAT_LINE_Y;
    const priceToY = priceToYMapper(yScaleData);
    return priceToY(hit.price);
}

type PixelPoint = { x: number; y: number };

/** Control points for one SVG cubic segment — must stay in sync with path drawing. */
function getBezierControlsForSegment(
    i: number,
    points: PixelPoint[],
    smoothnessValue: number
): { p0: PixelPoint; cp1: PixelPoint; cp2: PixelPoint; p1: PixelPoint } {
    const tension = 0.5;
    const current = points[i];
    const next = points[i + 1];
    let cp1x: number;
    let cp1y: number;
    let cp2x: number;
    let cp2y: number;

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

    return {
        p0: current,
        cp1: { x: cp1x, y: cp1y },
        cp2: { x: cp2x, y: cp2y },
        p1: next,
    };
}

function cubicBezierPoint(
    t: number,
    p0: PixelPoint,
    c1: PixelPoint,
    c2: PixelPoint,
    p1: PixelPoint
): PixelPoint {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    return {
        x: mt3 * p0.x + 3 * mt2 * t * c1.x + 3 * mt * t2 * c2.x + t3 * p1.x,
        y: mt3 * p0.y + 3 * mt2 * t * c1.y + 3 * mt * t2 * c2.y + t3 * p1.y,
    };
}

/**
 * Y on the drawn line at plot X (same curve + smoothness as the Path).
 * Finds t on the cubic segment so Bx(t) ≈ plotX; avoids snapping dot Y to discrete samples.
 */
function yOnChartLineAtX(plotX: number, points: PixelPoint[], smoothnessValue: number): number {
    const n = points.length;
    if (n < 2) return FLAT_LINE_Y;
    const xClamped = Math.min(Math.max(plotX, points[0].x), points[n - 1].x);

    let seg = 0;
    for (let i = 0; i < n - 1; i++) {
        if (xClamped <= points[i + 1].x) {
            seg = i;
            break;
        }
    }
    seg = Math.max(0, Math.min(seg, n - 2));

    const { p0, cp1, cp2, p1 } = getBezierControlsForSegment(seg, points, smoothnessValue);
    const bx = (t: number) => cubicBezierPoint(t, p0, cp1, cp2, p1).x;
    const by = (t: number) => cubicBezierPoint(t, p0, cp1, cp2, p1).y;
    const x0 = bx(0);
    const x1 = bx(1);
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    if (xClamped <= minX) return by(x0 <= x1 ? 0 : 1);
    if (xClamped >= maxX) return by(x0 <= x1 ? 1 : 0);

    const increasing = x1 >= x0;
    let lo = 0;
    let hi = 1;
    for (let iter = 0; iter < 40; iter++) {
        const mid = (lo + hi) / 2;
        const xm = bx(mid);
        if (increasing) {
            if (xm < xClamped) lo = mid;
            else hi = mid;
        } else {
            if (xm > xClamped) lo = mid;
            else hi = mid;
        }
    }
    return by((lo + hi) / 2);
}

function createInterpolatedPathFromPoints(points: PixelPoint[], smoothnessValue: number): string {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const { cp1, cp2, p1 } = getBezierControlsForSegment(i, points, smoothnessValue);
        path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p1.x} ${p1.y}`;
    }

    return path;
}

function createInterpolatedAreaPathFromPoints(points: PixelPoint[], smoothnessValue: number): string {
    if (points.length < 2) return '';

    const bottomY = CHART_SVG_HEIGHT;
    let path = `M ${points[0].x} ${bottomY} L ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const { cp1, cp2, p1 } = getBezierControlsForSegment(i, points, smoothnessValue);
        path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p1.x} ${p1.y}`;
    }

    const lastX = points[points.length - 1].x;
    path += ` L ${lastX} ${bottomY} Z`;

    return path;
}

function polylinePathD(points: PixelPoint[]): string {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
}

function createPolylineAreaPath(points: PixelPoint[], bottomY: number): string {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${bottomY} L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${bottomY} Z`;
    return d;
}

interface ChartProps {
    stockId: number | string;
    color?: string;
    backgroundColor?: string;
    /** When provided, chart uses this data instead of generating. Used for API-sourced data (e.g. portfolio summary). */
    priceData?: PriceHistory[] | null;
    /**
     * While the first fetch is in flight and `priceData` is still empty, skip the flat placeholder line and dots
     * so the chart does not draw then swap when points arrive.
     */
    isInitialLoadPending?: boolean;
    /** Hide the time period selector when using external priceData (e.g. single period from API). */
    hideTimePeriodSelector?: boolean;
    /** Initial range for the period selector (default 1H). Use ALL when parent fetched full-range history. */
    defaultTimePeriod?: TimePeriod;
    /** When both are set, period is controlled by the parent (e.g. portfolio summary stats). */
    timePeriod?: TimePeriod;
    onTimePeriodChange?: (period: TimePeriod) => void;
    /**
     * Map x by timestamp so the line reflects real elapsed time (flat tail to “now”).
     * Use with `livePrice` for portfolio so the right edge matches the header total.
     */
    timeScaledX?: boolean;
    livePrice?: number | null;
}

const Chart: React.FC<ChartProps> = ({
    stockId,
    color = useColors()?.green,
    backgroundColor = null,
    priceData: externalPriceData = null,
    isInitialLoadPending = false,
    hideTimePeriodSelector = false,
    defaultTimePeriod,
    timePeriod: controlledTimePeriod,
    onTimePeriodChange,
    timeScaledX = false,
    livePrice = null,
}) => {
    const Color = useColors();
    const [internalTimePeriod, setInternalTimePeriod] = useState<TimePeriod>(() => defaultTimePeriod ?? '1H');
    const isPeriodControlled =
        controlledTimePeriod !== undefined && onTimePeriodChange !== undefined;
    const timePeriod = isPeriodControlled ? controlledTimePeriod! : internalTimePeriod;

    const setTimePeriod = (p: TimePeriod) => {
        if (isPeriodControlled) onTimePeriodChange!(p);
        else setInternalTimePeriod(p);
    };

    // One `now` for time-scaled series + domain so x mapping matches the synthetic end point.
    const { priceData, timeAxisDomain } = useMemo(() => {
        if (externalPriceData == null || externalPriceData.length === 0) {
            return { priceData: [] as PriceHistory[], timeAxisDomain: null as { minT: number; maxT: number } | null };
        }
        if (timeScaledX) {
            const nowMs = Date.now();
            const pd = buildTimeAxisPriceSeries(externalPriceData, timePeriod, livePrice, nowMs);
            const dom = pd.length >= 2 ? getChartTimeAxisDomain(timePeriod, pd, nowMs) : null;
            return { priceData: pd, timeAxisDomain: dom };
        }
        return {
            priceData: priceHistoryWithSteadyFallback(externalPriceData, timePeriod),
            timeAxisDomain: null,
        };
    }, [externalPriceData, timePeriod, timeScaledX, livePrice]);

    const linePixelPoints = useMemo(() => {
        if (priceData.length < 2) return [];
        if (timeScaledX && timeAxisDomain) {
            const expanded = expandPriceHistoryStepHold(priceData);
            if (expanded.length < 2) return [];
            return pixelPointsForTimeScaledData(expanded, timeAxisDomain.minT, timeAxisDomain.maxT);
        }
        return pixelPointsForData(priceData);
    }, [priceData, timeScaledX, timeAxisDomain]);

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

    // Price / time along X: linear interp between samples (dot Y comes from the drawn curve, not this).
    const getPriceAtX = (x: number) => {
        if (priceData.length < 2) return null;
        if (timeScaledX && timeAxisDomain) {
            return getPriceAtXTimeScaledStepHold(
                x,
                priceData,
                timeAxisDomain.minT,
                timeAxisDomain.maxT,
                Date.now()
            );
        }

        const stepX = PULSE_DOT_CENTER_X / (priceData.length - 1);
        const plotX = Math.min(Math.max(0, x), PULSE_DOT_CENTER_X);
        const floatIndex = plotX / stepX;
        const i0 = Math.min(Math.floor(floatIndex), priceData.length - 1);
        const i1 = Math.min(i0 + 1, priceData.length - 1);
        const frac = floatIndex - i0;
        const p0 = priceData[i0];
        const p1 = priceData[i1];
        const t0 = p0.timestamp.getTime();
        const t1 = p1.timestamp.getTime();
        return {
            price: p0.price + (p1.price - p0.price) * frac,
            date: new Date(t0 + (t1 - t0) * frac),
            index: i0,
        };
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
        // Reveal wipe only when there is a real series; avoids restarting when empty→empty while waiting on API.
        if (priceData.length >= 2) {
            animationProgress.value = 0;
            animationProgress.value = withTiming(1, { duration: 2500 });
        } else {
            animationProgress.value = 1;
        }

        smoothness.value = 1;
        setSmoothnessState(1);
    }, [timePeriod, stockId, priceData]);

    const hasNoPriceHistory = priceData.length < 2;
    const awaitingFirstApiPoints =
        Boolean(isInitialLoadPending) &&
        (externalPriceData == null || externalPriceData.length === 0);
    const showFlatPlaceholder = hasNoPriceHistory && !awaitingFirstApiPoints;
    const showEndDots = !awaitingFirstApiPoints && (showFlatPlaceholder || !hasNoPriceHistory);

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

    const endPixel =
        linePixelPoints.length > 0 ? linePixelPoints[linePixelPoints.length - 1] : null;
    const pathSmoothness = timeScaledX ? 0 : smoothnessState;
    const useStepPolyline = timeScaledX && linePixelPoints.length >= 2;
    const pulseDotCenterX =
        timeScaledX && endPixel ? endPixel.x : PULSE_DOT_CENTER_X;
    const pulseDotLeft = pulseDotCenterX - PULSE_DOT_RADIUS;
    const pulseDotY = endPixel
        ? endPixel.y - PULSE_DOT_RADIUS
        : FLAT_LINE_Y - PULSE_DOT_RADIUS;

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
                            <Svg width={CHART_WIDTH} height={CHART_SVG_HEIGHT}>
                                <Defs>
                                    <LinearGradient
                                        id="gradient"
                                        x1={0}
                                        y1={0}
                                        x2={0}
                                        y2={CHART_SVG_HEIGHT}
                                        gradientUnits="userSpaceOnUse"
                                    >
                                        <Stop offset="0%" stopColor={color} stopOpacity={0.32} />
                                        <Stop offset="42%" stopColor={color} stopOpacity={0.14} />
                                        <Stop offset="72%" stopColor={color} stopOpacity={0.04} />
                                        <Stop offset="100%" stopColor={color} stopOpacity={0} />
                                    </LinearGradient>
                                    <ClipPath id="chartClip">
                                        <Rect
                                            x="0"
                                            y="0"
                                            width={CHART_WIDTH}
                                            height={CHART_SVG_HEIGHT}
                                        />
                                    </ClipPath>
                                </Defs>

                                {showFlatPlaceholder ? (
                                    <>
                                        {/* Flat line when no price history (Robinhood-style) */}
                                        <Line
                                            x1={0}
                                            y1={FLAT_LINE_Y}
                                            x2={PULSE_DOT_CENTER_X}
                                            y2={FLAT_LINE_Y}
                                            stroke={color}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </>
                                ) : (
                                    <>
                                        {/* Period open: faint baseline at first sample price (same Y scale as the line) */}
                                        {linePixelPoints.length >= 2 && (
                                            <Line
                                                x1={0}
                                                y1={linePixelPoints[0].y}
                                                x2={PULSE_DOT_CENTER_X}
                                                y2={linePixelPoints[0].y}
                                                stroke={isDark ? '#ffffff' : '#000000'}
                                                strokeOpacity={0.14}
                                                strokeWidth={1}
                                                strokeDasharray="5 5"
                                            />
                                        )}
                                        {/* Area under the line */}
                                        <Path
                                            d={
                                                useStepPolyline
                                                    ? createPolylineAreaPath(linePixelPoints, CHART_SVG_HEIGHT)
                                                    : createInterpolatedAreaPathFromPoints(linePixelPoints, pathSmoothness)
                                            }
                                            fill="url(#gradient)"
                                        />

                                        {/* Line */}
                                        <Path
                                            d={
                                                useStepPolyline
                                                    ? polylinePathD(linePixelPoints)
                                                    : createInterpolatedPathFromPoints(linePixelPoints, pathSmoothness)
                                            }
                                            stroke={color}
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap={useStepPolyline ? 'butt' : 'round'}
                                            strokeLinejoin={useStepPolyline ? 'miter' : 'round'}
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
                                            y2={CHART_SVG_HEIGHT}
                                            stroke={color}
                                            strokeWidth={1}
                                            strokeOpacity={0.6}
                                        />
                                        {/* Price point indicator */}
                                        {currentPrice && (
                                            <Circle
                                                cx={crosshairX.value}
                                                cy={
                                                    useStepPolyline && timeAxisDomain
                                                        ? yOnChartLineStepHold(
                                                              crosshairX.value,
                                                              priceData,
                                                              timeAxisDomain.minT,
                                                              timeAxisDomain.maxT,
                                                              priceData,
                                                              Date.now()
                                                          )
                                                        : yOnChartLineAtX(
                                                              crosshairX.value,
                                                              linePixelPoints,
                                                              pathSmoothness
                                                          )
                                                }
                                                r={4}
                                                fill={color}
                                                stroke={backgroundColor || '#FFFFFF'}
                                                strokeWidth={2}
                                            />
                                        )}
                                    </>
                                )}
                            </Svg>

                            {/* End dot: ping ring (expands + fades) then solid dot on top — hidden until first data or confirmed empty */}
                            {showEndDots && (
                                <>
                                    <Animated.View
                                        style={[
                                            styles.pulseDot,
                                            {
                                                left: pulseDotLeft,
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
                                                left: pulseDotLeft,
                                                top: pulseDotY,
                                                width: PULSE_DOT_RADIUS * 2,
                                                height: PULSE_DOT_RADIUS * 2,
                                                borderRadius: PULSE_DOT_RADIUS,
                                                backgroundColor: color,
                                            },
                                        ]}
                                    />
                                </>
                            )}

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
        marginBottom: 10,
        width: '100%',
    },
    chart: {
        width: CHART_WIDTH,
        height: CHART_SVG_HEIGHT,
        position: 'relative',
    },
    chartMask: {
        position: 'absolute',
        top: 0,
        right: 0,
        height: CHART_SVG_HEIGHT,
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