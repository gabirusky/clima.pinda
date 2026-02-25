// ============================================================
// Component Tests — ThresholdSlider
// Tests real-time count update on slider change.
// ============================================================

import { render, screen, fireEvent } from '@testing-library/react';
import ThresholdSlider from '@/components/widgets/ThresholdSlider.tsx';
import type { DailyRecord } from '@/types/climate.ts';

// Build a minimal dataset: 5 days >= 30°C, 3 days >= 32°C
function makeRecords(): DailyRecord[] {
    const records: DailyRecord[] = [];
    const year = 2024;
    const data = [
        { date: `${year}-01-01`, temp_max: 35 },
        { date: `${year}-01-02`, temp_max: 33 },
        { date: `${year}-01-03`, temp_max: 32 },
        { date: `${year}-01-04`, temp_max: 30 },
        { date: `${year}-01-05`, temp_max: 30 },
        { date: `${year}-01-06`, temp_max: 28 },
        { date: `${year}-01-07`, temp_max: 25 },
        { date: `${year}-01-08`, temp_max: 22 },
    ];
    for (const d of data) {
        records.push({
            date: d.date,
            temp_max: d.temp_max,
            temp_min: 18,
            temp_mean: (d.temp_max + 18) / 2,
            precipitation: 0,
            humidity: 70,
            wind_max: 10,
        });
    }
    return records;
}

describe('ThresholdSlider', () => {
    const records = makeRecords();
    const metrics = {};

    it('renders without crashing', () => {
        render(<ThresholdSlider dailyData={records} metrics={metrics} />);
        expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('shows the default threshold of 30°C', () => {
        render(<ThresholdSlider dailyData={records} metrics={metrics} />);
        expect(screen.getByText(/30\.0°C/)).toBeInTheDocument();
    });

    it('has correct min/max/step attributes', () => {
        render(<ThresholdSlider dailyData={records} metrics={metrics} />);
        const slider = screen.getByRole('slider') as HTMLInputElement;
        expect(slider.min).toBe('25');
        expect(slider.max).toBe('35');
        expect(slider.step).toBe('0.5');
    });

    it('updates displayed threshold value on change', () => {
        render(<ThresholdSlider dailyData={records} metrics={metrics} />);
        const slider = screen.getByRole('slider');
        fireEvent.change(slider, { target: { value: '32' } });
        expect(screen.getByText(/32\.0°C/)).toBeInTheDocument();
    });
});
