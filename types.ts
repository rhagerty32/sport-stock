// Core Entities
export type Stock = {
    id: number;
    name: string;
    leagueID: number;
    photoURL: string;
    price: number;
    volume: number;
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
};

export type User = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    birthday: Date;
    photoURL: string;
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
    shares: number;
    avgCostPerShare: number;
    currentValue: number;
    totalGainLoss: number;
    gainLossPercentage: number;
    colors: Color[];
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
