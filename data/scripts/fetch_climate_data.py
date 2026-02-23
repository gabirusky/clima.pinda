"""
fetch_climate_data.py
=====================
Fetches daily climate data for Pindamonhangaba, SP (1940–2024) from the
Open-Meteo Historical Weather API (ERA5 reanalysis).

Usage:
    python data/scripts/fetch_climate_data.py

Output:
    data/raw/year_{YYYY}.json          — one cached JSON file per year
    data/raw/pindamonhangaba_1940_2024.csv  — merged daily records
"""

import json
import logging
import time
from pathlib import Path

import pandas as pd
import requests
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

LAT = -22.9250
LON = -45.4620
START_DATE = "1940-01-01"
END_DATE = "2025-12-31"
START_YEAR = 1940
END_YEAR = 2025

PARAMETERS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "temperature_2m_mean",
    "precipitation_sum",
    "relative_humidity_2m_mean",
    "windspeed_10m_max",
]

OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"
TIMEZONE = "America/Sao_Paulo"

RAW_DIR = Path(__file__).parent.parent / "raw"
OUTPUT_CSV = RAW_DIR / "pindamonhangaba_1940_2025.csv"

COLUMN_RENAME = {
    "time": "date",
    "temperature_2m_max": "temp_max",
    "temperature_2m_min": "temp_min",
    "temperature_2m_mean": "temp_mean",
    "precipitation_sum": "precipitation",
    "relative_humidity_2m_mean": "humidity",
    "windspeed_10m_max": "wind_max",
}

MAX_RETRIES = 3
BACKOFF_BASE = 1  # seconds; doubles each retry: 1s, 2s, 4s

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
# Core functions
# ---------------------------------------------------------------------------


def fetch_year(year: int) -> dict:
    """
    Call the Open-Meteo archive API for a single calendar year.

    Retries up to MAX_RETRIES times with exponential backoff on failure.

    Returns:
        Parsed JSON response dict from Open-Meteo.

    Raises:
        RuntimeError: if all retries are exhausted.
    """
    params = {
        "latitude": LAT,
        "longitude": LON,
        "start_date": f"{year}-01-01",
        "end_date": f"{year}-12-31",
        "daily": ",".join(PARAMETERS),
        "timezone": TIMEZONE,
    }

    last_error: Exception = RuntimeError(f"No attempts made for year {year}")

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.get(OPEN_METEO_URL, params=params, timeout=30)

            if not response.ok:
                raise requests.HTTPError(
                    f"HTTP {response.status_code} for year {year}: {response.text[:200]}"
                )

            data = response.json()
            rows = len(data.get("daily", {}).get("time", []))
            log.info("  year=%d  rows=%d  attempt=%d", year, rows, attempt)
            return data

        except (requests.RequestException, ValueError) as exc:
            last_error = exc
            wait = BACKOFF_BASE * (2 ** (attempt - 1))
            log.warning(
                "  year=%d  attempt=%d/%d failed: %s — retrying in %ds",
                year, attempt, MAX_RETRIES, exc, wait,
            )
            if attempt < MAX_RETRIES:
                time.sleep(wait)

    raise RuntimeError(
        f"All {MAX_RETRIES} attempts failed for year {year}"
    ) from last_error


def save_raw_year(year: int, data: dict) -> None:
    """Write raw API response JSON to data/raw/year_{year}.json."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    path = RAW_DIR / f"year_{year}.json"
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    log.debug("  saved → %s", path)


def load_raw_year(year: int) -> dict | None:
    """
    Load cached JSON for a year if it exists.

    Returns:
        Parsed dict if cache hit, None otherwise.
    """
    path = RAW_DIR / f"year_{year}.json"
    if path.exists():
        log.debug("  cache hit → %s", path)
        return json.loads(path.read_text(encoding="utf-8"))
    return None


def _year_response_to_dataframe(data: dict) -> pd.DataFrame:
    """Convert a single Open-Meteo response dict to a tidy DataFrame."""
    daily = data.get("daily", {})
    if not daily or "time" not in daily:
        raise ValueError("Unexpected API response shape — missing 'daily.time'")
    return pd.DataFrame(daily)


def merge_years_to_dataframe(years: list[int]) -> pd.DataFrame:
    """
    Load (or fetch) each year, convert to DataFrame, and concatenate.

    Returns:
        Tidy DataFrame with columns:
            date, temp_max, temp_min, temp_mean,
            precipitation, humidity, wind_max
    """
    frames: list[pd.DataFrame] = []

    for year in tqdm(years, desc="Fetching years", unit="yr"):
        data = load_raw_year(year)

        if data is None:
            log.info("Fetching year %d from API…", year)
            try:
                data = fetch_year(year)
                save_raw_year(year, data)
            except RuntimeError as exc:
                log.error("SKIPPING year %d: %s", year, exc)
                continue

        try:
            df = _year_response_to_dataframe(data)
            frames.append(df)
        except ValueError as exc:
            log.error("SKIPPING year %d (parse error): %s", year, exc)

    if not frames:
        raise RuntimeError("No data was fetched — check network and API status.")

    merged = pd.concat(frames, ignore_index=True)

    # Convert time column to proper datetime (CoW-safe for pandas 3.x)
    merged = merged.assign(time=pd.to_datetime(merged["time"]))

    # Rename to project-standard column names
    merged = merged.rename(columns=COLUMN_RENAME)

    # Ensure correct column order
    ordered_cols = ["date", "temp_max", "temp_min", "temp_mean",
                    "precipitation", "humidity", "wind_max"]
    merged = merged[ordered_cols]

    log.info(
        "Merged %d years → %d rows, %d columns",
        len(frames), len(merged), len(merged.columns),
    )
    return merged


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    years = list(range(START_YEAR, END_YEAR + 1))
    log.info(
        "Starting fetch: %d–%d (%d years) → %s",
        START_YEAR, END_YEAR, len(years), OUTPUT_CSV,
    )

    df = merge_years_to_dataframe(years)

    df.to_csv(OUTPUT_CSV, index=False)
    log.info("Saved CSV → %s  (%d rows)", OUTPUT_CSV, len(df))

    # Quick sanity summary
    print("\n── Summary ─────────────────────────────────────────────")
    print(f"  Rows      : {len(df):,}")
    print(f"  Date range: {df['date'].min()} → {df['date'].max()}")
    print(f"  T_max     : {df['temp_max'].min():.1f}°C – {df['temp_max'].max():.1f}°C")
    print(f"  T_min     : {df['temp_min'].min():.1f}°C – {df['temp_min'].max():.1f}°C")
    print(f"  Missing   : {df.isnull().sum().sum()} total NaN values")
    print("────────────────────────────────────────────────────────\n")


if __name__ == "__main__":
    main()
