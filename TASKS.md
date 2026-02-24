# TASKS.md — Pindamonhangaba Climate Visualization

> Atomized coding tasks. Each task is a single, completable unit of work.
> Status: `[ ]` todo · `[/]` in progress · `[x]` done

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
- [x] Define `PARAMETERS` list: `['temperature_2m_max', 'temperature_2m_min', 'temperature_2m_mean', 'precipitation_sum', 'relative_humidity_2m_mean', 'windspeed_10m_max']`
- [x] Implement `fetch_year(year)` function that calls Open-Meteo archive API for a single year
- [x] Add `requests.get()` call with params: `latitude`, `longitude`, `start_date`, `end_date`, `daily`, `timezone='America/Sao_Paulo'`
- [x] Add HTTP status check: raise on non-200 response
- [x] Add JSON parsing and return as dict
- [x] Implement retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- [x] Implement `save_raw_year(year, data)` to write JSON to `data/raw/year_{year}.json`
- [x] Implement `load_raw_year(year)` to read cached JSON (skip API call if file exists)
- [x] Implement `merge_years_to_dataframe(years)` that concatenates all year DataFrames
- [x] Convert `time` column to `pd.to_datetime` (CoW-safe `.assign()` — pandas 2.x/3.x compatible)
- [x] Rename columns to: `date`, `temp_max`, `temp_min`, `temp_mean`, `precipitation`, `humidity`, `wind_max`
- [x] Save merged DataFrame to `data/raw/pindamonhangaba_1940_2025.csv` (index=False)
- [x] Add `__main__` block that fetches all years 1940–2025 with progress bar (tqdm)
- [x] Add logging to console: year fetched, rows returned, any errors

**Result**: 31,047 rows · 1940-01-01 → 2025-12-31 · T_max 9.4–38.2°C · T_min 1.3–24.7°C · 1 NaN total

### 2.2 Exploratory Notebook (`data/notebooks/exploratory_analysis.ipynb`)
- [x] Cell 1: Load raw CSV, display `.head()`, `.info()`, `.describe()`
- [x] Cell 2: Plot missing values heatmap (seaborn)
- [x] Cell 3: Plot annual T_max distribution (boxplot by decade)
- [x] Cell 4: Quick HD30 count per year bar chart
- [x] Cell 5: Validate T_min ≤ T_mean ≤ T_max — **✅ 0 violations found across all 31,047 rows**

### 2.3 Cross-Source Validation (`data/scripts/validate_cross_source.py`)
- [x] Fetch NASA POWER (MERRA-2) for 10 sample years (1985–2024) via free public API — no key required
- [x] Merge with ERA5 CSV on date; compute Pearson r, RMSE, MAE, bias per year for T_max and T_min
- [x] Check seasonal correctness (DJF > JJA — Southern Hemisphere)
- [x] Save results to `data/raw/cross_validation_results.csv`
- [x] Save scatter plot to `data/notebooks/cross_validation_plot.png`

**Results** (3,653 daily records, 10 years spanning 4 decades):
| Metric | Result | Benchmark | Status |
|---|---|---|---|
| r T_max (ERA5 vs MERRA-2) | 0.893 | > 0.85 | ✅ |
| r T_min (ERA5 vs MERRA-2) | 0.926 | > 0.88 | ✅ |
| RMSE T_max | 1.75°C | < 3.0°C | ✅ |
| RMSE T_min | 1.98°C | < 3.0°C | ✅ |
| Seasons (DJF > JJA) | 27.7°C vs 23.5°C | correct | ✅ |
| T_min bias ERA5 vs MERRA-2 | +1.51°C | known difference for valley topography | ℹ️ |

---

## PHASE 3 — Data Processing (Python)

