import { useEffect, useRef } from 'react';

/**
 * useScrollProgress
 *
 * Tracks full-page scroll progress as a normalized value [0, 1]:
 *   0 = top of page (oldest data — cool)
 *   1 = bottom of page (present — burning)
 *
 * Side-effect: writes the progress to the CSS custom property
 * `--scroll-heat` on `document.documentElement`, which drives
 * the ambient background gradient across the entire site.
 *
 * This is rAF-throttled to avoid layout thrashing.
 * Called once from App.tsx — do not call from individual components.
 */
export function useScrollProgress(): void {
    const rafId = useRef<number | null>(null);

    useEffect(() => {
        function update() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? scrollTop / docHeight : 0;

            // Clamp to [0, 1] and write to CSS custom property
            const clamped = Math.max(0, Math.min(1, progress));
            document.documentElement.style.setProperty(
                '--scroll-heat',
                clamped.toFixed(4),
            );

            rafId.current = null;
        }

        function handleScroll() {
            if (rafId.current !== null) return;
            rafId.current = requestAnimationFrame(update);
        }

        // Set initial value
        update();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId.current !== null) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, []);
}
