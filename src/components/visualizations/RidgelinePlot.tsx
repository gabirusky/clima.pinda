import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { DailyRecord } from '../../types/climate.ts';
import { decadeToColor } from '../../utils/colors.ts';
import { kernelDensityEstimate } from '../../utils/calculations.ts';
import DataTable from '../common/DataTable.tsx';

interface RidgelinePlotProps {
    data: DailyRecord[];
}

const DECADES = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

/**
 * RidgelinePlot — Joy Division aesthetic.
 *
 * One KDE ridge per decade. Color shifts cool blue → burning red.
 * Scroll-triggered reveal: oldest decade first, 300ms each.
 * 30°C reference line in stripe-burning red.
 */
export default function RidgelinePlot({ data }: RidgelinePlotProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

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
        if (!svgRef.current || !inView || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const W = svgRef.current.clientWidth || 600;
        const H = svgRef.current.clientHeight || 400;

        const marginLeft = 64;
        const marginRight = 24;
        const marginTop = 20;
        const marginBottom = 40;

        const plotW = W - marginLeft - marginRight;
        const plotH = H - marginTop - marginBottom;

        const innerW = plotW;
        const ridgeHeight = plotH / DECADES.length * 2.2; // overlap

        // Group data by decade
        const decadeData = DECADES.map(d => {
            const records = data.filter(r => {
                const y = parseInt(r.date.slice(0, 4), 10);
                return y >= d && y < d + 10;
            });
            return { decade: d, values: records.map(r => r.temp_max) };
        });

        // Compute KDE for each decade
        const xDomain: [number, number] = [10, 42];
        const xScale = d3.scaleLinear().domain(xDomain).range([0, innerW]);

        const kdes = decadeData.map(({ decade, values }) => ({
            decade,
            kde: kernelDensityEstimate(values, 0.8, 80, xDomain),
        }));

        const maxDensity = d3.max(kdes, d => d3.max(d.kde, k => k[1])) ?? 1;

        const g = svg.append('g').attr('transform', `translate(${marginLeft},${marginTop})`);

        // 30°C reference line
        g.append('line')
            .attr('x1', xScale(30))
            .attr('x2', xScale(30))
            .attr('y1', 0)
            .attr('y2', plotH - 10)
            .attr('stroke', '#b2182b')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4 4')
            .attr('opacity', 0.5);

        g.append('text')
            .attr('x', xScale(30) + 4)
            .attr('y', 12)
            .attr('fill', '#b2182b')
            .attr('font-family', "'DM Sans', sans-serif")
            .attr('font-size', 10)
            .attr('opacity', 0.8)
            .text('30°C');

        // Draw each decade ridge
        kdes.forEach(({ decade, kde }, decadeIdx) => {
            const decadeColor = decadeToColor(decadeIdx);
            const baseY = marginTop + (DECADES.length - 1 - decadeIdx) * (plotH / DECADES.length);

            const yScale = d3.scaleLinear()
                .domain([0, maxDensity])
                .range([0, -ridgeHeight]);

            const area = d3.area<[number, number]>()
                .x(d => xScale(d[0]))
                .y0(0)
                .y1(d => yScale(d[1]))
                .curve(d3.curveBasis);

            const line = d3.line<[number, number]>()
                .x(d => xScale(d[0]))
                .y(d => yScale(d[1]))
                .curve(d3.curveBasis);

            const ridgeGroup = g.append('g')
                .attr('transform', `translate(0, ${baseY + plotH / DECADES.length})`)
                .attr('opacity', 0);

            // Fill area
            ridgeGroup.append('path')
                .datum(kde)
                .attr('d', area)
                .attr('fill', decadeColor)
                .attr('fill-opacity', 0.6);

            // Line stroke
            ridgeGroup.append('path')
                .datum(kde)
                .attr('d', line)
                .attr('fill', 'none')
                .attr('stroke', decadeColor)
                .attr('stroke-width', 1.5)
                .attr('stroke-opacity', 0.9);

            // Decade label
            ridgeGroup.append('text')
                .attr('x', -8)
                .attr('y', 4)
                .attr('text-anchor', 'end')
                .attr('fill', decadeColor)
                .attr('font-family', "'Syne', sans-serif")
                .attr('font-weight', 700)
                .attr('font-size', 11)
                .text(`${decade}s`);

            // Animate: reveal oldest first with 300ms each
            ridgeGroup.transition()
                .delay(decadeIdx * 300)
                .duration(600)
                .ease(d3.easeCubicOut)
                .attr('opacity', 1);
        });

        // X-axis (temperature)
        const xAxis = d3.axisBottom(xScale)
            .tickValues([10, 15, 20, 25, 30, 35, 40])
            .tickFormat(d => `${d}°C`);

        g.append('g')
            .attr('transform', `translate(0, ${plotH})`)
            .call(xAxis)
            .selectAll('text')
            .attr('fill', 'rgba(240,236,227,0.5)')
            .attr('font-family', "'DM Sans', sans-serif")
            .attr('font-size', 11);

        g.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)');
        g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.1)');

    }, [data, inView]);

    const tableRows = DECADES.map(d => {
        const values = data
            .filter(r => parseInt(r.date.slice(0, 4)) >= d && parseInt(r.date.slice(0, 4)) < d + 10)
            .map(r => r.temp_max);
        const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';
        return [`${d}s`, avg + '°C', String(values.length)];
    });

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <svg
                ref={svgRef}
                role="img"
                aria-label="Ridgeline plot mostrando a distribuição de temperaturas máximas por década, de 1940 a 2020. A distribuição se desloca para a direita ao longo do tempo."
                width="100%"
                height={380}
                style={{ display: 'block', overflow: 'visible' }}
            >
                <title>Distribuição de Temperaturas Máximas por Década</title>
                <desc>Cada faixa mostra a distribuição de probabilidade das temperaturas máximas em Pindamonhangaba para cada década. O eixo horizontal é a temperatura em graus Celsius. A distribuição se move para a direita (temperaturas mais altas) conforme as décadas avançam.</desc>
            </svg>
            <DataTable
                caption="Temperatura máxima média por década"
                headers={['Década', 'Tmáx Média', 'Registros']}
                rows={tableRows}
            />
        </div>
    );
}
