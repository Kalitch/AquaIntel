import { Module } from '@nestjs/common';
import { LegislationService } from './legislation.service';
import { LegislationController } from './legislation.controller';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  providers: [LegislationService],
  controllers: [LegislationController],
  exports: [LegislationService],
})
export class LegislationModule {}
