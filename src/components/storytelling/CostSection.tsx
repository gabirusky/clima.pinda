import { lazy, Suspense } from 'react';
import type { AnnualMetrics, DailyRecord } from '../../types/climate.ts';
import SectionTitle from '../common/SectionTitle.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

const ACCalculator = lazy(() => import('../widgets/ACCalculator.tsx'));

interface CostSectionProps {
    metrics: Record<number, AnnualMetrics>;
    dailyData: DailyRecord[];
}

/**
 * CostSection — "The Cost of Heat"
 *
 * The AC Calculator receipt. JetBrains Mono.
 * Comparison: 1990 vs 2024.
 * Equity implications.
 */
export default function CostSection({ metrics, dailyData }: CostSectionProps) {
    return (
        <div
            id="cost"
            className="section-block"
            style={{
                paddingBlock: 'clamp(80px, 12vh, 160px)',
                paddingInline: 'clamp(1.5rem, 5vw, 4rem)',
                maxWidth: '1200px',
                margin: '0 auto',
            }}
        >
            <SectionTitle
                id="cost-title"
                kicker="ESTIMATIVA DE CONSUMO"
                accentColor="#ef8a62"
                sub="O que o aquecimento custa em conta de luz."
            >
                O Custo do Calor
            </SectionTitle>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '3rem',
                alignItems: 'start',
            }}>
                {/* Calculator */}
                <div>
                    <Suspense fallback={<LoadingSpinner />}>
                        <ACCalculator dailyData={dailyData} metrics={metrics} />
                    </Suspense>
                </div>

                {/* Context text */}
                <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.75,
                }}>
                    <p>
                        Este cálculo usa uma estimativa conservadora:{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>8 horas de ar condicionado</strong>{' '}
                        por cada dia com temperatura acima de 25°C,
                        usando uma unidade split de 1 CV (≈ 0,5 kW).
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        Para quem depende de air-conditioning para trabalhar, dormir ou manter saúde —
                        esse número não é opcional. É uma necessidade.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        E para os{' '}
                        <strong style={{ color: '#ef8a62' }}>
                            milhões de brasileiros sem acesso ao ar condicionado
                        </strong>,
                        o custo não é medido em reais — é medido em saúde, produtividade e qualidade de vida.
                    </p>

                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        background: 'rgba(178,24,43,0.08)',
                        border: '1px solid rgba(178,24,43,0.15)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                    }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Comparação 1990 → 2024
                        </p>
                        {metrics[1990] && metrics[2024] && (
                            <>
                                <p>
                                    1990: <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#4393c3' }}>
                                        {metrics[1990].su25} dias acima de 25°C
                                    </strong>
                                </p>
                                <p style={{ marginTop: '0.25rem' }}>
                                    2024: <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#b2182b' }}>
                                        {metrics[2024].su25} dias acima de 25°C
                                    </strong>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
