import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  WaterStation,
  WaterData,
  DailyWaterValue,
  WaterReading,
  UsgsFeatureCollection,
} from './water.types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface UsgsDailyFeature {
  type: string;
  id: string;
  geometry: { type: string; coordinates: [number, number] } | null;
  properties: {
    monitoring_location_id?: string;
    value?: string | number;
    time?: string;
    unit_of_measure?: string;
    parameter_code?: string;
    statistic_id?: string;
    [key: string]: unknown;
  };
}

interface UsgsDailyCollection {
  type: string;
  features: UsgsDailyFeature[];
  numberReturned?: number;
}

@Injectable()
export class WaterService {
  private readonly logger = new Logger(WaterService.name);
  private readonly http: AxiosInstance;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly cacheTtlMs: number;

  private static readonly STATE_NAMES: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  };

  // Discharge (streamflow) param code
  private static readonly STREAMFLOW_PARAM = '00060';

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>(
      'USGS_BASE_URL',
      'https://api.waterdata.usgs.gov/ogcapi/v0',
    );
    const ttlSeconds = this.config.get<number>('CACHE_TTL_SECONDS', 300);
    this.cacheTtlMs = ttlSeconds * 1000;

    this.http = axios.create({
      baseURL,
      timeout: 20000,
      headers: { Accept: 'application/json' },
    });
  }

  // ─── Cache helpers ─────────────────────────────────────────────────────────

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, expiresAt: Date.now() + this.cacheTtlMs });
  }

  // ─── Convert any station ID input to "USGS-XXXXXXXX" format ───────────────

  private toUsgsId(stationId: string): string {
    // Already prefixed correctly
    if (/^USGS-\d+$/.test(stationId)) return stationId;
    // Bare numeric ID e.g. "10347640"
    if (/^\d+$/.test(stationId)) return `USGS-${stationId}`;
    // Try stripping any non-numeric suffix garbage and re-prefix
    const numericOnly = stationId.replace(/^.*?(\d{6,15}).*$/, '$1');
    if (/^\d{6,15}$/.test(numericOnly)) return `USGS-${numericOnly}`;
    // Fall back — just prefix as-is and let API reject it
    return `USGS-${stationId}`;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async getStations(stateAbbr: string): Promise<WaterStation[]> {
    const abbr = stateAbbr.toUpperCase();
    const key = `stations:${abbr}`;
    const cached = this.getCache<WaterStation[]>(key);
    if (cached) return cached;

    const stateName = WaterService.STATE_NAMES[abbr];
    if (!stateName) {
      throw new HttpException(`Unknown state abbreviation: ${abbr}`, HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await this.http.get<UsgsFeatureCollection>(
        '/collections/monitoring-locations/items',
        {
          params: {
            state_name: stateName,
            site_type: 'Stream',
            limit: 200,
            f: 'json',
          },
        },
      );

      // Build candidate list first
      const candidates = this.normalizeStations(response.data, abbr);

      // Filter to only stations that actually have recent streamflow data
      const withData = await this.filterStationsWithData(candidates);

      this.setCache(key, withData);
      return withData;
    } catch (err) {
      this.logger.error(`Failed to fetch stations for state ${abbr}`, err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        `Unable to fetch USGS stations for state: ${abbr}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * For each candidate station, check if the daily collection has any
   * recent streamflow records. Drop stations with no data.
   * Done in parallel batches to keep it fast.
   */
  private async filterStationsWithData(stations: WaterStation[]): Promise<WaterStation[]> {
    const BATCH = 10;
    const results: WaterStation[] = [];

    for (let i = 0; i < stations.length; i += BATCH) {
      const batch = stations.slice(i, i + BATCH);
      const checks = await Promise.allSettled(
        batch.map(async (s) => {
          const usgsId = this.toUsgsId(s.id);
          const has = await this.hasRecentData(usgsId);
          return has ? s : null;
        }),
      );
      for (const r of checks) {
        if (r.status === 'fulfilled' && r.value !== null) {
          results.push(r.value);
        }
      }
    }

    return results;
  }

  private async hasRecentData(usgsId: string): Promise<boolean> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const fmt = (d: Date) => d.toISOString().split('T')[0];

      const response = await this.http.get<UsgsDailyCollection>(
        '/collections/daily/items',
        {
          params: {
            monitoring_location_id: usgsId,
            parameter_code: WaterService.STREAMFLOW_PARAM,
            statistic_id: '00003',
            datetime: `${fmt(startDate)}/${fmt(endDate)}`,
            limit: 1,
            f: 'json',
          },
        },
      );
      return (response.data?.features?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async getWaterData(stationId: string): Promise<WaterData> {
    const key = `water:${stationId}`;
    const cached = this.getCache<WaterData>(key);
    if (cached) return cached;

    const usgsId = this.toUsgsId(stationId);
    this.logger.log(`Fetching data for ${stationId} → ${usgsId}`);

    const [latest, dailySeries] = await Promise.all([
      this.fetchLatestReading(usgsId, stationId),
      this.fetchDailySeries(usgsId),
    ]);

    const data: WaterData = { latest, dailySeries };
    this.setCache(key, data);
    return data;
  }

  // ─── Internal fetchers ─────────────────────────────────────────────────────

  private async fetchLatestReading(
    usgsId: string,
    originalId: string,
  ): Promise<WaterReading | null> {
    try {
      const response = await this.http.get<UsgsDailyCollection>(
        '/collections/latest/items',
        {
          params: {
            monitoring_location_id: usgsId,
            parameter_code: WaterService.STREAMFLOW_PARAM,
            f: 'json',
            limit: 1,
          },
        },
      );

      const features = response.data?.features ?? [];
      if (features.length === 0) return null;

      const props = features[0].properties;
      const rawValue = props.value;
      const numericValue =
        typeof rawValue === 'string' ? parseFloat(rawValue) : Number(rawValue ?? NaN);

      return {
        stationId: originalId,
        parameter: 'Streamflow',
        unit: String(props.unit_of_measure ?? 'ft3/s'),
        value: isNaN(numericValue) ? 0 : numericValue,
        timestamp: String(props.time ?? new Date().toISOString()),
      };
    } catch (err) {
      this.logger.warn(`Could not fetch latest for ${usgsId}: ${(err as Error).message}`);
      return null;
    }
  }

  private async fetchDailySeries(usgsId: string): Promise<DailyWaterValue[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      const fmt = (d: Date) => d.toISOString().split('T')[0];

      const response = await this.http.get<UsgsDailyCollection>(
        '/collections/daily/items',
        {
          params: {
            monitoring_location_id: usgsId,
            parameter_code: WaterService.STREAMFLOW_PARAM,
            statistic_id: '00003',
            datetime: `${fmt(startDate)}/${fmt(endDate)}`,
            limit: 90,
            f: 'json',
          },
        },
      );

      const features = response.data?.features ?? [];
      return this.normalizeDailySeries(features);
    } catch (err) {
      this.logger.warn(`Could not fetch daily series for ${usgsId}: ${(err as Error).message}`);
      return [];
    }
  }

  // ─── Normalization ─────────────────────────────────────────────────────────

  private normalizeStations(raw: UsgsFeatureCollection, stateAbbr: string): WaterStation[] {
    if (!raw?.features) return [];

    return raw.features
      .filter((f) => f.geometry !== null)
      .map((f) => {
        const props = f.properties;
        const coords = f.geometry?.coordinates ?? [0, 0];

        // monitoring_location_id is the authoritative field e.g. "USGS-10347640"
        // We keep the USGS- prefix stripped so the UI shows clean IDs,
        // but toUsgsId() will re-add it when making API calls.
        const rawId = String(
          props['monitoring_location_id'] ?? f.id ?? '',
        );
        // Strip USGS- prefix for display; keep only numeric part
        const id = rawId.replace(/^USGS-/, '');

        const name = String(
          props['monitoring_location_name'] ??
          props['monitoringLocationName'] ??
          'Unknown Station',
        );

        const type = String(props['site_type'] ?? 'Stream');

        return { id, name, state: stateAbbr, latitude: coords[1], longitude: coords[0], type };
      })
      // Drop any that produced a non-numeric ID (garbage from f.id fallback)
      .filter((s) => /^\d{6,15}$/.test(s.id));
  }

  private normalizeDailySeries(features: UsgsDailyFeature[]): DailyWaterValue[] {
    const results: DailyWaterValue[] = [];

    for (const feat of features) {
      const props = feat.properties;
      const dateStr = props.time;
      if (!dateStr) continue;
      const rawValue = props.value;
      const numericValue =
        typeof rawValue === 'string' ? parseFloat(rawValue) : Number(rawValue ?? NaN);
      if (isNaN(numericValue)) continue;

      results.push({
        date: String(dateStr).split('T')[0],
        value: numericValue,
        unit: String(props.unit_of_measure ?? 'ft3/s'),
      });
    }

    return results.sort((a, b) => a.date.localeCompare(b.date));
  }
}