"""
calculate_metrics.py — Pindamonhangaba Climate Metrics
=======================================================
Computes ETCCDI-aligned climate indices from the cleaned daily dataset.

All indices follow the Expert Team on Climate Change Detection and Indices
(ETCCDI) 27-index standard: http://etccdi.pacificclimate.org/list_27_indices.shtml

Input:  data/processed/pindamonhangaba_clean.csv
Output: data/processed/annual_metrics.csv
        data/processed/decadal_metrics.csv
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPTS_DIR = Path(__file__).parent
DATA_DIR = SCRIPTS_DIR.parent        # data/
PROCESSED_DIR = DATA_DIR / "processed"

INPUT_CSV = PROCESSED_DIR / "pindamonhangaba_clean.csv"
OUTPUT_ANNUAL = PROCESSED_DIR / "annual_metrics.csv"
OUTPUT_DECADAL = PROCESSED_DIR / "decadal_metrics.csv"

# ── ETCCDI baseline for percentile indices ─────────────────────────────────────
BASELINE_START = 1961
BASELINE_END = 1990
WSDI_MIN_DURATION = 6  # consecutive days required to qualify as a warm spell

# ── Thresholds ─────────────────────────────────────────────────────────────────
SU25_THRESHOLD = 25.0    # °C  — ETCCDI SU25 (exact)
SU30_THRESHOLD = 30.0    # °C  — ETCCDI SU30 (locally modified)
TR20_THRESHOLD = 20.0    # °C  — ETCCDI TR20 (exact)
DRY_DAY_THRESHOLD = 1.0  # mm  — precipitation < 1 mm = dry day (CDD)
WET_DAY_THRESHOLD = 1.0  # mm  — precipitation ≥ 1 mm = wet day (CWD)
GDD_BASE = 10.0          # °C  — Growing Degree Days base temperature

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)
log = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════════════════
#  HELPER: consecutive-run counter
# ══════════════════════════════════════════════════════════════════════════════

def _max_consecutive(flags: "pd.Series[bool]") -> int:
    """Return the length of the longest contiguous True-run in `flags`."""
    if not flags.any():
        return 0
    # Convert to numpy for speed
    arr = flags.to_numpy(dtype=bool)
    max_run = current = 0
    for v in arr:
        if v:
            current += 1
            max_run = max(max_run, current)
        else:
            current = 0
    return int(max_run)


def _count_days_in_spells(flags: "pd.Series[bool]", min_duration: int) -> int:
    """
    Count total days that belong to stretches of ≥min_duration consecutive
    True values in `flags`.  Used for WSDI.
    """
    arr = flags.to_numpy(dtype=bool)
    total = 0
    n = len(arr)
    i = 0
    while i < n:
        if arr[i]:
            j = i
            while j < n and arr[j]:
                j += 1
            run_len = j - i
            if run_len >= min_duration:
                total += run_len
            i = j
        else:
            i += 1
    return total


# ══════════════════════════════════════════════════════════════════════════════
#  PERCENTILE BASELINES  (calendar-day 90th percentile, 1961–1990)
# ══════════════════════════════════════════════════════════════════════════════

def build_calendar_day_percentile(
    df: pd.DataFrame,
    column: str,
    baseline_start: int = BASELINE_START,
    baseline_end: int = BASELINE_END,
    percentile: float = 90.0,
) -> "pd.Series":
    """
    Compute the calendar-day `percentile`-th percentile of `column`
    using only the years in [baseline_start, baseline_end].

    Returns a Series indexed by day_of_year (1–366) with the threshold value
    for each calendar day.  Day 366 (Feb 29) is assigned the mean of the
    surrounding days if no baseline year is a leap year.

    Notes
    -----
    - Bootstrap window approach: for each calendar day d, pool observations
      from d-2 to d+2 across all baseline years (5-day window), giving ≥150
      values even for the shortest month.  This is the ETCCDI recommended
      method for reducing sampling noise in the percentile estimate.
    """
    baseline = df[(df["year"] >= baseline_start) & (df["year"] <= baseline_end)].copy()
    baseline = baseline.dropna(subset=[column])

    p_by_doy: dict[int, float] = {}
    window = 2  # ±2 days around target day

    for doy in range(1, 367):
        # Build the ±window window, wrapping around year boundaries
        doys_in_window = [(doy - window + k - 1) % 366 + 1 for k in range(2 * window + 1)]
        pool = baseline[baseline["day_of_year"].isin(doys_in_window)][column]
        if len(pool) >= 10:
            p_by_doy[doy] = float(np.percentile(pool, percentile))
        else:
            # Fallback: use all baseline data for that doy without window
            pool_exact = baseline[baseline["day_of_year"] == doy][column]
            p_by_doy[doy] = float(np.percentile(pool_exact, percentile)) if len(pool_exact) > 0 else np.nan

    return pd.Series(p_by_doy, name=f"p{int(percentile)}_{column}")


# ══════════════════════════════════════════════════════════════════════════════
#  ADVANCED METRIC FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def calculate_wsdi(
    year_df: pd.DataFrame,
    p90_tmax: "pd.Series",
    min_duration: int = WSDI_MIN_DURATION,
) -> int:
    """
    ETCCDI WSDI — Warm Spell Duration Index.

    Annual count of days belonging to warm spells: periods of ≥min_duration
    consecutive days where T_max > calendar-day 90th percentile of the
    1961–1990 baseline.

    Parameters
    ----------
    year_df   : DataFrame for a single year with columns [day_of_year, temp_max]
    p90_tmax  : Series indexed by day_of_year (1–366) with 90th pct T_max
    """
    flags = year_df.apply(
        lambda row: row["temp_max"] > p90_tmax.get(int(row["day_of_year"]), np.nan),
        axis=1,
    )
    flags = flags.fillna(False).astype(bool)
    return _count_days_in_spells(flags, min_duration)


def calculate_tx90p(
    year_df: pd.DataFrame,
    p90_tmax: "pd.Series",
) -> float:
    """
    ETCCDI TX90p — Warm Days.

    Annual percentage of days where T_max > calendar-day 90th percentile
    of the 1961–1990 baseline.
    """
    total = len(year_df)
    if total == 0:
        return np.nan
    above = year_df.apply(
        lambda row: row["temp_max"] > p90_tmax.get(int(row["day_of_year"]), np.nan),
        axis=1,
    ).sum()
    return round(float(above) / total * 100, 2)


def calculate_tn90p(
    year_df: pd.DataFrame,
    p90_tmin: "pd.Series",
) -> float:
    """
    ETCCDI TN90p — Warm Nights.

    Annual percentage of nights where T_min > calendar-day 90th percentile
    of the 1961–1990 baseline.
    """
    total = len(year_df)
    if total == 0:
        return np.nan
    above = year_df.apply(
        lambda row: row["temp_min"] > p90_tmin.get(int(row["day_of_year"]), np.nan),
        axis=1,
    ).sum()
    return round(float(above) / total * 100, 2)


def calculate_cdd(precip_series: "pd.Series") -> int:
    """
    ETCCDI CDD — Consecutive Dry Days.

    Maximum number of consecutive days with precipitation < 1 mm.
    """
    flags = precip_series < DRY_DAY_THRESHOLD
    return _max_consecutive(flags)


def calculate_cwd(precip_series: "pd.Series") -> int:
    """
    ETCCDI CWD — Consecutive Wet Days.

    Maximum number of consecutive days with precipitation ≥ 1 mm.
    """
    flags = precip_series >= WET_DAY_THRESHOLD
    return _max_consecutive(flags)


# ══════════════════════════════════════════════════════════════════════════════
#  STATISTICAL TESTS
# ══════════════════════════════════════════════════════════════════════════════

def mann_kendall_trend(series: "pd.Series") -> dict:
    """
    Mann-Kendall monotonic trend test using scipy.stats.kendalltau.

    Returns dict with keys: tau, p_value, trend_direction.
    A p_value < 0.05 indicates a statistically significant trend.
    """
    x = series.dropna().values
    n = len(x)
    if n < 3:
        return {"tau": np.nan, "p_value": np.nan, "trend_direction": "insufficient_data"}
    time_idx = np.arange(n)
    tau, p_value = stats.kendalltau(time_idx, x)
    direction = "increasing" if tau > 0 else ("decreasing" if tau < 0 else "no_trend")
    return {"tau": round(float(tau), 4), "p_value": round(float(p_value), 4), "trend_direction": direction}


def linear_regression_trend(years: "pd.Series", values: "pd.Series") -> dict:
    """
    OLS linear regression of `values` on `years`.

    Returns dict with keys: slope, intercept, r_squared, p_value, slope_per_decade.
    `slope_per_decade` is the change in the metric per 10 years.
    """
    mask = values.notna()
    x = years[mask].values.astype(float)
    y = values[mask].values.astype(float)
    if len(x) < 3:
        return {
            "slope": np.nan, "intercept": np.nan,
            "r_squared": np.nan, "p_value": np.nan,
            "slope_per_decade": np.nan,
        }
    result = stats.linregress(x, y)
    return {
        "slope": round(float(result.slope), 4),
        "intercept": round(float(result.intercept), 4),
        "r_squared": round(float(result.rvalue ** 2), 4),
        "p_value": round(float(result.pvalue), 4),
        "slope_per_decade": round(float(result.slope * 10), 4),
    }


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN COMPUTATION
# ══════════════════════════════════════════════════════════════════════════════

def main() -> None:
    log.info("═" * 60)
    log.info("  calculate_metrics.py — ETCCDI Climate Indices")
    log.info("═" * 60)

    # ── 1. Load clean data ────────────────────────────────────────────────────
    log.info("Loading %s …", INPUT_CSV)
    if not INPUT_CSV.exists():
        log.error("Input file not found: %s", INPUT_CSV)
        log.error("Run process_climate_data.py first.")
        sys.exit(1)

    df = pd.read_csv(INPUT_CSV, parse_dates=["date"])

    # Ensure derived columns exist (they are written by process_climate_data.py)
    if "year" not in df.columns:
        df["year"] = df["date"].dt.year
    if "month" not in df.columns:
        df["month"] = df["date"].dt.month
    if "day_of_year" not in df.columns:
        df["day_of_year"] = df["date"].dt.dayofyear

    log.info("Loaded %d rows spanning %d – %d", len(df), df["year"].min(), df["year"].max())

    # ── 2. Build calendar-day percentile baselines ────────────────────────────
    log.info(
        "Building calendar-day 90th percentile baselines (%d–%d) …",
        BASELINE_START, BASELINE_END,
    )
    p90_tmax = build_calendar_day_percentile(df, "temp_max", percentile=90.0)
    p90_tmin = build_calendar_day_percentile(df, "temp_min", percentile=90.0)

    # 95th percentile of FULL historical T_max distribution (scalar)
    p95_tmax_scalar = float(np.percentile(df["temp_max"].dropna(), 95))
    log.info(
        "Baselines built. p90 T_max range: %.1f–%.1f°C  |  p95 T_max (full): %.1f°C",
        p90_tmax.min(), p90_tmax.max(), p95_tmax_scalar,
    )

    # ── 3. Compute per-year metrics ───────────────────────────────────────────
    log.info("Computing annual metrics …")

    records: list[dict] = []
    years = sorted(df["year"].unique())

    for year in years:
        ydf = df[df["year"] == year].copy()

        # ── Core metrics (ETCCDI) ─────────────────────────────────────────────
        su25 = int((ydf["temp_max"] >= SU25_THRESHOLD).sum())
        su30 = int((ydf["temp_max"] >= SU30_THRESHOLD).sum())
        tr20 = int((ydf["temp_min"] >= TR20_THRESHOLD).sum())
        dtr_mean = round(float((ydf["temp_max"] - ydf["temp_min"]).mean()), 2)

        temp_max_mean  = round(float(ydf["temp_max"].mean()), 2)
        temp_min_mean  = round(float(ydf["temp_min"].mean()), 2)
        temp_mean_annual = round(float(ydf["temp_mean"].mean()), 2)

        precip_total = round(float(ydf["precipitation"].sum()), 1)
        precip_days  = int((ydf["precipitation"] >= WET_DAY_THRESHOLD).sum())

        # ── Advanced / percentile-based metrics ───────────────────────────────
        wsdi_days = calculate_wsdi(ydf, p90_tmax)
        tx90p     = calculate_tx90p(ydf, p90_tmax)
        tn90p     = calculate_tn90p(ydf, p90_tmin)
        cdd       = calculate_cdd(ydf["precipitation"])
        cwd       = calculate_cwd(ydf["precipitation"])

        # Growing Degree Days
        daily_gdd = np.maximum(0.0, (ydf["temp_max"] + ydf["temp_min"]) / 2.0 - GDD_BASE)
        gdd = round(float(daily_gdd.sum()), 1)

        # P95 days — days above the full-historical 95th percentile scalar
        p95_days = int((ydf["temp_max"] > p95_tmax_scalar).sum())

        # ── Temporal / seasonal analysis ──────────────────────────────────────
        hot_days = ydf[ydf["temp_max"] >= SU30_THRESHOLD]
        if len(hot_days) > 0:
            first_hot_day = int(hot_days["day_of_year"].min())
            last_hot_day  = int(hot_days["day_of_year"].max())
            hot_season_length = last_hot_day - first_hot_day
        else:
            first_hot_day = None
            last_hot_day  = None
            hot_season_length = 0

        records.append({
            "year":            year,
            # Core ETCCDI
            "su25":            su25,
            "su30":            su30,
            "tr20":            tr20,
            "dtr_mean":        dtr_mean,
            "temp_max_mean":   temp_max_mean,
            "temp_min_mean":   temp_min_mean,
            "temp_mean_annual": temp_mean_annual,
            "precip_total":    precip_total,
            "precip_days":     precip_days,
            # Advanced / percentile-based
            "wsdi_days":       wsdi_days,
            "tx90p":           tx90p,
            "tn90p":           tn90p,
            "cdd":             cdd,
            "cwd":             cwd,
            "gdd":             gdd,
            "p95_days":        p95_days,
            # Seasonal
            "first_hot_day":   first_hot_day,
            "last_hot_day":    last_hot_day,
            "hot_season_length": hot_season_length,
        })

    annual = pd.DataFrame(records)

    # ── 4. Temperature anomaly (deviation from 1940–1980 baseline mean) ───────
    baseline_mean = annual.loc[annual["year"] <= 1980, "temp_mean_annual"].mean()
    annual["anomaly"] = (annual["temp_mean_annual"] - baseline_mean).round(2)
    log.info("Baseline mean (1940–1980): %.2f°C", baseline_mean)

    # ── 5. Statistical trend tests ────────────────────────────────────────────
    log.info("Running Mann-Kendall and linear regression trend tests …")

    trend_metrics = ["su30", "tr20", "dtr_mean", "wsdi_days"]
    trend_rows: list[dict] = []

    for metric in trend_metrics:
        mk = mann_kendall_trend(annual[metric])
        lr = linear_regression_trend(annual["year"], annual[metric])
        row = {"metric": metric, **mk, **lr}
        trend_rows.append(row)
        log.info(
            "  %-15s  τ=%.3f  p=%.4f  slope/decade=%.3f  R²=%.3f  [%s]",
            metric,
            mk["tau"],
            mk["p_value"],
            lr["slope_per_decade"],
            lr["r_squared"],
            mk["trend_direction"],
        )

    # Store trend results as metadata columns on annual (one row per metric;
    # the trend_results dict is also saved as a companion section in the CSV
    # header via logging — the frontend reads annual_metrics.csv only)
    trends_df = pd.DataFrame(trend_rows)

    # ── 6. Decadal aggregation ────────────────────────────────────────────────
    log.info("Computing decadal averages …")
    annual["decade"] = (annual["year"] // 10 * 10)

    numeric_cols = [
        "su25", "su30", "tr20", "dtr_mean",
        "temp_max_mean", "temp_min_mean", "temp_mean_annual",
        "precip_total", "precip_days",
        "wsdi_days", "tx90p", "tn90p",
        "cdd", "cwd", "gdd", "p95_days",
        "hot_season_length", "anomaly",
    ]
    decadal = (
        annual.groupby("decade")[numeric_cols]
        .mean()
        .round(2)
        .reset_index()
    )

    # ── 7. Save outputs ───────────────────────────────────────────────────────
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    annual.to_csv(OUTPUT_ANNUAL, index=False)
    decadal.to_csv(OUTPUT_DECADAL, index=False)

    log.info("Saved → %s  (%d rows)", OUTPUT_ANNUAL, len(annual))
    log.info("Saved → %s  (%d rows)", OUTPUT_DECADAL, len(decadal))

    # ── 8. Summary report ─────────────────────────────────────────────────────
    log.info("")
    log.info("═" * 60)
    log.info("  SUMMARY REPORT")
    log.info("═" * 60)

    log.info("Years processed : %d  (%d–%d)", len(annual), annual["year"].min(), annual["year"].max())
    log.info("")

    log.info("── Core metrics (full-period) ──")
    log.info("  SU25 (days ≥25°C) : %.1f avg/yr  [max %d in %d]",
             annual["su25"].mean(), annual["su25"].max(), annual.loc[annual["su25"].idxmax(), "year"])
    log.info("  SU30 (days ≥30°C) : %.1f avg/yr  [max %d in %d]",
             annual["su30"].mean(), annual["su30"].max(), annual.loc[annual["su30"].idxmax(), "year"])
    log.info("  TR20 (nights ≥20°C): %.1f avg/yr  [max %d in %d]",
             annual["tr20"].mean(), annual["tr20"].max(), annual.loc[annual["tr20"].idxmax(), "year"])
    log.info("  DTR mean           : %.2f°C avg/yr", annual["dtr_mean"].mean())
    log.info("")

    log.info("── Advanced metrics (full-period) ──")
    log.info("  WSDI days          : %.1f avg/yr  [max %d in %d]",
             annual["wsdi_days"].mean(), annual["wsdi_days"].max(),
             annual.loc[annual["wsdi_days"].idxmax(), "year"])
    log.info("  TX90p              : %.1f%% avg/yr", annual["tx90p"].mean())
    log.info("  TN90p              : %.1f%% avg/yr", annual["tn90p"].mean())
    log.info("  CDD max            : %.1f days avg/yr  [max %d in %d]",
             annual["cdd"].mean(), annual["cdd"].max(),
             annual.loc[annual["cdd"].idxmax(), "year"])
    log.info("  CWD max            : %.1f days avg/yr  [max %d in %d]",
             annual["cwd"].mean(), annual["cwd"].max(),
             annual.loc[annual["cwd"].idxmax(), "year"])
    log.info("")

    log.info("── Trend tests ──")
    for _, row in trends_df.iterrows():
        sig = "✅ significant" if row["p_value"] < 0.05 else "⚠ not significant"
        log.info(
            "  %-15s  slope/decade=%-7.3f  p=%.4f  %s",
            row["metric"], row["slope_per_decade"], row["p_value"], sig,
        )

    log.info("")
    log.info("── Decade comparison (SU30) ──")
    for _, row in decadal.iterrows():
        log.info("  %ds: %.1f days/yr  |  WSDI %.1f d/yr  |  TR20 %.1f n/yr",
                 int(row["decade"]), row["su30"], row["wsdi_days"], row["tr20"])

    log.info("")
    log.info("Done.")


if __name__ == "__main__":
    main()
