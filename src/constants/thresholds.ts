// ============================================================
// Climate Threshold Constants (ETCCDI-aligned)
// ============================================================

// ── Temperature thresholds (ETCCDI standard) ─────────────────────────────────
/** ETCCDI SU25: Summer Days threshold (°C) */
export const SU25_THRESHOLD = 25 as const;
/** ETCCDI SU30: Hot Days threshold for Pindamonhangaba's valley climate (°C) */
export const SU30_THRESHOLD = 30 as const;
/** ETCCDI TR20: Tropical Nights threshold (°C) */
export const TR20_THRESHOLD = 20 as const;

// ── Precipitation thresholds (ETCCDI standard) ───────────────────────────────
/** Precipitation < DRY_DAY_THRESHOLD mm counts as a dry day (CDD) */
export const DRY_DAY_THRESHOLD = 1 as const;
/** Precipitation ≥ WET_DAY_THRESHOLD mm counts as a wet day (CWD, precip_days) */
export const WET_DAY_THRESHOLD = 1 as const;

// ── WSDI parameters (ETCCDI standard) ───────────────────────────────────────
/** WSDI: A warm spell requires at least this many consecutive hot days */
export const WSDI_MIN_DURATION = 6 as const;
/** WSDI baseline start year for calendar-day 90th percentile calculation */
export const WSDI_BASELINE_START = 1961 as const;
/** WSDI baseline end year for calendar-day 90th percentile calculation */
export const WSDI_BASELINE_END = 1990 as const;

// ── Climate Stripes / Anomaly baseline (Ed Hawkins convention) ───────────────
/** Baseline start year for temperature anomaly and Climate Stripes */
export const ANOMALY_BASELINE_START = 1940 as const;
/** Baseline end year for temperature anomaly and Climate Stripes */
export const ANOMALY_BASELINE_END = 1980 as const;

// ── Percentile thresholds ─────────────────────────────────────────────────────
/** Calendar-day percentile used for TX90p / TN90p / WSDI (ETCCDI standard) */
export const ETCCDI_PERCENTILE = 90 as const;
/** Full-historical percentile used for P95 days (supplementary) */
export const P95_PERCENTILE = 95 as const;

// ── Growing Degree Days ─────────────────────────────────────────────────────
/** GDD base temperature (°C) — subtropical agriculture baseline */
export const GDD_BASE_TEMP = 10 as const;

// ── AC / Energy impact estimates ────────────────────────────────────────────
/** Temperature threshold for AC usage in Brazilian residential buildings (°C) */
export const AC_THRESHOLD = 25 as const;
/** Estimated AC operational hours per hot day (approximate daytime hours) */
export const AC_HOURS_PER_HOT_DAY = 8 as const;
/** Default electricity rate (R$/kWh) — Brazilian average 2024 */
export const DEFAULT_ELECTRICITY_RATE_BRL = 0.8 as const;
/** Typical split AC power consumption (kW) */
export const AC_POWER_KW = 0.5 as const;
