import { NormalizedGameMarket, PolymarketData, PolymarketEvent, PolymarketMarket, PolymarketQuery, PolymarketResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

const BASE_URL = 'https://gamma-api.polymarket.com/public-search?';

/**
 * Extracts the mascot/team name from a full team name.
 * Examples:
 * - "Los Angeles Lakers" -> "Lakers"
 * - "Houston Rockets" -> "Rockets"
 * - "Boston Celtics" -> "Celtics"
 * - "Golden State Warriors" -> "Warriors"
 * - "New York Knicks" -> "Knicks"
 * - "Portland Trail Blazers" -> "Trail Blazers"
 */
function extractMascotName(teamName: string): string {
    if (!teamName) return '';

    const words = teamName.trim().split(/\s+/);

    // Special cases where mascot is 2 words
    const twoWordMascots = [
        'Trail Blazers',  // Portland Trail Blazers
        'Red Sox',        // Boston Red Sox
        'White Sox',      // Chicago White Sox
        'Blue Jays',      // Toronto Blue Jays
    ];

    // Check if last two words match a known two-word mascot
    if (words.length >= 2) {
        const lastTwoWords = words.slice(-2).join(' ');
        if (twoWordMascots.includes(lastTwoWords)) {
            return lastTwoWords;
        }
    }

    // For all other teams, mascot is the last word
    // This handles: Lakers, Rockets, Celtics, Warriors, Knicks, etc.
    return words[words.length - 1];
}

/**
 * Formats team names into Polymarket query format: "Team1 vs. Team2"
 * Uses mascot names only to match Polymarket's question format.
 */
export function formatPolymarketQuery(team1: string | null, team2: string | null): string | null {
    if (!team1 || !team2) return null;

    const mascot1 = extractMascotName(team1);
    const mascot2 = extractMascotName(team2);

    if (!mascot1 || !mascot2) return null;

    // Format: "Lakers vs. Rockets" (matching Polymarket's format with "vs." and period)
    return `${mascot1} vs. ${mascot2}`;
}

function normalizePolymarketSportsMarkets(
    markets: PolymarketMarket[]
): NormalizedGameMarket[] {
    const games = new Map<string, NormalizedGameMarket>();

    for (const market of markets) {
        // Base game key (Celtics vs Raptors)
        const gameKey = market.question.split(":")[0];

        if (!games.has(gameKey)) {
            games.set(gameKey, {
                game: gameKey,
                slug: market.slug,
                startTime: market.gameStartTime,
            });
        }

        const game = games.get(gameKey)!;

        const outcomes = JSON.parse(market.outcomes) as string[];
        const prices = JSON.parse(market.outcomePrices).map(Number);

        switch (market.sportsMarketType) {
            case "moneyline":
                game.moneyline = {
                    outcomes,
                    prices,
                    liquidity: market.liquidityNum,
                    volume24h: market.volume24hr,
                    spread: market.spread,
                };
                break;

            case "spreads":
                game.spread = {
                    line: market.line!,
                    outcomes,
                    prices,
                    liquidity: market.liquidityNum,
                    volume24h: market.volume24hr,
                };
                break;

            case "totals":
                game.total = {
                    line: market.line!,
                    outcomes,
                    prices,
                    liquidity: market.liquidityNum,
                    volume24h: market.volume24hr,
                };
                break;
        }
    }

    return Array.from(games.values());
}

function filterCoreGameMarkets(
    markets: PolymarketData[]
): PolymarketData[] {
    return markets.filter(market => {
        // Must be an actual game matchup
        const isVsGame = market.game.includes(" vs. ");

        // Must have at least one main market
        const hasCoreData =
            market.moneyline || market.spread || market.total;

        return isVsGame && hasCoreData;
    });
}

export const getPolymarketData = async ({
    q,
}: PolymarketQuery): Promise<PolymarketEvent[]> => {
    const queryString = new URLSearchParams({ q: q || '' }).toString();
    const response: Response = await fetch(`${BASE_URL}${queryString}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch Polymarket data: ${response.statusText}`);
    }
    const data: PolymarketResponse = await response.json();
    const filteredEvents = data.events.filter((event) => event.active && event.active === true);

    const openEvents = [];
    for (let i in filteredEvents) {
        if (filteredEvents[i].closed === false) {
            openEvents.push(filteredEvents[i]);
        };
    };

    return openEvents;
};

export const usePolymarketData = (query: PolymarketQuery) => {
    return useQuery({
        queryKey: ['polymarketData', query],
        queryFn: async () => {
            const result = await getPolymarketData(query);
            // React Query requires a defined value (not undefined)
            // Return null explicitly if no data found
            if (result === undefined || result === null) {
                return null;
            }
            return result;
        },
        enabled: !!query.q,
        // staleTime: 5 * 60 * 1000, // 5 minutes
        // gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

// NFL
// Make the playoffs: 
// Division Champion:
// Conference Champion: 
// Super bowl champion: 

// NBA
// Make the playoffs:
// Division Champion:
// Conference Champion:
// NBA Champion:

// Big 10 basketball championship: big 10 championship football
// Big 10 football championship: big 10 championship football