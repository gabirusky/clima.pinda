// ============================================================
// Project Configuration Constants
// ============================================================

/** Target location: Praça Monsenhor Marcondes, Pindamonhangaba, SP */
export const LAT = -22.925;
export const LON = -45.462;

/** Historical data range */
export const START_YEAR = 1940;
export const END_YEAR = 2024;

/** Open-Meteo Archive API base URL */
export const OPEN_METEO_BASE_URL = 'https://archive-api.open-meteo.com/v1/archive';

/**
 * Base URL for data files — uses Vite's BASE_URL so paths work both
 * in local dev (/) and on GitHub Pages (/pindamonhangaba-climate/).
 */
export const DATA_BASE_URL = `${import.meta.env.BASE_URL}data/`;

/** GitHub repository base path (matches vite.config.js base) */
export const REPO_BASE = '/pindamonhangaba-climate/';

/** Open-Meteo parameters to fetch */
export const OPEN_METEO_PARAMS = [
    'temperature_2m_max',
    'temperature_2m_min',
    'temperature_2m_mean',
    'precipitation_sum',
    'relative_humidity_2m_mean',
    'windspeed_10m_max',
];

/** Timezone for all date operations */
export const TIMEZONE = 'America/Sao_Paulo';
