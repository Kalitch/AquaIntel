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
  isAnomaly: boolean;
  isSevere: boolean;
}

export interface AiImpact {
  waterVolumeLiters: number;
  kwhEquivalent: number;
  inferenceEquivalent: number;
  gpuHoursEquivalent: number;
  explanation: string;
  modelConstants: {
    waterPerKwh: number;
    kwhPerInference: number;
    kwhPerGpuTrainingHour: number;
  };
}

export interface AnomalyResult {
  detected: boolean;
  severity: 'none' | 'moderate' | 'severe';
  message: string;
  threshold: number;
}

export interface IntelligenceAnalytics {
  movingAverage7: number | null;
  movingAverage30: number | null;
  volatilityIndex: number | null;
  anomaly: AnomalyResult;
  sustainabilityScore: number;
}

export interface IntelligenceResponse {
  stationId: string;
  retrievedAt: string;
  water: {
    latest: WaterReading | null;
    dailySeries: DailyWaterValue[];
  };
  aiImpact: AiImpact | null;
  analytics: IntelligenceAnalytics;
  droughtStatus: DroughtStatus | null;
  stationStatus: StationStatus | null;
  percentiles: FlowPercentiles | null;
}

export interface AnalyticsSummary {
  totalRequests: number;
  totalErrors: number;
  averageResponseTimeMs: number;
  endpointBreakdown: Record<
    string,
    { count: number; avgResponseTimeMs: number; errorRate: number }
  >;
  topStations: Array<{ stationId: string; queryCount: number }>;
  uptimeSince: string;
}

export interface NarrativeResponse {
  narrative: string;
  provider: 'local' | 'openai' | 'anthropic';
  model: string;
  generatedAt: string;
}

export interface LlmStatus {
  provider: 'local' | 'openai' | 'anthropic';
  model: string;
  available: boolean;
}

export type NewsCategory = 'water' | 'legislation' | 'ai' | 'drought' | 'general';

export type BillStatus =
  | 'introduced'
  | 'committee'
  | 'passed_chamber'
  | 'signed'
  | 'vetoed'
  | 'failed'
  | 'monitoring';

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: NewsCategory;
}

export interface NewsFeedResponse {
  items: RssItem[];
  fetchedAt: string;
  totalSources: number;
  failedSources: string[];
}

export interface WaterBill {
  id: string;
  title: string;
  shortTitle: string;
  scope: string;
  status: BillStatus;
  sponsor?: string;
  date: string;
  summary: string;
  url: string;
  tags: string[];
  aiRelated: boolean;
}

export interface LegislationResponse {
  bills: WaterBill[];
  lastUpdated: string;
  totalBills: number;
  byStatus: Partial<Record<BillStatus, number>>;
  byScope: { federal: number; state: number };
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

export interface StationStatus {
  active: boolean;
  lastRecordDate: string | null;
  message: string;
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
  date: string;
  avgScore: number;
  minScore: number;
  maxScore: number;
  sampleCount: number;
}

export interface StationHistoryResponse {
  stationId: string;
  totalSnapshots: number;
  snapshots: StationSnapshotRow[];
  anomalyEvents: AnomalyEventRow[];
  scoreTrend: ScoreTrendPoint[];
}

export interface PlatformSummary {
  totalSnapshots: number;
  totalAnomalyEvents: number;
  totalStationsTracked: number;
  snapshotsLast24h: number;
  snapshotsLast7d: number;
  mostQueriedStations: Array<{
    stationId: string;
    totalQueries: number;
    lastSeen: string;
  }>;
  recentAnomalies: Array<AnomalyEventRow & { stationId: string }>;
}
