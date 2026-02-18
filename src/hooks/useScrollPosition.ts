import { useState, useEffect } from 'react';

/**
 * Returns the current scroll position (scrollY), updated via
 * requestAnimationFrame to avoid layout thrashing.
 */
export function useScrollPosition(): number {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        let rafId: number | null = null;

        function handleScroll() {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                setScrollY(window.scrollY);
                rafId = null;
            });
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId !== null) cancelAnimationFrame(rafId);
        };
    }, []);

    return scrollY;
}
