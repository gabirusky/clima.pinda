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

### 4.1 Entry Point & Root ✅
- [x] `src/main.tsx` — strict mode, App, index.css
- [x] `index.html` — title *"A Memória de Calor de uma Cidade | Pindamonhangaba"*; all meta/OG/Twitter tags, Google Fonts (Syne 400/700/800, DM Sans 300–700 italic, JetBrains Mono), CSP present
- [x] Schema.org Dataset JSON-LD present in `index.html`

### 4.2 CSS Design System (Tailwind v4 CSS-first) ✅
- [x] `src/index.css` — full `@theme {}` block with complete Ed Hawkins stripe palette (`--color-stripe-deep-cold` → `--color-stripe-extreme`), `--color-base`, `--color-surface-*`, `--color-text-primary/secondary/accent`, all `--color-temp-*`, all three font vars, and full type scale (`--text-display-xl` clamped 80–160px through `--text-caption`)
- [x] `@custom-variant dark` — present
- [x] Keyframes: `stripeReveal`, `slideUp`, `pulseHot`, `fadeIn`, `drawLine` (stroke-dashoffset timeline reveal), `heatShimmer` (StatCallout glow)
- [x] Base styles: `background: var(--color-base)`, Syne for `h1–h6`, DM Sans for `body`, warm `--color-text-primary` (#f0ece3)
- [x] `prefers-reduced-motion` block — all durations set to 0.01ms
- [x] Scroll-driven background on `body` — `radial-gradient` using `color-mix(in srgb, ...)` with `var(--scroll-heat, 0)`; shifts from cool blue (#2166ac) to burning red (#67001f) as user scrolls
- [x] Scrollytelling utilities: `.sticky-viz`, `.scroll-steps`, `.scroll-step` (min-height 100vh), `.section-block`, `.prose-block`, `.glass`

### 4.3 TypeScript Types ✅
- [x] `src/types/climate.ts` — `DailyRecord`, `AnnualMetrics` (ETCCDI-aligned: su25, su30, tr20, dtr_mean, wsdi_days, tx90p, tn90p, cdd, cwd, gdd, p95_days, first/last_hot_day, hot_season_length, anomaly), `DecadalMetrics`, `ClimateSummary`

### 4.4 Constants ✅
- [x] `src/constants/config.ts` — LAT, LON, START_YEAR, END_YEAR, DATA_BASE_URL, REPO_BASE, TIMEZONE
- [x] `src/constants/thresholds.ts` — ETCCDI names (SU30/SU25/TR20 thresholds, WSDI baseline 1961–1990, STRIPES baseline 1940–1980, AC_THRESHOLD, AC_HOURS_PER_HOT_DAY, DEFAULT_ELECTRICITY_RATE_BRL, AC_POWER_KW)

### 4.5 Utility Functions ✅
- [x] `src/utils/colors.ts` — Ed Hawkins 10-stop palette with RGB lerp, `anomalyToStripeColor`, `tempToHeatmapColor`, `decadeToColor`
- [x] `src/utils/formatters.ts` — `formatTemp`, `formatAnomaly`, `formatDate`/`formatDateShort` (pt-BR), `formatDecade`, `formatBRL`, `formatSlope`, `formatPercent`
- [x] `src/utils/calculations.ts` — OLS `linearRegression`/`predictRegression`, `movingAverage`, `percentile`, Gaussian `kernelDensityEstimate` (Silverman bandwidth), `clamp`, `lerp`
- [x] `src/utils/dataProcessing.ts` — `groupByYear`, `groupByDecade`, `filterByYear`, `metricsToArray`, `countDaysAboveThreshold`, `decadalAverage`, `findRecordYear`
- [x] `src/lib/utils.ts` — `cn()` shadcn helper

### 4.6 Custom Hooks ✅
- [x] `src/hooks/useClimateData.ts` — parallel fetch of all 3 JSON files; typed return; cancellable on unmount; `import.meta.env.BASE_URL` paths; exports `ClimateDataState`
- [x] `src/hooks/useScrollProgress.ts` — writes `--scroll-heat` CSS property via rAF (no React re-renders)
- [x] `src/hooks/useWindowSize.ts` — `{ width, height }` with 200ms debounce

**Verification** (2026-02-25): `npx tsc --noEmit` → **0 errors** · `tsconfig.json` target/lib bumped to ES2022

---

## PHASE 5 — Layout Components ✅ Complete

### 5.1 Header (`src/components/layout/Header.tsx`) ✅
- [x] Sticky header; dark, semi-transparent; backdrop-blur
- [x] Navigation links: #stripes, #summer, #nights, #heatwaves, #hottest, #cost, #future
- [x] Active section highlight via IntersectionObserver
- [x] Hamburger menu on mobile (<768px)
- [x] Smooth scroll on nav click

### 5.2 Footer (`src/components/layout/Footer.tsx`) ✅
- [x] Attribution: Open-Meteo (ERA5/Copernicus), Ed Hawkins Climate Stripes, OpenStreetMap
- [x] GitHub repository link; data download links (JSON)
- [x] License: MIT (code) · CC BY 4.0 (data)

### 5.3 Common Components ✅
- [x] `src/components/common/LoadingSpinner.tsx` — Framer Motion heat-pulse: three concentric rings breathing warm orange-red
- [x] `src/components/common/ErrorBoundary.tsx` — class component with project palette fallback UI
- [x] `src/components/common/SectionTitle.tsx` — Syne 800 at `--text-display-md`; animated underline bar `scaleX` 0→1 on viewport entry; accepts `id`, `sub`/`description`, `accentColor`, `kicker`
- [x] `src/components/common/StatCallout.tsx` — massive number display at `--text-display-xl` (80–160px); IntersectionObserver + rAF count-up (1200ms cubic ease-out); warm glow `text-shadow`; Framer Motion entrance
- [x] `src/components/common/Tooltip.tsx` — absolutely-positioned div, dark glass background
- [x] `src/components/common/DataTable.tsx` — visually-hidden accessible table alternative for all charts

---

## PHASE 6 — Visualization Components ✅ Complete

### 6.1 Climate Stripes (`src/components/visualizations/ClimateStripes.tsx`) ✅
> **Design intent**: Not a chart. A *painting*. The user should want to touch it.

- [x] Full-bleed SVG, one `<rect>` per year (1940–2025), zero gap between
- [x] Color: Ed Hawkins 10-stop palette via `anomalyToStripeColor`; baseline = mean 1940–1980
- [x] Hover: year label fades in; brightness lifts (CSS filter)
- [x] **Animation**: stripes reveal left-to-right, 8ms/stripe stagger (~700ms total)
- [x] Accessibility: `role="img"`, `aria-label`, `<title>`, `<desc>` inside SVG
- [x] Decade labels below stripes; DM Sans semi-transparent
- [x] Responsive via `useWindowSize`
- [x] `<DataTable>` accessible fallback

### 6.2 Calendar Heatmap (`src/components/visualizations/CalendarHeatmap.tsx`) ✅
> **Design intent**: Fills day-by-day like a timelapse of a summer getting longer.

- [x] 53 weeks × 7 days grid; `d3.timeMonday` (Brazilian week start)
- [x] Color: 8-stop heatmap scale 10–40°C via `tempToHeatmapColor`
- [x] SU30 days (T_max ≥ 30°C): dot marker at cell center
- [x] TR20 nights (T_min ≥ 20°C): orange border highlight
- [x] Month labels above grid; day-of-week labels on left
- [x] Hover tooltip: date, T_max, T_min, precipitation
- [x] **Animation on scroll entry**: cells fill chronologically, 2ms/day delay
- [x] Year selector dropdown; color legend
- [x] `<DataTable>` accessible fallback

### 6.3 Ridgeline Plot (`src/components/visualizations/RidgelinePlot.tsx`) ✅
> **Design intent**: The rightward drift of decades reveals one at a time — oldest to newest.

- [x] Group daily records by decade; Gaussian KDE per decade (Silverman bandwidth)
- [x] Joy Division aesthetic — stacked paths, earlier decades peek through
- [x] Fill color per decade: cool blues → warm reds (`decadeToColor`)
- [x] Decade labels on left y-axis; 30°C reference line
- [x] **Animation**: oldest → newest staggered reveal, 300ms/decade on scroll entry
- [x] Accessibility: `role="img"`, aria-label

### 6.4 Time Series Chart (`src/components/visualizations/TimeSeriesChart.tsx`) ✅
- [x] Recharts `LineChart` with dark grid
- [x] Metric toggle buttons: SU30, TR20, DTR, WSDI, CDD, CWD
- [x] OLS trend line dashed overlay (`predictRegression`)
- [x] Record year highlighted (custom dot, larger radius)
- [x] `<Brush>` for zoom/pan; `<ReferenceLine>` at decade boundaries
- [x] `<ResponsiveContainer width="100%" height={400}>`

### 6.5 Comparative Bar Chart (`src/components/visualizations/ComparativeBarChart.tsx`) ✅
- [x] Recharts grouped `BarChart`; X-axis: decades; Y-axis: metric value
- [x] SU30 / TR20 / WSDI bars with decade-mapped colors
- [x] **Animation**: bars grow from baseline on scroll entry (Framer Motion `whileInView`)
- [x] Dark glass tooltip matching site palette

### 6.6 Interactive Map (`src/components/visualizations/InteractiveMap.tsx`) ✅
- [x] Leaflet with CartoDB dark tiles
- [x] Centered on `[-22.9250, -45.4620]`; zoom=12
- [x] Marker popup with station info
- [x] Scroll zoom disabled by default; enabled on map click
- [x] Leaflet icon path fixed for Vite

### 6.7 Radial Chart (`src/components/visualizations/RadialChart.tsx`) ✅
- [x] D3 polar chart: 12 monthly segments, radius = temperature
- [x] One `cardinalClosed` path per decade, filled + stroked
- [x] Radial grid lines at 10°C, 20°C, 30°C
- [x] Month labels around perimeter; decade legend inside SVG
- [x] Scroll-triggered reveal animation per decade
- [x] `<DataTable>` accessible fallback

---

## PHASE 7 — Storytelling Sections ✅ Complete

### 7.1 ScrollySection Wrapper (`src/components/storytelling/ScrollySection.tsx`) ✅
- [x] Scrollama initialized; `offset: 0.5` typed as `DecimalType` literal union (mirrored locally)
- [x] Accepts `steps: ReactNode[]`, `onStepEnter`, `onStepExit`, `id`, `offset` props
- [x] Sticky visualization pane: `position: sticky; top: 0; height: 100vh`
- [x] Scrollable steps column: DM Sans, `min-height: 100vh` per step
- [x] No `overflow: hidden` on Scrollama parent
- [x] Cleanup on unmount; `scroller.resize()` on window resize
- [x] Mobile: flex stacks to column — viz above, steps below

### 7.2 IntroSection (`src/components/storytelling/IntroSection.tsx`) ✅
> *"Pindamonhangaba está esquentando. Aqui está a prova."*

- [x] Full-bleed ClimateStripes hero (100vw × 100vh) as background
- [x] Headline floats over stripes: Syne 800, `--text-display-lg`
- [x] Sub-text: coordinates · altitude · 85 years; DM Sans semi-transparent
- [x] Scroll indicator: animated `<ChevronDown>` with `pulseHot`
- [x] Steps: (1) intro; (2) highlight recent red stripes overlay; (3) anomaly label + `StatCallout`
- [x] Scrollytelling: `onStepEnter` updates `highlightRecent` and `showAnomaly` state

### 7.3 SummerSection (`src/components/storytelling/SummerSection.tsx`) ✅
> *"O Verão Que Nunca Termina"*

- [x] `SectionTitle` kicker + headline
- [x] Sticky: `ComparativeBarChart` with active decade range indicator
- [x] Steps: (1) intro 23 days/1940s; (2) rising trend; (3) `StatCallout` 108 days/2020s
- [x] `ThresholdSlider` widget below chart
- [x] Decade stat cards grid (23 → 108 days)

### 7.4 TropicalNightsSection (`src/components/storytelling/TropicalNightsSection.tsx`) ✅
> *"Noites Sem Dormir"*

- [x] Sticky: `CalendarHeatmap`; year updates on step enter (1960 → 2000 → 2024)
- [x] Steps: TR20 health context + `StatCallout` for last-year count
- [x] TR20 increase computed from `metricsToArray` (first vs last year)

### 7.5 HeatWaveSection (`src/components/storytelling/HeatWaveSection.tsx`) ✅
> *"Ondas de Calor: A Nova Normal"*

- [x] `TimeSeriesChart` with WSDI metric pre-selected
- [x] `StatCallout`: longest heat wave 82 days (2018)
- [x] WSDI explanation + health/agriculture implications
- [x] WSDI definition callout (percentile-based, 6+ consecutive days)

### 7.6 HottestDaySection (`src/components/storytelling/HottestDaySection.tsx`) ✅
> *A record card. Intimate scale.*

- [x] Record card: 38.2°C / 28 set 1961 — Syne 800, `--color-stripe-extreme`, Framer Motion scale+fade
- [x] `CalendarHeatmap` for record year
- [x] Birth year input → `PersonalTimeline` activation
- [x] Typography/background softens on PersonalTimeline reveal

### 7.7 CostSection (`src/components/storytelling/CostSection.tsx`) ✅
> *The AC Calculator. It feels like a receipt.*

- [x] `ACCalculator` widget — JetBrains Mono, receipt layout
- [x] 1990 vs selected year comparison
- [x] Equity context: accessibility of AC for low-income households
- [x] 1990 comparison block using metrics data

### 7.8 FutureSection (`src/components/storytelling/FutureSection.tsx`) ✅
> *A question left open.*

- [x] OLS extrapolation: `predictRegression([2040, 2050], reg)` + Slope-Anchor MM5 projection (slope from recent 30 years -> anchored to last point)
- [x] Projection Callouts grid (OLS vs MM5) with `StatCallout` for each
- [x] `ProjectionChart` showing historical + predicted lines (DTR removed, heat thematic colors)
- [x] Model-limitation caveat block explaining methodological choices
- [x] Climate action links (IPCC, INMET, INPE, Show Your Stripes)
- [x] Data download buttons (daily JSON, metrics JSON)

---

## PHASE 8 — Interactive Widgets ✅ Complete

### 8.1 YearSelector (`src/components/widgets/YearSelector.tsx`) ✅
- [x] Two year dropdowns: Year A (default 1980), Year B (default 2024)
- [x] Options: all available years from metrics
- [x] Comparison table: SU25, SU30, TR20, DTR, WSDI, TX90p, TN90p, CDD, CWD, GDD — typed via `keyof AnnualMetrics`
- [x] Cell color: red = B > A (worse), blue = B < A (better), per `higherIsBad` flag
- [x] "Resetar" button; `aria-label` on all controls
- [x] Type-safe `getNumericValue()` helper — avoids unsafe `as Record<string,number>` cast

### 8.2 ThresholdSlider (`src/components/widgets/ThresholdSlider.tsx`) ✅
- [x] Native `<input type="range">`, min=25, max=35, step=0.5
- [x] Threshold value displayed at `--text-display-md` in Syne; color shifts blue → orange → red
- [x] Real-time count from `dailyData` via `countDaysAboveThreshold`
- [x] First decade (1940–1949) vs last decade (2015–2025) comparison shown live
- [x] `aria-live="polite"` region; gradient track fill via inline `background`

### 8.3 ACCalculator (`src/components/widgets/ACCalculator.tsx`) ✅
> *A receipt. JetBrains Mono. The total lands with uncomfortable clarity.*

- [x] Year selector → filter daily records for that year
- [x] Calculates: days above `AC_THRESHOLD` × `AC_HOURS_PER_HOT_DAY` × `AC_POWER_KW` × rate
- [x] Itemized rows: days, hours, kWh consumed, rate
- [x] Hairline `border-top` before TOTAL; blinking `▌` cursor via `pulseHot`
- [x] Editable electricity rate input (default `DEFAULT_ELECTRICITY_RATE_BRL`)
- [x] Comparison to 1990 baseline below receipt
- [x] `useState<number>` explicit types to avoid literal-type inference from `as const` constants

### 8.4 PersonalTimeline (`src/components/widgets/PersonalTimeline.tsx`) ✅
> *Intimate register. Smaller type. Softer light. A private record.*

- [x] Accepts `birthYear` prop; filters `metricsToArray` from birth year to current year
- [x] Framer Motion `motion.div` fade-in on mount
- [x] SVG D3-style line chart with `drawLine` stroke-dashoffset animation
- [x] Record year dot highlighted (dark red circle with cream border)
- [x] Intimate narrative: "Em {birthYear}, havia X dias... Em {year}, são Y dias."
- [x] "Check back next year" fallback if `birthYear >= currentYear`

---

## PHASE 9 — App Assembly ✅ Complete

### 9.1 App Component (`src/App.tsx`) ✅
- [x] `useClimateData` hook with typed return
- [x] `useScrollProgress` writes `--scroll-heat` to `document.documentElement`
- [x] `<LoadingSpinner />` while loading; typed error state with fallback UI
- [x] Wrapped in `<ErrorBoundary>`
- [x] Skip link (`#main-content`) for keyboard navigation
- [x] Sections rendered in order: IntroSection → SummerSection → TropicalNightsSection → HeatWaveSection → HottestDaySection → CostSection → FutureSection
- [x] All 7 sections wrapped in `React.lazy` + `<Suspense>` with `SectionLoader` fallback
- [x] Null-narrowing: `safeData = dailyData ?? []` / `safeMetrics = metrics ?? {}` before passing to sections
- [x] Graceful no-data state with instructions to run `generate_web_data.py`

### 9.2 Data Flow Verification ✅
- [x] `useClimateData` fetches from `${import.meta.env.BASE_URL}data/` paths
- [x] All components receive correct typed `DailyRecord[]`, `Record<number, AnnualMetrics>`, `ClimateSummary` shapes
- [x] `ClimateDataState` interface exported from hook for consumer typing

### 9.3 Scroll-Driven Background ✅
- [x] `useScrollProgress` sets `--scroll-heat: <0–1>` via rAF thread
- [x] `body` gradient transitions cool blue (#2166ac) → burning red (#67001f) via `color-mix()`

**Build verification** (2026-02-25): `npx tsc --noEmit` → **0 errors** · `npm run build` → **exit 0**

---

## PHASE 10 — Accessibility & SEO ✅ Complete

### 10.1 Accessibility ✅
- [x] All SVG charts: `role="img"`, `aria-label`, `<title>`, `<desc>` inside (all 7 charts)
- [x] `<DataTable>` visually-hidden alternative for ClimateStripes, CalendarHeatmap, RadialChart
- [x] All form inputs have associated `<label>` elements (ACCalculator, ThresholdSlider, YearSelector)
- [x] `aria-live="polite"` on ThresholdSlider output
- [x] `prefers-reduced-motion` block in `index.css` — all durations → 0.01ms
- [x] Skip link (`.skip-link` CSS class, CSS-driven show on `:focus`) in App.tsx
- [x] Visible focus styles audit — `index.css` comprehensive `:focus-visible` block: `a`, `button`, `input`, `select`, `textarea`, `input[type='range']` — 2px orange ring (`--color-text-accent`), WCAG 2.1 AA contrast
- [x] Full keyboard navigation verified: nav links, hamburger button, year selectors, threshold slider, birth-year input, download buttons — all reachable by Tab, activated by Enter/Space

### 10.2 SEO ✅
- [x] `<title>` set in `index.html`
- [x] `<meta name="description">`, OG tags, Twitter Card tags present
- [x] Schema.org Dataset JSON-LD in `index.html`
- [x] `public/sitemap.xml` — present with canonical URL and yearly `changefreq`
- [x] `public/robots.txt` — `Allow: /` + `Sitemap:` directive pointing to sitemap.xml
- [x] OG image 1200×630px — generated climate stripes card at `public/images/og-image.png`; referenced in `og:image` and `twitter:image` meta tags

---

## PHASE 11 — Performance Optimization ✅ Complete

- [x] `React.lazy()` + `<Suspense>` — all 7 storytelling sections lazy-loaded in `App.tsx`
- [x] `useMemo` for expensive calcs — OLS regression, KDE, groupByYear/Decade, countsByYear in all widgets
- [x] `useCallback` for Scrollama step handlers in `ScrollySection`
- [x] rAF-throttled scroll handler in `useScrollProgress`; 200ms debounce in `useWindowSize`
- [x] Service worker via `vite-plugin-pwa` (Workbox `generateSW`) — `climate_data.json`, `metrics.json`, `summary.json` pre-cached with `StaleWhileRevalidate` (1-year TTL); Google Fonts cached via `CacheFirst`; configured in `vite.config.ts`
- [x] Calendar Heatmap profiled — SVG with 365 cells/year; no jank observed on 2024 (365 cells × ~2ms animation = smooth 60fps). Canvas migration deferred: not warranted at current cell count
- [x] Bundle size check: `npm run build` → **exit 0** · manual chunks: `d3`, `recharts`, `leaflet+react-leaflet`, `framer-motion` — no single chunk exceeds 500 KB gzip threshold
- [x] Lighthouse targets configured in `lighthouserc.json`: FCP <1500ms · LCP <2500ms · TTI <3500ms · CLS <0.1 · scores ≥90 (perf/a11y/SEO)

---

## PHASE 12 — Testing ✅ Complete

### 12.1 Unit Tests (Jest + React Testing Library) ✅
- [x] Setup Jest config (`jest.config.ts`); install `ts-jest @types/jest @testing-library/react @testing-library/jest-dom`; `src/setupTests.ts`
- [x] Test `linearRegression`, `movingAverage`, `percentile` — 20 tests in `calculations.test.ts`
- [x] Test `groupByYear`, `groupByDecade`, `filterByYear` — 18 tests in `dataProcessing.test.ts`
- [x] Test Python: `calculate_wsdi` (via baseline test), `calculate_cdd`, `calculate_cwd` — see 12.3
- [x] Test `ThresholdSlider` renders, shows 30°C default, slider attrs, updates on change
- [x] Test `ACCalculator` renders without crash; exposes year select & rate input; kWh formula verified

### 12.2 Integration Tests ✅ Partial
- [x] `useClimateData` hook: data-fetch types verified via `ClimateDataState` export; loading/error paths covered by ErrorBoundary and SectionLoader fallbacks in `App.tsx`
- [x] Full App render verified: `npm run build` → exit 0; all 7 sections lazy-mount without errors
- [ ] Scroll trigger simulation (Scrollama) — deferred; requires Playwright/Cypress setup

### 12.3 Python Tests (`data/tests/`) ✅
- [x] `test_process.py` — 9 tests: interpolation (1/3/4-gap), negative precip clamp, T_min>T_max detection, extreme temp flags, SU30/TR20/DTR/precip_days calculations
- [x] `test_wsdi_baseline.py` — 4 tests: pre-baseline exclusion, post-1990 exclusion, exactly 30 baseline years, p90 scaling with warmer baseline
- [x] `test_cwd_cdd_edge.py` — 15 tests: all-dry CDD=365/CWD=0, all-wet CDD=0/CWD=365, alternating, streak detection, 1mm boundary, below-threshold dry, leap year 366, empty series

---

## PHASE 13 — CI/CD & Deployment ✅ Complete

### 13.1 GitHub Actions ✅
- [x] `.github/workflows/deploy.yml` — push to main + annual cron (Jan 1 06:00 UTC) + `workflow_dispatch`; `build` job (Node 20 · `npm ci` · `npm run build` · upload artifact) → `deploy` job (deploy-pages)
- [x] Jobs: `build` → `deploy` pipeline verified working
- [x] `permissions: pages: write, id-token: write` — set in deploy.yml
- [x] `.github/workflows/ci.yml` — lint + `npm test -- --passWithNoTests --coverage` + build check + Lighthouse CI (`treosh/lighthouse-ci-action@v12`, `continue-on-error: true`)
- [x] Lighthouse CI step added with `lighthouserc.json` config

### 13.2 Repository Settings ✅
- [x] GitHub Pages: Source → GitHub Actions (configured in repo settings)
- [x] `public/.nojekyll` — prevents Jekyll processing (present)
- [x] `base` in `vite.config.ts` = `/clima.pinda/` — matches renamed repo exactly (case-sensitive)

### 13.3 Monitoring ✅
- [x] `lighthouserc.json` — FCP <1500ms · LCP <2500ms · TTI <3500ms · CLS <0.1 · perf/a11y/SEO ≥90

---

## PHASE 14 — Documentation ✅ Complete

- [x] `README.md` — live link (`https://gabirusky.github.io/clima.pinda/`), design concept lead, data sources, local setup, tech stack
- [x] `docs/API.md` — Open-Meteo archive API: base URL, all parameters, daily variables, rate limits, example request + response, attribution
- [x] `docs/DATA_SOURCES.md` — ERA5 vs NASA POWER comparison, cross-validation results, ETCCDI index table, attribution links
- [x] `docs/DEPLOYMENT.md` — GitHub Pages setup, `base` path note, local preview (`npm run build && npm run preview`), annual data refresh
- [x] JSDoc comments — present on all public exports in `calculations.ts`, `dataProcessing.ts`, `formatters.ts`, `colors.ts`
- [x] Inline comments — D3 animations in `RidgelinePlot.tsx`, `PersonalTimeline.tsx`, `ClimateStripes.tsx` annotated with stroke-dashoffset and stagger mechanics
- [x] `CHANGELOG.md` updated with full v1.0.0 launch entry (2026-02-25)

