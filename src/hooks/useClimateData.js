import { useState, useEffect } from 'react';
import { DATA_BASE_URL } from '../constants/config.js';

/**
 * Fetches all three climate data files in parallel.
 *
 * @returns {{ dailyData: Array, metrics: Object, summary: Object, loading: boolean, error: Error|null }}
 *
 * Data shapes:
 *   dailyData  — array of { date, temp_max, temp_min, temp_mean, precipitation, humidity, wind_max }
 *   metrics    — object keyed by year: { 1940: { hd30, hd32, tr20, ... }, ... }
 *   summary    — { hottest_day, coldest_day, longest_heat_wave, hd30_trend_slope_per_decade, ... }
 */
export function useClimateData() {
    const [dailyData, setDailyData] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchAll() {
            try {
                const [climateRes, metricsRes, summaryRes] = await Promise.all([
                    fetch(`${DATA_BASE_URL}climate_data.json`),
                    fetch(`${DATA_BASE_URL}metrics.json`),
                    fetch(`${DATA_BASE_URL}summary.json`),
                ]);

                // Check all responses
                if (!climateRes.ok) throw new Error(`climate_data.json: ${climateRes.status}`);
                if (!metricsRes.ok) throw new Error(`metrics.json: ${metricsRes.status}`);
                if (!summaryRes.ok) throw new Error(`summary.json: ${summaryRes.status}`);

                const [climate, metricsData, summaryData] = await Promise.all([
                    climateRes.json(),
                    metricsRes.json(),
                    summaryRes.json(),
                ]);

                if (!cancelled) {
                    setDailyData(climate);
                    setMetrics(metricsData);
                    setSummary(summaryData);
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err);
                    setLoading(false);
                }
            }
        }

        fetchAll();

        return () => {
            cancelled = true;
        };
    }, []);

    return { dailyData, metrics, summary, loading, error };
}
