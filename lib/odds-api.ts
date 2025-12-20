import { useQuery } from '@tanstack/react-query';

const API_KEY = process.env.EXPO_PUBLIC_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

// Type definitions for the-odds-api responses
export type OddsOutcome = {
    name: string;
    price: number;
    point?: number;
};

export type OddsMarket = {
    key: string;
    last_update?: string;
    outcomes: OddsOutcome[];
};

export type OddsBookmaker = {
    key: string;
    title: string;
    last_update?: string;
    markets: OddsMarket[];
};

export type OddsEvent = {
    id: string;
    sport_key: string;
    sport_title?: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: OddsBookmaker[];
};

export type GameOdds = {
    event: OddsEvent;
    draftkingsOdds: OddsBookmaker | null;
    spread: {
        home: { point: number; price: number } | null;
        away: { point: number; price: number } | null;
    };
    total: {
        over: { point: number; price: number } | null;
        under: { point: number; price: number } | null;
    };
    moneyline: {
        home: number | null;
        away: number | null;
    };
};

// Sport key mapping: League name/sport → the-odds-api sport key
export const SPORT_KEY_MAP: Record<string, string> = {
    'NFL': 'americanfootball_nfl',
    'Football': 'americanfootball_nfl',
    'NBA': 'basketball_nba',
    'Basketball': 'basketball_nba',
    'MLB': 'baseball_mlb',
    'Baseball': 'baseball_mlb',
    'NHL': 'icehockey_nhl',
    'Hockey': 'icehockey_nhl',
    'NCAA Basketball': 'basketball_ncaab',
};

