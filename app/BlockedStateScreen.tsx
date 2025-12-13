import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface BlockedStateScreenProps {
    detectedState?: string | null;
}

export default function BlockedStateScreen({ detectedState }: BlockedStateScreenProps) {
    const { isDark } = useTheme();

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Icon */}
                <Animated.View
                    entering={FadeInDown.duration(600).delay(100)}
                    style={styles.iconContainer}
                >
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2C1F1F' : '#FEE2E2' }]}>
                        <Ionicons
                            name="location-outline"
                            size={64}
                            color={isDark ? '#EF4444' : '#DC2626'}
                        />
                    </View>
                </Animated.View>

                {/* Title */}
                <Animated.View entering={FadeInUp.duration(600).delay(200)}>
                    <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Service Not Available
                    </Text>
                </Animated.View>

                {/* Message */}
                <Animated.View entering={FadeInUp.duration(600).delay(300)}>
                    <GlassCard style={styles.messageCard} padding={24}>
                        <Text style={[styles.message, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                            We're sorry, but SportStock is not currently permitted to operate in your state.
                        </Text>
                        {detectedState && (
                            <View style={styles.stateInfo}>
                                <Ionicons
                                    name="information-circle-outline"
                                    size={20}
                                    color={isDark ? '#9CA3AF' : '#6B7280'}
                                    style={styles.infoIcon}
                                />
                                <Text style={[styles.stateText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Detected location: {detectedState}
                                </Text>
                            </View>
                        )}
                    </GlassCard>
                </Animated.View>

                {/* Availability Map */}
                <Animated.View entering={FadeInUp.duration(600).delay(400)}>
                    <GlassCard style={styles.mapCard} padding={0}>
                        <View style={styles.mapContainer}>
                            <Text style={[styles.mapTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                Available States
                            </Text>
                            <Text style={[styles.mapSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                SportStock is available in the highlighted states
                            </Text>
                            <View style={styles.mapImageContainer}>
                                <Image
                                    source={require('@/assets/images/availabilityMap.png')}
                                    style={styles.mapImage}
                                    contentFit="contain"
                                />
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Additional Info */}
                <Animated.View entering={FadeInUp.duration(600).delay(500)}>
                    <GlassCard style={styles.infoCard} padding={20}>
                        <View style={styles.infoRow}>
                            <Ionicons
                                name="help-circle-outline"
                                size={24}
                                color={isDark ? '#00C853' : '#00C853'}
                                style={styles.infoIcon}
                            />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Why is this restricted?
                                </Text>
                                <Text style={[styles.infoText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    State regulations vary across the United States. We're working to expand our availability to more states in the future.
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 80,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    messageCard: {
        marginBottom: 24,
    },
    message: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    stateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    infoIcon: {
        marginRight: 8,
    },
    stateText: {
        fontSize: 14,
        flex: 1,
    },
    mapCard: {
        marginBottom: 24,
        overflow: 'hidden',
    },
    mapContainer: {
        padding: 20,
    },
    mapTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    mapSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    mapImageContainer: {
        width: '100%',
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    mapImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
    },
    infoCard: {
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
    },
    bottomSpacing: {
        height: 40,
    },
});
