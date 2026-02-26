import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { RainMetrics } from '../../types/climate.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import Tooltip from '../common/Tooltip.tsx';

interface RainHeatmapProps {
    rainMetrics: Record<number, RainMetrics>;
}

interface TooltipInfo {
    visible: boolean;
    x: number;
    y: number;
    year: number;
    month: number;
    value: number | null;
}

interface CellData {
    year: number;
    month: number;
    val: number;
    x: number;
    y: number;
}

const CELL_SIZE = 14;
const CELL_MARGIN = 2;
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const START_YEAR = 1940;
const END_YEAR = 2025;

/**
 * RainHeatmap — Heatmap of rainy days (R10mm or wet_days) by month/year.
 * 
 * Rows: Months (Jan-Dec)
 * Columns: Years (1940-2025)
 */
export default function RainHeatmap({ rainMetrics }: RainHeatmapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { width } = useWindowSize();
    const [tooltip, setTooltip] = useState<TooltipInfo>({ visible: false, x: 0, y: 0, year: 0, month: 0, value: null });
    const [inView, setInView] = useState(false);
    const [metricType, setMetricType] = useState<'r10mm' | 'wet_days'>('r10mm');

    const years = useMemo(() => {
        const arr = [];
        for (let y = START_YEAR; y <= END_YEAR; y++) arr.push(y);
        return arr;
    }, []);

    // Intersection observer for animation trigger
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setInView(true);
        }, { threshold: 0.2 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const maxVal = useMemo(() => {
        let max = 0;
        for (let y = START_YEAR; y <= END_YEAR; y++) {
            const yData = rainMetrics[y]?.monthly;
            if (yData) {
                for (let m = 1; m <= 12; m++) {
                    const val = yData[String(m)]?.[metricType] || 0;
                    if (val > max) max = val;
                }
            }
        }
        return max || 1;
    }, [rainMetrics, metricType]);

    // Color scale for rain (white/dry to dark blue/wet)
    const colorScale = useMemo(() => {
        return d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);
    }, [maxVal]);

    useEffect(() => {
        if (!svgRef.current || !inView) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const cellStep = CELL_SIZE + CELL_MARGIN;
        const marginLeft = 36;
        const marginTop = 28;

        const cellsData: CellData[] = [];
        years.forEach((year, cIdx) => {
            const yData = rainMetrics[year]?.monthly || {};
            MONTHS.forEach((_, rIdx) => {
                const monthNum = rIdx + 1;
                const val = yData[String(monthNum)]?.[metricType] || 0;
                cellsData.push({ year, month: monthNum, val, x: cIdx, y: rIdx });
            });
        });

        // Draw cells
        const cells = svg.selectAll<SVGRectElement, CellData>('rect.cell')
            .data(cellsData)
            .enter()
            .append('rect')
            .attr('class', 'cell')
            .attr('x', d => marginLeft + d.x * cellStep)
            .attr('y', d => marginTop + d.y * cellStep)
            .attr('width', CELL_SIZE)
            .attr('height', CELL_SIZE)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('fill', d => d.val === 0 ? '#1a2035' : colorScale(d.val))
            .attr('stroke', 'rgba(255,255,255,0.02)')
            .attr('stroke-width', 1)
            .attr('opacity', 0)
            .style('cursor', 'pointer')
            .on('mouseenter', function (event, d) {
                const container = containerRef.current?.getBoundingClientRect();
                const el = (event.target as SVGRectElement).getBoundingClientRect();
                setTooltip({
                    visible: true,
                    x: el.left - (container?.left ?? 0),
                    y: el.top - (container?.top ?? 0),
                    year: d.year,
                    month: d.month,
                    value: d.val
                });
                d3.select(this).attr('stroke', '#ffffff').attr('stroke-width', 2);
            })
            .on('mouseleave', function () {
                setTooltip(t => ({ ...t, visible: false }));
                d3.select(this).attr('stroke', 'rgba(255,255,255,0.02)').attr('stroke-width', 1);
            });

        // Month labels (Y axis)
        MONTHS.forEach((month, i) => {
            svg.append('text')
                .attr('x', marginLeft - 4)
                .attr('y', marginTop + i * cellStep + CELL_SIZE / 2 + 3)
                .attr('text-anchor', 'end')
                .attr('fill', 'rgba(240,236,227,0.4)')
                .attr('font-family', "'DM Sans', sans-serif")
                .attr('font-size', 9)
                .text(month);
        });

        // Year labels (X axis - every 10 years)
        years.forEach((year, i) => {
            if (year % 10 === 0) {
                svg.append('text')
                    .attr('x', marginLeft + i * cellStep + CELL_SIZE / 2)
                    .attr('y', marginTop - 6)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'rgba(240,236,227,0.4)')
                    .attr('font-family', "'DM Sans', sans-serif")
                    .attr('font-size', 9)
                    .text(year);
            }
        });

        // Animate cells (left to right by year)
        cells.each(function (d) {
            d3.select(this)
                .transition()
                .delay(d.x * 10)
                .duration(300)
                .attr('opacity', 1);
        });

    }, [rainMetrics, inView, width, years, metricType, colorScale]);

    const svgWidth = 36 + years.length * (CELL_SIZE + CELL_MARGIN) + 20;
    const svgHeight = 28 + 12 * (CELL_SIZE + CELL_MARGIN) + 20;

    return (
        <div ref={containerRef} style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            overflowX: 'auto'
        }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', color: '#fff', margin: 0 }}>
                    Distribuição das chuvas ao longo dos anos
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setMetricType('r10mm')}
                        style={{
                            background: metricType === 'r10mm' ? 'rgba(33, 102, 172, 0.2)' : 'transparent',
                            border: `1px solid ${metricType === 'r10mm' ? '#2166ac' : 'rgba(255,255,255,0.2)'}`,
                            color: metricType === 'r10mm' ? '#67a9cf' : 'rgba(255,255,255,0.6)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                        }}
                    >
                        Dias com Chuva ≥ 10mm
                    </button>
                    <button
                        onClick={() => setMetricType('wet_days')}
                        style={{
                            background: metricType === 'wet_days' ? 'rgba(33, 102, 172, 0.2)' : 'transparent',
                            border: `1px solid ${metricType === 'wet_days' ? '#2166ac' : 'rgba(255,255,255,0.2)'}`,
                            color: metricType === 'wet_days' ? '#67a9cf' : 'rgba(255,255,255,0.6)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                        }}
                    >
                        Dias Chuvosos
                    </button>
                </div>
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg
                    ref={svgRef}
                    role="img"
                    aria-label="Heatmap de dias de chuva por mês e ano"
                    style={{ minWidth: svgWidth, height: svgHeight }}
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                />
            </div>

            {/* Tooltip */}
            {tooltip.visible && (
                <Tooltip
                    x={tooltip.x}
                    y={tooltip.y}
                    visible={tooltip.visible}
                    content={
                        <div>
                            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>
                                {MONTHS[tooltip.month - 1]} {tooltip.year}
                            </p>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                                {metricType === 'r10mm' ? 'Dias ≥ 10mm' : 'Dias chuvosos'}: <strong style={{ color: '#67a9cf' }}>{tooltip.value}</strong>
                            </p>
                        </div>
                    }
                />
            )}
        </div>
    );
}
