import { useState, useMemo } from 'react';
import {
    Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ReferenceLine, Brush, ComposedChart
} from 'recharts';
import type { RainMetrics } from '../../types/climate.ts';
import { linearRegression, predictRegression } from '../../utils/calculations.ts';
import DataTable from '../common/DataTable.tsx';

interface RainTimeSeriesChartProps {
    rainMetrics: Record<number, RainMetrics>;
    defaultMetric?: RainMetricKey;
}

type RainMetricKey = 'precip_total' | 'r10mm' | 'r20mm' | 'sdii' | 'rx1day';

const METRIC_CONFIG: Record<RainMetricKey, { label: string; color: string; unit: string; type: 'bar' | 'line' }> = {
    precip_total: { label: 'Volume Anual', color: '#4393c3', unit: 'mm', type: 'bar' },
    r10mm: { label: 'Dias com Chuva ≥ 10mm', color: '#2166ac', unit: 'dias', type: 'bar' },
    r20mm: { label: 'Dias com Tempestade (≥ 20mm)', color: '#053061', unit: 'dias', type: 'bar' },
    sdii: { label: 'Intensidade Média', color: '#92c5de', unit: 'mm/dia', type: 'line' },
    rx1day: { label: 'Máx em 1 dia', color: '#d6604d', unit: 'mm', type: 'bar' }
};

const DECADE_BOUNDARIES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

export default function RainTimeSeriesChart({ rainMetrics, defaultMetric = 'precip_total' }: RainTimeSeriesChartProps) {
    const [activeMetric, setActiveMetric] = useState<RainMetricKey>(defaultMetric);

    const seriesData = useMemo(() => {
        const arr = Object.keys(rainMetrics)
            .map(yr => parseInt(yr, 10))
            .sort((a, b) => a - b)
            .map(year => ({
                year,
                ...rainMetrics[year].annual
            }));

        const xs = arr.map(m => m.year);
        const ys = arr.map(m => (m[activeMetric] as number) || 0);
        const regression = linearRegression(xs, ys);
        const trendYs = predictRegression(xs, regression);

        return arr.map((m, i) => ({
            year: m.year,
            value: (m[activeMetric] as number) || 0,
            trend: Math.round(trendYs[i] * 10) / 10,
        }));
    }, [rainMetrics, activeMetric]);

    const recordYear = useMemo(() => {
        if (seriesData.length === 0) return null;
        return seriesData.reduce((best, d) => d.value > best.value ? d : best);
    }, [seriesData]);

    const config = METRIC_CONFIG[activeMetric];

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
        String(Math.round(d.value * 10) / 10),
        String(d.trend),
    ]);

    return (
        <div style={{ width: '100%' }}>
            {/* Metric toggle buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {(Object.keys(METRIC_CONFIG) as RainMetricKey[]).map(key => {
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
                <ComposedChart data={seriesData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                            `${Math.round(v * 10) / 10} ${config.unit}`,
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
                    {/* Main metric line or bar */}
                    {config.type === 'line' ? (
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={config.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5, fill: config.color, stroke: '#f0ece3', strokeWidth: 1 }}
                            isAnimationActive={true}
                            animationDuration={800}
                        />
                    ) : (
                        <Bar
                            dataKey="value"
                            fill={config.color}
                            radius={[2, 2, 0, 0]}
                            isAnimationActive={true}
                            animationDuration={800}
                        />
                    )}
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
                </ComposedChart>
            </ResponsiveContainer>

            {recordYear && (
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem',
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: '0.5rem',
                }}>
                    Recorde: <strong style={{ color: config.color }}>{recordYear.year}</strong> — {Math.round(recordYear.value * 10) / 10} {config.unit}
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
