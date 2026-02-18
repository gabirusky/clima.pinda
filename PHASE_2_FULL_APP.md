# Phase 2: Global Climate Explorer — Full Stack Application
## Full Technical Analysis & Requirements Document

---

## 📋 Executive Summary

**Project Goal**: Build a full-stack web application hosted on **Cloudflare Pages** (with Cloudflare Workers for backend logic) that allows users to search for **any city in the world** and instantly generate an interactive climate analysis report — the same quality as the Pindamonhangaba prototype, but dynamically generated for any location on Earth.

**Core Concept**: A "Google Maps for Climate Data" — type a city name, get 85+ years of climate history with beautiful visualizations, storytelling metrics, and exportable reports.

**Hosting**: Cloudflare Pages (frontend) + Cloudflare Workers (serverless backend) — **100% free tier viable**.

**Data Source**: Open-Meteo Historical Weather API (free, no API key required, global coverage 1940-present).

---

## 🎯 Functional Requirements

### FR1: City Search & Geocoding

#### FR1.1: Search Functionality

**User Flow**:
1. User types a city name (e.g., "Tokyo", "São Paulo", "Nairobi")
2. Autocomplete suggests matching cities with country/state context
3. User selects a city
4. App fetches climate data for that city's coordinates
5. Interactive report is generated in real-time

#### FR1.2: Geocoding Data Sources (Free)

**Option 1: Open-Meteo Geocoding API** ⭐ (Recommended — Primary)
- **Endpoint**: `https://geocoding-api.open-meteo.com/v1/search`
- **Coverage**: Global (based on GeoNames database, 100,000+ cities)
- **Cost**: Free (no API key required)
- **Response**: City name, country, admin region, latitude, longitude, elevation, population, timezone
- **Rate Limit**: Generous for non-commercial use
- **Key Advantage**: Same provider as climate data — seamless integration, no CORS issues

```python
# Example: Open-Meteo Geocoding
import requests

def search_city(query, count=10, language='en'):
    """
    Search for cities worldwide using Open-Meteo Geocoding API.
    Returns matching cities with coordinates, country, population.
    """
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {
        'name': query,
        'count': count,
        'language': language,
        'format': 'json'
    }
    response = requests.get(url, params=params)
    return response.json().get('results', [])

# Example response for "Pindamonhangaba":
# {
#   "name": "Pindamonhangaba",
#   "latitude": -22.9244,
#   "longitude": -45.4617,
#   "elevation": 551.0,
#   "country": "Brazil",
#   "admin1": "São Paulo",
#   "population": 146995,
#   "timezone": "America/Sao_Paulo"
# }
```

**Option 2: GeoNames Database** (Alternative — Offline/Self-hosted)
- **Source**: `https://download.geonames.org/export/dump/`
- **Coverage**: Global (12M+ place names)
- **Cost**: Free (CC BY 4.0 license)
- **Format**: TSV files (downloadable)
- **Use Case**: Self-hosted search for zero external API dependency
- **File**: `cities15000.zip` (~2.5MB) — all cities with population >15,000

**Option 3: Nominatim (OpenStreetMap)** (Alternative)
- **Endpoint**: `https://nominatim.openstreetmap.org/search`
- **Coverage**: Global (OpenStreetMap data)
- **Cost**: Free (strict rate limit: 1 req/sec)
- **Limitation**: Rate limiting makes it unsuitable for autocomplete
- **Use Case**: Fallback for obscure locations not in GeoNames

**Recommended Approach**: Use **Open-Meteo Geocoding API** as primary (same ecosystem, no key needed). Pre-cache the GeoNames `cities15000` dataset in Cloudflare KV for instant autocomplete without external API calls.

#### FR1.3: Autocomplete Implementation

