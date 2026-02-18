import { useClimateData } from './hooks/useClimateData.ts';
import LoadingSpinner from './components/common/LoadingSpinner.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';

export default function App() {
    const { summary, loading, error } = useClimateData();

    if (loading) return <LoadingSpinner />;
    if (error) return (
        <div className="flex items-center justify-center min-h-screen text-red-500">
            <p>Failed to load climate data: {error.message}</p>
        </div>
    );

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-[#0a0f1e] text-white">
                {/* Placeholder — sections will be added in Phase 5 */}
                <header className="p-8 text-center border-b border-white/10">
                    <h1 className="font-display text-4xl font-bold tracking-tight">
                        Pindamonhangaba: 85 Anos de Aquecimento
                    </h1>
                    <p className="mt-2 text-white/50 font-body">
                        Dados climáticos históricos de 1940 a 2024
                    </p>
                </header>
                <main className="p-8 text-center text-white/30">
                    <p>Visualizações em desenvolvimento — dados carregados com sucesso.</p>
                    {summary && (
                        <p className="mt-4 text-sm">
                            Dia mais quente:{' '}
                            <strong className="text-white/70">{summary.hottest_day?.date}</strong>
                            {' '}— {summary.hottest_day?.temp_max}°C
                        </p>
                    )}
                </main>
            </div>
        </ErrorBoundary>
    );
}
