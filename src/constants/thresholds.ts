// ============================================================
// Climate Threshold Constants — ETCCDI aligned
// "A City's Memory of Heat" — Pindamonhangaba
// ============================================================

/** Days where T_max ≥ 30°C (ETCCDI SU30 modified — locally meaningful threshold) */
export const SU30_THRESHOLD = 30 as const;

/** Days where T_max ≥ 25°C (ETCCDI SU25 standard) */
export const SU25_THRESHOLD = 25 as const;

/** Nights where T_min ≥ 20°C (ETCCDI TR20 — tropical nights) */
export const TR20_THRESHOLD = 20 as const;

/**
 * Minimum duration for WSDI warm spell (ETCCDI standard: 6 consecutive days).
 * A streak must reach this length before any days within it are counted.
 */
export const WSDI_MIN_DURATION = 6 as const;

/** WSDI baseline period start — calendar-day p90 computed from 1961–1990 only */
export const WSDI_BASELINE_START = 1961 as const;

/** WSDI baseline period end */
export const WSDI_BASELINE_END = 1990 as const;

/**
 * Climate Stripes baseline period (Ed Hawkins convention).
 * Anomalies are computed as deviation from the 1940–1980 mean.
 * NOTE: This is different from the WSDI baseline (1961–1990).
 */
export const STRIPES_BASELINE_START = 1940 as const;
export const STRIPES_BASELINE_END = 1980 as const;

/** Legacy aliases kept for backward compat */
export const ANOMALY_BASELINE_START = STRIPES_BASELINE_START;
export const ANOMALY_BASELINE_END = STRIPES_BASELINE_END;

/** CDD: precipitation below this threshold = dry day (mm) */
export const DRY_DAY_THRESHOLD = 1 as const;

/** CWD: precipitation at or above this threshold = wet day (mm) */
export const WET_DAY_THRESHOLD = 1 as const;

/** GDD base temperature (°C) — standard agricultural base */
export const GDD_BASE_TEMP = 10 as const;

/** Calendar-day percentile used for TX90p / TN90p / WSDI (ETCCDI standard) */
export const ETCCDI_PERCENTILE = 90 as const;

/** Full-historical percentile used for P95 days (supplementary) */
export const P95_PERCENTILE = 95 as const;

/** Threshold for residential AC usage (°C) */
export const AC_THRESHOLD = 25 as const;

/** Approximate daytime hours proxy per hot-day for AC usage estimate */
export const AC_HOURS_PER_HOT_DAY = 8 as const;

/** Default electricity rate (R$/kWh) — Brazilian average residential rate */
export const DEFAULT_ELECTRICITY_RATE_BRL = 0.8 as const;

/** Assumed AC power draw (kW) — typical 1HP split unit */
export const AC_POWER_KW = 0.5 as const;
