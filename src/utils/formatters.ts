// ============================================================
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
}

/**
 * Formats a precipitation value in mm.
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
    });
}

/**
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
}
