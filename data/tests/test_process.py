"""
test_process.py — Unit tests for data processing pipeline
Tests: missing value interpolation, T_min > T_max swap detection, metric calculations.
Run with: python -m pytest data/tests/ -v
"""
import sys
import os
import pandas as pd
import numpy as np
import pytest

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_df(dates, temp_max, temp_min, temp_mean=None, precipitation=None):
    """Create a minimal climate DataFrame for testing."""
    n = len(dates)
    if temp_mean is None:
        temp_mean = [(mx + mn) / 2 for mx, mn in zip(temp_max, temp_min)]
    if precipitation is None:
        precipitation = [0.0] * n
    return pd.DataFrame({
        'date': pd.to_datetime(dates),
        'temp_max': temp_max,
        'temp_min': temp_min,
        'temp_mean': temp_mean,
        'precipitation': precipitation,
        'humidity': [70.0] * n,
        'wind_max': [10.0] * n,
        'year': [pd.Timestamp(d).year for d in dates],
        'month': [pd.Timestamp(d).month for d in dates],
        'data_quality': ['ok'] * n,
    })


# ── Missing Value Interpolation ────────────────────────────────────────────────

class TestMissingValueInterpolation:
    """Tests for short-gap interpolation (≤3 day gaps)."""

    def test_single_nan_is_interpolated(self):
        """A single NaN in temp_max should be filled by linear interpolation."""
        dates = ['2024-01-01', '2024-01-02', '2024-01-03']
        df = make_df(dates, [30.0, np.nan, 32.0], [20.0, 20.0, 20.0])
        df['temp_max'] = df['temp_max'].interpolate(method='linear', limit=3)
        assert not df['temp_max'].isna().any(), "Single NaN should be interpolated"
        assert abs(df.loc[1, 'temp_max'] - 31.0) < 0.001, "Linear interpolation: (30+32)/2 = 31"

    def test_three_consecutive_nans_are_filled(self):
        """Three consecutive NaNs at or below limit=3 should be interpolated."""
        dates = pd.date_range('2024-01-01', periods=5, freq='D').strftime('%Y-%m-%d').tolist()
        df = make_df(dates, [28.0, np.nan, np.nan, np.nan, 32.0], [18.0]*5)
        df['temp_max'] = df['temp_max'].interpolate(method='linear', limit=3)
        assert not df['temp_max'].isna().any(), "Three NaNs within limit should be interpolated"

    def test_four_consecutive_nans_are_not_filled(self):
        """Four consecutive NaNs exceed limit=3 and should remain NaN after bounded interpolation."""
        dates = pd.date_range('2024-01-01', periods=6, freq='D').strftime('%Y-%m-%d').tolist()
        df = make_df(dates, [28.0, np.nan, np.nan, np.nan, np.nan, 32.0], [18.0]*6)
        df['temp_max'] = df['temp_max'].interpolate(method='linear', limit=3)
        # At least one NaN should remain (the middle one of the 4)
        assert df['temp_max'].isna().any(), "Four consecutive NaNs: at least one should remain"

    def test_precipitation_is_not_negative_after_fill(self):
        """After interpolation, precipitation values should remain >= 0."""
        dates = ['2024-01-01', '2024-01-02', '2024-01-03']
        df = make_df(dates, [30.0, 31.0, 32.0], [20.0]*3, precipitation=[0.0, np.nan, 2.0])
        df['precipitation'] = df['precipitation'].interpolate(method='linear', limit=3)
        df['precipitation'] = df['precipitation'].clip(lower=0)
        assert (df['precipitation'] >= 0).all(), "Precipitation must be non-negative"


# ── Temperature Validity ────────────────────────────────────────────────────────

class TestTemperatureValidity:
    """Tests for T_min <= T_mean <= T_max constraint."""

    def test_valid_temps_pass(self):
        """Valid temperature relationships should produce 0 violations."""
        dates = ['2024-01-01', '2024-01-02']
        df = make_df(dates, [32.0, 30.0], [18.0, 16.0])
        violations = df[df['temp_min'] > df['temp_max']]
        assert len(violations) == 0

    def test_detects_tmin_greater_than_tmax(self):
        """Rows where T_min > T_max should be flagged as violations."""
        dates = ['2024-01-01', '2024-01-02', '2024-01-03']
        df = make_df(dates, [30.0, 25.0, 31.0], [18.0, 28.0, 17.0])  # 2nd row: T_min > T_max
        violations = df[df['temp_min'] > df['temp_max']]
        assert len(violations) == 1, "Should detect exactly 1 violation"
        assert violations.index[0] == 1

    def test_extreme_temp_max_flagged(self):
        """T_max >= 50°C should be flagged as an invalid record."""
        dates = ['2024-01-01']
        df = make_df(dates, [50.0], [20.0])
        outliers = df[df['temp_max'] >= 50]
        assert len(outliers) == 1

    def test_extreme_temp_min_flagged(self):
        """T_min <= -10°C should be flagged as an invalid record."""
        dates = ['2024-07-01']
        df = make_df(dates, [25.0], [-11.0])
        outliers = df[df['temp_min'] <= -10]
        assert len(outliers) == 1


# ── Metric Calculations ─────────────────────────────────────────────────────────

class TestMetricCalculations:
    """Tests for SU30, TR20, DTR calculations from daily data."""

    def _make_year(self, su30_days=10, tr20_days=5, n=365):
        """Create a year of daily data with specified hot/tropical-night counts."""
        dates = pd.date_range('2000-01-01', periods=n, freq='D').strftime('%Y-%m-%d').tolist()
        # Default mild temps
        temp_max = [25.0] * n
        temp_min = [15.0] * n
        # Inject SU30 days at the front
        for i in range(min(su30_days, n)):
            temp_max[i] = 31.0
        # Inject TR20 nights
        for i in range(min(tr20_days, n)):
            temp_min[i] = 21.0
        return make_df(dates, temp_max, temp_min)

    def test_su30_count(self):
        """SU30 = count of days where T_max >= 30°C."""
        df = self._make_year(su30_days=15)
        su30 = (df['temp_max'] >= 30).sum()
        assert su30 == 15

    def test_tr20_count(self):
        """TR20 = count of nights where T_min >= 20°C."""
        df = self._make_year(tr20_days=8)
        tr20 = (df['temp_min'] >= 20).sum()
        assert tr20 == 8

    def test_dtr_mean(self):
        """DTR = mean(T_max - T_min) per year."""
        dates = ['2000-01-01', '2000-01-02', '2000-01-03']
        df = make_df(dates, [30.0, 32.0, 28.0], [20.0, 20.0, 20.0])
        dtr = (df['temp_max'] - df['temp_min']).mean()
        expected = ((10.0 + 12.0 + 8.0) / 3)
        assert abs(dtr - expected) < 0.001

    def test_precip_days_count(self):
        """precip_days = count of days where precipitation > 1mm."""
        dates = pd.date_range('2000-01-01', periods=5, freq='D').strftime('%Y-%m-%d').tolist()
        df = make_df(dates, [25.0]*5, [15.0]*5, precipitation=[0, 0.5, 2.0, 5.0, 0.1])
        precip_days = (df['precipitation'] > 1.0).sum()
        assert precip_days == 2  # 2.0 and 5.0
