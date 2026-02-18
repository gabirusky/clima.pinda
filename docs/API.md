# Open-Meteo API Documentation

## Base URL

```
https://archive-api.open-meteo.com/v1/archive
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `latitude` | float | -22.9250 (Pindamonhangaba) |
| `longitude` | float | -45.4620 (Pindamonhangaba) |
| `start_date` | string | YYYY-MM-DD (min: 1940-01-01) |
| `end_date` | string | YYYY-MM-DD |
| `daily` | string | Comma-separated list of variables |
| `timezone` | string | `America/Sao_Paulo` (required!) |

## Daily Variables

| Variable | Unit | Description |
|----------|------|-------------|
| `temperature_2m_max` | °C | Maximum temperature at 2m |
| `temperature_2m_min` | °C | Minimum temperature at 2m |
| `temperature_2m_mean` | °C | Mean temperature at 2m |
| `precipitation_sum` | mm | Total daily precipitation |
| `relative_humidity_2m_mean` | % | Mean relative humidity at 2m |
| `windspeed_10m_max` | km/h | Maximum wind speed at 10m |

## Rate Limits

- Free tier: ~10,000 calls/day
- No authentication required
- Response: instant JSON (milliseconds)

## Example Request

```python
import requests

response = requests.get(
    'https://archive-api.open-meteo.com/v1/archive',
    params={
        'latitude': -22.9250,
        'longitude': -45.4620,
        'start_date': '2024-01-01',
        'end_date': '2024-12-31',
        'daily': 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean,windspeed_10m_max',
        'timezone': 'America/Sao_Paulo'
    },
    timeout=30
)
data = response.json()
```

## Response Structure

```json
{
  "latitude": -22.925,
  "longitude": -45.462,
  "timezone": "America/Sao_Paulo",
  "daily": {
    "time": ["2024-01-01", "2024-01-02", ...],
    "temperature_2m_max": [32.1, 30.5, ...],
    "temperature_2m_min": [18.4, 17.2, ...],
    ...
  }
}
```

## Attribution

> Climate data provided by [Open-Meteo](https://open-meteo.com/) — ERA5 reanalysis via Copernicus/ECMWF.
> Licensed under CC BY 4.0.
