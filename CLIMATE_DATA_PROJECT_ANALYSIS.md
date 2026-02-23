# Climate Data Visualization Project - Pindamonhangaba
## Full Technical Analysis & Requirements Document

---

## 📋 Executive Summary

**Project Goal**: Create an interactive, storytelling-driven climate data visualization platform hosted on GitHub Pages that analyzes 85+ years of historical climate data (1940-present) for Pindamonhangaba, SP, Brazil.

**Target Location**: 
- **Coordinates**: Latitude -22.9250, Longitude -45.4620
- **Location**: Praça Monsenhor Marcondes (Historic/Commercial Center)
- **Rationale**: Centralized in main urban area, valley floor location (9x9km pixel coverage)

**Key Question**: How many days per year have exceeded 30°C historically, and what trends can we identify?

---

## 🎯 Functional Requirements

### FR1: Data Acquisition & Processing

#### FR1.1: Climate Data Sources

**Primary Source**:

1. **Open-Meteo Historical Weather API** ⭐ (Recommended — Primary)
   - **Endpoint**: `https://archive-api.open-meteo.com/v1/archive`
   - **Coverage**: 1940-present (ERA5 reanalysis data)
   - **Resolution**: 11km (ERA5-Land reanalysis, with smart interpolation)
   - **Parameters Available**:
     - `temperature_2m_max`: Maximum Temperature at 2m (°C)
     - `temperature_2m_min`: Minimum Temperature at 2m (°C)
     - `temperature_2m_mean`: Average Temperature at 2m (°C)
     - `precipitation_sum`: Precipitation (mm/day)
     - `relative_humidity_2m_mean`: Relative Humidity at 2m (%)
     - `windspeed_10m_max`: Maximum Wind Speed at 10m (km/h)
   - **Cost**: Free (non-commercial, with attribution)
   - **Rate Limit**: ~10,000 calls/day (free tier)
   - **Response Format**: JSON (instant, no queue)
   - **Key Advantage**: Automatically interpolates ERA5 grid data to your specific GPS coordinate using elevation correction — critical for Pindamonhangaba's valley location. No need to handle NetCDF/GRIB files.

**Alternative Sources**:

2. **Copernicus Climate Data Store (ERA5)** — The Raw Scientific Source
   - **Coverage**: 1940-present
   - **Resolution**: 9km (ERA5-Land)
   - **Quality**: Highest scientific standard (gold standard for citations)
   - **Access**: Requires registration, Python `cdsapi` client
   - **Format**: NetCDF/GRIB (binary, requires `xarray` to process)
   - **Latency**: Queue-based (minutes to hours)
   - **Use Case**: Formal scientific research, bulk offline analysis, academic papers
   - **Limitation**: Returns raw grid cell data — you must interpolate manually

3. **NASA POWER API**
   - **Endpoint**: `https://power.larc.nasa.gov/api/temporal/daily/point`
   - **Coverage**: 1981-present
   - **Resolution**: 0.5° x 0.5° (~50km) — significantly coarser
   - **Parameters Available**:
     - `T2M_MAX`, `T2M_MIN`, `T2M`, `PRECTOTCORR`, `RH2M`
   - **Cost**: Free
   - **Use Case**: Quick validation, secondary data source

4. **INMET (Instituto Nacional de Meteorologia)** - Brazil
   - **Endpoint**: `https://apitempo.inmet.gov.br/`
   - **Coverage**: Station-dependent (may have gaps)
   - **Resolution**: Station-based (highest accuracy if nearby station exists)
   - **Cost**: Free
   - **Limitation**: May require manual data download for historical data
   - **Use Case**: Ground-truth validation against reanalysis data

**Recommended Approach**: Use **Open-Meteo** as the primary data source for its instant JSON API, smart coordinate interpolation, and 80+ years of coverage. Validate with INMET station data if available. Use Copernicus CDS only if formal scientific citation is required.

> **Why Open-Meteo over Copernicus CDS?** Both deliver the same underlying ERA5 reanalysis data. Open-Meteo is a high-performance API wrapper that ingests ERA5, compresses it, and delivers it via instant JSON responses. It handles the complex "grid-to-point" interpolation automatically — essential for Pindamonhangaba's valley location where the raw 9km grid cell might average mountain peaks and valley floors together. See the [detailed comparison](#open-meteo-vs-copernicus-cds-detailed-comparison) below.

#### FR1.2: Data Fetching Implementation

