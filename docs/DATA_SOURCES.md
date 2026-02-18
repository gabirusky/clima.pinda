# Data Sources

## Primary: Open-Meteo ⭐

| Property | Value |
|----------|-------|
| URL | https://archive-api.open-meteo.com/v1/archive |
| Coverage | 1940–present |
| Resolution | 11km (ERA5-Land with elevation correction) |
| Format | JSON (instant) |
| Cost | Free (non-commercial) |
| Rate limit | ~10,000 calls/day |

**Why Open-Meteo?** It delivers ERA5 reanalysis data via instant JSON API with automatic coordinate interpolation — critical for Pindamonhangaba's valley location.

## Alternative: Copernicus CDS (ERA5)

| Property | Value |
|----------|-------|
| URL | https://cds.climate.copernicus.eu/ |
| Coverage | 1940–present |
| Resolution | 9km (raw grid) |
| Format | NetCDF/GRIB (requires xarray) |
| Cost | Free |
| Latency | Queue-based (minutes to hours) |

**Use for**: Formal scientific research requiring primary source citation.

## Alternative: NASA POWER

| Property | Value |
|----------|-------|
| URL | https://power.larc.nasa.gov/api/temporal/daily/point |
| Coverage | 1981–present |
| Resolution | 50km (coarse) |
| Format | JSON |
| Cost | Free |

**Use for**: Quick secondary validation.

## Alternative: INMET (Brazil)

| Property | Value |
|----------|-------|
| URL | https://apitempo.inmet.gov.br/ |
| Coverage | Station-dependent |
| Resolution | Station-based |
| Cost | Free |

**Use for**: Ground-truth validation against reanalysis data.

## Attribution

```
Climate data provided by Open-Meteo (https://open-meteo.com/) — ERA5 reanalysis via Copernicus/ECMWF
Visualization inspired by Ed Hawkins' Climate Stripes (https://showyourstripes.info/)
```
