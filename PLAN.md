# PLAN.md — Pindamonhangaba Climate Visualization

> **Goal**: Interactive, scrollytelling-driven climate data platform hosted on GitHub Pages analyzing 85+ years of historical data (1940–present) for Pindamonhangaba, SP, Brazil.

> **Frontend Stack**: React 18 · Vite 5 · **TypeScript** · **shadcn/ui** · **Tailwind CSS v4**

---

## Architecture Overview

```
pindamonhangaba-climate/
├── data/
│   ├── scripts/                  # Python data pipeline
│   │   ├── fetch_climate_data.py
│   │   ├── validate_cross_source.py  # ERA5 vs MERRA-2 cross-validation
│   │   ├── process_climate_data.py
│   │   ├── calculate_metrics.py
│   │   └── generate_web_data.py
│   ├── raw/                      # Raw API responses (gitignored)
│   ├── processed/                # Cleaned CSVs (gitignored)
│   └── notebooks/                # Jupyter exploration
│       └── exploratory_analysis.ipynb
├── public/
│   └── data/                     # JSON consumed by frontend
│       ├── climate_data.json     # Daily records (compressed)
│       ├── metrics.json          # Pre-computed annual metrics
│       └── summary.json          # Headline stats
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── layout/               # Header, Footer, Navigation
│   │   ├── visualizations/       # All chart components
│   │   ├── storytelling/         # Scrolly sections
│   │   ├── widgets/              # Interactive controls
│   │   └── common/               # Shared UI primitives
│   ├── hooks/                    # useClimateData, useScrollPosition, useWindowSize
│   ├── utils/                    # dataProcessing, calculations, formatters, colors
│   ├── styles/                   # index.css, variables.css, animations.css
│   └── constants/                # config.js, thresholds.js
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   ├── API.md
│   ├── DATA_SOURCES.md
│   └── DEPLOYMENT.md
├── .github/
│   └── workflows/
│       └── deploy.yml
├── package.json
├── vite.config.js
└── tsconfig.json
```

---

## Phase 1 — Data Acquisition (Python) ✅ Complete

**Primary Source**: Open-Meteo Historical Weather API (`https://archive-api.open-meteo.com/v1/archive`)
- Coordinates: lat=-22.9250, lon=-45.4620
- Date range: 1940-01-01 → 2025-12-31
- Timezone: `America/Sao_Paulo`
- Parameters: `temperature_2m_max`, `temperature_2m_min`, `temperature_2m_mean`, `precipitation_sum`, `relative_humidity_2m_mean`, `windspeed_10m_max`

**Script**: `data/scripts/fetch_climate_data.py`
- Chunked requests (max 1 year per call to avoid timeouts)
- Retry logic with exponential backoff (3 retries)
- Rate limiting: respect ~10,000 calls/day free tier
- Save raw JSON per year to `data/raw/`
- Merge into single CSV: `data/raw/pindamonhangaba_1940_2025.csv`

**Deliverable**: `data/raw/pindamonhangaba_1940_2025.csv`

---

## Phase 2 — Data Processing (Python) ✅ Complete

**Script**: `data/scripts/process_climate_data.py`
- Load raw CSV
- Handle missing values: linear interpolation for gaps ≤3 days; flag longer gaps
- Validate: assert T_min ≤ T_mean ≤ T_max; assert precipitation ≥ 0
- Round temperatures to 1 decimal place
- Save cleaned CSV: `data/processed/pindamonhangaba_clean.csv`

**Script**: `data/scripts/calculate_metrics.py`

> **ETCCDI Alignment**: All indices are defined according to or are direct adaptations of the ETCCDI 27-index standard, ensuring findings are comparable to peer-reviewed literature.

### Core Metrics (per year)
| Metric | ETCCDI Index | Definition |
|--------|-------------|------------|
| SU25 | SU25 ✅ exact | Days where T_max ≥ 25°C |
| SU30 | SU30 (modified) | Days where T_max ≥ 30°C (locally meaningful threshold) |
| TR20 | TR20 ✅ exact | Nights where T_min ≥ 20°C |
| DTR | DTR ✅ exact | Mean daily (T_max − T_min); long-term decrease = UHI fingerprint |
| WSDI | WSDI ✅ exact | Days in warm spells: ≥6 consecutive days with T_max > calendar-day 90th pct (1961–1990 baseline) |
| TX90p | TX90p ✅ exact | % of days where T_max > calendar-day 90th pct of baseline |
| TN90p | TN90p ✅ exact | % of nights where T_min > calendar-day 90th pct of baseline |
| CDD | CDD ✅ exact | Max consecutive dry days (precipitation < 1mm) |
| CWD | CWD ✅ exact | Max consecutive wet days (precipitation ≥ 1mm) |
| GDD | — | Growing Degree Days: SUM(MAX(0, (T_max+T_min)/2 − 10)) |
| P95 | — | Days above 95th percentile of full historical T_max |

