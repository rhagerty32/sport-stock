// Core Entities
export type Stock = {
    id: number;
    name: string;
    fullName: string;
    leagueID: number;
    photoURL: string;
    price: number;
    about: string;
    ticker: string;
    coach: string;
    founded: number;
    topThreePlayers: string[];
    volume: number;
    color: string;
    secondaryColor: string;
    createdAt: Date;
    updatedAt: Date;
};

export type League = {
    id: number;
    name: string;
    marketCap: number;
    volume: number;
    stocks?: Stock[];
    photoURL: string;
    sport: string;
    createdAt: Date;
    updatedAt: Date;
    playoffQuery: string;
    divisionQuery?: string;
    conferenceQuery?: string;
    championQuery: string;
};

export type User = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    birthday: Date;
    photoURL: string;
    public: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type Transaction = {
    id: number;
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
    totalPrice: number;
    userID: number;
    stockID: number;
    createdAt: Date;
    updatedAt: Date;
};

export type Follow = {
    id: number;
    userID: number;
    stockID: number;
    createdAt: Date;
    updatedAt: Date;
};

export type Movement = {
    id: number;
    type: 'deposit' | 'withdrawal';
    userID: number;
    amount: number;
    source: 'user' | 'system';
    destination: 'user' | 'system';
    paymentMethod: 'bank' | 'paypal' | 'stripe';
    createdAt: Date;
    updatedAt: Date;
};

export type Color = {
    id: number;
    stockID: string | null;
    leagueID: string | null;
    hex: string;
    createdAt: Date;
    updatedAt: Date;
};

// Computed Properties
export type Portfolio = {
    totalValue: number;
    totalInvested: number;
    totalGainLoss: number;
    totalGainLossPercentage: number;
    positions: Position[];
};

export type Position = {
    stock: Stock;
    entries: number;
    avgEntryPrice: number;
    currentValue: number;
    totalGainLoss: number;
    gainLossPercentage: number;
    colors: { hex: string }[];
};

export type PriceHistory = {
    stockID: number;
    timestamp: Date;
    price: number;
    change: number;
    changePercentage: number;
};

