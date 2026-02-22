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
