import { useState, useEffect } from 'react';

/**
 * Returns the current scroll position (scrollY), updated via
 * requestAnimationFrame to avoid layout thrashing.
 *
 * @returns {number} scrollY in pixels
 */
export function useScrollPosition() {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        let rafId = null;

        function handleScroll() {
            if (rafId) return; // already scheduled
            rafId = requestAnimationFrame(() => {
                setScrollY(window.scrollY);
                rafId = null;
            });
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    return scrollY;
}
