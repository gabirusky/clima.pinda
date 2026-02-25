import { useState, useMemo } from 'react';
import type { AnnualMetrics } from '../../types/climate.ts';
import { metricsToArray } from '../../utils/dataProcessing.ts';

interface YearSelectorProps {
    metrics: Record<number, AnnualMetrics>;
}

// Explicitly list the numeric-valued fields from AnnualMetrics
const METRIC_CONFIG: Array<{
    key: keyof AnnualMetrics;
    label: string;
    unit: string;
    higherIsBad: boolean;
}> = [
        { key: 'su25', label: 'SU25 (dias ≥ 25°C)', unit: 'dias', higherIsBad: true },
        { key: 'su30', label: 'SU30 (dias ≥ 30°C)', unit: 'dias', higherIsBad: true },
        { key: 'tr20', label: 'TR20 (noites ≥ 20°C)', unit: 'noites', higherIsBad: true },
        { key: 'dtr_mean', label: 'DTR (amplitude térmica)', unit: '°C', higherIsBad: false },
        { key: 'wsdi_days', label: 'WSDI (ondas de calor)', unit: 'dias', higherIsBad: true },
        { key: 'tx90p', label: 'TX90p (%)', unit: '%', higherIsBad: true },
        { key: 'tn90p', label: 'TN90p (%)', unit: '%', higherIsBad: true },
        { key: 'cdd', label: 'CDD (dias secos seguidos)', unit: 'dias', higherIsBad: true },
        { key: 'cwd', label: 'CWD (dias úmidos seguidos)', unit: 'dias', higherIsBad: false },
        { key: 'gdd', label: 'GDD (graus-dia cultivados)', unit: 'GDD', higherIsBad: false },
    ];

/**
 * YearSelector — compare any two years side by side.
 *
 * Two selects (Year A / Year B). Comparison table.
 * Cell color: red = B > A (worse), blue = B < A (better for hot-day metrics).
 */
export default function YearSelector({ metrics }: YearSelectorProps) {
    const years = useMemo(() =>
        metricsToArray(metrics).map(m => m.year),
        [metrics]
    );

    const defaultYearA = years.find(y => y === 1980) ?? (years.length > 0 ? years[0] : 1980);
    const defaultYearB = years.find(y => y === 2024) ?? (years.length > 0 ? years[years.length - 1] : 2024);

    const [yearA, setYearA] = useState(defaultYearA);
    const [yearB, setYearB] = useState(defaultYearB);

    const dataA = metrics[yearA];
    const dataB = metrics[yearB];

    function getNumericValue(m: AnnualMetrics | undefined, key: keyof AnnualMetrics): number | undefined {
        if (!m) return undefined;
        const v = m[key];
        return typeof v === 'number' ? v : undefined;
    }

    function getCellColor(key: keyof AnnualMetrics, higherIsBad: boolean): string {
        const a = getNumericValue(dataA, key);
        const b = getNumericValue(dataB, key);
        if (a === undefined || b === undefined) return 'transparent';
        if (b > a) return higherIsBad ? 'rgba(178,24,43,0.15)' : 'rgba(67,147,195,0.15)';
        if (b < a) return higherIsBad ? 'rgba(67,147,195,0.15)' : 'rgba(178,24,43,0.15)';
        return 'transparent';
    }

    const selectStyle: React.CSSProperties = {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '6px',
        color: 'var(--color-text-primary)',
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: '1.125rem',
        padding: '0.375rem 0.75rem',
        cursor: 'pointer',
        minWidth: '80px',
    };

    const handleReset = () => {
        setYearA(years.find(y => y === 1980) ?? (years.length > 0 ? years[0] : 1980));
        setYearB(years.length > 0 ? years[years.length - 1] : 2024);
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Year selectors */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="year-a" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#4393c3' }}>Ano A:</label>
                    <select id="year-a" value={yearA} onChange={e => setYearA(Number(e.target.value))} style={selectStyle}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="year-b" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', color: '#d6604d' }}>Ano B:</label>
                    <select id="year-b" value={yearB} onChange={e => setYearB(Number(e.target.value))} style={selectStyle}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleReset}
                    aria-label="Resetar seleção de anos"
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8125rem',
                        color: 'rgba(255,255,255,0.4)',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        padding: '0.375rem 0.75rem',
                        cursor: 'pointer',
                    }}
                >
                    Resetar
                </button>
            </div>

            {/* Comparison table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400, letterSpacing: '0.04em' }}>
                                Índice
                            </th>
                            <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', color: '#4393c3', fontWeight: 700 }}>
                                {yearA}
                            </th>
                            <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', color: '#d6604d', fontWeight: 700 }}>
                                {yearB}
                            </th>
                            <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
                                Diferença
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {METRIC_CONFIG.map(({ key, label, unit, higherIsBad }) => {
                            const a = getNumericValue(dataA, key);
                            const b = getNumericValue(dataB, key);
                            const diff = b !== undefined && a !== undefined ? b - a : null;
                            const bg = getCellColor(key, higherIsBad);
                            return (
                                <tr key={String(key)} style={{ background: bg, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '0.5rem 0.75rem', color: 'rgba(255,255,255,0.7)' }}>{label}</td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#4393c3', fontFamily: "'JetBrains Mono', monospace" }}>
                                        {a !== undefined ? `${a.toFixed(1)} ${unit}` : '—'}
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#d6604d', fontFamily: "'JetBrains Mono', monospace" }}>
                                        {b !== undefined ? `${b.toFixed(1)} ${unit}` : '—'}
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: diff !== null ? (diff > 0 ? '#ef8a62' : '#67a9cf') : 'rgba(255,255,255,0.3)' }}>
                                        {diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <p style={{ marginTop: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
                Vermelho = piora · Azul = melhora
            </p>
        </div>
    );
}
