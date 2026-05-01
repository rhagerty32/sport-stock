import type { League } from '@/types';

type QueryDefaults = {
    playoffQuery: string;
    divisionQuery: string;
    conferenceQuery: string;
    championQuery: string;
};

const DEFAULT_QUERIES_BY_SPORT: Partial<Record<string, QueryDefaults>> = {
    basketball_nba: {
        playoffQuery: 'nba playoffs',
        divisionQuery: 'nba division',
        conferenceQuery: 'nba conference',
        championQuery: 'nba champion',
    },
    americanfootball_nfl: {
        playoffQuery: 'nfl playoffs',
        divisionQuery: 'nfl division',
        conferenceQuery: 'nfl conference',
        championQuery: 'nfl super bowl',
    },
    baseball_mlb: {
        playoffQuery: 'mlb playoffs',
        divisionQuery: 'mlb division',
        conferenceQuery: 'mlb pennant',
        championQuery: 'mlb world series',
    },
    icehockey_nhl: {
        playoffQuery: 'nhl playoffs',
        divisionQuery: 'nhl division',
        conferenceQuery: 'nhl conference',
        championQuery: 'nhl stanley cup',
    },
    basketball_ncaab: {
        playoffQuery: 'march madness',
        divisionQuery: 'ncaa basketball conference',
        conferenceQuery: 'ncaa basketball conference champion',
        championQuery: 'ncaa basketball champion',
    },
};

function emptyShell(name: string, sport: string): League {
    return {
        id: 0,
        name,
        marketCap: 0,
        volume: 0,
        photoURL: '',
        sport,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        playoffQuery: '',
        divisionQuery: '',
        conferenceQuery: '',
        championQuery: '',
    };
}

/**
 * Ensures Polymarket search queries exist: fills missing strings from sport defaults,
 * or builds a minimal league object when the API returned no league row.
 */
export function leagueWithPolymarketDefaults(league: League | null, sportKey: string | null): League | null {
    const defaults = sportKey ? DEFAULT_QUERIES_BY_SPORT[sportKey] : undefined;
    if (!defaults) return league;

    if (!league) {
        if (sportKey === 'basketball_nba') return { ...emptyShell('NBA', 'Basketball'), ...defaults };
        if (sportKey === 'americanfootball_nfl') return { ...emptyShell('NFL', 'Football'), ...defaults };
        if (sportKey === 'baseball_mlb') return { ...emptyShell('MLB', 'Baseball'), ...defaults };
        if (sportKey === 'icehockey_nhl') return { ...emptyShell('NHL', 'Hockey'), ...defaults };
        if (sportKey === 'basketball_ncaab') return { ...emptyShell('NCAA Basketball', 'Basketball'), ...defaults };
        return null;
    }

    return {
        ...league,
        playoffQuery: league.playoffQuery?.trim() || defaults.playoffQuery,
        divisionQuery: league.divisionQuery?.trim() || defaults.divisionQuery,
        conferenceQuery: league.conferenceQuery?.trim() || defaults.conferenceQuery,
        championQuery: league.championQuery?.trim() || defaults.championQuery,
    };
}
