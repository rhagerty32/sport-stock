import { useWallet } from '@/lib/wallet-api';
import { useAuthStore } from '@/stores/authStore';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../utils';

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
    const user = useAuthStore((s) => s.user);
    const { data: wallet, isPending } = useWallet(user?.id ?? null);
    const Color = useColors();

    if (!user?.id) {
        return null;
    }

    if (!wallet) {
        if (isPending) {
            return (
                <View style={componentStyles.loadingWrap}>
                    <ActivityIndicator size="small" color={Color.subText} />
                </View>
            );
        }
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
                <Text style={[componentStyles.creditsText, { fontSize: fontSizeStyles.credits, color: Color.baseText }]}>
                    {formatCurrency(wallet.tradingCredits)}
                </Text>
                {showFanCoins && (
                    <Text style={[componentStyles.fanCoinsText, { fontSize: fontSizeStyles.fanCoins, color: Color.subText }]}>
                        {formatFanCoins(wallet.fanCoins)} GC
                    </Text>
                )}
            </View>
        );
    }

    return (
        <View style={componentStyles.container}>
            <View style={componentStyles.balanceRow}>
                <Text style={[componentStyles.label, { fontSize: fontSizeStyles.label, color: Color.subText }]}>
                    SportCash (SC)
                </Text>
                <Text style={[componentStyles.creditsText, { fontSize: fontSizeStyles.credits, color: Color.baseText }]}>
                    {formatCurrency(wallet.tradingCredits)}
                </Text>
            </View>
            {showFanCoins && (
                <View style={componentStyles.balanceRow}>
                    <Text style={[componentStyles.label, { fontSize: fontSizeStyles.label, color: Color.subText }]}>
                        Gold Coins (GC)
                    </Text>
                    <Text style={[componentStyles.fanCoinsText, { fontSize: fontSizeStyles.fanCoins, color: Color.subText }]}>
                        {formatFanCoins(wallet.fanCoins)}
                    </Text>
                </View>
            )}
        </View>
    );
}

const componentStyles = StyleSheet.create({
    loadingWrap: {
        paddingVertical: 8,
        alignItems: 'center',
    },
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

