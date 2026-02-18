import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],

    // IMPORTANT: Must match the GitHub repository name exactly (case-sensitive)
    base: '/pindamonhangaba-climate/',

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },

    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                // Split large libraries into separate chunks for better caching
                manualChunks: {
                    d3: ['d3'],
                    recharts: ['recharts'],
                    leaflet: ['leaflet', 'react-leaflet'],
                    motion: ['framer-motion'],
                },
            },
        },
    },

    // Scrollama is CommonJS — must be pre-bundled by Vite
    optimizeDeps: {
        include: ['scrollama'],
    },
})
