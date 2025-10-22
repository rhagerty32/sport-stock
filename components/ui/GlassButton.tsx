import React from 'react';
import { TouchableOpacity, Text, TextStyle, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface GlassButtonProps {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    variant?: 'primary' | 'secondary' | 'destructive';
    disabled?: boolean;
}

export function GlassButton({
    title,
    onPress,
    style,
    textStyle,
    variant = 'primary',
    disabled = false
}: GlassButtonProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const getVariantStyles = () => {
        const baseStyle = {
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        };

        switch (variant) {
            case 'primary':
                return {
                    ...baseStyle,
                    backgroundColor: '#217C0A',
                    borderWidth: 1,
                    borderColor: '#217C0A',
                };
            case 'secondary':
                return {
                    ...baseStyle,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                };
            case 'destructive':
                return {
                    ...baseStyle,
                    backgroundColor: '#dc2626',
                    borderWidth: 1,
                    borderColor: '#dc2626',
                };
            default:
                return {
                    ...baseStyle,
                    backgroundColor: '#217C0A',
                    borderWidth: 1,
                    borderColor: '#217C0A',
                };
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'primary':
            case 'destructive':
                return '#FFFFFF';
            case 'secondary':
                return isDark ? '#FFFFFF' : '#000000';
            default:
                return '#FFFFFF';
        }
    };

    const variantStyles = getVariantStyles();
    const textColor = getTextColor();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[variantStyles, style, disabled && { opacity: 0.5 }]}
        >
            <Text
                style={[
                    {
                        fontSize: 16,
                        fontWeight: '600',
                        color: textColor,
                        textAlign: 'center',
                    },
                    textStyle
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}
