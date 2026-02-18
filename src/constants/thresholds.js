// ============================================================
// Climate Threshold Constants
// ============================================================

/** Hot Days — days where T_max >= 30°C */
export const HD30_THRESHOLD = 30;

/** Very Hot Days — days where T_max >= 32°C */
export const HD32_THRESHOLD = 32;

/** Tropical Nights — nights where T_min >= 20°C */
export const TR20_THRESHOLD = 20;

/** Summer Days — days where T_max >= 25°C */
export const SU25_THRESHOLD = 25;

/** Heat Wave: minimum consecutive days above HD32_THRESHOLD to qualify */
export const HEAT_WAVE_MIN_DURATION = 3;

/** Dry Day: precipitation below this threshold (mm) */
export const DRY_DAY_THRESHOLD = 1;

/** Growing Degree Days base temperature (°C) */
export const GDD_BASE_TEMP = 10;

/** Baseline period for climate anomaly calculation (Ed Hawkins stripes) */
export const BASELINE_START_YEAR = 1940;
export const BASELINE_END_YEAR = 1980;

/** Percentile thresholds for extreme day analysis */
export const PERCENTILE_HOT = 90;
export const PERCENTILE_VERY_HOT = 95;

/** AC usage threshold — hours above this temperature count toward AC estimate */
export const AC_THRESHOLD = 25;

/** Approximate daytime hours per day for AC calculation */
export const AC_HOURS_PER_HOT_DAY = 8;

/** Default electricity rate (R$/kWh) for AC cost estimate */
export const DEFAULT_ELECTRICITY_RATE_BRL = 0.8;

/** Assumed AC power consumption (kW) */
export const AC_POWER_KW = 0.5;
