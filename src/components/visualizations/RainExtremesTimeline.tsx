import { useMemo } from 'react';
import type { RainMetrics } from '../../types/climate.ts';

interface RainExtremesTimelineProps {
    rainMetrics: Record<number, RainMetrics>;
    topCount?: number;
}

/**
 * RainExtremesTimeline — Displays the top `topCount` highest single-day precipitation events (Rx1day).
 */
export default function RainExtremesTimeline({ rainMetrics, topCount = 5 }: RainExtremesTimelineProps) {
    const topEvents = useMemo(() => {
        const events = Object.entries(rainMetrics).map(([year, yrData]) => ({
            year: parseInt(year, 10),
            rx1day: yrData.annual.rx1day,
        }));

        events.sort((a, b) => (b.rx1day ?? 0) - (a.rx1day ?? 0));
        return events.slice(0, Math.min(topCount, events.length)).filter(e => e.rx1day);
    }, [rainMetrics, topCount]);

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
            width: '100%'
        }}>
            <h3 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1.5rem',
                marginTop: 0
            }}>
                Top {topCount} Tempestades Extremas (Rx1day)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topEvents.map((event, i) => (
                    <div key={event.year} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '1rem',
                        borderBottom: i < topEvents.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(33, 102, 172, 0.2)',
                                color: '#67a9cf',
                                borderRadius: '50%',
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 600,
                                fontSize: '0.875rem'
                            }}>
                                {i + 1}
                            </span>
                            <span style={{
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 700,
                                fontSize: '1.25rem',
                                color: 'rgba(255,255,255,0.85)'
                            }}>
                                {event.year}
                            </span>
                        </div>
                        <div style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#d6604d'
                        }}>
                            {Math.round(event.rx1day! * 10) / 10} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>mm/dia</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
