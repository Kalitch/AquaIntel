import { Controller, Get, Param, Query } from '@nestjs/common';
import { HistoryService } from './history.service';

class HistoryQueryDto {
  days?: number;
}

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  // GET /history/platform/summary
  @Get('platform/summary')
  getPlatformSummary() {
    return this.historyService.getPlatformSummary();
  }

  // GET /history/:stationId
  // GET /history/:stationId?days=30
  @Get(':stationId')
  getStationHistory(
    @Param('stationId') stationId: string,
    @Query('days') days?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 90;
    return this.historyService.getStationHistory(
      stationId,
      isNaN(numDays) ? 90 : numDays,
    );
  }
}