```javascript
// Frontend autocomplete with debouncing
import { useState, useCallback } from 'react';
import debounce from 'lodash.debounce';

function CitySearch({ onCitySelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState('');

  const fetchSuggestions = useCallback(
    debounce(async (searchTerm) => {
      if (searchTerm.length < 2) return setSuggestions([]);
      
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=8&language=en`
      );
      const data = await res.json();
      setSuggestions(data.results || []);
    }, 300),
    []
  );

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search any city in the world..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          fetchSuggestions(e.target.value);
        }}
      />
      <ul className="suggestions">
        {suggestions.map((city) => (
          <li key={city.id} onClick={() => onCitySelect(city)}>
            <strong>{city.name}</strong>
            <span>{city.admin1}, {city.country}</span>
            <span className="meta">
              Pop: {city.population?.toLocaleString()} | 
              Elev: {city.elevation}m
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### FR2: Dynamic Climate Data Fetching

#### FR2.1: Open-Meteo Historical Weather API (Primary)

**Endpoint**: `https://archive-api.open-meteo.com/v1/archive`

**Parameters for Global Use**:
```javascript
async function fetchClimateData(lat, lon, timezone) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    start_date: '1940-01-01',
    end_date: new Date().toISOString().split('T')[0],
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'precipitation_sum',
      'relative_humidity_2m_mean',
      'windspeed_10m_max',
      'shortwave_radiation_sum',
      'et0_fao_evapotranspiration'
    ].join(','),
    timezone: timezone || 'auto'
  });

  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params}`
  );
  return response.json();
}
```

**Data Volume Considerations**:
- 85 years × 365 days = ~31,000 data points per variable
- 8 variables × 31,000 = ~248,000 values
- JSON size: ~2-4MB uncompressed, ~300-500KB gzipped
- **Fetch time**: 2-5 seconds (Open-Meteo is fast)

#### FR2.2: Data Chunking Strategy

For optimal UX, fetch data in progressive chunks:

```javascript
async function fetchClimateDataProgressive(lat, lon, timezone, onProgress) {
  const decades = [
    ['1940-01-01', '1949-12-31'],
    ['1950-01-01', '1959-12-31'],
    ['1960-01-01', '1969-12-31'],
    ['1970-01-01', '1979-12-31'],
    ['1980-01-01', '1989-12-31'],
    ['1990-01-01', '1999-12-31'],
    ['2000-01-01', '2009-12-31'],
    ['2010-01-01', '2019-12-31'],
    ['2020-01-01', '2024-12-31'],
  ];

  const allData = [];
  for (let i = 0; i < decades.length; i++) {
    const [start, end] = decades[i];
    const chunk = await fetchClimateData(lat, lon, timezone, start, end);
    allData.push(chunk);
    onProgress((i + 1) / decades.length * 100);
  }
  
  return mergeChunks(allData);
}
```

#### FR2.3: Caching Strategy

**Cloudflare KV Cache** (free tier: 100,000 reads/day, 1,000 writes/day):

```javascript
// Cloudflare Worker — Cache climate data
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get('lat')).toFixed(2);
    const lon = parseFloat(url.searchParams.get('lon')).toFixed(2);
    const cacheKey = `climate:${lat}:${lon}`;

    // Check cache first
    const cached = await env.CLIMATE_CACHE.get(cacheKey, 'json');
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
      });
    }

    // Fetch from Open-Meteo
    const data = await fetchFromOpenMeteo(lat, lon);
    
    // Cache for 30 days (data doesn't change for historical periods)
    await env.CLIMATE_CACHE.put(cacheKey, JSON.stringify(data), {
      expirationTtl: 60 * 60 * 24 * 30
    });

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
  }
};
```

### FR3: Climate Metrics Engine (Client-Side)

All metrics from Phase 1 are computed **client-side** in the browser using Web Workers for performance:

#### FR3.1: Web Worker Architecture

```javascript
// climate-worker.js — Runs in a separate thread
self.onmessage = function(e) {
  const { rawData, thresholds } = e.data;
  
  const metrics = {
    hotDays: calculateHotDays(rawData, thresholds.hot),        // Days > 30°C
    veryHotDays: calculateHotDays(rawData, thresholds.veryHot), // Days > 32°C
    tropicalNights: calculateTropicalNights(rawData, 20),
    diurnalRange: calculateDTR(rawData),
    heatWaves: calculateHeatWaves(rawData, thresholds.heatWave),
    consecutiveDryDays: calculateCDD(rawData),
    climateStripes: calculateClimateStripes(rawData),
    calendarHeatmap: calculateCalendarHeatmap(rawData),
    decadalStats: calculateDecadalStats(rawData),
    summerDuration: calculateSummerDuration(rawData, thresholds.hot),
    annualAverages: calculateAnnualAverages(rawData),
    extremeRecords: findExtremeRecords(rawData),
  };
  
  self.postMessage({ type: 'METRICS_COMPLETE', metrics });
};
```

#### FR3.2: Hemisphere-Aware Calculations

**Critical for a global app**: Summer/Winter definitions flip between hemispheres.

```javascript
function getSeasonConfig(latitude) {
  const isNorthern = latitude >= 0;
  
  return {
    summer: isNorthern 
      ? { months: [6, 7, 8], label: 'Jun-Aug' }
      : { months: [12, 1, 2], label: 'Dec-Feb' },
    winter: isNorthern 
      ? { months: [12, 1, 2], label: 'Dec-Feb' }
      : { months: [6, 7, 8], label: 'Jun-Aug' },
    spring: isNorthern 
      ? { months: [3, 4, 5], label: 'Mar-May' }
      : { months: [9, 10, 11], label: 'Sep-Nov' },
    autumn: isNorthern 
      ? { months: [9, 10, 11], label: 'Sep-Nov' }
      : { months: [3, 4, 5], label: 'Mar-May' },
  };
}

function getAdaptiveThresholds(latitude, elevation) {
  // Adjust "hot day" threshold based on climate zone
  const absLat = Math.abs(latitude);
  
  if (absLat < 23.5) {
    // Tropical: 32°C is "hot" (they're used to heat)
    return { hot: 32, veryHot: 35, heatWave: 35 };
  } else if (absLat < 35) {
    // Subtropical: 30°C is "hot"
    return { hot: 30, veryHot: 33, heatWave: 32 };
  } else if (absLat < 55) {
    // Temperate: 28°C is "hot" (less heat tolerance)
    return { hot: 28, veryHot: 32, heatWave: 30 };
  } else {
    // Subarctic/Arctic: 25°C is "hot"
    return { hot: 25, veryHot: 28, heatWave: 25 };
  }
}
```

#### FR3.3: Metrics Catalog (All from Phase 1 + New Global Metrics)

| # | Metric | Description | Global Adaptation |
|---|--------|-------------|-------------------|
| 1 | **Hot Days (HD)** | Days above threshold | Threshold adapts to climate zone |
| 2 | **Very Hot Days (VHD)** | Days above extreme threshold | Zone-adaptive |
| 3 | **Tropical Nights (TR)** | Nights T_min ≥ 20°C | Fixed (physiological limit) |
| 4 | **Frost Days (FD)** | Days T_min < 0°C | Relevant for temperate/cold zones |
| 5 | **Ice Days (ID)** | Days T_max < 0°C | Relevant for cold zones |
| 6 | **Diurnal Temperature Range** | T_max - T_min daily | Universal |
| 7 | **Heat Wave Duration** | 3+ consecutive days above P90 | Percentile-based (adapts to local climate) |
| 8 | **Cold Wave Duration** | 3+ consecutive days below P10 | Percentile-based |
| 9 | **Consecutive Dry Days** | Max streak precip < 1mm | Universal |
| 10 | **Consecutive Wet Days** | Max streak precip ≥ 1mm | Universal |
| 11 | **Annual Precipitation** | Total yearly precipitation | Universal |
| 12 | **Growing Degree Days** | Accumulated heat above base | Universal (agriculture) |
| 13 | **Cooling Degree Days** | Accumulated heat above 18°C | Energy demand indicator |
| 14 | **Heating Degree Days** | Accumulated cold below 18°C | Energy demand indicator |
| 15 | **Climate Stripes** | Annual mean temp anomaly | Universal |
| 16 | **Warming Rate** | °C per decade trend | Universal |
| 17 | **Precipitation Trend** | mm per decade trend | Universal |
| 18 | **Extreme Records** | All-time highs/lows | Universal |

### FR4: Visualization Components (Reusable)

All visualization components from Phase 1 are made **reusable and configurable**:

#### FR4.1: Component Library

```
src/components/visualizations/
├── ClimateStripes.jsx          # Annual temperature anomaly bars
├── CalendarHeatmap.jsx         # GitHub-style daily temperature grid
├── RidgelinePlot.jsx           # Decadal temperature distribution
├── TimeSeriesChart.jsx         # Multi-metric line chart with zoom
├── ComparativeBarChart.jsx     # Decadal comparison bars
├── RadialTemperatureChart.jsx  # Circular annual cycle
├── PrecipitationChart.jsx      # Rainfall patterns
├── HeatWaveTimeline.jsx        # Heat wave events visualization
├── ExtremeRecordsCard.jsx      # All-time records display
├── TrendIndicator.jsx          # Warming/cooling trend arrow
├── SeasonalShiftChart.jsx      # How seasons are shifting
└── CityComparisonView.jsx      # Side-by-side city comparison
```

#### FR4.2: City Comparison Feature

Allow users to compare 2-4 cities side by side:

```javascript
function CityComparison({ cities }) {
  // cities = [
  //   { name: 'Tokyo', lat: 35.68, lon: 139.69, data: {...} },
  //   { name: 'São Paulo', lat: -23.55, lon: -46.63, data: {...} },
  // ]
  
  return (
    <div className="comparison-grid">
      {cities.map(city => (
        <div key={city.name} className="city-column">
          <h3>{city.name}</h3>
          <ClimateStripes data={city.data.stripes} />
          <MetricsSummary data={city.data.metrics} />
          <TrendIndicator rate={city.data.warmingRate} />
        </div>
      ))}
    </div>
  );
}
```

### FR5: Report Generation & Export

#### FR5.1: PDF Report Generation (Client-Side)

```javascript
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

