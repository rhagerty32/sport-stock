import { GlassCard } from '@/components/ui/GlassCard';
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useSeasonPredictions } from '@/lib/season-predictions';
import { Stock } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import {
    ActivityIndicator,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export const PredictionMarkets = ({
    stock,
    sportKey,
}: {
    stock: Stock;
    sportKey: string | null;
}) => {
    const Color = useColors();
    const { isDark } = useTheme();
    const { data: predictions, isLoading } = useSeasonPredictions(stock, sportKey);

    const rows = predictions ?? [];

    return (
        <View style={styles.statsContainer}>
            <GlassCard style={styles.statsCard}>
                <View style={styles.predictionMarketsHeader}>
                    <Text style={[styles.statsTitle, { color: isDark ? Color.white : Color.black }]}>
                        SEASON PREDICTIONS
                    </Text>
                    <View style={styles.poweredByRow}>
                        <Text style={[styles.poweredByText, { color: Color.subText }]}>
                            Powered by
                        </Text>
                        <Image
                            source={require('@/assets/images/polymarket.png')}
                            style={styles.poweredByLogo}
                            contentFit="contain"
                        />
                    </View>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="small" color={Color.black} />
                ) : rows.length > 0 ? (
                    <View style={styles.predictionMarketsContainer}>
                        {rows.map((prediction) => {
                            const yesProb = prediction.yesPercent / 100;
                            const noProb = 1 - yesProb;
                            const noPctRounded = Math.max(0, 100 - prediction.yesPercent);

                            return (
                                <Pressable
                                    key={prediction.slotId}
                                    style={styles.predictionMarketItem}
                                    onPress={() => Linking.openURL(prediction.url)}
                                    accessibilityRole="link"
                                    accessibilityLabel={`${prediction.label}, ${prediction.yesPercent}% on Polymarket`}
                                >
                                    <View style={styles.predictionMarketLabelRow}>
                                        <Text
                                            style={[
                                                styles.predictionMarketItemText,
                                                { color: Color.baseText },
                                            ]}
                                        >
                                            {prediction.label}
                                        </Text>
                                        <Ionicons
                                            name="open-outline"
                                            size={14}
                                            color={Color.subText}
                                        />
                                    </View>

                                    <View style={styles.predictionOddsBarWrap}>
                                        <View
                                            style={[
                                                styles.predictionOddsBarTrack,
                                                { backgroundColor: isDark ? '#242428' : '#E5E7EB' },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.predictionOddsBarSegment,
                                                    { flex: yesProb || 0, backgroundColor: Color.green },
                                                ]}
                                            />
                                            <View
                                                style={[
                                                    styles.predictionOddsBarSegment,
                                                    { flex: noProb || 0, backgroundColor: Color.red },
                                                ]}
                                            />
                                        </View>
                                        <View style={styles.predictionOddsPctRow}>
                                            <Text style={[styles.predictionOddsPct, { color: Color.green }]}>
                                                {prediction.yesPercent}%
                                            </Text>
                                            <Text style={[styles.predictionOddsPct, { color: Color.red }]}>
                                                {noPctRounded}%
                                            </Text>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                ) : (
                    <View>
                        <Text style={{ color: Color.subText }}>No prediction markets found</Text>
                    </View>
                )}
            </GlassCard>
        </View>
    );
};

const styles = StyleSheet.create({
    predictionMarketItemText: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    predictionMarketLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statsContainer: {
        marginHorizontal: 20,
        marginBottom: 24,
    },
    statsCard: {
        padding: 20,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    predictionMarketsHeader: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 8,
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    poweredByRow: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        gap: 2,
        position: 'absolute',
        top: 0,
        right: 0,
    },
    poweredByText: {
        fontSize: 10,
        fontWeight: '500',
    },
    poweredByLogo: {
        width: 80,
        height: 20,
    },
    predictionMarketsContainer: {
        gap: 12,
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginVertical: 8,
    },
    predictionMarketItem: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        width: '100%',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
    },
    predictionOddsBarWrap: {
        width: '100%',
        gap: 8,
    },
    predictionOddsBarTrack: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        flexDirection: 'row',
        width: '100%',
    },
    predictionOddsBarSegment: {
        height: '100%',
    },
    predictionOddsPctRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    predictionOddsPct: {
        fontSize: 13,
        fontWeight: '600',
    },
});
