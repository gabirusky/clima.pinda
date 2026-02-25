import { useClimateData } from './hooks/useClimateData.ts';
import { useScrollProgress } from './hooks/useScrollProgress.ts';
import LoadingSpinner from './components/common/LoadingSpinner.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';

/**
<<<<<<< HEAD
 * App root component.
 *
 * Fetches climate data on mount and passes it to section components.
 * Wraps everything in ErrorBoundary to catch render errors gracefully.
 *
 * Phase 4: Shows a placeholder while sections are built in Phase 5+.
 * Phase 9: Replace the placeholder with the full section layout.
=======
 * App — root component for "A City's Memory of Heat"
 *
 * Responsibilities:
 * 1. Fetch all climate data via useClimateData
 * 2. Drive the ambient scroll-heat background via useScrollProgress
 * 3. Render the full scrollytelling narrative (phases 5–8)
 *
 * Storytelling sections will be added in Phase 5.
>>>>>>> 004c615 (feat: new plan and frontend foundation)
 */
export default function App() {
    // Drives --scroll-heat CSS custom property on document.documentElement.
    // This powers the ambient background gradient (cool blue → burning red).
    useScrollProgress();

    const { dailyData, metrics, summary, loading, error } = useClimateData();

    if (loading) return <LoadingSpinner />;

<<<<<<< HEAD
    if (error) {
        return (
            <div
                role="alert"
                className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
            >
                <p className="text-sm text-red-400">
                    Erro ao carregar dados climáticos:
                </p>
                <p className="font-mono text-xs text-white/40">{error.message}</p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            {/* Phase 4 placeholder — sections added in Phase 5+ */}
            <div className="min-h-screen bg-[#0a0f1e] text-white">
                <header className="border-b border-white/10 p-8 text-center">
                    <h1 className="font-display text-4xl font-bold tracking-tight">
                        Pindamonhangaba: 85 Anos de Aquecimento
                    </h1>
                    <p className="mt-2 font-body text-white/50">
                        Dados climáticos históricos de 1940 a 2025 · ERA5 / Copernicus / ECMWF
                    </p>
                </header>

                <main className="p-8 text-center text-white/30">
                    <p>Visualizações em desenvolvimento — dados carregados com sucesso.</p>
                    {summary && (
                        <div className="mt-6 space-y-2 text-sm">
                            <p>
                                Dia mais quente:{' '}
                                <strong className="text-white/70">
=======
    if (error) return (
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
            <p style={{ fontSize: '2rem' }}>⚠️</p>
            <p>Falha ao carregar dados climáticos: <strong style={{ color: '#ef8a62' }}>{error.message}</strong></p>
        </div>
    );

    return (
        <ErrorBoundary>
            <div style={{ minHeight: '100vh', color: 'var(--color-text-primary)' }}>

                {/* ── PLACEHOLDER header ── */}
                <header
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <h1
                        style={{
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 800,
                            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                            letterSpacing: '-0.03em',
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        A Memória de Calor de uma Cidade
                    </h1>
                    <p
                        style={{
                            marginTop: '0.5rem',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.875rem',
                            color: 'var(--color-text-secondary)',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Pindamonhangaba, SP · 1940–2025 · ERA5 Reanalysis
                    </p>
                </header>

                {/* ── Data smoke test ── */}
                <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        Dados carregados com sucesso. Visualizações em desenvolvimento — Fase 5.
                    </p>

                    {summary && (
                        <div
                            style={{
                                marginTop: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                alignItems: 'center',
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.875rem',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            <p>
                                Dia mais quente:{' '}
                                <strong style={{ color: 'var(--color-stripe-warm)' }}>
>>>>>>> 004c615 (feat: new plan and frontend foundation)
                                    {summary.hottest_day?.date}
                                </strong>{' '}
                                — {summary.hottest_day?.temp_max}°C
                            </p>
                            <p>
                                Tendência SU30:{' '}
<<<<<<< HEAD
                                <strong className="text-amber-400">
                                    +{summary.su30_trend_slope_per_decade} dias/década
                                </strong>
                            </p>
                            <p>
                                Maior onda de calor:{' '}
                                <strong className="text-red-400">
                                    {summary.longest_warm_spell?.days} dias em{' '}
                                    {summary.longest_warm_spell?.year}
=======
                                <strong style={{ color: 'var(--color-stripe-warm)' }}>
                                    +{summary.su30_trend_slope_per_decade?.toFixed(1)} dias/década
                                </strong>
                            </p>
                            <p>
                                Dados carregados:{' '}
                                <strong style={{ color: 'var(--color-text-primary)' }}>
                                    {dailyData?.length?.toLocaleString('pt-BR')} registros diários
                                </strong>
                                {' · '}
                                <strong style={{ color: 'var(--color-text-primary)' }}>
                                    {metrics ? Object.keys(metrics).length : 0} anos de métricas
>>>>>>> 004c615 (feat: new plan and frontend foundation)
                                </strong>
                            </p>
                        </div>
                    )}
                </main>

            </div>
        </ErrorBoundary>
    );
}
