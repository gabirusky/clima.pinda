# TASKS.md — *A City's Memory of Heat*
### Pindamonhangaba Climate Visualization

> Atomized coding tasks. Each task is a single, completable unit of work.
> Status: `[ ]` todo · `[/]` in progress · `[x]` done

> **Design rule** woven into every task: *If a user can read the whole page without feeling the heat — the design has failed.*

---

## PHASE 1 — Project Scaffolding

### 1.1 Repository Setup
- [x] Create GitHub repository named `pindamonhangaba-climate`
- [x] Add `.gitignore` (node_modules, dist, data/raw, data/processed, __pycache__, .env)
- [x] Add `LICENSE` (MIT for code)
- [x] Create root `README.md` with project description and live link placeholder
- [x] Create `CHANGELOG.md` with initial entry

### 1.2 Python Environment
- [x] Create `data/requirements.txt` with: requests, pandas, numpy, matplotlib, seaborn, jupyter, scipy
- [x] Create `data/environment.yml` for conda users
- [x] Create `data/` directory structure: `raw/`, `processed/`, `scripts/`, `notebooks/`
- [x] Add `data/raw/.gitkeep` and `data/processed/.gitkeep`

### 1.3 Frontend Scaffolding (TypeScript + shadcn/ui + Tailwind v4)
- [x] Create `vite.config.ts` with `base: '/pindamonhangaba-climate/'`, Tailwind v4 Vite plugin, `@/` alias
- [x] Create `tsconfig.json` with strict mode and `@/*` path alias
- [x] Create `eslint.config.js` with React + hooks rules
- [x] Create `.prettierrc` with standard formatting rules
- [x] Install Tailwind CSS v4: `npm install tailwindcss @tailwindcss/vite`
- [x] Install shadcn/ui deps: `npm install class-variance-authority clsx tailwind-merge lucide-react`
- [x] Install Radix primitives: `npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-tooltip @radix-ui/react-select @radix-ui/react-slider @radix-ui/react-tabs`
- [x] Initialize shadcn/ui: `npx -y shadcn@latest init` (use Git Bash)
- [x] Install runtime deps: `npm install d3 recharts framer-motion scrollama leaflet react-leaflet`
- [x] Install type defs: `npm install -D @types/d3 @types/leaflet`
- [x] Add shadcn Button: `npx shadcn add button` (smoke test)
- [x] Verify dev server starts: `npm run dev`

---

## PHASE 2 — Data Acquisition (Python) ✅ Complete

### 2.1 Fetch Script (`data/scripts/fetch_climate_data.py`)
- [x] Define constants: `LAT = -22.9250`, `LON = -45.4620`, `START_DATE = '1940-01-01'`, `END_DATE = '2025-12-31'`
- [x] Implement `fetch_year(year)` with retry logic (3 attempts, exponential backoff: 1s, 2s, 4s)
- [x] Implement `save_raw_year(year, data)` and `load_raw_year(year)` (cache to `data/raw/year_{year}.json`)
- [x] Implement `merge_years_to_dataframe(years)` → concat all year DataFrames
- [x] Convert `time` column to `pd.to_datetime` (CoW-safe `.assign()`)
- [x] Rename columns: `date`, `temp_max`, `temp_min`, `temp_mean`, `precipitation`, `humidity`, `wind_max`
- [x] Save merged DataFrame to `data/raw/pindamonhangaba_1940_2025.csv` (index=False)
- [x] Add `__main__` block with progress bar (tqdm)

**Result**: 31,047 rows · 1940-01-01 → 2025-12-31 · T_max 9.4–38.2°C · T_min 1.3–24.7°C · 1 NaN total

### 2.2 Exploratory Notebook (`data/notebooks/exploratory_analysis.ipynb`)
- [x] Cell 1: Load raw CSV, `.head()`, `.info()`, `.describe()`
- [x] Cell 2: Plot missing values heatmap (seaborn)
- [x] Cell 3: Plot annual T_max distribution (boxplot by decade)
- [x] Cell 4: Quick HD30 count per year bar chart
- [x] Cell 5: Validate T_min ≤ T_mean ≤ T_max — **✅ 0 violations across 31,047 rows**

### 2.3 Cross-Source Validation (`data/scripts/validate_cross_source.py`)
- [x] Fetch NASA POWER (MERRA-2) for 10 sample years (1985–2024)
- [x] Compute Pearson r, RMSE, MAE, bias per year for T_max and T_min
- [x] Check seasonal correctness (DJF > JJA — Southern Hemisphere)
- [x] Save results to `data/raw/cross_validation_results.csv` and `data/notebooks/cross_validation_plot.png`

**Results** (3,653 records): r T_max=0.893 ✅ · r T_min=0.926 ✅ · RMSE T_max=1.75°C ✅ · RMSE T_min=1.98°C ✅ · T_min bias +1.51°C (known ERA5 characteristic) ℹ️

---

