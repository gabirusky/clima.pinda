import { type ReactNode, useEffect, useRef } from 'react';

interface TooltipProps {
    /** x position in pixels (relative to the nearest positioned ancestor) */
    x: number;
    /** y position in pixels (relative to the nearest positioned ancestor) */
    y: number;
    /** Tooltip content — can be any JSX or a plain string */
    content: ReactNode;
    /** Whether the tooltip is visible */
    visible?: boolean;
    /** Optional additional class names */
    className?: string;
}

/**
 * Tooltip — a positioned, floating tooltip div.
 *
 * Renders at absolute (x, y) position relative to the nearest positioned
 * ancestor.  Automatically flips horizontally if it would overflow the
 * right edge of the container.
 *
 * Usage:
 *   <div style={{ position: 'relative' }}>
 *     <Tooltip x={mouseX} y={mouseY} content={<p>...</p>} visible={isHovered} />
 *   </div>
 */
export default function Tooltip({
    x,
    y,
    content,
    visible = true,
    className = '',
}: TooltipProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Auto-flip: if the tooltip would overflow the right edge, shift left
    useEffect(() => {
        const el = ref.current;
        if (!el || !visible) return;
        const parent = el.offsetParent as HTMLElement | null;
        if (!parent) return;
        const parentWidth = parent.offsetWidth;
        const tooltipWidth = el.offsetWidth;
        const OFFSET = 12;
        if (x + tooltipWidth + OFFSET > parentWidth) {
            el.style.left = `${x - tooltipWidth - OFFSET}px`;
        } else {
            el.style.left = `${x + OFFSET}px`;
        }
    }, [x, visible]);

    if (!visible) return null;

    return (
        <div
            ref={ref}
            role="tooltip"
            className={[
                'pointer-events-none absolute z-50',
                'rounded-lg border border-white/10 bg-[#0d1526]/95 backdrop-blur-sm',
                'px-3 py-2 text-sm text-white shadow-xl',
                'animate-fade-in',
                className,
            ].join(' ')}
            style={{
                top: y - 8,
                left: x + 12, // default; useEffect overrides if needed
                minWidth: '120px',
                maxWidth: '240px',
            }}
        >
            {content}
        </div>
    );
}
