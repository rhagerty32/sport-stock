import { Color, Follow, League, LiveGame, Movement, NewsItem, Portfolio, Position, PriceHistory, Stock, Transaction, User } from '@/types';

// Generate random price data
const generatePriceHistory = (stockId: number, days: number = 365): PriceHistory[] => {
    const history: PriceHistory[] = [];
    let currentPrice = Math.random() * 100 + 20; // Start between $20-$120

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));

        // Random walk with slight upward bias
        const change = (Math.random() - 0.45) * 0.05; // Slight upward bias
        currentPrice = Math.max(1, currentPrice * (1 + change));

        const changeAmount = i > 0 ? currentPrice - history[i - 1].price : 0;
        const changePercentage = i > 0 ? (changeAmount / history[i - 1].price) * 100 : 0;

        history.push({
            stockID: stockId,
            timestamp: date,
            price: Math.round(currentPrice * 100) / 100,
            change: Math.round(changeAmount * 100) / 100,
            changePercentage: Math.round(changePercentage * 100) / 100,
        });
    }

    return history;
};

// Team colors for each league
const teamColors: Record<string, string[]> = {
    NFL: ['#013369', '#D50A0A', '#0C2340', '#4B92DB', '#203731', '#A71930', '#0B162A', '#C60C30', '#00338D', '#FFB612'],
    NBA: ['#1D1160', '#C8102E', '#0E2240', '#CE1141', '#1D1160', '#C8102E', '#0E2240', '#CE1141', '#1D1160', '#C8102E'],
    MLB: ['#0C2340', '#C8102E', '#132448', '#CE1141', '#0C2340'],
    NHL: ['#003E7E', '#C8102E', '#0C2340', '#CE1141', '#003E7E'],
};

// Generate leagues
export const leagues: League[] = [
    {
        id: 1,
        name: 'NFL',
        marketCap: 150000000000,
        volume: 2500000000,
        photoURL: 'https://via.placeholder.com/100x100/013369/FFFFFF?text=NFL',
        sport: 'Football',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date(),
    },
    {
        id: 2,
        name: 'NBA',
        marketCap: 75000000000,
        volume: 1200000000,
        photoURL: 'https://via.placeholder.com/100x100/1D1160/FFFFFF?text=NBA',
        sport: 'Basketball',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date(),
    },
    {
        id: 3,
        name: 'MLB',
        marketCap: 10000000000,
        volume: 800000000,
        photoURL: 'https://via.placeholder.com/100x100/0C2340/FFFFFF?text=MLB',
        sport: 'Baseball',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date(),
    },
    {
        id: 4,
        name: 'NHL',
        marketCap: 5000000000,
        volume: 400000000,
        photoURL: 'https://via.placeholder.com/100x100/003E7E/FFFFFF?text=NHL',
        sport: 'Hockey',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date(),
    },
];

