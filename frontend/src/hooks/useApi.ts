import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../config/api";
import {
  IntelligenceResponse,
  WaterStation,
  AnalyticsSummary,
  NarrativeResponse,
  NewsFeedResponse,
  LegislationResponse,
  NewsCategory,
} from "../types/api.types";
import { useIntelligenceStore } from "../components/store/intelligenceStore";

// ─── useIntelligence ──────────────────────────────────────────────────────────

interface UseIntelligenceResult {
  data: IntelligenceResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useIntelligence(
  stationId: string | null,
): UseIntelligenceResult {
  const { data, loading, error, isStale, setData, setLoading, setError } =
    useIntelligenceStore();

  const fetch = useCallback(async () => {
    if (!stationId) return;
    if (!isStale(stationId)) return; // already fresh — skip the request

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<IntelligenceResponse>(
        `/intelligence?stationId=${encodeURIComponent(stationId)}`,
      );
      setData(stationId, res.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch intelligence data",
      );
    } finally {
      setLoading(false);
    }
  }, [stationId, isStale, setData, setLoading, setError]);

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
  const {
    stationsLoading,
    stationsError,
    isStationsStale,
    setStations,
    setStationsLoading,
    setStationsError,
    getStations,
  } = useIntelligenceStore();

  useEffect(() => {
    if (!state) return;
    if (!isStationsStale(state)) return; // already fresh — skip the request

    setStationsLoading(true);
    setStationsError(null);

    apiClient
      .get<WaterStation[]>(`/stations?state=${encodeURIComponent(state)}`)
      .then((res) => setStations(state, res.data))
      .catch((err: unknown) =>
        setStationsError(
          err instanceof Error ? err.message : "Failed to fetch stations",
        ),
      )
      .finally(() => setStationsLoading(false));
  }, [
    state,
    isStationsStale,
    setStations,
    setStationsLoading,
    setStationsError,
  ]);

  return {
    stations: getStations(state ?? ""),
    loading: stationsLoading,
    error: stationsError,
  };
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
      .get<AnalyticsSummary>("/analytics/summary")
      .then((res) => setSummary(res.data))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to fetch analytics";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { summary, loading, error };
}

// ─── useNarrative ─────────────────────────────────────────────────────────────

interface UseNarrativeResult {
  data: NarrativeResponse | null;
  loading: boolean;
  error: string | null;
  generate: () => Promise<void>;
}

export function useNarrative(
  stationId: string | null,
  stationName?: string,
): UseNarrativeResult {
  const [data, setData] = useState<NarrativeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!stationId) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const params = new URLSearchParams({ stationId });
      if (stationName) params.set("stationName", stationName);
      const res = await apiClient.get<NarrativeResponse>(
        `/intelligence/narrative?${params.toString()}`,
      );
      setData(res.data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate narrative";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [stationId, stationName]);

  return { data, loading, error, generate };
}

// ─── useNews ──────────────────────────────────────────────────────────────────

export function useNews(category?: NewsCategory) {
  const [data, setData] = useState<NewsFeedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = category ? `?category=${category}` : "";

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get<NewsFeedResponse>(`/news${params}`)
      .then((res) => setData(res.data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to fetch news");
      })
      .finally(() => setLoading(false));
  }, [category]);

  return { data, loading, error };
}

// ─── useLegislation ───────────────────────────────────────────────────────────

export function useLegislation(aiOnly = false) {
  const [data, setData] = useState<LegislationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<LegislationResponse>(`/legislation${aiOnly ? "?aiOnly=true" : ""}`)
      .then((res) => setData(res.data))
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to fetch legislation",
        );
      })
      .finally(() => setLoading(false));
  }, [aiOnly]);

  return { data, loading, error };
}
