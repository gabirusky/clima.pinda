# PLAN.md — *A City's Memory of Heat*
### Pindamonhangaba Climate Visualization

> **Concept**: An immersive, scrollytelling data experience that transforms 85 years of raw climate numbers into a visceral, human story about a single Brazilian valley slowly warming.

> **Design Rule**: If a user can read the whole page without *feeling* the heat — the design has failed.

> **Frontend Stack**: React 18 · Vite 5 · **TypeScript** · **shadcn/ui** · **Tailwind CSS v4**

---

## Architecture Overview

```
pindamonhangaba-climate/
├── data/
│   ├── scripts/                   # Python data pipeline
│   │   ├── fetch_climate_data.py
│   │   ├── validate_cross_source.py
│   │   ├── process_climate_data.py
│   │   ├── calculate_metrics.py
│   │   └── generate_web_data.py
│   ├── raw/                       # Raw API responses (gitignored)
│   ├── processed/                 # Cleaned CSVs (gitignored)
│   └── notebooks/
│       └── exploratory_analysis.ipynb
├── public/
│   └── data/
│       ├── climate_data.json      # Daily records (auto-gzip compressed)
│       ├── metrics.json           # Pre-computed annual ETCCDI metrics
│       └── summary.json           # Headline stats & decade comparison
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── layout/                # Header, Footer
│   │   ├── visualizations/        # D3 + Recharts chart components
│   │   ├── storytelling/          # Scrolly narrative sections
│   │   ├── widgets/               # Interactive controls
│   │   └── common/                # Shared UI primitives
│   ├── hooks/                     # useClimateData, useScrollProgress, useWindowSize
│   ├── utils/                     # dataProcessing, calculations, formatters, colors
│   ├── styles/                    # index.css (Tailwind v4 + design tokens)
│   └── constants/                 # config.ts, thresholds.ts
├── .github/workflows/
│   └── deploy.yml
└── docs/
    ├── API.md
    ├── DATA_SOURCES.md
    └── DEPLOYMENT.md
```

---

## Phase 1 — Data Acquisition (Python) ✅ Complete

**Primary Source**: Open-Meteo Historical Weather API (`https://archive-api.open-meteo.com/v1/archive`)
- Coordinates: lat=-22.9250, lon=-45.4620 (Pindamonhangaba, SP, Brazil)
- Date range: 1940-01-01 → 2025-12-31
- Timezone: `America/Sao_Paulo`
- Parameters: `temperature_2m_max`, `temperature_2m_min`, `temperature_2m_mean`, `precipitation_sum`, `relative_humidity_2m_mean`, `windspeed_10m_max`

**Script**: `data/scripts/fetch_climate_data.py`
- Chunked yearly requests with retry + exponential backoff (3 retries: 1s, 2s, 4s)
- Cache raw JSON per year to `data/raw/year_{year}.json` (skip if exists)
- Merge into single CSV: `data/raw/pindamonhangaba_1940_2025.csv`

**Deliverable**: `data/raw/pindamonhangaba_1940_2025.csv`

---

## Phase 2 — Data Processing (Python) ✅ Complete

**Script**: `data/scripts/process_climate_data.py`
- Load raw CSV, interpolate gaps ≤3 days, flag longer gaps
- Validate: T_min ≤ T_mean ≤ T_max, precipitation ≥ 0, bounds check
- Round temperatures (1dp), precipitation (2dp)
- Save cleaned CSV: `data/processed/pindamonhangaba_clean.csv`

**Script**: `data/scripts/calculate_metrics.py`