// Generate stocks (teams)
export const stocks: Stock[] = [
    // NFL Teams
    { id: 1, name: 'Kansas City Chiefs', leagueID: 1, photoURL: 'https://via.placeholder.com/100x100/E31837/FFFFFF?text=KC', price: 125.50, volume: 1500000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 2, name: 'Buffalo Bills', leagueID: 1, photoURL: 'https://via.placeholder.com/100x100/00338D/FFFFFF?text=BUF', price: 98.75, volume: 1200000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 3, name: 'Dallas Cowboys', leagueID: 1, photoURL: 'https://via.placeholder.com/100x100/003594/FFFFFF?text=DAL', price: 145.25, volume: 1800000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 4, name: 'Green Bay Packers', leagueID: 1, photoURL: 'https://via.placeholder.com/100x100/203731/FFFFFF?text=GB', price: 112.80, volume: 1100000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 5, name: 'New England Patriots', leagueID: 1, photoURL: 'https://via.placeholder.com/100x100/002244/FFFFFF?text=NE', price: 89.45, volume: 950000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 6, name: 'Pittsburgh Steelers', leagueID: 1, photoURL: 'https://via.placeholder.com/100x100/FFB612/000000?text=PIT', price: 103.20, volume: 1050000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 7, name: 'San Francisco 49ers', leagueID: 1, photoURL: 'https://via.placeholder.com/100x100/AA0000/FFFFFF?text=SF', price: 118.90, volume: 1300000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 8, name: 'Tampa Bay Buccaneers', leagueID: 1, photoURL: 'https://via.placeholder.com/100x100/D50A0A/FFFFFF?text=TB', price: 95.60, volume: 900000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 9, name: 'Los Angeles Rams', leagueID: 1, photoURL: 'https://via.placeholder.com/100x100/003594/FFFFFF?text=LAR', price: 107.35, volume: 1000000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 10, name: 'Miami Dolphins', leagueID: 1, photoURL: 'https://via.placeholder.com/100x100/008E97/FFFFFF?text=MIA', price: 82.15, volume: 850000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },

    // NBA Teams
    { id: 11, name: 'Los Angeles Lakers', leagueID: 2, photoURL: 'https://via.placeholder.com/100x100/552583/FFFFFF?text=LAL', price: 156.80, volume: 2000000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 12, name: 'Golden State Warriors', leagueID: 2, photoURL: 'https://via.placeholder.com/100x100/1D428A/FFFFFF?text=GSW', price: 142.50, volume: 1800000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 13, name: 'Boston Celtics', leagueID: 2, photoURL: 'https://via.placeholder.com/100x100/007A33/FFFFFF?text=BOS', price: 138.25, volume: 1700000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 14, name: 'Chicago Bulls', leagueID: 2, photoURL: 'https://via.placeholder.com/100x100/CE1141/FFFFFF?text=CHI', price: 125.90, volume: 1500000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 15, name: 'Miami Heat', leagueID: 2, photoURL: 'https://via.placeholder.com/100x100/98002E/FFFFFF?text=MIA', price: 118.75, volume: 1400000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 16, name: 'New York Knicks', leagueID: 2, photoURL: 'https://via.placeholder.com/100x100/006BB6/FFFFFF?text=NYK', price: 135.40, volume: 1600000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 17, name: 'Phoenix Suns', leagueID: 2, photoURL: 'https://via.placeholder.com/100x100/1D1160/FFFFFF?text=PHX', price: 112.30, volume: 1300000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 18, name: 'Denver Nuggets', leagueID: 2, photoURL: 'https://via.placeholder.com/100x100/0E2240/FFFFFF?text=DEN', price: 128.65, volume: 1450000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 19, name: 'Milwaukee Bucks', leagueID: 2, photoURL: 'https://via.placeholder.com/100x100/00471B/FFFFFF?text=MIL', price: 121.80, volume: 1350000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 20, name: 'Philadelphia 76ers', leagueID: 2, photoURL: 'https://via.placeholder.com/100x100/006BB6/FFFFFF?text=PHI', price: 115.45, volume: 1250000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },

    // MLB Teams
    { id: 21, name: 'New York Yankees', leagueID: 3, photoURL: 'https://via.placeholder.com/100x100/132448/FFFFFF?text=NYY', price: 89.75, volume: 800000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 22, name: 'Los Angeles Dodgers', leagueID: 3, photoURL: 'https://via.placeholder.com/100x100/005A9C/FFFFFF?text=LAD', price: 95.20, volume: 850000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 23, name: 'Boston Red Sox', leagueID: 3, photoURL: 'https://via.placeholder.com/100x100/BD3039/FFFFFF?text=BOS', price: 78.90, volume: 750000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 24, name: 'Chicago Cubs', leagueID: 3, photoURL: 'https://via.placeholder.com/100x100/0E3386/FFFFFF?text=CHC', price: 82.45, volume: 780000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 25, name: 'San Francisco Giants', leagueID: 3, photoURL: 'https://via.placeholder.com/100x100/FD5A1E/FFFFFF?text=SF', price: 76.30, volume: 720000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },

    // NHL Teams
    { id: 26, name: 'Toronto Maple Leafs', leagueID: 4, photoURL: 'https://via.placeholder.com/100x100/003E7E/FFFFFF?text=TOR', price: 65.80, volume: 600000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 27, name: 'Montreal Canadiens', leagueID: 4, photoURL: 'https://via.placeholder.com/100x100/AF1E2D/FFFFFF?text=MTL', price: 58.45, volume: 550000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 28, name: 'Boston Bruins', leagueID: 4, photoURL: 'https://via.placeholder.com/100x100/FFB81C/000000?text=BOS', price: 62.90, volume: 580000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 29, name: 'New York Rangers', leagueID: 4, photoURL: 'https://via.placeholder.com/100x100/0038A8/FFFFFF?text=NYR', price: 59.75, volume: 560000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 30, name: 'Chicago Blackhawks', leagueID: 4, photoURL: 'https://via.placeholder.com/100x100/CF0A2C/FFFFFF?text=CHI', price: 55.20, volume: 520000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
];

// Generate colors for teams
export const colors: Color[] = stocks.map((stock, index) => ({
    id: index + 1,
    stockID: stock.id.toString(),
    leagueID: null,
    hex: teamColors[leagues.find(l => l.id === stock.leagueID)?.name || 'NFL'][index % 10],
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date(),
}));

// Generate user
export const user: User = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1 (555) 123-4567',
    birthday: new Date('1990-05-15'),
    photoURL: 'https://via.placeholder.com/150x150/217C0A/FFFFFF?text=JD',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
};