async function generatePDFReport(cityName, metrics, charts) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Title page
  pdf.setFontSize(24);
  pdf.text(`Climate Report: ${cityName}`, 20, 30);
  pdf.setFontSize(12);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40);
  pdf.text(`Data: 1940-2024 (Open-Meteo ERA5 Reanalysis)`, 20, 48);
  
  // Capture each chart as image
  for (const chartRef of charts) {
    const canvas = await html2canvas(chartRef.current);
    const imgData = canvas.toDataURL('image/png');
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 120);
  }
  
  pdf.save(`climate-report-${cityName.toLowerCase()}.pdf`);
}
```

#### FR5.2: Shareable Links

```
https://climate-explorer.pages.dev/city/pindamonhangaba-br?lat=-22.925&lon=-45.462
https://climate-explorer.pages.dev/compare?cities=tokyo-jp,sao-paulo-br,nairobi-ke
```

### FR6: Internationalization (i18n)

#### FR6.1: Multi-Language Support

**Priority Languages**:
1. English (en) — Default
2. Portuguese (pt-BR) — Original project language
3. Spanish (es) — Latin America coverage
4. French (fr) — Africa/Europe coverage

```javascript
// i18n structure
const translations = {
  en: {
    search: 'Search any city in the world...',
    hotDays: 'Hot Days',
    tropicalNights: 'Tropical Nights',
    warmingRate: 'Warming Rate',
    perDecade: 'per decade',
    since: 'since',
    // ...
  },
  'pt-BR': {
    search: 'Pesquise qualquer cidade do mundo...',
    hotDays: 'Dias Quentes',
    tropicalNights: 'Noites Tropicais',
    warmingRate: 'Taxa de Aquecimento',
    perDecade: 'por década',
    since: 'desde',
    // ...
  }
};
```

#### FR6.2: Temperature Unit Toggle

```javascript
function convertTemperature(celsius, unit) {
  switch (unit) {
    case 'fahrenheit': return (celsius * 9/5) + 32;
    case 'kelvin': return celsius + 273.15;
    default: return celsius;
  }
}
```

---

## 🚫 Non-Functional Requirements

### NFR1: Performance

#### NFR1.1: Load Time Targets
- **Initial Page Load (Search)**: < 1.5 seconds (static page, minimal JS)
- **City Report Generation**: < 5 seconds (includes API fetch + computation)
- **Subsequent City Loads**: < 2 seconds (cached data)
- **Chart Rendering**: < 500ms per visualization

#### NFR1.2: Data Transfer Optimization
- **Gzip Compression**: All API responses compressed (~80% reduction)
- **Progressive Loading**: Show partial results while fetching remaining decades
- **Web Workers**: Offload metric calculations to background thread
- **Lazy Loading**: Charts below fold load on scroll

#### NFR1.3: Cloudflare Edge Performance
- **Global CDN**: Static assets served from 300+ edge locations
- **Edge Caching**: Climate data cached at edge (Cloudflare KV)
- **Brotli Compression**: Automatic for all static assets
- **HTTP/3**: Enabled by default on Cloudflare

### NFR2: Scalability

#### NFR2.1: Free Tier Limits (Cloudflare)

| Resource | Free Tier Limit | Our Usage Estimate |
|----------|----------------|-------------------|
| **Pages Requests** | Unlimited | N/A |
| **Workers Requests** | 100,000/day | ~10,000/day (with caching) |
| **Workers CPU Time** | 10ms/invocation | ~5ms (proxy + cache check) |
| **KV Reads** | 100,000/day | ~50,000/day |
| **KV Writes** | 1,000/day | ~500/day (new cities) |
| **KV Storage** | 1GB | ~200MB (cached cities) |
| **Bandwidth** | Unlimited | N/A |

#### NFR2.2: Scaling Strategy
- **Phase 1**: Free tier handles ~10,000 unique city searches/day
- **Phase 2**: If exceeding limits, upgrade to Workers Paid ($5/month) for 10M requests/month
- **Phase 3**: Add Cloudflare D1 (SQLite at edge) for persistent analytics

### NFR3: Accessibility (WCAG 2.1 Level AA)

Same as Phase 1:
- **Color Blindness**: Colorblind-safe palettes (Viridis, ColorBrewer)
- **Contrast**: Minimum 4.5:1 for text, 3:1 for graphics
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader**: ARIA labels, data table alternatives for charts
- **Responsive**: Mobile-first design (320px to 4K)

### NFR4: SEO & Discoverability

#### NFR4.1: Dynamic Meta Tags (Per City)

```html
<!-- Generated for each city page -->
<title>Climate History: Tokyo, Japan — 85 Years of Temperature Data</title>
<meta name="description" content="Explore 85 years of climate data for Tokyo. See how temperatures have changed since 1940 with interactive charts and analysis.">
<meta property="og:image" content="https://climate-explorer.pages.dev/api/og/tokyo-jp.png">
```

#### NFR4.2: Pre-rendered Popular Cities

Pre-generate static HTML for top 500 cities (by population) for instant SEO indexing:

```javascript
// build-time pre-rendering
const topCities = [
  { name: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69 },
  { name: 'São Paulo', country: 'BR', lat: -23.55, lon: -46.63 },
  { name: 'New York', country: 'US', lat: 40.71, lon: -74.01 },
  // ... 497 more
];
```

### NFR5: Security

- **No API Keys Exposed**: Open-Meteo requires no keys
- **Rate Limiting**: Cloudflare Workers rate-limit by IP
- **CSP Headers**: Strict Content Security Policy
- **HTTPS**: Enforced by Cloudflare (automatic)
- **Input Sanitization**: All search queries sanitized

### NFR6: Offline Support (PWA)

#### NFR6.1: Service Worker Strategy

```javascript
// Cache strategies
const CACHE_STRATEGIES = {
  'static-assets': 'cache-first',      // CSS, JS, fonts
  'city-data': 'stale-while-revalidate', // Climate data
  'api-geocoding': 'network-first',     // Search results
};
```

#### NFR6.2: Installable PWA

```json
// manifest.json
{
  "name": "Global Climate Explorer",
  "short_name": "ClimateExplorer",
  "description": "Explore 85+ years of climate data for any city",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e40af",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 🛠️ Technology Stack

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React SPA (Vite + TypeScript)            │   │
│  │                                                       │   │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────────────┐   │   │
│  │  │ Search  │  │ Report   │  │ Visualizations    │   │   │
│  │  │ Page    │  │ Page     │  │ (D3.js/Recharts)  │   │   │
│  │  └────┬────┘  └────┬─────┘  └───────────────────┘   │   │
│  │       │             │                                 │   │
│  │  ┌────▼─────────────▼─────────────────────────────┐  │   │
│  │  │         Web Worker (Metrics Engine)             │  │   │
│  │  │  - Climate calculations                        │  │   │
│  │  │  - Hemisphere-aware logic                      │  │   │
│  │  │  - Statistical analysis                        │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                 CLOUDFLARE EDGE NETWORK                       │
│                                                               │
│  ┌────────────────────┐  ┌─────────────────────────────┐    │
│  │  Cloudflare Pages  │  │  Cloudflare Workers         │    │
│  │  (Static Hosting)  │  │  (Serverless Functions)     │    │
│  │                    │  │                              │    │
│  │  - React SPA       │  │  /api/climate?lat=X&lon=Y   │    │
│  │  - Pre-rendered    │  │  /api/geocode?q=city        │    │
│  │    top 500 cities  │  │  /api/og/:city.png          │    │
│  └────────────────────┘  └──────────┬──────────────────┘    │
│                                      │                       │
│  ┌───────────────────────────────────┼───────────────────┐  │
│  │           Cloudflare KV Store                         │  │
│  │  - Cached climate data (by lat/lon grid)              │  │
│  │  - Pre-computed metrics for popular cities            │  │
│  │  - GeoNames city index (for offline autocomplete)     │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                 EXTERNAL APIs (Free)                          │
│                                                               │
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │  Open-Meteo          │  │  Open-Meteo Geocoding       │  │
│  │  Historical API      │  │  API                        │  │
│  │  (ERA5 Reanalysis)   │  │  (GeoNames-based)           │  │
│  │  1940-present        │  │  100,000+ cities             │  │
│  │  No API key needed   │  │  No API key needed           │  │
│  └──────────────────────┘  └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Recommended Stack

```
Frontend:
├── React 18 (UI framework)
├── TypeScript (type safety — essential for global data handling)
├── Vite (build tool)
├── React Router v6 (client-side routing)
├── D3.js v7 (complex visualizations)
├── Recharts (simple charts)
├── Framer Motion (animations)
├── Scrollama (scrollytelling)
├── Tailwind CSS (styling)
├── i18next (internationalization)
├── html2canvas + jsPDF (PDF export)
└── Workbox (PWA/Service Worker)

Backend (Cloudflare Workers):
├── Hono.js (lightweight web framework for Workers)
├── Cloudflare KV (key-value cache)
├── Cloudflare D1 (SQLite at edge — Phase 3)
└── @cloudflare/workers-types (TypeScript types)

Data Processing (Build-time, Python):
├── Python 3.10+
├── pandas (data manipulation)
├── requests (API calls)
├── geopandas (geographic data)
└── jupyter (exploration notebooks)

Development Tools:
├── ESLint + Prettier (code quality)
├── Vitest (unit testing)
├── Playwright (E2E testing)
├── Wrangler CLI (Cloudflare Workers dev)
└── Lighthouse CI (performance monitoring)

CI/CD:
├── GitHub Actions (build + deploy)
├── Cloudflare Pages (auto-deploy from GitHub)
└── Wrangler (Workers deployment)
```

### Why Hono.js for Workers?

```javascript
// Hono.js — Ultra-lightweight web framework for Cloudflare Workers
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';

const app = new Hono();

app.use('*', cors());

// Climate data endpoint with caching
app.get('/api/climate', cache({ cacheName: 'climate', cacheControl: 'max-age=86400' }), 
  async (c) => {
    const lat = c.req.query('lat');
    const lon = c.req.query('lon');
    
    // Check KV cache
    const cacheKey = `climate:${parseFloat(lat).toFixed(2)}:${parseFloat(lon).toFixed(2)}`;
    const cached = await c.env.CLIMATE_CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);
    
    // Fetch from Open-Meteo
    const data = await fetchOpenMeteo(lat, lon);
    await c.env.CLIMATE_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 2592000 });
    
    return c.json(data);
  }
);

// Geocoding proxy with caching
app.get('/api/geocode', async (c) => {
  const query = c.req.query('q');
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10`
  );
  return c.json(await res.json());
});

