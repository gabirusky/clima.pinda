import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AnnualMetrics, DailyRecord } from '../../types/climate.ts';
import { metricsToArray } from '../../utils/dataProcessing.ts';

interface PersonalTimelineProps {
    birthYear: number;
    metrics: Record<number, AnnualMetrics>;
    // dailyData is accepted for future use (monthly details, calendar overlay, etc.)
    dailyData: DailyRecord[];
}

/**
 * PersonalTimeline — Intimate register.
 *
 * Shows how hot days changed over the user's lifetime.
 * Smaller type, softer light, private register.
 * drawLine animation on the SVG path.
 * If birth year = current year: shows "Check back next year."
 */
export default function PersonalTimeline({ birthYear, metrics, dailyData: _dailyData }: PersonalTimelineProps) {
    const currentYear = new Date().getFullYear();

    const metricsArr = useMemo(() =>
        metricsToArray(metrics).filter(m => m.year >= birthYear && m.year <= currentYear),
        [metrics, birthYear, currentYear]
    );

    if (birthYear >= currentYear) {
        return (
            <div style={{
                padding: '2rem',
                fontFamily: "'DM Sans', sans-serif",
                fontStyle: 'italic',
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.4)',
            }}>
                Volte no ano que vem. ✦
            </div>
        );
    }

    if (metricsArr.length === 0) {
        return (
            <div style={{
                padding: '2rem',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.3)',
            }}>
                Nenhum dado disponível para o período selecionado.
            </div>
        );
    }

    const firstYearData = metricsArr[0];
    const lastYearData = metricsArr[metricsArr.length - 1];
    const recordYear = metricsArr.reduce((best, m) => m.su30 > best.su30 ? m : best, metricsArr[0]);

    // SVG line chart dimensions
    const W = 480;
    const H = 180;
    const margL = 40;
    const margT = 20;
    const margR = 20;
    const margB = 32;
    const plotW = W - margL - margR;
    const plotH = H - margT - margB;

    const xMin = metricsArr[0].year;
    const xMax = metricsArr[metricsArr.length - 1].year;
    const yMin = 0;
    const yMax = Math.max(...metricsArr.map(m => m.su30)) * 1.1;

    const xScale = (year: number) => margL + ((year - xMin) / (xMax - xMin || 1)) * plotW;
    const yScale = (val: number) => margT + plotH - ((val - yMin) / (yMax - yMin || 1)) * plotH;

    const pathD = metricsArr
        .map((m, i) => `${i === 0 ? 'M' : 'L'}${xScale(m.year).toFixed(1)},${yScale(m.su30).toFixed(1)}`)
        .join(' ');

    const pathLength = 1000; // approximation for stroke-dasharray

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            style={{
                padding: '2rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                maxWidth: '560px',
            }}
        >
            {/* Intimate header — smaller type, softer light */}
            <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontStyle: 'italic',
                fontSize: '0.9375rem',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
            }}>
                Em {birthYear}, havia{' '}
                <strong style={{ color: '#4393c3', fontStyle: 'normal' }}>
                    {firstYearData?.su30 ?? '—'} dias acima de 30°C
                </strong>{' '}
                por ano em Pindamonhangaba.
            </p>

            {/* SVG line chart with drawLine animation */}
            <svg
                role="img"
                aria-label={`Gráfico mostrando dias acima de 30°C de ${birthYear} a ${currentYear}`}
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: '100%', maxWidth: W, display: 'block', marginBottom: '1.25rem' }}
            >
                <title>Dias acima de 30°C durante sua vida ({birthYear}–{currentYear})</title>
                <desc>Linha mostrando a evolução de SU30 (dias com temperatura máxima acima de 30°C) de {birthYear} a {currentYear}.</desc>

                {/* Grid lines */}
                {[0, 50, 100, 150].filter(v => v <= yMax).map(v => (
                    <line
                        key={v}
                        x1={margL} y1={yScale(v)}
                        x2={margL + plotW} y2={yScale(v)}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={1}
                    />
                ))}

                {/* Record year dot */}
                <circle
                    cx={xScale(recordYear.year)}
                    cy={yScale(recordYear.su30)}
                    r={5}
                    fill="#67001f"
                    stroke="#f0ece3"
                    strokeWidth={1}
                />
                <text
                    x={xScale(recordYear.year)}
                    y={yScale(recordYear.su30) - 9}
                    textAnchor="middle"
                    fill="rgba(240,236,227,0.5)"
                    fontSize={9}
                    fontFamily="'DM Sans', sans-serif"
                >
                    {recordYear.year}
                </text>

                {/* Main path — animated */}
                <path
                    d={pathD}
                    fill="none"
                    stroke="#ef8a62"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={pathLength}
                    strokeDashoffset={pathLength}
                    style={{ animation: 'drawLine 1.6s ease-out 0.3s forwards' }}
                />

                {/* X-axis labels */}
                {[xMin, Math.round((xMin + xMax) / 2), xMax].map(y => (
                    <text
                        key={y}
                        x={xScale(y)}
                        y={H - 8}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.3)"
                        fontSize={9}
                        fontFamily="'DM Sans', sans-serif"
                    >
                        {y}
                    </text>
                ))}

                {/* Y-axis label */}
                <text
                    x={margL - 16}
                    y={margT + plotH / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(255,255,255,0.2)"
                    fontSize={8}
                    fontFamily="'DM Sans', sans-serif"
                    transform={`rotate(-90, ${margL - 16}, ${margT + plotH / 2})`}
                >
                    dias/ano
                </text>
            </svg>

            {/* Intimate narrative */}
            <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontStyle: 'italic',
                fontSize: '0.9375rem',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.65,
            }}>
                Em {lastYearData?.year ?? currentYear}, são{' '}
                <strong style={{ color: '#b2182b', fontStyle: 'normal' }}>
                    {lastYearData?.su30 ?? '—'} dias acima de 30°C
                </strong>.
            </p>
            <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontStyle: 'italic',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.35)',
                marginTop: '0.5rem',
            }}>
                Seu ano mais quente foi{' '}
                <strong style={{ color: '#ef8a62', fontStyle: 'normal' }}>
                    {recordYear.year}
                </strong>{' '}
                — com {recordYear.su30} dias.
            </p>
        </motion.div>
    );
}
