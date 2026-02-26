/**
 * Footer — attribution, links, download buttons.
 *
 * Design intent: Dark, minimal. Credit every data source.
 * Licenses clearly stated. GitHub link prominent.
 */
export default function Footer() {
    return (
        <footer
            role="contentinfo"
            style={{
                background: 'rgba(0,0,0,0.4)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: 'clamp(48px, 8vh, 80px) 1.5rem clamp(32px, 5vh, 56px)',
            }}
        >
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                {/* Logo line */}
                <p style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                    letterSpacing: '-0.02em',
                    color: 'var(--color-text-accent, #ef8a62)',
                    marginBottom: '0.5rem',
                }}>
                    GLOBAL HEATMAP: Pindamonhangaba
                </p>
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.8125rem',
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: '2rem',
                }}>
                    Pindamonhangaba, SP · 1940–2025 · ERA5 Reanalysis
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '2rem',
                    marginBottom: '2.5rem',
                }}>
                    {/* Data Sources */}
                    <div>
                        <h3 style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.4)',
                            marginBottom: '0.75rem',
                        }}>
                            Fontes de Dados
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>
                                <a
                                    href="https://open-meteo.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}
                                >
                                    Open-Meteo (ERA5 / Copernicus)
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://showyourstripes.info/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}
                                >
                                    Ed Hawkins — Climate Stripes
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://www.openstreetmap.org/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}
                                >
                                    © OpenStreetMap contributors
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Downloads */}
                    <div>
                        <h3 style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.4)',
                            marginBottom: '0.75rem',
                        }}>
                            Dados Abertos
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>
                                <a
                                    href="./data/climate_data.json"
                                    download
                                    style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}
                                >
                                    ↓ climate_data.json (31K registros)
                                </a>
                            </li>
                            <li>
                                <a
                                    href="./data/metrics.json"
                                    download
                                    style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}
                                >
                                    ↓ metrics.json (86 anos de índices)
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.4)',
                            marginBottom: '0.75rem',
                        }}>
                            Repositório
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>
                                <a
                                    href="https://github.com/gabirusky/clima.pinda"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}
                                >
                                    GitHub ↗
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* License line */}
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '1.5rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.25)',
                    }}>
                        Código: MIT · Dados: CC BY 4.0
                    </p>
                    <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.25)',
                    }}>
                        *Dados climáticos via ERA5 Reanalysis (ECMWF / Copernicus). Não constitui boletim oficial.*
                    </p>
                </div>
            </div>
        </footer>
    );
}