// Generate sample positions for portfolio
export const positions: Position[] = [
    {
        stock: stocks[0], // Kansas City Chiefs
        shares: 15.5,
        avgCostPerShare: 118.25,
        currentValue: 1945.25,
        totalGainLoss: 112.50,
        gainLossPercentage: 6.14,
        colors: [colors[0]],
    },
    {
        stock: stocks[10], // Los Angeles Lakers
        shares: 8.0,
        avgCostPerShare: 145.80,
        currentValue: 1254.40,
        totalGainLoss: 88.00,
        gainLossPercentage: 7.54,
        colors: [colors[10]],
    },
    {
        stock: stocks[1], // Buffalo Bills
        shares: 12.0,
        avgCostPerShare: 95.50,
        currentValue: 1185.00,
        totalGainLoss: 39.00,
        gainLossPercentage: 3.40,
        colors: [colors[1]],
    },
    {
        stock: stocks[20], // New York Yankees
        shares: 20.0,
        avgCostPerShare: 85.25,
        currentValue: 1795.00,
        totalGainLoss: 90.00,
        gainLossPercentage: 5.28,
        colors: [colors[20]],
    },
    {
        stock: stocks[11], // Golden State Warriors
        shares: 6.5,
        avgCostPerShare: 135.20,
        currentValue: 926.25,
        totalGainLoss: -47.55,
        gainLossPercentage: -4.89,
        colors: [colors[11]],
    },
];

// Generate portfolio
export const portfolio: Portfolio = {
    totalValue: 7106.90,
    totalInvested: 7034.85,
    totalGainLoss: 282.95,
    totalGainLossPercentage: 4.02,
    positions,
};

// Generate transactions
export const transactions: Transaction[] = [
    {
        id: 1,
        action: 'buy',
        quantity: 15.5,
        price: 118.25,
        totalPrice: 1832.88,
        userID: 1,
        stockID: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    },
    {
        id: 2,
        action: 'buy',
        quantity: 8.0,
        price: 145.80,
        totalPrice: 1166.40,
        userID: 1,
        stockID: 11,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10'),
    },
    {
        id: 3,
        action: 'sell',
        quantity: 2.0,
        price: 125.50,
        totalPrice: 251.00,
        userID: 1,
        stockID: 1,
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05'),
    },
];

// Generate news items
export const newsItems: NewsItem[] = [
    {
        id: 1,
        title: 'Chiefs Win Super Bowl LVIII',
        content: 'The Kansas City Chiefs defeated the San Francisco 49ers in overtime to win their third Super Bowl in five years.',
        source: 'ESPN',
        stockID: 1,
        photoURL: 'https://via.placeholder.com/300x200/E31837/FFFFFF?text=Super+Bowl',
        createdAt: new Date('2024-02-11'),
        updatedAt: new Date('2024-02-11'),
    },
    {
        id: 2,
        title: 'Lakers Sign New Star Player',
        content: 'The Los Angeles Lakers have signed a major free agent to strengthen their championship aspirations.',
        source: 'NBA.com',
        stockID: 11,
        photoURL: 'https://via.placeholder.com/300x200/552583/FFFFFF?text=Lakers',
        createdAt: new Date('2024-02-08'),
        updatedAt: new Date('2024-02-08'),
    },
    {
        id: 3,
        title: 'NFL Draft Results Impact Team Values',
        content: 'Several teams saw significant value changes following the NFL Draft, with quarterback selections driving the biggest moves.',
        source: 'NFL Network',
        leagueID: 1,
        photoURL: 'https://via.placeholder.com/300x200/013369/FFFFFF?text=NFL+Draft',
        createdAt: new Date('2024-04-25'),
        updatedAt: new Date('2024-04-25'),
    },
];

// Generate live games
export const liveGames: LiveGame[] = [
    {
        id: 1,
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        homeScore: 24,
        awayScore: 21,
        status: 'live',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        league: 'NFL',
    },
    {
        id: 2,
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeScore: 0,
        awayScore: 0,
        status: 'upcoming',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        league: 'NBA',
    },
    {
        id: 3,
        homeTeam: 'New York Yankees',
        awayTeam: 'Boston Red Sox',
        homeScore: 7,
        awayScore: 4,
        status: 'completed',
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        league: 'MLB',
    },
];

// Generate price history for all stocks
export const priceHistory: PriceHistory[] = stocks.flatMap(stock => generatePriceHistory(stock.id));

// Generate movements (deposits/withdrawals)
export const movements: Movement[] = [
    {
        id: 1,
        type: 'deposit',
        userID: 1,
        amount: 5000.00,
        source: 'user',
        destination: 'system',
        paymentMethod: 'bank',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 2,
        type: 'deposit',
        userID: 1,
        amount: 2500.00,
        source: 'user',
        destination: 'system',
        paymentMethod: 'bank',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
    },
];

// Generate follows
export const follows: Follow[] = [
    { id: 1, userID: 1, stockID: 1, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 2, userID: 1, stockID: 11, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 3, userID: 1, stockID: 2, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 4, userID: 1, stockID: 20, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
    { id: 5, userID: 1, stockID: 12, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
];
