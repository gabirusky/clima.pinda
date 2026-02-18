import { Component } from 'react';

/**
 * ErrorBoundary — catches render errors in child components and shows a fallback UI.
 * Must be a class component (React requirement for error boundaries).
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Caught error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    role="alert"
                    className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center"
                >
                    <div className="text-4xl">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Algo deu errado
                    </h2>
                    <p className="text-gray-500 text-sm max-w-md">
                        {this.state.error?.message || 'Erro desconhecido ao renderizar o componente.'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:opacity-90 transition-opacity"
                    >
                        Tentar novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
