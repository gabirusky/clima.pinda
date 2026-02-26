"""
generate_web_data.py — Task 3.3
================================
Converts processed CSVs → JSON files consumed by the React frontend.

Outputs (in public/data/):
  climate_data.json   — Daily records (date, temp_max, temp_min, temp_mean,
                         precipitation, humidity, wind_max)
  metrics.json        — Annual ETCCDI metrics keyed by year
  summary.json        — Headline stats (hottest day, trends, decade comparison, …)

Rules:
  • All floats rounded to 1 decimal place
  • climate_data.json gzip-compressed to climate_data.json.gz if >500 KB
  • Dates as YYYY-MM-DD strings
"""

import gzip
import json
import logging
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

# ---------------------------------------------------------------------------
# Paths (data/scripts/ → project root)
# ---------------------------------------------------------------------------
ROOT = Path(__file__).parent.parent.parent   # → pesquisa.clima.pinda/
PROCESSED_DIR = ROOT / "data" / "processed"
PUBLIC_DATA_DIR = ROOT / "public" / "data"
PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

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
# Helpers
# ---------------------------------------------------------------------------
SIZE_LIMIT = 500 * 1024  # 500 KB


def _round_floats(obj, decimals: int = 1):
    """Recursively round all floats in a nested dict/list structure."""
    if isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return round(obj, decimals)
    if isinstance(obj, np.floating):
        v = float(obj)
        if np.isnan(v) or np.isinf(v):
            return None
        return round(v, decimals)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, dict):
        return {k: _round_floats(v, decimals) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_round_floats(v, decimals) for v in obj]
    return obj


def _write_json(path: Path, data, compress_if_large: bool = False):
    """Write JSON to *path*, optionally gzip-compressing if over SIZE_LIMIT."""
    payload = json.dumps(_round_floats(data), ensure_ascii=False, separators=(",", ":"))
    size = len(payload.encode("utf-8"))
    log.info("  → %s  (%s KB)", path.name, f"{size / 1024:.1f}")

    if compress_if_large and size > SIZE_LIMIT:
        gz_path = path.with_suffix(".json.gz")
        with gzip.open(gz_path, "wt", encoding="utf-8") as f:
            f.write(payload)
        log.info(
            "  ⚠  Payload > 500 KB → compressed to %s  (%s KB)",
            gz_path.name,
            f"{gz_path.stat().st_size / 1024:.1f}",
        )
        # Also write the plain file so local dev works without a server
        path.write_text(payload, encoding="utf-8")
    else:
        path.write_text(payload, encoding="utf-8")


# ---------------------------------------------------------------------------
# 1. climate_data.json  — Daily records
# ---------------------------------------------------------------------------
def generate_climate_data(clean_csv: Path, out_dir: Path):
    log.info("Generating climate_data.json …")
    df = pd.read_csv(clean_csv, parse_dates=["date"])

    keep = ["date", "temp_max", "temp_min", "temp_mean", "precipitation", "humidity", "wind_max"]
    # Include data_quality column if present
    if "data_quality" in df.columns:
        keep.append("data_quality")

    df = df[keep].copy()
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")

    # Round numeric columns to 1 decimal
    num_cols = [c for c in keep if c not in ("date", "data_quality")]
    df[num_cols] = df[num_cols].round(1)

    records = df.to_dict(orient="records")

    # Replace NaN with None so JSON serialises to null
    clean_records = []
    for rec in records:
        clean_records.append({
            k: (None if isinstance(v, float) and np.isnan(v) else v)
            for k, v in rec.items()
        })

    _write_json(out_dir / "climate_data.json", clean_records, compress_if_large=True)
    log.info("  %d daily records written.", len(clean_records))


