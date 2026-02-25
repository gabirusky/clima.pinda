// ============================================================
<<<<<<< HEAD
// Formatting utility functions.
// All output is localized to Brazilian Portuguese (pt-BR).
// ============================================================

/**
 * Formats a temperature value as a string with one decimal place and °C unit.
 * Example: 28.4 → "28,4°C"
 */
export function formatTemp(val: number): string {
    return `${val.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    })}°C`;
=======
// Formatters — "A City's Memory of Heat"
// Display formatting for dates, temperatures, and decades.
// ============================================================

/**
 * Formats a temperature value with 1 decimal place and °C suffix.
 * @example formatTemp(38.2) → "+38.2°C"  (positive = always show sign for anomalies)
 * @example formatTemp(38.2, false) → "38.2°C"
 */
export function formatTemp(val: number, showSign = false): string {
    const fixed = val.toFixed(1);
    const sign = showSign && val > 0 ? '+' : '';
    return `${sign}${fixed}°C`;
}

/**
 * Formats a temperature anomaly with explicit +/- sign.
 * @example formatAnomaly(2.4) → "+2.4°C"
 * @example formatAnomaly(-0.3) → "−0.3°C" (uses proper minus sign)
 */
export function formatAnomaly(val: number): string {
    if (val >= 0) return `+${val.toFixed(1)}°C`;
    return `\u2212${Math.abs(val).toFixed(1)}°C`;  // Unicode minus sign
}

/**
 * Formats a date string (YYYY-MM-DD) to a human-readable Portuguese date.
 * @example formatDate("1961-09-28") → "28 de setembro de 1961"
 */
export function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Formats a date string to a short Portuguese date.
 * @example formatDateShort("1961-09-28") → "28/09/1961"
 */
export function formatDateShort(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

/**
 * Returns the decade label string for a given year.
 * @example formatDecade(1987) → "Anos 1980"
 * @example formatDecade(2024) → "Anos 2020"
 */
export function formatDecade(year: number): string {
    const decade = Math.floor(year / 10) * 10;
    return `Anos ${decade}`;
}

/**
 * Returns the decade label for chart axes — short form.
 * @example formatDecadeShort(1987) → "1980s"
 */
export function formatDecadeShort(year: number): string {
    return `${Math.floor(year / 10) * 10}s`;
}

/**
 * Formats a count of days with the correct Portuguese plural.
 * @example formatDays(1) → "1 dia"
 * @example formatDays(108) → "108 dias"
 */
export function formatDays(count: number): string {
    return count === 1 ? '1 dia' : `${count} dias`;
}

/**
 * Formats a count of nights with the correct Portuguese plural.
 * @example formatNights(99) → "99 noites"
 */
export function formatNights(count: number): string {
    return count === 1 ? '1 noite' : `${count} noites`;
>>>>>>> 004c615 (feat: new plan and frontend foundation)
}

/**
 * Formats a precipitation value in mm.
<<<<<<< HEAD
 * Example: 153.6 → "153,6 mm"
 */
export function formatPrecip(val: number): string {
    return `${val.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    })} mm`;
}

/**
 * Formats a percentage value.
 * Example: 13.3 → "13,3%"
 */
export function formatPercent(val: number, decimals = 1): string {
    return `${val.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })}%`;
}

/**
 * Formats a YYYY-MM-DD date string into a human-readable Brazilian date.
 * Example: "1961-09-28" → "28 de set. de 1961"
 */
export function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Use UTC to prevent timezone-induced off-by-one
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
=======
 * @example formatPrecip(12.3) → "12.3 mm"
 */
export function formatPrecip(mm: number): string {
    return `${mm.toFixed(1)} mm`;
}

/**
 * Formats a percentage.
 * @example formatPercent(13.3) → "13.3%"
 */
export function formatPercent(val: number): string {
    return `${val.toFixed(1)}%`;
}

/**
 * Formats a Brazilian Real currency value.
 * @example formatBRL(480.0) → "R$ 480,00"
 */
export function formatBRL(val: number): string {
    return val.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
>>>>>>> 004c615 (feat: new plan and frontend foundation)
    });
}

/**
<<<<<<< HEAD
 * Formats a YYYY-MM-DD date string into a short date (day/month/year).
 * Example: "1961-09-28" → "28/09/1961"
 */
export function formatDateShort(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

/**
 * Formats a year number as a decade label.
 * Example: 1985 → "Anos 80", 2020 → "Anos 20"
 */
export function formatDecade(year: number): string {
    const decade = Math.floor(year / 10) * 10;
    const twoDigit = decade % 100;
    return `Anos ${twoDigit === 0 ? '00' : twoDigit}`;
}

/**
 * Formats a decade number (e.g. 1980) as "1980s" for chart labels.
 * Example: 1980 → "1980s"
 */
export function formatDecadeLabel(decade: number): string {
    return `${decade}s`;
}

/**
 * Formats a slope per decade with sign and one decimal.
 * Example: 7.1 → "+7,1 dias/década"
 */
export function formatSlope(slope: number, unit = 'dias/década'): string {
    const sign = slope >= 0 ? '+' : '';
    return `${sign}${slope.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    })} ${unit}`;
}

/**
 * Formats a number with thousand separators.
 * Example: 31412 → "31.412"
 */
export function formatNumber(val: number): string {
    return val.toLocaleString('pt-BR');
}

/**
 * Returns an ordinal label for a day of year.
 * Example: 271 → "28 set (dia 271)"
 * Gracefully handles null values.
 */
export function formatDayOfYear(doy: number | null): string {
    if (doy === null || doy === undefined) return '—';
    // Approximate date label using a non-leap reference year (2001)
    const refDate = new Date(Date.UTC(2001, 0, 1));
    refDate.setUTCDate(refDate.getUTCDate() + doy - 1);
    const label = refDate.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });
    return `${label} (dia ${doy})`;
=======
 * Formats an OLS trend slope for display.
 * @example formatSlope(7.09) → "+7.1 dias/década"
 */
export function formatSlope(slope: number, unit = 'dias/década'): string {
    const sign = slope >= 0 ? '+' : '';
    return `${sign}${slope.toFixed(1)} ${unit}`;
}

/**
 * Extracts the year from a YYYY-MM-DD date string.
 * @example getYear("1961-09-28") → 1961
 */
export function getYear(dateStr: string): number {
    return parseInt(dateStr.slice(0, 4), 10);
>>>>>>> 004c615 (feat: new plan and frontend foundation)
}
