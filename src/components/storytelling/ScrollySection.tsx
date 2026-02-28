import { useEffect, useRef, useCallback, useId, type ReactNode } from 'react';
import scrollama from 'scrollama';
import { useWindowSize } from '../../hooks/useWindowSize.ts';

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
    /** Reverse order on desktop: viz on left, text on right */
    reverseDesktop?: boolean;
}

/**
 * ScrollySection — Scrollama-powered scrollytelling layout.
 *
 * Design intent: Sticky visualization on right, scrollable prose on left.
 * On mobile: visualization scrolls above the steps.
 *
 * Each instance gets a unique scoped selector via useId() so multiple
 * ScrollySections on the same page don't interfere with each other.
 */
export default function ScrollySection({
    visualization,
    steps,
    onStepEnter,
    onStepExit,
    offset = 0.5,
    id,
    reverseDesktop = false,
}: ScrollySectionProps) {
    // Unique stable ID for this instance — scopes Scrollama to this section only
    const uid = useId().replace(/:/g, '');
    const stepClass = `scroll-step-${uid}`;

    const scrollerRef = useRef<ReturnType<typeof scrollama> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleStepEnter = useCallback(({ index }: { index: number }) => {
        onStepEnter?.(index);
    }, [onStepEnter]);

    const handleStepExit = useCallback(({ index }: { index: number }) => {
        onStepExit?.(index);
    }, [onStepExit]);

    const { width } = useWindowSize();
    const isMobile = width < 768;

    useEffect(() => {
        if (isMobile) return;

        const scroller = scrollama();

        scroller
            .setup({
                step: `.${stepClass}`,   // scoped — only this section's steps
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
    }, [offset, stepClass, handleStepEnter, handleStepExit, isMobile]);

    return (
        <section
            id={id}
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                // Fluid horizontal margins — breathing room from viewport edges.
                // IMPORTANT: do NOT use overflow: hidden — breaks Scrollama.
                paddingInline: 'clamp(16px, 6vw, 120px)',
            }}
        >
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : (reverseDesktop ? 'row-reverse' : 'row'),
                alignItems: isMobile ? 'center' : 'flex-start',
                gap: isMobile ? '1rem' : '2rem',
            }}>
                {isMobile && (
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem 0 2rem 0',
                        }}
                    >
                        {visualization}
                    </div>
                )}

                {/* Steps column — scrollable prose (LEFT on desktop, BELOW on mobile) */}
                <div
                    className="scroll-steps"
                    style={{
                        flex: '0 0 auto',
                        width: isMobile ? '100%' : 'clamp(280px, 40%, 480px)',
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className={stepClass}
                            data-step={i}
                            style={{
                                minHeight: isMobile ? 'auto' : '100vh',
                                display: 'flex',
                                alignItems: 'center',
                                paddingBlock: isMobile ? '2rem' : 'clamp(48px, 8vh, 96px)',
                                paddingInline: 'clamp(16px, 2vw, 32px)',
                            }}
                        >
                            <div
                                className="prose-block"
                                style={{
                                    maxWidth: '540px',
                                    fontFamily: "'Raleway', sans-serif",
                                    fontSize: '1.0625rem',
                                    lineHeight: 1.8,
                                    color: 'var(--color-text-primary)',
                                    margin: isMobile ? '0 auto' : '0',
                                }}
                            >
                                {step}
                            </div>
                        </div>
                    ))}
                </div>

                {!isMobile && (
                    <div
                        className="sticky-viz"
                        style={{
                            flex: '1 1 auto',
                            position: 'sticky',
                            top: 0,
                            alignSelf: 'flex-start',   /* required for sticky in flex */
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
                )}
            </div>
        </section>
    );
}
