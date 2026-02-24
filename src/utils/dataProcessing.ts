// ============================================================
// Data processing utilities for climate records.
// All functions are pure (no side effects).
// ============================================================

import type { DailyRecord, AnnualMetrics } from '../types/climate.ts';

// ── Filtering ────────────────────────────────────────────────────────────────

/**
 * Filters daily records to a specific year.
 *
 * @param records - Full DailyRecord array
 * @param year    - Target year (e.g. 2024)
 */
export function filterByYear(records: DailyRecord[], year: number): DailyRecord[] {
    const prefix = `${year}-`;
    return records.filter(r => r.date.startsWith(prefix));
}

/**
 * Filters daily records to a year range [startYear, endYear] (inclusive).
 */
export function filterByYearRange(
    records: DailyRecord[],
    startYear: number,
    endYear: number
): DailyRecord[] {
    return records.filter(r => {
        const y = parseInt(r.date.substring(0, 4), 10);
        return y >= startYear && y <= endYear;
    });
}

// ── Grouping ─────────────────────────────────────────────────────────────────

/**
 * Groups daily records by year.
 * Returns a Map<year, DailyRecord[]> for efficient lookup.
 */
export function groupByYear(records: DailyRecord[]): Map<number, DailyRecord[]> {
    const map = new Map<number, DailyRecord[]>();
    for (const r of records) {
        const year = parseInt(r.date.substring(0, 4), 10);
        if (!map.has(year)) map.set(year, []);
        map.get(year)!.push(r);
    }
    return map;
}

/**
 * Groups daily records by decade.
 * Returns a Map<decade, DailyRecord[]> where decade = year // 10 * 10.
 * E.g., 1985 → 1980, 2024 → 2020.
 */
export function groupByDecade(records: DailyRecord[]): Map<number, DailyRecord[]> {
    const map = new Map<number, DailyRecord[]>();
    for (const r of records) {
        const year = parseInt(r.date.substring(0, 4), 10);
        const decade = Math.floor(year / 10) * 10;
        if (!map.has(decade)) map.set(decade, []);
        map.get(decade)!.push(r);
    }
    return map;
}

/**
 * Groups annual metrics by decade.
 * Returns a Map<decade, AnnualMetrics[]>.
 */
export function groupMetricsByDecade(
    metrics: Record<number, AnnualMetrics>
): Map<number, AnnualMetrics[]> {
    const map = new Map<number, AnnualMetrics[]>();
    for (const [yearStr, m] of Object.entries(metrics)) {
        const year = parseInt(yearStr, 10);
        const decade = Math.floor(year / 10) * 10;
        if (!map.has(decade)) map.set(decade, []);
        map.get(decade)!.push(m);
    }
    return map;
}

// ── Aggregation helpers ───────────────────────────────────────────────────────

/**
 * Converts the metrics Record<number, AnnualMetrics> into a sorted array of
 * { year: number } & AnnualMetrics objects, suitable for Recharts.
 */
export function metricsToArray(
    metrics: Record<number, AnnualMetrics>
): Array<{ year: number } & AnnualMetrics> {
    return Object.entries(metrics)
        .map(([yearStr, m]) => ({ year: parseInt(yearStr, 10), ...m }))
        .sort((a, b) => a.year - b.year);
}

/**
 * Extracts a single metric time series from the annual metrics object.
 * Returns an array of { year, value } sorted by year.
 *
 * @param metrics   - Annual metrics dictionary
 * @param metricKey - Key of AnnualMetrics to extract (e.g. 'su30')
 */
export function extractTimeSeries(
    metrics: Record<number, AnnualMetrics>,
    metricKey: keyof AnnualMetrics
): Array<{ year: number; value: number }> {
    return metricsToArray(metrics).map(row => ({
        year: row.year,
        value: row[metricKey] as number,
    }));
}

/**
 * Computes the day of year (1–366) for a given YYYY-MM-DD string.
 * Uses UTC to avoid timezone shifts.
 */
export function dayOfYear(dateStr: string): number {
    const [year, month, day] = dateStr.split('-').map(Number);
    const start = Date.UTC(year, 0, 0);
    const current = Date.UTC(year, month - 1, day);
    return Math.round((current - start) / 86_400_000);
}

/**
 * Extracts the year (as number) from a YYYY-MM-DD date string.
 */
export function yearFromDate(dateStr: string): number {
    return parseInt(dateStr.substring(0, 4), 10);
}

/**
 * Extracts the month (1–12) from a YYYY-MM-DD date string.
 */
export function monthFromDate(dateStr: string): number {
    return parseInt(dateStr.substring(5, 7), 10);
}

/**
 * Returns the unique sorted years present in the metrics dictionary.
 */
export function getYears(metrics: Record<number, AnnualMetrics>): number[] {
    return Object.keys(metrics)
        .map(Number)
        .sort((a, b) => a - b);
}

/**
 * Returns the unique sorted decades present in the metrics dictionary.
 */
export function getDecades(metrics: Record<number, AnnualMetrics>): number[] {
    const decades = new Set(getYears(metrics).map(y => Math.floor(y / 10) * 10));
    return [...decades].sort((a, b) => a - b);
}

/**
 * Counts days above a T_max threshold in a set of daily records.
 * Used for the ThresholdSlider widget.
 *
 * @param records   - Daily records (typically for a single year)
 * @param threshold - Temperature threshold (°C)
 */
export function countDaysAboveThreshold(records: DailyRecord[], threshold: number): number {
    return records.filter(r => r.temp_max >= threshold).length;
}

/**
 * Computes monthly averages of a given field from daily records.
 * Returns an array of 12 values (index 0 = January, 11 = December).
 */
export function monthlyAverages(
    records: DailyRecord[],
    field: keyof Pick<DailyRecord, 'temp_max' | 'temp_min' | 'temp_mean' | 'precipitation' | 'humidity' | 'wind_max'>
): number[] {
    const sums = new Array(12).fill(0);
    const counts = new Array(12).fill(0);
    for (const r of records) {
        const m = monthFromDate(r.date) - 1; // 0-based
        const val = r[field] as number;
        if (val !== null && !isNaN(val)) {
            sums[m] += val;
            counts[m]++;
        }
    }
    return sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : NaN));
}