```python
# Primary: Open-Meteo Historical Weather API
import requests
import pandas as pd

def fetch_open_meteo_data(lat, lon, start_date, end_date):
    """
    Fetch historical climate data from Open-Meteo Archive API.
    Returns instant JSON response with smart coordinate interpolation.
    
    Args:
        lat: Latitude (e.g., -22.9250 for Pindamonhangaba)
        lon: Longitude (e.g., -45.4620 for Pindamonhangaba)
        start_date: Start date string (YYYY-MM-DD)
        end_date: End date string (YYYY-MM-DD)
    """
    base_url = "https://archive-api.open-meteo.com/v1/archive"
    
    params = {
        'latitude': lat,
        'longitude': lon,
        'start_date': start_date,   # Format: YYYY-MM-DD
        'end_date': end_date,
        'daily': ','.join([
            'temperature_2m_max',
            'temperature_2m_min',
            'temperature_2m_mean',
            'precipitation_sum',
            'relative_humidity_2m_mean',
            'windspeed_10m_max'
        ]),
        'timezone': 'America/Sao_Paulo'
    }
    
    response = requests.get(base_url, params=params)
    data = response.json()
    
    # Convert to DataFrame for easy processing
    df = pd.DataFrame({
        'date': pd.to_datetime(data['daily']['time']),
        'temp_max': data['daily']['temperature_2m_max'],
        'temp_min': data['daily']['temperature_2m_min'],
        'temp_mean': data['daily']['temperature_2m_mean'],
        'precipitation': data['daily']['precipitation_sum'],
        'humidity': data['daily']['relative_humidity_2m_mean'],
        'wind_max': data['daily']['windspeed_10m_max']
    })
    
    return df

# Usage for Pindamonhangaba (1940-present, 85+ years)
df = fetch_open_meteo_data(
    lat=-22.9250,
    lon=-45.4620,
    start_date='1940-01-01',
    end_date='2025-12-31'
)
```

```python
# Alternative: Copernicus CDS (for scientific validation)
import cdsapi

def fetch_cds_era5_data():
    """
    Fetch ERA5 reanalysis data from Copernicus CDS.
    Requires registration and API key setup.
    WARNING: Queue-based — requests can take minutes to hours.
    """
    c = cdsapi.Client()
    c.retrieve(
        'reanalysis-era5-single-levels',
        {
            'product_type': 'reanalysis',
            'variable': ['2m_temperature'],
            'year': [str(y) for y in range(1940, 2025)],
            'month': [str(m).zfill(2) for m in range(1, 13)],
            'day': [str(d).zfill(2) for d in range(1, 32)],
            'time': ['00:00', '06:00', '12:00', '18:00'],
            'area': [-22.5, -46.0, -23.5, -45.0],  # N, W, S, E
            'format': 'netcdf',
        },
        'pindamonhangaba_era5.nc'
    )
    # Requires xarray to process the NetCDF file
```

#### FR1.3: Data Processing Pipeline

**Steps**:
1. **Fetch Raw Data**: Download 86+ years (1940-2025) of daily data from Open-Meteo
   - ✅ **Complete**: 31,047 rows · 1940-01-01 → 2025-12-31 · 1 NaN total
   - Script: `data/scripts/fetch_climate_data.py`
2. **Exploratory Analysis**: Jupyter notebook sanity checks before cleaning
   - ✅ **Complete**: 0 T_min > T_max violations, heatmap + boxplots generated
   - Notebook: `data/notebooks/exploratory_analysis.ipynb`
3. **Cross-Source Validation**: Compare ERA5 vs independent MERRA-2 (NASA POWER)
   - ✅ **Complete**: r T_max=0.893, r T_min=0.926, RMSE<2°C across 10 sample years
   - Script: `data/scripts/validate_cross_source.py`
   - Output: `data/raw/cross_validation_results.csv`, `data/notebooks/cross_validation_plot.png`
4. **Data Cleaning**:
   - Handle missing values (interpolation or flagging)
   - Validate temperature ranges (sanity checks)
   - Convert units if necessary
5. **Data Transformation**:
   - Calculate derived metrics (see FR2)
   - Aggregate by year, month, season
   - Generate statistical summaries
6. **Data Export**:
   - Export to JSON for web consumption
   - Export to CSV for backup/analysis
   - Compress if >500KB

### FR2: Climate Metrics Calculation

#### FR2.1: Core Metrics

1. **Hot Days (HD30)**
   - **Definition**: Days where T_max ≥ 30°C
   - **Calculation**: `COUNT(T2M_MAX >= 30) per year`
   - **Output**: Annual count, trend line

2. **Very Hot Days (HD32)**
   - **Definition**: Days where T_max ≥ 32°C
   - **Calculation**: `COUNT(T2M_MAX >= 32) per year`
   - **Purpose**: Distinguish extreme heat

3. **Tropical Nights (TR20)**
   - **Definition**: Nights where T_min ≥ 20°C
   - **Calculation**: `COUNT(T2M_MIN >= 20) per year`
   - **Impact**: Sleep quality, health, energy consumption

4. **Summer Days (SU25)**
   - **Definition**: Days where T_max ≥ 25°C
   - **Calculation**: `COUNT(T2M_MAX >= 25) per year`
   - **Purpose**: Extended warm season analysis

#### FR2.2: Advanced Metrics

5. **Diurnal Temperature Range (DTR)**
   - **Definition**: Daily temperature amplitude
   - **Calculation**: `T2M_MAX - T2M_MIN` per day
   - **Analysis**: 
     - Average DTR per year
     - Trend analysis (decreasing DTR = urban heat island)
     - Seasonal patterns

