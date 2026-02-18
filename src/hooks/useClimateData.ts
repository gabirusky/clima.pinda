import { useState, useEffect } from 'react';
import type { DailyRecord, AnnualMetrics, ClimateSummary } from '../types/climate.ts';

const DATA_BASE_URL = `${import.meta.env.BASE_URL}data/`;

interface ClimateDataState {
    dailyData: DailyRecord[] | null;
    metrics: Record<number, AnnualMetrics> | null;
    summary: ClimateSummary | null;
    loading: boolean;
    error: Error | null;
}

/**
 * Fetches all three climate data files in parallel.
 * Uses DATA_BASE_URL so paths work in both local dev and GitHub Pages.
 */
export function useClimateData(): ClimateDataState {
    const [state, setState] = useState<ClimateDataState>({
        dailyData: null,
        metrics: null,
        summary: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;

        async function fetchAll() {
            try {
                const [climateRes, metricsRes, summaryRes] = await Promise.all([
                    fetch(`${DATA_BASE_URL}climate_data.json`),
                    fetch(`${DATA_BASE_URL}metrics.json`),
                    fetch(`${DATA_BASE_URL}summary.json`),
                ]);

                if (!climateRes.ok) throw new Error(`climate_data.json: ${climateRes.status}`);
                if (!metricsRes.ok) throw new Error(`metrics.json: ${metricsRes.status}`);
                if (!summaryRes.ok) throw new Error(`summary.json: ${summaryRes.status}`);

                const [climate, metricsData, summaryData] = await Promise.all([
                    climateRes.json() as Promise<DailyRecord[]>,
                    metricsRes.json() as Promise<Record<number, AnnualMetrics>>,
                    summaryRes.json() as Promise<ClimateSummary>,
                ]);

                if (!cancelled) {
                    setState({
                        dailyData: climate,
                        metrics: metricsData,
                        summary: summaryData,
                        loading: false,
                        error: null,
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    setState(prev => ({ ...prev, loading: false, error: err as Error }));
                }
            }
        }

        fetchAll();
        return () => { cancelled = true; };
    }, []);

    return state;
}
