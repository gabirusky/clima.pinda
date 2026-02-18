import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary — catches render errors in child components and shows a fallback UI.
 * Must be a class component (React requirement for error boundaries).
 */
export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    role="alert"
                    className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center bg-[#0a0f1e]"
                >
                    <div className="text-4xl">⚠️</div>
                    <h2 className="text-xl font-semibold text-white">
                        Algo deu errado
                    </h2>
                    <p className="text-white/40 text-sm max-w-md">
                        {this.state.error?.message ?? 'Erro desconhecido ao renderizar o componente.'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 transition-colors"
                    >
                        Tentar novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