## PHASE 3 — Data Processing (Python) ✅ Complete

### 3.1 Cleaning Script (`data/scripts/process_climate_data.py`)
- [x] Load raw CSV; assert no duplicate dates, complete date range
- [x] Interpolate gaps ≤3 days; flag longer gaps with `data_quality = 'interpolated_long'`
- [x] Validate T_min ≤ T_mean ≤ T_max; T_max < 50; T_min > -10; precipitation ≥ 0
- [x] Round temperatures to 1dp, precipitation to 2dp
- [x] Add `year`, `month`, `day_of_year` derived columns
- [x] Save to `data/processed/pindamonhangaba_clean.csv` (index=False)

### 3.2 Metrics Script (`data/scripts/calculate_metrics.py`)

> **ETCCDI Alignment**: All indices follow or adapt the ETCCDI 27-index standard.

- [x] SU25, SU30, TR20, DTR, temp_max_mean, temp_min_mean, temp_mean_annual, precip_total, precip_days
- [x] `calculate_wsdi()` — WSDI: ≥6 consecutive days where T_max > calendar-day p90 (1961–1990 baseline)
- [x] `calculate_tx90p()` — TX90p: % days where T_max > calendar-day p90 baseline
- [x] `calculate_tn90p()` — TN90p: % nights where T_min > calendar-day p90 baseline
- [x] `calculate_cdd()`, `calculate_cwd()` — max consecutive dry/wet days per year
- [x] GDD: `SUM(MAX(0, (T_max+T_min)/2 - 10))` per year
- [x] P95: days above 95th percentile of full historical T_max distribution
- [x] `first_hot_day`, `last_hot_day`, `hot_season_length` (null if no days ≥ 30°C)
- [x] Decadal averages (group by `year // 10 * 10`)
- [x] Mann-Kendall test + OLS linear regression for SU30, TR20, DTR, WSDI
- [x] Save `data/processed/annual_metrics.csv` and `data/processed/decadal_metrics.csv`

**Results** (86 years · 1940–2025):

| Metric | Full-period avg | Record | Trend/decade | p-value |
|---|---|---|---|---|
| SU30 | 43.3 /yr | 140 — **2024** | **+7.1 days** | < 0.0001 ✅ |
| TR20 | 31.6 /yr | 99 — **2017** | **+5.0 nights** | < 0.0001 ✅ |
| DTR mean | 9.75°C /yr | — | **+0.11°C** | < 0.0001 ✅ |
| WSDI | 13.3 d/yr | 82 — **2018** | **+3.9 days** | < 0.0001 ✅ |

| Decade | SU30 | WSDI | TR20 |
|---|---|---|---|
| 1940s | 23.2 | 4.2 | 36.8 |
| 1980s | 32.7 | 7.1 | 25.9 |
| **2010s** | **75.4** | **32.6** | **61.5** |
| **2020s** | **108.2** | **49.2** | **68.0** |

### 3.3 Web Data Generator (`data/scripts/generate_web_data.py`) ✅ Complete
- [x] `public/data/climate_data.json` — 31,412 daily records (4,309 KB raw → **425 KB gzip**)
- [x] `public/data/metrics.json` — 86 annual metric records keyed by year (28.8 KB)
- [x] `public/data/summary.json` — hottest day (1961-09-28 · 38.2°C), longest WSDI (82 days · 2018), SU30 trend (+7.09/decade), decade comparison, anomaly series (2.0 KB)

---

## PHASE 4 — Frontend Foundation ✅ Complete

### 4.1 Entry Point & Root
<<<<<<< HEAD
- [x] Edit `src/main.tsx`: import React, ReactDOM, App, `./index.css`; render `<App />`
- [x] Edit `index.html`: set `<title>`, add meta description, OG tags, Twitter Card tags, Google Fonts (Syne, DM Sans, JetBrains Mono)
- [x] Add Schema.org Dataset JSON-LD script in `index.html`
- [x] Add CSP meta tag in `index.html`

