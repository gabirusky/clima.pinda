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
    const hottestDateFormatted = formatDate(hottestDay.date);
    const recordYear = parseInt(hottestDay.date.slice(0, 4), 10);

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
                O Dia Mais Quente já Registrado
            </SectionTitle>

            {/* Record card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    background: 'rgba(103,0,31,0.15)',
                    border: '1px solid rgba(103,0,31,0.3)',
                    borderRadius: '12px',
                    padding: 'clamp(1rem, 4vw, 2.5rem)',
                    marginBottom: '3rem',
                    display: 'inline-block',
                }}
            >
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.4)',
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
                    color: 'rgba(255,255,255,0.3)',
                    marginTop: '0.75rem',
                }}>
                    Tmín naquele dia: {hottestDay.temp_min?.toFixed(1)}°C
                </p>
            </motion.div>

            {/* CalendarHeatmap for record year */}
            <div style={{ marginBottom: '3rem' }}>
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: '1rem',
                    letterSpacing: '0.04em',
                }}>
                    O calendário completo de {recordYear}:
                </p>
                <Suspense fallback={<LoadingSpinner />}>
                    <CalendarHeatmap data={dailyData} year={recordYear} />
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
