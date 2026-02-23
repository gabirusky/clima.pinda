"""
process_climate_data.py
=======================
Phase 3.1 -- Data Cleaning & Validation

Loads the raw merged ERA5 CSV produced by fetch_climate_data.py,
performs integrity checks, fills short gaps, flags unresolvable gaps,
validates physical constraints, adds derived calendar columns, and saves
a clean CSV ready for metric calculation.

Input:
    data/raw/pindamonhangaba_1940_2025.csv

Output:
    data/processed/pindamonhangaba_clean.csv

Usage:
    conda activate pinda-climate
    python data/scripts/process_climate_data.py
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).parent.parent          # data/
RAW_DIR = ROOT / "raw"
PROCESSED_DIR = ROOT / "processed"

INPUT_CSV  = RAW_DIR       / "pindamonhangaba_1940_2025.csv"
OUTPUT_CSV = PROCESSED_DIR / "pindamonhangaba_clean.csv"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

START_DATE = "1940-01-01"
END_DATE   = "2025-12-31"

# Gap interpolation policy (CONTEXT.md section 4 edge cases)
SHORT_GAP_MAX = 3                       # consecutive NaN days -> linear interpolation
LONG_GAP_LABEL = "interpolated_long"   # applied when gap > SHORT_GAP_MAX

# Physical sanity bounds for this region (TASKS.md 3.1)
TEMP_MAX_UPPER = 50.0    # degrees C -- above this is clearly erroneous for Pindamonhangaba
TEMP_MIN_LOWER = -10.0   # degrees C -- below this is clearly erroneous

# Columns that hold temperature values (used for rounding)
TEMP_COLS  = ["temp_max", "temp_min", "temp_mean"]
PRECIP_COL = "precipitation"

# All numeric columns eligible for interpolation
NUMERIC_COLS = TEMP_COLS + [PRECIP_COL, "humidity", "wind_max"]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper -- identify consecutive NaN runs in a Series
# ---------------------------------------------------------------------------

def _nan_runs(series: pd.Series) -> list[tuple[int, int]]:
    """
    Return a list of (start_iloc, end_iloc) tuples (inclusive) for each
    consecutive run of NaN values in *series*.
    """
    runs: list[tuple[int, int]] = []
    in_run = False
    run_start = 0

    for i, val in enumerate(series):
        if pd.isna(val):
            if not in_run:
                in_run = True
                run_start = i
        else:
            if in_run:
                runs.append((run_start, i - 1))
                in_run = False

    if in_run:
        runs.append((run_start, len(series) - 1))

    return runs


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:   # noqa: C901  (complexity is inherent to a data-cleaning pipeline)

    # -- 1. Load raw CSV ------------------------------------------------------
    if not INPUT_CSV.exists():
        log.error("Input CSV not found: %s", INPUT_CSV)
        log.error("Run `python data/scripts/fetch_climate_data.py` first.")
        sys.exit(1)

    log.info("Loading raw CSV: %s", INPUT_CSV)
    df = pd.read_csv(INPUT_CSV, parse_dates=["date"])
    log.info("Loaded %d rows, %d columns", len(df), df.shape[1])

    # -- 2. Assert no duplicate dates -----------------------------------------
    dup_count = int(df["date"].duplicated().sum())
    assert dup_count == 0, (
        f"Found {dup_count} duplicate date(s) in the raw CSV -- "
        "investigate fetch_climate_data.py before proceeding."
    )
    log.info("[OK] No duplicate dates found.")

    # -- 3. Reindex to complete calendar range --------------------------------
    full_index = pd.date_range(START_DATE, END_DATE, freq="D")
    expected_days = len(full_index)

    df = df.set_index("date").reindex(full_index).reset_index().copy()
    df = df.rename(columns={"index": "date"})

    missing_days_after_reindex = int(df[TEMP_COLS + [PRECIP_COL]].isna().any(axis=1).sum())
    log.info(
        "Date range reindexed: %s to %s (%d days expected, %d days with any NaN).",
        START_DATE, END_DATE, expected_days, missing_days_after_reindex,
    )

    # -- 4. Identify missing-value rows BEFORE interpolation ------------------
    missing_mask_initial = df[TEMP_COLS + [PRECIP_COL]].isna().any(axis=1)
    total_missing = int(missing_mask_initial.sum())
    log.info("Missing-value rows identified (pre-interpolation): %d", total_missing)

    # -- 5. Add data_quality column (default = 'ok') --------------------------
    df = df.assign(data_quality="ok")

    # -- 6. Interpolation policy ----------------------------------------------
    #   Gaps <= SHORT_GAP_MAX consecutive NaN days  ->  linear interpolation
    #   Gaps  > SHORT_GAP_MAX consecutive NaN days  ->  flag as LONG_GAP_LABEL
    #
    #   We check each numeric column independently; a gap in 'precipitation'
    #   does not necessarily coincide with a gap in temperature.
    #
    #   LIMITATION (CONTEXT.md): heat waves spanning year boundaries are split
    #   by annual processing. The same logic applies here -- gap detection runs
    #   per-column across the full dataset.

    rows_interpolated: set[int] = set()

    for col in NUMERIC_COLS:
        runs = _nan_runs(df[col])
        for run_start, run_end in runs:
            gap_len = run_end - run_start + 1

            if gap_len <= SHORT_GAP_MAX:
                # Use .loc assignment (CoW-safe for pandas 2.x / 3.x)
                filled = df[col].interpolate(method="linear", limit=SHORT_GAP_MAX)
                df.loc[run_start:run_end, col] = filled.loc[run_start:run_end]
                rows_interpolated.update(range(run_start, run_end + 1))
                log.debug(
                    "Interpolated '%s': rows %d-%d (%d-day gap)",
                    col, run_start, run_end, gap_len,
                )
            else:
                df.loc[run_start:run_end, "data_quality"] = LONG_GAP_LABEL
                log.warning(
                    "Long gap in '%s': rows %d-%d (%d consecutive days) -- "
                    "flagged as '%s'; NOT interpolated.",
                    col, run_start, run_end, gap_len, LONG_GAP_LABEL,
                )

    # Second pass: catch any residual short cross-column gaps
    # (limit ensures we never fill more than SHORT_GAP_MAX rows at once)
    for col in NUMERIC_COLS:
        filled = df[col].interpolate(
            method="linear", limit=SHORT_GAP_MAX, limit_direction="both"
        )
        df.loc[:, col] = filled

    rows_interpolated_count = len(rows_interpolated)
    log.info("Rows interpolated (short gaps, max %d days): %d", SHORT_GAP_MAX, rows_interpolated_count)

    # -- 7. Fix T_min > T_max inversions (ERA5 model artifact) ----------------
    # Per CONTEXT.md section 3: swap values when T_min > T_max; log occurrence.
    inversion_mask = df["temp_min"] > df["temp_max"]
    inversion_count = int(inversion_mask.sum())
    if inversion_count > 0:
        log.warning(
            "Swapping %d row(s) where T_min > T_max (ERA5 model artifact).",
            inversion_count,
        )
        swapped = df.loc[inversion_mask, ["temp_max", "temp_min"]].copy()
        df.loc[inversion_mask, "temp_min"] = swapped["temp_max"].values
        df.loc[inversion_mask, "temp_max"] = swapped["temp_min"].values

    # -- 8. Validate physical constraints -------------------------------------
    violations: dict[str, int] = {}

    # T_min <= T_mean
    mask_min_mean = df["temp_min"] > df["temp_mean"]
    n = int(mask_min_mean.sum())
    violations["temp_min > temp_mean"] = n
    if n:
        log.warning("VIOLATION: temp_min > temp_mean on %d row(s).", n)
        log.warning("  First dates: %s", df.loc[mask_min_mean, "date"].dt.date.tolist()[:10])

    # T_mean <= T_max
    mask_mean_max = df["temp_mean"] > df["temp_max"]
    n = int(mask_mean_max.sum())
    violations["temp_mean > temp_max"] = n
    if n:
        log.warning("VIOLATION: temp_mean > temp_max on %d row(s).", n)
        log.warning("  First dates: %s", df.loc[mask_mean_max, "date"].dt.date.tolist()[:10])

    # Precipitation >= 0
    mask_neg_precip = df[PRECIP_COL] < 0
    n = int(mask_neg_precip.sum())
    violations["precipitation < 0"] = n
    if n:
        log.warning("VIOLATION: precipitation < 0 on %d row(s) -- clamping to 0.", n)
        df.loc[mask_neg_precip, PRECIP_COL] = 0.0

    # Sanity upper bound: T_max < 50 degrees C
    mask_tmax_upper = df["temp_max"] >= TEMP_MAX_UPPER
    n = int(mask_tmax_upper.sum())
    violations[f"temp_max >= {TEMP_MAX_UPPER}C"] = n
    if n:
        log.warning(
            "VIOLATION: temp_max >= %.0fC on %d row(s) -- suspect data.",
            TEMP_MAX_UPPER, n,
        )
        log.warning(
            "  Rows:\n%s",
            df.loc[mask_tmax_upper, ["date", "temp_max"]].to_string(),
        )

    # Sanity lower bound: T_min > -10 degrees C
    mask_tmin_lower = df["temp_min"] <= TEMP_MIN_LOWER
    n = int(mask_tmin_lower.sum())
    violations[f"temp_min <= {TEMP_MIN_LOWER}C"] = n
    if n:
        log.warning(
            "VIOLATION: temp_min <= %.0fC on %d row(s) -- suspect data.",
            TEMP_MIN_LOWER, n,
        )
        log.warning(
            "  Rows:\n%s",
            df.loc[mask_tmin_lower, ["date", "temp_min"]].to_string(),
        )

    total_violations = sum(violations.values())
    if total_violations == 0:
        log.info("[OK] All physical constraint checks passed (0 violations).")
    else:
        log.warning("[WARN] Total validation violations: %d (see warnings above).", total_violations)

    # -- 9 & 10. Round numeric columns + add derived calendar columns ----------
    # Use .assign() to avoid CoW FutureWarnings under pandas 2.x / 3.x.
    df = df.assign(
        temp_max    = df["temp_max"].round(1),
        temp_min    = df["temp_min"].round(1),
        temp_mean   = df["temp_mean"].round(1),
        precipitation = df[PRECIP_COL].round(2),
        year        = df["date"].dt.year,
        month       = df["date"].dt.month,
        day_of_year = df["date"].dt.day_of_year,
    )
    # -- 11. Save clean CSV ---------------------------------------------------
    df.to_csv(OUTPUT_CSV, index=False)
    log.info("Saved clean CSV -> %s", OUTPUT_CSV)

    # -- 12. Summary report ---------------------------------------------------
    long_gap_rows = int((df["data_quality"] == LONG_GAP_LABEL).sum())

    print("\n" + "=" * 60)
    print("  process_climate_data.py -- Summary")
    print("=" * 60)
    print(f"  Input rows (raw)          : {len(df):>8,}")
    print(f"  Expected calendar days    : {expected_days:>8,}")
    print(f"  Missing rows (pre-fill)   : {total_missing:>8,}")
    print(f"  Rows interpolated         : {rows_interpolated_count:>8,}  (gap <= {SHORT_GAP_MAX} days)")
    print(f"  Rows flagged (long gap)   : {long_gap_rows:>8,}  (gap > {SHORT_GAP_MAX} days)")
    print(f"  T_min/T_max inversions    : {inversion_count:>8,}  (ERA5 artifact -- swapped)")
    print()
    print("  Validation violations:")
    for check, count in violations.items():
        status = "[OK]  " if count == 0 else "[WARN]"
        print(f"    {status}  {check:<32s}: {count}")
    print()
    print(f"  Output -> {OUTPUT_CSV.relative_to(ROOT.parent)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
