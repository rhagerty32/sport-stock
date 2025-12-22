import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { handleBuy, handleFollow, handleSell } from './utils';
import { Stock } from '@/types';

export const ActionButtons = ({ userOwnsStock, userFollowsStock, stock }: { userOwnsStock: boolean, userFollowsStock: boolean, stock: Stock }) => {
    // Animated opacity for Follow/Unfollow text fade
    const followTextOpacity = useSharedValue(1);

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: followTextOpacity.value,
        };
    });

    return (
        <View style={styles.actionButtons}>
            {/* Buy Button - Always shown */}
            <TouchableOpacity
                onPress={handleBuy}
                style={[styles.actionButton, { backgroundColor: '#00C853' }]}
            >
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                    Buy
                </Text>
            </TouchableOpacity>

            {/* Sell or Follow Button */}
            {userOwnsStock ? (
                <TouchableOpacity
                    onPress={handleSell}
                    style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                >
                    <Ionicons name="remove-circle-outline" size={24} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                        Sell
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={() => handleFollow(userFollowsStock, stock)}
                    style={[styles.actionButton, { backgroundColor: userFollowsStock ? '#E5E7EB' : '#E5E7EB' }]}
                >
                    <Ionicons name={userFollowsStock ? "heart" : "heart-outline"} size={24} color={userFollowsStock ? '#EF4444' : '#EF4444'} />
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