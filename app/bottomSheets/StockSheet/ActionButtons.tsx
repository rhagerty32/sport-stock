import { useColors } from '@/components/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuthStore } from '@/stores/authStore';
import { useStockStore } from '@/stores/stockStore';
import { Stock } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { followStock, unfollowStock } from '@/lib/follows-api';

export const ActionButtons = ({ userOwnsStock, userFollowsStock, stock }: { userOwnsStock: boolean; userFollowsStock: boolean; stock: Stock }) => {
    const Color = useColors();
    const router = useRouter();
    const requireAuth = useAuthStore((s) => s.requireAuth);
    const setLoginBottomSheetOpen = useStockStore((s) => s.setLoginBottomSheetOpen);
    const followTextOpacity = useSharedValue(1);

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: followTextOpacity.value,
        };
    });

    const { lightImpact } = useHaptics();
    const { setBuySellMode, setBuySellBottomSheetOpen } = useStockStore();
    const { removeFollow, addFollow, upsertFollowedStock, removeFollowedStockById } = useStockStore();

    const handleBuy = () => {
        lightImpact();
        const ok = requireAuth(() => {
            setBuySellMode('buy');
            setBuySellBottomSheetOpen(true);
        });
        if (!ok) {
            Alert.alert('Log in to trade', 'Sign in to buy and sell teams on SportStock.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log in', onPress: () => setLoginBottomSheetOpen(true) },
            ]);
        }
    };

    const handleSell = () => {
        lightImpact();
        const ok = requireAuth(() => {
            setBuySellMode('sell');
            setBuySellBottomSheetOpen(true);
        });
        if (!ok) {
            Alert.alert('Log in to trade', 'Sign in to buy and sell teams on SportStock.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log in', onPress: () => setLoginBottomSheetOpen(true) },
            ]);
        }
    };

    const handleFollow = (userFollowsStock: boolean, stock: Stock) => {
        lightImpact();
        const ok = requireAuth(async () => {
            try {
                if (userFollowsStock) {
                    // Optimistically update local state
                    removeFollow(stock.id);
                    removeFollowedStockById(stock.id);
                    await unfollowStock(stock.id);
                } else {
                    // Optimistically update local state
                    addFollow(stock.id);
                    upsertFollowedStock(stock);
                    await followStock(stock.id);
                }
            } catch (err) {
                // Roll back local state on error
                if (userFollowsStock) {
                    addFollow(stock.id);
                    upsertFollowedStock(stock);
                } else {
                    removeFollow(stock.id);
                    removeFollowedStockById(stock.id);
                }
                Alert.alert('Unable to update follow', 'Something went wrong saving your follow. Please try again.');
            }
        });

        if (!ok) {
            Alert.alert('Log in to follow', 'Sign in to follow teams on SportStock.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log in', onPress: () => setLoginBottomSheetOpen(true) },
            ]);
        }
    };

    return (
        <View style={styles.actionButtons}>
            {/* Buy Button - Always shown */}
            <TouchableOpacity
                onPress={handleBuy}
                style={[styles.actionButton, { backgroundColor: Color.green }]}
            >
                <Ionicons name="add-circle-outline" size={24} color={Color.white} />
                <Text style={[styles.actionButtonText, { color: Color.white }]}>
                    Buy
                </Text>
            </TouchableOpacity>

            {/* Sell or Follow Button */}
            {userOwnsStock ? (
                <TouchableOpacity
                    onPress={handleSell}
                    style={[styles.actionButton, { backgroundColor: Color.red }]}
                >
                    <Ionicons name="remove-circle-outline" size={24} color={Color.white} />
                    <Text style={[styles.actionButtonText, { color: Color.white }]}>
                        Sell
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={() => handleFollow(userFollowsStock, stock)}
                    style={[styles.actionButton, { backgroundColor: Color.lightGray }]}
                >
                    <Ionicons name={userFollowsStock ? "heart" : "heart-outline"} size={24} color={Color.red} />
                    <Animated.Text style={[styles.actionButtonText, animatedTextStyle]}>
                        {userFollowsStock ? 'Unfollow' : 'Follow'}
                    </Animated.Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 12,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});