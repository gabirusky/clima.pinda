import { lazy, Suspense, useState, useCallback } from 'react';
import type { AnnualMetrics } from '../../types/climate.ts';
import SectionTitle from '../common/SectionTitle.tsx';
import StatCallout from '../common/StatCallout.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';
import { linearRegression, movingAverage } from '../../utils/calculations.ts';
import { metricsToArray } from '../../utils/dataProcessing.ts';
import type { ProjectionValues } from '../visualizations/ProjectionChart.tsx';

const ProjectionChart = lazy(() => import('../visualizations/ProjectionChart.tsx'));

interface FutureSectionProps {
    metrics: Record<number, AnnualMetrics>;
}

/**
 * FutureSection — "What's Next?"
 *
 * OLS extrapolation to 2050.
 * StatCallout: projected SU30 by 2040 & 2050 using both OLS and slope-anchor MM5.
 */
export default function FutureSection({ metrics }: FutureSectionProps) {
    // ── OLS projection for SU30 ──────────────────────────────────────────
    const BASELINE_START = 1991;
    const BASELINE_END = 2020;

    const arr = metricsToArray(metrics);
    const validArr = arr.filter(m => typeof m.su30 === 'number' && isFinite(m.su30));

    const baselineData = validArr.filter(m => m.year >= BASELINE_START && m.year <= BASELINE_END);
    const baselineValue = baselineData.length > 0
        ? baselineData.reduce((acc, m) => acc + (m.su30 as number), 0) / baselineData.length
        : 0;

    const xs = validArr.map(m => m.year);
    const ys = validArr.map(m => (m.su30 as number) - baselineValue);

    const reg =
        xs.length >= 2
            ? linearRegression(xs, ys)
            : { slope: 0, intercept: 0, r2: 0, slopePerDecade: 0 };

    const rawOLS2040 = xs.length >= 2 ? Math.round(reg.slope * 2040 + reg.intercept) : 0;
    const rawOLS2050 = xs.length >= 2 ? Math.round(reg.slope * 2050 + reg.intercept) : 0;

    const ols2040 = isNaN(rawOLS2040) ? 0 : rawOLS2040;
    const ols2050 = isNaN(rawOLS2050) ? 0 : rawOLS2050;

    // ── Slope-anchor MM5 extrapolation (mirrors ProjectionChart exactly) ──
    //
    //   slope_ma5  = OLS slope fitted to the stable centre of the historical MM5
    //   anchor     = histMA5[lastYear]  (last real MM5 value — guaranteed continuity)
    //   ma5proj(t) = anchor + slope_ma5 × (t − lastYear)
    //
    const MA_WINDOW = 5;
    const lastYear = xs.length > 0 ? xs[xs.length - 1] : new Date().getFullYear();
    const histMA5 = movingAverage(ys, MA_WINDOW);

    const halfWin = Math.floor(MA_WINDOW / 2);
    // Use the post-1991 period (WMO baseline) to capture the accelerated
    // warming trend robustly, avoiding pre-acceleration decades.
    const windowStart = BASELINE_START;
    const stableXs: number[] = [];
    const stableYs: number[] = [];
    for (let i = halfWin; i < xs.length - halfWin; i++) {
        if (!isNaN(histMA5[i]) && xs[i] >= windowStart) {
            stableXs.push(xs[i]);
            stableYs.push(histMA5[i]);
        }
    }
    const maReg = stableXs.length >= 2 ? linearRegression(stableXs, stableYs) : reg;
    const ma5Anchor = histMA5[histMA5.length - 1];

    const getMA5proj = (targetYear: number): number | null => {
        const v = ma5Anchor + maReg.slope * (targetYear - lastYear);
        return isNaN(v) ? null : Math.round(v * 10) / 10;
    };

    const ma5_2040 = getMA5proj(2040);
    const ma5_2050 = getMA5proj(2050);

    // ── Live-update callouts when user switches metric in the chart ───────
    const [chartProj, setChartProj] = useState<{
        ols2040: number; ols2050: number; ma5_2040: number | null; ma5_2050: number | null;
    }>({ ols2040, ols2050, ma5_2040, ma5_2050 });

    const handleProjectionValues = useCallback(
        (vals: ProjectionValues[]) => {
            const p2040 = vals.find(v => v.year === 2040);
            const p2050 = vals.find(v => v.year === 2050);
            setChartProj({
                ols2040: p2040 ? Math.round(p2040.ols) : ols2040,
                ols2050: p2050 ? Math.round(p2050.ols) : ols2050,
                ma5_2040: p2040 ? Math.round(p2040.ma5proj * 10) / 10 : ma5_2040,
                ma5_2050: p2050 ? Math.round(p2050.ma5proj * 10) / 10 : ma5_2050,
            });
        },
        [ols2040, ols2050, ma5_2040, ma5_2050],
    );

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
                kicker="ANOMALIAS E PROJEÇÕES"
                accentColor="#67001f"
                sub="A partir de 2026, comparamos a tendência linear com a extrapolação ancorada no período da OMM (1991-2020)."
            >
                O Que Vem Depois?
            </SectionTitle>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem',
                }}
            >
                <div style={{ gridColumn: '1 / -1' }}>
                    <Suspense fallback={<LoadingSpinner />}>
                        <ProjectionChart
                            metrics={metrics}
                            onProjectionValues={handleProjectionValues}
                        />
                    </Suspense>
                </div>
            </div>

            {/* Projection callouts — OLS + MM5 side by side, 2x2 grid */}
            <h3
                style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: 'var(--color-text-primary)',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    paddingBottom: '0.5rem',
                }}
            >
                Dias de Anomalia Projetados
            </h3>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '2rem',
                    marginBottom: '3rem',
                }}
            >
                {/* 2040 OLS */}
                <div>
                    <p
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.8125rem',
                            color: 'rgba(255,255,255,0.4)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Tendência Linear Padrão — 2040
                    </p>
                    <StatCallout
                        value={chartProj.ols2040}
                        showSign={true}
                        label="regressão linear se a tendência continuar"
                        accentColor="#d6604d"
                    />
                </div>

                {/* 2040 MA5 */}
                <div>
                    <p
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.8125rem',
                            color: 'rgba(255,255,255,0.4)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Média móvel 5 anos — 2040
                    </p>
                    <StatCallout
                        value={chartProj.ma5_2040 ?? chartProj.ols2040}
                        showSign={true}
                        label="estimativa suavizada pela média móvel projetada"
                        accentColor="#ca0020"
                    />
                </div>

                {/* 2050 OLS */}
                <div>
                    <p
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.8125rem',
                            color: 'rgba(255,255,255,0.4)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Tendência Linear Padrão — 2050
                    </p>
                    <StatCallout
                        value={chartProj.ols2050}
                        showSign={true}
                        label="desvio em relação à normal climatológica"
                        accentColor="#b2182b"
                    />
                </div>

                {/* 2050 MA5 */}
                <div>
                    <p
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.8125rem',
                            color: 'rgba(255,255,255,0.4)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Média móvel 5 anos — 2050
                    </p>
                    <StatCallout
                        value={chartProj.ma5_2050 ?? chartProj.ols2050}
                        showSign={true}
                        label="estimativa suavizada pela média móvel projetada"
                        accentColor="#67001f"
                    />
                </div>
            </div>

            {/* Caveat */}
            <div
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    marginBottom: '3rem',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.4)',
                    lineHeight: 1.7,
                }}
            >
                <strong style={{ color: 'rgba(255,255,255,0.6)' }}>⚠ Metodologia e Limitações:</strong>{' '}
                São apresentadas duas extrapolações matemáticas de anomalias (desvios em relação à normal climatológica 1991-2020), não modelos climáticos físicos.
                A <strong>Tendência Linear Padrão</strong> traça uma linha de tendência sobre todo o histórico de anomalias.
                Já a <strong>Média Móvel Extrapolada</strong> utiliza o método de <em>slope-anchor</em>:
                a taxa de crescimento é calculada apenas desde o período de referência (capturando a
                aceleração recente do aquecimento) e ancorada no valor real mais recente para garantir integração perfeita com o gráfico.
                Nenhuma aborda dinâmicas complexas da atmosfera. Para previsões científicas completas, consensos do IPCC devem ser consultados.
            </div>

            {/* Action links */}
            <div style={{ marginBottom: '2rem' }}>
                <p
                    style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        color: 'var(--color-text-primary)',
                        marginBottom: '1rem',
                    }}
                >
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
