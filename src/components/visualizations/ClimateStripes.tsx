import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { AnnualMetrics } from '../../types/climate.ts';
import { anomalyToStripeColor } from '../../utils/colors.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import DataTable from '../common/DataTable.tsx';

interface ClimateStripesProps {
    /** Array of annual metrics with year, anomaly, temp_mean_annual */
    data: AnnualMetrics[];
    /** Optional height override (default: 100vh) */
    height?: string;
}

interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    year: number;
    anomaly: number;
    temp: number;
    /** Width of the container — used to clamp tooltip so it never overflows */
    containerW: number;
}

/**
 * ClimateStripes — Not a chart. A painting.
 *
 * Full-bleed SVG showing one stripe per year (1940–2025).
 * Color: Ed Hawkins diverging palette, baseline 1940–1980 mean.
 * Animation: stripes reveal left-to-right, staggered 8ms per stripe.
 * Hover: year label fades in; brightness lifts.
 */
export default function ClimateStripes({ data, height = '100vh' }: ClimateStripesProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { width } = useWindowSize();
    const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, year: 0, anomaly: 0, temp: 0, containerW: 0 });
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const W = svgRef.current.clientWidth || window.innerWidth;
        const H = svgRef.current.clientHeight || 400;
        const stripeWidth = W / data.length;
        const containerW = containerRef.current?.clientWidth ?? W;
        const sorted = [...data].sort((a, b) => a.year - b.year);

        // Decade labels
        const decades = sorted.filter(d => d.year % 10 === 0);

        // Draw stripes
        const stripes = svg.selectAll<SVGRectElement, AnnualMetrics>('rect.stripe')
            .data(sorted)
            .enter()
            .append('rect')
            .attr('class', 'stripe')
            .attr('x', (_, i) => i * stripeWidth)
            .attr('y', 0)
            .attr('width', stripeWidth + 0.5) // tiny overlap to prevent gaps
            .attr('height', H)
            .attr('fill', d => anomalyToStripeColor(d.anomaly))
            .attr('opacity', 0)
            .style('cursor', 'crosshair')
            .attr('role', 'img')
            .attr('aria-label', d => `${d.year}: ${d.anomaly >= 0 ? '+' : ''}${d.anomaly.toFixed(2)}°C de anomalia`)
            .on('mouseenter', function (event, d) {
                d3.select(this).attr('opacity', 1).style('filter', 'brightness(1.3)');
                const rect = (event.target as SVGRectElement).getBoundingClientRect();
                const container = containerRef.current?.getBoundingClientRect();
                setTooltip({
                    visible: true,
                    x: rect.left - (container?.left ?? 0) + stripeWidth / 2,
                    y: 420,  // fixed 80px from container top — safe anchor for full-height stripes
                    year: d.year,
                    anomaly: d.anomaly,
                    temp: d.temp_mean_annual,
                    containerW,
                });
            })
            .on('mouseleave', function () {
                d3.select(this).style('filter', null);
                setTooltip(t => ({ ...t, visible: false }));
            });

        // NOTE: We intentionally do NOT append <title> to each stripe rect.
        // Doing so triggers the native browser tooltip which creates a double-tooltip
        // bug alongside our custom React tooltip. The aria-label on each rect already
        // covers screen-reader accessibility without the native floating label.

        // Staggered reveal animation — 8ms per stripe
        stripes.each(function (_, i) {
            d3.select(this)
                .transition()
                .delay(i * 8)
                .duration(400)
                .attr('opacity', 1);
        });

        // Dark fade behind decade labels so they read over any stripe colour
        svg.append('rect')
            .attr('x', 0)
            .attr('y', H * 0.88)
            .attr('width', W)
            .attr('height', H * 0.12)
            .attr('fill', 'url(#labelFade)')
            .attr('pointer-events', 'none');

        // Gradient def for the label fade
        const defs = svg.append('defs');
        const grad = defs.append('linearGradient')
            .attr('id', 'labelFade')
            .attr('x1', '0').attr('y1', '0')
            .attr('x2', '0').attr('y2', '1');
        grad.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(10,10,15,0)').attr('stop-opacity', 0);
        grad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(10,10,15,0.82)').attr('stop-opacity', 1);

        // Decade labels — overlaid on top of the fade rect
        svg.selectAll<SVGTextElement, AnnualMetrics>('text.decade-label')
            .data(decades)
            .enter()
            .append('text')
            .attr('class', 'decade-label')
            .attr('x', d => {
                const idx = sorted.findIndex(s => s.year === d.year);
                return idx * stripeWidth + stripeWidth / 2;
            })
            .attr('y', H * 0.955)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(240,236,227,0.6)')
            .attr('font-family', "'Raleway', sans-serif")
            .attr('font-size', Math.max(10, Math.min(14, stripeWidth * 6)))
            .attr('pointer-events', 'none')
            .text(d => d.year);

        setReady(true);
    }, [data, width]);

    const tableRows = data
        .sort((a, b) => a.year - b.year)
        .map(d => [
            String(d.year),
            `${d.anomaly >= 0 ? '+' : ''}${d.anomaly.toFixed(2)}°C`,
            `${d.temp_mean_annual.toFixed(1)}°C`,
        ]);

    return (
        <div
            ref={containerRef}
            id="stripes"
            role="region"
            aria-label="Faixas climáticas de Pindamonhangaba 1940–2025"
            style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}
        >
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                role="img"
                aria-label="Climate stripes 1940–2025 — cada faixa representa um ano; azul = mais frio, vermelho = mais quente que a média 1940–1980"
                style={{ display: 'block', filter: 'blur(0.5px)' }}
            >
                <title>Faixas Climáticas — Pindamonhangaba 1940–2025</title>
                <desc>Visualização das anomalias de temperatura de 1940 a 2025. Azul = abaixo da média 1940–1980; vermelho = acima da média.</desc>
            </svg>

            {/* Light gradient at top — softens entry edge */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '80px',
                background: 'linear-gradient(to bottom, rgba(10,15,30,0.55), transparent)',
                pointerEvents: 'none',
            }} />
            {/* Light gradient at bottom — softens exit edge only; label
                 readability is handled by the SVG fade rect, not this div */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                background: 'linear-gradient(to top, rgba(10,10,15,0.5), transparent)',
                pointerEvents: 'none',
            }} />

            {/* Tooltip — clamped so it never overflows left/right container edges */}
            {tooltip.visible && (() => {
                const TOOLTIP_HALF_W = 80; // half of minWidth (160px)
                const EDGE_MARGIN = 8;
                const rawLeft = tooltip.x;
                const clampedLeft = Math.max(
                    TOOLTIP_HALF_W + EDGE_MARGIN,
                    Math.min(rawLeft, (tooltip.containerW || window.innerWidth) - TOOLTIP_HALF_W - EDGE_MARGIN)
                );
                return (
                    <div
                        role="tooltip"
                        style={{
                            position: 'absolute',
                            left: clampedLeft,
                            top: tooltip.y - 90,
                            transform: 'translateX(-50%)',
                            background: 'rgba(8,12,24,0.92)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '0.6rem 1rem',
                            pointerEvents: 'none',
                            zIndex: 10,
                            minWidth: '160px',
                            textAlign: 'center',
                        }}
                    >
                        {/* Year — title */}
                        <p style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontWeight: 800,
                            fontSize: '1.4rem',
                            color: '#f0ece3',
                            lineHeight: 1,
                            marginBottom: '0.3rem',
                            letterSpacing: '-0.02em',
                        }}>
                            {tooltip.year}
                        </p>
                        {/* Anomaly */}
                        <p style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: tooltip.anomaly >= 0 ? '#ef8a62' : '#4393c3',
                            marginBottom: '0.15rem',
                        }}>
                            {tooltip.anomaly >= 0 ? '+' : ''}{tooltip.anomaly.toFixed(2)}°C
                        </p>
                        {/* Mean temp */}
                        <p style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.45)',
                        }}>
                            média {tooltip.temp.toFixed(1)}°C
                        </p>
                    </div>
                );
            })()}

            {ready && (
                <DataTable
                    caption="Anomalias de temperatura anuais — Pindamonhangaba 1940–2025"
                    headers={['Ano', 'Anomalia', 'Temperatura Média']}
                    rows={tableRows}
                />
            )}
        </div>
    );
}
