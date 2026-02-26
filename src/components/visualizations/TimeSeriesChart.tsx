import { useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ReferenceLine, Brush,
} from 'recharts';
import type { AnnualMetrics } from '../../types/climate.ts';
import { linearRegression, predictRegression } from '../../utils/calculations.ts';
import { metricsToArray } from '../../utils/dataProcessing.ts';
import DataTable from '../common/DataTable.tsx';

interface TimeSeriesChartProps {
    metrics: Record<number, AnnualMetrics>;
    defaultMetric?: MetricKey;
}

type MetricKey = 'su30' | 'tr20' | 'dtr_mean' | 'wsdi_days' | 'cdd' | 'cwd';

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string; unit: string }> = {
    su30: { label: 'SU30 (dias ≥ 30°C)', color: '#ef8a62', unit: 'dias' },
    tr20: { label: 'TR20 (noites ≥ 20°C)', color: '#d6604d', unit: 'noites' },
    dtr_mean: { label: 'DTR (amplitude térmica)', color: '#4393c3', unit: '°C' },
    wsdi_days: { label: 'WSDI (ondas de calor)', color: '#b2182b', unit: 'dias' },
    cdd: { label: 'CDD (dias secos seguidos)', color: '#fddbc7', unit: 'dias' },
    cwd: { label: 'CWD (dias úmidos seguidos)', color: '#67a9cf', unit: 'dias' },
};

const DECADE_BOUNDARIES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

/**
 * TimeSeriesChart — Recharts line chart with trend overlay.
 *
 * Metric toggle buttons for SU30, TR20, DTR, WSDI, CDD, CWD.
 * Record year highlighted with a larger dot.
 * Brush for zoom/pan.
 * Decade reference lines.
 */
export default function TimeSeriesChart({ metrics, defaultMetric = 'su30' }: TimeSeriesChartProps) {
    const [activeMetric, setActiveMetric] = useState<MetricKey>(defaultMetric);

    const seriesData = useMemo(() => {
        const arr = metricsToArray(metrics);
        const xs = arr.map(m => m.year);
        const ys = arr.map(m => m[activeMetric] as number);
        const regression = linearRegression(xs, ys);
        const trendYs = predictRegression(xs, regression);

        return arr.map((m, i) => ({
            year: m.year,
            value: m[activeMetric] as number,
            trend: Math.round(trendYs[i] * 10) / 10,
        }));
    }, [metrics, activeMetric]);

    const recordYear = useMemo(() => {
        if (seriesData.length === 0) return null;
        return seriesData.reduce((best, d) => d.value > best.value ? d : best);
    }, [seriesData]);

    const config = METRIC_CONFIG[activeMetric];

    const CustomDot = (props: { cx?: number; cy?: number; payload?: { year: number; value: number } }) => {
        const { cx, cy, payload } = props;
        if (!payload || !recordYear || payload.year !== recordYear.year) return null;
        return <circle cx={cx} cy={cy} r={6} fill="#67001f" stroke="#f0ece3" strokeWidth={1.5} />;
    };

    const tooltipStyle = {
        background: 'rgba(10,15,30,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '6px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.875rem',
        color: 'var(--color-text-primary)',
    };

    const tableRows = seriesData.map(d => [
        String(d.year),
        String(d.value),
        String(d.trend),
    ]);

    return (
        <div style={{ width: '100%' }}>
            {/* Metric toggle buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {(Object.keys(METRIC_CONFIG) as MetricKey[]).map(key => {
                    const isActive = key === activeMetric;
                    const c = METRIC_CONFIG[key];
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveMetric(key)}
                            aria-pressed={isActive}
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.75rem',
                                fontWeight: isActive ? 600 : 400,
                                letterSpacing: '0.03em',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '999px',
                                border: `1px solid ${isActive ? c.color : 'rgba(255,255,255,0.12)'}`,
                                background: isActive ? `${c.color}22` : 'transparent',
                                color: isActive ? c.color : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {key.toUpperCase()}
                        </button>
                    );
                })}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={380}>
                <LineChart data={seriesData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="year"
                        stroke="rgba(255,255,255,0.2)"
                        tick={{ fill: 'rgba(240,236,227,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.2)"
                        tick={{ fill: 'rgba(240,236,227,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}
                        tickFormatter={v => `${v} ${config.unit}`}
                    />
                    <RechartsTooltip
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: 'rgba(240,236,227,0.7)', marginBottom: 4 }}
                        formatter={(v: number, name: string) => [
                            `${v} ${config.unit}`,
                            name === 'value' ? config.label : 'Tendência',
                        ]}
                    />
                    {/* Decade reference lines */}
                    {DECADE_BOUNDARIES.map(year => (
                        <ReferenceLine
                            key={year}
                            x={year}
                            stroke="rgba(255,255,255,0.08)"
                            strokeDasharray="2 4"
                        />
                    ))}
                    {/* Main metric line */}
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={config.color}
                        strokeWidth={2}
                        dot={<CustomDot />}
                        activeDot={{ r: 5, fill: config.color, stroke: '#f0ece3', strokeWidth: 1 }}
                        isAnimationActive={true}
                        animationDuration={800}
                    />
                    {/* Trend line */}
                    <Line
                        type="monotone"
                        dataKey="trend"
                        stroke="rgba(160,144,128,0.6)"
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        dot={false}
                        isAnimationActive={false}
                    />
                    <Brush
                        dataKey="year"
                        height={20}
                        stroke="rgba(255,255,255,0.1)"
                        fill="rgba(10,15,30,0.5)"
                        travellerWidth={8}
                    />
                </LineChart>
            </ResponsiveContainer>

            {recordYear && (
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem',
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: '0.5rem',
                }}>
                    Recorde: <strong style={{ color: '#67001f' }}>{recordYear.year}</strong> — {recordYear.value} {config.unit}
                </p>
            )}

            <DataTable
                caption={`Série temporal — ${config.label}`}
                headers={['Ano', config.label, 'Tendência']}
                rows={tableRows}
            />
        </div>
    );
}
