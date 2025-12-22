import { useColorScheme } from 'react-native';

export const useColors = () => {
    const scheme = useColorScheme();
    const darkMode = scheme === 'dark';

    return {
        green: '#00C853',
        red: '#EF4444',
        yellow: '#FFD700',
        blue: '#3B82F6',
        purple: '#800080',
        orange: '#FFA500',
        pink: '#FFC0CB',
        brown: '#A52A2A',
        neutralGray: '#808080',
        gray500: '#9CA3AF',
        gray600: '#6B7280',
        black: '#000000',
        white: '#FFFFFF',
        lightGray: '#E5E7EB',
        offWhite: '#E5E7EB',
        offBlack: '#1A1D21',

        baseText: darkMode ? '#FFFFFF' : '#000000',
        subText: darkMode ? '#9CA3AF' : '#6B7280',
    };
};

/// Find if color is considered dark
export const isDarkColor = (color: string) => {
    const rgb = color.match(/\w\w/g)?.map(hex => parseInt(hex, 16)) || [0, 0, 0];
    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    return brightness < 50;
};

// Brighten color by 25%
export const brightenColor = (color: string) => {
    const rgb = color.match(/\w\w/g)?.map(hex => parseInt(hex, 16)) || [0, 0, 0];
    return `#${(rgb[0] + 20).toString(16)}${(rgb[1] + 50).toString(16)}${(rgb[2] + 50).toString(16)}`;
};

// Darken color by 25%
export const darkenColor = (color: string) => {
    const rgb = color.match(/\w\w/g)?.map(hex => parseInt(hex, 16)) || [0, 0, 0];
    return `#${(rgb[0] - 50).toString(16)}${(rgb[1] - 50).toString(16)}${(rgb[2] - 50).toString(16)}`;
};

export const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString('en-US');
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
};

export const formatNumberBig = (num: number) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};