### Temporal Analysis
- First/last day of year exceeding 30°C (seasonal shift); `null` if no hot days
- Decadal averages for all metrics
- Mann-Kendall trend test + linear regression slope for SU30, TR20, DTR, WSDI_days

**Script**: `data/scripts/generate_web_data.py`
- Produce `public/data/climate_data.json` — daily records (date, temp_max, temp_min, temp_mean, precip, humidity, wind)
- Produce `public/data/metrics.json` — annual metrics object keyed by year (ETCCDI-aligned columns: `su25`, `su30`, `tr20`, `dtr_mean`, `wsdi_days`, `tx90p`, `tn90p`, `cdd`, `cwd`, `gdd`, `p95_days`, `hot_season_length`, `anomaly`)
- Produce `public/data/summary.json` — headline stats (`hottest_day`, `longest_warm_spell` [WSDI], `su30_trend_slope_per_decade`, decade comparisons for SU30/TR20/WSDI/CDD/CWD)
- Gzip compress if payload > 500KB
- Round all floats to 1 decimal

**Deliverable**: `public/data/*.json`

---

## Phase 3 — Frontend Setup (React + Vite + TypeScript + shadcn/ui) ✅ Complete

> All scaffolding tasks from Phase 1.3 of TASKS.md are done. The dev server runs (`npm run dev`),
> TypeScript compiles with 0 errors, and the smoke test confirms real climate data is loaded and rendered.

**Stack**:
- **React 18** + **Vite 5** (build tool)
- **TypeScript** (strict mode)
- **Tailwind CSS v4** (styling — new CSS-first config, no tailwind.config.js)
- **shadcn/ui** (component library — Radix primitives + Tailwind; components copied into project for full ownership)
- **D3.js v7** (complex visualizations: stripes, ridgeline, calendar heatmap)
- **Recharts** (simple time-series and bar charts)
- **Framer Motion** (Motion library for React animations)
- **Scrollama.js** (scrollytelling)
- **Leaflet.js** (interactive map)

**Why shadcn/ui?** Unlike opinionated libraries (MUI, Ant Design), shadcn/ui gives full ownership of component code. Components are copied into the project, allowing deep customization — critical for the distinctive climate storytelling aesthetic.

**Init** (use Git Bash, not PowerShell):
```bash
# 1. Scaffold Vite + React + TypeScript
npm create vite@latest . -- --template react-ts

# 2. Install Tailwind CSS v4 (new CSS-first approach)
npm install tailwindcss @tailwindcss/vite

# 3. Install shadcn/ui dependencies
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-tooltip
npm install @radix-ui/react-select @radix-ui/react-slider @radix-ui/react-tabs

# 4. Initialize shadcn/ui
npx -y shadcn@latest init

# 5. Install visualization + storytelling libs
npm install d3 recharts framer-motion scrollama leaflet react-leaflet
npm install -D @types/d3 @types/leaflet @types/scrollama
```

**vite.config.ts** (Tailwind v4 uses Vite plugin, not PostCSS):
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/pindamonhangaba-climate/',
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: { manualChunks: { d3: ['d3'], recharts: ['recharts'], leaflet: ['leaflet', 'react-leaflet'] } }
    }
  },
  optimizeDeps: { include: ['scrollama'] }
})
```

**src/index.css** (Tailwind v4 CSS-first config — no tailwind.config.js needed):
```css
@import "tailwindcss";

