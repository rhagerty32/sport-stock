import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    padding?: number;
    standard?: boolean;
    material?: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'ultraThick';
    fullWidth?: boolean;
}

export function GlassCard({
    children,
    style,
    padding: paddingValue = 16,
    standard = true,
    material = 'thin',
    fullWidth = false,
}: GlassCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const getMaterialStyle = () => {
        const baseStyle = {
            borderRadius: 16,
            padding: paddingValue,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
        };

        switch (material) {
            case 'ultraThin':
                return {
                    ...standard && baseStyle,
                    backgroundColor: isDark ? fullWidth ? 'transparent' : 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                    borderWidth: !fullWidth ? 1 : 0,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                };
            case 'thin':
                return {
                    ...standard && baseStyle,
                    backgroundColor: isDark ? fullWidth ? 'transparent' : 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)',
                    borderWidth: !fullWidth ? 1 : 0,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                };
            case 'regular':
                return {
                    ...standard && baseStyle,
                    backgroundColor: isDark ? fullWidth ? 'transparent' : 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.9)',
                    borderWidth: !fullWidth ? 1 : 0,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                };
            case 'thick':
                return {
                    ...standard && baseStyle,
                    backgroundColor: isDark ? fullWidth ? 'transparent' : 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.95)',
                    borderWidth: !fullWidth ? 1 : 0,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)',
                };
            case 'ultraThick':
                return {
                    ...standard && baseStyle,
                    backgroundColor: isDark ? fullWidth ? 'transparent' : 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.98)',
                    borderWidth: !fullWidth ? 1 : 0,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                };
            default:
                return {
                    ...standard && baseStyle,
                    backgroundColor: isDark ? fullWidth ? 'transparent' : 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)',
                    borderWidth: !fullWidth ? 1 : 0,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                };
        }
    };

    return (
        <View style={[getMaterialStyle(), style]}>
            {children}
        </View>
    );
}