### 4.2 CSS Design System (Tailwind v4 CSS-first)
- [x] Edit `src/index.css`: `@import "tailwindcss"` + `@theme {}` block with temperature colors, stripe colors, fonts (Syne, DM Sans)
- [x] Add `@custom-variant dark (&:where(.dark, .dark *))` for dark mode class strategy
- [x] Add keyframes in `src/index.css`: `stripeReveal`, `slideUp`, `pulseHot`, `fadeIn`
- [x] Set base styles: dark background (#0a0f1e), Syne for headings, DM Sans for body

### 4.3 TypeScript Types
- [x] Create `src/types/climate.ts`: export `DailyRecord`, `AnnualMetrics`, `DecadalMetrics`, `ClimateSummary` interfaces
- [x] `DailyRecord`: `{ date: string; temp_max: number; temp_min: number; temp_mean: number; precipitation: number; humidity: number; wind_max: number; data_quality?: string }`
- [x] `AnnualMetrics`: ETCCDI-aligned — `{ su25, su30, tr20, dtr_mean, wsdi_days, tx90p, tn90p, cdd, cwd, gdd, p95_days, temp_max_mean, temp_min_mean, temp_mean_annual, precip_total, precip_days, first_hot_day, last_hot_day, hot_season_length, anomaly }` — field names match exact JSON output of `calculate_metrics.py`
- [x] `ClimateSummary`: `{ hottest_day, coldest_day, wettest_day, longest_warm_spell, year_most_su30, su30_trend_slope_per_decade, baseline_mean_temp_1940_1980, decade_comparison, temp_anomaly_by_year }` — field names match exact JSON output of `generate_web_data.py`

### 4.4 Constants
- [x] Create `src/constants/config.ts`: export `LAT`, `LON`, `START_YEAR`, `END_YEAR`, `DATA_BASE_URL`, `REPO_BASE`
- [x] Create `src/constants/thresholds.ts`: export `SU30_THRESHOLD = 30`, `SU25_THRESHOLD = 25`, `TR20_THRESHOLD = 20`, `WSDI_MIN_DURATION = 6`, `WSDI_BASELINE_START = 1961`, `WSDI_BASELINE_END = 1990`, `DRY_DAY_THRESHOLD = 1`, `WET_DAY_THRESHOLD = 1`, `ANOMALY_BASELINE_START = 1940`, `ANOMALY_BASELINE_END = 1980`

### 4.5 Utility Functions
- [x] Create `src/utils/colors.ts`: `tempToColor`, `anomalyToStripeColor`, `su30ToColor`, `precipToColor`, `lerpColor`
- [x] Create `src/utils/formatters.ts`: `formatTemp`, `formatDate`, `formatDateShort`, `formatDecade`, `formatDecadeLabel`, `formatSlope`, `formatNumber`, `formatDayOfYear`, `formatPercent`
- [x] Create `src/utils/calculations.ts`: `linearRegression`, `movingAverage`, `percentile`, `kernelDensityEstimator`, `mean`, `stdDev`, `clamp`, `normalize`, `trendLine`, `predictY`
- [x] Create `src/utils/dataProcessing.ts`: `groupByYear`, `groupByDecade`, `groupMetricsByDecade`, `filterByYear`, `filterByYearRange`, `metricsToArray`, `extractTimeSeries`, `countDaysAboveThreshold`, `monthlyAverages`, `getYears`, `getDecades`
- [x] Create `src/lib/utils.ts`: `cn(...inputs: ClassValue[]): string` (shadcn/ui `cn` helper — generated by shadcn init)

### 4.6 Custom Hooks
- [x] Create `src/hooks/useClimateData.ts`: fetch `climate_data.json`, `metrics.json`, `summary.json` in parallel; return typed `{dailyData: DailyRecord[], metrics: Record<number, AnnualMetrics>, summary: ClimateSummary, loading: boolean, error: Error | null}` — metrics string keys auto-converted to number keys
- [x] Create `src/hooks/useScrollPosition.ts`: return `scrollY: number` via rAF-throttled scroll listener
- [x] Create `src/hooks/useWindowSize.ts`: return `{width: number, height: number}` with 200ms debounce
=======
- [x] `src/main.tsx` — already correct: strict mode, App, index.css
- [x] `index.html` — title updated to *"A Memória de Calor de uma Cidade | Pindamonhangaba"*; all meta/OG/Twitter tags, Google Fonts (Syne 400/700/800, DM Sans 300–700 italic, JetBrains Mono), CSP already present
- [x] Schema.org Dataset JSON-LD present in `index.html`

### 4.2 CSS Design System (Tailwind v4 CSS-first) ✅
- [x] `src/index.css` — full `@theme {}` block with complete Ed Hawkins stripe palette (`--color-stripe-deep-cold` → `--color-stripe-extreme`), `--color-base`, `--color-surface-*`, `--color-text-primary/secondary/accent`, all `--color-temp-*`, all three font vars, and full type scale (`--text-display-xl` clamped 80–160px through `--text-caption`)
- [x] `@custom-variant dark` — present
- [x] Keyframes: `stripeReveal`, `slideUp`, `pulseHot`, `fadeIn`, **`drawLine`** (stroke-dashoffset for timeline reveal), **`heatShimmer`** (count-up glow for StatCallout)
- [x] Base styles: `background: var(--color-base)`, Syne for `h1–h6`, DM Sans for `body`, warm `--color-text-primary` (#f0ece3) instead of flat white
- [x] `prefers-reduced-motion` block — all durations set to 0.01ms
- [x] Scroll-driven background on `body` — `radial-gradient` using `color-mix(in srgb, ...)` with `var(--scroll-heat, 0)`; shifts from cool blue (#2166ac) to burning red (#67001f) as user scrolls
- [x] Scrollytelling utilities: `.sticky-viz`, `.scroll-steps`, `.scroll-step` (min-height 100vh), `.section-block`, `.prose-block`, `.glass` (backdrop-blur tooltip surface)

### 4.3 TypeScript Types ✅
- [x] `src/types/climate.ts` — fully rewritten to match actual JSON output:
  - `DailyRecord`: date, temp_max/min/mean, precipitation, humidity, wind_max, data_quality
  - `AnnualMetrics`: ETCCDI-aligned (su25, su30, tr20, dtr_mean, wsdi_days, tx90p, tn90p, cdd, cwd, gdd, p95_days, first/last_hot_day, hot_season_length, anomaly, precip_total/days)
  - `DecadalMetrics`: su30/tr20/wsdi/cdd/cwd/temp_mean/anomaly decade means
  - `ClimateSummary`: hottest_day, coldest_day, wettest_day, **longest_warm_spell** (WSDI record), year_most_su30, su30_trend_slope_per_decade, decade_comparison dict, temp_anomaly_by_year

### 4.4 Constants ✅
- [x] `src/constants/config.ts` — LAT, LON, START_YEAR, END_YEAR, OPEN_METEO_BASE_URL, DATA_BASE_URL, REPO_BASE, OPEN_METEO_PARAMS, TIMEZONE
- [x] `src/constants/thresholds.ts` — rewritten with ETCCDI names: SU30_THRESHOLD, SU25_THRESHOLD, TR20_THRESHOLD, WSDI_MIN_DURATION=6, WSDI_BASELINE_START=1961, WSDI_BASELINE_END=1990, **STRIPES_BASELINE_START=1940**, **STRIPES_BASELINE_END=1980** (Ed Hawkins convention, distinct from WSDI baseline), CDD/CWD thresholds, GDD_BASE_TEMP, AC_THRESHOLD, AC_HOURS_PER_HOT_DAY, DEFAULT_ELECTRICITY_RATE_BRL, AC_POWER_KW

### 4.5 Utility Functions ✅
- [x] `src/utils/colors.ts` — Ed Hawkins 10-stop palette interpolation with proper RGB lerp (`anomalyToStripeColor`); `tempToStripeColor` (raw temp + baseline mean); `tempToHeatmapColor` (8-stop heatmap scale 10–40°C); `computeBaselineMean`; `decadeToColor` (maps 1940s–2020s to stripe palette)
- [x] `src/utils/formatters.ts` — `formatTemp`, `formatAnomaly` (Unicode minus), `formatDate` / `formatDateShort` (pt-BR locale), `formatDecade` / `formatDecadeShort`, `formatDays`, `formatNights`, `formatPrecip`, `formatPercent`, `formatBRL`, `formatSlope`, `getYear`
- [x] `src/utils/calculations.ts` — OLS `linearRegression` (returns slope, intercept, r²); `predictRegression`; `movingAverage` (centered window); `percentile` (linear interpolation); **`kernelDensityEstimate`** (Gaussian KDE with Silverman bandwidth — needed for RidgelinePlot); `clamp`, `lerp`
- [x] `src/utils/dataProcessing.ts` — `groupByYear`, `groupByDecade`, `groupMetricsByDecade` (Map-based for D3); `filterByYear`, `filterByYearRange`, `filterMetricsByYearRange`; `metricsToArray`; `decadalAverage` (per metric key); `findRecordYear`; `dayOfWeek`
- [x] `src/lib/utils.ts` — `cn()` shadcn helper (generated by shadcn init)

### 4.6 Custom Hooks ✅
- [x] `src/hooks/useClimateData.ts` — parallel fetch of all 3 JSON files; typed return; cancellable on unmount; `import.meta.env.BASE_URL` paths
- [x] `src/hooks/useScrollProgress.ts` — **new hook** (note: distinct from `useScrollPosition`). Writes `--scroll-heat` CSS property to `document.documentElement` via rAF, no React re-renders. Called once from `App.tsx`.
- [x] `src/hooks/useWindowSize.ts` — `{ width, height }` with 200ms debounce

**Verification**: `npx tsc --noEmit` → **0 errors**
>>>>>>> 004c615 (feat: new plan and frontend foundation)

---

## PHASE 5 — Layout Components

### 5.1 Header (`src/components/layout/Header.tsx`)
- [ ] Sticky header; dark, semi-transparent; backdrop-blur
- [ ] Navigation links: #stripes, #summer, #nights, #heatwaves, #hottest, #cost, #future
- [ ] Active section highlight via IntersectionObserver
- [ ] Hamburger menu on mobile (<768px)
- [ ] Smooth scroll on nav click

### 5.2 Footer (`src/components/layout/Footer.tsx`)
- [ ] Attribution: Open-Meteo (ERA5/Copernicus), Ed Hawkins Climate Stripes, OpenStreetMap
- [ ] GitHub repository link; data download links (CSV, JSON)
- [ ] License: MIT (code) · CC BY 4.0 (data)

### 5.3 Common Components
- [x] `src/components/common/LoadingSpinner.tsx` — **upgraded** to Framer Motion heat-pulse: three concentric rings breathing warm orange-red, replaces generic blue spinner
- [x] `src/components/common/ErrorBoundary.tsx` — class component with project palette fallback UI
- [x] `src/components/common/SectionTitle.tsx` — Syne 800 at `--text-display-md`; animated underline bar `scaleX` 0→1 on viewport entry; accepts `id`, `sub`, `accentColor`
- [x] `src/components/common/StatCallout.tsx` — massive number display at `--text-display-xl` (80–160px); IntersectionObserver + rAF count-up (1200ms cubic ease-out); warm glow `text-shadow`; Framer Motion entrance
- [ ] `src/components/common/Tooltip.tsx`: absolutely-positioned div, dark glass background
- [ ] `src/components/common/DataTable.tsx`: visually-hidden accessible table alternative for all charts
- [ ] shadcn components: `npx shadcn add card badge separator tabs slider select`

---

## PHASE 6 — Visualization Components

### 6.1 Climate Stripes (`src/components/visualizations/ClimateStripes.tsx`)
> **Design intent**: Not a chart. A *painting*. The user should want to touch it.

- [ ] Accept `data: Array<{year, temp_mean_annual, anomaly}>`
- [ ] SVG 100% width × 100vh. One `<rect>` per year (1940–2025), zero gap between.
- [ ] Color: `d3.scaleSequential(d3.interpolateRdBu)` — baseline = mean of 1940–1980 (not full range)
- [ ] Apply `filter: blur(0.5px)` via CSS to give slight painterly blur
- [ ] On hover: year label fades in below stripe; brightness lifts (CSS filter)
- [ ] **Animation**: stripes reveal left-to-right, 8ms per stripe stagger (~700ms total). Use `stripeReveal` keyframe.
- [ ] Accessibility: `role="img"`, `aria-label="Climate stripes 1940–2025"`, `<title>` per rect with year + temp
- [ ] Decade labels (1940, 1950, …, 2020) floating below stripes, DM Sans, semi-transparent
- [ ] Responsive: recalculate on `useWindowSize` change

### 6.2 Calendar Heatmap (`src/components/visualizations/CalendarHeatmap.tsx`)
> **Design intent**: Fills day-by-day like a timelapse of a summer getting longer.

- [ ] Accept `data: DailyRecord[]`, `year: number`; filter to selected year
- [ ] SVG grid: 53 columns × 7 rows; `d3.timeMonday` (Brazilian week start)
- [ ] Color: `d3.scaleSequential(d3.interpolateRdYlBu).domain([10, 40])` reversed
- [ ] SU30 days (T_max ≥ 30°C): small dot marker at cell center, `--color-stripe-extreme`
- [ ] TR20 nights (T_min ≥ 20°C): 1px border highlight, `--color-stripe-warm`
- [ ] Month labels above grid (DM Sans)
- [ ] Hover tooltip: date, T_max, T_min, precipitation
- [ ] Click: modal with full day details
- [ ] **Animation on scroll entry**: cells fill chronologically (day 1 → day 365), 2ms/day delay
- [ ] Year selector dropdown (shadcn `Select`)
- [ ] Color legend below chart
- [ ] Responsive: scale `viewBox`

### 6.3 Ridgeline Plot (`src/components/visualizations/RidgelinePlot.tsx`)
> **Design intent**: The rightward drift of decades reveals one at a time — oldest to newest.

- [ ] Accept `data: DailyRecord[]`; group by decade
- [ ] For each decade, compute KDE of `temp_max` distribution (D3 KDE)
- [ ] SVG: shared x-axis (temperature), stacked y-axis (decades, Joy Division style)
- [ ] Fill color by decade: cool blues → warm reds (same stripe palette)
- [ ] Overlap between ridges (Joy Division aesthetic — earlier decades peek through)
- [ ] Decade labels on left y-axis (Syne, small)
- [ ] X-axis temperature ticks; 30°C reference line in `--color-stripe-burning`
- [ ] **Animation**: decades reveal oldest → newest on scroll entry, 300ms each
- [ ] Accessibility: `role="img"`, aria-label

### 6.4 Time Series Chart (`src/components/visualizations/TimeSeriesChart.tsx`)
- [ ] Accept `metrics: Record<number, AnnualMetrics>`, `activeMetric: string`
- [ ] Recharts `LineChart` with dark grid (`stroke: rgba(255,255,255,0.1)`)
- [ ] Main metric line in `--color-stripe-hot`; trend line dashed in `--color-text-secondary`
- [ ] Metric toggle buttons: SU30, TR20, DTR, WSDI, CDD, CWD
- [ ] Record year: custom `<Dot>` in `--color-stripe-extreme`, larger radius
- [ ] `<Brush>` for zoom/pan
- [ ] `<ReferenceLine>` at decade boundaries (1950, 1960, …)
- [ ] `<ResponsiveContainer width="100%" height={400}>`

### 6.5 Comparative Bar Chart (`src/components/visualizations/ComparativeBarChart.tsx`)
- [ ] Accept `decadalData: DecadalMetrics[]`
- [ ] Recharts grouped `BarChart`; X-axis: decades; Y-axis: metric value
- [ ] SU30 bars: `--color-stripe-hot`; TR20: `--color-stripe-warm`; WSDI: `--color-stripe-burning`
- [ ] **Animation**: bars grow from baseline on scroll entry (Framer Motion `whileInView`)
- [ ] `<Tooltip>` with dark glass style matching site palette

### 6.6 Interactive Map (`src/components/visualizations/InteractiveMap.tsx`)
- [ ] Import `leaflet/dist/leaflet.css` in component
- [ ] Dark tile layer (CartoDB dark matter or similar) to match palette
- [ ] Centered on `[-22.9250, -45.4620]`, zoom=12
- [ ] Marker popup: "Pindamonhangaba · 85 years of data · ERA5 reanalysis"
- [ ] Attribution: "© OpenStreetMap contributors"
- [ ] Disable scroll zoom (enable on map click to prevent scroll hijacking)

### 6.7 Radial Chart (`src/components/visualizations/RadialChart.tsx`)
- [ ] D3 polar chart: 12 monthly segments, radius = temperature
- [ ] One path per decade, color cool → hot by decade
- [ ] Radial grid lines at 10°C, 20°C, 30°C (subtle, dark)
- [ ] Month labels around perimeter (DM Sans, small)
- [ ] Animate on scroll entry

---

## PHASE 7 — Storytelling Sections

### 7.1 ScrollySection Wrapper (`src/components/storytelling/ScrollySection.tsx`)
- [ ] Initialize Scrollama; `offset: 0.5`
- [ ] Accept `steps: ReactNode[]`, `onStepEnter`, `onStepExit` callbacks
- [ ] Sticky visualization container: `position: sticky; top: 0; height: 100vh`
- [ ] Scrollable steps column: prose text, max-width 600px, DM Sans
- [ ] `min-height: 100vh` on each step div (required for Scrollama mobile)
- [ ] Never set `overflow: hidden` on the Scrollama parent
- [ ] Clean up scroller on unmount; call `scroller.resize()` on window resize

### 7.2 Hero / Intro Section (`src/components/storytelling/IntroSection.tsx`)
> *"Pindamonhangaba is warming. Here is the proof."*

- [ ] Full-bleed ClimateStripes hero (100vw × 100vh)
- [ ] Headline floats over stripes: Syne 800, `--text-display-lg`, text: "Pindamonhangaba está esquentando. Aqui está a prova."
- [ ] Sub-text: coordinates (-22.9250, -45.4620) · altitude · 85 years · DM Sans, small, semi-transparent
- [ ] Scroll indicator: animated chevron, `pulseHot` keyframe, slow
- [ ] Steps: (1) stripes appear; (2) highlight recent red stripes; (3) anomaly label fades in
- [ ] Stat callout: `StatCallout` component with anomaly since 1940

### 7.3 Summer Section (`src/components/storytelling/SummerSection.tsx`)
> *"The Summer That Never Ends"*

- [ ] SectionTitle: "The Summer That Never Ends"
- [ ] Sticky: SU30 bar chart (ComparativeBarChart) by decade
- [ ] Steps: (1) 1940s–1970s bars; (2) 1980s–2000s; (3) 2010s–2020s — bars animate in
- [ ] StatCallout: "In the 1940s, summer lasted 23 days. In the 2020s: **108 days**." — stat at `--text-display-xl`
- [ ] ThresholdSlider widget below chart

### 7.4 Tropical Nights Section (`src/components/storytelling/TropicalNightsSection.tsx`)
> *"Sleepless Nights"*

- [ ] SectionTitle: "Sleepless Nights"
- [ ] Sticky: CalendarHeatmap with TR20 nights highlighted
- [ ] Steps: (1) show 1960 calendar; (2) 2000 calendar; (3) 2024 calendar — year updates on step enter
- [ ] StatCallout: TR20 increase since 1940 at `--text-display-xl`
- [ ] Explanatory text about sleep health and nocturnal temperature

### 7.5 Heat Wave Section (`src/components/storytelling/HeatWaveSection.tsx`)
> *"Heat Waves: The New Normal"*

- [ ] SectionTitle: "Heat Waves: A Nova Normal"
- [ ] Sticky: WSDI time series + horizontal heat wave event bars
- [ ] Steps: (1) pre-1980 events (rare, short); (2) 1980–2000; (3) 2000–2025 (frequent, long)
- [ ] StatCallout: "Longest heat wave: **82 days** in 2018" at `--text-display-xl`
- [ ] Text: health impacts, outdoor work, agriculture

### 7.6 Hottest Day Section (`src/components/storytelling/HottestDaySection.tsx`)
> *A record card. Intimate scale.*

- [ ] SectionTitle: "The Hottest Day on Record"
- [ ] Record card: date "28 de setembro de 1961", temperature "38.2°C" — Syne 800, `--text-display-lg`, `--color-stripe-extreme`; animate with scale + fade
- [ ] CalendarHeatmap for 1961, programmatically highlighting September 28
- [ ] "Where were you on this day?" — birth year input → PersonalTimeline widget
- [ ] Design shift on PersonalTimeline activation: typography scales down, section softens

### 7.7 Cost Section (`src/components/storytelling/CostSection.tsx`)
> *The AC Calculator. Make it feel like a receipt.*

- [ ] SectionTitle: "The Cost of Heat"
- [ ] ACCalculator widget: JetBrains Mono, receipt-style layout
- [ ] Side-by-side comparison: estimated AC hours 1990 vs 2024
- [ ] Bar chart: hours above 25°C per year (T_max ≥ 25°C × 8h/day proxy)
- [ ] Text: energy consumption, electricity grid load, equity implications

### 7.8 Future Section (`src/components/storytelling/FutureSection.tsx`)
> *A question left open.*

- [ ] SectionTitle: "What's Next?"
- [ ] Trend extrapolation chart: SU30 projected to 2050, OLS regression + uncertainty band (shaded)
- [ ] StatCallout: projected SU30 by 2050 at `--text-display-xl`
- [ ] Climate action links
- [ ] Data download buttons (CSV, JSON)
- [ ] Social sharing buttons
- [ ] Acknowledgment of model limitations

---

## PHASE 8 — Interactive Widgets

### 8.1 Year Selector (`src/components/widgets/YearSelector.tsx`)
- [ ] Two shadcn `<Select>` dropdowns: Year A (default 1980), Year B (default 2024)
- [ ] Options: 1940–2025
- [ ] Comparison table rows: SU25, SU30, TR20, DTR, WSDI, TX90p, TN90p, CDD, CWD, GDD
- [ ] Cell color: red = B > A, blue = B < A, DM Sans
- [ ] "Reset" button

### 8.2 Threshold Slider (`src/components/widgets/ThresholdSlider.tsx`)
- [ ] shadcn `Slider`, min=25, max=35, step=0.5
- [ ] Display current threshold value at `--text-display-md` in Syne
- [ ] Real-time recalculation from `dailyData`
- [ ] Update TimeSeriesChart or a local count display

### 8.3 AC Calculator (`src/components/widgets/ACCalculator.tsx`)
> *A receipt. JetBrains Mono. The total lands with uncomfortable clarity.*

- [ ] Year selector → filter daily records for that year
- [ ] Calculate `hours_above_25 = count(temp_max ≥ 25) × 8` (approximate daytime hours)
- [ ] Itemized rows: kWh consumption, monthly breakdown
- [ ] Hairline `border-top` before TOTAL row
- [ ] `TOTAL AC HOURS:` and cost in JetBrains Mono, `--color-text-accent`, `pulseHot` blink on compute
- [ ] Editable electricity rate input (default R$0.80/kWh)
- [ ] Comparison to 1990 baseline shown below the receipt

### 8.4 Personal Timeline (`src/components/widgets/PersonalTimeline.tsx`)
> *Intimate register. Smaller type. Softer light. A private record.*

- [ ] Birth year input (number, min=1940, max=2025), large DM Sans italic prompt
- [ ] On submit: `motion.div` transition → smaller type, softer background
- [ ] Filter metrics from birth year to 2025
- [ ] `drawLine` animation: stroke-dashoffset trick for the lifetime chart line
- [ ] Output: "In your lifetime, hot days went from `X` to `Y` per year. Your hottest year: `[Z]` with `N` days above 30°C."
- [ ] If birth year = current year: show "Check back next year." message instead of chart

---

## PHASE 9 — App Assembly

### 9.1 App Component (`src/App.tsx`)
- [ ] Import `useClimateData` hook (typed)
- [ ] Import `useScrollProgress` hook; update `--scroll-heat` on `document.documentElement`
- [ ] Show `<LoadingSpinner />` while loading (heat pulse animation)
- [ ] Wrap in `<ErrorBoundary>`
- [ ] Render sections in order: Hero → Summer → TropicalNights → HeatWave → HottestDay → Cost → Future
- [ ] Wrap visualization-heavy sections in `React.lazy` + `<Suspense>`
- [ ] Pass typed `dailyData`, `metrics`, `summary` as props to all sections

### 9.2 Data Flow Verification
- [ ] Verify `useClimateData` fetches from correct base paths (uses `import.meta.env.BASE_URL`)
- [ ] Verify all components receive correct typed data shapes
- [ ] Verify TypeScript strict compilation passes: `npm run build` with no errors

### 9.3 Scroll-Driven Background
- [ ] `useScrollProgress` sets `--scroll-heat: <0–1>` on `document.documentElement` via rAF
- [ ] `body` background gradient transitions from cool blue to burning red via `color-mix()` in CSS
- [ ] Test: scroll to bottom of page → body should visibly shift toward reds

---

## PHASE 10 — Accessibility & SEO

### 10.1 Accessibility Audit
- [ ] All SVG charts: `role="img"`, `aria-label`, `<title>`, `<desc>` inside
- [ ] `<DataTable>` visually-hidden alternative for every chart
- [ ] Visible focus styles on all interactive elements (not just outline removal)
- [ ] All form inputs have associated `<label>` elements
- [ ] `aria-live="polite"` regions for dynamic content (threshold slider, year selector output)
- [ ] Keyboard navigation: Tab through all interactive elements
- [ ] `prefers-reduced-motion`: all animations → instant state changes

### 10.2 SEO
- [ ] `<title>`: "A City's Memory of Heat | Pindamonhangaba — 85 Years of Climate Data"
- [ ] `<meta name="description">`: 150–160 chars, compelling summary
- [ ] `og:title`, `og:description`, `og:image` (1200×630px with key stats), `og:url`
- [ ] `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- [ ] Schema.org Dataset JSON-LD in `index.html`
- [ ] `public/sitemap.xml`, `public/robots.txt`

---

## PHASE 11 — Performance Optimization

- [ ] `React.lazy(() => import(...))` + `<Suspense>` for all visualization components
- [ ] Service worker via `vite-plugin-pwa`; cache `public/data/*.json`
- [ ] `useMemo` for expensive calcs (OLS regression, KDE, groupByDecade)
- [ ] `useCallback` for event handlers passed as props
- [ ] Debounce scroll handler (rAF, 16ms cap); debounce resize (200ms)
- [ ] Calendar Heatmap → Canvas if >1000 cells cause jank (profile first)
- [ ] Bundle size check: `npm run build` → split if >500KB
- [ ] Lighthouse targets: FCP <1.5s · LCP <2.5s · TTI <3.5s · CLS <0.1

---

## PHASE 12 — Testing

### 12.1 Unit Tests (Jest + React Testing Library)
- [ ] Setup Jest config; install `jest @testing-library/react @testing-library/jest-dom`
- [ ] Test `linearRegression`, `movingAverage`, `percentile` with known inputs
- [ ] Test `groupByYear`, `groupByDecade`, `filterByYear`
- [ ] Test Python: `calculate_wsdi`, `calculate_tx90p`, `calculate_tn90p`, `calculate_cdd`, `calculate_cwd`
- [ ] Test `ClimateStripes` renders correct number of `<rect>` elements (85)
- [ ] Test `TimeSeriesChart` renders without crashing with mock data
- [ ] Test `ThresholdSlider` updates count on change
- [ ] Test `ACCalculator` computes correct hours for mock year data

### 12.2 Integration Tests
- [ ] `useClimateData` hook: mock fetch, verify loading → data state transitions
- [ ] Full App render with mock data: verify all sections mount
- [ ] Scroll trigger: simulate scroll, verify Scrollama step state changes

### 12.3 Python Tests (`data/tests/`)
- [ ] `test_process.py`: missing value interpolation, T_min > T_max swap, metric calculations
- [ ] `test_wsdi_baseline.py`: verify p90 computed only from 1961–1990, not full dataset
- [ ] `test_cwd_cdd_edge.py`: all-dry year → CWD=0, CDD=365

---

## PHASE 13 — CI/CD & Deployment

### 13.1 GitHub Actions
- [ ] Create `.github/workflows/deploy.yml`: push to main + annual cron + workflow_dispatch
- [ ] Jobs: `build` (Node 20, `npm ci`, `npm run build`, upload artifact) → `deploy` (deploy-pages)
- [ ] Add `permissions: pages: write, id-token: write`
- [ ] Create `.github/workflows/ci.yml`: lint + test on every PR
- [ ] Add Lighthouse CI step

### 13.2 Repository Settings
- [ ] GitHub Pages: Settings → Pages → Source → GitHub Actions
- [ ] Add `public/.nojekyll` (prevent Jekyll processing)
- [ ] Verify `base` in `vite.config.ts` matches repo name exactly (case-sensitive)

### 13.3 Monitoring
- [ ] `lighthouserc.json`: assert FCP <1500ms, LCP <2500ms, score >90

---

## PHASE 14 — Documentation

- [ ] Update `README.md`: live link, screenshots, data sources, local setup *(design concept is the lead)*
- [ ] Create `docs/API.md`: Open-Meteo usage, parameters, rate limits
- [ ] Create `docs/DATA_SOURCES.md`: all data sources, comparison table, attribution
- [ ] Create `docs/DEPLOYMENT.md`: step-by-step deployment guide
- [ ] Add JSDoc comments to all utility functions
- [ ] Add inline comments to complex D3 animations
- [ ] Update `CHANGELOG.md` with v1.0.0 entry when site launches