@theme {
  /* Temperature scale */
  --color-temp-cold: #2166ac;
  --color-temp-cool: #67a9cf;
  --color-temp-mild: #d1e5f0;
  --color-temp-warm: #fddbc7;
  --color-temp-hot: #ef8a62;
  --color-temp-very-hot: #b2182b;
  /* Climate stripes (Ed Hawkins) */
  --color-stripe-cold: #08519c;
  --color-stripe-neutral: #ffffff;
  --color-stripe-hot: #a50f15;
  /* Fonts — distinctive, non-generic choices per SKILL.md */
  --font-display: 'Syne', sans-serif;     /* Bold, geometric display */
  --font-body: 'DM Sans', sans-serif;     /* Clean, readable body */
  --font-mono: 'JetBrains Mono', monospace;
}
```

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

---

## Phase 4 — Core Visualizations

### 4.1 Climate Stripes (`ClimateStripes.jsx`)
- SVG: 86 vertical bars, one per year (1940–2025)
- Color scale: diverging blue→white→red centered on 1940–1980 mean
- Hover tooltip: year + annual mean temperature
- Animated entrance on scroll (Framer Motion)

### 4.2 Calendar Heatmap (`CalendarHeatmap.jsx`)
- D3.js GitHub-style grid: 365 cells × selectable year
- Color: blue (cold) → red (hot) for T_max
- Hover: date + T_max + T_min + precipitation
- Click: modal with full day details
- Year selector dropdown

### 4.3 Ridgeline Plot (`RidgelinePlot.jsx`)
- D3.js stacked density plots
- X-axis: temperature (°C), Y-axis: decades (1940s–2020s)
- Shows rightward shift of distribution over time

### 4.4 Time Series Charts (`TimeSeriesChart.jsx`)
- Recharts LineChart
- Metrics: SU30, TR20, DTR, WSDI, CDD, CWD (toggle buttons)
- Trend line overlay (linear regression)
- Zoom/pan via Recharts brush
- Highlight record years

### 4.5 Comparative Bar Charts (`ComparativeBarChart.jsx`)
- Recharts BarChart
- Decadal averages: 1940s vs 1950s … vs 2020s
- Grouped bars: SU30, TR20, WSDI

### 4.6 Interactive Map (`InteractiveMap.jsx`)
- Leaflet.js centered on Pindamonhangaba (-22.9250, -45.4620)
- Marker with popup: location name + data coverage
- Temperature anomaly overlay (optional choropleth)

### 4.7 Radial Chart (`RadialChart.jsx`)
- D3.js polar/radial chart
- Monthly average temperatures by decade
- Overlay multiple decades for comparison

**Deliverable**: All visualization components rendering with real data

---

## Phase 5 — Scrollytelling Sections

**Library**: Scrollama.js — triggers visualization state changes on scroll progress

### Sections

| # | Title | Visualization | Key Stat |
|---|-------|--------------|----------|
| 1 | The Warming Valley | Climate Stripes (animated) | Δ avg temp since 1940 |
| 2 | The Summer That Never Ends | HD30 bar chart (animated) | Days >30°C: 1980s vs 2024 |
| 3 | Sleepless Nights | Calendar heatmap (TR20 highlighted) | TR20 % increase since 1940 |
| 4 | Heat Waves: The New Normal | Heat wave timeline | Longest heat wave: X days in [year] |
| 5 | The Hottest Day | Record card | Date, temperature, context |
| 6 | The Cost of Heat | AC Calculator widget | AC hours: 1990 vs 2024 |
| 7 | What's Next? | Trend extrapolation chart | Projected HD30 by 2050 |

**ScrollySection.jsx**: Generic wrapper — accepts `steps` array, calls `onStepEnter`/`onStepExit` callbacks to drive visualization state.

**Deliverable**: Complete scrollytelling narrative

---

## Phase 6 — Interactive Widgets

### YearSelector (`widgets/YearSelector.jsx`)
- Two dropdowns (Year A / Year B)
- Side-by-side comparison table of all metrics

### ThresholdSlider (`widgets/ThresholdSlider.jsx`)
- Range: 25°C–35°C (step 0.5°C)
- Recalculates days above threshold in real time
- Updates time series chart

### ACCalculator (`widgets/ACCalculator.jsx`)
- Input: year selection
- Formula: `SUM(hours where T > 25°C) * usage_factor`
- Output: estimated AC hours + cost estimate

### PersonalTimeline (`widgets/PersonalTimeline.jsx`)
- Input: birth year
- Output: climate summary for user's lifetime (HD30 trend, hottest year lived)

**Deliverable**: All widgets functional

---

## Phase 7 — Polish & Optimization

### Performance
- Lazy load all visualization components below fold (`React.lazy` + `Suspense`)
- Use WebP images with `<picture>` fallbacks
- Implement service worker (Vite PWA plugin)
- Canvas for Calendar Heatmap (>1000 data points)
- Debounce scroll events (16ms)
- Target: FCP <1.5s, LCP <2.5s, TTI <3.5s, CLS <0.1

### Accessibility (WCAG 2.1 AA)
- Colorblind-safe palettes (Viridis for sequential, ColorBrewer for diverging)
- Min contrast 4.5:1 text, 3:1 graphics
- ARIA labels on all SVG/Canvas elements
- Data table alternatives for all charts
- Full keyboard navigation
- Touch targets ≥44×44px

### SEO
- `<title>`: "Pindamonhangaba Climate Data | 85 Years of Temperature Trends"
- Meta description (150–160 chars)
- Open Graph + Twitter Card tags
- Schema.org Dataset JSON-LD
- `sitemap.xml`, `robots.txt`

### Cross-browser
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- iOS Safari 14+, Chrome Android 90+
- Polyfills for ES6+ via Vite legacy plugin

**Deliverable**: Lighthouse score >90 all categories

---

## Phase 8 — Deployment

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '0 6 1 1 *'   # Annual data refresh (Jan 1)
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
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./dist }
  deploy:
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**Deliverable**: Live site at `https://<user>.github.io/pindamonhangaba-climate/`

---

## Success Criteria

| Category | Criterion |
|----------|-----------|
| Data | 85+ years fetched, >95% completeness, no T_min > T_max. **Cross-validated:** ERA5 vs MERRA-2 r=0.89 (T_max), r=0.93 (T_min), RMSE<2°C ✅ |
| Performance | Lighthouse >90 all categories, FCP <1.5s |
| Accessibility | Zero WAVE/axe violations |
| Visualizations | All 7 charts render on desktop + mobile |
| Storytelling | All 7 scroll sections trigger correctly |
| Deployment | Auto-deploy on push to main |
