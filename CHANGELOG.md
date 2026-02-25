# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-02-25 🚀 *"A Memória de Calor de uma Cidade"* Launch

### Summary

Full site launch to GitHub Pages at `https://gabirusky.github.io/clima.pinda/`. Repository renamed from `pindamonhangaba-climate` → `clima.pinda`.

### Added

**Phase 10 — Accessibility & SEO**
- Comprehensive `:focus-visible` system in `index.css`: `a`, `button`, `input`, `select`, `textarea`, `input[type='range']` all get 2px warm-orange ring (WCAG 2.1 AA)
- `.skip-link` CSS class (replaces JS-driven inline style) — appears at top on keyboard focus
- OG image 1200×630px at `public/images/og-image.png` — climate stripes card with headline stats
- `public/sitemap.xml` — canonical URL + yearly changefreq
- `public/robots.txt` — `Sitemap:` directive added

**Phase 11 — Performance Optimization**
- `vite-plugin-pwa` + Workbox `generateSW` — service worker caches all three climate data JSONs with `StaleWhileRevalidate` (1-year TTL); Google Fonts via `CacheFirst`; `skipWaiting + clientsClaim`
- `lighthouserc.json` — CI assertions: FCP <1500ms · LCP <2500ms · TTI <3500ms · CLS <0.1 · scores ≥90

**Phase 12 — Testing (Jest + React Testing Library + Pytest)**
- `jest.config.ts` — ts-jest + jsdom + @/ alias
- `src/setupTests.ts` — jest-dom matchers
- `src/__tests__/calculations.test.ts` — 20 tests: `linearRegression`, `predictRegression`, `movingAverage`, `percentile`, `clamp`, `lerp`
- `src/__tests__/dataProcessing.test.ts` — 18 tests: `groupByYear`, `groupByDecade`, `filterByYear`, `countDaysAboveThreshold`, `metricsToArray`, `findRecordYear`, `decadalAverage`
- `src/__tests__/ThresholdSlider.test.tsx` — renders, slider attributes, value update on change
- `src/__tests__/ACCalculator.test.tsx` — renders, selector and rate input present; kWh formula tests
- `data/tests/test_process.py` — missing value interpolation, T_min > T_max violations, SU30/TR20/DTR/precip_days calcs
- `data/tests/test_wsdi_baseline.py` — p90 computed only from 1961–1990; 30 baseline years; pre/post exclusion
- `data/tests/test_cwd_cdd_edge.py` — 15 edge cases: all-dry CDD=365, all-wet CWD=365, alternating, longest streak, threshold boundary, leap year, empty series

**Phase 13 — CI/CD & Deployment**
- `.github/workflows/deploy.yml` — push-to-main + annual cron (Jan 1 06:00 UTC) + workflow_dispatch; `pages: write, id-token: write`
- `.github/workflows/ci.yml` — lint + test (with coverage) + build + Lighthouse CI step (`treosh/lighthouse-ci-action@v12`, `continue-on-error: true`)
- `public/.nojekyll` — Jekyll bypass (already present)
- `vite.config.ts` base updated to `/clima.pinda/`; all OG, sitemap, robots.txt, JSON-LD URLs updated

**Phase 14 — Documentation**
- `docs/API.md` — Open-Meteo archive API parameters, rate limits, example request, response schema, attribution
- `docs/DATA_SOURCES.md` — source comparison table, ERA5/NASA POWER cross-validation results, ETCCDI index mapping
- `docs/DEPLOYMENT.md` — GitHub Pages setup, local preview commands, annual data refresh workflow
- Source utility functions carry JSDoc comments for all public exports
- D3 animation blocks carry inline `// ...` comments explaining stroke-dashoffset and stagger pattern

### Changed
- Repository renamed `pindamonhangaba-climate` → `clima.pinda` (GitHub); all base paths updated
- `package.json` — `ts-jest`, `@types/jest` added to devDependencies; CI uses `npm test -- --coverage`
- `tsconfig.json` — `types` array includes `jest` and `@testing-library/jest-dom`

### Technical Stack (final)
- **Data**: Python · pandas · numpy · scipy (Mann-Kendall, OLS) · Open-Meteo ERA5 API
- **Frontend**: React 18 · TypeScript 5.9 · Vite 5 · Tailwind CSS v4 · shadcn/ui
- **Visualizations**: D3 v7 · Recharts 2 · Leaflet · Framer Motion
- **Scrollytelling**: Scrollama 3
- **Service Worker**: Workbox 7 via vite-plugin-pwa
- **Testing**: Jest 29 · React Testing Library 15 · ts-jest · Pytest
- **CI/CD**: GitHub Actions (deploy-pages) + Lighthouse CI

---

## [Unreleased → v1.0.0]

### Added
- Project scaffolding: `.gitignore`, `LICENSE`, `README.md`, `CHANGELOG.md`
- Python data pipeline: `fetch_climate_data.py`, `process_climate_data.py`, `calculate_metrics.py`, `generate_web_data.py`
- Python dependencies: `data/requirements.txt`, `data/environment.yml`
- Design concept: *"A City's Memory of Heat"* — geological-strata metaphor, ambient scroll-heat gradient
- Full frontend (Phases 4–9): 7 storytelling sections, 7 visualizations, 4 widgets, all hooks, design system CSS

---

## [0.1.0] — 2026-02-18

### Added
- Initial project setup and planning documentation
- Full technical analysis and requirements document (`CLIMATE_DATA_PROJECT_ANALYSIS.md`)

