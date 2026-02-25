import { useState, useMemo } from 'react';
import type { AnnualMetrics, DailyRecord } from '../../types/climate.ts';
import { filterByYear, countDaysAboveThreshold } from '../../utils/dataProcessing.ts';
import { metricsToArray } from '../../utils/dataProcessing.ts';
import { AC_HOURS_PER_HOT_DAY, AC_POWER_KW, DEFAULT_ELECTRICITY_RATE_BRL, AC_THRESHOLD } from '../../constants/thresholds.ts';
import { formatBRL } from '../../utils/formatters.ts';

interface ACCalculatorProps {
    dailyData: DailyRecord[];
    metrics: Record<number, AnnualMetrics>;
}

/**
 * ACCalculator — The Receipt.
 *
 * JetBrains Mono throughout. Stark, uncomfortable clarity.
 * Year selector. Editable electricity rate.
 * Itemized rows. Hairline rule before TOTAL.
 * Blinking cursor on the final bill total.
 * Comparison to 1990 baseline.
 */
export default function ACCalculator({ dailyData, metrics }: ACCalculatorProps) {
    const years = useMemo(() => metricsToArray(metrics).map(m => m.year), [metrics]);
    const [selectedYear, setSelectedYear] = useState<number>(years.at(-1) ?? 2024);
    const [ratePerKwh, setRatePerKwh] = useState<number>(DEFAULT_ELECTRICITY_RATE_BRL);

    const calc = useMemo(() => {
        const yearRecords = filterByYear(dailyData, selectedYear);
        const daysAbove = countDaysAboveThreshold(yearRecords, AC_THRESHOLD);
        const hoursAC = daysAbove * AC_HOURS_PER_HOT_DAY;
        const kwhConsumed = hoursAC * AC_POWER_KW;
        const totalCost = kwhConsumed * ratePerKwh;

        // Baseline 1990 comparison
        const baselineRecords = filterByYear(dailyData, 1990);
        const baselineDays = countDaysAboveThreshold(baselineRecords, AC_THRESHOLD);
        const baselineHours = baselineDays * AC_HOURS_PER_HOT_DAY;
        const baselineKwh = baselineHours * AC_POWER_KW;
        const baselineCost = baselineKwh * ratePerKwh;

        return { daysAbove, hoursAC, kwhConsumed, totalCost, baselineDays, baselineHours, baselineKwh, baselineCost };
    }, [dailyData, selectedYear, ratePerKwh]);

    const monoStyle: React.CSSProperties = {
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--color-text-primary)',
    };

    const rowStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '2rem',
        padding: '0.375rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.03em',
    };

    const valueStyle: React.CSSProperties = {
        fontSize: '0.875rem',
        color: 'var(--color-text-primary)',
        textAlign: 'right',
        flexShrink: 0,
    };

    return (
        <div
            aria-label={`Calculadora de custo de ar condicionado — ${selectedYear}`}
            style={{
                background: 'rgba(5, 8, 18, 0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px',
                padding: '1.5rem',
                maxWidth: '380px',
                ...monoStyle,
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>
                    ESTIMATIVA DE CONSUMO
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-accent)', marginTop: '0.25rem' }}>
                    AR CONDICIONADO
                </p>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginTop: '0.25rem' }}>
                    PINDAMONHANGABA, SP
                </p>
            </div>

            {/* Year selector */}
            <div style={{ ...rowStyle, alignItems: 'center' }}>
                <label htmlFor="ac-year-select" style={labelStyle}>ANO</label>
                <select
                    id="ac-year-select"
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    style={{
                        ...monoStyle,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        fontSize: '0.875rem',
                        padding: '0.2rem 0.4rem',
                        cursor: 'pointer',
                        color: 'var(--color-text-accent)',
                    }}
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Rate input */}
            <div style={{ ...rowStyle, alignItems: 'center', marginBottom: '1rem' }}>
                <label htmlFor="ac-rate-input" style={labelStyle}>TARIFA (R$/kWh)</label>
                <input
                    id="ac-rate-input"
                    type="number"
                    min={0.1}
                    max={3}
                    step={0.05}
                    value={ratePerKwh}
                    onChange={e => setRatePerKwh(Number(e.target.value))}
                    aria-label="Tarifa de energia elétrica em reais por quilowatt-hora"
                    style={{
                        ...monoStyle,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        fontSize: '0.875rem',
                        padding: '0.2rem 0.4rem',
                        width: '70px',
                        textAlign: 'right',
                        color: 'var(--color-text-primary)',
                    }}
                />
            </div>

            {/* Itemized rows */}
            <div style={{ ...rowStyle }}>
                <span style={labelStyle}>DIAS ACIMA DE {AC_THRESHOLD}°C</span>
                <span style={valueStyle}>{calc.daysAbove} dias</span>
            </div>
            <div style={{ ...rowStyle }}>
                <span style={labelStyle}>× {AC_HOURS_PER_HOT_DAY}H/DIA ESTIMADAS</span>
                <span style={valueStyle}>{calc.hoursAC.toLocaleString('pt-BR')} h</span>
            </div>
            <div style={{ ...rowStyle }}>
                <span style={labelStyle}>× {AC_POWER_KW} kW (1 HP SPLIT)</span>
                <span style={valueStyle}>{calc.kwhConsumed.toFixed(0)} kWh</span>
            </div>
            <div style={{ ...rowStyle }}>
                <span style={labelStyle}>× R${ratePerKwh.toFixed(2)}/kWh</span>
                <span style={valueStyle}>&nbsp;</span>
            </div>

            {/* Hairline rule before total */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.25)', margin: '0.75rem 0' }} />

            {/* TOTAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', padding: '0.25rem 0' }}>
                <span style={{ ...labelStyle, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>
                    TOTAL AC {selectedYear}:
                </span>
                <span style={{
                    ...valueStyle,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--color-text-accent)',
                }}>
                    {formatBRL(calc.totalCost)}
                    <span style={{ animation: 'pulseHot 1s ease-in-out infinite', display: 'inline-block', marginLeft: '2px', color: '#ef8a62' }}>▌</span>
                </span>
            </div>

            {/* Comparison to 1990 baseline */}
            <div style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.3)',
            }}>
                <p style={{ marginBottom: '0.25rem' }}>VS. BASELINE 1990:</p>
                <p>1990 — {calc.baselineDays} dias · {formatBRL(calc.baselineCost)}</p>
                <p style={{ color: calc.totalCost > calc.baselineCost ? '#ef8a62' : '#4393c3', marginTop: '0.25rem' }}>
                    DIFERENÇA: {formatBRL(Math.abs(calc.totalCost - calc.baselineCost))}
                    {calc.totalCost > calc.baselineCost ? ' (↑ mais caro)' : ' (↓ mais barato)'}
                </p>
            </div>

            <p style={{ marginTop: '1.25rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)', lineHeight: 1.5 }}>
                * Esta é uma estimativa simplificada. Consumo real varia por equipamento,
                uso, isolamento térmico e setor.
            </p>
        </div>
    );
}
