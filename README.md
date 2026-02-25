# 🌡️ A City's Memory of Heat
### *Pindamonhangaba — 85 years of temperature data, rendered as an immersive human story*

> **"Pindamonhangaba is warming. Here is the proof."**

🔗 **Live site**: _[coming soon — link after GitHub Pages deployment]_

---

## The Concept

This is not a chart. It is a document of lived experience.

This project transforms 85+ years of ERA5 climate reanalysis for **Pindamonhangaba, SP, Brazil** into a scrollytelling data experience — part scientific instrument, part emotional record of a valley slowly heating. The design treats time as geological strata: scroll down through decades of heat, watch the colors shift from cool blues to bleeding reds, feel the weight of numbers rendered at 160px.

**The design rule**: *If a user can read the whole page without feeling the heat — the design has failed.*

---

## Visual Language

| Element | Direction |
|---------|-----------|
| **Typography** | Syne (geometric, unsettling at large sizes) + DM Sans (warm, readable body) |
| **Color anchor** | Ed Hawkins climate stripe palette — the ambient background gradient that shifts as you scroll |
| **Hero** | Full-bleed animated climate stripes as *painting*, not chart. Years fade on hover. |
| **Data weight** | Key stats at 120–160px — `+2.4°C` as physical object |
| **Scrollytelling** | Each chapter = a page turn in a field notebook. Evidence laid on a table, slowly. |
| **Micro-interactions** | Ridgeline drift animates one decade at a time. Calendar heatmap fills day-by-day like a timelapse. |

---

## Storytelling Sections

| # | Chapter | Emotional Intent |
|---|---------|-----------------|
| 1 | **The Warming Valley** | Climate stripes as painting. The whole arc of 85 years in one glance. |
| 2 | **The Summer That Never Ends** | The heat season is growing. Day by day. Year by year. |
| 3 | **Sleepless Nights** | Nights above 20°C mean no rest without AC. This is now the norm. |
| 4 | **Heat Waves: The New Normal** | Warm spells that were exceptions are now the rhythm. |
| 5 | **The Hottest Day on Record** | 38.2°C. September 28, 1961. Record card, intimate scale. |
| 6 | **The Cost of Heat** | The AC Calculator. Monospaced, receipts-style. The total lands uncomfortably. |
| 7 | **What's Next?** | Trend lines projected to 2050. Uncertainty bands. A question left open. |

---

## Climate Metrics (ETCCDI Standard)

