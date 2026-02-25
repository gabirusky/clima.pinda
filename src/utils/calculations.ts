// ============================================================
<<<<<<< HEAD
// Statistical and mathematical utility functions.
// These are pure functions with no side effects.
// ============================================================

// ── Linear Regression ────────────────────────────────────────────────────────

export interface RegressionResult {
    slope: number;
    intercept: number;
    r2: number;
    pValue: number;
    slopePerDecade: number;
}

/**
 * Computes a simple OLS linear regression of y on x.
 * Returns slope, intercept, R², approximate p-value, and slope per decade.
 *
 * @param x - Independent variable (e.g. years)
 * @param y - Dependent variable (e.g. SU30 days)
 * @returns RegressionResult with slope, intercept, r2, pValue, slopePerDecade
 */
export function linearRegression(x: number[], y: number[]): RegressionResult {
    const n = x.length;
    if (n < 3 || x.length !== y.length) {
        return { slope: NaN, intercept: NaN, r2: NaN, pValue: NaN, slopePerDecade: NaN };
=======
// Statistical Calculations — "A City's Memory of Heat"
// Pure functions — no React, no D3 dependencies.
// All functions are unit-testable with known inputs.
// ============================================================

export interface LinearRegressionResult {
    slope: number;          // Units per x-unit
    intercept: number;      // y-intercept
    r2: number;             // Coefficient of determination (0–1)
    pValue?: number;        // Not computed here — use Mann-Kendall from Python
}

/**
 * Computes OLS linear regression using the least-squares method.
 * Used for trend lines on all time series charts.
 *
 * @param x - Array of x values (e.g., years)
 * @param y - Array of y values (e.g., SU30 counts)
 * @returns slope, intercept, r² values
 */
export function linearRegression(x: number[], y: number[]): LinearRegressionResult {
    const n = x.length;
    if (n < 2 || n !== y.length) {
        return { slope: 0, intercept: 0, r2: 0 };
>>>>>>> 004c615 (feat: new plan and frontend foundation)
    }

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

<<<<<<< HEAD
    let ssXX = 0, ssXY = 0, ssYY = 0;
=======
    let ssXX = 0;
    let ssXY = 0;
    let ssTot = 0;

>>>>>>> 004c615 (feat: new plan and frontend foundation)
    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        ssXX += dx * dx;
        ssXY += dx * dy;
<<<<<<< HEAD
        ssYY += dy * dy;
    }

    const slope = ssXX === 0 ? 0 : ssXY / ssXX;
    const intercept = meanY - slope * meanX;
    const r2 = ssYY === 0 ? 0 : (ssXY * ssXY) / (ssXX * ssYY);

    // Approximate t-statistic → p-value (two-tailed, F-distribution approximation)
    const df = n - 2;
    const sErr = ssYY === 0 ? 0 : Math.sqrt((ssYY - slope * ssXY) / df);
    const se = ssXX === 0 ? Infinity : sErr / Math.sqrt(ssXX);
    const t = slope / (se || Infinity);
    const pValue = approximatePValue(Math.abs(t), df);

    return {
        slope,
        intercept,
        r2,
        pValue,
        slopePerDecade: slope * 10,
    };
}

/**
 * Computes the predicted y value at a given x using a regression result.
 */
export function predictY(x: number, result: RegressionResult): number {
    return result.slope * x + result.intercept;
}

/**
 * Generates a trend line array from regression result over a range of x values.
 */
export function trendLine(
    xValues: number[],
    result: RegressionResult
): Array<{ x: number; y: number }> {
    return xValues.map(x => ({ x, y: predictY(x, result) }));
}

// ── Moving / Rolling Average ──────────────────────────────────────────────────

/**
 * Computes a centered moving average over an array.
 * At the edges, uses the available values (no padding with NaN).
 *
 * @param arr    - Input array of numbers
 * @param window - Number of elements to average (odd numbers recommended)
 * @returns Smoothed array of the same length
 */
export function movingAverage(arr: number[], window: number): number[] {
    const half = Math.floor(window / 2);
    return arr.map((_, i) => {
        const start = Math.max(0, i - half);
        const end = Math.min(arr.length, i + half + 1);
        const slice = arr.slice(start, end).filter(v => !isNaN(v));
        return slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : NaN;
    });
}

// ── Percentile ───────────────────────────────────────────────────────────────

/**
 * Computes the p-th percentile of an array using linear interpolation.
 *
 * @param arr - Input array of numbers (will be sorted internally)
 * @param p   - Percentile (0–100)
 * @returns Percentile value
 */
export function percentile(arr: number[], p: number): number {
    if (arr.length === 0) return NaN;
    const sorted = [...arr].filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (sorted.length === 0) return NaN;
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ── Kernel Density Estimation ─────────────────────────────────────────────────

/**
 * Gaussian Kernel Density Estimator for ridgeline plots.
 * Returns a density function that maps temperature → density value.
 *
 * @param bandwidth - Smoothing bandwidth (°C). Recommended: 0.5–1.5
 * @param thresholds - Array of x values to evaluate the density at
 * @param data       - Input temperature values
 * @returns Array of [x, density] pairs
 */
export function kernelDensityEstimator(
    bandwidth: number,
    thresholds: number[],
    data: number[]
): Array<[number, number]> {
    return thresholds.map(x => [x, kernelEpanechnikov(bandwidth, x, data)]);
}

function kernelEpanechnikov(bandwidth: number, x: number, data: number[]): number {
    const n = data.length;
    if (n === 0) return 0;
    let sum = 0;
    for (const xi of data) {
        const u = (x - xi) / bandwidth;
        if (Math.abs(u) <= 1) {
            sum += 0.75 * (1 - u * u);
        }
    }
    return sum / (n * bandwidth);
}

// ── Descriptive Statistics ────────────────────────────────────────────────────

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

/** Clamps a value to [min, max]. */
=======
        ssTot += dy * dy;
    }

    if (ssXX === 0) return { slope: 0, intercept: meanY, r2: 0 };

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

    return { slope, intercept, r2: Math.max(0, r2) };
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
        const slice = arr.slice(start, end);
        result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
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
    const sorted = [...arr].sort((a, b) => a - b);
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

/**
 * Clamps a number to [min, max].
 */
>>>>>>> 004c615 (feat: new plan and frontend foundation)
export function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

<<<<<<< HEAD
/** Normalizes a value from [domainMin, domainMax] to [0, 1]. */
export function normalize(val: number, domainMin: number, domainMax: number): number {
    if (domainMax === domainMin) return 0;
    return clamp((val - domainMin) / (domainMax - domainMin), 0, 1);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Approximate two-tailed p-value from a t-statistic using the regularized
 * incomplete beta function approximation (Abramowitz & Stegun §26.7).
 * Sufficient precision for visualization purposes (not for publication).
 */
function approximatePValue(t: number, df: number): number {
    if (!isFinite(t) || df <= 0) return NaN;
    // For large df, use normal approximation
    if (df > 200) {
        return 2 * (1 - normalCDF(t));
    }
    // Simplified Cornish-Fisher approximation for moderate df
    const x = df / (df + t * t);
    const p = incompleteBeta(df / 2, 0.5, x);
    return Math.min(1, Math.max(0, p));
}

function normalCDF(z: number): number {
    // Abramowitz & Stegun 26.2.17
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    const base = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-z * z / 2) * poly;
    return z >= 0 ? base : 1 - base;
}

function incompleteBeta(a: number, b: number, x: number): number {
    // Very rough approximation — sufficient for p-value indication only
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Use log-beta approximation
    const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
    const logVal = a * Math.log(x) + b * Math.log(1 - x) - lbeta;
    return Math.exp(logVal) * (a + b) / (a * (a + 1));
}

function logGamma(x: number): number {
    // Stirling approximation
    return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI);
=======
/**
 * Linearly interpolates between a and b by t ∈ [0, 1].
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * clamp(t, 0, 1);
>>>>>>> 004c615 (feat: new plan and frontend foundation)
}
