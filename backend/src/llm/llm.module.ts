import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmController } from './llm.controller';
import { WaterModule } from '../water/water.module';
import { AiImpactModule } from '../ai-impact/ai-impact.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';

@Module({
  imports: [WaterModule, AiImpactModule, IntelligenceModule],
  providers: [LlmService],
  controllers: [LlmController],
  exports: [LlmService],
})
export class LlmModule {} 
