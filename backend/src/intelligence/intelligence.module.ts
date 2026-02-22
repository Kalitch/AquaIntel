import { Module } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';
import { WaterModule } from '../water/water.module';
import { AiImpactModule } from '../ai-impact/ai-impact.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [WaterModule, AiImpactModule, AnalyticsModule],
  providers: [IntelligenceService],
  controllers: [IntelligenceController],
})
export class IntelligenceModule {}
