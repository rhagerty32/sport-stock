import { useColors } from '@/components/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useStockStore } from '@/stores/stockStore';
import { Stock } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

export const ActionButtons = ({ userOwnsStock, userFollowsStock, stock }: { userOwnsStock: boolean, userFollowsStock: boolean, stock: Stock }) => {
    const Color = useColors();
    // Animated opacity for Follow/Unfollow text fade
    const followTextOpacity = useSharedValue(1);

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: followTextOpacity.value,
        };
    });

    const { lightImpact } = useHaptics();
    const { setBuySellMode, setBuySellBottomSheetOpen } = useStockStore();
    const { removeFollow, addFollow } = useStockStore();

    const handleBuy = () => {
        lightImpact();
        setBuySellMode('buy');
        setBuySellBottomSheetOpen(true);
    };

    const handleSell = () => {
        lightImpact();
        setBuySellMode('sell');
        setBuySellBottomSheetOpen(true);
    };

    const handleFollow = (userFollowsStock: boolean, stock: Stock) => {
        lightImpact();
        if (userFollowsStock) {
            removeFollow(stock.id);
        } else {
            addFollow(stock.id);
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