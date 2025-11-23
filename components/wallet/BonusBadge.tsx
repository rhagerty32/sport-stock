import { useTheme } from '@/hooks/use-theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type BonusBadgeProps = {
    percentage: number;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
};

export default function BonusBadge({
    percentage,
    size = 'medium',
    showLabel = true,
}: BonusBadgeProps) {
    const { isDark } = useTheme();

    const sizeStyles = {
        small: { fontSize: 10, padding: 4, borderRadius: 6 },
        medium: { fontSize: 12, padding: 6, borderRadius: 8 },
        large: { fontSize: 14, padding: 8, borderRadius: 10 },
    };

    const style = sizeStyles[size];

    return (
        <View style={[styles.badge, { backgroundColor: '#217C0A', padding: style.padding, borderRadius: style.borderRadius }]}>
            <Text style={[styles.percentage, { fontSize: style.fontSize }]}>
                +{percentage.toFixed(0)}%
            </Text>
            {showLabel && (
                <Text style={[styles.label, { fontSize: style.fontSize - 2 }]}>
                    Bonus
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentage: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    label: {
        color: '#FFFFFF',
        fontWeight: '500',
        marginTop: 2,
    },
});

