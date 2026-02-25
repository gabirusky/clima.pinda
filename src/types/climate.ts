// ============================================================
<<<<<<< HEAD
// TypeScript interfaces for all climate data shapes.
// Single source of truth — import from here, never inline.
//
// Field names match EXACTLY the JSON output of:
//   • public/data/climate_data.json  (generate_web_data.py)
//   • public/data/metrics.json       (calculate_metrics.py)
//   • public/data/summary.json       (generate_web_data.py)
//
// ETCCDI-aligned per Expert Team on Climate Change Detection
// and Indices: http://etccdi.pacificclimate.org/list_27_indices.shtml
=======
// TypeScript interfaces — "A City's Memory of Heat"
// Single source of truth — import from here, never inline.
// Aligned with ETCCDI 27-index standard and actual JSON output
// from data/scripts/generate_web_data.py
>>>>>>> 004c615 (feat: new plan and frontend foundation)
// ============================================================

/** A single day's climate record — from public/data/climate_data.json */
export interface DailyRecord {
    date: string;           // YYYY-MM-DD
    temp_max: number;       // °C
    temp_min: number;       // °C
    temp_mean: number;      // °C
    precipitation: number;  // mm
    humidity: number;       // %
    wind_max: number;       // km/h
    data_quality?: 'ok' | 'interpolated' | 'interpolated_long';
}

<<<<<<< HEAD
/**
 * Annual aggregated ETCCDI metrics from metrics.json.
 * Keyed by year number in the JSON: { "1940": {...}, "1941": {...} }
 * The `year` field is NOT present in the JSON object itself (year is the key).
 */
export interface AnnualMetrics {
    // ── Core ETCCDI indices ─────────────────────────────────────────────────
    /** SU25: Days where T_max ≥ 25°C — ETCCDI SU25 (exact standard) */
    su25: number;
    /** SU30: Days where T_max ≥ 30°C — ETCCDI SU30 (locally modified threshold) */
    su30: number;
    /** TR20: Nights where T_min ≥ 20°C — ETCCDI TR20 (exact standard) */
    tr20: number;
    /** DTR: Mean(T_max − T_min) per year — ETCCDI DTR */
    dtr_mean: number;
    // ── Temperature statistics ───────────────────────────────────────────────
    temp_max_mean: number;      // Annual mean of daily T_max
    temp_min_mean: number;      // Annual mean of daily T_min
    temp_mean_annual: number;   // Annual mean of daily T_mean
    /** Temperature anomaly: deviation from 1940–1980 baseline mean */
    anomaly: number;
    // ── Precipitation ────────────────────────────────────────────────────────
    precip_total: number;   // Annual precipitation total (mm)
    precip_days: number;    // Days with precipitation ≥ 1mm
    // ── Advanced / percentile-based ETCCDI indices ──────────────────────────
    /** WSDI: Total days in warm spells (≥6 consecutive days T_max > p90 baseline) */
    wsdi_days: number;
    /** TX90p: Annual % of days where T_max > calendar-day p90 of 1961–1990 baseline */
    tx90p: number;
    /** TN90p: Annual % of nights where T_min > calendar-day p90 of 1961–1990 baseline */
    tn90p: number;
    /** CDD: Max consecutive dry days (precipitation < 1mm) */
    cdd: number;
    /** CWD: Max consecutive wet days (precipitation ≥ 1mm) */
    cwd: number;
    /** GDD: Growing Degree Days — SUM(MAX(0, (T_max+T_min)/2 − 10)) */
    gdd: number;
    /** P95 days: Days above 95th percentile of full historical T_max */
    p95_days: number;
    // ── Seasonal / temporal ─────────────────────────────────────────────────
    /** Day of year of first day with T_max ≥ 30°C; null if none */
    first_hot_day: number | null;
    /** Day of year of last day with T_max ≥ 30°C; null if none */
    last_hot_day: number | null;
    /** Days between first and last hot day (0 if no hot days) */
    hot_season_length: number;
}

