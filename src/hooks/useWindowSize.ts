import { useState, useEffect } from 'react';

interface WindowSize {
    width: number;
    height: number;
}

/**
 * Returns the current window dimensions, debounced on resize (200ms).
 */
export function useWindowSize(): WindowSize {
    const [size, setSize] = useState<WindowSize>({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        function handleResize() {
            if (timeoutId !== null) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setSize(prev => {
                    // Mobile browser scroll hides/shows address bar, causing minor height changes.
                    // Ignore these to prevent massive SVG re-renders on scroll.
                    const diffW = Math.abs(prev.width - window.innerWidth);
                    const diffH = Math.abs(prev.height - window.innerHeight);

                    if (diffW > 0 || diffH > 150) {
                        return { width: window.innerWidth, height: window.innerHeight };
                    }
                    return prev;
                });
            }, 250);
        }

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId !== null) clearTimeout(timeoutId);
        };
    }, []);

    return size;
}