# ---------------------------------------------------------------------------
# 2. metrics.json  — Annual metrics keyed by year
# ---------------------------------------------------------------------------
def generate_metrics(annual_csv: Path, out_dir: Path):
    log.info("Generating metrics.json …")
    df = pd.read_csv(annual_csv)
    df = df.round(1)

    # Replace NaN / inf with None for JSON safety
    df = df.where(pd.notnull(df), None)

    metrics_dict = {}
    for _, row in df.iterrows():
        year = int(row["year"])
        entry = {k: (None if v is None else v) for k, v in row.to_dict().items()}
        entry.pop("year", None)           # year is the key, not a field
        entry.pop("decade", None)         # internal grouping column, not needed
        metrics_dict[year] = entry

    _write_json(out_dir / "metrics.json", metrics_dict)
    log.info("  %d annual records written.", len(metrics_dict))


# ---------------------------------------------------------------------------
# 2.5. rain_metrics.json  — Annual and Monthly rain metrics
# ---------------------------------------------------------------------------
def generate_rain_metrics(annual_csv: Path, monthly_csv: Path, out_dir: Path):
    log.info("Generating rain_metrics.json …")
    annual = pd.read_csv(annual_csv)
    monthly = pd.read_csv(monthly_csv)

    rain_metrics = {}
    
    # Process annual
    for _, row in annual.iterrows():
        year = int(row["year"])
        rain_metrics[year] = {
            "annual": {
                "precip_total": _round_floats(row.get("precip_total")),
                "precip_days": int(row.get("precip_days")) if pd.notna(row.get("precip_days")) else None,
                "r10mm": int(row.get("r10mm")) if pd.notna(row.get("r10mm")) else None,
                "r20mm": int(row.get("r20mm")) if pd.notna(row.get("r20mm")) else None,
                "sdii": _round_floats(row.get("sdii")),
                "rx1day": _round_floats(row.get("rx1day")),
                "cdd": int(row.get("cdd")) if pd.notna(row.get("cdd")) else None,
                "cwd": int(row.get("cwd")) if pd.notna(row.get("cwd")) else None,
            },
            "monthly": {}
        }
    
    # Process monthly
    for _, row in monthly.iterrows():
        year = int(row["year"])
        month = int(row["month"])
        if year in rain_metrics:
            rain_metrics[year]["monthly"][str(month)] = {
                "precip_total": _round_floats(row.get("precip_total")),
                "r10mm": int(row.get("r10mm")) if pd.notna(row.get("r10mm")) else None,
                "wet_days": int(row.get("wet_days")) if pd.notna(row.get("wet_days")) else None,
            }

    _write_json(out_dir / "rain_metrics.json", rain_metrics)
    log.info("  %d years of rain metrics written.", len(rain_metrics))