export default app;
```

---

## 📁 Project Structure

```
climate-explorer/
├── README.md
├── LICENSE
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── wrangler.toml                    # Cloudflare Workers config
├── tailwind.config.js
│
├── worker/                          # Cloudflare Workers (Backend)
│   ├── src/
│   │   ├── index.ts                 # Main worker entry (Hono.js)
│   │   ├── routes/
│   │   │   ├── climate.ts           # /api/climate endpoint
│   │   │   ├── geocode.ts           # /api/geocode endpoint
│   │   │   └── og-image.ts          # /api/og/:city.png (social cards)
│   │   ├── services/
│   │   │   ├── open-meteo.ts        # Open-Meteo API client
│   │   │   └── cache.ts             # KV cache logic
│   │   └── types/
│   │       └── climate.ts           # TypeScript interfaces
│   ├── wrangler.toml
│   └── package.json
│
├── scripts/                         # Build-time data processing
│   ├── fetch_top_cities.py          # Pre-fetch top 500 cities data
│   ├── generate_city_index.py       # Build searchable city index
│   ├── prerender_pages.py           # Pre-render popular city pages
│   └── validate_data.py             # Data quality checks
│
├── public/                          # Static assets
│   ├── data/
│   │   ├── cities15000.json         # GeoNames city index (compressed)
│   │   └── precomputed/             # Pre-computed data for top cities
│   │       ├── tokyo-jp.json
│   │       ├── sao-paulo-br.json
│   │       └── ...
│   ├── icons/
│   ├── fonts/
│   └── manifest.json                # PWA manifest
│
├── src/                             # React Application
│   ├── main.tsx                     # Entry point
│   ├── App.tsx                      # Root component + Router
│   │
│   ├── pages/
│   │   ├── HomePage.tsx             # Search landing page
│   │   ├── CityReportPage.tsx       # Full climate report for a city
│   │   ├── ComparePage.tsx          # Side-by-side city comparison
│   │   └── AboutPage.tsx            # Methodology & data sources
│   │
│   ├── components/
│   │   ├── search/
│   │   │   ├── CitySearchBar.tsx    # Autocomplete search input
│   │   │   ├── SearchSuggestions.tsx # Dropdown suggestions
│   │   │   └── RecentSearches.tsx   # Recently viewed cities
│   │   │
│   │   ├── visualizations/          # Reusable chart components
│   │   │   ├── ClimateStripes.tsx
│   │   │   ├── CalendarHeatmap.tsx
│   │   │   ├── RidgelinePlot.tsx
│   │   │   ├── TimeSeriesChart.tsx
│   │   │   ├── ComparativeBarChart.tsx
│   │   │   ├── RadialTemperatureChart.tsx
│   │   │   ├── PrecipitationChart.tsx
│   │   │   ├── HeatWaveTimeline.tsx
│   │   │   ├── SeasonalShiftChart.tsx
│   │   │   └── ExtremeRecordsCard.tsx
│   │   │
│   │   ├── report/                  # Report section components
│   │   │   ├── ReportHeader.tsx     # City name, coords, elevation
│   │   │   ├── KeyMetricsGrid.tsx   # Summary cards (warming rate, etc.)
│   │   │   ├── TemperatureSection.tsx
│   │   │   ├── PrecipitationSection.tsx
│   │   │   ├── ExtremesSection.tsx
│   │   │   ├── TrendsSection.tsx
│   │   │   └── StorytellingSection.tsx
│   │   │
│   │   ├── comparison/
│   │   │   ├── CitySelector.tsx
│   │   │   ├── ComparisonGrid.tsx
│   │   │   └── MetricDiffCard.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── LoadingScreen.tsx
│   │   │
│   │   └── common/
│   │       ├── UnitToggle.tsx       # °C / °F toggle
│   │       ├── LanguageSelector.tsx
│   │       ├── ExportButton.tsx     # PDF/PNG/CSV export
│   │       ├── ShareButton.tsx
│   │       └── Tooltip.tsx
│   │
│   ├── workers/
│   │   └── climate-metrics.worker.ts  # Web Worker for calculations
│   │
│   ├── hooks/
│   │   ├── useClimateData.ts        # Fetch + cache climate data
│   │   ├── useMetrics.ts            # Calculate metrics via Web Worker
│   │   ├── useCitySearch.ts         # Debounced city search
│   │   ├── useLocalStorage.ts       # Persist recent searches
│   │   └── useIntersectionObserver.ts
│   │
│   ├── utils/
│   │   ├── calculations.ts          # All climate metric formulas
│   │   ├── hemisphereLogic.ts       # Season/threshold adaptation
│   │   ├── formatters.ts            # Number/date formatting
│   │   ├── colors.ts                # Color scales and palettes
│   │   ├── exportPDF.ts             # PDF generation
│   │   └── urlHelpers.ts            # City slug generation
│   │
│   ├── i18n/
│   │   ├── index.ts                 # i18next config
│   │   ├── en.json
│   │   ├── pt-BR.json
│   │   ├── es.json
│   │   └── fr.json
│   │
│   ├── styles/
│   │   ├── index.css
│   │   ├── variables.css
│   │   └── animations.css
│   │
│   ├── types/
│   │   ├── climate.ts               # Climate data interfaces
│   │   ├── city.ts                  # City/geocoding interfaces
│   │   └── metrics.ts               # Computed metrics interfaces
│   │
│   └── constants/
│       ├── config.ts                # API URLs, defaults
│       ├── thresholds.ts            # Climate zone thresholds
│       └── topCities.ts             # Pre-loaded popular cities
│
├── tests/
│   ├── unit/
│   │   ├── calculations.test.ts
│   │   ├── hemisphereLogic.test.ts
│   │   └── formatters.test.ts
│   ├── integration/
│   │   └── cityReport.test.ts
│   └── e2e/
│       └── searchFlow.spec.ts
│
└── docs/
    ├── API.md                       # Worker API documentation
    ├── DATA_SOURCES.md              # Data source details
    ├── METHODOLOGY.md               # How metrics are calculated
    └── DEPLOYMENT.md                # Cloudflare deployment guide