> **ETCCDI Alignment**: All indices follow the [ETCCDI 27-index standard](http://etccdi.pacificclimate.org/list_27_indices.shtml).

### Core Metrics (per year)
| Metric | ETCCDI Index | Definition |
|--------|-------------|------------|
| SU25 | SU25 ✅ | Days where T_max ≥ 25°C |
| SU30 | SU30 (modified) | Days where T_max ≥ 30°C |
| TR20 | TR20 ✅ | Nights where T_min ≥ 20°C |
| DTR | DTR ✅ | Mean(T_max − T_min) per year |
| WSDI | WSDI ✅ | Days in warm spells ≥6 consecutive above calendar-day p90 (1961–1990 baseline) |
| TX90p | TX90p ✅ | % days where T_max > calendar-day p90 baseline |
| TN90p | TN90p ✅ | % nights where T_min > calendar-day p90 baseline |
| CDD | CDD ✅ | Max consecutive dry days (precip < 1mm) |
| CWD | CWD ✅ | Max consecutive wet days (precip ≥ 1mm) |
| GDD | — | Growing Degree Days: SUM(MAX(0, (T_max+T_min)/2 − 10)) |

**Script**: `data/scripts/generate_web_data.py`
- `public/data/climate_data.json` — 31,412 daily records
- `public/data/metrics.json` — annual metrics keyed by year
- `public/data/summary.json` — hottest day, WSDI record, trend slope, decade comparison, anomaly series

---

<<<<<<< HEAD
## Phase 3 — Frontend Setup (React + Vite + TypeScript + shadcn/ui) ✅ Complete

> All scaffolding tasks from Phase 1.3 of TASKS.md are done. The dev server runs (`npm run dev`),
> TypeScript compiles with 0 errors, and the smoke test confirms real climate data is loaded and rendered.
=======
## Phase 3 — Frontend Foundation
>>>>>>> 004c615 (feat: new plan and frontend foundation)

**Stack**:
- **React 18** + **Vite 5** + **TypeScript** (strict mode)
- **Tailwind CSS v4** (CSS-first config — `@theme {}` in `src/index.css`, no `tailwind.config.js`)
- **shadcn/ui** (Radix primitives, components owned by the project)
- **D3.js v7**, **Recharts**, **Framer Motion 11+**, **Scrollama.js**, **Leaflet.js**

### Design Tokens (`src/index.css` `@theme {}`)

```css
@import "tailwindcss";

@theme {
  /* Typography — "A City's Memory of Heat" */
  --font-display: 'Syne', sans-serif;       /* Geometric, unsettling at 160px */
  --font-body: 'DM Sans', sans-serif;       /* Warm, readable */
  --font-mono: 'JetBrains Mono', monospace; /* Receipt-style calculator */

  /* Background */
  --color-base: #0a0f1e;

  /* Climate stripes (Ed Hawkins) */
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

  /* Text */
  --color-text-primary: #f0ece3;
  --color-text-secondary: #a09080;
  --color-text-accent: #ef8a62;

  /* Type scale */
  --text-display-xl: clamp(80px, 12vw, 160px);
  --text-display-lg: clamp(48px, 7vw, 96px);
  --text-display-md: clamp(32px, 4.5vw, 56px);
}
```

<<<<<<< HEAD
**Design Direction** (per SKILL.md):
- **Tone**: Editorial / data-journalism — think NYT Climate desk, The Pudding
- **Typography**: Syne (display, bold geometric) + DM Sans (body) — loaded from Google Fonts
- **Color**: Deep navy background (#0a0f1e) with warm amber/red temperature accents. Dark theme by default.
- **Motion**: Staggered scroll reveals via Framer Motion `whileInView`. Climate stripes animate left-to-right on entry.
- **Differentiation**: Full-bleed climate stripes as hero background. Data as art.

## Phase 4 — Frontend Foundation ✅ Complete

> All TASKS.md § 4.1–4.6 tasks are done. TypeScript: 0 errors. Dev server smoke test: passed.

### 4.1 Entry Point & HTML
- `src/main.tsx` — React 18 StrictMode entry point
- `index.html` — SEO meta tags, Open Graph, Twitter Card, Google Fonts (Syne + DM Sans + JetBrains Mono), CSP, Schema.org Dataset JSON-LD

### 4.2 Design System
- `src/index.css` — Tailwind v4 `@import "tailwindcss"` + `@theme {}` with Ed Hawkins stripe palette, temperature color scale, dark mode `@custom-variant`, keyframes (`stripeReveal`, `slideUp`, `pulseHot`, `fadeIn`)

### 4.3 TypeScript Types (`src/types/climate.ts`)
- `DailyRecord`, `AnnualMetrics` (ETCCDI: su25/su30/tr20/dtr_mean/wsdi_days/tx90p/tn90p/cdd/cwd/gdd/p95_days/anomaly/first_hot_day/last_hot_day), `DecadalMetrics`, `ClimateSummary` (longest_warm_spell/year_most_su30/su30_trend_slope_per_decade/decade_comparison/temp_anomaly_by_year)

### 4.4 Constants
- `src/constants/config.ts` — LAT, LON, START_YEAR, END_YEAR, DATA_BASE_URL (Vite BASE_URL aware), REPO_BASE
- `src/constants/thresholds.ts` — ETCCDI: SU25/SU30/TR20, WSDI_MIN_DURATION=6, WSDI_BASELINE_START/END=1961/1990, DRY/WET_DAY_THRESHOLD=1, ANOMALY_BASELINE_START/END=1940/1980

### 4.5 Utility Functions (all pure, no side effects)
| Module | Key functions |
|--------|---------------|
| `src/utils/colors.ts` | `tempToColor`, `anomalyToStripeColor` (Ed Hawkins 9-color), `su30ToColor`, `precipToColor`, `lerpColor` |
| `src/utils/formatters.ts` | `formatTemp`, `formatDate`, `formatDateShort`, `formatDecade`, `formatSlope`, `formatPercent`, `formatNumber`, `formatDayOfYear` — all pt-BR |
| `src/utils/calculations.ts` | `linearRegression` (OLS, R², p-value), `movingAverage`, `percentile`, `kernelDensityEstimator` (Epanechnikov), `mean`, `stdDev`, `clamp`, `normalize`, `trendLine` |
| `src/utils/dataProcessing.ts` | `groupByYear`, `groupByDecade`, `groupMetricsByDecade`, `filterByYear/Range`, `metricsToArray`, `extractTimeSeries`, `countDaysAboveThreshold`, `monthlyAverages`, `getYears/Decades` |
| `src/lib/utils.ts` | `cn()` — shadcn/ui class merger |

### 4.6 Custom Hooks
- `useClimateData` — parallel fetch climate_data.json + metrics.json + summary.json; JSON string→number key coercion for metrics
- `useScrollPosition` — rAF-throttled `window.scrollY`
- `useWindowSize` — 200ms-debounced `{width, height}`

### Common Components
- `LoadingSpinner` — animated SVG + ARIA role="status"
- `ErrorBoundary` — class component with retry button
- `Tooltip` — positioned div with auto horizontal-flip overflow detection
- `DataTable` — visually-hidden accessible chart alternative (WCAG 2.1 AA)
- `SectionTitle` — Framer Motion `<h2>` with kicker, sliding underline animation, description

**Deliverable**: All Phase 4 types, utils, hooks, and common components are in place. Phase 5 (Layout Components) is next.
=======
### Key Keyframes (`src/index.css`)
- `stripeReveal` — left-to-right stagger for hero climate stripes
- `slideUp` — section entrance (opacity 0 → 1, y 32 → 0)
- `pulseHot` — used for record-year highlights and receipt total
- `drawLine` — stroke-dashoffset trick for timeline chart
>>>>>>> 004c615 (feat: new plan and frontend foundation)

---

## Phase 4 — Visualizations

### 4.1 Climate Stripes (`ClimateStripes.tsx`)
> **Design intent**: Not a chart. A *painting*. Full-bleed, tall, slightly blurred.

- SVG 100% width × 100vh, one `<rect>` per year (1940–2025)
- Color: `d3.scaleSequential(d3.interpolateRdBu)` centered on 1940–1980 mean
- On hover: year label fades in below the stripe; brightness lifts
- **Animation**: stripes reveal left-to-right, 8ms/stripe stagger (~700ms total)
- Accessibility: `role="img"`, `aria-label`, `<title>` per rect

### 4.2 Calendar Heatmap (`CalendarHeatmap.tsx`)
> **Design intent**: Fills day-by-day like a timelapse of a summer getting longer.

- D3.js 53-column × 7-row grid; `d3.timeMonday` (Brazilian week start)
- Color: `d3.interpolateRdYlBu` reversed, domain [10°C, 40°C]
- SU30 days: dot marker. TR20 nights: border highlight.
- **Animation on scroll**: cells fill chronologically, 2ms/day (~730ms total)
- Year selector dropdown; hover tooltip; click → day detail modal

### 4.3 Ridgeline Plot (`RidgelinePlot.tsx`)
> **Design intent**: Rightward drift reveals one decade at a time.

- D3.js KDE density curves, one per decade (1940s–2020s)
- Color: cool blues → warm reds by decade (temperature encoded in the curves themselves)
- 30°C reference line in `--color-stripe-burning`
- **Animation**: decades reveal oldest-to-newest, 300ms each on scroll entry

### 4.4 Time Series Chart (`TimeSeriesChart.tsx`)
- Recharts `LineChart` with trend line overlay (dashed, computed OLS)
- Metric toggle buttons: SU30, TR20, DTR, WSDI, CDD, CWD
- Record years: custom `<Dot>` in `--color-stripe-extreme`
- `<Brush>` for zoom/pan

### 4.5 Comparative Bar Chart (`ComparativeBarChart.tsx`)
- Recharts grouped `BarChart`, decadal averages
- Color: SU30 (hot), TR20 (warm), WSDI (burning)
- Bars animate from baseline on scroll entry

### 4.6 Interactive Map (`InteractiveMap.tsx`)
- Leaflet.js, centered on [-22.9250, -45.4620], zoom=12
- OpenStreetMap tiles; marker popup: location + data coverage
- Dark tile layer to match site palette

### 4.7 Radial Chart (`RadialChart.tsx`)
- D3.js polar chart, 12 monthly segments, radius = temperature
- One path per decade, color-coded cool → hot
- Radial grid at 10°C, 20°C, 30°C

---

## Phase 5 — Scrollytelling Sections

**Library**: Scrollama.js — triggers visualization state changes on scroll progress

### Scrolly Architecture
- `ScrollySection.tsx`: sticky viz container left/right + scrollable steps column
- `offset: 0.5` — chapter triggers at viewport midpoint
- Step prose: DM Sans, 1.125rem, max-width 600px
- Visualization: sticky, 100vh, full right side (desktop); stacks below on mobile

### Chapters

| # | Section Component | Visualization | Emotional Beat |
|---|---|---|---|
| 1 | `IntroSection` | ClimateStripes (hero, full-bleed) | The whole arc. 85 years in one glance. |
| 2 | `SummerSection` | SU30 bar chart (animated by decade) | Summer is no longer a season. It's a climate state. |
| 3 | `TropicalNightsSection` | CalendarHeatmap (TR20 highlighted) | The night is supposed to be a refuge. |
| 4 | `HeatWaveSection` | WSDI timeline | What used to be an exception is now the rhythm. |
| 5 | `HottestDaySection` | Record card + CalendarHeatmap | 38.2°C. September 28, 1961. |
| 6 | `CostSection` | AC Calculator (receipt layout) | The math is simple. The total is not. |
| 7 | `FutureSection` | Trend extrapolation to 2050 + uncertainty band | A question left open. |

---

## Phase 6 — Interactive Widgets

### PersonalTimeline (`widgets/PersonalTimeline.tsx`)
> **Design intent**: When the user enters their birth year, the design shifts register — smaller type, softer light, intimate.

- Birth year input (min=1940, max=2025)
- Line chart: their lifetime mapped against SU30 trend
- `<motion.div>` transition on submit: scale-down + softer background glow
- Outputs: "In your lifetime, HD30 went from X to Y days/year. Your hottest year was [Z]."

### ACCalculator (`widgets/ACCalculator.tsx`)
> **Design intent**: A receipt. Monospaced. Uncomfortable.

- JetBrains Mono throughout
- Year selector → computes `hours_above_25 × 0.5kW × electricity_rate`
- Itemized rows → `TOTAL AC HOURS:` with hairline rule above
- Final cost blinks once (`pulseHot` keyframe)
- Editable electricity rate input (default R$0.80/kWh)

### ThresholdSlider (`widgets/ThresholdSlider.tsx`)
- Range 25–35°C, step 0.5°C; real-time SU-x recalculation

### YearSelector (`widgets/YearSelector.tsx`)
- Two dropdowns, side-by-side comparison table
- Cells: red = Year B > Year A, blue = Year B < Year A

---

## Phase 7 — Polish & Deployment

### Scroll-driven Background
- `useScrollProgress` hook computes `[0, 1]` scroll position
- Updates CSS custom property `--scroll-heat` on `document.documentElement`
- `body` background gradient shifts: deep navy + cool blue → navy + burning red

### Performance Targets
- FCP < 1.5s · LCP < 2.5s · TTI < 3.5s · CLS < 0.1
- Lazy-load all visualization components: `React.lazy` + `<Suspense>`
- Calendar Heatmap → Canvas if jank detected (>1000 cells)
- Gzip: `climate_data.json` auto-compressed (4MB → ~430KB)

### Accessibility (WCAG 2.1 AA)
- All SVG: `role="img"`, `aria-label`, `<title>`, `<desc>`
- `prefers-reduced-motion`: all animations reduced to instant state changes
- Color contrast ≥ 4.5:1 text, 3:1 graphics
- Full keyboard navigation
- Colorblind-safe: Viridis alternative for sequential scales

### Deployment (GitHub Actions)
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '0 6 1 1 *'   # Annual data refresh
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./dist }
  deploy:
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

---

## Success Criteria

| Category | Criterion |
|----------|-----------|
| Data | 85+ years, >95% completeness, no T_min > T_max. Cross-validated ERA5 vs MERRA-2 r=0.89/0.93, RMSE<2°C ✅ |
| Design | Every section shifts color temperature as user scrolls. Numbers at 120–160px. |
| Animations | Every chart entrance earned by scroll. No pop-ins. |
| Emotional | A non-scientist reader feels the heat before they read a single number. |
| Performance | Lighthouse > 90 all categories |
| Accessibility | Zero WAVE/axe violations; `prefers-reduced-motion` respected |
| Deployment | Auto-deploy on push to main |