# ---------------------------------------------------------------------------
# 3. summary.json  — Headline stats
# ---------------------------------------------------------------------------
def generate_summary(clean_csv: Path, annual_csv: Path, out_dir: Path):
    log.info("Generating summary.json …")
    daily = pd.read_csv(clean_csv, parse_dates=["date"])
    annual = pd.read_csv(annual_csv)

    # --- Extreme days -------------------------------------------------------
    hottest_row = daily.loc[daily["temp_max"].idxmax()]
    coldest_row = daily.loc[daily["temp_min"].idxmin()]
    wettest_row = daily.loc[daily["precipitation"].idxmax()]

    hottest_day = {
        "date": hottest_row["date"].strftime("%Y-%m-%d"),
        "temp_max": round(float(hottest_row["temp_max"]), 1),
        "temp_min": round(float(hottest_row["temp_min"]), 1),
    }
    coldest_day = {
        "date": coldest_row["date"].strftime("%Y-%m-%d"),
        "temp_min": round(float(coldest_row["temp_min"]), 1),
    }
    wettest_day = {
        "date": wettest_row["date"].strftime("%Y-%m-%d"),
        "precipitation": round(float(wettest_row["precipitation"]), 1),
    }

    # --- Longest warm spell (WSDI) -----------------------------------------
    wsdi_max_year = int(annual.loc[annual["wsdi_days"].idxmax(), "year"])
    wsdi_max_days = round(float(annual["wsdi_days"].max()), 1)
    longest_warm_spell = {"year": wsdi_max_year, "days": wsdi_max_days}

    # --- Year with most SU30 days ------------------------------------------
    su30_max_row = annual.loc[annual["su30"].idxmax()]
    year_most_su30 = {
        "year": int(su30_max_row["year"]),
        "su30": round(float(su30_max_row["su30"]), 1),
    }

    # --- SU30 trend slope per decade (linear regression) -------------------
    su30_series = annual.dropna(subset=["su30", "year"])
    slope, intercept, r_value, p_value, std_err = stats.linregress(
        su30_series["year"], su30_series["su30"]
    )
    su30_trend_slope_per_decade = round(float(slope * 10), 2)

    # --- Decade comparison table ------------------------------------------
    # Decades 1940s and 2020s, plus full table for reference
    decade_cols = ["su30", "tr20", "wsdi_days", "cdd", "cwd"]
    annual["decade_label"] = (annual["year"] // 10 * 10).astype(str) + "s"

    decade_comparison = {}
    for decade_label, grp in annual.groupby("decade_label"):
        decade_comparison[decade_label] = {
            col: round(float(grp[col].mean()), 1)
            for col in decade_cols
            if col in grp.columns
        }

    # --- Temperature anomaly by year (deviation from 1940–1980 mean) ------
    baseline = annual[annual["year"].between(1940, 1980)]
    baseline_mean = float(baseline["temp_mean_annual"].mean())
    temp_anomaly_by_year = {
        int(row["year"]): round(float(row["temp_mean_annual"]) - baseline_mean, 2)
        for _, row in annual.iterrows()
        if pd.notna(row["temp_mean_annual"])
    }

    summary = {
        "hottest_day": hottest_day,
        "coldest_day": coldest_day,
        "wettest_day": wettest_day,
        "longest_warm_spell": longest_warm_spell,
        "year_most_su30": year_most_su30,
        "su30_trend_slope_per_decade": su30_trend_slope_per_decade,
        "baseline_mean_temp_1940_1980": round(baseline_mean, 2),
        "decade_comparison": decade_comparison,
        "temp_anomaly_by_year": temp_anomaly_by_year,
    }

    _write_json(out_dir / "summary.json", summary)

    # Log key facts
    log.info(
        "  Hottest day : %s  T_max=%.1f°C",
        hottest_day["date"],
        hottest_day["temp_max"],
    )
    log.info(
        "  Coldest day : %s  T_min=%.1f°C",
        coldest_day["date"],
        coldest_day["temp_min"],
    )
    log.info(
        "  Longest warm spell : %d days in %d (WSDI)",
        wsdi_max_days,
        wsdi_max_year,
    )
    log.info(
        "  SU30 trend : +%.2f days/decade  (p=%.4f)",
        su30_trend_slope_per_decade,
        p_value,
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    clean_csv = PROCESSED_DIR / "pindamonhangaba_clean.csv"
    annual_csv = PROCESSED_DIR / "annual_metrics.csv"
    monthly_csv = PROCESSED_DIR / "monthly_rain_metrics.csv"

    for path in (clean_csv, annual_csv, monthly_csv):
        if not path.exists():
            log.warning(f"Required input not found: {path}. Please run calculate_metrics.py first.")

    if clean_csv.exists() and annual_csv.exists():
        generate_climate_data(clean_csv, PUBLIC_DATA_DIR)
        generate_metrics(annual_csv, PUBLIC_DATA_DIR)
        generate_summary(clean_csv, annual_csv, PUBLIC_DATA_DIR)
        
    if annual_csv.exists() and monthly_csv.exists():
        generate_rain_metrics(annual_csv, monthly_csv, PUBLIC_DATA_DIR)

    log.info("✅  All web data files written to %s", PUBLIC_DATA_DIR)
