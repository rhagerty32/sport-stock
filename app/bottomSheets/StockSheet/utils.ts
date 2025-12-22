import { useHaptics } from "@/hooks/useHaptics";
import { stocks } from "@/lib/dummy-data";
import { useStockStore } from "@/stores/stockStore";
import { Stock } from "@/types";

export const calculateWinProbability = (americanOdds: number): number => {
    if (americanOdds > 0) {
        return 100 / (americanOdds + 100);
    } else {
        return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
};

// Get team abbreviation from full name
export const getTeamAbbreviation = (teamName: string): string => {
    // Try to find stock by fullName
    const stockMatch = stocks.find(s =>
        s.fullName.toLowerCase() === teamName.toLowerCase() ||
        teamName.toLowerCase().includes(s.fullName.toLowerCase()) ||
        s.fullName.toLowerCase().includes(teamName.toLowerCase())
    );
    if (stockMatch) {
        return stockMatch.ticker;
    }
    // Fallback: extract first letters of words
    return teamName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3);
};

export const getTeamColor = (teamName: string): string => {
    if (!teamName) return '#999999';

    const normalizedApiName = teamName.toLowerCase().trim();

    // First try exact match
    let stockMatch = stocks.find(s =>
        s.fullName.toLowerCase().trim() === normalizedApiName
    );

    // If no exact match, try matching by team name (last word or words, excluding location)
    if (!stockMatch) {
        // Extract team name part (usually the last 1-2 words, excluding common location prefixes)
        const apiWords = normalizedApiName.split(' ');
        // Get the team name part (last 1-2 words, or all if short)
        const teamNamePart = apiWords.length > 2
            ? apiWords.slice(-2).join(' ') // Last 2 words (e.g., "Los Angeles Chargers" -> "Angeles Chargers")
            : normalizedApiName;

        // Also try just the last word (e.g., "Chargers")
        const lastWord = apiWords[apiWords.length - 1];

        stockMatch = stocks.find(s => {
            const normalizedStockName = s.fullName.toLowerCase().trim();
            const stockWords = normalizedStockName.split(' ');
            const stockTeamNamePart = stockWords.length > 2
                ? stockWords.slice(-2).join(' ')
                : normalizedStockName;
            const stockLastWord = stockWords[stockWords.length - 1];

            // Match on team name part (more specific)
            if (teamNamePart === stockTeamNamePart ||
                normalizedStockName.includes(teamNamePart) ||
                normalizedApiName.includes(stockTeamNamePart)) {
                return true;
            }

            // Match on last word if it's distinctive (longer than 4 chars)
            if (lastWord.length > 4 && lastWord === stockLastWord) {
                return true;
            }

            return false;
        });
    }

    // If still no match, try full contains matching (but only if one fully contains the other)
    if (!stockMatch) {
        stockMatch = stocks.find(s => {
            const normalizedStockName = s.fullName.toLowerCase().trim();
            // Only match if one fully contains the other AND they're similar length
            const lengthDiff = Math.abs(normalizedApiName.length - normalizedStockName.length);
            if (lengthDiff < 10) { // Only if lengths are similar
                return normalizedApiName.includes(normalizedStockName) ||
                    normalizedStockName.includes(normalizedApiName);
            }
            return false;
        });
    }

    const color = stockMatch?.secondaryColor || '#999999';
    return color;
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