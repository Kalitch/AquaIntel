import { Module } from '@nestjs/common';
import { AiImpactService } from './ai-impact.service';

@Module({
  providers: [AiImpactService],
  exports: [AiImpactService],
})
export class AiImpactModule {}
