export type LlmProvider = 'local' | 'openai' | 'anthropic';

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  baseURL?: string;
  apiKey?: string;
}

export interface StationNarrativeInput {
  stationId: string;
  stationName?: string;
  latest: {
    value: number;
    unit: string;
    timestamp: string;
  } | null; 
  analytics: {
    movingAverage7: number | null;
    movingAverage30: number | null;
    volatilityIndex: number | null;
    anomaly: {
      detected: boolean;
      severity: 'none' | 'moderate' | 'severe';
      message: string;
    };
    sustainabilityScore: number;
  };
  aiImpact: {
    waterVolumeLiters: number;
    kwhEquivalent: number;
    inferenceEquivalent: number;
    gpuHoursEquivalent: number;
    explanation: string;
  } | null;
  droughtSeverity?: string | null;
}

export interface NarrativeResponse {
  narrative: string;
  provider: LlmProvider;
  model: string;
  generatedAt: string;
}
