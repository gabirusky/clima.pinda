import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            // Generate a service worker automatically using Workbox
            strategies: 'generateSW',
            registerType: 'autoUpdate',
            // IMPORTANT: Must match the GitHub Pages base path
            base: '/clima.pinda/',
            // Include all files in build for pre-caching
            includeAssets: ['favicon.svg', 'images/og-image.png'],
            manifest: {
                name: 'A Memória de Calor de uma Cidade — Pindamonhangaba Clima',
                short_name: 'Pinda Clima',
                description: 'Pindamonhangaba está esquentando. Aqui está a prova. 85 anos de dados climáticos históricos.',
                theme_color: '#0a0f1e',
                background_color: '#0a0f1e',
                display: 'standalone',
                scope: '/clima.pinda/',
                start_url: '/clima.pinda/',
                icons: [
                    {
                        src: '/clima.pinda/favicon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                // Climate data files: stale-while-revalidate (large, changes annually)
                runtimeCaching: [
                    {
                        // Cache all three climate JSON data files
                        urlPattern: /\/clima\.pinda\/data\/(climate_data|metrics|summary)\.json$/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'climate-data-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        // Google Fonts — cache first, they're immutable
                        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
                // Ensure the SW doesn't cache the service worker itself
                skipWaiting: true,
                clientsClaim: true,
                // Clean up outdated caches on SW activate
                cleanupOutdatedCaches: true,
            },
        }),
    ],

    // IMPORTANT: Must match the GitHub repository name exactly (case-sensitive)
    base: '/clima.pinda/',

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
                // Target: no single chunk > 500 KB (Phase 11)
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
