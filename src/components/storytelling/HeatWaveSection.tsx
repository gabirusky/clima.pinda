import { lazy, Suspense } from 'react';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import type { AnnualMetrics, ClimateSummary } from '../../types/climate.ts';
import SectionTitle from '../common/SectionTitle.tsx';
import StatCallout from '../common/StatCallout.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

const TimeSeriesChart = lazy(() => import('../visualizations/TimeSeriesChart.tsx'));

interface HeatWaveSectionProps {
    metrics: Record<number, AnnualMetrics>;
    summary: ClimateSummary;
}

/**
 * HeatWaveSection — "Heat Waves: A Nova Normal"
 *
 * WSDI time series with context steps.
 * StatCallout: 82 days longest heat wave (2018).
 */
export default function HeatWaveSection({ metrics, summary }: HeatWaveSectionProps) {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    const longestSpell = summary.longest_warm_spell;

    return (
        <div
            id="heatwaves"
            className="section-block"
            style={{
                paddingBlock: 'clamp(80px, 12vh, 160px)',
                paddingInline: 'clamp(1rem, 5vw, 4rem)',
                maxWidth: '1200px',
                margin: '0 auto',
            }}
        >
            <SectionTitle
                id="heatwaves-title"
                kicker="WSDI — Warm Spell Duration Index"
                accentColor="#b2182b"
                sub="Os eventos de calor extremo estão se tornando mais frequentes, mais longos e mais intensos."
            >
                Ondas de Calor
            </SectionTitle>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '3rem',
                marginBottom: '3rem',
                alignItems: 'start',
            }}>
                {/* Chart */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <Suspense fallback={<LoadingSpinner />}>
                        <TimeSeriesChart metrics={metrics} defaultMetric="wsdi_days" />
                    </Suspense>
                </div>
            </div>

            {/* Callout cards */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row-reverse',
                gap: '2rem',
                marginTop: '2rem',
            }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                    <h2>Em 2018: </h2>
                    <StatCallout
                        value={longestSpell?.days ?? 82}
                        unit="DIAS"
                        label={`maior onda de calor consecutiva`}
                        accentColor="#b2182b"
                    />
                </div>
                <div style={{
                    flex: 1,
                    minWidth: '240px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '1rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.7,
                    paddingTop: '1rem',
                }}>
                    <p>
                        O WSDI (Warm Spell Duration Index) conta os dias em que a temperatura máxima supera
                        o percentil 90 histórico por <strong>6 ou mais dias consecutivos</strong>.
                    </p>
                    <p style={{ marginTop: '0.75rem' }}>
                        Nos anos 1940, ondas de calor eram raras e curtas.
                        Na última década, tornam-se estações inteiras.
                    </p>
                    <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)' }}>
                        Impactos: saúde pública, trabalho ao ar livre, produção agrícola,
                        demanda energética de pico.
                    </p>
                </div>
            </div>
        </div>
    );
}
