import { useTheme } from '@/hooks/use-theme';
import { useWalletStore } from '@/stores/walletStore';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type WalletBalanceProps = {
    showFanCoins?: boolean;
    size?: 'small' | 'medium' | 'large';
    variant?: 'default' | 'compact';
};

export default function WalletBalance({
    showFanCoins = false,
    size = 'medium',
    variant = 'default',
}: WalletBalanceProps) {
    const { wallet } = useWalletStore();
    const { isDark } = useTheme();

    if (!wallet) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatFanCoins = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const sizeStyles = {
        small: { credits: 14, fanCoins: 12, label: 11 },
        medium: { credits: 18, fanCoins: 14, label: 12 },
        large: { credits: 24, fanCoins: 16, label: 14 },
    };

    const fontSizeStyles = sizeStyles[size];

    if (variant === 'compact') {
        return (
            <View style={componentStyles.container}>
                <Text style={[componentStyles.creditsText, { fontSize: fontSizeStyles.credits, color: isDark ? '#FFFFFF' : '#000000' }]}>
                    {formatCurrency(wallet.tradingCredits)}
                </Text>
                {showFanCoins && (
                    <Text style={[componentStyles.fanCoinsText, { fontSize: fontSizeStyles.fanCoins, color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {formatFanCoins(wallet.fanCoins)} FanCoins
                    </Text>
                )}
            </View>
        );
    }

    return (
        <View style={componentStyles.container}>
            <View style={componentStyles.balanceRow}>
                <Text style={[componentStyles.label, { fontSize: fontSizeStyles.label, color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    Trading Credits
                </Text>
                <Text style={[componentStyles.creditsText, { fontSize: fontSizeStyles.credits, color: isDark ? '#FFFFFF' : '#000000' }]}>
                    {formatCurrency(wallet.tradingCredits)}
                </Text>
            </View>
            {showFanCoins && (
                <View style={componentStyles.balanceRow}>
                    <Text style={[componentStyles.label, { fontSize: fontSizeStyles.label, color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        FanCoins
                    </Text>
                    <Text style={[componentStyles.fanCoinsText, { fontSize: fontSizeStyles.fanCoins, color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {formatFanCoins(wallet.fanCoins)}
                    </Text>
                </View>
            )}
        </View>
    );
}

const componentStyles = StyleSheet.create({
    container: {
        gap: 4,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontWeight: '500',
    },
    creditsText: {
        fontWeight: '600',
    },
    fanCoinsText: {
        fontWeight: '500',
    },
});

