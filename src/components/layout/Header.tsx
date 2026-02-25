import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
    { href: '#stripes', label: 'Clima' },
    { href: '#summer', label: 'Verão' },
    { href: '#nights', label: 'Noites' },
    { href: '#heatwaves', label: 'Ondas de Calor' },
    { href: '#hottest', label: 'Recorde' },
    { href: '#cost', label: 'Custo' },
    { href: '#future', label: 'Futuro' },
];

/**
 * Header — sticky navigation bar with backdrop blur.
 *
 * Design intent: Nearly invisible until the user scrolls.
 * Active section detected via IntersectionObserver.
 * Hamburger menu on mobile.
 */
export default function Header() {
    const [activeSection, setActiveSection] = useState<string>('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const observersRef = useRef<IntersectionObserver[]>([]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // IntersectionObserver for active section highlight
    useEffect(() => {
        const sections = NAV_LINKS.map(l => document.getElementById(l.href.slice(1))).filter(Boolean);

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveSection(`#${entry.target.id}`);
                    }
                }
            },
            { threshold: 0.3, rootMargin: '-20% 0px -60% 0px' },
        );

        sections.forEach(s => s && observer.observe(s));
        observersRef.current = [observer];
        return () => observer.disconnect();
    }, []);

    const handleNavClick = (href: string) => {
        setMenuOpen(false);
        const el = document.getElementById(href.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <header
            role="banner"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: scrolled
                    ? 'rgba(10, 15, 30, 0.85)'
                    : 'rgba(10, 15, 30, 0)',
                backdropFilter: scrolled ? 'blur(14px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
                transition: 'background 0.3s ease, border-color 0.3s ease',
            }}
        >
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 1.5rem',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                }}
            >
                {/* Logo / wordmark */}
                <a
                    href="#"
                    onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        letterSpacing: '-0.01em',
                        color: 'var(--color-text-accent, #ef8a62)',
                        textDecoration: 'none',
                        flexShrink: 0,
                    }}
                >
                    PINDA ·CLIMA
                </a>

                {/* Desktop nav */}
                <nav
                    aria-label="Navegação principal"
                    style={{ display: 'flex', gap: '0.25rem' }}
                    className="hidden-mobile"
                >
                    {NAV_LINKS.map(link => {
                        const isActive = activeSection === link.href;
                        return (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={e => { e.preventDefault(); handleNavClick(link.href); }}
                                style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.8125rem',
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive
                                        ? 'var(--color-text-accent, #ef8a62)'
                                        : 'rgba(255,255,255,0.55)',
                                    textDecoration: 'none',
                                    padding: '0.375rem 0.625rem',
                                    borderRadius: '4px',
                                    background: isActive ? 'rgba(239,138,98,0.08)' : 'transparent',
                                    transition: 'color 0.2s, background 0.2s',
                                    letterSpacing: '0.01em',
                                }}
                            >
                                {link.label}
                            </a>
                        );
                    })}
                </nav>

                {/* Hamburger (mobile) */}
                <button
                    aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(v => !v)}
                    style={{
                        display: 'none',
                        flexDirection: 'column',
                        gap: '5px',
                        padding: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-primary)',
                    }}
                    className="show-mobile"
                >
                    <span style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 1, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
                    <span style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 1, opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
                    <span style={{ display: 'block', width: 22, height: 2, background: 'currentColor', borderRadius: 1, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
                </button>
            </div>

            {/* Mobile menu dropdown */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.nav
                        key="mobile-nav"
                        aria-label="Navegação mobile"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            background: 'rgba(10, 15, 30, 0.97)',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ padding: '0.75rem 1.5rem 1rem' }}>
                            {NAV_LINKS.map(link => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={e => { e.preventDefault(); handleNavClick(link.href); }}
                                    style={{
                                        display: 'block',
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: '1rem',
                                        color: activeSection === link.href
                                            ? 'var(--color-text-accent)'
                                            : 'rgba(255,255,255,0.7)',
                                        textDecoration: 'none',
                                        padding: '0.625rem 0',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    }}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>

            <style>{`
                @media (min-width: 768px) {
                    .hidden-mobile { display: flex !important; }
                    .show-mobile { display: none !important; }
                }
                @media (max-width: 767px) {
                    .hidden-mobile { display: none !important; }
                    .show-mobile { display: flex !important; }
                }
            `}</style>
        </header>
    );
}
