// ============================================================
// Project Configuration Constants
// ============================================================

/** Target location: Praça Monsenhor Marcondes, Pindamonhangaba, SP */
export const LAT = -22.925 as const;
export const LON = -45.462 as const;

/** Historical data range */
export const START_YEAR = 1940 as const;
export const END_YEAR = 2024 as const;

/** Open-Meteo Archive API base URL */
export const OPEN_METEO_BASE_URL = 'https://archive-api.open-meteo.com/v1/archive' as const;

/**
 * Base URL for data files — uses Vite's BASE_URL so paths work both
 * in local dev (/) and on GitHub Pages (/pindamonhangaba-climate/).
 */
export const DATA_BASE_URL = `${import.meta.env.BASE_URL}data/` as const;

/** GitHub repository base path (matches vite.config.ts base) */
export const REPO_BASE = '/pindamonhangaba-climate/' as const;

/** Open-Meteo parameters to fetch */
export const OPEN_METEO_PARAMS = [
    'temperature_2m_max',
    'temperature_2m_min',
    'temperature_2m_mean',
    'precipitation_sum',
    'relative_humidity_2m_mean',
    'windspeed_10m_max',
] as const;

/** Timezone for all date operations */
export const TIMEZONE = 'America/Sao_Paulo' as const;
