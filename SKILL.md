---
name: cidade-memoria-calor
description: >
  Design system and frontend implementation guide for the "A City's Memory of Heat"
  climate data experience — an immersive scrollytelling site for 85 years of
  Pindamonhangaba climate data. Use this skill when building any component,
  section, animation, or visual element for this project.
license: Complete terms in LICENSE.txt
---

# A City's Memory of Heat — Design System & Skill Guide

> *"Cold data, warm story."*

This skill governs every pixel, animation, and typographic choice in the Pindamonhangaba climate visualization. The design lives at the intersection of **Stripe's engineering precision** and **a climate scientist's fever dream**. Every animation must hit like a gut punch. Every number must have physical weight.

**The one rule**: If a user can read the whole page without *feeling* the heat — the design has failed.

---

## Core Metaphor — Geological Layers

Treat time as sediment strata. The deeper the user scrolls, the further back in time they travel — drilling through decades of heat rings like the cross-section of a tree or a sediment core. Scrolling back toward the present means colors intensify: reds bleeding through blues, as if the rock itself is **heating up**.

This metaphor governs:
- **Scroll direction**: older data = deeper in the page
- **Color progression**: cool blues dominate early sections, hot reds dominate recent ones
- **Background**: the ambient gradient beneath *all content* shifts with scroll position — the page temperature changes beneath the user's hands

---

## Typography

### Fonts
- **Syne** — display headlines, section titles, key statistics
  - Load from Google Fonts: `Syne:wght@400;700;800`
  - At large sizes (120–160px), Syne becomes geometric and slightly unsettling — this is intentional
  - Key stats like `+2.4°C` or `140 DAYS` should live at 120–160px minimum
- **DM Sans** — body copy, captions, annotations
  - Load from Google Fonts: `DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700`
  - Warm, readable, approachable — the contrast to Syne's weight
- **JetBrains Mono** — the AC Calculator, data tables, any receipt-style layout
  - Monospaced numbers. Stark. Uncomfortable.

### Scale
```css
--text-display-xl: clamp(80px, 12vw, 160px);   /* Key stats: "+2.4°C" */
--text-display-lg: clamp(48px, 7vw, 96px);      /* Section heroes */
--text-display-md: clamp(32px, 4.5vw, 56px);    /* Sub-headlines */
--text-body-lg: 1.25rem;
--text-body: 1.125rem;
--text-caption: 0.875rem;
--text-mono: 0.9rem;
```

---

## Color System — Ed Hawkins Climate Stripes

