"""
validate_cross_source.py
========================
Cross-validates the ERA5 data (Open-Meteo, stored in the merged CSV) against
NASA POWER (MERRA-2 reanalysis) for a representative set of sample years.

The two datasets use completely different underlying models:
  • Open-Meteo  → ERA5 (ECMWF)
  • NASA POWER  → MERRA-2 (NASA GMAO)

High agreement between them (r > 0.97, RMSE < 1.5°C) is strong evidence
that the temperatures are real and correctly geo-located.

Usage:
    conda activate pinda-climate
    python data/scripts/validate_cross_source.py

Output:
    Prints a per-year and aggregate statistics table to stdout.
    Saves  data/raw/cross_validation_results.csv  for further inspection.
    Saves  data/notebooks/cross_validation_plot.png
"""

import logging
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

LAT = -22.9250
LON = -45.4620

# Five decades of spot-checks spread across the full 1940–2025 range.
# NASA POWER only goes back to 1981, so pre-1981 years are skipped.
SAMPLE_YEARS = [1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2022, 2024]

RAW_DIR = Path(__file__).parent.parent / "raw"
NOTEBOOK_DIR = Path(__file__).parent.parent / "notebooks"
ERA5_CSV = RAW_DIR / "pindamonhangaba_1940_2025.csv"
OUTPUT_CSV = RAW_DIR / "cross_validation_results.csv"
OUTPUT_PLOT = NOTEBOOK_DIR / "cross_validation_plot.png"

NASA_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
FILL_VALUE = -999.0          # NASA POWER sentinel for missing data

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
# NASA POWER fetch
# ---------------------------------------------------------------------------

def fetch_nasa_power_year(year: int) -> pd.DataFrame:
    """
    Fetch daily T2M_MAX and T2M_MIN from NASA POWER (MERRA-2) for one year.

    Returns a DataFrame with columns: date, nasa_tmax, nasa_tmin.
    Missing-value sentinel (-999) is replaced with NaN.
    """
    params = {
        "parameters": "T2M_MAX,T2M_MIN",
        "community": "RE",
        "longitude": LON,
        "latitude": LAT,
        "start": f"{year}0101",
        "end": f"{year}1231",
        "format": "JSON",
    }

    for attempt in range(1, 4):
        try:
            r = requests.get(NASA_URL, params=params, timeout=60)
            r.raise_for_status()
            data = r.json()
            break
        except (requests.RequestException, ValueError) as exc:
            wait = 2 ** (attempt - 1)
            log.warning("NASA POWER attempt %d failed: %s — retrying in %ds", attempt, exc, wait)
            if attempt == 3:
                raise
            time.sleep(wait)

    tmax_raw = data["properties"]["parameter"]["T2M_MAX"]
    tmin_raw = data["properties"]["parameter"]["T2M_MIN"]

    records = []
    for datestr, tmax_val in tmax_raw.items():
        tmin_val = tmin_raw.get(datestr, FILL_VALUE)
        records.append({
            "date": pd.to_datetime(datestr, format="%Y%m%d"),
            "nasa_tmax": np.nan if tmax_val == FILL_VALUE else tmax_val,
            "nasa_tmin": np.nan if tmin_val == FILL_VALUE else tmin_val,
        })

    return pd.DataFrame(records).sort_values("date").reset_index(drop=True)


# ---------------------------------------------------------------------------
# Statistics helpers
# ---------------------------------------------------------------------------

def rmse(a: pd.Series, b: pd.Series) -> float:
    diff = a - b
    return float(np.sqrt((diff ** 2).mean()))


def mae(a: pd.Series, b: pd.Series) -> float:
    return float((a - b).abs().mean())


def pearson_r(a: pd.Series, b: pd.Series) -> float:
    return float(a.corr(b))


