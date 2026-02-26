import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts';
import type { RainMetrics } from '../../types/climate.ts';

interface RainClimatologyChartProps {
    rainMetrics: Record<number, RainMetrics>;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * RainClimatologyChart — Computes and displays the historical average precipitation per month.
 */
export default function RainClimatologyChart({ rainMetrics }: RainClimatologyChartProps) {
    const data = useMemo(() => {
        const monthTotals = new Array(12).fill(0);
        const monthCounts = new Array(12).fill(0);

        Object.values(rainMetrics).forEach(yrData => {
            if (yrData.monthly) {
                for (let m = 1; m <= 12; m++) {
                    const val = yrData.monthly[String(m)]?.precip_total;
                    if (val !== undefined && val !== null) {
                        monthTotals[m - 1] += val;
                        monthCounts[m - 1] += 1;
                    }
                }
            }
        });

        return MONTHS.map((month, i) => ({
            month,
            avgPrecip: monthCounts[i] > 0 ? Math.round((monthTotals[i] / monthCounts[i]) * 10) / 10 : 0,
        }));
    }, [rainMetrics]);

    const tooltipStyle = {
        background: 'rgba(10,15,30,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '6px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.875rem',
        color: 'var(--color-text-primary)',
    };

    return (
        <div style={{ width: '100%' }}>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', color: '#fff', marginBottom: '1rem' }}>
                Climograma (Média Histórica)
            </p>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 16, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="month"
                        stroke="rgba(255,255,255,0.2)"
                        tick={{ fill: 'rgba(240,236,227,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.2)"
                        tick={{ fill: 'rgba(240,236,227,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}
                        tickFormatter={v => `${v}mm`}
                    />
                    <RechartsTooltip
                        contentStyle={tooltipStyle}
                        itemStyle={{ color: '#67a9cf' }}
                        formatter={(val: number) => [`${val} mm`, 'Média Histórica']}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar
                        dataKey="avgPrecip"
                        fill="#4393c3"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1000}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
