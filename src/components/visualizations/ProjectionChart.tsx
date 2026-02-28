import { useState, useMemo, useEffect } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine,
    Brush,
} from 'recharts';
import type { AnnualMetrics } from '../../types/climate.ts';
import { linearRegression, movingAverage } from '../../utils/calculations.ts';
import { metricsToArray } from '../../utils/dataProcessing.ts';
import DataTable from '../common/DataTable.tsx';

export interface ProjectionValues {
    year: number;
    /** OLS raw projection */
    ols: number;
    /**
     * Slope-anchor MM5 projection:
     *   mm5_proj(t) = mm5_real(lastYear) + slope_ma5 × (t − lastYear)
     */
    ma5proj: number;
}

interface ProjectionChartProps {
    metrics: Record<number, AnnualMetrics>;
    onProjectionValues?: (vals: ProjectionValues[]) => void;
}

type MetricKey = 'su30' | 'tr20' | 'wsdi_days' | 'cdd' | 'cwd';

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string; unit: string }> = {
    su30: { label: 'SU30 (dias ≥ 30°C)', color: '#ef8a62', unit: 'dias' },
    tr20: { label: 'TR20 (noites ≥ 20°C)', color: '#d6604d', unit: 'noites' },
    wsdi_days: { label: 'WSDI (ondas de calor)', color: '#b2182b', unit: 'dias' },
    cdd: { label: 'CDD (dias secos seguidos)', color: '#fddbc7', unit: 'dias' },
    cwd: { label: 'CWD (dias úmidos seguidos)', color: '#67a9cf', unit: 'dias' },
};

const PROJECTION_END = 2050;
const MA_WINDOW = 5;
const BASELINE_START = 1991;

interface ChartPoint {
    year: number;
    historical: number | undefined;
    projected: number | undefined;
    /** Centred MA5 on real historical observations */
    ma5: number | undefined;
    /**
     * Slope-anchor MM5 extrapolated line.
     * Defined on the LAST historical year (= anchor point) AND on all projected years,
     * so Recharts draws a single continuous line with no gap.
     */
    ma5proj: number | undefined;
    /** Full-range raw OLS trend */
    trend: number;
    isFuture: boolean;
}

// ── Helper: compute slope-anchor-extrapolated MM5 ──────────────────────────
/**
 * Given the historical MM5 series and the corresponding years:
 *   1. Fit OLS to the stable centre of the MM5 series to get slope_ma5.
 *   2. Anchor = the LAST historical MM5 value (no gap, guaranteed continuity).
 *   3. For each projected year t:
 *        ma5proj(t) = anchor_value + slope_ma5 × (t − anchor_year)
 *
 * This is the correct extrapolation because the slope is derived from the
 * historical smoothed trend, and the starting point is exactly where the
 * historical MM5 ends.
 */
function extrapolateMA5(
    histYears: number[],
    histMA5: number[],
    projYears: number[],
): number[] {
    if (histYears.length < 2 || projYears.length === 0) return projYears.map(() => 0);

    const anchorYear = histYears[histYears.length - 1];
    const anchorValue = histMA5[histYears.length - 1];

    // Stable centre of the centred MA (skip first and last ⌊window/2⌋ entries)
    const halfWin = Math.floor(MA_WINDOW / 2);
    // ── Restrict to the post-1991 period (WMO baseline) to capture the accelerated
    //    warming trend rather than diluting it with pre-acceleration decades.
    const windowStart = BASELINE_START;
    const stableXs: number[] = [];
    const stableYs: number[] = [];
    for (let i = halfWin; i < histYears.length - halfWin; i++) {
        if (!isNaN(histMA5[i]) && histYears[i] >= windowStart) {
            stableXs.push(histYears[i]);
            stableYs.push(histMA5[i]);
        }
    }

    const slope =
        stableXs.length >= 2
            ? linearRegression(stableXs, stableYs).slope
            : 0;

    // Anchor: last historical MA5 value — guarantees zero gap at the boundary
    return projYears.map(t => anchorValue + slope * (t - anchorYear));
}

