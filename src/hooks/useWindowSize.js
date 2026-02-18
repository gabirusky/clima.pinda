import { useState, useEffect } from 'react';

/**
 * Returns the current window dimensions, debounced on resize (200ms).
 *
 * @returns {{ width: number, height: number }}
 */
export function useWindowSize() {
    const [size, setSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        let timeoutId = null;

        function handleResize() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            }, 200);
        }

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, []);

    return size;
}
