import { Ticker } from '@/components/Ticker';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import type { GameTickerItem, GameTickerTeam } from '@/lib/games-ticker-api';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const CARD_WIDTH = 132;
const CARD_GAP = 12;
const SCROLL_PADDING_LEFT = 20;
const CARD_PADDING = 10;
const HEADER_HEIGHT = 18;
const ROW_HEIGHT = 28;
const CARD_HEIGHT = CARD_PADDING * 2 + HEADER_HEIGHT + ROW_HEIGHT * 2;
const BANNER_HEIGHT = CARD_HEIGHT;

interface GamesTickerBannerProps {
    games: GameTickerItem[];
    loading?: boolean;
}

function TeamRow({
    team,
    isWinner,
    isLoser,
    showScore,
    showRecord,
    Color,
}: {
    team: GameTickerTeam;
    isWinner: boolean;
    isLoser: boolean;
    showScore: boolean;
    showRecord: boolean;
    Color: ReturnType<typeof useColors>;
}) {
    const scoreColor = isLoser ? Color.subText : Color.baseText;
    const scoreWeight = isWinner ? '700' : '400';

    return (
        <View style={styles.teamRow}>
            <View style={styles.teamLeft}>
                {team.logoUrl ? (
                    <Image source={{ uri: team.logoUrl }} style={styles.teamLogo} contentFit="contain" />
                ) : (
                    <Ticker ticker={team.abbr} color={team.brandColor} size="small" />
                )}
                {team.rank != null ? (
                    <Text style={[styles.rank, { color: Color.subText }]}>{team.rank}</Text>
                ) : null}
            </View>
            {showScore && team.score != null ? (
                <Text style={[styles.score, { color: scoreColor, fontWeight: scoreWeight }]}>{team.score}</Text>
            ) : null}
            {showRecord && team.record ? (
                <Text style={[styles.record, { color: Color.subText }]}>{team.record}</Text>
            ) : null}
        </View>
    );
}

function GameCard({
    item,
    Color,
    cardBg,
    cardBorder,
}: {
    item: GameTickerItem;
    Color: ReturnType<typeof useColors>;
    cardBg: string;
    cardBorder: string;
}) {
    if (item.status === 'final') {
        const awayWins = (item.away.score ?? 0) > (item.home.score ?? 0);
        const homeWins = (item.home.score ?? 0) > (item.away.score ?? 0);
        const tie = !awayWins && !homeWins;

        return (
            <View
                style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
                accessibilityLabel={`Final: ${item.away.abbr} ${item.away.score} vs ${item.home.abbr} ${item.home.score}`}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerSpacer} />
                    <Text style={[styles.finalLabel, { color: Color.baseText }]}>Final</Text>
                </View>
                <TeamRow
                    team={item.away}
                    isWinner={awayWins || tie}
                    isLoser={homeWins}
                    showScore
                    showRecord={false}
                    Color={Color}
                />
                <TeamRow
                    team={item.home}
                    isWinner={homeWins || tie}
                    isLoser={awayWins}
                    showScore
                    showRecord={false}
                    Color={Color}
                />
            </View>
        );
    }

    return (
        <View
            style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
            accessibilityLabel={`Upcoming ${item.dateLabel} ${item.timeLabel}: ${item.away.abbr} vs ${item.home.abbr}`}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.dateLabel, { color: Color.subText }]}>{item.dateLabel}</Text>
                <Text style={[styles.timeLabel, { color: Color.subText }]}>{item.timeLabel}</Text>
            </View>
            <TeamRow team={item.away} isWinner={false} isLoser={false} showScore={false} showRecord Color={Color} />
            <TeamRow team={item.home} isWinner={false} isLoser={false} showScore={false} showRecord Color={Color} />
        </View>
    );
}

