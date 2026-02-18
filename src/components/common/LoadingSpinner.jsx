/**
 * LoadingSpinner — shown while climate data is being fetched.
 */
export default function LoadingSpinner() {
    return (
        <div
            role="status"
            aria-label="Carregando dados climáticos..."
            className="flex flex-col items-center justify-center min-h-screen gap-4"
        >
            <svg
                className="animate-spin"
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
            >
                <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                />
                <path
                    d="M44 24a20 20 0 0 0-20-20"
                    stroke="#1e40af"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>
            <p className="text-gray-500 text-sm font-medium">
                Carregando dados climáticos…
            </p>
        </div>
    );
}
