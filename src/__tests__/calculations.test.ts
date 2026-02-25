// ============================================================
// Unit Tests — calculations.ts
// Tests linearRegression, movingAverage, percentile with known inputs
// ============================================================

import {
    linearRegression,
    predictRegression,
    movingAverage,
    percentile,
    clamp,
    lerp,
} from '@/utils/calculations.ts';

describe('linearRegression', () => {
    it('returns zero slope for horizontal line', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [10, 10, 10, 10, 10];
        const result = linearRegression(x, y);
        expect(result.slope).toBeCloseTo(0);
        expect(result.intercept).toBeCloseTo(10);
        expect(result.r2).toBeCloseTo(0);
    });

    it('returns slope=1 for perfectly linear y=x', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [1, 2, 3, 4, 5];
        const result = linearRegression(x, y);
        expect(result.slope).toBeCloseTo(1);
        expect(result.intercept).toBeCloseTo(0);
        expect(result.r2).toBeCloseTo(1);
    });

    it('returns slope=2 intercept=3 for y=2x+3', () => {
        const x = [0, 1, 2, 3, 4];
        const y = [3, 5, 7, 9, 11];
        const result = linearRegression(x, y);
        expect(result.slope).toBeCloseTo(2);
        expect(result.intercept).toBeCloseTo(3);
        expect(result.r2).toBeCloseTo(1);
        expect(result.slopePerDecade).toBeCloseTo(20);
    });

    it('handles empty / mismatched arrays gracefully', () => {
        expect(linearRegression([], []).slope).toBe(0);
        expect(linearRegression([1], [1]).slope).toBe(0); // n < 2
        expect(linearRegression([1, 2], [1]).slope).toBe(0); // length mismatch
    });

    it('slopePerDecade = slope * 10', () => {
        const x = [2000, 2010, 2020];
        const y = [30, 40, 50];
        const result = linearRegression(x, y);
        expect(result.slopePerDecade).toBeCloseTo(result.slope * 10);
    });
});

describe('predictRegression', () => {
    it('predicts y=2x+3 correctly', () => {
        const reg = linearRegression([0, 1, 2, 3], [3, 5, 7, 9]);
        const preds = predictRegression([4, 5], reg);
        expect(preds[0]).toBeCloseTo(11);
        expect(preds[1]).toBeCloseTo(13);
    });
});

describe('movingAverage', () => {
    it('returns the same value for constant array', () => {
        const result = movingAverage([5, 5, 5, 5, 5], 3);
        result.forEach((v: number) => expect(v).toBeCloseTo(5));
    });

    it('smooths a step function', () => {
        const arr = [0, 0, 0, 10, 10, 10];
        const ma = movingAverage(arr, 3);
        // Middle values should be somewhere between 0 and 10
        expect(ma[2]).toBeGreaterThan(0);
        expect(ma[2]).toBeLessThan(10);
    });

    it('returns same length as input', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7];
        expect(movingAverage(arr, 3)).toHaveLength(arr.length);
    });
});

describe('percentile', () => {
    it('returns median for p=50', () => {
        expect(percentile([1, 2, 3, 4, 5], 50)).toBeCloseTo(3);
    });

    it('returns min for p=0', () => {
        expect(percentile([3, 1, 4, 1, 5], 0)).toBeCloseTo(1);
    });

    it('returns max for p=100', () => {
        expect(percentile([3, 1, 4, 1, 5], 100)).toBeCloseTo(5);
    });

    it('returns 0 for empty array', () => {
        expect(percentile([], 50)).toBe(0);
    });

    it('interpolates between values', () => {
        const p75 = percentile([1, 2, 3, 4], 75);
        expect(p75).toBeGreaterThan(3);
        expect(p75).toBeLessThanOrEqual(4);
    });
});

describe('clamp', () => {
    it('clamps below min', () => expect(clamp(-5, 0, 10)).toBe(0));
    it('clamps above max', () => expect(clamp(15, 0, 10)).toBe(10));
    it('passes through in-range value', () => expect(clamp(5, 0, 10)).toBe(5));
});

describe('lerp', () => {
    it('returns a at t=0', () => expect(lerp(10, 20, 0)).toBe(10));
    it('returns b at t=1', () => expect(lerp(10, 20, 1)).toBe(20));
    it('returns midpoint at t=0.5', () => expect(lerp(10, 20, 0.5)).toBe(15));
    it('clamps t outside [0,1]', () => {
        expect(lerp(10, 20, -1)).toBe(10);
        expect(lerp(10, 20, 2)).toBe(20);
    });
});