export function GamesTickerBanner({ games, loading = false }: GamesTickerBannerProps) {
    const Color = useColors();
    const { isDark } = useTheme();
    const cardBg = isDark ? '#1A1D21' : '#FFFFFF';
    const cardBorder = isDark ? '#2A2D31' : '#E5E7EB';

    const translateX = useSharedValue(0);
    const gestureStartX = useSharedValue(0);
    const isMountedRef = useRef(true);
    const halfWidthRef = useRef(0);
    const animationRef = useRef<(() => void) | null>(null);

    const duplicated = useMemo(() => {
        const list = games.length > 0 ? games : [];
        return [...list, ...list];
    }, [games]);

    const startAnimation = useCallback(() => {
        if (!isMountedRef.current) return;
        const halfWidth = halfWidthRef.current;
        if (halfWidth <= 0) return;
        const scrollSpeed = 0.4;
        const duration = (halfWidth / scrollSpeed) * 16;

        translateX.value = withTiming(
            -halfWidth,
            { duration, easing: Easing.linear },
            (finished) => {
                'worklet';
                if (finished && isMountedRef.current) {
                    translateX.value = 0;
                    if (animationRef.current) {
                        runOnJS(animationRef.current)();
                    }
                }
            }
        );
    }, []);

    const restartAnimationFrom = useCallback(
        (currentX: number) => {
            const halfWidth = halfWidthRef.current;
            if (halfWidth <= 0) return;
            let normalized = currentX;
            while (normalized > 0) normalized -= halfWidth;
            while (normalized < -halfWidth) normalized += halfWidth;
            translateX.value = normalized;
            startAnimation();
        },
        [startAnimation]
    );

    useEffect(() => {
        isMountedRef.current = true;
        animationRef.current = startAnimation;
        const n = duplicated.length / 2;
        const halfWidth = SCROLL_PADDING_LEFT + n * (CARD_WIDTH + CARD_GAP) - (n > 0 ? CARD_GAP : 0);
        halfWidthRef.current = halfWidth;

        translateX.value = 0;
        if (n > 0) startAnimation();

        return () => {
            isMountedRef.current = false;
            animationRef.current = null;
            cancelAnimation(translateX);
            translateX.value = 0;
        };
    }, [duplicated.length, startAnimation]);

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
                    runOnJS(restartAnimationFrom)(translateX.value);
                }),
        [restartAnimationFrom]
    );

    const fadeOpacity = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));
    const fadeStyle = useAnimatedStyle(() => ({
        opacity: fadeOpacity.value,
    }));

    useEffect(() => {
        if (!loading && games.length > 0) {
            fadeOpacity.value = withTiming(1, { duration: 300 });
        }
    }, [loading, games.length]);

    if (loading) {
        return (
            <View style={styles.container} pointerEvents="none">
                <View style={styles.scrollContainer}>
                    <View style={[styles.row, { flexDirection: 'row' }]}>
                        {Array.from({ length: 2 }).map((_, index) => (
                            <View key={`sk-${index}`} style={styles.cardWrapper}>
                                <View style={[styles.card, styles.skeletonCard, { borderColor: cardBorder }]}>
                                    <View style={[styles.skeletonLine, { backgroundColor: Color.lightGray, width: '40%' }]} />
                                    <View style={[styles.skeletonLine, { backgroundColor: Color.lightGray }]} />
                                    <View style={[styles.skeletonLine, { backgroundColor: Color.lightGray }]} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    if (games.length === 0) {
        return null;
    }

    return (
        <Animated.View style={[styles.container, fadeStyle]} pointerEvents="box-none">
            <View style={styles.scrollContainer} pointerEvents="box-none">
                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.row, animatedStyle, { flexDirection: 'row' }]} pointerEvents="box-none">
                        {duplicated.map((item, index) => (
                            <View key={`${item.id}-${index}`} style={styles.cardWrapper}>
                                <GameCard item={item} Color={Color} cardBg={cardBg} cardBorder={cardBorder} />
                            </View>
                        ))}
                    </Animated.View>
                </GestureDetector>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: -8,
        marginBottom: 12,
        height: BANNER_HEIGHT,
    },
    scrollContainer: {
        height: BANNER_HEIGHT,
        overflow: 'hidden',
    },
    row: {
        paddingLeft: SCROLL_PADDING_LEFT,
        height: BANNER_HEIGHT,
        alignItems: 'flex-start',
    },
    cardWrapper: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginRight: CARD_GAP,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 10,
        borderWidth: 1,
        padding: CARD_PADDING,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: HEADER_HEIGHT,
        marginBottom: 2,
    },
    headerSpacer: {
        flex: 1,
    },
    finalLabel: {
        fontSize: 11,
        fontWeight: '700',
    },
    dateLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    timeLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: ROW_HEIGHT,
        gap: 8,
    },
    teamLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 1,
    },
    teamLogo: {
        width: 28,
        height: 28,
    },
    rank: {
        fontSize: 12,
        fontWeight: '500',
    },
    score: {
        fontSize: 14,
        fontWeight: '600',
        flexShrink: 0,
        textAlign: 'right',
    },
    record: {
        fontSize: 12,
        fontWeight: '500',
        flexShrink: 0,
        textAlign: 'right',
    },
    skeletonCard: {
        backgroundColor: 'transparent',
        gap: 8,
    },
    skeletonLine: {
        height: 12,
        borderRadius: 6,
        opacity: 0.45,
    },
});
