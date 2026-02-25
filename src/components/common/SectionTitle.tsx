<<<<<<< HEAD
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
=======
import { motion } from 'framer-motion';

interface SectionTitleProps {
    /** The headline text */
    children: React.ReactNode;
    /** Optional sub-text below the title (DM Sans, smaller) */
    sub?: string;
    /** Optional id for anchor navigation */
    id?: string;
    /** Accent color for the underline bar (default: --color-stripe-hot) */
    accentColor?: string;
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
}: SectionTitleProps) {
    const color = accentColor ?? '#d6604d'; // --color-stripe-hot

    return (
        <div id={id} className="flex flex-col gap-4 mb-10">
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
        </div>
>>>>>>> 004c615 (feat: new plan and frontend foundation)
    );
}
