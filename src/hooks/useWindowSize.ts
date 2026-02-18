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
                setSize({ width: window.innerWidth, height: window.innerHeight });
            }, 200);
        }

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId !== null) clearTimeout(timeoutId);
        };
    }, []);

    return size;
}
