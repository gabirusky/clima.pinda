import { useState, lazy, Suspense } from 'react';
import type { AnnualMetrics, DailyRecord } from '../../types/climate.ts';
import ScrollySection from './ScrollySection.tsx';
import SectionTitle from '../common/SectionTitle.tsx';
import StatCallout from '../common/StatCallout.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

const ComparativeBarChart = lazy(() => import('../visualizations/ComparativeBarChart.tsx'));
const ThresholdSlider = lazy(() => import('../widgets/ThresholdSlider.tsx'));

interface SummerSectionProps {
    metrics: Record<number, AnnualMetrics>;
    dailyData: DailyRecord[];
}



/**
 * SummerSection — "The Summer That Never Ends"
 *
 * Scrollytelling of SU30 bar chart revealing decade by decade.
 * StatCallout: 23 → 108 days.
 * ThresholdSlider widget below.
 */
export default function SummerSection({ metrics, dailyData }: SummerSectionProps) {
    const [activeDecadeRange, setActiveDecadeRange] = useState(0);

    const steps = [
        <div key="s1">
            <SectionTitle id="summer" accentColor="#ef8a62">
                O Verão Que Nunca Termina
            </SectionTitle>
            <p>
                Nos anos 1940, Pindamonhangaba tinha{' '}
                <strong style={{ color: '#ef8a62' }}>23 dias</strong>{' '}
                com temperatura acima de 30°C por ano.
            </p>
            <p style={{ marginTop: '1rem' }}>
                Era o que esperávamos de um verão tropical normal.
            </p>
        </div>,
        <div key="s2">
            <p>
                Nas décadas seguintes, os números começaram a subir.
                Lentamente no início — depois, sem frear.
            </p>
            <p style={{ marginTop: '1rem' }}>
                A cada década, o verão ficava alguns dias mais longo.
            </p>
        </div>,
        <div key="s3">
            <p>
                Nos anos 2020:
            </p>
            <StatCallout
                value={108}
                unit="DIAS"
                label="acima de 30°C por ano — 4× mais que nos anos 1940"
                accentColor="#b2182b"
            />
        </div>,
    ];

    const handleStepEnter = (index: number) => {
        setActiveDecadeRange(index);
    };

    return (
        <div
            className="section-block"
            style={{ paddingBlock: 'clamp(80px, 12vh, 160px)' }}
        >
            <ScrollySection
                visualization={
                    <Suspense fallback={<LoadingSpinner />}>
                        <div style={{ width: '100%' }}>
                            <ComparativeBarChart metrics={metrics} stepIndex={activeDecadeRange} />
                            {/* Decade range highlight overlay */}
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.5rem',
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.8125rem',
                                color: 'rgba(255,255,255,0.4)',
                                textAlign: 'center',
                            }}>
                                {activeDecadeRange === 0 && 'Décadas 1940–1960'}
                                {activeDecadeRange === 1 && 'Décadas 1940–1990'}
                                {activeDecadeRange === 2 && 'Décadas 1940–2020'}
                            </div>
                        </div>
                    </Suspense>
                }
                steps={steps}
                onStepEnter={handleStepEnter}
            />

            {/* ThresholdSlider below */}
            <div style={{ maxWidth: '600px', margin: '4rem auto 0', padding: '0 1.5rem' }}>
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: '1.5rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                }}>
                    Experimente ajustar o limiar:
                </p>
                <Suspense fallback={<div />}>
                    <ThresholdSlider dailyData={dailyData} metrics={metrics} />
                </Suspense>
            </div>

        </div>
    );
}
