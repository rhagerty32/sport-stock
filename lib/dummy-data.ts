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
        playoffQuery: 'nfl playoffs',
        divisionQuery: 'nfl division champion',
        conferenceQuery: 'nfl conference champion',
        championQuery: 'nfl champion',
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
        playoffQuery: 'Which teams will make the NBA Playoffs',
        championQuery: 'nba champion',
    },
    {
        id: 3,
        name: 'NCAA Basketball',
        marketCap: 2000000000,
        volume: 300000000,
        photoURL: 'https://via.placeholder.com/100x100/1E3A8A/FFFFFF?text=NCAA',
        sport: 'Basketball',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date(),
        playoffQuery: 'ncaa basketball playoffs',
        conferenceQuery: 'ncaa basketball conference champion',
        championQuery: 'big 10 championship basketball',
    },
    {
        id: 4,
        name: 'NCAA Football',
        marketCap: 2000000000,
        volume: 300000000,
        photoURL: 'https://via.placeholder.com/100x100/1E3A8A/FFFFFF?text=NCAA',
        sport: 'Football',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date(),
        playoffQuery: 'ncaa football playoffs',
        conferenceQuery: 'ncaa football conference champion',
        championQuery: 'ncaa football champion',
    },
];


// Helper function to create stock with all required fields
const createStock = (
    id: number,
    name: string,
    fullName: string,
    leagueID: number,
    photoURL: string,
    price: number,
    volume: number,
    about: string,
    ticker: string,
    coach: string,
    founded: number,
    topThreePlayers: string[],
    color: string,
    secondaryColor: string
): Stock => ({
    id,
    name,
    fullName,
    leagueID,
    photoURL,
    price,
    volume,
    about,
    ticker,
    coach,
    founded,
    topThreePlayers,
    color,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date(),
    secondaryColor,
});