// Additional types for the app
export type NewsItem = {
    id: number;
    title: string;
    content: string;
    source: string;
    stockID?: number;
    leagueID?: number;
    photoURL?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type LiveGame = {
    id: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: 'live' | 'upcoming' | 'completed';
    startTime: Date;
    league: string;
};

export type TimePeriod = '1H' | '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y' | 'ALL';

export type OrderType = 'market' | 'limit' | 'stop';

export type OrderSide = 'buy' | 'sell';

export type Order = {
    id: number;
    stockID: number;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
    status: 'pending' | 'filled' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
};

export type FriendInvested = {
    user: User;
    position: Position;
};

// Wallet System Types
export type Wallet = {
    fanCoins: number;
    tradingCredits: number;
    userId: number;
    updatedAt: Date;
};

export type FanCoinPurchase = {
    id: number;
    userId: number;
    amount: number; // Amount in USD spent
    fanCoinsReceived: number; // FanCoins purchased (same as amount)
    tradingCreditsGranted: number; // Bonus credits granted
    bonusPercentage: number; // Bonus percentage applied
    paymentMethod: 'bank' | 'paypal' | 'stripe' | 'apple_pay' | 'google_pay';
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
};

export type CreditBonus = {
    id: number;
    userId: number;
    amount: number;
    reason: 'purchase_bonus' | 'first_time_bonus' | 'tier_bonus' | 'promotional';
    purchaseId?: number; // Link to purchase if applicable
    createdAt: Date;
};

export type BonusInfo = {
    baseMultiplier: number; // Base bonus percentage (e.g., 1.0 = 100%)
    tierMultipliers: {
        min: number;
        max: number;
        multiplier: number;
    }[];
    firstTimeBonus: number; // Additional bonus for first purchase (e.g., 0.2 = 20% extra)
};

export type PolymarketQuery = { q: string | null; };

export type PolymarketResponse = {
    events: PolymarketEvent[];
    pagination: {
        hasMore: boolean;
        totalResults: number;
    }
};

export type PolymarketEvent = {
    id: string;
    ticker: string;
    slug: string;
    title: string;
    description: string;
    startDate: string;
    creationDate: string;
    endDate: string;
    image: string;
    icon: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    new: boolean;
    featured: boolean;
    restricted: boolean;
    volume: number;
    openInterest: number;
    createdAt: string;
    updatedAt: string;
    volume1wk: number;
    volume1mo: number;
    volume1yr: number;
    enableOrderBook: boolean;
    negRisk: boolean;
    commentCount: number;
    markets: PolymarketMarket[];
    tags: PolymarketTag[];
    cyom: boolean;
    closedTime: string;
    showAllOutcomes: boolean;
    showMarketImages: boolean;
    automaticallyResolved: boolean;
    enableNegRisk: boolean;
    automaticallyActive: boolean;
    eventDate: string;
    startTime: string;
    eventWeek: number;
    seriesSlug: string;
    score: string;
    elapsed: string;
    period: string;
    live: boolean;
    ended: boolean;
    finishedTimestamp: string;
    negRiskAugmented: boolean;
    pendingDeployment: boolean;
    deploying: boolean;
    requiresTranslation: boolean;
}

export type PolymarketMarket = {
    id: string;
    question: string;
    conditionId: string;
    slug: string;
    resolutionSource: string;
    endDate: string;
    liquidity: number;
    startDate: string;
    image: string;
    icon: string;
    description: string;
    outcomes: string;
    outcomePrices: string;
    volume: string;
    active: boolean;
    closed: boolean;
    marketMakerAddress: string;
    createdAt: string;
    updatedAt: string;
    new: boolean;
    featured: boolean;
    submitted_by: string;
    archived: boolean;
    resolvedBy: string;
    restricted: boolean;
    groupItemTitle: string;
    groupItemThreshold: string;
    questionID: string;
    enableOrderBook: boolean;
    orderPriceMinTickSize: number;
    orderMinSize: number;
    volumeNum: number;
    liquidityNum: number;
    endDateIso: string;
    startDateIso: string;
    hasReviewedDates: boolean;
    volume24hr: number;
    volume1wk: number;
    volume1mo: number;
    volume1yr: number;
    gameStartTime: string;
    secondsDelay: number;
    clobTokenIds: string;
    umaBond: string;
    umaReward: string;
    volume24hrClob: number;
    volume1wkClob: number;
    volume1moClob: number;
    volume1yrClob: number;
    volumeClob: number;
    liquidityClob: number;
    customLiveness: number;
    acceptingOrders: boolean;
    negRisk: boolean;
    negRiskRequestID: string;
    ready: boolean;
    funded: boolean;
    acceptingOrdersTimestamp: string;
    cyom: boolean;
    competitive: number;
    pagerDutyNotificationEnabled: boolean;
    approved: boolean;
    rewardsMinSize: number;
    rewardsMaxSpread: number;
    spread: number;
    lastTradePrice: number;
    bestBid: number;
    bestAsk: number;
    automaticallyActive: boolean;
    clearBookOnStart: boolean;
    manualActivation: boolean;
    negRiskOther: boolean;
    sportsMarketType: string;
    line: number;
    umaResolutionStatuses: string;
    pendingDeployment: boolean;
    deploying: boolean;
    deployingTimestamp: string;
    rfqEnabled: boolean;
    holdingRewardsEnabled: boolean;
    feesEnabled: boolean;
    requiresTranslation: boolean;
}

export type PolymarketTag = {
    id: string;
    label: string;
    slug: string;
    forceShow: boolean;
    publishedAt: string;
    updatedBy: number;
    createdAt: string;
    updatedAt: string;
    forceHide: boolean;
    requiresTranslation: boolean;
}

export type NormalizedGameMarket = {
    game: string;
    slug: string;
    startTime: string;

    moneyline?: {
        outcomes: string[];
        prices: number[];
        liquidity: number;
        volume24h: number;
        spread: number;
        priceChange1d?: number;
    };

    spread?: {
        line: number;
        outcomes: string[];
        prices: number[];
        liquidity: number;
        volume24h: number;
    };

    total?: {
        line: number;
        outcomes: string[];
        prices: number[];
        liquidity: number;
        volume24h: number;
    };
};

export type PolymarketData = {
    game: string;
    slug: string;
    startTime: string;
    moneyline?: any;
    spread?: any;
    total?: any;
};