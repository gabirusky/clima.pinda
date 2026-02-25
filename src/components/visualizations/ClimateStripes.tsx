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
    const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, year: 0, anomaly: 0, temp: 0 });
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const W = svgRef.current.clientWidth || window.innerWidth;
        const H = svgRef.current.clientHeight || 400;
        const stripeWidth = W / data.length;
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
            .attr('height', H * 0.88)
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
                    y: rect.bottom - (container?.top ?? 0) - H * 0.12,
                    year: d.year,
                    anomaly: d.anomaly,
                    temp: d.temp_mean_annual,
                });
            })
            .on('mouseleave', function () {
                d3.select(this).style('filter', null);
                setTooltip(t => ({ ...t, visible: false }));
            });

        // Staggered reveal animation — 8ms per stripe
        stripes.each(function (_, i) {
            d3.select(this)
                .transition()
                .delay(i * 8)
                .duration(400)
                .attr('opacity', 1);
        });

        // Decade labels
        svg.selectAll<SVGTextElement, AnnualMetrics>('text.decade-label')
            .data(decades)
            .enter()
            .append('text')
            .attr('class', 'decade-label')
            .attr('x', d => {
                const idx = sorted.findIndex(s => s.year === d.year);
                return idx * stripeWidth + stripeWidth / 2;
            })
            .attr('y', H * 0.93)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(240,236,227,0.45)')
            .attr('font-family', "'DM Sans', sans-serif")
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

            {/* Gradient fade at top */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '80px',
                background: 'linear-gradient(to bottom, rgba(10,15,30,0.6), transparent)',
                pointerEvents: 'none',
            }} />
            {/* Gradient fade at bottom */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
                background: 'linear-gradient(to top, rgba(10,15,30,0.8), transparent)',
                pointerEvents: 'none',
            }} />

            {/* Tooltip */}
            {tooltip.visible && (
                <div
                    role="tooltip"
                    style={{
                        position: 'absolute',
                        left: tooltip.x,
                        top: tooltip.y - 80,
                        transform: 'translateX(-50%)',
                        background: 'rgba(10,15,30,0.92)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        pointerEvents: 'none',
                        zIndex: 10,
                        minWidth: '120px',
                        textAlign: 'center',
                    }}
                >
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: tooltip.anomaly >= 0 ? '#ef8a62' : '#4393c3' }}>
                        {tooltip.year}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                        {tooltip.anomaly >= 0 ? '+' : ''}{tooltip.anomaly.toFixed(2)}°C
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                        média {tooltip.temp.toFixed(1)}°C
                    </p>
                </div>
            )}

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
