import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterModule } from './water/water.module';
import { AiImpactModule } from './ai-impact/ai-impact.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LlmModule } from './llm/llm.module';
import { NewsModule } from './news/news.module';
import { LegislationModule } from './legislation/legislation.module';
import { HealthController } from './health.controller';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    WaterModule,
    AiImpactModule,
    IntelligenceModule,
    AnalyticsModule,
    LlmModule,
    NewsModule,
    LegislationModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("DATABASE_URL") ?? "";
        // Disable SSL for local/docker connections (localhost OR docker service name)
        const isLocal =
          url.includes("localhost") ||
          url.includes("postgres:5432") ||
          url.includes("127.0.0.1");

        return {
          type: "postgres",
          url,
          entities: [__dirname + "/**/*.entity{.ts,.js}"],
          synchronize: config.get<boolean>("POSTGRES_SYNC", false),
          logging: false,
          ssl: isLocal ? false : { rejectUnauthorized: false },
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
    }),
    HistoryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
