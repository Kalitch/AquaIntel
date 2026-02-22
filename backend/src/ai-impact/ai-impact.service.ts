import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiImpactResult {
  waterVolumeLiters: number;
  kwhEquivalent: number;
  inferenceEquivalent: number;
  gpuHoursEquivalent: number;
  modelConstants: {
    waterPerKwh: number;
    kwhPerInference: number;
    kwhPerGpuTrainingHour: number;
  };
  explanation: string;
}

/**
 * Deterministic AI sustainability modeling.
 *
 * All calculations are rule-based and fully explainable.
 * No external AI APIs are used.
 *
 * Constants (configurable via environment):
 *   WATER_PER_KWH          — liters of water consumed per kWh of electricity
 *                            (data center cooling average: ~1.8 L/kWh)
 *   KWH_PER_AI_INFERENCE   — kWh consumed per single AI inference request
 *                            (estimated average for large model: ~0.001 kWh)
 *   KWH_PER_GPU_TRAINING_HOUR — kWh consumed per GPU-hour of model training
 *                            (A100-class GPU: ~1.2 kWh/hr at 80% utilization)
 *
 * Conversion pipeline:
 *   ft³/s → liters → kWh equivalent → AI operations
 */
@Injectable()
export class AiImpactService {
  private readonly waterPerKwh: number;
  private readonly kwhPerInference: number;
  private readonly kwhPerGpuTrainingHour: number;

  // Cubic feet per second → liters per second conversion factor
  private static readonly CFS_TO_LPS = 28.3168;

  constructor(private readonly config: ConfigService) {
    this.waterPerKwh = this.config.get<number>('WATER_PER_KWH', 1.8);
    this.kwhPerInference = this.config.get<number>('KWH_PER_AI_INFERENCE', 0.001);
    this.kwhPerGpuTrainingHour = this.config.get<number>('KWH_PER_GPU_TRAINING_HOUR', 1.2);
  }

  /**
   * Compute AI sustainability equivalents for a given streamflow value.
   *
   * @param streamflowCfs  — streamflow in cubic feet per second (ft³/s)
   * @param windowSeconds  — time window to compute volume (default: 3600 = 1 hour)
   */
  compute(streamflowCfs: number, windowSeconds = 3600): AiImpactResult {
    // Step 1: Convert ft³/s to liters for the given time window
    const litersPerSecond = streamflowCfs * AiImpactService.CFS_TO_LPS;
    const waterVolumeLiters = litersPerSecond * windowSeconds;

    // Step 2: Convert water volume to kWh equivalent
    // (how many kWh of data center electricity this water could cool)
    const kwhEquivalent = waterVolumeLiters / this.waterPerKwh;

    // Step 3: Convert kWh to number of AI inference requests
    const inferenceEquivalent = Math.floor(kwhEquivalent / this.kwhPerInference);

    // Step 4: Convert kWh to GPU training hours
    const gpuHoursEquivalent = kwhEquivalent / this.kwhPerGpuTrainingHour;

    const explanation =
      `${streamflowCfs.toFixed(2)} ft³/s over 1 hour = ` +
      `${waterVolumeLiters.toLocaleString(undefined, { maximumFractionDigits: 0 })} liters. ` +
      `At ${this.waterPerKwh} L/kWh (data center cooling average), this equals ` +
      `${kwhEquivalent.toFixed(2)} kWh. ` +
      `That powers ~${inferenceEquivalent.toLocaleString()} AI inferences ` +
      `or ${gpuHoursEquivalent.toFixed(2)} GPU training hours.`;

    return {
      waterVolumeLiters: Math.round(waterVolumeLiters),
      kwhEquivalent: Math.round(kwhEquivalent * 100) / 100,
      inferenceEquivalent,
      gpuHoursEquivalent: Math.round(gpuHoursEquivalent * 100) / 100,
      modelConstants: {
        waterPerKwh: this.waterPerKwh,
        kwhPerInference: this.kwhPerInference,
        kwhPerGpuTrainingHour: this.kwhPerGpuTrainingHour,
      },
      explanation,
    };
  }
}
