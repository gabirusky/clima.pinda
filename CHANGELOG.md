# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Project scaffolding: `.gitignore`, `LICENSE`, `README.md`, `CHANGELOG.md`
- Python data pipeline structure: `data/scripts/`, `data/notebooks/`, `data/raw/`, `data/processed/`
- Python dependencies: `data/requirements.txt`, `data/environment.yml`
- Planning documents: `PLAN.md`, `TASKS.md`, `CONTEXT.md`
- **Task 3.3** — `data/scripts/generate_web_data.py`: web data generator producing three JSON files:
  - `public/data/climate_data.json` — 31,412 daily records; auto-gzip from 4,309 KB → 425 KB
  - `public/data/metrics.json` — 86 annual ETCCDI metric entries keyed by year
<<<<<<< HEAD
  - `public/data/summary.json` — headline stats: hottest day (1961-09-28, 38.2°C), coldest day (1979-06-01, 1.3°C), longest warm spell (82 days · 2018 · WSDI), SU30 trend (+7.09 days/decade, p < 0.0001), decade comparison table, temperature anomaly series
  - Fixed `ROOT` path resolution (`parent × 3`) so the script correctly locates processed CSVs from `data/scripts/`
- **Phase 4 — Frontend Foundation** (all tasks complete):
  - `src/main.tsx` — React 18 entry point with StrictMode
  - `index.html` — title, meta description, Open Graph, Twitter Card, Google Fonts (Syne + DM Sans + JetBrains Mono), CSP meta tag, Schema.org Dataset JSON-LD
  - `src/index.css` — Tailwind v4 CSS-first `@theme {}` with temperature color scale, Ed Hawkins stripe palette, dark mode `@custom-variant`, keyframes (`stripeReveal`, `slideUp`, `pulseHot`, `fadeIn`, `spin`), base dark-navy typography
  - `src/types/climate.ts` — fully rewritten to match exact JSON field names from Phase 3 pipeline: ETCCDI-aligned `AnnualMetrics` (su25/su30/tr20/dtr_mean/wsdi_days/tx90p/tn90p/cdd/cwd/gdd/p95_days/anomaly), updated `ClimateSummary` (longest_warm_spell/year_most_su30/su30_trend_slope_per_decade/decade_comparison)
  - `src/constants/thresholds.ts` — ETCCDI-aligned constants (SU25/SU30/TR20 thresholds, WSDI baseline 1961–1990, anomaly baseline 1940–1980, DRY/WET day thresholds)
  - `src/constants/config.ts` — LAT, LON, START_YEAR, END_YEAR, DATA_BASE_URL, REPO_BASE
  - `src/utils/colors.ts` — `tempToColor`, `anomalyToStripeColor` (Ed Hawkins 9-color palette), `su30ToColor`, `precipToColor`, `lerpColor`
  - `src/utils/formatters.ts` — pt-BR localized: `formatTemp`, `formatDate`, `formatDateShort`, `formatDecade`, `formatSlope`, `formatPercent`, `formatNumber`, `formatDayOfYear`
  - `src/utils/calculations.ts` — pure statistical functions: `linearRegression` (OLS with R²/p-value), `movingAverage`, `percentile`, `kernelDensityEstimator` (Epanechnikov), `mean`, `stdDev`, `clamp`, `normalize`, `trendLine`, `predictY`
  - `src/utils/dataProcessing.ts` — `groupByYear`, `groupByDecade`, `filterByYear/Range`, `metricsToArray`, `extractTimeSeries`, `countDaysAboveThreshold`, `monthlyAverages`, `getYears`, `getDecades`
  - `src/hooks/useClimateData.ts` — parallel fetch of all 3 JSON files; metrics string→number key coercion; typed return
  - `src/hooks/useScrollPosition.ts` — rAF-throttled scroll position hook
  - `src/hooks/useWindowSize.ts` — 200ms-debounced window size hook
  - `src/components/common/LoadingSpinner.tsx` — animated SVG spinner with ARIA role
  - `src/components/common/ErrorBoundary.tsx` — class component error boundary with retry button
  - `src/components/common/Tooltip.tsx` — positioned tooltip with auto horizontal-flip overflow detection
  - `src/components/common/DataTable.tsx` — visually-hidden accessible data table alternative for charts (WCAG 2.1 AA)
  - `src/components/common/SectionTitle.tsx` — Framer Motion animated `<h2>` with sliding underline, kicker, and description
  - TypeScript: 0 errors (`tsc --noEmit` clean)

