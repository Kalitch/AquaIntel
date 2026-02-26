import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
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

class NarrativePostDto {
  @IsString()
  @IsNotEmpty()
  stationId!: string;

  @IsOptional()
  @IsString()
  stationName?: string;

  // accept raw intelligence payload from frontend
  @IsOptional()
  @IsObject()
  intelligence?: any;
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
    // fallback for backward compatibility
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

  @Post('narrative')
  async postNarrative(@Body() body: NarrativePostDto) {
    const { stationId, stationName, intelligence } = body;

    // if full intelligence payload provided use it directly
    if (intelligence) {
      // Extract only what the prompt needs — never pass dailySeries to the LLM
      const enrichment = intelligence.percentiles
        ? {
            percentileInterpretation: intelligence.percentiles.interpretation ?? null,
            currentPercentile: intelligence.percentiles.currentPercentile ?? null,
            recordYears: intelligence.percentiles.recordYears ?? null,
            stationActive: intelligence.stationStatus?.active ?? true,
            stationStatusMessage: intelligence.stationStatus?.message ?? null,
            p10: intelligence.percentiles.p10 ?? null,
            p50: intelligence.percentiles.p50 ?? null,
            p90: intelligence.percentiles.p90 ?? null,
          }
        : null;

      return this.llmService.generateStationNarrative({
        stationId,
        stationName,
        latest: intelligence.water?.latest ?? null,
        analytics: intelligence.analytics,
        aiImpact: intelligence.aiImpact ?? null,
        droughtSeverity: intelligence.droughtStatus?.severity ?? null,
        enrichment,
        // intelligence field intentionally omitted — dailySeries stripped
      });
    }

    // otherwise fall back to GET logic
    return this.getNarrative({ stationId, stationName });
  }

  // GET /intelligence/llm-status
  @Get('llm-status')
  getLlmStatus() {
    return this.llmService.getProviderInfo();
  }
}
