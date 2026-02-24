import { Controller, Get, Query, Param } from '@nestjs/common';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { LegislationService } from './legislation.service';
import { LlmService } from '../llm/llm.service';

class LegislationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  aiOnly?: boolean;
}

@Controller('legislation')
export class LegislationController {
  constructor(
    private readonly legislationService: LegislationService,
    private readonly llmService: LlmService,
  ) {}

  @Get()
  getAll(@Query() query: LegislationQueryDto) {
    return this.legislationService.getAll(query.aiOnly);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.legislationService.getById(id);
  }

  @Get('summary/llm')
  async getLlmSummary() {
    const data = this.legislationService.getAll();

    const billSummaries = data.bills
      .map(
        (b) =>
          `- ${b.shortTitle} (${String(b.scope).toUpperCase()}, status: ${b.status}): ${b.summary}`,
      )
      .join('\n');

    const prompt = `\nYou are a water policy analyst. Below is a list of current and recent water/AI disclosure\nBills in the United States and internationally. Write a concise 2-paragraph plain-English\nsummary of the current legislative landscape for water transparency in the AI/datacenter\nindustry. Be factual and direct. Note which direction the trend is moving — toward more\nor less regulation. End with one sentence on what advocates should watch next.\n\nBILLS:\n${billSummaries}\n\nWrite the summary now. No preamble.\n`.trim();

    return this.llmService.generateRawNarrative(prompt);
  }
}
