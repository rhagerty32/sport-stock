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
export function filterPriceDataByPeriod(
    data: PriceHistory[],
    period: TimePeriod,
    nowMs: number = Date.now()
): PriceHistory[] {
    if (data.length === 0) return [];
    const sorted = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const cutoff = periodFilterCutoffMs(period, nowMs);
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
    const filtered = filterPriceDataByPeriod(full, period, nowMs);
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

/** Local calendar bucket for the x-axis so the line only spans [period start → now], not the full chart width. */
function startOfLocalHourMs(nowMs: number): number {
    const d = new Date(nowMs);
    d.setMinutes(0, 0, 0);
    return +d;
}

function endOfLocalHourExclusiveMs(nowMs: number): number {
    const d = new Date(startOfLocalHourMs(nowMs));
    d.setHours(d.getHours() + 1);
    return +d;
}

function startOfLocalDayMs(nowMs: number): number {
    const d = new Date(nowMs);
    d.setHours(0, 0, 0, 0);
    return +d;
}

function endOfLocalDayExclusiveMs(nowMs: number): number {
    const d = new Date(startOfLocalDayMs(nowMs));
    d.setDate(d.getDate() + 1);
    return +d;
}

function startOfLocalMonthMs(nowMs: number): number {
    const d = new Date(nowMs);
    return +new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfLocalMonthExclusiveMs(nowMs: number): number {
    const d = new Date(nowMs);
    return +new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

function startOfLocalYearMs(nowMs: number): number {
    const d = new Date(nowMs);
    return +new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function endOfLocalYearExclusiveMs(nowMs: number): number {
    const d = new Date(nowMs);
    return +new Date(d.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
}

/**
 * Periods where the visible x-axis is a calendar bucket [start, end); `now` maps proportionally
 * (e.g. mid-month ≈ half width). 5Y / ALL keep a rolling window ending at `now` (line uses full width).
 */
export function chartPeriodUsesCalendarXAxis(period: TimePeriod): boolean {
    return period === '1H' || period === '1D' || period === '1M' || period === '1Y';
}

function getCalendarChartAxisBounds(period: TimePeriod, nowMs: number): { minT: number; maxT: number } {
    switch (period) {
        case '1H':
            return { minT: startOfLocalHourMs(nowMs), maxT: endOfLocalHourExclusiveMs(nowMs) };
        case '1D':
            return { minT: startOfLocalDayMs(nowMs), maxT: endOfLocalDayExclusiveMs(nowMs) };
        case '1M':
            return { minT: startOfLocalMonthMs(nowMs), maxT: endOfLocalMonthExclusiveMs(nowMs) };
        case '1Y':
            return { minT: startOfLocalYearMs(nowMs), maxT: endOfLocalYearExclusiveMs(nowMs) };
        default:
            return { minT: nowMs, maxT: nowMs };
    }
}

/**
 * [minT, maxT] for mapping timestamps to chart x.
 * For 1H / 1D / 1M / 1Y, maxT is the **end of the calendar bucket** so the line stops at “now” and the rest of the period is empty.
 * For 5Y / ALL / etc., maxT is `now` (rolling window fills to the right edge).
 */
export function getChartTimeAxisDomain(
    period: TimePeriod,
    data: PriceHistory[],
    nowMs: number = Date.now()
): { minT: number; maxT: number } {
    const times = data.map((d) => +new Date(d.timestamp));
    const dataMin = times.length > 0 ? Math.min(...times) : nowMs - 86_400_000;

    if (chartPeriodUsesCalendarXAxis(period)) {
        const { minT, maxT } = getCalendarChartAxisBounds(period, nowMs);
        return { minT, maxT };
    }

    const maxT = nowMs;
    const cutoff = periodFilterCutoffMs(period, nowMs);
    const minT = cutoff ?? dataMin;
    return { minT: Math.min(minT, maxT), maxT };
}

/** Step-hold value at instant `tMs`: last sample with `timestamp ≤ tMs` (matches portfolio time chart scrub). */
export function portfolioValueStepHoldAtTime(sortedAsc: PriceHistory[], tMs: number): number {
    if (sortedAsc.length === 0) return 0;
    let best = sortedAsc[0].price;
    for (const p of sortedAsc) {
        if (+new Date(p.timestamp) <= tMs) best = p.price;
        else break;
    }
    return best;
}

export type PortfolioChartPeriodMetrics = {
    startPrice: number;
    endPrice: number;
    dollar: number;
    percent: number;
};

/**
 * Period $ / % from the same logical series as the portfolio chart (`buildTimeAxisPriceSeries` output):
 * step-hold portfolio value at window start vs end (`getChartTimeAxisDomain`).
 */
export function portfolioChartPeriodMetrics(
    displaySeries: PriceHistory[],
    period: TimePeriod,
    nowMs: number = Date.now()
): PortfolioChartPeriodMetrics | null {
    if (displaySeries.length < 2) return null;
    const sorted = [...displaySeries].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    const { minT } = getChartTimeAxisDomain(period, sorted, nowMs);
    const startPrice = portfolioValueStepHoldAtTime(sorted, minT);
    /** Current value as of `now` (axis may extend to end of calendar bucket). */
    const endPrice = portfolioValueStepHoldAtTime(sorted, nowMs);
    const dollar = endPrice - startPrice;
    const percent = startPrice > 0 ? (dollar / startPrice) * 100 : 0;
    return { startPrice, endPrice, dollar, percent };
}

const SNAP_LAST_TO_NOW_MS = 60_000;
const PRICE_EPS = 1e-6;

/**
 * Insert corners so value is **constant until the next sample time**, then jumps (no linear ramps).
 * Between (tᵢ₋₁, pᵢ₋₁) and (tᵢ, pᵢ): horizontal to (tᵢ, pᵢ₋₁), then vertical to (tᵢ, pᵢ).
 */
export function expandPriceHistoryStepHold(sortedInput: PriceHistory[]): PriceHistory[] {
    const sorted = [...sortedInput].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    if (sorted.length < 2) return sorted;

    const stockID = sorted[0].stockID;
    const out: PriceHistory[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const prevSample = sorted[i - 1];
        const cur = sorted[i];
        const tPrev = +new Date(prevSample.timestamp);
        const tCur = +new Date(cur.timestamp);
        const pPrev = prevSample.price;
        const pCur = cur.price;

        if (tCur < tPrev) continue;

        if (tCur === tPrev) {
            if (Math.abs(pCur - pPrev) > PRICE_EPS) {
                const lastOut = out[out.length - 1];
                const alreadyAtPrevPrice =
                    +new Date(lastOut.timestamp) === tCur && Math.abs(lastOut.price - pPrev) <= PRICE_EPS;
                if (!alreadyAtPrevPrice) {
                    out.push({
                        stockID: cur.stockID ?? stockID,
                        timestamp: cur.timestamp,
                        price: pPrev,
                        change: 0,
                        changePercentage: 0,
                    });
                }
                out.push(cur);
            }
            continue;
        }

        if (Math.abs(pCur - pPrev) > PRICE_EPS) {
            out.push({
                stockID: cur.stockID ?? stockID,
                timestamp: new Date(tCur),
                price: pPrev,
                change: 0,
                changePercentage: 0,
            });
        }
        out.push(cur);
    }
    return out;
}

/**
 * Portfolio / time-axis series: keep real timestamps, anchor the left edge of the window, then run
 * **flat** from the last sample toward `now`, with only a short segment to `livePrice` when it differs.
 *
 * At `now`, steps to `livePrice` when it differs (same timestamp, vertical jump — no diagonal blend).
 */
export function buildTimeAxisPriceSeries(
    full: PriceHistory[],
    period: TimePeriod,
    livePrice?: number | null,
    nowMs: number = Date.now()
): PriceHistory[] {
    if (full.length === 0) return [];

    const sortedFull = [...full].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    const lastFull = sortedFull[sortedFull.length - 1];
    const stockID = lastFull.stockID;

    const calendarAxis = chartPeriodUsesCalendarXAxis(period);
    const { minT: calendarMinT } = calendarAxis
        ? getCalendarChartAxisBounds(period, nowMs)
        : { minT: 0 };

    let filtered: PriceHistory[];
    if (calendarAxis) {
        filtered = sortedFull.filter((p) => {
            const t = +new Date(p.timestamp);
            return t >= calendarMinT && t <= nowMs;
        });
    } else {
        filtered = filterPriceDataByPeriod(full, period, nowMs);
    }
    filtered = [...filtered].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));

    const maxT = nowMs;
    const minT = calendarAxis
        ? calendarMinT
        : (periodFilterCutoffMs(period, nowMs) ??
            Math.min(...sortedFull.map((d) => +new Date(d.timestamp))));

    let series: PriceHistory[];

    if (filtered.length === 0) {
        const P = lastFull.price;
        series = [
            {
                stockID,
                timestamp: new Date(minT),
                price: P,
                change: 0,
                changePercentage: 0,
            },
        ];
    } else if (filtered.length === 1) {
        const p0 = filtered[0];
        series = [
            {
                stockID: p0.stockID ?? stockID,
                timestamp: p0.timestamp,
                price: p0.price,
                change: p0.change,
                changePercentage: p0.changePercentage,
            },
        ];
    } else {
        series = filtered.map((p) => ({
            stockID: p.stockID ?? stockID,
            timestamp: p.timestamp,
            price: p.price,
            change: p.change,
            changePercentage: p.changePercentage,
        }));
    }

    const first = series[0];
    if (+new Date(first.timestamp) > minT + 1000) {
        series = [
            {
                stockID,
                timestamp: new Date(minT),
                price: first.price,
                change: 0,
                changePercentage: 0,
            },
            ...series,
        ];
    }

    let last = series[series.length - 1];
    let lastMs = +new Date(last.timestamp);
    const lastP = last.price;
    const endP =
        livePrice != null && Number.isFinite(livePrice) && livePrice >= 0 ? livePrice : lastP;

    if (lastMs >= maxT - SNAP_LAST_TO_NOW_MS) {
        return [
            ...series.slice(0, -1),
            {
                ...last,
                timestamp: new Date(maxT),
                price: endP,
                change: 0,
                changePercentage: 0,
            },
        ];
    }

    if (Math.abs(endP - lastP) <= PRICE_EPS) {
        return [
            ...series,
            {
                stockID,
                timestamp: new Date(maxT),
                price: lastP,
                change: 0,
                changePercentage: 0,
            },
        ];
    }

    return [
        ...series,
        {
            stockID,
            timestamp: new Date(maxT),
            price: lastP,
            change: 0,
            changePercentage: 0,
        },
        {
            stockID,
            timestamp: new Date(maxT),
            price: endP,
            change: 0,
            changePercentage: 0,
        },
    ];
}
