# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Project scaffolding: `.gitignore`, `LICENSE`, `README.md`, `CHANGELOG.md`
- Python data pipeline structure: `data/scripts/`, `data/notebooks/`, `data/raw/`, `data/processed/`
- Python dependencies: `data/requirements.txt`, `data/environment.yml`
- Planning documents: `PLAN.md`, `TASKS.md`, `CONTEXT.md`
- **Task 3.3** — `data/scripts/generate_web_data.py`: web data generator producing three JSON files for the React frontend
  - `public/data/climate_data.json` — 31,412 daily records; auto-gzip compressed from 4,309 KB → 425 KB (`.json.gz`)
  - `public/data/metrics.json` — 86 annual ETCCDI metric entries keyed by year
  - `public/data/summary.json` — headline stats: hottest day (1961-09-28, 38.2°C), coldest day (1979-06-01, 1.3°C), longest warm spell (82 days · 2018 · WSDI), SU30 trend (+7.09 days/decade, p < 0.0001), decade comparison table, temperature anomaly series
  - Fixed `ROOT` path resolution (`parent × 3`) so the script correctly locates processed CSVs from `data/scripts/`

### Changed
- **Phase 3 now complete**: all three data-processing scripts (3.1 clean, 3.2 metrics, 3.3 web data) are done; `public/data/` is ready for frontend consumption

---

## [0.1.0] - 2026-02-18

### Added
- Initial project setup and planning documentation
- Full technical analysis and requirements document (`CLIMATE_DATA_PROJECT_ANALYSIS.md`)
