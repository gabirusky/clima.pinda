import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface StatCalloutProps {
    /** The numeric value to display (e.g., 140, 2.4, 108) */
    value: number;
    /** Unit label shown after the number (e.g., "°C", "DIAS", "NOITES") */
    unit?: string;
    /** Descriptive sub-label below (e.g., "dias acima de 30°C em 2024") */
    label?: string;
    /** Whether to show a +/- sign prefix (useful for anomalies) */
    showSign?: boolean;
    /** Decimal places to display (default: 0) */
    decimals?: number;
    /** Optional accent color override (default: --color-stripe-warm) */
    accentColor?: string;
    /** Optional font size override */
    fontSize?: string;
}

/**
 * StatCallout — renders a single key statistic at massive scale.
 *
 * Design intent: Numbers like "+2.4°C" or "140 DIAS" should have physical weight.
 * Uses --text-display-xl (clamped 80–160px), Syne 800.
 * Animates with a count-up effect on viewport entry.
 */
export default function StatCallout({
    value,
    unit,
    label,
    showSign = false,
    decimals = 0,
    accentColor,
    fontSize,
}: StatCalloutProps) {
    const [displayed, setDisplayed] = useState(0);
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const animRef = useRef<number | null>(null);

    // Intersection observer to trigger count-up
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold: 0.4 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Count-up animation (1200ms, ease-out) — skipped if value is invalid
    useEffect(() => {
        if (!inView || !isFinite(value) || isNaN(value)) return;

        const duration = 1200;
        const startTime = performance.now();
        const startVal = 0;
        const endVal = value;

        function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Cubic ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(startVal + (endVal - startVal) * eased);
            if (progress < 1) {
                animRef.current = requestAnimationFrame(tick);
            }
        }

        animRef.current = requestAnimationFrame(tick);
        return () => {
            if (animRef.current !== null) cancelAnimationFrame(animRef.current);
        };
    }, [inView, value]);

    // Guard against NaN/Infinity
    const isValid = isFinite(value) && !isNaN(value);
    const displayedStr = isValid ? displayed.toFixed(decimals) : '–';
    const prefix = isValid ? (showSign && value > 0 ? '+' : value < 0 ? '−' : '') : '';
    const color = accentColor ?? '#ef8a62';

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-2"
        >
            <div
                aria-label={isValid ? `${prefix}${value.toFixed(decimals)} ${unit ?? ''}` : 'dados indisponíveis'}
                style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontWeight: 800,
                    fontSize: fontSize || 'var(--text-display-xl, clamp(80px, 12vw, 160px))',
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    color,
                    textShadow: `0 0 60px ${color}33`,
                }}
            >
                {isValid ? `${prefix}${Math.abs(Number(displayedStr)).toFixed(decimals)}` : '–'}
                {unit && (
                    <span
                        style={{
                            fontSize: '0.4em',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            marginLeft: '0.15em',
                            opacity: 0.8,
                            verticalAlign: 'middle',
                        }}
                    >
                        {unit}
                    </span>
                )}
            </div>

            {label && (
                <p
                    style={{
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: '0.9375rem',
                        color: 'var(--color-text-primary)',
                        maxWidth: '34ch',
                        lineHeight: 1.6,
                        marginTop: '0.5rem',
                    }}
                >
                    {label}
                </p>
            )}
        </motion.div>
    );
}
