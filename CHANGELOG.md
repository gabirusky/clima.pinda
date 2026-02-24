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
- **Task 3.3** — `data/scripts/generate_web_data.py`: web data generator producing three JSON files for the React frontend
  - `public/data/climate_data.json` — 31,412 daily records; auto-gzip compressed from 4,309 KB → 425 KB (`.json.gz`)
  - `public/data/metrics.json` — 86 annual ETCCDI metric entries keyed by year
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

---

## [0.1.0] - 2026-02-18

### Added
- Initial project setup and planning documentation
- Full technical analysis and requirements document (`CLIMATE_DATA_PROJECT_ANALYSIS.md`)
