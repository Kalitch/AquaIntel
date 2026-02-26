export interface SnapshotDto {
  stationId: string;
  flowValue: number | null;
  flowUnit: string | null;
  sustainabilityScore: number | null;
  anomalySeverity: string | null;
  droughtSeverity: string | null;
  currentPercentile: number | null;
  movingAvg7: number | null;
  movingAvg30: number | null;
  volatilityIndex: number | null;
}

export interface StationHistoryResponse {
  stationId: string;
  totalSnapshots: number;
  snapshots: StationSnapshotRow[];
  anomalyEvents: AnomalyEventRow[];
  scoreTrend: ScoreTrendPoint[];
}

export interface StationSnapshotRow {
  observedAt: string;
  flowValue: number | null;
  sustainabilityScore: number | null;
  anomalySeverity: string | null;
  droughtSeverity: string | null;
  currentPercentile: number | null;
  movingAvg7: number | null;
  movingAvg30: number | null;
  volatilityIndex: number | null;
}

export interface AnomalyEventRow {
  detectedAt: string;
  severity: string;
  flowValue: number | null;
  message: string | null;
  droughtSeverity: string | null;
  sustainabilityScore: number | null;
}

export interface ScoreTrendPoint {
  date: string;     // YYYY-MM-DD (daily aggregate)
  avgScore: number;
  minScore: number;
  maxScore: number;
  sampleCount: number;
}

export interface PlatformSummary {
  totalSnapshots: number;
  totalAnomalyEvents: number;
  totalStationsTracked: number;
  mostQueriedStations: Array<{
    stationId: string;
    totalQueries: number;
    lastSeen: string;
  }>;
  recentAnomalies: Array<AnomalyEventRow & { stationId: string }>;
  snapshotsLast24h: number;
  snapshotsLast7d: number;
}
