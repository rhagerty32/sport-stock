import React, { useEffect, useId, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const CHART_HEIGHT = 200;
const V_PAD_TOP = 14;
const V_PAD_BOTTOM = 18;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type ChartLoadingSkeletonProps = {
    isDark: boolean;
};

function buildAreaPath(chartW: number, chartH: number): { lineD: string; areaD: string } {
    const innerW = Math.max(24, chartW);
    const innerH = chartH - V_PAD_TOP - V_PAD_BOTTOM;
    const baseY = chartH - V_PAD_BOTTOM;
    const left = 0;
    const n = 36;
    const ys: number[] = [];
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const wave =
            0.5 +
            0.2 * Math.sin(t * Math.PI * 1.4) +
            0.07 * Math.sin(t * Math.PI * 3.3 + 0.5) +
            0.035 * Math.sin(t * Math.PI * 5.5);
        ys.push(Math.min(0.9, Math.max(0.2, wave)));
    }
    const xAt = (i: number) => (innerW * i) / (n - 1);
    const yAt = (i: number) => baseY - ys[i] * innerH;

    let lineD = `M ${xAt(0).toFixed(1)} ${yAt(0).toFixed(1)}`;
    for (let i = 1; i < n; i++) {
        lineD += ` L ${xAt(i).toFixed(1)} ${yAt(i).toFixed(1)}`;
    }

    const areaD = `${lineD} L ${innerW.toFixed(1)} ${baseY.toFixed(1)} L ${left.toFixed(1)} ${baseY.toFixed(1)} Z`;

    return { lineD, areaD };
}

export function ChartLoadingSkeleton({ isDark }: ChartLoadingSkeletonProps) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
    const clipId = `chartSkClip-${uid}`;
    const gradFillId = `chartSkFill-${uid}`;
    const gradShineId = `chartSkShine-${uid}`;

    const [layoutW, setLayoutW] = useState(0);
    const widthSv = useSharedValue(0);
    const sweep = useSharedValue(0);

    const onLayout = (e: LayoutChangeEvent) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0 && w !== layoutW) {
            setLayoutW(w);
            widthSv.value = w;
        }
    };

    useEffect(() => {
        sweep.value = 0;
        sweep.value = withRepeat(
            withTiming(1, { duration: 2200, easing: Easing.linear }),
            -1,
            false
        );
    }, [sweep]);

    const { lineD, areaD } = useMemo(
        () => (layoutW > 0 ? buildAreaPath(layoutW, CHART_HEIGHT) : { lineD: '', areaD: '' }),
        [layoutW]
    );

    const colors = isDark
        ? { fill: '#3D4149', stroke: '#4A4F59', shineHi: 'rgba(255,255,255,0.14)', shineMid: 'rgba(255,255,255,0.22)' }
        : { fill: '#D9DDE5', stroke: '#C5CAD6', shineHi: 'rgba(255,255,255,0.65)', shineMid: 'rgba(255,255,255,0.95)' };

    const animatedShineProps = useAnimatedProps(() => {
        const cw = widthSv.value;
        if (cw < 8) {
            return { x: -100, width: 40, opacity: 0 };
        }
        const band = cw * 0.52;
        const travel = cw + band * 1.15;
        const x = -band + sweep.value * travel;
        return { x, width: band, opacity: 1 };
    });

    return (
        <View style={styles.wrap} onLayout={onLayout}>
            {layoutW > 0 && lineD ? (
                <Svg width={layoutW} height={CHART_HEIGHT}>
                    <Defs>
                        <LinearGradient id={gradFillId} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={colors.fill} stopOpacity={1} />
                            <Stop offset="100%" stopColor={colors.fill} stopOpacity={0.35} />
                        </LinearGradient>
                        <LinearGradient id={gradShineId} x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0%" stopColor={colors.shineHi} stopOpacity={0} />
                            <Stop offset="35%" stopColor={colors.shineMid} stopOpacity={0.55} />
                            <Stop offset="50%" stopColor={colors.shineMid} stopOpacity={0.75} />
                            <Stop offset="65%" stopColor={colors.shineMid} stopOpacity={0.55} />
                            <Stop offset="100%" stopColor={colors.shineHi} stopOpacity={0} />
                        </LinearGradient>
                        <ClipPath id={clipId}>
                            <Path d={areaD} />
                        </ClipPath>
                    </Defs>
                    <Path d={areaD} fill={`url(#${gradFillId})`} />
                    <Path
                        d={lineD}
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.95}
                    />
                    <G clipPath={`url(#${clipId})`}>
                        <AnimatedRect
                            animatedProps={animatedShineProps}
                            y={0}
                            height={CHART_HEIGHT}
                            fill={`url(#${gradShineId})`}
                        />
                    </G>
                </Svg>
            ) : (
                <View style={[styles.measureFallback, { height: CHART_HEIGHT }]} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        width: '100%',
        minHeight: CHART_HEIGHT,
    },
    measureFallback: {
        width: '100%',
    },
});
