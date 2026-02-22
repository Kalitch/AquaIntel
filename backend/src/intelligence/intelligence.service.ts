import { Injectable } from '@nestjs/common';
import { DailyWaterValue } from '../water/water.types';

export interface MovingAverageResult {
  movingAverage7: number | null;
  movingAverage30: number | null;
}

export interface AnomalyResult {
  detected: boolean;
  severity: 'none' | 'moderate' | 'severe';
  message: string;
  threshold: number;
}

export interface AnalyticsResult {
  movingAverage7: number | null;
  movingAverage30: number | null;
  volatilityIndex: number | null;
  anomaly: AnomalyResult;
  sustainabilityScore: number;
  seriesWithAnomalies: Array<DailyWaterValue & { isAnomaly: boolean; isSevere: boolean }>;
}

/**
 * Deterministic intelligence engine.
 *
 * All calculations are server-side and fully explainable.
 *
 * Algorithms:
 *   - Moving Average (7-day, 30-day): simple arithmetic mean over the window
 *   - Volatility Index: coefficient of variation (stdDev / mean)
 *   - Anomaly Detection (rule-based):
 *       today > MA7 * 2.0  → "severe"
 *       today > MA7 * 1.5  → "moderate"
 *   - Sustainability Score (0–100):
 *       Base 100, deductions:
 *         - high volatility (> 0.5): −20
 *         - severe anomaly: −30
 *         - moderate anomaly: −15
 *         - low flow (< 10th percentile): −15
 */
@Injectable()
export class IntelligenceService {
  private static readonly ANOMALY_MODERATE_MULTIPLIER = 1.5;
  private static readonly ANOMALY_SEVERE_MULTIPLIER = 2.0;
  private static readonly VOLATILITY_HIGH_THRESHOLD = 0.5;

  analyze(series: DailyWaterValue[], latestValue: number | null): AnalyticsResult {
    const values = series.map((d) => d.value).filter((v) => !isNaN(v) && isFinite(v));

    const movingAverage7 = this.computeMovingAverage(values, 7);
    const movingAverage30 = this.computeMovingAverage(values, 30);
    const volatilityIndex = this.computeVolatilityIndex(values);

    const current = latestValue ?? values[values.length - 1] ?? null;
    const anomaly = this.detectAnomaly(current, movingAverage7);
    const sustainabilityScore = this.computeSustainabilityScore(
      volatilityIndex,
      anomaly,
      values,
    );

    const seriesWithAnomalies = this.tagAnomaliesInSeries(series, 7);

    return {
      movingAverage7,
      movingAverage30,
      volatilityIndex,
      anomaly,
      sustainabilityScore,
      seriesWithAnomalies,
    };
  }

  // ─── Moving Averages ──────────────────────────────────────────────────────

  private computeMovingAverage(values: number[], window: number): number | null {
    if (values.length < window) {
      // Use all available data if less than window
      if (values.length === 0) return null;
      const slice = values;
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    }
    const slice = values.slice(-window);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  // ─── Volatility Index ─────────────────────────────────────────────────────

  /**
   * Coefficient of variation: stdDev / mean
   * Range: [0, ∞) — higher means more volatile
   * Capped at 2.0 for UI display purposes
   */
  private computeVolatilityIndex(values: number[]): number | null {
    if (values.length < 2) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return null;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    return Math.round(Math.min(cv, 2) * 1000) / 1000;
  }

  // ─── Anomaly Detection ────────────────────────────────────────────────────

  private detectAnomaly(current: number | null, ma7: number | null): AnomalyResult {
    if (current === null || ma7 === null || ma7 === 0) {
      return { detected: false, severity: 'none', message: 'Insufficient data', threshold: 0 };
    }

    const ratio = current / ma7;

    if (ratio >= IntelligenceService.ANOMALY_SEVERE_MULTIPLIER) {
      return {
        detected: true,
        severity: 'severe',
        message: `Flow is ${ratio.toFixed(1)}× the 7-day average — severe anomaly detected.`,
        threshold: IntelligenceService.ANOMALY_SEVERE_MULTIPLIER,
      };
    }

    if (ratio >= IntelligenceService.ANOMALY_MODERATE_MULTIPLIER) {
      return {
        detected: true,
        severity: 'moderate',
        message: `Flow is ${ratio.toFixed(1)}× the 7-day average — moderate anomaly detected.`,
        threshold: IntelligenceService.ANOMALY_MODERATE_MULTIPLIER,
      };
    }

    return {
      detected: false,
      severity: 'none',
      message: 'Flow within normal range.',
      threshold: 0,
    };
  }

  // ─── Sustainability Score ─────────────────────────────────────────────────

  /**
   * Scores the current hydrological state on a 0–100 scale.
   * Higher = more stable/sustainable conditions.
   */
  private computeSustainabilityScore(
    volatility: number | null,
    anomaly: AnomalyResult,
    values: number[],
  ): number {
    let score = 100;

    if (volatility !== null && volatility > IntelligenceService.VOLATILITY_HIGH_THRESHOLD) {
      score -= 20;
    }

    if (anomaly.severity === 'severe') score -= 30;
    else if (anomaly.severity === 'moderate') score -= 15;

    // Penalize very low flow (< 10th percentile)
    if (values.length >= 10) {
      const sorted = [...values].sort((a, b) => a - b);
      const p10 = sorted[Math.floor(sorted.length * 0.1)];
      const latest = values[values.length - 1];
      if (latest < p10) score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ─── Series Tagging ───────────────────────────────────────────────────────

  private tagAnomaliesInSeries(
    series: DailyWaterValue[],
    window: number,
  ): Array<DailyWaterValue & { isAnomaly: boolean; isSevere: boolean }> {
    const result: Array<DailyWaterValue & { isAnomaly: boolean; isSevere: boolean }> = [];

    for (let i = 0; i < series.length; i++) {
      const windowValues = series.slice(Math.max(0, i - window), i).map((d) => d.value);
      const ma =
        windowValues.length > 0
          ? windowValues.reduce((a, b) => a + b, 0) / windowValues.length
          : null;

      const v = series[i].value;
      const ratio = ma !== null && ma !== 0 ? v / ma : null;

      result.push({
        ...series[i],
        isAnomaly: ratio !== null && ratio >= IntelligenceService.ANOMALY_MODERATE_MULTIPLIER,
        isSevere: ratio !== null && ratio >= IntelligenceService.ANOMALY_SEVERE_MULTIPLIER,
      });
    }

    return result;
  }
}
