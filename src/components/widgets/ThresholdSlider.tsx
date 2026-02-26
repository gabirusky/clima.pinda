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

    const decadeStats = useMemo(() => {
        const decades = [
            { start: 1940, label: '1940s', color: '#4393c3' },
            { start: 1980, label: '1980s', color: '#72bae6ff' },
            { start: 1990, label: '1990s', color: '#83c7f1ff' },
            { start: 2000, label: '2000s', color: '#e2283eff' },
            { start: 2010, label: '2010s', color: '#b2182b' },
            { start: 2020, label: '2020s', color: '#8c0013ff' },
        ];
        return decades.map(dec => {
            const decYears = countsByYear.filter(d => d.year >= dec.start && d.year < dec.start + 10);
            const avg = decYears.length ? decYears.reduce((s, d) => s + d.count, 0) / decYears.length : 0;
            return {
                decade: dec.label,
                su30: Math.round(avg * 10) / 10,
                color: dec.color,
            };
        });
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
            </div>

            {/* Decade cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
                marginTop: '1.5rem',
            }}>
                {decadeStats.map(d => (
                    <div key={d.decade} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '8px',
                        padding: '1rem',
                    }}>
                        <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.75rem', color: d.color, lineHeight: 1 }}>
                            {d.su30}
                        </p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.25rem' }}>
                            dias/ano · {d.decade}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
