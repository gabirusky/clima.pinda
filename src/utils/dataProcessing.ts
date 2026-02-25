// ============================================================
<<<<<<< HEAD
// Data processing utilities for climate records.
// All functions are pure (no side effects).
=======
// Data Processing — "A City's Memory of Heat"
// Pure functions that transform climate data shapes.
// No React, no D3 dependencies.
>>>>>>> 004c615 (feat: new plan and frontend foundation)
// ============================================================

import type { DailyRecord, AnnualMetrics } from '../types/climate.ts';

<<<<<<< HEAD
// ── Filtering ────────────────────────────────────────────────────────────────

/**
 * Filters daily records to a specific year.
 *
 * @param records - Full DailyRecord array
 * @param year    - Target year (e.g. 2024)
=======
// ─── Grouping ────────────────────────────────────────────────

/**
 * Groups an array of DailyRecords by year.
 * Returns a Map keyed by year number.
 */
export function groupByYear(records: DailyRecord[]): Map<number, DailyRecord[]> {
    const map = new Map<number, DailyRecord[]>();
    for (const record of records) {
        const year = parseInt(record.date.slice(0, 4), 10);
        const existing = map.get(year);
        if (existing) {
            existing.push(record);
        } else {
            map.set(year, [record]);
        }
    }
    return map;
}

/**
 * Groups an array of DailyRecords by decade (e.g., 1985 → 1980).
 * Returns a Map keyed by decade start year.
 */
export function groupByDecade(records: DailyRecord[]): Map<number, DailyRecord[]> {
    const map = new Map<number, DailyRecord[]>();
    for (const record of records) {
        const year = parseInt(record.date.slice(0, 4), 10);
        const decade = Math.floor(year / 10) * 10;
        const existing = map.get(decade);
        if (existing) {
            existing.push(record);
        } else {
            map.set(decade, [record]);
        }
    }
    return map;
}

/**
 * Groups annual metrics by decade.
 * Returns a Map keyed by decade start year, with the array of individual years.
 */
export function groupMetricsByDecade(
    metrics: Record<number, AnnualMetrics>,
): Map<number, AnnualMetrics[]> {
    const map = new Map<number, AnnualMetrics[]>();
    for (const [yearStr, m] of Object.entries(metrics)) {
        const year = Number(yearStr);
        const decade = Math.floor(year / 10) * 10;
        const existing = map.get(decade);
        if (existing) {
            existing.push(m);
        } else {
            map.set(decade, [m]);
        }
    }
    return map;
}

// ─── Filtering ───────────────────────────────────────────────

/**
 * Filters daily records to a specific year.
>>>>>>> 004c615 (feat: new plan and frontend foundation)
 */
export function filterByYear(records: DailyRecord[], year: number): DailyRecord[] {
    const prefix = `${year}-`;
    return records.filter(r => r.date.startsWith(prefix));
}

/**
<<<<<<< HEAD
 * Filters daily records to a year range [startYear, endYear] (inclusive).
=======
 * Filters daily records to a year range [startYear, endYear] inclusive.
>>>>>>> 004c615 (feat: new plan and frontend foundation)
 */
export function filterByYearRange(
    records: DailyRecord[],
    startYear: number,
<<<<<<< HEAD
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
=======
    endYear: number,
): DailyRecord[] {
    return records.filter(r => {
        const year = parseInt(r.date.slice(0, 4), 10);
        return year >= startYear && year <= endYear;
    });
}

/**
 * Filters the annual metrics Record to a year range [startYear, endYear] inclusive.
 * Returns a plain object (not a Map) for use in Recharts-compatible arrays.
 */
export function filterMetricsByYearRange(
    metrics: Record<number, AnnualMetrics>,
    startYear: number,
    endYear: number,
): AnnualMetrics[] {
    return Object.entries(metrics)
        .map(([, m]) => m)
        .filter(m => m.year >= startYear && m.year <= endYear)
        .sort((a, b) => a.year - b.year);
}

// ─── Derived Metrics ─────────────────────────────────────────

/**
 * Converts metrics Record<year, AnnualMetrics> to a sorted array.
 * This is the most common transform needed for Recharts and D3.
 */
export function metricsToArray(
    metrics: Record<number, AnnualMetrics>,
): AnnualMetrics[] {
    return Object.values(metrics).sort((a, b) => a.year - b.year);
}

/**
 * Computes the per-decade average of a single numeric metric.
 *
 * @param metrics - All annual metrics
 * @param key - Which field to average (e.g., 'su30')
 * @returns Array of [decade, average] pairs, sorted ascending by decade
 */
export function decadalAverage(
    metrics: Record<number, AnnualMetrics>,
    key: keyof AnnualMetrics,
): Array<{ decade: number; value: number }> {
    const groups = groupMetricsByDecade(metrics);
    const result: Array<{ decade: number; value: number }> = [];

    for (const [decade, items] of groups) {
        const values = items.map(m => m[key] as number).filter(v => typeof v === 'number');
        if (values.length === 0) continue;
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        result.push({ decade, value: avg });
    }

    return result.sort((a, b) => a.decade - b.decade);
}

/**
 * Finds the record (maximum) year for a given metric.
 * Returns { year, value } or null if metrics is empty.
 */
export function findRecordYear(
    metrics: Record<number, AnnualMetrics>,
    key: keyof AnnualMetrics,
): { year: number; value: number } | null {
    let best: { year: number; value: number } | null = null;
    for (const m of Object.values(metrics)) {
        const v = m[key] as number;
        if (best === null || v > best.value) {
            best = { year: m.year, value: v };
        }
    }
    return best;
}

// ─── Calendar Utilities ───────────────────────────────────────

/**
 * Returns the ISO day-of-week for a date string.
 * 0 = Sunday … 6 = Saturday (JS convention)
 */
export function dayOfWeek(dateStr: string): number {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).getDay();
>>>>>>> 004c615 (feat: new plan and frontend foundation)
}
