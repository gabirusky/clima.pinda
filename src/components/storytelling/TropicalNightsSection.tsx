import { useState, useMemo, lazy, Suspense } from 'react';
import type { AnnualMetrics, DailyRecord } from '../../types/climate.ts';
import ScrollySection from './ScrollySection.tsx';
import SectionTitle from '../common/SectionTitle.tsx';
import StatCallout from '../common/StatCallout.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';
import { metricsToArray } from '../../utils/dataProcessing.ts';

const CalendarHeatmap = lazy(() => import('../visualizations/CalendarHeatmap.tsx'));

interface TropicalNightsSectionProps {
    metrics: Record<number, AnnualMetrics>;
    dailyData: DailyRecord[];
}

const STEP_YEARS = [1990, 2015, 2024];

/**
 * TropicalNightsSection — "Sleepless Nights"
 *
 * Sticky CalendarHeatmap. Each step changes the year shown:
 * 1990 → 2015 → 2024. TR20 (T_min ≥ 20°C) nights are highlighted.
 */
export default function TropicalNightsSection({ metrics, dailyData }: TropicalNightsSectionProps) {
    const [year, setYear] = useState(STEP_YEARS[0]);

    const tr20Trend = useMemo(() => {
        const arr = metricsToArray(metrics);
        const first = arr.length > 0 ? arr[0].tr20 : 0;
        const last = arr.length > 0 ? arr[arr.length - 1].tr20 : 0;
        return { first, last, increase: last - first };
    }, [metrics]);

    const steps = [
        <div key="n1">
            <SectionTitle id="nights" accentColor="#4393c3">
                Noites Sem Dormir
            </SectionTitle>
            <p>
                Em <strong style={{ color: '#4393c3' }}>1990</strong>,
                as noites acima de 20°C eram raras.
                O corpo conseguia descansar.
            </p>
            <p style={{ marginTop: '1rem' }}>
                Cada quadrado à direita com <strong style={{ color: '#ef8a62' }}>borda laranja</strong> é uma noite
                em que o termômetro não caiu abaixo de 20°C.
            </p>
        </div>,
        <div key="n2">
            <p>
                Em <strong style={{ color: '#ef8a62' }}>2015</strong>,
                as noites quentes estavam se multiplicando.
                Blocos inteiros de laranja aparecendo nos meses de verão.
            </p>
            <p style={{ marginTop: '1rem' }}>
                Para quem trabalha fisicamente, dormir em uma casa sem ar condicionado se torna uma questão de saúde.
            </p>
        </div>,
        <div key="n3">
            <p>
                Em <strong style={{ color: '#b2182b' }}>2024</strong>:
            </p>
            <StatCallout
                value={tr20Trend.last}
                unit="NOITES"
                label="acima de 20°C — por ano"
                accentColor="#d6604d"
            />
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>
                +{Math.round(tr20Trend.increase)} noites a mais que em 1940.
            </p>
        </div>,
    ];

    const handleStepEnter = (index: number) => {
        setYear(STEP_YEARS[Math.min(index, STEP_YEARS.length - 1)]);
    };

    return (
        <div className="section-block" style={{ paddingBlock: 'clamp(80px, 12vh, 160px)' }}>
            <ScrollySection
                visualization={
                    <Suspense fallback={<LoadingSpinner />}>
                        <div style={{ width: '100%' }}>
                            <CalendarHeatmap
                                data={dailyData}
                                year={year}
                            />
                        </div>
                    </Suspense>
                }
                steps={steps}
                onStepEnter={handleStepEnter}
            />
        </div>
    );
}
