import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import {
    headlineKindLabel,
    type HeadlineSubjectKind,
    type SportsHeadline,
} from '@/lib/headlines-api';
import { Ionicons } from '@expo/vector-icons';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const CARD_WIDTH = 248;
const CARD_GAP = 12;
const SCROLL_PADDING_LEFT = 20;
const CARD_PADDING = 12;
const HEADLINE_FONT_SIZE = 13;
const HEADLINE_LINE_HEIGHT = 18;
const HEADLINE_LINES = 3;
/** Header row (avatar + subject/meta) + spacing below */
const CARD_HEADER_HEIGHT = 44;
const HEADLINE_BLOCK_HEIGHT = HEADLINE_LINES * HEADLINE_LINE_HEIGHT;
const CARD_HEIGHT = CARD_PADDING * 2 + CARD_HEADER_HEIGHT + HEADLINE_BLOCK_HEIGHT;
const BANNER_HEIGHT = CARD_HEIGHT;
const CARD_CONTENT_WIDTH = CARD_WIDTH - CARD_PADDING * 2;

interface SportsHeadlinesBannerProps {
    headlines: SportsHeadline[];
    loading?: boolean;
}

type KindVisual = {
    accent: string;
    tagBg: string;
    tagText: string;
    icon: keyof typeof Ionicons.glyphMap;
};

function subjectInitials(subject: string, kind: HeadlineSubjectKind): string {
    const words = subject.trim().split(/\s+/).filter(Boolean);
    if (kind === 'player' && words.length >= 2) {
        return `${words[0][0] ?? ''}${words[words.length - 1][0] ?? ''}`.toUpperCase();
    }
    if (words.length >= 2) return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
    return (subject.slice(0, 2) || 'SP').toUpperCase();
}

function kindVisual(kind: HeadlineSubjectKind, Color: ReturnType<typeof useColors>): KindVisual {
    switch (kind) {
        case 'team':
            return {
                accent: Color.green,
                tagBg: 'rgba(0, 200, 83, 0.14)',
                tagText: Color.green,
                icon: 'shield-outline',
            };
        case 'player':
            return {
                accent: Color.purple,
                tagBg: 'rgba(128, 0, 128, 0.14)',
                tagText: Color.purple,
                icon: 'person-outline',
            };
        default:
            return {
                accent: Color.blue,
                tagBg: 'rgba(59, 130, 246, 0.14)',
                tagText: Color.blue,
                icon: 'trophy-outline',
            };
    }
}

