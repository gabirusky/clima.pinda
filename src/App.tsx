import { lazy, Suspense } from 'react';
import { useClimateData } from './hooks/useClimateData.ts';
import { useScrollProgress } from './hooks/useScrollProgress.ts';
import LoadingSpinner from './components/common/LoadingSpinner.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';

// ── Phase 5: Layout ──────────────────────────────────────────────────────────
import Header from './components/layout/Header.tsx';
import Footer from './components/layout/Footer.tsx';

// ── Phase 7: Storytelling sections — lazy-loaded per section ─────────────────
const IntroSection = lazy(() => import('./components/storytelling/IntroSection.tsx'));
const SummerSection = lazy(() => import('./components/storytelling/SummerSection.tsx'));
const TropicalNightsSection = lazy(() => import('./components/storytelling/TropicalNightsSection.tsx'));
const HeatWaveSection = lazy(() => import('./components/storytelling/HeatWaveSection.tsx'));
const HottestDaySection = lazy(() => import('./components/storytelling/HottestDaySection.tsx'));
const CostSection = lazy(() => import('./components/storytelling/CostSection.tsx'));
const FutureSection = lazy(() => import('./components/storytelling/FutureSection.tsx'));

/**
 * App — root component for "A City's Memory of Heat"
 *
 * Responsibilities:
 * 1. Fetch all climate data via useClimateData (Phase 4 hook)
 * 2. Drive the ambient scroll-heat background via useScrollProgress
 * 3. Render the Header, all scrollytelling sections, and the Footer
 * 4. Lazy-load sections to reduce initial bundle size (Phase 11)
 */
export default function App() {
    // Drives --scroll-heat CSS custom property on document.documentElement.
    // This powers the ambient background gradient (cool blue → burning red)
    // defined in index.css.
    useScrollProgress();

    const { dailyData, metrics, summary, loading, error } = useClimateData();

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div
                role="alert"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: '1rem',
                    padding: '2rem',
                    background: '#0a0f1e',
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#a09080',
                    textAlign: 'center',
                }}
            >
                <p style={{ fontSize: '2.5rem' }}>⚠️</p>
                <p style={{ fontSize: '1.125rem' }}>
                    Não foi possível carregar os dados climáticos.
                </p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)', maxWidth: '480px' }}>
                    <strong style={{ color: '#ef8a62' }}>{error.message}</strong>
                </p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.5rem' }}>
                    Verifique se os ficheiros em <code>public/data/</code> estão presentes.
                </p>
            </div>
        );
    }

    // Narrow nulls — useClimateData returns null until fetch resolves.
    // At this point loading=false and error=null, so safe to coerce.
    const safeData = dailyData ?? [];
    const safeMetrics = metrics ?? {};

    // If any required data is missing, still render gracefully
    const hasData = safeData.length > 0 && Object.keys(safeMetrics).length > 0;

    return (
        <ErrorBoundary>
            <div
                style={{
                    minHeight: '100vh',
                    color: 'var(--color-text-primary)',
                }}
            >
                {/* ── Skip link for keyboard navigation (Phase 10)
                       CSS .skip-link class shows on :focus, hides off-screen otherwise */}
                <a href="#main-content" className="skip-link">
                    Pular para o conteúdo
                </a>

                {/* ── Sticky navigation header ─────────────────────────────── */}
                <Header />

                {/* ── Main content ─────────────────────────────────────────── */}
                <main id="main-content">
                    {!hasData ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '100vh',
                            gap: '1rem',
                            fontFamily: "'DM Sans', sans-serif",
                            color: 'rgba(255,255,255,0.3)',
                            textAlign: 'center',
                            padding: '2rem',
                        }}>
                            <p>Os ficheiros de dados ainda não foram gerados.</p>
                            <p style={{ fontSize: '0.8125rem' }}>
                                Execute <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#ef8a62' }}>
                                    python data/scripts/generate_web_data.py
                                </code> primeiro.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* ── IntroSection: Hero stripes ────────────────── */}
                            <Suspense fallback={<SectionLoader />}>
                                <IntroSection
                                    metrics={safeMetrics}
                                    dailyData={safeData}
                                    summary={summary!}
                                />
                            </Suspense>

                            {/* ── SummerSection: SU30 bar chart ─────────────── */}
                            <Suspense fallback={<SectionLoader />}>
                                <SummerSection metrics={safeMetrics} dailyData={safeData} />
                            </Suspense>

                            {/* ── TropicalNightsSection: TR20 heatmap ────────── */}
                            <Suspense fallback={<SectionLoader />}>
                                <TropicalNightsSection metrics={safeMetrics} dailyData={safeData} />
                            </Suspense>

                            {/* ── HeatWaveSection: WSDI time series ──────────── */}
                            <Suspense fallback={<SectionLoader />}>
                                <HeatWaveSection metrics={safeMetrics} summary={summary!} />
                            </Suspense>

                            {/* ── HottestDaySection: record day & personal timeline */}
                            <Suspense fallback={<SectionLoader />}>
                                <HottestDaySection dailyData={safeData} summary={summary!} />
                            </Suspense>

                            {/* ── CostSection: AC Calculator ────────────────── */}
                            <Suspense fallback={<SectionLoader />}>
                                <CostSection metrics={safeMetrics} dailyData={safeData} />
                            </Suspense>

                            {/* ── FutureSection: OLS projection ─────────────── */}
                            <Suspense fallback={<SectionLoader />}>
                                <FutureSection metrics={safeMetrics} />
                            </Suspense>
                        </>
                    )}
                </main>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <Footer />
            </div>
        </ErrorBoundary>
    );
}

/** Minimal section loading placeholder */
function SectionLoader() {
    return (
        <div style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.2)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.875rem',
        }}>
            <div style={{ animation: 'pulseHot 1.5s ease-in-out infinite' }}>
                ···
            </div>
        </div>
    );
}
