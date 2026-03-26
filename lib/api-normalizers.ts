import type { BonusInfo, League, Portfolio, Position, PriceHistory, Stock, Transaction, Wallet } from '@/types';

function parseDate(value: string | null | undefined): Date {
    if (value == null) return new Date(0);
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

// API Stock: camelCase (photoUrl, fullName, leagueId, etc.)
export function normalizeStock(api: any): Stock {
    return {
        id: api.id ?? 0,
        name: api.name ?? '',
        fullName: api.fullName ?? api.name ?? '',
        leagueID: api.leagueId ?? api.leagueID ?? 0,
        photoURL: api.photoUrl ?? api.photoURL ?? '',
        price: typeof api.price === 'number' ? api.price : 0,
        about: api.about ?? '',
        ticker: api.ticker ?? '',
        coach: api.coach ?? '',
        founded: api.founded ?? 0,
        topThreePlayers: Array.isArray(api.topThreePlayers) ? api.topThreePlayers : [],
        volume: api.volume ?? 0,
        color: api.color ?? '#000000',
        secondaryColor: api.secondaryColor ?? '#000000',
        createdAt: parseDate(api.createdAt),
        updatedAt: parseDate(api.updatedAt),
    };
}

export function normalizeLeague(api: any): League {
    const stocks = api.stocks != null
        ? (Array.isArray(api.stocks) ? api.stocks.map(normalizeStock) : [])
        : undefined;
    return {
        id: api.id ?? 0,
        name: api.name ?? '',
        marketCap: api.marketCap ?? 0,
        volume: api.volume ?? 0,
        stocks,
        photoURL: api.photoUrl ?? api.photoURL ?? '',
        sport: api.sport ?? '',
        createdAt: parseDate(api.createdAt),
        updatedAt: parseDate(api.updatedAt),
        playoffQuery: api.playoffQuery ?? '',
        divisionQuery: api.divisionQuery,
        conferenceQuery: api.conferenceQuery,
        championQuery: api.championQuery ?? '',
    };
}

export function normalizePosition(api: any): Position {
    const stock = api.stock ? normalizeStock(api.stock) : (null as any);
    const colors = Array.isArray(api.colors) ? api.colors : [];
    return {
        stock,
        entries: typeof api.entries === 'number' ? api.entries : 0,
        avgEntryPrice: typeof api.avgEntryPrice === 'number' ? api.avgEntryPrice : 0,
        currentValue: typeof api.currentValue === 'number' ? api.currentValue : 0,
        totalGainLoss: typeof api.totalGainLoss === 'number' ? api.totalGainLoss : 0,
        gainLossPercentage: typeof api.gainLossPercentage === 'number' ? api.gainLossPercentage : 0,
        colors: colors.map((c: any) => (typeof c === 'object' && c?.hex != null ? { hex: c.hex } : { hex: '#000000' })),
    };
}

export function normalizeTransaction(api: any): Transaction {
    return {
        id: api.id ?? 0,
        action: api.action === 'sell' ? 'sell' : 'buy',
        quantity: typeof api.quantity === 'number' ? api.quantity : 0,
        price: typeof api.price === 'number' ? api.price : 0,
        totalPrice: typeof api.totalPrice === 'number' ? api.totalPrice : 0,
        userID: api.userId ?? api.userID ?? 0,
        stockID: api.stockId ?? api.stockID ?? 0,
        createdAt: parseDate(api.createdAt),
        updatedAt: parseDate(api.updatedAt),
    };
}

export function normalizePortfolio(api: any): Portfolio {
    const positions = Array.isArray(api.positions) ? api.positions.map(normalizePosition) : [];
    return {
        totalValue: typeof api.totalValue === 'number' ? api.totalValue : 0,
        totalInvested: typeof api.totalInvested === 'number' ? api.totalInvested : 0,
        totalGainLoss: typeof api.totalGainLoss === 'number' ? api.totalGainLoss : 0,
        totalGainLossPercentage: typeof api.totalGainLossPercentage === 'number' ? api.totalGainLossPercentage : 0,
        positions,
    };
}

export function normalizeWallet(api: any): Wallet {
    return {
        fanCoins: typeof api.fanCoins === 'number' ? api.fanCoins : 0,
        tradingCredits: typeof api.tradingCredits === 'number' ? api.tradingCredits : 0,
        userId: api.userId ?? api.userID ?? 0,
        updatedAt: parseDate(api.updatedAt),
    };
}

// PriceHistoryPoint from API: stockId, timestamp, price, change, changePercentage (camelCase)
export function normalizePriceHistoryPoint(api: any): PriceHistory {
    const rawId = api?.stockId ?? api?.stockID;
    let stockID: number | string = 0;
    if (typeof rawId === 'string' && rawId !== '') {
        stockID = rawId;
    } else if (typeof rawId === 'number' && !Number.isNaN(rawId)) {
        stockID = rawId;
    }
    return {
        stockID,
        timestamp: parseDate(api?.timestamp),
        price: typeof api?.price === 'number' ? api.price : 0,
        change: typeof api?.change === 'number' ? api.change : 0,
        changePercentage: typeof api?.changePercentage === 'number' ? api.changePercentage : 0,
    };
}

export function normalizeBonusInfo(api: any): BonusInfo {
    const tierMultipliers = Array.isArray(api.tierMultipliers)
        ? api.tierMultipliers.map((t: any) => ({
              min: typeof t?.min === 'number' ? t.min : 0,
              max: typeof t?.max === 'number' ? t.max : 0,
              multiplier: typeof t?.multiplier === 'number' ? t.multiplier : 1,
          }))
        : [];
    return {
        baseMultiplier: typeof api.baseMultiplier === 'number' ? api.baseMultiplier : 1,
        tierMultipliers,
        firstTimeBonus: typeof api.firstTimeBonus === 'number' ? api.firstTimeBonus : 0,
    };
}