```

---

## 📊 Data Pipeline Architecture

### Build-Time Pipeline (Pre-computation)

```
┌─────────────────────────────────────────────────────┐
│              BUILD-TIME (GitHub Actions)              │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  1. fetch_top_cities.py                      │   │
│  │     - Download GeoNames cities15000.txt      │   │
│  │     - Filter to top 500 by population        │   │
│  │     - Generate cities15000.json index        │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │                                │
│                     ▼                                │
│  ┌──────────────────────────────────────────────┐   │
│  │  2. Pre-fetch climate data for top 500       │   │
│  │     - Call Open-Meteo for each city          │   │
│  │     - Calculate all metrics                  │   │
│  │     - Save as precomputed JSON               │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │                                │
│                     ▼                                │
│  ┌──────────────────────────────────────────────┐   │
│  │  3. Build React SPA                          │   │
│  │     - Vite build                             │   │
│  │     - Include precomputed data in /public    │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │                                │
│                     ▼                                │
│  ┌──────────────────────────────────────────────┐   │
│  │  4. Deploy to Cloudflare Pages               │   │
│  │     - Static assets → CDN                    │   │
│  │     - Workers → Edge functions               │   │
│  │     - KV → Seed with precomputed data        │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Runtime Pipeline (User Request)

```
User types "Nairobi" in search bar
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  1. AUTOCOMPLETE (Client-side)                       │
│     - Check local cities15000.json first             │
│     - If not found, call /api/geocode?q=nairobi      │
│     - Display suggestions with country, population   │
└──────────────────┬──────────────────────────────────┘
                   │ User selects "Nairobi, Kenya"
                   ▼
┌─────────────────────────────────────────────────────┐
│  2. CHECK PRE-COMPUTED DATA (Client-side)            │
│     - Is Nairobi in top 500? → Load precomputed JSON │
│     - If yes: instant report (0ms API call)          │
│     - If no: proceed to step 3                       │
└──────────────────┬──────────────────────────────────┘
                   │ Not pre-computed
                   ▼
┌─────────────────────────────────────────────────────┐
│  3. FETCH VIA WORKER (Cloudflare Edge)               │
│     - Call /api/climate?lat=-1.29&lon=36.82          │
│     - Worker checks KV cache                         │
│     - If cached: return instantly                    │
│     - If not: fetch from Open-Meteo, cache in KV    │
└──────────────────┬──────────────────────────────────┘
                   │ Raw climate data (JSON)
                   ▼
┌─────────────────────────────────────────────────────┐
│  4. COMPUTE METRICS (Web Worker in browser)          │
│     - Detect hemisphere from latitude                │
│     - Apply adaptive thresholds                      │
│     - Calculate all 18 metrics                       │
│     - Generate chart data structures                 │
└──────────────────┬──────────────────────────────────┘
                   │ Computed metrics
                   ▼
┌─────────────────────────────────────────────────────┐
│  5. RENDER REPORT (React)                            │
│     - Progressive rendering (key metrics first)      │
│     - Lazy load charts below fold                    │
│     - Enable scrollytelling sections                 │
│     - Show export/share buttons                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Implementation Workflow

### Phase 2.1: Foundation (Week 1-2)

**Tasks**:
1. ✅ Initialize Vite + React + TypeScript project
2. ✅ Set up Cloudflare Pages deployment
3. ✅ Set up Cloudflare Workers with Hono.js
4. ✅ Implement Open-Meteo API client (Worker)
5. ✅ Implement KV caching layer
6. ✅ Create city search with autocomplete

**Deliverable**: Working search → data fetch pipeline

### Phase 2.2: Metrics Engine (Week 2-3)

**Tasks**:
1. ✅ Port all Phase 1 metrics to TypeScript
2. ✅ Add hemisphere-aware logic
3. ✅ Add adaptive thresholds by climate zone
4. ✅ Implement Web Worker for background computation
5. ✅ Add new global metrics (frost days, ice days, etc.)
6. ✅ Unit test all calculations

**Deliverable**: Complete metrics engine with tests

### Phase 2.3: Visualization Library (Week 3-5)

**Tasks**:
1. ✅ Port Phase 1 visualizations to reusable components
2. ✅ Add new global visualizations (precipitation, frost)
3. ✅ Make all charts responsive
4. ✅ Add animation and transitions
5. ✅ Implement city comparison view
6. ✅ Add export functionality (PDF, PNG, CSV)

**Deliverable**: Complete visualization component library

### Phase 2.4: Report Page & Storytelling (Week 5-6)

**Tasks**:
1. ✅ Design report page layout
2. ✅ Implement scrollytelling sections
3. ✅ Add dynamic narrative generation
4. ✅ Implement temperature unit toggle
5. ✅ Add language support (i18n)
6. ✅ Create comparison page

**Deliverable**: Full interactive report experience

### Phase 2.5: Pre-computation & SEO (Week 6-7)

**Tasks**:
1. ✅ Build Python scripts for top 500 cities pre-computation
2. ✅ Generate GeoNames city index
3. ✅ Pre-render popular city pages for SEO
4. ✅ Add dynamic OG images (social cards)
5. ✅ Implement sitemap generation
6. ✅ Add structured data (Schema.org)

**Deliverable**: SEO-optimized, pre-computed popular cities

### Phase 2.6: PWA & Polish (Week 7-8)

**Tasks**:
1. ✅ Implement Service Worker (Workbox)
2. ✅ Add PWA manifest
3. ✅ Performance optimization (Lighthouse >90)
4. ✅ Accessibility audit (WAVE, axe)
5. ✅ Cross-browser testing
6. ✅ Mobile responsiveness polish

**Deliverable**: Production-ready PWA

### Phase 2.7: Launch (Week 8)

**Tasks**:
1. ✅ Final QA testing
2. ✅ Set up custom domain (optional)
3. ✅ Configure Cloudflare analytics
4. ✅ Write documentation
5. ✅ Launch 🚀

**Deliverable**: Live at `climate-explorer.pages.dev`

---

## 🎨 Design System

### Landing Page (Search)

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│              🌍 Global Climate Explorer              │
│                                                      │
│     Explore 85+ years of climate data for            │
│     any city in the world                            │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  🔍  Search any city...                      │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Popular:  Tokyo  São Paulo  London  Nairobi  NYC   │
│                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │ 100K+  │  │ 85+    │  │ 18     │  │ Free   │   │
│  │ Cities │  │ Years  │  │Metrics │  │Forever │   │
│  └────────┘  └────────┘  └────────┘  └────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Report Page (City)

```
┌─────────────────────────────────────────────────────┐
│  ← Back   🌍 Climate Explorer   🌡️°C/°F   🌐 EN   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📍 Pindamonhangaba, São Paulo, Brazil              │
│  -22.925°, -45.462° | Elevation: 551m               │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         CLIMATE STRIPES (1940-2024)          │   │
│  │  ████████████████████████████████████████    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │+1.8°C│  │ 142  │  │  47  │  │ 3.2  │           │
│  │Warmer│  │ Hot  │  │Trop. │  │Heat  │           │
│  │since │  │ Days │  │Nights│  │Waves │           │
│  │1940  │  │/year │  │/year │  │/year │           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
│                                                      │
│  ═══════════════════════════════════════════════     │
│  📖 THE WARMING VALLEY (Scrollytelling)             │
│  ═══════════════════════════════════════════════     │
│                                                      │
│  [Calendar Heatmap]                                  │
│  [Ridgeline Plot]                                    │
│  [Time Series Charts]                                │
│  [Heat Wave Timeline]                                │
│  [Precipitation Analysis]                            │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  📥 Export PDF  │  🔗 Share  │  📊 Compare   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Color Palette

