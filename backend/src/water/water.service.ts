import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  WaterStation,
  WaterData,
  DailyWaterValue,
  WaterReading,
  UsgsFeatureCollection,
  DroughtStatus,
  FlowPercentiles,
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
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
  };

  // Discharge (streamflow) param code
  private static readonly STREAMFLOW_PARAM = "00060";

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>(
      "USGS_BASE_URL",
      "https://api.waterdata.usgs.gov/ogcapi/v0",
    );
    const ttlSeconds = this.config.get<number>("CACHE_TTL_SECONDS", 300);
    this.cacheTtlMs = ttlSeconds * 1000;

    this.http = axios.create({
      baseURL,
      timeout: 20000,
      headers: { Accept: "application/json" },
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
    const numericOnly = stationId.replace(/^.*?(\d{6,15}).*$/, "$1");
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
      throw new HttpException(
        `Unknown state abbreviation: ${abbr}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Find all discharge (00060) time series for this state
      const response = await this.http.get<UsgsFeatureCollection>(
        "/collections/time-series-metadata/items",
        {
          params: {
            state_name: stateName,
            parameter_code: "00060", // Discharge only
            limit: 500,
            f: "json",
          },
        },
      );

      // Deduplicate by monitoring_location_id and extract unique stations
      const uniqueLocations = new Map<string, WaterStation>();
      const features = response.data?.features ?? [];

      for (const feat of features) {
        const locId = feat.properties?.["monitoring_location_id"] as string;
        if (!locId || uniqueLocations.has(locId)) continue;

        const coords = feat.geometry?.coordinates ?? [0, 0];
        const station: WaterStation = {
          id: locId.replace(/^USGS-/, ""), // Strip USGS- prefix for display
          name: `Station ${locId}`,
          state: abbr,
          latitude: coords[1],
          longitude: coords[0],
          type: "Stream",
        };
        uniqueLocations.set(locId, station);
      }

      const results = Array.from(uniqueLocations.values());
      this.setCache(key, results);
      return results;
    } catch (err) {
      this.logger.error(`Failed to fetch stations for state ${abbr}`, err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        `Unable to fetch USGS stations for state: ${abbr}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getWaterData(stationId: string): Promise<WaterData> {
    const key = `water:${stationId}`;
    const cached = this.getCache<WaterData>(key);
    if (cached) {
      this.logger.debug(`[CACHE HIT] Returning cached data for ${stationId}`);
      return cached;
    }

    const usgsId = this.toUsgsId(stationId);
    this.logger.log(`[FETCH START] Fetching data for ${stationId} → ${usgsId}`);

    try {
      this.logger.debug(`[TS-METADATA] Querying time-series-metadata for ${usgsId}`);
      const tsResponse = await this.http.get<UsgsFeatureCollection>(
        '/collections/time-series-metadata/items',
        {
          params: {
            monitoring_location_id: usgsId,
            parameter_code: '00060',
            limit: 10,
            f: 'json',
          },
        },
      );

      const features = tsResponse.data?.features ?? [];
      this.logger.debug(`[TS-METADATA] Found ${features.length} time series for ${usgsId}`);
      if (features.length > 0) {
        features.forEach((f, idx) => {
          this.logger.debug(
            `  [${idx}] comp_id=${f.properties?.['computation_identifier']} comp_period=${f.properties?.['computation_period_identifier']} param=${f.properties?.['parameter_code']} end=${f.properties?.['end']}`,
          );
        });
      }

      const found = this.findDailyMeanTimeSeriesId(tsResponse.data);
      this.logger.debug(`[SERIES-FOUND] ${found ? 'YES: ' + JSON.stringify(found) : 'NO'}`);

      if (!found) {
        this.logger.warn(`No daily mean discharge series found for ${usgsId}`);
        return {
          latest: null,
          dailySeries: [],
          stationStatus: {
            active: false,
            lastRecordDate: null,
            message:
              'No streamflow data found for this station. It may not report discharge (parameter 00060).',
          },
        };
      }

      const { id: timeSeriesId, beginDate, endDate } = found;

      // Determine if station is active (last record within 7 days)
      const isActive = endDate
        ? new Date(endDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : true;

      this.logger.log(
        `[STATION-STATUS] timeSeriesId=${timeSeriesId} | beginDate=${beginDate} | endDate=${endDate} | isActive=${isActive}`,
      );

      // Build status message
      let statusMessage = '';
      if (!isActive && endDate) {
        const formatted = new Date(endDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        statusMessage = `This station was decommissioned or is inactive. Last record: ${formatted}. Historical data is shown below.`;
      }

      this.logger.log(`[FETCH-DAILY] Fetching data for timeSeriesId=${timeSeriesId}`);

      // Fetch daily series — for inactive stations, fetch from begin date to end date
      const dailySeries = isActive
        ? await this.fetchDailySeries(timeSeriesId, 90)
        : await this.fetchDailySeries(timeSeriesId, 90, beginDate, endDate);

      this.logger.log(`[DAILY-FETCHED] Got ${dailySeries.length} daily records`);

      // Latest = last item in sorted series
      const latest =
        dailySeries.length > 0
          ? {
              stationId,
              parameter: 'Streamflow',
              unit: dailySeries[dailySeries.length - 1].unit,
              value: dailySeries[dailySeries.length - 1].value,
              timestamp:
                dailySeries[dailySeries.length - 1].date + 'T00:00:00.000Z',
            }
          : null;

      const data: WaterData = {
        latest,
        dailySeries,
        stationStatus: {
          active: isActive,
          lastRecordDate: endDate,
          message: statusMessage,
        },
      };

      this.logger.log(
        `[FETCH-COMPLETE] latest=${latest?.value ?? 'null'}, dailySeries=${dailySeries.length} days, active=${isActive}, message="${statusMessage}"`,
      );

      this.setCache(key, data);
      return data;
    } catch (err) {
      this.logger.error(`Failed to fetch water data for ${stationId}:`, err);
      return {
        latest: null,
        dailySeries: [],
        stationStatus: {
          active: false,
          lastRecordDate: null,
          message: 'Failed to fetch data for this station. Please try again.',
        },
      };
    }
  }

  private findDailyMeanTimeSeriesId(
    collection: UsgsFeatureCollection,
  ): { id: string; beginDate: string | null; endDate: string | null } | null {
    const features = collection?.features ?? [];

    // Look specifically for Daily Mean Discharge — no fallback to other types
    const daily = features.find(
      (f) =>
        f.properties?.['computation_identifier'] === 'Mean' &&
        f.properties?.['computation_period_identifier'] === 'Daily' &&
        f.properties?.['parameter_code'] === '00060',
    );

    if (daily?.properties?.['id']) {
      const beginDate = (daily.properties?.['begin'] as string | null) ?? null;
      const endDate = (daily.properties?.['end'] as string | null) ?? null;
      return {
        id: String(daily.properties['id']),
        beginDate: beginDate ? String(beginDate).split('T')[0] : null,
        endDate: endDate ? String(endDate).split('T')[0] : null,
      };
    }

    // No daily mean discharge series found at all
    return null;
  }

  // ─── Internal fetchers ─────────────────────────────────────────────────────

  private async fetchLatestReading(
    timeSeriesId: string,
    originalId: string,
  ): Promise<WaterReading | null> {
    try {
      const response = await this.http.get<UsgsDailyCollection>(
        "/collections/daily/items", // ← was /collections/time-series/items
        {
          params: {
            time_series_id: timeSeriesId,
            f: "json",
            limit: 1,
            sortby: "-time", // ← was sortby: 'time:D' (wrong syntax)
          },
        },
      );

      const features = response.data?.features ?? [];
      if (features.length === 0) return null;

      const props = features[0].properties;
      const rawValue = props.value;
      const numericValue =
        typeof rawValue === "string"
          ? parseFloat(rawValue)
          : Number(rawValue ?? NaN);

      return {
        stationId: originalId,
        parameter: "Streamflow",
        unit: String(props.unit_of_measure ?? "ft³/s"),
        value: isNaN(numericValue) ? 0 : numericValue,
        timestamp: String(props.time ?? new Date().toISOString()),
      };
    } catch (err) {
      this.logger.error(`Could not fetch latest for ${timeSeriesId}:`, err);
      return null;
    }
  }

  private async fetchDailySeries(
    timeSeriesId: string,
    days = 90,
    beginDate?: string | null,
    endDate?: string | null,
  ): Promise<DailyWaterValue[]> {
    try {
      let start: string;
      let end: string;

      // For inactive stations with explicit date bounds, use them
      if (beginDate && endDate) {
        start = beginDate;
        end = endDate;
        this.logger.debug(
          `[FETCH-DAILY-SERIES] Using explicit range: ${start} to ${end}`,
        );
      } else {
        // For active stations, calculate backward from today
        const endDateObj = new Date();
        const startDateObj = new Date();
        startDateObj.setDate(startDateObj.getDate() - days);
        const fmt = (d: Date) => d.toISOString().split('T')[0];
        start = fmt(startDateObj);
        end = fmt(endDateObj);
        this.logger.debug(
          `[FETCH-DAILY-SERIES] Using recent range (${days} days): ${start} to ${end}`,
        );
      }

      this.logger.debug(
        `[FETCH-DAILY-SERIES] timeSeriesId=${timeSeriesId}, range: ${start} to ${end}`,
      );

      const response = await this.http.get<UsgsDailyCollection>(
        '/collections/daily/items',
        {
          params: {
            time_series_id: timeSeriesId,
            time: `${start}/${end}`,
            sortby: 'time',
            limit: 100,
            f: 'json',
          },
        },
      );

      const features = response.data?.features ?? [];
      this.logger.debug(`[FETCH-DAILY-SERIES] Got ${features.length} features from API`);
      if (features.length === 0) {
        this.logger.warn(
          `[FETCH-DAILY-SERIES] No features returned for timeSeriesId=${timeSeriesId}`,
        );
      }

      return this.normalizeDailySeries(features);
    } catch (err) {
      this.logger.error(
        `[FETCH-DAILY-SERIES] Could not fetch daily series for ${timeSeriesId}:`,
        err,
      );
      return [];
    }
  }

  // ─── Normalization ─────────────────────────────────────────────────────────

  private normalizeDailySeries(
    features: UsgsDailyFeature[],
  ): DailyWaterValue[] {
    const results: DailyWaterValue[] = [];

    for (const feat of features) {
      const props = feat.properties;
      const dateStr = props.time;
      if (!dateStr) continue;
      const rawValue = props.value;
      const numericValue =
        typeof rawValue === "string"
          ? parseFloat(rawValue)
          : Number(rawValue ?? NaN);
      if (isNaN(numericValue)) continue;

      results.push({
        date: String(dateStr).split("T")[0],
        value: numericValue,
        unit: String(props.unit_of_measure ?? "ft3/s"),
      });
    }

    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ─── Drought Monitor API ────────────────────────────────────────────────────

  private async getCountyForCoords(
    lat: number,
    lon: number,
  ): Promise<{ fips: string; county: string; state: string } | null> {
    try {
      const res = await axios.get<{
        fips: string;
        county: string;
        state: string;
      }>("https://droughtmonitor.unl.edu/DmData/Api.ashx/getcountybylatlon", {
        params: { lat, lon },
        timeout: 10000,
      });
      return res.data ?? null;
    } catch {
      return null;
    }
  }

  private resolveSeverity(record: Record<string, number>): string {
    if ((record["D4"] ?? 0) > 0) return "D4 - Exceptional Drought";
    if ((record["D3"] ?? 0) > 0) return "D3 - Extreme Drought";
    if ((record["D2"] ?? 0) > 0) return "D2 - Severe Drought";
    if ((record["D1"] ?? 0) > 0) return "D1 - Moderate Drought";
    if ((record["D0"] ?? 0) > 0) return "D0 - Abnormally Dry";
    return "None";
  }

  async getDroughtStatus(
    lat: number,
    lon: number,
  ): Promise<DroughtStatus | null> {
    try {
      const county = await this.getCountyForCoords(lat, lon);
      if (!county) return null;

      const cacheKey = `drought:${county.fips}`;
      const cached = this.getCache<DroughtStatus>(cacheKey);
      if (cached) return cached;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);
      const fmt = (d: Date) => d.toISOString().split("T")[0];

      const res = await axios.get<Record<string, unknown>[]>(
        "https://droughtmonitor.unl.edu/DmData/Api.ashx/getStatisticsByAreaPercent",
        {
          params: {
            aoi: "county",
            startdate: fmt(startDate),
            enddate: fmt(endDate),
            statisticsType: 1,
            fips: county.fips,
          },
          timeout: 10000,
        },
      );

      const records = res.data ?? [];
      if (records.length === 0) return null;

      const latest = records[records.length - 1] as Record<string, unknown>;
      const severity = this.resolveSeverity(latest as Record<string, number>);

      const result: DroughtStatus = {
        severity: severity as any,
        county: county.county,
        stateAbbr: county.state,
        validStart: String(latest["MapDate"] ?? fmt(startDate)),
        validEnd: fmt(endDate),
        retrievedAt: new Date().toISOString(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch {
      return null;
    }
  }

  async getStationCoords(
    stationId: string,
  ): Promise<{ lat: number; lon: number } | null> {
    const cacheKey = `coords:${stationId}`;
    const cached = this.getCache<{ lat: number; lon: number }>(cacheKey);
    if (cached) return cached;

    try {
      const usgsId = this.toUsgsId(stationId);
      // Query time-series-metadata to find station coordinates
      const res = await this.http.get<UsgsFeatureCollection>(
        "/collections/time-series-metadata/items",
        {
          params: {
            monitoring_location_id: usgsId,
            parameter_code: "00060",
            limit: 1,
            f: "json",
          },
        },
      );

      const features = res.data?.features ?? [];
      if (features.length === 0) return null;

      const coords = features[0].geometry?.coordinates;
      if (!coords) return null;

      const result = { lat: coords[1], lon: coords[0] };
      this.setCache(cacheKey, result);
      return result;
    } catch {
      return null;
    }
  }

  // ─── USGS Statistics Service (percentiles) ──────────────────────────────────

  async getFlowPercentiles(
    stationId: string,
    currentValue: number | null,
  ): Promise<FlowPercentiles | null> {
    const numericId = stationId.replace(/^USGS-/, "");
    const cacheKey = `percentiles:${numericId}`;
    const cached = this.getCache<FlowPercentiles>(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get<string>(
        "https://waterservices.usgs.gov/nwis/stat/",
        {
          params: {
            sites: numericId,
            statReportType: "daily",
            statType: "all",
            parameterCd: "00060",
            format: "rdb",
          },
          responseType: "text",
          timeout: 10000,
        },
      );

      const lines = res.data
        .split("\n")
        .filter((l) => !l.startsWith("#") && l.trim().length > 0);

      if (lines.length < 3) return null;

      const headers = lines[0].split("\t");
      const dataLines = lines.slice(2);

      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();

      const monthIdx = headers.indexOf("month_nu");
      const dayIdx = headers.indexOf("day_nu");
      const p10Idx = headers.indexOf("p10_va");
      const p25Idx = headers.indexOf("p25_va");
      const p50Idx = headers.indexOf("p50_va");
      const p75Idx = headers.indexOf("p75_va");
      const p90Idx = headers.indexOf("p90_va");
      const beginYrIdx = headers.indexOf("begin_yr");
      const endYrIdx = headers.indexOf("end_yr");

      const todayRow = dataLines.find((line) => {
        const cols = line.split("\t");
        return (
          parseInt(cols[monthIdx]) === month && parseInt(cols[dayIdx]) === day
        );
      });

      if (!todayRow) return null;

      const cols = todayRow.split("\t");
      const parse = (idx: number): number | null => {
        const val = parseFloat(cols[idx]);
        return isNaN(val) ? null : val;
      };

      const p10 = parse(p10Idx);
      const p25 = parse(p25Idx);
      const p50 = parse(p50Idx);
      const p75 = parse(p75Idx);
      const p90 = parse(p90Idx);

      const beginYr = parseInt(cols[beginYrIdx]);
      const endYr = parseInt(cols[endYrIdx]);
      const recordYears =
        !isNaN(beginYr) && !isNaN(endYr) ? endYr - beginYr : null;

      let currentPercentile: number | null = null;
      let interpretation = "Insufficient data for percentile calculation";

      if (
        currentValue !== null &&
        p10 !== null &&
        p50 !== null &&
        p90 !== null
      ) {
        if (currentValue <= p10) {
          currentPercentile = Math.round((currentValue / p10) * 10);
          interpretation = `Below the 10th percentile — unusually low for this time of year`;
        } else if (p25 !== null && currentValue <= p25) {
          currentPercentile = Math.round(
            10 + ((currentValue - p10) / (p25 - p10)) * 15,
          );
          interpretation = `${currentPercentile}th percentile — below normal range`;
        } else if (currentValue <= p50) {
          const base = p25 ?? p10;
          currentPercentile = Math.round(
            25 + ((currentValue - base) / (p50 - base)) * 25,
          );
          interpretation = `${currentPercentile}th percentile — below median`;
        } else if (p75 !== null && currentValue <= p75) {
          currentPercentile = Math.round(
            50 + ((currentValue - p50) / (p75 - p50)) * 25,
          );
          interpretation = `${currentPercentile}th percentile — near normal`;
        } else if (currentValue <= p90) {
          const ceiling = p75 ?? p90;
          currentPercentile = Math.round(
            75 + ((currentValue - ceiling) / (p90 - ceiling)) * 15,
          );
          interpretation = `${currentPercentile}th percentile — above normal`;
        } else {
          currentPercentile = 90;
          interpretation = `Above the 90th percentile — unusually high for this time of year`;
        }
      }

      const result: FlowPercentiles = {
        p10,
        p25,
        p50,
        p75,
        p90,
        currentPercentile,
        interpretation,
        recordYears,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch {
      return null;
    }
  }
}