// Generate stocks (teams)
export const stocks: Stock[] = [
    // NFL Teams
    createStock(1, 'KC Chiefs', 'Kansas City Chiefs', 1, 'https://via.placeholder.com/100x100/E31837/FFFFFF?text=KC', 125.50, 1500000, 'The Kansas City Chiefs are a professional American football team based in Kansas City, Missouri.', 'KC', 'Andy Reid', 1960, ['Patrick Mahomes', 'Travis Kelce', 'Tyreek Hill'], '#E31837', '#FFB612'),
    createStock(2, 'BUF Bills', 'Buffalo Bills', 1, 'https://via.placeholder.com/100x100/00338D/FFFFFF?text=BUF', 98.75, 1200000, 'The Buffalo Bills are a professional American football team based in the Buffalo metropolitan area.', 'BUF', 'Sean McDermott', 1960, ['Josh Allen', 'Stefon Diggs', 'Von Miller'], '#00338D', '#C60C30'),
    createStock(3, 'DAL Cowboys', 'Dallas Cowboys', 1, 'https://via.placeholder.com/100x100/003594/FFFFFF?text=DAL', 145.25, 1800000, 'The Dallas Cowboys are a professional American football team based in the Dallas–Fort Worth metroplex.', 'DAL', 'Mike McCarthy', 1960, ['Dak Prescott', 'CeeDee Lamb', 'Micah Parsons'], '#003594', '#869397'),
    createStock(4, 'GB Packers', 'Green Bay Packers', 1, 'https://via.placeholder.com/100x100/203731/FFFFFF?text=GB', 112.80, 1100000, 'The Green Bay Packers are a professional American football team based in Green Bay, Wisconsin.', 'GB', 'Matt LaFleur', 1921, ['Aaron Rodgers', 'Davante Adams', 'Jaire Alexander'], '#203731', '#FFB612'),
    createStock(5, 'NE Patriots', 'New England Patriots', 1, 'https://via.placeholder.com/100x100/002244/FFFFFF?text=NE', 89.45, 950000, 'The New England Patriots are a professional American football team based in the Greater Boston area.', 'NE', 'Bill Belichick', 1960, ['Mac Jones', 'Matthew Judon', 'Devin McCourty'], '#002244', '#C60C30'),
    createStock(6, 'PIT Steelers', 'Pittsburgh Steelers', 1, 'https://via.placeholder.com/100x100/FFB612/000000?text=PIT', 103.20, 1050000, 'The Pittsburgh Steelers are a professional American football team based in Pittsburgh, Pennsylvania.', 'PIT', 'Mike Tomlin', 1933, ['Kenny Pickett', 'T.J. Watt', 'Minkah Fitzpatrick'], '#FFB612', '#101820'),
    createStock(7, 'SF 49ers', 'San Francisco 49ers', 1, 'https://via.placeholder.com/100x100/AA0000/FFFFFF?text=SF', 118.90, 1300000, 'The San Francisco 49ers are a professional American football team based in the San Francisco Bay Area.', 'SF', 'Kyle Shanahan', 1946, ['Brock Purdy', 'Deebo Samuel', 'Nick Bosa'], '#AA0000', '#B3995D'),
    createStock(8, 'TB Buccaneers', 'Tampa Bay Buccaneers', 1, 'https://via.placeholder.com/100x100/D50A0A/FFFFFF?text=TB', 95.60, 900000, 'The Tampa Bay Buccaneers are a professional American football team based in Tampa, Florida.', 'TB', 'Todd Bowles', 1976, ['Baker Mayfield', 'Mike Evans', 'Lavonte David'], '#D50A0A', '#FF7900'),
    createStock(9, 'LA Rams', 'Los Angeles Rams', 1, 'https://via.placeholder.com/100x100/003594/FFFFFF?text=LAR', 107.35, 1000000, 'The Los Angeles Rams are a professional American football team based in the Los Angeles metropolitan area.', 'LAR', 'Sean McVay', 1937, ['Matthew Stafford', 'Cooper Kupp', 'Aaron Donald'], '#003594', '#FFD100'),
    createStock(10, 'MIA Dolphins', 'Miami Dolphins', 1, 'https://via.placeholder.com/100x100/008E97/FFFFFF?text=MIA', 82.15, 850000, 'The Miami Dolphins are a professional American football team based in the Miami metropolitan area.', 'MIA', 'Mike McDaniel', 1966, ['Tua Tagovailoa', 'Tyreek Hill', 'Xavien Howard'], '#008E97', '#FC4C02'),

    // NBA Teams
    createStock(11, 'LA Lakers', 'Los Angeles Lakers', 2, 'https://via.placeholder.com/100x100/552583/FFFFFF?text=LAL', 156.80, 2000000, 'The Los Angeles Lakers are a professional basketball team based in Los Angeles, California.', 'LAL', 'Darvin Ham', 1947, ['LeBron James', 'Anthony Davis', 'Austin Reaves'], '#552583', '#FDB927'),
    createStock(12, 'GSW Warriors', 'Golden State Warriors', 2, 'https://via.placeholder.com/100x100/1D428A/FFFFFF?text=GSW', 142.50, 1800000, 'The Golden State Warriors are a professional basketball team based in San Francisco, California.', 'GSW', 'Steve Kerr', 1946, ['Stephen Curry', 'Klay Thompson', 'Draymond Green'], '#1D428A', '#FFC72C'),
    createStock(13, 'BOS Celtics', 'Boston Celtics', 2, 'https://via.placeholder.com/100x100/007A33/FFFFFF?text=BOS', 138.25, 1700000, 'The Boston Celtics are a professional basketball team based in Boston, Massachusetts.', 'BOS', 'Joe Mazzulla', 1946, ['Jayson Tatum', 'Jaylen Brown', 'Kristaps Porziņģis'], '#007A33', '#BA9653'),
    createStock(14, 'CHI Bulls', 'Chicago Bulls', 2, 'https://via.placeholder.com/100x100/CE1141/FFFFFF?text=CHI', 125.90, 1500000, 'The Chicago Bulls are a professional basketball team based in Chicago, Illinois.', 'CHI', 'Billy Donovan', 1966, ['DeMar DeRozan', 'Zach LaVine', 'Nikola Vučević'], '#CE1141', '#000000'),
    createStock(15, 'MIA Heat', 'Miami Heat', 2, 'https://via.placeholder.com/100x100/98002E/FFFFFF?text=MIA', 118.75, 1400000, 'The Miami Heat are a professional basketball team based in Miami, Florida.', 'MIA', 'Erik Spoelstra', 1988, ['Jimmy Butler', 'Bam Adebayo', 'Tyler Herro'], '#98002E', '#F9A01B'),
    createStock(16, 'NY Knicks', 'New York Knicks', 2, 'https://via.placeholder.com/100x100/006BB6/FFFFFF?text=NYK', 135.40, 1600000, 'The New York Knicks are a professional basketball team based in New York City.', 'NYK', 'Tom Thibodeau', 1946, ['Jalen Brunson', 'Julius Randle', 'RJ Barrett'], '#006BB6', '#F58426'),
    createStock(17, 'PHX Suns', 'Phoenix Suns', 2, 'https://via.placeholder.com/100x100/1D1160/FFFFFF?text=PHX', 112.30, 1300000, 'The Phoenix Suns are a professional basketball team based in Phoenix, Arizona.', 'PHX', 'Frank Vogel', 1968, ['Devin Booker', 'Kevin Durant', 'Bradley Beal'], '#1D1160', '#E56020'),
    createStock(18, 'DEN Nuggets', 'Denver Nuggets', 2, 'https://via.placeholder.com/100x100/0E2240/FFFFFF?text=DEN', 128.65, 1450000, 'The Denver Nuggets are a professional basketball team based in Denver, Colorado.', 'DEN', 'Michael Malone', 1967, ['Nikola Jokić', 'Jamal Murray', 'Michael Porter Jr.'], '#0E2240', '#FEC524'),
    createStock(19, 'MIL Bucks', 'Milwaukee Bucks', 2, 'https://via.placeholder.com/100x100/00471B/FFFFFF?text=MIL', 121.80, 1350000, 'The Milwaukee Bucks are a professional basketball team based in Milwaukee, Wisconsin.', 'MIL', 'Adrian Griffin', 1968, ['Giannis Antetokounmpo', 'Damian Lillard', 'Khris Middleton'], '#00471B', '#EEE1C6'),
    createStock(20, 'PHI 76ers', 'Philadelphia 76ers', 2, 'https://via.placeholder.com/100x100/006BB6/FFFFFF?text=PHI', 115.45, 1250000, 'The Philadelphia 76ers are a professional basketball team based in Philadelphia, Pennsylvania.', 'PHI', 'Nick Nurse', 1963, ['Joel Embiid', 'Tyrese Maxey', 'Tobias Harris'], '#006BB6', '#ED174C'),

    // Mens College Basketball Teams - SEC
    createStock(31, 'ALA Crimson Tide', 'Alabama Crimson Tide', 5, 'https://via.placeholder.com/100x100/9E1B32/FFFFFF?text=ALA', 45.80, 180000, 'The Alabama Crimson Tide men\'s basketball team represents the University of Alabama.', 'ALA', 'Nate Oats', 1913, ['Brandon Miller', 'Mark Sears', 'Noah Clowney'], '#9E1B32', '#510D19'),
    createStock(32, 'AUB Tigers', 'Auburn Tigers', 5, 'https://via.placeholder.com/100x100/0C2340/FFFFFF?text=AUB', 42.30, 165000, 'The Auburn Tigers men\'s basketball team represents Auburn University.', 'AUB', 'Bruce Pearl', 1906, ['Jabari Smith', 'Johni Broome', 'Wendell Green Jr.'], '#0C2340', '#406DA6'),
    createStock(33, 'UK Wildcats', 'Kentucky Wildcats', 5, 'https://via.placeholder.com/100x100/0033A0/FFFFFF?text=UK', 58.75, 220000, 'The Kentucky Wildcats men\'s basketball team represents the University of Kentucky.', 'UK', 'John Calipari', 1903, ['Antonio Reeves', 'Reed Sheppard', 'Rob Dillingham'], '#0033A0', '#001A53'),
    createStock(34, 'TENN Volunteers', 'Tennessee Volunteers', 5, 'https://via.placeholder.com/100x100/FF8200/FFFFFF?text=TENN', 38.90, 150000, 'The Tennessee Volunteers men\'s basketball team represents the University of Tennessee.', 'TENN', 'Rick Barnes', 1908, ['Dalton Knecht', 'Zakai Zeigler', 'Jonas Aidoo'], '#FF8200', '#B26311'),
    createStock(35, 'ARK Razorbacks', 'Arkansas Razorbacks', 5, 'https://via.placeholder.com/100x100/9D2235/FFFFFF?text=ARK', 35.60, 140000, 'The Arkansas Razorbacks men\'s basketball team represents the University of Arkansas.', 'ARK', 'Eric Musselman', 1923, ['Trevon Brazile', 'Khalif Battle', 'Tramon Mark'], '#9D2235', '#50111B'),
    createStock(36, 'UF Gators', 'Florida Gators', 5, 'https://via.placeholder.com/100x100/0021A5/FFFFFF?text=UF', 41.25, 160000, 'The Florida Gators men\'s basketball team represents the University of Florida.', 'UF', 'Todd Golden', 1915, ['Walter Clayton Jr.', 'Zyon Pullin', 'Tyrese Samuel'], '#0021A5', '#001158'),
    createStock(37, 'LSU Tigers', 'LSU Tigers', 5, 'https://via.placeholder.com/100x100/461D7C/FFFFFF?text=LSU', 33.80, 135000, 'The LSU Tigers men\'s basketball team represents Louisiana State University.', 'LSU', 'Matt McMahon', 1908, ['Jalen Cook', 'Will Baker', 'Jordan Wright'], '#461D7C', '#712EC8'),
    createStock(38, 'MSST Bulldogs', 'Mississippi State Bulldogs', 5, 'https://via.placeholder.com/100x100/76232F/FFFFFF?text=MSST', 28.45, 120000, 'The Mississippi State Bulldogs men\'s basketball team represents Mississippi State University.', 'MSST', 'Chris Jans', 1908, ['Tolu Smith', 'Josh Hubbard', 'Cameron Matthews'], '#76232F', '#C2394D'),
    createStock(39, 'OLE MISS Rebels', 'Ole Miss Rebels', 5, 'https://via.placeholder.com/100x100/002147/FFFFFF?text=OM', 26.70, 110000, 'The Ole Miss Rebels men\'s basketball team represents the University of Mississippi.', 'OM', 'Chris Beard', 1908, ['Matthew Murrell', 'Allen Flanigan', 'Jaemyn Brakefield'], '#002147', '#2262AD'),
    createStock(40, 'SC Gamecocks', 'South Carolina Gamecocks', 5, 'https://via.placeholder.com/100x100/73000A/FFFFFF?text=SC', 24.85, 105000, 'The South Carolina Gamecocks men\'s basketball team represents the University of South Carolina.', 'SC', 'Lamont Paris', 1908, ['Meechie Johnson', 'B.J. Mack', 'Collin Murray-Boyles'], '#73000A', '#BF0010'),
    createStock(41, 'UGA Bulldogs', 'Georgia Bulldogs', 5, 'https://via.placeholder.com/100x100/BA0C2F/FFFFFF?text=UGA', 22.30, 95000, 'The Georgia Bulldogs men\'s basketball team represents the University of Georgia.', 'UGA', 'Mike White', 1893, ['Jabri Abdur-Rahim', 'Noah Thomasson', 'RJ Melendez'], '#BA0C2F', '#6D0A1E'),
    createStock(42, 'VAN Commodores', 'Vanderbilt Commodores', 5, 'https://via.placeholder.com/100x100/866D4B/FFFFFF?text=VAN', 20.15, 85000, 'The Vanderbilt Commodores men\'s basketball team represents Vanderbilt University.', 'VAN', 'Jerry Stackhouse', 1900, ['Tyrin Lawrence', 'Ezra Manjon', 'Ven-Allen Lubin'], '#866D4B', '#392E20'),
    createStock(43, 'MIZ Tigers', 'Missouri Tigers', 5, 'https://via.placeholder.com/100x100/F1B82D/000000?text=MIZ', 18.90, 80000, 'The Missouri Tigers men\'s basketball team represents the University of Missouri.', 'MIZ', 'Dennis Gates', 1906, ['Sean East II', 'Noah Carter', 'Nick Honor'], '#F1B82D', '#A47910'),
    createStock(44, 'TAMU Aggies', 'Texas A&M Aggies', 5, 'https://via.placeholder.com/100x100/500000/FFFFFF?text=TAMU', 32.40, 130000, 'The Texas A&M Aggies men\'s basketball team represents Texas A&M University.', 'TAMU', 'Buzz Williams', 1912, ['Wade Taylor IV', 'Tyrece Radford', 'Henry Coleman III'], '#500000', '#B62424'),

    // ACC Teams
    createStock(45, 'DUKE Blue Devils', 'Duke Blue Devils', 5, 'https://via.placeholder.com/100x100/001A57/FFFFFF?text=DUKE', 72.85, 280000, 'The Duke Blue Devils men\'s basketball team represents Duke University.', 'DUKE', 'Jon Scheyer', 1905, ['Kyle Filipowski', 'Jeremy Roach', 'Jared McCain'], '#001A57', '#2552BD'),
    createStock(46, 'UNC Tar Heels', 'North Carolina Tar Heels', 5, 'https://via.placeholder.com/100x100/7BAFD4/FFFFFF?text=UNC', 68.50, 260000, 'The North Carolina Tar Heels men\'s basketball team represents the University of North Carolina.', 'UNC', 'Hubert Davis', 1910, ['RJ Davis', 'Armando Bacot', 'Harrison Ingram'], '#7BAFD4', '#416A87'),
    createStock(47, 'UVA Cavaliers', 'Virginia Cavaliers', 5, 'https://via.placeholder.com/100x100/232D4B/FFFFFF?text=UVA', 52.30, 200000, 'The Virginia Cavaliers men\'s basketball team represents the University of Virginia.', 'UVA', 'Tony Bennett', 1905, ['Reece Beekman', 'Ryan Dunn', 'Isaac McKneely'], '#232D4B', '#7684B1'),
    createStock(48, 'LOU Cardinals', 'Louisville Cardinals', 5, 'https://via.placeholder.com/100x100/AD0000/FFFFFF?text=LOU', 38.75, 155000, 'The Louisville Cardinals men\'s basketball team represents the University of Louisville.', 'LOU', 'Pat Kelsey', 1911, ['Skyy Clark', 'Tre White', 'Brandon Huntley-Hatfield'], '#AD0000', '#600000'),
    createStock(49, 'SYR Orange', 'Syracuse Orange', 5, 'https://via.placeholder.com/100x100/D44500/FFFFFF?text=SYR', 35.20, 145000, 'The Syracuse Orange men\'s basketball team represents Syracuse University.', 'SYR', 'Adrian Autry', 1900, ['Judah Mintz', 'Chris Bell', 'Maliq Brown'], '#D44500', '#87350D'),
    createStock(50, 'FSU Seminoles', 'Florida State Seminoles', 5, 'https://via.placeholder.com/100x100/782F40/FFFFFF?text=FSU', 31.85, 135000, 'The Florida State Seminoles men\'s basketball team represents Florida State University.', 'FSU', 'Leonard Hamilton', 1947, ['Jamir Watkins', 'Baba Miller', 'Jalen Warley'], '#782F40', '#C44C68'),
    createStock(51, 'MIA Hurricanes', 'Miami Hurricanes', 5, 'https://via.placeholder.com/100x100/004C97/FFFFFF?text=MIA', 29.40, 125000, 'The Miami Hurricanes men\'s basketball team represents the University of Miami.', 'MIA', 'Jim Larrañaga', 1926, ['Norchad Omier', 'Wooga Poplar', 'Matthew Cleveland'], '#004C97', '#00254A'),
    createStock(52, 'VT Hokies', 'Virginia Tech Hokies', 5, 'https://via.placeholder.com/100x100/630031/FFFFFF?text=VT', 27.65, 115000, 'The Virginia Tech Hokies men\'s basketball team represents Virginia Tech.', 'VT', 'Mike Young', 1915, ['Sean Pedulla', 'Lynn Kidd', 'Hunter Cattoor'], '#630031', '#C92877'),
    createStock(53, 'NCST Wolfpack', 'NC State Wolfpack', 5, 'https://via.placeholder.com/100x100/CC0000/FFFFFF?text=NCST', 25.80, 110000, 'The NC State Wolfpack men\'s basketball team represents North Carolina State University.', 'NCST', 'Kevin Keatts', 1911, ['DJ Horne', 'DJ Burns', 'Casey Morsell'], '#CC0000', '#7F0C0C'),
    createStock(54, 'WAKE Demon Deacons', 'Wake Forest Demon Deacons', 5, 'https://via.placeholder.com/100x100/9E1B32/FFFFFF?text=WAKE', 23.45, 100000, 'The Wake Forest Demon Deacons men\'s basketball team represents Wake Forest University.', 'WAKE', 'Steve Forbes', 1906, ['Hunter Sallis', 'Kevin Miller', 'Andrew Carr'], '#9E1B32', '#510D19'),
    createStock(55, 'CLEM Tigers', 'Clemson Tigers', 5, 'https://via.placeholder.com/100x100/F66733/FFFFFF?text=CLEM', 21.90, 95000, 'The Clemson Tigers men\'s basketball team represents Clemson University.', 'CLEM', 'Brad Brownell', 1911, ['PJ Hall', 'Chase Hunter', 'Ian Schieffelin'], '#F66733', '#A93A12'),
    createStock(56, 'GT Yellow Jackets', 'Georgia Tech Yellow Jackets', 5, 'https://via.placeholder.com/100x100/00263A/FFFFFF?text=GT', 20.35, 90000, 'The Georgia Tech Yellow Jackets men\'s basketball team represents Georgia Institute of Technology.', 'GT', 'Damon Stoudamire', 1912, ['Baye Ndongo', 'Kyle Sturdivant', 'Miles Kelly'], '#00263A', '#1F73A0'),
    createStock(57, 'BC Eagles', 'Boston College Eagles', 5, 'https://via.placeholder.com/100x100/8B0000/FFFFFF?text=BC', 18.70, 85000, 'The Boston College Eagles men\'s basketball team represents Boston College.', 'BC', 'Earl Grant', 1921, ['Quinten Post', 'Claudell Harris', 'Jaeden Zackery'], '#8B0000', '#3E0000'),
    createStock(58, 'PITT Panthers', 'Pittsburgh Panthers', 5, 'https://via.placeholder.com/100x100/003594/FFFFFF?text=PITT', 17.25, 80000, 'The Pittsburgh Panthers men\'s basketball team represents the University of Pittsburgh.', 'PITT', 'Jeff Capel', 1905, ['Blake Hinson', 'Ishmael Leggett', 'Jaland Lowe'], '#003594', '#001947'),
    createStock(59, 'ND Fighting Irish', 'Notre Dame Fighting Irish', 5, 'https://via.placeholder.com/100x100/0C2340/FFFFFF?text=ND', 45.60, 175000, 'The Notre Dame Fighting Irish men\'s basketball team represents the University of Notre Dame.', 'ND', 'Micah Shrewsberry', 1898, ['Markus Burton', 'Carey Booth', 'Braeden Shrewsberry'], '#0C2340', '#406DA6'),

    // Big Ten Teams
    createStock(60, 'MSU Spartans', 'Michigan State Spartans', 5, 'https://via.placeholder.com/100x100/18453B/FFFFFF?text=MSU', 55.40, 210000, 'The Michigan State Spartans men\'s basketball team represents Michigan State University.', 'MSU', 'Tom Izzo', 1898, ['Tyson Walker', 'Malik Hall', 'A.J. Hoggard'], '#18453B', '#5DAB99'),
    createStock(61, 'MICH Wolverines', 'Michigan Wolverines', 5, 'https://via.placeholder.com/100x100/00274C/FFFFFF?text=MICH', 48.75, 190000, 'The Michigan Wolverines men\'s basketball team represents the University of Michigan.', 'MICH', 'Juwan Howard', 1909, ['Dug McDaniel', 'Hunter Dickinson', 'Jett Howard'], '#00274C', '#236CB2'),
    createStock(62, 'OSU Buckeyes', 'Ohio State Buckeyes', 5, 'https://via.placeholder.com/100x100/BB0000/FFFFFF?text=OSU', 46.20, 185000, 'The Ohio State Buckeyes men\'s basketball team represents The Ohio State University.', 'OSU', 'Chris Holtmann', 1898, ['Bruce Thornton', 'Roddy Gayle Jr.', 'Felix Okpara'], '#BB0000', '#6E0B0B'),
    createStock(63, 'PUR Boilermakers', 'Purdue Boilermakers', 5, 'https://via.placeholder.com/100x100/CEB888/000000?text=PUR', 42.85, 170000, 'The Purdue Boilermakers men\'s basketball team represents Purdue University.', 'PUR', 'Matt Painter', 1896, ['Zach Edey', 'Braden Smith', 'Fletcher Loyer'], '#CEB888', '#816F48'),
    createStock(64, 'ILL Fighting Illini', 'Illinois Fighting Illini', 5, 'https://via.placeholder.com/100x100/13294B/FFFFFF?text=ILL', 39.50, 160000, 'The Illinois Fighting Illini men\'s basketball team represents the University of Illinois.', 'ILL', 'Brad Underwood', 1905, ['Terrence Shannon Jr.', 'Marcus Domask', 'Coleman Hawkins'], '#13294B', '#5076B1'),
    createStock(65, 'WISC Badgers', 'Wisconsin Badgers', 5, 'https://via.placeholder.com/100x100/C5050C/FFFFFF?text=WISC', 36.80, 150000, 'The Wisconsin Badgers men\'s basketball team represents the University of Wisconsin-Madison.', 'WISC', 'Greg Gard', 1898, ['Tyler Wahl', 'Chucky Hepburn', 'Steven Crowl'], '#C5050C', '#780C10'),
    createStock(66, 'IU Hoosiers', 'Indiana Hoosiers', 5, 'https://via.placeholder.com/100x100/990000/FFFFFF?text=IU', 34.25, 145000, 'The Indiana Hoosiers men\'s basketball team represents Indiana University.', 'IU', 'Mike Woodson', 1901, ['Trayce Jackson-Davis', 'Jalen Hood-Schifino', 'Race Thompson'], '#990000', '#4C0000'),
    createStock(67, 'IOWA Hawkeyes', 'Iowa Hawkeyes', 5, 'https://via.placeholder.com/100x100/000000/FFFFFF?text=IOWA', 31.90, 135000, 'The Iowa Hawkeyes men\'s basketball team represents the University of Iowa.', 'IOWA', 'Fran McCaffery', 1901, ['Kris Murray', 'Tony Perkins', 'Filip Rebraca'], '#000000', '#664747'),
    createStock(68, 'MD Terrapins', 'Maryland Terrapins', 5, 'https://via.placeholder.com/100x100/E03A3E/FFFFFF?text=MD', 29.65, 125000, 'The Maryland Terrapins men\'s basketball team represents the University of Maryland.', 'MD', 'Kevin Willard', 1923, ['Jahmir Young', 'Julian Reese', 'Donta Scott'], '#E03A3E', '#93171A'),
    createStock(69, 'MINN Golden Gophers', 'Minnesota Golden Gophers', 5, 'https://via.placeholder.com/100x100/7A0019/FFFFFF?text=MINN', 27.40, 115000, 'The Minnesota Golden Gophers men\'s basketball team represents the University of Minnesota.', 'MINN', 'Ben Johnson', 1896, ['Dawson Garcia', 'Jamison Battle', 'Payton Willis'], '#7A0019', '#C60028'),
    createStock(70, 'NEB Cornhuskers', 'Nebraska Cornhuskers', 5, 'https://via.placeholder.com/100x100/E31C23/FFFFFF?text=NEB', 25.15, 105000, 'The Nebraska Cornhuskers men\'s basketball team represents the University of Nebraska-Lincoln.', 'NEB', 'Fred Hoiberg', 1896, ['Keisei Tominaga', 'Derrick Walker', 'Sam Griesel'], '#E31C23', '#960F13'),
    createStock(71, 'NU Wildcats', 'Northwestern Wildcats', 5, 'https://via.placeholder.com/100x100/4E2A84/FFFFFF?text=NU', 22.80, 95000, 'The Northwestern Wildcats men\'s basketball team represents Northwestern University.', 'NU', 'Chris Collins', 1904, ['Boo Buie', 'Chase Audige', 'Robbie Beran'], '#4E2A84', '#201137'),
    createStock(72, 'PSU Nittany Lions', 'Penn State Nittany Lions', 5, 'https://via.placeholder.com/100x100/002E5C/FFFFFF?text=PSU', 20.45, 85000, 'The Penn State Nittany Lions men\'s basketball team represents Pennsylvania State University.', 'PSU', 'Micah Shrewsberry', 1896, ['Jalen Pickett', 'Seth Lundy', 'Andrew Funk'], '#002E5C', '#2674C2'),
    createStock(73, 'RUT Scarlet Knights', 'Rutgers Scarlet Knights', 5, 'https://via.placeholder.com/100x100/CC0033/FFFFFF?text=RUT', 18.20, 80000, 'The Rutgers Scarlet Knights men\'s basketball team represents Rutgers University.', 'RUT', 'Steve Pikiell', 1866, ['Clifford Omoruyi', 'Paul Mulcahy', 'Caleb McConnell'], '#CC0033', '#7F0C29'),

    // Big 12 Teams
    createStock(74, 'KU Jayhawks', 'Kansas Jayhawks', 5, 'https://via.placeholder.com/100x100/0051BA/FFFFFF?text=KU', 65.30, 250000, 'The Kansas Jayhawks men\'s basketball team represents the University of Kansas.', 'KU', 'Bill Self', 1898, ['Hunter Dickinson', 'Kevin McCullar Jr.', 'Dajuan Harris Jr.'], '#0051BA', '#0A356D'),
    createStock(75, 'TEX Longhorns', 'Texas Longhorns', 5, 'https://via.placeholder.com/100x100/BF5700/FFFFFF?text=TEX', 52.85, 205000, 'The Texas Longhorns men\'s basketball team represents the University of Texas at Austin.', 'TEX', 'Rodney Terry', 1906, ['Max Abmas', 'Dylan Disu', 'Tyrese Hunter'], '#BF5700', '#723A0B'),
    createStock(76, 'BAY Bears', 'Baylor Bears', 5, 'https://via.placeholder.com/100x100/1B4D3E/FFFFFF?text=BAY', 48.40, 190000, 'The Baylor Bears men\'s basketball team represents Baylor University.', 'BAY', 'Scott Drew', 1906, ['Ja\'Kobe Walter', 'Yves Missi', 'RayJ Dennis'], '#1B4D3E', '#62B39A'),
    createStock(77, 'OU Sooners', 'Oklahoma Sooners', 5, 'https://via.placeholder.com/100x100/841617/FFFFFF?text=OU', 44.75, 180000, 'The Oklahoma Sooners men\'s basketball team represents the University of Oklahoma.', 'OU', 'Porter Moser', 1907, ['Javian McCollum', 'Otega Oweh', 'Rivaldo Soares'], '#841617', '#370909'),
    createStock(78, 'OKST Cowboys', 'Oklahoma State Cowboys', 5, 'https://via.placeholder.com/100x100/FF7300/FFFFFF?text=OSU', 41.20, 170000, 'The Oklahoma State Cowboys men\'s basketball team represents Oklahoma State University.', 'OKST', 'Mike Boynton', 1901, ['Javon Small', 'Brandon Garrison', 'Eric Dailey Jr.'], '#FF7300', '#B25A11'),
    createStock(79, 'ISU Cyclones', 'Iowa State Cyclones', 5, 'https://via.placeholder.com/100x100/CC0000/FFFFFF?text=ISU', 37.85, 155000, 'The Iowa State Cyclones men\'s basketball team represents Iowa State University.', 'ISU', 'T.J. Otzelberger', 1908, ['Tamin Lipsey', 'Keshon Gilbert', 'Curtis Jones'], '#CC0000', '#7F0C0C'),
    createStock(80, 'TTU Red Raiders', 'Texas Tech Red Raiders', 5, 'https://via.placeholder.com/100x100/CC0000/FFFFFF?text=TTU', 34.50, 145000, 'The Texas Tech Red Raiders men\'s basketball team represents Texas Tech University.', 'TTU', 'Grant McCasland', 1925, ['Pop Isaacs', 'Joe Toussaint', 'Darrion Williams'], '#CC0000', '#7F0C0C'),
    createStock(81, 'KSU Wildcats', 'Kansas State Wildcats', 5, 'https://via.placeholder.com/100x100/512888/FFFFFF?text=KSU', 31.15, 135000, 'The Kansas State Wildcats men\'s basketball team represents Kansas State University.', 'KSU', 'Jerome Tang', 1903, ['Tylor Perry', 'Cam Carter', 'David N\'Guessan'], '#512888', '#23113B'),
    createStock(82, 'WVU Mountaineers', 'West Virginia Mountaineers', 5, 'https://via.placeholder.com/100x100/002855/FFFFFF?text=WVU', 28.80, 125000, 'The West Virginia Mountaineers men\'s basketball team represents West Virginia University.', 'WVU', 'Josh Eilert', 1903, ['Jesse Edwards', 'Kerr Kriisa', 'RaeQuan Battle'], '#002855', '#256BBB'),
    createStock(83, 'TCU Horned Frogs', 'TCU Horned Frogs', 5, 'https://via.placeholder.com/100x100/4D1979/FFFFFF?text=TCU', 26.45, 115000, 'The TCU Horned Frogs men\'s basketball team represents Texas Christian University.', 'TCU', 'Jamie Dixon', 1910, ['Emanuel Miller', 'Jameer Nelson Jr.', 'Micah Peavy'], '#4D1979', '#7D28C5'),
    createStock(84, 'UH Cougars', 'Houston Cougars', 5, 'https://via.placeholder.com/100x100/C8102E/FFFFFF?text=UH', 24.10, 105000, 'The Houston Cougars men\'s basketball team represents the University of Houston.', 'UH', 'Kelvin Sampson', 1945, ['Jamal Shead', 'L.J. Cryer', 'J\'Wan Roberts'], '#C8102E', '#7B0C1E'),
    createStock(85, 'CIN Bearcats', 'Cincinnati Bearcats', 5, 'https://via.placeholder.com/100x100/E00122/FFFFFF?text=CIN', 21.75, 95000, 'The Cincinnati Bearcats men\'s basketball team represents the University of Cincinnati.', 'CIN', 'Wes Miller', 1901, ['Viktor Lakhin', 'Dan Skillings Jr.', 'Day Day Thomas'], '#E00122', '#930E22'),
    createStock(87, 'UCF Knights', 'UCF Knights', 5, 'https://via.placeholder.com/100x100/000000/FFFFFF?text=UCF', 17.05, 80000, 'The UCF Knights men\'s basketball team represents the University of Central Florida.', 'UCF', 'Johnny Dawkins', 1968, ['Jaylin Sellers', 'Darius Johnson', 'Ibrahima Diallo'], '#000000', '#664747'),

    // Pac-12 Teams
    createStock(88, 'UCLA Bruins', 'UCLA Bruins', 5, 'https://via.placeholder.com/100x100/2774AE/FFFFFF?text=UCLA', 58.90, 225000, 'The UCLA Bruins men\'s basketball team represents the University of California, Los Angeles.', 'UCLA', 'Mick Cronin', 1919, ['Adem Bona', 'Sebastian Mack', 'Dylan Andrews'], '#2774AE', '#154161'),
    createStock(89, 'ARIZ Wildcats', 'Arizona Wildcats', 5, 'https://via.placeholder.com/100x100/003366/FFFFFF?text=ARIZ', 55.25, 215000, 'The Arizona Wildcats men\'s basketball team represents the University of Arizona.', 'ARIZ', 'Tommy Lloyd', 1905, ['Caleb Love', 'Oumar Ballo', 'Keshad Johnson'], '#003366', '#0059B2'),
    createStock(90, 'ORE Ducks', 'Oregon Ducks', 5, 'https://via.placeholder.com/100x100/154733/FFFFFF?text=ORE', 51.80, 200000, 'The Oregon Ducks men\'s basketball team represents the University of Oregon.', 'ORE', 'Dana Altman', 1901, ['N\'Faly Dante', 'Jermaine Couisnard', 'Jackson Shelstad'], '#154733', '#55AD8A'),
    createStock(91, 'USC Trojans', 'USC Trojans', 5, 'https://via.placeholder.com/100x100/990000/FFFFFF?text=USC', 48.35, 185000, 'The USC Trojans men\'s basketball team represents the University of Southern California.', 'USC', 'Andy Enfield', 1905, ['Boogie Ellis', 'Isaiah Collier', 'Kobe Johnson'], '#990000', '#4C0000'),
    createStock(92, 'STAN Cardinal', 'Stanford Cardinal', 5, 'https://via.placeholder.com/100x100/8C1515/FFFFFF?text=STAN', 44.90, 175000, 'The Stanford Cardinal men\'s basketball team represents Stanford University.', 'STAN', 'Jerod Haase', 1913, ['Spencer Jones', 'Maxime Raynaud', 'Brandon Angel'], '#8C1515', '#3F0909'),
    createStock(93, 'UW Huskies', 'Washington Huskies', 5, 'https://via.placeholder.com/100x100/4B2E83/FFFFFF?text=UW', 41.45, 165000, 'The Washington Huskies men\'s basketball team represents the University of Washington.', 'UW', 'Mike Hopkins', 1908, ['Keion Brooks Jr.', 'Sahvir Wheeler', 'Moses Wood'], '#4B2E83', '#1F1336'),
    createStock(94, 'COLO Buffaloes', 'Colorado Buffaloes', 5, 'https://via.placeholder.com/100x100/CFB53B/000000?text=COLO', 38.00, 155000, 'The Colorado Buffaloes men\'s basketball team represents the University of Colorado Boulder.', 'COLO', 'Tad Boyle', 1901, ['KJ Simpson', 'Tristan da Silva', 'Eddie Lampkin'], '#CFB53B', '#826F18'),
    createStock(95, 'UTAH Utes', 'Utah Utes', 5, 'https://via.placeholder.com/100x100/CC0000/FFFFFF?text=UTAH', 34.55, 145000, 'The Utah Utes men\'s basketball team represents the University of Utah.', 'UTAH', 'Craig Smith', 1908, ['Branden Carlson', 'Gabe Madsen', 'Rollie Worster'], '#CC0000', '#7F0C0C'),
    createStock(96, 'ASU Sun Devils', 'Arizona State Sun Devils', 5, 'https://via.placeholder.com/100x100/8C1D40/FFFFFF?text=ASU', 31.10, 135000, 'The Arizona State Sun Devils men\'s basketball team represents Arizona State University.', 'ASU', 'Bobby Hurley', 1885, ['Frankie Collins', 'Jose Perez', 'Alonzo Gaffney'], '#8C1D40', '#3F0D1D'),
    createStock(97, 'ORST Beavers', 'Oregon State Beavers', 5, 'https://via.placeholder.com/100x100/D73F09/FFFFFF?text=OSU', 27.65, 125000, 'The Oregon State Beavers men\'s basketball team represents Oregon State University.', 'ORST', 'Wayne Tinkle', 1901, ['Jordan Pope', 'Tyler Bilodeau', 'Dexter Akanno'], '#D73F09', '#8A2E0D'),
    createStock(98, 'WSU Cougars', 'Washington State Cougars', 5, 'https://via.placeholder.com/100x100/981E32/FFFFFF?text=WSU', 24.20, 115000, 'The Washington State Cougars men\'s basketball team represents Washington State University.', 'WSU', 'Kyle Smith', 1890, ['Isaac Jones', 'Myles Rice', 'Andrej Jakimovski'], '#981E32', '#4B0E18'),
    createStock(99, 'CAL Golden Bears', 'California Golden Bears', 5, 'https://via.placeholder.com/100x100/003262/FFFFFF?text=CAL', 20.75, 105000, 'The California Golden Bears men\'s basketball team represents the University of California, Berkeley.', 'CAL', 'Mark Madsen', 1868, ['Jaylon Tyson', 'Fardaws Aimaq', 'Jalen Celestine'], '#003262', '#2879C8'),

    // Big East Teams
    createStock(100, 'NOVA Wildcats', 'Villanova Wildcats', 5, 'https://via.placeholder.com/100x100/00205B/FFFFFF?text=NOVA', 62.40, 240000, 'The Villanova Wildcats men\'s basketball team represents Villanova University.', 'NOVA', 'Kyle Neptune', 1920, ['Eric Dixon', 'Justin Moore', 'Mark Armstrong'], '#00205B', '#265CC1'),
    createStock(101, 'UCONN Huskies', 'Connecticut Huskies', 5, 'https://via.placeholder.com/100x100/000E2F/FFFFFF?text=UCONN', 59.85, 230000, 'The Connecticut Huskies men\'s basketball team represents the University of Connecticut.', 'UCONN', 'Dan Hurley', 1881, ['Tristen Newton', 'Donovan Clingan', 'Cam Spencer'], '#000E2F', '#1D4195'),
    createStock(102, 'CREI Bluejays', 'Creighton Bluejays', 5, 'https://via.placeholder.com/100x100/0033A0/FFFFFF?text=CREI', 46.30, 180000, 'The Creighton Bluejays men\'s basketball team represents Creighton University.', 'CREI', 'Greg McDermott', 1878, ['Baylor Scheierman', 'Ryan Kalkbrenner', 'Trey Alexander'], '#0033A0', '#001A53'),
    createStock(103, 'XAV Musketeers', 'Xavier Musketeers', 5, 'https://via.placeholder.com/100x100/0C2340/FFFFFF?text=XAV', 42.75, 170000, 'The Xavier Musketeers men\'s basketball team represents Xavier University.', 'XAV', 'Sean Miller', 1831, ['Quincy Olivari', 'Desmond Claude', 'Abou Ousmane'], '#0C2340', '#406DA6'),
    createStock(104, 'MARQ Golden Eagles', 'Marquette Golden Eagles', 5, 'https://via.placeholder.com/100x100/003087/FFFFFF?text=MARQ', 39.20, 160000, 'The Marquette Golden Eagles men\'s basketball team represents Marquette University.', 'MARQ', 'Shaka Smart', 1881, ['Tyler Kolek', 'Oso Ighodaro', 'Kam Jones'], '#003087', '#00143A'),
    createStock(105, 'SHU Pirates', 'Seton Hall Pirates', 5, 'https://via.placeholder.com/100x100/1E3A8A/FFFFFF?text=SHU', 35.65, 150000, 'The Seton Hall Pirates men\'s basketball team represents Seton Hall University.', 'SHU', 'Shaheen Holloway', 1856, ['Kadary Richmond', 'Al-Amir Dawes', 'Dre Davis'], '#1E3A8A', '#0D193D'),
    createStock(106, 'PROV Friars', 'Providence Friars', 5, 'https://via.placeholder.com/100x100/000000/FFFFFF?text=PROV', 32.10, 140000, 'The Providence Friars men\'s basketball team represents Providence College.', 'PROV', 'Kim English', 1917, ['Devin Carter', 'Bryce Hopkins', 'Josh Oduro'], '#000000', '#664747'),
    createStock(107, 'SJU Red Storm', 'St. John\'s Red Storm', 5, 'https://via.placeholder.com/100x100/C41E3A/FFFFFF?text=SJU', 28.55, 130000, 'The St. John\'s Red Storm men\'s basketball team represents St. John\'s University.', 'SJU', 'Rick Pitino', 1870, ['Joel Soriano', 'Daniss Jenkins', 'RJ Luis'], '#C41E3A', '#770B1E'),
    createStock(108, 'BUT Bulldogs', 'Butler Bulldogs', 5, 'https://via.placeholder.com/100x100/003366/FFFFFF?text=BUT', 25.00, 120000, 'The Butler Bulldogs men\'s basketball team represents Butler University.', 'BUT', 'Thad Matta', 1855, ['Posh Alexander', 'Jalen Thomas', 'DJ Davis'], '#003366', '#0059B2'),
    createStock(109, 'GU Hoyas', 'Georgetown Hoyas', 5, 'https://via.placeholder.com/100x100/041E42/FFFFFF?text=GU', 21.45, 110000, 'The Georgetown Hoyas men\'s basketball team represents Georgetown University.', 'GU', 'Ed Cooley', 1789, ['Jayden Epps', 'Dontrez Styles', 'Supreme Cook'], '#041E42', '#2B5FA8'),
    createStock(110, 'DPU Blue Demons', 'DePaul Blue Demons', 5, 'https://via.placeholder.com/100x100/1B365D/FFFFFF?text=DPU', 17.90, 100000, 'The DePaul Blue Demons men\'s basketball team represents DePaul University.', 'DPU', 'Tony Stubblefield', 1898, ['Chico Carter Jr.', 'Jalen Terry', 'Da\'Sean Nelson'], '#1B365D', '#5F88C3'),

    // Other Notable Teams
    createStock(111, 'GONZ Bulldogs', 'Gonzaga Bulldogs', 5, 'https://via.placeholder.com/100x100/041E42/FFFFFF?text=GONZ', 56.75, 220000, 'The Gonzaga Bulldogs men\'s basketball team represents Gonzaga University.', 'GONZ', 'Mark Few', 1887, ['Graham Ike', 'Ryan Nembhard', 'Anton Watson'], '#041E42', '#2B5FA8'),
    createStock(112, 'MEM Tigers', 'Memphis Tigers', 5, 'https://via.placeholder.com/100x100/003087/FFFFFF?text=MEM', 33.20, 140000, 'The Memphis Tigers men\'s basketball team represents the University of Memphis.', 'MEM', 'Penny Hardaway', 1912, ['David Jones', 'Jahvon Quinerly', 'Malcolm Dandridge'], '#003087', '#00143A'),
    createStock(113, 'WSU Shockers', 'Wichita State Shockers', 5, 'https://via.placeholder.com/100x100/FFC72C/000000?text=WSU', 29.85, 130000, 'The Wichita State Shockers men\'s basketball team represents Wichita State University.', 'WSU', 'Paul Mills', 1895, ['Colby Rogers', 'Xavier Bell', 'Kenny Pohto'], '#FFC72C', '#B28711'),
    createStock(114, 'DAY Flyers', 'Dayton Flyers', 5, 'https://via.placeholder.com/100x100/C41E3A/FFFFFF?text=DAY', 26.50, 120000, 'The Dayton Flyers men\'s basketball team represents the University of Dayton.', 'DAY', 'Anthony Grant', 1850, ['DaRon Holmes II', 'Nate Santos', 'Koby Brea'], '#C41E3A', '#770B1E'),
    createStock(115, 'SMC Gaels', 'Saint Mary\'s Gaels', 5, 'https://via.placeholder.com/100x100/003366/FFFFFF?text=SMC', 23.15, 110000, 'The Saint Mary\'s Gaels men\'s basketball team represents Saint Mary\'s College of California.', 'SMC', 'Randy Bennett', 1863, ['Aidan Mahaney', 'Augustas Marciulionis', 'Mitchell Saxen'], '#003366', '#0059B2'),
    createStock(116, 'SDSU Aztecs', 'San Diego State Aztecs', 5, 'https://via.placeholder.com/100x100/8B0000/FFFFFF?text=SDSU', 19.80, 100000, 'The San Diego State Aztecs men\'s basketball team represents San Diego State University.', 'SDSU', 'Brian Dutcher', 1897, ['Jaedon LeDee', 'Lamont Butler', 'Micah Parrish'], '#8B0000', '#3E0000'),
    createStock(117, 'BYU Cougars', 'BYU Cougars', 5, 'https://via.placeholder.com/100x100/002255/FFFFFF?text=BYU', 16.45, 90000, 'The BYU Cougars men\'s basketball team represents Brigham Young University.', 'BYU', 'Mark Pope', 1875, ['Jaxson Robinson', 'Fousseyni Traore', 'Dallin Hall'], '#002255', '#2561BB'),
    createStock(118, 'VCU Rams', 'VCU Rams', 5, 'https://via.placeholder.com/100x100/FFB300/000000?text=VCU', 13.10, 80000, 'The VCU Rams men\'s basketball team represents Virginia Commonwealth University.', 'VCU', 'Ryan Odom', 1838, ['Max Shulga', 'Toibu Lawal', 'Zeb Jackson'], '#FFB300', '#B28211'),
    createStock(119, 'DAV Wildcats', 'Davidson Wildcats', 5, 'https://via.placeholder.com/100x100/CC0000/FFFFFF?text=DAV', 9.75, 70000, 'The Davidson Wildcats men\'s basketball team represents Davidson College.', 'DAV', 'Matt McKillop', 1837, ['Grant Huffman', 'Reed Bailey', 'Connor Kochera'], '#CC0000', '#7F0C0C'),
    createStock(120, 'LUC Ramblers', 'Loyola Chicago Ramblers', 5, 'https://via.placeholder.com/100x100/8B0000/FFFFFF?text=LUC', 6.40, 60000, 'The Loyola Chicago Ramblers men\'s basketball team represents Loyola University Chicago.', 'LUC', 'Drew Valentine', 1870, ['Philip Alston', 'Des Watson', 'Braden Norris'], '#8B0000', '#3E0000'),

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
        entries: 15.5,
        avgEntryPrice: 118.25,
        currentValue: 1945.25,
        totalGainLoss: 112.50,
        gainLossPercentage: 6.14,
        colors: [{ hex: stocks[0].color }],
    },
    {
        stock: stocks[10], // Los Angeles Lakers
        entries: 8.0,
        avgEntryPrice: 145.80,
        currentValue: 1254.40,
        totalGainLoss: 88.00,
        gainLossPercentage: 7.54,
        colors: [{ hex: stocks[10].color }],
    },
    {
        stock: stocks[1], // Buffalo Bills
        entries: 12.0,
        avgEntryPrice: 95.50,
        currentValue: 1185.00,
        totalGainLoss: 39.00,
        gainLossPercentage: 3.40,
        colors: [{ hex: stocks[1].color }],
    },
    {
        stock: stocks[20], // New York Yankees
        entries: 20.0,
        avgEntryPrice: 85.25,
        currentValue: 1795.00,
        totalGainLoss: 90.00,
        gainLossPercentage: 5.28,
        colors: [{ hex: stocks[20].color }],
    },
    {
        stock: stocks[11], // Golden State Warriors
        entries: 6.5,
        avgEntryPrice: 135.20,
        currentValue: 926.25,
        totalGainLoss: -47.55,
        gainLossPercentage: -4.89,
        colors: [{ hex: stocks[11].color }],
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
    // Kansas City Chiefs transactions
    {
        id: 1,
        action: 'buy',
        quantity: 10.0,
        price: 115.00,
        totalPrice: 1150.00,
        userID: 1,
        stockID: 1,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
    },
    {
        id: 2,
        action: 'buy',
        quantity: 5.5,
        price: 120.00,
        totalPrice: 660.00,
        userID: 1,
        stockID: 1,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
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
    // Los Angeles Lakers transactions
    {
        id: 4,
        action: 'buy',
        quantity: 5.0,
        price: 142.00,
        totalPrice: 710.00,
        userID: 1,
        stockID: 11,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05'),
    },
    {
        id: 5,
        action: 'buy',
        quantity: 3.0,
        price: 152.00,
        totalPrice: 456.00,
        userID: 1,
        stockID: 11,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15'),
    },
    // Buffalo Bills transactions
    {
        id: 6,
        action: 'buy',
        quantity: 7.0,
        price: 92.00,
        totalPrice: 644.00,
        userID: 1,
        stockID: 2,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
    },
    {
        id: 7,
        action: 'buy',
        quantity: 5.0,
        price: 99.00,
        totalPrice: 495.00,
        userID: 1,
        stockID: 2,
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20'),
    },
    // New York Yankees transactions
    {
        id: 8,
        action: 'buy',
        quantity: 12.0,
        price: 82.00,
        totalPrice: 984.00,
        userID: 1,
        stockID: 21,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
    },
    {
        id: 9,
        action: 'buy',
        quantity: 8.0,
        price: 88.50,
        totalPrice: 708.00,
        userID: 1,
        stockID: 21,
        createdAt: new Date('2024-02-25'),
        updatedAt: new Date('2024-02-25'),
    },
    // Golden State Warriors transactions
    {
        id: 10,
        action: 'buy',
        quantity: 4.0,
        price: 140.00,
        totalPrice: 560.00,
        userID: 1,
        stockID: 12,
        createdAt: new Date('2024-01-30'),
        updatedAt: new Date('2024-01-30'),
    },
    {
        id: 11,
        action: 'buy',
        quantity: 2.5,
        price: 128.00,
        totalPrice: 320.00,
        userID: 1,
        stockID: 12,
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
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
        const entries = Math.random() * 20 + 5; // Random entries between 5-25
        const avgEntryPrice = stock.price * (0.9 + Math.random() * 0.2); // Random cost between 90-110% of current price
        const currentValue = entries * stock.price;
        const totalGainLoss = currentValue - (entries * avgEntryPrice);
        const gainLossPercentage = (totalGainLoss / (entries * avgEntryPrice)) * 100;

        // Find color by stockID string
        const stockColor = colors.find(c => c.stockID === stockId.toString());

        return {
            stock,
            entries: Math.round(entries * 10) / 10,
            avgEntryPrice: Math.round(avgEntryPrice * 100) / 100,
            currentValue: Math.round(currentValue * 100) / 100,
            totalGainLoss: Math.round(totalGainLoss * 100) / 100,
            gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
            colors: stockColor ? [{ hex: stockColor.hex }] : [],
        };
    }).filter((pos): pos is Position => pos !== null);

    const totalValue = userPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalInvested = userPositions.reduce((sum, pos) => sum + (pos.entries * pos.avgEntryPrice), 0);
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