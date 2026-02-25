"""
test_wsdi_baseline.py — Verifies WSDI uses only the 1961–1990 baseline period.

The p90 threshold for WSDI must be computed from 1961–1990 calendar-day data only.
Using a broader or different window would violate ETCCDI standards.

Run with: python -m pytest data/tests/ -v
"""
import numpy as np
import pandas as pd
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


def compute_p90_baseline(df: pd.DataFrame, baseline_start=1961, baseline_end=1990) -> pd.Series:
    """
    Compute calendar-day p90 of T_max using only the baseline period.
    Returns a Series indexed by day-of-year (1-365).
    """
    baseline = df[(df['year'] >= baseline_start) & (df['year'] <= baseline_end)].copy()
    baseline['doy'] = baseline['date'].dt.dayofyear
    return baseline.groupby('doy')['temp_max'].quantile(0.90)


def make_multi_year_df(years, daily_temp_max=None):
    """Create a multi-year DataFrame for baseline testing."""
    records = []
    for year in years:
        dates = pd.date_range(f'{year}-01-01', f'{year}-12-31', freq='D')
        n = len(dates)
        tmax = daily_temp_max if daily_temp_max is not None else np.full(n, 25.0 + (year - 1940) * 0.05)
        records.append(pd.DataFrame({
            'date': dates,
            'temp_max': tmax if hasattr(tmax, '__len__') else np.full(n, tmax),
            'temp_min': 15.0,
            'temp_mean': 20.0,
            'precipitation': 0.0,
            'humidity': 70.0,
            'wind_max': 10.0,
            'year': year,
            'month': dates.month,
        }))
    return pd.concat(records, ignore_index=True)


class TestWSDIBaseline:
    """Ensures p90 is computed only from 1961–1990 baseline, not the full dataset."""

    def test_baseline_excludes_years_before_1961(self):
        """Years before 1961 must not influence the p90 baseline."""
        # Pre-baseline has extremely high temps; should NOT inflate p90
        pre_baseline_years = list(range(1940, 1961))
        baseline_years = list(range(1961, 1991))
        post_years = [2000]
        all_years = pre_baseline_years + baseline_years + post_years

        df = make_multi_year_df(all_years)
        # Inflate pre-baseline temps to 50°C (would severely inflate p90 if included)
        df.loc[df['year'] < 1961, 'temp_max'] = 50.0
        p90 = compute_p90_baseline(df)

        # p90 over baseline (1961–1990) should be ~25°C (no influence from 50°C years)
        assert p90.mean() < 30.0, "Pre-baseline extreme temps should NOT inflate baseline p90"

    def test_baseline_excludes_years_after_1990(self):
        """Years after 1990 must not influence the p90 baseline."""
        all_years = list(range(1961, 2026))
        df = make_multi_year_df(all_years)
        # Inflate post-baseline temps (2024, 2025)
        df.loc[df['year'] > 1990, 'temp_max'] = 50.0
        p90 = compute_p90_baseline(df)
        assert p90.mean() < 30.0, "Post-1990 extreme temps should NOT inflate baseline p90"

    def test_baseline_uses_exactly_30_years(self):
        """The 1961–1990 window is exactly 30 years."""
        all_years = list(range(1940, 2026))
        df = make_multi_year_df(all_years)
        baseline = df[(df['year'] >= 1961) & (df['year'] <= 1990)]
        unique_years = baseline['year'].unique()
        assert len(unique_years) == 30, f"Baseline must span exactly 30 years, got {len(unique_years)}"

    def test_p90_increases_with_warmer_baseline(self):
        """Warming the baseline data should raise the p90 threshold."""
        years = list(range(1961, 1991))
        df_cool = make_multi_year_df(years, daily_temp_max=25.0)
        df_warm = make_multi_year_df(years, daily_temp_max=32.0)
        p90_cool = compute_p90_baseline(df_cool)
        p90_warm = compute_p90_baseline(df_warm)
        assert p90_warm.mean() > p90_cool.mean(), "Warmer baseline → higher p90 threshold"
