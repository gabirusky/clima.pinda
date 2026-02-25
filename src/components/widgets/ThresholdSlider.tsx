import { useState, useMemo } from 'react';
import type { AnnualMetrics, DailyRecord } from '../../types/climate.ts';
import { countDaysAboveThreshold, groupByYear } from '../../utils/dataProcessing.ts';

interface ThresholdSliderProps {
    dailyData: DailyRecord[];
    metrics: Record<number, AnnualMetrics>;
}

/**
 * ThresholdSlider — adjust the hot-day threshold in real time.
 *
 * Min=25, Max=35, Step=0.5.
 * Shows current count for the most recent full year.
 * Displays trend: e.g., "+7.1 days/decade above 30°C"
 */
export default function ThresholdSlider({ dailyData, metrics: _metrics }: ThresholdSliderProps) {
    const [threshold, setThreshold] = useState(30);

    const yearGroups = useMemo(() => groupByYear(dailyData), [dailyData]);
    const years = useMemo(() => [...yearGroups.keys()].sort((a, b) => a - b), [yearGroups]);
    const latestYear = years.at(-1) ?? 2024;

    const countForLatest = useMemo(() => {
        const records = yearGroups.get(latestYear) ?? [];
        return countDaysAboveThreshold(records, threshold);
    }, [yearGroups, latestYear, threshold]);

    // Count per year for the selected threshold (for trend display)
    const countsByYear = useMemo(() =>
        years.map(y => ({
            year: y,
            count: countDaysAboveThreshold(yearGroups.get(y) ?? [], threshold),
        })),
        [years, yearGroups, threshold]
    );

    // Simple trend: compare first decade avg vs last decade avg
    const firstDecadeAvg = useMemo(() => {
        const first = countsByYear.filter(d => d.year < 1950);
        return first.length ? first.reduce((s, d) => s + d.count, 0) / first.length : 0;
    }, [countsByYear]);

    const lastDecadeAvg = useMemo(() => {
        const last = countsByYear.filter(d => d.year >= 2015);
        return last.length ? last.reduce((s, d) => s + d.count, 0) / last.length : 0;
    }, [countsByYear]);

    return (
        <div
            style={{ width: '100%' }}
            aria-live="polite"
            aria-label={`Threshold slider: ${threshold}°C — ${countForLatest} dias em ${latestYear}`}
        >
            {/* Current value display */}
            <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 'var(--text-display-md, clamp(32px, 4.5vw, 56px))',
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: threshold >= 33 ? '#b2182b' : threshold >= 30 ? '#ef8a62' : '#4393c3',
                marginBottom: '0.5rem',
                transition: 'color 0.3s',
            }}>
                {threshold.toFixed(1)}°C
            </div>

            {/* Slider */}
            <label htmlFor="threshold-slider" style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>
                Limiar de temperatura
            </label>
            <input
                id="threshold-slider"
                type="range"
                min={25}
                max={35}
                step={0.5}
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: `linear-gradient(to right, #ef8a62 0%, #ef8a62 ${((threshold - 25) / 10) * 100}%, rgba(255,255,255,0.1) ${((threshold - 25) / 10) * 100}%, rgba(255,255,255,0.1) 100%)`,
                    marginBottom: '1rem',
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
                <span>25°C</span>
                <span>30°C</span>
                <span>35°C</span>
            </div>

            {/* Live count */}
            <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
            }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>
                    Dias acima de {threshold.toFixed(1)}°C em {latestYear}
                </p>
                <p style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: threshold >= 30 ? '#ef8a62' : '#4393c3',
                }}>
                    {countForLatest} dias
                </p>

                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)' }}>
                        Anos 1940–1949: média{' '}
                        <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#4393c3' }}>{firstDecadeAvg.toFixed(0)} dias</strong>
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.25rem' }}>
                        Anos 2015–2025: média{' '}
                        <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#b2182b' }}>{lastDecadeAvg.toFixed(0)} dias</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