/** Decadal averages from decadal_metrics.csv (not directly served as JSON) */
export interface DecadalMetrics {
    decade: number;             // e.g. 1980 for the 1980s
    su25: number;
    su30: number;
    tr20: number;
    dtr_mean: number;
    temp_max_mean: number;
    temp_min_mean: number;
    temp_mean_annual: number;
    precip_total: number;
    precip_days: number;
    wsdi_days: number;
    tx90p: number;
    tn90p: number;
    cdd: number;
    cwd: number;
    gdd: number;
    p95_days: number;
    hot_season_length: number;
    anomaly: number;
=======
/** Annual aggregated metrics — from public/data/metrics.json (keyed by year) */
export interface AnnualMetrics {
    year: number;

    // ETCCDI Hot-day indices
    su25: number;           // SU25: days T_max ≥ 25°C
    su30: number;           // SU30 (modified): days T_max ≥ 30°C
    tr20: number;           // TR20: nights T_min ≥ 20°C

    // ETCCDI Temperature range
    dtr_mean: number;       // DTR: mean(T_max − T_min) per year

    // ETCCDI Percentile-based warm extremes
    wsdi_days: number;      // WSDI: days in warm spells (≥6 consec. days > p90 baseline)
    tx90p: number;          // TX90p: % days where T_max > calendar-day p90 baseline
    tn90p: number;          // TN90p: % nights where T_min > calendar-day p90 baseline

    // ETCCDI Precipitation extremes
    cdd: number;            // CDD: max consecutive dry days (precip < 1mm)
    cwd: number;            // CWD: max consecutive wet days (precip ≥ 1mm)

    // Supplementary
    gdd: number;            // Growing Degree Days (base 10°C)
    p95_days: number;       // Days above 95th percentile of full historical T_max
    first_hot_day: number | null;   // Day-of-year of first day ≥ 30°C (null if none)
    last_hot_day: number | null;    // Day-of-year of last day ≥ 30°C (null if none)
    hot_season_length: number;      // last_hot_day − first_hot_day (0 if none)

    // Annual temperature stats
    temp_max_mean: number;
    temp_min_mean: number;
    temp_mean_annual: number;
    anomaly: number;        // Deviation from 1940–1980 baseline mean

    // Precipitation stats
    precip_total: number;
    precip_days: number;
}

/** Decadal averages — from public/data/metrics.json (or computed client-side) */
export interface DecadalMetrics {
    decade: number;                 // e.g. 1980 for the 1980s
    su30_mean: number;
    tr20_mean: number;
    wsdi_days_mean: number;
    cdd_mean: number;
    cwd_mean: number;
    temp_mean_annual_mean: number;
    anomaly_mean: number;
>>>>>>> 004c615 (feat: new plan and frontend foundation)
}

/** Headline statistics — from public/data/summary.json */
export interface ClimateSummary {
    hottest_day: {
        date: string;
        temp_max: number;
        temp_min: number;
    };
    coldest_day: {
        date: string;
        temp_min: number;
    };
    wettest_day: {
        date: string;
        precipitation: number;
    };
<<<<<<< HEAD
    /** Based on WSDI (Warm Spell Duration Index — percentile-based, not fixed threshold) */
=======
    /** Longest WSDI warm spell on record */
>>>>>>> 004c615 (feat: new plan and frontend foundation)
    longest_warm_spell: {
        year: number;
        days: number;
    };
    year_most_su30: {
        year: number;
        su30: number;
    };
<<<<<<< HEAD
    /** Linear regression slope: change in SU30 days per decade */
    su30_trend_slope_per_decade: number;
    /** Mean annual temperature for 1940–1980 baseline period */
    baseline_mean_temp_1940_1980: number;
    /**
     * Decadal averages by decade label (e.g. "1940s", "2020s").
     * Keys: su30, tr20, wsdi_days, cdd, cwd
     */
    decade_comparison: Record<string, {
        su30: number;
        tr20: number;
        wsdi_days: number;
        cdd: number;
        cwd: number;
    }>;
    /** Temperature anomaly (deviation from 1940–1980 mean) by year */
    temp_anomaly_by_year: Record<number, number>;
=======
    su30_trend_slope_per_decade: number;    // OLS slope days/decade
    su30_trend_p_value: number;
    decade_comparison: {
        [decade: string]: {                 // e.g. "1940s", "2020s"
            su30: number;
            tr20: number;
            wsdi_days: number;
            cdd: number;
            cwd: number;
        };
    };
    temp_anomaly_by_year: Record<number, number>;  // year → anomaly (°C vs 1940–1980 baseline)
>>>>>>> 004c615 (feat: new plan and frontend foundation)
}
