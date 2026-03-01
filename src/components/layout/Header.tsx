import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
    { href: '#stripes', label: 'Clima' },
    { href: '#summer', label: 'Verão' },
    { href: '#nights', label: 'Noites' },
    { href: '#heatwaves', label: 'Ondas de Calor' },
    { href: '#hottest', label: 'Recorde' },
    { href: '#chuvas', label: 'Chuvas' },

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
        const handleScroll = () => setScrolled(window.scrollY > window.innerHeight - 56);
        window.addEventListener('scroll', handleScroll, { passive: true });
        // Initial check in case of page reload halfway down
        handleScroll();
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
        if (el) {
            // Adjust offset for mobile vs desktop if needed, 80px is generally safe
            const offset = 80;
            const y = el.getBoundingClientRect().top + window.scrollY - offset;

            // Close menu FIRST and immediately to avoid fighting with scroll
            if (menuOpen) {
                setMenuOpen(false);
            }

            // Trigger scroll on next frame to ensure the state update doesn't block it
            requestAnimationFrame(() => {
                window.scrollTo({ top: y, behavior: 'smooth' });
            });
        }
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
                background: (scrolled || menuOpen)
                    ? 'rgba(10, 15, 30, 0.98)'
                    : 'rgba(10, 15, 30, 0)',
                backdropFilter: (scrolled || menuOpen) ? 'blur(14px)' : 'blur(0px)',
                WebkitBackdropFilter: (scrolled || menuOpen) ? 'blur(14px)' : 'blur(0px)',
                borderBottom: '1px solid',
                borderBottomColor: (scrolled || menuOpen) ? 'rgba(255,255,255,0.06)' : 'transparent',
                transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease, -webkit-backdrop-filter 0.4s ease',
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
                        fontFamily: "'Raleway', sans-serif",
                        fontWeight: 300,
                        fontSize: '1rem',
                        letterSpacing: '0.18em',
                        color: 'rgba(240,236,227,0.9)',
                        textDecoration: 'none',
                        flexShrink: 0,
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2em',
                    }}
                >
                    Pinda
                    <span style={{ color: 'var(--color-text-accent, #ef8a62)', fontWeight: 700 }}>Clima</span>
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
                    <div style={{ position: 'relative', width: 22, height: 16 }}>
                        <span style={{ position: 'absolute', top: 0, left: 0, width: 22, height: 2, background: 'currentColor', borderRadius: 1, transition: 'transform 0.2s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
                        <span style={{ position: 'absolute', top: 7, left: 0, width: 22, height: 2, background: 'currentColor', borderRadius: 1, opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
                        <span style={{ position: 'absolute', top: 14, left: 0, width: 22, height: 2, background: 'currentColor', borderRadius: 1, transition: 'transform 0.2s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
                    </div>
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
                                            ? 'var(--color-text-accent, #ef8a62)'
                                            : 'rgba(255,255,255,0.7)',
                                        textDecoration: 'none',
                                        padding: '1.25rem 0', // Even larger hit area for mobile
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        fontWeight: activeSection === link.href ? 600 : 400,
                                        transition: 'color 0.2s',
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
