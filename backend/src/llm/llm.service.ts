import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  LlmProvider,
  LlmConfig,
  StationNarrativeInput,
  NarrativeResponse,
} from './llm.types';
import {
  STATION_ANALYST_SYSTEM_PROMPT,
  buildStationPrompt,
} from './prompts/station-analyst.prompt';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly config: LlmConfig;
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {
    const provider = this.configService.get<LlmProvider>(
      "LLM_PROVIDER",
      "local",
    );
    this.config = this.buildConfig(provider);
    this.initializeClient();
    this.logger.log(
      `LLM provider: ${this.config.provider} | model: ${this.config.model}`,
    );
  }

  private buildConfig(provider: LlmProvider): LlmConfig {
    switch (provider) {
      case "local":
        return {
          provider: "local",
          baseURL: this.configService.get(
            "LLM_LOCAL_BASE_URL",
            "http://localhost:1234/v1",
          ),
          model: this.configService.get(
            "LLM_LOCAL_MODEL",
            "mistral-7b-instruct-v0.3",
          ),
          apiKey: "lm-studio",
        };
      case "openai":
        return {
          provider: "openai",
          model: this.configService.get("OPENAI_MODEL", "gpt-4o-mini"),
          apiKey: this.configService.get("OPENAI_API_KEY", ""),
        };
      case "anthropic":
        return {
          provider: "anthropic",
          model: this.configService.get(
            "ANTHROPIC_MODEL",
            "claude-3-haiku-20240307",
          ),
          apiKey: this.configService.get("ANTHROPIC_API_KEY", ""),
        };
      default:
        this.logger.warn(
          `Unknown LLM_PROVIDER "${provider}", falling back to local`,
        );
        return {
          provider: "local",
          baseURL: "http://localhost:1234/v1",
          model: "mistral-7b-instruct-v0.3",
          apiKey: "lm-studio",
        };
    }
  }

  private initializeClient(): void {
    if (this.config.provider === "local" || this.config.provider === "openai") {
      this.openaiClient = new OpenAI({
        apiKey: this.config.apiKey ?? "lm-studio",
        baseURL: this.config.baseURL,
      });
    } else if (this.config.provider === "anthropic") {
      this.anthropicClient = new Anthropic({
        apiKey: this.config.apiKey ?? "",
      });
    }
  }

  getProviderInfo(): {
    provider: LlmProvider;
    model: string;
    available: boolean;
  } {
    return {
      provider: this.config.provider,
      model: this.config.model,
      available: this.openaiClient !== null || this.anthropicClient !== null,
    };
  }

  async generateStationNarrative(
    input: StationNarrativeInput,
  ): Promise<NarrativeResponse> {
    const prompt = buildStationPrompt(input);
    this.logger.log(
      `Generating narrative for station ${input.stationId} ` +
        `via ${this.config.provider}/${this.config.model}`,
    );

    try {
      let narrative: string;

      if (this.config.provider === "anthropic" && this.anthropicClient) {
        narrative = await this.callAnthropic(prompt);
      } else if (this.openaiClient) {
        narrative = await this.callOpenAiCompatible(prompt);
      } else {
        throw new Error("No LLM client initialized");
      }

      // Strip any residual preamble Mistral occasionally adds
      narrative = this.stripPreamble(narrative);

      return {
        narrative,
        provider: this.config.provider,
        model: this.config.model,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`LLM generation failed: ${message}`);

      if (
        message.includes("ECONNREFUSED") ||
        message.includes("fetch failed") ||
        message.includes("ENOTFOUND")
      ) {
        throw new HttpException(
          "LLM service unavailable. If using LM Studio, ensure the " +
            "local server is running on port 1234 with mistral-7b-instruct-v0.3 loaded.",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      if (message.includes("401") || message.includes("Incorrect API key")) {
        throw new HttpException(
          "LLM API key invalid or missing. Check your .env configuration.",
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        `LLM generation failed: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate a free-form narrative directly from a raw prompt string.
   * This bypasses the station prompt templating and sends the prompt as-is.
   */
  async generateRawNarrative(prompt: string): Promise<NarrativeResponse> {
    this.logger.log(
      `Generating raw narrative via ${this.config.provider}/${this.config.model}`,
    );

    try {
      let narrative: string;

      if (this.config.provider === 'anthropic' && this.anthropicClient) {
        // For Anthropic, we avoid a system prompt here and send the user prompt directly
        narrative = await this.callAnthropic(prompt);
      } else if (this.openaiClient) {
        // For OpenAI-compatible clients, send the prompt as a single user message
        const completion = await this.openaiClient.chat.completions.create({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 600,
        });
        narrative = completion.choices[0]?.message?.content?.trim() ?? 'No response generated.';
      } else {
        throw new Error('No LLM client initialized');
      }

      narrative = this.stripPreamble(narrative);

      return {
        narrative,
        provider: this.config.provider,
        model: this.config.model,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`LLM raw generation failed: ${message}`);
      throw new HttpException(`LLM generation failed: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async callOpenAiCompatible(userPrompt: string): Promise<string> {
    const completion = await this.openaiClient!.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "user",
          // Merge system prompt into user turn — Mistral v0.3 only supports
          // user and assistant roles, system role throws a jinja template error
          content: `${STATION_ANALYST_SYSTEM_PROMPT}\n\n${userPrompt}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });
    return (
      completion.choices[0]?.message?.content?.trim() ??
      "No response generated."
    );
  }

  private async callAnthropic(userPrompt: string): Promise<string> {
    const message = await this.anthropicClient!.messages.create({
      model: this.config.model,
      max_tokens: 600,
      system: STATION_ANALYST_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text.trim() : "No response generated.";
  }

  // Mistral v0.3 occasionally prepends conversational openers
  // even with explicit instructions not to — strip them defensively
  private stripPreamble(text: string): string {
    const preamblePatterns = [
      /^(sure|certainly|of course|great|absolutely|here is|here's|below is)[^.!?\n]*[.!?\n]\s*/i,
      /^(as a water intelligence analyst[^.!?\n]*[.!?\n]\s*)/i,
    ];
    let result = text.trim();
    for (const pattern of preamblePatterns) {
      result = result.replace(pattern, "").trim();
    }
    return result;
  }
}
