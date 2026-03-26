import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const CARD_WIDTH = 150;
const CARD_HEIGHT = 210;
const CARD_GAP = 14;
const TRACK_PADDING_LEFT = 20;

export type PortfolioPreviewCard = {
    id: string;
    ticker: string;
    changePercent: number;
    backgroundColor: string;
    imageSource?: ImageSourcePropType;
    /** When set, opens StockBottomSheet for this id (via global store). */
    stockId?: number;
};

const defaultCards: PortfolioPreviewCard[] = [
    { id: 'kc', ticker: 'KC', changePercent: -67.69, backgroundColor: '#D70000' },
    { id: 'phi', ticker: 'PHI', changePercent: 69.67, backgroundColor: '#205A0A' },
    { id: 'bama', ticker: 'BAMA', changePercent: -23.40, backgroundColor: '#3D020A' },
    { id: 'jac', ticker: 'JAC', changePercent: -42.07, backgroundColor: '#2F8FCD' },
    { id: 'mia', ticker: 'MIA', changePercent: 32.18, backgroundColor: '#067A73' },
];

interface PortfolioPreviewMarqueeProps {
    cards?: PortfolioPreviewCard[];
    onCardPress?: (card: PortfolioPreviewCard) => void;
}

export function PortfolioPreviewMarquee({ cards = defaultCards, onCardPress }: PortfolioPreviewMarqueeProps) {
    const translateX = useSharedValue(0);
    const duplicatedCards = useMemo(() => [...cards, ...cards], [cards]);

    useEffect(() => {
        const itemCount = duplicatedCards.length / 2;
        const loopWidth = TRACK_PADDING_LEFT + itemCount * (CARD_WIDTH + CARD_GAP) - CARD_GAP;
        const pixelsPerSecond = 14;
        const duration = Math.round((loopWidth / pixelsPerSecond) * 1000);
        translateX.value = 0;
        if (loopWidth > 0) {
            translateX.value = withRepeat(
                withTiming(-loopWidth, {
                    duration,
                    easing: Easing.linear,
                }),
                -1,
                false
            );
        }

        return () => {
            cancelAnimation(translateX);
            translateX.value = 0;
        };
    }, [duplicatedCards.length]);

    const animatedTrackStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    if (cards.length === 0) {
        return (
            <View style={styles.viewport}>
                <View style={styles.track}>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <View
                            key={`portfolio-skeleton-${index}`}
                            style={[
                                styles.card,
                                index % 2 === 0 ? styles.cardOffsetHigh : styles.cardOffsetLow,
                                styles.skeletonCard,
                            ]}
                        >
                            <View style={styles.skeletonTicker} />
                            <View style={styles.imageWrap}>
                                <View style={styles.skeletonImage} />
                            </View>
                            <View style={styles.skeletonChange} />
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.viewport}>
            <Animated.View style={[styles.track, animatedTrackStyle]}>
                {duplicatedCards.map((card, index) => {
                    const isPositive = card.changePercent >= 0;
                    const iconName = isPositive ? 'arrow-up' : 'arrow-down';
                    const offsetStyle = index % 2 === 0 ? styles.cardOffsetHigh : styles.cardOffsetLow;

                    const cardInner = (
                        <>
                            <Text style={styles.ticker}>{card.ticker}</Text>
                            <View style={styles.imageWrap}>
                                {card.imageSource ? (
                                    <Image source={card.imageSource} contentFit="contain" style={styles.jerseyImage} />
                                ) : (
                                    <View style={styles.jerseyPlaceholder}>
                                        <Text style={styles.jerseyPlaceholderText}>{card.ticker}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.changeRow}>
                                <Ionicons name={iconName} size={18} color="#FFFFFF" />
                                <Text style={styles.changeText}>{Math.abs(card.changePercent).toFixed(2)}%</Text>
                            </View>
                        </>
                    );

                    return (
                        <TouchableOpacity
                            key={`${card.id}-${index}`}
                            activeOpacity={onCardPress ? 0.85 : 1}
                            disabled={!onCardPress}
                            onPress={onCardPress ? () => onCardPress(card) : undefined}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            style={[styles.card, offsetStyle, { backgroundColor: card.backgroundColor }]}
                        >
                            {cardInner}
                        </TouchableOpacity>
                    );
                })}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    viewport: {
        height: 242,
        overflow: 'hidden',
    },
    track: {
        flexDirection: 'row',
        paddingLeft: TRACK_PADDING_LEFT,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 28,
        marginRight: CARD_GAP,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 12,
    },
    cardOffsetHigh: {
        marginTop: 0,
    },
    cardOffsetLow: {
        marginTop: 32,
    },
    ticker: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    imageWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    jerseyImage: {
        width: 108,
        height: 108,
    },
    jerseyPlaceholder: {
        width: 108,
        height: 108,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    jerseyPlaceholderText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        opacity: 0.7,
    },
    changeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    changeText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    skeletonCard: {
        backgroundColor: '#E5E7EB',
    },
    skeletonTicker: {
        width: 58,
        height: 20,
        borderRadius: 8,
        backgroundColor: '#D1D5DB',
        opacity: 0.9,
    },
    skeletonImage: {
        width: 108,
        height: 108,
        borderRadius: 12,
        backgroundColor: '#D1D5DB',
        opacity: 0.9,
    },
    skeletonChange: {
        width: 86,
        height: 22,
        borderRadius: 10,
        backgroundColor: '#D1D5DB',
        opacity: 0.9,
        alignSelf: 'center',
    },
});
