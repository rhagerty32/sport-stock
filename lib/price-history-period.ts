import type { PriceHistory, TimePeriod } from '@/types';

/** Inclusive lower bound for timestamps in range; `null` means no cutoff (full series). */
export function periodFilterCutoffMs(period: TimePeriod, nowMs: number = Date.now()): number | null {
    switch (period) {
        case '1H':
            return nowMs - 60 * 60 * 1000;
        case '1D':
            return nowMs - 24 * 60 * 60 * 1000;
        case '1W':
            return nowMs - 7 * 24 * 60 * 60 * 1000;
        case '1M':
            return nowMs - 30 * 24 * 60 * 60 * 1000;
        case '3M':
            return nowMs - 90 * 24 * 60 * 60 * 1000;
        case '1Y':
            return nowMs - 365 * 24 * 60 * 60 * 1000;
        case '5Y':
            return nowMs - 5 * 365 * 24 * 60 * 60 * 1000;
        case 'ALL':
            return null;
        default:
            return null;
    }
}

/** Filter API-sourced price history by selected time period (by date). Shared with `Chart`. */
export function filterPriceDataByPeriod(data: PriceHistory[], period: TimePeriod): PriceHistory[] {
    if (data.length === 0) return [];
    const now = Date.now();
    const sorted = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const cutoff = periodFilterCutoffMs(period, now);
    if (cutoff == null) return sorted;
    return sorted.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
}

/**
 * When a range has fewer than two samples (e.g. daily data + 1D), chart/stats need two points.
 * Uses the latest price in-window, or the most recent price in the full series, for a flat line at 0% change.
 */
/** When the quote differs from the last history candle, add a point at `now` so the chart end matches the header price. */
export function appendLivePricePoint(history: PriceHistory[], livePrice: number, epsilon = 0.01): PriceHistory[] {
    if (history.length === 0 || livePrice <= 0) return history;
    const sorted = [...history].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    const last = sorted[sorted.length - 1];
    if (Math.abs(last.price - livePrice) <= epsilon) return sorted;
    return [
        ...sorted,
        {
            stockID: last.stockID,
            timestamp: new Date(),
            price: livePrice,
            change: 0,
            changePercentage: 0,
        },
    ];
}

export function priceHistoryWithSteadyFallback(full: PriceHistory[], period: TimePeriod): PriceHistory[] {
    const nowMs = Date.now();
    const filtered = filterPriceDataByPeriod(full, period);
    if (filtered.length >= 2) return filtered;
    if (full.length === 0) return [];

    const sortedFull = [...full].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    const lastFull = sortedFull[sortedFull.length - 1];
    const stockID = lastFull.stockID;

    const steadyPrice =
        filtered.length === 1 ? filtered[0].price : lastFull.price;

    let startMs: number;
    if (period === 'ALL') {
        startMs = +new Date(sortedFull[0].timestamp);
    } else {
        const cutoff = periodFilterCutoffMs(period, nowMs);
        startMs = cutoff ?? nowMs - 24 * 60 * 60 * 1000;
    }

    return [
        {
            stockID,
            timestamp: new Date(startMs),
            price: steadyPrice,
            change: 0,
            changePercentage: 0,
        },
        {
            stockID,
            timestamp: new Date(nowMs),
            price: steadyPrice,
            change: 0,
            changePercentage: 0,
        },
    ];
}
