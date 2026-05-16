import { useQuery } from '@tanstack/react-query';

export type GameTickerTeam = {
    abbr: string;
    name?: string;
    rank?: number;
    score?: number;
    record?: string;
    brandColor: string;
    logoUrl?: string;
};

export type GameTickerFinal = {
    id: string;
    status: 'final';
    away: GameTickerTeam;
    home: GameTickerTeam;
};

export type GameTickerUpcoming = {
    id: string;
    status: 'upcoming';
    dateLabel: string;
    timeLabel: string;
    away: GameTickerTeam;
    home: GameTickerTeam;
};

export type GameTickerItem = GameTickerFinal | GameTickerUpcoming;

export const gamesTickerKeys = {
    root: ['games-ticker', 'v1'] as const,
};

export const DUMMY_GAME_TICKER_ITEMS: GameTickerItem[] = [
    {
        id: 'byu-utah',
        status: 'final',
        away: { abbr: 'BYU', rank: 9, score: 22, brandColor: '#002E5D' },
        home: { abbr: 'Utah', score: 21, brandColor: '#CC0000' },
    },
    {
        id: 'phi-dal',
        status: 'final',
        away: { abbr: 'PHI', score: 34, brandColor: '#004C54' },
        home: { abbr: 'DAL', score: 6, brandColor: '#041E42' },
    },
    {
        id: 'hou-usc',
        status: 'final',
        away: { abbr: 'HOU', rank: 6, score: 23, brandColor: '#C8102E' },
        home: { abbr: 'USC', rank: 16, score: 17, brandColor: '#990000' },
    },
    {
        id: 'uga-tamu',
        status: 'upcoming',
        dateLabel: '11/16',
        timeLabel: '10:00 AM',
        away: { abbr: 'UGA', rank: 6, record: '(8-1)', brandColor: '#BA0C2F' },
        home: { abbr: 'TAMU', rank: 16, record: '(6-3)', brandColor: '#500000' },
    },
    {
        id: 'osu-nu',
        status: 'upcoming',
        dateLabel: '11/16',
        timeLabel: '10:00 AM',
        away: { abbr: 'OSU', rank: 2, record: '(8-1)', brandColor: '#BB0000' },
        home: { abbr: 'NU', record: '(4-5)', brandColor: '#4E2A84' },
    },
];

async function fetchGamesTicker(): Promise<GameTickerItem[]> {
    return DUMMY_GAME_TICKER_ITEMS;
}

export function useGamesTicker() {
    return useQuery({
        queryKey: gamesTickerKeys.root,
        queryFn: fetchGamesTicker,
        staleTime: 60_000,
    });
}