> All indices follow the [ETCCDI 27-index standard](http://etccdi.pacificclimate.org/list_27_indices.shtml), ensuring direct comparability with peer-reviewed climate science.

| Metric | ETCCDI Index | Definition |
|--------|-------------|------------|
| **SU25** | SU25 ✅ exact | Days where T\_max ≥ 25°C |
| **SU30** | SU30 (modified) | Days where T\_max ≥ 30°C (locally meaningful threshold) |
| **TR20** | TR20 ✅ exact | Nights where T\_min ≥ 20°C |
| **DTR** | DTR ✅ exact | Mean(T\_max − T\_min) per year |
| **WSDI** | WSDI ✅ exact | Days in warm spells ≥6 consecutive above calendar-day p90 (1961–1990 baseline) |
| **TX90p** | TX90p ✅ exact | % of days where T\_max > calendar-day 90th percentile |
| **TN90p** | TN90p ✅ exact | % of nights where T\_min > calendar-day 90th percentile |
| **CDD** | CDD ✅ exact | Max consecutive dry days (precip < 1mm) |
| **CWD** | CWD ✅ exact | Max consecutive wet days (precip ≥ 1mm) |
| **GDD** | — | Growing Degree Days: SUM(MAX(0, (T\_max+T\_min)/2−10)) |

---

## Key Findings

> Produced by `data/scripts/calculate_metrics.py` · 86 years · 31,412 daily records

| Metric | Full-period avg | Record | Trend (per decade) | p-value |
|---|---|---|---|---|
| SU30 (days ≥30°C) | 43.3 /yr | **140 days — 2024** | **+7.1 days** | < 0.0001 ✅ |
| TR20 (nights ≥20°C) | 31.6 /yr | **99 nights — 2017** | **+5.0 nights** | < 0.0001 ✅ |
| WSDI days | 13.3 /yr | **82 days — 2018** | **+3.9 days** | < 0.0001 ✅ |
| DTR mean | 9.75°C /yr | — | **+0.11°C** | < 0.0001 ✅ |

**Decade comparison — SU30:**

| Decade | SU30 | WSDI | TR20 |
|---|---|---|---|
| 1940s | 23.2 d/yr | 4.2 d/yr | 36.8 n/yr |
| 1980s | 32.7 | 7.1 | 25.9 |
| **2010s** | **75.4** | **32.6** | **61.5** |
| **2020s** | **108.2** | **49.2** | **68.0** |

The 2010s show a **dramatic inflection** — SU30 more than doubled from the 1980s baseline. All four trends are statistically significant at p < 0.0001.

---

## Tech Stack

| Layer | Technology |
<<<<<<< HEAD
|-------|-----------|
| Frontend | React 18 + Vite 5 + **TypeScript** (strict) |
| Component Library | **shadcn/ui** (Radix primitives, code-owned) |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`, no config file) |
| Visualizations | D3.js v7 + Recharts |
| Animations | Framer Motion 11 |
| Scrollytelling | Scrollama.js 3 |
| Map | Leaflet.js 1.9 + react-leaflet |
| Data Pipeline | Python 3.10+ (pandas, numpy, scipy, requests) |
=======
|-------|-----------| 
| Frontend | React 18 + Vite 5 + TypeScript |
| Visualizations | D3.js v7 + Recharts |
| Animations | Framer Motion 11+ |
| Scrollytelling | Scrollama.js |
| Map | Leaflet.js |
| Styling | Tailwind CSS v4 (CSS-first) + shadcn/ui |
| Data Pipeline | Python 3.10+ (pandas, numpy, requests) |
>>>>>>> 004c615 (feat: new plan and frontend foundation)
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

---

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- [Conda](https://docs.conda.io/en/latest/miniconda.html) (recommended for the data pipeline)
- Python 3.10+

### Frontend
```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Data Pipeline (Python)

**Recommended — conda** (`data/environment.yml`, Python 3.11, pinned deps):
```bash
conda env create -f data/environment.yml
conda activate pinda-climate

python data/scripts/fetch_climate_data.py    # 1. Fetch raw data from Open-Meteo (1940–2025)
python data/scripts/process_climate_data.py  # 2. Clean and validate
python data/scripts/calculate_metrics.py     # 3. Calculate ETCCDI climate metrics
python data/scripts/generate_web_data.py     # 4. Generate web-ready JSON
```

**Alternative — pip:**
```bash
cd data
pip install -r requirements.txt
python scripts/fetch_climate_data.py
python scripts/process_climate_data.py
python scripts/calculate_metrics.py
python scripts/generate_web_data.py
```

### Exploratory Notebook

```bash
conda activate pinda-climate
jupyter notebook data/notebooks/exploratory_analysis.ipynb
```

---

## 📁 Project Structure

```
├── data/
│   ├── scripts/                    # Python data pipeline
│   │   ├── fetch_climate_data.py   #   1. Fetch raw data (Open-Meteo ERA5)
│   │   ├── validate_cross_source.py#   2. ERA5 vs MERRA-2 cross-validation
│   │   ├── process_climate_data.py #   3. Clean & validate daily records
│   │   ├── calculate_metrics.py    #   4. Compute all ETCCDI indices
│   │   └── generate_web_data.py    #   5. Export JSON for frontend
│   ├── notebooks/                  # Jupyter exploration
│   ├── raw/                        # Raw API responses (gitignored)
│   └── processed/                  # Cleaned CSVs (gitignored)
├── public/
│   └── data/                       # JSON consumed by frontend
│       ├── climate_data.json        #   31,412 daily records (4.3 MB, also .gz)
│       ├── metrics.json             #   86 annual ETCCDI metric records
│       └── summary.json             #   Headline stats & decade comparisons
├── src/
<<<<<<< HEAD
│   ├── main.tsx                    # React 18 entry point
│   ├── App.tsx                     # Root component
│   ├── index.css                   # Tailwind v4 @theme design system
│   ├── types/
│   │   └── climate.ts              # DailyRecord, AnnualMetrics, ClimateSummary
│   ├── constants/
│   │   ├── config.ts               # LAT, LON, DATA_BASE_URL, REPO_BASE
│   │   └── thresholds.ts           # SU30/TR20/WSDI/CDD/CWD thresholds
│   ├── hooks/
│   │   ├── useClimateData.ts       # Parallel fetch of all 3 JSON files
│   │   ├── useScrollPosition.ts    # rAF-throttled scroll Y
│   │   └── useWindowSize.ts        # 200ms-debounced window dimensions
│   ├── utils/
│   │   ├── colors.ts               # tempToColor, anomalyToStripeColor
│   │   ├── formatters.ts           # formatTemp, formatDate, formatDecade…
│   │   ├── calculations.ts         # linearRegression, movingAverage, KDE…
│   │   └── dataProcessing.ts       # groupByYear/Decade, filterByYear…
│   ├── lib/
│   │   └── utils.ts                # cn() helper (shadcn/ui)
│   └── components/
│       ├── ui/                     # shadcn/ui generated components
│       ├── common/                 # Shared primitives
│       │   ├── LoadingSpinner.tsx
│       │   ├── ErrorBoundary.tsx
│       │   ├── Tooltip.tsx
│       │   ├── DataTable.tsx       # Accessible chart alternative (WCAG)
│       │   └── SectionTitle.tsx    # Animated h2 with sliding underline
│       ├── layout/                 # Header, Footer, Navigation (Phase 5)
│       ├── visualizations/         # D3 & Recharts charts (Phase 6)
│       ├── storytelling/           # Scrolly sections (Phase 7)
│       └── widgets/                # Interactive controls (Phase 8)
├── .github/workflows/              # CI/CD
└── docs/                           # API, data sources, deployment guides
=======
│   ├── components/
│   │   ├── layout/       # Header, Footer
│   │   ├── visualizations/ # D3 + Recharts charts
│   │   ├── storytelling/ # Scrolly narrative sections
│   │   ├── widgets/      # Interactive controls
│   │   └── common/       # Shared UI primitives
│   ├── hooks/            # useClimateData, useScrollPosition
│   ├── utils/            # dataProcessing, calculations, formatters, colors
│   ├── styles/           # index.css — Tailwind v4 + design system
│   └── constants/        # config.ts, thresholds.ts
├── .github/workflows/    # CI/CD
└── docs/                 # API, data sources, deployment
>>>>>>> 004c615 (feat: new plan and frontend foundation)
```

---

## 📊 Data Sources & Validation

| Source | Coverage | Use |
|--------|----------|-----|
| **Open-Meteo** ⭐ | 1940–present | Primary (ERA5 reanalysis via Copernicus/ECMWF) |
| Copernicus CDS | 1940–present | Scientific validation |
| NASA POWER | 1981–present | Cross-source validation |
| INMET | Variable | Ground-truth reference |

**ERA5 vs MERRA-2 Cross-Validation** (10 years, 3,653 daily records):

| Check | Result | Benchmark | Status |
|---|---|---|---|
| r T_max | 0.893 | > 0.85 | ✅ |
| r T_min | 0.926 | > 0.88 | ✅ |
| RMSE T_max | 1.75°C | < 3.0°C | ✅ |
| RMSE T_min | 1.98°C | < 3.0°C | ✅ |
| T_min bias ERA5 vs MERRA-2 | +1.51°C | Known inter-reanalysis difference | ℹ️ |

> The +1.51°C T_min warm bias is a documented ERA5 characteristic — ERA5's finer ~9km grid resolves Pindamonhangaba's nocturnal cold-air pooling better than MERRA-2's ~50km grid.

---

## 📈 Implementation Progress

| Phase | Status |
|-------|--------|
| 1. Project Scaffolding | ✅ Complete |
| 2. Data Acquisition | ✅ Complete |
<<<<<<< HEAD
| 3. Data Processing | ✅ Complete (3.1 clean · 3.2 metrics · 3.3 web data) |
| **4. Frontend Foundation** | **✅ Complete** |
| 5. Layout Components | 🔲 Next |
| 6. Visualization Components | 🔲 Pending |
| 7. Storytelling Sections | 🔲 Pending |
| 8. Interactive Widgets | 🔲 Pending |
| 9. App Assembly | 🔲 Pending |
| 10–14. Accessibility / Perf / Tests / CI / Docs | 🔲 Pending |

### Phase 4 Deliverables (Frontend Foundation)
- **TypeScript types** (`src/types/climate.ts`): `DailyRecord`, `AnnualMetrics`, `DecadalMetrics`, `ClimateSummary` — field names match exact JSON output of Phase 3 Python scripts
- **Design system** (`src/index.css`): Tailwind v4 `@theme` with Ed Hawkins stripe palette, temperature color scale, Syne + DM Sans + JetBrains Mono fonts, keyframes
- **Constants**: ETCCDI-aligned thresholds (SU30, TR20, WSDI baseline 1961–1990, anomaly baseline 1940–1980)
- **Utilities** — 4 modules, 30+ pure functions:
  - `colors.ts` — tempToColor, anomalyToStripeColor (Ed Hawkins 9-color), su30ToColor, lerpColor
  - `formatters.ts` — pt-BR localized: formatTemp, formatDate, formatDecade, formatSlope, formatPercent
  - `calculations.ts` — linearRegression (OLS + R²/p-value), movingAverage, percentile, KDE (Epanechnikov)
  - `dataProcessing.ts` — groupByYear/Decade, filterByYear, metricsToArray, extractTimeSeries, monthlyAverages
- **Hooks**: useClimateData (parallel fetch, string→number key coercion), useScrollPosition (rAF), useWindowSize (debounced)
- **Common components**: LoadingSpinner, ErrorBoundary, Tooltip (auto-flip), DataTable (WCAG 2.1 AA), SectionTitle (Framer Motion)
- **Smoke test**: Dev server loads ✅ · `tsc --noEmit` → 0 errors ✅
=======
| 3. Data Processing | ✅ Complete (clean · metrics · web data) |
| 4. Frontend Foundation | ✅ Complete (design system · types · utils · hooks · common components) |
| 5. Layout & Core Components | 🔲 In progress (LoadingSpinner ✅ · SectionTitle ✅ · StatCallout ✅ · Header/Footer/Tooltip/DataTable pending) |
| 6. Visualizations | 🔲 Pending |
| 7. Scrollytelling Sections | 🔲 Pending |
| 8. Polish & Deployment | 🔲 Pending |
>>>>>>> 004c615 (feat: new plan and frontend foundation)

---

## 📄 License & Attribution

- **Code**: MIT License
- **Climate data**: CC BY 4.0 — [Open-Meteo](https://open-meteo.com/) (ERA5 reanalysis via Copernicus/ECMWF)
- **Visualization style**: Inspired by [Ed Hawkins' Climate Stripes](https://showyourstripes.info/)
- **Map tiles**: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
