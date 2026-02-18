# Deployment Guide

## GitHub Pages Setup

### 1. Repository Settings

In your GitHub repository:
- Go to **Settings → Pages**
- Source: **GitHub Actions**

### 2. Update Placeholders

Before deploying, replace `YOUR_USERNAME` in:
- `index.html` (OG/Twitter image URLs)
- `public/sitemap.xml`
- `README.md` (live link)

Also verify `base` in `vite.config.js` matches your **exact** repository name (case-sensitive):
```js
base: '/pindamonhangaba-climate/',
```

### 3. Deploy

Push to `main` — the GitHub Actions workflow deploys automatically.

Or trigger manually: **Actions → Deploy to GitHub Pages → Run workflow**.

### 4. Verify

Visit: `https://YOUR_USERNAME.github.io/pindamonhangaba-climate/`

## Local Preview

```bash
npm run build
npm run preview
# Open http://localhost:4173/pindamonhangaba-climate/
```

## Annual Data Refresh

The deploy workflow runs automatically on January 1st via cron.
To manually refresh data:
1. Run Python pipeline: `python data/scripts/fetch_climate_data.py` etc.
2. Commit updated `public/data/*.json`
3. Push to main — auto-deploys.