```css
/* Same as Phase 1, extended for global use */

/* Temperature Scale */
--temp-freezing: #053061;   /* <0°C */
--temp-cold: #2166ac;       /* 0-10°C */
--temp-cool: #67a9cf;       /* 10-15°C */
--temp-mild: #d1e5f0;       /* 15-20°C */
--temp-neutral: #f7f7f7;    /* 20-22°C */
--temp-warm: #fddbc7;       /* 22-25°C */
--temp-hot: #ef8a62;        /* 25-30°C */
--temp-very-hot: #b2182b;   /* 30-35°C */
--temp-extreme: #67001f;    /* >35°C */

/* Precipitation Scale */
--precip-dry: #fff7bc;      /* 0mm */
--precip-light: #d9f0a3;    /* 1-5mm */
--precip-moderate: #78c679;  /* 5-20mm */
--precip-heavy: #238443;    /* 20-50mm */
--precip-extreme: #004529;  /* >50mm */

/* UI Colors */
--primary: #1e40af;
--secondary: #dc2626;
--accent: #f59e0b;
--success: #10b981;
--background: #ffffff;
--surface: #f9fafb;
--text-primary: #111827;
--text-secondary: #6b7280;
```

---

## 🚀 Deployment Strategy

### Cloudflare Pages + Workers Setup