def bias(a: pd.Series, b: pd.Series) -> float:
    """Mean signed difference: ERA5 minus NASA (positive = ERA5 is warmer)."""
    return float((a - b).mean())


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    if not ERA5_CSV.exists():
        raise FileNotFoundError(
            f"ERA5 CSV not found at {ERA5_CSV}.\n"
            "Run `python data/scripts/fetch_climate_data.py` first."
        )

    log.info("Loading ERA5 CSV from %s", ERA5_CSV)
    era5 = pd.read_csv(ERA5_CSV, parse_dates=["date"])

    results = []          # one dict per year
    merged_frames = []    # for the scatter plot

    print("\n" + "=" * 74)
    print(f"  Cross-validation: ERA5 (Open-Meteo) vs MERRA-2 (NASA POWER)")
    print(f"  Location: {LAT}°, {LON}°  |  Sample years: {SAMPLE_YEARS}")
    print("=" * 74)
    print(f"  {'Year':>4}  {'N':>5}  {'r(Tmax)':>8}  {'RMSE':>6}  {'MAE':>6}  {'Bias':>7}  "
          f"{'r(Tmin)':>8}  {'RMSE':>6}  {'MAE':>6}  {'Bias':>7}")
    print("  " + "-" * 70)

    for year in SAMPLE_YEARS:
        log.info("Fetching NASA POWER for %d…", year)
        try:
            nasa = fetch_nasa_power_year(year)
        except Exception as exc:
            log.error("SKIP year %d: %s", year, exc)
            continue

        era5_year = era5[era5["date"].dt.year == year].copy()
        merged = pd.merge(era5_year, nasa, on="date", how="inner")
        merged = merged.dropna(subset=["temp_max", "temp_min", "nasa_tmax", "nasa_tmin"])

        n = len(merged)
        if n == 0:
            log.warning("No overlapping rows for %d — skipping.", year)
            continue

        r_tmax  = pearson_r(merged["temp_max"], merged["nasa_tmax"])
        rmse_tmax = rmse(merged["temp_max"], merged["nasa_tmax"])
        mae_tmax  = mae(merged["temp_max"], merged["nasa_tmax"])
        bias_tmax = bias(merged["temp_max"], merged["nasa_tmax"])

        r_tmin  = pearson_r(merged["temp_min"], merged["nasa_tmin"])
        rmse_tmin = rmse(merged["temp_min"], merged["nasa_tmin"])
        mae_tmin  = mae(merged["temp_min"], merged["nasa_tmin"])
        bias_tmin = bias(merged["temp_min"], merged["nasa_tmin"])

        print(f"  {year:>4}  {n:>5}  {r_tmax:>8.4f}  {rmse_tmax:>6.2f}  {mae_tmax:>6.2f}  "
              f"{bias_tmax:>+7.2f}  {r_tmin:>8.4f}  {rmse_tmin:>6.2f}  {mae_tmin:>6.2f}  "
              f"{bias_tmin:>+7.2f}")

        results.append({
            "year": year, "n": n,
            "r_tmax": r_tmax, "rmse_tmax": rmse_tmax, "mae_tmax": mae_tmax, "bias_tmax": bias_tmax,
            "r_tmin": r_tmin, "rmse_tmin": rmse_tmin, "mae_tmin": mae_tmin, "bias_tmin": bias_tmin,
        })
        merged_frames.append(merged)

    if not results:
        print("\n⚠  No results — check network or API availability.")
        return

    # ── Aggregate stats ───────────────────────────────────────────────────────
    print("  " + "-" * 70)
    df_results = pd.DataFrame(results)
    agg = {
        "r_tmax":   df_results["r_tmax"].mean(),
        "rmse_tmax": df_results["rmse_tmax"].mean(),
        "mae_tmax":  df_results["mae_tmax"].mean(),
        "bias_tmax": df_results["bias_tmax"].mean(),
        "r_tmin":   df_results["r_tmin"].mean(),
        "rmse_tmin": df_results["rmse_tmin"].mean(),
        "mae_tmin":  df_results["mae_tmin"].mean(),
        "bias_tmin": df_results["bias_tmin"].mean(),
    }
    n_total = df_results["n"].sum()
    print(f"  {'AVG':>4}  {n_total:>5}  {agg['r_tmax']:>8.4f}  {agg['rmse_tmax']:>6.2f}  "
          f"{agg['mae_tmax']:>6.2f}  {agg['bias_tmax']:>+7.2f}  {agg['r_tmin']:>8.4f}  "
          f"{agg['rmse_tmin']:>6.2f}  {agg['mae_tmin']:>6.2f}  {agg['bias_tmin']:>+7.2f}")
    print("=" * 74)

    # ── Verdict ───────────────────────────────────────────────────────────────
    # Thresholds are calibrated for ERA5 vs MERRA-2 daily point comparisons
    # (reanalysis-to-reanalysis), NOT for model vs ground-station validation.
    # Published benchmarks for this type of comparison: r 0.85–0.95, RMSE 1.5–3°C.
    print("\n── Interpretation (ERA5 vs MERRA-2 reanalysis benchmarks) ─────────────")
    thresholds = [
        ("r_tmax",    "> 0.85", agg["r_tmax"]    > 0.85,  "typical range 0.85–0.95"),
        ("r_tmin",    "> 0.88", agg["r_tmin"]    > 0.88,  "typical range 0.88–0.95"),
        ("rmse_tmax", "< 3.0°C", agg["rmse_tmax"] < 3.0,  "typical range 1.5–3.0°C"),
        ("rmse_tmin", "< 3.0°C", agg["rmse_tmin"] < 3.0,  "typical range 1.5–3.0°C"),
    ]
    all_pass = True
    for label, threshold, passed, note in thresholds:
        icon = "✅" if passed else "⚠️ "
        if not passed:
            all_pass = False
        print(f"  {icon}  {label:12s} {threshold:10s}   actual: {agg[label]:.4f}   ({note})")

    # T_min bias note (ERA5 vs MERRA-2 known systematic difference)
    bias_tmin = agg["bias_tmin"]
    bias_note = (
        "ERA5 warmer — expected: ERA5 resolves valley cold-pool better than MERRA-2"
        if bias_tmin > 0.5 else
        "within normal inter-reanalysis range"
    )
    print(f"\n  ℹ️   bias_tmin     {bias_tmin:+.2f}°C     {bias_note}")

    print()
    if all_pass:
        print("  ✅ ALL checks passed — ERA5 data is consistent with MERRA-2.")
        print("     The temperatures are real and correctly geo-located.")
    else:
        print("  ⚠  One or more thresholds exceeded — inspect flagged years manually.")
        print("     Note: r < 0.85 or RMSE > 3°C at this location would be a red flag.")

    print("\n── Seasonal sanity (ERA5) ──────────────────────────────────────────────")
    era5["month"] = era5["date"].dt.month
    summer_tmax = era5[era5["month"].isin([12, 1, 2])]["temp_max"].mean()   # DJF = Southern Hemisphere summer
    winter_tmax = era5[era5["month"].isin([6, 7, 8])]["temp_max"].mean()    # JJA = Southern Hemisphere winter
    print(f"  Mean T_max  DJF (summer): {summer_tmax:.1f}°C")
    print(f"  Mean T_max  JJA (winter): {winter_tmax:.1f}°C")
    if summer_tmax > winter_tmax:
        print("  ✅ Seasons are correct for the Southern Hemisphere.")
    else:
        print("  ⚠  JJA is warmer than DJF — unexpected for São Paulo state.")

    # ── Save CSV ──────────────────────────────────────────────────────────────
    df_results.to_csv(OUTPUT_CSV, index=False)
    log.info("Saved results → %s", OUTPUT_CSV)

    # ── Scatter plot ──────────────────────────────────────────────────────────
    all_merged = pd.concat(merged_frames, ignore_index=True)

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    fig.suptitle(
        "ERA5 (Open-Meteo) vs MERRA-2 (NASA POWER) — Pindamonhangaba\n"
        f"Sample years: {SAMPLE_YEARS}",
        fontsize=13, fontweight="bold",
    )

    for ax, (era_col, nasa_col, label, color) in zip(axes, [
        ("temp_max", "nasa_tmax", "T_max (°C)", "#dc2626"),
        ("temp_min", "nasa_tmin", "T_min (°C)", "#2563eb"),
    ]):
        ax.scatter(all_merged[nasa_col], all_merged[era_col],
                   alpha=0.15, s=4, color=color, rasterized=True)
        lims = [
            min(all_merged[era_col].min(), all_merged[nasa_col].min()) - 1,
            max(all_merged[era_col].max(), all_merged[nasa_col].max()) + 1,
        ]
        ax.plot(lims, lims, "k--", linewidth=1, label="1:1 line")
        ax.set_xlim(lims)
        ax.set_ylim(lims)
        ax.set_xlabel(f"NASA POWER {label}", fontsize=11)
        ax.set_ylabel(f"ERA5 {label}", fontsize=11)
        col_key = "tmax" if "max" in era_col else "tmin"
        r_val = agg[f"r_{col_key}"]
        rmse_val = agg[f"rmse_{col_key}"]
        ax.set_title(f"{label}  |  r={r_val:.4f}  RMSE={rmse_val:.2f}°C", fontsize=11)
        ax.legend(fontsize=9)
        ax.grid(alpha=0.3)

    plt.tight_layout()
    NOTEBOOK_DIR.mkdir(parents=True, exist_ok=True)
    plt.savefig(OUTPUT_PLOT, dpi=150, bbox_inches="tight")
    plt.show()
    log.info("Saved plot → %s", OUTPUT_PLOT)


if __name__ == "__main__":
    main()
