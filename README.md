# 🌡️ Pindamonhangaba Climate Data

> **85+ years of historical climate data (1940–present) for Pindamonhangaba, SP, Brazil — visualized as an interactive, scrollytelling-driven web experience.**

🔗 **Live site**: _[coming soon — link after GitHub Pages deployment]_

---

## 📖 About

This project analyzes and visualizes climate trends for **Pindamonhangaba, SP, Brazil** (Praça Monsenhor Marcondes, -22.9250°, -45.4620°) using 85+ years of ERA5 reanalysis data from Open-Meteo.

**Key question**: How many days per year have exceeded 30°C historically, and what trends can we identify? All climate indices are aligned with the **ETCCDI 27-index standard** (Expert Team on Climate Change Detection and Indices), ensuring findings are directly comparable to peer-reviewed scientific literature.

### Visualizations
- 🌈 **Climate Stripes** — Ed Hawkins-style warming visualization (1940–2025)
- 📅 **Calendar Heatmap** — GitHub-style daily temperature grid per year
- 📊 **Ridgeline Plot** — Temperature distribution shift by decade (Joy Division style)
- 📈 **Time Series Charts** — Annual metrics with trend lines (SU30, TR20, DTR, WSDI, CDD, CWD)
- 📊 **Comparative Bar Charts** — Decade-by-decade comparisons
- 🗺️ **Interactive Map** — Location context
- 🌀 **Radial Chart** — Monthly temperature cycle by decade

### Storytelling Sections
1. The Warming Valley
2. The Summer That Never Ends
3. Sleepless Nights
4. Heat Waves: The New Normal
5. The Hottest Day on Record
6. The Cost of Heat
7. What's Next?

---

## 📐 Climate Metrics (ETCCDI Standard)

