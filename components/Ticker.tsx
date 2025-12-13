import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface TickerProps {
    ticker: string;
    color: string;
    style?: ViewStyle;
    textStyle?: ViewStyle;
    size?: 'small' | 'medium' | 'large';
}

// Helper function to determine if a color is dark
function isDarkColor(hex: string): boolean {
    // Remove # if present
    const color = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance < 0.5;
}

export function Ticker({ ticker, color, style, textStyle, size = 'medium' }: TickerProps) {
    // Convert ticker to uppercase
    const tickerText = ticker.toUpperCase();

    // Determine text color based on background brightness
    const textColor = isDarkColor(color) ? '#FFFFFF' : '#000000';

    // Size-based styles for better squircle approximation
    const sizeStyles = {
        small: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            minWidth: 40,
            fontSize: 12,
        },
        medium: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            minWidth: 50,
            fontSize: 14,
        },
        large: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            minWidth: 60,
            fontSize: 16,
        },
    };

    const currentSize = sizeStyles[size];

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: color,
                    paddingHorizontal: currentSize.paddingHorizontal,
                    paddingVertical: currentSize.paddingVertical,
                    borderRadius: currentSize.borderRadius,
                    minWidth: currentSize.minWidth,
                },
                style
            ]}
        >
            <Text
                style={[
                    styles.tickerText,
                    {
                        fontSize: currentSize.fontSize,
                        color: textColor as any,
                    },
                    textStyle as any
                ]}
            >
                {tickerText}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tickerText: {
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});
