import type { Position, PriceHistory } from '@/types';

const PORTFOLIO_SYNTHETIC_ID = 'portfolio' as const;

export type PortfolioHistoryMergeInput = {
    /** Unique stock ids (same order as `histories`). */
    stockIds: (string | number)[];
    /** Total entries per id (sums duplicate positions). */
    entriesById: Map<string | number, number>;
};

/** Sum `entries` for each `stock.id` so split rows don’t double-count in the chart. */
export function consolidatePortfolioForChart(positions: Position[]): PortfolioHistoryMergeInput {
    const entriesById = new Map<string | number, number>();
    for (const p of positions) {
        const id = p.stock.id;
        entriesById.set(id, (entriesById.get(id) ?? 0) + p.entries);
    }
    const stockIds = Array.from(entriesById.keys());
    return { stockIds, entriesById };
}

/**
 * Total portfolio value over time: at each distinct timestamp, sums `entries × price`
 * per holding (last known price at or before that time).
 */
export function mergePortfolioPriceHistory(
    { stockIds, entriesById }: PortfolioHistoryMergeInput,
    histories: (PriceHistory[] | null | undefined)[]
): PriceHistory[] {
    const n = Math.min(stockIds.length, histories.length);
    if (n === 0) return [];

    type Series = { entries: number; points: PriceHistory[] };
    const series: Series[] = [];
    for (let i = 0; i < n; i++) {
        const h = histories[i];
        if (h == null || h.length === 0) return [];
        const sorted = [...h].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
        const entries = entriesById.get(stockIds[i]);
        if (entries == null) return [];
        series.push({ entries, points: sorted });
    }

    const timeSet = new Set<number>();
    for (const s of series) {
        for (const p of s.points) {
            timeSet.add(+new Date(p.timestamp));
        }
    }
    const times = Array.from(timeSet).sort((a, b) => a - b);

    const idx = series.map(() => 0);
    const out: PriceHistory[] = [];

    for (const t of times) {
        let sum = 0;
        let ok = true;
        for (let s = 0; s < series.length; s++) {
            const pts = series[s].points;
            while (idx[s] + 1 < pts.length && +new Date(pts[idx[s] + 1].timestamp) <= t) {
                idx[s]++;
            }
            if (+new Date(pts[idx[s]].timestamp) > t) {
                ok = false;
                break;
            }
            sum += series[s].entries * pts[idx[s]].price;
        }
        if (ok) {
            out.push({
                stockID: PORTFOLIO_SYNTHETIC_ID,
                timestamp: new Date(t),
                price: sum,
                change: 0,
                changePercentage: 0,
            });
        }
    }

    return out;
}
