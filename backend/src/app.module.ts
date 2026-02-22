import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WaterModule } from './water/water.module';
import { AiImpactModule } from './ai-impact/ai-impact.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WaterModule,
    AiImpactModule,
    IntelligenceModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