// Team name mapping: App team name → the-odds-api team name
export const TEAM_NAME_MAP: Record<string, string> = {
    // NFL Teams
    'KC Chiefs': 'Kansas City Chiefs',
    'BUF Bills': 'Buffalo Bills',
    'DAL Cowboys': 'Dallas Cowboys',
    'GB Packers': 'Green Bay Packers',
    'NE Patriots': 'New England Patriots',
    'PIT Steelers': 'Pittsburgh Steelers',
    'SF 49ers': 'San Francisco 49ers',
    'TB Buccaneers': 'Tampa Bay Buccaneers',
    'LA Rams': 'Los Angeles Rams',
    'MIA Dolphins': 'Miami Dolphins',

    // NBA Teams
    'LA Lakers': 'Los Angeles Lakers',
    'GSW Warriors': 'Golden State Warriors',
    'BOS Celtics': 'Boston Celtics',
    'CHI Bulls': 'Chicago Bulls',
    'MIA Heat': 'Miami Heat',
    'NY Knicks': 'New York Knicks',
    'PHX Suns': 'Phoenix Suns',
    'DEN Nuggets': 'Denver Nuggets',
    'MIL Bucks': 'Milwaukee Bucks',
    'PHI 76ers': 'Philadelphia 76ers',

    // MLB Teams
    'NYY Yankees': 'New York Yankees',
    'LAD Dodgers': 'Los Angeles Dodgers',
    'BOS Red Sox': 'Boston Red Sox',
    'CHC Cubs': 'Chicago Cubs',
    'SF Giants': 'San Francisco Giants',

    // NHL Teams
    'TOR Maple Leafs': 'Toronto Maple Leafs',
    'MTL Canadiens': 'Montreal Canadiens',
    'BOS Bruins': 'Boston Bruins',
    'NYR Rangers': 'New York Rangers',
    'CHI Blackhawks': 'Chicago Blackhawks',

    // NCAA Basketball Teams - Major ones
    'ALA Crimson Tide': 'Alabama Crimson Tide',
    'AUB Tigers': 'Auburn Tigers',
    'UK Wildcats': 'Kentucky Wildcats',
    'TENN Volunteers': 'Tennessee Volunteers',
    'ARK Razorbacks': 'Arkansas Razorbacks',
    'UF Gators': 'Florida Gators',
    'LSU Tigers': 'LSU Tigers',
    'MSST Bulldogs': 'Mississippi State Bulldogs',
    'OLE MISS Rebels': 'Ole Miss Rebels',
    'SC Gamecocks': 'South Carolina Gamecocks',
    'UGA Bulldogs': 'Georgia Bulldogs',
    'VAN Commodores': 'Vanderbilt Commodores',
    'MIZ Tigers': 'Missouri Tigers',
    'TAMU Aggies': 'Texas A&M Aggies',
    'DUKE Blue Devils': 'Duke Blue Devils',
    'UNC Tar Heels': 'North Carolina Tar Heels',
    'UVA Cavaliers': 'Virginia Cavaliers',
    'LOU Cardinals': 'Louisville Cardinals',
    'SYR Orange': 'Syracuse Orange',
    'FSU Seminoles': 'Florida State Seminoles',
    'MIA Hurricanes': 'Miami Hurricanes',
    'VT Hokies': 'Virginia Tech Hokies',
    'NCST Wolfpack': 'NC State Wolfpack',
    'WAKE Demon Deacons': 'Wake Forest Demon Deacons',
    'CLEM Tigers': 'Clemson Tigers',
    'GT Yellow Jackets': 'Georgia Tech Yellow Jackets',
    'BC Eagles': 'Boston College Eagles',
    'PITT Panthers': 'Pittsburgh Panthers',
    'ND Fighting Irish': 'Notre Dame Fighting Irish',
    'MSU Spartans': 'Michigan State Spartans',
    'MICH Wolverines': 'Michigan Wolverines',
    'OSU Buckeyes': 'Ohio State Buckeyes',
    'PUR Boilermakers': 'Purdue Boilermakers',
    'ILL Fighting Illini': 'Illinois Fighting Illini',
    'WISC Badgers': 'Wisconsin Badgers',
    'IU Hoosiers': 'Indiana Hoosiers',
    'IOWA Hawkeyes': 'Iowa Hawkeyes',
    'MD Terrapins': 'Maryland Terrapins',
    'MINN Golden Gophers': 'Minnesota Golden Gophers',
    'NEB Cornhuskers': 'Nebraska Cornhuskers',
    'NU Wildcats': 'Northwestern Wildcats',
    'PSU Nittany Lions': 'Penn State Nittany Lions',
    'RUT Scarlet Knights': 'Rutgers Scarlet Knights',
    'KU Jayhawks': 'Kansas Jayhawks',
    'TEX Longhorns': 'Texas Longhorns',
    'BAY Bears': 'Baylor Bears',
    'OU Sooners': 'Oklahoma Sooners',
    'OKST Cowboys': 'Oklahoma State Cowboys',
    'ISU Cyclones': 'Iowa State Cyclones',
    'TTU Red Raiders': 'Texas Tech Red Raiders',
    'KSU Wildcats': 'Kansas State Wildcats',
    'WVU Mountaineers': 'West Virginia Mountaineers',
    'TCU Horned Frogs': 'TCU Horned Frogs',
    'UH Cougars': 'Houston Cougars',
    'CIN Bearcats': 'Cincinnati Bearcats',
    'UCF Knights': 'UCF Knights',
    'UCLA Bruins': 'UCLA Bruins',
    'ARIZ Wildcats': 'Arizona Wildcats',
    'ORE Ducks': 'Oregon Ducks',
    'USC Trojans': 'USC Trojans',
    'STAN Cardinal': 'Stanford Cardinal',
    'UW Huskies': 'Washington Huskies',
    'COLO Buffaloes': 'Colorado Buffaloes',
    'UTAH Utes': 'Utah Utes',
    'ASU Sun Devils': 'Arizona State Sun Devils',
    'ORST Beavers': 'Oregon State Beavers',
    'WSU Cougars': 'Washington State Cougars',
    'CAL Golden Bears': 'California Golden Bears',
    'NOVA Wildcats': 'Villanova Wildcats',
    'UCONN Huskies': 'Connecticut Huskies',
    'CREI Bluejays': 'Creighton Bluejays',
    'XAV Musketeers': 'Xavier Musketeers',
    'MARQ Golden Eagles': 'Marquette Golden Eagles',
    'SHU Pirates': 'Seton Hall Pirates',
    'PROV Friars': 'Providence Friars',
    'SJU Red Storm': 'St. John\'s Red Storm',
    'BUT Bulldogs': 'Butler Bulldogs',
    'GU Hoyas': 'Georgetown Hoyas',
    'DPU Blue Demons': 'DePaul Blue Demons',
    'GONZ Bulldogs': 'Gonzaga Bulldogs',
    'MEM Tigers': 'Memphis Tigers',
    'WSU Shockers': 'Wichita State Shockers',
    'DAY Flyers': 'Dayton Flyers',
    'SMC Gaels': 'Saint Mary\'s Gaels',
    'SDSU Aztecs': 'San Diego State Aztecs',
    'BYU Cougars': 'BYU Cougars',
    'VCU Rams': 'VCU Rams',
    'DAV Wildcats': 'Davidson Wildcats',
    'LUC Ramblers': 'Loyola Chicago Ramblers',
};

/**
 * Converts app team name to the-odds-api team name
 */
export function getApiTeamName(appTeamName: string): string | null {
    return TEAM_NAME_MAP[appTeamName] || null;
}

/**
 * Converts league name/sport to the-odds-api sport key
 */
