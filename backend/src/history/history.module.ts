import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationSnapshot } from './entities/station-snapshot.entity';
import { AnomalyEvent } from './entities/anomaly-event.entity';
import { StationCache } from './entities/station-cache.entity';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StationSnapshot, AnomalyEvent, StationCache]),
  ],
  providers: [HistoryService],
  controllers: [HistoryController],
  exports: [HistoryService],
})
export class HistoryModule {}
