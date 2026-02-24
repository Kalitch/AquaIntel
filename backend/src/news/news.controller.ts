import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsIn } from 'class-validator';
import { NewsService } from './news.service';
import { NewsCategory } from './news.types';

class NewsQueryDto {
  @IsOptional()
  @IsIn(['water', 'legislation', 'ai', 'drought', 'general'])
  category?: NewsCategory;
}

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  getNews(@Query() query: NewsQueryDto) {
    return this.newsService.getNews(query.category);
  }
}