#### 1. Project Configuration (`wrangler.toml`)

```toml
name = "climate-explorer"
compatibility_date = "2024-01-01"

# KV Namespace for caching
[[kv_namespaces]]
binding = "CLIMATE_CACHE"
id = "your-kv-namespace-id"

# Workers routes
[[routes]]
pattern = "climate-explorer.pages.dev/api/*"
zone_name = "pages.dev"
```

#### 2. GitHub Actions Workflow

```yaml
name: Deploy Climate Explorer

on:
  push:
    branches: [main]
  schedule:
    # Re-compute top 500 cities monthly
    - cron: '0 0 1 * *'

jobs:
  precompute:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install Python deps
        run: pip install pandas requests geopandas
      
      - name: Pre-compute top 500 cities
        run: python scripts/fetch_top_cities.py
      
      - name: Upload precomputed data
        uses: actions/upload-artifact@v4
        with:
          name: precomputed-data
          path: public/data/precomputed/

  build-and-deploy:
    needs: precompute
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download precomputed data
        uses: actions/download-artifact@v4
        with:
          name: precomputed-data
          path: public/data/precomputed/
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: climate-explorer
          directory: dist

  deploy-worker:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: worker
```

#### 3. Custom Domain Setup

```
# Option A: Cloudflare Pages subdomain (free)
climate-explorer.pages.dev

# Option B: Custom domain (requires domain ownership)
climate.yourdomain.com
→ CNAME → climate-explorer.pages.dev
```

---

## 🔍 Data Sources - Detailed Comparison

### Geocoding APIs (Free)

| Source | Coverage | Speed | Accuracy | Rate Limit | API Key |
|--------|----------|-------|----------|------------|---------|
| **Open-Meteo Geocoding** ⭐ | 100K+ cities | Instant | Good | Generous | None |
| **GeoNames** (self-hosted) | 12M+ places | Instant (local) | Excellent | N/A | None |
| **Nominatim (OSM)** | Global | Slow | Excellent | 1 req/sec | None |
| **Photon (OSM)** | Global | Fast | Good | Moderate | None |

### Climate Data APIs (Free)

| Source | Coverage | Resolution | Latency | Global | API Key |
|--------|----------|------------|---------|--------|---------|
| **Open-Meteo Historical** ⭐ | 1940-present | 11km | Instant | ✅ | None |
| **Copernicus CDS (ERA5)** | 1940-present | 9km | Queue | ✅ | Required |
| **NASA POWER** | 1981-present | 50km | Fast | ✅ | None |
| **NOAA GHCN** | Variable | Station | Moderate | ✅ | None |

### Free Datasets for Enrichment

| Dataset | Content | Format | Use Case |
|---------|---------|--------|----------|
| **GeoNames cities15000** | All cities pop >15K | TSV (2.5MB) | Autocomplete index |
| **Natural Earth** | Country boundaries | GeoJSON | Map visualization |
| **Köppen Climate Classification** | Climate zones | Raster/Vector | Zone-aware thresholds |
| **WorldPop** | Population density | GeoTIFF | Urban heat island context |

