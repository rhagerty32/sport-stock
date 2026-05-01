import type {
    BonusInfo,
    League,
    Portfolio,
    PortfolioPeriodMetrics,
    Position,
    PriceHistory,
    Stock,
    Transaction,
    Wallet,
} from '@/types';

function parseDate(value: string | null | undefined): Date {
    if (value == null) return new Date(0);
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

/** Resolve league id from various API shapes (camelCase, snake_case, nested league). */
function leagueIdFromStockPayload(api: any): number | string {
    const nested =
        api?.league != null && typeof api.league === 'object'
            ? api.league.id ?? api.league.leagueId ?? api.league.league_id
            : undefined;
    const raw = api?.leagueId ?? api?.leagueID ?? api?.league_id ?? nested;
    if (raw == null || raw === '') return 0;
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') {
        const t = raw.trim();
        if (t === '') return 0;
        const n = Number(t);
        if (!Number.isNaN(n) && String(n) === t) return n;
        return t;
    }
    return 0;
}

// API Stock: camelCase (photoUrl, fullName, leagueId, etc.)
export function normalizeStock(api: any): Stock {
    return {
        id: api.id ?? 0,
        name: api.name ?? '',
        fullName: api.fullName ?? api.name ?? '',
        leagueID: leagueIdFromStockPayload(api),
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

function normalizeTransactionStockId(raw: unknown): number {
    if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
    if (typeof raw === 'string' && raw !== '') {
        const n = Number(raw);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

export function normalizeTransaction(api: any): Transaction {
    return {
        id: typeof api.id === 'number' ? api.id : typeof api.pendingOrderId === 'number' ? api.pendingOrderId : 0,
        action: api.action === 'sell' ? 'sell' : 'buy',
        quantity: typeof api.quantity === 'number' ? api.quantity : 0,
        price: typeof api.price === 'number' ? api.price : 0,
        totalPrice: typeof api.totalPrice === 'number' ? api.totalPrice : 0,
        userID: api.userId ?? api.userID ?? 0,
        stockID: normalizeTransactionStockId(api.stockId ?? api.stockID),
        createdAt: parseDate(api.createdAt),
        updatedAt: parseDate(api.updatedAt ?? api.createdAt),
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

export function normalizePortfolioPeriodMetrics(api: any): PortfolioPeriodMetrics {
    return {
        userId: typeof api?.userId === 'string' ? api.userId : String(api?.userId ?? ''),
        period: typeof api?.period === 'string' ? api.period : String(api?.period ?? ''),
        totalValue: typeof api?.totalValue === 'number' ? api.totalValue : 0,
        totalInvested: typeof api?.totalInvested === 'number' ? api.totalInvested : 0,
        totalGainLoss: typeof api?.totalGainLoss === 'number' ? api.totalGainLoss : 0,
        totalGainLossPercentage:
            typeof api?.totalGainLossPercentage === 'number' ? api.totalGainLossPercentage : 0,
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

/** Portfolio history point: totalValue maps to chart `price`. */
export function normalizePortfolioHistoryPoint(api: any): PriceHistory {
    return {
        stockID: 'portfolio',
        timestamp: parseDate(api?.timestamp),
        price: typeof api?.totalValue === 'number' ? api.totalValue : 0,
        change: typeof api?.change === 'number' ? api.change : 0,
        changePercentage: typeof api?.changePercentage === 'number' ? api.changePercentage : 0,
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
