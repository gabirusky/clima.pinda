// ============================================================
// Unit Tests — dataProcessing.ts
// Tests groupByYear, groupByDecade, filterByYear, countDaysAboveThreshold
// ============================================================

import {
    groupByYear,
    groupByDecade,
    filterByYear,
    countDaysAboveThreshold,
    metricsToArray,
    findRecordYear,
    decadalAverage,
} from '@/utils/dataProcessing.ts';
import type { DailyRecord, AnnualMetrics } from '@/types/climate.ts';

// ── Fixtures ─────────────────────────────────────────────────

const makeDayRecord = (date: string, temp_max: number, temp_min = 18): DailyRecord => ({
    date,
    temp_max,
    temp_min,
    temp_mean: (temp_max + temp_min) / 2,
    precipitation: 0,
    humidity: 70,
    wind_max: 10,
});

const RECORDS: DailyRecord[] = [
    makeDayRecord('1980-01-01', 32),
    makeDayRecord('1980-06-15', 22),
    makeDayRecord('1990-03-10', 31),
    makeDayRecord('1990-11-20', 28),
    makeDayRecord('2024-01-05', 38),
    makeDayRecord('2024-07-20', 25),
];

const METRICS: Record<number, AnnualMetrics> = {
    2020: { year: 2020, su30: 100, su25: 150, tr20: 60, dtr_mean: 10, wsdi_days: 40, tx90p: 30, tn90p: 25, cdd: 20, cwd: 15, gdd: 2000, p95_days: 35, anomaly: 1.5 } as AnnualMetrics,
    2021: { year: 2021, su30: 120, su25: 170, tr20: 70, dtr_mean: 10.5, wsdi_days: 50, tx90p: 35, tn90p: 30, cdd: 25, cwd: 12, gdd: 2200, p95_days: 40, anomaly: 1.8 } as AnnualMetrics,
    2022: { year: 2022, su30: 80, su25: 130, tr20: 55, dtr_mean: 9.5, wsdi_days: 30, tx90p: 20, tn90p: 18, cdd: 18, cwd: 20, gdd: 1800, p95_days: 28, anomaly: 1.2 } as AnnualMetrics,
};

// ── groupByYear ───────────────────────────────────────────────

describe('groupByYear', () => {
    it('creates a Map with correct keys', () => {
        const map = groupByYear(RECORDS);
        expect(map.has(1980)).toBe(true);
        expect(map.has(1990)).toBe(true);
        expect(map.has(2024)).toBe(true);
    });

    it('assigns the correct number of records per year', () => {
        const map = groupByYear(RECORDS);
        expect(map.get(1980)).toHaveLength(2);
        expect(map.get(1990)).toHaveLength(2);
        expect(map.get(2024)).toHaveLength(2);
    });

    it('returns empty Map for empty input', () => {
        expect(groupByYear([])).toEqual(new Map());
    });
});

// ── groupByDecade ─────────────────────────────────────────────

describe('groupByDecade', () => {
    it('groups 1980 and 1985 into the 1980 decade', () => {
        const records = [
            makeDayRecord('1980-01-01', 30),
            makeDayRecord('1985-06-01', 32),
        ];
        const map = groupByDecade(records);
        expect(map.has(1980)).toBe(true);
        expect(map.get(1980)).toHaveLength(2);
    });

    it('correctly buckets crossover years', () => {
        const map = groupByDecade(RECORDS);
        // 1980-01-01, 1980-06-15 → decade 1980
        expect(map.get(1980)).toHaveLength(2);
        // 1990-03-10, 1990-11-20 → decade 1990
        expect(map.get(1990)).toHaveLength(2);
        // 2024-* → decade 2020
        expect(map.get(2020)).toHaveLength(2);
    });
});

// ── filterByYear ──────────────────────────────────────────────

describe('filterByYear', () => {
    it('returns only records matching the year', () => {
        const result = filterByYear(RECORDS, 1990);
        expect(result).toHaveLength(2);
        result.forEach((r: DailyRecord) => expect(r.date.startsWith('1990')).toBe(true));
    });

    it('returns empty array when no records match', () => {
        expect(filterByYear(RECORDS, 2000)).toHaveLength(0);
    });
});

// ── countDaysAboveThreshold ───────────────────────────────────

describe('countDaysAboveThreshold', () => {
    const records = [
        makeDayRecord('2024-01-01', 25),
        makeDayRecord('2024-01-02', 30),
        makeDayRecord('2024-01-03', 32),
        makeDayRecord('2024-01-04', 29),
        makeDayRecord('2024-01-05', 35),
    ];

    it('counts days at or above threshold', () => {
        expect(countDaysAboveThreshold(records, 30)).toBe(3); // 30, 32, 35
    });

    it('returns 0 when no days meet threshold', () => {
        expect(countDaysAboveThreshold(records, 40)).toBe(0);
    });

    it('returns all days when threshold is very low', () => {
        expect(countDaysAboveThreshold(records, 20)).toBe(5);
    });

    it('handles empty array', () => {
        expect(countDaysAboveThreshold([], 30)).toBe(0);
    });
});

// ── metricsToArray ────────────────────────────────────────────

describe('metricsToArray', () => {
    it('returns sorted array of AnnualMetrics', () => {
        const arr = metricsToArray(METRICS);
        expect(arr).toHaveLength(3);
        expect(arr[0].year).toBe(2020);
        expect(arr[1].year).toBe(2021);
        expect(arr[2].year).toBe(2022);
    });
});

// ── findRecordYear ────────────────────────────────────────────

describe('findRecordYear', () => {
    it('finds the year with maximum su30', () => {
        const result = findRecordYear(METRICS, 'su30');
        expect(result).not.toBeNull();
        expect(result!.year).toBe(2021); // 120 is the max
        expect(result!.value).toBe(120);
    });

    it('returns null for empty metrics', () => {
        expect(findRecordYear({}, 'su30')).toBeNull();
    });
});

// ── decadalAverage ────────────────────────────────────────────

describe('decadalAverage', () => {
    it('computes correct average for a decade', () => {
        const result = decadalAverage(METRICS, 'su30');
        // All 3 years (2020,2021,2022) are in the 2020 decade
        // avg = (100 + 120 + 80) / 3 = 100
        const decade2020 = result.find((d: { decade: number; value: number }) => d.decade === 2020);
        expect(decade2020).toBeDefined();
        expect(decade2020!.value).toBeCloseTo(100);
    });
});
