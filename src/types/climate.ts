// ============================================================
// TypeScript interfaces — "A City's Memory of Heat"
// Single source of truth — import from here, never inline.
// Aligned with ETCCDI 27-index standard and actual JSON output
// from data/scripts/generate_web_data.py
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
    /** Longest WSDI warm spell on record */
    longest_warm_spell: {
        year: number;
        days: number;
    };
    year_most_su30: {
        year: number;
        su30: number;
    };
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
}

/** Rain-specific metrics — from public/data/rain_metrics.json */
export interface RainMetrics {
    annual: {
        precip_total: number | null;
        precip_days: number | null;
        r10mm: number | null;
        r20mm: number | null;
        sdii: number | null;
        rx1day: number | null;
        cdd: number | null;
        cwd: number | null;
    };
    monthly: Record<string, {
        precip_total: number | null;
        r10mm: number | null;
        wet_days: number | null;
    }>;
}