### Changed
- **Phase 3 now complete**: all three data-processing scripts (3.1 clean, 3.2 metrics, 3.3 web data) are done; `public/data/` is ready for frontend consumption
- **Phase 4 now complete**: full TypeScript frontend foundation is in place; dev server smoke-test confirms data loads and renders correctly
=======
  - `public/data/summary.json` — hottest day (1961-09-28, 38.2°C), coldest day (1979-06-01, 1.3°C), longest warm spell (82 days · 2018 · WSDI), SU30 trend (+7.09 days/decade, p < 0.0001), decade comparison, anomaly series
  - Fixed `ROOT` path resolution so script correctly locates processed CSVs from `data/scripts/`

### Changed
- **Design concept adopted**: *"A City's Memory of Heat"* — scrollytelling data experience treating time as geological strata. Ambient background gradient shifts with scroll position (cool blues → burning reds). Typography: Syne (display) + DM Sans (body) + JetBrains Mono (calculator). Key stats at 120–160px.
- **Phase 3 now complete**: all three data-processing scripts (clean · metrics · web data) are done; `public/data/` is ready for frontend consumption
- `README.md`, `PLAN.md`, `TASKS.md`, `CONTEXT.md`, `SKILL.md` updated to reflect the new design direction

### Phase 4 — Frontend Foundation ✅ Complete

**Entry point & HTML**
- `index.html` — title updated to *"A Memória de Calor de uma Cidade"*; OG/Twitter tags, Google Fonts (Syne + DM Sans + JetBrains Mono), Schema.org JSON-LD, CSP meta
- `src/App.tsx` — wired `useScrollProgress` (scroll-driven ambient background); smoke-test layout with design language typography

**CSS Design System (`src/index.css`)**
- Full `@theme {}` with Ed Hawkins 8-stop stripe palette (`--color-stripe-deep-cold` → `--color-stripe-extreme`), text tokens (`--color-text-primary` #f0ece3, `--color-text-secondary`, `--color-text-accent`), surface tokens, complete type scale (`--text-display-xl` 80–160px clamp → `--text-caption`)
- New keyframes: `drawLine` (stroke-dashoffset for timeline charts) and `heatShimmer` (count-up glow for StatCallout)
- Scroll-driven body background: `radial-gradient` with `color-mix(in srgb, ...)` consuming `--scroll-heat` — shifts from cool blue (#2166ac) to burning red (#67001f)
- Scrollytelling CSS utilities: `.sticky-viz`, `.scroll-step` (min-height 100vh), `.section-block`, `.prose-block`, `.glass` (backdrop-blur)
- `prefers-reduced-motion`: all animation durations → 0.01ms

**TypeScript Types (`src/types/climate.ts`)** — complete rewrite
- `AnnualMetrics` aligned to actual JSON: WSDI/CDD/CWD/TX90p/TN90p replace old HWDI fields
- `ClimateSummary` aligned: `longest_warm_spell` (WSDI record), `decade_comparison` dict with correct columns

**Constants (`src/constants/thresholds.ts`)** — rewritten
- ETCCDI-named exports: `SU30_THRESHOLD`, `WSDI_MIN_DURATION=6`, `WSDI_BASELINE_START/END` (1961–1990), `STRIPES_BASELINE_START/END` (1940–1980, Ed Hawkins convention)

**Utilities (all new)**
- `src/utils/colors.ts` — Ed Hawkins 10-stop RGB interpolation, `tempToHeatmapColor` (8-stop scale 10–40°C), `computeBaselineMean`, `decadeToColor`
- `src/utils/formatters.ts` — pt-BR locale formatters: dates, temperatures, anomalies, BRL currency, % and slope
- `src/utils/calculations.ts` — OLS regression, moving average, percentile (linear interpolation), **Gaussian KDE** (Silverman bandwidth, for RidgelinePlot), `clamp`, `lerp`
- `src/utils/dataProcessing.ts` — `groupByYear/Decade`, `filterByYear/Range`, `metricsToArray`, `decadalAverage`, `findRecordYear`, `dayOfWeek`

**New hook**
- `src/hooks/useScrollProgress.ts` — writes `--scroll-heat` to `document.documentElement` via rAF; no React re-renders; distinct from `useScrollPosition`

**Common components (partially Phase 5)**
- `LoadingSpinner.tsx` — upgraded to Framer Motion heat-pulse (three concentric warm rings)
- `SectionTitle.tsx` — Syne 800 at `--text-display-md`; animated underline `scaleX` on viewport entry
- `StatCallout.tsx` — massive number at `--text-display-xl` (80–160px); rAF count-up (1200ms cubic ease-out); warm glow `text-shadow`

**Verification**: `npx tsc --noEmit` → 0 errors

>>>>>>> 004c615 (feat: new plan and frontend foundation)

---

## [0.1.0] - 2026-02-18

### Added
- Initial project setup and planning documentation
- Full technical analysis and requirements document (`CLIMATE_DATA_PROJECT_ANALYSIS.md`)
