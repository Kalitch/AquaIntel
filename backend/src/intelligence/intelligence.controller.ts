import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { IntelligenceService } from './intelligence.service';
import { WaterService } from '../water/water.service';
import { AiImpactService } from '../ai-impact/ai-impact.service';
import { AnalyticsInterceptor } from '../common/interceptors/analytics.interceptor';
import { AnalyticsService } from '../analytics/analytics.service';

class IntelligenceQueryDto {
  @IsString()
  @IsNotEmpty()
  stationId!: string;
}

@Controller('intelligence')
@UseInterceptors(AnalyticsInterceptor)
export class IntelligenceController {
  constructor(
    private readonly intelligenceService: IntelligenceService,
    private readonly waterService: WaterService,
    private readonly aiImpactService: AiImpactService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get()
  async getIntelligence(@Query() query: IntelligenceQueryDto) {
    const { stationId } = query;

    // Fetch real water data from USGS
    const waterData = await this.waterService.getWaterData(stationId);

    // Compute AI sustainability impact
    const latestValue = waterData.latest?.value ?? null;
    const aiImpact = latestValue !== null
      ? this.aiImpactService.compute(latestValue)
      : null;

    // Run deterministic intelligence analysis
    const analyticsResult = this.intelligenceService.analyze(
      waterData.dailySeries,
      latestValue,
    );

    return {
      stationId,
      retrievedAt: new Date().toISOString(),
      water: {
        latest: waterData.latest,
        dailySeries: analyticsResult.seriesWithAnomalies,
      },
      aiImpact: aiImpact
        ? {
            waterVolumeLiters: aiImpact.waterVolumeLiters,
            kwhEquivalent: aiImpact.kwhEquivalent,
            inferenceEquivalent: aiImpact.inferenceEquivalent,
            gpuHoursEquivalent: aiImpact.gpuHoursEquivalent,
            explanation: aiImpact.explanation,
            modelConstants: aiImpact.modelConstants,
          }
        : null,
      analytics: {
        movingAverage7: analyticsResult.movingAverage7,
        movingAverage30: analyticsResult.movingAverage30,
        volatilityIndex: analyticsResult.volatilityIndex,
        anomaly: analyticsResult.anomaly,
        sustainabilityScore: analyticsResult.sustainabilityScore,
      },
    };
  }
}