### 3.1 Cleaning Script (`data/scripts/process_climate_data.py`)
- [x] Load `data/raw/pindamonhangaba_1940_2025.csv`
- [x] Assert `date` column has no duplicates
- [x] Assert date range is complete (no missing calendar days)
- [x] Identify missing value rows (NaN in any column)
- [x] For gaps ≤3 consecutive days: apply linear interpolation (`df.interpolate(method='linear')`)
- [x] For gaps >3 days: flag with `data_quality` column value `'interpolated_long'`
- [x] Validate: assert `temp_min <= temp_mean` for all rows; log violations
- [x] Validate: assert `temp_mean <= temp_max` for all rows; log violations
- [x] Validate: assert `precipitation >= 0` for all rows
- [x] Validate: assert `temp_max < 50` and `temp_min > -10` (sanity bounds for region)
- [x] Round `temp_max`, `temp_min`, `temp_mean` to 1 decimal place
- [x] Round `precipitation` to 2 decimal places
- [x] Add `year`, `month`, `day_of_year` derived columns
- [x] Save to `data/processed/pindamonhangaba_clean.csv` (index=False)
- [x] Print summary: total rows, missing rows found, rows interpolated, validation violations

### 3.2 Metrics Script (`data/scripts/calculate_metrics.py`)

> **ETCCDI Alignment**: All indices are defined according to, or are direct adaptations of, the Expert Team on Climate Change Detection and Indices (ETCCDI) 27-index standard. This ensures findings are directly comparable to peer-reviewed literature.

