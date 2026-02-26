// ============================================================
// Color Utilities — "A City's Memory of Heat"
// Maps temperature / anomaly values to the Ed Hawkins stripe palette.
// ============================================================

import { STRIPES_BASELINE_START, STRIPES_BASELINE_END } from '../constants/thresholds.ts';

/**
 * Ed Hawkins climate stripe color stops (diverging: cold blue → white → hot red).
 * These are the exact hex values from showyourstripes.info.
 */
const STRIPE_STOPS = [
    { value: -2.5, hex: '#08306b' },
    { value: -1.8, hex: '#2166ac' },
    { value: -1.0, hex: '#4393c3' },
    { value: -0.3, hex: '#92c5de' },
    { value: 0.0, hex: '#f7f7f7' },
    { value: 0.3, hex: '#fddbc7' },
    { value: 1.0, hex: '#ef8a62' },
    { value: 1.8, hex: '#d6604d' },
    { value: 2.5, hex: '#b2182b' },
    { value: 3.5, hex: '#67001f' },
] as const;

/** Linear interpolation between two numbers */
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** Parse a hex string to [r, g, b] components */
function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Convert [r, g, b] integers to CSS rgb() string */
function rgbToCss(r: number, g: number, b: number): string {
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/**
 * Linear interpolation between two hex colors.
 */
export function lerpColor(colorA: string, colorB: string, t: number): string {
    const [r1, g1, b1] = hexToRgb(colorA);
    const [r2, g2, b2] = hexToRgb(colorB);
    return rgbToCss(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

/**
 * Maps a temperature anomaly value (°C relative to 1940–1980 baseline)
 * to a climate stripe color using the Ed Hawkins palette.
 *
 * @param anomaly - Temperature deviation from baseline in °C
 * @returns CSS color string
 */
export function anomalyToStripeColor(anomaly: number): string {
    const stops = STRIPE_STOPS;

    // Clamp to range
    if (anomaly <= stops[0].value) return stops[0].hex;
    if (anomaly >= stops[stops.length - 1].value) return stops[stops.length - 1].hex;

    // Find surrounding stops and interpolate
    for (let i = 0; i < stops.length - 1; i++) {
        const lo = stops[i];
        const hi = stops[i + 1];
        if (anomaly >= lo.value && anomaly <= hi.value) {
            const t = (anomaly - lo.value) / (hi.value - lo.value);
            const [r1, g1, b1] = hexToRgb(lo.hex);
            const [r2, g2, b2] = hexToRgb(hi.hex);
            return rgbToCss(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
        }
    }

    return stops[stops.length - 1].hex;
}

/**
 * Computes the 1940–1980 baseline mean from annual metrics data,
 * then maps each year's average temperature to a stripe color.
 */
export function tempToStripeColor(temp: number, baselineMean: number): string {
    const anomaly = temp - baselineMean;
    return anomalyToStripeColor(anomaly);
}

/**
 * Maps a temperature value (°C) to a CSS color string.
 * Uses a blue → white → red diverging scale anchored at 20°C.
 * Domain: [10°C, 40°C]
 */
export function tempToColor(temp: number): string {
    const t = Math.max(10, Math.min(40, temp));
    const n = (t - 10) / 30;
    if (n < 0.33) {
        return lerpColor('#2166ac', '#f7f7f7', n / 0.33);
    } else {
        return lerpColor('#f7f7f7', '#b2182b', (n - 0.33) / 0.67);
    }
}

/**
 * Sequential temperature color scale — used for calendar heatmaps.
 * Maps an absolute T_max value to a blue→yellow→red color.
 * Domain: [10°C, 40°C]
 */
export function tempToHeatmapColor(temp: number): string {
    const HEATMAP_STOPS = [
        { value: 10, hex: '#2166ac' },  // cold blue
        { value: 20, hex: '#67a9cf' },  // cool blue
        { value: 25, hex: '#fddbc7' },  // pale orange/pink
        { value: 30, hex: '#d6604d' },  // red-orange
        { value: 35, hex: '#b2182b' },  // dark red
    ] as const;

    if (temp <= HEATMAP_STOPS[0].value) return HEATMAP_STOPS[0].hex;
    if (temp >= HEATMAP_STOPS[HEATMAP_STOPS.length - 1].value) return HEATMAP_STOPS[HEATMAP_STOPS.length - 1].hex;

    for (let i = 0; i < HEATMAP_STOPS.length - 1; i++) {
        const lo = HEATMAP_STOPS[i];
        const hi = HEATMAP_STOPS[i + 1];
        if (temp >= lo.value && temp <= hi.value) {
            const t = (temp - lo.value) / (hi.value - lo.value);
            const [r1, g1, b1] = hexToRgb(lo.hex);
            const [r2, g2, b2] = hexToRgb(hi.hex);
            return rgbToCss(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
        }
    }

    return HEATMAP_STOPS[HEATMAP_STOPS.length - 1].hex;
}

/**
 * Computes the baseline mean temperature from an array of annual temp values,
 * filtering to the Stripes baseline period (1940–1980 by default).
 */
export function computeBaselineMean(
    data: Array<{ year: number; temp_mean_annual: number }>,
    start = STRIPES_BASELINE_START,
    end = STRIPES_BASELINE_END,
): number {
    const baselineValues = data
        .filter(d => d.year >= start && d.year <= end)
        .map(d => d.temp_mean_annual);

    if (baselineValues.length === 0) return 0;
    return baselineValues.reduce((a, b) => a + b, 0) / baselineValues.length;
}

/** Maps a decade index (0=1940s, 8=2020s) to a stripe palette color */
export function decadeToColor(decadeIndex: number): string {
    const colors = [
        '#08306b', // 1940s — deep cold
        '#2166ac', // 1950s
        '#4393c3', // 1960s
        '#92c5de', // 1970s
        '#fddbc7', // 1980s — warm
        '#ef8a62', // 1990s
        '#d6604d', // 2000s
        '#b2182b', // 2010s — burning
        '#67001f', // 2020s — extreme
    ];
    const idx = Math.max(0, Math.min(colors.length - 1, decadeIndex));
    return colors[idx];
}

/** Returns a CSS color for a SU30 count value. */
export function su30ToColor(days: number): string {
    const n = Math.max(0, Math.min(1, days / 150));
    return lerpColor('#fef9c3', '#7f1d1d', n);
}

/** Returns a CSS color for a precipitation total value. */
export function precipToColor(mm: number): string {
    const n = Math.max(0, Math.min(1, (mm - 500) / 2000));
    return lerpColor('#fef3c7', '#1e40af', n);
}
