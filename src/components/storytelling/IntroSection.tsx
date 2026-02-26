import { useState, useMemo, lazy, Suspense } from 'react';
import type { AnnualMetrics, DailyRecord, ClimateSummary } from '../../types/climate.ts';
import ScrollySection from './ScrollySection.tsx';
import SectionTitle from '../common/SectionTitle.tsx';
import StatCallout from '../common/StatCallout.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';
import GlobeHero from './GlobeHero.tsx';

const ClimateStripes = lazy(() => import('../visualizations/ClimateStripes.tsx'));

interface IntroSectionProps {
    metrics: Record<number, AnnualMetrics>;
    dailyData: DailyRecord[];
    summary: ClimateSummary;
}

/**
 * IntroSection — Hero / Intro
 *
 * "Pindamonhangaba is warming. Here is the proof."
 * Opens with the GlobeHero, then transitions into scrollytelling
 * ClimateStripes section.
 */
export default function IntroSection({ metrics }: IntroSectionProps) {
    const [highlightRecent, setHighlightRecent] = useState(false);

    // useMemo keeps the array reference stable across re-renders triggered by
    // highlightRecent state changes. Without this, ClimateStripes receives a
    // new `data` prop every render → its useEffect([data, width]) fires → the
    // SVG is cleared and the entire stripe animation replays from scratch.
    const metricsArray = useMemo(
        () => Object.values(metrics).sort((a, b) => a.year - b.year),
        [metrics]
    );
    const latestAnomaly = useMemo(
        () => metricsArray.length > 0 ? metricsArray[metricsArray.length - 1].anomaly : 0,
        [metricsArray]
    );

    const steps = [
        <div key="step-1">
            <SectionTitle id="stripes" accentColor="#ef8a62">
                Entenda as mudanças climáticas:
            </SectionTitle>
            <p>
                A partir de dados históricos disponibilizados pela <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo,</a>{' '}
                <strong style={{ color: '#ef8a62' }}>conseguimos analisar como o clima mudou em 85 anos</strong>.
                Cada faixa à direita representa um ano.
            </p>
            <p>
                <strong style={{ color: '#ef8a62' }}>A cor conta a história</strong>.
            </p>
            <p style={{ marginTop: '1rem' }}>
                Azul = mais frio que a média.
            </p>
            <p style={{ marginTop: '1rem' }}>
                Vermelho = mais quente.
            </p>
        </div>,
        <div key="step-2">
            <p>
                Note as décadas recentes.{' '}
                <strong style={{ color: '#d6604d' }}>Os vermelhos dominam</strong> e estão ficando mais escuros.
            </p>
            <p style={{ marginTop: '1rem' }}>
                O que era exceção nos anos 1940 tornou-se a norma nos anos 2020.
            </p>
        </div>,
        <div key="step-3">
            <StatCallout
                value={Math.abs(latestAnomaly)}
                unit="°C"
                label={`acima da média histórica (1940–1980) — apenas no último ano`}
                showSign={latestAnomaly >= 0}
                decimals={1}
                accentColor="#b2182b"
            />
        </div>,
    ];

    const handleStepEnter = (index: number) => {
        if (index >= 1) setHighlightRecent(true);
        if (index === 0) setHighlightRecent(false);
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* ── Globe Hero — first screen ──────────────────────────────── */}
            <GlobeHero />

            {/* ── Scrollytelling section ─────────────────────────────────── */}
            <div style={{ paddingBlockStart: 'clamp(80px, 12vh, 160px)' }}>
                <ScrollySection
                    id="stripes-scrolly"
                    visualization={
                        <div style={{ width: '100%', height: '60vh', position: 'relative' }}>
                            <Suspense fallback={<LoadingSpinner />}>
                                <ClimateStripes data={metricsArray} height="100%" />
                            </Suspense>
                            {highlightRecent && (
                                <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '30%',
                                    background: 'linear-gradient(to right, transparent, rgba(178,24,43,0.15))',
                                    pointerEvents: 'none',
                                    transition: 'opacity 0.5s',
                                }} />
                            )}
                        </div>
                    }
                    steps={steps}
                    onStepEnter={handleStepEnter}
                />
            </div>
        </div>
    );
}
