import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import scrollama from 'scrollama';

// Mirror scrollama's DecimalType so we can use it in props without
// importing from a `export =` module (which is awkward in ESM).
type DecimalType = 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;

interface ScrollySectionProps {
    /** Sticky visualization rendered on the right (desktop) */
    visualization: ReactNode;
    /** Step content — each item is one scrollable step */
    steps: ReactNode[];
    /** Called when a step enters (0-indexed) */
    onStepEnter?: (index: number) => void;
    /** Called when a step exits */
    onStepExit?: (index: number) => void;
    /** Scrollama offset — must be one of 0, 0.1 … 1 (default 0.5 = centre) */
    offset?: DecimalType;
    /** Section id for anchor navigation */
    id?: string;
}

/**
 * ScrollySection — Scrollama-powered scrollytelling layout.
 *
 * Design intent: Sticky visualization on right, scrollable prose on left.
 * On mobile: visualization scrolls above the steps.
 * Never set overflow: hidden on the scroller parent.
 * Clean up on unmount; handle resize via scroller.resize().
 */
export default function ScrollySection({
    visualization,
    steps,
    onStepEnter,
    onStepExit,
    offset = 0.5,
    id,
}: ScrollySectionProps) {
    const scrollerRef = useRef<ReturnType<typeof scrollama> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleStepEnter = useCallback(({ index }: { index: number }) => {
        onStepEnter?.(index);
    }, [onStepEnter]);

    const handleStepExit = useCallback(({ index }: { index: number }) => {
        onStepExit?.(index);
    }, [onStepExit]);

    useEffect(() => {
        const scroller = scrollama();

        scroller
            .setup({
                step: '.scroll-step',
                offset,
                debug: false,
            })
            .onStepEnter(handleStepEnter)
            .onStepExit(handleStepExit);

        scrollerRef.current = scroller;

        const handleResize = () => scroller.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            scroller.destroy();
            window.removeEventListener('resize', handleResize);
        };
    }, [offset, handleStepEnter, handleStepExit]);

    return (
        <section
            id={id}
            ref={containerRef}
            style={{ position: 'relative', width: '100%' }}
        // IMPORTANT: do NOT set overflow: hidden — breaks Scrollama
        >
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: '2rem',
            }}>
                {/* Steps column — scrollable prose */}
                <div
                    className="scroll-steps"
                    style={{
                        flex: '0 0 auto',
                        width: 'clamp(280px, 40%, 480px)',
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="scroll-step"
                            data-step={i}
                            style={{
                                minHeight: '100vh',
                                display: 'flex',
                                alignItems: 'center',
                                paddingBlock: 'clamp(48px, 8vh, 96px)',
                                paddingInline: 'clamp(24px, 4vw, 48px)',
                            }}
                        >
                            <div
                                className="prose-block"
                                style={{
                                    maxWidth: '540px',
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '1.0625rem',
                                    lineHeight: 1.75,
                                    color: 'var(--color-text-secondary)',
                                }}
                            >
                                {step}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sticky visualization pane */}
                <div
                    className="sticky-viz"
                    style={{
                        flex: '1 1 auto',
                        position: 'sticky',
                        top: 0,
                        height: '100vh',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem 1rem',
                    }}
                >
                    {visualization}
                </div>
            </div>

            <style>{`
                @media (max-width: 767px) {
                    /* Stack on mobile: viz above, steps below */
                    section > div {
                        flex-direction: column !important;
                    }
                    .sticky-viz {
                        position: relative !important;
                        height: 50vh !important;
                        width: 100% !important;
                    }
                    .scroll-steps {
                        width: 100% !important;
                    }
                }
            `}</style>
        </section>
    );
}