6. **Heat Wave Duration Index (HWDI)**
   - **Definition**: Sequences of 3+ consecutive days with T_max > 32°C
   - **Calculation**: 
     ```python
     def calculate_heat_waves(temps, threshold=32, min_duration=3):
         heat_wave_days = 0
         current_streak = 0
         heat_wave_events = []
         
         for temp in temps:
             if temp > threshold:
                 current_streak += 1
             else:
                 if current_streak >= min_duration:
                     heat_wave_events.append(current_streak)
                     heat_wave_days += current_streak
                 current_streak = 0
         
         return {
             'total_days': heat_wave_days,
             'events': len(heat_wave_events),
             'longest': max(heat_wave_events) if heat_wave_events else 0
         }
     ```

7. **Consecutive Dry Days (CDD)**
   - **Definition**: Maximum consecutive days with precipitation < 1mm
   - **Calculation**: Longest streak per year
   - **Impact**: Drought risk, fire hazard

8. **Growing Degree Days (GDD)**
   - **Definition**: Accumulated heat above base temperature (10°C)
   - **Calculation**: `SUM(MAX(0, (T_max + T_min)/2 - 10))` per year
   - **Purpose**: Agricultural productivity indicator

9. **Percentile-Based Extremes**
   - **Hot Days (90th percentile)**: Days above 90th percentile of historical T_max
   - **Very Hot Days (95th percentile)**: Days above 95th percentile
   - **Purpose**: Context-aware extreme identification

#### FR2.3: Temporal Analysis

10. **Summer Duration**
    - **Definition**: Number of days per year with T_max ≥ 30°C
    - **Comparison**: 1940s vs 1950s vs 1960s vs 1970s vs 1980s vs 1990s vs 2000s vs 2010s vs 2020s

11. **Seasonal Shift Analysis**
    - **Metric**: First/last day of year exceeding 30°C
    - **Visualization**: Show how summer "invades" winter months

12. **Decadal Comparisons**
    - **Aggregation**: Average metrics by decade
    - **Statistical Tests**: Mann-Kendall trend test, linear regression

### FR3: Data Visualization Components

#### FR3.1: Climate Stripes
- **Description**: Horizontal bars colored by annual average temperature
- **Color Scale**: Blue (cold) → White (average) → Red (hot)
- **Years**: 1940-2025 (86 bars)
- **Interactivity**: Hover to show year and temperature
- **Tech**: SVG/Canvas with D3.js or pure CSS

#### FR3.2: Calendar Heatmap
- **Description**: GitHub-style contribution graph for daily temperatures
- **Layout**: 365 cells per year, multiple years stacked
- **Color Scale**: Gradient from blue (cold) to red (hot)
- **Interactivity**: 
  - Hover: Show date and temperature
  - Click: Show detailed day info
- **Tech**: D3.js or React-Calendar-Heatmap

#### FR3.3: Ridgeline Plot (Joy Division Style)
- **Description**: Stacked density plots showing temperature distribution per decade
- **X-axis**: Temperature (°C)
- **Y-axis**: Decades (1940s, 1950s, 1960s, 1970s, 1980s, 1990s, 2000s, 2010s, 2020s)
- **Insight**: Visual shift of distribution toward higher temperatures
- **Tech**: D3.js or Plotly.js

#### FR3.4: Time Series Line Charts
- **Metrics to Plot**:
  - Annual count of days >30°C (with trend line)
  - Annual count of tropical nights
  - Average DTR per year
  - Maximum CDD per year
- **Features**:
  - Zoom/pan functionality
  - Toggle between metrics
  - Highlight extreme years
- **Tech**: Chart.js, Plotly.js, or Recharts

#### FR3.5: Comparative Bar Charts
- **Comparisons**:
  - Decadal averages (1940s vs 2020s)
  - Seasonal patterns (summer vs winter extremes)
  - Heat wave frequency and duration
- **Tech**: Chart.js or D3.js

#### FR3.6: Interactive Map
- **Display**: Pindamonhangaba location on map
- **Overlay**: Temperature anomaly visualization
- **Tech**: Leaflet.js or Mapbox GL JS

#### FR3.7: Radial/Circular Visualizations
- **Annual Temperature Cycle**: Circular chart showing monthly averages
- **Comparison**: Overlay multiple years/decades
- **Tech**: D3.js radial charts

### FR4: Storytelling Features

#### FR4.1: Scrollytelling Sections

**Section 1: "The Warming Valley"**
- **Content**: Introduction to Pindamonhangaba's geography
- **Visualization**: Animated climate stripes appearing as user scrolls
- **Data Point**: "Average temperature has increased by X°C since 1940"

**Section 2: "The Summer That Never Ends"**
- **Content**: Analysis of summer duration extension
- **Visualization**: Animated bar chart showing days >30°C per year
- **Data Point**: "In the 1980s, summer lasted 90 days. In 2024, it lasted 140 days."

**Section 3: "Sleepless Nights"**
- **Content**: Tropical nights analysis
- **Visualization**: Calendar heatmap highlighting nights >20°C
- **Data Point**: "Tropical nights have increased by X% since 1940"

**Section 4: "Heat Waves: The New Normal"**
- **Content**: Heat wave frequency and intensity
- **Visualization**: Timeline of heat wave events
- **Data Point**: "The longest heat wave lasted X days in [year]"

**Section 5: "The Hottest Day"**
- **Content**: Highlight the single hottest day on record
- **Visualization**: Special card with date, temperature, context
- **Interactive**: "Where were you on this day?"