async function openHeadlineArticle(url: string) {
    await openBrowserAsync(url, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
}

function HeadlineCard({ item, Color }: { item: SportsHeadline; Color: ReturnType<typeof useColors> }) {
    const visual = kindVisual(item.kind, Color);
    const initials = subjectInitials(item.subject, item.kind);

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${headlineKindLabel(item.kind)}: ${item.subject}. ${item.title}`}
            onPress={() => openHeadlineArticle(item.url)}
            style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
        >
            <GlassCard style={styles.card} padding={CARD_PADDING} standard={true}>
                <View style={styles.cardInner}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.avatar, { backgroundColor: visual.accent }]}>
                            <Text style={styles.avatarText}>{initials}</Text>
                            <View style={[styles.avatarBadge, { backgroundColor: visual.tagText }]}>
                                <Ionicons name={visual.icon} size={9} color={Color.white} />
                            </View>
                        </View>
                        <View style={styles.headerCopy}>
                            <Text
                                style={[styles.subject, { color: Color.baseText }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.subject}
                            </Text>
                            <View style={styles.metaRow}>
                                <View style={[styles.kindTag, { backgroundColor: visual.tagBg }]}>
                                    <Text style={[styles.kindTagText, { color: visual.tagText }]}>
                                        {headlineKindLabel(item.kind).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[styles.timeAgo, { color: Color.subText }]}>
                                    {item.publishedHoursAgo}H AGO
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.headlineBody}>
                        <Text
                            style={[styles.headline, { color: Color.baseText }]}
                            numberOfLines={HEADLINE_LINES}
                            ellipsizeMode="tail"
                        >
                            {item.title}
                        </Text>
                    </View>
                </View>
            </GlassCard>
        </Pressable>
    );
}

export function SportsHeadlinesBanner({ headlines, loading = false }: SportsHeadlinesBannerProps) {
    const Color = useColors();
    const translateX = useSharedValue(0);
    const gestureStartX = useSharedValue(0);
    const isMountedRef = useRef(true);
    const halfWidthRef = useRef(0);
    const animationRef = useRef<(() => void) | null>(null);

    const { duplicated } = useMemo(() => {
        const list = headlines.length > 0 ? headlines : [];
        return { duplicated: [...list, ...list] };
    }, [headlines]);

    const startAnimation = useCallback(() => {
        if (!isMountedRef.current) return;
        const halfWidth = halfWidthRef.current;
        if (halfWidth <= 0) return;
        const scrollSpeed = 0.4;
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
        const halfWidth =
            SCROLL_PADDING_LEFT + n * (CARD_WIDTH + CARD_GAP) - (n > 0 ? CARD_GAP : 0);
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
                    const current = translateX.value;
                    runOnJS(restartAnimationFrom)(current);
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
        if (!loading && headlines.length > 0) {
            fadeOpacity.value = withTiming(1, { duration: 300 });
        }
    }, [loading, headlines.length]);

    if (loading) {
        return (
            <View style={styles.container} pointerEvents="none">
                <View style={styles.scrollContainer}>
                    <View style={[styles.row, { flexDirection: 'row' }]}>
                        {Array.from({ length: 2 }).map((_, index) => (
                            <View key={`sk-${index}`} style={styles.cardWrapper}>
                                <GlassCard style={styles.card} padding={CARD_PADDING} standard={true}>
                                    <View style={styles.skeletonHeader}>
                                        <View style={[styles.skeletonAvatar, { backgroundColor: Color.border }]} />
                                        <View style={styles.skeletonHeaderText}>
                                            <View style={[styles.skeletonLineWide, { backgroundColor: Color.border }]} />
                                            <View style={[styles.skeletonLineNarrow, { backgroundColor: Color.border }]} />
                                        </View>
                                    </View>
                                    <View style={[styles.skeletonLineBody, { backgroundColor: Color.border }]} />
                                    <View style={[styles.skeletonLineBody, { backgroundColor: Color.border, width: '80%' }]} />
                                </GlassCard>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    if (headlines.length === 0) {
        return null;
    }

    return (
        <Animated.View style={[styles.container, fadeStyle]} pointerEvents="box-none">
            <View style={styles.scrollContainer} pointerEvents="box-none">
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[styles.row, animatedStyle, { flexDirection: 'row' }]}
                        pointerEvents="box-none"
                    >
                        {duplicated.map((item, index) => (
                            <View key={`${item.kind}-${item.subject}-${item.title}-${index}`} style={styles.cardWrapper}>
                                <HeadlineCard item={item} Color={Color} />
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
    cardPressable: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    cardPressed: {
        opacity: 0.88,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        overflow: 'hidden',
    },
    cardInner: {
        width: CARD_CONTENT_WIDTH,
        height: CARD_HEADER_HEIGHT + HEADLINE_BLOCK_HEIGHT,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        height: CARD_HEADER_HEIGHT,
        marginBottom: 0,
        gap: 10,
    },
    headlineBody: {
        width: CARD_CONTENT_WIDTH,
        height: HEADLINE_BLOCK_HEIGHT,
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    avatarBadge: {
        position: 'absolute',
        right: -2,
        bottom: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    headerCopy: {
        flex: 1,
        minWidth: 0,
    },
    subject: {
        fontSize: 14,
        fontWeight: '700',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    kindTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    kindTagText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    timeAgo: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    headline: {
        width: CARD_CONTENT_WIDTH,
        fontSize: HEADLINE_FONT_SIZE,
        fontWeight: '500',
        lineHeight: HEADLINE_LINE_HEIGHT,
    },
    skeletonHeader: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    skeletonAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        opacity: 0.45,
    },
    skeletonHeaderText: {
        flex: 1,
        gap: 6,
        justifyContent: 'center',
    },
    skeletonLineWide: {
        height: 12,
        borderRadius: 6,
        width: '70%',
        opacity: 0.45,
    },
    skeletonLineNarrow: {
        height: 10,
        borderRadius: 5,
        width: '45%',
        opacity: 0.45,
    },
    skeletonLineBody: {
        height: 12,
        borderRadius: 6,
        width: '100%',
        opacity: 0.45,
        marginBottom: 6,
    },
});
