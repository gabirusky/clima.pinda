import { lazy, Suspense } from 'react';
import type { AnnualMetrics } from '../../types/climate.ts';
import SectionTitle from '../common/SectionTitle.tsx';
import StatCallout from '../common/StatCallout.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';
import { linearRegression, predictRegression } from '../../utils/calculations.ts';
import { metricsToArray } from '../../utils/dataProcessing.ts';

const TimeSeriesChart = lazy(() => import('../visualizations/TimeSeriesChart.tsx'));

interface FutureSectionProps {
    metrics: Record<number, AnnualMetrics>;
}

/**
 * FutureSection — "What's Next?"
 *
 * OLS extrapolation to 2050.
 * StatCallout: projected SU30 by 2050.
 * Climate action links. Data download.
 * Acknowledgment of model limitations.
 */
export default function FutureSection({ metrics }: FutureSectionProps) {
    const arr = metricsToArray(metrics);

    // Filter out years where su30 is not a valid number before regression
    const validArr = arr.filter(m => typeof m.su30 === 'number' && isFinite(m.su30));
    const xs = validArr.map(m => m.year);
    const ys = validArr.map(m => m.su30);

    // Fallback if not enough data for regression
    const reg = xs.length >= 2 ? linearRegression(xs, ys) : { slope: 0, intercept: 0, r2: 0, slopePerDecade: 0 };
    const rawP2050 = xs.length >= 2 ? Math.round(predictRegression([2050], reg)[0]) : 0;
    const rawP2040 = xs.length >= 2 ? Math.round(predictRegression([2040], reg)[0]) : 0;

    // Clamp to sane range [0, 365] — regression can extrapolate unrealistically
    const projected2050 = isNaN(rawP2050) ? 0 : Math.max(0, Math.min(365, rawP2050));
    const projected2040 = isNaN(rawP2040) ? 0 : Math.max(0, Math.min(365, rawP2040));

    return (
        <div
            id="future"
            className="section-block"
            style={{
                paddingBlock: 'clamp(80px, 12vh, 160px)',
                paddingInline: 'clamp(1.5rem, 5vw, 4rem)',
                maxWidth: '1200px',
                margin: '0 auto',
            }}
        >
            <SectionTitle
                id="future-title"
                kicker="PROJEÇÃO OLS"
                accentColor="#67001f"
                sub="Se a tendência atual continuar — uma extrapolação linear, não um modelo climático."
            >
                O Que Vem Depois?
            </SectionTitle>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '3rem',
                marginBottom: '3rem',
            }}>
                <div style={{ gridColumn: '1 / -1' }}>
                    <Suspense fallback={<LoadingSpinner />}>
                        <TimeSeriesChart metrics={metrics} />
                    </Suspense>
                </div>
            </div>

            {/* Projection callouts */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '2rem',
                marginBottom: '3rem',
            }}>
                <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Projeção 2040
                    </p>
                    <StatCallout
                        value={projected2040}
                        unit="DIAS"
                        label="acima de 30°C — projeção linear se a tendência continuar"
                        accentColor="#d6604d"
                    />
                </div>
                <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Projeção 2050
                    </p>
                    <StatCallout
                        value={projected2050}
                        unit="DIAS"
                        label="acima de 30°C — quase um terço do ano inteiro"
                        accentColor="#67001f"
                    />
                </div>
            </div>

            {/* Caveat */}
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '3rem',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.7,
            }}>
                <strong style={{ color: 'rgba(255,255,255,0.6)' }}>⚠ Limitações do modelo:</strong>{' '}
                Esta projeção é uma regressão linear simples (OLS) aplicada aos dados históricos.
                Não leva em conta feedback climático, políticas de emissão, El Niño/La Niña
                ou mudanças no uso da terra. Para previsões científicas, consulte os cenários
                do IPCC e do INPE.
            </div>

            {/* Action links */}
            <div style={{ marginBottom: '2rem' }}>
                <p style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    color: 'var(--color-text-primary)',
                    marginBottom: '1rem',
                }}>
                    Saiba Mais
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {[
                        { href: 'https://www.ipcc.ch/', label: 'IPCC — Climate Change 2023' },
                        { href: 'https://portal.inmet.gov.br/', label: 'INMET — Instituto Nacional de Meteorologia' },
                        { href: 'https://www.inpe.br/', label: 'INPE — Instituto Nacional de Pesquisas Espaciais' },
                        { href: 'https://showyourstripes.info/', label: 'Show Your Stripes — Ed Hawkins' },
                    ].map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.875rem',
                                color: 'rgba(255,255,255,0.55)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '0.5rem 1rem',
                                textDecoration: 'none',
                                transition: 'color 0.2s, border-color 0.2s',
                            }}
                        >
                            {link.label} ↗
                        </a>
                    ))}
                </div>
            </div>

            {/* Download buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <a
                    href="./data/climate_data.json"
                    download
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.875rem',
                        background: 'rgba(239,138,98,0.12)',
                        border: '1px solid rgba(239,138,98,0.2)',
                        borderRadius: '6px',
                        color: '#ef8a62',
                        padding: '0.5rem 1rem',
                        textDecoration: 'none',
                    }}
                >
                    ↓ Baixar dados diários (JSON)
                </a>
                <a
                    href="./data/metrics.json"
                    download
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.875rem',
                        background: 'rgba(239,138,98,0.08)',
                        border: '1px solid rgba(239,138,98,0.15)',
                        borderRadius: '6px',
                        color: 'rgba(239,138,98,0.7)',
                        padding: '0.5rem 1rem',
                        textDecoration: 'none',
                    }}
                >
                    ↓ Baixar índices anuais (JSON)
                </a>
            </div>
        </div>
    );
}