---

## 📚 Learning Resources

### Cloudflare Development
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Hono.js Framework](https://hono.dev/)
- [Wrangler CLI Guide](https://developers.cloudflare.com/workers/wrangler/)

### Climate Data
- [Open-Meteo Historical Weather API Documentation](https://open-meteo.com/en/docs/historical-weather-api) ⭐
- [Open-Meteo Geocoding API Documentation](https://open-meteo.com/en/docs/geocoding-api) ⭐
- [Copernicus Climate Data Store](https://cds.climate.copernicus.eu/)
- [ETCCDI Climate Indices](http://etccdi.pacificclimate.org/list_27_indices.shtml)

### Data Visualization
- [D3.js Gallery](https://observablehq.com/@d3/gallery)
- [Climate Stripes by Ed Hawkins](https://showyourstripes.info/)
- [Scrollytelling Examples (The Pudding)](https://pudding.cool/)
- [Recharts Documentation](https://recharts.org/)

### Web Performance
- [Web.dev Performance](https://web.dev/performance/)
- [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/)

---

## 🎯 Success Criteria

### Technical Success
- ✅ Search works for 100,000+ cities worldwide
- ✅ Climate report generates in <5 seconds for any city
- ✅ Pre-computed data loads instantly for top 500 cities
- ✅ All visualizations render correctly on desktop and mobile
- ✅ Lighthouse score >90 in all categories
- ✅ PWA installable and works offline (for cached cities)
- ✅ Stays within Cloudflare free tier limits

### Content Success
- ✅ Hemisphere-aware metrics (correct seasons for both hemispheres)
- ✅ Adaptive thresholds (what's "hot" in Helsinki ≠ "hot" in Dubai)
- ✅ Compelling narrative generated dynamically per city
- ✅ Accurate data representation with proper attribution

### User Success
- ✅ Users can find and analyze any city in <10 seconds
- ✅ Users can compare cities side-by-side
- ✅ Users can export reports as PDF
- ✅ Users can share reports via URL
- ✅ Users understand climate trends for their city

---

## 🔮 Future Enhancements (Phase 3+)

### Phase 3: Advanced Features
1. **User Accounts**: Save favorite cities, custom reports (Cloudflare D1)
2. **Climate Projections**: Integrate IPCC scenarios (RCP 4.5, 8.5)
3. **Real-time Weather**: Current conditions overlay (Open-Meteo Forecast API)
4. **Satellite Imagery**: Historical satellite views (Sentinel Hub)
5. **Community Notes**: Users add local context to city reports

### Phase 4: Data Enrichment
1. **Air Quality**: Historical AQI data (OpenAQ)
2. **Sea Level**: Coastal city sea level rise data
3. **Vegetation Index**: NDVI changes over time
4. **Population Growth**: Correlate urbanization with temperature
5. **Energy Data**: Electricity consumption patterns

### Phase 5: AI Features
1. **Natural Language Queries**: "Was 2023 the hottest year in Tokyo?"
2. **Anomaly Detection**: Automatically flag unusual patterns
3. **Predictive Narratives**: AI-generated climate stories per city
4. **Image Generation**: AI-created infographics

---

## 💰 Cost Analysis

### Fully Free Stack

| Service | Tier | Monthly Cost | Limit |
|---------|------|-------------|-------|
| **Cloudflare Pages** | Free | $0 | Unlimited requests |
| **Cloudflare Workers** | Free | $0 | 100K requests/day |
| **Cloudflare KV** | Free | $0 | 100K reads/day, 1K writes/day |
| **Open-Meteo API** | Free | $0 | ~10K calls/day |
| **GitHub Actions** | Free | $0 | 2,000 min/month |
| **Domain** (optional) | N/A | $0-12/year | Optional |
| **TOTAL** | | **$0/month** | |

### If Scaling Beyond Free Tier

| Service | Paid Tier | Monthly Cost | Limit |
|---------|-----------|-------------|-------|
| **Cloudflare Workers** | Paid | $5 | 10M requests/month |
| **Cloudflare KV** | Paid | $5 | 10M reads, 1M writes |
| **Open-Meteo** | API Plan | €20 | Unlimited, priority |
| **TOTAL (scaled)** | | **~$30/month** | |

---

## 📄 License & Attribution

### Recommended License
- **Code**: MIT License
- **Data**: CC BY 4.0 (with attribution to Open-Meteo / Copernicus ERA5)
- **Content**: CC BY-SA 4.0
- **City Data**: CC BY 4.0 (GeoNames)

### Required Attributions
```
Climate data provided by Open-Meteo (https://open-meteo.com/) — ERA5 reanalysis via Copernicus/ECMWF
City data from GeoNames (https://www.geonames.org/) — CC BY 4.0
Visualization inspired by Ed Hawkins' Climate Stripes (https://showyourstripes.info/)
Hosted on Cloudflare Pages (https://pages.cloudflare.com/)
```

---

## 🎬 Conclusion

Phase 2 transforms the Pindamonhangaba prototype into a **global climate exploration platform** accessible to anyone, anywhere. By leveraging:

- **Open-Meteo's free API** for both geocoding and climate data (no API keys, instant responses)
- **Cloudflare's free tier** for hosting, edge computing, and caching
- **Client-side Web Workers** for heavy computation without server costs
- **Pre-computation** of top 500 cities for instant loading

The entire platform can run at **$0/month** while serving thousands of users daily. The architecture is designed to scale gracefully — if the project goes viral, upgrading to paid tiers costs only ~$30/month for 10M+ requests.

The key innovation is the **hemisphere-aware, zone-adaptive metrics engine** that makes the same codebase produce meaningful insights whether the user searches for Reykjavik, Nairobi, or Pindamonhangaba.

**Estimated Timeline**: 8 weeks from Phase 1 completion to global launch.

---

*Document Version: 1.0*  
*Last Updated: 2026-02-17*  
*Parent Document: [CLIMATE_DATA_PROJECT_ANALYSIS.md](CLIMATE_DATA_PROJECT_ANALYSIS.md)*  
*Author: Climate Data Visualization Team*
