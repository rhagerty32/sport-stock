import { useHaptics } from "@/hooks/useHaptics";
import { useStockStore } from "@/stores/stockStore";
import { Stock } from "@/types";

export const calculateWinProbability = (americanOdds: number): number => {
    if (americanOdds > 0) {
        return 100 / (americanOdds + 100);
    } else {
        return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
};

export const getTeamAbbreviation = (teamName: string): string => {
    return teamName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3);
};

export const getTeamColor = (teamName: string, stocks?: Stock[]): string => {
    if (!teamName) return '#999999';
    if (!stocks?.length) return '#217C0A';

    const normalizedApiName = teamName.toLowerCase().trim();
    let stockMatch = stocks.find(s => s.fullName.toLowerCase().trim() === normalizedApiName);

    if (!stockMatch) {
        const apiWords = normalizedApiName.split(' ');
        const teamNamePart = apiWords.length > 2 ? apiWords.slice(-2).join(' ') : normalizedApiName;
        const lastWord = apiWords[apiWords.length - 1];

        stockMatch = stocks.find(s => {
            const normalizedStockName = s.fullName.toLowerCase().trim();
            const stockWords = normalizedStockName.split(' ');
            const stockTeamNamePart = stockWords.length > 2 ? stockWords.slice(-2).join(' ') : normalizedStockName;
            const stockLastWord = stockWords[stockWords.length - 1];
            if (teamNamePart === stockTeamNamePart ||
                normalizedStockName.includes(teamNamePart) ||
                normalizedApiName.includes(stockTeamNamePart)) return true;
            if (lastWord.length > 4 && lastWord === stockLastWord) return true;
            return false;
        });
    }

    if (stockMatch?.color) return stockMatch.color;

    if (!stockMatch && stocks?.length) {
        stockMatch = stocks.find(s => {
            const normalizedStockName = s.fullName.toLowerCase().trim();
            const lengthDiff = Math.abs(normalizedApiName.length - normalizedStockName.length);
            if (lengthDiff < 10) {
                return normalizedApiName.includes(normalizedStockName) ||
                    normalizedStockName.includes(normalizedApiName);
            }
            return false;
        });
    }

    return stockMatch?.color ?? stockMatch?.secondaryColor ?? '#999999';
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

export const formatNumber = (num: number) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

export const handleBuy = () => {
    const { lightImpact } = useHaptics();
    const { setBuySellMode, setBuySellBottomSheetOpen } = useStockStore();
    lightImpact();
    setBuySellMode('buy');
    setBuySellBottomSheetOpen(true);
};

export const handleSell = () => {
    const { lightImpact } = useHaptics();
    const { setBuySellMode, setBuySellBottomSheetOpen } = useStockStore();
    lightImpact();
    setBuySellMode('sell');
    setBuySellBottomSheetOpen(true);
};

export const handleFollow = (userFollowsStock: boolean, stock: Stock) => {
    const { lightImpact } = useHaptics();
    const { removeFollow, addFollow } = useStockStore();
    lightImpact();
    if (userFollowsStock) {
        removeFollow(stock.id);
    } else {
        addFollow(stock.id);
    }
};