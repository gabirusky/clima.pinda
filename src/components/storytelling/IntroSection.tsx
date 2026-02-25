import { useState, lazy, Suspense } from 'react';
import type { AnnualMetrics, DailyRecord, ClimateSummary } from '../../types/climate.ts';
import ScrollySection from './ScrollySection.tsx';
import SectionTitle from '../common/SectionTitle.tsx';
import StatCallout from '../common/StatCallout.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

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
 * Full-bleed ClimateStripes hero. Scrollytelling steps reveal the stripes,
 * highlight recent red stripes, then show the anomaly label.
 */
export default function IntroSection({ metrics }: IntroSectionProps) {
    const [highlightRecent, setHighlightRecent] = useState(false);
    const [showAnomaly, setShowAnomaly] = useState(false);

    const metricsArray = Object.values(metrics).sort((a, b) => a.year - b.year);
    const latestAnomaly = metricsArray.length > 0
        ? metricsArray[metricsArray.length - 1].anomaly
        : 0;

    const steps = [
        <div key="step-1">
            <SectionTitle id="stripes" accentColor="#ef8a62">
                A Memória de Calor de uma Cidade
            </SectionTitle>
            <p>
                Pindamonhangaba guarda um registro de{' '}
                <strong style={{ color: '#ef8a62' }}>85 anos de temperatura</strong>.
                Cada faixa à direita representa um ano. A cor conta a história.
            </p>
            <p style={{ marginTop: '1rem' }}>
                Azul = mais frio que a média. Vermelho = mais quente.
            </p>
        </div>,
        <div key="step-2">
            <p>
                Note as décadas recentes.{' '}
                <strong style={{ color: '#d6604d' }}>Os vermelhos dominam</strong> — e estão ficando mais escuros.
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
        if (index >= 2) setShowAnomaly(true);
        if (index === 0) { setHighlightRecent(false); setShowAnomaly(false); }
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Full-bleed hero stripes */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}
            >
                <Suspense fallback={<LoadingSpinner />}>
                    <div style={{ position: 'absolute', inset: 0 }}>
                        <ClimateStripes data={metricsArray} height="100%" />
                    </div>
                </Suspense>

                {/* Overlay headline */}
                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    textAlign: 'center',
                    padding: '0 2rem',
                    maxWidth: '800px',
                }}>
                    <h1 style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: 'var(--text-display-lg, clamp(48px, 7vw, 96px))',
                        lineHeight: 1.0,
                        letterSpacing: '-0.04em',
                        color: '#f0ece3',
                        textShadow: '0 2px 40px rgba(0,0,0,0.8)',
                        marginBottom: '1.5rem',
                    }}>
                        Pindamonhangaba está esquentando.
                        <br />
                        <span style={{ color: '#ef8a62' }}>Aqui está a prova.</span>
                    </h1>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 'var(--text-caption, 0.875rem)',
                        color: 'rgba(240,236,227,0.55)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                    }}>
                        −22.9250°, −45.4620° · 554 m de altitude · 1940–2025
                    </p>

                    {/* Scroll indicator */}
                    <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Role para explorar
                        </span>
                        <ChevronDown />
                    </div>
                </div>
            </div>

            {/* Scrollytelling section */}
            <ScrollySection
                id="stripes-scrolly"
                visualization={
                    <div style={{ width: '100%', height: '80vh', position: 'relative' }}>
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
                        {showAnomaly && (
                            <div style={{
                                position: 'absolute',
                                bottom: '2rem',
                                right: '2rem',
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 800,
                                fontSize: 'clamp(2rem, 5vw, 4rem)',
                                color: '#b2182b',
                                textShadow: '0 0 40px rgba(178,24,43,0.5)',
                            }}>
                                {latestAnomaly >= 0 ? '+' : ''}{latestAnomaly.toFixed(2)}°C
                            </div>
                        )}
                    </div>
                }
                steps={steps}
                onStepEnter={handleStepEnter}
            />
        </div>
    );
}

function ChevronDown() {
    return (
        <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={2}
            style={{ animation: 'pulseHot 2s ease-in-out infinite' }}
            aria-hidden="true"
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}