#### Core Metrics (per year)
- [x] Load `data/processed/pindamonhangaba_clean.csv`
- [x] Group by `year`
- [x] Calculate `su25`: count rows where `temp_max >= 25` — **ETCCDI SU25** (exact standard index; extended warm-season baseline)
- [x] Calculate `su30`: count rows where `temp_max >= 30` — **ETCCDI SU30** (modified Summer Days index; locally meaningful heat threshold for Pindamonhangaba's valley climate)
- [x] Calculate `tr20`: count rows where `temp_min >= 20` — **ETCCDI TR20** (exact standard index; tropical nights)
- [x] Calculate `dtr_mean`: mean of `(temp_max - temp_min)` per year — **ETCCDI DTR** (Diurnal Temperature Range; a sustained long-term decrease is the scientific fingerprint of Urban Heat Island expansion)
- [x] Calculate `temp_max_mean`: mean of `temp_max` per year
- [x] Calculate `temp_min_mean`: mean of `temp_min` per year
- [x] Calculate `temp_mean_annual`: mean of `temp_mean` per year
- [x] Calculate `precip_total`: sum of `precipitation` per year
- [x] Calculate `precip_days`: count rows where `precipitation >= 1` per year

#### Advanced Metrics
- [x] Implement `calculate_wsdi(df, baseline_start=1961, baseline_end=1990, min_duration=6)` — **ETCCDI WSDI** (Warm Spell Duration Index). Annual count of days contributing to warm spells: periods of **≥6 consecutive days** where `temp_max` exceeds the **calendar-day 90th percentile** of the 1961–1990 baseline. This replaces the fixed-threshold HWDI; the percentile-based approach adapts to the region's own historical climate.
  - Step 1: Compute per-calendar-day 90th percentile T_max from baseline years (5-day bootstrap window per ETCCDI recommendation)
  - Step 2: Flag days where `temp_max > p90[day_of_year]`
  - Step 3: Count days belonging to streaks of ≥6 consecutive flagged days per year
  - Return: `wsdi_days` (total days in warm spells per year)
- [x] Implement `calculate_tx90p(df, baseline_start=1961, baseline_end=1990)` — **ETCCDI TX90p** (Warm Days). Annual percentage of days where `temp_max > calendar-day 90th percentile` of the baseline.
- [x] Implement `calculate_tn90p(df, baseline_start=1961, baseline_end=1990)` — **ETCCDI TN90p** (Warm Nights). Annual percentage of nights where `temp_min > calendar-day 90th percentile` of the baseline.
- [x] Implement `calculate_cdd(precip_series)` returning max consecutive dry days (precip < 1mm) — **ETCCDI CDD**
- [x] Apply `calculate_cdd` per year
- [x] Implement `calculate_cwd(precip_series)` returning max consecutive wet days (precip >= 1mm) — **ETCCDI CWD** (paired with CDD to cover both ends of precipitation extremes: drought/fire risk and flood/landslide risk)
- [x] Apply `calculate_cwd` per year
- [x] Calculate `gdd`: `SUM(MAX(0, (temp_max + temp_min)/2 - 10))` per year (Growing Degree Days — agricultural productivity indicator)
- [x] Calculate `p95_days`: days above 95th percentile of the full historical T_max distribution (supplementary extreme threshold)

#### Temporal / Seasonal Analysis
- [x] Calculate `first_hot_day`: first day of year where `temp_max >= 30` (day_of_year); set to `null` if no hot days
- [x] Calculate `last_hot_day`: last day of year where `temp_max >= 30` (day_of_year); set to `null` if no hot days
- [x] Calculate `hot_season_length`: `last_hot_day - first_hot_day` (0 if no hot days)
- [x] Calculate decadal averages for all metrics (group by `year // 10 * 10`)

#### Statistical Tests
- [x] Implement Mann-Kendall trend test for `su30` series (use `scipy.stats.kendalltau`)
- [x] Implement linear regression slope for `su30`, `tr20`, `dtr_mean`, `wsdi_days` (use `scipy.stats.linregress`)
- [x] Store trend results: `slope`, `p_value`, `r_squared` per metric

#### Output
- [x] Assemble annual metrics DataFrame with all columns above
- [x] Save to `data/processed/annual_metrics.csv`
- [x] Save decadal metrics to `data/processed/decadal_metrics.csv`

**Results** (86 years · 1940–2025 · runtime ~3s):
| Metric | Full-period avg | Record | Trend (slope/decade) | p-value |
|---|---|---|---|---|
| SU25 (days ≥25°C) | 224.8 /yr | 303 — **2024** | — | — |
| SU30 (days ≥30°C) | 43.3 /yr | 140 — **2024** | **+7.1 days** | < 0.0001 ✅ |
| TR20 (nights ≥20°C) | 31.6 /yr | 99 — **2017** | **+5.0 nights** | < 0.0001 ✅ |
| DTR mean | 9.75°C /yr | — | **+0.11°C** | < 0.0001 ✅ |
| WSDI days | 13.3 /yr | 82 — **2018** | **+3.9 days** | < 0.0001 ✅ |
| TX90p | 13.3% /yr | — | — | — |
| TN90p | 14.6% /yr | — | — | — |
| CDD max | 24.7 /yr | 49 — **2025** | — | — |
| CWD max | 20.7 /yr | 55 — **1965** | — | — |
| p90 T_max baseline range | 25.1–31.7°C | — | — | — |
| p95 T_max (full historical) | 31.3°C | — | — | — |

Decade comparison (SU30 · WSDI · TR20):
| Decade | SU30 | WSDI | TR20 |
|---|---|---|---|
| 1940s | 23.2 d/yr | 4.2 d/yr | 36.8 n/yr |
| 1950s | 31.4 | 7.3 | 11.7 |
| 1960s | 38.0 | 11.5 | 15.7 |
| 1970s | 32.1 | 3.7 | 17.1 |
| 1980s | 32.7 | 7.1 | 25.9 |
| 1990s | 36.3 | 6.4 | 31.9 |
| 2000s | 38.7 | 12.5 | 30.1 |
| **2010s** | **75.4** | **32.6** | **61.5** |
| **2020s** | **108.2** | **49.2** | **68.0** |

### 3.3 Web Data Generator (`data/scripts/generate_web_data.py`) ✅ Complete

#### climate_data.json
- [x] Load `data/processed/pindamonhangaba_clean.csv`
- [x] Select columns: `date`, `temp_max`, `temp_min`, `temp_mean`, `precipitation`, `humidity`, `wind_max`
- [x] Convert `date` to string format `YYYY-MM-DD`
- [x] Convert to list of dicts (records orientation)
- [x] Write to `public/data/climate_data.json`
- [x] Check file size; if >500KB, gzip compress to `climate_data.json.gz`

#### metrics.json
- [x] Load `data/processed/annual_metrics.csv`
- [x] Convert to dict keyed by year: `{1940: {...}, 1941: {...}, ...}`
- [x] Write to `public/data/metrics.json`

#### summary.json
- [x] Find hottest day: row with max `temp_max` → `{date, temp_max, temp_min}`
- [x] Find coldest day: row with min `temp_min`
- [x] Find wettest day: row with max `precipitation`
- [x] Find longest warm spell: from annual metrics `wsdi_days` max (WSDI)
- [x] Find year with most SU30 days
- [x] Calculate overall trend: SU30 slope per decade
- [x] Calculate decade comparison table: 1940s vs 2020s for SU30, TR20, WSDI, CDD, CWD
- [x] Calculate `temp_anomaly_by_year`: deviation from 1940–1980 baseline mean
- [x] Write to `public/data/summary.json`

**Results** (31,412 daily records · runtime ~4s):
| Output file | Size | Contents |
|---|---|---|
| `climate_data.json` (`.gz`) | 4,309 KB raw → **425 KB gzip** | 31,412 daily records · auto-compressed (>500 KB threshold) |
| `metrics.json` | 28.8 KB | 86 annual ETCCDI metric records |
| `summary.json` | 2.0 KB | Headline stats: hottest day, coldest day, wettest day, WSDI record, SU30 trend, decade comparison, temp anomaly by year |

Key stats surfaced in `summary.json`:
- **Hottest day**: 1961-09-28 · T_max = 38.2°C
- **Coldest day**: 1979-06-01 · T_min = 1.3°C
- **Longest warm spell (WSDI)**: 82 days in 2018
- **SU30 trend**: +7.09 days/decade (p < 0.0001)

---

## PHASE 4 — Frontend Foundation

### 4.1 Entry Point & Root
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

---

## PHASE 5 — Layout Components

### 5.1 Header (`src/components/layout/Header.tsx`)
- [ ] Render sticky header with project title and subtitle
- [ ] Add navigation links: #stripes, #summer, #nights, #heatwaves, #hottest, #cost, #future
- [ ] Highlight active section based on scroll position
- [ ] Collapse to hamburger menu on mobile (<768px)
- [ ] Add smooth scroll behavior on nav link click
- [ ] Use shadcn/ui `Button` for nav CTAs

### 5.2 Footer (`src/components/layout/Footer.tsx`)
- [ ] Render attribution: "Climate data: Open-Meteo (ERA5 / Copernicus/ECMWF)"
- [ ] Render attribution: "Visualization inspired by Ed Hawkins' Climate Stripes"
- [ ] Add GitHub repository link
- [ ] Add data download links (CSV, JSON)
- [ ] Add license info (MIT code, CC BY 4.0 data)

### 5.3 Navigation (`src/components/layout/Navigation.tsx`)
- [ ] Extract nav logic into reusable component
- [ ] Accept `sections` prop (array of `{id: string; label: string}`)
- [ ] Highlight active section using IntersectionObserver

### 5.4 Common Components
- [ ] Create `src/components/common/LoadingSpinner.tsx`: animated SVG spinner with "Carregando dados climáticos..." text
- [ ] Create `src/components/common/ErrorBoundary.tsx`: class component catching render errors, showing fallback UI
- [ ] Create `src/components/common/Tooltip.tsx`: positioned tooltip div, accepts `x`, `y`, `content` props
- [ ] Create `src/components/common/DataTable.tsx`: accessible `<table>` alternative for chart data (screen readers)
- [ ] Create `src/components/common/SectionTitle.tsx`: styled `<h2>` with decorative underline animation
- [ ] shadcn/ui components to add: `npx shadcn add card badge separator tabs slider select`

---

## PHASE 6 — Visualization Components

### 6.1 Climate Stripes (`src/components/visualizations/ClimateStripes.jsx`)
- [ ] Accept `data` prop: array of `{year, temp_mean_annual, anomaly}`
- [ ] Create SVG element with width=100%, height=200px
- [ ] Map each year to a `<rect>` with x=index*(width/85), width=width/85, height=200
- [ ] Compute color using diverging scale: `d3.scaleSequential(d3.interpolateRdBu)` centered on baseline mean
- [ ] Add `<title>` element inside each rect for accessibility
- [ ] Implement mouse hover: show Tooltip with year and temperature
- [ ] Animate stripes on mount: staggered reveal left-to-right using Framer Motion
- [ ] Add x-axis labels for decade markers (1940, 1950, ..., 2020)
- [ ] Make responsive: recalculate on window resize

### 6.2 Calendar Heatmap (`src/components/visualizations/CalendarHeatmap.jsx`)
- [ ] Accept `data` prop: array of daily records; `year` prop: selected year
- [ ] Filter records to selected year
- [ ] Create SVG grid: 53 columns (weeks) × 7 rows (days)
- [ ] Position each day cell using `d3.timeWeek` and `d3.timeDay`
- [ ] Color each cell by `temp_max` using `d3.scaleSequential(d3.interpolateRdYlBu).domain([10, 40])`
- [ ] Add month labels above grid
- [ ] Add day-of-week labels (Mon, Wed, Fri)
- [ ] Implement hover: show Tooltip with date, T_max, T_min, precipitation
- [ ] Implement click: open modal with full day details
- [ ] Add year selector dropdown above chart
- [ ] Highlight cells where `temp_max >= 30` with a dot marker
- [ ] Highlight cells where `temp_min >= 20` with a border
- [ ] Add color legend below chart
- [ ] Make responsive: scale SVG viewBox

### 6.3 Ridgeline Plot (`src/components/visualizations/RidgelinePlot.jsx`)
- [ ] Accept `data` prop: daily records
- [ ] Group records by decade
- [ ] For each decade, compute kernel density estimate of `temp_max` distribution (D3 `d3.kde`)
- [ ] Create SVG with shared x-axis (temperature) and y-axis (decades, stacked)
- [ ] Draw each decade as a filled area path using `d3.area`
- [ ] Color fill by decade (cool → warm gradient)
- [ ] Add overlap between ridges (Joy Division style)
- [ ] Add decade labels on y-axis
- [ ] Add x-axis with temperature ticks
- [ ] Add vertical reference line at 30°C
- [ ] Animate on scroll entry (Framer Motion)

### 6.4 Time Series Chart (`src/components/visualizations/TimeSeriesChart.jsx`)
- [ ] Accept `metrics` prop: annual metrics object; `activeMetric` prop
- [ ] Render Recharts `<LineChart>` with `<CartesianGrid>`, `<XAxis>`, `<YAxis>`, `<Tooltip>`, `<Legend>`
- [ ] Plot selected metric as `<Line>` with dot on hover
- [ ] Add trend line as second `<Line>` (dashed, computed from linear regression)
- [ ] Add `<Brush>` for zoom/pan
- [ ] Add metric toggle buttons: SU30, TR20, DTR, WSDI, CDD, CWD (above chart)
- [ ] Highlight record year (highest value) with custom dot
- [ ] Add `<ReferenceLine>` at decade boundaries
- [ ] Make responsive with `<ResponsiveContainer>`

### 6.5 Comparative Bar Chart (`src/components/visualizations/ComparativeBarChart.jsx`)
- [ ] Accept `decadalData` prop: decadal averages object
- [ ] Render Recharts `<BarChart>` with grouped bars
- [ ] X-axis: decades (1940s–2020s)
- [ ] Y-axis: metric value
- [ ] Bars: SU30 (red), TR20 (orange), WSDI (dark red)
- [ ] Add `<Tooltip>` with all three values
- [ ] Add `<Legend>`
- [ ] Animate bars on scroll entry
- [ ] Make responsive with `<ResponsiveContainer>`

### 6.6 Interactive Map (`src/components/visualizations/InteractiveMap.jsx`)
- [ ] Import Leaflet CSS in component
- [ ] Render `<MapContainer>` centered on `[-22.9250, -45.4620]`, zoom=12
- [ ] Add `<TileLayer>` with OpenStreetMap tiles
- [ ] Add `<Marker>` at coordinates with `<Popup>` showing location name and data coverage
- [ ] Add attribution: "© OpenStreetMap contributors"
- [ ] Set fixed height (400px) and width 100%
- [ ] Disable scroll zoom to prevent page scroll hijacking (enable on click)

### 6.7 Radial Chart (`src/components/visualizations/RadialChart.jsx`)
- [ ] Accept `data` prop: monthly averages by decade
- [ ] Create D3 radial/polar chart: 12 segments (months), radius = temperature
- [ ] Draw one path per decade (overlay)
- [ ] Color paths by decade
- [ ] Add month labels around perimeter
- [ ] Add radial grid lines at 10°C, 20°C, 30°C
- [ ] Add legend
- [ ] Animate on mount

---

## PHASE 7 — Storytelling Sections

### 7.1 ScrollySection Wrapper (`src/components/storytelling/ScrollySection.jsx`)
- [ ] Import and initialize Scrollama
- [ ] Accept `steps` prop (array of step content), `onStepEnter` callback, `onStepExit` callback
- [ ] Render sticky visualization container (position: sticky, top: 0)
- [ ] Render scrollable steps container with step divs
- [ ] Set `offset: 0.5` for trigger at viewport midpoint
- [ ] Call `onStepEnter({index, direction})` on step enter
- [ ] Resize observer to handle layout changes
- [ ] Clean up Scrollama instance on unmount

### 7.2 Intro Section (`src/components/storytelling/IntroSection.jsx`)
- [ ] Render hero with title "Pindamonhangaba: 85 Years of Warming"
- [ ] Show animated Climate Stripes on scroll
- [ ] Display stat: "Average temperature has increased by X°C since 1940" (from summary.json)
- [ ] Add map showing location of Pindamonhangaba
- [ ] Scroll step 1: stripes appear one by one
- [ ] Scroll step 2: highlight recent years (red stripes)
- [ ] Scroll step 3: show temperature anomaly label

### 7.3 Summer Section (`src/components/storytelling/SummerSection.jsx`)
- [ ] Render section title "The Summer That Never Ends"
- [ ] Show HD30 bar chart (animated)
- [ ] Scroll step 1: show 1940s bars
- [ ] Scroll step 2: animate through decades
- [ ] Scroll step 3: highlight 2020s bars, show comparison text
- [ ] Display stat: "In the 1980s, summer lasted X days. In 2024, it lasted Y days."
- [ ] Show ThresholdSlider widget below chart

### 7.4 Tropical Nights Section (`src/components/storytelling/TropicalNightsSection.jsx`)
- [ ] Render section title "Sleepless Nights"
- [ ] Show Calendar Heatmap with TR20 nights highlighted
- [ ] Scroll step 1: show 1960 calendar
- [ ] Scroll step 2: show 2000 calendar
- [ ] Scroll step 3: show 2024 calendar
- [ ] Display stat: "Tropical nights have increased by X% since 1940"
- [ ] Add explanatory text about health impacts

### 7.5 Heat Wave Section (`src/components/storytelling/HeatWaveSection.jsx`)
- [ ] Render section title "Heat Waves: The New Normal"
- [ ] Show heat wave timeline (horizontal bar chart, one bar per event)
- [ ] Scroll step 1: show pre-1980 events
- [ ] Scroll step 2: show 1980–2000 events
- [ ] Scroll step 3: show 2000–2024 events (more frequent, longer)
- [ ] Display stat: "The longest heat wave lasted X days in [year]"
- [ ] Show HWDI time series chart

### 7.6 Hottest Day Section (`src/components/storytelling/HottestDaySection.jsx`)
- [ ] Render section title "The Hottest Day on Record"
- [ ] Show special card: date, temperature, context paragraph
- [ ] Animate card entrance (scale + fade)
- [ ] Show Calendar Heatmap for that specific year, highlighting the hottest day
- [ ] Add "Where were you on this day?" interactive prompt with birth year input
- [ ] Show PersonalTimeline widget

### 7.7 Cost Section (`src/components/storytelling/CostSection.jsx`)
- [ ] Render section title "The Cost of Heat"
- [ ] Show AC Calculator widget
- [ ] Show comparison: estimated AC hours 1990 vs 2024
- [ ] Add bar chart: hours above 25°C per year
- [ ] Add text about energy consumption and health implications

### 7.8 Future Section (`src/components/storytelling/FutureSection.jsx`)
- [ ] Render section title "What's Next?"
- [ ] Show trend extrapolation chart (HD30 projected to 2050)
- [ ] Add uncertainty band (shaded area)
- [ ] Display projected HD30 by 2050 based on linear trend
- [ ] Add climate action links
- [ ] Add data download buttons (CSV, JSON)
- [ ] Add social sharing buttons

---

## PHASE 8 — Interactive Widgets

### 8.1 Year Selector (`src/components/widgets/YearSelector.jsx`)
- [ ] Render two `<select>` dropdowns: Year A (default 1980), Year B (default 2024)
- [ ] Populate options from 1940–2025
- [ ] Render comparison table with rows: SU25, SU30, SU32, TR20, DTR, WSDI, TX90p, TN90p, CDD, CWD, GDD
- [ ] Highlight cells where Year B > Year A (red) or < Year A (blue)
- [ ] Add "Reset" button to restore defaults

### 8.2 Threshold Slider (`src/components/widgets/ThresholdSlider.jsx`)
- [ ] Render `<input type="range">` min=25, max=35, step=0.5
- [ ] Display current threshold value
- [ ] On change: recalculate days above threshold for each year from `dailyData`
- [ ] Update time series chart in real time
- [ ] Show current count for most recent year

### 8.3 AC Calculator (`src/components/widgets/ACCalculator.jsx`)
- [ ] Render year selector (1940–2025)
- [ ] On year change: filter daily records for that year
- [ ] Calculate `hours_above_25 = count(temp_max >= 25) * 8` (approximate daytime hours)
- [ ] Display: "Estimated AC hours needed: X"
- [ ] Display comparison to 1990 baseline
- [ ] Add cost estimate: `hours * 0.5kW * electricity_rate_BRL`
- [ ] Allow user to input electricity rate (default: R$0.80/kWh)

### 8.4 Personal Timeline (`src/components/widgets/PersonalTimeline.jsx`)
- [ ] Render birth year input (number, min=1940, max=2025)
- [ ] On submit: filter metrics from birth year to 2025
- [ ] Display: "In your lifetime, HD30 has increased from X to Y days/year"
- [ ] Display: "The hottest year of your life was [year] with X days above 30°C"
- [ ] Show mini time series chart for user's lifetime span

---

## PHASE 9 — App Assembly

### 9.1 App Component (`src/App.tsx`)
- [ ] Import `useClimateData` hook (typed)
- [ ] Show `<LoadingSpinner />` while loading
- [ ] Wrap in `<ErrorBoundary>` for render error fallback
- [ ] Render `<Header />` at top
- [ ] Render all storytelling sections in order: Intro, Summer, TropicalNights, HeatWave, HottestDay, Cost, Future
- [ ] Render `<Footer />` at bottom
- [ ] Pass typed `dailyData`, `metrics`, `summary` as props to sections
- [ ] Wrap visualization-heavy sections in `React.lazy` + `<Suspense>`

### 9.2 Data Flow
- [ ] Verify `useClimateData` fetches from correct paths (relative to `base` in vite.config)
- [ ] Verify all components receive correct data shape (TypeScript will catch mismatches)
- [ ] Ensure all component props are typed with interfaces from `src/types/climate.ts`

---

## PHASE 10 — Accessibility & SEO

### 10.1 Accessibility Audit
- [ ] Add `role="img"` and `aria-label` to all SVG charts
- [ ] Add `<title>` and `<desc>` inside each SVG
- [ ] Add `<DataTable>` hidden alternative for each chart (visually hidden, screen reader accessible)
- [ ] Verify all interactive elements have visible focus styles
- [ ] Verify all form inputs have associated `<label>` elements
- [ ] Verify color contrast: run axe DevTools check
- [ ] Add `aria-live="polite"` region for dynamic content updates (threshold slider, year selector)
- [ ] Test keyboard navigation: Tab through all interactive elements
- [ ] Test with VoiceOver (macOS) or NVDA (Windows)

### 10.2 SEO
- [ ] Set `<title>` to "Pindamonhangaba Climate Data | 85 Years of Temperature Trends"
- [ ] Set `<meta name="description">` (150–160 chars)
- [ ] Add `<meta property="og:title">`, `og:description`, `og:image`, `og:url`
- [ ] Add `<meta name="twitter:card">`, `twitter:title`, `twitter:description`, `twitter:image`
- [ ] Generate `og-image.png` (1200×630px) with key stats
- [ ] Add Schema.org Dataset JSON-LD in `index.html`
- [ ] Create `public/sitemap.xml`
- [ ] Create `public/robots.txt` (allow all)

---

## PHASE 11 — Performance Optimization

- [ ] Wrap all visualization components in `React.lazy(() => import(...))`
- [ ] Add `<Suspense fallback={<LoadingSpinner />}>` around lazy components
- [ ] Implement service worker with Vite PWA plugin (`vite-plugin-pwa`)
- [ ] Configure PWA to cache `public/data/*.json` files
- [ ] Convert any PNG images to WebP format
- [ ] Add `<picture>` elements with WebP + PNG fallback
- [ ] Debounce scroll event handler (16ms / rAF)
- [ ] Debounce window resize handler (200ms)
- [ ] Use `useMemo` for expensive calculations in components (regression, density estimation)
- [ ] Use `useCallback` for event handlers passed as props
- [ ] Profile with React DevTools: identify unnecessary re-renders
- [ ] Switch Calendar Heatmap to Canvas if >1000 cells cause jank
- [ ] Run `npm run build` and check bundle size; split if >500KB

---

## PHASE 12 — Testing

### 12.1 Unit Tests (Jest + React Testing Library)
- [ ] Set up Jest config in `package.json`
- [ ] Install: `npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom`
- [ ] Test `linearRegression(xArr, yArr)`: known input → expected slope/intercept
- [ ] Test `movingAverage(arr, window)`: known input → expected output
- [ ] Test `percentile(arr, p)`: known input → expected value
- [ ] Test `groupByYear(records)`: verify correct grouping
- [ ] Test `calculate_wsdi` Python function: streak of ≥6 consecutive days above p90 → days counted correctly; streak of 5 → not counted
- [ ] Test `calculate_tx90p` Python function: known dataset with known percentiles → correct annual percentage
- [ ] Test `calculate_tn90p` Python function: known dataset with known percentiles → correct annual percentage
- [ ] Test `calculate_cdd` Python function: known dry streak → correct max
- [ ] Test `calculate_cwd` Python function: known wet streak → correct max
- [ ] Test `ClimateStripes` renders correct number of `<rect>` elements
- [ ] Test `TimeSeriesChart` renders without crashing with mock data
- [ ] Test `ThresholdSlider` updates displayed count on change
- [ ] Test `ACCalculator` computes correct hours for mock year data

### 12.2 Integration Tests
- [ ] Test `useClimateData` hook: mock fetch, verify state transitions (loading → data)
- [ ] Test full App render: mock data, verify sections render
- [ ] Test scroll trigger: simulate scroll, verify section state changes

### 12.3 Python Tests
- [ ] Create `data/tests/test_process.py`
- [ ] Test missing value interpolation: inject NaN, verify filled
- [ ] Test validation: inject T_min > T_max, verify error logged
- [ ] Test metric calculations: known dataset → expected SU30 count
- [ ] Test WSDI baseline: verify p90 is computed only from 1961–1990 and not from the full dataset
- [ ] Test CWD/CDD edge case: all-dry year → CWD=0, CDD=365

---

## PHASE 13 — CI/CD & Deployment

### 13.1 GitHub Actions
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Configure trigger: `push` to `main`, `workflow_dispatch`
- [ ] Add scheduled trigger: `cron: '0 6 1 1 *'` (annual data refresh)
- [ ] Job `build`: checkout, setup Node 20, `npm ci`, `npm run build`, upload artifact
- [ ] Job `deploy`: deploy to GitHub Pages using `actions/deploy-pages@v4`
- [ ] Add `permissions: pages: write, id-token: write`
- [ ] Create `.github/workflows/ci.yml` for PRs: lint + test on every PR
- [ ] Add Lighthouse CI step in CI workflow

### 13.2 Repository Settings
- [ ] Enable GitHub Pages: Settings → Pages → Source → GitHub Actions
- [ ] Add `.nojekyll` file to `public/` to prevent Jekyll processing
- [ ] Verify `base` in `vite.config.ts` matches repository name

### 13.3 Monitoring
- [ ] Add Lighthouse CI config (`lighthouserc.json`): assert FCP <1500ms, LCP <2500ms, score >90
- [ ] Add Lighthouse CI step to CI workflow

---

## PHASE 14 — Documentation

- [ ] Update `README.md`: project description, live link, screenshots, data sources, local setup instructions
- [ ] Create `docs/API.md`: document Open-Meteo API usage, parameters, rate limits
- [ ] Create `docs/DATA_SOURCES.md`: document all data sources, comparison table, attribution
- [ ] Create `docs/DEPLOYMENT.md`: step-by-step deployment guide
- [ ] Add JSDoc comments to all utility functions
- [ ] Add inline comments to complex D3 code
- [ ] Update `CHANGELOG.md` with v1.0.0 entry
