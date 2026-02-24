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

  @Get('summary/llm')
  async getLlmSummary() {
    const data = this.legislationService.getAll();

    const billSummaries = data.bills
      .map((b) => `- ${b.shortTitle} (${b.scope.toUpperCase()}, status: ${b.status}): ${b.summary}`)
      .join('\n');

    const prompt = `You are a water policy analyst. The following is a list of current and
recent water/AI disclosure bills in the United States and internationally.
Write a concise 2-paragraph plain-English summary of the current legislative landscape
for water transparency in the AI and datacenter industry. Be factual and direct.
Note which direction the trend is moving — toward more or less regulation.
End with one sentence on what advocates should watch next.
Begin your response immediately. No preamble.

BILLS:
${billSummaries}`;

    return this.llmService.generateRawNarrative(prompt);
  }

  @Get()
  getAll(@Query() query: LegislationQueryDto) {
    return this.legislationService.getAll(query.aiOnly);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.legislationService.getById(id);
  }
}
