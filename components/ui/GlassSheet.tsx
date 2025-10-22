import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface GlassSheetProps {
    children: React.ReactNode;
    style?: ViewStyle;
    padding?: number;
}

export function GlassSheet({
    children,
    style,
    padding: paddingValue = 20
}: GlassSheetProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const sheetStyle = {
        flex: 1,
        borderRadius: 24,
        padding: paddingValue,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    };

    return (
        <View style={[sheetStyle, style]}>
            {children}
        </View>
    );
}
