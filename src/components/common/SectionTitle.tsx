import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SectionTitleProps {
    /** The headline text */
    children: ReactNode;
    /** Optional sub-text below the title (DM Sans, smaller) */
    sub?: string;
    /** Optional id for anchor navigation */
    id?: string;
    /** Accent color for the underline bar (default: --color-stripe-hot) */
    accentColor?: string;
    /** Optional kicker label above the title */
    kicker?: string;
    /** Optional description paragraph */
    description?: ReactNode;
    /** Optional additional class names for the wrapper */
    className?: string;
}

/**
 * SectionTitle — styled <h2> with animated underline.
 *
 * Design intent: Each chapter opens with a title in Syne that draws
 * an underline from left to right as it enters the viewport.
 * The underline color echoes the current chapter's temperature register.
 */
export default function SectionTitle({
    children,
    sub,
    id,
    accentColor,
    kicker,
    description,
    className = '',
}: SectionTitleProps) {
    const color = accentColor ?? '#d6604d'; // --color-stripe-hot

    return (
        <div id={id} className={`flex flex-col gap-4 mb-10 ${className}`}>
            {kicker && (
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.4)',
                }}>
                    {kicker}
                </p>
            )}
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 'var(--text-display-md, clamp(32px, 4.5vw, 56px))',
                    lineHeight: 1.05,
                    letterSpacing: '-0.03em',
                    color: 'var(--color-text-primary, #f0ece3)',
                }}
            >
                {children}
            </motion.h2>

            {/* Animated underline — draws from left */}
            <motion.div
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    height: 3,
                    width: 64,
                    background: color,
                    borderRadius: 2,
                    transformOrigin: 'left center',
                }}
                aria-hidden="true"
            />

            {sub && (
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6, delay: 0.35 }}
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '1rem',
                        color: 'var(--color-text-secondary, #a09080)',
                        maxWidth: '48ch',
                        lineHeight: 1.6,
                    }}
                >
                    {sub}
                </motion.p>
            )}

            {description && (
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6, delay: 0.35 }}
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '1rem',
                        color: 'var(--color-text-secondary, #a09080)',
                        maxWidth: '48ch',
                        lineHeight: 1.6,
                    }}
                >
                    {description}
                </motion.p>
            )}
        </div>
    );
}
