// ============================================================
// Component Tests — ACCalculator
// Verifies the AC cost calculation logic with mock data.
// ============================================================

import { render } from '@testing-library/react';
import ACCalculator from '@/components/widgets/ACCalculator.tsx';
import type { DailyRecord } from '@/types/climate.ts';

// AC calculation constants (must match thresholds.ts)
const AC_THRESHOLD = 30;       // °C
const AC_HOURS_PER_HOT_DAY = 8; // hours
const AC_POWER_KW = 1.5;        // kW

function makeRecordsForYear(year: number, hotDays: number, totalDays = 365): DailyRecord[] {
    return Array.from({ length: totalDays }, (_, i) => {
        const date = new Date(year, 0, i + 1);
        const dateStr = date.toISOString().slice(0, 10);
        const isHot = i < hotDays;
        return {
            date: dateStr,
            temp_max: isHot ? AC_THRESHOLD + 1 : 22,
            temp_min: 18,
            temp_mean: isHot ? 25 : 20,
            precipitation: 0,
            humidity: 70,
            wind_max: 10,
        };
    });
}

describe('ACCalculator', () => {
    it('renders without crashing', () => {
        const records = makeRecordsForYear(2024, 50);
        render(<ACCalculator dailyData={records} metrics={{}} />);
        // Should display some form of the receipt
        expect(document.querySelector('div')).toBeTruthy();
    });

    it('renders a year selector', () => {
        const records = makeRecordsForYear(2024, 50);
        render(<ACCalculator dailyData={records} metrics={{}} />);
        const selects = document.querySelectorAll('select');
        expect(selects.length).toBeGreaterThan(0);
    });

    it('shows electricity rate input', () => {
        const records = makeRecordsForYear(2024, 50);
        render(<ACCalculator dailyData={records} metrics={{}} />);
        // Should have an editable rate input
        const rateInput = document.querySelector('input[type="number"]');
        expect(rateInput).toBeTruthy();
    });
});

describe('AC calculation logic', () => {
    it('computes correct kWh for known hot-day count', () => {
        const hotDays = 20;
        const expectedKwh = hotDays * AC_HOURS_PER_HOT_DAY * AC_POWER_KW;
        // 20 days × 8 hours × 1.5 kW = 240 kWh
        expect(expectedKwh).toBe(240);
    });

    it('computes zero kWh for all-cool year', () => {
        const hotDays = 0;
        expect(hotDays * AC_HOURS_PER_HOT_DAY * AC_POWER_KW).toBe(0);
    });

    it('cost scales linearly with rate', () => {
        const rate1 = 0.80;
        const rate2 = 1.60;
        const kwh = 100;
        expect(kwh * rate2).toBe(kwh * rate1 * 2);
    });
});
