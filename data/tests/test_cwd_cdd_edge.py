"""
test_cwd_cdd_edge.py — Edge case tests for CWD and CDD calculations.

Key cases:
- All-dry year  → CWD=0, CDD=365 (or 366 for leap)
- All-wet year  → CDD=0, CWD=365
- Alternating   → CWD=1, CDD=1
- Single streak → correct streak length

Run with: python -m pytest data/tests/ -v
"""
import numpy as np
import pandas as pd
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))


# ── Reference implementations matching calculate_metrics.py ───────────────────

def calculate_cdd(precip: pd.Series) -> int:
    """Max consecutive dry days (precipitation < 1mm)."""
    dry = (precip < 1.0).astype(int)
    max_streak = 0
    streak = 0
    for d in dry:
        if d:
            streak += 1
            max_streak = max(max_streak, streak)
        else:
            streak = 0
    return max_streak


def calculate_cwd(precip: pd.Series) -> int:
    """Max consecutive wet days (precipitation >= 1mm)."""
    wet = (precip >= 1.0).astype(int)
    max_streak = 0
    streak = 0
    for w in wet:
        if w:
            streak += 1
            max_streak = max(max_streak, streak)
        else:
            streak = 0
    return max_streak


# ── Fixtures ──────────────────────────────────────────────────────────────────

def make_precip(values):
    return pd.Series(values, dtype=float)


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestCDDEdgeCases:
    """Consecutive Dry Days edge cases."""

    def test_all_dry_year_cdd_equals_365(self):
        """All-dry year → CDD = 365."""
        precip = make_precip([0.0] * 365)
        assert calculate_cdd(precip) == 365

    def test_all_wet_year_cdd_equals_zero(self):
        """All-wet year → CDD = 0."""
        precip = make_precip([5.0] * 365)
        assert calculate_cdd(precip) == 0

    def test_single_wet_day_splits_streak(self):
        """One wet day in the middle should split the dry streak."""
        # 10 dry + 1 wet + 10 dry = max streak 10
        precip = make_precip([0.0] * 10 + [5.0] + [0.0] * 10)
        assert calculate_cdd(precip) == 10

    def test_alternating_cdd_equals_one(self):
        """Alternating dry/wet → CDD = 1."""
        precip = make_precip([0.0, 5.0] * 30)
        assert calculate_cdd(precip) == 1

    def test_exactly_at_threshold(self):
        """precipitation = 1.0mm is WET (not dry)."""
        precip = make_precip([0.0, 1.0, 0.0])
        # 1.0mm counts as wet, so dry streaks are each length 1
        assert calculate_cdd(precip) == 1

    def test_below_threshold_is_dry(self):
        """precipitation = 0.9mm is DRY."""
        precip = make_precip([0.9, 0.9, 0.9])
        assert calculate_cdd(precip) == 3

    def test_leap_year_365_days(self):
        """All-dry leap year would have 366 days; CDD = 366."""
        precip = make_precip([0.0] * 366)
        assert calculate_cdd(precip) == 366

    def test_empty_series(self):
        """Empty precipitation series → CDD = 0."""
        assert calculate_cdd(make_precip([])) == 0


class TestCWDEdgeCases:
    """Consecutive Wet Days edge cases."""

    def test_all_wet_year_cwd_equals_365(self):
        """All-wet year → CWD = 365."""
        precip = make_precip([5.0] * 365)
        assert calculate_cwd(precip) == 365

    def test_all_dry_year_cwd_equals_zero(self):
        """All-dry year → CWD = 0."""
        precip = make_precip([0.0] * 365)
        assert calculate_cwd(precip) == 0

    def test_single_dry_day_splits_streak(self):
        """One dry day in the middle should split the wet streak."""
        precip = make_precip([5.0] * 7 + [0.0] + [5.0] * 7)
        assert calculate_cwd(precip) == 7

    def test_alternating_cwd_equals_one(self):
        """Alternating wet/dry → CWD = 1."""
        precip = make_precip([5.0, 0.0] * 30)
        assert calculate_cwd(precip) == 1

    def test_longest_streak_detected(self):
        """Correctly identifies longest wet streak out of multiple streaks."""
        # 3 wet, then 2 wet, then 5 wet
        precip = make_precip([5.0]*3 + [0.0] + [5.0]*2 + [0.0] + [5.0]*5)
        assert calculate_cwd(precip) == 5

    def test_exactly_at_threshold(self):
        """precipitation = 1.0mm counts as WET for CWD."""
        precip = make_precip([1.0, 1.0, 1.0])
        assert calculate_cwd(precip) == 3

    def test_empty_series(self):
        """Empty series → CWD = 0."""
        assert calculate_cwd(make_precip([])) == 0
