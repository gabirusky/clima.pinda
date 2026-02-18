# 🌡️ Pindamonhangaba Climate Data

> **85+ years of historical climate data (1940–present) for Pindamonhangaba, SP, Brazil — visualized as an interactive, scrollytelling-driven web experience.**

🔗 **Live site**: _[coming soon — link after GitHub Pages deployment]_

---

## 📖 About

This project analyzes and visualizes climate trends for **Pindamonhangaba, SP, Brazil** (Praça Monsenhor Marcondes, -22.9250°, -45.4620°) using 85+ years of ERA5 reanalysis data from Open-Meteo.

**Key question**: How many days per year have exceeded 30°C historically, and what trends can we identify?

### Visualizations
- 🌈 **Climate Stripes** — Ed Hawkins-style warming visualization (1940–2024)
- 📅 **Calendar Heatmap** — GitHub-style daily temperature grid per year
- 📊 **Ridgeline Plot** — Temperature distribution shift by decade (Joy Division style)
- 📈 **Time Series Charts** — Annual metrics with trend lines (HD30, TR20, DTR, CDD)
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
- Python 3.10+

### Frontend
```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Data Pipeline (Python)
```bash
cd data
pip install -r requirements.txt

# 1. Fetch raw data from Open-Meteo (1940–2024)
python scripts/fetch_climate_data.py

# 2. Clean and validate
python scripts/process_climate_data.py

# 3. Calculate climate metrics
python scripts/calculate_metrics.py

# 4. Generate web-ready JSON
python scripts/generate_web_data.py
```

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
| 2. Data Acquisition | 🔲 Pending |
| 3. Data Processing | 🔲 Pending |
| 4. Frontend Setup | 🔲 Pending |
| 5. Core Visualizations | 🔲 Pending |
| 6. Storytelling Sections | 🔲 Pending |
| 7. Interactive Widgets | 🔲 Pending |
| 8. Polish & Deployment | 🔲 Pending |