**Section 6: "The Cost of Heat"**
- **Content**: Practical implications (energy, health, agriculture)
- **Visualization**: AC usage calculator widget
- **Data Point**: "Estimated AC hours needed: 1990 vs 2024"

**Section 7: "What's Next?"**
- **Content**: Future projections and call to action
- **Visualization**: Trend extrapolation (with uncertainty)
- **Links**: Climate action resources

#### FR4.2: Interactive Widgets

1. **Year Selector**
   - **Function**: Compare any two years side-by-side
   - **Output**: All metrics for selected years

2. **Temperature Threshold Slider**
   - **Function**: Adjust threshold (25°C - 35°C) to see impact
   - **Output**: Recalculate days above threshold

3. **AC Usage Calculator**
   - **Input**: Year selection
   - **Output**: Estimated hours of AC needed (based on hours >25°C)
   - **Formula**: `SUM(hours where T > 25°C) * usage_factor`

4. **Personal Timeline**
   - **Input**: User's birth year
   - **Output**: "Climate in Pinda during your lifetime" summary

### FR5: Data Export & Sharing

#### FR5.1: Export Formats
- **JSON**: For web consumption (optimized, compressed)
- **CSV**: For data analysis (full dataset)
- **PDF**: Report generation (summary statistics)

#### FR5.2: Sharing Features
- **Social Media Cards**: Auto-generated OG images with key stats
- **Permalink**: Share specific visualization states
- **Embed Code**: Allow embedding charts on other sites

---

## 🚫 Non-Functional Requirements

### NFR1: Performance

#### NFR1.1: Load Time
- **Target**: Initial page load < 3 seconds on 3G connection
- **Strategy**:
  - Lazy load visualizations below fold
  - Use WebP images with fallbacks
  - Minify and bundle JS/CSS
  - Implement service worker for caching

#### NFR1.2: Data Size
- **Target**: Total data payload < 500KB (compressed)
- **Strategy**:
  - Use JSON compression (gzip)
  - Round temperature values to 1 decimal place
  - Use efficient date encoding (timestamps or YYYYMMDD)
  - Consider Parquet format for large datasets (with WASM decoder)

#### NFR1.3: Rendering Performance
- **Target**: 60fps animations, smooth scrolling
- **Strategy**:
  - Use CSS transforms for animations (GPU acceleration)
  - Implement virtual scrolling for large datasets
  - Debounce/throttle scroll events
  - Use Canvas for complex visualizations (>1000 data points)

### NFR2: Accessibility (WCAG 2.1 Level AA)

#### NFR2.1: Visual Accessibility
- **Color Blindness**: Use colorblind-safe palettes (Viridis, ColorBrewer)
- **Contrast**: Minimum 4.5:1 for text, 3:1 for graphics
- **Text Alternatives**: Alt text for all visualizations
- **Keyboard Navigation**: Full functionality without mouse

#### NFR2.2: Screen Reader Support
- **ARIA Labels**: Proper labeling of interactive elements
- **Data Tables**: Provide table alternatives for charts
- **Announcements**: Live regions for dynamic content updates

#### NFR2.3: Responsive Design
- **Breakpoints**: Mobile (320px), Tablet (768px), Desktop (1024px+)
- **Touch Targets**: Minimum 44x44px for interactive elements
- **Font Scaling**: Support browser zoom up to 200%

### NFR3: Browser Compatibility

#### NFR3.1: Supported Browsers
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Android 90+
- **Fallbacks**: Graceful degradation for older browsers

#### NFR3.2: Progressive Enhancement
- **Core Content**: Accessible without JavaScript
- **Enhanced Experience**: Interactive features with JS enabled
- **Polyfills**: For ES6+ features if supporting older browsers

### NFR4: Maintainability

#### NFR4.1: Code Quality
- **Linting**: ESLint for JavaScript, Prettier for formatting
- **Type Safety**: TypeScript for type checking (optional but recommended)
- **Documentation**: JSDoc comments for functions
- **Testing**: Unit tests for data processing, visual regression tests

#### NFR4.2: Version Control
- **Git Workflow**: Feature branches, pull requests
- **Commit Messages**: Conventional commits format
- **Changelog**: Maintain CHANGELOG.md

#### NFR4.3: Deployment
- **CI/CD**: GitHub Actions for automated deployment
- **Staging**: Preview deployments for pull requests
- **Rollback**: Easy revert to previous versions

### NFR5: Security

#### NFR5.1: Data Privacy
- **No PII**: No collection of personal information
- **Analytics**: Privacy-respecting analytics (Plausible, Fathom) or none
- **HTTPS**: Enforce HTTPS (GitHub Pages default)

#### NFR5.2: Content Security
- **CSP Headers**: Content Security Policy via meta tags
- **Subresource Integrity**: SRI for CDN resources
- **XSS Prevention**: Sanitize any user inputs

### NFR6: SEO & Discoverability

#### NFR6.1: Meta Tags
- **Title**: Descriptive, keyword-rich
- **Description**: Compelling summary (150-160 chars)
- **OG Tags**: Open Graph for social sharing
- **Twitter Cards**: Twitter-specific meta tags

#### NFR6.2: Structured Data
- **Schema.org**: Dataset markup for Google Dataset Search
- **JSON-LD**: Structured data for rich snippets