export default function ProjectionChart({ metrics, onProjectionValues }: ProjectionChartProps) {
    const [activeMetric, setActiveMetric] = useState<MetricKey>('su30');

    const { chartData, recordYear, lastHistoricalYear, projectionValues } = useMemo(() => {
        const arr = metricsToArray(metrics);
        const validArr = arr.filter(
            m => typeof m[activeMetric] === 'number' && isFinite(m[activeMetric] as number),
        );

        const histYears = validArr.map(m => m.year);
        const histVals = validArr.map(m => m[activeMetric] as number);

        if (histYears.length < 2) {
            return { chartData: [], recordYear: null, lastHistoricalYear: 2025, projectionValues: [] };
        }

        // ── 1. Raw OLS on historical data ────────────────────────────────────
        const olsReg = linearRegression(histYears, histVals);
        const lastYear = histYears[histYears.length - 1];

        // ── 2. Historical MM5 (centred moving average, window = 5) ───────────
        const histMA5 = movingAverage(histVals, MA_WINDOW);

        // ── 3. Projected years: lastYear+1 → PROJECTION_END ─────────────────
        const projYears: number[] = [];
        for (let yr = lastYear + 1; yr <= PROJECTION_END; yr++) projYears.push(yr);

        // ── 4. OLS projection for each future year ───────────────────────────
        const projOLS = projYears.map(yr => olsReg.slope * yr + olsReg.intercept);

        // ── 5. MM5 slope-anchor extrapolation ────────────────────────────────
        //
        //   slope_ma5 = OLS slope fitted to the stable historical MM5 values
        //   anchor    = histMA5[lastYear]  (last MA5 value, exact historical position)
        //   ma5proj(t) = anchor + slope_ma5 × (t − lastYear)
        //
        const projMA5 = extrapolateMA5(histYears, histMA5, projYears);

        // Anchor value for the boundary connection (last historical point)
        const ma5Anchor = histMA5[histYears.length - 1];

        // ── 6. Notify parent with projected values ───────────────────────────
        const calculatedProjectionValues = projYears.map((yr, i) => ({
            year: yr,
            ols: Math.round(projOLS[i] * 10) / 10,
            ma5proj: Math.round(projMA5[i] * 10) / 10,
        }));

        // ── 7. Build chart data arrays ───────────────────────────────────────
        const historicalPoints: ChartPoint[] = validArr.map((m, i) => ({
            year: m.year,
            historical: histVals[i],
            projected: undefined,
            ma5: !isNaN(histMA5[i]) ? Math.round(histMA5[i] * 10) / 10 : undefined,
            // On the LAST historical year: also set ma5proj = anchor so the
            // projected MA5 line visually connects to the historical MA5 line.
            ma5proj:
                i === histYears.length - 1
                    ? Math.round(ma5Anchor * 10) / 10
                    : undefined,
            trend: Math.round((olsReg.slope * m.year + olsReg.intercept) * 10) / 10,
            isFuture: false,
        }));

        const projectedPoints: ChartPoint[] = projYears.map((yr, i) => ({
            year: yr,
            historical: undefined,
            projected: Math.round(projOLS[i] * 10) / 10,
            ma5: undefined,
            ma5proj: Math.round(projMA5[i] * 10) / 10,
            trend: Math.round((olsReg.slope * yr + olsReg.intercept) * 10) / 10,
            isFuture: true,
        }));

        const allData = [...historicalPoints, ...projectedPoints];

        const recordPt = historicalPoints.reduce<ChartPoint | null>(
            (best, d) =>
                best === null || (d.historical ?? -Infinity) > (best.historical ?? -Infinity)
                    ? d
                    : best,
            null,
        );

        return { chartData: allData, recordYear: recordPt, lastHistoricalYear: lastYear, projectionValues: calculatedProjectionValues };
    }, [metrics, activeMetric]);

    useEffect(() => {
        if (projectionValues && projectionValues.length > 0) {
            onProjectionValues?.(projectionValues);
        }
    }, [projectionValues, onProjectionValues]);

    const config = METRIC_CONFIG[activeMetric];

    // ── Record dot ──────────────────────────────────────────────────────────
    const HistoricalDot = (props: { cx?: number; cy?: number; payload?: ChartPoint }) => {
        const { cx, cy, payload } = props;
        if (!payload || !recordYear || payload.year !== recordYear.year) return null;
        return <circle cx={cx} cy={cy} r={6} fill="#67001f" stroke="#f0ece3" strokeWidth={1.5} />;
    };

    // ── Custom tooltip ───────────────────────────────────────────────────────
    const CustomTooltip = ({
        active,
        payload,
        label,
    }: {
        active?: boolean;
        payload?: Array<{ name: string; value: number; color: string }>;
        label?: number;
    }) => {
        if (!active || !payload || payload.length === 0) return null;
        const isFuture = (label ?? 0) > lastHistoricalYear;
        return (
            <div
                style={{
                    background: 'rgba(10,15,30,0.97)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-primary)',
                    padding: '0.6rem 0.9rem',
                }}
            >
                <p
                    style={{
                        color: isFuture ? '#ca0020' : 'rgba(240,236,227,0.7)',
                        marginBottom: 6,
                        fontWeight: 600,
                    }}
                >
                    {label}
                    {isFuture && ' (projeção)'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 4px 0', fontSize: '10px' }}>
                    Valores absolutos
                </p>
                {payload
                    .filter(p => (p as any).dataKey !== 'trend')
                    .map(p => {
                        return (
                            <p key={(p as any).dataKey || p.name} style={{ color: p.color, margin: '3px 0' }}>
                                {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
                            </p>
                        )
                    })}
            </div>
        );
    };

    const tableRows = chartData.map(d => [
        String(d.year),
        d.historical !== undefined ? String(d.historical) : '—',
        d.projected !== undefined ? String(d.projected) : '—',
        d.ma5 !== undefined
            ? String(d.ma5)
            : d.ma5proj !== undefined
                ? String(d.ma5proj)
                : '—',
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

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1.25rem',
                    marginBottom: '0.75rem',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.5)',
                }}
            >
                <div style={{ width: '100%', marginBottom: '0.25rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    Valores em Absoluto
                </div>
                <LegendItem color={config.color} label="Dados históricos" />
                <LegendItem
                    color="#b48a6e"
                    dashed
                    label={`Tendência Linear Padrão (${lastHistoricalYear + 1}–${PROJECTION_END})`}
                />
                <LegendItem color="#f4a582" dashed label={`MM${MA_WINDOW} histórica`} />
                <LegendItem
                    color="#ca0020"
                    dashed
                    faint
                    label={`MM${MA_WINDOW} extrapolada (slope-anchor)`}
                />
                <LegendItem color="rgba(160,144,128,0.65)" dashed faint label="Tendência Linear Padrão" />
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="year"
                        stroke="rgba(255,255,255,0.2)"
                        tick={{
                            fill: 'rgba(240,236,227,0.5)',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 11,
                        }}
                    />
                    <YAxis
                        domain={[0, 'auto']}
                        stroke="rgba(255,255,255,0.2)"
                        tick={{
                            fill: 'rgba(240,236,227,0.5)',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 11,
                        }}
                        tickFormatter={(v: number) => `${v}`}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />

                    {/* Baseline Zero */}
                    <ReferenceLine
                        y={0}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth={1.5}
                    />

                    {/* Separator: last historical year */}
                    <ReferenceLine
                        x={lastHistoricalYear}
                        stroke="rgba(180,138,110,0.40)"
                        strokeDasharray="4 3"
                        label={{
                            value: `↑ ${lastHistoricalYear}`,
                            position: 'insideTopRight',
                            fill: 'rgba(180,138,110,0.65)',
                            fontSize: 10,
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    />
                    <ReferenceLine
                        x={2040}
                        stroke="rgba(202,0,32,0.18)"
                        strokeDasharray="3 6"
                        label={{
                            value: '2040',
                            position: 'insideTopLeft',
                            fill: 'rgba(202,0,32,0.4)',
                            fontSize: 9,
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    />
                    <ReferenceLine
                        x={2050}
                        stroke="rgba(202,0,32,0.18)"
                        strokeDasharray="3 6"
                        label={{
                            value: '2050',
                            position: 'insideTopLeft',
                            fill: 'rgba(202,0,32,0.4)',
                            fontSize: 9,
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    />

                    {/* Historical observations */}
                    <Line
                        type="monotone"
                        dataKey="historical"
                        name="Histórico"
                        stroke={config.color}
                        strokeWidth={2}
                        dot={<HistoricalDot />}
                        activeDot={{ r: 5, fill: config.color, stroke: '#f0ece3', strokeWidth: 1 }}
                        connectNulls={false}
                        isAnimationActive={true}
                        animationDuration={700}
                    />

                    {/* OLS projection */}
                    <Line
                        type="monotone"
                        dataKey="projected"
                        name="Tendência Linear Padrão"
                        stroke="#b48a6e"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={false}
                        activeDot={{ r: 4, fill: '#b48a6e', stroke: '#f0ece3', strokeWidth: 1 }}
                        connectNulls={false}
                        isAnimationActive={true}
                        animationDuration={900}
                        animationBegin={300}
                    />

                    {/* Historical MM5 */}
                    <Line
                        type="monotone"
                        dataKey="ma5"
                        name={`MM${MA_WINDOW}`}
                        stroke="#f4a582"
                        strokeWidth={2.2}
                        strokeDasharray="7 4"
                        dot={false}
                        connectNulls={true}
                        isAnimationActive={false}
                    />

                    {/*
                     * Slope-anchor MM5 extrapolation:
                     *   - Shares the same dataKey segment as historical ma5 at the boundary
                     *     (last historical point has BOTH ma5 and ma5proj defined)
                     *   - Grows at the same rate the historical MM5 was growing
                     *   - Zero gap / zero discontinuity
                     */}
                    <Line
                        type="monotone"
                        dataKey="ma5proj"
                        name={`MM${MA_WINDOW} extrapolada`}
                        stroke="#ca0020"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        strokeOpacity={0.85}
                        dot={false}
                        connectNulls={true}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationBegin={500}
                    />

                    {/* Raw OLS trend across entire timeline */}
                    <Line
                        type="monotone"
                        dataKey="trend"
                        name="Tendência Linear Padrão"
                        stroke="rgba(160,144,128,0.42)"
                        strokeWidth={1.5}
                        strokeDasharray="4 5"
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
                <p
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8125rem',
                        color: 'rgba(255,255,255,0.4)',
                        marginTop: '0.5rem',
                    }}
                >
                    Recorde Máximo:{' '}
                    <strong style={{ color: '#67001f' }}>{recordYear.year}</strong> —{' '}
                    {recordYear.historical} {config.unit}
                </p>
            )}

            <DataTable
                caption={`Projeção — ${config.label}`}
                headers={[
                    'Ano',
                    'Histórico',
                    'Tendência Linear Padrão',
                    `MM${MA_WINDOW} / extrapolada`,
                    'Tendência',
                ]}
                rows={tableRows}
            />
        </div>
    );
}

// ── Legend pill helper ───────────────────────────────────────────────────────
function LegendItem({
    color,
    label,
    dashed = false,
    faint = false,
}: {
    color: string;
    label: string;
    dashed?: boolean;
    faint?: boolean;
}) {
    return (
        <span
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: faint ? 0.72 : 1,
            }}
        >
            <span
                style={{
                    display: 'inline-block',
                    width: 24,
                    height: 0,
                    borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${color}`,
                }}
            />
            {label}
        </span>
    );
}
