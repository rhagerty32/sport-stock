import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import type { MoverItem } from '@/lib/stocks-api';
import type { Stock } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';

const STOCK_PAGE_WIDTH = 360;
const STOCK_PAGE_MARGIN = 20;
const SNAP_INTERVAL = STOCK_PAGE_WIDTH + STOCK_PAGE_MARGIN / 2;

function moverListSignature(items: MoverItem[]): string {
    return items.map((m) => `${m.stock.id}:${m.change}:${m.changePercentage}`).join('|');
}

export type HomeMoverDiscoveryVariant = 'rise' | 'upset';

export type HomeMoverDiscoverySectionProps = {
    variant: HomeMoverDiscoveryVariant;
    title: string;
    subtitle: string;
    emptyIcon: keyof typeof Ionicons.glyphMap;
    emptyTitle: string;
    emptySubtitle: string;
    items: MoverItem[];
    sectionsLoading: boolean;
    onStockPress: (stock: Stock) => void;
    formatPercentage: (percentage: number) => string;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

function HomeMoverDiscoverySectionInner({
    variant,
    title,
    subtitle,
    emptyIcon,
    emptyTitle,
    emptySubtitle,
    items,
    sectionsLoading,
    onStockPress,
    formatPercentage,
}: HomeMoverDiscoverySectionProps) {
    const Color = useColors();
    const { isDark } = useTheme();
    const [page, setPage] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const savedOffsetX = useRef(0);
    const prevSignatureRef = useRef<string | null>(null);

    const signature = useMemo(() => moverListSignature(items), [items]);

    useEffect(() => {
        if (prevSignatureRef.current != null && prevSignatureRef.current !== signature) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        prevSignatureRef.current = signature;
    }, [signature]);

    const pageCount = Math.ceil(items.length / 3);

    useLayoutEffect(() => {
        if (pageCount <= 0) return;
        const maxPage = Math.max(0, pageCount - 1);
        const maxX = maxPage * SNAP_INTERVAL;
        const x = Math.min(Math.max(0, savedOffsetX.current), maxX);
        scrollRef.current?.scrollTo({ x, animated: false });
        setPage(Math.round(x / SNAP_INTERVAL));
    }, [signature, pageCount]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        savedOffsetX.current = event.nativeEvent.contentOffset.x;
        setPage(Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL));
    }, []);

    const isRise = variant === 'rise';

    return (
        <View style={styles.section}>
            <GlassCard style={styles.card} padding={0}>
                <View style={styles.content}>
                    <Text style={[styles.title, { color: Color.baseText }]}>{title}</Text>
                    <Text style={[styles.subtitle, { color: Color.subText }]}>{subtitle}</Text>
                    {items.length === 0 && !sectionsLoading ? (
                        <EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptySubtitle} />
                    ) : (
                        <>
                            <ScrollView
                                ref={scrollRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled
                                snapToInterval={SNAP_INTERVAL}
                                snapToAlignment="center"
                                decelerationRate="fast"
                                onScroll={handleScroll}
                                style={styles.stockScrollView}
                                contentContainerStyle={styles.stockScrollContent}
                                scrollEventThrottle={16}
                                nestedScrollEnabled
                            >
                                {Array.from({ length: pageCount }, (_, pageIndex) => (
                                    <View key={pageIndex} style={styles.stockPage}>
                                        {items.slice(pageIndex * 3, (pageIndex + 1) * 3).map((item) => (
                                            <TouchableOpacity
                                                key={item.stock.id}
                                                style={styles.stockItem}
                                                onPress={() => onStockPress(item.stock)}
                                                activeOpacity={0.7}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <View style={[styles.stockIcon, { backgroundColor: item.stock.color }]}>
                                                    <Text style={[styles.stockIconText, { color: Color.white }]}>
                                                        {item.stock.name
                                                            .split(' ')
                                                            .map((word) => word[0])
                                                            .join('')
                                                            .slice(0, 2)}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.stockName, { color: Color.baseText }]}>
                                                    {item.stock.name}
                                                </Text>
                                                <View
                                                    style={[
                                                        styles.stockValue,
                                                        { backgroundColor: isDark ? '#242428' : '#F3F4F6' },
                                                    ]}
                                                >
                                                    <View style={styles.stockValueContent}>
                                                        <Ionicons
                                                            name={isRise ? 'trending-up' : 'trending-down'}
                                                            size={14}
                                                            color={isRise ? Color.green : '#FF1744'}
                                                        />
                                                        <Text
                                                            style={[
                                                                styles.stockValueText,
                                                                { color: isRise ? Color.green : Color.red },
                                                            ]}
                                                        >
                                                            {formatPercentage(item.changePercentage)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                            </ScrollView>

                            {pageCount > 1 && (
                                <View style={styles.paginationDots}>
                                    {Array.from({ length: pageCount }, (_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.paginationDot,
                                                {
                                                    backgroundColor:
                                                        page === index
                                                            ? isDark
                                                                ? '#ccc'
                                                                : '#777'
                                                            : isDark
                                                              ? '#777'
                                                              : '#ccc',
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </View>
            </GlassCard>
        </View>
    );
}

function propsEqual(
    prev: Readonly<HomeMoverDiscoverySectionProps>,
    next: Readonly<HomeMoverDiscoverySectionProps>
): boolean {
    return (
        prev.variant === next.variant &&
        prev.title === next.title &&
        prev.subtitle === next.subtitle &&
        prev.emptyIcon === next.emptyIcon &&
        prev.emptyTitle === next.emptyTitle &&
        prev.emptySubtitle === next.emptySubtitle &&
        prev.sectionsLoading === next.sectionsLoading &&
        prev.onStockPress === next.onStockPress &&
        prev.formatPercentage === next.formatPercentage &&
        moverListSignature(prev.items) === moverListSignature(next.items)
    );
}

export const HomeMoverDiscoverySection = React.memo(HomeMoverDiscoverySectionInner, propsEqual);

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    card: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    content: {
        paddingVertical: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    stockScrollView: {
        marginBottom: 16,
    },
    stockScrollContent: {
        paddingHorizontal: 0,
    },
    stockPage: {
        width: STOCK_PAGE_WIDTH,
        marginRight: STOCK_PAGE_MARGIN,
        paddingHorizontal: 20,
    },
    stockItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        minHeight: 50,
        paddingVertical: 8,
    },
    stockIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stockIconText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    stockName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    stockValueContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    stockValue: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stockValueText: {
        fontSize: 12,
        fontWeight: '500',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
});
