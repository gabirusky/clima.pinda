// ============================================================
// Statistical Calculations — "A City's Memory of Heat"
// Pure functions — no React, no D3 dependencies.
// All functions are unit-testable with known inputs.
// ============================================================

export interface LinearRegressionResult {
    slope: number;          // Units per x-unit
    intercept: number;      // y-intercept
    r2: number;             // Coefficient of determination (0–1)
    slopePerDecade: number; // Convenient: slope × 10
}

/**
 * Computes OLS linear regression using the least-squares method.
 * Used for trend lines on all time series charts.
 *
 * @param x - Array of x values (e.g., years)
 * @param y - Array of y values (e.g., SU30 counts)
 * @returns slope, intercept, r², slopePerDecade values
 */
export function linearRegression(x: number[], y: number[]): LinearRegressionResult {
    const n = x.length;
    if (n < 2 || n !== y.length) {
        return { slope: 0, intercept: 0, r2: 0, slopePerDecade: 0 };
    }

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let ssXX = 0;
    let ssXY = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        ssXX += dx * dx;
        ssXY += dx * dy;
        ssTot += dy * dy;
    }

    if (ssXX === 0) return { slope: 0, intercept: meanY, r2: 0, slopePerDecade: 0 };

    const slope = ssXY / ssXX;
    const intercept = meanY - slope * meanX;

    // Compute SSRes for R²
    let ssRes = 0;
    for (let i = 0; i < n; i++) {
        const predicted = slope * x[i] + intercept;
        const residual = y[i] - predicted;
        ssRes += residual * residual;
    }

    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return { slope, intercept, r2: Math.max(0, r2), slopePerDecade: slope * 10 };
}

/**
 * Generates predicted y values for an array of x values using regression result.
 * Used to draw the trend line on time series charts.
 */
export function predictRegression(
    xValues: number[],
    result: LinearRegressionResult,
): number[] {
    return xValues.map(x => result.slope * x + result.intercept);
}

/**
 * Generates a trend line array from regression result over a range of x values.
 */
export function trendLine(
    xValues: number[],
    result: LinearRegressionResult
): Array<{ x: number; y: number }> {
    return xValues.map(x => ({ x, y: result.slope * x + result.intercept }));
}

/**
 * Computes a simple moving average with the given window size.
 * Returns an array of the same length; leading values use available data only.
 *
 * @param arr - Input array
 * @param window - Window size (number of elements to average)
 */
export function movingAverage(arr: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < arr.length; i++) {
        const start = Math.max(0, i - Math.floor(window / 2));
        const end = Math.min(arr.length, i + Math.ceil(window / 2));
        const slice = arr.slice(start, end).filter(v => !isNaN(v));
        result.push(slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : NaN);
    }
    return result;
}

/**
 * Computes the p-th percentile of a numeric array.
 * Uses linear interpolation between adjacent ranks (standard definition).
 *
 * @param arr - Input array (need not be sorted)
 * @param p - Percentile in range [0, 100]
 */
export function percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    const fraction = index - lower;
    return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

/**
 * Computes kernel density estimation for a numeric array.
 * Returns an array of [x, density] points for use in D3 area charts.
 *
 * @param values - Input data
 * @param bandwidth - Gaussian kernel bandwidth (default: Silverman's rule)
 * @param nPoints - Number of x-axis evaluation points (default: 100)
 * @param domain - [min, max] domain for x (default: data range ± 2*bandwidth)
 */
export function kernelDensityEstimate(
    values: number[],
    bandwidth?: number,
    nPoints = 100,
    domain?: [number, number],
): Array<[number, number]> {
    if (values.length === 0) return [];

    const n = values.length;
    const std = Math.sqrt(
        values.reduce((acc, v) => acc + v * v, 0) / n -
        (values.reduce((a, b) => a + b, 0) / n) ** 2,
    );

    // Silverman's rule of thumb
    const h = bandwidth ?? (1.06 * std * Math.pow(n, -0.2));

    const xMin = domain ? domain[0] : Math.min(...values) - 2 * h;
    const xMax = domain ? domain[1] : Math.max(...values) + 2 * h;
    const step = (xMax - xMin) / (nPoints - 1);

    const result: Array<[number, number]> = [];
    for (let i = 0; i < nPoints; i++) {
        const x = xMin + i * step;
        let density = 0;
        for (const v of values) {
            const u = (x - v) / h;
            density += Math.exp(-0.5 * u * u);
        }
        density /= n * h * Math.sqrt(2 * Math.PI);
        result.push([x, density]);
    }
    return result;
}

/** Alias for backward compat */
export function kernelDensityEstimator(
    bandwidth: number,
    thresholds: number[],
    data: number[]
): Array<[number, number]> {
    return thresholds.map(x => {
        let density = 0;
        for (const v of data) {
            const u = (x - v) / bandwidth;
            if (Math.abs(u) <= 1) {
                density += 0.75 * (1 - u * u);
            }
        }
        density /= (data.length * bandwidth || 1);
        return [x, density];
    });
}

/** Computes the mean of an array, ignoring NaN values. */
export function mean(arr: number[]): number {
    const valid = arr.filter(v => !isNaN(v));
    return valid.length === 0 ? NaN : valid.reduce((a, b) => a + b, 0) / valid.length;
}

/** Computes the standard deviation (population) of an array, ignoring NaN. */
export function stdDev(arr: number[]): number {
    const m = mean(arr);
    if (isNaN(m)) return NaN;
    const valid = arr.filter(v => !isNaN(v));
    const variance = valid.reduce((s, x) => s + (x - m) ** 2, 0) / valid.length;
    return Math.sqrt(variance);
}

/**
 * Clamps a number to [min, max].
 */
export function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

/** Normalizes a value from [domainMin, domainMax] to [0, 1]. */
export function normalize(val: number, domainMin: number, domainMax: number): number {
    if (domainMax === domainMin) return 0;
    return clamp((val - domainMin) / (domainMax - domainMin), 0, 1);
}

/**
 * Linearly interpolates between a and b by t ∈ [0, 1].
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * clamp(t, 0, 1);
}