export function getSportKey(leagueName: string, sport?: string): string | null {
    // Try league name first
    if (SPORT_KEY_MAP[leagueName]) {
        return SPORT_KEY_MAP[leagueName];
    }
    // Try sport name
    if (sport && SPORT_KEY_MAP[sport]) {
        return SPORT_KEY_MAP[sport];
    }
    return null;
}

/**
 * Fetches upcoming game odds for a specific sport
 */
async function fetchSportOdds(sportKey: string): Promise<OddsEvent[]> {
    if (!API_KEY) {
        throw new Error('Odds API key is not configured');
    }

    const url = `${BASE_URL}/${sportKey}/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=draftkings&apiKey=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch odds: ${response.statusText}`);
    }

    const data: OddsEvent[] = await response.json();
    return data;
}

/**
 * Finds the next upcoming game for a specific team
 */
function findNextGameForTeam(events: OddsEvent[], teamName: string): OddsEvent | null {
    const now = new Date();

    // Filter events where the team is either home or away
    const teamGames = events.filter(event => {
        const homeMatch = event.home_team.toLowerCase().includes(teamName.toLowerCase()) ||
            teamName.toLowerCase().includes(event.home_team.toLowerCase());
        const awayMatch = event.away_team.toLowerCase().includes(teamName.toLowerCase()) ||
            teamName.toLowerCase().includes(event.away_team.toLowerCase());
        return homeMatch || awayMatch;
    });

    if (teamGames.length === 0) {
        return null;
    }

    // Sort by commence_time and find the next upcoming game
    const upcomingGames = teamGames
        .filter(event => new Date(event.commence_time) > now)
        .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());

    return upcomingGames.length > 0 ? upcomingGames[0] : null;
}

/**
 * Extracts and formats odds data from an event
 */
function extractGameOdds(event: OddsEvent): GameOdds | null {
    // Find DraftKings bookmaker
    const draftkings = event.bookmakers.find(bm => bm.key === 'draftkings');

    if (!draftkings) {
        return null;
    }

    const spreadMarket = draftkings.markets.find(m => m.key === 'spreads');
    const totalsMarket = draftkings.markets.find(m => m.key === 'totals');
    const h2hMarket = draftkings.markets.find(m => m.key === 'h2h');

    // Extract spread odds
    const spread = {
        home: null as { point: number; price: number } | null,
        away: null as { point: number; price: number } | null,
    };

    if (spreadMarket) {
        spreadMarket.outcomes.forEach(outcome => {
            if (outcome.point !== undefined) {
                if (outcome.name === event.home_team) {
                    spread.home = { point: outcome.point, price: outcome.price };
                } else if (outcome.name === event.away_team) {
                    spread.away = { point: outcome.point, price: outcome.price };
                }
            }
        });
    }

    // Extract total odds
    const total = {
        over: null as { point: number; price: number } | null,
        under: null as { point: number; price: number } | null,
    };

    if (totalsMarket) {
        totalsMarket.outcomes.forEach(outcome => {
            if (outcome.point !== undefined) {
                if (outcome.name.toLowerCase() === 'over') {
                    total.over = { point: outcome.point, price: outcome.price };
                } else if (outcome.name.toLowerCase() === 'under') {
                    total.under = { point: outcome.point, price: outcome.price };
                }
            }
        });
    }

    // Extract moneyline odds
    const moneyline = {
        home: null as number | null,
        away: null as number | null,
    };

    if (h2hMarket) {
        h2hMarket.outcomes.forEach(outcome => {
            if (outcome.name === event.home_team) {
                moneyline.home = outcome.price;
            } else if (outcome.name === event.away_team) {
                moneyline.away = outcome.price;
            }
        });
    }

    return {
        event,
        draftkingsOdds: draftkings,
        spread,
        total,
        moneyline,
    };
}

/**
 * Fetches and processes game odds for a specific team
 */
export async function getUpcomingGameOdds(sportKey: string, teamName: string): Promise<GameOdds | null> {
    try {
        const events = await fetchSportOdds(sportKey);
        const game = findNextGameForTeam(events, teamName);

        if (!game) {
            return null;
        }

        return extractGameOdds(game);
    } catch (error) {
        console.error('Error fetching game odds:', error);
        throw error;
    }
}

/**
 * TanStack Query hook for fetching game odds
 */
export function useGameOdds(teamName: string | null, sportKey: string | null) {
    return useQuery({
        queryKey: ['gameOdds', teamName, sportKey],
        queryFn: () => {
            if (!teamName || !sportKey) {
                return null;
            }
            return getUpcomingGameOdds(sportKey, teamName);
        },
        enabled: !!teamName && !!sportKey && !!API_KEY,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    });
}
