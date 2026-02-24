import { Controller, Get, Query } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { LlmService } from './llm.service';
import { IntelligenceService } from '../intelligence/intelligence.service';
import { WaterService } from '../water/water.service';
import { AiImpactService } from '../ai-impact/ai-impact.service';

class NarrativeQueryDto {
  @IsString()
  @IsNotEmpty()
  stationId!: string;

  @IsOptional()
  @IsString()
  stationName?: string;
}

@Controller('intelligence')
export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    private readonly waterService: WaterService,
    private readonly aiImpactService: AiImpactService,
    private readonly intelligenceService: IntelligenceService,
  ) {}

  // GET /intelligence/narrative?stationId=XXXX&stationName=optional
  @Get('narrative')
  async getNarrative(@Query() query: NarrativeQueryDto) {
    const { stationId, stationName } = query;

    const waterData = await this.waterService.getWaterData(stationId);
    const latestValue = waterData.latest?.value ?? null;

    const aiImpact =
      latestValue !== null
        ? this.aiImpactService.compute(latestValue)
        : null;

    const analytics = this.intelligenceService.analyze(
      waterData.dailySeries,
      latestValue,
    );

    // Fetch drought status for context (enrichment only)
    const coords = await this.waterService.getStationCoords(stationId);
    const droughtStatus = coords
      ? await this.waterService.getDroughtStatus(coords.lat, coords.lon)
      : null;

    return this.llmService.generateStationNarrative({
      stationId,
      stationName,
      latest: waterData.latest,
      analytics: {
        movingAverage7: analytics.movingAverage7,
        movingAverage30: analytics.movingAverage30,
        volatilityIndex: analytics.volatilityIndex,
        anomaly: analytics.anomaly,
        sustainabilityScore: analytics.sustainabilityScore,
      },
      aiImpact,
      droughtSeverity: droughtStatus?.severity ?? null,
    });
  }

  // GET /intelligence/llm-status
  @Get('llm-status')
  getLlmStatus() {
    return this.llmService.getProviderInfo();
  }
}
