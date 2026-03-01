/**
 * GlobeHero — Spinning 3-D globe hero section
 *
 * Animation sequence:
 *   Phase 1 "spin"  — globe spins freely for ~0.8 s (fast!)
 *   Phase 2 "fly"   — eased rotation to Pindamonhangaba (~0.8 s)
 *                     Text starts fading in at the START of fly
 *   Phase 3 "idle"  — very slow eastward drift + pulsing marker
 *
 * Map: uses world-atlas `land` (merged polygon) for fill +
 *      topojson mesh() for country border lines only.
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

// ── Geographic constants ─────────────────────────────────────────────────────
const TARGET_LON = -45.462;
const TARGET_LAT = -22.925;
const TARGET_ROT: [number, number, number] = [-TARGET_LON, -TARGET_LAT, 0];

// ── Canvas dimensions ────────────────────────────────────────────────────────
const W = 560;
const H = 560;
const R = 240;
const CX = W / 2;
const CY = H / 2;

// ── Animation timing — FAST ───────────────────────────────────────────────────
const SPIN_DURATION = 1600;  // ms
const FLY_DURATION = 800;  // ms
const SPIN_SPEED = 0.12; // deg/ms nominal

// ── Types ────────────────────────────────────────────────────────────────────
type AnimPhase = 'spin' | 'fly' | 'idle';

interface WorldTopology extends Topology {
    objects: {
        countries: GeometryCollection;
        land: GeometryCollection;
    };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function GlobeHero() {
    const svgRef = useRef<SVGSVGElement>(null);
    const rafRef = useRef<number>(0);

    // Text visible immediately — no waiting for animation
    const textVisible = true; // always on — no animation delay
    const [badgeVisible, setBadgeVisible] = useState(false);
    const [tapeVisible, setTapeVisible] = useState(false);

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // ── Glow filter ──────────────────────────────────────────────────────
        const defs = svg.append('defs');
        const filter = defs
            .append('filter')
            .attr('id', 'pinda-glow')
            .attr('x', '-80%').attr('y', '-80%')
            .attr('width', '260%').attr('height', '260%');
        filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // ── Projection ───────────────────────────────────────────────────────
        const projection = d3.geoOrthographic()
            .scale(R)
            .translate([CX, CY])
            .clipAngle(90)
            .rotate([0, -15, 0]);

        const pathGen = d3.geoPath().projection(projection);

        // ── Static layers ────────────────────────────────────────────────────
        svg.append('circle')
            .attr('cx', CX).attr('cy', CY).attr('r', R)
            .attr('fill', '#0c0b16')
            .attr('stroke', 'rgba(244,115,42,0.15)')
            .attr('stroke-width', 1.2);

        const graticuleG = svg.append('g').attr('class', 'graticule-g');
        const landG = svg.append('g').attr('class', 'land-g');
        const borderG = svg.append('g').attr('class', 'border-g');
        const markerG = svg.append('g').attr('class', 'marker-g');

        const graticule = d3.geoGraticule()();

        // ── Draw helpers ──────────────────────────────────────────────────────
        function drawGraticule() {
            graticuleG.selectAll('path').remove();
            graticuleG.append('path')
                .datum(graticule)
                .attr('d', pathGen)
                .attr('fill', 'none')
                .attr('stroke', 'rgba(210,130,60,0.14)')
                .attr('stroke-width', 0.5);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function drawLand(landFeat: any, borderMesh: any) {
            // Clean merged land fill — no interior borders
            landG.selectAll('path').remove();
            landG.append('path')
                .datum(landFeat)
                .attr('d', pathGen)
                .attr('fill', 'rgba(200,135,60,0.22)')
                .attr('stroke', 'none');

            // Country borders only (mesh = shared edges, no coastline double-lines)
            borderG.selectAll('path').remove();
            if (borderMesh) {
                borderG.append('path')
                    .datum(borderMesh)
                    .attr('d', pathGen)
                    .attr('fill', 'none')
                    .attr('stroke', 'rgba(210,140,70,0.50)')
                    .attr('stroke-width', 0.55)
                    .attr('stroke-linejoin', 'round');
            }
        }

        // ── Marker helpers ────────────────────────────────────────────────────
        let markerVisible = false;
        let pulseTimer: ReturnType<typeof setTimeout> | null = null;
        let markerDrawn = false;

        function clearMarker() {
            markerG.selectAll('*').remove();
            if (pulseTimer) { clearTimeout(pulseTimer); pulseTimer = null; }
            markerDrawn = false;
        }

        function spawnPulse(x: number, y: number) {
            markerG.select('.pulse-ring').remove();
            const ring = markerG.insert('circle', '.marker-core')
                .attr('class', 'pulse-ring')
                .attr('cx', x).attr('cy', y)
                .attr('r', 5)
                .attr('fill', 'none')
                .attr('stroke', 'rgba(244,115,42,0.65)')
                .attr('stroke-width', 1.5);

            ring.transition()
                .duration(1600)
                .ease(d3.easeSinOut)
                .attr('r', 22)
                .attr('stroke-opacity', 0)
                .remove();

            pulseTimer = setTimeout(() => spawnPulse(x, y), 1600);
        }

        function updateMarker() {
            if (!markerVisible) { clearMarker(); return; }

            const proj = projection([TARGET_LON, TARGET_LAT]);
            if (!proj) { clearMarker(); return; }
            const [x, y] = proj;

            const center = projection.invert?.([CX, CY]);
            const dist = center
                ? d3.geoDistance([TARGET_LON, TARGET_LAT], center)
                : Math.PI;

            if (dist >= Math.PI / 2) { clearMarker(); return; }

            if (!markerDrawn) {
                markerDrawn = true;
                markerG.append('circle')
                    .attr('class', 'marker-core')
                    .attr('cx', x).attr('cy', y)
                    .attr('r', 4.5)
                    .attr('fill', '#ff8c42')
                    .attr('filter', 'url(#pinda-glow)');
                spawnPulse(x, y);
            } else {
                markerG.select('.marker-core').attr('cx', x).attr('cy', y);
                markerG.select('.pulse-ring').attr('cx', x).attr('cy', y);
            }
        }

        // ── Animation state ───────────────────────────────────────────────────
        let animPhase: AnimPhase = 'spin';
        let spinStart: number | null = null;
        let flyStart: number | null = null;
        let flyFrom: [number, number, number] | null = null;
        let idleRot: [number, number, number] | null = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let landFeat: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let borderMesh: any = null;

        function tick(ts: number) {
            if (!spinStart) spinStart = ts;

            if (animPhase === 'spin') {
                const elapsed = ts - spinStart;
                const progress = elapsed / SPIN_DURATION;
                const easedSpeed = SPIN_SPEED * (1 - d3.easeCubicInOut(Math.min(progress, 1)));
                const rot = projection.rotate();
                projection.rotate([rot[0] + easedSpeed * 16.67, rot[1], rot[2]]);

                if (elapsed > SPIN_DURATION) {
                    animPhase = 'fly';
                    flyStart = ts;
                    flyFrom = [...projection.rotate()] as [number, number, number];
                }

            } else if (animPhase === 'fly') {
                if (!flyStart || !flyFrom) {
                    flyStart = ts;
                    flyFrom = [...projection.rotate()] as [number, number, number];
                }
                const t = Math.min((ts - flyStart) / FLY_DURATION, 1);
                const e = d3.easeCubicInOut(t);

                projection.rotate([
                    flyFrom[0] + (TARGET_ROT[0] - flyFrom[0]) * e,
                    flyFrom[1] + (TARGET_ROT[1] - flyFrom[1]) * e,
                    0,
                ]);

                if (t >= 1) {
                    animPhase = 'idle';
                    idleRot = [...TARGET_ROT];
                    markerVisible = true;
                    setBadgeVisible(true);
                    setTimeout(() => setTapeVisible(true), 400);
                }

            } else if (animPhase === 'idle' && idleRot) {
                idleRot[0] += 0.005;
                projection.rotate([idleRot[0], idleRot[1], 0]);
            }

            drawGraticule();
            if (landFeat) drawLand(landFeat, borderMesh);
            updateMarker();

            rafRef.current = requestAnimationFrame(tick);
        }

        // ── Fetch world atlas ─────────────────────────────────────────────────
        fetch(`${import.meta.env.BASE_URL}data/world-110m.json`)
            .then(r => r.json())
            .then((world: WorldTopology) => {
                // Merged landmass (clean fill, no interior borders)
                landFeat = feature(world, world.objects.land);
                // Mesh of ONLY shared country borders (no coastlines)
                borderMesh = mesh(world, world.objects.countries, (a, b) => a !== b);
                rafRef.current = requestAnimationFrame(tick);
            })
            .catch(() => {
                rafRef.current = requestAnimationFrame(tick);
            });

        return () => {
            cancelAnimationFrame(rafRef.current);
            if (pulseTimer) clearTimeout(pulseTimer);
        };
    }, []);

    return (
        <section
            className="globe-hero"
            aria-label="Mapa do globo mostrando Pindamonhangaba"
        >
            <div className="globe-hero__grain" aria-hidden="true" />
            <div className="globe-hero__glow" aria-hidden="true" />

            {/* ── LEFT: Text ───────────────────────────────────────────────── */}
            <div className={`globe-hero__text${textVisible ? ' globe-hero__text--visible' : ''}`}>
                <p className="globe-hero__eyebrow">
                    Pindamonhangaba · SP · Brasil
                </p>

                <h1 className="globe-hero__title">
                    LOCAL<br />
                    <em>HEATMAP</em><br />
                </h1>

                <div className="globe-hero__divider" aria-hidden="true" />

                <p className="globe-hero__sub">
                    Uma história contada por dados climáticos.
                </p>

                <div className="globe-hero__meta-grid">
                    <div className="globe-hero__meta-item">
                        <strong>−22.9250°, −45.4620°</strong>
                        Coordenadas
                    </div>
                    <div className="globe-hero__meta-item">
                        <strong>554 m</strong>
                        Altitude
                    </div>
                    <div className="globe-hero__meta-item">
                        <strong>1940 – 2025</strong>
                        Período analisado
                    </div>
                    <div className="globe-hero__meta-item">
                        <strong>ERA5 · Open-Meteo</strong>
                        Fonte de dados
                    </div>
                </div>

                <a className="globe-hero__cta" href="#hottest">
                    Explorar os dados
                    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path
                            d="M2 7h10M8 3l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </a>
            </div>

            {/* ── RIGHT: Globe ─────────────────────────────────────────────── */}
            <div className="globe-hero__globe-wrap">
                <svg
                    ref={svgRef}
                    id="globe-canvas"
                    viewBox={`0 0 ${W} ${H}`}
                    className="globe-hero__svg"
                    role="img"
                    aria-label="Globo terrestre com marcador em Pindamonhangaba"
                    xmlns="http://www.w3.org/2000/svg"
                />
                <div
                    className={`globe-hero__coords-badge${badgeVisible ? ' globe-hero__coords-badge--visible' : ''}`}
                    aria-live="polite"
                >
                    Localização confirmada · 31.412 dias de dados
                </div>
            </div>

            {/* ── Bottom tape ───────────────────────────────────────────────── */}
            <div
                className={`globe-hero__tape${tapeVisible ? ' globe-hero__tape--visible' : ''}`}
                aria-hidden="true"
            >
                Open-Meteo Historical Weather API · ERA5 Reanalysis · 1940–2025
            </div>
        </section>
    );
}
