import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../config/api';
import {
  IntelligenceResponse,
  WaterStation,
  AnalyticsSummary,
} from '../types/api.types';

// ─── useIntelligence ──────────────────────────────────────────────────────────

interface UseIntelligenceResult {
  data: IntelligenceResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useIntelligence(stationId: string | null): UseIntelligenceResult {
  const [data, setData] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!stationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<IntelligenceResponse>(
        `/intelligence?stationId=${encodeURIComponent(stationId)}`,
      );
      setData(res.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch intelligence data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── useStations ──────────────────────────────────────────────────────────────

interface UseStationsResult {
  stations: WaterStation[];
  loading: boolean;
  error: string | null;
}

export function useStations(state: string | null): UseStationsResult {
  const [stations, setStations] = useState<WaterStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    setLoading(true);
    setError(null);

    apiClient
      .get<WaterStation[]>(`/stations?state=${encodeURIComponent(state)}`)
      .then((res) => setStations(res.data))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch stations';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [state]);

  return { stations, loading, error };
}

// ─── useAnalytics ─────────────────────────────────────────────────────────────

interface UseAnalyticsResult {
  summary: AnalyticsSummary | null;
  loading: boolean;
  error: string | null;
}

export function useAnalytics(): UseAnalyticsResult {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<AnalyticsSummary>('/analytics/summary')
      .then((res) => setSummary(res.data))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch analytics';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { summary, loading, error };
}
