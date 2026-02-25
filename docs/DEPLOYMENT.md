# Deployment Guide

## GitHub Pages Setup

### 1. Repository Settings

In your GitHub repository:
- Go to **Settings → Pages**
- Source: **GitHub Actions**

### 2. Base Path

The `base` in `vite.config.ts` is set to `/clima.pinda/` — this must match the **exact** GitHub repository name (case-sensitive):

```ts
base: '/clima.pinda/',
```

### 3. Deploy

Push to `main` — the GitHub Actions workflow deploys automatically.

Or trigger manually: **Actions → Deploy to GitHub Pages → Run workflow**.

### 4. Verify

Live site: **[https://gabirusky.github.io/clima.pinda/](https://gabirusky.github.io/clima.pinda/)**

## Local Preview

```bash
npm run build
npm run preview
# Open http://localhost:4173/clima.pinda/
```

## Annual Data Refresh

The deploy workflow also runs on January 1st automatically via cron.
To manually refresh data:
1. Run Python pipeline: `python data/scripts/fetch_climate_data.py`
2. Run: `python data/scripts/process_climate_data.py`
3. Run: `python data/scripts/calculate_metrics.py`
4. Run: `python data/scripts/generate_web_data.py`
5. Commit updated `public/data/*.json`
6. Push to main — auto-deploys.

## Service Worker

`vite-plugin-pwa` generates a service worker at build time. On first visit, the worker pre-caches all three data JSON files — subsequent visits load data instantly from the Cache API.

