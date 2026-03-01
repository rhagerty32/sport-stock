import { useColors } from '@/components/utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

type EmptyStateProps = {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
};

export function EmptyState({ icon = 'folder-open-outline', title, subtitle, actionLabel, onAction, style }: EmptyStateProps) {
    const Color = useColors();
    return (
        <View style={[styles.container, style]}>
            <Ionicons name={icon} size={56} color={Color.subText} style={styles.icon} />
            <Text style={[styles.title, { color: Color.baseText }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: Color.subText }]}>{subtitle}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: Color.green }]}
                    onPress={onAction}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