#### NFR6.3: Sitemap & Robots
- **sitemap.xml**: For search engine crawling
- **robots.txt**: Allow all crawlers

---

## 🛠️ Technology Stack

### Frontend Framework Options

#### Option 1: Vanilla JS + D3.js (Recommended for Simplicity)
**Pros**:
- No build step required
- Lightweight
- Maximum control
- Easy to host on GitHub Pages

**Cons**:
- More manual DOM manipulation
- Less structured for large apps

**Stack**:
- **HTML5/CSS3**: Structure and styling
- **JavaScript (ES6+)**: Logic and interactivity
- **D3.js v7**: Data visualization
- **Scrollama.js**: Scrollytelling
- **Chart.js**: Simple charts (alternative to D3)

#### Option 2: React + Recharts/Plotly
**Pros**:
- Component-based architecture
- Rich ecosystem
- Easier state management
- Better for complex interactions

**Cons**:
- Requires build step (Vite/Webpack)
- Larger bundle size
- More setup complexity

**Stack**:
- **React 18**: UI framework
- **Vite**: Build tool (fast, modern)
- **Recharts**: React chart library
- **Framer Motion**: Animations
- **React Intersection Observer**: Scroll triggers

#### Option 3: Svelte + LayerCake
**Pros**:
- Smallest bundle size
- Excellent performance
- Built-in reactivity
- Great DX

**Cons**:
- Smaller ecosystem
- Less familiar to most developers

**Stack**:
- **Svelte/SvelteKit**: Framework
- **LayerCake**: Svelte chart library
- **D3.js**: For complex visualizations

### Recommended Stack (Balanced Approach)

```
Frontend:
├── React 18 (UI framework)
├── Vite (build tool)
├── D3.js v7 (complex visualizations)
├── Recharts (simple charts)
├── Framer Motion (animations)
├── Scrollama (scrollytelling)
└── Tailwind CSS (styling)

Data Processing:
├── Python 3.10+
├── pandas (data manipulation)
├── numpy (numerical operations)
├── requests (API calls)
├── matplotlib/seaborn (exploratory analysis)
└── jupyter (notebooks for exploration)

Deployment:
├── GitHub Pages (hosting)
├── GitHub Actions (CI/CD)
└── Cloudflare Pages (alternative, faster)

Development Tools:
├── ESLint + Prettier (code quality)
├── TypeScript (optional, type safety)
├── Jest + React Testing Library (testing)
└── Lighthouse CI (performance monitoring)
```

---

## 📊 Data Pipeline Architecture

### Phase 1: Data Acquisition (Python)

```
┌─────────────────────────────────────────────────────┐
│                  Data Sources                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Open-    │  │Copernicus│  │ NASA / INMET     │  │
│  │ Meteo ⭐ │  │ CDS      │  │ (alternatives)   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
└───────┼─────────────┼─────────────────┼─────────────┘
        │             │                 │
        └─────────────┴─────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   fetch_climate_data.py     │
        │   - API calls               │
        │   - Error handling          │
        │   - Rate limiting           │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   Raw Data (JSON/CSV)       │
        │   data/raw/                 │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   process_climate_data.py   │
        │   - Data cleaning           │
        │   - Validation              │
        │   - Interpolation           │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   Cleaned Data (CSV)        │
        │   data/processed/           │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   calculate_metrics.py      │
        │   - All climate metrics     │
        │   - Statistical analysis    │
        │   - Trend calculations      │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   generate_web_data.py      │
        │   - JSON optimization       │
        │   - Data aggregation        │
        │   - Compression             │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   Web Data (JSON)           │
        │   public/data/              │
        │   - climate_data.json       │
        │   - metrics.json            │
        │   - summary.json            │
        └─────────────────────────────┘
```

### Phase 2: Web Application (React)