The anchor is the [Ed Hawkins showyourstripes.info](https://showyourstripes.info/) palette. But this is not a simple band — it is an **ambient background gradient** that shifts as the user scrolls.

### Core Palette

```css
/* Background */
--color-base: #0a0f1e;          /* Deep navy — the void between data */

/* Climate stripes (Ed Hawkins original) */
--color-stripe-deep-cold: #08306b;
--color-stripe-cold: #2166ac;
--color-stripe-cool: #4393c3;
--color-stripe-neutral: #f7f7f7;
--color-stripe-warm: #ef8a62;
--color-stripe-hot: #d6604d;
--color-stripe-burning: #b2182b;
--color-stripe-extreme: #67001f;

/* Temperature semantic */
--color-temp-cold: #2166ac;
--color-temp-cool: #67a9cf;
--color-temp-mild: #d1e5f0;
--color-temp-warm: #fddbc7;
--color-temp-hot: #ef8a62;
--color-temp-very-hot: #b2182b;

/* Accent / surface */
--color-surface-1: rgba(255, 255, 255, 0.04);
--color-surface-2: rgba(255, 255, 255, 0.08);
--color-text-primary: #f0ece3;      /* Off-white, warm */
--color-text-secondary: #a09080;    /* Muted amber-grey */
--color-text-accent: #ef8a62;       /* Hot orange — key callouts */
```

### Scroll-Driven Gradient
The full-page background gradient is computed from `scrollY` position. Early sections (older data) → deep cool blues. Later sections (recent data) → warm reds bleeding through. Implement as a CSS custom property updated via JS:

```js
// In useScrollPosition or App.tsx
document.documentElement.style.setProperty('--scroll-heat', `${progress}`);
// 0.0 = 1940 (deep cool blue) → 1.0 = present (hot red)
```

```css
body {
  background: linear-gradient(
    180deg,
    color-mix(in oklch, var(--color-stripe-deep-cold) calc(100% - var(--scroll-heat) * 100%), var(--color-stripe-burning)),
    var(--color-base)
  );
}
```

---

## Section-by-Section Design Intent

### 1. Hero — The Painting

**Not a chart. A painting.**

- Full-bleed SVG climate stripes, 100vw × 100vh
- Stripes: tall, slightly blurred (`filter: blur(0.5px)`)
- Each stripe fades in on hover: `opacity: 0.4 → 1.0`, year label appears beneath
- Headline floats over stripes in Syne 800: *"Pindamonhangaba está esquentando. Aqui está a prova."*
- Sub-headline in DM Sans, small, below: coordinates · altitude · 85 years
- Scroll indicator: animated chevron, slow pulse

**Animation**: Stripes reveal left-to-right on load, staggered 8ms per stripe, total duration ~700ms.

### 2. Scrolly Chapters — Field Notebook Pages

Each chapter feels like turning a page in a climate field notebook:
- Dark paper texture (subtle, SVG noise overlay at 3% opacity)
- Data color bursts that break the texture — sudden, eye-shocking
- Step prose in DM Sans, 1.125rem, max-width 600px, left-aligned
- Visualization: sticky, right side (desktop) / below (mobile)

**Chapter entrance animation**: Evidence laid on a table. Slow reveal — 600ms ease-out, not instant pop-ins.

### 3. The Personal Timeline Widget — Intimate Scale

Emotional climax. The design shifts register:
- Birth year input: large, centered, DM Sans italic prompt
- On submit: the entire section transitions to softer light, ambient temperature drops
- Typography scales *down* — smaller type, generous line-height, reads like a private letter
- Mini chart: sparse, annotated, personal
- The user sees their own life mapped against a warming line

### 4. The AC Calculator — The Receipt

Makes the cost feel like a receipt from 2034:
- JetBrains Mono throughout
- Stark left-aligned layout, two columns (label / value)
- `TOTAL AC HOURS:` in caps, slightly larger, with a hairline rule above
- The final number lands with uncomfortable clarity — no decorative elements, just the math
- Electricity cost line: red, blinking cursor after the final bill total

---

## Micro-interaction Philosophy

Every chart entrance must be **earned by scrolling** — not instant pop-ins, but slow reveals, as if evidence is being laid on a table.

| Component | Animation |
|-----------|-----------|
| **Climate Stripes** | Left-to-right staggered reveal, 8ms per stripe |
| **Ridgeline Plot** | Reveals one decade at a time, oldest-to-newest, 300ms each |
| **Calendar Heatmap** | Fills day-by-day in forward time order, 2ms/day timelapse |
| **SU30 Bar Chart** | Bars grow from baseline, staggered 20ms per decade |
| **Personal Timeline** | Line draws from birth year to present, stroke-dasharray trick |
| **Number callouts** | Count-up from 0 to final value, 1200ms, easing-out |
| **AC Calculator total** | Subtotals tick up, then final total flashes once |

**Implementation pattern** (Framer Motion):
```tsx
<motion.div
  initial={{ opacity: 0, y: 32 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
/>
```

For D3 animations, use `.transition().duration(600).ease(d3.easeCubicOut)` as the standard.

---

## Layout Rules

- **Dark theme by default** — `background: var(--color-base)`, no light mode
- **Full-bleed sections** — most sections use `width: 100vw`, negative margin escapes if needed
- **Sticky visualizations** — `position: sticky; top: 0; height: 100vh` for scrolly panels
- **Prose max-width**: `max-width: 600px` — never let body text span full width
- **Hero type**: can go full-bleed, no max-width constraint
- **Generous vertical rhythm** — `padding-block: clamp(80px, 12vh, 160px)` between sections

---

## D3 Conventions

- **Color scale baseline**: Ed Hawkins 1940–1980 mean, **not** full dataset mean
- **Temperature heatmap**: `d3.scaleSequential(d3.interpolateRdYlBu).domain([10, 40])` reversed
- **Week start**: `d3.timeMonday` (Brazilian convention)
- **Clear before redraw**: always `d3.select(ref.current).selectAll('*').remove()`

---

## Naming & Structure

| Element | Convention |
|---------|-----------|
| Storytelling sections | `src/components/storytelling/` |
| Visualizations | `src/components/visualizations/` |
| Interactive widgets | `src/components/widgets/` |
| Design tokens | `@theme {}` block in `src/index.css` |
| Animation keyframes | `src/index.css` (not component-level) |
| Scroll progress hook | `src/hooks/useScrollProgress.ts` |

---

## Accessibility Floor

Even at maximum aesthetic intensity, these are non-negotiable:
- All SVG charts have `role="img"` + `aria-label`
- `<title>` + `<desc>` inside each SVG
- Color contrast ≥ 4.5:1 for all text
- `prefers-reduced-motion`: replace all animations with instant state changes
- All interactive elements keyboard-navigable

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## The Aesthetic Test

Before shipping any component, ask:
1. Does this feel like it was **designed** — or generated?
2. Does the typography have **physical weight**?
3. Does the animation surprise, or bore?
4. Does the color shift make the user **feel temperature**?
5. Would a climate scientist trust it? Would a first-time reader feel it?

If yes to all five — ship it.
