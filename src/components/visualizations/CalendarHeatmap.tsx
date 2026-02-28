import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { DailyRecord } from '../../types/climate.ts';
import { tempToHeatmapColor } from '../../utils/colors.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';
import DataTable from '../common/DataTable.tsx';
import Tooltip from '../common/Tooltip.tsx';
import { formatDate } from '../../utils/formatters.ts';

interface CalendarHeatmapProps {
    data: DailyRecord[];
    year: number;
}

interface TooltipInfo {
    visible: boolean;
    x: number;
    y: number;
    record: DailyRecord | null;
}

const CELL_SIZE = 14;
const CELL_MARGIN = 2;
const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * CalendarHeatmap — fills day by day like a timelapse of a summer getting longer.
 *
 * 53 weeks × 7 days grid. SU30 days get a dot overlay.
 * TR20 nights get a border highlight.
 * Animation: cells fill chronologically on scroll entry.
 */
export default function CalendarHeatmap({
    data,
    year,
}: CalendarHeatmapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { width } = useWindowSize();
    const [tooltip, setTooltip] = useState<TooltipInfo>({ visible: false, x: 0, y: 0, record: null });
    const [inView, setInView] = useState(false);

    const yearData = useMemo(() =>
        data.filter(r => r.date.startsWith(`${year}-`)),
        [data, year]
    );

    const recordsByDate = useMemo(() => {
        const m = new Map<string, DailyRecord>();
        for (const r of yearData) m.set(r.date, r);
        return m;
    }, [yearData]);

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

    useEffect(() => {
        if (!svgRef.current || !inView) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const cellStep = CELL_SIZE + CELL_MARGIN;
        const marginLeft = 36;
        const marginTop = 28;

        // Build all days of year
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const allDays = d3.timeDays(startDate, d3.timeDay.offset(endDate, 1));

        // Compute week offset: start from Monday (d3.timeMonday)
        const firstMonday = d3.timeMonday(startDate);
        const weekOffset = d3.timeMonday.count(firstMonday, startDate);

        // Draw day cells
        const cells = svg.selectAll<SVGRectElement, Date>('rect.day')
            .data(allDays)
            .enter()
            .append('rect')
            .attr('class', 'day')
            .attr('x', d => {
                const weekNum = d3.timeMonday.count(firstMonday, d) + weekOffset;
                return marginLeft + weekNum * cellStep;
            })
            .attr('y', d => {
                // Mon=0 ... Sun=6 (ISO week)
                const dow = (d.getDay() + 6) % 7;
                return marginTop + dow * cellStep;
            })
            .attr('width', CELL_SIZE)
            .attr('height', CELL_SIZE)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('fill', d => {
                const dateStr = d3.timeFormat('%Y-%m-%d')(d);
                const rec = recordsByDate.get(dateStr);
                return rec ? tempToHeatmapColor(rec.temp_max) : '#1a2035';
            })
            .attr('stroke', d => {
                const dateStr = d3.timeFormat('%Y-%m-%d')(d);
                const rec = recordsByDate.get(dateStr);
                return rec && rec.temp_min >= 20 ? '#ffffffff' : 'transparent';
            })
            .attr('stroke-width', 1.5)
            .attr('opacity', 0)
            .style('cursor', 'pointer')
            .on('mouseenter', function (event, d) {
                const dateStr = d3.timeFormat('%Y-%m-%d')(d);
                const rec = recordsByDate.get(dateStr);
                const container = containerRef.current?.getBoundingClientRect();
                const el = (event.target as SVGRectElement).getBoundingClientRect();
                setTooltip({
                    visible: true,
                    x: el.left - (container?.left ?? 0),
                    y: el.top - (container?.top ?? 0),
                    record: rec ?? null,
                });
            })
            .on('mouseleave', () => setTooltip(t => ({ ...t, visible: false })));

        // TR20 mark overlays
        svg.selectAll<SVGPathElement, Date>('path.tr20-mark')
            .data(allDays.filter(d => {
                const dateStr = d3.timeFormat('%Y-%m-%d')(d);
                const rec = recordsByDate.get(dateStr);
                return rec && rec.temp_min >= 20;
            }))
            .enter()
            .append('path')
            .attr('class', 'tr20-mark')
            .attr('d', d => {
                const weekNum = d3.timeMonday.count(firstMonday, d) + weekOffset;
                const x = marginLeft + weekNum * cellStep;
                const y = marginTop + ((d.getDay() + 6) % 7) * cellStep;
                return `M ${x} ${y} L ${x + CELL_SIZE} ${y + CELL_SIZE} M ${x + CELL_SIZE} ${y} L ${x} ${y + CELL_SIZE}`;
            })
            .attr('stroke', '#ffffffff')
            .attr('stroke-width', 2)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0)
            .attr('pointer-events', 'none');



        // Month labels
        const format = d3.timeFormat('%Y-%m-%d');
        MONTHS.forEach((month, mi) => {
            const firstOfMonth = new Date(year, mi, 1);
            const weekNum = d3.timeMonday.count(firstMonday, firstOfMonth) + weekOffset;
            svg.append('text')
                .attr('x', marginLeft + weekNum * cellStep)
                .attr('y', marginTop - 10)
                .attr('fill', 'rgba(240,236,227,0.4)')
                .attr('font-family', "'DM Sans', sans-serif")
                .attr('font-size', 10)
                .text(month);
        });

        // Day-of-week labels
        WEEK_LABELS.forEach((label, i) => {
            svg.append('text')
                .attr('x', marginLeft - 4)
                .attr('y', marginTop + i * cellStep + CELL_SIZE / 2 + 4)
                .attr('text-anchor', 'end')
                .attr('fill', 'rgba(240,236,227,0.3)')
                .attr('font-family', "'DM Sans', sans-serif")
                .attr('font-size', 9)
                .text(label.slice(0, 3));
        });

        // Animate cells chronologically (2ms per day)
        cells.each(function (_d, i) {
            d3.select(this)
                .transition()
                .delay(i * 2)
                .duration(150)
                .attr('opacity', 1);
        });

        // Animate TR20 marks after cells
        svg.selectAll<SVGElement, Date>('path.tr20-mark').each(function (d) {
            const idx = allDays.findIndex(dd => format(dd) === format(d));
            d3.select(this)
                .transition()
                .delay(idx * 2 + 100)
                .duration(200)
                .attr('opacity', 0.9);
        });

    }, [year, recordsByDate, inView, width]);

    const tableRows = yearData.slice(0, 20).map(r => [
        r.date,
        `${r.temp_max.toFixed(1)}°C`,
        `${r.temp_min.toFixed(1)}°C`,
        `${r.precipitation.toFixed(1)} mm`,
    ]);

    const svgHeight = CELL_SIZE * 7 + CELL_MARGIN * 6 + 60;

    return (
        <div ref={containerRef} style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: width > 900 ? 'row' : 'column',
            gap: '1.5rem',
            alignItems: width > 900 ? 'center' : 'flex-start',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}>

            <div style={{ flex: 1, minWidth: 0, width: '100%', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <svg
                    ref={svgRef}
                    role="img"
                    aria-label={`Calendário de calor — ${year}. Cada célula é um dia do ano, colorida pela temperatura máxima.`}
                    style={{ minWidth: 885, height: svgHeight }}
                    viewBox={`0 0 885 ${svgHeight}`}
                >
                    <title>Calendário de Calor — {year}</title>
                    <desc>Grade de 53 semanas × 7 dias mostrando temperaturas máximas diárias para {year}. Cruz (×) e borda laranja = noites acima de 20°C (TR20).</desc>
                </svg>
            </div>

            {/* Right Panel: Year & Legend */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                maxWidth: width > 900 ? '180px' : '100%',
                flexShrink: 0,
                alignItems: width > 900 ? 'flex-start' : 'center',
                textAlign: width > 900 ? 'left' : 'center',
            }}>
                <p style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    margin: 0,
                }}>
                    {year}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.65rem',
                        color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '0.25rem',
                    }}>
                        Legenda
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flexDirection: width > 900 ? 'column' : 'row', justifyContent: width > 900 ? 'flex-start' : 'center' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: width > 900 ? 'flex-start' : 'center' }}>
                            <LegendItem color="#2166ac" label="10°C" />
                            <LegendItem color="#67a9cf" label="20°C" />
                            <LegendItem color="#fddbc7" label="25°C" />
                            <LegendItem color="#d6604d" label="30°C" />
                            <LegendItem color="#b2182b" label="35°C" />
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <svg width="12" height="12" viewBox="0 0 12 12" style={{ display: 'block', overflow: 'visible' }}>
                                    <rect x="0.75" y="0.75" width="10.5" height="10.5" rx="2" fill="none" stroke="#ffffffff" strokeWidth="1.5" />
                                    <path d="M 0.75 0.75 L 11.25 11.25 M 11.25 0.75 L 0.75 11.25" stroke="#ffffffff" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                TR20 (noite ≥20°C)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip.visible && tooltip.record && (
                <Tooltip
                    x={tooltip.x}
                    y={tooltip.y}
                    visible={tooltip.visible}
                    content={
                        <div>
                            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>
                                {formatDate(tooltip.record.date)}
                            </p>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                                Tmáx: <strong style={{ color: '#ff0000ff' }}>{tooltip.record.temp_max.toFixed(1)}°C</strong>
                            </p>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                                Tmín: {tooltip.record.temp_min.toFixed(1)}°C
                            </p>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                                Chuva: {tooltip.record.precipitation.toFixed(1)} mm
                            </p>
                        </div>
                    }
                />
            )}

            <DataTable
                caption={`Calendário de calor — ${year} (primeiros 20 registros)`}
                headers={['Data', 'Tmáx', 'Tmín', 'Precipitação']}
                rows={tableRows}
            />
        </div>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: color }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
        </span>
    );
}