```
┌─────────────────────────────────────────────────────┐
│                  React Application                   │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │              App Component                     │ │
│  │  - Data loading                                │ │
│  │  - Global state                                │ │
│  └──────────────────┬─────────────────────────────┘ │
│                     │                                │
│     ┌───────────────┼───────────────┐               │
│     │               │               │               │
│     ▼               ▼               ▼               │
│  ┌──────┐      ┌──────┐       ┌──────────┐         │
│  │Header│      │Story │       │Visualiza-│         │
│  │      │      │telling│       │tions     │         │
│  └──────┘      │Sections│      └──────────┘         │
│                └───┬────┘                           │
│                    │                                │
│      ┌─────────────┼─────────────┐                 │
│      │             │             │                 │
│      ▼             ▼             ▼                 │
│  ┌────────┐  ┌─────────┐  ┌──────────┐            │
│  │Climate │  │Summer   │  │Heat Wave │            │
│  │Stripes │  │Duration │  │Analysis  │            │
│  └────────┘  └─────────┘  └──────────┘            │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │         Visualization Components             │  │
│  │  - CalendarHeatmap                           │  │
│  │  - RidgelinePlot                             │  │
│  │  - TimeSeriesChart                           │  │
│  │  - ComparativeBarChart                       │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │         Interactive Widgets                  │  │
│  │  - YearSelector                              │  │
│  │  - ThresholdSlider                           │  │
│  │  - ACCalculator                              │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
pindamonhangaba-climate/
├── README.md
├── LICENSE
├── .gitignore
├── package.json
├── vite.config.js
├── tsconfig.json (if using TypeScript)
│
├── data/                          # Data processing (Python)
│   ├── scripts/
│   │   ├── fetch_climate_data.py
│   │   ├── process_climate_data.py
│   │   ├── calculate_metrics.py
│   │   └── generate_web_data.py
│   ├── raw/                       # Raw API responses
│   ├── processed/                 # Cleaned CSV files
│   └── notebooks/                 # Jupyter notebooks for exploration
│       └── exploratory_analysis.ipynb
│
├── public/                        # Static assets
│   ├── data/                      # JSON data for web
│   │   ├── climate_data.json
│   │   ├── metrics.json
│   │   └── summary.json
│   ├── images/
│   │   ├── og-image.png
│   │   └── favicon.ico
│   └── fonts/
│
├── src/                           # React application
│   ├── main.jsx                   # Entry point
│   ├── App.jsx                    # Root component
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Navigation.jsx
│   │   │
│   │   ├── visualizations/
│   │   │   ├── ClimateStripes.jsx
│   │   │   ├── CalendarHeatmap.jsx
│   │   │   ├── RidgelinePlot.jsx
│   │   │   ├── TimeSeriesChart.jsx
│   │   │   ├── ComparativeBarChart.jsx
│   │   │   └── InteractiveMap.jsx
│   │   │
│   │   ├── storytelling/
│   │   │   ├── ScrollySection.jsx
│   │   │   ├── IntroSection.jsx
│   │   │   ├── SummerSection.jsx
│   │   │   ├── TropicalNightsSection.jsx
│   │   │   ├── HeatWaveSection.jsx
│   │   │   ├── HottestDaySection.jsx
│   │   │   └── FutureSection.jsx
│   │   │
│   │   ├── widgets/
│   │   │   ├── YearSelector.jsx
│   │   │   ├── ThresholdSlider.jsx
│   │   │   ├── ACCalculator.jsx
│   │   │   └── PersonalTimeline.jsx
│   │   │
│   │   └── common/
│   │       ├── LoadingSpinner.jsx
│   │       ├── ErrorBoundary.jsx
│   │       └── Tooltip.jsx
│   │
│   ├── hooks/
│   │   ├── useClimateData.js
│   │   ├── useScrollPosition.js
│   │   └── useWindowSize.js
│   │
│   ├── utils/
│   │   ├── dataProcessing.js
│   │   ├── calculations.js
│   │   ├── formatters.js
│   │   └── colors.js
│   │
│   ├── styles/
│   │   ├── index.css
│   │   ├── variables.css
│   │   └── animations.css
│   │
│   └── constants/
│       ├── config.js
│       └── thresholds.js
│
├── tests/
│   ├── unit/
│   └── integration/
│
└── docs/
    ├── API.md
    ├── DATA_SOURCES.md
    └── DEPLOYMENT.md
```

---

## 🔄 Implementation Workflow

### Phase 1: Data Acquisition (Week 1)

**Tasks**:
1. ✅ Set up Python environment
2. ✅ Implement Open-Meteo Historical API fetcher
3. ✅ Fetch 85+ years of data for Pindamonhangaba (1940-present)
4. ✅ Validate data quality
5. ✅ Export to CSV

**Deliverable**: `data/raw/pindamonhangaba_1940_2025.csv`

### Phase 2: Data Processing (Week 1-2)

**Tasks**:
1. ✅ Clean and validate data
2. ✅ Calculate all climate metrics
3. ✅ Perform statistical analysis
4. ✅ Generate summary statistics
5. ✅ Export optimized JSON for web

**Deliverable**: `public/data/*.json`

### Phase 3: Frontend Setup (Week 2)

**Tasks**:
1. ✅ Initialize React + Vite project
2. ✅ Set up Tailwind CSS
3. ✅ Install visualization libraries
4. ✅ Create basic layout components
5. ✅ Implement data loading hook

**Deliverable**: Basic app structure

### Phase 4: Core Visualizations (Week 3-4)

**Tasks**:
1. ✅ Implement Climate Stripes
2. ✅ Implement Calendar Heatmap
3. ✅ Implement Time Series Charts
4. ✅ Implement Ridgeline Plot
5. ✅ Implement Comparative Bar Charts

**Deliverable**: All visualization components

### Phase 5: Storytelling (Week 5)

**Tasks**:
1. ✅ Implement Scrollama integration
2. ✅ Create all story sections
3. ✅ Add animations and transitions
4. ✅ Write compelling copy
5. ✅ Add interactive widgets

**Deliverable**: Complete storytelling experience

### Phase 6: Polish & Optimization (Week 6)

**Tasks**:
1. ✅ Performance optimization
2. ✅ Accessibility audit
3. ✅ Cross-browser testing
4. ✅ Mobile responsiveness
5. ✅ SEO optimization

**Deliverable**: Production-ready app

### Phase 7: Deployment (Week 6)

**Tasks**:
1. ✅ Set up GitHub Actions
2. ✅ Configure GitHub Pages
3. ✅ Deploy to production
4. ✅ Set up custom domain (optional)
5. ✅ Monitor performance

