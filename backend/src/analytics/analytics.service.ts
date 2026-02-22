import { Injectable } from '@nestjs/common';

interface EndpointStat {
  count: number;
  totalResponseTimeMs: number;
  errorCount: number;
}

export interface AnalyticsSummary {
  totalRequests: number;
  totalErrors: number;
  averageResponseTimeMs: number;
  endpointBreakdown: Record<string, { count: number; avgResponseTimeMs: number; errorRate: number }>;
  topStations: Array<{ stationId: string; queryCount: number }>;
  uptimeSince: string;
}

/**
 * In-memory analytics store.
 * Designed for future PostgreSQL migration:
 *   - All writes go through recordRequest() and recordError()
 *   - Read model is computed on-demand from raw counters
 *   - Replace Map with DB writes for persistence
 */
@Injectable()
export class AnalyticsService {
  private readonly endpointStats = new Map<string, EndpointStat>();
  private readonly stationQueryCounts = new Map<string, number>();
  private totalRequests = 0;
  private totalErrors = 0;
  private totalResponseTimeMs = 0;
  private readonly uptimeSince = new Date().toISOString();

  recordRequest(url: string, responseTimeMs: number, stationId?: string): void {
    this.totalRequests++;
    this.totalResponseTimeMs += responseTimeMs;

    // Normalize endpoint path (strip query string)
    const endpoint = url.split('?')[0];
    const existing = this.endpointStats.get(endpoint) ?? {
      count: 0,
      totalResponseTimeMs: 0,
      errorCount: 0,
    };
    existing.count++;
    existing.totalResponseTimeMs += responseTimeMs;
    this.endpointStats.set(endpoint, existing);

    if (stationId) {
      const current = this.stationQueryCounts.get(stationId) ?? 0;
      this.stationQueryCounts.set(stationId, current + 1);
    }
  }

  recordError(url: string): void {
    this.totalErrors++;
    const endpoint = url.split('?')[0];
    const existing = this.endpointStats.get(endpoint) ?? {
      count: 0,
      totalResponseTimeMs: 0,
      errorCount: 0,
    };
    existing.errorCount++;
    this.endpointStats.set(endpoint, existing);
  }

  getSummary(): AnalyticsSummary {
    const endpointBreakdown: AnalyticsSummary['endpointBreakdown'] = {};
    for (const [endpoint, stat] of this.endpointStats.entries()) {
      endpointBreakdown[endpoint] = {
        count: stat.count,
        avgResponseTimeMs:
          stat.count > 0 ? Math.round(stat.totalResponseTimeMs / stat.count) : 0,
        errorRate:
          stat.count > 0 ? Math.round((stat.errorCount / stat.count) * 100) / 100 : 0,
      };
    }

    const topStations = Array.from(this.stationQueryCounts.entries())
      .map(([stationId, queryCount]) => ({ stationId, queryCount }))
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 10);

    return {
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      averageResponseTimeMs:
        this.totalRequests > 0
          ? Math.round(this.totalResponseTimeMs / this.totalRequests)
          : 0,
      endpointBreakdown,
      topStations,
      uptimeSince: this.uptimeSince,
    };
  }

  getPublicStats() {
    const summary = this.getSummary();
    return {
      totalRequests: summary.totalRequests,
      topStations: summary.topStations,
      uptimeSince: summary.uptimeSince,
      averageResponseTimeMs: summary.averageResponseTimeMs,
    };
  }
}
