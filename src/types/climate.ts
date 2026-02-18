// ============================================================
// TypeScript interfaces for all climate data shapes
// Single source of truth — import from here, never inline
// ============================================================

/** A single day's climate record from climate_data.json */
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

/** Annual aggregated metrics from metrics.json */
export interface AnnualMetrics {
    year: number;
    // Hot day counts
    hd30: number;           // Days T_max >= 30°C
    hd32: number;           // Days T_max >= 32°C
    su25: number;           // Days T_max >= 25°C
    tr20: number;           // Nights T_min >= 20°C
    // Temperature stats
    temp_max_mean: number;
    temp_min_mean: number;
    temp_mean_annual: number;
    dtr_mean: number;       // Diurnal Temperature Range
    anomaly: number;        // Deviation from 1940–1980 baseline
    // Heat waves
    hwdi_days: number;      // Total heat wave days
    hwdi_events: number;    // Number of heat wave events
    hwdi_longest: number;   // Longest heat wave (days)
    // Other
    cdd: number;            // Max consecutive dry days
    gdd: number;            // Growing Degree Days (base 10°C)
    p90_days: number;       // Days above 90th percentile T_max
    p95_days: number;       // Days above 95th percentile T_max
    precip_total: number;   // Annual precipitation (mm)
    precip_days: number;    // Days with precip >= 1mm
    hot_season_length: number; // Days between first and last HD30
}

/** Decadal averages from decadal_metrics.json */
export interface DecadalMetrics {
    decade: number;         // e.g. 1980 for the 1980s
    hd30_mean: number;
    hd32_mean: number;
    tr20_mean: number;
    hwdi_days_mean: number;
    temp_mean_annual_mean: number;
    anomaly_mean: number;
}

/** Headline statistics from summary.json */
export interface ClimateSummary {
    hottest_day: {
        date: string;
        temp_max: number;
        temp_min: number;
    };
    coldest_day: {
        date: string;
        temp_min: number;
        temp_max: number;
    };
    wettest_day: {
        date: string;
        precipitation: number;
    };
    longest_heat_wave: {
        start_date: string;
        end_date: string;
        duration_days: number;
        year: number;
    };
    year_most_hd30: {
        year: number;
        hd30: number;
    };
    hd30_trend_slope_per_decade: number;
    hd30_trend_p_value: number;
    decade_comparison: {
        metric: string;
        value_1940s: number;
        value_2020s: number;
        change_pct: number;
    }[];
    temp_anomaly_by_year: Record<number, number>;
}
