import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SectionTitleProps {
    /** Main heading text */
    title: string;
    /** Optional subtitle / kicker line above the title */
    kicker?: string;
    /** Optional supporting paragraph below the title */
    description?: ReactNode;
    /** Accent color for the animated underline (defaults to hot-red gradient) */
    accentColor?: string;
    /** Optional additional class names for the wrapper */
    className?: string;
    /** HTML id for anchor navigation */
    id?: string;
}

/**
 * SectionTitle — styled `<h2>` component with:
 *  • Optional kicker (small label above the heading)
 *  • Animated underline on mount (slides in from left)
 *  • Optional description paragraph
 *  • Framer Motion `whileInView` entrance animation
 *
 * Usage:
 *   <SectionTitle
 *     id="summer"
 *     kicker="ETCCDI SU30"
 *     title="The Summer That Never Ends"
 *     description="Days above 30°C have increased dramatically since the 1980s."
 *   />
 */
export default function SectionTitle({
    title,
    kicker,
    description,
    accentColor = '#dc2626',
    className = '',
    id,
}: SectionTitleProps) {
    return (
        <motion.div
            id={id}
            className={['relative mb-10', className].join(' ')}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            {/* Kicker */}
            {kicker && (
                <p className="mb-2 text-xs font-mono tracking-widest uppercase text-white/40">
                    {kicker}
                </p>
            )}

            {/* Heading */}
            <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                {title}
            </h2>

            {/* Animated underline */}
            <motion.div
                aria-hidden="true"
                className="mt-3 h-0.5 w-24 rounded-full"
                style={{ background: accentColor }}
                initial={{ width: 0 }}
                whileInView={{ width: 96 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            />

            {/* Description */}
            {description && (
                <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-white/55">
                    {description}
                </p>
            )}
        </motion.div>
    );
}
