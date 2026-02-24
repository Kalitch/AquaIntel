import { create } from "zustand";
import { IntelligenceResponse, WaterStation } from "../../types/api.types";

const INTELLIGENCE_STALE_MS = 5 * 60 * 1000; // 5 minutes
const STATIONS_STALE_MS = 15 * 60 * 1000; // 15 minutes

// ─── Intelligence slice ───────────────────────────────────────────────────────

interface IntelligenceSlice {
  data: IntelligenceResponse | null;
  stationId: string | null;
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
  setData: (stationId: string, data: IntelligenceResponse) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  isStale: (stationId: string) => boolean;
}

// ─── Stations slice ───────────────────────────────────────────────────────────

interface StationsSlice {
  stationsByState: Record<string, WaterStation[]>;
  stationsFetchedAt: Record<string, number>;
  stationsLoading: boolean;
  stationsError: string | null;
  setStations: (state: string, data: WaterStation[]) => void;
  setStationsLoading: (v: boolean) => void;
  setStationsError: (v: string | null) => void;
  isStationsStale: (state: string) => boolean;
  getStations: (state: string) => WaterStation[];
}

// ─── Combined store ───────────────────────────────────────────────────────────

type AppStore = IntelligenceSlice & StationsSlice;

export const useIntelligenceStore = create<AppStore>((set, get) => ({
  // ── Intelligence ────────────────────────────────────────────────────────────
  data: null,
  stationId: null,
  fetchedAt: null,
  loading: false,
  error: null,

  setData: (stationId, data) =>
    set({ data, stationId, fetchedAt: Date.now(), error: null }),

  setLoading: (v) => set({ loading: v }),

  setError: (v) => set({ error: v, loading: false }),

  isStale: (stationId) => {
    const { stationId: cachedId, fetchedAt } = get();
    if (cachedId !== stationId) return true;
    if (!fetchedAt) return true;
    return Date.now() - fetchedAt > INTELLIGENCE_STALE_MS;
  },

  // ── Stations ────────────────────────────────────────────────────────────────
  stationsByState: {},
  stationsFetchedAt: {},
  stationsLoading: false,
  stationsError: null,

  setStations: (state, data) =>
    set((s) => ({
      stationsByState: { ...s.stationsByState, [state]: data },
      stationsFetchedAt: { ...s.stationsFetchedAt, [state]: Date.now() },
      stationsError: null,
    })),

  setStationsLoading: (v) => set({ stationsLoading: v }),

  setStationsError: (v) => set({ stationsError: v, stationsLoading: false }),

  isStationsStale: (state) => {
    const { stationsFetchedAt } = get();
    if (!stationsFetchedAt[state]) return true;
    return Date.now() - stationsFetchedAt[state] > STATIONS_STALE_MS;
  },

  getStations: (state) => get().stationsByState[state] ?? [],
}));
