import { Controller, Get, Query } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { WaterService } from './water.service';

class StationsQueryDto {
  @IsString()
  @Length(2, 2)
  state!: string;
}

@Controller('stations')
export class WaterController {
  constructor(private readonly waterService: WaterService) {}

  @Get()
  async getStations(@Query() query: StationsQueryDto) {
    return this.waterService.getStations(query.state);
  }
}
