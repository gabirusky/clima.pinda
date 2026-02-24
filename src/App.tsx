import { useClimateData } from './hooks/useClimateData.ts';
import LoadingSpinner from './components/common/LoadingSpinner.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';

/**
 * App root component.
 *
 * Fetches climate data on mount and passes it to section components.
 * Wraps everything in ErrorBoundary to catch render errors gracefully.
 *
 * Phase 4: Shows a placeholder while sections are built in Phase 5+.
 * Phase 9: Replace the placeholder with the full section layout.
 */
export default function App() {
    const { summary, loading, error } = useClimateData();

    if (loading) return <LoadingSpinner />;

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
                                    {summary.hottest_day?.date}
                                </strong>{' '}
                                — {summary.hottest_day?.temp_max}°C
                            </p>
                            <p>
                                Tendência SU30:{' '}
                                <strong className="text-amber-400">
                                    +{summary.su30_trend_slope_per_decade} dias/década
                                </strong>
                            </p>
                            <p>
                                Maior onda de calor:{' '}
                                <strong className="text-red-400">
                                    {summary.longest_warm_spell?.days} dias em{' '}
                                    {summary.longest_warm_spell?.year}
                                </strong>
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </ErrorBoundary>
    );
}
