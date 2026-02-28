import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import type { DailyRecord, ClimateSummary, AnnualMetrics } from '../../types/climate.ts';
import SectionTitle from '../common/SectionTitle.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';
import { formatDate } from '../../utils/formatters.ts';

const CalendarHeatmap = lazy(() => import('../visualizations/CalendarHeatmap.tsx'));
const PersonalTimeline = lazy(() => import('../widgets/PersonalTimeline.tsx'));

interface HottestDaySectionProps {
    dailyData: DailyRecord[];
    summary: ClimateSummary;
    metrics: Record<number, AnnualMetrics>;
}

/**
 * HottestDaySection — "The Hottest Day on Record"
 *
 * Record card: 28 de setembro de 1961, 38.2°C.
 * CalendarHeatmap for 1961 with September 28 highlighted.
 * Birth year input → PersonalTimeline widget.
 * Design shifts register on PersonalTimeline activation.
 */
export default function HottestDaySection({ dailyData, summary, metrics }: HottestDaySectionProps) {
    const [showTimeline, setShowTimeline] = useState(false);
    const [birthYear, setBirthYear] = useState<number | null>(null);
    const [inputVal, setInputVal] = useState('');

    const hottestDay = summary.hottest_day;
    const mostSu30 = summary.year_most_su30;
    const hottestDateFormatted = formatDate(hottestDay.date);

    const metricsArr = Object.values(metrics);
    const mostTr20 = metricsArr.reduce((prev, current) => (current.tr20 > prev.tr20 ? current : prev), metricsArr[0]);
    const mostCdd = metricsArr.reduce((prev, current) => (current.cdd > prev.cdd ? current : prev), metricsArr[0]);

    const handleBirthYearSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const yr = parseInt(inputVal, 10);
        if (yr >= 1930 && yr <= 2010) {
            setBirthYear(yr);
            setShowTimeline(true);
        }
    };

    return (
        <div
            id="hottest"
            className="section-block"
            style={{
                paddingBlock: 'clamp(80px, 12vh, 160px)',
                paddingInline: 'clamp(1rem, 5vw, 4rem)',
                maxWidth: '1200px',
                margin: '0 auto',
            }}
        >
            <SectionTitle
                id="hottest-title"
                kicker="ERA5 REANALYSIS"
                accentColor="#67001f"
            >
                Recordes históricos
            </SectionTitle>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
                {/* Record card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        padding: 'clamp(1rem, 4vw, 2.5rem)',
                        flex: '0 0 auto',
                    }}
                >
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.875rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: '0.5rem',
                    }}>
                        {hottestDateFormatted}
                    </p>
                    <p style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: 'var(--text-display-lg, clamp(48px, 7vw, 96px))',
                        lineHeight: 0.9,
                        letterSpacing: '-0.04em',
                        color: '#67001f',
                        textShadow: '0 0 60px rgba(103,0,31,0.6)',
                    }}>
                        {hottestDay.temp_max.toFixed(1)}°C
                    </p>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8125rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginTop: '0.75rem',
                    }}>
                        Tmín naquele dia: {hottestDay.temp_min?.toFixed(1)}°C
                    </p>
                </motion.div>

                {/* Indices Records card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        padding: 'clamp(1.5rem, 3vw, 2rem)',
                        flex: 1,
                        minWidth: '280px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.875rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: '1.5rem',
                    }}>
                        Recordes de Índices
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        alignItems: 'start',
                    }}>
                        {/* SU30 */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', flexWrap: 'wrap' }}>
                                <p style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: 800,
                                    fontSize: 'clamp(48px, 6vw, 84px)',
                                    lineHeight: 0.9,
                                    letterSpacing: '-0.04em',
                                    color: '#ef8a62',
                                }}>
                                    {mostSu30.su30}
                                </p>
                                <span style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'rgba(255, 255, 255, 0.5)',
                                }}>
                                    DIAS
                                </span>
                            </div>
                            <p style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.8125rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                                marginTop: '0.5rem',
                                lineHeight: 1.3
                            }}>
                                ≥30°C<br />
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Em {mostSu30.year}</span>
                            </p>
                        </div>

                        {/* TR20 */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', flexWrap: 'wrap' }}>
                                <p style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: 800,
                                    fontSize: 'clamp(48px, 6vw, 84px)',
                                    lineHeight: 0.9,
                                    letterSpacing: '-0.04em',
                                    color: '#fddbc7',
                                }}>
                                    {mostTr20?.tr20}
                                </p>
                                <span style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'rgba(255, 255, 255, 0.5)',
                                }}>
                                    NOITES
                                </span>
                            </div>
                            <p style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.8125rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                                marginTop: '0.5rem',
                                lineHeight: 1.3
                            }}>
                                ≥20°C<br />
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Em {mostTr20?.year}</span>
                            </p>
                        </div>

                        {/* CDD */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', flexWrap: 'wrap' }}>
                                <p style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: 800,
                                    fontSize: 'clamp(48px, 6vw, 84px)',
                                    lineHeight: 0.9,
                                    letterSpacing: '-0.04em',
                                    color: '#dfc27d',
                                }}>
                                    {mostCdd?.cdd}
                                </p>
                                <span style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'rgba(255, 255, 255, 0.5)',
                                }}>
                                    DIAS
                                </span>
                            </div>
                            <p style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.8125rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                                marginTop: '0.5rem',
                                lineHeight: 1.3
                            }}>
                                Secos<br />
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Em {mostCdd?.year}</span>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* CalendarHeatmap for record year */}
            <div style={{ marginBottom: '3rem' }}>
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: '1rem',
                    letterSpacing: '0.04em',
                }}>
                    O calendário completo de 2024:
                </p>
                <Suspense fallback={<LoadingSpinner />}>
                    <CalendarHeatmap data={dailyData} year={2024} />
                </Suspense>
            </div>

            {/* Birth year prompt */}
            {!showTimeline && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        padding: '2rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        maxWidth: '480px',
                    }}
                >
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontStyle: 'italic',
                        fontSize: '1.125rem',
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: '1.5rem',
                    }}>
                        E você — onde estava neste dia?
                    </p>
                    <form onSubmit={handleBirthYearSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <label htmlFor="birth-year-input" style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.875rem',
                            color: 'rgba(255,255,255,0.5)',
                            flexShrink: 0,
                        }}>
                            Ano de nascimento:
                        </label>
                        <input
                            id="birth-year-input"
                            type="number"
                            min={1930}
                            max={2010}
                            value={inputVal}
                            onChange={e => setInputVal(e.target.value)}
                            placeholder="Ex: 1985"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '6px',
                                color: 'var(--color-text-primary)',
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '1rem',
                                padding: '0.5rem 0.75rem',
                                width: '100px',
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: 'rgba(239,138,98,0.15)',
                                border: '1px solid rgba(239,138,98,0.3)',
                                borderRadius: '6px',
                                color: '#ef8a62',
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.875rem',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                            }}
                        >
                            Ver minha história
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Personal timeline */}
            {showTimeline && birthYear && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <Suspense fallback={<LoadingSpinner />}>
                        <PersonalTimeline birthYear={birthYear} metrics={metrics} dailyData={dailyData} />
                    </Suspense>
                </motion.div>
            )}
        </div>
    );
}
