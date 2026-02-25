import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import type { AnnualMetrics } from '../../types/climate.ts';
import { decadalAverage } from '../../utils/dataProcessing.ts';
import DataTable from '../common/DataTable.tsx';

interface ComparativeBarChartProps {
    metrics: Record<number, AnnualMetrics>;
}

const DECADE_COLORS: Record<number, string> = {
    1940: '#08306b',
    1950: '#2166ac',
    1960: '#4393c3',
    1970: '#92c5de',
    1980: '#fddbc7',
    1990: '#ef8a62',
    2000: '#d6604d',
    2010: '#b2182b',
    2020: '#67001f',
};

const tooltipStyle = {
    background: 'rgba(10,15,30,0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.875rem',
    color: '#f0ece3',
};

/**
 * ComparativeBarChart — decadal comparison of SU30, TR20, WSDI.
 *
 * Bars grow from baseline on scroll entry (Framer Motion whileInView).
 * Dark glass tooltip matching site palette.
 */
export default function ComparativeBarChart({ metrics }: ComparativeBarChartProps) {
    const chartData = useMemo(() => {
        const su30 = decadalAverage(metrics, 'su30');
        const tr20 = decadalAverage(metrics, 'tr20');
        const wsdi = decadalAverage(metrics, 'wsdi_days');

        return su30.map((d, i) => ({
            decade: d.decade,
            label: `${d.decade}s`,
            su30: Math.round(d.value * 10) / 10,
            tr20: Math.round((tr20[i]?.value ?? 0) * 10) / 10,
            wsdi: Math.round((wsdi[i]?.value ?? 0) * 10) / 10,
        }));
    }, [metrics]);

    const tableRows = chartData.map(d => [
        d.label,
        `${d.su30} dias`,
        `${d.tr20} noites`,
        `${d.wsdi} dias`,
    ]);

    return (
        <motion.div
            style={{ width: '100%' }}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Legend */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <LegendItem color="#ef8a62" label="SU30 (dias ≥ 30°C)" />
                <LegendItem color="#d6604d" label="TR20 (noites ≥ 20°C)" />
                <LegendItem color="#b2182b" label="WSDI (ondas de calor)" />
            </div>

            <ResponsiveContainer width="100%" height={340}>
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="label"
                        stroke="rgba(255,255,255,0.2)"
                        tick={{ fill: 'rgba(240,236,227,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.2)"
                        tick={{ fill: 'rgba(240,236,227,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}
                        tickFormatter={v => `${v}`}
                    />
                    <RechartsTooltip
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: 'rgba(240,236,227,0.7)', marginBottom: 4 }}
                        formatter={(v: number, name: string) => {
                            const labels: Record<string, string> = {
                                su30: 'SU30 (dias)',
                                tr20: 'TR20 (noites)',
                                wsdi: 'WSDI (dias)',
                            };
                            return [v, labels[name] ?? name];
                        }}
                    />
                    <Bar dataKey="su30" name="su30" radius={[2, 2, 0, 0]} isAnimationActive={true} animationDuration={800}>
                        {chartData.map(d => (
                            <Cell key={d.decade} fill={DECADE_COLORS[d.decade] ?? '#ef8a62'} fillOpacity={0.85} />
                        ))}
                    </Bar>
                    <Bar dataKey="tr20" name="tr20" radius={[2, 2, 0, 0]} fill="#d6604d" fillOpacity={0.6} isAnimationActive={true} animationDuration={800} animationBegin={200} />
                    <Bar dataKey="wsdi" name="wsdi" radius={[2, 2, 0, 0]} fill="#b2182b" fillOpacity={0.5} isAnimationActive={true} animationDuration={800} animationBegin={400} />
                </BarChart>
            </ResponsiveContainer>

            <DataTable
                caption="Médias decadais — SU30, TR20, WSDI"
                headers={['Década', 'SU30', 'TR20', 'WSDI']}
                rows={tableRows}
            />
        </motion.div>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: color }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
        </span>
    );
}
