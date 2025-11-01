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
    'NCAA Basketball': ['#9E1B32', '#0C2340', '#0033A0', '#FF8200', '#9D2235', '#0021A5', '#461D7C', '#76232F', '#002147', '#73000A', '#BA0C2F', '#866D4B', '#F1B82D', '#500000', '#001A57', '#7BAFD4', '#232D4B', '#AD0000', '#D44500', '#782F40', '#004C97', '#630031', '#CC0000', '#9E1B32', '#F66733', '#00263A', '#8B0000', '#003594', '#0C2340', '#18453B', '#00274C', '#BB0000', '#CEB888', '#13294B', '#C5050C', '#990000', '#000000', '#E03A3E', '#7A0019', '#E31C23', '#4E2A84', '#002E5C', '#CC0033', '#0051BA', '#BF5700', '#1B4D3E', '#841617', '#FF7300', '#CC0000', '#CC0000', '#512888', '#002855', '#4D1979', '#C8102E', '#E00122', '#002255', '#000000', '#2774AE', '#003366', '#154733', '#990000', '#8C1515', '#4B2E83', '#CFB53B', '#CC0000', '#8C1D40', '#D73F09', '#981E32', '#003262', '#00205B', '#000E2F', '#0033A0', '#0C2340', '#003087', '#1E3A8A', '#000000', '#C41E3A', '#003366', '#041E42', '#1B365D', '#041E42', '#003087', '#FFC72C', '#C41E3A', '#003366', '#8B0000', '#002255', '#FFB300', '#CC0000', '#8B0000'],
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
    {
        id: 5,
        name: 'NCAA Basketball',
        marketCap: 2000000000,
        volume: 300000000,
        photoURL: 'https://via.placeholder.com/100x100/1E3A8A/FFFFFF?text=NCAA',
        sport: 'Basketball',
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

    // Mens College Basketball Teams
    { id: 31, name: 'Alabama Crimson Tide', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/9E1B32/FFFFFF?text=ALA', price: 45.80, volume: 180000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 32, name: 'Auburn Tigers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/0C2340/FFFFFF?text=AUB', price: 42.30, volume: 165000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 33, name: 'Kentucky Wildcats', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/0033A0/FFFFFF?text=UK', price: 58.75, volume: 220000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 34, name: 'Tennessee Volunteers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/FF8200/FFFFFF?text=TENN', price: 38.90, volume: 150000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 35, name: 'Arkansas Razorbacks', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/9D2235/FFFFFF?text=ARK', price: 35.60, volume: 140000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 36, name: 'Florida Gators', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/0021A5/FFFFFF?text=UF', price: 41.25, volume: 160000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 37, name: 'LSU Tigers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/461D7C/FFFFFF?text=LSU', price: 33.80, volume: 135000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 38, name: 'Mississippi State Bulldogs', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/76232F/FFFFFF?text=MSST', price: 28.45, volume: 120000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 39, name: 'Ole Miss Rebels', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/002147/FFFFFF?text=OM', price: 26.70, volume: 110000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 40, name: 'South Carolina Gamecocks', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/73000A/FFFFFF?text=SC', price: 24.85, volume: 105000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 41, name: 'Georgia Bulldogs', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/BA0C2F/FFFFFF?text=UGA', price: 22.30, volume: 95000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 42, name: 'Vanderbilt Commodores', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/866D4B/FFFFFF?text=VAN', price: 20.15, volume: 85000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 43, name: 'Missouri Tigers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/F1B82D/000000?text=MIZ', price: 18.90, volume: 80000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 44, name: 'Texas A&M Aggies', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/500000/FFFFFF?text=TAMU', price: 32.40, volume: 130000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },

    // ACC Teams
    { id: 45, name: 'Duke Blue Devils', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/001A57/FFFFFF?text=DUKE', price: 72.85, volume: 280000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 46, name: 'North Carolina Tar Heels', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/7BAFD4/FFFFFF?text=UNC', price: 68.50, volume: 260000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 47, name: 'Virginia Cavaliers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/232D4B/FFFFFF?text=UVA', price: 52.30, volume: 200000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 48, name: 'Louisville Cardinals', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/AD0000/FFFFFF?text=LOU', price: 38.75, volume: 155000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 49, name: 'Syracuse Orange', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/D44500/FFFFFF?text=SYR', price: 35.20, volume: 145000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 50, name: 'Florida State Seminoles', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/782F40/FFFFFF?text=FSU', price: 31.85, volume: 135000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 51, name: 'Miami Hurricanes', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/004C97/FFFFFF?text=MIA', price: 29.40, volume: 125000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 52, name: 'Virginia Tech Hokies', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/630031/FFFFFF?text=VT', price: 27.65, volume: 115000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 53, name: 'NC State Wolfpack', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/CC0000/FFFFFF?text=NCST', price: 25.80, volume: 110000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 54, name: 'Wake Forest Demon Deacons', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/9E1B32/FFFFFF?text=WAKE', price: 23.45, volume: 100000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 55, name: 'Clemson Tigers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/F66733/FFFFFF?text=CLEM', price: 21.90, volume: 95000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 56, name: 'Georgia Tech Yellow Jackets', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/00263A/FFFFFF?text=GT', price: 20.35, volume: 90000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 57, name: 'Boston College Eagles', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/8B0000/FFFFFF?text=BC', price: 18.70, volume: 85000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 58, name: 'Pittsburgh Panthers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/003594/FFFFFF?text=PITT', price: 17.25, volume: 80000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 59, name: 'Notre Dame Fighting Irish', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/0C2340/FFFFFF?text=ND', price: 45.60, volume: 175000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },

    // Big Ten Teams
    { id: 60, name: 'Michigan State Spartans', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/18453B/FFFFFF?text=MSU', price: 55.40, volume: 210000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 61, name: 'Michigan Wolverines', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/00274C/FFFFFF?text=MICH', price: 48.75, volume: 190000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 62, name: 'Ohio State Buckeyes', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/BB0000/FFFFFF?text=OSU', price: 46.20, volume: 185000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 63, name: 'Purdue Boilermakers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/CEB888/000000?text=PUR', price: 42.85, volume: 170000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 64, name: 'Illinois Fighting Illini', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/13294B/FFFFFF?text=ILL', price: 39.50, volume: 160000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 65, name: 'Wisconsin Badgers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/C5050C/FFFFFF?text=WISC', price: 36.80, volume: 150000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 66, name: 'Indiana Hoosiers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/990000/FFFFFF?text=IU', price: 34.25, volume: 145000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 67, name: 'Iowa Hawkeyes', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/000000/FFFFFF?text=IOWA', price: 31.90, volume: 135000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 68, name: 'Maryland Terrapins', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/E03A3E/FFFFFF?text=MD', price: 29.65, volume: 125000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 69, name: 'Minnesota Golden Gophers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/7A0019/FFFFFF?text=MINN', price: 27.40, volume: 115000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 70, name: 'Nebraska Cornhuskers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/E31C23/FFFFFF?text=NEB', price: 25.15, volume: 105000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 71, name: 'Northwestern Wildcats', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/4E2A84/FFFFFF?text=NU', price: 22.80, volume: 95000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 72, name: 'Penn State Nittany Lions', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/002E5C/FFFFFF?text=PSU', price: 20.45, volume: 85000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 73, name: 'Rutgers Scarlet Knights', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/CC0033/FFFFFF?text=RUT', price: 18.20, volume: 80000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },

    // Big 12 Teams
    { id: 74, name: 'Kansas Jayhawks', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/0051BA/FFFFFF?text=KU', price: 65.30, volume: 250000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 75, name: 'Texas Longhorns', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/BF5700/FFFFFF?text=TEX', price: 52.85, volume: 205000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 76, name: 'Baylor Bears', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/1B4D3E/FFFFFF?text=BAY', price: 48.40, volume: 190000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 77, name: 'Oklahoma Sooners', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/841617/FFFFFF?text=OU', price: 44.75, volume: 180000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 78, name: 'Oklahoma State Cowboys', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/FF7300/FFFFFF?text=OSU', price: 41.20, volume: 170000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 79, name: 'Iowa State Cyclones', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/CC0000/FFFFFF?text=ISU', price: 37.85, volume: 155000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 80, name: 'Texas Tech Red Raiders', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/CC0000/FFFFFF?text=TTU', price: 34.50, volume: 145000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 81, name: 'Kansas State Wildcats', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/512888/FFFFFF?text=KSU', price: 31.15, volume: 135000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 82, name: 'West Virginia Mountaineers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/002855/FFFFFF?text=WVU', price: 28.80, volume: 125000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 83, name: 'TCU Horned Frogs', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/4D1979/FFFFFF?text=TCU', price: 26.45, volume: 115000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 84, name: 'Houston Cougars', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/C8102E/FFFFFF?text=UH', price: 24.10, volume: 105000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 85, name: 'Cincinnati Bearcats', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/E00122/FFFFFF?text=CIN', price: 21.75, volume: 95000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 87, name: 'UCF Knights', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/000000/FFFFFF?text=UCF', price: 17.05, volume: 80000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },

    // Pac-12 Teams
    { id: 88, name: 'UCLA Bruins', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/2774AE/FFFFFF?text=UCLA', price: 58.90, volume: 225000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 89, name: 'Arizona Wildcats', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/003366/FFFFFF?text=ARIZ', price: 55.25, volume: 215000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 90, name: 'Oregon Ducks', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/154733/FFFFFF?text=ORE', price: 51.80, volume: 200000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 91, name: 'USC Trojans', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/990000/FFFFFF?text=USC', price: 48.35, volume: 185000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 92, name: 'Stanford Cardinal', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/8C1515/FFFFFF?text=STAN', price: 44.90, volume: 175000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 93, name: 'Washington Huskies', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/4B2E83/FFFFFF?text=UW', price: 41.45, volume: 165000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 94, name: 'Colorado Buffaloes', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/CFB53B/000000?text=COLO', price: 38.00, volume: 155000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 95, name: 'Utah Utes', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/CC0000/FFFFFF?text=UTAH', price: 34.55, volume: 145000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 96, name: 'Arizona State Sun Devils', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/8C1D40/FFFFFF?text=ASU', price: 31.10, volume: 135000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 97, name: 'Oregon State Beavers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/D73F09/FFFFFF?text=OSU', price: 27.65, volume: 125000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 98, name: 'Washington State Cougars', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/981E32/FFFFFF?text=WSU', price: 24.20, volume: 115000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 99, name: 'California Golden Bears', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/003262/FFFFFF?text=CAL', price: 20.75, volume: 105000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },

    // Big East Teams
    { id: 100, name: 'Villanova Wildcats', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/00205B/FFFFFF?text=NOVA', price: 62.40, volume: 240000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 101, name: 'Connecticut Huskies', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/000E2F/FFFFFF?text=UCONN', price: 59.85, volume: 230000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 102, name: 'Creighton Bluejays', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/0033A0/FFFFFF?text=CREI', price: 46.30, volume: 180000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 103, name: 'Xavier Musketeers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/0C2340/FFFFFF?text=XAV', price: 42.75, volume: 170000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 104, name: 'Marquette Golden Eagles', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/003087/FFFFFF?text=MARQ', price: 39.20, volume: 160000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 105, name: 'Seton Hall Pirates', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/1E3A8A/FFFFFF?text=SHU', price: 35.65, volume: 150000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 106, name: 'Providence Friars', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/000000/FFFFFF?text=PROV', price: 32.10, volume: 140000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 107, name: 'St. John\'s Red Storm', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/C41E3A/FFFFFF?text=SJU', price: 28.55, volume: 130000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 108, name: 'Butler Bulldogs', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/003366/FFFFFF?text=BUT', price: 25.00, volume: 120000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 109, name: 'Georgetown Hoyas', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/041E42/FFFFFF?text=GU', price: 21.45, volume: 110000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 110, name: 'DePaul Blue Demons', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/1B365D/FFFFFF?text=DPU', price: 17.90, volume: 100000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },

    // Other Notable Teams
    { id: 111, name: 'Gonzaga Bulldogs', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/041E42/FFFFFF?text=GONZ', price: 56.75, volume: 220000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 112, name: 'Memphis Tigers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/003087/FFFFFF?text=MEM', price: 33.20, volume: 140000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 113, name: 'Wichita State Shockers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/FFC72C/000000?text=WSU', price: 29.85, volume: 130000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 114, name: 'Dayton Flyers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/C41E3A/FFFFFF?text=DAY', price: 26.50, volume: 120000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 115, name: 'Saint Mary\'s Gaels', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/003366/FFFFFF?text=SMC', price: 23.15, volume: 110000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 116, name: 'San Diego State Aztecs', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/8B0000/FFFFFF?text=SDSU', price: 19.80, volume: 100000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 117, name: 'BYU Cougars', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/002255/FFFFFF?text=BYU', price: 16.45, volume: 90000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 118, name: 'VCU Rams', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/FFB300/000000?text=VCU', price: 13.10, volume: 80000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 119, name: 'Davidson Wildcats', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/CC0000/FFFFFF?text=DAV', price: 9.75, volume: 70000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },
    { id: 120, name: 'Loyola Chicago Ramblers', leagueID: 5, photoURL: 'https://via.placeholder.com/100x100/8B0000/FFFFFF?text=LUC', price: 6.40, volume: 60000, createdAt: new Date('2020-01-01'), updatedAt: new Date() },

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

// Generate users
export const user: User = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1 (555) 123-4567',
    birthday: new Date('1990-05-15'),
    photoURL: 'https://via.placeholder.com/150x150/217C0A/FFFFFF?text=JD',
    public: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
};

export const users: User[] = [
    user,
    {
        id: 2,
        firstName: 'Sarah',
        lastName: 'Smith',
        email: 'sarah.smith@example.com',
        phoneNumber: '+1 (555) 234-5678',
        birthday: new Date('1992-08-22'),
        photoURL: 'https://via.placeholder.com/150x150/E31837/FFFFFF?text=SS',
        public: true,
        createdAt: new Date('2023-02-15'),
        updatedAt: new Date(),
    },
    {
        id: 3,
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'michael.johnson@example.com',
        phoneNumber: '+1 (555) 345-6789',
        birthday: new Date('1988-03-10'),
        photoURL: 'https://via.placeholder.com/150x150/00338D/FFFFFF?text=MJ',
        public: true,
        createdAt: new Date('2023-01-20'),
        updatedAt: new Date(),
    },
    {
        id: 4,
        firstName: 'Emily',
        lastName: 'Williams',
        email: 'emily.williams@example.com',
        phoneNumber: '+1 (555) 456-7890',
        birthday: new Date('1995-11-05'),
        photoURL: 'https://via.placeholder.com/150x150/552583/FFFFFF?text=EW',
        public: false,
        createdAt: new Date('2023-03-01'),
        updatedAt: new Date(),
    },
    {
        id: 5,
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@example.com',
        phoneNumber: '+1 (555) 567-8901',
        birthday: new Date('1991-07-18'),
        photoURL: 'https://via.placeholder.com/150x150/1D428A/FFFFFF?text=DB',
        public: true,
        createdAt: new Date('2023-02-10'),
        updatedAt: new Date(),
    },
    {
        id: 6,
        firstName: 'Jessica',
        lastName: 'Davis',
        email: 'jessica.davis@example.com',
        phoneNumber: '+1 (555) 678-9012',
        birthday: new Date('1993-09-25'),
        photoURL: 'https://via.placeholder.com/150x150/007A33/FFFFFF?text=JD',
        public: false,
        createdAt: new Date('2023-04-15'),
        updatedAt: new Date(),
    },
    {
        id: 7,
        firstName: 'Chris',
        lastName: 'Miller',
        email: 'chris.miller@example.com',
        phoneNumber: '+1 (555) 789-0123',
        birthday: new Date('1989-12-30'),
        photoURL: 'https://via.placeholder.com/150x150/CE1141/FFFFFF?text=CM',
        public: true,
        createdAt: new Date('2023-01-05'),
        updatedAt: new Date(),
    },
    {
        id: 8,
        firstName: 'Amanda',
        lastName: 'Wilson',
        email: 'amanda.wilson@example.com',
        phoneNumber: '+1 (555) 890-1234',
        birthday: new Date('1994-04-12'),
        photoURL: 'https://via.placeholder.com/150x150/98002E/FFFFFF?text=AW',
        public: true,
        createdAt: new Date('2023-03-20'),
        updatedAt: new Date(),
    },
    {
        id: 9,
        firstName: 'Ryan',
        lastName: 'Taylor',
        email: 'ryan.taylor@example.com',
        phoneNumber: '+1 (555) 901-2345',
        birthday: new Date('1990-06-08'),
        photoURL: 'https://via.placeholder.com/150x150/006BB6/FFFFFF?text=RT',
        public: false,
        createdAt: new Date('2023-02-28'),
        updatedAt: new Date(),
    },
    {
        id: 10,
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson@example.com',
        phoneNumber: '+1 (555) 012-3456',
        birthday: new Date('1992-10-15'),
        photoURL: 'https://via.placeholder.com/150x150/1D1160/FFFFFF?text=LA',
        public: true,
        createdAt: new Date('2023-01-25'),
        updatedAt: new Date(),
    },
];

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

// Generate portfolios for different users
const generateUserPortfolio = (userId: number, stockIds: number[]): Portfolio => {
    const userPositions: Position[] = stockIds.map((stockId) => {
        const stock = stocks.find(s => s.id === stockId);
        if (!stock) {
            console.warn(`Stock with ID ${stockId} not found`);
            return null;
        }
        const shares = Math.random() * 20 + 5; // Random shares between 5-25
        const avgCostPerShare = stock.price * (0.9 + Math.random() * 0.2); // Random cost between 90-110% of current price
        const currentValue = shares * stock.price;
        const totalGainLoss = currentValue - (shares * avgCostPerShare);
        const gainLossPercentage = (totalGainLoss / (shares * avgCostPerShare)) * 100;

        // Find color by stockID string
        const stockColor = colors.find(c => c.stockID === stockId.toString());

        return {
            stock,
            shares: Math.round(shares * 10) / 10,
            avgCostPerShare: Math.round(avgCostPerShare * 100) / 100,
            currentValue: Math.round(currentValue * 100) / 100,
            totalGainLoss: Math.round(totalGainLoss * 100) / 100,
            gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
            colors: stockColor ? [stockColor] : [],
        };
    }).filter((pos): pos is Position => pos !== null);

    const totalValue = userPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalInvested = userPositions.reduce((sum, pos) => sum + (pos.shares * pos.avgCostPerShare), 0);
    const totalGainLoss = totalValue - totalInvested;
    const totalGainLossPercentage = (totalGainLoss / totalInvested) * 100;

    return {
        totalValue: Math.round(totalValue * 100) / 100,
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalGainLoss: Math.round(totalGainLoss * 100) / 100,
        totalGainLossPercentage: Math.round(totalGainLossPercentage * 100) / 100,
        positions: userPositions,
    };
};

// User portfolios - each user has different stock holdings
export const userPortfolios: Record<number, Portfolio> = {
    1: portfolio, // John Doe - use existing portfolio
    2: generateUserPortfolio(2, [11, 12, 13, 14, 15]), // Sarah Smith - NBA focused
    3: generateUserPortfolio(3, [1, 2, 3, 4, 5, 6, 7]), // Michael Johnson - NFL focused
    4: generateUserPortfolio(4, [21, 22, 23, 24, 25]), // Emily Williams - MLB focused
    5: generateUserPortfolio(5, [26, 27, 28, 29, 30]), // David Brown - NHL focused
    6: generateUserPortfolio(6, [45, 46, 47, 48, 49]), // Jessica Davis - College Basketball
    7: generateUserPortfolio(7, [74, 75, 76, 77, 78]), // Chris Miller - Big 12 teams
    8: generateUserPortfolio(8, [88, 89, 90, 91, 92]), // Amanda Wilson - Pac-12 teams
    9: generateUserPortfolio(9, [100, 101, 102, 103]), // Ryan Taylor - Big East teams
    10: generateUserPortfolio(10, [1, 11, 21, 26, 45]), // Lisa Anderson - Mixed portfolio
};
