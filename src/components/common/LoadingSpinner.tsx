import { motion } from 'framer-motion';

/**
 * LoadingSpinner — heat pulse animation shown while climate data is being fetched.
 *
 * Design: A concentric ring that breathes with a warm orange-red pulse,
 * reinforcing the temperature theme from the first screen.
 */
export default function LoadingSpinner() {
    return (
        <div
            role="status"
            aria-label="Carregando dados climáticos..."
            className="flex flex-col items-center justify-center min-h-screen gap-6"
            style={{ background: '#0a0a0f' }}
        >
            {/* Pulsing heat ring */}
            <div className="relative flex items-center justify-center">
                {/* Outer glow ring */}
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: 80,
                        height: 80,
                        border: '2px solid rgba(239, 138, 98, 0.15)',
                    }}
                    animate={{
                        scale: [1, 1.6, 1],
                        opacity: [0.4, 0, 0.4],
                    }}
                    transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                {/* Mid ring */}
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: 56,
                        height: 56,
                        border: '2px solid rgba(214, 96, 77, 0.3)',
                    }}
                    animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.6, 0, 0.6],
                    }}
                    transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.3,
                    }}
                />
                {/* Core dot */}
                <motion.div
                    className="rounded-full"
                    style={{
                        width: 14,
                        height: 14,
                        background: 'var(--color-stripe-warm, #ef8a62)',
                    }}
                    animate={{
                        opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            {/* Loading text */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0.6] }}
                transition={{ duration: 1.2, times: [0, 0.5, 1] }}
                style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(160, 144, 128, 0.8)',
                }}
            >
                Carregando 85 anos de dados…
            </motion.p>
        </div>
    );
}
