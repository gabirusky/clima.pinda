import { useClimateData } from './hooks/useClimateData.js';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

// Storytelling sections (lazy-loaded for performance)
// import { lazy, Suspense } from 'react';
// const IntroSection = lazy(() => import('./components/storytelling/IntroSection.jsx'));
// ... (uncomment as sections are implemented)

export default function App() {
    const { dailyData, metrics, summary, loading, error } = useClimateData();

    if (loading) return <LoadingSpinner />;
    if (error) return (
        <div className="flex items-center justify-center min-h-screen text-red-600">
            <p>Failed to load climate data: {error.message}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-gray-900">
            {/* Placeholder — sections will be added in Phase 5 */}
            <header className="p-8 text-center border-b">
                <h1 className="text-4xl font-bold text-primary">
                    Pindamonhangaba: 85 Anos de Aquecimento
                </h1>
                <p className="mt-2 text-gray-500">
                    Dados climáticos históricos de 1940 a 2024
                </p>
            </header>
            <main className="p-8 text-center text-gray-400">
                <p>Visualizações em desenvolvimento — dados carregados com sucesso.</p>
                {summary && (
                    <p className="mt-4 text-sm">
                        Dia mais quente: <strong>{summary.hottest_day?.date}</strong> — {summary.hottest_day?.temp_max}°C
                    </p>
                )}
            </main>
        </div>
    );
}
