export interface WaterStation {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  type: string;
}

export interface WaterReading {
  stationId: string;
  parameter: string;
  unit: string;
  value: number;
  timestamp: string;
}

export interface DailyWaterValue {
  date: string;
  value: number;
  unit: string;
}

export interface WaterData {
  latest: WaterReading | null;
  dailySeries: DailyWaterValue[];
}

// Raw USGS OGC API response shapes
export interface UsgsFeatureCollection {
  type: string;
  features: UsgsFeature[];
  numberMatched?: number;
  numberReturned?: number;
}

export interface UsgsFeature {
  type: string;
  id: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  } | null;
  properties: Record<string, unknown>;
}

export interface UsgsObservationCollection {
  type: string;
  features: UsgsObservationFeature[];
}

export interface UsgsObservationFeature {
  type: string;
  id: string;
  geometry: unknown;
  properties: {
    phenomenonTime?: string;
    result?: number | string;
    resultTime?: string;
    unitOfMeasurement?: { symbol?: string; name?: string };
    observedProperty?: { name?: string };
    [key: string]: unknown;
  };
}

export type DroughtSeverity =
  | 'None'
  | 'D0 - Abnormally Dry'
  | 'D1 - Moderate Drought'
  | 'D2 - Severe Drought'
  | 'D3 - Extreme Drought'
  | 'D4 - Exceptional Drought';

export interface DroughtStatus {
  severity: DroughtSeverity;
  county: string;
  stateAbbr: string;
  validStart: string;
  validEnd: string;
  retrievedAt: string;
}

export interface FlowPercentiles {
  p10: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  currentPercentile: number | null;
  interpretation: string;
  recordYears: number | null;
}