> All indices follow the [ETCCDI 27-index standard](http://etccdi.pacificclimate.org/list_27_indices.shtml), ensuring comparability with peer-reviewed climate science literature.

| Metric | ETCCDI Index | Definition |
|--------|-------------|------------|
| **SU25** | SU25 ✅ exact | Days where T\_max ≥ 25°C |
| **SU30** | SU30 (modified) | Days where T\_max ≥ 30°C (locally meaningful threshold) |
| **TR20** | TR20 ✅ exact | Nights where T\_min ≥ 20°C |
| **DTR** | DTR ✅ exact | Mean(T\_max − T\_min) per year; long-term decrease = UHI signal |
| **WSDI** | WSDI ✅ exact | Days in warm spells: ≥6 consecutive days where T\_max > calendar-day 90th percentile (1961–1990 baseline) |
| **TX90p** | TX90p ✅ exact | % of days where T\_max > calendar-day 90th percentile of baseline |
| **TN90p** | TN90p ✅ exact | % of nights where T\_min > calendar-day 90th percentile of baseline |
| **CDD** | CDD ✅ exact | Max consecutive dry days (precip < 1mm) |
| **CWD** | CWD ✅ exact | Max consecutive wet days (precip ≥ 1mm) |
| **GDD** | — | Growing Degree Days: SUM(MAX(0, (T\_max+T\_min)/2−10)) |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Visualizations | D3.js v7 + Recharts |
| Animations | Framer Motion |
| Scrollytelling | Scrollama.js |
| Map | Leaflet.js |
| Styling | Tailwind CSS |
| Data Pipeline | Python 3.10+ (pandas, numpy, requests) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

---

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- [Conda](https://docs.conda.io/en/latest/miniconda.html) (recommended for the data pipeline & notebook)
- Python 3.10+ (if using pip instead of conda)

### Frontend
```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Data Pipeline (Python)

**Recommended — conda** (uses `data/environment.yml`, Python 3.11, pinned deps):
```bash
# One-time: create the environment
conda env create -f data/environment.yml

# Activate it
conda activate pinda-climate

# Run the pipeline steps
python data/scripts/fetch_climate_data.py    # 1. Fetch raw data from Open-Meteo (1940–2025)
python data/scripts/process_climate_data.py  # 2. Clean and validate
python data/scripts/calculate_metrics.py     # 3. Calculate climate metrics
python data/scripts/generate_web_data.py     # 4. Generate web-ready JSON
```

**Alternative — pip** (plain virtualenv):
```bash
cd data
pip install -r requirements.txt

python scripts/fetch_climate_data.py
python scripts/process_climate_data.py
python scripts/calculate_metrics.py
python scripts/generate_web_data.py
```

### Exploratory Notebook

The notebook at `data/notebooks/exploratory_analysis.ipynb` performs sanity checks and visual exploration of the raw CSV before processing. It requires the same conda environment:

```bash
# 1. Activate the environment (create it first if you haven't — see above)
conda activate pinda-climate

# 2. Launch Jupyter
jupyter notebook data/notebooks/exploratory_analysis.ipynb
```

> **VS Code users**: open the `.ipynb` file and select **`pinda-climate`** from the kernel picker in the top-right corner. No separate Jupyter launch needed.

**Packages used by the notebook:**

| Package | Purpose |
|---|---|
| `pandas >= 2.2` | CSV loading, `.resample("YE")`, groupby |
| `numpy >= 1.26` | Array operations |
| `matplotlib >= 3.8` | All charts |
| `seaborn >= 0.13` | Heatmap, boxplot |
| `scipy >= 1.11` | Statistical support |
| `jupyter` | Notebook runtime |

---

## 📁 Project Structure

```
├── data/
│   ├── scripts/          # Python data pipeline
│   ├── notebooks/        # Jupyter exploration
│   ├── raw/              # Raw API responses (gitignored)
│   └── processed/        # Cleaned CSVs (gitignored)
├── public/
│   └── data/             # JSON consumed by frontend
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   ├── styles/           # CSS design system
│   └── constants/        # Config and thresholds
├── .github/workflows/    # CI/CD
└── docs/                 # Documentation
```

---

## 📊 Data Sources

| Source | Coverage | Use |
|--------|----------|-----|
| **Open-Meteo** ⭐ | 1940–present | Primary (ERA5 via instant JSON API) |
| Copernicus CDS | 1940–present | Scientific validation |
| NASA POWER | 1981–present | Secondary validation |
| INMET | Variable | Ground-truth validation |

---

## ✅ Data Validation

The ERA5 data (Open-Meteo) was cross-validated against **NASA POWER (MERRA-2 reanalysis)** — a completely independent satellite dataset with a different underlying model — using `data/scripts/validate_cross_source.py`.

**10 sample years tested** (1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2022, 2024) · **3,653 daily records** compared

| Check | Result | Benchmark | Status |
|---|---|---|---|
| r T_max (ERA5 vs MERRA-2) | 0.893 | > 0.85 | ✅ |
| r T_min (ERA5 vs MERRA-2) | 0.926 | > 0.88 | ✅ |
| RMSE T_max | 1.75°C | < 3.0°C | ✅ |
| RMSE T_min | 1.98°C | < 3.0°C | ✅ |
| Seasons correct (DJF > JJA) | 27.7°C vs 23.5°C | DJF warmer | ✅ |
| T_min bias ERA5 vs MERRA-2 | +1.51°C | Known inter-reanalysis difference | ℹ️ |

> **Interpretation**: The +1.51°C T_min warm bias is a documented characteristic of ERA5 vs MERRA-2 comparisons. ERA5's finer ~9km grid resolves the Paraíba Valley's nocturnal cold-air pooling better than MERRA-2's coarser ~50km grid. This is not a data error — it reflects the higher spatial resolution of the ERA5 model.

> **Internal validation** (via `exploratory_analysis.ipynb`): 0 T_min > T_max violations, 0 out-of-range values across all 31,047 daily records.

---

## 📄 License & Attribution

- **Code**: MIT License
- **Climate data**: CC BY 4.0 — provided by [Open-Meteo](https://open-meteo.com/) (ERA5 reanalysis via Copernicus/ECMWF)
- **Visualization style**: Inspired by [Ed Hawkins' Climate Stripes](https://showyourstripes.info/)
- **Map tiles**: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors

---

## 📈 Implementation Progress

| Phase | Status |
|-------|--------|
| 1. Project Scaffolding | ✅ Complete |
| 2. Data Acquisition | ✅ Complete |
| 3. Data Processing | 🔄 In Progress (3.1 ✅ · 3.2 ✅) |
| 4. Frontend Setup | 🔲 Pending |
| 5. Core Visualizations | 🔲 Pending |
| 6. Storytelling Sections | 🔲 Pending |
| 7. Interactive Widgets | 🔲 Pending |
| 8. Polish & Deployment | 🔲 Pending |

---

## 🔬 Computed Metrics — Key Findings

> Produced by `data/scripts/calculate_metrics.py` · 86 years · 31,412 daily records · runtime ~3s

| Metric | Full-period avg | Record | Trend (slope/decade) | p-value |
|---|---|---|---|---|
| SU25 (days ≥25°C) | 224.8 /yr | 303 days — **2024** | — | — |
| SU30 (days ≥30°C) | 43.3 /yr | 140 days — **2024** | **+7.1 days** | < 0.0001 ✅ |
| TR20 (nights ≥20°C) | 31.6 /yr | 99 nights — **2017** | **+5.0 nights** | < 0.0001 ✅ |
| DTR mean | 9.75°C /yr | — | **+0.11°C** | < 0.0001 ✅ |
| WSDI days | 13.3 /yr | 82 days — **2018** | **+3.9 days** | < 0.0001 ✅ |
| TX90p | 13.3% /yr | — | — | — |
| TN90p | 14.6% /yr | — | — | — |
| CDD max | 24.7 /yr | 49 days — **2025** | — | — |
| CWD max | 20.7 /yr | 55 days — **1965** | — | — |

**Decade comparison (SU30 · WSDI · TR20):**

| Decade | SU30 | WSDI | TR20 |
|---|---|---|---|
| 1940s | 23.2 d/yr | 4.2 d/yr | 36.8 n/yr |
| 1980s | 32.7 | 7.1 | 25.9 |
| 2010s | **75.4** | **32.6** | **61.5** |
| 2020s | **108.2** | **49.2** | **68.0** |

All four tested trend metrics (SU30, TR20, DTR, WSDI) are **statistically significant at p < 0.0001** (Mann-Kendall τ test + OLS regression). The 2010s show a dramatic inflection — SU30 more than doubled from the 1980s baseline.
