/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            colors: {
                // Temperature scale
                'temp-cold': '#2166ac',
                'temp-cool': '#67a9cf',
                'temp-mild': '#d1e5f0',
                'temp-warm': '#fddbc7',
                'temp-hot': '#ef8a62',
                'temp-very-hot': '#b2182b',
                // Climate stripes (Ed Hawkins)
                'stripe-cold': '#08519c',
                'stripe-cool': '#3182bd',
                'stripe-neutral': '#ffffff',
                'stripe-warm': '#de2d26',
                'stripe-hot': '#a50f15',
                // UI
                primary: '#1e40af',
                secondary: '#dc2626',
                accent: '#f59e0b',
            },
        },
    },
    plugins: [],
}