**Deliverable**: Live website

---

## 🎨 Design System

### Color Palette

#### Temperature Scale (Sequential)
```css
/* Cold to Hot */
--temp-cold: #2166ac;      /* <15°C */
--temp-cool: #67a9cf;      /* 15-20°C */
--temp-mild: #d1e5f0;      /* 20-25°C */
--temp-warm: #fddbc7;      /* 25-30°C */
--temp-hot: #ef8a62;       /* 30-35°C */
--temp-very-hot: #b2182b;  /* >35°C */
```

#### Climate Stripes (Diverging)
```css
/* Based on Ed Hawkins' original */
--stripe-cold: #08519c;
--stripe-cool: #3182bd;
--stripe-neutral: #ffffff;
--stripe-warm: #de2d26;
--stripe-hot: #a50f15;
```

#### UI Colors
```css
--primary: #1e40af;        /* Blue */
--secondary: #dc2626;      /* Red */
--accent: #f59e0b;         /* Amber */
--background: #ffffff;
--surface: #f9fafb;
--text-primary: #111827;
--text-secondary: #6b7280;
```

### Typography

```css
/* Font Stack */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Spacing

```css
/* 8px base unit */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## 📈 Key Metrics & KPIs

### Data Quality Metrics
- **Completeness**: % of days with valid data (target: >95%)
- **Accuracy**: Validation against nearby stations (if available)
- **Consistency**: No impossible values (e.g., T_min > T_max)

### Performance Metrics
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Time to Interactive**: <3.5s
- **Cumulative Layout Shift**: <0.1

### User Engagement (if analytics enabled)
- **Average Time on Page**: Target >3 minutes
- **Scroll Depth**: % reaching bottom
- **Interaction Rate**: % using interactive widgets

---

## 🚀 Deployment Strategy

### GitHub Pages Setup

1. **Repository Configuration**:
   ```bash
   # In repository settings:
   # Pages > Source > GitHub Actions
   ```

2. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [main]
     workflow_dispatch:
   
   permissions:
     contents: read
     pages: write
     id-token: write
   
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node
           uses: actions/setup-node@v3
           with:
             node-version: 18
             cache: 'npm'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Build
           run: npm run build
         
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v2
           with:
             path: ./dist
     
     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       needs: build
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v2
   ```

3. **Base Path Configuration** (vite.config.js):
   ```javascript
   export default {
     base: '/pindamonhangaba-climate/', // Replace with your repo name
     build: {
       outDir: 'dist',
       assetsDir: 'assets'
     }
   }
   ```

### Alternative: Cloudflare Pages

**Advantages**:
- Faster global CDN
- Better analytics
- Automatic preview deployments

**Setup**:
1. Connect GitHub repository to Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `dist`

---

## 🔍 Data Sources - Detailed Comparison

| Source | Coverage | Resolution | Accuracy | Ease of Use | Latency | Cost |
|--------|----------|------------|----------|-------------|---------|------|
| **Open-Meteo** ⭐ | 1940-present | 11km | Very Good (ERA5 + interpolation) | **Excellent** (REST JSON API) | **Instant** (ms) | Free |
| **Copernicus CDS (ERA5)** | 1940-present | 9km | **Excellent** (raw scientific) | Moderate (Python client, NetCDF) | **Slow** (queue, min-hours) | Free |
| **NASA POWER** | 1981-present | 50km | Good | Good (REST API) | Fast | Free |
| **INMET** | Variable | Station | Excellent (ground truth) | Poor (manual download) | N/A | Free |

**Recommendation**: Use **Open-Meteo** as the primary data source. It delivers ERA5 reanalysis data via instant JSON API with automatic coordinate interpolation. Use Copernicus CDS for scientific validation or academic citation. Use INMET for ground-truth validation if station data is available.

---

### Open-Meteo vs Copernicus CDS: Detailed Comparison

The decision between **Copernicus Climate Data Store (CDS)** and **Open-Meteo** is effectively a choice between the **raw scientific source** and a **developer-optimized wrapper**. Both often deliver the same underlying data (ERA5 reanalysis), but they serve completely different use cases.

#### Executive Summary

| Aspect | Copernicus CDS (The Source) | Open-Meteo (The Wrapper) |
|--------|----------------------------|--------------------------|
| **Primary Data** | ERA5 (Global), ERA5-Land, Seasonal Forecasts | ERA5 (History), plus Local Models (DWD, NOAA, etc.) for forecasts |
| **Access Method** | Python Client (`cdsapi`) or Web UI | Simple REST API (HTTP GET) |
| **Response Format** | **NetCDF, GRIB** (Binary, multidimensional) | **JSON**, CSV, XLSX (Human/Web readable) |
| **Latency** | **Queue-based.** Minutes to hours depending on load | **Instant.** Millisecond latency (optimized time-series DB) |
| **Resolution Logic** | Returns raw grid cell (e.g., 9km box). Manual interpolation required | Automatically interpolates grid to specific GPS coordinate |
| **Usage Limits** | Free, limited by concurrent requests and queue slots | Free tier (non-commercial) ~10k calls/day |
| **Complexity** | **High.** Requires `xarray` or `pandas` to process | **Low.** Direct integration into JS/Python apps |

#### The "Grid" vs. "Point" Problem (Critical for Pindamonhangaba)

If you query **CDS** for a location in a mountainous region, you get the average temperature of the 9km × 9km grid cell. If that cell averages a mountain peak and a valley, the data might not represent the town in the valley.

**Open-Meteo** corrects this using "Model Output Statistics" and elevation correction (adjusting temperature based on the altitude difference between the model grid and your requested coordinate).

- **Pro**: More realistic values for Pindamonhangaba's valley floor location
- **Con**: Acts as a "black box" layer — if strictly validating raw climate models, prefer untouched CDS data

#### When to Use Each

**Choose Open-Meteo (our primary choice) if:**
- Building a **Web Dashboard** or **App** (JSON is essential)
- Need **instant results** (no waiting in queues)
- Want to avoid NetCDF/GRIB file complexity
- Need data for a specific "point" (Lat/Lon) rather than a broad region

**Choose Copernicus CDS if:**
- Conducting **formal scientific research** requiring primary source citation
- Need **massive bulk datasets** (e.g., all wind speed data for South America for 20 years)
- Require variables that Open-Meteo does not expose (CDS has hundreds of obscure atmospheric parameters)
- Want to control your own interpolation methods

---

## 📚 Learning Resources

### Climate Data Analysis
- [Open-Meteo Historical Weather API Documentation](https://open-meteo.com/en/docs/historical-weather-api) ⭐
- [Copernicus Climate Data Store](https://cds.climate.copernicus.eu/)
- [Climate Indices in Python](https://climate-indices.readthedocs.io/)
- [ETCCDI Climate Indices](http://etccdi.pacificclimate.org/list_27_indices.shtml)
- [NASA POWER Documentation](https://power.larc.nasa.gov/docs/)

### Data Visualization
- [D3.js Gallery](https://observablehq.com/@d3/gallery)
- [Climate Stripes by Ed Hawkins](https://showyourstripes.info/)
- [Scrollytelling Examples](https://pudding.cool/)

### Web Performance
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

## 🎯 Success Criteria

### Technical Success
- ✅ All 85+ years of data (1940-present) successfully fetched and processed
- ✅ All visualizations render correctly on desktop and mobile
- ✅ Page load time <3 seconds
- ✅ Lighthouse score >90 in all categories
- ✅ Zero accessibility violations (WAVE, axe)

### Content Success
- ✅ Clear, compelling narrative
- ✅ Accurate data representation
- ✅ Actionable insights
- ✅ Shareable on social media

### User Success
- ✅ Users understand climate trends in Pindamonhangaba
- ✅ Users engage with interactive elements
- ✅ Users share the project

---

## 🔮 Future Enhancements

### Phase 2 Features
1. **Comparison with Other Cities**: Add São Paulo, Rio, Taubaté
2. **Climate Projections**: Integrate IPCC scenarios (RCP 4.5, 8.5)
3. **Real-time Data**: Fetch current weather and update
4. **User Contributions**: Allow locals to share experiences
5. **Mobile App**: Progressive Web App (PWA) version

### Advanced Analytics
1. **Machine Learning**: Predict future trends with LSTM/Prophet
2. **Correlation Analysis**: Link to health/economic data
3. **Extreme Event Attribution**: Climate change contribution analysis

---

## 📞 Support & Maintenance

### Data Updates
- **Frequency**: Annual (January, after previous year data available)
- **Process**: Re-run Python scripts, rebuild site
- **Automation**: GitHub Actions scheduled workflow

### Bug Reporting
- **GitHub Issues**: For technical bugs
- **Contact Form**: For data questions

### Monitoring
- **Uptime**: GitHub Pages status
- **Performance**: Lighthouse CI on every deploy
- **Analytics**: Privacy-respecting analytics (optional)

---

## 📄 License & Attribution

### Recommended License
- **Code**: MIT License
- **Data**: CC BY 4.0 (with attribution to Open-Meteo / Copernicus ERA5)
- **Content**: CC BY-SA 4.0

### Required Attributions
```
Climate data provided by Open-Meteo (https://open-meteo.com/) — ERA5 reanalysis via Copernicus/ECMWF
Visualization inspired by Ed Hawkins' Climate Stripes (https://showyourstripes.info/)
```

---

## 🎬 Conclusion

This project combines rigorous climate data analysis with compelling storytelling to create an impactful visualization of Pindamonhangaba's warming climate. By focusing on human-centered metrics (tropical nights, heat waves, AC usage) rather than just raw numbers, the project makes climate change tangible and relatable to local residents.

The technical stack balances modern web development practices with accessibility and performance, ensuring the project reaches the widest possible audience. The modular architecture allows for easy expansion and maintenance.

**Next Steps**:
1. Set up Python environment and fetch initial data from Open-Meteo
2. Validate data quality and calculate metrics
3. Initialize React project with visualization components
4. Implement storytelling sections
5. Deploy to GitHub Pages

**Estimated Timeline**: 6 weeks for MVP, 2-4 weeks for polish and enhancements.

---

*Document Version: 1.0*  
*Last Updated: 2026-02-17*  
*Author: Climate Data Visualization Team*
