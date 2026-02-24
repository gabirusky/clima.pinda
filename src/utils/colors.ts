// ============================================================
// Color utility functions for climate data visualizations.
//
// All scales are designed to be:
//  • Perceptually uniform
//  • Colorblind-accessible (no pure red+green pairs)
//  • Consistent with Ed Hawkins' Climate Stripes palette
// ============================================================

/**
 * Maps a temperature value (°C) to a CSS hex color string.
 * Uses a blue → white → red diverging scale anchored at 20°C.
 * Domain: [10°C, 40°C] — covers the full Pindamonhangaba range.
 *
 * @param temp - Temperature in °C
 * @returns CSS color string (e.g. "#ef8a62")
 */
export function tempToColor(temp: number): string {
    // Clamp to domain
    const t = Math.max(10, Math.min(40, temp));
    // Normalize to [0, 1] within domain [10, 40]
    const n = (t - 10) / 30;

    // Diverging scale: cold (blue) → neutral (white) → hot (red)
    // Anchored at 20°C (n ≈ 0.33) as the "neutral" point
    if (n < 0.33) {
        // Cold: #2166ac → #f7f7f7
        const ratio = n / 0.33;
        return lerpColor('#2166ac', '#f7f7f7', ratio);
    } else {
        // Hot: #f7f7f7 → #b2182b
        const ratio = (n - 0.33) / 0.67;
        return lerpColor('#f7f7f7', '#b2182b', ratio);
    }
}

/**
 * Maps a temperature anomaly (°C deviation from baseline) to a CSS hex color.
 * Uses Ed Hawkins' Climate Stripes diverging blue→white→red palette.
 * Domain: [-2.5°C, +2.5°C] — covers the full 1940–2025 anomaly range.
 *
 * @param anomaly - Temperature anomaly in °C (negative = cooler, positive = warmer)
 * @returns CSS color string (e.g. "#a50f15" for a very warm year)
 */
export function anomalyToStripeColor(anomaly: number): string {
    // Ed Hawkins' original 9-color diverging palette (blue → white → red)
    const STRIPE_COLORS = [
        '#08519c', // deep cold  ≤ -2.0°C
        '#2171b5', // cold       -2.0 to -1.5°C
        '#6baed6', // cool-cold  -1.5 to -1.0°C
        '#bdd7e7', // cool       -1.0 to -0.5°C
        '#f7f7f7', // neutral    -0.5 to +0.5°C
        '#fcbba1', // warm        0.5 to  1.0°C
        '#fc6d4c', // warmer      1.0 to  1.5°C
        '#ef3b2c', // hot         1.5 to  2.0°C
        '#a50f15', // very hot   ≥ +2.0°C
    ];

    // Map anomaly (-2.5 to +2.5) to index (0 to 8)
    const domain_min = -2.5;
    const domain_max = 2.5;
    const clamped = Math.max(domain_min, Math.min(domain_max, anomaly));
    const n = (clamped - domain_min) / (domain_max - domain_min);
    const idx = Math.min(8, Math.floor(n * 9));
    return STRIPE_COLORS[idx];
}

/**
 * Returns a CSS color for a SU30 count value.
 * Maps the range [0, 150] days to a yellow → deep red scale.
 *
 * @param days - SU30 days in a given year
 * @returns CSS color string
 */
export function su30ToColor(days: number): string {
    const n = Math.max(0, Math.min(1, days / 150));
    return lerpColor('#fef9c3', '#7f1d1d', n);
}

/**
 * Returns a CSS color for a precipitation total value.
 * Maps the range [500, 2500] mm/year to a beige → deep blue scale.
 *
 * @param mm - Annual precipitation in mm
 * @returns CSS color string
 */
export function precipToColor(mm: number): string {
    const n = Math.max(0, Math.min(1, (mm - 500) / 2000));
    return lerpColor('#fef3c7', '#1e40af', n);
}

/**
 * Linear interpolation between two hex colors.
 *
 * @param colorA - Start color (hex string, e.g. "#ffffff")
 * @param colorB - End color (hex string, e.g. "#000000")
 * @param t      - Interpolation factor [0, 1]
 * @returns Interpolated hex color string
 */
export function lerpColor(colorA: string, colorB: string, t: number): string {
    const a = hexToRgb(colorA);
    const b = hexToRgb(colorB);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bb = Math.round(a.b + (b.b - a.b) * t);
    return `#${toHex(r)}${toHex(g)}${toHex(bb)}`;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16),
    };
}

function toHex(n: number): string {
    return n.toString(16).padStart(2, '0');
}
