import { lazy, Suspense } from 'react';
import type { RainMetrics, ClimateSummary, DailyRecord } from '../../types/climate.ts';
import SectionTitle from '../common/SectionTitle.tsx';
import StatCallout from '../common/StatCallout.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

const RainTimeSeriesChart = lazy(() => import('../visualizations/RainTimeSeriesChart.tsx'));
const RainHeatmap = lazy(() => import('../visualizations/RainHeatmap.tsx'));
const RainClimatologyChart = lazy(() => import('../visualizations/RainClimatologyChart.tsx'));
const RainExtremesTimeline = lazy(() => import('../visualizations/RainExtremesTimeline.tsx'));

interface RainSectionProps {
    rainMetrics: Record<number, RainMetrics>;
    summary: ClimateSummary;
    dailyData: DailyRecord[];
}

/**
 * RainSection — "Chuvas"
 *
 * Shows precipitation trends in Pindamonhangaba including PRCPTOT, R10mm, R20mm, SDII, Rx1day.
 */
export default function RainSection({ rainMetrics, summary, dailyData }: RainSectionProps) {
    const wettestDay = summary.wettest_day;

    return (
        <div
            id="chuvas"
            className="section-block"
            style={{
                paddingBlock: 'clamp(80px, 12vh, 160px)',
                paddingInline: 'clamp(1.5rem, 5vw, 4rem)',
                maxWidth: '1200px',
                margin: '0 auto',
            }}
        >
            <SectionTitle
                id="chuvas-title"
                kicker="A Narrativa das Águas"
                accentColor="#2166ac"
                sub="Como a chuva diminuiu ao longo do tempo"
            >
                Estudo Pluviométrico
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
                        <RainTimeSeriesChart rainMetrics={rainMetrics} defaultMetric="precip_total" />
                    </Suspense>
                </div>
            </div>

            {/* Heatmap */}
            <div style={{ marginTop: '4rem' }}>
                <Suspense fallback={<LoadingSpinner />}>
                    <RainHeatmap rainMetrics={rainMetrics} />
                </Suspense>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '3rem',
                marginTop: '4rem',
                alignItems: 'start',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <Suspense fallback={<LoadingSpinner />}>
                        <RainClimatologyChart rainMetrics={rainMetrics} />
                    </Suspense>

                    <Suspense fallback={<LoadingSpinner />}>
                        <RainExtremesTimeline dailyData={dailyData} topCount={5} />
                    </Suspense>
                </div>

                {/* Right Column: Narrative Text & Record */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                        <p style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: '1.25rem',
                            color: '#fff',
                            marginBottom: '1rem',
                            marginTop: 0
                        }}>
                            Maior volume de chuva em um dia
                        </p>
                        <StatCallout
                            value={wettestDay?.precipitation ?? 0}
                            unit="mm"
                            label="25 de janeiro de 1947"
                            accentColor="#053061"
                            decimals={1}
                        />
                    </div>

                    <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '1rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.7,
                    }}>
                        <p>
                            Os cinco anos mais secos de toda a série histórica são <strong>2017, 2018, 2020, 2021 e 2025</strong>. Todos consecutivos e recentes.
                            Enquanto os anos mais chuvosos que Pinda já viveu datam de{' '}
                            <strong>1941, 1945 e 1946</strong>, como se a cidade tivesse esgotado
                            sua cota de abundância muito antes de qualquer um de nós ter nascido.
                        </p>

                        <p style={{ marginTop: '0.75rem' }}>
                            O colapso não é gradual: é uma quebra de regime. Até 2015, a média anual
                            era de <strong>1.669 mm</strong>. De 2016 em diante, caiu para{' '}
                            <strong>1.049 mm</strong>: um déficit de <strong>37%</strong> que se
                            sustenta por quase uma década sem sinais de recuperação. Não é uma seca.
                            É o novo normal.
                        </p>

                        <p style={{ marginTop: '0.75rem' }}>
                            O que torna o dado ainda mais perturbador é que as chuvas são cada vez mais fracas quando acontecem.
                            A intensidade média por dia chuvoso (<strong>SDII</strong>) caiu de
                            9,7 mm/dia na era 1971–2010 para <strong>8,2 mm/dia</strong> na era atual.
                            Os dias de chuva intensa (R20mm) seguem o mesmo caminho: de 18 episódios por
                            ano em média até 1970, para apenas <strong>10 nos últimos 9 anos</strong>.
                            Está chovendo menos, mais raro e mais fraco.
                        </p>

                        <p style={{ marginTop: '0.75rem' }}>
                            O outro lado dessa equação é o silêncio. Em 2025, Pinda já registrou{' '}
                            <strong>49 dias consecutivos sem chuva significativa</strong>. Esse é o maior
                            período de estiagem do registro histórico. Os dias úmidos despencaram de
                            uma média de 188 dias por ano nas décadas de 1940–70 para apenas{' '}
                            <strong>135 dias na última década</strong>. O calendário das chuvas está
                            encolhendo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
